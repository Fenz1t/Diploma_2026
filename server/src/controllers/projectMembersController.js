const projectMembersService = require("../services/projectMembersService");

class ProjectMembersController {
  async list(req, res) {
    try {
      const { id } = req.params;
      const data = await projectMembersService.listProjectEmployees(id);
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  async add(req, res) {
    try {
      const { id } = req.params;
      const { employee_id } = req.body;

      if (!employee_id) {
        return res.status(400).json({
          success: false,
          error: "employee_id обязателен",
        });
      }

      const data = await projectMembersService.addEmployeeToProject(
        id,
        employee_id,
      );

      res.status(201).json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  async remove(req, res) {
    try {
      const { id, employeeId } = req.params;
      const data = await projectMembersService.removeEmployeeFromProject(
        id,
        employeeId,
      );
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  }
}

module.exports = new ProjectMembersController();
