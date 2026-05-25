---
sidebar_position: 4
title: Azure AI Search
---

# Azure AI Search

RemediAI uses Azure AI Search as its RAG (Retrieval-Augmented Generation) index. The index stores runbooks, documentation, prior fix records, and source code chunks. The RAG Retrieval Agent queries this index using hybrid (keyword + vector) search.

---

## Index overview

| Index name | `remediai-rag` |
|------------|---------------|
| Search type | Hybrid (keyword + semantic / vector) |
| Tier | Basic or above (Standard recommended for production) |
| Content | Runbooks, docs, prior fixes, source code |
| Vector dimensions | 1536 (text-embedding-ada-002 or text-embedding-3-small) |

---

## Required role assignment

```bash
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Search Index Data Reader" \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Search/searchServices/<search-name>
```

The indexer pipeline (`scripts/populate_search_index.py`) also needs **Search Index Data Contributor** for the initial population.

---

## Environment variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_SEARCH_ENDPOINT` | Search service endpoint | `https://myremedia.search.windows.net` |
| `AZURE_SEARCH_INDEX` | Index name (default: `remediai-rag`) | `remediai-rag` |
| `RAG_TOP_K` | Number of results to request (default: `10`) | `10` |
| `RAG_MIN_SCORE` | Minimum relevance score (default: `0.6`) | `0.6` |
| `RAG_MAX_RESULTS` | Max results returned to Fix Planner (default: `5`) | `5` |

---

## Index schema

```json
{
  "name": "remediai-rag",
  "fields": [
    { "name": "id", "type": "Edm.String", "key": true },
    { "name": "source", "type": "Edm.String", "filterable": true },
    { "name": "title", "type": "Edm.String", "searchable": true },
    { "name": "content", "type": "Edm.String", "searchable": true },
    { "name": "url", "type": "Edm.String" },
    { "name": "tags", "type": "Collection(Edm.String)", "filterable": true },
    { "name": "content_vector", "type": "Collection(Edm.Single)", "dimensions": 1536, "vectorSearchConfiguration": "default" }
  ],
  "vectorSearch": {
    "algorithmConfigurations": [
      { "name": "default", "kind": "hnsw", "parameters": { "m": 4, "efConstruction": 400, "efSearch": 500 } }
    ]
  },
  "semantic": {
    "configurations": [
      {
        "name": "remediai-semantic",
        "prioritizedFields": {
          "contentFields": [{ "fieldName": "content" }],
          "keywordsFields": [{ "fieldName": "title" }, { "fieldName": "tags" }]
        }
      }
    ]
  }
}
```

---

## Populating the index

Use the Phase 17 indexer script to populate the index from your content sources:

```bash
# Index operational runbooks from docs/runbooks/
python scripts/populate_search_index.py \
  --source runbooks \
  --path docs/runbooks/

# Index resolved incidents (prior fixes)
python scripts/populate_search_index.py \
  --source prior_fixes \
  --min-confidence 0.8

# Index source code (chunked by method/class)
python scripts/populate_search_index.py \
  --source source_code \
  --repo MyApp \
  --namespace MyApp.
```

The indexer:
1. Chunks content by semantic boundary (paragraph for docs, method for code).
2. Generates embeddings using the configured Azure OpenAI embeddings deployment.
3. Uploads documents to the `remediai-rag` index in batches of 100.

---

## Query example

The RAG Retrieval Agent builds and executes this query:

```python
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizableTextQuery

results = search_client.search(
    search_text=query,
    vector_queries=[VectorizableTextQuery(text=query, k_nearest_neighbors=10, fields="content_vector")],
    query_type="semantic",
    semantic_configuration_name="remediai-semantic",
    select=["source", "title", "content", "url"],
    top=RAG_TOP_K,
)
```

---

## Keeping the index fresh

| Content type | Refresh strategy |
|-------------|-----------------|
| Runbooks | Re-index on merge to `main` (CI step in GitHub Actions) |
| Prior fixes | Added automatically when an incident reaches `resolved` status |
| Source code | Nightly re-index via scheduled GitHub Actions job |
| Documentation | Re-index on doc change PRs |

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `403 Forbidden` on search | Verify Managed Identity has `Search Index Data Reader` role |
| No results for known terms | Run the indexer to populate the index |
| Low relevance scores | Check `RAG_MIN_SCORE` is not set too high; try lowering to `0.5` |
| `SemanticSearchNotEnabled` | Enable semantic ranking in the Azure portal for the search service |
