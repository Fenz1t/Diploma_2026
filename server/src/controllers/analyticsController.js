const analyticsService = require("../services/analyticsService");

class AnalyticsController {
  // ==================== ДЛЯ ДАШБОРДА ====================

  async getDashboardData(req, res) {
    try {
      const [overall, departments, topPerformers, problems] = await Promise.all(
        [
          analyticsService.getOverallStats(),
          analyticsService.getDepartmentStats(),
          analyticsService.getTopPerformers(),
          analyticsService.getProblemAreas(),
        ]
      );

      res.json({
        success: true,
        data: {
          overall,
          departments,
          top_performers: topPerformers,
          problems,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка при загрузке данных дашборда",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  async getOverallStats(req, res) {
    try {
      const data = await analyticsService.getOverallStats();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Ошибка при получении общей статистики",
      });
    }
  }

  async getDepartmentStats(req, res) {
    try {
      const data = await analyticsService.getDepartmentStats();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Ошибка при получении статистики по отделам",
      });
    }
  }

  async getTopPerformers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const data = await analyticsService.getTopPerformers(limit);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Ошибка при получении топ сотрудников",
      });
    }
  }

  async getProblemAreas(req, res) {
    try {
      const data = await analyticsService.getProblemAreas();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Ошибка при получении проблемных зон",
      });
    }
  }

  // ==================== ДЛЯ КАРТОЧКИ СОТРУДНИКА ====================

  async getEmployeeAnalytics(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: "Некорректный ID сотрудника",
        });
      }

      const data = await analyticsService.getEmployeeAnalytics(parseInt(id));

      res.json({
        success: true,
        data,
        employee_id: parseInt(id),
      });
    } catch (error) {
      console.error("Employee analytics error:", error);

      if (error.message === "Сотрудник не найден") {
        return res.status(404).json({
          success: false,
          message: "Сотрудник не найден или не активен",
        });
      }

      res.status(500).json({
        success: false,
        message: "Ошибка при получении аналитики сотрудника",
      });
    }
  }

  // ==================== ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ====================

  async calculateKPIs(req, res) {
    try {
      // Для запуска вручную (обычно делается по cron)
      await analyticsService.calculateAndStoreKPIs();

      res.json({
        success: true,
        message: "KPI успешно пересчитаны и сохранены",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Ошибка при расчете KPI",
      });
    }
  }

  async getEmployeeLowEfficiency(req, res) {
    try {
      const threshold = parseInt(req.query.threshold) || 60;
      const data = await analyticsService.getLowEfficiencyEmployees(threshold);

      res.json({
        success: true,
        data,
        threshold,
        count: data.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Ошибка при получении сотрудников с низкой эффективностью",
      });
    }
  }
}

module.exports = new AnalyticsController();
