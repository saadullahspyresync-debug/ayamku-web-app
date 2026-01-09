// src/api/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { fetchAuthSession, signOut } from "aws-amplify/auth"; // ✅ Import fetchAuthSession from Amplify

const api: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
     "https://ec661icza2.execute-api.us-east-1.amazonaws.com", // local devs-venture-dev-machine
    //  "https://e4girjfm00.execute-api.us-east-1.amazonaws.com", // development
    // "",
  headers: { "Content-Type": "application/json" },
});

// ✅ Updated Interceptor to use AWS Amplify
api.interceptors.request.use(
  // The function must be async to use await
  async (config: any) => {
    try {
      // Await the session details from Amplify
      const session = await fetchAuthSession();

      // Get the access token. toString() is recommended.
      const accessToken = session.tokens?.accessToken?.toString();

      // If a token exists, add it to the Authorization header
      if (accessToken) {
        if (!config.headers) config.headers = {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    } catch (error) {
      // This catch block will handle cases where the user is not authenticated.
      // The request will proceed without the Authorization header.
      console.log("No active user session, proceeding without auth token.");
      return config;
    }
  },
  (error) => {
    // This part handles errors in creating the request itself
    return Promise.reject(error);
  }
);

// ✅ Response interceptor: handle disabled branch manager account and force logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    // API Gateway + Authorizer denial
    if (status === 403) {
      const errorCode =
        error.response?.headers?.["x-error-code"] ||
        error.response?.headers?.["x-amzn-errortype"];

      if (
        errorCode === "ACCOUNT_DISABLED" ||
        errorCode?.includes("ACCOUNT_DISABLED")
      ) {
        await signOut();
        alert("Your account has been disabled. Please contact admin.");
        window.location.href = "/login";
        return;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
