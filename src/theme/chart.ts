/**
 * Chart theme — resolves the brand's CSS tokens at render time so every
 * Plotly figure (and inline SVG) stays in sync with light/dark mode.
 * Semantic colour vocabulary is fixed course-wide (BRAND-STRATEGY §4/§8):
 *   null/non-significant = slate · signal/effect = Inference Blue ·
 *   power/significant = Signal Teal · α/misses = coral · β/caution = amber.
 */
import { useMemo } from 'react'
import { useTheme } from './ThemeContext'

export interface VizColors {
  null_: string
  signal: string
  power: string
  alpha: string
  beta: string
  grid: string
  axis: string
  text: string
  muted: string
  surface: string
  ink: string
  purple: string
  sky: string
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function resolveViz(): VizColors {
  return {
    null_: cssVar('--viz-null'),
    signal: cssVar('--viz-signal'),
    power: cssVar('--viz-power'),
    alpha: cssVar('--viz-alpha'),
    beta: cssVar('--viz-beta'),
    grid: cssVar('--viz-grid'),
    axis: cssVar('--viz-axis'),
    text: cssVar('--viz-text'),
    muted: cssVar('--text-subtle'),
    surface: cssVar('--surface'),
    ink: cssVar('--text'),
    purple: cssVar('--viz-c5'),
    sky: cssVar('--viz-c6'),
  }
}

/** hex (#RRGGBB) → rgba string at the given opacity. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export interface ChartTheme {
  viz: VizColors
  font: { family: string; size: number; color: string }
  /** Base Plotly layout (§8): transparent, fine grid, outside ticks, morphs. */
  base: Record<string, unknown>
}

export function useChartTheme(): ChartTheme {
  const { dark } = useTheme()
  return useMemo(() => {
    const viz = resolveViz()
    const font = { family: 'Inter, system-ui, sans-serif', size: 13, color: viz.text }
    const axis = {
      gridcolor: viz.grid,
      zeroline: false,
      linecolor: viz.axis,
      ticks: 'outside',
      tickcolor: viz.axis,
      fixedrange: true,
    }
    return {
      viz,
      font,
      base: {
        font,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 52, r: 16, t: 24, b: 44 },
        xaxis: { ...axis },
        yaxis: { ...axis },
        hoverlabel: {
          bgcolor: dark ? '#16213A' : '#0C1322',
          font: { color: '#FFFFFF', family: 'Inter, sans-serif' },
        },
        showlegend: false,
        transition: { duration: 250, easing: 'cubic-in-out' },
      },
    }
  }, [dark])
}
