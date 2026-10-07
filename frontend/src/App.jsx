import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import OrderSuccess from './pages/OrderSuccess';
import AuthChat from './components/AuthChat';

function RequireAuth({ children }) {
  const { user, initialising } = useAuth();
  const location = useLocation();

  // While the session is still being resolved we must NOT redirect: the JWT is
  // in an HttpOnly cookie, so "no user yet" means "not asked yet". Redirecting
  // here would bounce a signed-in user to /login on every refresh.
  if (initialising) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[#e6eef7] border-t-[#5a8dee] rounded-full animate-spin" />
      </div>
    );
  }

  // Remember where the customer was heading so Login can return them there
  // instead of dumping them on the home page.
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, initialising } = useAuth();
  // Same reasoning as RequireAuth: don't bounce an already-signed-in user to
  // /home before the session check has finished.
  if (initialising) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[#e6eef7] border-t-[#5a8dee] rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Lab 02 */}
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />

        {/* Lab 03 */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />

        {/* Lab 04 — wishlist is protected: it is per-customer data */}
        <Route
          path="/wishlist"
          element={
            <RequireAuth>
              <Wishlist />
            </RequireAuth>
          }
        />

        {/* Lab 05 — cart, then checkout/orders in Lab 06 */}
        <Route
          path="/cart"
          element={
            <RequireAuth>
              <Cart />
            </RequireAuth>
          }
        />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <Checkout />
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <Orders />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireAuth>
              <OrderDetails />
            </RequireAuth>
          }
        />
        <Route
          path="/order-success/:id"
          element={
            <RequireAuth>
              <OrderSuccess />
            </RequireAuth>
          }
        />

        {/* Bonus conversational UI */}
        <Route path="/auth" element={<PublicOnly><AuthChat /></PublicOnly>} />

        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
