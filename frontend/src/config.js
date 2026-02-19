const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_BASE_URL || "http://localhost:5000";

export { API_BASE_URL, SOCKET_BASE_URL };

export const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;
export const getSocketUrl = () => SOCKET_BASE_URL;

export default {
    API_BASE_URL,
    SOCKET_BASE_URL,
    getApiUrl,
    getSocketUrl
};
