import React, { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Card,
  Text,
  List,
  Chip,
  Portal,
  Dialog,
  Button,
  Divider,
} from "react-native-paper";

const ProblemsList = ({ problems = [] }) => {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all"); // all | high | medium | low

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "#F44336";
      case "medium":
        return "#FF9800";
      case "low":
        return "#FFC107";
      default:
        return "#757575";
    }
  };

  const getSeverityLabel = (severity) => {
    if (severity === "high") return "Высокая";
    if (severity === "medium") return "Средняя";
    return "Низкая";
  };

  const getTitle = (p) => {
    // если message не пришел с бэка — делаем понятный заголовок
    if (p.message) return p.message;

    if (p.type === "overload")
      return `Перегрузка сотрудников (${p.count ?? 0})`;
    if (p.type === "low_efficiency")
      return `Низкая эффективность (${p.count ?? 0})`;

    return p.type || "Проблема";
  };

  const getDescription = (p) => {
    if (Array.isArray(p.employees) && p.employees.length) {
      return `Затронуты: ${p.employees.join(", ")}`;
    }
    if (p.project) return `Проект: ${p.project}`;
    return p.details || "Нет дополнительных деталей";
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(problems)) return [];
    if (filter === "all") return problems;
    return problems.filter((p) => (p.severity || "low") === filter);
  }, [problems, filter]);

  const totalCount = Array.isArray(problems) ? problems.length : 0;

  const counts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    (Array.isArray(problems) ? problems : []).forEach((p) => {
      const s = p.severity || "low";
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [problems]);

  return (
    <>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>
              ⚠️ Проблемные зоны
            </Text>
            <Chip style={styles.countChip}>{totalCount}</Chip>
          </View>

          {/* Фильтры */}
          <View style={styles.filters}>
            <Chip
              compact
              selected={filter === "all"}
              onPress={() => setFilter("all")}
              style={styles.filterChip}
            >
              Все
            </Chip>
            <Chip
              compact
              selected={filter === "high"}
              onPress={() => setFilter("high")}
              style={styles.filterChip}
              textStyle={{ color: getSeverityColor("high") }}
            >
              Высокая ({counts.high})
            </Chip>
            <Chip
              compact
              selected={filter === "medium"}
              onPress={() => setFilter("medium")}
              style={styles.filterChip}
              textStyle={{ color: getSeverityColor("medium") }}
            >
              Средняя ({counts.medium})
            </Chip>
            <Chip
              compact
              selected={filter === "low"}
              onPress={() => setFilter("low")}
              style={styles.filterChip}
              textStyle={{ color: getSeverityColor("low") }}
            >
              Низкая ({counts.low})
            </Chip>
          </View>

          <Divider style={{ marginBottom: 8 }} />

          {filtered.length > 0 ? (
            filtered.map((problem, index) => {
              const severity = problem.severity || "low";
              const color = getSeverityColor(severity);

              return (
                <List.Item
                  key={`${problem.type || "p"}-${index}`}
                  onPress={() => setSelected(problem)}
                  title={() => (
                    <View style={styles.titleRow}>
                      <Text style={styles.problemTitle} numberOfLines={2}>
                        {getTitle(problem)}
                      </Text>

                      <Chip
                        compact
                        mode="outlined"
                        style={[styles.severityChip, { borderColor: color }]}
                        textStyle={{ color, fontWeight: "700" }}
                      >
                        {getSeverityLabel(severity)}
                      </Chip>
                    </View>
                  )}
                  description={() => (
                    <Text style={styles.problemDesc} numberOfLines={3}>
                      {getDescription(problem)}
                    </Text>
                  )}
                  left={() => (
                    <View
                      style={[styles.severityDot, { backgroundColor: color }]}
                    />
                  )}
                  style={styles.problemItem}
                />
              );
            })
          ) : (
            <View style={styles.noProblems}>
              <Text style={styles.noProblemsText}>
                Проблем не обнаружено 🎉
              </Text>
              {filter !== "all" && (
                <Text style={styles.noProblemsSub}>
                  В выбранной категории ничего нет
                </Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Диалог с деталями */}
      <Portal>
        <Dialog
          visible={!!selected}
          onDismiss={() => setSelected(null)}
          style={styles.dialog}
        >
          <Dialog.Title>Детали проблемы</Dialog.Title>
          <Dialog.Content>
            {selected && (
              <>
                <View style={styles.dialogHeader}>
                  <Text style={styles.dialogTitle}>{getTitle(selected)}</Text>
                  <Chip
                    compact
                    mode="outlined"
                    style={{
                      borderColor: getSeverityColor(selected.severity || "low"),
                    }}
                    textStyle={{
                      color: getSeverityColor(selected.severity || "low"),
                      fontWeight: "700",
                    }}
                  >
                    {getSeverityLabel(selected.severity || "low")}
                  </Chip>
                </View>
                {Array.isArray(selected.employees) &&
                  selected.employees.length > 0 && (
                    <>
                      <Text style={styles.dialogSection}>Сотрудники:</Text>
                      {selected.employees.slice(0, 10).map((name, i) => (
                        <Text key={i} style={styles.dialogBullet}>
                          • {name}
                        </Text>
                      ))}
                      {selected.employees.length > 10 && (
                        <Text style={styles.dialogMuted}>
                          ...и ещё {selected.employees.length - 10}
                        </Text>
                      )}
                    </>
                  )}
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelected(null)}>Закрыть</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontWeight: "bold" },
  countChip: { backgroundColor: "#f0f0f0" },

  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: "#f7f7f7",
  },

  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignSelf: "center",
    marginLeft: 4,
  },

  problemItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  problemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  severityChip: {
    alignSelf: "center",
    paddingVertical: 2,
    paddingHorizontal: 2 ,
  },
  severityChipText: {
    lineHeight: 16,
    fontSize: 12,
    paddingVertical: 0,
  },
  problemDesc: {
    fontSize: 13,
    color: "#666",
    marginTop: 6,
    lineHeight: 16,
  },

  noProblems: { alignItems: "center", paddingVertical: 24 },
  noProblemsText: { fontSize: 16, color: "#4CAF50", fontWeight: "700" },
  noProblemsSub: { marginTop: 6, opacity: 0.6 },

  dialog: { borderRadius: 12 },
  dialogHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  dialogTitle: { flex: 1, fontSize: 14, fontWeight: "800" },
  dialogText: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  dialogSection: { fontWeight: "800", marginTop: 6, marginBottom: 6 },
  dialogBullet: { fontSize: 13, lineHeight: 18 },
  dialogMuted: { marginTop: 8, opacity: 0.6, fontSize: 12 },
});

export default ProblemsList;
