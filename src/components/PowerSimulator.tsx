/**
 * PowerSimulator — Module 8's priority widget.
 *
 * This is exactly the Module 4 SimulationEngine with its decision-rule seam
 * switched on: every simulated trial gets a significance test, significant
 * trials are coloured, and the headline readout is "Power ≈ XX%".
 */
import { SimulationEngine } from './SimulationEngine'

export interface PowerSimulatorProps {
  defaultEffect?: number // default 5 (the MCID)
  defaultSd?: number // default 15
  defaultN?: number // default 40
  defaultAlpha?: number // default 0.05
  nTrialsOptions?: number[]
  seed?: number
}

export function PowerSimulator({
  defaultEffect = 5,
  defaultSd = 15,
  defaultN = 40,
  defaultAlpha = 0.05,
  nTrialsOptions = [1, 100, 1000, 10000],
  seed = 90210,
}: PowerSimulatorProps) {
  return (
    <SimulationEngine
      decisionRule
      defaultTrueDiff={defaultEffect}
      defaultSd={defaultSd}
      defaultN={defaultN}
      defaultAlpha={defaultAlpha}
      nTrialsOptions={nTrialsOptions}
      seed={seed}
      trueDiffLabel="True effect (set it to your MCID)"
    />
  )
}
