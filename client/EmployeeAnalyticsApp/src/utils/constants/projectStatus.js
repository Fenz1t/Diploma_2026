export const PROJECT_STATUSES = {
  PLANNED: "planned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUSES.PLANNED]: "Запланирован",
  [PROJECT_STATUSES.IN_PROGRESS]: "В работе",
  [PROJECT_STATUSES.COMPLETED]: "Завершен",
  [PROJECT_STATUSES.CANCELLED]: "Отменен",
};

export const PROJECT_STATUS_COLORS = {
  [PROJECT_STATUSES.PLANNED]: "#FFA726", // Оранжевый
  [PROJECT_STATUSES.IN_PROGRESS]: "#2196F3", // Синий
  [PROJECT_STATUSES.COMPLETED]: "#4CAF50", // Зеленый
  [PROJECT_STATUSES.CANCELLED]: "#F44336", // Красный
};
