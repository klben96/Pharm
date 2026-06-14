import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import PharmacyApp from './App'
import '../../index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/pharmacy">
      <PharmacyApp />
    </BrowserRouter>
  </React.StrictMode>
)
