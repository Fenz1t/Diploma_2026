const express = require("express");
const router = express.Router();

// Подключение всех роутов
router.use("/positions", require("./position.routes"));
router.use("/projects", require("./project.routes"));
router.use('/departments', require('./department.routes'));
router.use('/employees', require('./employee.routes'));

module.exports = router;
