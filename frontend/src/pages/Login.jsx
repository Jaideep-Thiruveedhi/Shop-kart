import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const registered = location.state?.registered;
  // Set by the RequireAuth guard when a protected page bounces the visitor here.
  const redirectTo = location.state?.from ?? '/home';

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm((s) => ({ ...s, [name]: value }));
    if (errors[name]) setErrors((s) => ({ ...s, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setLoading(true);
    setApiError('');
    try {
      // withCredentials:true ensures HttpOnly cookie is stored automatically
      await api.post('/customers/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      // Silently hydrate context — don't store user manually
      const { data } = await api.get('/customers/me');
      const u = data.customer ?? data;
      setUser(u);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setApiError('Invalid Credentials');
      else setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[440px] bg-white rounded-[32px] shadow-[0_20px_60px_rgba(74,95,120,0.12)] border border-white p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#5a8dee] flex items-center justify-center mx-auto text-white font-bold shadow-sm">SK</div>
          <h1 className="mt-4 text-[26px] font-bold tracking-tight text-[#4a5f78]">Welcome back</h1>
          <p className="mt-1 text-[14px] text-[#7c9cb6]">Sign in to continue to ShopKart</p>
        </div>

        {registered && (
          <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 text-[14px]">Account created! Please login.</div>
        )}
        {apiError && (
          <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-[14px] font-medium text-center">{apiError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[13px] font-semibold text-[#4a5f78] mb-1.5">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              className={`w-full rounded-full bg-[#f4f7fb] border px-5 py-3.5 text-[15px] text-[#4a5f78] placeholder:text-[#7c9cb6]/60 focus:outline-none focus:ring-2 focus:ring-[#5a8dee]/30 transition ${errors.email ? 'border-red-300' : 'border-[#e6eef7] focus:border-[#5a8dee]/40'}`}
            />
            {errors.email && <p className="mt-1.5 text-[13px] text-red-500 ml-3">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-semibold text-[#4a5f78] mb-1.5">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              autoComplete="current-password"
              className={`w-full rounded-full bg-[#f4f7fb] border px-5 py-3.5 text-[15px] text-[#4a5f78] placeholder:text-[#7c9cb6]/60 focus:outline-none focus:ring-2 focus:ring-[#5a8dee]/30 transition ${errors.password ? 'border-red-300' : 'border-[#e6eef7] focus:border-[#5a8dee]/40'}`}
            />
            {errors.password && <p className="mt-1.5 text-[13px] text-red-500 ml-3">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-full bg-[#8da4be] text-white font-semibold py-4 shadow-[0_8px_20px_rgba(141,164,190,0.35)] hover:bg-[#7d94ad] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] transition text-[15px]"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <p className="text-center text-[14px] text-[#7c9cb6] mt-6">
          Don&apos;t have an account? <Link to="/register" className="font-semibold text-[#5a8dee] hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
}
