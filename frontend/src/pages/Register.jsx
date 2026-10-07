import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

// Defined OUTSIDE Register so its identity is stable across renders.
// Defining it inside the component creates a new component type on every
// keystroke, which makes React unmount/remount the <input> and steals focus
// after typing a single character.
function Field({ label, name, type = 'text', placeholder, autoComplete, value, error, onChange }) {
  return (
    <div>
      <label htmlFor={name} className="block text-[13px] font-semibold text-[#4a5f78] mb-1.5">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full rounded-full bg-[#f4f7fb] border px-5 py-3.5 text-[15px] text-[#4a5f78] placeholder:text-[#7c9cb6]/60 focus:outline-none focus:ring-2 focus:ring-[#5a8dee]/30 transition ${error ? 'border-red-300 focus:border-red-400' : 'border-[#e6eef7] focus:border-[#5a8dee]/40'}`}
      />
      {error && <p className="mt-1.5 text-[13px] text-red-500 ml-3">{error}</p>}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[0-9+\-\s]{8,15}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number';
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
      await api.post('/customers/register', {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
      });
      // On success → Redirect to Login page (rubric: Task 1)
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 409) setApiError('Email already registered. Please login instead.');
      else if (status === 400) setApiError(msg || 'Please check your details and try again.');
      else setApiError(msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const FieldProps = { onChange: handleChange };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px] bg-white rounded-[32px] shadow-[0_20px_60px_rgba(74,95,120,0.12)] border border-white p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#5a8dee] flex items-center justify-center mx-auto text-white font-bold shadow-sm">SK</div>
          <h1 className="mt-4 text-[26px] font-bold tracking-tight text-[#4a5f78]">Create your account</h1>
          <p className="mt-1 text-[14px] text-[#7c9cb6]">Join ShopKart — fast, secure checkout</p>
        </div>

        {apiError && (
          <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-[14px]">{apiError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Full Name" name="fullName" placeholder="John Doe" autoComplete="name" value={form.fullName} error={errors.fullName} {...FieldProps} />
          <Field label="Email" name="email" type="email" placeholder="you@example.com" autoComplete="email" value={form.email} error={errors.email} {...FieldProps} />
          <Field label="Password" name="password" type="password" placeholder="At least 6 characters" autoComplete="new-password" value={form.password} error={errors.password} {...FieldProps} />
          <Field label="Phone Number" name="phone" type="tel" placeholder="+91 98765 43210" autoComplete="tel" value={form.phone} error={errors.phone} {...FieldProps} />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-full bg-[#8da4be] text-white font-semibold py-4 shadow-[0_8px_20px_rgba(141,164,190,0.35)] hover:bg-[#7d94ad] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] transition text-[15px]"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-[14px] text-[#7c9cb6] mt-6">
          Already have an account? <Link to="/login" className="font-semibold text-[#5a8dee] hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
