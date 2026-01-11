"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      // Связи с существующими таблицами
      Employee.belongsTo(models.Department, {
        foreignKey: "department_id",
        as: "department",
      });

      Employee.belongsTo(models.Position, {
        foreignKey: "position_id",
        as: "position",
      });

      // Связи для будущих таблиц (пока закомментированы)
      // Employee.hasMany(models.WorkloadEntry, {
      //   foreignKey: 'employee_id',
      //   as: 'workloads'
      // });

      // Employee.hasMany(models.KPIMetric, {
      //   foreignKey: 'employee_id',
      //   as: 'kpis'
      // });
    }
  }

  Employee.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      full_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: "ФИО не может быть пустым" },
          len: {
            args: [5, 255],
            msg: "ФИО должно быть от 5 до 255 символов",
          },
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
          msg: "Email уже используется",
        },
        validate: {
          isEmail: { msg: "Неверный формат email" },
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          is: {
            args: /^[\d\s\-\+\(\)]+$/,
            msg: "Неверный формат телефона",
          },
        },
      },
      photo_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      hire_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: { msg: "Неверный формат даты" },
          isBefore: {
            args: new Date().toISOString(),
            msg: "Дата приема не может быть в будущем",
          },
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      position_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Employee",
      tableName: "employees",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    }
  );

  return Employee;
};
