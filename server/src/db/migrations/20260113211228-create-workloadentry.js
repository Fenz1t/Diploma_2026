"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("workload_entries", {
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
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "projects",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      workload_percent: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 100,
        },
      },
      week_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      tasks_completed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      tasks_overdue: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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

    // Уникальный индекс: сотрудник+проект+неделя
    await queryInterface.addIndex(
      "workload_entries",
      ["employee_id", "project_id", "week_start_date"],
      {
        unique: true,
        name: "unique_employee_project_week",
      }
    );

    // Индексы для быстрого поиска
    await queryInterface.addIndex("workload_entries", ["employee_id"]);
    await queryInterface.addIndex("workload_entries", ["project_id"]);
    await queryInterface.addIndex("workload_entries", ["week_start_date"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("workload_entries");
  },
};
