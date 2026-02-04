const employeeService = require("../services/employeeService");

class EmployeeController {
  async getAll(req, res) {
    try {
      const { search = "" } = req.query;
      const employees = await employeeService.getAllEmployees(search);

      res.json({
        success: true,
        count: employees.length,
        data: employees,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const employee = await employeeService.getEmployeeById(id);

      res.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      const status = error.message === "Сотрудник не найден" ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  async create(req, res) {
    try {
      const employeeData = req.body;
      const photoFile = req.file;

      const employee = await employeeService.createEmployee(
        employeeData,
        photoFile || null,
      );

      res.status(201).json({
        success: true,
        data: employee,
        message: "Сотрудник успешно создан" + (photoFile ? " с фото" : ""),
      });
    } catch (error) {
      const status = error.message.includes("уже существует") ? 409 : 400;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const employeeData = req.body;
      const photoFile = req.file;

      const employee = await employeeService.updateEmployee(
        id,
        employeeData,
        photoFile || null,
      );

      res.json({
        success: true,
        data: employee,
        message:
          "Сотрудник успешно обновлен" + (photoFile ? " (фото обновлено)" : ""),
      });
    } catch (error) {
      const status =
        error.message === "Сотрудник не найден"
          ? 404
          : error.message.includes("уже существует")
            ? 409
            : 400;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await employeeService.deleteEmployee(id);

      res.json({
        success: true,
        message: result.message,
        data: result.employee,
      });
    } catch (error) {
      const status = error.message === "Сотрудник не найден" ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  async activate(req, res) {
    try {
      const { id } = req.params;
      const result = await employeeService.activateEmployee(id);

      res.json({
        success: true,
        message: result.message,
        data: result.employee,
      });
    } catch (error) {
      const status = error.message === "Сотрудник не найден" ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  async deletePhoto(req, res) {
    try {
      const { id } = req.params;
      const result = await employeeService.deleteEmployeePhoto(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const status =
        error.message === "Сотрудник не найден"
          ? 404
          : error.message === "У сотрудника нет фото"
            ? 400
            : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getByDepartment(req, res) {
    try {
      const { id } = req.params;

      // includeChildren=true|false
      const includeChildren =
        String(req.query.includeChildren).toLowerCase() === "true";

      const employees = await employeeService.getEmployeesByDepartment(
        id,
        includeChildren,
      );

      res.json({
        success: true,
        count: employees.length,
        includeChildren,
        data: employees,
      });
    } catch (error) {
      const status = error.message === "Отдел не найден" ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new EmployeeController();
