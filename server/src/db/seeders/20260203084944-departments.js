module.exports = {
  async up(queryInterface, Sequelize) {
    // Используем raw SQL для полного контроля
    await queryInterface.sequelize.query(`
      INSERT INTO departments (id, name, parent_id, created_at, updated_at) VALUES
      -- Сначала создаем корневой отдел
      (1, 'Руководство', NULL, NOW(), NOW()),
      -- Потом отделы с parent_id=1
      (2, 'ИТ отдел', 1, NOW(), NOW()),
      (3, 'Бухгалтерия', 1, NOW(), NOW()),
      (4, 'Отдел кадров', 1, NOW(), NOW()),
      (5, 'Маркетинг', 1, NOW(), NOW()),
      (6, 'Отдел продаж', 1, NOW(), NOW()),
      -- Потом подотделы с другими parent_id
      (7, 'Разработка', 2, NOW(), NOW()),
      (8, 'Тестирование', 2, NOW(), NOW()),
      (9, 'DevOps', 2, NOW(), NOW()),
      (10, 'Системное администрирование', 2, NOW(), NOW()),
      (11, 'Frontend разработка', 7, NOW(), NOW()),
      (12, 'Backend разработка', 7, NOW(), NOW()),
      (13, 'Мобильная разработка', 7, NOW(), NOW()),
      (14, 'Data Science', 7, NOW(), NOW()),
      (15, 'SMM', 5, NOW(), NOW()),
      (16, 'Контент', 5, NOW(), NOW()),
      (17, 'Аналитика', 5, NOW(), NOW()),
      (18, 'Внутренние продажи', 6, NOW(), NOW()),
      (19, 'Внешние продажи', 6, NOW(), NOW()),
      (20, 'Поддержка клиентов', 6, NOW(), NOW());
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("departments", null, {});
  },
};
