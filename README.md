# REP · Clinical Statistics — Interactive Course Companion

Branded per `../BRAND-STRATEGY.md`: Inference Blue + Signal Teal on cool neutrals, Fraunces/Inter/
IBM Plex Mono, ink hero, semantic data-viz palette (slate = null, blue = effect, teal = power,
coral = α, amber = β), light/dark themes (system default, manual toggle). All colours flow from
`src/theme/tokens.css`; charts resolve them at render time via `src/theme/chart.ts`.

A self-paced, interactive web companion to a clinical-statistics course for early-career clinical
researchers. Concept-first, code-optional: every key idea is something the learner *manipulates*
(sliders, simulations, live plots), with optional R snippets for those who want them.

**All eight modules are live:** 1 (*Why Statistics Matter*), 2 (*Describing Data*), 3 (*Two
Flavours of Probability*), 4 (*From Sample to Inference*), 5 (*Thinking Bayesian*), 6 (*The Linear
Model*), 7 (*Power & Sample Size*) and 8 (*Putting It Together: Critical Appraisal*).

## Stack

React 18 + TypeScript, Vite, MDX for content, Plotly (basic dist) for charts, hash routing
(GitHub-Pages-friendly), an in-repo seedable PRNG (mulberry32 + Box–Muller) so every simulation is
deterministic and testable. No backend, no accounts; self-check and module completion ticks persist
to `localStorage` only.

## Commands

```bash
npm install        # once
npm run dev        # local dev server (http://localhost:5173)
npm run test       # unit tests for the stats core (vitest)
npm run build      # type-check + static production build to dist/
npm run preview    # serve the production build locally
```

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and publishes `dist/` on every push to `main`.
One-time repo setup: **Settings → Pages → Source → GitHub Actions**. The Vite `base` is `'./'` and
routing uses the hash router, so the build works at any subpath with no server configuration.

## How to add a new module

1. **Write the content:** create `src/content/module-0X.mdx`. It's Markdown prose with the shared
   widgets imported at the top — see `module-04.mdx` for the pattern:

   ```mdx
   import { SimulationEngine } from '../components/SimulationEngine'

   ## Section 1 — ...

   <SimulationEngine defaultTrueDiff={0} defaultSd={15} defaultN={40} />
   ```

2. **Register it:** in `src/content/modules.ts`, find the module's entry, flip
   `status: 'coming-soon'` to `'available'`, add its `objectives` array, and point `Component` at
   the file:

   ```ts
   Component: lazy(() => import('./module-0X.mdx')),
   ```

3. Done. Navigation, routing, the home-page card, and prev/next links are all generated from the
   registry.

### Reusable component library

| Component | Purpose |
|---|---|
| `SimulationEngine` | Flagship: simulate many trials, live histogram; `decisionRule` prop adds the Module 7 significance test + power readout |
| `PowerSimulator` | `SimulationEngine` preset with the decision rule on |
| `LiveDistributionPlot` | Histogram/density plot with markers, shading, fixed axes |
| `ParameterSlider` | Labelled slider with live value, keyboard-accessible |
| `CICoveragePlot` | "Dance of the confidence intervals" |
| `TailAreaPlot` | p-value as a shaded tail area of the null distribution |
| `TwoDistributionPowerPlot` | Null + alternative curves with α / β / power shaded |
| `SampleSizeCalculator` | Solve-for-n and solve-for-MDES; continuous and binary modes |
| `PowerCurvePlot` | Power vs n with target-power and required-n reference lines |
| `EffectSizeIllustrator` | Overlapping bell curves + MCID marker + standardised effect |
| `WinnerCurseDemo` | Estimates among significant trials only vs the truth |
| `ReRandomiseDemo` | Re-shuffle the same patients; difference ≠ effect |
| `DiagnosticBayesDemo` | Pre/post-test probability with a 1,000-person breakdown |
| `PriorPosteriorUpdater` | Prior presets + trial data → posterior, credible interval, P(effect) |
| `DraggableRegression` | Drag a line/points, live residuals + SSE, least-squares & re-sample |
| `AdjustmentDemo` | Crude vs adjusted treatment effect under confounding by indication |
| `AnecdoteMachine` | Cherry-pick "success stories" from pure no-treatment noise |
| `DescriptiveExplorer` | Bell/skew/outlier presets with live mean, median, SD, IQR, ±2 SD coverage |
| `OutlierDragDemo` | Draggable dots on a number line; mean vs median tug-of-war |
| `LongRunFrequencyDemo` | Running proportion converging on the truth; streak counter |
| `PaperAbstract` | Journal-styled fictional abstract card for appraisal exercises |
| `AbsoluteRelativeDemo` | Baseline risk × relative risk → ARR and NNT; the spin amplifier |
| `CollapsibleRSnippet` | Collapsed, highlighted, copyable R code (display-only; WebR seam marked) |
| `SelfCheckQuestion` | MCQ with per-option feedback |
| `MisconceptionCallout` | Styled callout (`misconception` / `lens` / `note` variants) |
| `ModuleLayout` | Module shell: objectives, content, completion tick, prev/next nav |

The stats core lives in `src/lib/` (`rng.ts`, `stats.ts`, `simulate.ts`, `power.ts`) and is pure
TypeScript with unit tests in `src/test/` — including acceptance tests that the analytic power
formulae agree with the simulation.
