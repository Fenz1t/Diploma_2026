import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentsApi } from "../../services/api/departmentsApi";

export const useDepartmentsHierarchy = () =>
  useQuery({
    queryKey: ["departmentsHierarchy"],
    queryFn: departmentsApi.getHierarchy,
    staleTime: 5 * 60 * 1000,
  });

export const useDepartmentsSelect = () =>
  useQuery({
    queryKey: ["departmentsSelect"],
    queryFn: departmentsApi.getSelect,
    staleTime: 10 * 60 * 1000,
  });

export const useCreateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departmentsHierarchy"] });
      qc.invalidateQueries({ queryKey: ["departmentsSelect"] });
    },
  });
};

export const useUpdateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => departmentsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departmentsHierarchy"] });
      qc.invalidateQueries({ queryKey: ["departmentsSelect"] });
    },
  });
};

export const useDeleteDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departmentsHierarchy"] });
      qc.invalidateQueries({ queryKey: ["departmentsSelect"] });
    },
  });
};
