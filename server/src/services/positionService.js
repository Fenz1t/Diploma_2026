const db = require("../db/models");
const { Op } = require("sequelize");

class PositionService {
  // Получить все должности (без пагинации)
  async getAllPositions({ search = "" } = {}) {
    const where = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const positions = await db.Position.findAll({
      where,
      order: [["name", "ASC"]],
    });

    return positions;
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
  async getEmployeesByPosition(positionId) {
    const position = await db.Position.findByPk(positionId, {
      include: [
        {
          model: db.Employee,
          as: "employees",
          include: [
            {
              model: db.Department,
              as: "department",
            },
          ],
          attributes: { exclude: ["password"] },
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