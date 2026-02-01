import React, { useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Appbar, ActivityIndicator, Snackbar } from "react-native-paper";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { projectSchema } from "../../utils/validators/projectSchema";
import {
  useCreateProject,
  useUpdateProject,
  useProject,
} from "../../hooks/api/useProjects";
import { PROJECT_STATUSES } from "../../utils/constants/projectStatus";
import ProjectForm from "../../components/forms/ProjectForm";

const ProjectFormScreen = ({ navigation, route }) => {
  const { projectId, projectName } = route.params || {};
  const isEditMode = !!projectId;

  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [serverError, setServerError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // React Query мутации
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  // Если редактируем - получаем актуальные данные
  const { data: currentProject, isLoading: isLoadingProject } = useProject(
    projectId,
    { enabled: isEditMode },
  );

  // React Hook Form
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

  // Обновляем форму при получении данных
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

  // Обработчик отправки формы
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setServerError("");
      clearErrors();

      console.log("Raw form data:", data);

      // Форматируем даты для API в формате YYYY-MM-DD
      const formatDateForBackend = (dateValue) => {
        if (!dateValue) return null;

        const date = new Date(dateValue);
        // Преобразуем в YYYY-MM-DD
        return date.toISOString().split("T")[0];
      };

      const formattedData = {
        name: data.name.trim(),
        description: (data.description || "").trim(),
        status: data.status || PROJECT_STATUSES.PLANNED,
        // Отправляем даты в формате YYYY-MM-DD
        start_date: data.start_date
          ? formatDateForBackend(data.start_date)
          : null,
        end_date: data.end_date ? formatDateForBackend(data.end_date) : null,
      };

      console.log("Formatted data for API:", formattedData);

      // Отправляем данные
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

      // Через секунду возвращаемся назад
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.log("Form submission error:", error);
      console.log("Error response:", error.response?.data);

      // Обработка ошибок...
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
        // Обработка ошибок валидации от express-validator
        const validationErrors = error.response.data.errors;
        errorMessage = validationErrors.map((err) => err.msg).join(", ");
        setServerError(errorMessage);

        // Устанавливаем ошибки в соответствующие поля формы
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
  // Загрузка данных для редактирования
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
      </ScrollView>

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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  snackbar: {
    backgroundColor: "#323232",
  },
});

export default ProjectFormScreen;
