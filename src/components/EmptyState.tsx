import React from 'react'

export default function EmptyState({
  icon: Icon, title, hint, action, compact,
}: {
  icon: any
  title: string
  hint?: string
  action?: { label: string; onClick: () => void }
  compact?: boolean
}) {
  return (
    <div style={{ padding: compact ? '22px 16px' : '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 7 : 10 }}>
      <div style={{ width: compact ? 40 : 56, height: compact ? 40 : 56, borderRadius: '50%', background: '#f4f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={compact ? 19 : 26} color="#c2cbd4" />
      </div>
      <div style={{ fontSize: compact ? 13 : 15, fontWeight: 600, color: '#5a6470' }}>{title}</div>
      {hint && <div style={{ fontSize: compact ? 11 : 12.5, color: '#9aa4b0', maxWidth: 300, lineHeight: 1.4 }}>{hint}</div>}
      {action && (
        <button onClick={action.onClick}
          style={{ marginTop: 4, background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 8, padding: compact ? '7px 14px' : '9px 18px', cursor: 'pointer', fontWeight: 600, fontSize: compact ? 12 : 13 }}>
          {action.label}
        </button>
      )}
    </div>
  )
}
