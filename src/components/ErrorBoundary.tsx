import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  section?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.section ? `: ${this.props.section}` : ''}]`, error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="bg-red2/5 border border-red2/20 rounded-xl p-4 text-center">
          <div className="text-red2 text-sm font-semibold mb-1">
            Erro ao carregar {this.props.section || 'seção'}
          </div>
          <div className="text-xs text-muted2">
            {this.state.error?.message || 'Erro desconhecido'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-3 py-1 rounded-md bg-surface2 text-xs text-muted2 border border-border hover:text-text transition-all"
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
