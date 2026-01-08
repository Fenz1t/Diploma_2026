const { body, param, query } = require("express-validator");

// Валидатор для создания проекта
const createProjectValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Название проекта обязательно")
    .isLength({ min: 3, max: 255 })
    .withMessage("Название должно быть от 3 до 255 символов"),

  body("description")
    .optional()
    .isString()
    .withMessage("Описание должно быть строкой"),

  body("start_date")
    .notEmpty()
    .withMessage("Дата начала обязательна")
    .isDate()
    .withMessage("Дата должна быть в формате YYYY-MM-DD"),

  body("end_date")
    .optional()
    .isDate()
    .withMessage("Дата окончания должна быть в формате YYYY-MM-DD")
    .custom((value, { req }) => {
      if (
        value &&
        req.body.start_date &&
        new Date(value) < new Date(req.body.start_date)
      ) {
        throw new Error("Дата окончания не может быть раньше даты начала");
      }
      return true;
    }),

  body("status")
    .optional()
    .isIn(["planned", "in_progress", "completed", "cancelled"])
    .withMessage("Некорректный статус проекта"),
];

// Валидатор для обновления проекта
const updateProjectValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Название должно быть от 3 до 255 символов"),

  body("description")
    .optional()
    .isString()
    .withMessage("Описание должно быть строкой"),

  body("start_date")
    .optional()
    .isDate()
    .withMessage("Дата должна быть в формате YYYY-MM-DD"),

  body("end_date")
    .optional()
    .isDate()
    .withMessage("Дата окончания должна быть в формате YYYY-MM-DD")
    .custom((value, { req }) => {
      if (
        value &&
        req.body.start_date &&
        new Date(value) < new Date(req.body.start_date)
      ) {
        throw new Error("Дата окончания не может быть раньше даты начала");
      }
      return true;
    }),

  body("status")
    .optional()
    .isIn(["planned", "in_progress", "completed", "cancelled"])
    .withMessage("Некорректный статус проекта"),
];

// Валидатор для обновления статуса
const updateProjectStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Статус обязателен")
    .isIn(["planned", "in_progress", "completed", "cancelled"])
    .withMessage("Некорректный статус проекта"),
];

// Экспортируем
module.exports = {
  createProjectValidator,
  updateProjectValidator,
  updateProjectStatusValidator,
};
