import { createFileRoute } from '@tanstack/react-router'
import { Globe, Lock, Bell, Database } from 'lucide-react'

export const Route = createFileRoute('/admin/settings')({
  component: AdminSettings,
})

const sections = [
  {
    icon: Globe,
    title: 'General',
    description: 'Platform name, region, timezone, and locale preferences.',
    fields: [
      { label: 'Platform Name', value: '1000 Hills Engineering', type: 'text' as const },
      { label: 'Region', value: 'East Africa — Rwanda', type: 'text' as const },
      { label: 'Timezone', value: 'CAT (UTC+2)', type: 'text' as const },
      { label: 'Currency', value: 'RWF', type: 'text' as const },
    ],
  },
  {
    icon: Lock,
    title: 'Security',
    description: 'Authentication policies and session management.',
    fields: [
      { label: 'Session Timeout', value: '30 minutes', type: 'text' as const },
      { label: 'MFA Enforcement', value: 'Enabled', type: 'text' as const },
      { label: 'Password Policy', value: 'Strong (12+ chars)', type: 'text' as const },
    ],
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Alert channels and delivery preferences.',
    fields: [
      { label: 'Email Alerts', value: 'Enabled', type: 'text' as const },
      { label: 'SMS Alerts', value: 'Disabled', type: 'text' as const },
      { label: 'Slack Integration', value: 'Not configured', type: 'text' as const },
    ],
  },
  {
    icon: Database,
    title: 'Data & Storage',
    description: 'Backup schedules, retention, and export options.',
    fields: [
      { label: 'Auto Backup', value: 'Daily at 02:00 CAT', type: 'text' as const },
      { label: 'Retention Period', value: '90 days', type: 'text' as const },
      { label: 'Storage Used', value: '2.4 GB / 10 GB', type: 'text' as const },
    ],
  },
]

function AdminSettings() {
  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Settings</h1>
          <p className="adm-page-subtitle">Platform configuration &amp; preferences</p>
        </div>
      </div>

      <div className="adm-settings-grid">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title} className="adm-panel">
              <div className="adm-settings-section-header">
                <Icon size={18} aria-hidden="true" className="adm-stat-icon" />
                <div>
                  <h2 className="adm-panel-title">{section.title}</h2>
                  <p className="adm-page-subtitle">{section.description}</p>
                </div>
              </div>

              <div className="adm-settings-fields">
                {section.fields.map((field) => (
                  <div key={field.label} className="adm-settings-field">
                    <span className="adm-settings-label">{field.label}</span>
                    <input
                      type={field.type}
                      className="adm-settings-input"
                      defaultValue={field.value}
                      readOnly
                    />
                  </div>
                ))}
              </div>

              <div className="adm-settings-footer">
                <button type="button" className="adm-btn adm-btn--outline adm-btn--sm">
                  Edit
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
