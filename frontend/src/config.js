const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const API_BASE_URL = BACKEND_URL;
const SOCKET_BASE_URL = BACKEND_URL;

export { API_BASE_URL, SOCKET_BASE_URL };

export const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;
export const getSocketUrl = () => SOCKET_BASE_URL;

export default {
    API_BASE_URL,
    SOCKET_BASE_URL,
    getApiUrl,
    getSocketUrl
};
