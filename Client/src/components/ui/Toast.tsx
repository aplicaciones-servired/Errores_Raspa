import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ToastContext, type ToastType } from './ToastContext'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ProviderProps {
  children: ReactNode
}

const TOAST_MAX = 4
const TOAST_DURATION = 3500

const toastStyles: Record<ToastType, { icon: string; ring: string; bar: string }> = {
  success: { icon: '✅', ring: 'border-green-300', bar: 'bg-green-500' },
  error: { icon: '❌', ring: 'border-red-300', bar: 'bg-red-500' },
  info: { icon: 'ℹ️', ring: 'border-blue-300', bar: 'bg-blue-500' },
}

export function ToastProvider({ children }: ProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev.slice(-(TOAST_MAX - 1)), { id, message, type }])
      window.setTimeout(() => removeToast(id), TOAST_DURATION)
    },
    [removeToast],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type]
          return (
            <div
              key={toast.id}
              className={`relative overflow-hidden bg-white rounded-lg shadow-lg border ${style.ring} px-4 py-3 animate-[toast-in_0.2s_ease-out]`}
            >
              <div className="flex items-start gap-2">
                <span>{style.icon}</span>
                <span className="text-sm text-gray-800 flex-1">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-gray-400 hover:text-gray-600 text-sm leading-none cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 ${style.bar} toast-bar`} />
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
