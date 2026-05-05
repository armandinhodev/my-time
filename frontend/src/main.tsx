import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppToastProvider } from '@/contexts/ToastContext'
import { AppRouter } from '@/components/AppRouter'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppToastProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </AppToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
