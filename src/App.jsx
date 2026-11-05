import { Route, Routes } from 'react-router'
import { AdminLayout } from './components/layout/AdminLayout.jsx'
import { CustomerLayout } from './components/layout/CustomerLayout.jsx'
import { ProtectedRoute } from './components/common/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Account from './pages/Account.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminMenu from './pages/admin/AdminMenu.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'
import AdminReservations from './pages/admin/AdminReservations.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Menu from './pages/Menu.jsx'
import MenuItemDetail from './pages/MenuItemDetail.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import OrderStatus from './pages/OrderStatus.jsx'
import Register from './pages/Register.jsx'
import Reservations from './pages/Reservations.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="menu/:itemId" element={<MenuItemDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders/:orderId" element={<OrderStatus />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="reservations" element={<AdminReservations />} />
        <Route path="menu" element={<AdminMenu />} />
      </Route>
    </Routes>
  )
}
