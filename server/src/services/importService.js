const db = require("../db/models");
const { Op } = require("sequelize");
const XLSX = require("xlsx");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const analyticsService = require("./analyticsService");

class ImportService {
  // ==================== ОСНОВНОЙ МЕТОД ИМПОРТА ====================

  async importFromFile(filePath, fileType, importType = "kanban") {
    try {
      console.log(`🔄 Импорт ${fileType} файла: ${filePath}`);

      // 1. Парсинг файла
      const data = await this.parseFile(filePath, fileType);

      // 2. Валидация данных
      const validatedData = this.validateData(data, importType);

      // 3. Импорт в БД
      const importResult = await this.importToDatabase(
        validatedData,
        importType,
      );

      // 4. Вычисляем workload_percent
      await analyticsService.calculateWorkloadFromTasks();

      // 5. Удаляем временный файл
      fs.unlinkSync(filePath);

      return {
        success: true,
        message: "Импорт успешно завершен",
        data: importResult,
        file_info: {
          original_name: path.basename(filePath),
          records_processed: validatedData.length,
        },
      };
    } catch (error) {
      // Удаляем файл даже при ошибке
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.error("❌ Ошибка импорта:", error);
      throw error;
    }
  }

  // ==================== ПАРСИНГ ФАЙЛОВ ====================

  async parseFile(filePath, fileType) {
    switch (fileType.toLowerCase()) {
      case "xlsx":
      case "xls":
        return this.parseExcel(filePath);
      case "csv":
        return this.parseCSV(filePath);
      case "json":
        return this.parseJSON(filePath);
      default:
        throw new Error(`Неподдерживаемый формат файла: ${fileType}`);
    }
  }

  parseExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Конвертируем в JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Нормализуем названия колонок
    return data.map((row) => {
      const normalized = {};
      Object.keys(row).forEach((key) => {
        const normalizedKey = key
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");
        normalized[normalizedKey] = row[key];
      });
      return normalized;
    });
  }

  parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", reject);
    });
  }

  parseJSON(filePath) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);

    // Поддерживаем два формата JSON
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      throw new Error("Некорректный формат JSON файла");
    }
  }

  // ==================== ВАЛИДАЦИЯ ДАННЫХ ====================

  validateData(data, importType) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Файл не содержит данных или имеет некорректный формат");
    }

    const validated = [];
    const errors = [];

    data.forEach((row, index) => {
      try {
        const validatedRow = this.validateRow(row, importType, index + 1);
        validated.push(validatedRow);
      } catch (error) {
        errors.push({
          row: index + 1,
          error: error.message,
          data: row,
        });
      }
    });

    if (errors.length > 0) {
      console.warn(`⚠️ Найдены ошибки в ${errors.length} строках`);
    }

    if (validated.length === 0) {
      throw new Error("Нет валидных данных для импорта");
    }

    return validated;
  }

  validateRow(row, importType, rowNumber) {
    // Базовые обязательные поля
    const requiredFields = ["full_name", "project"];

    if (importType === "kanban") {
      requiredFields.push("task_status");
    }

    // Проверяем обязательные поля
    requiredFields.forEach((field) => {
      if (!row[field] || row[field].toString().trim() === "") {
        throw new Error(`Отсутствует обязательное поле: ${field}`);
      }
    });

    // Нормализуем данные
    const normalized = {
      full_name: String(row.full_name || "").trim(),
      email: row.email ? String(row.email).trim().toLowerCase() : null,
      department: row.department ? String(row.department).trim() : "Не указан",
      position: row.position ? String(row.position).trim() : "Не указан",
      project: String(row.project || "").trim(),
      task_status: row.task_status ? String(row.task_status).trim() : null,
      task_due_date: row.task_due_date
        ? this.parseDate(row.task_due_date)
        : null,
      phone: row.phone ? String(row.phone).trim() : null,
    };

    // Валидация email
    if (normalized.email && !this.isValidEmail(normalized.email)) {
      throw new Error(`Некорректный email: ${normalized.email}`);
    }

    return normalized;
  }

  // ==================== ИМПОРТ В БАЗУ ДАННЫХ ====================

  async importToDatabase(data, importType) {
    const transaction = await db.sequelize.transaction();

    try {
      const result = {
        departments: { created: 0, updated: 0, skipped: 0 },
        positions: { created: 0, updated: 0, skipped: 0 },
        employees: { created: 0, updated: 0, skipped: 0 },
        projects: { created: 0, updated: 0, skipped: 0 },
        workload_entries: { created: 0, updated: 0, skipped: 0 },
      };

      for (const row of data) {
        // 1. Отдел
        const department = await this.upsertDepartment(
          row.department,
          transaction,
        );
        if (department.wasCreated) result.departments.created++;
        else result.departments.updated++;

        // 2. Должность
        const position = await this.upsertPosition(row.position, transaction);
        if (position.wasCreated) result.positions.created++;
        else result.positions.updated++;

        // 3. Проект
        const project = await this.upsertProject(row.project, transaction);
        if (project.wasCreated) result.projects.created++;
        else result.projects.updated++;

        // 4. Сотрудник
        const employee = await this.upsertEmployee(
          {
            full_name: row.full_name,
            email: row.email,
            phone: row.phone,
            department_id: department.id,
            position_id: position.id,
          },
          transaction,
        );

        if (employee.wasCreated) result.employees.created++;
        else result.employees.updated++;

        // 5. Workload (только для канбан-доски)
        if (importType === "kanban" && row.task_status) {
          const workload = await this.upsertWorkload(
            {
              employee_id: employee.id,
              project_id: project.id,
              task_status: row.task_status,
              due_date: row.task_due_date,
            },
            transaction,
          );

          if (workload.wasCreated) result.workload_entries.created++;
          else result.workload_entries.updated++;
        }
      }

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ==================== UPSERT МЕТОДЫ ====================

  async upsertDepartment(name, transaction) {
    const [department, created] = await db.Department.findOrCreate({
      where: { name: name },
      defaults: { parent_id: null },
      transaction,
    });

    return { id: department.id, wasCreated: created, wasUpdated: !created };
  }

  async upsertPosition(name, transaction) {
    const [position, created] = await db.Position.findOrCreate({
      where: { name: name },
      defaults: {},
      transaction,
    });

    return { id: position.id, wasCreated: created, wasUpdated: !created };
  }

  async upsertProject(name, transaction) {
    const [project, created] = await db.Project.findOrCreate({
      where: { name: name },
      defaults: {
        status: "active",
        start_date: new Date(),
      },
      transaction,
    });

    return { id: project.id, wasCreated: created, wasUpdated: !created };
  }

  async upsertEmployee(data, transaction) {
    const where = data.email
      ? { email: data.email }
      : { full_name: data.full_name };

    const [employee, created] = await db.Employee.findOrCreate({
      where: where,
      defaults: {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        department_id: data.department_id,
        position_id: data.position_id,
        is_active: true,
        hire_date: new Date(),
      },
      transaction,
    });

    // Если нашли по email, но full_name отличается - обновляем
    if (!created && employee.full_name !== data.full_name) {
      employee.full_name = data.full_name;
      await employee.save({ transaction });
    }

    return { id: employee.id, wasCreated: created, wasUpdated: !created };
  }

  async upsertWorkload(data, transaction) {
    const weekStart = this.getWeekStartDate(data.due_date || new Date());

    const where = {
      employee_id: data.employee_id,
      project_id: data.project_id,
      week_start_date: weekStart,
    };

    const [workload, created] = await db.WorkloadEntry.findOrCreate({
      where: where,
      defaults: {
        employee_id: data.employee_id,
        project_id: data.project_id,
        week_start_date: weekStart,
        tasks_completed: data.task_status === "Готово" ? 1 : 0,
        tasks_overdue: this.isTaskOverdue(data) ? 1 : 0,
        workload_percent: null, // Будет вычислено позже
      },
      transaction,
    });

    // Если запись уже существует - обновляем счетчики
    if (!created) {
      if (data.task_status === "Готово") {
        workload.tasks_completed += 1;
      } else if (this.isTaskOverdue(data)) {
        workload.tasks_overdue += 1;
      }
      await workload.save({ transaction });
    }

    return { id: workload.id, wasCreated: created, wasUpdated: !created };
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  parseDate(dateString) {
    if (!dateString) return null;

    // Пробуем разные форматы дат
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Пробуем парсить из Excel формата
      const excelDate = parseInt(dateString);
      if (!isNaN(excelDate)) {
        // Excel даты: дни с 1 января 1900
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
      }
      return null;
    }
    return date;
  }

  getWeekStartDate(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  isTaskOverdue(data) {
    if (!data.due_date) return false;

    const dueDate = new Date(data.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dueDate < today && data.task_status !== "Готово";
  }

  // ==================== ШАБЛОНЫ ФАЙЛОВ ====================

  generateTemplate(importType) {
    if (importType === "kanban") {
      return [
        {
          full_name: "Иванов Иван Иванович",
          email: "ivanov@company.ru",
          department: "Разработка",
          position: "Backend разработчик",
          project: "Дипломный проект",
          task_status: "Готово",
          task_due_date: "2024-01-20",
          phone: "+79111234567",
        },
      ];
    } else {
      return [
        {
          full_name: "Петрова Анна Сергеевна",
          email: "petrova@company.ru",
          department: "Тестирование",
          position: "QA инженер",
          project: "Мобильное приложение",
          phone: "+79117654321",
        },
      ];
    }
  }
}

module.exports = new ImportService();
