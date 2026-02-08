import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectApi } from "../../services/api/projectApi";

export const useProjects = (params = {}) => {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => projectApi.getAll(params),
    staleTime: 5 * 60 * 1000,
    // Добавь селектор для правильного формата
    select: (data) => {
      console.log("Projects API response:", data); // Для отладки

      // Если data уже содержит projects и pagination (старый формат)
      if (data && data.projects && data.pagination) {
        return {
          success: true,
          data: {
            projects: data.projects,
            pagination: data.pagination,
          },
        };
      }

      // Если API возвращает {success, data: {projects, pagination}}
      if (data && data.data && Array.isArray(data.data.projects)) {
        return data;
      }

      // Если API возвращает просто массив (старый вариант)
      if (Array.isArray(data)) {
        return {
          success: true,
          data: {
            projects: data,
            pagination: null,
          },
        };
      }

      // Fallback
      return {
        success: false,
        data: {
          projects: [],
          pagination: null,
        },
      };
    },
  });
};

export const useProject = (id) => {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => projectApi.getById(id),
    enabled: !!id,
    // Селектор для единичного проекта
    select: (data) => {
      // Если data уже содержит data поле
      if (data && data.data) {
        return data.data;
      }
      // Если data - это сам проект
      if (data && data.id) {
        return data;
      }
      return null;
    },
  });
};

export const useProjectStatistics = () => {
  return useQuery({
    queryKey: ["projectStatistics"],
    queryFn: projectApi.getStatistics,
    staleTime: 2 * 60 * 1000,
    // Селектор для статистики
    select: (data) => {
      // Если API возвращает {success, data: {...}}
      if (data && data.data) {
        return {
          success: true,
          data: data.data,
        };
      }
      // Если data уже объект статистики
      if (data && typeof data === "object") {
        return {
          success: true,
          data: data,
        };
      }
      return {
        success: false,
        data: {},
      };
    },
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
      queryClient.invalidateQueries(["projectStatistics"]);
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => projectApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["projects"]);
      queryClient.invalidateQueries(["project", variables.id]);
      queryClient.invalidateQueries(["projectStatistics"]);
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
      queryClient.invalidateQueries(["projectStatistics"]);
    },
  });
};

export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => projectApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["projects"]);
      queryClient.invalidateQueries(["project", variables.id]);
      queryClient.invalidateQueries(["projectStatistics"]);
    },
  });
};

export const useProjectEmployees = (projectId) => {
  return useQuery({
    queryKey: ["projectEmployees", projectId],
    queryFn: () => projectApi.getProjectEmployees(projectId),
    enabled: !!projectId,
  });
};

export const useAddProjectEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, employeeId }) =>
      projectApi.addEmployeeToProject(projectId, employeeId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(["projectEmployees", vars.projectId]);
    },
  });
};

export const useRemoveProjectEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, employeeId }) =>
      projectApi.removeEmployeeFromProject(projectId, employeeId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(["projectEmployees", vars.projectId]);
    },
  });
};
