import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App, registerDefaultPanels } from '@/app'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

registerDefaultPanels()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
