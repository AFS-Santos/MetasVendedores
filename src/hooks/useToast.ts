import { create } from 'zustand'

interface ToastState {
  message: string
  type: 'ok' | 'err' | 'info'
  visible: boolean
  show: (message: string, type?: 'ok' | 'err' | 'info') => void
}

export const useToast = create<ToastState>((set) => ({
  message: '',
  type: 'ok',
  visible: false,
  show: (message, type = 'ok') => {
    set({ message, type, visible: true })
    setTimeout(() => set({ visible: false }), 3000)
  },
}))
