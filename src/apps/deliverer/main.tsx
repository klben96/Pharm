import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import DelivererApp from './App'
import '../../index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/deliverer">
      <DelivererApp />
    </BrowserRouter>
  </React.StrictMode>
)
