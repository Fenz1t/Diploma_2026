import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importApi } from "../../services/api/importApi";

export const useImportKanban = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileAsset) => importApi.importKanbanFile(fileAsset),
    onSuccess: () => {
      // Обновляем экраны, которые зависят от новых данных
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projectStatistics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["employeesByDepartment"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

export const useValidateKanbanImport = () => {
  return useMutation({
    mutationFn: (fileAsset) => importApi.validateKanbanFile(fileAsset),
  });
};
