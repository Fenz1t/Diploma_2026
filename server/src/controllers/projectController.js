const projectService = require("../services/projectService");

class ProjectController {
  // Получить все проекты
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search = "", status = "" } = req.query;
      const result = await projectService.getAllProjects({
        page,
        limit,
        search,
        status,
      });

      res.json({
        success: true,
        data: result.projects,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Получить проект по ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const project = await projectService.getProjectById(id);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      const status = error.message === "Проект не найден" ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Создать проект
  async create(req, res) {
    try {
      const projectData = req.body;
      const project = await projectService.createProject(projectData);

      res.status(201).json({
        success: true,
        data: project,
        message: "Проект успешно создан",
      });
    } catch (error) {
      const status = error.message.includes("уже существует") ? 409 : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Обновить проект
  async update(req, res) {
    try {
      const { id } = req.params;
      const projectData = req.body;

      const project = await projectService.updateProject(id, projectData);

      res.json({
        success: true,
        data: project,
        message: "Проект успешно обновлен",
      });
    } catch (error) {
      const status =
        error.message === "Проект не найден"
          ? 404
          : error.message.includes("уже существует")
          ? 409
          : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Удалить проект
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await projectService.deleteProject(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const status =
        error.message === "Проект не найден"
          ? 404
          : error.message.includes("привязаны задачи")
          ? 400
          : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Получить статистику
  async getStatistics(req, res) {
    try {
      const statistics = await projectService.getProjectStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Получить активные проекты
  async getActive(req, res) {
    try {
      const projects = await projectService.getActiveProjects();

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Обновить статус проекта
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: "Статус обязателен",
        });
      }

      const project = await projectService.updateProjectStatus(id, status);

      res.json({
        success: true,
        data: project,
        message: "Статус проекта успешно обновлен",
      });
    } catch (error) {
      const status = error.message === "Проект не найден" ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new ProjectController();
