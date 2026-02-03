"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Функция для получения понедельника текущей недели
    const getCurrentWeekStart = () => {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday.toISOString().split("T")[0];
    };

    // Функция для получения понедельника прошлой недели
    const getPreviousWeekStart = () => {
      const current = new Date(getCurrentWeekStart());
      const previous = new Date(current);
      previous.setDate(previous.getDate() - 7);
      return previous.toISOString().split("T")[0];
    };

    const currentWeek = getCurrentWeekStart();
    const previousWeek = getPreviousWeekStart();

    await queryInterface.sequelize.query(`
      INSERT INTO workload_entries (employee_id, project_id, week_start_date, workload_percent, tasks_completed, tasks_overdue, created_at, updated_at) VALUES
      -- ========== ТЕКУЩАЯ НЕДЕЛЯ ==========
      
      -- Проект 1: Банк-клиент
      (8, 1, '${currentWeek}', 40, 8, 2, NOW(), NOW()),  -- Орлова Мария
      (9, 1, '${currentWeek}', 35, 6, 1, NOW(), NOW()),  -- Федоров Артем
      (10, 1, '${currentWeek}', 25, 4, 3, NOW(), NOW()), -- Жукова Алина
      (13, 1, '${currentWeek}', 50, 10, 0, NOW(), NOW()), -- Белов Павел
      (14, 1, '${currentWeek}', 45, 7, 1, NOW(), NOW()), -- Комаров Александр
      
      -- Проект 2: Система управления складом
      (11, 2, '${currentWeek}', 30, 6, 0, NOW(), NOW()),  -- Морозов Сергей
      (15, 2, '${currentWeek}', 25, 5, 2, NOW(), NOW()),  -- Ильина Юлия
      (18, 2, '${currentWeek}', 60, 12, 0, NOW(), NOW()), -- Воробьева Екатерина
      (19, 2, '${currentWeek}', 40, 8, 1, NOW(), NOW()),  -- Лебедев Дмитрий
      
      -- Проект 3: Обновление корпоративного портала
      (9, 3, '${currentWeek}', 25, 5, 0, NOW(), NOW()),   -- Федоров Артем (работает на 2 проектах)
      (16, 3, '${currentWeek}', 35, 7, 0, NOW(), NOW()),  -- Григорьев Михаил
      
      -- Проект 4: Медицинская система записи
      (12, 4, '${currentWeek}', 20, 4, 0, NOW(), NOW()),  -- Тихонов Игорь
      (14, 4, '${currentWeek}', 30, 6, 1, NOW(), NOW()),  -- Комаров Александр (работает на 2 проектах)
      
      -- Проект 10: CRM для страховой компании (ПРОБЛЕМНЫЙ)
      (8, 10, '${currentWeek}', 25, 3, 5, NOW(), NOW()),  -- Орлова Мария (много просрочек!)
      (13, 10, '${currentWeek}', 30, 2, 6, NOW(), NOW()), -- Белов Павел (много просрочек!)
      (19, 10, '${currentWeek}', 20, 1, 4, NOW(), NOW()), -- Лебедев Дмитрий (много просрочек!)
      
      -- Руководители
      (6, 1, '${currentWeek}', 15, 3, 0, NOW(), NOW()),   -- Васильев Денис (Руководитель разработки)
      (6, 2, '${currentWeek}', 10, 2, 0, NOW(), NOW()),
      (5, 1, '${currentWeek}', 10, 2, 0, NOW(), NOW()),   -- Смирнов Алексей (Руководитель ИТ отдела)
      
      -- Административные отделы
      (22, 5, '${currentWeek}', 20, 4, 0, NOW(), NOW()),  -- Козлова Ольга (Бухгалтерия)
      (29, 6, '${currentWeek}', 25, 5, 0, NOW(), NOW()),  -- Титова Виктория (SMM)
      
      -- ========== ПРОШЛАЯ НЕДЕЛЯ ==========
      (8, 1, '${previousWeek}', 35, 7, 1, NOW(), NOW()),
      (9, 1, '${previousWeek}', 30, 5, 2, NOW(), NOW()),
      (13, 1, '${previousWeek}', 45, 9, 0, NOW(), NOW()),
      
      -- ========== НЕСКОЛЬКО НЕДЕЛЬ НАЗАД ==========
      (8, 1, '2024-01-15', 30, 6, 0, NOW(), NOW()),
      (13, 1, '2024-01-15', 40, 8, 0, NOW(), NOW()),
      (8, 1, '2024-01-08', 25, 5, 1, NOW(), NOW()),
      (13, 1, '2024-01-08', 35, 7, 0, NOW(), NOW()),
      (8, 1, '2024-01-01', 20, 4, 0, NOW(), NOW()),
      (13, 1, '2024-01-01', 30, 6, 0, NOW(), NOW());
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query("DELETE FROM workload_entries");
  },
};
