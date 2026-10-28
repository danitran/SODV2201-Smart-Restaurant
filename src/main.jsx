/**
 * main.jsx — entry point (Vite's version of index.js).
 *
 * The providers wrap <App /> so every component can reach shared state
 * with a hook instead of passing props through many levels:
 *
 *   BrowserRouter       URL ↔ page (React Router)
 *   ToastProvider       pop-up messages             → useToast()
 *   RestaurantProvider  menu, orders, reservations  → useRestaurant()
 *   AuthProvider        signed-in user              → useAuth()
 *   CartProvider        shopping cart               → useCart()  (needs the menu, so it sits inside RestaurantProvider)
 */
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
