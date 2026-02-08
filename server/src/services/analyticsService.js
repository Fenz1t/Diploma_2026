const db = require("../db/models");
const { Op } = require("sequelize");

class AnalyticsService {
  /* ===================== HELPERS ===================== */

  async getLatestWeek() {
    const row = await db.WorkloadEntry.findOne({
      attributes: [
        [db.sequelize.fn("MAX", db.sequelize.col("week_start_date")), "week"],
      ],
      raw: true,
    });

    if (!row?.week) {
      throw new Error("Нет загруженных данных");
    }

    return row.week;
  }

  calcFromWorkloads(workloads) {
    let completed = 0;
    let overdue = 0;
    let workloadSum = 0;

    for (const w of workloads) {
      completed += Number(w.tasks_completed || 0);
      overdue += Number(w.tasks_overdue || 0);
      workloadSum += Number(w.workload_percent || 0);
    }

    const totalTasks = completed + overdue;
    const avgWorkload = workloads.length ? workloadSum / workloads.length : 0;
    const efficiency = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;

    return { completed, overdue, totalTasks, avgWorkload, efficiency };
  }

  /* ===================== CALLED IN /dashboard ===================== */

  // Чтобы /dashboard не падал. Позже можешь заменить на реальный расчет из tasks.
  async calculateWorkloadFromTasks() {
    return true;
  }

  /* ===================== OVERALL ===================== */

  async getOverallStats() {
    const week = await this.getLatestWeek();

    const workloads = await db.WorkloadEntry.findAll({
      where: { week_start_date: week },
      raw: true,
    });

    const m = this.calcFromWorkloads(workloads);

    const totalEmployees = await db.Employee.count({
      where: { is_active: true },
    });

    let activeProjects = 0;
    if (db.Project) {
      activeProjects = await db.Project.count({
        where: { status: "in_progress" },
      });
    }

    return {
      total_employees: totalEmployees,
      active_projects: activeProjects,
      avg_workload: Math.round(m.avgWorkload),
      overall_efficiency: Math.round(m.efficiency * 10) / 10,
      completed_tasks: m.completed,
      overdue_tasks: m.overdue,
      week_analyzed: week,
    };
  }

  /* ===================== DEPARTMENTS (AGGREGATED TO TOP LEVEL) ===================== */

  async getDepartmentStats() {
    const week = await this.getLatestWeek();

    // 1) Загружаем все отделы
    const allDepts = await db.Department.findAll({
      attributes: ["id", "name", "parent_id"],
      raw: true,
    });

    if (!allDepts.length) {
      return { week_analyzed: week, departments: [] };
    }

    const byId = new Map(allDepts.map((d) => [d.id, d]));

    // 2) Ищем корень (Руководство) = parent_id null
    const roots = allDepts.filter((d) => d.parent_id == null);
    const leadership = roots.find((d) => d.name === "Руководство") || roots[0];

    if (!leadership) {
      throw new Error("Не найден корневой отдел (parent_id = null)");
    }

    const leadershipId = leadership.id;

    // 3) Верхний уровень = дети руководства
    const topLevel = allDepts.filter((d) => d.parent_id === leadershipId);
    const topIds = new Set(topLevel.map((d) => d.id));

    // 4) deptId -> topDeptId (ребенок руководства)
    const topCache = new Map();

    const getTopDeptId = (deptId) => {
      if (!deptId) return null;
      if (topCache.has(deptId)) return topCache.get(deptId);

      let cur = byId.get(deptId);
      if (!cur) {
        topCache.set(deptId, null);
        return null;
      }

      // если это уже верхний уровень
      if (topIds.has(cur.id)) {
        topCache.set(deptId, cur.id);
        return cur.id;
      }

      // поднимаемся вверх
      while (cur && cur.parent_id != null) {
        const parentId = cur.parent_id;

        // если родитель — руководствo, значит текущий cur был ребенком руководства,
        // но сюда мы не попадаем, потому что это уже topIds.
        // мы идем до тех пор, пока не встретим topIds
        if (topIds.has(parentId)) {
          topCache.set(deptId, parentId);
          return parentId;
        }

        cur = byId.get(parentId);

        // если дошли до руководства или потеряли родителя — нет верхнего отдела
        if (!cur || cur.id === leadershipId) {
          topCache.set(deptId, null);
          return null;
        }

        if (topIds.has(cur.id)) {
          topCache.set(deptId, cur.id);
          return cur.id;
        }
      }

      topCache.set(deptId, null);
      return null;
    };

    // 5) Берем записи за неделю + employee, чтобы знать department_id
    const entries = await db.WorkloadEntry.findAll({
      where: { week_start_date: week },
      include: [
        {
          model: db.Employee,
          as: "employee",
          attributes: ["id", "department_id", "is_active"],
          required: true,
          where: { is_active: true },
        },
      ],
    });

    // 6) Агрегируем по TOP отделу
    const agg = new Map(); // topDeptId -> { employeesSet, workloads[] }

    for (const entry of entries) {
      const deptId = entry.employee?.department_id;
      const topDeptId = getTopDeptId(deptId);

      // если сотрудник сидит прямо в руководстве или в каком-то “вне дерева” — пропускаем
      if (!topDeptId) continue;

      if (!agg.has(topDeptId)) {
        agg.set(topDeptId, {
          employeesSet: new Set(),
          workloads: [],
        });
      }

      const bucket = agg.get(topDeptId);
      bucket.employeesSet.add(entry.employee.id);
      bucket.workloads.push({
        tasks_completed: entry.tasks_completed,
        tasks_overdue: entry.tasks_overdue,
        workload_percent: entry.workload_percent,
      });
    }

    // 7) Формируем ответ: только верхнеуровневые отделы
    const result = [];
    for (const top of topLevel) {
      const bucket = agg.get(top.id);
      const workloads = bucket?.workloads || [];
      const m = this.calcFromWorkloads(workloads);

      result.push({
        department_id: top.id,
        department_name: top.name,
        parent_id: top.parent_id,
        employees_count: bucket ? bucket.employeesSet.size : 0,
        avg_workload: Math.round(m.avgWorkload),
        efficiency: Math.round(m.efficiency * 10) / 10,
        tasks_completed: m.completed,
        tasks_overdue: m.overdue,
      });
    }

    // сортировка: по эффективности убыв., затем по нагрузке
    result.sort((a, b) => {
      if (b.efficiency !== a.efficiency) return b.efficiency - a.efficiency;
      return b.avg_workload - a.avg_workload;
    });

    return {
      week_analyzed: week,
      departments: result,
    };
  }

  /* ===================== TOP PERFORMERS ===================== */

  async getTopPerformers(limit = 5) {
    const week = await this.getLatestWeek();

    const employees = await db.Employee.findAll({
      where: { is_active: true },
      attributes: ["id", "full_name", "department_id"],
      include: [
        {
          model: db.WorkloadEntry,
          as: "workloads",
          where: { week_start_date: week },
          required: false,
        },
      ],
    });

    const scored = employees
      .map((e) => {
        const m = this.calcFromWorkloads(e.workloads || []);
        return {
          id: e.id,
          full_name: e.full_name,
          department_id: e.department_id,
          efficiency: Math.round(m.efficiency * 10) / 10,
          avg_workload: Math.round(m.avgWorkload),
          tasks_completed: m.completed,
          tasks_overdue: m.overdue,
          total_tasks: m.totalTasks,
        };
      })
      .filter((x) => x.total_tasks > 0)
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, limit);

    return { week_analyzed: week, top: scored };
  }

  /* ===================== PROBLEM AREAS ===================== */

  async getProblemAreas() {
    const week = await this.getLatestWeek();
    const problems = [];

    const overloaded = await db.WorkloadEntry.findAll({
      where: {
        week_start_date: week,
        workload_percent: { [Op.gt]: 85 },
      },
      include: [{ model: db.Employee, as: "employee" }],
    });

    if (overloaded.length) {
      problems.push({
        type: "overload",
        severity: "high",
        count: overloaded.length,
        employees: overloaded.map((e) => e.employee?.full_name).filter(Boolean),
      });
    }

    const lowEfficiency = await this.getLowEfficiencyEmployees(60);
    if (lowEfficiency.length) {
      problems.push({
        type: "low_efficiency",
        severity: "medium",
        count: lowEfficiency.length,
        employees: lowEfficiency.map((e) => e.full_name),
      });
    }

    return problems;
  }

  /* ===================== LOW EFFICIENCY ===================== */

  async getLowEfficiencyEmployees(threshold) {
    const week = await this.getLatestWeek();

    const employees = await db.Employee.findAll({
      where: { is_active: true },
      include: [
        {
          model: db.WorkloadEntry,
          as: "workloads",
          where: { week_start_date: week },
          required: false,
        },
        {
          model: db.Department,
          as: "department",
          attributes: ["id", "name"],
        },
      ],
    });

    return employees
      .map((e) => {
        const m = this.calcFromWorkloads(e.workloads || []);
        return {
          id: e.id,
          full_name: e.full_name,
          department_id: e.department_id,
          department_name: e.department?.name || "Без отдела",
          efficiency: Math.round(m.efficiency * 10) / 10,
          tasks_completed: m.completed,
          tasks_overdue: m.overdue,
        };
      })
      .filter(
        (e) =>
          e.tasks_completed + e.tasks_overdue > 0 && e.efficiency < threshold,
      );
  }

  /* ===================== EMPLOYEE ANALYTICS ===================== */

  async getEmployeeAnalytics(employeeId) {
    const week = await this.getLatestWeek();

    const workloads = await db.WorkloadEntry.findAll({
      where: { employee_id: employeeId, week_start_date: week },
      include: [{ model: db.Project, as: "project" }],
    });

    const m = this.calcFromWorkloads(workloads);

    // KPI история (эффективность)
    const KpiModel =
      db.KPIMetric || db.KpiMetric || db.Kpi_Metric || db.kpi_metric;

    let kpiHistory = [];
    if (KpiModel) {
      const rows = await KpiModel.findAll({
        where: { employee_id: employeeId, metric_name: "efficiency" },
        order: [["period", "ASC"]],
        raw: true,
      });

      kpiHistory = rows.map((r) => ({
        period: r.period,
        value: Number(r.metric_value ?? r.value ?? 0),
      }));
    }

    return {
      current_week: {
        workload: Math.round(m.avgWorkload),
        efficiency: Math.round(m.efficiency * 10) / 10,
        tasks_completed: m.completed,
        tasks_overdue: m.overdue,
        task_completion_rate: m.totalTasks > 0 ? Math.round(m.efficiency) : 0,
        active_projects: new Set(workloads.map((w) => w.project_id)).size,
      },
      kpi_history: kpiHistory,
      projects: workloads.map((w) => ({
        name: w.project?.name || "Проект",
        workload_share: Number(w.workload_percent || 0),
        tasks_completed: Number(w.tasks_completed || 0),
        tasks_overdue: Number(w.tasks_overdue || 0),
      })),
    };
  }

  /* ===================== KPI RECALCULATION ===================== */

  async calculateAndStoreKPIs() {
    const week = await this.getLatestWeek();

    // Подстройка под имя модели KPI
    const KpiModel =
      db.KpiMetric || db.KPIMetric || db.Kpi_Metric || db.kpi_metric;
    if (!KpiModel) {
      throw new Error("Модель KPI не найдена в db (KpiMetric/KPIMetric)");
    }

    const employees = await db.Employee.findAll({
      where: { is_active: true },
      attributes: ["id"],
      include: [
        {
          model: db.WorkloadEntry,
          as: "workloads",
          where: { week_start_date: week },
          required: false,
        },
      ],
    });

    const rows = [];

    for (const e of employees) {
      const m = this.calcFromWorkloads(e.workloads || []);
      const efficiency =
        m.totalTasks > 0 ? Math.round(m.efficiency * 10) / 10 : 0;
      const avgWorkload = Math.round(m.avgWorkload * 10) / 10;
      const tasksCompleted = Number(m.completed || 0);

      rows.push(
        {
          employee_id: e.id,
          metric_type: "efficiency",
          value: efficiency,
          week_start: week,
        },
        {
          employee_id: e.id,
          metric_type: "avg_workload",
          value: avgWorkload,
          week_start: week,
        },
        {
          employee_id: e.id,
          metric_type: "tasks_completed",
          value: tasksCompleted,
          week_start: week,
        },
      );
    }

    return await db.sequelize.transaction(async (t) => {
      await KpiModel.destroy({ where: { week_start: week }, transaction: t });
      if (rows.length) {
        await KpiModel.bulkCreate(rows, { transaction: t });
      }
      return { week_analyzed: week, inserted: rows.length };
    });
  }
}

module.exports = new AnalyticsService();
