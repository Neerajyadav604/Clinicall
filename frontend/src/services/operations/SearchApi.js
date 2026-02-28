import { axiosInstance } from "../ApiConnector";

export async function searchDoctors(query) {
  try {
    const response = await axiosInstance.post(`/searchdoctors`, { query });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function requestAppointment(doctorId, payload) {
  try {
    const response = await axiosInstance.post(`/appointment/request/${doctorId}`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
}
