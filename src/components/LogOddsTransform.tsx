/**
 * LogOddsTransform — Module 6, Section 5. Shows, rather than asserts, that the
 * logit takes the bounded probability scale (hard walls at 0 and 1) onto an
 * unbounded continuous scale (−∞ … +∞), and why that lets a linear model live
 * on it. Two views of the SAME mapping, sharing one draggable handle (state p):
 *
 *  • "Two scales" (A): probability and log-odds as parallel number lines with
 *    connectors. Push p toward a wall and its log-odds partner races off the
 *    drawn ±6 axis toward the ∞ arrow and never arrives.
 *  • "The S-curve" (B): the same two scales as the x (log-odds) and y
 *    (probability) of one sigmoid. A straight, unbounded log-odds axis maps
 *    through the curve to a probability that flattens against 0 and 1 without
 *    ever crossing them — the linear model "plotted on the transformed scale".
 *
 * The trial's worked numbers (placebo 40 %, treatment 55 %) sit as fixed markers
 * in both views; the gap between their log-odds is the log-odds difference whose
 * exp is the odds ratio (~1.8) quoted in the prose.
 *
 * SVG + viz tokens + keyboard-accessible handle; no Plotly.
 */
import { useRef, useState } from 'react'
import { NumberReadout } from './NumberReadout'

const W = 620
const H = 300

// ---- view A (two scales) geometry ----
const ML = 64
const MR = 64
const P_Y = 78 // probability axis
const L_Y = 214 // log-odds axis
const LOG_LIM = 6 // drawn range of the log-odds axis; beyond this = the ∞ arrows

// ---- view B (sigmoid) geometry ----
const MT = 22
const MB = 48

const logit = (p: number) => Math.log(p / (1 - p))
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

// A: positions along the two horizontal axes
const px = (p: number) => ML + p * (W - ML - MR)
const lx = (l: number) => ML + ((clamp(l, -LOG_LIM, LOG_LIM) + LOG_LIM) / (2 * LOG_LIM)) * (W - ML - MR)
// B: positions in the sigmoid plot (x = log-odds, y = probability)
const gx = (l: number) => ML + ((clamp(l, -LOG_LIM, LOG_LIM) + LOG_LIM) / (2 * LOG_LIM)) * (W - ML - MR)
const gy = (p: number) => MT + (1 - p) * (H - MT - MB)

const PLACEBO = 0.4
const TREAT = 0.55
const PLINE = 'var(--viz-null)' // placebo marker (reference)
const TLINE = 'var(--viz-signal)' // treatment marker (the effect)
const HLINE = 'var(--primary)' // draggable explore handle

const REF_PS = [0.1, 0.3, 0.5, 0.7, 0.9]
const P_TICKS = [0, 0.25, 0.5, 0.75, 1]
const L_TICKS = [-6, -4, -2, 0, 2, 4, 6]

type Mode = 'scales' | 'curve'

export function LogOddsTransform() {
  const [p, setP] = useState(0.9)
  const [mode, setMode] = useState<Mode>('scales')
  const svgRef = useRef<SVGSVGElement>(null)

  const l = logit(p)
  const offScale = Math.abs(l) > LOG_LIM
  const orDiff = logit(TREAT) - logit(PLACEBO)

  const dragging = useRef(false)
  const setFromPointer = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    if (mode === 'scales') {
      const xUnits = ((e.clientX - rect.left) / rect.width) * W
      setP(clamp((xUnits - ML) / (W - ML - MR), 0.001, 0.999))
    } else {
      const yUnits = ((e.clientY - rect.top) / rect.height) * H
      setP(clamp(1 - (yUnits - MT) / (H - MT - MB), 0.001, 0.999))
    }
  }
  const onMove = (e: React.PointerEvent) => {
    if (dragging.current) setFromPointer(e)
  }
  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.05 : 0.01
    const up = e.key === 'ArrowRight' || e.key === 'ArrowUp'
    const down = e.key === 'ArrowLeft' || e.key === 'ArrowDown'
    if (!up && !down) return
    e.preventDefault()
    setP(clamp(p + (up ? step : -step), 0.001, 0.999))
  }

  // ---------- view A ----------
  const ScalesConnector = ({ prob, colour, width = 2, opacity = 1, dashed = false }: { prob: number; colour: string; width?: number; opacity?: number; dashed?: boolean }) => (
    <line x1={px(prob)} y1={P_Y} x2={lx(logit(prob))} y2={L_Y} stroke={colour} strokeWidth={width} opacity={opacity} strokeDasharray={dashed ? '4 4' : undefined} />
  )

  const scalesView = (
    <>
      {/* probability axis (top) */}
      <text x={ML} y={P_Y - 26} fontSize={13} fontWeight={600} fill="var(--text-muted)">Probability</text>
      <line x1={ML} x2={W - MR} y1={P_Y} y2={P_Y} stroke="var(--border-strong)" strokeWidth={2} />
      {[0, 1].map((b) => (
        <g key={`wall${b}`}>
          <line x1={px(b)} x2={px(b)} y1={P_Y - 12} y2={P_Y + 12} stroke="var(--viz-alpha)" strokeWidth={2.5} />
          <text x={px(b)} y={P_Y - 16} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--viz-alpha)">{b}</text>
        </g>
      ))}
      {P_TICKS.filter((t) => t !== 0 && t !== 1).map((t) => (
        <g key={`pt${t}`}>
          <line x1={px(t)} x2={px(t)} y1={P_Y - 6} y2={P_Y + 6} stroke="var(--border-strong)" strokeWidth={1} />
          <text x={px(t)} y={P_Y - 12} textAnchor="middle" fontSize={11} fill="var(--text-subtle)">{t}</text>
        </g>
      ))}
      <text x={px(0)} y={P_Y + 26} textAnchor="middle" fontSize={11} fill="var(--text-subtle)">wall</text>
      <text x={px(1)} y={P_Y + 26} textAnchor="middle" fontSize={11} fill="var(--text-subtle)">wall</text>

      {/* log-odds axis (bottom) */}
      <text x={ML} y={L_Y + 40} fontSize={13} fontWeight={600} fill="var(--text-muted)">Log-odds</text>
      <line x1={ML} x2={W - MR} y1={L_Y} y2={L_Y} stroke="var(--border-strong)" strokeWidth={2} markerStart="url(#lot-arrowL)" markerEnd="url(#lot-arrowR)" />
      <text x={ML - 10} y={L_Y + 5} textAnchor="end" fontSize={14} fill="var(--text-muted)">−∞</text>
      <text x={W - MR + 10} y={L_Y + 5} textAnchor="start" fontSize={14} fill="var(--text-muted)">+∞</text>
      {L_TICKS.map((t) => (
        <g key={`lt${t}`}>
          <line x1={lx(t)} x2={lx(t)} y1={L_Y - 6} y2={L_Y + 6} stroke="var(--border-strong)" strokeWidth={1} />
          <text x={lx(t)} y={L_Y + 20} textAnchor="middle" fontSize={11} fill="var(--text-subtle)">{t > 0 ? `+${t}` : t}</text>
        </g>
      ))}

      {/* faint reference fan */}
      {REF_PS.map((rp) => (
        <ScalesConnector key={`ref${rp}`} prob={rp} colour="var(--text-subtle)" width={1} opacity={0.28} dashed />
      ))}

      {/* trial markers */}
      <ScalesConnector prob={PLACEBO} colour={PLINE} width={2.5} />
      <ScalesConnector prob={TREAT} colour={TLINE} width={2.5} />
      {[{ prob: PLACEBO, colour: PLINE }, { prob: TREAT, colour: TLINE }].map((m) => (
        <g key={m.prob}>
          <circle cx={px(m.prob)} cy={P_Y} r={5} fill={m.colour} stroke="var(--surface)" strokeWidth={1.5} />
          <circle cx={lx(logit(m.prob))} cy={L_Y} r={5} fill={m.colour} stroke="var(--surface)" strokeWidth={1.5} />
          <text x={lx(logit(m.prob)) + (logit(m.prob) < 0 ? -4 : 4)} y={L_Y - 12} textAnchor={logit(m.prob) < 0 ? 'end' : 'start'} fontSize={11} fontWeight={600} fill={m.colour}>
            {logit(m.prob) >= 0 ? `+${logit(m.prob).toFixed(2)}` : logit(m.prob).toFixed(2)}
          </text>
        </g>
      ))}

      {/* log-odds difference bracket */}
      <line x1={lx(logit(PLACEBO))} x2={lx(logit(TREAT))} y1={L_Y + 32} y2={L_Y + 32} stroke="var(--text-muted)" strokeWidth={1.2} />
      <line x1={lx(logit(PLACEBO))} x2={lx(logit(PLACEBO))} y1={L_Y + 28} y2={L_Y + 32} stroke="var(--text-muted)" strokeWidth={1.2} />
      <line x1={lx(logit(TREAT))} x2={lx(logit(TREAT))} y1={L_Y + 28} y2={L_Y + 32} stroke="var(--text-muted)" strokeWidth={1.2} />
      <text x={(lx(logit(PLACEBO)) + lx(logit(TREAT))) / 2} y={L_Y + 46} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
        Δ = {orDiff.toFixed(2)} → OR = {Math.exp(orDiff).toFixed(1)}
      </text>

      {/* explore handle */}
      <ScalesConnector prob={p} colour={HLINE} width={2.5} />
      <circle
        cx={px(p)} cy={P_Y} r={9} fill={HLINE} stroke="var(--surface)" strokeWidth={2}
        style={{ cursor: 'ew-resize' }} tabIndex={0} role="slider"
        aria-label="Drag to set a probability and see its log-odds"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}
        aria-valuetext={`probability ${(p * 100).toFixed(0)} percent, log-odds ${l.toFixed(2)}`}
        onPointerDown={(e) => { dragging.current = true; (e.target as Element).setPointerCapture(e.pointerId) }}
        onKeyDown={onKey}
      />
      <circle cx={lx(l)} cy={L_Y} r={7} fill={HLINE} stroke="var(--surface)" strokeWidth={2} opacity={offScale ? 0.5 : 1} />
      {offScale && (
        <text x={lx(l)} y={L_Y - 12} textAnchor="middle" fontSize={11} fontWeight={700} fill={HLINE}>
          {l > 0 ? 'heading to +∞' : 'heading to −∞'}
        </text>
      )}
    </>
  )

  // ---------- view B ----------
  const sigmoidPath = (() => {
    const pts: string[] = []
    for (let x = -LOG_LIM; x <= LOG_LIM + 1e-9; x += 0.25) {
      pts.push(`${gx(x).toFixed(1)},${gy(sigmoid(x)).toFixed(1)}`)
    }
    return 'M' + pts.join(' L')
  })()

  const curveView = (
    <>
      {/* upper asymptote wall at p = 1 (the lower one, p = 0, is the x-axis itself) */}
      <line x1={ML} x2={W - MR} y1={gy(1)} y2={gy(1)} stroke="var(--viz-alpha)" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.8} />
      <text x={W - MR} y={gy(1) - 6} textAnchor="end" fontSize={10.5} fontWeight={600} fill="var(--viz-alpha)">never reaches 1</text>
      <text x={ML + 8} y={gy(0) - 7} textAnchor="start" fontSize={10.5} fontWeight={600} fill="var(--viz-alpha)">never reaches 0</text>

      {/* y axis: probability */}
      <text x={ML - 44} y={(MT + gy(0)) / 2} fontSize={13} fontWeight={600} fill="var(--text-muted)" transform={`rotate(-90 ${ML - 44} ${(MT + gy(0)) / 2})`} textAnchor="middle">Probability</text>
      <line x1={ML} x2={ML} y1={MT} y2={gy(0)} stroke="var(--border-strong)" strokeWidth={1.5} />
      {P_TICKS.map((t) => (
        <g key={`gyt${t}`}>
          <line x1={ML - 5} x2={ML} y1={gy(t)} y2={gy(t)} stroke="var(--border-strong)" strokeWidth={1} />
          <text x={ML - 9} y={gy(t) + 4} textAnchor="end" fontSize={11} fill="var(--text-subtle)">{t}</text>
        </g>
      ))}

      {/* x axis: log-odds, drawn at p = 0.5 so the ∞ arrows read as the unbounded predictor */}
      <line x1={ML} x2={W - MR} y1={gy(0)} y2={gy(0)} stroke="var(--border-strong)" strokeWidth={1.5} markerStart="url(#lot-arrowL)" markerEnd="url(#lot-arrowR)" />
      <text x={(ML + W - MR) / 2} y={gy(0) + 38} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--text-muted)">Log-odds (the linear predictor a + b × treated)</text>
      <text x={ML - 10} y={gy(0) + 5} textAnchor="end" fontSize={14} fill="var(--text-muted)">−∞</text>
      <text x={W - MR + 10} y={gy(0) + 5} textAnchor="start" fontSize={14} fill="var(--text-muted)">+∞</text>
      {L_TICKS.filter((t) => t !== 0).map((t) => (
        <text key={`gxt${t}`} x={gx(t)} y={gy(0) + 18} textAnchor="middle" fontSize={11} fill="var(--text-subtle)">{t > 0 ? `+${t}` : t}</text>
      ))}

      {/* the sigmoid */}
      <path d={sigmoidPath} fill="none" stroke="var(--viz-signal)" strokeWidth={2.5} />

      {/* trial markers on the curve */}
      {[{ prob: PLACEBO, colour: PLINE }, { prob: TREAT, colour: TLINE }].map((m) => (
        <g key={m.prob}>
          <line x1={gx(logit(m.prob))} x2={gx(logit(m.prob))} y1={gy(m.prob)} y2={gy(0)} stroke={m.colour} strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
          <circle cx={gx(logit(m.prob))} cy={gy(m.prob)} r={5} fill={m.colour} stroke="var(--surface)" strokeWidth={1.5} />
        </g>
      ))}

      {/* shared handle, riding the curve */}
      <line x1={gx(l)} x2={gx(l)} y1={gy(p)} y2={gy(0)} stroke={HLINE} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />
      <line x1={ML} x2={gx(l)} y1={gy(p)} y2={gy(p)} stroke={HLINE} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />
      <circle
        cx={gx(l)} cy={gy(p)} r={9} fill={HLINE} stroke="var(--surface)" strokeWidth={2}
        style={{ cursor: 'ns-resize' }} tabIndex={0} role="slider"
        aria-label="Drag up or down the S-curve to set a probability and see its log-odds"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}
        aria-valuetext={`probability ${(p * 100).toFixed(0)} percent, log-odds ${l.toFixed(2)}`}
        onPointerDown={(e) => { dragging.current = true; (e.target as Element).setPointerCapture(e.pointerId) }}
        onKeyDown={onKey}
      />
      {offScale && (
        <text x={gx(l)} y={gy(p) + (l > 0 ? -14 : 20)} textAnchor="middle" fontSize={11} fontWeight={700} fill={HLINE}>
          {l > 0 ? 'log-odds → +∞, p flattens below 1' : 'log-odds → −∞, p flattens above 0'}
        </text>
      )}
    </>
  )

  return (
    <div className="widget" data-widget="logodds-transform">
      <div className="widget__runbar">
        <div className="btn-group" role="group" aria-label="View">
          <span className="btn-group__label">View:</span>
          <button type="button" className={`btn btn--toggle${mode === 'scales' ? ' is-active' : ''}`} aria-pressed={mode === 'scales'} onClick={() => setMode('scales')}>
            Two scales
          </button>
          <button type="button" className={`btn btn--toggle${mode === 'curve' ? ' is-active' : ''}`} aria-pressed={mode === 'curve'} onClick={() => setMode('curve')}>
            The S-curve
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={
          mode === 'scales'
            ? 'Probability from 0 to 1 on top and log-odds from minus to plus infinity below, with connectors showing the logit mapping; placebo 40 percent and treatment 55 percent marked.'
            : 'A sigmoid curve mapping the unbounded log-odds on the x-axis to a probability on the y-axis that flattens against 0 and 1 without crossing them; placebo 40 percent and treatment 55 percent marked.'
        }
        style={{ width: '100%', height: 'auto', touchAction: 'none' }}
        onPointerMove={onMove}
        onPointerUp={() => (dragging.current = false)}
        onPointerLeave={() => (dragging.current = false)}
      >
        <defs>
          <marker id="lot-arrowR" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto">
            <path d="M1,1 L9,5 L1,9 Z" fill="var(--border-strong)" />
          </marker>
          <marker id="lot-arrowL" markerWidth="10" markerHeight="10" refX="3" refY="5" orient="auto">
            <path d="M9,1 L1,5 L9,9 Z" fill="var(--border-strong)" />
          </marker>
        </defs>
        {mode === 'scales' ? scalesView : curveView}
      </svg>

      <p className="widget__note">
        {mode === 'scales' ? (
          <>
            Drag the <strong style={{ color: HLINE }}>blue dot</strong> along the probability scale
            (or focus it and use ←/→, Shift for bigger steps). Push it toward 0 or 1 and watch its
            partner on the log-odds scale race outward: the walls at 0 and 1 unfold into a line with
            no ends.
          </>
        ) : (
          <>
            Same mapping, now as one curve: log-odds runs left–right (unbounded), probability runs
            bottom–top (penned between 0 and 1). Drag the <strong style={{ color: HLINE }}>blue dot</strong> up
            and down the S-curve — as the log-odds shoots toward ±∞, the probability only ever
            <em> flattens</em> against the walls, never crossing them. That is how a straight-line
            predictor stays a valid probability.
          </>
        )}
      </p>

      <div className="widget__readouts">
        <NumberReadout label="Probability" value={`${(p * 100).toFixed(0)}%`} sub="bounded: can never leave 0–1" />
        <NumberReadout
          label="Log-odds = ln(p / (1 − p))"
          value={offScale ? (l > 0 ? '> +6' : '< −6') : `${l >= 0 ? '+' : ''}${l.toFixed(2)}`}
          sub={offScale ? 'off the drawn scale, sprinting to ±∞' : 'unbounded: stretches to ±∞ at the walls'}
          tone="accent"
        />
        <NumberReadout label="Trial log-odds difference" value={`${orDiff.toFixed(2)}`} sub={`exp(${orDiff.toFixed(2)}) = odds ratio ${Math.exp(orDiff).toFixed(1)}`} />
      </div>
    </div>
  )
}
