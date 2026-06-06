import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n.ts'
import { FontSizeProvider } from './contexts/FontSizeContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FontSizeProvider>
      <App />
    </FontSizeProvider>
  </React.StrictMode>,
)
