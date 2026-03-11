import axios from "axios"
import { handleUnauthorized } from "./authSession";

export const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL
});

// Add request interceptor to include authorization header
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            // Only set Authorization header if it's not already explicitly set
            if (!config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } else {
            console.warn("No token found in localStorage - request may fail with 401");
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to catch 401s
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || "";
        const skipAuthEndpoints = ["/login", "/signup", "/sendotp", "/refresh"];

        if (status === 401 && !skipAuthEndpoints.some((path) => url.includes(path))) {
            handleUnauthorized();
        }
        return Promise.reject(error);
    }
);

export const apiconnector = (method, url, bodyData, headers, params) => {
    return axiosInstance({
        method:`${method}`,
        url:`${url}`,
        data: bodyData ? bodyData : null,
        headers: headers ? headers: null,
        params: params ? params : null,
    });
}
