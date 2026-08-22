import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fixit_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthError = error.response?.status === 401;
    const onAuthPage = ["/login", "/register"].includes(window.location.pathname);
    if (isAuthError && !onAuthPage) {
      localStorage.removeItem("fixit_token");
      localStorage.removeItem("fixit_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
