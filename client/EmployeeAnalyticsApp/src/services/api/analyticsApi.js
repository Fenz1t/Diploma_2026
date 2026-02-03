import apiClient from "./client";

// Превращаем что угодно в безопасное число
const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Безопасная строка
const str = (v, fallback = "") => {
  if (v === null || v === undefined) return fallback;
  return String(v);
};

// Нормализация departments в формат, который ждут графики
const normalizeDepartments = (payload) => {
  const arr = Array.isArray(payload)
    ? payload
    : payload?.departments && Array.isArray(payload.departments)
      ? payload.departments
      : [];

  return arr.map((d) => ({
    id: d.id ?? d.department_id,
    name: str(d.name ?? d.department_name, "Отдел"),
    parent_id: d.parent_id ?? null,

    // то, что ждут твои компоненты:
    avg_workload: num(d.avg_workload, 0),
    avg_efficiency: num(d.avg_efficiency ?? d.efficiency, 0),
    employee_count: num(d.employee_count ?? d.employees_count, 0),

    // доп. поля (не мешают, но полезны)
    tasks_completed: num(d.tasks_completed, 0),
    tasks_overdue: num(d.tasks_overdue, 0),
  }));
};

const normalizeTopPerformers = (payload) => {
  const arr = Array.isArray(payload)
    ? payload
    : payload?.top && Array.isArray(payload.top)
      ? payload.top
      : [];

  return arr.map((p) => ({
    id: p.id,
    full_name: str(p.full_name, ""),
    department_id: p.department_id ?? null,
    efficiency: num(p.efficiency, 0),
    avg_workload: num(p.avg_workload, 0),
    tasks_completed: num(p.tasks_completed, 0),
    tasks_overdue: num(p.tasks_overdue, 0),
  }));
};

const normalizeProblems = (payload) => {
  const arr = Array.isArray(payload) ? payload : [];

  return arr.map((p) => ({
    ...p,
    // добавляем message, т.к. ProblemsList его использует
    message:
      p.message ||
      (p.type === "overload"
        ? `Перегрузка сотрудников (${num(p.count, 0)})`
        : p.type === "low_efficiency"
          ? `Низкая эффективность (${num(p.count, 0)})`
          : str(p.type, "Проблема")),
    severity: p.severity || "low",
    employees: Array.isArray(p.employees) ? p.employees : [],
    count: num(p.count, 0),
  }));
};

export const analyticsApi = {
  // Полный дашборд
  getDashboard: async () => {
    const response = await apiClient.get("/analytics/dashboard");
    const data = response.data?.data || {};

    return {
      overall: {
        total_employees: num(data.overall?.total_employees, 0),
        active_projects: num(data.overall?.active_projects, 0),
        avg_workload: num(data.overall?.avg_workload, 0),
        overall_efficiency: num(data.overall?.overall_efficiency, 0),
        completed_tasks: num(data.overall?.completed_tasks, 0),
        overdue_tasks: num(data.overall?.overdue_tasks, 0),
        week_analyzed: data.overall?.week_analyzed,
      },
      departments: normalizeDepartments(data.departments),
      top_performers: normalizeTopPerformers(data.top_performers),
      problems: normalizeProblems(data.problems),
      timestamp: response.data?.timestamp,
    };
  },

  // Общая статистика
  getOverallStats: async () => {
    const response = await apiClient.get("/analytics/dashboard/overall");
    const d = response.data?.data || {};
    return {
      total_employees: num(d.total_employees, 0),
      active_projects: num(d.active_projects, 0),
      avg_workload: num(d.avg_workload, 0),
      overall_efficiency: num(d.overall_efficiency, 0),
      completed_tasks: num(d.completed_tasks, 0),
      overdue_tasks: num(d.overdue_tasks, 0),
      week_analyzed: d.week_analyzed,
    };
  },

  // Статистика по отделам (сразу массив в нужном формате)
  getDepartmentStats: async () => {
    const response = await apiClient.get("/analytics/dashboard/departments");
    return normalizeDepartments(response.data?.data);
  },

  // Топ исполнителей (сразу массив)
  getTopPerformers: async (limit = 5) => {
    const response = await apiClient.get(
      `/analytics/dashboard/top-performers?limit=${limit}`,
    );
    return normalizeTopPerformers(response.data?.data);
  },

  // Проблемные зоны
  getProblemAreas: async () => {
    const response = await apiClient.get("/analytics/dashboard/problems");
    return normalizeProblems(response.data?.data);
  },

  // Аналитика сотрудника
  getEmployeeAnalytics: async (employeeId) => {
    const response = await apiClient.get(
      `/analytics/employee/${employeeId}/analytics`,
    );
    return response.data?.data;
  },

  // Сотрудники с низкой эффективностью
  getLowEfficiency: async (threshold = 60) => {
    const response = await apiClient.get(
      `/analytics/reports/low-efficiency?threshold=${threshold}`,
    );
    return response.data?.data || [];
  },

  // Пересчет KPI
  recalculateKPIs: async () => {
    const response = await apiClient.post("/analytics/kpi/recalculate");
    return response.data;
  },
};
