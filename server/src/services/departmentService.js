const db = require("../db/models");
const { Op } = require("sequelize");

class DepartmentService {
  async getAllDepartments(search = "") {
    const where = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const departments = await db.Department.findAll({
      where,
      order: [["name", "ASC"]],
      include: [
        {
          model: db.Department,
          as: "parent",
          attributes: ["id", "name"],
        },
      ],
    });

    return departments;
  }

  // Получить отдел по ID
  async getDepartmentById(id) {
    const department = await db.Department.findByPk(id, {
      include: [
        {
          model: db.Department,
          as: "parent",
          attributes: ["id", "name"],
        },
        {
          model: db.Department,
          as: "children",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!department) {
      throw new Error("Отдел не найден");
    }

    return department;
  }

  // Создать отдел
  async createDepartment(departmentData) {
    const existingDepartment = await db.Department.findOne({
      where: { name: departmentData.name },
    });

    if (existingDepartment) {
      throw new Error("Отдел с таким названием уже существует");
    }

    // Проверяем циклические ссылки
    if (departmentData.parent_id) {
      const isCircular = await this.isCircularReference(
        null,
        departmentData.parent_id,
      );
      if (isCircular) {
        throw new Error("Невозможно создать циклическую ссылку в иерархии");
      }
    }

    return await db.Department.create(departmentData);
  }

  async updateDepartment(id, departmentData) {
    const department = await this.getDepartmentById(id);

    // Проверяем уникальность названия (если меняется)
    if (departmentData.name && departmentData.name !== department.name) {
      const existingDepartment = await db.Department.findOne({
        where: {
          name: departmentData.name,
          id: { [Op.ne]: id },
        },
      });

      if (existingDepartment) {
        throw new Error("Отдел с таким названием уже существует");
      }
    }

    // Проверяем циклические ссылки
    if (departmentData.parent_id !== undefined) {
      const parentId = departmentData.parent_id;
      const isCircular = await this.isCircularReference(id, parentId);
      if (isCircular) {
        throw new Error("Невозможно создать циклическую ссылку в иерархии");
      }
    }

    return await department.update(departmentData);
  }

  async deleteDepartment(id) {
    const department = await this.getDepartmentById(id);

    // Проверяем, есть ли подотделы
    const childCount = await db.Department.count({
      where: { parent_id: id },
    });

    if (childCount > 0) {
      throw new Error("Нельзя удалить отдел, у которого есть подотделы");
    }

    await department.destroy();
    return { message: "Отдел успешно удален" };
  }

  // Получить иерархию отделов
  async getDepartmentHierarchy() {
    // Функция для рекурсивной загрузки детей
    const loadChildren = async (parentId) => {
      const children = await db.Department.findAll({
        where: { parent_id: parentId },
        order: [["name", "ASC"]],
      });

      // Рекурсивно загружаем детей для каждого дочернего отдела
      for (const child of children) {
        child.dataValues.children = await loadChildren(child.id);
      }

      return children;
    };

    // Получаем корневые отделы
    const rootDepartments = await db.Department.findAll({
      where: { parent_id: null },
      order: [["name", "ASC"]],
    });

    // Для каждого корневого отдела рекурсивно загружаем детей
    for (const department of rootDepartments) {
      department.dataValues.children = await loadChildren(department.id);
    }

    return rootDepartments;
  }

  // Проверка циклических ссылок
  async isCircularReference(id, parentId) {
    if (!parentId) return false;
    if (id === parentId) return true;

    const visited = new Set([id]);
    let current = parentId;

    while (current) {
      if (visited.has(current)) return true;
      visited.add(current);

      const dept = await db.Department.findByPk(current);
      if (!dept || !dept.parent_id) break;
      current = dept.parent_id;
    }

    return false;
  }

  async getDepartmentsForSelect(onlyParents = false) {
    const where = onlyParents ? { parent_id: null } : {};

    const departments = await db.Department.findAll({
      where,
      attributes: ["id", "name", "parent_id"],
      order: [["name", "ASC"]],
    });

    return departments;
  }
}

module.exports = new DepartmentService();
