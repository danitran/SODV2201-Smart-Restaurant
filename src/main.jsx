import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.jsx'
import { ToastProvider } from './context/ToastProvider.jsx'
import { RestaurantProvider } from './context/RestaurantProvider.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import { CartProvider } from './context/CartProvider.jsx'
import '@fontsource/caprasimo'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <RestaurantProvider>
          <AuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AuthProvider>
        </RestaurantProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
