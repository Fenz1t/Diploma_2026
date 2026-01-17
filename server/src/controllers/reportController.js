const reportService = require("../services/reportService");
const fs = require("fs");
const path = require("path");

class ReportController {
  // ==================== ПРОСМОТР ОТЧЕТОВ ====================

  async getEmployeesReport(req, res) {
    try {
      const filters = {
        department_ids: req.query.departments
          ? req.query.departments.split(",").map(Number)
          : [],
        position_ids: req.query.positions
          ? req.query.positions.split(",").map(Number)
          : [],
        is_active: req.query.active !== "false",
        include_kpi: req.query.kpi === "true",
        date_from: req.query.date_from,
        date_to: req.query.date_to,
      };

      const reportData = await reportService.generateEmployeesReport(filters);

      res.json({
        success: true,
        data: reportData,
      });
    } catch (error) {
      console.error("Employees report error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getWorkloadReport(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        department_ids: req.query.departments
          ? req.query.departments.split(",").map(Number)
          : [],
        project_ids: req.query.projects
          ? req.query.projects.split(",").map(Number)
          : [],
      };

      const reportData = await reportService.generateWorkloadReport(filters);

      res.json({
        success: true,
        data: reportData,
      });
    } catch (error) {
      console.error("Workload report error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // ==================== ЭКСПОРТ ОТЧЕТОВ ====================

  async exportReport(req, res) {
    try {
      const { report_type } = req.params;
      const { format = "excel", ...filters } = req.body;

      console.log("📤 Export request:", { report_type, format, filters });

      if (!["employees", "workload", "projects"].includes(report_type)) {
        return res.status(400).json({
          success: false,
          error: "Неподдерживаемый тип отчета",
        });
      }

      if (!["excel", "pdf"].includes(format)) {
        return res.status(400).json({
          success: false,
          error: "Неподдерживаемый формат экспорта. Используйте excel или pdf",
        });
      }

      // Генерируем данные отчета
      let reportData;
      if (report_type === "employees") {
        reportData = await reportService.generateEmployeesReport(filters);
      } else if (report_type === "workload") {
        reportData = await reportService.generateWorkloadReport(filters);
      } else {
        return res.status(400).json({
          success: false,
          error: "Отчет по проектам пока не реализован",
        });
      }

      console.log(
        `📊 Report data generated: ${reportData.data.length} records`,
      );

      // Экспортируем в нужный формат
      let exportResult;
      if (format === "excel") {
        console.log("📗 Generating Excel...");
        exportResult = await reportService.exportToExcel(
          reportData,
          report_type,
        );
      } else if (format === "pdf") {
        console.log("📘 Generating PDF...");
        exportResult = await reportService.exportToPDF(reportData, report_type);
      }

      console.log(
        `✅ Export successful: ${exportResult.fileName}, size: ${exportResult.buffer?.length || 0} bytes`,
      );

      // Отправляем файл ИЗ БУФЕРА (без сохранения на диск)
      res.setHeader("Content-Type", exportResult.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${exportResult.fileName}"`,
      );
      res.send(exportResult.buffer);
    } catch (error) {
      console.error("❌ Export error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // ==================== БЫСТРЫЙ ЭКСПОРТ ====================

  async quickExport(req, res) {
    try {
      const { type, format } = req.query;

      console.log("Quick export params:", { type, format }); // ← ДЛЯ ДЕБАГА

      if (!type || !format) {
        return res.status(400).json({
          success: false,
          error: "Не указаны тип отчета или формат",
        });
      }

      // Простой отчет
      let reportData;
      if (type === "employees") {
        reportData = await reportService.generateEmployeesReport({});
      } else if (type === "workload") {
        reportData = await reportService.generateWorkloadReport({});
      } else {
        return res.status(400).json({
          success: false,
          error: "Неподдерживаемый тип отчета",
        });
      }

      let exportResult;
      if (format === "excel") {
        exportResult = await reportService.exportToExcel(reportData, type);
      } else if (format === "pdf") {
        exportResult = await reportService.exportToPDF(reportData, type);
      } else {
        return res.status(400).json({
          success: false,
          error: "Неподдерживаемый формат",
        });
      }

      // УБЕДИСЬ ЧТО exportResult содержит buffer!
      console.log("Export result:", {
        hasBuffer: !!exportResult.buffer,
        bufferType: exportResult.buffer?.constructor?.name,
        fileName: exportResult.fileName,
      });

      if (!exportResult.buffer) {
        throw new Error("Buffer not created");
      }

      // Отправляем файл
      res.setHeader("Content-Type", exportResult.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${exportResult.fileName}"`,
      );
      res.send(exportResult.buffer);
    } catch (error) {
      console.error("Quick export error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new ReportController();
