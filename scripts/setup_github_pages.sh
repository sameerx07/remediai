#!/usr/bin/env bash
# setup_github_pages.sh
#
# One-time script to enable GitHub Pages (source: GitHub Actions) for this repo.
# Run once, before the first push to main that triggers docs.yml.
#
# Prerequisites:
#   - gh CLI installed (https://cli.github.com/)
#   - gh auth login completed with an account that has admin access to the repo
#   - The repo must exist on GitHub (local clone is not enough)
#
# Usage:
#   chmod +x scripts/setup_github_pages.sh
#   ./scripts/setup_github_pages.sh
#
# To reuse for another project, replace GH_ORG and REPO_NAME below.

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
GH_ORG="akeesari"
REPO_NAME="remediai"
LIVE_URL="https://${GH_ORG}.github.io/${REPO_NAME}/"
# ─────────────────────────────────────────────────────────────────────────────

REPO="${GH_ORG}/${REPO_NAME}"

echo ""
echo "  RemediAI — GitHub Pages Setup"
echo "  Repository : https://github.com/${REPO}"
echo "  Target URL : ${LIVE_URL}"
echo ""

# ── 1. Check gh CLI is available ─────────────────────────────────────────────
if ! command -v gh &>/dev/null; then
  echo "ERROR: gh CLI not found."
  echo "       Install it from https://cli.github.com/ and run 'gh auth login'."
  exit 1
fi

# ── 2. Check authentication ───────────────────────────────────────────────────
if ! gh auth status &>/dev/null; then
  echo "ERROR: gh CLI is not authenticated."
  echo "       Run: gh auth login"
  exit 1
fi

echo "Step 1/4  Checking current GitHub Pages status..."
STATUS=$(gh api "repos/${REPO}/pages" --jq '.status // "not-enabled"' 2>/dev/null || echo "not-enabled")

if [ "$STATUS" = "enabled" ]; then
  SOURCE=$(gh api "repos/${REPO}/pages" --jq '.build_type // "unknown"' 2>/dev/null || echo "unknown")
  echo "          Pages is already enabled (source: ${SOURCE})."
  if [ "$SOURCE" != "workflow" ]; then
    echo ""
    echo "WARNING: Pages source is '${SOURCE}' but should be 'workflow' (GitHub Actions)."
    echo "         Update it in Settings → Pages → Source → GitHub Actions."
    echo "         Or re-run this script — it will attempt to update it."
  else
    echo "          Source is already set to GitHub Actions. Nothing to do."
    echo ""
    echo "Step 4/4  Verification"
    echo "          Pages URL : ${LIVE_URL}"
    echo "          Push to main to trigger the docs.yml workflow."
    echo ""
    exit 0
  fi
fi

echo ""
echo "Step 2/4  Enabling GitHub Pages (source: GitHub Actions)..."
HTTP_STATUS=$(gh api "repos/${REPO}/pages" \
  --method POST \
  --field build_type=workflow \
  --silent \
  --include 2>&1 | grep "^HTTP" | awk '{print $2}' || echo "")

# A 201 means created; 409 means already exists (also fine)
if [[ "$HTTP_STATUS" == "201" || "$HTTP_STATUS" == "409" || -z "$HTTP_STATUS" ]]; then
  echo "          GitHub Pages enabled successfully."
else
  echo ""
  echo "ERROR: Unexpected HTTP status: ${HTTP_STATUS}"
  echo "       Check that your GitHub account has admin access to ${REPO}."
  echo "       You can also enable it manually:"
  echo "         https://github.com/${REPO}/settings/pages"
  echo "       Set Source → GitHub Actions, then save."
  exit 1
fi

echo ""
echo "Step 3/4  Verifying Pages configuration..."
sleep 3   # give the API a moment to propagate

BUILD_TYPE=$(gh api "repos/${REPO}/pages" --jq '.build_type // "unknown"' 2>/dev/null || echo "unknown")
if [ "$BUILD_TYPE" != "workflow" ]; then
  echo "WARNING: Pages build type shows '${BUILD_TYPE}' — expected 'workflow'."
  echo "         This may resolve after a minute. Check: gh api repos/${REPO}/pages"
else
  echo "          Build type confirmed: GitHub Actions (workflow)"
fi

echo ""
echo "Step 4/4  Setup complete."
echo ""
echo "  ┌──────────────────────────────────────────────────────────────────┐"
echo "  │  Next steps                                                      │"
echo "  │                                                                  │"
echo "  │  1. Push your changes to main:                                   │"
echo "  │       git push origin main                                       │"
echo "  │                                                                  │"
echo "  │  2. Watch the workflow run:                                      │"
echo "  │       gh run watch                                               │"
echo "  │                                                                  │"
echo "  │  3. Open the live site (available after first deploy):           │"
echo "  │       ${LIVE_URL}"
echo "  │                                                                  │"
echo "  │  4. (Optional) Add a custom domain:                              │"
echo "  │       echo 'docs.example.com' > apps/docs/static/CNAME          │"
echo "  │       Configure DNS: CNAME docs.example.com →                   │"
echo "  │         ${GH_ORG}.github.io                             │"
echo "  └──────────────────────────────────────────────────────────────────┘"
echo ""
