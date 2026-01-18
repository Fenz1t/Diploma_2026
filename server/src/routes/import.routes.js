const express = require("express");
const router = express.Router();
const importController = require("../controllers/importController");
const upload = require("../middlewares/uploadWorkFilesMiddleware");

// ==================== ОСНОВНОЙ ИМПОРТ ====================

// Импорт файла с данными
router.post("/import", upload.single("file"), importController.importFile);

// Проверка файла перед импортом
router.post(
  "/import/validate",
  upload.single("file"),
  importController.validateFile,
);

// ==================== ШАБЛОНЫ ====================

// Скачать шаблон файла
router.get(
  "/import/templates/:type/:format",
  importController.downloadTemplate,
);

// Просмотреть шаблон (JSON)
router.get("/import/templates/:type", importController.downloadTemplate);

// ==================== ИСТОРИЯ И СТАТУС ====================

// История импортов
router.get("/import/history", importController.getImportHistory);

// Статус последнего импорта
router.get("/import/status", (req, res) => {
  res.json({
    success: true,
    data: {
      service: "import",
      status: "active",
      supported_formats: ["xlsx", "xls", "csv", "json"],
      max_file_size: "10MB",
    },
  });
});

module.exports = router;
