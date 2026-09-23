/**
 * PaperAbstract — Module 9's journal-styled abstract card.
 * Purely presentational: the appraisal exercises render a fictional abstract
 * in a believable format (with an unmissable FICTIONAL badge), followed in
 * the MDX by a SelfCheckQuestion asking for the learner's verdict.
 */
export interface PaperAbstractProps {
  /** Trial acronym / headline, e.g. "ZENITH-BP" */
  title: string
  subtitle?: string
  methods: string
  results: string
  conclusion: string
}

export function PaperAbstract({ title, subtitle, methods, results, conclusion }: PaperAbstractProps) {
  return (
    <article className="abstract" aria-label={`Fictional abstract: ${title}`}>
      <div className="abstract__badge" aria-hidden="false">
        Fictional: for appraisal practice
      </div>
      <h3 className="abstract__title">{title}</h3>
      {subtitle && <p className="abstract__subtitle">{subtitle}</p>}
      <dl className="abstract__body">
        <dt>Methods</dt>
        <dd>{methods}</dd>
        <dt>Results</dt>
        <dd>{results}</dd>
        <dt>Conclusion</dt>
        <dd className="abstract__conclusion">“{conclusion}”</dd>
      </dl>
    </article>
  )
}
