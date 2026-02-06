import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { positionApi } from "../../services/api/positionApi";

export const usePositions = (params = {}) => {
  return useQuery({
    queryKey: ["positions", params],
    queryFn: () => positionApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

export const usePosition = (id) => {
  return useQuery({
    queryKey: ["position", id],
    queryFn: () => positionApi.getById(id),
    enabled: !!id, // Запускаем только если есть ID
  });
};

export const useCreatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: positionApi.create,
    onSuccess: () => {
      // Инвалидируем кэш списка должностей
      queryClient.invalidateQueries(["positions"]);
    },
    onError: (error) => {
      console.error("Error creating position:", error);
    },
  });
};

export const usePositionEmployees = (positionId) => {
  return useQuery({
    queryKey: ["positionEmployees", positionId],
    queryFn: () => positionApi.getEmployees(positionId),
    enabled: !!positionId,
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => positionApi.update(id, data),
    onSuccess: (_, variables) => {
      // Инвалидируем и список и конкретную должность
      queryClient.invalidateQueries(["positions"]);
      queryClient.invalidateQueries(["position", variables.id]);
    },
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: positionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(["positions"]);
    },
  });
};
