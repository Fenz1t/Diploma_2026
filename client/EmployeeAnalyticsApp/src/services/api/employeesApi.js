import apiClient from "./client";

const appendIfDefined = (formData, key, value) => {
  if (value === undefined || value === null || value === "") return;
  formData.append(key, value);
};

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

  // Создание сотрудника (+ фото)
  create: async (payload) => {
    const formData = new FormData();

    appendIfDefined(formData, "full_name", payload.full_name?.trim());
    appendIfDefined(formData, "email", payload.email?.trim());
    appendIfDefined(formData, "phone", payload.phone?.trim());
    appendIfDefined(formData, "hire_date", payload.hire_date);
    appendIfDefined(formData, "department_id", payload.department_id);
    appendIfDefined(formData, "position_id", payload.position_id);
    appendIfDefined(formData, "is_active", String(payload.is_active ?? true));

    if (payload.photo) {
      formData.append("photo", {
        uri: payload.photo.uri,
        name: payload.photo.name || `employee-photo-${Date.now()}.jpg`,
        type: payload.photo.type || "image/jpeg",
      });
    }

    const response = await apiClient.post("/employees", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/employees/${id}`);
    return response.data;
  },

  // Обновление сотрудника
  update: async (id, payload) => {
    const response = await apiClient.put(`/employees/${id}`, payload);
    return response.data.data;
  },
};
