const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

// ==================== ПРОСМОТР ОТЧЕТОВ ====================

// Отчет по сотрудникам (JSON для UI)
router.get("/employees", reportController.getEmployeesReport);

// Отчет по загрузке (JSON для UI)
router.get("/workload", reportController.getWorkloadReport);

router.get("/kpi", reportController.getKPIReport);
router.get("/departments", reportController.getDepartmentsReport);
router.get("/risks", reportController.getRisksReport);

// ==================== ЭКСПОРТ ОТЧЕТОВ ====================

// Экспорт отчета с фильтрами
router.post("/export/:report_type", reportController.exportReport);

// Быстрый экспорт (без фильтров)
router.get("/quick-export", reportController.quickExport);

// ==================== ШАБЛОНЫ ОТЧЕТОВ ====================

// TODO: Добавить позже
// router.get("/templates", reportController.getTemplates);
// router.post("/templates", reportController.saveTemplate);
// router.delete("/templates/:id", reportController.deleteTemplate);

module.exports = router;
