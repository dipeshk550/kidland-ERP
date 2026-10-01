import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Keep content visible when an uploaded or remote image is unavailable.
document.addEventListener('error', event => {
  const image = event.target
  if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied === 'true') return
  image.dataset.fallbackApplied = 'true'
  event.stopImmediatePropagation()
  image.src = '/images/school-image-fallback.svg'
}, true)

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)