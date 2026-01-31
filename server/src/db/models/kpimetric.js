"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class KPIMetric extends Model {
    static associate(models) {
      // Связь с сотрудником
      KPIMetric.belongsTo(models.Employee, {
        foreignKey: "employee_id",
        as: "employee",
      });
    }
  }
  KPIMetric.init(
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
      metric_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      metric_value: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      period: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "KPIMetric",
      tableName: "kpi_metrics",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["employee_id", "metric_name", "period"],
        },
      ],
    }
  );

  return KPIMetric;
};
