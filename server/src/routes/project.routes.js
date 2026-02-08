const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const projectMembersController = require("../controllers/projectMembersController");
const { validate, common, project } = require("../middlewares/validators");

router.get("/", validate(common.sortValidator), projectController.getAll);

router.get("/statistics", projectController.getStatistics);

router.get("/active", projectController.getActive);

router.get("/:id", validate(common.idValidator), projectController.getById);

router.post(
  "/",
  validate(project.createProjectValidator),
  projectController.create,
);

router.put(
  "/:id",
  validate([...common.idValidator, ...project.updateProjectValidator]),
  projectController.update,
);

router.patch(
  "/:id/status",
  validate([...common.idValidator, ...project.updateProjectStatusValidator]),
  projectController.updateStatus,
);

router.delete("/:id", validate(common.idValidator), projectController.delete);

// список сотрудников проекта
router.get("/:id/employees", projectMembersController.list);

// добавить сотрудника в проект
router.post("/:id/employees", projectMembersController.add);

// удалить сотрудника из проекта
router.delete("/:id/employees/:employeeId", projectMembersController.remove);

module.exports = router;
