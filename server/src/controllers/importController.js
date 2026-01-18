const importService = require("../services/importService");
const fs = require("fs");
const path = require("path");

class ImportController {
  // ==================== ОСНОВНОЙ ИМПОРТ ====================

  async importFile(req, res) {
    try {
      const file = req.file;
      const { import_type = "kanban" } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: "Файл не загружен",
        });
      }

      console.log(
        `📤 Загрузка файла: ${file.originalname}, тип: ${import_type}`,
      );

      // Определяем тип файла
      const fileExt = path
        .extname(file.originalname)
        .toLowerCase()
        .substring(1);

      // Запускаем импорт
      const result = await importService.importFromFile(
        file.path,
        fileExt,
        import_type,
      );

      res.json({
        success: true,
        message: "Импорт успешно завершен",
        data: result,
      });
    } catch (error) {
      console.error("❌ Ошибка импорта:", error);

      // Удаляем файл если есть
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: error.message || "Ошибка при импорте файла",
      });
    }
  }

  // ==================== ПРОВЕРКА ФАЙЛА ====================

  async validateFile(req, res) {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: "Файл не загружен",
        });
      }

      const fileExt = path
        .extname(file.originalname)
        .toLowerCase()
        .substring(1);

      // Парсим файл без сохранения в БД
      const data = await importService.parseFile(file.path, fileExt);
      const validatedData = importService.validateData(data, "kanban");

      // Удаляем временный файл
      fs.unlinkSync(file.path);

      res.json({
        success: true,
        message: "Файл прошел проверку",
        data: {
          total_records: validatedData.length,
          sample_records: validatedData.slice(0, 3),
          columns: Object.keys(validatedData[0] || {}),
        },
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // ==================== ШАБЛОНЫ ФАЙЛОВ ====================

  async downloadTemplate(req, res) {
    try {
      const { type = "kanban", format = "json" } = req.params;

      if (!["kanban", "employees"].includes(type)) {
        return res.status(400).json({
          success: false,
          error: "Неподдерживаемый тип шаблона",
        });
      }

      if (!["json", "csv"].includes(format)) {
        return res.status(400).json({
          success: false,
          error: "Неподдерживаемый формат шаблона",
        });
      }

      // Генерируем шаблон
      const templateData = importService.generateTemplate(type);

      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="template_${type}.json"`,
        );
        res.send(JSON.stringify(templateData, null, 2));
      } else if (format === "csv") {
        // Конвертируем в CSV
        const header = Object.keys(templateData[0]).join(",");
        const rows = templateData.map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(","),
        );
        const csvContent = [header, ...rows].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="template_${type}.csv"`,
        );
        res.send(csvContent);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // ==================== ИСТОРИЯ ИМПОРТОВ ====================

  async getImportHistory(req, res) {
    try {
      // Здесь можно добавить логирование импортов в БД
      res.json({
        success: true,
        data: {
          message: "История импортов будет реализована позже",
          recent_imports: [],
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new ImportController();
