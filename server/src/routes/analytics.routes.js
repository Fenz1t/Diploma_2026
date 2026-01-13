const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// ==================== ДАШБОРД ====================

// Полный дашборд (все данные сразу)
router.get("/dashboard", analyticsController.getDashboardData);

// Отдельные компоненты дашборда
router.get("/dashboard/overall", analyticsController.getOverallStats);
router.get("/dashboard/departments", analyticsController.getDepartmentStats);
router.get("/dashboard/top-performers", analyticsController.getTopPerformers);
router.get("/dashboard/problems", analyticsController.getProblemAreas);

// ==================== КАРТОЧКА СОТРУДНИКА ====================

// Аналитика по конкретному сотруднику
router.get("/employee/:id/analytics", analyticsController.getEmployeeAnalytics);

// ==================== АДМИНИСТРАТИВНЫЕ ====================

// Ручной пересчет KPI (POST для безопасности)
router.post("/kpi/recalculate", analyticsController.calculateKPIs);

// Отчет по низкой эффективности
router.get(
  "/reports/low-efficiency",
  analyticsController.getEmployeeLowEfficiency
);

module.exports = router;
