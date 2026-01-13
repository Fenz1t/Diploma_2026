"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class WorkloadEntry extends Model {
    static associate(models) {
      // Связь с сотрудником
      WorkloadEntry.belongsTo(models.Employee, {
        foreignKey: "employee_id",
        as: "employee",
      });

      // Связь с проектом
      WorkloadEntry.belongsTo(models.Project, {
        foreignKey: "project_id",
        as: "project",
      });
    }
  }

  WorkloadEntry.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "employees",
          key: "id",
        },
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "projects",
          key: "id",
        },
      },
      workload_percent: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 100,
        },
      },
      week_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      tasks_completed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      tasks_overdue: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "WorkloadEntry",
      tableName: "workload_entries",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["employee_id", "project_id", "week_start_date"],
        },
      ],
    }
  );

  return WorkloadEntry;
};
