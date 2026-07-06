# Pipeline Patterns Reference

Battle-tested patterns extracted from production Azure DevOps pipelines running in monorepo environments (Docker + Terraform + Helm + QA).

---

## Pattern 1: ACR Authentication (The Right Way)

**Problem:** Docker@2 task fails with MSI token exchange errors when using Workload Identity Federation service connections.

**Solution:** Use AzureCLI@2 with `az acr login`:

```yaml
- task: AzureCLI@2
  displayName: 'Build and push Docker image'
  inputs:
    azureSubscription: 'your-service-connection'
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: |
      set -e
      az acr login --name youracr
      docker build -t yourregistry.azurecr.io/image:tag -f Dockerfile .
      docker push yourregistry.azurecr.io/image:tag
```

**Why:** `az acr login` handles token refresh transparently. Docker@2 relies on a separate token exchange mechanism that breaks with newer auth models.

---

## Pattern 2: GitOps Image-Tag Pinning

**Problem:** After building a Docker image, how does the Kubernetes cluster know to deploy it?

**Solution:** Update a Helm `values-images.yaml` file with the new tag, commit, and push. ArgoCD or a Helm pipeline picks up the change.

```yaml
steps:
  # 1. Update the tag in values file
  - script: |
      set -e
      FILE='helmchart/chart/values-images.yaml'
      SECTION="api"
      TAG="$(Build.BuildNumber)"
      sed -E "/^${SECTION}:/{n; s|^(  tag:).*|\1 \"${TAG}\"|}" "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
    displayName: 'Update image tag'

  # 2. Commit and push (with safety checks)
  - script: |
      set -e
      if [ "$(Build.Reason)" = "PullRequest" ]; then exit 0; fi
      if git diff --quiet --exit-code; then exit 0; fi
      git config user.email "ci-bot@example.local"
      git config user.name "ci-bot"
      git add helmchart/chart/values-images.yaml
      BRANCH="$(Build.SourceBranchName)"
      git commit -m "ci(api): update api tag to $(Build.BuildNumber)"
      git pull --rebase origin "$BRANCH"
      git -c http.extraHeader="Authorization: Basic $(echo -n :$(System.AccessToken) | base64)" push origin HEAD:"$BRANCH"
    displayName: 'Commit and push'
    condition: succeeded()
```

**Key details:**
- Skip on PR builds (don't pollute PR branches)
- Skip if no actual changes (idempotent)
- `git pull --rebase` before push (handles concurrent pipeline pushes)
- System.AccessToken with base64 for authenticated push
- Requires `persistCredentials: true` on checkout

---

## Pattern 3: Terraform Plan/Apply with Environment Gate

**Problem:** Terraform changes should be reviewed before applying to production.

**Solution:** Two-stage pipeline with artifact passing and deployment environment approval.

```yaml
stages:
- stage: Plan
  jobs:
  - job: Plan
    steps:
    - script: terraform plan -out=tfplan -detailed-exitcode
    - task: PublishPipelineArtifact@1
      inputs:
        targetPath: path/to/tfplan
        artifact: tfplan

- stage: Apply
  dependsOn: Plan
  condition: succeeded()
  jobs:
  - deployment: Apply
    environment: production  # <-- This triggers approval gate
    strategy:
      runOnce:
        deploy:
          steps:
          - download: current
            artifact: tfplan
          - script: terraform apply "$(Pipeline.Workspace)/tfplan/tfplan"
```

**Key details:**
- `deployment` job type enables environment approval gates
- Plan artifact ensures apply uses the reviewed plan (no drift)
- `detailed-exitcode`: 0=no changes, 1=error, 2=changes pending
- AKS credential bootstrap (`az aks get-credentials`) needed if Terraform manages K8s resources

---

## Pattern 4: Health-Check Wait Loops

**Problem:** Docker Compose services take time to start. Tests fail if you run them immediately.

**Solution:** Polling loop with timeout:

```yaml
- task: Bash@3
  displayName: 'Wait for API ready'
  inputs:
    targetType: 'inline'
    script: |
      set -e
      for i in {1..30}; do
        if curl -fsS http://localhost:8080/health/ready >/dev/null; then
          echo "API ready"
          exit 0
        fi
        sleep 5
      done
      echo "API failed to become ready within 150s"
      exit 1
```

**Design:** 30 iterations × 5 seconds = 150s max wait. Adjust based on service startup time. Always `exit 1` on timeout — don't let tests run against a broken stack.

---

## Pattern 5: Scheduled Extended Tests

**Problem:** Full E2E suites are too slow for every PR but must run regularly.

**Solution:** Dual-profile pipeline with condition-based step execution:

```yaml
schedules:
  - cron: '0 14 * * 1-5'
    displayName: 'Weekday extended QA'
    branches:
      include:
        - main
    always: 'true'

steps:
- task: Bash@3
  displayName: 'Run quick (PR/CI)'
  condition: ne(variables['Build.Reason'], 'Schedule')
  inputs:
    targetType: 'inline'
    script: npm run test:quick

- task: Bash@3
  displayName: 'Run extended (scheduled)'
  condition: eq(variables['Build.Reason'], 'Schedule')
  inputs:
    targetType: 'inline'
    script: npm run test:extended
```

---

## Pattern 6: Failure Diagnostics

**Problem:** When QA pipelines fail, you need Docker logs to debug.

**Solution:** Always capture and publish on failure:

```yaml
- task: Bash@3
  displayName: 'Dump docker logs on failure'
  condition: failed()
  inputs:
    targetType: 'inline'
    script: docker compose logs --no-color > docker-logs.txt

- task: PublishBuildArtifacts@1
  displayName: 'Publish docker logs'
  condition: failed()
  inputs:
    PathtoPublish: 'docker-logs.txt'
    ArtifactName: 'docker-logs'
```

---

## Pattern 7: Multi-Stage Validation Pipeline

**Problem:** AI agent deployments need validation before going live.

**Solution:** Validate → Deploy → Verify stages:

```yaml
stages:
  - stage: Validate
    jobs:
      - job: DryRun
        steps:
          - script: python deploy.py --dry-run

  - stage: Deploy
    dependsOn: Validate
    condition: succeeded()
    jobs:
      - job: Deploy
        steps:
          - script: python deploy.py

  - stage: PostDeploy
    dependsOn: Deploy
    condition: succeeded()
    jobs:
      - job: Verify
        steps:
          - script: python deploy.py --verify-only
```

---

## Pattern 8: Shared Templates (DRY)

**Problem:** Multiple pipelines repeat the same steps (image-tag update, git commit).

**Solution:** Extract to a template file, reference with `- template:`:

```yaml
# In pipeline:
- template: ../helmchart/templates/update-image-values.yml
  parameters:
    component: 'api'
    tag: '$(Build.BuildNumber)'

# Template file:
parameters:
  - name: component
    type: string
  - name: tag
    type: string
  - name: digest
    type: string
    default: ''

steps:
  - script: |
      # ... reusable logic
    displayName: 'Update image tag'
```

**Convention:** Templates live in a shared location (e.g., `helmchart/templates/`). Every pipeline references the same template — one fix, all pipelines benefit.

---

## Pattern 9: Build Context Management

**Problem:** Some Dockerfiles need files outside their directory (shared libraries, core packages).

**Solution:** Set `buildContext` to repo root and use `-f` to specify Dockerfile path:

```yaml
variables:
  dockerfilePath: 'API/Dockerfile'
  buildContext: '.'  # Root — because Dockerfile copies core/ too

# vs.

variables:
  dockerfilePath: 'Website/Dockerfile'
  buildContext: 'Website'  # Self-contained — no external deps
```

**Rule of thumb:**
- Service needs sibling folders? → context = `.` (root)
- Service is self-contained? → context = service path (faster build, smaller context)

---

## Pattern 10: Build Number Format

**Standard:** `$(Date:yyyyMMdd).$(Rev:r)` — produces `20260706.1`, `20260706.2`, etc.

**Properties:**
- Sortable by date
- Unique within a day (`.Rev:r` auto-increments)
- Safe as Docker tag (no special characters)
- Human-readable (you know when it was built)
- Deterministic (same code on same day = predictable naming)

---

## Anti-Patterns (What NOT To Do)

| Anti-Pattern | Why It's Bad | Do This Instead |
|---|---|---|
| Docker@2 with service connections | MSI token exchange failures | AzureCLI@2 + az acr login |
| `git push` without `pull --rebase` | Non-fast-forward errors from concurrent pipelines | Always rebase first |
| No `set -e` in scripts | Silent failures cascade | Always `set -e` |
| `trigger: '*'` (all paths) | Builds on README edits | Path filters with `exclude: '**/*.md'` |
| Hardcoded image tags | Can't trace what's deployed | Use `$(Build.BuildNumber)` |
| Apply without plan artifact | Risk of drift between plan and apply | Publish + download plan |
| Tests without health-check wait | Flaky failures on slow starts | Polling loop with timeout |
| Single QA profile | Either too slow for PRs or too shallow for confidence | Quick (PR) + Extended (scheduled) |
| No failure diagnostics | Blind debugging | Always publish logs on failure |
| Terraform apply without environment gate | Unreviewed changes hit production | Use deployment jobs with environment approval |
