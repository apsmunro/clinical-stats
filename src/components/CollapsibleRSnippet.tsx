/**
 * CollapsibleRSnippet — read-only, syntax-highlighted, copyable R code.
 * Collapsed by default. Display only in v1.
 *
 * WebR seam: a future "Run with WebR" button would mount next to the copy
 * button below and stream output into a panel under the <pre>. The snippet
 * component deliberately owns its own footer area for that reason.
 */
import { useState } from 'react'
import { Highlight, Prism, themes } from 'prism-react-renderer'

// Minimal R grammar registered on the vendored Prism instance (the default
// prism-react-renderer bundle does not include R).
;(Prism as unknown as { languages: Record<string, unknown> }).languages.r = {
  comment: /#.*/,
  string: { pattern: /(['"])(?:\\.|(?!\1)[^\\\r\n])*\1/, greedy: true },
  'percent-operator': { pattern: /%[^\s%]*%/, alias: 'operator' },
  boolean: /\b(?:FALSE|TRUE)\b/,
  ellipsis: /\.\.(?:\.|\d+)/,
  number: /(?:\b0x[\dA-Fa-f]+(?:\.\d*)?|\b\d+(?:\.\d*)?|\B\.\d+)(?:[EePp][+-]?\d+)?[iL]?/,
  keyword: /\b(?:NA|NA_character_|NA_complex_|NA_integer_|NA_real_|NULL|break|else|for|function|if|in|next|repeat|while|library|require)\b/,
  operator: /->?>?|<(?:=|<?-)?|[>=!]=?|::?|&&?|\|\|?|[+*\/^$@~]|-/,
  punctuation: /[(){}\[\],;]/,
}

export interface CollapsibleRSnippetProps {
  /** Shown in the collapsed summary row, e.g. "Simulate the null". */
  caption?: string
  /** The R source code (display only). */
  code: string
}

export function CollapsibleRSnippet({ caption, code }: CollapsibleRSnippetProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim())
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable (e.g. non-secure context) — ignore */
    }
  }

  return (
    <details className="r-snippet">
      <summary>
        <span className="r-snippet__badge">R</span>
        {caption ?? 'Optional R code'}
        <span className="r-snippet__hint">(click to expand; entirely optional)</span>
      </summary>
      <div className="r-snippet__body">
        <div className="r-snippet__toolbar">
          <button type="button" className="btn btn--small" onClick={copy}>
            {copied ? '✓ Copied' : 'Copy code'}
          </button>
          {/* WebR seam: future "Run with WebR" button mounts here */}
        </div>
        <Highlight code={code.trim()} language="r" theme={themes.github}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="r-snippet__pre" tabIndex={0}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, j) => (
                    <span key={j} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </details>
  )
}
