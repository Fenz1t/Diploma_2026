const db = require("../db/models");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class ReportService {
  /* ===================== HELPERS ===================== */
  async getLatestWeek() {
    const row = await db.WorkloadEntry.findOne({
      attributes: [
        [db.sequelize.fn("MAX", db.sequelize.col("week_start_date")), "week"],
      ],
      raw: true,
    });
    if (!row?.week) throw new Error("Нет загруженных данных");
    return row.week;
  }

  calcFromWorkloads(workloads) {
    let completed = 0;
    let overdue = 0;
    let workloadSum = 0;
    for (const w of workloads) {
      completed += Number(w.tasks_completed || 0);
      overdue += Number(w.tasks_overdue || 0);
      workloadSum += Number(w.workload_percent || 0);
    }
    const totalTasks = completed + overdue;
    const avgWorkload = workloads.length ? workloadSum / workloads.length : 0;
    const efficiency = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
    return { completed, overdue, totalTasks, avgWorkload, efficiency };
  }

  /* ===================== KPI REPORT ===================== */
  async generateKPIReport() {
    const week = await this.getLatestWeek();
    const employees = await db.Employee.findAll({
      where: { is_active: true },
      include: [
        { model: db.Department, as: "department" },
        { model: db.Position, as: "position" },
        {
          model: db.WorkloadEntry,
          as: "workloads",
          where: { week_start_date: week },
          required: false,
        },
      ],
    });

    const data = employees.map((e) => {
      const m = this.calcFromWorkloads(e.workloads || []);
      return {
        employee_id: e.id,
        employee: e.full_name,
        department: e.department?.name || "—",
        position: e.position?.name || "—",
        avg_workload: Math.round(m.avgWorkload),
        tasks_completed: m.completed,
        tasks_overdue: m.overdue,
        efficiency: Math.round(m.efficiency),
      };
    });

    return {
      metadata: {
        report_type: "kpi",
        generated_at: new Date().toISOString(),
        total_records: data.length,
        week_analyzed: week,
      },
      data,
    };
  }

  /* ===================== DEPARTMENTS REPORT ===================== */
  async generateDepartmentsReport() {
    const week = await this.getLatestWeek();
    const allDepts = await db.Department.findAll({ raw: true });
    if (!allDepts.length) return { week_analyzed: week, departments: [] };

    const byId = new Map(allDepts.map((d) => [d.id, d]));
    const roots = allDepts.filter((d) => d.parent_id == null);
    const leadership = roots.find((d) => d.name === "Руководство") || roots[0];
    if (!leadership)
      throw new Error("Не найден корневой отдел (parent_id = null)");
    const leadershipId = leadership.id;

    // Собираем все отделы с иерархией
    const topLevel = [
      leadership,
      ...allDepts.filter(
        (d) => d.parent_id === leadershipId && d.id !== leadershipId,
      ),
    ];

    // Загружаем все записи сотрудников
    const entries = await db.WorkloadEntry.findAll({
      where: { week_start_date: week },
      include: [
        {
          model: db.Employee,
          as: "employee",
          attributes: ["id", "department_id", "is_active"],
          required: true,
          where: { is_active: true },
        },
      ],
    });

    // Инициализация агрегации
    const agg = new Map();

    for (const entry of entries) {
      let deptId = entry.employee?.department_id;
      while (deptId && !agg.has(deptId)) {
        agg.set(deptId, { employeesSet: new Set(), workloads: [] });
        const parent = byId.get(deptId);
        deptId = parent?.parent_id;
      }
    }

    // Агрегируем все записи, включая родителей
    for (const entry of entries) {
      const allParentIds = [];
      let curDeptId = entry.employee.department_id;
      while (curDeptId) {
        allParentIds.push(curDeptId);
        const parent = byId.get(curDeptId);
        curDeptId = parent?.parent_id;
      }
      for (const dId of allParentIds) {
        const bucket = agg.get(dId);
        if (!bucket) continue;
        bucket.employeesSet.add(entry.employee.id);
        bucket.workloads.push({
          tasks_completed: entry.tasks_completed,
          tasks_overdue: entry.tasks_overdue,
          workload_percent: entry.workload_percent,
        });
      }
    }

    const result = topLevel.map((top) => {
      const bucket = agg.get(top.id);
      const m = this.calcFromWorkloads(bucket?.workloads || []);
      return {
        department_id: top.id,
        department_name: top.name,
        employees_count: bucket ? bucket.employeesSet.size : 0,
        avg_workload: Math.round(m.avgWorkload),
        efficiency: Math.round(m.efficiency),
        tasks_completed: m.completed,
        tasks_overdue: m.overdue,
      };
    });

    return { week_analyzed: week, departments: result };
  }

  /* ===================== RISKS REPORT ===================== */
  async generateRisksReport() {
    const week = await this.getLatestWeek();
    const employees = await db.Employee.findAll({
      where: { is_active: true },
      include: [
        {
          model: db.WorkloadEntry,
          as: "workloads",
          where: { week_start_date: week },
          required: false,
        },
        { model: db.Department, as: "department" },
      ],
    });

    const risks = [];
    for (const e of employees) {
      const m = this.calcFromWorkloads(e.workloads || []);
      if (m.avgWorkload > 85) {
        risks.push({
          type: "Перегрузка",
          employee: e.full_name,
          department: e.department?.name || "—",
          value: Math.round(m.avgWorkload),
          recommendation: "Перераспределить задачи или ресурсы",
        });
      }
      if (m.totalTasks > 0 && m.efficiency < 60) {
        risks.push({
          type: "Низкая эффективность",
          employee: e.full_name,
          department: e.department?.name || "—",
          value: Math.round(m.efficiency),
          recommendation: "Провести one-to-one или обучение",
        });
      }
    }

    return {
      metadata: {
        report_type: "risks",
        generated_at: new Date().toISOString(),
        total_records: risks.length,
      },
      data: risks,
    };
  }

  /* ===================== EMPLOYEES REPORT ===================== */
  async generateEmployeesReport() {
    const week = await this.getLatestWeek();
    const employees = await db.Employee.findAll({
      where: { is_active: true },
      include: [
        { model: db.Department, as: "department" },
        { model: db.Position, as: "position" },
        {
          model: db.WorkloadEntry,
          as: "workloads",
          where: { week_start_date: week },
          required: false,
        },
      ],
    });

    const data = employees.map((e) => {
      const m = this.calcFromWorkloads(e.workloads || []);
      return {
        id: e.id,
        full_name: e.full_name,
        department: e.department?.name || "—",
        position: e.position?.name || "—",
        email: e.email || "—",
        phone: e.phone || "—",
        hire_date: e.hire_date
          ? new Date(e.hire_date).toISOString().split("T")[0]
          : "—",
        is_active: e.is_active ? "Да" : "Нет",
        avg_workload: Math.round(m.avgWorkload),
        tasks_completed: m.completed,
        tasks_overdue: m.overdue,
        efficiency: Math.round(m.efficiency),
      };
    });

    return {
      metadata: {
        report_type: "employees",
        generated_at: new Date().toISOString(),
        total_records: data.length,
      },
      data,
    };
  }

  /* ===================== WORKLOAD REPORT ===================== */
  async generateWorkloadReport() {
    const week = await this.getLatestWeek();
    const entries = await db.WorkloadEntry.findAll({
      where: { week_start_date: week },
      include: [
        {
          model: db.Employee,
          as: "employee",
          include: [
            { model: db.Department, as: "department" },
            { model: db.Position, as: "position" },
          ],
        },
        { model: db.Project, as: "project" },
      ],
    });

    const map = new Map();
    for (const entry of entries) {
      const empId = entry.employee_id;
      if (!map.has(empId))
        map.set(empId, {
          employee: entry.employee,
          projects: [],
          total_workload: 0,
          total_completed: 0,
          total_overdue: 0,
          weeks_count: 0,
        });
      const emp = map.get(empId);
      emp.projects.push({
        project: entry.project?.name,
        workload: entry.workload_percent,
        completed: entry.tasks_completed,
        overdue: entry.tasks_overdue,
      });
      emp.total_workload += entry.workload_percent || 0;
      emp.total_completed += entry.tasks_completed || 0;
      emp.total_overdue += entry.tasks_overdue || 0;
      emp.weeks_count++;
    }

    const data = Array.from(map.values()).map((emp) => ({
      employee: emp.employee,
      projects: emp.projects,
      avg_workload: Math.round(emp.total_workload / emp.weeks_count),
      total_completed: emp.total_completed,
      total_overdue: emp.total_overdue,
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
        total_records: data.length,
      },
      data,
    };
  }

  /* ===================== EXCEL EXPORT ===================== */
  async exportToExcel(reportData, reportType) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Employee Analytics System";
    const ws = workbook.addWorksheet("Отчет");

    let columns = [];
    let rows = [];

    if (reportType === "employees" || reportType === "kpi") {
      columns = Object.keys(reportData.data[0] || {}).map((k) => ({
        header: k,
        key: k,
      }));
      rows = reportData.data;
    } else if (reportType === "workload") {
      columns = [
        "Сотрудник",
        "Отдел",
        "Должность",
        "Ср. загрузка %",
        "Выполнено задач",
        "Просрочено задач",
        "Эффективность %",
        "Проекты",
      ].map((h) => ({ header: h, key: h }));

      rows = reportData.data.map((e) => ({
        Сотрудник: e.employee.full_name,
        Отдел: e.employee.department?.name || "—",
        Должность: e.employee.position?.name || "—",
        "Ср. загрузка %": e.avg_workload,
        "Выполнено задач": e.total_completed,
        "Просрочено задач": e.total_overdue,
        "Эффективность %": e.efficiency,
        Проекты: e.projects.map((p) => p.project).join(", "),
      }));
    } else {
      rows = reportData.data || reportData.departments || [];
      if (rows.length)
        columns = Object.keys(rows[0]).map((k) => ({
          header: k,
          key: k,
        }));
    }

    ws.columns = columns;
    ws.columns.forEach((c) => (c.width = 25));
    ws.getRow(1).font = { bold: true };
    ws.autoFilter = {
      from: "A1",
      to: `${String.fromCharCode(65 + ws.columns.length - 1)}1`,
    };
    rows.forEach((r) => ws.addRow(r));

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      buffer,
      fileName: `report_${reportType}_${new Date().toISOString().split("T")[0]}.xlsx`,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  /* ===================== PDF EXPORT ===================== */
  async exportToPDF(reportData, reportType) {
    return new Promise(async (resolve, reject) => {
      try {
        const chunks = [];
        const doc = new PDFDocument({ margin: 30, size: "A4" });
        const fontPath = path.join(__dirname, "fonts/Roboto-Regular.ttf");
        const fontBoldPath = path.join(__dirname, "fonts/Roboto-Bold.ttf");
        doc.registerFont("Roboto", fontPath);
        doc.registerFont("Roboto-Bold", fontBoldPath);

        doc.on("data", (c) => chunks.push(c));
        doc.on("end", () =>
          resolve({
            buffer: Buffer.concat(chunks),
            fileName: `report_${reportType}_${new Date().toISOString().split("T")[0]}.pdf`,
            mimeType: "application/pdf",
          }),
        );
        doc.on("error", reject);

        doc
          .font("Roboto-Bold")
          .fontSize(18)
          .text(`Отчет: ${this.getReportTitle(reportType)}`, {
            align: "center",
          });
        doc.moveDown();
        doc
          .font("Roboto")
          .fontSize(12)
          .text(`Дата генерации: ${new Date().toLocaleString("ru-RU")}`);
        doc.moveDown();

        let rows = reportData.data || reportData.departments || [];
        if (!rows.length) {
          doc.text("Нет данных для отчета", { align: "center" });
          doc.end();
          return;
        }

        if (reportType === "workload") {
          rows = rows.map((e) => ({
            Сотрудник: e.employee.full_name,
            Отдел: e.employee.department?.name || "—",
            Должность: e.employee.position?.name || "—",
            "Ср. загрузка %": e.avg_workload,
            "Выполнено задач": e.total_completed,
            "Просрочено задач": e.total_overdue,
            "Эффективность %": e.efficiency,
            Проекты: e.projects.map((p) => p.project).join(", "),
          }));
        }

        const headers = Object.keys(rows[0]);
        this._drawAdaptiveTable(
          doc,
          headers,
          rows,
          30,
          doc.y + 20,
          doc.page.width - 60,
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  _drawAdaptiveTable(doc, headers, rows, startX, startY, pageWidth) {
    const rowPadding = 4;
    const colCount = headers.length;
    const colWidth = (pageWidth - (colCount - 1) * 2) / colCount;
    let y = startY;

    headers.forEach((h, i) => {
      const x = startX + i * colWidth;
      doc.rect(x, y, colWidth, 20).fillAndStroke("#f0f0f0", "#000");
      doc
        .fillColor("#000")
        .font("Roboto-Bold")
        .text(h, x + 2, y + 4, { width: colWidth - 4 });
    });
    y += 20;

    rows.forEach((row, rowIndex) => {
      const cellHeights = headers.map(
        (h, i) =>
          doc.heightOfString(row[h]?.toString() || "—", {
            width: colWidth - 4,
          }) +
          rowPadding * 2,
      );
      const rowHeight = Math.max(...cellHeights);

      if (y + rowHeight > doc.page.height - 40) {
        doc.addPage();
        y = 50;
      }

      headers.forEach((h, i) => {
        const x = startX + i * colWidth;
        const fillColor = rowIndex % 2 === 0 ? "#ffffff" : "#f9f9f9";
        doc.rect(x, y, colWidth, rowHeight).fillAndStroke(fillColor, "#000");
        doc
          .fillColor("#000")
          .font("Roboto")
          .text(row[h]?.toString() || "—", x + 2, y + rowPadding, {
            width: colWidth - 4,
          });
      });

      y += rowHeight;
    });
  }

  getReportTitle(type) {
    const titles = {
      employees: "Сотрудники",
      workload: "Загрузка сотрудников",
      kpi: "KPI",
      departments: "Отделы",
      risks: "Риски",
    };
    return titles[type] || "Отчет";
  }
}

module.exports = new ReportService();
