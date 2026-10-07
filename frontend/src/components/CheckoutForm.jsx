import { useState } from 'react';

const INITIAL = {
  fullName: '',
  phone: '',
  addressLine1: '',
  city: '',
  state: '',
  pincode: '',
};

const PHONE_RE = /^[0-9]{10}$/;
const PINCODE_RE = /^[0-9]{6}$/;

// Mirrors backend/controllers/order.controller.js validateShippingAddress().
// Validating here is a UX affordance, NOT a security control — the server
// re-validates every field because a client can be bypassed.
function validateField(field, rawValue) {
  const value = rawValue.trim();

  if (value === '') return `${LABELS[field]} is required`;

  switch (field) {
    case 'fullName':
      return value.length >= 2 ? '' : 'Full name must be at least 2 characters';
    case 'phone': {
      const digits = value.replace(/[\s-]/g, '').replace(/^(\+91|91)/, '');
      if (!/^[0-9]+$/.test(digits)) return 'Phone must contain digits only';
      return PHONE_RE.test(digits) ? '' : 'Phone must be a valid 10-digit number';
    }
    case 'addressLine1':
      return value.length >= 5 ? '' : 'Address must be at least 5 characters';
    case 'pincode':
      return PINCODE_RE.test(value) ? '' : 'Pincode must contain 6 digits';
    default:
      return value.length >= 2 ? '' : `${LABELS[field]} must be at least 2 characters`;
  }
}

const LABELS = {
  fullName: 'Full name',
  phone: 'Phone',
  addressLine1: 'Address',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
};

const FIELDS = [
  { name: 'fullName', label: 'Full Name', placeholder: 'Aarav Sharma', type: 'text', span: 'sm:col-span-2' },
  { name: 'phone', label: 'Phone Number', placeholder: '9876543210', type: 'tel', inputMode: 'numeric' },
  { name: 'pincode', label: 'Pincode', placeholder: '560001', type: 'text', inputMode: 'numeric' },
  { name: 'addressLine1', label: 'Address Line', placeholder: '22 MG Road', type: 'text', span: 'sm:col-span-2' },
  { name: 'city', label: 'City', placeholder: 'Bengaluru', type: 'text' },
  { name: 'state', label: 'State', placeholder: 'Karnataka', type: 'text' },
];

export default function CheckoutForm({ onSubmit, submitting, disabled }) {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (field) => (event) => {
    const raw = event.target.value;
    setValues((prev) => ({ ...prev, [field]: raw }));

    // Validate live only after the field has been blurred once, so the customer
    // is not scolded while still typing the first character.
    setErrors((prev) =>
      touched[field] ? { ...prev, [field]: validateField(field, raw) } : prev,
    );
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, values[field]) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    for (const field of Object.keys(INITIAL)) {
      const message = validateField(field, values[field]);
      if (message) nextErrors[field] = message;
    }
    setErrors(nextErrors);
    setTouched(Object.fromEntries(Object.keys(INITIAL).map((f) => [f, true])));

    if (Object.keys(nextErrors).length > 0) return; // do not call the backend

    // Submit the normalised values (trimmed phone/pincode) so the address the
    // server stores matches what we validated.
    const payload = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [
        k,
        k === 'phone' ? v.trim().replace(/[\s-]/g, '').replace(/^(\+91|91)/, '') : v.trim(),
      ]),
    );

    onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white rounded-[24px] border border-[#eef3f9] p-6"
    >
      <h2 className="text-[18px] font-bold tracking-tight text-[#4a5f78]">Shipping Details</h2>
      <p className="mt-1 text-[13px] text-[#7c9cb6]">
        No real card is collected here — payment happens on Razorpay&apos;s secure test checkout.
      </p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map((field) => {
          const error = errors[field.name];
          const inputId = `checkout-${field.name}`;
          const describedBy = error ? `${inputId}-error` : undefined;

          return (
            <div key={field.name} className={field.span ?? ''}>
              <label
                htmlFor={inputId}
                className="block text-[12px] font-bold tracking-wide uppercase text-[#7c9cb6]"
              >
                {field.label}
              </label>
              <input
                id={inputId}
                name={field.name}
                type={field.type}
                inputMode={field.inputMode}
                placeholder={field.placeholder}
                value={values[field.name]}
                onChange={handleChange(field.name)}
                onBlur={handleBlur(field.name)}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-[14px] text-[#4a5f78] outline-none transition placeholder:text-[#b8c6d6] ${
                  error
                    ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-[#e6edf5] focus:border-[#5a8dee] focus:ring-2 focus:ring-[#eef3ff]'
                }`}
              />
              {error && (
                <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-[12px] font-semibold text-red-600">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {Object.keys(errors).length > 0 && (
        <p role="alert" className="mt-5 text-[13px] font-semibold text-red-600">
          Please fix the highlighted fields before placing your order.
        </p>
      )}

      <button
        type="submit"
        disabled={disabled || submitting}
        className="mt-6 w-full rounded-full bg-[#8da4be] text-white text-[15px] font-semibold py-3.5 shadow-[0_8px_20px_rgba(141,164,190,0.35)] hover:bg-[#7d94ad] active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Placing Order…
          </span>
        ) : (
          'Place Order'
        )}
      </button>
    </form>
  );
}