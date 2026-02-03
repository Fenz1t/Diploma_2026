import React from "react";
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Card, Text } from "react-native-paper";
import { BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const DepartmentComparisonChart = ({ departments }) => {
  if (!departments || departments.length === 0) return null;

  const safe = departments.map((d) => ({
    name: d?.name ?? "",
    avg_efficiency: toNumber(d?.avg_efficiency),
    avg_workload: toNumber(d?.avg_workload),
  }));

  // Полные названия (как у тебя)
  const labels = safe.map((dept) => dept.name);
  const efficiencyData = safe.map((dept) => dept.avg_efficiency);
  const workloadData = safe.map((dept) => dept.avg_workload);

  // Ширина как в твоём примере
  const chartWidth = Math.max(screenWidth - 32, safe.length * 80);

  // ✅ небольшой запас, чтобы последний label справа не резался
  const chartWidthWithPadding = chartWidth + 20;

  const baseChartConfig = (color) => ({
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: () => color,
    labelColor: () => "#000000",
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.5,
    fillShadowGradient: color,
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
  });

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>
          📊 Сравнение отделов
        </Text>

        {/* ===== ЭФФЕКТИВНОСТЬ ===== */}
        <Text style={styles.sectionTitle}>Эффективность (%)</Text>

        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollContainer}
        >
          <BarChart
            data={{
              labels,
              datasets: [{ data: efficiencyData }],
            }}
            width={chartWidthWithPadding}
            height={240}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={baseChartConfig("#4CAF50")}
            style={styles.chart}
            showValuesOnTopOfBars={true}
            fromZero={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            segments={5}
            barRadius={3}
            verticalLabelRotation={-45}
            yLabelsOffset={25} // ✅ лечит обрезание слева без сильного сдвига
            labelsOffset={6} // ✅ чуть двигает X подписи внутрь (если поддерживается)
          />
        </ScrollView>

        {/* ===== ЗАГРУЗКА ===== */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
          Загрузка (%)
        </Text>

        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollContainer}
        >
          <BarChart
            data={{
              labels,
              datasets: [{ data: workloadData }],
            }}
            width={chartWidthWithPadding}
            height={240}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={baseChartConfig("#2196F3")}
            style={styles.chart}
            showValuesOnTopOfBars={true}
            fromZero={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            segments={5}
            barRadius={3}
            verticalLabelRotation={-45}
            yLabelsOffset={25}
            labelsOffset={6}
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
    marginBottom: 12,
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  scrollContainer: {
    paddingRight: 15, // ✅ ВАЖНО: запас справа, чтобы последний лейбл не резало
    minWidth: screenWidth - 32,
  },
  chart: {
    marginVertical: 4,
    borderRadius: 8,
  },
});

export default DepartmentComparisonChart;
