const db = require("../db/models");
const { Op } = require("sequelize");

class AnalyticsService {
  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  getCurrentWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  getPreviousWeekStart() {
    const current = this.getCurrentWeekStart();
    const previous = new Date(current);
    previous.setDate(previous.getDate() - 7);
    return previous;
  }
  // ==================== ДЛЯ ДАШБОРДА ====================
  async getOverallStats() {
    const currentWeek = this.getCurrentWeekStart();

    const totalEmployees = await db.Employee.count({
      where: { is_active: true },
    });

    const activeProjects = await db.Project.count({
      where: { status: "active" },
    });

    const workloads = await db.WorkloadEntry.findAll({
      where: { week_start_date: currentWeek },
      attributes: ["workload_percent", "tasks_completed", "tasks_overdue"],
    });

    const avgWorkload =
      workloads.length > 0
        ? workloads.reduce((sum, w) => sum + w.workload_percent, 0) /
          workloads.length
        : 0;

    let totalCompleted = 0;
    let totalOverdue = 0;
    workloads.forEach((w) => {
      totalCompleted += w.tasks_completed || 0;
      totalOverdue += w.tasks_overdue || 0;
    });

    const totalTasks = totalCompleted + totalOverdue;
    const overallEfficiency =
      totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

    return {
      total_employees: totalEmployees,
      active_projects: activeProjects,
      avg_workload: Math.round(avgWorkload),
      overall_efficiency: Math.round(overallEfficiency * 10) / 10,
      overdue_tasks: totalOverdue,
    };
  }

  async getDepartmentStats() {
    const departments = await db.Department.findAll({
      include: [
        {
          model: db.Employee,
          as: "employees",
          where: { is_active: true },
          required: false,
        },
      ],
    });

    const stats = await Promise.all(
      departments.map(async (dept) => {
        const employeeIds = dept.employees.map((e) => e.id);

        if (employeeIds.length === 0) {
          return {
            id: dept.id,
            name: dept.name,
            employee_count: 0,
            avg_workload: 0,
            avg_efficiency: 0,
          };
        }

        const workloads = await db.WorkloadEntry.findAll({
          where: {
            employee_id: employeeIds,
            week_start_date: this.getCurrentWeekStart(),
          },
        });

        const avgWorkload =
          workloads.length > 0
            ? workloads.reduce((sum, w) => sum + w.workload_percent, 0) /
              workloads.length
            : 0;

        let deptCompleted = 0;
        let deptOverdue = 0;

        workloads.forEach((w) => {
          deptCompleted += w.tasks_completed || 0;
          deptOverdue += w.tasks_overdue || 0;
        });

        const deptEfficiency =
          deptCompleted + deptOverdue > 0
            ? (deptCompleted / (deptCompleted + deptOverdue)) * 100
            : 0;

        return {
          id: dept.id,
          name: dept.name,
          employee_count: employeeIds.length,
          avg_workload: Math.round(avgWorkload),
          avg_efficiency: Math.round(deptEfficiency * 10) / 10,
        };
      }),
    );

    return stats.sort((a, b) => b.avg_efficiency - a.avg_efficiency);
  }

  async getTopPerformers(limit = 5) {
    const currentWeek = this.getCurrentWeekStart();

    const employees = await db.Employee.findAll({
      where: { is_active: true },
      include: [
        {
          model: db.WorkloadEntry,
          as: "workloads",
          where: { week_start_date: currentWeek },
          required: false,
        },
      ],
    });

    const withEfficiency = employees.map((emp) => {
      let completed = 0;
      let overdue = 0;

      emp.workloads.forEach((w) => {
        completed += w.tasks_completed || 0;
        overdue += w.tasks_overdue || 0;
      });

      const totalTasks = completed + overdue;
      const efficiency = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;

      return {
        id: emp.id,
        full_name: emp.full_name,
        department_id: emp.department_id,
        efficiency: Math.round(efficiency * 10) / 10,
        completed_tasks: completed,
        overdue_tasks: overdue,
      };
    });

    return withEfficiency
      .filter((e) => e.efficiency > 0)
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, limit);
  }

  async getProblemAreas() {
    const problems = [];
    const currentWeek = this.getCurrentWeekStart();

    const overloaded = await db.WorkloadEntry.findAll({
      where: {
        week_start_date: currentWeek,
        workload_percent: { [Op.gt]: 85 },
      },
      include: [
        {
          model: db.Employee,
          as: "employee",
          attributes: ["id", "full_name"],
        },
      ],
    });

    if (overloaded.length > 0) {
      problems.push({
        type: "overload",
        message: `${overloaded.length} сотрудников перегружены (>85%)`,
        employees: overloaded.map((w) => w.employee.full_name),
        severity: "high",
      });
    }

    const projectsWithOverdue = await db.WorkloadEntry.findAll({
      where: {
        week_start_date: currentWeek,
        tasks_overdue: { [Op.gt]: 0 },
      },
      attributes: [
        "project_id",
        [
          db.sequelize.fn("SUM", db.sequelize.col("tasks_overdue")),
          "total_overdue",
        ],
        [db.sequelize.col("project.name"), "project_name"],
      ],
      group: ["WorkloadEntry.project_id", "project.name"],
      include: [
        {
          model: db.Project,
          as: "project",
          attributes: [],
        },
      ],
      raw: true,
    });

    projectsWithOverdue.forEach((p) => {
      if (p.dataValues.total_overdue > 5) {
        problems.push({
          type: "project_delay",
          message: `Проект "${p.project.name}" имеет ${p.dataValues.total_overdue} просроченных задач`,
          project: p.project.name,
          severity: "medium",
        });
      }
    });

    const lowEfficiency = await this.getLowEfficiencyEmployees(60);
    if (lowEfficiency.length > 0) {
      problems.push({
        type: "low_efficiency",
        message: `${lowEfficiency.length} сотрудников с эффективностью <60%`,
        employees: lowEfficiency.map((e) => e.full_name),
        severity: "medium",
      });
    }

    return problems;
  }

  async getLowEfficiencyEmployees(threshold = 60) {
    const employees = await db.Employee.findAll({
      where: { is_active: true },
      include: [
        {
          model: db.WorkloadEntry,
          as: "workloads",
          where: { week_start_date: this.getCurrentWeekStart() },
          required: false,
        },
      ],
    });

    return employees
      .filter((emp) => {
        let completed = 0;
        let overdue = 0;

        emp.workloads.forEach((w) => {
          completed += w.tasks_completed || 0;
          overdue += w.tasks_overdue || 0;
        });

        const total = completed + overdue;
        if (total === 0) return false;

        const efficiency = (completed / total) * 100;
        return efficiency < threshold;
      })
      .map((emp) => ({
        id: emp.id,
        full_name: emp.full_name,
        department_id: emp.department_id,
      }));
  }

  // ==================== ДЛЯ КАРТОЧКИ СОТРУДНИКА ====================

  async getEmployeeAnalytics(employeeId) {
    const currentWeek = this.getCurrentWeekStart();
    const previousWeek = this.getPreviousWeekStart();

    const currentWorkloads = await db.WorkloadEntry.findAll({
      where: {
        employee_id: employeeId,
        week_start_date: currentWeek,
      },
      include: [
        {
          model: db.Project,
          as: "project",
          attributes: ["id", "name"],
        },
      ],
    });

    const previousWorkloads = await db.WorkloadEntry.findAll({
      where: {
        employee_id: employeeId,
        week_start_date: previousWeek,
      },
    });

    const fourWeeksAgo = new Date(currentWeek);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const kpiHistory = await db.KPIMetric.findAll({
      where: {
        employee_id: employeeId,
        metric_name: "efficiency",
        period: { [Op.between]: [fourWeeksAgo, currentWeek] },
      },
      order: [["period", "ASC"]],
    });

    const calculateMetrics = (workloads) => {
      let totalWorkload = 0;
      let completed = 0;
      let overdue = 0;
      const projectMap = new Map();

      workloads.forEach((w) => {
        totalWorkload += w.workload_percent || 0;
        completed += w.tasks_completed || 0;
        overdue += w.tasks_overdue || 0;

        if (w.project) {
          const projectId = w.project.id;
          if (!projectMap.has(projectId)) {
            projectMap.set(projectId, {
              name: w.project.name,
              workload: 0,
              completed: 0,
              overdue: 0,
            });
          }
          const proj = projectMap.get(projectId);
          proj.workload += w.workload_percent || 0;
          proj.completed += w.tasks_completed || 0;
          proj.overdue += w.tasks_overdue || 0;
        }
      });

      const avgWorkload =
        workloads.length > 0 ? totalWorkload / workloads.length : 0;
      const totalTasks = completed + overdue;
      const efficiency = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;

      return {
        avgWorkload,
        efficiency,
        completed,
        overdue,
        totalTasks,
        projects: Array.from(projectMap.values()),
        projectCount: projectMap.size,
        totalWorkload,
      };
    };

    const current = calculateMetrics(currentWorkloads);
    const previous = calculateMetrics(previousWorkloads);

    return {
      current_week: {
        workload: Math.round(current.avgWorkload),
        efficiency: Math.round(current.efficiency * 10) / 10,
        tasks_completed: current.completed,
        tasks_overdue: current.overdue,
        task_completion_rate:
          current.totalTasks > 0
            ? Math.round((current.completed / current.totalTasks) * 100)
            : 0,
        active_projects: current.projectCount,
      },

      changes: {
        workload_change: Math.round(current.avgWorkload - previous.avgWorkload),
        efficiency_change:
          Math.round((current.efficiency - previous.efficiency) * 10) / 10,
        tasks_change: current.completed - previous.completed,
      },

      projects: current.projects.map((p) => ({
        name: p.name,
        workload_share:
          current.totalWorkload > 0
            ? Math.round((p.workload / current.totalWorkload) * 100)
            : 0,
        tasks_completed: p.completed,
        tasks_overdue: p.overdue,
      })),

      kpi_history: kpiHistory.map((k) => {
        // Безопасное преобразование даты
        let weekFormatted = "—";
        if (k.period) {
          try {
            const date =
              k.period instanceof Date ? k.period : new Date(k.period);
            if (!isNaN(date.getTime())) {
              weekFormatted = date.toISOString().split("T")[0];
            }
          } catch (e) {
            // Если ошибка - оставляем как есть
            weekFormatted = String(k.period).split("T")[0] || "—";
          }
        }

        return {
          week: weekFormatted,
          value: k.metric_value,
        };
      }),

      recommendations: this.generateRecommendations(current, previous),
    };
  }

  generateRecommendations(current, previous) {
    const recs = [];

    if (current.avgWorkload > 85) {
      recs.push("Перегрузка! Снизьте нагрузку или перераспределите задачи.");
    }

    if (current.efficiency < 70) {
      recs.push(
        "Эффективность ниже среднего. Рассмотрите дополнительные ресурсы.",
      );
    }

    if (current.overdue > 5) {
      recs.push(
        "Много просроченных задач. Приоритезируйте завершение текущих.",
      );
    }

    if (current.efficiency - previous.efficiency > 10) {
      recs.push("Отличный рост эффективности! Продолжайте в том же духе.");
    }

    return recs.length > 0
      ? recs
      : ["Показатели в норме. Продолжайте работать!"];
  }

  // ==================== ВЫЧИСЛЕНИЕ И СОХРАНЕНИЕ KPI ====================

  async calculateAndStoreKPIs() {
    const employees = await db.Employee.findAll({
      where: { is_active: true },
    });

    const currentWeek = this.getCurrentWeekStart();

    for (const employee of employees) {
      const workloads = await db.WorkloadEntry.findAll({
        where: {
          employee_id: employee.id,
          week_start_date: currentWeek,
        },
      });

      let completed = 0;
      let overdue = 0;
      let totalWorkload = 0;

      workloads.forEach((w) => {
        completed += w.tasks_completed || 0;
        overdue += w.tasks_overdue || 0;
        totalWorkload += w.workload_percent || 0;
      });

      const avgWorkload =
        workloads.length > 0 ? totalWorkload / workloads.length : 0;
      const totalTasks = completed + overdue;
      const efficiency = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;

      await db.KPIMetric.bulkCreate(
        [
          {
            employee_id: employee.id,
            metric_name: "efficiency",
            metric_value: Math.round(efficiency * 10) / 10,
            period: currentWeek,
          },
          {
            employee_id: employee.id,
            metric_name: "avg_workload",
            metric_value: Math.round(avgWorkload),
            period: currentWeek,
          },
          {
            employee_id: employee.id,
            metric_name: "tasks_completed",
            metric_value: completed,
            period: currentWeek,
          },
        ],
        {
          updateOnDuplicate: ["metric_value", "updated_at"],
        },
      );
    }

    console.log(
      `KPI вычислены и сохранены для ${employees.length} сотрудников`,
    );
  }

  async calculateWorkloadFromTasks() {
    try {
      const currentWeek = this.getCurrentWeekStart();

      // 1. Получаем всех активных сотрудников
      const employees = await db.Employee.findAll({
        where: { is_active: true },
        attributes: ["id", "full_name"],
      });

      console.log(
        `🔄 Вычисление workload для ${employees.length} сотрудников...`,
      );

      let updatedRecords = 0;

      // 2. Для каждого сотрудника вычисляем нагрузку
      for (const employee of employees) {
        const workloads = await db.WorkloadEntry.findAll({
          where: {
            employee_id: employee.id,
            week_start_date: currentWeek,
          },
          include: [
            {
              model: db.Project,
              as: "project",
              attributes: ["id", "name"],
            },
          ],
        });

        if (workloads.length === 0) continue;

        // 3. Считаем общее количество задач сотрудника за неделю
        let totalEmployeeTasks = 0;
        workloads.forEach((w) => {
          const tasksInEntry =
            (w.tasks_completed || 0) + (w.tasks_overdue || 0);
          totalEmployeeTasks += tasksInEntry;
        });

        // 4. Если задач нет - устанавливаем 0 и пропускаем
        if (totalEmployeeTasks === 0) {
          for (const w of workloads) {
            if (w.workload_percent !== 0) {
              w.workload_percent = 0;
              await w.save();
              updatedRecords++;
            }
          }
          continue;
        }

        // 5. Вычисляем процент для каждой записи
        for (const workload of workloads) {
          const tasksInThisEntry =
            (workload.tasks_completed || 0) + (workload.tasks_overdue || 0);

          // Формула: задачи в этом проекте / общие задачи сотрудника * 100
          const calculatedPercent = Math.round(
            (tasksInThisEntry / totalEmployeeTasks) * 100,
          );

          // Ограничиваем 0-100%
          const finalPercent = Math.max(0, Math.min(100, calculatedPercent));

          // Обновляем если значение изменилось
          if (workload.workload_percent !== finalPercent) {
            workload.workload_percent = finalPercent;
            await workload.save();
            updatedRecords++;
          }
        }
      }

      console.log(
        `✅ Workload percentages обновлены: ${updatedRecords} записей`,
      );

      // 6. Автоматически пересчитываем KPI с новыми значениями
      await this.calculateAndStoreKPIs();

      return {
        success: true,
        updated_records: updatedRecords,
        week: currentWeek.toISOString().split("T")[0],
      };
    } catch (error) {
      console.error("❌ Ошибка вычисления workload:", error);
      throw error;
    }
  }

  /**
   * Упрощенная версия для одного сотрудника (для тестов)
   */
  async calculateEmployeeWorkload(employeeId) {
    const currentWeek = this.getCurrentWeekStart();

    const workloads = await db.WorkloadEntry.findAll({
      where: {
        employee_id: employeeId,
        week_start_date: currentWeek,
      },
    });

    let totalTasks = 0;
    workloads.forEach((w) => {
      totalTasks += (w.tasks_completed || 0) + (w.tasks_overdue || 0);
    });

    if (totalTasks === 0) {
      // Если нет задач - устанавливаем 0
      for (const w of workloads) {
        w.workload_percent = 0;
        await w.save();
      }
      return 0;
    }

    // Обновляем каждую запись
    for (const workload of workloads) {
      const tasksInEntry =
        (workload.tasks_completed || 0) + (workload.tasks_overdue || 0);
      const percent = Math.round((tasksInEntry / totalTasks) * 100);
      workload.workload_percent = percent;
      await workload.save();
    }

    return totalTasks;
  }
}

module.exports = new AnalyticsService();
