const express = require("express");
const router = express.Router();
const positionController = require("../controllers/positionController");
const { validate, common, position } = require("../middlewares/validators");

router.get("/", validate(common.sortValidator), positionController.getAll);

router.get("/:id", validate(common.idValidator), positionController.getById);

router.post(
  "/",
  validate(position.createPositionValidator),
  positionController.create
);

router.put(
  "/:id",
  validate([...common.idValidator, ...position.updatePositionValidator]),
  positionController.update
);

router.delete("/:id", validate(common.idValidator), positionController.delete);

router.get(
  "/:id/employees",
  validate(common.idValidator),
  positionController.getEmployees
);

module.exports = router;
