import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/theme.css'
import { AppProvider } from './context/AppContext.jsx'
import { SoundProvider } from './context/SoundContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <SoundProvider>
        <App />
      </SoundProvider>
    </AppProvider>
  </React.StrictMode>,
)
