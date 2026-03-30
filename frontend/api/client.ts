import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://192.168.0.231:8000",
  timeout: 30000,
});

export default apiClient;
