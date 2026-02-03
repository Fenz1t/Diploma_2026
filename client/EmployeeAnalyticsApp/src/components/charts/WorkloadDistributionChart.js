import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Card, Text } from "react-native-paper";
import { BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const WorkloadDistributionChart = ({ departments }) => {
  if (!departments || departments.length === 0) return null;

  // Определяем цвет в зависимости от нагрузки
  const getWorkloadColor = (workload) => {
    if (workload <= 50) return "#4CAF50"; // Зеленый
    if (workload <= 70) return "#FFC107"; // Желтый
    if (workload <= 85) return "#FF9800"; // Оранжевый
    return "#F44336"; // Красный
  };

  // Определяем текстовое описание
  const getWorkloadText = (workload) => {
    if (workload <= 50) return "Низкая";
    if (workload <= 70) return "Средняя";
    if (workload <= 85) return "Высокая";
    return "Критическая";
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>
          🔥 Тепловая карта нагрузки
        </Text>

        <View style={styles.heatMap}>
          {departments.map((dept) => {
            const color = getWorkloadColor(dept.avg_workload);
            const text = getWorkloadText(dept.avg_workload);

            return (
              <View key={dept.id} style={styles.heatMapItem}>
                <View style={styles.deptInfo}>
                  <Text style={styles.deptName} numberOfLines={2}>
                    {dept.name}
                  </Text>
                  <Text style={styles.deptStats}>
                    {dept.employee_count} чел.
                  </Text>
                </View>

                <View style={styles.workloadIndicator}>
                  <View style={styles.workloadText}>
                    <Text style={[styles.workloadValue, { color }]}>
                      {dept.avg_workload}%
                    </Text>
                    <Text style={[styles.workloadLabel, { color }]}>
                      {text}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#4CAF50" }]}
            />
            <Text style={styles.legendText}>Низкая (0-50%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#FFC107" }]}
            />
            <Text style={styles.legendText}>Средняя (51-70%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#FF9800" }]}
            />
            <Text style={styles.legendText}>Высокая (71-85%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#F44336" }]}
            />
            <Text style={styles.legendText}>Критическая (86-100%)</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
    fontSize: 18,
  },
  heatMap: {
    marginBottom: 16,
  },
  heatMapItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  deptInfo: {
    flex: 1,
    marginRight: 12,
  },
  deptName: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 4,
  },
  deptStats: {
    fontSize: 12,
    color: "#666",
  },
  workloadIndicator: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorBar: {
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    maxWidth: 100,
  },
  workloadText: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  workloadValue: {
    fontWeight: "bold",
    fontSize: 16,
  },
  workloadLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    width: "48%",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: "#333",
  },
});

export default WorkloadDistributionChart;
