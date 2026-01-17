const express = require("express");
const router = express.Router();

// Подключение всех роутов
router.use("/positions", require("./position.routes"));
router.use("/projects", require("./project.routes"));
router.use("/departments", require("./department.routes"));
router.use("/employees", require("./employee.routes"));
router.use("/analytics", require("./analytics.routes"));
router.use("/reports", require("./report.routes"));


module.exports = router;
