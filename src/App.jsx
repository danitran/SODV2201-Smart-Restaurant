/**
 * App.jsx — the route table (React Router).
 *
 * Layout routes: <CustomerLayout /> draws the header and footer once and
 * renders the matching child page in its <Outlet />.
 *
 *   /               Home
 *   /menu           Menu (search + filters)
 *   /menu/:itemId   MenuItemDetail (the :itemId part is read with useParams)
 *   /cart           Cart (change quantities, delivery or pickup)
 *   /checkout       Checkout form
 *   /orders/:orderId OrderStatus (confirmation + live tracking)
 *   /reservations   Reservations (tables and special events)
 *   /login, /register  sign in / create an account
 *   /account        Account (protected: signed-in users only)
 *
 *   /admin/...      admin pages inside <AdminLayout /> (protected: role "admin")
 *     /admin/menu   AdminMenu (create, edit, delete dishes, availability, special)
 *   *               NotFound (any URL that matches nothing else)
 */
import { Route, Routes } from 'react-router'
import { AdminLayout } from './components/layout/AdminLayout.jsx'
import { CustomerLayout } from './components/layout/CustomerLayout.jsx'
import { ProtectedRoute } from './components/common/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Account from './pages/Account.jsx'
import AdminMenu from './pages/admin/AdminMenu.jsx'
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
        <Route path="menu" element={<AdminMenu />} />
      </Route>
    </Routes>
  )
}
