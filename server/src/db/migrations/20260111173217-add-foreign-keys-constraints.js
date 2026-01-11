"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Внешние ключи для employees → departments
    await queryInterface.addConstraint("employees", {
      fields: ["department_id"],
      type: "foreign key",
      name: "fk_employees_department",
      references: {
        table: "departments",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // 2. Внешние ключи для employees → positions
    await queryInterface.addConstraint("employees", {
      fields: ["position_id"],
      type: "foreign key",
      name: "fk_employees_position",
      references: {
        table: "positions",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // 3. Внешний ключ для departments → departments (самоссылка)
    await queryInterface.addConstraint("departments", {
      fields: ["parent_id"],
      type: "foreign key",
      name: "fk_departments_parent",
      references: {
        table: "departments",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    // Просто удаляем все constraints
    await queryInterface.removeConstraint("employees", "fk_employees_position");
    await queryInterface.removeConstraint(
      "employees",
      "fk_employees_department"
    );
    await queryInterface.removeConstraint(
      "departments",
      "fk_departments_parent"
    );
  },
};
