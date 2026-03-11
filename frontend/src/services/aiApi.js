import { handleUnauthorized } from "./authSession";

const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:4000/api/v1";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No auth token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const chatWithAI = async (message, context = "") => {
  const response = await fetch(`${BASE_URL}/ai/chat`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, context }),
  });
  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    let err = { message: 'AI chat failed' };
    try { err = await response.json(); } catch {} // ignore parse errors
    const msg = err.message || 'AI chat failed';
    console.error('backend error:', msg);
    throw new Error(msg);
  }
  const data = await response.json();
  return data;
};
