const { body, param, query } = require("express-validator");

const idValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID должен быть положительным числом")
    .toInt(),
];

//(скорее всего меняться будет)
const sortValidator = [
  query("sortBy")
    .optional()
    .isIn(["name", "created_at", "updated_at"])
    .withMessage("Недопустимое поле для сортировки"),
  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Порядок должен быть asc или desc"),
];

module.exports = {
  idValidator,
  sortValidator,
};
