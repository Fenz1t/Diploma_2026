// src/services/api/positionApi.js
import apiClient from "./client";

export const positionApi = {
  // Получить все должности - извлекаем data из ответа
  getAll: async (params = {}) => {
    const response = await apiClient.get("/positions", { params });
    return response.data.data;
  },

  // Получить должность по ID
  getById: async (id) => {
    const response = await apiClient.get(`/positions/${id}`);
    return response.data.data;
  },

  // Создать должность
  create: async (data) => {
    const response = await apiClient.post("/positions", data);
    return response.data.data;
  },

  // Обновить должность
  update: async (id, data) => {
    const response = await apiClient.put(`/positions/${id}`, data);
    return response.data.data;
  },

  // Удалить должность
  delete: async (id) => {
    const response = await apiClient.delete(`/positions/${id}`);
    return response.data.data || { success: true };
  },

  // Получить сотрудников по должности
  getEmployees: async (id) => {
    const response = await apiClient.get(`/positions/${id}/employees`);
    return response.data.data;
  },
};
