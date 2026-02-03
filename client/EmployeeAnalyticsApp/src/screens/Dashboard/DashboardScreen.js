import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  Appbar,
  ActivityIndicator,
  Text,
  Chip,
  Divider,
  useTheme,
  Menu,
  IconButton,
  Snackbar,
  SegmentedButtons,
} from "react-native-paper";
import {
  useDashboardData,
  useRecalculateKPIs,
} from "../../hooks/api/useAnalytics";

// Импортируем все компоненты
import StatsCards from "../../components/charts/StatsCards";
import WorkloadBarChart from "../../components/charts/WorkloadBarChart";
import EfficiencyLineChart from "../../components/charts/EfficiencyLineChart";
import DepartmentPieChart from "../../components/charts/DepartmentPieChart";
import TopPerformersList from "../../components/charts/TopPerformersList";
import ProblemsList from "../../components/charts/ProblemsList";
import EmployeeEfficiencyChart from "../../components/charts/EmployeeEfficiencyChart";
import LowEfficiencyChart from "../../components/charts/LowEfficiencyChart";
import WorkloadDistributionChart from "../../components/charts/WorkloadDistributionChart";
import DepartmentComparisonChart from "../../components/charts/DepartmentComparisonChart";
import TasksOverview from "../../components/charts/TasksOverview";

const DashboardScreen = ({ navigation }) => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("week");
  const [viewMode, setViewMode] = useState("overview");
  const [menuVisible, setMenuVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  const { data: dashboardData, isLoading, error, refetch } = useDashboardData();

  const recalcMutation = useRecalculateKPIs();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      setSnackbarMessage("✅ Данные обновлены");
      setSnackbarVisible(true);
    } catch {
      setSnackbarMessage("❌ Ошибка обновления");
      setSnackbarVisible(true);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRecalculateKPIs = async () => {
    try {
      await recalcMutation.mutateAsync();
      setSnackbarMessage("✅ KPI пересчитаны");
      setSnackbarVisible(true);
    } catch {
      setSnackbarMessage("❌ Ошибка пересчета KPI");
      setSnackbarVisible(true);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Загрузка аналитики...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Ошибка загрузки дашборда</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
        <IconButton
          icon="refresh"
          mode="contained"
          onPress={refetch}
          style={styles.retryButton}
        />
      </View>
    );
  }

  const { overall, departments, top_performers, problems } = dashboardData;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Дашборд" />
        <Appbar.Action icon="refresh" onPress={onRefresh} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            📊 Расширенная аналитика
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Полный анализ деятельности сотрудников
          </Text>
          <SegmentedButtons
            value={viewMode}
            onValueChange={setViewMode}
            style={styles.segmented}
            buttons={[
              {
                value: "overview",
                label: "Обзор",
                icon: "view-dashboard",
              },
              {
                value: "details",
                label: "Детали",
                icon: "chart-bar",
              },
              {
                value: "problems",
                label: "Риски",
                icon: "alert",
              },
            ]}
          />
        </View>

        <Divider style={styles.divider} />

        {/* Основные метрики */}
        <StatsCards data={overall} />

        {viewMode === "overview" && (
          <>
            <WorkloadBarChart departmentStats={departments} />
            <EfficiencyLineChart departments={departments} />
            <DepartmentPieChart departments={departments} />
            <TopPerformersList
              performers={top_performers}
              onPressItem={(p) =>
                navigation.navigate("EmployeeDetails", { id: p.id })
              }
            />
          </>
        )}

        {viewMode === "details" && (
          <>
            <WorkloadDistributionChart departments={departments} />
            <DepartmentComparisonChart departments={departments} />
            <TasksOverview overall={overall} departments={departments} />
          </>
        )}

        {viewMode === "problems" && (
          <>
            <ProblemsList problems={problems} />
            <LowEfficiencyChart threshold={60} />

            <View style={styles.recommendations}>
              <Text variant="titleLarge" style={styles.recTitle}>
                💡 Рекомендации
              </Text>
              {problems.length > 0 ? (
                problems.map((problem, index) => (
                  <View key={index} style={styles.recItem}>
                    <Text style={styles.recText}>
                      • {problem.message}
                      {problem.severity === "high" &&
                        " - требуется срочное решение"}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noRecs}>
                  Все показатели в норме. Продолжайте мониторинг.
                </Text>
              )}
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Обновлено: {new Date().toLocaleTimeString("ru-RU")}
          </Text>
          <Text style={styles.footerNote}>
            Используйте сегментированные кнопки для переключения режимов
            просмотра
          </Text>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: "OK",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  errorSubtext: {
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#2196F3",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 16,
  },
  filters: {
    flexDirection: "row",
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
  },
  segmented: {
    marginTop: 8,
    fontSize: 2,
  },
  divider: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  recommendations: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
  },
  recTitle: {
    fontWeight: "bold",
    marginBottom: 12,
    color: "#2E7D32",
  },
  recItem: {
    marginBottom: 8,
  },
  recText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noRecs: {
    fontStyle: "italic",
    opacity: 0.7,
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    opacity: 0.5,
    marginBottom: 4,
  },
  footerNote: {
    fontSize: 12,
    opacity: 0.5,
  },
});

export default DashboardScreen;
