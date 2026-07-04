# Agent Forge

A curated collection of reusable AI agents that any team member can drop into any project.

Each agent is a self-contained folder with a single **`.agent.md`** entrypoint. Attach that file in your chat (Kiro, GitHub Copilot, Cursor, Claude Code, or Windsurf) and the agent takes over the task end-to-end.

---

## Available Agents

| Agent | Purpose | Stack | Entrypoint |
|---|---|---|---|
| **docs-site-builder** | Generates a modern documentation site from any folder of Markdown files. Animated, interactive, premium design. | Next.js 15, Tailwind CSS 4, Framer Motion, MDX, Shiki | [`docs-site-builder/docs-site-builder.agent.md`](./docs-site-builder/docs-site-builder.agent.md) |

More agents will be added here over time.

---

## How to Use an Agent

1. **Open your project** in VS Code, Kiro, Cursor, or any AI-enabled editor.
2. **Attach the `.agent.md` file** in the chat panel (drag-and-drop, `#File`, or the paperclip icon). Only this one file — the agent reads its sibling files by itself.
3. **Send a short trigger message** describing what you want (each agent's README has example prompts).
4. **Answer the batched questions** the agent asks upfront (usually 5–8 short questions).
5. **Let it run.** The agent generates all files, runs the build, and hands back a working project.

---

## Agent Structure Convention

```text
agent-forge/
└── <agent-name>/
    ├── README.md                    ← Quick start + example prompts
    ├── <agent-name>.agent.md        ← MAIN file — attach ONLY this in chat
    ├── DESIGN_SYSTEM.md             ← Design principles the agent references (optional)
    └── themes.md                    ← Color palettes (optional)
```

The `.agent.md` file is written as **portable instructions** — it works across Kiro, Copilot Chat, Cursor, Claude Code, and Windsurf without modification.

---

## Adding a New Agent

1. Create a new folder under `agent-forge/<new-agent-name>/`.
2. Add a `README.md` (what it does, example prompts).
3. Add `<new-agent-name>.agent.md` — the main instruction file:
   - **Purpose** section
   - **Tech stack** (non-negotiable choices)
   - **Question batch** the agent must ask before starting
   - **Execution plan** (numbered steps)
   - **Reference files** it reads from its own folder
   - **Failure handling and edge cases**
   - **Final report format**
4. Update the table in this README.

---

## Philosophy

- **One agent, one job.** Each agent solves a single, well-defined task.
- **One file to attach.** User only attaches the `.agent.md` — agent reads sibling files itself.
- **Question batching.** Ask everything up front in one message. Never interrupt the user mid-run.
- **Portable.** No editor-specific syntax. Works anywhere Markdown-attached agent context is supported.
- **Idempotent.** Running the same agent twice with the same answers produces the same result.
- **Modern by default.** Generated output uses current tooling (2026) — no legacy frameworks.
