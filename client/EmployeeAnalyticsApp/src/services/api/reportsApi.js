import apiClient from "./client";

export const reportsApi = {
  getEmployees: async () => {
    const res = await apiClient.get("/reports/employees");
    // Для employees API возвращает { success: true, data: { metadata: {...}, data: [...] } }
    return res.data.data.data; // массив сотрудников
  },

  getWorkload: async () => {
    const res = await apiClient.get("/reports/workload");
    // Для workload API возвращает { success: true, data: { metadata: {...}, data: [...] } }
    return res.data.data.data; // массив с загрузкой
  },

  getKPI: async () => {
    const res = await apiClient.get("/reports/kpi");
    // Для kpi API возвращает { success: true, data: { metadata: {...}, data: [...] } }
    return res.data.data.data; // массив с KPI
  },

  getDepartments: async () => {
    const res = await apiClient.get("/reports/departments");
    // Для departments API возвращает { success: true, data: { week_analyzed: "...", departments: [...] } }
    return res.data.data.departments; // массив отделов
  },

  getRisks: async () => {
    const res = await apiClient.get("/reports/risks");
    // Для risks API возвращает { success: true, data: { metadata: {...}, data: [...] } }
    return res.data.data.data; // массив рисков
  },

  // ================== ЭКСПОРТ ==================

  quickExport: async ({ type, format }) => {
    const res = await apiClient.get("/reports/quick-export", {
      params: { type, format },
      responseType: "arraybuffer",
    });

    return res;
  },
};
