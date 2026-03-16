import { handleUnauthorized } from "../authSession";

const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:4000/api/v1";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found. Please login first.");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

const parseResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP Error ${response.status}`);
  }
  return response.json();
};

// ────────────────────────────────────────────────────
// USER — Submit + Status
// ────────────────────────────────────────────────────

export const submitHospitalRegistration = async (formData) => {
  const response = await fetch(`${BASE_URL}/hospital-registration`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData, // FormData — no Content-Type header
  });
  return parseResponse(response);
};

export const getHospitalRegistrationStatus = async () => {
  const response = await fetch(`${BASE_URL}/hospital-registration/status`, {
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
  });
  return parseResponse(response);
};

// ────────────────────────────────────────────────────
// PUBLIC — Hospitals
// ────────────────────────────────────────────────────

export const getAllHospitals = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.city)           params.append("city",           filters.city);
  if (filters.specialization) params.append("specialization", filters.specialization);
  if (filters.type)           params.append("type",           filters.type);
  if (filters.isClinic !== undefined) params.append("isClinic", String(filters.isClinic));

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${BASE_URL}/hospitals${query}`);
  return parseResponse(response);
};

export const getHospitalById = async (id) => {
  const response = await fetch(`${BASE_URL}/hospitals/${id}`);
  return parseResponse(response);
};

export const getHospitalDoctors = async (id) => {
  const response = await fetch(`${BASE_URL}/hospitals/${id}/doctors`);
  return parseResponse(response);
};

// ────────────────────────────────────────────────────
// HOSPITAL ADMIN — Doctor applications
// ────────────────────────────────────────────────────

export const getHospitalDoctorRegistrations = async (status) => {
  const statusMap = { pending: "pending_hospital", approved: "approved_hospital", rejected: "rejected_hospital" };
  const dbStatus = statusMap[status] || status;
  const query = dbStatus ? `?hospitalStatus=${dbStatus}` : "";
  const response = await fetch(`${BASE_URL}/hospital/doctor-registrations${query}`, {
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
  });
  return parseResponse(response);
};

export const approveHospitalDoctorRegistration = async (id) => {
  const response = await fetch(`${BASE_URL}/hospital/doctor-registrations/${id}/approve`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
  });
  return parseResponse(response);
};

export const rejectHospitalDoctorRegistration = async (id, reason) => {
  const response = await fetch(`${BASE_URL}/hospital/doctor-registrations/${id}/reject`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return parseResponse(response);
};

// ────────────────────────────────────────────────────
// ADMIN — Hospital registrations + management
// ────────────────────────────────────────────────────

export const getAdminHospitalRegistrations = async (status = "pending", isClinic) => {
  const params = new URLSearchParams({ status });
  if (isClinic !== undefined) params.append("isClinic", String(isClinic));
  const response = await fetch(`${BASE_URL}/admin/hospital-registrations?${params.toString()}`, {
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
  });
  return parseResponse(response);
};

export const getAdminHospitalRegistrationById = async (id) => {
  const response = await fetch(`${BASE_URL}/admin/hospital-registrations/${id}`, {
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
  });
  return parseResponse(response);
};

export const approveAdminHospitalRegistration = async (id) => {
  const response = await fetch(`${BASE_URL}/admin/hospital-registrations/${id}/approve`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
  });
  return parseResponse(response);
};

export const rejectAdminHospitalRegistration = async (id, reason) => {
  const response = await fetch(`${BASE_URL}/admin/hospital-registrations/${id}/reject`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return parseResponse(response);
};

export const getAdminAllHospitals = async (isClinic) => {
  const query = isClinic !== undefined ? `?isClinic=${isClinic}` : "";
  const response = await fetch(`${BASE_URL}/admin/hospitals${query}`, {
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
  });
  return parseResponse(response);
};

export const suspendAdminHospital = async (id) => {
  const response = await fetch(`${BASE_URL}/admin/hospitals/${id}/suspend`, {
    method: "PATCH",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
  });
  return parseResponse(response);
};
