import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import heroImage from "../../assets/hero.png";
import { useAuth } from "../../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (requestError) {
      const validationErrors = requestError.response?.data?.errors;
      setError(validationErrors?.length ? validationErrors[0].message :
        requestError.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <aside className="auth-aside">
          <div>
            <div className="auth-mark">Dine<span>X</span></div>
            <p className="mt-12 max-w-xs text-3xl font-black leading-tight tracking-tight">
              Make every meal count.
            </p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#51300d]">
              One simple account for quick reservations, pre-paid meals, and a calmer dining experience.
            </p>
          </div>
          <img className="auth-aside-art" src={heroImage} alt="" aria-hidden="true" />
          <p className="relative z-10 text-xs font-bold uppercase tracking-[0.18em] text-[#69400f]">
            Fresh food. Zero fuss.
          </p>
        </aside>

        <section className="auth-content">
          <p className="auth-eyebrow">Join the table</p>
          <h1 className="text-3xl font-black tracking-tight text-white">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Reserve faster next time and keep every booking in one place.
          </p>

          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field" htmlFor="name">
              Full name
              <input id="name" name="name" type="text" required minLength={2} maxLength={100}
                autoComplete="name" value={form.name} onChange={handleChange} placeholder="Your name" />
            </label>
            <label className="auth-field" htmlFor="email">
              Email address
              <input id="email" name="email" type="email" required autoComplete="email"
                value={form.email} onChange={handleChange} placeholder="you@example.com" />
            </label>
            <label className="auth-field" htmlFor="password">
              Password
              <input id="password" name="password" type="password" required minLength={8} maxLength={128}
                autoComplete="new-password" value={form.password} onChange={handleChange}
                placeholder="At least 8 characters" />
            </label>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Creating your account..." : "Create my account"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-amber-300 transition hover:text-amber-200">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default Register;
