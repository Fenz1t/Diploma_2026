"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      INSERT INTO kpi_metrics (employee_id, metric_name, metric_value, period, created_at, updated_at) VALUES
      -- Сотрудник 8: Орлова Мария (Senior Frontend)
      (8, 'efficiency', 85.5, '2024-01-29', NOW(), NOW()),
      (8, 'avg_workload', 65, '2024-01-29', NOW(), NOW()),
      (8, 'tasks_completed', 11, '2024-01-29', NOW(), NOW()),
      (8, 'efficiency', 87.5, '2024-01-22', NOW(), NOW()),
      (8, 'efficiency', 85.7, '2024-01-15', NOW(), NOW()),
      (8, 'efficiency', 83.3, '2024-01-08', NOW(), NOW()),
      (8, 'efficiency', 80.0, '2024-01-01', NOW(), NOW()),
      
      -- Сотрудник 13: Белов Павел (Senior Backend)
      (13, 'efficiency', 90.9, '2024-01-29', NOW(), NOW()),
      (13, 'avg_workload', 80, '2024-01-29', NOW(), NOW()),
      (13, 'tasks_completed', 12, '2024-01-29', NOW(), NOW()),
      (13, 'efficiency', 91.7, '2024-01-22', NOW(), NOW()),
      (13, 'efficiency', 90.0, '2024-01-15', NOW(), NOW()),
      
      -- Сотрудник 9: Федоров Артем (Middle Frontend)
      (9, 'efficiency', 78.6, '2024-01-29', NOW(), NOW()),
      (9, 'avg_workload', 60, '2024-01-29', NOW(), NOW()),
      
      -- Сотрудник 10: Жукова Алина (Junior Frontend) - Низкая эффективность!
      (10, 'efficiency', 57.1, '2024-01-29', NOW(), NOW()),
      (10, 'avg_workload', 25, '2024-01-29', NOW(), NOW()),
      
      -- Сотрудник 18: Воробьева Екатерина (Senior QA) - Идеальная!
      (18, 'efficiency', 100.0, '2024-01-29', NOW(), NOW()),
      (18, 'avg_workload', 60, '2024-01-29', NOW(), NOW()),
      
      -- Сотрудник 19: Лебедев Дмитрий (Middle QA)
      (19, 'efficiency', 66.7, '2024-01-29', NOW(), NOW()),
      
      -- Руководители
      (6, 'efficiency', 100.0, '2024-01-29', NOW(), NOW()),  -- Васильев Денис
      (5, 'efficiency', 100.0, '2024-01-29', NOW(), NOW()),  -- Смирнов Алексей
      (1, 'efficiency', 100.0, '2024-01-29', NOW(), NOW()),  -- Иванов Иван
      
      -- Административные отделы
      (22, 'efficiency', 95.0, '2024-01-29', NOW(), NOW()),  -- Козлова Ольга
      (29, 'efficiency', 92.5, '2024-01-29', NOW(), NOW()),  -- Титова Виктория
      (31, 'efficiency', 88.0, '2024-01-29', NOW(), NOW());  -- Гордеев Алексей
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query("DELETE FROM kpi_metrics");
  },
};
