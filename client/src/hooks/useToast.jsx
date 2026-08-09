import { useState } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = (msg, duration = 2500) => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration)
  }

  const ToastContainer = () => (
    <div className="toast-wrap">
      {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
    </div>
  )

  return { toast, ToastContainer }
}
