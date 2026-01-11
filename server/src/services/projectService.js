const db = require("../db/models");
const { Op } = require("sequelize");

class ProjectService {
  // Получить все проекты
  async getAllProjects({ page = 1, limit = 10, search = "", status = "" }) {
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const { count, rows } = await db.project.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    return {
      projects: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Получить проект по ID
  async getProjectById(id) {
    const project = await db.Project.findByPk(id);
    if (!project) {
      throw new Error("Проект не найден");
    }
    return project;
  }

  // Создать проект
  async createProject(projectData) {
    // Проверяем уникальность названия
    const existingProject = await db.Project.findOne({
      where: { name: projectData.name },
    });

    if (existingProject) {
      throw new Error("Проект с таким названием уже существует");
    }

    return await db.Project.create(projectData);
  }

  // Обновить проект
  async updateProject(id, projectData) {
    const project = await this.getProjectById(id);

    // Проверяем уникальность названия (если меняется)
    if (projectData.name && projectData.name !== project.name) {
      const existingProject = await db.project.findOne({
        where: { name: projectData.name },
      });

      if (existingProject) {
        throw new Error("Проект с таким названием уже существует");
      }
    }

    return await project.update(projectData);
  }

  // Удалить проект
  async deleteProject(id) {
    const project = await this.getProjectById(id);

    // Проверяем, есть ли связанные задачи (когда будет модель Task)
    /*
    const Task = require('../models/task');
    const taskCount = await Task.count({
      where: { project_id: id }
    });
    
    if (taskCount > 0) {
      throw new Error("Нельзя удалить проект, к которому привязаны задачи");
    }
    */

    await project.destroy();
    return { message: "Проект успешно удален" };
  }

  // Получить статистику по проектам
  async getProjectStatistics() {
    const statistics = await db.Project.findAll({
      attributes: [
        "status",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    const total = await db.Project.count();

    return {
      total,
      byStatus: statistics.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }

  // Получить активные проекты (в работе)
  async getActiveProjects() {
    return await db.Project.findAll({
      where: {
        status: "in_progress",
      },
      order: [["start_date", "ASC"]],
    });
  }

  // Обновить статус проекта
  async updateProjectStatus(id, status) {
    const validStatuses = ["planned", "in_progress", "completed", "cancelled"];

    if (!validStatuses.includes(status)) {
      throw new Error(
        `Некорректный статус. Допустимые значения: ${validStatuses.join(", ")}`
      );
    }

    const project = await this.getProjectById(id);
    return await project.update({ status });
  }
}

module.exports = new ProjectService();
