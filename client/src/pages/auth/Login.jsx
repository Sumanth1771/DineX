import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import heroImage from "../../assets/hero.png";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
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
      const user = await login(form.email, form.password);
      navigate(user.role === "owner" ? "/owner/dashboard" : location.state?.returnTo || "/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Login failed. Please try again.");
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
              Your table is already waiting.
            </p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#51300d]">
              Skip the queue at Uncle Mess. Pick a slot, pre-order your meal, and arrive hungry.
            </p>
          </div>
          <img className="auth-aside-art" src={heroImage} alt="" aria-hidden="true" />
          <p className="relative z-10 text-xs font-bold uppercase tracking-[0.18em] text-[#69400f]">
            Eat well. Wait less.
          </p>
        </aside>

        <section className="auth-content">
          <p className="auth-eyebrow">Welcome back</p>
          <h1 className="text-3xl font-black tracking-tight text-white">Sign in to DineX</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Manage your reservations and get straight to the good part.
          </p>

          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field" htmlFor="email">
              Email address
              <input id="email" name="email" type="email" required autoComplete="email"
                value={form.email} onChange={handleChange} placeholder="you@example.com" />
            </label>
            <label className="auth-field auth-password-field" htmlFor="password">
              Password
              <input id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password"
                value={form.password} onChange={handleChange} placeholder="Enter your password" />
              <button type="button" className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </label>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing you in..." : "Continue to DineX"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-400">
            New to DineX?{" "}
            <Link to="/register" state={location.state} className="font-bold text-amber-300 transition hover:text-amber-200">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default Login;
