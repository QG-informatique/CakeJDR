'use client'
import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  fallbackRender?: (args: { error: Error; reset: () => void }) => React.ReactNode
}

interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackRender && this.state.error) {
        const reset = () => this.setState({ hasError: false, error: null })
        return this.props.fallbackRender({ error: this.state.error, reset })
      }
      return this.props.fallback ?? (
        <div className="p-4 text-red-500">Something went wrong.</div>
      )
    }
    return this.props.children
  }
}

