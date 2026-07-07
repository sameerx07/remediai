---
title: Getting Started
description: Setup, installation, and your first deployment
---

# Getting Started

Welcome to Convora — the AI-powered customer engagement platform. This guide walks you through setup, configuration, and your first deployment.

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** installed
- **Python 3.11+** installed
- **Docker** running (for Qdrant vector database)
- A free API key from [Groq](https://console.groq.com) or [Google AI Studio](https://aistudio.google.com)

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/convora.git
cd convora
npm run install:all
```

This installs dependencies for all 5 services: Python AI server, Node.js server, Admin Portal, Client Portal, and Widget.

## Configuration

Create your environment files:

```bash
cd python-server
cp .env.example .env
```

Add your API keys:

```env
GROQ_API_KEY=gsk_your_key_here
GEMINI_API_KEY=AIza_your_key_here
QDRANT_URL=http://localhost:6333
```

## Starting the Platform

Start all services with a single command:

```bash
npm run dev
```

This launches:

| Service | Port | URL |
|---------|------|-----|
| Admin Portal | 3000 | http://localhost:3000 |
| Node.js API | 3001 | http://localhost:3001 |
| Client Portal | 4000 | http://localhost:4000 |
| Python AI | 8000 | http://localhost:8000 |
| Widget | 8080 | http://localhost:8080 |

## Your First Crawl

1. Log into the Admin Portal at `localhost:3000`
2. Create a workspace (tenant)
3. Enter a website URL and click **Start Crawl**
4. Watch as pages are indexed in real-time

## Embedding the Widget

Add this script tag to any website:

```html
<script
  src="https://your-domain.com/dist/chat-widget.umd.js"
  data-tenant="your-tenant-id"
  data-api="https://api.your-domain.com"
></script>
```

The widget appears as a floating button in the bottom-right corner.

## Next Steps

- [Architecture Guide](./architecture) — deep dive into system design
- API Reference — endpoint documentation
- Deployment Guide — production setup

> **Tip:** The platform works entirely on free-tier APIs. No credit card needed for development.
