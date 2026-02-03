import React from "react";
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Card, Text } from "react-native-paper";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const EfficiencyLineChart = ({ departments }) => {
  const sortedDepts = [...departments].sort((a, b) => a.avg_efficiency - b.avg_efficiency);

  // Используем полные названия
  const labels = sortedDepts.map((dept) => dept.name);
  const efficiencyData = sortedDepts.map((dept) => dept.avg_efficiency);

  // Рассчитываем ширину графика в зависимости от количества отделов
  const chartWidth = Math.max(
    screenWidth - 100, // Минимальная ширина
    departments.length * 89 // Ширина для каждого отдела
  );

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#f8f9fa",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#4CAF50",
    },
    propsForLabels: {
      fontSize: 10,
    },
    propsForVerticalLabels: {
      fontSize: 10,
    },
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>
          📈 Тренд эффективности
        </Text>
        
        <ScrollView 
          horizontal={true} 
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: labels,
                datasets: [{
                  data: efficiencyData,
                }],
              }}
              width={chartWidth}
              height={280} // Высота с учетом меток
              yAxisLabel=""
              yAxisSuffix="%"
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              fromZero
              verticalLabelRotation={-45} // Поворот для экономии места
              withVerticalLabels={true}
              withHorizontalLabels={true}
              segments={5}
            />
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
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
    paddingRight: 0,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: screenWidth - 32,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default EfficiencyLineChart;