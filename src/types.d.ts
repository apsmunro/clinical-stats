// Untyped third-party chart modules (we use the basic Plotly distribution,
// which ships without TypeScript types).
declare module 'plotly.js-basic-dist-min'
declare module 'react-plotly.js/factory' {
  import * as React from 'react'
  export interface PlotProps {
    data: unknown[]
    layout?: Record<string, unknown>
    config?: Record<string, unknown>
    style?: React.CSSProperties
    useResizeHandler?: boolean
    className?: string
  }
  export default function createPlotlyComponent(plotly: unknown): React.ComponentType<PlotProps>
}

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  const Component: ComponentType
  export default Component
}
