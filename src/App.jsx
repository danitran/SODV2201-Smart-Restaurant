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
 *   *               NotFound (any URL that matches nothing else)
 */
import { Route, Routes } from 'react-router'
import { CustomerLayout } from './components/layout/CustomerLayout.jsx'
import Home from './pages/Home.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Menu from './pages/Menu.jsx'
import MenuItemDetail from './pages/MenuItemDetail.jsx'
import NotFound from './pages/NotFound.jsx'
import OrderStatus from './pages/OrderStatus.jsx'

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
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
