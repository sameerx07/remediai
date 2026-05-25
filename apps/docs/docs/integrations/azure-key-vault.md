---
sidebar_position: 5
title: Azure Key Vault
---

# Azure Key Vault

Azure Key Vault is the **only** source of secrets for RemediAI. No secrets are stored in environment files, Helm values, Dockerfiles, or source code.

---

## How RemediAI uses Key Vault

In production (AKS), secrets are mounted into pods using the **Azure Key Vault Provider for Secrets Store CSI Driver**. The pod never reads the secret value from an environment variable — the CSI driver mounts the secret as a file, and the application reads from the file path.

In local development, secrets are loaded via the Azure Key Vault SDK using the developer's `az login` credentials (DefaultAzureCredential).

---

## Required secrets

| Secret name | Description |
|-------------|-------------|
| `db-password` | PostgreSQL connection password |
| `redis-password` | Redis access key (if using Azure Cache) |
| `ado-pat` | Azure DevOps Personal Access Token |
| `api-key` | RemediAI API key for external consumers (optional) |

All other credentials (Application Insights, OpenAI, AI Search) use Managed Identity — no secrets required.

---

## Setting up Key Vault

### 1. Create the Key Vault

```bash
az keyvault create \
  --name <vault-name> \
  --resource-group <rg> \
  --location <region> \
  --enable-rbac-authorization true
```

### 2. Store secrets

```bash
az keyvault secret set --vault-name <vault-name> --name db-password --value "<password>"
az keyvault secret set --vault-name <vault-name> --name ado-pat --value "<pat>"
```

### 3. Assign access to Managed Identities

```bash
# Each service gets read-only access to the secrets it needs
az role assignment create \
  --assignee <worker-managed-identity-id> \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault-name>

az role assignment create \
  --assignee <api-managed-identity-id> \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault-name>
```

---

## CSI driver setup (AKS production)

Install the Secrets Store CSI Driver and the Azure Key Vault provider:

```bash
helm repo add csi-secrets-store-provider-azure \
  https://azure.github.io/secrets-store-csi-driver-provider-azure/charts
helm install csi-secrets-store-provider-azure \
  csi-secrets-store-provider-azure/csi-secrets-store-provider-azure \
  --namespace kube-system
```

Create a `SecretProviderClass` for each service:

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: remediai-worker-secrets
  namespace: remediai
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "true"
    userAssignedIdentityID: "<worker-managed-identity-client-id>"
    keyvaultName: "<vault-name>"
    objects: |
      array:
        - |
          objectName: db-password
          objectType: secret
        - |
          objectName: ado-pat
          objectType: secret
    tenantId: "<tenant-id>"
  secretObjects:
    - secretName: remediai-worker-secrets
      type: Opaque
      data:
        - key: DB_PASSWORD
          objectName: db-password
        - key: ADO_PAT
          objectName: ado-pat
```

---

## Environment variable

| Variable | Description |
|----------|-------------|
| `AZURE_KEYVAULT_URL` | Key Vault endpoint (used by local dev) | `https://<vault>.vault.azure.net` |

---

## Secret rotation

- Configure rotation policies in Key Vault for `db-password` and `ado-pat` (90-day rotation recommended).
- Pods automatically pick up new secret values when the CSI driver refreshes (default: every 2 minutes).
- No pod restart required for secret rotation.

---

## Local development

In local development, the application reads secrets from Key Vault directly using `DefaultAzureCredential`:

```python
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

credential = DefaultAzureCredential()
client = SecretClient(vault_url=settings.AZURE_KEYVAULT_URL, credential=credential)
secret = client.get_secret("ado-pat")
```

Run `az login` before starting the application locally.

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `SecretNotFound` | Verify the secret name matches exactly (case-sensitive) |
| `403 Forbidden` | Verify the Managed Identity has `Key Vault Secrets User` role on the vault |
| CSI driver not mounting | Check `kubectl describe pod` for CSI driver events |
| Local dev `AuthorizationError` | Run `az login` and ensure your account has `Key Vault Secrets User` |
