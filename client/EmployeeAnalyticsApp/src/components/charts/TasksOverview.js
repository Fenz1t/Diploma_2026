import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Card, Text } from "react-native-paper";
import { PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const TasksOverview = ({ overall, departments }) => {
  // Используем реальные данные из API
  const completedTasks = overall.completed_tasks || 0;
  const overdueTasks = overall.overdue_tasks || 0;
  const totalTasks = completedTasks + overdueTasks;

  const data = [
    {
      name: "Выполнено",
      count: completedTasks,
      color: "#4CAF50",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Просрочено",
      count: overdueTasks,
      color: "#F44336",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Всего",
      count: totalTasks,
      color: "#2196F3",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
  ];

  // Если оба значения 0, показываем placeholder
  if (totalTasks === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            ✅ Обзор задач
          </Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>📊</Text>
            <Text style={styles.placeholderTitle}>Задач пока нет</Text>
            <Text style={styles.placeholderSubtitle}>
              Создайте задачи в проектах чтобы увидеть статистику
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>
          ✅ Обзор задач
        </Text>

        <View style={styles.content}>
          <PieChart
            data={data}
            width={200}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="50"
            absolute
            hasLegend={false}
          />
          <View style={styles.stats}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Выполнено:</Text>
              <Text style={[styles.statValue, styles.completed]}>
                {completedTasks}
              </Text>
              {totalTasks > 0 && (
                <Text style={styles.statPercentage}>
                  ({Math.round((completedTasks / totalTasks) * 100)}%)
                </Text>
              )}
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Просрочено:</Text>
              <Text style={[styles.statValue, styles.overdue]}>
                {overdueTasks}
              </Text>
              {totalTasks > 0 && (
                <Text style={styles.statPercentage}>
                  ({Math.round((overdueTasks / totalTasks) * 100)}%)
                </Text>
              )}
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Всего задач:</Text>
              <Text style={[styles.statValue, styles.total]}>{totalTasks}</Text>
            </View>
          </View>
        </View>

        {overdueTasks > 0 && (
          <View style={styles.overdueWarning}>
            <Text style={styles.warningText}>
              ⚠️ {overdueTasks} просроченных задач
              {completedTasks > 0 &&
                ` (${Math.round((overdueTasks / totalTasks) * 100)}% от общего количества)`}
            </Text>
            <Text style={styles.warningSubtext}>
              Рекомендуется проверить причины просрочки
            </Text>
          </View>
        )}

        {completedTasks > 0 && overdueTasks === 0 && (
          <View style={styles.successMessage}>
            <Text style={styles.successText}>
              🎉 Все задачи выполнены вовремя!
            </Text>
          </View>
        )}
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
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  placeholder: {
    alignItems: "center",
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  stats: {
    flex: 1,
    marginLeft: 16,
  },
  statRow: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 12,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 4,
  },
  completed: {
    color: "#4CAF50",
  },
  overdue: {
    color: "#F44336",
  },
  total: {
    color: "#2196F3",
  },
  statPercentage: {
    fontSize: 12,
    opacity: 0.6,
  },
  overdueWarning: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF9800",
  },
  warningText: {
    color: "#E65100",
    fontSize: 14,
    fontWeight: "500",
  },
  warningSubtext: {
    color: "#E65100",
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
  },
  successMessage: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  successText: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default TasksOverview;
