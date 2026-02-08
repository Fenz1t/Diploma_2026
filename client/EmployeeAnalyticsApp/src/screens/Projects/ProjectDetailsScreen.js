import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Dimensions,
  ScrollView as HorizontalScroll,
} from "react-native";
import {
  Appbar,
  ActivityIndicator,
  Card,
  Divider,
  Text,
  Chip,
  List,
} from "react-native-paper";
import { BarChart, PieChart } from "react-native-chart-kit";
import { useProject } from "../../hooks/api/useProjects";
import { reportsApi } from "../../services/api/reportsApi";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from "../../utils/constants/projectStatus";

const screenWidth = Dimensions.get("window").width;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU");
};

const ProjectDetailsScreen = ({ route, navigation }) => {
  const projectId = route.params?.projectId;

  const { data: project, isLoading: projectLoading } = useProject(projectId);

  const [workloadData, setWorkloadData] = useState([]);
  const [workloadLoading, setWorkloadLoading] = useState(false);
  const [workloadError, setWorkloadError] = useState(null);

  useEffect(() => {
    const loadWorkload = async () => {
      try {
        setWorkloadLoading(true);
        const data = await reportsApi.getWorkload();
        setWorkloadData(Array.isArray(data) ? data : []);
      } catch (e) {
        setWorkloadError("Ошибка загрузки отчета по загрузке");
      } finally {
        setWorkloadLoading(false);
      }
    };

    loadWorkload();
  }, []);

  const projectEmployees = useMemo(() => {
    if (!project?.name || !workloadData.length) return [];

    return workloadData
      .map((item) => {
        const projectEntry = (item.projects || []).find(
          (p) => p.project === project.name,
        );
        if (!projectEntry) return null;

        return {
          employee: item.employee,
          completed: Number(projectEntry.completed || 0),
          overdue: Number(projectEntry.overdue || 0),
          workload: Number(projectEntry.workload || 0),
        };
      })
      .filter(Boolean);
  }, [project?.name, workloadData]);

  const totals = useMemo(() => {
    const completed = projectEmployees.reduce((sum, e) => sum + e.completed, 0);
    const overdue = projectEmployees.reduce((sum, e) => sum + e.overdue, 0);
    const workload = projectEmployees.reduce((sum, e) => sum + e.workload, 0);
    const totalTasks = completed + overdue;
    const efficiency =
      totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    return { completed, overdue, workload, totalTasks, efficiency };
  }, [projectEmployees]);

  const topPerformers = useMemo(() => {
    return [...projectEmployees]
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 10);
  }, [projectEmployees]);

  const tasksPieData = useMemo(
    () => [
      {
        name: "Выполнено",
        population: totals.completed,
        color: "#4CAF50",
        legendFontColor: "#333",
        legendFontSize: 12,
      },
      {
        name: "Просрочено",
        population: totals.overdue,
        color: "#F44336",
        legendFontColor: "#333",
        legendFontSize: 12,
      },
    ],
    [totals],
  );

  const topBarData = useMemo(() => {
    return {
      labels: topPerformers.map(
        (e) => e.employee?.full_name?.split(" ")[0] || "—",
      ),
      datasets: [
        {
          data: topPerformers.map((e) => e.completed),
        },
      ],
    };
  }, [topPerformers]);

  const isLoading = projectLoading || workloadLoading;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Загрузка проекта...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Text>Проект не найден</Text>
      </View>
    );
  }

  const statusLabel =
    PROJECT_STATUS_LABELS[project.status] || project.status || "—";
  const statusColor = PROJECT_STATUS_COLORS[project.status] || "#999";

  const topChartWidth = Math.max(screenWidth - 48, topPerformers.length * 80);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={navigation.goBack} />
        <Appbar.Content title="Проект" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">{project.name}</Text>
            <Text style={styles.subtext}>
              {project.description || "Без описания"}
            </Text>

            <View style={styles.chipRow}>
              <Chip mode="outlined" textStyle={{ color: statusColor }}>
                Статус: {statusLabel}
              </Chip>
              <Chip mode="outlined">
                Старт: {formatDate(project.start_date)}
              </Chip>
              <Chip mode="outlined">Финиш: {formatDate(project.end_date)}</Chip>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              📊 Статистика по проекту
            </Text>

            <View style={styles.statsRow}>
              <Chip>Сотрудников: {projectEmployees.length}</Chip>
              <Chip>Выполнено: {totals.completed}</Chip>
              <Chip>Просрочено: {totals.overdue}</Chip>
              <Chip>Эффективность: {totals.efficiency}%</Chip>
            </View>

            <Divider style={styles.divider} />

            {totals.totalTasks > 0 ? (
              <>
                <Text style={styles.chartTitle}>Выполнено vs Просрочено</Text>
                <PieChart
                  data={tasksPieData}
                  width={screenWidth - 48}
                  height={220}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"70"}
                  hasLegend={false}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  style={styles.chart}
                />

                <View style={styles.legendRow}>
                  {tasksPieData.map((p) => (
                    <View key={p.name} style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendColor,
                          { backgroundColor: p.color },
                        ]}
                      />
                      <Text style={styles.legendText}>
                        {p.name} — {p.population}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.infoText}>Нет данных по задачам</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              🏆 Топ‑сотрудники проекта
            </Text>

            {topPerformers.length > 0 ? (
              <>
                <HorizontalScroll horizontal showsHorizontalScrollIndicator>
                  <BarChart
                    data={topBarData}
                    width={topChartWidth}
                    height={220}
                    fromZero
                    chartConfig={{
                      backgroundColor: "#ffffff",
                      backgroundGradientFrom: "#f8f9fa",
                      backgroundGradientTo: "#ffffff",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    style={styles.chart}
                  />
                </HorizontalScroll>

                {topPerformers.map((p, idx) => (
                  <List.Item
                    key={`${p.employee?.id}-${idx}`}
                    title={p.employee?.full_name || "—"}
                    description={`Выполнено: ${p.completed}, Просрочено: ${p.overdue}, Нагрузка: ${p.workload}%`}
                    onPress={() =>
                      navigation.navigate("EmployeeDetails", {
                        employeeId: p.employee?.id,
                      })
                    }
                  />
                ))}
              </>
            ) : (
              <Text style={styles.infoText}>Нет данных по сотрудникам</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              👥 Сотрудники проекта
            </Text>

            {projectEmployees.length === 0 ? (
              <Text style={styles.infoText}>Сотрудников нет</Text>
            ) : (
              projectEmployees.map((p, idx) => (
                <List.Item
                  key={`${p.employee?.id}-${idx}`}
                  title={p.employee?.full_name || "—"}
                  description={`Выполнено: ${p.completed}, Просрочено: ${p.overdue}, Нагрузка: ${p.workload}%`}
                  onPress={() =>
                    navigation.navigate("EmployeeDetails", {
                      employeeId: p.employee?.id,
                    })
                  }
                />
              ))
            )}
          </Card.Content>
        </Card>

        {workloadError && <Text style={styles.infoText}>{workloadError}</Text>}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scroll: { paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { margin: 16, borderRadius: 12 },
  subtext: { color: "#666", marginTop: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  divider: { marginVertical: 12 },
  chartTitle: { marginBottom: 8, fontWeight: "600" },
  chart: { borderRadius: 12 },
  sectionTitle: { marginBottom: 12, fontWeight: "bold" },
  infoText: { color: "#666", marginTop: 8 },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: { color: "#333", fontSize: 12 },
});

export default ProjectDetailsScreen;
