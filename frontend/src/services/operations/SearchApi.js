import { apiconnector } from "../ApiConnector";
import { toast } from "react-toastify";

const BASE = process.env.REACT_APP_BASE_URL;

export async function searchDoctors(query, token) {
  const url = `${BASE}/searchdoctors`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const resp = await apiconnector("POST", url, { query }, headers);
    return resp.data;
  } catch (err) {
    // normalize axios errors
    if (err.response) {
      // return response data for caller to handle (may include 401)
      return Promise.reject(err.response);
    }
    return Promise.reject(err);
  }
}

export async function requestAppointment(doctorId, payload, token) {
  const url = `${BASE}/appointment/request/${doctorId}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const resp = await apiconnector("POST", url, payload, headers);
    return resp.data;
  } catch (err) {
    if (err.response) return Promise.reject(err.response);
    return Promise.reject(err);
  }
}
