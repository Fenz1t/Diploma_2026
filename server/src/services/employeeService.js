const db = require("../db/models");
const { Op } = require("sequelize");
const { deleteOldPhoto } = require("../middlewares/uploadMiddleware");

class EmployeeService {
  async getAllEmployees(search = "") {
    const where = { is_active: true };

    if (search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return await db.Employee.findAll({
      where,
      include: [
        {
          model: db.Department,
          as: "department",
          attributes: ["id", "name"],
        },
        {
          model: db.Position,
          as: "position",
          attributes: ["id", "name"],
        },
      ],
      order: [["full_name", "ASC"]],
    });
  }

  async getEmployeeById(id) {
    const employee = await db.Employee.findByPk(id, {
      include: [
        {
          model: db.Department,
          as: "department",
          attributes: ["id", "name"],
        },
        {
          model: db.Position,
          as: "position",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!employee) {
      throw new Error("Сотрудник не найден");
    }

    return employee;
  }

  async createEmployee(employeeData, photoFile = null) {
    const existingEmployee = await db.Employee.findOne({
      where: { email: employeeData.email },
    });

    if (existingEmployee) {
      throw new Error("Сотрудник с таким email уже существует");
    }

    if (employeeData.department_id) {
      const department = await db.Department.findByPk(
        employeeData.department_id,
      );
      if (!department) {
        throw new Error("Указанный отдел не существует");
      }
    }

    if (employeeData.position_id) {
      const position = await db.Position.findByPk(employeeData.position_id);
      if (!position) {
        throw new Error("Указанная должность не существует");
      }
    }

    if (photoFile) {
      employeeData.photo_url = `/uploads/employees/${photoFile.filename}`;
    }

    return await db.Employee.create(employeeData);
  }

  async updateEmployee(id, employeeData, photoFile = null) {
    const employee = await this.getEmployeeById(id);

    if (employeeData.email && employeeData.email !== employee.email) {
      const existingEmployee = await db.Employee.findOne({
        where: {
          email: employeeData.email,
          id: { [Op.ne]: id },
        },
      });

      if (existingEmployee) {
        throw new Error("Сотрудник с таким email уже существует");
      }
    }

    if (
      employeeData.department_id &&
      employeeData.department_id !== employee.department_id
    ) {
      const department = await db.Department.findByPk(
        employeeData.department_id,
      );
      if (!department) {
        throw new Error("Указанный отдел не существует");
      }
    }

    if (
      employeeData.position_id &&
      employeeData.position_id !== employee.position_id
    ) {
      const position = await db.Position.findByPk(employeeData.position_id);
      if (!position) {
        throw new Error("Указанная должность не существует");
      }
    }

    if (photoFile) {
      if (employee.photo_url) {
        await deleteOldPhoto(employee.photo_url);
      }

      employeeData.photo_url = `/uploads/employees/${photoFile.filename}`;
    }

    return await employee.update(employeeData);
  }

  async deleteEmployee(id) {
    const employee = await this.getEmployeeById(id);

    await employee.update({ is_active: false });

    return {
      message: "Сотрудник успешно деактивирован",
      employee: await this.getEmployeeById(id),
    };
  }

  async activateEmployee(id) {
    const employee = await this.getEmployeeById(id);

    await employee.update({ is_active: true });

    return {
      message: "Сотрудник успешно активирован",
      employee: await this.getEmployeeById(id),
    };
  }

  async deleteEmployeePhoto(id) {
    const employee = await this.getEmployeeById(id);

    if (!employee.photo_url) {
      throw new Error("У сотрудника нет фото");
    }

    await deleteOldPhoto(employee.photo_url);
    await employee.update({ photo_url: null });

    return { message: "Фото успешно удалено" };
  }

  async getEmployeesByDepartment(departmentId, includeChildren = false) {
    // 1) Проверим, что отдел существует
    const dept = await db.Department.findByPk(departmentId, {
      attributes: ["id"],
    });

    if (!dept) {
      throw new Error("Отдел не найден");
    }

    // 2) Соберём список departmentIds
    let departmentIds = [Number(departmentId)];

    if (includeChildren) {
      departmentIds = await this._getDepartmentTreeIds(Number(departmentId));
    }

    // 3) Получаем сотрудников
    const employees = await db.Employee.findAll({
      where: {
        department_id: { [Op.in]: departmentIds },
        is_active: true,
      },
      include: [
        { model: db.Position, as: "position" },
        {
          model: db.Department,
          as: "department",
          required: true,
        },
      ],
      order: [["full_name", "ASC"]],
    });

    return employees;
  }

  /**
   * Возвращает id всех отделов в ветке (root + descendants).
   * Делается через итеративный BFS, чтобы не упереться в recursion depth.
   */
  async _getDepartmentTreeIds(rootId) {
    const ids = new Set([rootId]);
    let queue = [rootId];

    while (queue.length > 0) {
      const children = await db.Department.findAll({
        where: { parent_id: { [Op.in]: queue } },
        attributes: ["id"],
        raw: true,
      });

      const next = [];
      for (const row of children) {
        const childId = Number(row.id);
        if (!ids.has(childId)) {
          ids.add(childId);
          next.push(childId);
        }
      }

      queue = next;
    }

    return Array.from(ids);
  }
}

module.exports = new EmployeeService();
