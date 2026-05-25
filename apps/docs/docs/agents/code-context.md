---
sidebar_position: 4
title: Code Context Agent
---

# Code Context Agent

The Code Context Agent retrieves the source code relevant to the exception stack frames from Azure DevOps Repos.

---

## Responsibility

- Parse the stack trace to extract file paths and line numbers.
- Fetch the relevant source lines (± 20 lines of context) from Azure DevOps Repos.
- Attach the extracted snippets to the incident analysis.

:::info No LLM call
The Code Context Agent does **not** call Azure OpenAI. It makes direct REST calls to the Azure DevOps Repos API.
:::

---

## Input fields

| Field | Source |
|-------|--------|
| `stack_trace` | PII-scrubbed incident stack trace |
| `root_cause_json` | Root Cause Agent output (`component` field used to prioritise frames) |

---

## Output fields

| Field | Type | Description |
|-------|------|-------------|
| `code_snippets` | `list[CodeSnippet]` | Up to 5 source file extracts |

---

## `CodeSnippet` schema

```python
class CodeSnippet(BaseModel):
    file_path: str      # e.g. "/src/Services/UserService.cs"
    start_line: int     # First line of the snippet
    end_line: int       # Last line of the snippet
    content: str        # The source code lines
    repo: str           # ADO repository name
    commit_sha: str     # Commit at which the file was fetched
```

---

## Logic

```
1. Parse stack trace to extract file paths and line numbers.
   Regex: match "at <namespace> in <path>:line <n>" patterns.

2. Filter out third-party and framework frames:
   - Skip paths matching: System.*, Microsoft.*, Azure.*, Newtonsoft.*
   - Keep only paths that start with a configured application
     namespace prefix (AZURE_DEVOPS_CODE_ROOT).

3. For each remaining frame (up to 5):
   a. Call Azure DevOps Repos Items API to fetch the file content.
   b. Extract lines [line_number - 20, line_number + 20].
   c. Build a CodeSnippet.

4. If the root_cause_json.component matches a frame file path,
   prioritise that frame first in the snippet list.

5. Write AgentTraceEntry to state["agent_trace"].
```

---

## Azure DevOps API call

```http
GET https://dev.azure.com/{org}/{project}/_apis/git/repositories/{repo}/items
  ?path=/src/Services/UserService.cs
  &versionDescriptor.version=main
  &includeContent=true
  &api-version=7.1
Authorization: Basic base64(<PAT>)
```

The PAT is fetched from Azure Key Vault at agent startup. It has **read-only** access to Repos.

---

## Example output

```json
[
  {
    "file_path": "/src/Services/UserService.cs",
    "start_line": 22,
    "end_line": 62,
    "content": "        public async Task<User?> GetById(Guid id)\n        {\n            var user = await _repository.GetByIdAsync(id);\n            // line 42: user.Name — NullReferenceException here\n            return new UserDto { Name = user.Name, Email = user.Email };\n        }",
    "repo": "MyApp",
    "commit_sha": "a3f2c1d"
  }
]
```

---

## Configuration

| Env var | Description |
|---------|-------------|
| `AZURE_DEVOPS_CODE_ROOT` | Application namespace prefix to filter stack frames (e.g. `MyApp.`) |
| `CODE_CONTEXT_MAX_SNIPPETS` | Maximum snippets to fetch (default: `5`) |
| `CODE_CONTEXT_LINES_AROUND` | Lines of context above/below the target line (default: `20`) |
