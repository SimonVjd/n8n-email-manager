# N8N-BUILDER

Build web apps powered by n8n workflows. Next.js frontend + n8n backend, deployed to Vercel.

## Project Structure

```
N8N-BUILDER/
├── CLAUDE.md              # This file
├── .mcp.json              # MCP server config (n8n-mcp + GitHub)
├── .gitignore             # Git ignore rules
├── app/                   # Next.js web app (created on first build)
│   ├── package.json
│   ├── next.config.ts
│   ├── .env.local         # Webhook URLs (NEVER commit)
│   ├── src/
│   │   ├── app/           # Pages (App Router)
│   │   ├── components/    # React components
│   │   ├── lib/           # API helpers, types, utilities
│   │   └── styles/        # Global styles
│   └── public/            # Static assets
├── n8n-mcp/               # MCP server (reference only — do not edit)
└── n8n-skills/            # Claude skills (reference only — do not edit)
```

## Environment

| Component | Detail |
|-----------|--------|
| n8n Instance | Local Docker → `http://localhost:5678` |
| MCP Servers | n8n-mcp (workflow tools) + GitHub (repo management) |
| Frontend | Next.js 15 (App Router) + React + Tailwind CSS |
| Deployment | Vercel (auto-deploy from GitHub on push to main) |

## First-Time Setup

### You Do (manual — once):

1. **Create GitHub account** → https://github.com/join
2. **Create a Personal Access Token**:
   - Go to https://github.com/settings/tokens
   - "Generate new token (classic)"
   - Select scopes: `repo`, `read:org`, `read:packages`
   - Copy token → paste into `.mcp.json` replacing `YOUR_GITHUB_TOKEN_HERE`
3. **Create Vercel account** → https://vercel.com/signup (use GitHub login)
4. **Configure Git**:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your@email.com"
   ```
5. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   vercel login
   ```
6. **Install frontend-design plugin** (run inside Claude Code):
   ```
   /plugin marketplace add anthropics/claude-code
   /plugin install frontend-design@anthropics-claude-code
   ```

### Claude Does (automated on first build):

- Initialize git repo
- Create Next.js app in `app/`
- Create `.gitignore`
- Create GitHub repo via MCP
- Link Vercel project

## MCP Tools Reference

### n8n-mcp — Discovery
| Tool | Purpose |
|------|---------|
| `search_nodes` | Find nodes by keyword (1,084+ nodes) |
| `get_node` | Get node config (minimal/standard/full) |
| `validate_node` | Validate a single node config |
| `search_templates` | Search 2,709+ workflow templates |
| `get_template` | Get full workflow JSON from template |

### n8n-mcp — Workflow Management
| Tool | Purpose |
|------|---------|
| `n8n_create_workflow` | Create workflow on local n8n |
| `n8n_get_workflow` | Retrieve workflow by ID |
| `n8n_update_workflow` | Full workflow update |
| `n8n_update_partial_workflow` | Partial update (preferred) |
| `n8n_list_workflows` | List all workflows |
| `validate_workflow` | Validate workflow structure |
| `n8n_test_workflow` | Trigger/test a workflow |
| `n8n_list_executions` | View execution history |
| `n8n_get_execution` | Get execution details |

### GitHub MCP — Repository Management
| Tool | Purpose |
|------|---------|
| Repository tools | Create repos, push code, manage branches |
| PR tools | Create/update pull requests |
| Issue tools | Create/manage issues |

## Skills (auto-activate by context)

| Skill | When It Activates |
|-------|-------------------|
| **frontend-design** | Building UI — distinctive, production-grade interfaces |
| **n8n-expression-syntax** | Writing `{{ }}` expressions, data mapping |
| **n8n-mcp-tools-expert** | Using MCP tools to find/manage nodes |
| **n8n-workflow-patterns** | Designing workflow architecture |
| **n8n-validation-expert** | Fixing validation errors |
| **n8n-node-configuration** | Configuring node properties |
| **n8n-code-javascript** | Writing JS in Code nodes |
| **n8n-code-python** | Writing Python in Code nodes |

## Build Process

Every app follows these 5 phases in order.

### Phase 1: Build the n8n Workflow

1. Clarify what the workflow does (trigger, processing, response)
2. Search templates: `search_templates` → `get_template`
3. Research nodes: `search_nodes` → `get_node`
4. Build incrementally — start with **Webhook trigger**, add nodes one at a time
5. **Webhook config for web apps** (critical):
   - HTTP Method: `POST`
   - Response Mode: `Last Node` (so frontend gets a response back)
   - Path: descriptive slug (e.g., `/generate-report`)
6. Validate: `validate_workflow` → fix → re-validate
7. Test: `n8n_test_workflow` → verify response JSON shape
8. Record: webhook URL + request/response format for Phase 2

### Phase 2: Build the Next.js Frontend

1. Use **frontend-design** skill for all UI work
2. Create pages in `app/src/app/`
3. Create components in `app/src/components/`
4. Use the shared n8n helper in `app/src/lib/n8n.ts`:
   ```typescript
   const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!;

   export async function callWorkflow(endpoint: string, data: Record<string, unknown>) {
     const res = await fetch(`${N8N_WEBHOOK_URL}${endpoint}`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data),
     });
     if (!res.ok) throw new Error(`Workflow error: ${res.status}`);
     return res.json();
   }
   ```
5. Webhook URLs in `app/.env.local` (never commit):
   ```
   NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook
   ```
6. Always handle: loading states, error states, empty states

### Phase 3: Test Locally

1. n8n running at `http://localhost:5678` — workflow must be **active**
2. Start frontend: `cd app && npm run dev` → `http://localhost:3000`
3. Test full round-trip: **UI → webhook → n8n workflow → response → UI**
4. Check browser console + n8n execution log for errors
5. Iterate until the round-trip works reliably

### Phase 4: Push to GitHub

1. Stage and commit changes
2. Create or update GitHub repo via GitHub MCP
3. Push to `main` branch

### Phase 5: Deploy to Vercel

1. First time: `cd app && vercel link`
2. Set env vars in Vercel dashboard:
   - `NEXT_PUBLIC_N8N_WEBHOOK_URL` = your **production** n8n webhook URL
3. Deploy: `vercel --prod`
4. After linking, every push to `main` auto-deploys

> **Important**: Local Docker n8n (`localhost:5678`) is NOT reachable from Vercel.
> For production, use n8n Cloud or expose your instance via a tunnel/domain.

## n8n ↔ Frontend Patterns

### Form Tool
```
User fills form → POST to webhook → n8n processes → JSON response → display result
```
- Webhook trigger with Response Mode = "Last Node"
- Frontend sends form data as JSON body
- Access in n8n: `{{ $json.body.fieldName }}`

### AI Chat Interface
```
User sends message → POST with sessionId → AI Agent node → return response
```
- Send `{ "message": "...", "sessionId": "..." }` from frontend
- Use n8n AI Agent node with chat memory
- Handle streaming if supported, or wait for full response

### Dashboard
```
Page loads → fetch from webhook → n8n queries data → JSON → render charts
```
- Use SWR or React Query for data fetching with auto-refresh
- One webhook endpoint per data source

## Safety Rules

- **NEVER** edit production n8n workflows directly — create copies first
- **NEVER** deploy without running `validate_workflow`
- **NEVER** commit `.env.local`, `.env`, or files containing API keys
- **NEVER** skip the full round-trip test (UI → n8n → UI) before deploying
- **NEVER** hardcode webhook URLs — use environment variables
- **NEVER** expose n8n API keys in client-side code (`NEXT_PUBLIC_` = public)

## n8n Expression Quick Reference

```javascript
{{ $json.fieldName }}                            // Current node input
{{ $json.body.fieldName }}                       // Webhook body data
{{ $('NodeName').item.json.field }}              // Previous node output
{{ $json.status === 'active' ? 'yes' : 'no' }}  // Conditional
{{ $now.toISO() }}                               // Current timestamp
```

## Common Mistakes

### n8n Side
- Forgetting `$json.body` for webhook data (NOT `$json.fieldName` directly)
- Using expressions inside Code nodes (use variables instead)
- Not setting Webhook response mode to "Last Node"
- Leaving workflow inactive during testing

### Frontend Side
- Hardcoding `localhost:5678` instead of using env vars
- Not handling loading/error/empty states
- Using `NEXT_PUBLIC_` prefix for secrets (only for webhook URLs)
- Missing `Content-Type: application/json` header in fetch calls
- Not awaiting async calls or handling promise rejections
