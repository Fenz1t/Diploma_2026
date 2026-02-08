import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "../../services/api/employeesApi";

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
