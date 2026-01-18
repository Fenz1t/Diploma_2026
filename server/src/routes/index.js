const express = require("express");
const router = express.Router();

// Подключение всех роутов
router.use("/positions", require("./position.routes"));
router.use("/projects", require("./project.routes"));
router.use("/departments", require("./department.routes"));
router.use("/employees", require("./employee.routes"));
router.use("/analytics", require("./analytics.routes"));
router.use("/reports", require("./report.routes"));
router.use("/import", require("./import.routes"));

module.exports = router;
