import React, { useEffect, useState, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Appbar,
  ActivityIndicator,
  Snackbar,
  Card,
  Text,
  Button,
  List,
  Portal,
  Modal,
  Searchbar,
  IconButton,
  Menu,
  Divider,
} from "react-native-paper";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { projectSchema } from "../../utils/validators/projectSchema";
import {
  useCreateProject,
  useUpdateProject,
  useProject,
  useProjectEmployees,
  useAddProjectEmployee,
  useRemoveProjectEmployee,
} from "../../hooks/api/useProjects";
import { employeesApi } from "../../services/api/employeesApi";
import { PROJECT_STATUSES } from "../../utils/constants/projectStatus";
import ProjectForm from "../../components/forms/ProjectForm";
import { useDepartmentsSelect } from "../../hooks/api/useDepartments";
import { usePositions } from "../../hooks/api/usePositions";

const ProjectFormScreen = ({ navigation, route }) => {
  const { projectId, projectName } = route.params || {};
  const isEditMode = !!projectId;

  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [serverError, setServerError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [allEmployees, setAllEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesModalVisible, setEmployeesModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [deptMenuVisible, setDeptMenuVisible] = useState(false);
  const [posMenuVisible, setPosMenuVisible] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [selectedPosId, setSelectedPosId] = useState(null);

  const { data: departments = [] } = useDepartmentsSelect();
  const { data: positions = [] } = usePositions();

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const { data: currentProject, isLoading: isLoadingProject } = useProject(
    projectId,
    { enabled: isEditMode },
  );

  const {
    data: projectEmployees = [],
    isLoading: projectEmployeesLoading,
    refetch: refetchProjectEmployees,
  } = useProjectEmployees(projectId);

  const addEmployeeMutation = useAddProjectEmployee();
  const removeEmployeeMutation = useRemoveProjectEmployee();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(projectSchema),
    defaultValues: {
      name: projectName || "",
      description: "",
      status: PROJECT_STATUSES.PLANNED,
      start_date: null,
      end_date: null,
    },
  });

  useEffect(() => {
    if (currentProject) {
      reset({
        name: currentProject.name,
        description: currentProject.description || "",
        status: currentProject.status || PROJECT_STATUSES.PLANNED,
        start_date: currentProject.start_date,
        end_date: currentProject.end_date,
      });
    }
  }, [currentProject, reset]);

  useEffect(() => {
    if (!isEditMode) return;

    const loadEmployees = async () => {
      setEmployeesLoading(true);
      try {
        const data = await employeesApi.getAll();
        setAllEmployees(Array.isArray(data) ? data : []);
      } catch (e) {
        console.log("Employees load error:", e);
      } finally {
        setEmployeesLoading(false);
      }
    };

    loadEmployees();
  }, [isEditMode]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setServerError("");
      clearErrors();

      const formatDateForBackend = (dateValue) => {
        if (!dateValue) return null;
        const date = new Date(dateValue);
        return date.toISOString().split("T")[0];
      };

      const formattedData = {
        name: data.name.trim(),
        description: (data.description || "").trim(),
        status: data.status || PROJECT_STATUSES.PLANNED,
        start_date: data.start_date
          ? formatDateForBackend(data.start_date)
          : null,
        end_date: data.end_date ? formatDateForBackend(data.end_date) : null,
      };

      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: projectId,
          data: formattedData,
        });
        setSnackbarMessage("✅ Проект обновлен");
      } else {
        await createMutation.mutateAsync(formattedData);
        setSnackbarMessage("✅ Проект создан");
      }

      setSnackbarVisible(true);

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      let errorMessage = "Неизвестная ошибка";

      if (
        error.response?.data?.error?.includes("уже существует") ||
        error.message?.includes("уже существует")
      ) {
        errorMessage = "Проект с таким названием уже существует";
        setServerError(errorMessage);
        setError("name", {
          type: "manual",
          message: errorMessage,
        });
      } else if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        errorMessage = validationErrors.map((err) => err.msg).join(", ");
        setServerError(errorMessage);

        validationErrors.forEach((err) => {
          const fieldName = err.path || err.param;
          if (fieldName && errors[fieldName]) {
            setError(fieldName, {
              type: "manual",
              message: err.msg,
            });
          }
        });
      } else if (error.isNetworkError || error.message === "Network Error") {
        errorMessage = "Нет подключения к интернету";
        setServerError(errorMessage);
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        setServerError(errorMessage);
      } else {
        errorMessage = error.message || "Неизвестная ошибка";
        setServerError(errorMessage);
      }

      setSnackbarMessage(`❌ ${errorMessage}`);
      setSnackbarVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectEmployeeIds = new Set(
    projectEmployees.map((p) => p.employee?.id),
  );

  const departmentMap = new Map(departments.map((d) => [d.id, d.name]));
  const positionMap = new Map(positions.map((p) => [p.id, p.name]));

  const availableEmployees = useMemo(() => {
    return allEmployees.filter((e) => {
      if (projectEmployeeIds.has(e.id)) return false;

      if (selectedDeptId && e.department_id !== selectedDeptId) return false;
      if (selectedPosId && e.position_id !== selectedPosId) return false;

      if (
        searchQuery &&
        !e.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [
    allEmployees,
    projectEmployeeIds,
    selectedDeptId,
    selectedPosId,
    searchQuery,
  ]);

  const handleAddEmployee = async (employeeId) => {
    await addEmployeeMutation.mutateAsync({ projectId, employeeId });
    refetchProjectEmployees();
  };

  const handleRemoveEmployee = async (employeeId) => {
    await removeEmployeeMutation.mutateAsync({ projectId, employeeId });
    refetchProjectEmployees();
  };

  const resetFilters = () => {
    setSelectedDeptId(null);
    setSelectedPosId(null);
    setSearchQuery("");
  };

  if (isEditMode && isLoadingProject) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title={isEditMode ? "Редактировать проект" : "Новый проект"}
        />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <ProjectForm
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit(onSubmit)}
          isEditMode={isEditMode}
          serverError={serverError}
        />

        {isEditMode && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>👥 Сотрудники проекта</Text>

              {projectEmployeesLoading ? (
                <ActivityIndicator />
              ) : projectEmployees.length === 0 ? (
                <Text style={styles.infoText}>Сотрудников нет</Text>
              ) : (
                projectEmployees.map((p, idx) => (
                  <List.Item
                    key={`${p.employee?.id}-${idx}`}
                    title={p.employee?.full_name || "—"}
                    description={`Выполнено: ${p.tasks_completed || 0}, Просрочено: ${p.tasks_overdue || 0}`}
                    right={() => (
                      <IconButton
                        icon="delete"
                        onPress={() => handleRemoveEmployee(p.employee?.id)}
                      />
                    )}
                  />
                ))
              )}

              <Button
                mode="contained"
                onPress={() => setEmployeesModalVisible(true)}
                style={{ marginTop: 12 }}
              >
                Добавить сотрудника
              </Button>
            </Card.Content>
          </Card>
        )}

        {!isEditMode && (
          <Text style={styles.infoText}>
            Сначала создайте проект, чтобы добавлять сотрудников.
          </Text>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={employeesModalVisible}
          onDismiss={() => setEmployeesModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.sectionTitle}>Выбор сотрудника</Text>

          <Searchbar
            placeholder="Поиск..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ marginBottom: 8 }}
          />

          <View style={styles.filtersRow}>
            <Menu
              visible={deptMenuVisible}
              onDismiss={() => setDeptMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setDeptMenuVisible(true)}
                  style={styles.filterButton}
                >
                  {selectedDeptId ? departmentMap.get(selectedDeptId) : "Отдел"}
                </Button>
              }
            >
              <Menu.Item
                title="Все отделы"
                onPress={() => {
                  setSelectedDeptId(null);
                  setDeptMenuVisible(false);
                }}
              />
              {departments.map((d) => (
                <Menu.Item
                  key={d.id}
                  title={d.name}
                  onPress={() => {
                    setSelectedDeptId(d.id);
                    setDeptMenuVisible(false);
                  }}
                />
              ))}
            </Menu>

            <Menu
              visible={posMenuVisible}
              onDismiss={() => setPosMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setPosMenuVisible(true)}
                  style={styles.filterButton}
                >
                  {selectedPosId ? positionMap.get(selectedPosId) : "Должность"}
                </Button>
              }
            >
              <Menu.Item
                title="Все должности"
                onPress={() => {
                  setSelectedPosId(null);
                  setPosMenuVisible(false);
                }}
              />
              {positions.map((p) => (
                <Menu.Item
                  key={p.id}
                  title={p.name}
                  onPress={() => {
                    setSelectedPosId(p.id);
                    setPosMenuVisible(false);
                  }}
                />
              ))}
            </Menu>

            <Button mode="text" onPress={resetFilters}>
              Сбросить
            </Button>
          </View>

          <Divider style={{ marginVertical: 8 }} />

          {employeesLoading ? (
            <ActivityIndicator />
          ) : (
            <ScrollView style={{ maxHeight: 300 }}>
              {availableEmployees.map((e) => (
                <List.Item
                  key={e.id}
                  title={e.full_name}
                  description={`${departmentMap.get(e.department_id) || "Без отдела"} • ${
                    positionMap.get(e.position_id) || "Без должности"
                  }`}
                  onPress={() => handleAddEmployee(e.id)}
                />
              ))}
              {availableEmployees.length === 0 && (
                <Text style={styles.infoText}>Нет доступных сотрудников</Text>
              )}
            </ScrollView>
          )}
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1 },
  snackbar: { backgroundColor: "#323232" },
  card: { margin: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  infoText: { color: "#666", marginTop: 8, marginLeft: 16 },
  modalContainer: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  filterButton: {
    marginRight: 4,
  },
});

export default ProjectFormScreen;
