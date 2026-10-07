import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import OrderCard from '../components/OrderCard';

export default function Orders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/orders');
      // { success, count, orders } — always the authenticated user's orders
      if (mounted.current) setOrders(data.orders ?? []);
    } catch (err) {
      if (mounted.current) {
        setError(err.response?.data?.message || 'We could not load your orders.');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] flex items-center justify-center px-4">
        <div className="bg-white rounded-[32px] border border-[#eef3f9] p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-[#f4f7fb] flex items-center justify-center mx-auto text-2xl">
            🔒
          </div>
          <p className="mt-4 text-[16px] font-bold text-[#4a5f78]">Please log in to see your orders</p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[28px] font-bold tracking-tight text-[#4a5f78]">My Orders</h1>
          <p className="text-[14px] text-[#7c9cb6]">
            {loading ? 'Loading your orders…' : `${orders.length} order${orders.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {/* ---- LOADING ---- */}
        {loading && (
          <div className="bg-white rounded-[24px] border border-[#eef3f9] flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-[3px] border-[#e6eef7] border-t-[#5a8dee] rounded-full animate-spin" />
            <p className="mt-4 text-[14px] font-medium text-[#7c9cb6]">Loading your orders...</p>
          </div>
        )}

        {/* ---- ERROR ---- */}
        {!loading && error && orders.length === 0 && (
          <div className="bg-white rounded-[24px] border border-red-200 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <p className="mt-4 text-[16px] font-bold text-[#4a5f78]">Something went wrong.</p>
            <p className="mt-1 text-[14px] text-[#7c9cb6]">We couldn&apos;t load your orders.</p>
            {error && <p className="mt-1 text-[13px] text-red-600">{error}</p>}
            <button
              onClick={fetchOrders}
              className="mt-6 rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ---- EMPTY ---- */}
        {!loading && !error && orders.length === 0 && (
          <div className="bg-white rounded-[24px] border border-[#eef3f9] p-14 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f4f7fb] flex items-center justify-center mx-auto text-2xl">
              📦
            </div>
            <p className="mt-4 text-[16px] font-bold text-[#4a5f78]">
              You have not placed any orders yet.
            </p>
            <p className="mt-1 text-[14px] text-[#7c9cb6]">
              When you place an order it will appear here.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* ---- SUCCESS ---- */}
        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}