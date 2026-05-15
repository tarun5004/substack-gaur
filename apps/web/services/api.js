import axios from "axios";

const authRoutesThatShouldNotRefresh = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/auth/register",
  "/api/auth/signup",
];

export const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshRequest = null;

function isAuthRefreshSkipped(url = "") {
  return authRoutesThatShouldNotRefresh.some((route) => url.includes(route));
}

async function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = axios
      .post("/api/auth/refresh", undefined, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._sessionRetry ||
      isAuthRefreshSkipped(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._sessionRetry = true;

    try {
      await refreshAccessToken();
      return api(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  },
);

export function getApiErrorMessage(error, fallback = "Something went wrong") {
  return error?.response?.data?.message || fallback;
}
