"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Переименовываем createdAt в created_at для таблицы projects
      await queryInterface.renameColumn("projects", "createdAt", "created_at", {
        transaction,
      });

      // Переименовываем updatedAt в updated_at для таблицы projects
      await queryInterface.renameColumn("projects", "updatedAt", "updated_at", {
        transaction,
      });

      await transaction.commit();
      console.log("Колонки в таблице projects успешно переименованы");
    } catch (error) {
      await transaction.rollback();
      console.error(
        "Ошибка при переименовании колонок в таблице projects:",
        error
      );
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Возвращаем created_at обратно в createdAt
      await queryInterface.renameColumn("projects", "created_at", "createdAt", {
        transaction,
      });

      // Возвращаем updated_at обратно в updatedAt
      await queryInterface.renameColumn("projects", "updated_at", "updatedAt", {
        transaction,
      });

      await transaction.commit();
      console.log("Колонки в таблице projects возвращены к исходным именам");
    } catch (error) {
      await transaction.rollback();
      console.error("Ошибка при откате переименования:", error);
      throw error;
    }
  },
};
