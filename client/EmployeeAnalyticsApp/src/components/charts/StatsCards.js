import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Card, Text } from "react-native-paper";

const { width } = Dimensions.get("window");

const StatsCards = ({ data }) => {
  const metrics = [
    {
      title: "Сотрудников",
      value: data.total_employees,
      subtitle: "активных",
      icon: "👥",
      color: "#2196F3",
    },
    {
      title: "Проектов",
      value: data.active_projects,
      subtitle: "активных",
      icon: "📋",
      color: "#4CAF50",
    },
    {
      title: "Загрузка",
      value: `${data.avg_workload}%`,
      subtitle: "средняя",
      icon: "⚡",
      color: data.avg_workload > 80 ? "#FF9800" : "#2196F3",
    },
    {
      title: "Эффективность",
      value: `${data.overall_efficiency}%`,
      subtitle: "общая",
      icon: "📊",
      color: data.overall_efficiency > 80 ? "#4CAF50" : "#F44336",
    },
  ];

  return (
    <View style={styles.container}>
      {metrics.map((metric, index) => (
        <Card
          key={index}
          style={[styles.card, { backgroundColor: metric.color + "15" }]}
        >
          <Card.Content style={styles.content}>
            <Text style={[styles.icon, { color: metric.color }]}>
              {metric.icon}
            </Text>
            <Text
              variant="headlineMedium"
              style={[styles.value, { color: metric.color }]}
            >
              {metric.value}
            </Text>
            <Text variant="labelMedium" style={styles.title}>
              {metric.title}
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              {metric.subtitle}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    width: (width - 48) / 2,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  content: {
    alignItems: "center",
    padding: 16,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  value: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  title: {
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  subtitle: {
    opacity: 0.6,
    textAlign: "center",
    fontSize: 12,
  },
});

export default StatsCards;
