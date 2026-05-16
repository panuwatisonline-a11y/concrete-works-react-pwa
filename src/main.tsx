import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupPwaUpdates } from './register-pwa'
import { applyTheme, readStoredTheme } from '@/lib/theme'
import './index.css'
import App from './App.tsx'

applyTheme(readStoredTheme())
setupPwaUpdates()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
