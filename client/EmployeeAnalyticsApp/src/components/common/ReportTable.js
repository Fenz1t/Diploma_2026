import React, { useMemo } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { DataTable, Card, Text, useTheme } from "react-native-paper";

// Конфигурация колонок для разных типов отчетов
const REPORT_COLUMNS_CONFIG = {
  // Отчет "Сотрудники"
  employees: [
    { key: "full_name", label: "ФИО", width: 180 },
    { key: "department", label: "Отдел", width: 150 },
    { key: "position", label: "Должность", width: 150 },
    { key: "email", label: "Email", width: 180 },
    { key: "phone", label: "Телефон", width: 130 },
    {
      key: "avg_workload",
      label: "Загрузка %",
      width: 100,
      format: (value) => `${value}%`,
    },
    { key: "tasks_completed", label: "Завершено", width: 100 },
    { key: "tasks_overdue", label: "Просрочено", width: 100 },
    {
      key: "efficiency",
      label: "Эффективность %",
      width: 100,
      format: (value) => `${value}%`,
    },
  ],

  // Отчет "Загрузка сотрудников" - здесь нужно доставать данные из вложенных объектов
  workload: [
    {
      key: "employee.full_name",
      label: "Сотрудник",
      width: 180,
      getValue: (row) => row.employee?.full_name || "—",
    },
    {
      key: "employee.department.name",
      label: "Отдел",
      width: 150,
      getValue: (row) => row.employee?.department?.name || "—",
    },
    {
      key: "employee.position.name",
      label: "Должность",
      width: 150,
      getValue: (row) => row.employee?.position?.name || "—",
    },
    {
      key: "projects_count",
      label: "Проектов",
      width: 80,
      getValue: (row) => row.projects?.length || 0,
    },
    {
      key: "avg_workload",
      label: "Загрузка %",
      width: 100,
      format: (value) => `${value}%`,
    },
    {
      key: "total_completed",
      label: "Завершено",
      width: 100,
    },
    {
      key: "total_overdue",
      label: "Просрочено",
      width: 100,
    },
    {
      key: "efficiency",
      label: "Эффективность %",
      width: 110,
      format: (value) => `${value}%`,
    },
  ],

  // Отчет "KPI"
  kpi: [
    { key: "employee", label: "Сотрудник", width: 180 },
    { key: "department", label: "Отдел", width: 150 },
    { key: "position", label: "Должность", width: 150 },
    {
      key: "avg_workload",
      label: "Загрузка %",
      width: 100,
      format: (value) => `${value}%`,
    },
    { key: "tasks_completed", label: "Завершено", width: 100 },
    { key: "tasks_overdue", label: "Просрочено", width: 100 },
    {
      key: "efficiency",
      label: "Эффективность %",
      width: 110,
      format: (value) => `${value}%`,
    },
  ],

  // Отчет "Отделы"
  departments: [
    { key: "department_name", label: "Отдел", width: 180 },
    { key: "employees_count", label: "Сотрудников", width: 100 },
    {
      key: "avg_workload",
      label: "Загрузка %",
      width: 100,
      format: (value) => `${value}%`,
    },
    {
      key: "efficiency",
      label: "Эффективность %",
      width: 110,
      format: (value) => `${value}%`,
    },
    { key: "tasks_completed", label: "Завершено", width: 100 },
    { key: "tasks_overdue", label: "Просрочено", width: 100 },
  ],

  // Отчет "Риски"
  risks: [
    { key: "type", label: "Тип риска", width: 150 },
    { key: "employee", label: "Сотрудник", width: 180 },
    { key: "department", label: "Отдел", width: 150 },
    { key: "value", label: "Значение", width: 100 },
    { key: "recommendation", label: "Рекомендация", width: 200 },
  ],
};

// Функция для получения значения из объекта по пути (например, "employee.full_name")
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Функция для форматирования значения ячейки
const formatCellValue = (value, formatter) => {
  if (value === null || value === undefined) return "—";

  if (formatter && typeof formatter === "function") {
    return formatter(value);
  }

  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.length > 0 ? `${value.length} шт` : "Нет";
    }
    return JSON.stringify(value); // На крайний случай
  }

  return String(value);
};

export default function ReportTable({ data, reportType = "general" }) {
  const theme = useTheme();

  // Получаем конфигурацию колонок для данного типа отчета
  const columnsConfig = REPORT_COLUMNS_CONFIG[reportType] || [];

  // Если нет конфигурации для этого типа, создаем колонки автоматически из данных
  const autoColumns = useMemo(() => {
    if (columnsConfig.length > 0 || !data || !data.length) return [];

    const sample = data[0];
    return Object.keys(sample).map((key) => ({
      key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      width: 150,
    }));
  }, [data, columnsConfig]);

  const columns = columnsConfig.length > 0 ? columnsConfig : autoColumns;

  if (!data || !data.length) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.noDataText}>Нет данных для отображения</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card} elevation={2}>
      <ScrollView vertical showsVerticalScrollIndicator={true}>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          style={{ width: "100%" }}
        >
          <DataTable style={styles.table}>
            {/* Заголовок таблицы */}
            <DataTable.Header style={styles.header}>
              {columns.map((column, index) => (
                <DataTable.Title
                  key={`header-${index}`}
                  style={[styles.columnHeader, { width: column.width || 150 }]}
                  numberOfLines={2}
                >
                  <Text style={styles.headerText}>{column.label}</Text>
                </DataTable.Title>
              ))}
            </DataTable.Header>

            {/* Данные таблицы */}
            {data.map((row, rowIndex) => (
              <DataTable.Row
                key={`row-${rowIndex}`}
                style={[
                  styles.row,
                  rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow,
                ]}
              >
                {columns.map((column, colIndex) => {
                  // Получаем значение
                  let value;
                  if (
                    column.getValue &&
                    typeof column.getValue === "function"
                  ) {
                    value = column.getValue(row);
                  } else {
                    value = getNestedValue(row, column.key);
                  }

                  // Форматируем значение
                  const displayValue = formatCellValue(value, column.format);

                  return (
                    <DataTable.Cell
                      key={`cell-${rowIndex}-${colIndex}`}
                      style={[styles.cell, { width: column.width || 150 }]}
                    >
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.cellText,
                          // Подсветка для рисков
                          reportType === "risks" &&
                            column.key === "value" &&
                            value > 80 &&
                            styles.highRisk,
                          reportType === "risks" &&
                            column.key === "value" &&
                            value > 60 &&
                            value <= 80 &&
                            styles.mediumRisk,
                        ]}
                      >
                        {displayValue}
                      </Text>
                    </DataTable.Cell>
                  );
                })}
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>
      </ScrollView>

      {/* Футер с информацией */}
      <DataTable style={styles.footer}>
        <DataTable.Row style={styles.footerRow}>
          <DataTable.Cell style={styles.footerCell}>
            <Text style={styles.footerText}>Всего записей: {data.length}</Text>
          </DataTable.Cell>
        </DataTable.Row>
      </DataTable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
    flex: 1,
    borderRadius: 8,
  },
  table: {
    minWidth: "100%",
  },
  header: {
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 2,
    borderBottomColor: "#e9ecef",
  },
  columnHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#dee2e6",
  },
  headerText: {
    fontWeight: "700",
    fontSize: 13,
    color: "#495057",
  },
  row: {
    minHeight: 50,
  },
  evenRow: {
    backgroundColor: "#ffffff",
  },
  oddRow: {
    backgroundColor: "#f8f9fa",
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: "#e9ecef",
    justifyContent: "center",
  },
  cellText: {
    fontSize: 13,
    color: "#212529",
  },
  highRisk: {
    color: "#dc3545",
    fontWeight: "600",
  },
  mediumRisk: {
    color: "#fd7e14",
    fontWeight: "600",
  },
  noDataText: {
    fontSize: 16,
    textAlign: "center",
    color: "#6c757d",
    paddingVertical: 40,
  },
  footer: {
    borderTopWidth: 2,
    borderTopColor: "#e9ecef",
  },
  footerRow: {
    backgroundColor: "#f8f9fa",
    minHeight: 40,
  },
  footerCell: {
    justifyContent: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "500",
  },
});
