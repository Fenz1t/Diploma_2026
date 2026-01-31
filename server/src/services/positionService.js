const db = require("../db/models");
const { Op } = require("sequelize");

class PositionService {
  // Получить все должности
  async getAllPositions({ page = 1, limit = 10, search = "" }) {
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await db.Position.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["name", "ASC"]],
    });

    return {
      positions: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getPositionById(id) {
    const position = await db.Position.findByPk(id);
    if (!position) {
      throw new Error("Должность не найдена");
    }
    return position;
  }

  // Создать должность
  async createPosition(positionData) {
    const existingPosition = await db.Position.findOne({
      where: { name: positionData.name },
    });

    if (existingPosition) {
      throw new Error("Должность с таким названием уже существует");
    }

    return await db.Position.create(positionData);
  }

  // Обновить должность
  async updatePosition(id, positionData) {
    const position = await this.getPositionById(id);

    // Проверяем уникальность названия (если меняется)
    if (positionData.name && positionData.name !== position.name) {
      const existingPosition = await db.Position.findOne({
        where: { name: positionData.name },
      });

      if (existingPosition) {
        throw new Error("Должность с таким названием уже существует");
      }
    }

    return await position.update(positionData);
  }

  // Удалить должность
  async deletePosition(id) {
    const position = await this.getPositionById(id);

    const employeeCount = await position.countEmployees();
    if (employeeCount > 0) {
      throw new Error(
        "Нельзя удалить должность, к которой привязаны сотрудники",
      );
    }

    await position.destroy();
    return { message: "Должность успешно удалена" };
  }

  // Получить всех сотрудников с этой должностью
  // Получить всех сотрудников с этой должностью
  async getEmployeesByPosition(positionId) {
    const position = await db.Position.findByPk(positionId, {
      include: [
        {
          model: db.Employee,
          as: "employees", // Убедитесь, что это соответствует вашему алиасу в модели
          include: [
            {
              model: db.Department,
              as: "department", // Включить информацию о департаменте, если нужно
            },
          ],
          attributes: { exclude: ["password"] }, // Исключить пароль, если есть
        },
      ],
    });

    if (!position) {
      throw new Error("Должность не найдена");
    }

    return position.employees || [];
  }
}

module.exports = new PositionService();
