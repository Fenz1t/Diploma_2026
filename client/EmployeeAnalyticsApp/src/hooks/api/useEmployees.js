import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "../../services/api/employeesApi";
import { Alert } from "react-native";

export const useEmployeesByDepartment = (
  departmentId,
  includeChildren = false,
) => {
  return useQuery({
    queryKey: ["employeesByDepartment", departmentId, includeChildren],
    queryFn: () => employeesApi.getByDepartment(departmentId, includeChildren),
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEmployeeById = (employeeId) => {
  return useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => employeesApi.getById(employeeId),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => employeesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeesByDepartment"] });
      queryClient.invalidateQueries({ queryKey: ["employee"] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => employeesApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Инвалидируем все запросы сотрудников после удаления
      queryClient.invalidateQueries({ queryKey: ["employeesByDepartment"] });
      queryClient.invalidateQueries({ queryKey: ["employee"] });

      Alert.alert("Успешно", "Сотрудник удален");
    },
    onError: (error) => {
      console.error("Ошибка удаления:", error);
      Alert.alert(
        "Ошибка",
        error.response?.data?.message || "Не удалось удалить сотрудника",
      );
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => employeesApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["employee", data?.id]);
      queryClient.invalidateQueries(["employeesByDepartment"]);
    },
  });
};
