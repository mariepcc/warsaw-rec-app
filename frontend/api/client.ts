import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

// 10.55.14.95 lub 192.168.0.231 lub 192.168.1.17
const apiClient = axios.create({
  baseURL: "http://192.168.1.17:8000",
  timeout: 30000,
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken?.toString();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

export default apiClient;
