import apiClient from "./client";

export const projectApi = {
  // Получить все проекты
  getAll: async (params = {}) => {
    const response = await apiClient.get("/projects", { params });
    return response.data.data;
  },

  // Получить проект по ID
  getById: async (id) => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data.data;
  },

  // Создать проект
  create: async (data) => {
    const response = await apiClient.post("/projects", data);
    return response.data.data;
  },

  // Обновить проект
  update: async (id, data) => {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data.data;
  },

  // Удалить проект
  delete: async (id) => {
    const response = await apiClient.delete(`/projects/${id}`);
    return response.data;
  },

  // Получить статистику по проектам
  getStatistics: async () => {
    const response = await apiClient.get("/projects/statistics");
    return response.data.data;
  },

  // Получить активные проекты
  getActiveProjects: async () => {
    const response = await apiClient.get("/projects/active");
    return response.data.data;
  },

  // Обновить статус проекта
  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/projects/${id}/status`, {
      status,
    });
    return response.data.data;
  },
};
