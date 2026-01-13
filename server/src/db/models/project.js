"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Связь с загрузкой сотрудников
      Project.hasMany(models.WorkloadEntry, {
        foreignKey: "project_id",
        as: "workloads",
      });
    }
  }
  Project.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      start_date: DataTypes.DATE,
      end_date: DataTypes.DATE,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Project",
      tableName: "projects",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    }
  );
  return Project;
};
