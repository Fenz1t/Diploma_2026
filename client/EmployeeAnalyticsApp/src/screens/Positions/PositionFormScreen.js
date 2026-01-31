// src/screens/Positions/PositionFormScreen.js
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Appbar,
  ActivityIndicator,
  Snackbar,
  HelperText,
} from "react-native-paper";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  useCreatePosition,
  useUpdatePosition,
  usePosition,
} from "../../hooks/api/usePositions";
import PositionForm from "../../components/forms/PositionForm";

const positionSchema = yup.object({
  name: yup
    .string()
    .required("Название обязательно")
    .min(2, "Минимум 2 символа")
    .max(100, "Максимум 100 символов"),
});

const PositionFormScreen = ({ navigation, route }) => {
  const { positionId, positionName } = route.params || {};
  const isEditMode = !!positionId;

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const { data: currentPosition, isLoading: isLoadingPosition } = usePosition(
    positionId,
    { enabled: isEditMode },
  );

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(positionSchema),
    defaultValues: {
      name: positionName || "",
    },
  });

  useEffect(() => {
    if (currentPosition) {
      reset({ name: currentPosition.name });
    }
  }, [currentPosition, reset]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setServerError("");
      clearErrors();

      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: positionId,
          data,
        });
        setSnackbarMessage("✅ Должность обновлена");
      } else {
        await createMutation.mutateAsync(data);
        setSnackbarMessage("✅ Должность создана");
      }

      setSnackbarVisible(true);

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.log("Form error details:", error);

      // Обработка ошибок от сервера
      if (
        error.message.includes("уже существует") ||
        error.data?.error?.includes("уже существует")
      ) {
        setServerError("Должность с таким названием уже существует");
        setError("name", {
          type: "manual",
          message: "Должность с таким названием уже существует",
        });
      } else if (error.isNetworkError) {
        setServerError("Нет подключения к интернету");
      } else {
        // Общая ошибка от сервера
        const errorMessage = error.message || "Неизвестная ошибка";
        setServerError(errorMessage);
      }

      setSnackbarMessage(`❌ ${serverError}`);
      setSnackbarVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && isLoadingPosition) {
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
          title={isEditMode ? "Редактировать" : "Новая должность"}
        />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {serverError ? (
          <HelperText type="error" visible={true} style={styles.serverError}>
            {serverError}
          </HelperText>
        ) : null}

        <PositionForm
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit(onSubmit)}
          isEditMode={isEditMode}
        />
      </ScrollView>
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
  serverError: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
  },
  snackbar: {
    backgroundColor: "#323232",
  },
});

export default PositionFormScreen;
