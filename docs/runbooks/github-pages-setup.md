# GitHub Pages Setup Runbook

## Purpose

Enable GitHub Pages for a repository that uses the GitHub Actions deployment
model (Docusaurus + `actions/deploy-pages`). This runbook covers the one-time
setup, verification, custom domain configuration, and troubleshooting.

It applies to any project using the pattern established in
`docs/specs/phase-30-documentation-site.md` and `.github/workflows/docs.yml`.

---

## Scope

- Repositories hosted on GitHub (public or private with Pages enabled)
- Docusaurus v3 documentation sites built with `npm run build`
- Deployment via `actions/deploy-pages@v4` (not the legacy branch-based method)

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Admin or maintainer access to the repository | Required to enable Pages |
| `gh` CLI installed and authenticated | `brew install gh` then `gh auth login` |
| `docs.yml` workflow committed to `main` | Must be on the default branch |
| `apps/docs/static/.nojekyll` present | Prevents Jekyll from breaking the build |

---

## Method A — Automated (gh CLI) — Recommended

Run the setup script included in this repository:

```bash
chmod +x scripts/setup_github_pages.sh
./scripts/setup_github_pages.sh
```

The script:
1. Checks that `gh` is installed and authenticated.
2. Checks the current Pages status.
3. Calls `POST /repos/{owner}/{repo}/pages` with `build_type: workflow`.
4. Verifies the configuration after a 3-second delay.
5. Prints next steps with exact commands.

Expected output (first-time run):

```
  RemediAI — GitHub Pages Setup
  Repository : https://github.com/akeesari/remediai
  Target URL : https://akeesari.github.io/remediai/

Step 1/4  Checking current GitHub Pages status...
Step 2/4  Enabling GitHub Pages (source: GitHub Actions)...
          GitHub Pages enabled successfully.
Step 3/4  Verifying Pages configuration...
          Build type confirmed: GitHub Actions (workflow)
Step 4/4  Setup complete.

  Next steps
  1. Push your changes to main: git push origin main
  2. Watch the workflow run: gh run watch
  3. Open the live site: https://akeesari.github.io/remediai/
```

---

## Method B — Browser UI

Use this method if you do not have `gh` CLI or if the script fails.

1. Open `https://github.com/<org>/<repo>/settings/pages`
2. Under **Build and deployment**, find the **Source** dropdown.
3. Select **GitHub Actions** (not "Deploy from a branch").
4. Click **Save**.

You should see a confirmation: _"GitHub Pages source saved."_

No branch selection is needed — the `actions/deploy-pages` action manages
the deployment artifact automatically.

---

## Method C — GitHub API (curl)

For CI pipelines or environments without `gh` CLI:

```bash
# Requires a Personal Access Token with repo scope
curl -s -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/<GH_ORG>/<REPO_NAME>/pages \
  -d '{"build_type":"workflow"}' \
  | jq '{status: .status, url: .html_url}'
```

Expected response:

```json
{
  "status": "enabled",
  "url": "https://akeesari.github.io/remediai/"
}
```

HTTP 409 means Pages was already enabled — that is not an error.

---

## Triggering the first deployment

After Pages is enabled, trigger the deployment:

```bash
# Push to main (deploys automatically if apps/docs/** changed)
git push origin main

# Or trigger manually without a code change
gh workflow run docs.yml

# Watch the run live
gh run watch

# Open the site when complete
gh browse --repo akeesari/remediai
```

The first deployment takes approximately 2 minutes. Subsequent deployments
(incremental changes) typically complete in under 90 seconds.

---

## Verification

After the first successful deploy, verify the following:

### 1. Site is live

```bash
curl -sI https://akeesari.github.io/remediai/ | grep "HTTP/"
# Expected: HTTP/2 200
```

### 2. Sitemap is accessible

```bash
curl -s https://akeesari.github.io/remediai/sitemap.xml | head -5
# Expected: <?xml version="1.0" encoding="UTF-8"?>
```

### 3. OG meta tags are present

```bash
curl -s https://akeesari.github.io/remediai/ \
  | grep -E 'og:(title|description|image)|twitter:card'
```

Expected output:

```html
<meta property="og:title" content="RemediAI"/>
<meta property="og:description" content="RemediAI is an AI-powered exception..."/>
<meta property="og:image" content="https://akeesari.github.io/remediai/img/social-card.svg"/>
<meta name="twitter:card" content="summary_large_image"/>
```

### 4. No Jekyll breakage

```bash
curl -sI https://akeesari.github.io/remediai/assets/js/main.js | grep "HTTP/"
# Expected: HTTP/2 200  (not 404)
```

If you get a 404 on `_docusaurus/` or `assets/js/`, the `.nojekyll` file is
missing from the build output. Confirm `apps/docs/static/.nojekyll` exists and
is committed.

### 5. Search works

Open the site, click the search icon (or press `/`), type `triage`. Results
should appear from the local search index.

---

## Custom domain setup (optional)

To serve the docs from `docs.example.com` instead of `akeesari.github.io/remediai/`:

### Step 1 — Add the CNAME file

```bash
echo "docs.example.com" > apps/docs/static/CNAME
git add apps/docs/static/CNAME
git commit -m "docs: add custom domain CNAME"
git push origin main
```

Docusaurus copies the `CNAME` file to the build root automatically.

### Step 2 — Update docusaurus.config.ts

```ts
const config: Config = {
  url: 'https://docs.example.com',
  baseUrl: '/',           // root — no project path prefix
  ...
};
```

### Step 3 — Configure DNS

Add a `CNAME` record at your DNS provider:

| Type | Name | Value |
|------|------|-------|
| CNAME | `docs` | `akeesari.github.io` |

DNS propagation typically takes 5–30 minutes.

### Step 4 — Enable HTTPS

In `Settings → Pages`, GitHub will automatically provision an SSL certificate
via Let's Encrypt once the CNAME DNS resolves. This usually takes 10–30 minutes.
Check the box **Enforce HTTPS** once the certificate is provisioned.

---

## Troubleshooting

### Workflow fails with `Error: No artifact found for the associated workflow run`

The `upload-pages-artifact` step did not run or failed silently.

- Check the **build** job logs — look for `npm run build` errors.
- Confirm `path: apps/docs/build` in the upload step matches where Docusaurus
  outputs the static site (default is `build/` relative to the Docusaurus root).

---

### Site loads but CSS/JavaScript is broken (blank page)

Cause: Jekyll is processing the build output and stripping `_`-prefixed assets.

Fix: Confirm `apps/docs/static/.nojekyll` is committed and present.

```bash
ls -la apps/docs/static/.nojekyll
# Should show the file (even though it is empty)
```

After adding it, push to main and the next deployment will fix the broken assets.

---

### 404 on all pages except the landing page

Cause: `trailingSlash` is not set correctly in `docusaurus.config.ts`.

Fix: Set `trailingSlash: false` in the config:

```ts
const config: Config = {
  trailingSlash: false,
  ...
};
```

---

### `Error: Pages not enabled` when running the script

Two possible causes:

1. **Insufficient permissions** — your GitHub account is not an admin of the
   repository. Check: `gh api repos/akeesari/remediai --jq '.permissions'`
2. **Pages not available** — private repositories require GitHub Pro, Team,
   or Enterprise to use Pages (public repos are always free).

Fallback: Use Method B (browser UI) to enable Pages manually.

---

### `Error: Build type is not 'workflow'`

The repo was previously configured to deploy from a branch (legacy method).

Fix via browser UI: Go to `Settings → Pages → Source → GitHub Actions → Save`.

---

### Deployment succeeds but URL shows "404 There isn't a GitHub Pages site here"

Cause: GitHub Pages infrastructure sometimes takes 5–10 minutes to propagate
after the first-ever deployment.

Fix: Wait 5–10 minutes and refresh. If it persists after 30 minutes, check the
Pages settings again to confirm the deployment was not rolled back.

---

### Search returns no results

Cause: The search index is built at `npm run build` time. If the build ran
before content was present, the index is empty.

Fix: Trigger a new deployment with content present:

```bash
gh workflow run docs.yml
```

---

## Reuse for a new project

To apply this runbook to a new project:

1. Copy `scripts/setup_github_pages.sh` to the new project.
2. Update `GH_ORG`, `REPO_NAME`, and `LIVE_URL` at the top of the script.
3. Copy `apps/docs/static/.nojekyll` — it is required for every Docusaurus + GitHub Pages project.
4. Ensure `baseUrl` in `docusaurus.config.ts` is set to `/<REPO_NAME>/` (with trailing slash).
5. Ensure `url` is set to `https://<GH_ORG>.github.io`.
6. Run `./scripts/setup_github_pages.sh` on the new repo.

See `docs/specs/phase-30-documentation-site.md` → **Reuse Guide for Future Projects** for the full template variable substitution table.

---

## Related

- Spec: `docs/specs/phase-30-documentation-site.md`
- Workflow: `.github/workflows/docs.yml`
- Setup script: `scripts/setup_github_pages.sh`
- Branch protection runbook: `docs/runbooks/github-branch-protection.md`
