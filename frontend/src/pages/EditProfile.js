import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ProfileAvatar from "../components/EditProfile/ProfileAvatar";
import { updateUserProfile } from "../services/operations/Profileapi";

const parseListValue = (value) => {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  return value;
};

const toPayloadList = (value) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const buildDefaultValues = (user) => {
  const details = user?.additionalDetails || user || {};
  const insurance = details.insurance || user?.insurance || {};

  return {
    fullName: user?.fullName || "",
    email: user?.email || "",
    contact: user?.contact || "",
    address: details.address || user?.address || "",
    dob: details.dob || user?.dob || "",
    gender: details.gender || user?.gender || "",
    bloodGroup: details.bloodGroup || user?.bloodGroup || "",
    emergencyContact: details.emergencyContact || user?.emergencyContact || "",
    allergies: parseListValue(details.allergies || user?.allergies),
    medications: parseListValue(details.medications || user?.medications),
    medicalHistory: parseListValue(details.medicalHistory || user?.medicalHistory),
    insuranceProvider:
      insurance.provider || details.insuranceProvider || user?.insuranceProvider || "",
    policyNumber:
      insurance.policyNumber || details.policyNumber || user?.policyNumber || "",
  };
};

const SectionCard = ({ title, subtitle, children }) => (
  <section 
    className="rounded-[20px] border bg-white p-5 shadow-[0_14px_30px_-24px_rgba(2,6,23,0.4)] md:p-6"
    style={{
      borderColor: "#d9e2ec",
      backgroundColor: "#ffffff"
    }}
  >
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    <div className="mt-5">{children}</div>
  </section>
);

const FieldLabel = ({ children }) => (
  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
    {children}
  </label>
);

const TextInput = ({ register, name, rules, error, ...props }) => (
  <>
    <input
      {...register(name, rules)}
      {...props}
      className={`w-full rounded-xl border bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 min-h-[44px] ${
        error ? "border-rose-400" : "border-slate-200"
      } ${props.className || ""}`}
    />
    {error ? <p className="mt-1.5 text-xs text-rose-500 font-medium">{error.message}</p> : null}
  </>
);

const TextArea = ({ register, name, rules, error, ...props }) => (
  <>
    <textarea
      {...register(name, rules)}
      {...props}
      className={`w-full rounded-xl border bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 min-h-[100px] ${
        error ? "border-rose-400" : "border-slate-200"
      } ${props.className || ""}`}
    />
    {error ? <p className="mt-1.5 text-xs text-rose-500 font-medium">{error.message}</p> : null}
  </>
);

const SelectInput = ({ register, name, rules, error, children }) => (
  <>
    <select
      {...register(name, rules)}
      className={`w-full rounded-xl border bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 min-h-[44px] ${
        error ? "border-rose-400" : "border-slate-200"
      }`}
    >
      {children}
    </select>
    {error ? <p className="mt-1.5 text-xs text-rose-500 font-medium">{error.message}</p> : null}
  </>
);

const EditProfile = () => {
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const defaultValues = useMemo(() => buildDefaultValues(user), [user]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues,
  });

  const watchedValues = watch();
  useEffect(() => {
    if (submitError) setSubmitError("");
  }, [watchedValues, submitError]);

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const watched = watch(["fullName", "email", "contact", "address"]);
  const completion = useMemo(() => {
    const filled = watched.filter((item) => String(item || "").trim()).length;
    return Math.round((filled / watched.length) * 100);
  }, [watched]);

  const submitProfileForm = async (data) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        ...data,
        allergies: toPayloadList(data.allergies),
        medications: toPayloadList(data.medications),
        medicalHistory: toPayloadList(data.medicalHistory),
      };
      console.log("Submitting profile update with payload:", payload,token);
      const result = await dispatch(updateUserProfile(token, payload));
      console.log("Profile updated in Progress...")
      if (result && result.success === false) {
        setSubmitError(result.message || "Profile update failed.");
        return;
      }
      navigate("/my-profile");
    } catch (error) {
      console.error("Error updating profile:", error?.message || error);
      setSubmitError("Profile update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-6 sm:py-8 md:px-8"
      style={{
        backgroundColor: "#f3f7fb",
        "--page": "#f3f7fb",
        "--surface": "#ffffff",
        "--line": "#d9e2ec",
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#0f172a] via-[#0f3b4a] to-[#0d1f2d] p-6 text-white shadow-[0_28px_60px_-36px_rgba(2,6,23,0.85)] md:p-8">
          <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-100">Profile Studio</p>
              <h1
                className="mt-2 text-3xl leading-tight md:text-4xl"
                style={{ fontFamily: 'Fraunces, "Times New Roman", serif' }}
              >
                Edit Profile
              </h1>
              <p className="mt-2 max-w-xl text-sm text-cyan-100">
                Update personal, medical, and insurance details for a more personalized care flow.
              </p>
            </div>

            <div className="w-full max-w-xs rounded-xl border border-white/20 bg-white/10 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-cyan-100">Form completeness</p>
                <p className="text-sm font-semibold">{completion}%</p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/15">
                <div
                  className="h-2 rounded-full bg-emerald-300 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit(submitProfileForm)} className="space-y-6">
          {submitError ? (
            <div className="error-box" role="alert" aria-live="polite">
              {submitError}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard
              title="Personal Information"
              subtitle="These details are visible in your primary profile."
            >
              <div className="space-y-4">
                <div className="mb-4">
                  <ProfileAvatar
                    name={watch("fullName")}
                    avatarUrl={user?.avatarUrl}
                    onChange={(file) => setValue("avatarFile", file)}
                  />
                </div>
                <div>
                  <FieldLabel>Full Name *</FieldLabel>
                  <TextInput
                    register={register}
                    name="fullName"
                    rules={{ required: "Full name is required" }}
                    error={errors.fullName}
                    type="text"
                  />
                </div>

                <div>
                  <FieldLabel>Email *</FieldLabel>
                  <TextInput
                    register={register}
                    name="email"
                    rules={{
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    }}
                    error={errors.email}
                    type="email"
                  />
                </div>

                <div>
                  <FieldLabel>Phone Number *</FieldLabel>
                  <TextInput
                    register={register}
                    name="contact"
                    rules={{ required: "Phone number is required" }}
                    error={errors.contact}
                    type="tel"
                  />
                </div>

                <div>
                  <FieldLabel>Address</FieldLabel>
                  <TextArea register={register} name="address" rows={3} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Date of Birth</FieldLabel>
                    <TextInput register={register} name="dob" type="date" />
                  </div>
                  <div>
                    <FieldLabel>Gender</FieldLabel>
                    <SelectInput register={register} name="gender">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </SelectInput>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Blood Group</FieldLabel>
                    <SelectInput register={register} name="bloodGroup">
                      <option value="">Select</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </SelectInput>
                  </div>
                  <div>
                    <FieldLabel>Emergency Contact</FieldLabel>
                    <TextInput register={register} name="emergencyContact" type="tel" />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Medical & Insurance"
              subtitle="Use comma-separated values for medical list fields."
            >
              <div className="space-y-4">
                <div>
                  <FieldLabel>Allergies</FieldLabel>
                  <TextInput
                    register={register}
                    name="allergies"
                    placeholder="Peanuts, Penicillin"
                  />
                </div>

                <div>
                  <FieldLabel>Current Medications</FieldLabel>
                  <TextArea
                    register={register}
                    name="medications"
                    rows={3}
                    placeholder="Lisinopril, Metformin"
                  />
                </div>

                <div>
                  <FieldLabel>Medical History</FieldLabel>
                  <TextArea
                    register={register}
                    name="medicalHistory"
                    rows={3}
                    placeholder="Hypertension, Diabetes"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">Insurance Information</h3>
                  <div className="mt-3 space-y-4">
                    <div>
                      <FieldLabel>Insurance Provider</FieldLabel>
                      <TextInput
                        register={register}
                        name="insuranceProvider"
                        placeholder="HealthCare Plus"
                      />
                    </div>
                    <div>
                      <FieldLabel>Policy Number</FieldLabel>
                      <TextInput
                        register={register}
                        name="policyNumber"
                        placeholder="HCP-123456789"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="flex gap-3 md:hidden">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
