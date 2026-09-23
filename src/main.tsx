import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './theme/ThemeContext'
import './theme/tokens.css'
import './theme/global.css'

// Hash router so deep links work on GitHub Pages without server rewrites.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
