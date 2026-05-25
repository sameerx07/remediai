import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import clsx from 'clsx';

/* ─── Feature grid data ─── */
const features = [
  {
    icon: '🔍',
    title: 'Intelligent Log Ingestion',
    body: 'Connects to Azure Monitor and Application Insights via KQL queries. Automatically deduplicates exceptions by fingerprint hash and publishes incidents to Azure Service Bus.',
  },
  {
    icon: '🎯',
    title: 'AI Triage',
    body: 'Assigns priority (critical / high / medium / low) and semantic labels. Detects known patterns — null references, timeouts, auth failures — and groups related incidents automatically.',
  },
  {
    icon: '🧠',
    title: 'Root Cause Analysis',
    body: 'Parses the stack trace, identifies the faulty component, and produces a structured JSON root cause summary with confidence score. Every reasoning step is recorded for auditability.',
  },
  {
    icon: '📂',
    title: 'Code Context',
    body: 'Retrieves the exact source files and line ranges referenced in the stack trace from Azure DevOps Repos. Skips third-party packages and limits to the 5 most relevant snippets.',
  },
  {
    icon: '📚',
    title: 'RAG Retrieval',
    body: 'Runs a hybrid vector + keyword search over Azure AI Search. Prioritises runbooks, prior fixes, and documentation to ground every recommendation in real context.',
  },
  {
    icon: '🛠️',
    title: 'Fix Recommendations',
    body: 'Generates a ranked list of up to 3 remediation options — each with a description, target files, suggested change, confidence score, and source references.',
  },
  {
    icon: '🐛',
    title: 'Azure DevOps Bug Creation',
    body: 'Automatically creates a fully-populated Bug work item in Azure DevOps Boards with root cause, repro steps, and a direct link back to the incident record.',
  },
  {
    icon: '🔀',
    title: 'Draft PR Generation',
    body: 'After a human approves a recommendation in the dashboard, the PR Agent creates a branch, applies the patch, and opens a draft pull request — never auto-merges.',
  },
  {
    icon: '📊',
    title: 'React Dashboard',
    body: 'A clean, filterable incident list with status badges, a full detail view showing root cause and recommendations, and a metrics panel tracking volume and MTTT.',
  },
];

/* ─── How it works steps ─── */
const workflowSteps = [
  'Exception appears in Application Insights.',
  'KQL query ingests and deduplicates the exception.',
  'Incident published to Azure Service Bus.',
  'LangGraph worker picks up the incident.',
  'Triage Agent assigns priority and groups incidents.',
  'Root Cause Agent analyzes the stack trace.',
  'Code Context Agent retrieves relevant source files.',
  'RAG Agent fetches runbooks and prior fixes.',
  'Fix Planner produces ranked recommendations.',
  'Azure DevOps Bug created with full context.',
  'Human approves a recommendation in the dashboard.',
  'PR Agent creates a draft pull request for review.',
];

/* ─── Technology badges ─── */
const techStack = [
  { label: 'Python 3.12' },
  { label: 'FastAPI' },
  { label: 'LangGraph' },
  { label: 'Azure OpenAI GPT-4o' },
  { label: 'Azure AI Search' },
  { label: 'Azure Monitor' },
  { label: 'Azure Service Bus' },
  { label: 'PostgreSQL 16' },
  { label: 'React 18' },
  { label: 'TypeScript' },
  { label: 'Azure DevOps' },
  { label: 'AKS' },
  { label: 'Terraform' },
  { label: 'Helm' },
];

/* ─── Security pillars ─── */
const securityPillars = [
  {
    icon: '👤',
    title: 'Humans in the Loop',
    body: 'Every code change requires an explicit human approval. Recommendations are surfaced, never auto-applied.',
  },
  {
    icon: '🚫',
    title: 'No Auto-Merge',
    body: 'PRs are always created as drafts. RemediAI never sets auto-complete or merges directly to any branch.',
  },
  {
    icon: '🛡️',
    title: 'PII Scrubbed',
    body: 'Emails, IPs, and user identifiers are stripped from every exception payload before transmission to any AI endpoint.',
  },
  {
    icon: '📋',
    title: 'Full Audit Trail',
    body: 'Every agent decision is recorded in an immutable audit log table — what ran, what it decided, and why.',
  },
];

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}
    >
      {/* ── Hero ── */}
      <header className={clsx('hero hero--primary')}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '99px',
              padding: '0.35rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#fff',
              marginBottom: '1.75rem',
              backdropFilter: 'blur(4px)',
            }}
          >
            <span>🚀</span> Phases 1–21 complete &nbsp;·&nbsp; v0.4 in active development
          </div>
          <h1 className="hero__title">
            Stop finding bugs.<br />
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Start fixing them.</span>
          </h1>
          <p className="hero__subtitle">
            RemediAI is an AI-powered exception analysis and remediation platform for enterprise
            .NET applications on Azure. From Application Insights alert to Azure DevOps Bug in
            under 3 minutes — with full root cause analysis and fix recommendations.
          </p>
          <div className="hero-cta-group">
            <Link to="/docs/getting-started/prereqs" className="hero-cta-primary">
              Get started →
            </Link>
            <Link to="https://github.com/akeesari/remediai" className="hero-cta-secondary">
              ★ View on GitHub
            </Link>
          </div>

          {/* Stats row */}
          <div className="stats-row" style={{ marginTop: '4rem' }}>
            {[
              { n: '8', label: 'AI agents' },
              { n: '21', label: 'phases complete' },
              { n: '< 3 min', label: 'triage time' },
              { n: '500/hr', label: 'incident throughput' },
            ].map((s) => (
              <div key={s.label} className="stat-item">
                <span className="stat-number" style={{ color: 'rgba(255,255,255,0.95)' }}>{s.n}</span>
                <span className="stat-label" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main>
        {/* ── Problem / Solution ── */}
        <section className="section">
          <div className="container">
            <div className="section__header">
              <span className="section__eyebrow">The Problem</span>
              <h2 className="section__title">Engineering time is too valuable to spend finding exceptions</h2>
              <p className="section__lead">
                RemediAI automates the investigation and triage steps so your team spends time fixing, not finding.
              </p>
            </div>
            <div className="ps-grid">
              <div className="ps-panel ps-panel--before">
                <div className="ps-panel__heading">
                  <span>⚠️</span> Without RemediAI
                </div>
                {[
                  'Alert fires at 2 AM — someone gets paged.',
                  'Engineer manually searches Application Insights.',
                  'Checks 3 dashboards to correlate the exception.',
                  'Reads the stack trace and guesses root cause.',
                  'Creates a Jira / ADO ticket by hand.',
                  'Searches codebase for the relevant file.',
                  'Writes up reproduction steps from memory.',
                  'Repeats for every recurring exception pattern.',
                ].map((item) => (
                  <div key={item} className="ps-item">
                    <span style={{ color: '#c0392b', fontWeight: 700, marginTop: '0.1rem' }}>✗</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="ps-panel ps-panel--after">
                <div className="ps-panel__heading">
                  <span>✅</span> With RemediAI
                </div>
                {[
                  'Exception detected in Application Insights automatically.',
                  'Deduplicated — no duplicate incidents for the same error.',
                  'Triage Agent assigns priority and groups related events.',
                  'Root Cause Agent produces a structured JSON analysis.',
                  'Azure DevOps Bug created with full context attached.',
                  'Code Context Agent finds the exact lines in your repo.',
                  'Fix Planner ranks remediation options with confidence scores.',
                  'Engineer reviews the Bug — decides in minutes, not hours.',
                ].map((item) => (
                  <div key={item} className="ps-item">
                    <span style={{ color: '#27ae60', fontWeight: 700, marginTop: '0.1rem' }}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Grid ── */}
        <section className="section section--alt">
          <div className="container">
            <div className="section__header">
              <span className="section__eyebrow">Features</span>
              <h2 className="section__title">Everything you need to remediate faster</h2>
              <p className="section__lead">
                A complete agentic pipeline from log ingestion through to draft pull request —
                with humans in control at every decision point.
              </p>
            </div>
            <div className="features-grid">
              {features.map((f) => (
                <div key={f.title} className="feature-card">
                  <div className="feature-card__icon">{f.icon}</div>
                  <div className="feature-card__title">{f.title}</div>
                  <div className="feature-card__body">{f.body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Architecture diagram ── */}
        <section className="section">
          <div className="container">
            <div className="section__header">
              <span className="section__eyebrow">Architecture</span>
              <h2 className="section__title">Cloud-native on Azure, end to end</h2>
              <p className="section__lead">
                Independently deployable services on AKS, communicating via Azure Service Bus,
                with Workload Identity for zero-credential authentication.
              </p>
            </div>
            <div
              style={{
                background: 'var(--ifm-card-background-color)',
                border: '1px solid var(--remedia-border)',
                borderRadius: '16px',
                padding: '2.5rem',
                overflowX: 'auto',
              }}
            >
              <pre
                style={{
                  fontFamily: 'var(--ifm-font-family-monospace)',
                  fontSize: '0.78rem',
                  lineHeight: 1.7,
                  margin: 0,
                  color: 'var(--ifm-font-color-base)',
                  whiteSpace: 'pre',
                }}
              >
{`  Application Workloads (AKS / App Service / VMs)
           │
           ▼
  Application Insights / Azure Monitor  ◄──── KQL queries (every N mins)
           │
           ▼
  Log Ingestion Service (Python · AKS)
           │  fingerprint + dedup
           ▼
  Azure Service Bus ──── incident-events topic
           │
           ▼
  Agent Worker (Python + LangGraph)
    ├── Azure OpenAI GPT-4o       (Triage / Root Cause / Fix Planner)
    ├── Azure DevOps Repos         (Code Context)
    ├── Azure AI Search            (RAG Retrieval)
    ├── Azure DevOps Boards        (Bug Creation)
    └── PostgreSQL / Blob Storage  (Persistence)
           │
           ▼
  FastAPI Backend API  ◄─── Redis cache
           │
           ▼
  React Dashboard  ──── Incidents · Analyses · Metrics · Approvals

  Azure Key Vault ──── secrets ──► all services
  Managed Identity ──────────────► Key Vault`}
              </pre>
            </div>
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link to="/docs/architecture/overview" className="button button--primary button--md">
                Read the full architecture →
              </Link>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="section section--alt">
          <div className="container">
            <div className="section__header">
              <span className="section__eyebrow">How It Works</span>
              <h2 className="section__title">Exception to Azure DevOps Bug in 12 steps</h2>
              <p className="section__lead">
                The full pipeline from detection to a draft pull request, with a human approval gate before any code is touched.
              </p>
            </div>
            <ul className="workflow-list">
              {workflowSteps.map((step, i) => (
                <li key={i} className="workflow-step">
                  <div className="step-number">{i + 1}</div>
                  <div className="step-text">{step}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Technology stack ── */}
        <section className="section">
          <div className="container">
            <div className="section__header">
              <span className="section__eyebrow">Technology Stack</span>
              <h2 className="section__title">Built on the Azure ecosystem</h2>
              <p className="section__lead">
                Python + LangGraph backend, React frontend, and deep Azure-native integration throughout.
              </p>
            </div>
            <div className="tech-strip">
              {techStack.map((t) => (
                <span key={t.label} className="tech-badge">
                  {t.label}
                </span>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/docs/architecture/tech-stack" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                View full stack with rationale →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Security promise ── */}
        <section className="section section--alt">
          <div className="container">
            <div className="section__header">
              <span className="section__eyebrow">Security</span>
              <h2 className="section__title">Safe by design — not as an afterthought</h2>
              <p className="section__lead">
                RemediAI operates on a zero-trust, human-in-the-loop model. Agents have read-only access by default.
              </p>
            </div>
            <div className="security-grid">
              {securityPillars.map((p) => (
                <div key={p.title} className="security-card">
                  <div className="security-card__icon">{p.icon}</div>
                  <div className="security-card__title">{p.title}</div>
                  <div className="security-card__body">{p.body}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/docs/security/principles" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Read the security guardrails →
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="section">
          <div className="container">
            <div className="cta-section">
              <h2>Ready to stop triaging by hand?</h2>
              <p>
                Deploy RemediAI on your Azure subscription, connect Application Insights, and watch
                exceptions become triaged incidents in minutes.
              </p>
              <div className="hero-cta-group">
                <Link to="/docs/getting-started/prereqs" className="hero-cta-primary">
                  Get started →
                </Link>
                <Link to="https://github.com/akeesari/remediai" className="hero-cta-secondary">
                  ★ Star on GitHub
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
