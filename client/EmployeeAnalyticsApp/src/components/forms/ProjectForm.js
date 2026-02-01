import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  TextInput,
  Button,
  HelperText,
  useTheme,
  SegmentedButtons,
  RadioButton,
  Text,
} from "react-native-paper";
import { Controller } from "react-hook-form";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
} from "../../utils/constants/projectStatus";
import DateTimePicker from "@react-native-community/datetimepicker";

const ProjectForm = ({
  control,
  errors,
  isSubmitting,
  onSubmit,
  isEditMode,
  serverError,
}) => {
  const theme = useTheme();
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const errorMessage =
    serverError ||
    errors.name?.message ||
    errors.status?.message ||
    errors.start_date?.message ||
    errors.end_date?.message;

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {serverError && (
          <HelperText type="error" visible={true} style={styles.serverError}>
            {serverError}
          </HelperText>
        )}

        {/* Название проекта */}
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <>
              <TextInput
                label="Название проекта"
                value={value}
                onChangeText={onChange}
                error={!!errors.name}
                style={[styles.input, styles.textArea]}
                mode="flat"
                disabled={isSubmitting}
                placeholder="Например: Разработка..."
                autoFocus={!isEditMode}
              />
              {errors.name && (
                <HelperText type="error" visible={true}>
                  {errors.name.message}
                </HelperText>
              )}
            </>
          )}
        />

        {/* Описание */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Описание проекта"
              value={value || ""}
              onChangeText={onChange}
              error={!!errors.description}
              style={[styles.input, styles.textArea]}
              mode="flat"
              disabled={isSubmitting}
              placeholder="Детальное описание проекта..."
              multiline
              numberOfLines={4}
            />
          )}
        />

        {/* Статус проекта */}
        <Text variant="bodyMedium" style={styles.label}>
          Статус проекта:
        </Text>
        <Controller
          control={control}
          name="status"
          render={({ field: { onChange, value } }) => (
            <View style={styles.radioGroup}>
              <RadioButton.Group
                onValueChange={onChange}
                value={value || PROJECT_STATUSES.PLANNED}
              >
                <View style={styles.radioItem}>
                  <RadioButton value={PROJECT_STATUSES.PLANNED} />
                  <Text>{PROJECT_STATUS_LABELS[PROJECT_STATUSES.PLANNED]}</Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value={PROJECT_STATUSES.IN_PROGRESS} />
                  <Text>
                    {PROJECT_STATUS_LABELS[PROJECT_STATUSES.IN_PROGRESS]}
                  </Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value={PROJECT_STATUSES.COMPLETED} />
                  <Text>
                    {PROJECT_STATUS_LABELS[PROJECT_STATUSES.COMPLETED]}
                  </Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value={PROJECT_STATUSES.CANCELLED} />
                  <Text>
                    {PROJECT_STATUS_LABELS[PROJECT_STATUSES.CANCELLED]}
                  </Text>
                </View>
              </RadioButton.Group>
            </View>
          )}
        />

        {/* Дата начала */}
        <Controller
          control={control}
          name="start_date"
          render={({ field: { onChange, value } }) => (
            <>
              <Text variant="bodyMedium" style={styles.label}>
                Дата начала:
              </Text>
              <TextInput
                value={value ? new Date(value).toLocaleDateString("ru-RU") : ""}
                onFocus={() => setShowStartDatePicker(true)}
                style={styles.input}
                mode="outlined"
                disabled={isSubmitting}
                placeholder="Выберите дату начала"
                right={
                  <TextInput.Icon
                    icon="calendar"
                    onPress={() => setShowStartDatePicker(true)}
                  />
                }
              />
              {showStartDatePicker && (
                <DateTimePicker
                  value={value ? new Date(value) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowStartDatePicker(false);
                    if (selectedDate) {
                      onChange(selectedDate.toISOString());
                    }
                  }}
                />
              )}
            </>
          )}
        />

        {/* Дата завершения */}
        <Controller
          control={control}
          name="end_date"
          render={({ field: { onChange, value } }) => (
            <>
              <Text variant="bodyMedium" style={styles.label}>
                Дата завершения:
              </Text>
              <TextInput
                value={value ? new Date(value).toLocaleDateString("ru-RU") : ""}
                onFocus={() => setShowEndDatePicker(true)}
                style={styles.input}
                mode="outlined"
                disabled={isSubmitting}
                placeholder="Выберите дату завершения"
                right={
                  <TextInput.Icon
                    icon="calendar"
                    onPress={() => setShowEndDatePicker(true)}
                  />
                }
              />
              {showEndDatePicker && (
                <DateTimePicker
                  value={value ? new Date(value) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEndDatePicker(false);
                    if (selectedDate) {
                      onChange(selectedDate.toISOString());
                    }
                  }}
                />
              )}
            </>
          )}
        />

        {/* Общая ошибка */}
        {errorMessage && !serverError && (
          <HelperText type="error" visible={true} style={styles.errorText}>
            {errorMessage}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={onSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.submitButton}
          icon={isEditMode ? "check" : "plus"}
          contentStyle={styles.buttonContent}
        >
          {isEditMode ? "Сохранить изменения" : "Создать проект"}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  label: {
    marginBottom: 8,
    marginTop: 16,
    color: "#666",
    fontWeight: "500",
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  serverError: {
    marginBottom: 16,
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 8,
    backgroundColor: "#2196F3",
  },
  buttonContent: {
    height: 48,
  },
});

export default ProjectForm;
