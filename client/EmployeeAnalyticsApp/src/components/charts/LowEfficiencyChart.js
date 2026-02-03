import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Chip, ProgressBar } from "react-native-paper";
import { useLowEfficiency } from "../../hooks/api/useAnalytics";

const LowEfficiencyList = ({ threshold = 60, onPressEmployee }) => {
  const { data: lowEfficiency, isLoading } = useLowEfficiency(threshold);

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text>Загрузка...</Text>
        </Card.Content>
      </Card>
    );
  }

  if (!Array.isArray(lowEfficiency) || lowEfficiency.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">
            Нет сотрудников с низкой эффективностью
          </Text>
          <Text style={styles.subtitle}>Все работают хорошо! 🎉</Text>
        </Card.Content>
      </Card>
    );
  }

  // сортируем: самый плохой наверху
  const sorted = [...lowEfficiency].sort(
    (a, b) => (a.efficiency ?? 0) - (b.efficiency ?? 0),
  );

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text variant="titleLarge" style={styles.title}>
              Низкая эффективность
            </Text>
            <Text variant="titleLarge" style={styles.badge}>
              Сотрудников: {sorted.length}
            </Text>
          </View>
        </View>

        <Text style={styles.threshold}>
          Порог: <Text style={styles.thresholdValue}>{threshold}%</Text>
        </Text>

        {sorted.slice(0, 8).map((emp, idx) => {
          const eff = Number(emp.efficiency) || 0;
          const completed = Number(emp.tasks_completed) || 0;
          const overdue = Number(emp.tasks_overdue) || 0;
          const total = completed + overdue;

          return (
            <View
              key={emp.id ?? idx}
              style={styles.row}
              onTouchEnd={() => onPressEmployee?.(emp)}
            >
              <View style={styles.rowTop}>
                <Text style={styles.name} numberOfLines={1}>
                  {idx + 1}. {emp.full_name}
                </Text>
                <Text style={styles.eff}>{eff.toFixed(1)}%</Text>
              </View>

              <ProgressBar
                progress={Math.max(0, Math.min(1, eff / 100))}
                style={styles.progress}
              />

              <View style={styles.chips}>
                <Chip compact style={styles.chip}>
                  ✅ выполненно: {completed}
                </Chip>
                <Chip compact style={styles.chip}>
                  ⏰ просроченно: {overdue}
                </Chip>
                <Chip compact style={styles.chip}>
                  📦 в общем: {total}
                </Chip>
                <Chip compact style={styles.chip}>
                  🏢 Отдел: {emp.department_name}
                </Chip>
              </View>
            </View>
          );
        })}

        {sorted.length > 8 && (
          <Text style={styles.more}>
            ...и ещё {sorted.length - 8} сотрудников
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap", // Добавить перенос
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontWeight: "bold" },
  badge: { color: "#d32f2f",fontSize: 14  },
  threshold: { marginBottom: 12, fontSize: 14 },
  thresholdValue: { fontWeight: "bold" },
  subtitle: { opacity: 0.6, marginTop: 6 },

  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 14, fontWeight: "700", flex: 1, marginRight: 10 },
  eff: { fontSize: 14, fontWeight: "800", color: "#d32f2f" },
  progress: { height: 8, borderRadius: 8, marginTop: 8 },
  chips: { flexDirection: "column", flexWrap: "wrap", marginTop: 8, gap: 6 },
  chip: { backgroundColor: "#f7f7f7" },
  more: { marginTop: 10, opacity: 0.6 },
});

export default LowEfficiencyList;
