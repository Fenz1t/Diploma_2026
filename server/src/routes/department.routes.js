const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");
const { validate, common, department } = require("../middlewares/validators");

router.get("/", departmentController.getAll);

router.get("/hierarchy", departmentController.getHierarchy);

router.get("/select", departmentController.getForSelect);

router.get("/:id", validate(common.idValidator), departmentController.getById);

router.post(
  "/",
  validate(department.createDepartmentValidator),
  departmentController.create
);

router.put(
  "/:id",
  validate([...common.idValidator, ...department.updateDepartmentValidator]),
  departmentController.update
);

router.delete(
  "/:id",
  validate(common.idValidator),
  departmentController.delete
);

module.exports = router;
