import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Card, Text, ActivityIndicator } from "react-native-paper";
import { LineChart } from "react-native-chart-kit";
import { useEmployeeAnalytics } from "../../hooks/api/useAnalytics";

const screenWidth = Dimensions.get("window").width;

const EmployeeEfficiencyChart = ({ employeeId }) => {
  const { data: analytics, isLoading } = useEmployeeAnalytics(employeeId);

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <ActivityIndicator size="small" />
        </Card.Content>
      </Card>
    );
  }

  if (
    !analytics ||
    !analytics.kpi_history ||
    analytics.kpi_history.length === 0
  ) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Нет данных по сотруднику</Text>
        </Card.Content>
      </Card>
    );
  }

  const kpiHistory = analytics.kpi_history;
  const data = {
    labels: kpiHistory.map((item, index) => `Нед ${index + 1}`),
    datasets: [
      {
        data: kpiHistory.map((item) => item.value),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const currentEfficiency = analytics.current_week?.efficiency || 0;
  const previousEfficiency =
    kpiHistory.length > 1 ? kpiHistory[kpiHistory.length - 2].value : 0;
  const change = currentEfficiency - previousEfficiency;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            👤 Эффективность сотрудника
          </Text>
          <View style={styles.efficiencyBadge}>
            <Text style={styles.efficiencyText}>{currentEfficiency}%</Text>
            <Text
              style={[
                styles.changeText,
                change >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}%
            </Text>
          </View>
        </View>

        <LineChart
          data={data}
          width={screenWidth - 32}
          height={200}
          yAxisLabel=""
          yAxisSuffix="%"
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#f8f9fa",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#2196F3",
            },
          }}
          bezier
          style={styles.chart}
        />

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Выполнено</Text>
            <Text style={styles.statValue}>
              {analytics.current_week?.tasks_completed || 0}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Просрочено</Text>
            <Text style={[styles.statValue, styles.overdue]}>
              {analytics.current_week?.tasks_overdue || 0}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Проектов</Text>
            <Text style={styles.statValue}>
              {analytics.current_week?.active_projects || 0}
            </Text>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontWeight: "bold",
  },
  efficiencyBadge: {
    alignItems: "center",
  },
  efficiencyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2196F3",
  },
  changeText: {
    fontSize: 12,
  },
  positive: {
    color: "#4CAF50",
  },
  negative: {
    color: "#F44336",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  overdue: {
    color: "#F44336",
  },
});

export default EmployeeEfficiencyChart;
