const express = require("express");
const router = express.Router();

// Подключение всех роутов
router.use("/positions", require("./position.routes"));
router.use("/projects", require("./project.routes"));
// Позже добавим:
// router.use('/departments', require('./department.routes'));
// router.use('/employees', require('./employee.routes'));
// router.use('/projects', require('./project.routes'));

module.exports = router;
