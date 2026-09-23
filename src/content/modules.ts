/**
 * Module registry: the single source of truth for navigation and routing.
 *
 * To add a module: create `module-0X.mdx` in this folder, then flip its entry
 * here to `status: 'available'` and point `load` at the file. Nothing else.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export interface ModuleMeta {
  id: number
  slug: string
  title: string
  blurb: string
  status: 'available' | 'coming-soon'
  /** Learning objectives shown by ModuleLayout at the top of the module. */
  objectives?: string[]
  Component?: LazyExoticComponent<ComponentType>
}

export const modules: ModuleMeta[] = [
  {
    id: 1,
    slug: 'why-statistics-matter',
    title: 'Why Statistics Matter',
    blurb: 'Why clinical research needs statistics at all, and why it is so often done badly.',
    status: 'available',
    objectives: [
      'Explain why individual variation makes anecdote, impression, and authority unreliable guides to whether a treatment works.',
      'Distinguish the three ways clinical research misleads (chance, bias, and misinterpretation) and say which of them statistics can and cannot fix.',
      'Describe what statistics is for (quantifying uncertainty) and what it is not (a truth machine, or a ritual stamp of approval).',
      'State, in one sentence, what an MCID is: the smallest difference that would actually matter to patients, and why it must be written down before a study.',
      'Understand the common trap: "feasibility is king, science gets shoe-horned in afterwards", and say what doing it the right way round looks like.',
    ],
    Component: lazy(() => import('./module-01.mdx')),
  },
  {
    id: 2,
    slug: 'describing-data',
    title: 'Describing Data',
    blurb: 'Summarising data honestly. Means, medians, spread, and why variance is king.',
    status: 'available',
    objectives: [
      'Choose and interpret the right middle: mean vs median, and how outliers and skew pull them apart.',
      'Interpret the standard deviation in plain language ("a typical distance from the mean") and use the rough ±2 SD covers ~95% rule for normal distribution, bell-shaped data.',
      'Recognise common shapes of clinical data (symmetric, skewed, outlier-contaminated) and match each to honest summary statistics (mean ± SD vs median + IQR).',
      'Explain why variation, not the average, is the central obstacle of clinical research (variance is king), and give a clinical example.',
      'Spot dishonest or lazy summaries in papers (mean ± SD on skewed data; the missing denominator; "average patient" reasoning).',
    ],
    Component: lazy(() => import('./module-02.mdx')),
  },
  {
    id: 3,
    slug: 'two-flavours-of-probability',
    title: 'Two Philosophies of Probability',
    blurb: 'Frequentist and Bayesian thinking: the two philosophies behind every analysis.',
    status: 'available',
    objectives: [
      'Explain why the meaning of probability is the most practical question in the course: every clinical result (p-value, confidence interval, risk ratio) is a probability statement, so using the numbers means knowing what they mean.',
      'State the frequentist meaning of probability (a long-run proportion under repetition) and recognise where it applies naturally: coins, screening programmes, repeated sampling.',
      'State the Bayesian meaning (a degree of belief about a one-off fact) and recognise where it applies naturally: this patient, this hypothesis, this trial.',
      'Understand the law of large numbers: short runs vary widely, long runs converge, and say why that makes small studies unreliable.',
      'Identify two classic illusions of randomness: the gambler\'s fallacy and cluster blindness (streaks happen), and say what they do to clinical intuition.',
      'Classify everyday clinical-research statements by philosophy, and explain why the two schools of inference (Modules 4 and 5) often answer different questions rather than competing for one.',
      'Explain the historical and computational reason clinical statistics reports P(data | hypothesis) rather than the P(hypothesis | data) we actually want.',
    ],
    Component: lazy(() => import('./module-03.mdx')),
  },
  {
    id: 4,
    slug: 'sample-to-inference',
    title: 'From Sample to Inference',
    blurb: 'Sampling distributions, standard error, confidence intervals and p-values: the core of inference.',
    status: 'available',
    objectives: [
      'Explain why a single sample gives only an estimate, and what sampling variation is.',
      'Build and read a sampling distribution by simulation.',
      'Define the standard error and explain what makes it smaller or larger.',
      'Correctly interpret a confidence interval, and state plainly what it does not mean.',
      'Define a p-value correctly, explain the logic of null-hypothesis significance testing (NHST), and recognise the common misinterpretations.',
      'State what statistical inference does not tell you.',
    ],
    Component: lazy(() => import('./module-04.mdx')),
  },
  {
    id: 5,
    slug: 'thinking-bayesian',
    title: 'Thinking Bayesian',
    blurb: 'Priors, posteriors and credible intervals: the other way to reason from data.',
    status: 'available',
    objectives: [
      "State Bayes' theorem in plain language and recognise it as the formal version of everyday diagnostic reasoning (pre-test probability → test result → post-test probability).",
      'Define prior, likelihood, and posterior, and explain how they combine.',
      'Update a prior with trial data and read conclusions off the posterior distribution.',
      'Correctly interpret a 95% credible interval, and articulate precisely how it differs from the confidence interval of Module 4.',
      'Explain how the choice of prior affects conclusions, why that is a feature rather than cheating, and what a sensitivity analysis is for.',
      'Explain why "p = 0.03" does not mean "97% chance the drug works", and compute what the data do imply under a stated prior.',
    ],
    Component: lazy(() => import('./module-05.mdx')),
  },
  {
    id: 6,
    slug: 'the-linear-model',
    title: 'The Linear Model',
    blurb: 'One model to rule them all! Regression, adjustment, and estimating effect sizes.',
    status: 'available',
    objectives: [
      'Recognise the two-group comparison as a linear model (outcome = intercept + coefficient × group) and read the treatment effect as a coefficient.',
      'Interpret an intercept and a slope in real units, and explain least squares as minimising squared residuals.',
      "Attach confidence intervals and p-values to coefficients, reusing Module 4's machinery (every coefficient has a standard error and a sampling distribution).",
      'Explain adjustment: what "adjusted for age and baseline BP" means, how confounding distorts crude comparisons, and what adjustment can and cannot fix.',
      'Locate the effect sizes for binary outcomes (risk difference, risk ratio, odds ratio) in the same model family: logistic regression.',
      "State the model's assumptions in plain terms, say which ones matter most, and explain why residual variance matters (variance is king).",
    ],
    Component: lazy(() => import('./module-06.mdx')),
  },
  {
    id: 7,
    slug: 'one-model-many-tests',
    title: 'One Model, Many Tests',
    blurb: 'Correlation, t-tests, ANOVA, the non-parametric tests and GLMs are all the same linear model.',
    status: 'available',
    objectives: [
      'Explain the central claim: almost every classical statistical test is a special case of the linear model, fixed by three choices — what the predictor is, whether you use ranks, and which link function applies.',
      'Recognise Pearson correlation as a standardised regression slope, and read r as "the slope when both axes are in standard deviations".',
      'Recognise the t-test and one-way ANOVA as a single linear model with a categorical predictor (dummy coding), and interpret the intercept and coefficients as group means and differences.',
      'Explain how the non-parametric tests (Spearman, Mann–Whitney/Wilcoxon) are the same linear models run on the ranks of the data, and state honestly where this is exact and where it is a close approximation.',
      'Describe generalised linear models (GLMs) as "the same linear predictor plus a link function", with logistic (binary) and Poisson (counts) as the everyday examples.',
      'Use the equivalence to appraise any named test as an estimate with a confidence interval, not just a p-value verdict.',
    ],
    Component: lazy(() => import('./module-07.mdx')),
  },
  {
    id: 8,
    slug: 'power-and-sample-size',
    title: 'Designing Research: Power & Sample Size',
    blurb: 'How big a study do you need? Effect sizes, the MCID, power, and why underpowered studies mislead.',
    status: 'available',
    objectives: [
      'Define an effect size and explain why "the difference worth detecting" must be chosen before a study (and is a clinical judgement, not a statistical one).',
      'Define the minimum clinically important difference (MCID), explain why a study should be powered on it, and apply it both when designing a study and when appraising one.',
      'Define statistical power in plain language and as P(detect | effect is real) = 1 − β.',
      'Describe the four interlocking quantities (effect size, variability, sample size, and significance threshold) and how changing one trades off against the others.',
      'Use these to estimate the sample size needed for a target power, and conversely the minimum detectable effect for a fixed sample size.',
      'Explain why underpowered studies are wasteful and can be actively misleading (missed effects and exaggerated ones).',
      'Recognise the post-hoc power fallacy and other common traps.',
    ],
    Component: lazy(() => import('./module-08.mdx')),
  },
  {
    id: 9,
    slug: 'critical-appraisal',
    title: 'Putting It Together: Critical Appraisal',
    blurb: 'Reading the methods section like a reviewer: everything from Modules 1–8, applied.',
    status: 'available',
    objectives: [
      'Frame an appraisal with the three-step method — (1) what was the question, (2) does the study answer it (right design, then clean execution), (3) does it apply to me — and identify which step any given flaw belongs to.',
      'Pin down a study\'s question: PICO for trials; descriptive-vs-inferential and causal-vs-predictive for observational designs; anchored to a pre-named MCID.',
      'Match a clinical question to its gold-standard design, distinguishing a wrong-design flaw (Step 2a) from a poor-execution flaw (Step 2b).',
      'Apply a structured appraisal sequence to a clinical paper: comparison → measurement → powered for what? → confidence interval → absolute effect size → spin scan.',
      'Judge whether a null result is informative (powered on a defensible MCID) or merely absence of evidence, and defend the verdict with the CI.',
      "Treat small-but-significant results with appropriate caution, citing the winner's curse (Module 8) and prior plausibility (Module 5).",
      'Convert relative effects into absolute terms (ARR and NNT from the baseline risk) and explain why headlines prefer the relative version.',
      'Recognise the standard spin vocabulary and statistical red flags ("trend toward significance", post-hoc power, rescued subgroups, OR sold as RR).',
      'Assess external validity — are these patients like mine, is the intervention feasible, can I persuade others — and explain the internal/external-validity trade-off between RCTs and registries.',
      'State clearly what statistics certifies and what it cannot, and where design and clinical judgement must take over.',
    ],
    Component: lazy(() => import('./module-09.mdx')),
  },
]

export function moduleBySlug(slug: string): ModuleMeta | undefined {
  return modules.find((m) => m.slug === slug)
}

export function neighbours(id: number): { prev?: ModuleMeta; next?: ModuleMeta } {
  const sorted = [...modules].sort((a, b) => a.id - b.id)
  const i = sorted.findIndex((m) => m.id === id)
  return { prev: i > 0 ? sorted[i - 1] : undefined, next: i < sorted.length - 1 ? sorted[i + 1] : undefined }
}
