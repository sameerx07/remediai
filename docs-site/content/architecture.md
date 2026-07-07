---
title: Architecture Guide
description: System design, data flows, and key decisions
---

# Architecture Guide

Convora uses a hybrid Python + Node.js architecture with an agentic RAG pipeline. This document covers the system design, data flows, and key decisions.

## System Overview

The platform consists of four layers:

- Client Layer (React apps + embeddable widget)
- Node.js Server (Express + SQLite)
- Python AI Server (FastAPI + LLM)
- Vector Database (Qdrant)

## Architecture Layers

### Client Layer

Three React applications and a widget:

- **Admin Portal** — Platform owner dashboard (workspaces, crawls, logs)
- **Client Portal** — Customer dashboard (conversations, leads, analytics)
- **Chat Widget** — Embeddable UMD bundle for customer websites
- **Marketing Site** — Static HTML pages (docs, pricing, legal)

All built with React + Vite + Tailwind CSS.

### Node.js Server

Express.js handles web concerns:

| Module | Responsibility |
|--------|---------------|
| Auth | JWT tokens, API key validation |
| Crawling | Puppeteer browser, sitemap parsing, link discovery |
| Files | Upload handling, format validation |
| Chat Proxy | SSE passthrough to Python server |
| Client API | Visitors, conversations, leads, analytics |

**Database:** SQLite with WAL mode for concurrent reads.

### Python AI Server

FastAPI handles AI/ML concerns:

| Module | Responsibility |
|--------|---------------|
| Chat | Agentic RAG pipeline with tool calling |
| Ingestion | Chunking, embedding, deduplication |
| Vectors | Qdrant client (search, upsert, delete) |
| Providers | Multi-LLM fallback chain |

### Vector Database (Qdrant)

- One collection per tenant: `convora_{tenant_id}`
- HNSW index with cosine similarity
- 3072 dimensions (Gemini embeddings)
- Content deduplication via SHA-256 hash

## Agentic RAG Pipeline

Unlike traditional RAG (embed, search, stuff, generate), Convora uses an **agentic** approach where the LLM decides which tools to call.

### Available Tools

| Tool | Purpose | Data Source |
|------|---------|-------------|
| `search_knowledge_base` | Find relevant text chunks | Qdrant (doc_type: chunk) |
| `get_page_overviews` | Get page-level summaries | Qdrant (doc_type: page_summary) |
| `query_client_api` | Fetch live data from external APIs | Client's configured API endpoint |

The LLM autonomously picks the right tool based on the question type. Maximum 2 tool rounds per query.

## Multi-Tenancy

Every piece of data is isolated by `tenant_id`:

| Layer | Isolation Method |
|-------|-----------------|
| Qdrant | Separate collection per tenant |
| SQLite | `WHERE tenant_id = ?` on all queries |
| Widget | `data-tenant` attribute determines collection |
| JWT | Token contains `tenantId` claim |
| API Keys | Each key maps to exactly one tenant |

A client user can never see another tenant's data at any layer.

## AI Provider Fallback

The platform uses a fallback chain for reliability:

| Priority | Provider | Model | Free Limit |
|----------|----------|-------|------------|
| 1 | Groq | llama-3.3-70b | 14,400 req/day |
| 2 | Gemini | gemini-2.5-flash | 20 req/day |
| 3 | OpenRouter | gemma-4-31b | 50 req/day |

On any error (rate limit, timeout, bad request), the system automatically tries the next provider.

## Key Design Decisions

### Why Python + Node.js?

- **Python**: Best ML/AI ecosystem (google-genai, openai SDK, qdrant-client)
- **Node.js**: Best web tooling (Puppeteer, Express, JWT, file handling)

### Why SQLite?

For less than 100 tenants and less than 1M messages, SQLite with WAL mode handles the load easily:
- Zero configuration
- Single file backup
- No separate database server
- Upgrade path: Turso (managed) or PostgreSQL when needed

### Why Agentic RAG?

Traditional RAG always searches even for questions that need live data. Agentic RAG lets the LLM **choose** the right retrieval strategy per question. Better answers, fewer irrelevant chunks.

### Why Batch Embeddings?

Instead of 1 API call per chunk, we batch 20 texts per Gemini call. For a 50-page site with around 200 chunks, that is 10 API calls instead of 200. 20x faster, stays within free limits.

## Security

- Passwords: bcrypt (10 rounds)
- API keys: stored as SHA-256 hashes
- JWT: 24h expiry (admin), 7d (client)
- CORS: configured per environment
- Tenant isolation at every layer
- File type/size validation on upload
- No secrets in client-side code
