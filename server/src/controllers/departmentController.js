const departmentService = require('../services/departmentService');
class DepartmentController {
  // Получить все отделы
  async getAll(req, res) {
    try {
      const { search = '' } = req.query;
      const departments = await departmentService.getAllDepartments(search); 
      res.json({
        success: true,
        data: departments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  // Получить отдел по ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const department = await departmentService.getDepartmentById(id);
      
      res.json({
        success: true,
        data: department
      });
    } catch (error) {
      const status = error.message === 'Отдел не найден' ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message
      });
    }
  }
  // Создать отдел
  async create(req, res) {
    try {
      const departmentData = req.body;
      const department = await departmentService.createDepartment(departmentData);
      
      res.status(201).json({
        success: true,
        data: department,
        message: 'Отдел успешно создан'
      });
    } catch (error) {
      const status = error.message.includes('уже существует') ? 409 : 400;
      res.status(status).json({
        success: false,
        error: error.message
      });
    }
  }
  // Обновить отдел
  async update(req, res) {
    try {
      const { id } = req.params;
      const departmentData = req.body;
      
      const department = await departmentService.updateDepartment(id, departmentData);
      
      res.json({
        success: true,
        data: department,
        message: 'Отдел успешно обновлен'
      });
    } catch (error) {
      const status = error.message === 'Отдел не найден' ? 404 : 
                     error.message.includes('уже существует') ? 409 : 400;
      res.status(status).json({
        success: false,
        error: error.message
      });
    }
  }
  // Удалить отдел
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await departmentService.deleteDepartment(id);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const status = error.message === 'Отдел не найден' ? 404 : 
                     error.message.includes('нельзя удалить') ? 400 : 500;
      res.status(status).json({
        success: false,
        error: error.message
      });
    }
  }
  // Получить иерархию отделов
  async getHierarchy(req, res) {
    try {
      const hierarchy = await departmentService.getDepartmentHierarchy();
      
      res.json({
        success: true,
        data: hierarchy
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  // Получить отделы для выпадающего списка
  async getForSelect(req, res) {
    try {
      const { onlyParents } = req.query;
      const departments = await departmentService.getDepartmentsForSelect(onlyParents === 'true');
      
      res.json({
        success: true,
        data: departments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new DepartmentController();