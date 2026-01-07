"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("positions", [
      {
        name: "Разработчик",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Аналитик",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Тестировщик",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Руководитель проекта",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Дизайнер",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Системный администратор",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("positions", null, {});
  },
};
