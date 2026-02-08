const db = require("../db/models");

class ProjectMembersService {
  async getLatestWeek() {
    const row = await db.WorkloadEntry.findOne({
      attributes: [
        [db.sequelize.fn("MAX", db.sequelize.col("week_start_date")), "week"],
      ],
      raw: true,
    });

    if (!row?.week) {
      throw new Error("Нет загруженных данных (week_start_date)");
    }
    return row.week;
  }

  async addEmployeeToProject(projectId, employeeId) {
    const week = await this.getLatestWeek();

    // Проверка: есть ли уже запись
    const existing = await db.WorkloadEntry.findOne({
      where: {
        project_id: projectId,
        employee_id: employeeId,
        week_start_date: week,
      },
    });

    if (existing) {
      return existing;
    }

    return await db.WorkloadEntry.create({
      project_id: projectId,
      employee_id: employeeId,
      week_start_date: week,
      workload_percent: 0,
      tasks_completed: 0,
      tasks_overdue: 0,
    });
  }

  async removeEmployeeFromProject(projectId, employeeId) {
    const week = await this.getLatestWeek();

    await db.WorkloadEntry.destroy({
      where: {
        project_id: projectId,
        employee_id: employeeId,
        week_start_date: week,
      },
    });

    return { success: true };
  }

  async listProjectEmployees(projectId) {
    const week = await this.getLatestWeek();

    const entries = await db.WorkloadEntry.findAll({
      where: {
        project_id: projectId,
        week_start_date: week,
      },
      include: [
        {
          model: db.Employee,
          as: "employee",
          attributes: [
            "id",
            "full_name",
            "email",
            "department_id",
            "position_id",
          ],
        },
      ],
    });

    return entries.map((e) => ({
      employee: e.employee,
      workload_percent: e.workload_percent,
      tasks_completed: e.tasks_completed,
      tasks_overdue: e.tasks_overdue,
    }));
  }
}

module.exports = new ProjectMembersService();
