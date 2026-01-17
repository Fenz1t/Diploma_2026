const db = require("../db/models");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class ReportService {
  // ==================== ОТЧЕТ ПО СОТРУДНИКАМ ====================

  async generateEmployeesReport(filters = {}) {
    const {
      department_ids = [],
      position_ids = [],
      date_from,
      date_to,
      is_active = true,
      include_kpi = false,
    } = filters;

    const where = { is_active };

    if (department_ids.length > 0) {
      where.department_id = { [Op.in]: department_ids };
    }

    if (position_ids.length > 0) {
      where.position_id = { [Op.in]: position_ids };
    }

    const include = [
      { model: db.Department, as: "department" },
      { model: db.Position, as: "position" },
    ];

    // Если нужны KPI - добавляем загрузку
    if (include_kpi) {
      const dateCondition =
        date_from && date_to
          ? { week_start_date: { [Op.between]: [date_from, date_to] } }
          : { week_start_date: this.getCurrentMonthStart() };

      include.push({
        model: db.WorkloadEntry,
        as: "workloads",
        where: dateCondition,
        required: false,
      });
    }

    const employees = await db.Employee.findAll({
      where,
      include,
      order: [["full_name", "ASC"]],
    });

    // Форматируем данные
    const formattedData = employees.map((employee) => {
      // Безопасное преобразование даты
      let hireDateFormatted = "—";
      if (employee.hire_date) {
        try {
          const hireDate =
            employee.hire_date instanceof Date
              ? employee.hire_date
              : new Date(employee.hire_date);
          hireDateFormatted = hireDate.toISOString().split("T")[0];
        } catch (e) {
          hireDateFormatted = "—";
        }
      }

      const baseData = {
        id: employee.id,
        full_name: employee.full_name,
        department: employee.department?.name || "—",
        position: employee.position?.name || "—",
        email: employee.email || "—",
        phone: employee.phone || "—",
        hire_date: hireDateFormatted, // ← ИСПРАВЛЕНО
        is_active: employee.is_active ? "Да" : "Нет",
      };

      if (include_kpi && employee.workloads) {
        let completed = 0;
        let overdue = 0;
        let workload = 0;

        employee.workloads.forEach((w) => {
          completed += w.tasks_completed || 0;
          overdue += w.tasks_overdue || 0;
          workload += w.workload_percent || 0;
        });

        const totalTasks = completed + overdue;

        baseData.avg_workload =
          employee.workloads.length > 0
            ? Math.round(workload / employee.workloads.length)
            : 0;
        baseData.tasks_completed = completed;
        baseData.tasks_overdue = overdue;
        baseData.efficiency =
          totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
      }

      return baseData;
    });

    return {
      metadata: {
        report_type: "employees",
        generated_at: new Date().toISOString(),
        filters,
        total_records: employees.length,
      },
      data: formattedData,
    };
  }

  // ==================== ОТЧЕТ ПО ЗАГРУЗКЕ ====================

  async generateWorkloadReport(filters = {}) {
    const {
      date_from = this.getCurrentMonthStart(),
      date_to = new Date(),
      department_ids = [],
      project_ids = [],
    } = filters;

    const where = {
      week_start_date: { [Op.between]: [date_from, date_to] },
    };

    if (project_ids.length > 0) {
      where.project_id = { [Op.in]: project_ids };
    }

    const include = [
      {
        model: db.Employee,
        as: "employee",
        include: [
          { model: db.Department, as: "department" },
          { model: db.Position, as: "position" },
        ],
      },
      {
        model: db.Project,
        as: "project",
      },
    ];

    if (department_ids.length > 0) {
      include[0].where = {
        department_id: { [Op.in]: department_ids },
      };
    }

    const workloads = await db.WorkloadEntry.findAll({
      where,
      include,
      order: [
        ["week_start_date", "DESC"],
        ["employee_id", "ASC"],
      ],
    });

    // Группируем по сотрудникам
    const employeeMap = new Map();

    workloads.forEach((entry) => {
      const empId = entry.employee_id;
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          employee: {
            id: entry.employee.id,
            full_name: entry.employee.full_name,
            department: entry.employee.department?.name,
            position: entry.employee.position?.name,
          },
          projects: [],
          total_workload: 0,
          total_completed: 0,
          total_overdue: 0,
          weeks_count: 0,
        });
      }

      const empData = employeeMap.get(empId);
      empData.projects.push({
        project: entry.project.name,
        week: entry.week_start_date,
        workload: entry.workload_percent,
        completed: entry.tasks_completed,
        overdue: entry.tasks_overdue,
      });

      empData.total_workload += entry.workload_percent || 0;
      empData.total_completed += entry.tasks_completed || 0;
      empData.total_overdue += entry.tasks_overdue || 0;
      empData.weeks_count++;
    });

    const result = Array.from(employeeMap.values()).map((emp) => ({
      ...emp,
      avg_workload: Math.round(emp.total_workload / emp.weeks_count),
      efficiency:
        emp.total_completed + emp.total_overdue > 0
          ? Math.round(
              (emp.total_completed /
                (emp.total_completed + emp.total_overdue)) *
                100,
            )
          : 0,
      projects_count: emp.projects.length,
    }));

    return {
      metadata: {
        report_type: "workload",
        generated_at: new Date().toISOString(),
        period: { date_from, date_to },
        filters,
        total_records: result.length,
      },
      data: result,
    };
  }

  // ==================== ЭКСПОРТ В EXCEL (В ПАМЯТИ) ====================

  async exportToExcel(reportData, reportType) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Employee Analytics System";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Отчет");

    // Определяем колонки в зависимости от типа отчета
    let columns = [];
    let dataRows = [];

    if (reportType === "employees") {
      columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "ФИО", key: "full_name", width: 25 },
        { header: "Отдел", key: "department", width: 20 },
        { header: "Должность", key: "position", width: 20 },
        { header: "Email", key: "email", width: 25 },
        { header: "Телефон", key: "phone", width: 15 },
        { header: "Дата приема", key: "hire_date", width: 12 },
        { header: "Статус", key: "is_active", width: 10 },
      ];

      if (reportData.data[0]?.avg_workload !== undefined) {
        columns.push(
          { header: "Загрузка %", key: "avg_workload", width: 12 },
          { header: "Выполнено", key: "tasks_completed", width: 12 },
          { header: "Просрочено", key: "tasks_overdue", width: 12 },
          { header: "Эффективность %", key: "efficiency", width: 15 },
        );
      }

      dataRows = reportData.data;
    } else if (reportType === "workload") {
      columns = [
        { header: "Сотрудник", key: "employee_name", width: 25 },
        { header: "Отдел", key: "department", width: 20 },
        { header: "Должность", key: "position", width: 20 },
        { header: "Ср. загрузка %", key: "avg_workload", width: 15 },
        { header: "Выполнено задач", key: "total_completed", width: 15 },
        { header: "Просрочено задач", key: "total_overdue", width: 15 },
        { header: "Эффективность %", key: "efficiency", width: 15 },
        { header: "Проектов", key: "projects_count", width: 12 },
      ];

      dataRows = reportData.data.map((item) => ({
        employee_name: item.employee.full_name,
        department: item.employee.department,
        position: item.employee.position,
        avg_workload: item.avg_workload,
        total_completed: item.total_completed,
        total_overdue: item.total_overdue,
        efficiency: item.efficiency,
        projects_count: item.projects_count,
      }));
    }

    // Добавляем заголовки
    worksheet.columns = columns;

    // Стиль для заголовков
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Добавляем данные
    dataRows.forEach((row, index) => {
      worksheet.addRow(row);

      // Чередующаяся заливка строк
      const currentRow = worksheet.getRow(index + 2);
      if (index % 2 === 0) {
        currentRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }
    });

    // Автонастройка ширины
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(maxLength + 2, column.width || 30);
    });

    // Добавляем метаданные
    const metaSheet = workbook.addWorksheet("Метаданные");
    metaSheet.addRow(["Тип отчета:", reportData.metadata.report_type]);
    metaSheet.addRow(["Дата генерации:", reportData.metadata.generated_at]);
    metaSheet.addRow(["Всего записей:", reportData.metadata.total_records]);

    if (reportData.metadata.filters) {
      metaSheet.addRow([""]);
      metaSheet.addRow(["Фильтры:"]);
      Object.entries(reportData.metadata.filters).forEach(([key, value]) => {
        if (value && (Array.isArray(value) ? value.length > 0 : true)) {
          metaSheet.addRow([
            `  ${key}:`,
            Array.isArray(value) ? value.join(", ") : value,
          ]);
        }
      });
    }

    // Генерируем в буфер (память)
    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: buffer,
      fileName: `report_${reportType}_${new Date().toISOString().split("T")[0]}.xlsx`,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  // ==================== ЭКСПОРТ В PDF (В ПАМЯТИ) ====================

  async exportToPDF(reportData, reportType) {
    return new Promise(async (resolve, reject) => {
      try {
        const chunks = [];

        // Создаем документ
        const doc = new PDFDocument({
          margin: 50,
          size: "A4",
          info: {
            Title: `Отчет: ${this.getReportTitle(reportType)}`,
            Author: "Employee Analytics System",
            CreationDate: new Date(),
          },
        });

        // ========== РЕГИСТРАЦИЯ ШРИФТОВ ==========
        const fontsDir = path.join(__dirname, "./fonts");

        console.log(fontsDir)

        // Проверяем наличие кастомных шрифтов
        const robotoRegular = path.join(fontsDir, "Roboto-Regular.ttf");
        const robotoBold = path.join(fontsDir, "Roboto-Bold.ttf");

        if (fs.existsSync(robotoRegular)) {
          // Используем кастомный шрифт с кириллицей
          doc.registerFont("Roboto", robotoRegular);
          doc.registerFont("Roboto-Bold", robotoBold || robotoRegular);
          doc.font("Roboto");
          console.log("Используем шрифт Roboto для кириллицы");
        } else {
          // Fallback: пробуем стандартные шрифты
          try {
            // Helvetica может работать в некоторых версиях
            doc.font("Helvetica");
            console.log(
              "Используем Helvetica (возможны проблемы с кириллицей)",
            );
          } catch (e) {
            // Последний вариант
            doc.font("Courier");
            console.log("Используем Courier (базовый шрифт)");
          }
        }

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer: buffer,
            fileName: `report_${reportType}_${new Date().toISOString().split("T")[0]}.pdf`,
            mimeType: "application/pdf",
          });
        });
        doc.on("error", reject);

        // ========== ЗАГОЛОВОК ==========
        doc.fontSize(20);
        if (doc._font) {
          doc.text("Отчет по системе аналитики", { align: "center" });
        } else {
          // Если шрифт не загрузился - английский текст
          doc.text("Analytics Report", { align: "center" });
        }
        doc.moveDown();

        // ========== МЕТАДАННЫЕ ==========
        doc.fontSize(12);
        const title = doc._font
          ? `Тип отчета: ${this.getReportTitle(reportType)}`
          : `Report type: ${reportType}`;

        doc.text(title);
        doc.text(`Дата генерации: ${new Date().toLocaleString("ru-RU")}`);
        doc.text(`Всего записей: ${reportData.metadata.total_records}`);
        doc.moveDown();

        // ========== ТАБЛИЦА ==========
        if (reportType === "employees" && reportData.data.length > 0) {
          // Простая таблица для теста
          const startY = doc.y;
          const startX = 50;
          const colWidths = [150, 100, 100, 150];

          // Заголовки
          if (doc._font) {
            doc
              .fontSize(10)
              .font("Roboto-Bold" || "Helvetica-Bold" || "Courier-Bold");
          }

          const headers = doc._font
            ? ["ФИО", "Отдел", "Должность", "Email"]
            : ["Name", "Department", "Position", "Email"];

          headers.forEach((header, i) => {
            doc.text(
              header,
              startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
              startY,
              { width: colWidths[i], continued: false },
            );
          });

          doc.moveDown(1);

          // Данные
          if (doc._font) {
            doc.fontSize(10).font("Roboto" || "Helvetica" || "Courier");
          }

          const rows = reportData.data.slice(0, 20).map((emp) => ({
            name: emp.full_name || "",
            dept: emp.department || "—",
            pos: emp.position || "—",
            email: emp.email || "—",
          }));

          rows.forEach((row, rowIndex) => {
            const y = doc.y;
            const fields = [row.name, row.dept, row.pos, row.email];

            fields.forEach((cell, cellIndex) => {
              doc.text(
                cell.toString(),
                startX +
                  colWidths.slice(0, cellIndex).reduce((a, b) => a + b, 0),
                y,
                { width: colWidths[cellIndex] },
              );
            });

            doc.moveDown(1);

            // Линия-разделитель
            if (rowIndex < rows.length - 1) {
              doc
                .moveTo(startX, doc.y - 5)
                .lineTo(
                  startX + colWidths.reduce((a, b) => a + b, 0),
                  doc.y - 5,
                )
                .stroke();
              doc.moveDown(0.5);
            }
          });
        }

        // ========== ПОДВАЛ ==========
        doc.moveDown(2);
        doc.fontSize(10);

        if (doc._font) {
          doc.text("Сгенерировано системой учета сотрудников", {
            align: "center",
          });
        } else {
          doc.text("Generated by Employee Analytics System", {
            align: "center",
          });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  getCurrentMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  getReportTitle(reportType) {
    const titles = {
      employees: "Сотрудники",
      workload: "Загрузка сотрудников",
      projects: "Проекты",
      kpi: "KPI и эффективность",
    };
    return titles[reportType] || "Отчет";
  }

  generatePDFTable(doc, headers, rows) {
    const startX = 50;
    let startY = doc.y;
    const rowHeight = 20;
    const colWidths = [150, 100, 100, 150];

    // Заголовки таблицы
    doc.font("Helvetica-Bold");
    headers.forEach((header, i) => {
      doc.text(
        header,
        startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
        startY,
        {
          width: colWidths[i],
          align: "left",
        },
      );
    });

    // Линия под заголовками
    startY += rowHeight;
    doc
      .moveTo(startX, startY)
      .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), startY)
      .stroke();

    // Данные
    doc.font("Helvetica");
    rows.forEach((row, rowIndex) => {
      const y = startY + rowIndex * rowHeight;
      row.forEach((cell, cellIndex) => {
        doc.text(
          cell || "—",
          startX + colWidths.slice(0, cellIndex).reduce((a, b) => a + b, 0),
          y,
          {
            width: colWidths[cellIndex],
            align: "left",
          },
        );
      });
    });

    doc.y = startY + rows.length * rowHeight + 20;
  }
}

module.exports = new ReportService();
