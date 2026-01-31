import axios from "axios";

const API_BASE_URL = "https://carefully-permanent-capybara.cloudpub.ru/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Минимальный интерцептор без логирования
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverError = error.response?.data;

    if (serverError) {
      const customError = new Error(
        serverError.error || serverError.message || "Ошибка сервера",
      );
      customError.status = error.response?.status;
      customError.data = serverError;
      return Promise.reject(customError);
    }

    const networkError = new Error("Проверьте подключение к интернету");
    networkError.isNetworkError = true;
    return Promise.reject(networkError);
  },
);

export default apiClient;
