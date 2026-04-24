import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";
import Constants from "expo-constants";

const apiClient = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl,
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
