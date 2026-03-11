import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setSignupData } from "../slices/authSlice";
import { sendOtp } from "../services/operations/Authapi";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s]{8,20}$/;

const SignUp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: "",
    contact: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    } else if (formData.fullName.trim().length < 2) {
      nextErrors.fullName = "Enter at least 2 characters.";
    }

    if (!formData.contact.trim()) {
      nextErrors.contact = "Contact number is required.";
    } else if (!PHONE_REGEX.test(formData.contact.trim())) {
      nextErrors.contact = "Enter a valid contact number.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!formData.password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (!formData.confirmPassword.trim()) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      setErrors((prev) => ({ ...prev, submit: "Please fix the highlighted fields." }));
      return;
    }

    const payload = {
      ...formData,
      fullName: formData.fullName.trim(),
      contact: formData.contact.trim(),
      email: formData.email.trim(),
      role: "user",
    };

    dispatch(setSignupData(payload));
    dispatch(sendOtp(payload.email, navigate));
  };

  return (
    <div className="relative isolate min-h-[calc(100vh-6rem)] overflow-hidden bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-8%] top-[-5%] h-72 w-72 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm lg:grid-cols-2">
        <section className="order-2 p-6 sm:p-8 lg:order-1 lg:p-12">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-700">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">C</span>
            Clinicall
          </Link>

          <div className="mt-8 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Create your account</h1>
            <p className="text-sm leading-6 text-slate-600">Start in minutes. We will send an OTP to verify your email before onboarding.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {errors.submit ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="polite">
                {errors.submit}
              </p>
            ) : null}

            <div className="space-y-1">
              <div className="relative">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder=" "
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                  className="peer w-full rounded-xl border border-slate-300 bg-white px-4 pb-2.5 pt-6 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-transparent hover:border-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                />
                <label htmlFor="fullName" className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500 transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-slate-700">
                  Full name
                </label>
              </div>
              {errors.fullName ? (
                <p id="fullName-error" className="text-xs text-red-600" role="alert">
                  {errors.fullName}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="relative">
                  <input
                    id="contact"
                    name="contact"
                    type="tel"
                    autoComplete="tel"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder=" "
                    aria-invalid={Boolean(errors.contact)}
                    aria-describedby={errors.contact ? "contact-error" : undefined}
                    className="peer w-full rounded-xl border border-slate-300 bg-white px-4 pb-2.5 pt-6 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-transparent hover:border-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                  />
                  <label htmlFor="contact" className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500 transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-slate-700">
                    Contact number
                  </label>
                </div>
                {errors.contact ? (
                  <p id="contact-error" className="text-xs text-red-600" role="alert">
                    {errors.contact}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
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
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
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

              <div className="space-y-1">
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder=" "
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                    className="peer w-full rounded-xl border border-slate-300 bg-white px-4 pb-2.5 pt-6 pr-14 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-transparent hover:border-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                  />
                  <label htmlFor="confirmPassword" className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500 transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-slate-700">
                    Confirm password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.confirmPassword ? (
                  <p id="confirmPassword-error" className="text-xs text-red-600" role="alert">
                    {errors.confirmPassword}
                  </p>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Sending OTP..." : "Create account"}
            </button>

            <p className="pt-1 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700">
                Sign in
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
              Fast onboarding
            </p>
            <h2 className="mt-6 text-3xl font-semibold leading-tight">Get set up quickly with secure email verification.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-200/90">
              Create your profile, verify your email with OTP, and start managing appointments and health updates in one place.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-lg font-semibold">2 min</p>
              <p className="mt-1 text-xs text-slate-200">Setup</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-lg font-semibold">OTP</p>
              <p className="mt-1 text-xs text-slate-200">Verification</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-lg font-semibold">Secure</p>
              <p className="mt-1 text-xs text-slate-200">By design</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SignUp;
