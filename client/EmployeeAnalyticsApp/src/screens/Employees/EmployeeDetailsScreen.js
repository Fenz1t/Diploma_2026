import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, Dimensions } from "react-native";
import {
  Appbar,
  ActivityIndicator,
  Avatar,
  Card,
  Divider,
  Text,
  TextInput,
  Button,
  Snackbar,
  Chip,
  Switch,
  Modal,
  Portal,
  List,
} from "react-native-paper";
import { BarChart, PieChart, LineChart } from "react-native-chart-kit";
import { API_BASE_URL } from "../../services/api/client";
import {
  useEmployeeById,
  useUpdateEmployee,
} from "../../hooks/api/useEmployees";
import {
  useEmployeeAnalytics,
  useLowEfficiency,
  useDepartmentStats,
} from "../../hooks/api/useAnalytics";
import { useDepartmentsSelect } from "../../hooks/api/useDepartments";
import { usePositions } from "../../hooks/api/usePositions";

const screenWidth = Dimensions.get("window").width;

const EmployeeDetailsScreen = ({ route, navigation }) => {
  const employeeId = route.params?.employeeId ?? route.params?.id;

  const {
    data: employee,
    isLoading: isEmployeeLoading,
    error: employeeError,
    refetch,
  } = useEmployeeById(employeeId);

  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
  } = useEmployeeAnalytics(employeeId);

  const { data: lowEfficiency = [] } = useLowEfficiency(60);
  const { data: departmentStats = [] } = useDepartmentStats();

  const { data: departments = [] } = useDepartmentsSelect();
  const { data: positions = [] } = usePositions();

  const updateMutation = useUpdateEmployee();

  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [departmentId, setDepartmentId] = useState(null);
  const [positionId, setPositionId] = useState(null);
  const [isActive, setIsActive] = useState(true);

  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [posModalVisible, setPosModalVisible] = useState(false);

  const [snackbar, setSnackbar] = useState({
    visible: false,
    text: "",
  });

  useEffect(() => {
    if (employee) {
      setFullName(employee.full_name || "");
      setEmail(employee.email || "");
      setPhone(employee.phone || "");
      setDepartmentId(employee.department_id || null);
      setPositionId(employee.position_id || null);
      setIsActive(employee.is_active ?? true);
    }
  }, [employee]);

  const baseUrl = API_BASE_URL.replace(/\/api$/, "");
  const photoUrl = employee?.photo_url
    ? `${baseUrl}${employee.photo_url}`
    : null;

  const isLoading = isEmployeeLoading || isAnalyticsLoading;

  const tasksCompleted = analytics?.current_week?.tasks_completed || 0;
  const tasksOverdue = analytics?.current_week?.tasks_overdue || 0;
  const totalTasks = tasksCompleted + tasksOverdue;

  const workload = analytics?.current_week?.workload || 0;
  const efficiency = analytics?.current_week?.efficiency || 0;

  const taskChartData = useMemo(
    () => ({
      labels: ["Выполнено", "Просрочено"],
      datasets: [
        {
          data: [tasksCompleted, tasksOverdue],
        },
      ],
    }),
    [tasksCompleted, tasksOverdue],
  );

  const workloadChartData = useMemo(
    () => ({
      labels: ["Загрузка", "Эффективность"],
      datasets: [
        {
          data: [workload, efficiency],
        },
      ],
    }),
    [workload, efficiency],
  );

  const projectChartData = useMemo(() => {
    const projects = analytics?.projects || [];
    if (!projects.length) return [];

    const colors = [
      "#2196F3",
      "#4CAF50",
      "#FFC107",
      "#FF5722",
      "#9C27B0",
      "#009688",
    ];

    return projects.map((p, index) => ({
      name: p.name,
      workload: Number(p.workload_share || 0),
      color: colors[index % colors.length],
      legendFontColor: "#333",
      legendFontSize: 12,
    }));
  }, [analytics]);

  const completionPieData = useMemo(
    () => [
      {
        name: "Выполнено",
        population: tasksCompleted,
        color: "#4CAF50",
        legendFontColor: "#333",
        legendFontSize: 12,
      },
      {
        name: "Просрочено",
        population: tasksOverdue,
        color: "#F44336",
        legendFontColor: "#333",
        legendFontSize: 12,
      },
    ],
    [tasksCompleted, tasksOverdue],
  );

  const kpiHistory = analytics?.kpi_history || [];
  const kpiChartData = useMemo(() => {
    if (!kpiHistory.length) return null;

    return {
      labels: kpiHistory.map((item) => String(item.period).slice(5)),
      datasets: [
        {
          data: kpiHistory.map((item) => Number(item.value || 0)),
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [kpiHistory]);

  const selectedDepartment = departments.find((d) => d.id === departmentId);
  const selectedPosition = positions.find((p) => p.id === positionId);

  const isRisk = lowEfficiency.some((e) => e.id === employeeId);

  // 2) Статус по задачам
  const taskRiskRate = totalTasks > 0 ? tasksOverdue / totalTasks : 0;

  let taskStatusLabel = "Задачи в норме";
  if (tasksOverdue > 0) taskStatusLabel = "Есть просрочки";
  if (taskRiskRate >= 0.5) taskStatusLabel = "Риск по задачам";

  // 3) Проекты + вклад
  const totalProjectWorkload = projectChartData.reduce(
    (sum, p) => sum + p.workload,
    0,
  );
  const topProject =
    projectChartData.length > 0
      ? [...projectChartData].sort((a, b) => b.workload - a.workload)[0]
      : null;

  // 4) Сравнение с отделом
  const departmentAnalytics = departmentStats.find(
    (d) => d.id === employee?.department_id,
  );
  const departmentEfficiency = departmentAnalytics?.avg_efficiency ?? null;
  const isBelowDepartment =
    departmentEfficiency !== null && efficiency < departmentEfficiency;

  const getDepartmentEfficiencyColor = () => {
    if (departmentEfficiency === null) return "#666";
    if (efficiency >= departmentEfficiency) return "#02c21b";
    if (efficiency >= departmentEfficiency - 5) return "#FFC107";
    return "#F44336";
  };

  // 5) KPI‑бейдж
  const kpiBadgeText =
    tasksCompleted >= 10
      ? `Перевыполнение: ${tasksCompleted} задач`
      : `Выполнил ${tasksCompleted} задач`;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: employeeId,
        payload: {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          department_id: departmentId,
          position_id: positionId,
          is_active: isActive,
        },
      });
      setEditMode(false);
      setSnackbar({ visible: true, text: "✅ Данные обновлены" });
      refetch();
    } catch (e) {
      setSnackbar({
        visible: true,
        text: `❌ ${e?.message || "Ошибка обновления"}`,
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Загрузка данных...</Text>
      </View>
    );
  }

  if (employeeError) {
    return (
      <View style={styles.center}>
        <Text>Ошибка загрузки сотрудника</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={navigation.goBack} />
        <Appbar.Content title="Сотрудник" />
        <Appbar.Action icon="refresh" onPress={refetch} />
        <Appbar.Action
          icon={editMode ? "close" : "pencil"}
          onPress={() => setEditMode((prev) => !prev)}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            {photoUrl ? (
              <Avatar.Image size={64} source={{ uri: photoUrl }} />
            ) : (
              <Avatar.Icon size={64} icon="account" />
            )}

            <View style={styles.profileInfo}>
              <Text style={styles.name}>{employee.full_name}</Text>
              <Text style={styles.subtext}>
                {employee.position?.name || "Без должности"}
              </Text>
              <Text style={styles.subtext}>
                {employee.department?.name || "Без отдела"}
              </Text>

              <View style={styles.statusRow}>
                <Chip
                  icon={employee.is_active ? "check" : "close"}
                  style={[
                    styles.statusChip,
                    employee.is_active ? styles.active : styles.inactive,
                  ]}
                >
                  {employee.is_active ? "Активен" : "Не активен"}
                </Chip>

                {isRisk && (
                  <Chip style={styles.riskChip} icon="alert">
                    В зоне риска
                  </Chip>
                )}
              </View>

              <View style={styles.statusRow}>
                <Chip icon="clipboard-text">{taskStatusLabel}</Chip>
              </View>

              <View style={styles.statusRow}>
                <Chip icon="check-decagram">{kpiBadgeText}</Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              📄 Основная информация
            </Text>

            {editMode ? (
              <>
                <TextInput
                  label="ФИО"
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                />
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  keyboardType="email-address"
                />
                <TextInput
                  label="Телефон"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                />

                <Button
                  mode="outlined"
                  onPress={() => setDeptModalVisible(true)}
                  style={styles.selectBtn}
                >
                  {selectedDepartment?.name || "Выбрать отдел"}
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => setPosModalVisible(true)}
                  style={styles.selectBtn}
                >
                  {selectedPosition?.name || "Выбрать должность"}
                </Button>

                <View style={styles.switchRow}>
                  <Text>Активный сотрудник</Text>
                  <Switch value={isActive} onValueChange={setIsActive} />
                </View>

                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={updateMutation.isLoading}
                >
                  Сохранить
                </Button>
              </>
            ) : (
              <>
                <Text style={styles.infoText}>Email: {employee.email}</Text>
                <Text style={styles.infoText}>
                  Телефон: {employee.phone || "—"}
                </Text>
                <Text style={styles.infoText}>
                  Дата приема: {employee.hire_date || "—"}
                </Text>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              📊 Аналитика
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{efficiency}%</Text>
                <Text style={styles.statLabel}>Эффективность</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{workload}%</Text>
                <Text style={styles.statLabel}>Загрузка</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {analytics?.current_week?.active_projects || 0}
                </Text>
                <Text style={styles.statLabel}>Проектов</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.chartTitle}>
              Тренд эффективности по разным датам
            </Text>
            {kpiChartData ? (
              <LineChart
                data={kpiChartData}
                width={screenWidth - 60}
                height={220}
                yAxisSuffix="%"
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#f8f9fa",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <Text style={styles.infoText}>Нет данных по истории KPI</Text>
            )}

            <Divider style={styles.divider} />

            <Text style={styles.chartTitle}>Загрузка vs Эффективность</Text>
            <BarChart
              data={workloadChartData}
              width={screenWidth - 60}
              height={200}
              fromZero
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#f8f9fa",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              style={styles.chart}
            />

            <Divider style={styles.divider} />

            <Text style={styles.chartTitle}>Выполненные vs Просроченные</Text>
            <BarChart
              data={taskChartData}
              width={screenWidth - 60}
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

            <Divider style={styles.divider} />

            <Text style={styles.chartTitle}>Доля выполненных задач</Text>
            {totalTasks > 0 ? (
              <>
                <PieChart
                  data={completionPieData}
                  width={screenWidth - 48}
                  height={220}
                  hasLegend={false}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"70"}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  style={styles.chart}
                />

                <View style={styles.legend}>
                  {completionPieData.map((p) => (
                    <View key={p.name} style={styles.legendRow}>
                      <View
                        style={[
                          styles.legendColor,
                          { backgroundColor: p.color },
                        ]}
                      />
                      <Text style={styles.legendText}>
                        {p.name} —{" "}
                        {Math.round((p.population / totalTasks) * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.infoText}>Нет данных по задачам</Text>
            )}

            <Divider style={styles.divider} />

            <Text style={styles.chartTitle}>Распределение по проектам</Text>
            {projectChartData.length > 0 ? (
              <>
                <PieChart
                  data={projectChartData}
                  width={screenWidth - 48}
                  height={220}
                  hasLegend={false}
                  accessor={"workload"}
                  backgroundColor={"transparent"}
                  paddingLeft={"70"}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  style={styles.chart}
                />
                <View style={styles.legend}>
                  {projectChartData.map((p) => (
                    <View key={p.name} style={styles.legendRow}>
                      <View
                        style={[
                          styles.legendColor,
                          { backgroundColor: p.color },
                        ]}
                      />
                      <Text style={styles.legendText}>
                        {p.name} — {p.workload}%
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.infoText}>Нет данных по проектам</Text>
            )}

            {topProject && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.infoText}>
                  Топ‑проект: {topProject.name} (
                  {Math.round(
                    (topProject.workload / totalProjectWorkload) * 100,
                  )}
                  % вклада)
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              🗂 Проекты
            </Text>

            {(analytics?.projects || []).length === 0 ? (
              <Text style={styles.infoText}>Проекты не найдены</Text>
            ) : (
              analytics.projects.map((p, idx) => (
                <View key={`${p.name}-${idx}`} style={styles.projectRow}>
                  <Text style={styles.projectName}>{p.name}</Text>
                  <Text style={styles.projectMeta}>
                    Загрузка: {p.workload_share}% | Выполнено:{" "}
                    {p.tasks_completed} | Просрочено: {p.tasks_overdue}
                  </Text>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, text: "" })}
        duration={3000}
      >
        {snackbar.text}
      </Snackbar>

      {analyticsError ? (
        <Snackbar visible={true} duration={3000} onDismiss={() => {}}>
          Ошибка загрузки аналитики
        </Snackbar>
      ) : null}

      <Portal>
        <Modal
          visible={deptModalVisible}
          onDismiss={() => setDeptModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Выбор отдела</Text>
          <ScrollView style={{ maxHeight: 300 }}>
            {departments.map((d) => (
              <List.Item
                key={d.id}
                title={d.name}
                onPress={() => {
                  setDepartmentId(d.id);
                  setDeptModalVisible(false);
                }}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={posModalVisible}
          onDismiss={() => setPosModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Выбор должности</Text>
          <ScrollView style={{ maxHeight: 300 }}>
            {positions.map((p) => (
              <List.Item
                key={p.id}
                title={p.name}
                onPress={() => {
                  setPositionId(p.id);
                  setPosModalVisible(false);
                }}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scroll: { paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  profileCard: { margin: 16, borderRadius: 12 },
  profileContent: { flexDirection: "row", alignItems: "center" },
  profileInfo: { marginLeft: 16, flex: 1 },
  name: { fontSize: 18, fontWeight: "bold" },
  subtext: { color: "#666", marginTop: 2 },
  statusRow: { marginTop: 8, flexDirection: "column", gap: 8 },
  statusChip: { marginTop: 8, flexDirection: "column", gap: 8 },
  active: { backgroundColor: "#E8F5E9" },
  inactive: { backgroundColor: "#FFEBEE" },

  riskChip: { backgroundColor: "#FFEBEE" },

  card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12 },
  sectionTitle: { marginBottom: 12, fontWeight: "bold" },
  infoText: { marginBottom: 6, color: "#444" },
  departmentTextEfficency: { marginBottom: 6 },

  input: { marginBottom: 12 },
  selectBtn: { marginBottom: 12 },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },

  divider: { marginVertical: 12 },
  chartTitle: { marginBottom: 8, fontWeight: "600" },
  chart: { borderRadius: 12 },

  legend: { marginTop: 8 },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: { color: "#333", fontSize: 12 },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  projectRow: { marginBottom: 12 },
  projectName: { fontWeight: "bold" },
  projectMeta: { color: "#666", fontSize: 12 },

  modalContainer: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontWeight: "bold", marginBottom: 8 },
});

export default EmployeeDetailsScreen;
