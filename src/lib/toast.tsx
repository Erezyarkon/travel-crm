import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
interface Toast { id: number; kind: ToastKind; message: string }

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Safe no-op fallback so callers never crash if used outside the provider.
    const noop = () => {}
    return { toast: noop, success: noop, error: noop, info: noop }
  }
  return ctx
}

const KIND_META: Record<ToastKind, { icon: any; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle2, color: '#0F6E56', bg: '#E1F5EE', border: '#5DCAA5' },
  error:   { icon: AlertCircle,  color: '#A32D2D', bg: '#FBEAEA', border: '#E69A9A' },
  info:    { icon: Info,         color: '#185FA5', bg: '#E6F1FB', border: '#85B7EB' },
}

let counter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts(ts => ts.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++counter
    setToasts(ts => [...ts, { id, kind, message }])
    setTimeout(() => remove(id), 3500)
  }, [remove])

  const value: ToastContextValue = {
    toast,
    success: (m) => toast(m, 'success'),
    error: (m) => toast(m, 'error'),
    info: (m) => toast(m, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 4000, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
        {toasts.map(t => {
          const m = KIND_META[t.kind]
          const Icon = m.icon
          return (
            <div key={t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                background: m.bg, border: `0.5px solid ${m.border}`, borderRadius: 10,
                boxShadow: '0 6px 24px rgba(0,0,0,0.12)', animation: 'toastIn 0.22s ease',
                minWidth: 240,
              }}>
              <Icon size={17} color={m.color} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: '#1a1a1a', lineHeight: 1.35 }}>{t.message}</span>
              <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#999', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
