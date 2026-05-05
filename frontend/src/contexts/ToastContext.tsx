import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastVariant,
} from '@/components/ui/toast'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextType {
  toast: (input: { title: string; description?: string; variant?: ToastVariant }) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function AppToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(({ title, description, variant = 'default' }: { title: string; description?: string; variant?: ToastVariant }) => {
    const id = crypto.randomUUID()
    setItems((prev) => [...prev, { id, title, description, variant }])
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      <ToastProvider>
        {children}
        {items.map((item) => (
          <Toast key={item.id} open onOpenChange={(open) => !open && dismiss(item.id)} variant={item.variant} duration={3500}>
            <div className="grid gap-1">
              <ToastTitle>{item.title}</ToastTitle>
              {item.description ? <ToastDescription>{item.description}</ToastDescription> : null}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within AppToastProvider')
  }
  return context
}
