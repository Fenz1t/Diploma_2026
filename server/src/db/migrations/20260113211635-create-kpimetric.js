"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("kpi_metrics", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "employees",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      metric_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      metric_value: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      period: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // Уникальный индекс: сотрудник+метрика+период
    await queryInterface.addIndex(
      "kpi_metrics",
      ["employee_id", "metric_name", "period"],
      {
        unique: true,
        name: "unique_employee_metric_period",
      }
    );

    // Индексы для быстрого поиска
    await queryInterface.addIndex("kpi_metrics", ["employee_id"]);
    await queryInterface.addIndex("kpi_metrics", ["metric_name"]);
    await queryInterface.addIndex("kpi_metrics", ["period"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("kpi_metrics");
  },
};
