/**
 * LiveDistributionPlot — the shared distribution chart used by every module.
 *
 * Renders either:
 *  - `groups`: one or more sets of raw values, binned into a stacked histogram
 *    with shared bin edges (e.g. significant vs non-significant trials), and/or
 *  - `densities`: smooth analytic curves, optionally filled to zero (used for
 *    the two-distribution power picture and the effect-size illustrator).
 *
 * Plus overlays: vertical marker lines (`vlines`) and shaded vertical bands
 * (`shades`). The x-axis range is FIXED by the caller so the learner perceives
 * the distribution widening/narrowing rather than the axes rescaling.
 *
 * Styling comes from the brand chart theme (src/theme/chart.ts): transparent
 * backgrounds, hairline grid, outside ticks, 1px bar gaps, 250ms morphs, and
 * the fixed semantic colour vocabulary.
 */
import { useMemo } from 'react'
import { Plot } from './Plot'
import { histogram } from '../lib/stats'
import { useChartTheme } from '../theme/chart'

export interface VLine {
  x: number
  label?: string
  color?: string
  dash?: 'solid' | 'dash' | 'dot'
}

export interface ShadeBand {
  from: number
  to: number
  color: string // rgba fill
}

export interface HistogramGroup {
  values: number[]
  name?: string
  color?: string
}

export interface DensityTrace {
  x: number[]
  y: number[]
  name?: string
  color?: string
  /** Fill the area under the curve (used for α / β / power regions). */
  fill?: boolean
  fillColor?: string
  showLegend?: boolean
}

export interface LiveDistributionPlotProps {
  groups?: HistogramGroup[]
  densities?: DensityTrace[]
  vlines?: VLine[]
  shades?: ShadeBand[]
  /** Fixed x range — required, so re-runs don't rescale the axes. */
  xRange: [number, number]
  bins?: number // histogram bin count, default 60
  xLabel?: string
  yLabel?: string
  title?: string
  height?: number // px, default 340
  /** Plain-text summary for screen readers / non-visual access. */
  caption?: string
  showLegend?: boolean
}

export function LiveDistributionPlot({
  groups,
  densities,
  vlines = [],
  shades = [],
  xRange,
  bins = 60,
  xLabel,
  yLabel,
  title,
  height = 340,
  caption,
  showLegend = false,
}: LiveDistributionPlotProps) {
  const t = useChartTheme()

  const data = useMemo(() => {
    const traces: unknown[] = []
    if (groups) {
      for (const g of groups) {
        const h = histogram(g.values, xRange[0], xRange[1], bins)
        traces.push({
          type: 'bar',
          x: h.centers,
          y: h.counts,
          width: h.binWidth,
          name: g.name,
          marker: {
            color: g.color ?? t.viz.signal,
            line: { width: 1, color: t.viz.surface }, // 1px gaps between bars
          },
          hoverinfo: 'x+y',
          showlegend: showLegend && !!g.name,
        })
      }
    }
    if (densities) {
      for (const d of densities) {
        traces.push({
          type: 'scatter',
          mode: 'lines',
          x: d.x,
          y: d.y,
          name: d.name,
          line: { color: d.color ?? t.viz.signal, width: 2.5 },
          fill: d.fill ? 'tozeroy' : 'none',
          fillcolor: d.fillColor,
          hoverinfo: 'skip',
          showlegend: showLegend && (d.showLegend ?? !!d.name),
        })
      }
    }
    return traces
  }, [groups, densities, xRange, bins, showLegend, t])

  const layout = useMemo(() => {
    const shapes: unknown[] = []
    const annotations: unknown[] = []
    for (const s of shades) {
      shapes.push({
        type: 'rect', xref: 'x', yref: 'paper',
        x0: s.from, x1: s.to, y0: 0, y1: 1,
        fillcolor: s.color, line: { width: 0 }, layer: 'below',
      })
    }
    vlines.forEach((v, i) => {
      shapes.push({
        type: 'line', xref: 'x', yref: 'paper',
        x0: v.x, x1: v.x, y0: 0, y1: 1,
        line: { color: v.color ?? t.viz.alpha, width: 1.5, dash: v.dash ?? 'solid' },
      })
      if (v.label) {
        annotations.push({
          x: v.x, y: 1.02 - (i % 2) * 0.1, xref: 'x', yref: 'paper',
          text: v.label, showarrow: false,
          font: { ...t.font, size: 11.5, color: v.color ?? t.viz.alpha },
          yanchor: 'bottom',
        })
      }
    })
    const base = t.base as Record<string, Record<string, unknown>>
    // With a legend, reserve a real row for it below the tick labels and
    // x-axis title (legend y is in plot-area units, so convert from pixels).
    const marginT = title ? 44 : 28
    const marginB = showLegend ? 92 : 44
    const legendY = -(56 / Math.max(height - marginT - marginB, 1))
    return {
      ...t.base,
      title: title ? { text: title, font: { ...t.font, size: 15 } } : undefined,
      barmode: 'stack',
      bargap: 0,
      margin: { l: 52, r: 16, t: marginT, b: marginB },
      xaxis: { ...base.xaxis, title: { text: xLabel, font: t.font, standoff: 8 }, range: xRange },
      yaxis: { ...base.yaxis, title: { text: yLabel, font: t.font }, rangemode: 'tozero' },
      showlegend: showLegend,
      legend: { orientation: 'h', y: legendY, yanchor: 'top', font: t.font },
      shapes,
      annotations,
      height,
    }
  }, [shades, vlines, title, xLabel, yLabel, xRange, showLegend, height, t])

  return (
    <figure className="dist-plot" role="img" aria-label={caption ?? title ?? 'Distribution plot'}>
      <Plot
        data={data as unknown[]}
        layout={layout as Record<string, unknown>}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        useResizeHandler
      />
      {caption && <figcaption className="visually-hidden">{caption}</figcaption>}
    </figure>
  )
}
