import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Chip, ProgressBar } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const TopPerformersList = ({ performers, onPressItem }) => {
  if (!performers || performers.length === 0) return null;

  // Сортируем исполнителей по количеству выполненных задач (по убыванию)
  const sortedPerformers = [...performers].sort((a, b) => {
    const aCompleted = Number(a.tasks_completed) || 0;
    const bCompleted = Number(b.tasks_completed) || 0;
    return bCompleted - aCompleted; // По убыванию
  });

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>
          🏆 Топ исполнителей
        </Text>

        {sortedPerformers.map((p, idx) => {
          const efficiency = Number(p.efficiency) || 0;
          const workload = Number(p.avg_workload) || 0;
          const completed = Number(p.tasks_completed) || 0;
          const overdue = Number(p.tasks_overdue) || 0;

          return (
            <View
              key={p.id ?? idx}
              style={styles.row}
              onTouchEnd={() => onPressItem?.(p)}
            >
              <View style={styles.left}></View>

              <View style={styles.middle}>
                <Text style={styles.name} numberOfLines={1}>
                  {idx + 1}. {p.full_name}
                </Text>
                <View style={styles.chips}>
                  <Chip icon="lightning-bolt" compact style={styles.chip}>
                    {workload}%
                  </Chip>
                  <Chip icon={"check-circle"} compact style={styles.chip}>
                    {completed}
                  </Chip>
                  <Chip icon="clock-alert" compact style={styles.chip}>
                    {overdue}
                  </Chip>
                </View>
              </View>
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12 },
  title: { fontWeight: "bold", marginBottom: 12 },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  left: { width: 28, alignItems: "center", justifyContent: "center" },
  rank: { fontSize: 16, fontWeight: "800" },
  middle: { flex: 1 },
  name: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  progressRow: { flexDirection: "row", alignItems: "center" },
  progress: { flex: 1, height: 8, borderRadius: 8, marginRight: 8 },
  percent: { width: 44, textAlign: "right", fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 6 },
  chip: { backgroundColor: "#f7f7f7",width:80 },
});

export default TopPerformersList;
