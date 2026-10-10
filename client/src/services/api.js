import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
let accessToken = null;

let refreshPromise = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    /*
     * Only attempt refresh for 401 responses.
     */
    if (
      error.response?.status !== 401 ||
      originalRequest?._retry
    ) {
      return Promise.reject(error);
    }

    /*
     * Never refresh the refresh endpoint itself.
     */
    if (
      originalRequest?.url === "/auth/refresh"
    ) {
      clearAccessToken();

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    /*
     * If another request is already refreshing,
     * wait for that same refresh operation.
     */
    if (!refreshPromise) {
      refreshPromise = axios
        .post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
          }
        )
        .then((response) => {
          const newAccessToken =
            response.data.data.accessToken;

          setAccessToken(newAccessToken);

          return newAccessToken;
        })
        .catch((refreshError) => {
          clearAccessToken();

          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newAccessToken =
        await refreshPromise;

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;