const { body } = require('express-validator');
const { Op } = require('sequelize');
const db = require("../../db/models"); 

const createEmployeeValidator = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('ФИО обязательно')
    .isLength({ min: 5, max: 255 }).withMessage('ФИО должно быть от 5 до 255 символов'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email обязателен')
    .isEmail().withMessage('Неверный формат email')
    .custom(async (value) => {
      const existing = await db.Employee.findOne({ where: { email: value } });
      if (existing) throw new Error('Email уже используется');
      return true;
    }),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Неверный формат телефона'),
  
  body('hire_date')
    .notEmpty().withMessage('Дата приема обязательна')
    .isDate().withMessage('Неверный формат даты')
    .isBefore(new Date().toISOString()).withMessage('Дата приема не может быть в будущем'),
  
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active должен быть true/false'),
  
  body('department_id')
    .optional()
    .isInt({ min: 1 }).withMessage('ID отдела должен быть числом')
    .custom(async (value) => {
      if (!value) return true;
      const department = await db.Department.findByPk(value);
      if (!department) throw new Error('Отдел не найден');
      return true;
    }),
  
  body('position_id')
    .optional()
    .isInt({ min: 1 }).withMessage('ID должности должен быть числом')
    .custom(async (value) => {
      if (!value) return true;
      const position = await db.Position.findByPk(value);
      if (!position) throw new Error('Должность не найдена');
      return true;
    })
];

const updateEmployeeValidator = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 }).withMessage('ФИО должно быть от 5 до 255 символов'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Неверный формат email')
    .custom(async (value, { req }) => {
      if (!value) return true;
      
      const existing = await db.Employee.findOne({ 
        where: { 
          email: value,
          id: { [Op.ne]: req.params.id }
        }
      });
      
      if (existing) throw new Error('Email уже используется');
      return true;
    }),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Неверный формат телефона'),
  
  body('hire_date')
    .optional()
    .isDate().withMessage('Неверный формат даты')
    .isBefore(new Date().toISOString()).withMessage('Дата приема не может быть в будущем'),
  
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active должен быть true/false'),
  
  body('department_id')
    .optional()
    .isInt({ min: 1 }).withMessage('ID отдела должен быть числом')
    .custom(async (value) => {
      if (!value) return true;
      const department = await db.Department.findByPk(value);
      if (!department) throw new Error('Отдел не найден');
      return true;
    }),
  
  body('position_id')
    .optional()
    .isInt({ min: 1 }).withMessage('ID должности должен быть числом')
    .custom(async (value) => {
      if (!value) return true;
      const position = await db.Position.findByPk(value);
      if (!position) throw new Error('Должность не найдена');
      return true;
    })
];

module.exports = {
  createEmployeeValidator,
  updateEmployeeValidator
};