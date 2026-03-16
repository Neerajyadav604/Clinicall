import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../services/operations/Authapi";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REMEMBER_EMAIL_KEY = "rememberedLoginEmail";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.55-.21-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.4 3.62v3.01h3.88c2.27-2.08 3.56-5.16 3.56-8.66z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.88-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.12 0-5.76-2.11-6.7-4.96H1.3v3.1A12 12 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.3 14.26A7.2 7.2 0 0 1 4.92 12c0-.78.13-1.54.38-2.26v-3.1H1.3A12 12 0 0 0 0 12c0 1.94.46 3.78 1.3 5.36l4-3.1z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.09 15.24 0 12 0A12 12 0 0 0 1.3 6.64l4 3.1c.93-2.85 3.57-4.97 6.7-4.97z"
    />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
    <path d="M12 .5A12 12 0 0 0 .02 12.67a12 12 0 0 0 8.2 11.49c.6.11.82-.27.82-.58v-2.05c-3.34.75-4.04-1.45-4.04-1.45-.54-1.42-1.34-1.8-1.34-1.8-1.1-.77.08-.75.08-.75 1.2.09 1.84 1.27 1.84 1.27 1.08 1.9 2.84 1.35 3.53 1.03.11-.8.42-1.35.77-1.66-2.66-.31-5.46-1.38-5.46-6.12 0-1.35.47-2.45 1.23-3.31-.12-.31-.54-1.56.12-3.25 0 0 1-.33 3.3 1.26a11.1 11.1 0 0 1 6 0c2.3-1.59 3.3-1.26 3.3-1.26.66 1.69.24 2.94.12 3.25.77.86 1.23 1.96 1.23 3.31 0 4.76-2.8 5.8-5.47 6.11.43.39.82 1.13.82 2.3v3.41c0 .32.22.7.83.58a12 12 0 0 0 8.19-11.49A12 12 0 0 0 12 .5z" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", submit: "" });

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (rememberedEmail) {
      setFormData((prev) => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
  };

  const validate = () => {
    const nextErrors = { email: "", password: "", submit: "" };

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!formData.password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      setErrors((prev) => ({ ...prev, submit: "Please fix the highlighted fields." }));
      return;
    }

    setErrors((prev) => ({ ...prev, submit: "" }));

    if (rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, formData.email.trim());
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }

    const result = await dispatch(login(formData.email.trim(), formData.password, navigate));
    if (result && result.success === false) {
      setErrors((prev) => ({
        ...prev,
        submit: result.message || "Invalid email or password.",
      }));
    }
  };

  return (
    <div className="relative isolate min-h-[calc(100vh-6rem)] overflow-hidden bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm lg:grid-cols-2">
        <section className="order-2 p-6 sm:p-8 lg:order-1 lg:p-12">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-700">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">C</span>
            Clinicall
          </Link>

          <div className="mt-8 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Sign in to your account</h1>
            <p className="text-sm leading-6 text-slate-600">Welcome back. Access your appointments, records, and care workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {errors.submit ? (
              <p className="error-box" role="alert" aria-live="polite">
                {errors.submit}
              </p>
            ) : null}

            <div className="space-y-1">
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=" "
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="peer w-full rounded-xl border border-slate-300 bg-white px-4 pb-2.5 pt-6 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-transparent hover:border-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                />
                <label htmlFor="email" className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500 transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-slate-700">
                  Email address
                </label>
              </div>
              {errors.email ? (
                <p id="email-error" className="text-xs text-red-600" role="alert">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder=" "
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className="peer w-full rounded-xl border border-slate-300 bg-white px-4 pb-2.5 pt-6 pr-14 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-transparent hover:border-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                />
                <label htmlFor="password" className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500 transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password ? (
                <p id="password-error" className="text-xs text-red-600" role="alert">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/30"
                />
                Remember me
              </label>
              <a href="mailto:support@clinicall.com?subject=Password%20Reset%20Request" className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="relative py-1 text-center">
              <span className="absolute left-0 right-0 top-1/2 -z-10 h-px bg-slate-200" />
              <span className="bg-white px-3 text-xs uppercase tracking-wide text-slate-500">or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Sign in with Google (coming soon)"
              >
                <GoogleIcon />
                Google
              </button>
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Sign in with GitHub (coming soon)"
              >
                <GitHubIcon />
                GitHub
              </button>
            </div>

            <p className="pt-1 text-center text-sm text-slate-600">
              New to Clinicall?{" "}
              <Link to="/signup" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700">
                Create an account
              </Link>
            </p>
          </form>
        </section>

        <aside className="relative order-1 hidden overflow-hidden bg-slate-900 px-8 py-10 text-white lg:order-2 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-[-15%] top-[-15%] h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute bottom-[-20%] left-[-10%] h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl" />
          </div>

          <div className="relative z-10">
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-slate-100">
              Secure healthcare workspace
            </p>
            <h2 className="mt-6 text-3xl font-semibold leading-tight">A calm, reliable control center for your care journey.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-200/90">
              Manage appointments, chat with providers, and keep medical history organized in one place.
            </p>
          </div>

          <div className="relative z-10 mt-10 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-lg font-semibold">24/7</p>
              <p className="mt-1 text-xs text-slate-200">Support</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-lg font-semibold">256-bit</p>
              <p className="mt-1 text-xs text-slate-200">Encryption</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-lg font-semibold">99.9%</p>
              <p className="mt-1 text-xs text-slate-200">Uptime</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Login;
