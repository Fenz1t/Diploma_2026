import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi } from "../../services/api/analyticsApi";

// Полный дашборд
export const useDashboardData = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => analyticsApi.getDashboard(),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

// Общая статистика
export const useOverallStats = () => {
  return useQuery({
    queryKey: ["overallStats"],
    queryFn: () => analyticsApi.getOverallStats(),
    staleTime: 5 * 60 * 1000,
  });
};

// Статистика по отделам
export const useDepartmentStats = () => {
  return useQuery({
    queryKey: ["departmentStats"],
    queryFn: () => analyticsApi.getDepartmentStats(),
    staleTime: 5 * 60 * 1000,
  });
};

// Топ исполнителей
export const useTopPerformers = (limit = 5) => {
  return useQuery({
    queryKey: ["topPerformers", limit],
    queryFn: () => analyticsApi.getTopPerformers(limit),
    staleTime: 5 * 60 * 1000,
  });
};

// Проблемные зоны
export const useProblemAreas = () => {
  return useQuery({
    queryKey: ["problemAreas"],
    queryFn: () => analyticsApi.getProblemAreas(),
    staleTime: 5 * 60 * 1000,
  });
};

// Аналитика сотрудника
export const useEmployeeAnalytics = (employeeId) => {
  return useQuery({
    queryKey: ["employeeAnalytics", employeeId],
    queryFn: () => analyticsApi.getEmployeeAnalytics(employeeId),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  });
};

// Сотрудники с низкой эффективностью
export const useLowEfficiency = (threshold = 60) => {
  return useQuery({
    queryKey: ["lowEfficiency", threshold],
    queryFn: () => analyticsApi.getLowEfficiency(threshold),
    staleTime: 5 * 60 * 1000,
  });
};

// Мутация для пересчета KPI
export const useRecalculateKPIs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => analyticsApi.recalculateKPIs(),
    onSuccess: () => {
      queryClient.invalidateQueries(["dashboard"]);
      queryClient.invalidateQueries(["overallStats"]);
      queryClient.invalidateQueries(["departmentStats"]);
      queryClient.invalidateQueries(["topPerformers"]);
      queryClient.invalidateQueries(["problemAreas"]);
    },
  });
};
