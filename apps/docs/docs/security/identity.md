---
sidebar_position: 3
title: Identity & Access
---

# Identity & Access

RemediAI uses **Azure Managed Identity** with **Workload Identity Federation** on AKS. No client secrets or certificates are stored in the cluster.

---

## Managed Identity per service

Each service has its own Managed Identity with scoped role assignments:

| Service | Identity role | Resource |
|---------|--------------|---------|
| Log Ingestion | Monitoring Reader | Application Insights |
| Agent Worker | Azure Service Bus Data Receiver | `incident-events` topic |
| Agent Worker | Cognitive Services OpenAI User | Azure OpenAI resource |
| Agent Worker | Search Index Data Reader | Azure AI Search |
| Agent Worker | Storage Blob Data Contributor | Evidence Blob container only |
| Agent Worker | Key Vault Secrets User | Key Vault |
| Backend API | Key Vault Secrets User | Key Vault |
| Backend API | (reads PostgreSQL via password from Key Vault) | — |
| PR Agent | Code read + write (via ADO PAT from Key Vault) | Single ADO repository |

---

## Workload Identity on AKS

Workload Identity Federation allows Kubernetes service accounts to acquire Azure AD tokens without any stored credentials:

```
Pod → Kubernetes service account token
    → Azure AD OIDC token exchange
    → Azure AD access token
    → Target Azure service (e.g. Service Bus)
```

Setup (applied via Terraform in Phase 23):

```bash
# Enable OIDC issuer on AKS
az aks update \
  --resource-group <rg> \
  --name <cluster> \
  --enable-oidc-issuer \
  --enable-workload-identity

# Create federated credential
az identity federated-credential create \
  --name worker-federated \
  --identity-name remediai-worker \
  --resource-group <rg> \
  --issuer $(az aks show -g <rg> -n <cluster> --query oidcIssuerProfile.issuerUrl -o tsv) \
  --subject "system:serviceaccount:remediai:worker" \
  --audience api://AzureADTokenExchange
```

---

## Azure DevOps authentication

Azure DevOps does not support Managed Identity directly. RemediAI uses a scoped Personal Access Token (PAT) stored in Key Vault:

| PAT scope | Phase | Permission |
|-----------|-------|-----------|
| Work Items: Read & Write | MVP | Bug creation |
| Code: Read | MVP | Code context |
| Code: Read & Write | Phase 2 | PR creation |

The PAT must **not** have:
- Admin permissions
- Pipeline permissions
- Project-level settings access

Rotate the PAT every 90 days using a Key Vault rotation policy.

---

## Network identity

In addition to Azure AD identity, all inter-service communication is protected by:

- **Kubernetes Network Policies** — deny-all default, allow-list per service
- **Private Endpoints** — Azure Service Bus, Key Vault, PostgreSQL, AI Search, Storage
- **Private AKS cluster** — no public API server endpoint
- **Azure Application Gateway + WAF** — WAF v2 with OWASP 3.2 ruleset on public ingress

---

## Local development identity

In local development, `DefaultAzureCredential` is used. It attempts (in order):
1. Environment variables (`AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`)
2. Workload Identity
3. Azure CLI credentials (`az login`)
4. Managed Identity

For local development, run `az login` and ensure your account has the roles listed in the table above on your non-production Azure resources.

---

## Checking your identity assignments

```bash
# List role assignments for a Managed Identity
az role assignment list \
  --assignee <managed-identity-principal-id> \
  --all \
  --output table
```
