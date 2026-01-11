const { body } = require("express-validator");
const db = require("../../db/models"); 

// Валидация создания должности
const createPositionValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Название должности обязательно")
    .isLength({ min: 2, max: 100 })
    .withMessage("Название должно быть от 2 до 100 символов")
    .matches(/^[a-zA-Zа-яА-ЯёЁ\s\-]+$/)
    .withMessage("Название может содержать только буквы, пробелы и дефисы")
    .custom(async (value) => {
      const existingPosition = await db.Position.findOne({
        where: { name: value },
      });
      if (existingPosition) {
        throw new Error("Должность с таким названием уже существует");
      }
      return true;
    }),
];

// Валидация обновления должности
const updatePositionValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Название должно быть от 2 до 100 символов")
    .matches(/^[a-zA-Zа-яА-ЯёЁ\s\-]+$/)
    .withMessage("Название может содержать только буквы, пробелы и дефисы")
    .custom(async (value, { req }) => {
      if (!value) return true;

      const existingPosition = await db.Position.findOne({
        where: {
          name: value,
          id: { $not: req.params.id },
        },
      });

      if (existingPosition) {
        throw new Error("Должность с таким названием уже существует");
      }
      return true;
    }),
];

module.exports = {
  createPositionValidator,
  updatePositionValidator,
};
