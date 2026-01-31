import React from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, HelperText, useTheme } from "react-native-paper";
import { Controller } from "react-hook-form";

const PositionForm = ({
  control,
  errors,
  isSubmitting,
  onSubmit,
  isEditMode,
  serverError,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            error={!!errors.name}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
              },
            ]}
            mode="outlined"
            disabled={isSubmitting}
            placeholder="Например: Старший разработчик"
            autoFocus={!isEditMode}
            outlineColor={
              errors.name ? theme.colors.error : theme.colors.outline
            }
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            // Эти свойства исправляют отображение
            theme={{
              colors: {
                primary: theme.colors.primary,
                onSurfaceVariant: theme.colors.onSurfaceVariant,
                outline: errors.name
                  ? theme.colors.error
                  : theme.colors.outline,
              },
              roundness: theme.roundness,
            }}
          />
        )}
      />
      <Button
        mode="contained"
        onPress={onSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
        icon={isEditMode ? "check" : "plus"}
        contentStyle={styles.buttonContent}
        textColor="#fff"
      >
        {isEditMode ? "Сохранить изменения" : "Создать должность"}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 4,
  },
  serverError: {
    marginBottom: 16,
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    marginBottom: 12,
    marginLeft: 4,
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
});

export default PositionForm;
