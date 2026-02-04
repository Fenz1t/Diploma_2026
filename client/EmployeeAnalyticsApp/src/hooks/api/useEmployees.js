import { useQuery } from "@tanstack/react-query";
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
