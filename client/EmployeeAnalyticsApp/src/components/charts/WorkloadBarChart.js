import React from "react";
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Card, Text } from "react-native-paper";
import { BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const WorkloadBarChart = ({ departmentStats }) => {
  if (!departmentStats || departmentStats.length === 0) return null;

  // Используем полные названия
  const labels = departmentStats.map((dept) => dept.name);
  const dataValues = departmentStats.map((dept) => dept.avg_workload);

  // Рассчитываем ширину графика в зависимости от количества отделов
  const chartWidth = Math.max(
    screenWidth - 32, // Минимальная ширина
    departmentStats.length * 80 // Ширина для каждого отдела (80px на отдел)
  );

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    // Статичный синий цвет без градиента
    color: () => "#2196F3",
    labelColor: () => "#000000",
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.5,
    // Отключаем градиенты, используем плоский цвет
    fillShadowGradient: "#2196F3",
    fillShadowGradientOpacity: 1,
    propsForLabels: {
      fontSize: 10,
    },
    propsForBackgroundLines: {
      strokeWidth: 0.5,
      stroke: "#e0e0e0",
    },
    propsForVerticalLabels: {
      fontSize: 10,
    },
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>
          📈 Загрузка по отделам
        </Text>
        
        <ScrollView 
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollContainer}
        >
          <BarChart
            data={{
              labels: labels,
              datasets: [{
                data: dataValues,
              }],
            }}
            width={chartWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars={true}
            fromZero={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            segments={5}
            barRadius={3}
            verticalLabelRotation={-45}
          />
        </ScrollView>
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
  scrollContainer: {
    paddingRight: 16,
    minWidth: screenWidth - 32,
  },
  chart: {
    marginVertical: 4,
    borderRadius: 8,
  },
});

export default WorkloadBarChart;