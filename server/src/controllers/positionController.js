const positionService = require("../services/positionService");

class PositionController {
  // Получить все должности (без пагинации)
  async getAll(req, res) {
    try {
      const { search = "" } = req.query;
      const positions = await positionService.getAllPositions({ search });

      res.json({
        success: true,
        data: positions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Получить должность по ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const position = await positionService.getPositionById(id);

      res.json({
        success: true,
        data: position,
      });
    } catch (error) {
      const status = error.message === "Должность не найдена" ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Создать должность
  async create(req, res) {
    try {
      const positionData = req.body;
      const position = await positionService.createPosition(positionData);

      res.status(201).json({
        success: true,
        data: position,
        message: "Должность успешно создана",
      });
    } catch (error) {
      const status = error.message.includes("уже существует") ? 409 : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Обновить должность
  async update(req, res) {
    try {
      const { id } = req.params;
      const positionData = req.body;

      const position = await positionService.updatePosition(id, positionData);

      res.json({
        success: true,
        data: position,
        message: "Должность успешно обновлена",
      });
    } catch (error) {
      const status =
        error.message === "Должность не найдена"
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

  // Удалить должность
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await positionService.deletePosition(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const status =
        error.message === "Должность не найдена"
          ? 404
          : error.message.includes("привязаны сотрудники")
            ? 400
            : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Получить сотрудников с этой должностью
  async getEmployees(req, res) {
    try {
      const { id } = req.params;
      const employees = await positionService.getEmployeesByPosition(id);

      res.json({
        success: true,
        data: employees,
      });
    } catch (error) {
      const status = error.message === "Должность не найдена" ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new PositionController();
