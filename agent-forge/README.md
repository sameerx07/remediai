# Agent Forge

A curated collection of reusable AI agents that any team member can drop into any project.

Each agent is a self-contained folder with a single **`.agent.md`** entrypoint. Attach that file in your chat (Kiro, GitHub Copilot, Cursor, Claude Code, or Windsurf) and the agent takes over the task end-to-end.

---

## Available Agents

| Agent | Purpose | Entrypoint |
|---|---|---|
| **docs-site-builder** | Generates a modern Docusaurus documentation site from any folder of Markdown files, with theming, landing page, deployment workflow, and search. | [`docs-site-builder/docs-site-builder.agent.md`](./docs-site-builder/docs-site-builder.agent.md) |

More agents will be added here over time.

---

## How to Use an Agent

1. **Open your project** in VS Code, Kiro, Cursor, or any AI-enabled editor.
2. **Attach the `.agent.md` file** in the chat panel (drag-and-drop, `#File`, or the paperclip icon).
3. **Send a short trigger message** describing what you want (each agent's README has example prompts).
4. **Answer the batched questions** the agent asks upfront (usually 5–8 short questions).
5. **Let it run.** The agent generates all files, runs the build, and hands back a working project.

---

## Agent Structure Convention

Every agent in this forge follows the same layout:

```text
agent-forge/
└── <agent-name>/
    ├── README.md                    ← Quick start + example prompts
    ├── <agent-name>.agent.md        ← MAIN file — attach this in chat
    ├── DESIGN_SYSTEM.md             ← Any design principles it applies (optional)
    ├── themes/                      ← Preset variants (optional)
    └── templates/                   ← File templates the agent renders (optional)
```

The `.agent.md` file is written as **portable instructions** — it works across Kiro, Copilot Chat, Cursor, Claude Code, and Windsurf without modification.

---

## Adding a New Agent

1. Create a new folder under `agent-forge/<new-agent-name>/`.
2. Add a `README.md` (what it does, example prompts).
3. Add `<new-agent-name>.agent.md` — the main instruction file. Follow the pattern in `docs-site-builder.agent.md`:
   - **Purpose** section
   - **Question batch** the agent must ask before starting
   - **Execution plan** (numbered steps)
   - **Templates and reference material** (referenced from `templates/`)
   - **Failure handling and edge cases**
   - **What to output when done** (summary format)
4. Update the table in this README.

---

## Philosophy

- **One agent, one job.** Each agent solves a single, well-defined task.
- **Question batching.** Ask everything up front in one message. Never interrupt the user mid-run.
- **Portable.** No editor-specific syntax. Works anywhere Markdown-attached agent context is supported.
- **Idempotent.** Running the same agent twice with the same answers produces the same result.
- **Modern by default.** Generated output should feel current — 2026-grade design, tooling, and patterns.
