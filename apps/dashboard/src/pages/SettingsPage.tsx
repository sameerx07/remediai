import { useState } from 'react'

type SettingsTab = 'profile' | 'notifications' | 'ai-config' | 'security'

const TABS: Array<{ key: SettingsTab; label: string }> = [
  { key: 'profile',       label: 'Profile'           },
  { key: 'notifications', label: 'Notifications'     },
  { key: 'ai-config',     label: 'AI Configuration'  },
  { key: 'security',      label: 'Security'          },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-4 text-[11px] font-semibold uppercase tracking-[.08em] text-text-3"
      style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}
    >
      {children}
    </div>
  )
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[12px] font-medium text-text-2">{children}</label>
}

function FormInput({ type = 'text', defaultValue, placeholder }: { type?: string; defaultValue?: string; placeholder?: string }) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full rounded-lg px-3 py-2 text-[13px] text-text-1 outline-none transition-colors"
      style={{
        background: 'var(--color-surface-3)',
        border: '1.5px solid var(--color-border-2)',
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)' }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-2)' }}
    />
  )
}

function FormSelect({ defaultValue, options }: { defaultValue?: string; options: string[] }) {
  return (
    <select
      defaultValue={defaultValue}
      className="w-full cursor-pointer rounded-lg px-3 py-2 text-[13px] text-text-1 outline-none"
      style={{ background: 'var(--color-surface-3)', border: '1.5px solid var(--color-border-2)' }}
    >
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  )
}

function Toggle({ defaultChecked = true }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
      style={{ background: on ? 'var(--color-accent)' : 'var(--color-surface-3)' }}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: on ? 'translateX(16px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

function NotifRow({ title, desc, defaultChecked = true }: { title: string; desc: string; defaultChecked?: boolean }) {
  return (
    <div
      className="flex items-center justify-between rounded-[10px] px-3.5 py-3.5 gap-4"
      style={{ background: 'var(--color-surface-2)' }}
    >
      <div>
        <div className="text-[13px] font-semibold text-text-1">{title}</div>
        <div className="mt-0.5 text-[12px] text-text-3">{desc}</div>
      </div>
      <Toggle defaultChecked={defaultChecked} />
    </div>
  )
}

function CapabilityRow({ label, defaultChecked = true }: { label: string; defaultChecked?: boolean }) {
  return (
    <div
      className="flex items-center justify-between rounded-[10px] px-3.5 py-3"
      style={{ background: 'var(--color-surface-2)' }}
    >
      <span className="text-[13px] font-medium text-text-1">{label}</span>
      <Toggle defaultChecked={defaultChecked} />
    </div>
  )
}

function SaveBtn({ label }: { label: string }) {
  return (
    <button
      className="rounded-lg px-5 py-2 text-[13px] font-semibold text-white"
      style={{ background: 'var(--color-accent)' }}
    >
      {label}
    </button>
  )
}

function CancelBtn() {
  return (
    <button
      className="rounded-lg border px-5 py-2 text-[13px] font-medium text-text-2"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}
    >
      Cancel
    </button>
  )
}

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('profile')

  return (
    <div className="page-enter">
      {/* Tab bar */}
      <div
        className="-mx-5 -mt-7 mb-6 flex gap-0 overflow-x-auto border-b px-5 sm:-mx-8 sm:px-8 lg:-mt-8"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="shrink-0 border-b-2 px-4 py-[10px] text-[13px] font-medium transition-colors"
            style={
              tab === t.key
                ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent)', fontWeight: 600 }
                : { borderColor: 'transparent', color: 'var(--color-text-3)' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === 'profile' && (
        <div className="max-w-[680px]">
          <div className="rounded-xl border border-border bg-surface p-6">
            <SectionTitle>Personal Information</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div><FormLabel>First Name</FormLabel><FormInput defaultValue="Anji" /></div>
              <div><FormLabel>Last Name</FormLabel><FormInput defaultValue="Keesari" /></div>
              <div><FormLabel>Title</FormLabel><FormInput defaultValue="Platform Engineer" /></div>
              <div><FormLabel>Role</FormLabel><FormInput defaultValue="AI/DevOps" /></div>
              <div className="col-span-2"><FormLabel>Email</FormLabel><FormInput defaultValue="admin@remediai.dev" /></div>
              <div><FormLabel>Phone</FormLabel><FormInput defaultValue="+1 (555) 100-2200" /></div>
              <div><FormLabel>Employee ID</FormLabel><FormInput defaultValue="NVM-0042" /></div>
            </div>
            <div className="mt-6">
              <SectionTitle>Organization Information</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><FormLabel>Organization</FormLabel><FormInput defaultValue="RemediAI" /></div>
                <div className="col-span-2"><FormLabel>Office</FormLabel><FormInput defaultValue="Remote / Los Angeles, CA" /></div>
                <div>
                  <FormLabel>Timezone</FormLabel>
                  <FormSelect defaultValue="America/Los_Angeles (PST)" options={['America/Los_Angeles (PST)', 'America/New_York (EST)', 'America/Chicago (CST)']} />
                </div>
                <div>
                  <FormLabel>Language</FormLabel>
                  <FormSelect defaultValue="English" options={['English', 'Spanish', 'Mandarin']} />
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-2.5">
              <SaveBtn label="Save Changes" />
              <CancelBtn />
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        <div className="max-w-[680px]">
          <div className="rounded-xl border border-border bg-surface p-6">
            <SectionTitle>Notification Preferences</SectionTitle>
            <div className="flex flex-col gap-3">
              <NotifRow title="New Critical Incident"    desc="Alert when a Critical severity incident is detected" />
              <NotifRow title="Escalation Required"      desc="When AI agents cannot resolve and need human review" />
              <NotifRow title="PR Merge Failed"          desc="When an auto-created PR fails CI checks" />
              <NotifRow title="Agent Pipeline Error"     desc="When Triage/Root Cause/Fix agent encounters an error" />
              <NotifRow title="Weekly Incident Report"   desc="Email digest every Monday at 8:00 AM" />
            </div>
          </div>
        </div>
      )}

      {/* AI Configuration */}
      {tab === 'ai-config' && (
        <div className="max-w-[680px]">
          <div className="rounded-xl border border-border bg-surface p-6">
            <SectionTitle>AI Model Settings</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>AI Model</FormLabel>
                <FormSelect
                  defaultValue="Claude Sonnet 4.6 (Recommended)"
                  options={['Claude Sonnet 4.6 (Recommended)', 'Claude Haiku 4.5 (Faster)', 'Claude Opus 4.8 (Most Capable)']}
                />
              </div>
              <div>
                <FormLabel>Triage Confidence Threshold</FormLabel>
                <FormSelect defaultValue="85%" options={['80%', '85%', '90%', '95%']} />
              </div>
              <div className="col-span-2">
                <FormLabel>System Prompt Prefix</FormLabel>
                <FormInput defaultValue="You are RemediAI, an expert software incident remediation agent. Analyze exceptions and generate fixes." />
              </div>
              <div className="col-span-2">
                <FormLabel>Escalation Message</FormLabel>
                <FormInput defaultValue="This incident requires human review. Escalating to on-call engineer." />
              </div>
            </div>
            <div className="mt-6">
              <SectionTitle>AI Capabilities</SectionTitle>
              <div className="flex flex-col gap-3">
                <CapabilityRow label="Automatic PR creation" />
                <CapabilityRow label="Root cause analysis" />
                <CapabilityRow label="Code context retrieval (RAG)" />
                <CapabilityRow label="PII scrubbing before LLM calls" />
                <CapabilityRow label="Audit log all agent decisions" />
              </div>
            </div>
            <div className="mt-5">
              <SaveBtn label="Save AI Settings" />
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      {tab === 'security' && (
        <div className="max-w-[680px]">
          <div className="rounded-xl border border-border bg-surface p-6">
            <SectionTitle>Security</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div><FormLabel>Current Password</FormLabel><FormInput type="password" defaultValue="••••••••" /></div>
              <div />
              <div><FormLabel>New Password</FormLabel><FormInput type="password" placeholder="Min. 12 characters" /></div>
              <div><FormLabel>Confirm Password</FormLabel><FormInput type="password" placeholder="Repeat new password" /></div>
            </div>
            <div className="mt-6">
              <SectionTitle>API Keys</SectionTitle>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'Production API Key', value: 'rmai_live_••••••••••••••••••••3f9a' },
                  { label: 'Webhook Secret',      value: 'whsec_••••••••••••••••••••7c12' },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="flex items-center gap-3 rounded-[10px] border px-3.5 py-3"
                    style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                  >
                    <div className="flex-1">
                      <div className="text-[12.5px] font-semibold text-text-1">{k.label}</div>
                      <div className="mt-0.5 font-mono text-[12px] text-text-3">{k.value}</div>
                    </div>
                    <button
                      className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                      style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                    >
                      Reveal
                    </button>
                    <button
                      className="rounded-md border px-2.5 py-1 text-[11px] text-text-2"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-3)' }}
                    >
                      Rotate
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <SaveBtn label="Update Password" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
