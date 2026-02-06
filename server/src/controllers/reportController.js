const reportService = require("../services/reportService");
const fs = require("fs");
const path = require("path");

class ReportController {
  // ==================== ПРОСМОТР ОТЧЕТОВ ====================

  async getKPIReport(req, res) {
    try {
      const report = await reportService.generateKPIReport(req.query);
      res.json({ success: true, data: report });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  async getDepartmentsReport(req, res) {
    try {
      const report = await reportService.generateDepartmentsReport();
      res.json({ success: true, data: report });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  async getRisksReport(req, res) {
    try {
      const report = await reportService.generateRisksReport();
      res.json({ success: true, data: report });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

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

      // Расширяем список поддерживаемых типов
      const supportedTypes = [
        "employees",
        "workload",
        "kpi",
        "departments",
        "risks",
      ];
      if (!supportedTypes.includes(report_type)) {
        return res.status(400).json({
          success: false,
          error: `Неподдерживаемый тип отчета. Доступные: ${supportedTypes.join(", ")}`,
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
      switch (report_type) {
        case "employees":
          reportData = await reportService.generateEmployeesReport(filters);
          break;
        case "workload":
          reportData = await reportService.generateWorkloadReport(filters);
          break;
        case "kpi":
          reportData = await reportService.generateKPIReport(filters);
          break;
        case "departments":
          reportData = await reportService.generateDepartmentsReport();
          break;
        case "risks":
          reportData = await reportService.generateRisksReport();
          break;
        default:
          return res.status(400).json({
            success: false,
            error: "Тип отчета не реализован",
          });
      }

      console.log(
        `📊 Report data generated: ${reportData.data?.length || reportData.departments?.length || 0} records`,
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

      // Отправляем файл
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

  async quickExport(req, res) {
    try {
      const { type, format } = req.query;
      console.log("Quick export params:", { type, format });

      if (!type || !format) {
        return res.status(400).json({
          success: false,
          error: "Не указаны тип отчета или формат",
        });
      }

      // Расширяем список поддерживаемых типов
      const supportedTypes = [
        "employees",
        "workload",
        "kpi",
        "departments",
        "risks",
      ];
      if (!supportedTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Неподдерживаемый тип отчета. Доступные: ${supportedTypes.join(", ")}`,
        });
      }

      // Простой отчет
      let reportData;
      switch (type) {
        case "employees":
          reportData = await reportService.generateEmployeesReport({});
          break;
        case "workload":
          reportData = await reportService.generateWorkloadReport({});
          break;
        case "kpi":
          reportData = await reportService.generateKPIReport({});
          break;
        case "departments":
          reportData = await reportService.generateDepartmentsReport();
          break;
        case "risks":
          reportData = await reportService.generateRisksReport();
          break;
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
