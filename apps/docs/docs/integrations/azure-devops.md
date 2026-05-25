---
sidebar_position: 2
title: Azure DevOps
---

# Azure DevOps

RemediAI integrates with two Azure DevOps services: **Repos** (for code context) and **Boards** (for Bug creation). The PR Agent also writes to Repos in Phase 2.

---

## Required permissions

| Agent | Service | Permission | Scope |
|-------|---------|-----------|-------|
| Code Context Agent | Repos | Read | Target repository only |
| Bug Creation Agent | Boards | Work Items: Read & Write | Target project only |
| PR Agent (Phase 2) | Repos | Read & Write | Target repository only |

:::danger Least privilege
The ADO PAT must **not** have admin, pipeline, or project-level permissions. Scope it to exactly the above.
:::

---

## Setting up a Personal Access Token (PAT)

1. In Azure DevOps, go to **User Settings → Personal Access Tokens**.
2. Click **+ New Token**.
3. Set the following scopes:
   - **Work Items:** Read & Write
   - **Code:** Read (add Write for Phase 2 PR creation)
4. Set an expiry of 90 days and configure rotation in Key Vault.
5. Copy the token and store it in Azure Key Vault:

```bash
az keyvault secret set \
  --vault-name <vault-name> \
  --name ado-pat \
  --value "<your-pat>"
```

---

## Environment variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_DEVOPS_ORG_URL` | Organisation base URL | `https://dev.azure.com/akeesari` |
| `AZURE_DEVOPS_PROJECT` | Project name | `MyApp` |
| `AZURE_DEVOPS_PAT` | PAT (loaded from Key Vault at runtime) | — |
| `AZURE_DEVOPS_REPO_NAME` | Target repository for code context + PR | `MyApp` |
| `AZURE_DEVOPS_DEFAULT_BRANCH` | Branch for PR creation (default: `main`) | `main` |
| `AZURE_DEVOPS_REVIEWER_GROUP` | ADO group added as PR reviewers | `[MyApp]\Developers` |
| `AZURE_DEVOPS_CODE_ROOT` | Namespace prefix to filter stack frames | `MyApp.` |

---

## Bug work item format

When the Bug Creation Agent runs, it creates an Azure DevOps Bug with the following fields:

| ADO Field | Value |
|-----------|-------|
| Title | `[RemediAI] {exception_type}: {exception_message[:80]}` |
| Description | Root cause summary + top recommendation |
| Repro Steps | Scrubbed stack trace (truncated to 4000 chars) |
| System Info | Service name, environment, correlation ID, incident ID |
| Tags | `remedia-ai`, `automated` |
| State | `New` |
| Priority | Mapped from incident priority (critical→1, high→2, medium→3, low→4) |

---

## Code context: how file fetching works

The Code Context Agent calls the Azure DevOps Repos Items API:

```http
GET https://dev.azure.com/{org}/{project}/_apis/git/repositories/{repo}/items
  ?path=/src/Services/UserService.cs
  &versionDescriptor.versionType=Branch
  &versionDescriptor.version=main
  &includeContent=true
  &api-version=7.1
```

Responses are cached in Redis with a 5-minute TTL to reduce API calls during burst processing.

---

## PR creation: how it works

The PR Agent uses the Azure DevOps Refs and Pull Requests APIs:

```
1. GET default branch SHA
   GET /_apis/git/repositories/{repo}/refs?filter=heads/main

2. Create branch
   POST /_apis/git/repositories/{repo}/refs
   Body: [{ name: "refs/heads/remedia/...", newObjectId: <sha>, oldObjectId: "0000..." }]

3. Push commit with patch
   POST /_apis/git/repositories/{repo}/pushes
   Body: { refUpdates, commits: [{ comment, changes: [{ changeType, item, newContent }] }] }

4. Create draft PR
   POST /_apis/git/repositories/{repo}/pullrequests
   Body: { title, description, sourceRefName, targetRefName, isDraft: true, reviewers }
```

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `TF401019: The Git repository with name ... was not found` | Verify `AZURE_DEVOPS_REPO_NAME` matches exactly |
| `VS403503: The access token is not valid` | Regenerate the PAT and update the Key Vault secret |
| Bug created with wrong priority | Check the priority mapping in `packages/integrations/ado_boards.py` |
| Code snippets empty | Ensure `AZURE_DEVOPS_CODE_ROOT` matches your application namespace prefix |
