import apiClient from "./client";

export const employeesApi = {
  // Все сотрудники (на будущее)
  getAll: async () => {
    const response = await apiClient.get("/employees");
    return response.data.data;
  },

  // Сотрудники отдела (+ дочерние)
  getByDepartment: async (departmentId, includeChildren = true) => {
    const response = await apiClient.get(
      `/employees/department/${departmentId}`,
      { params: { includeChildren } },
    );
    return response.data.data;
  },

  // Один сотрудник (на будущее)
  getById: async (id) => {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data.data;
  },
};
