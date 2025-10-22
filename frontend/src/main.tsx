import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Load browser polyfills before any other imports
import './polyfills'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
