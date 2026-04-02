import { useToast } from '../hooks/useToast'

const typeStyles = {
  ok: 'bg-green2/15 border-green2/35 text-green2',
  err: 'bg-red2/15 border-red2/35 text-red2',
  info: 'bg-blue2/15 border-blue2/35 text-blue2',
}

export function Toast() {
  const { message, type, visible } = useToast()

  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg text-sm font-semibold z-50 border transition-all duration-300
        ${typeStyles[type]}
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}
    >
      {message}
    </div>
  )
}
