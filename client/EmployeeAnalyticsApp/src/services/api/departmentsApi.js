import apiClient from "./client";

export const departmentsApi = {
  getAll: async () => {
    const res = await apiClient.get("/departments");
    return res.data.data;
  },

  getHierarchy: async () => {
    const res = await apiClient.get("/departments/hierarchy");
    return res.data.data;
  },

  getSelect: async () => {
    const res = await apiClient.get("/departments/select");
    return res.data.data;
  },

  create: async (payload) => {
    const res = await apiClient.post("/departments", payload);
    return res.data.data;
  },

  update: async (id, payload) => {
    const res = await apiClient.put(`/departments/${id}`, payload);
    return res.data.data;
  },

  remove: async (id) => {
    const res = await apiClient.delete(`/departments/${id}`);
    return res.data;
  },
};
