
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

    const { count, rows } = await db.position.findAndCountAll({
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
    const position = await db.position.findByPk(id);
    if (!position) {
      throw new Error("Должность не найдена");
    }
    return position;
  }

  // Создать должность
  async createPosition(positionData) {
    const existingPosition = await db.position.findOne({
      where: { name: positionData.name },
    });

    if (existingPosition) {
      throw new Error("Должность с таким названием уже существует");
    }

    return await db.position.create(positionData);
  }

  // Обновить должность
  async updatePosition(id, positionData) {
    const position = await this.getPositionById(id);

    // Проверяем уникальность названия (если меняется)
    if (positionData.name && positionData.name !== position.name) {
      const existingPosition = await db.position.findOne({
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

    // Временно закомментируем проверку на сотрудников
    // const employeeCount = await position.countEmployees();
    // if (employeeCount > 0) {
    //   throw new Error(
    //     "Нельзя удалить должность, к которой привязаны сотрудники"
    //   );
    // }

    await position.destroy();
    return { message: "Должность успешно удалена" };
  }

  // Получить всех сотрудников с этой должностью
  async getEmployeesByPosition(positionId) {
    const position = await db.position.findByPk(positionId);

    if (!position) {
      throw new Error("Должность не найдена");
    }

    // Временно возвращаем пустой массив
    return [];
  }
}

module.exports = new PositionService();
