const { body } = require("express-validator");
const createDepartmentValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Название отдела обязательно")
    .isLength({ min: 2, max: 100 })
    .withMessage("Название должно быть от 2 до 100 символов"),

  body("parent_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ID родительского отдела должен быть числом"),
];

const updateDepartmentValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Название должно быть от 2 до 100 символов"),

  body("parent_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ID родительского отдела должен быть числом"),
];

module.exports = {
  createDepartmentValidator,
  updateDepartmentValidator,
};
