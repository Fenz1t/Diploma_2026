import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Card, Text } from "react-native-paper";
import { VictoryPie, VictoryLegend } from "victory-native";

const screenWidth = Dimensions.get("window").width;

const DepartmentPieChart = ({ departments }) => {
  const colors = [
    "#2196F3",
    "#4CAF50",
    "#FF9800",
    "#9C27B0",
    "#F44336",
    "#FFC107",
    "#00BCD4",
    "#8BC34A",
    "#FF5722",
    "#673AB7",
  ];

  // Форматируем названия для переносов
  const formatNameForLegend = (name) => {
    if (!name) return "";

    if (name.length <= 15) return name;

    const words = name.split(" ");
    let result = "";
    let currentLine = "";

    for (const word of words) {
      if ((currentLine + word).length <= 15) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        result += (result ? "\n" : "") + currentLine;
        currentLine = word;
      }
    }

    if (currentLine) {
      result += (result ? "\n" : "") + currentLine;
    }

    return result || name.substring(0, 15) + "...";
  };

  // Данные для VictoryPie
  const pieData = departments.map((dept) => ({
    x: formatNameForLegend(dept.name),
    y: dept.employee_count,
  }));

  // Данные для легенды
  const legendData = departments.map((dept, index) => ({
    name: `${formatNameForLegend(dept.name)} (${dept.employee_count})`,
    symbol: { fill: colors[index % colors.length] },
  }));

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>
          🏢 Распределение по отделам
        </Text>

        <View style={styles.chartContainer}>
          <VictoryPie
            data={pieData}
            colorScale={colors}
            width={700} // сохраняем ширину
            height={270} // сохраняем высоту
            innerRadius={0} // как в chart-kit
            padAngle={2}
            labels={() => null} // отключаем подписи внутри секторов
          />
        </View>

        {/* Легенда под диаграммой */}
        <VictoryLegend
          orientation="horizontal"
          gutter={12}
          itemsPerRow={2}
          width={350}
          height={100} // сохраняем ширину как у PieChart
          style={{
            labels: { fontSize: 15, fill: "#7F7F7F" }, // такой же цвет и размер шрифта
          }}
          data={legendData}
        />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 0,
  },
});

export default DepartmentPieChart;
