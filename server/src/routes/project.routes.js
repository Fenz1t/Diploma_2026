const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { validate, common, project } = require("../middlewares/validators");

router.get("/", validate(common.sortValidator), projectController.getAll);

router.get("/statistics", projectController.getStatistics);

router.get("/active", projectController.getActive);

router.get("/:id", validate(common.idValidator), projectController.getById);

router.post(
  "/",
  validate(project.createProjectValidator),
  projectController.create
);

router.put(
  "/:id",
  validate([...common.idValidator, ...project.updateProjectValidator]),
  projectController.update
);

router.patch(
  "/:id/status",
  validate([...common.idValidator, ...project.updateProjectStatusValidator]),
  projectController.updateStatus
);

router.delete("/:id", validate(common.idValidator), projectController.delete);

module.exports = router;
