import React, { useMemo, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Portal,
  Dialog,
  Button,
  TextInput,
  Text,
  Menu,
} from "react-native-paper";
import { useDepartmentsSelect } from "../../hooks/api/useDepartments";

const DepartmentFormDialog = ({
  visible,
  onDismiss,
  onSubmit,
  initial = null,
}) => {
  const { data: deptSelect = [] } = useDepartmentsSelect();

  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const [errors, setErrors] = useState({
    name: false,
    parentId: false,
  });

  useEffect(() => {
    if (!visible) return;

    setName(initial?.name || "");
    setParentId(
      initial?.parent_id === null || initial?.parent_id === undefined
        ? null
        : initial?.parent_id,
    );

    setErrors({ name: false, parentId: false });
  }, [visible, initial]);

  const parentLabel = useMemo(() => {
    if (parentId === null) return "Выберите родителя";
    const found = deptSelect.find((d) => d.id === parentId);
    return found ? found.name : `ID ${parentId}`;
  }, [parentId, deptSelect]);

  const filteredParentOptions = useMemo(() => {
    if (!initial?.id) return deptSelect;
    return deptSelect.filter((d) => d.id !== initial.id);
  }, [deptSelect, initial]);

  const handleSave = () => {
    const trimmed = name.trim();

    const newErrors = {
      name: !trimmed,
      parentId: parentId === null,
    };

    setErrors(newErrors);

    if (newErrors.name || newErrors.parentId) return;

    onSubmit({
      name: trimmed,
      parent_id: parentId,
    });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>
          {initial ? "Редактировать отдел" : "Новый отдел"}
        </Dialog.Title>

        <Dialog.Content>
          {/* NAME */}
          <TextInput
            label="Название *"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors((e) => ({ ...e, name: false }));
              }
            }}
            error={errors.name}
            style={styles.input}
          />
          {errors.name && (
            <Text style={styles.errorText}>Введите название отдела</Text>
          )}

          {/* PARENT */}
          <View style={styles.parentRow}>
            <Text style={styles.parentLabel}>Родитель *</Text>

            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(true)}
                  style={[
                    styles.parentButton,
                    errors.parentId && styles.errorBorder,
                  ]}
                  textColor={errors.parentId ? "#B00020" : undefined}
                >
                  {parentLabel}
                </Button>
              }
            >
              {filteredParentOptions.map((d) => (
                <Menu.Item
                  key={d.id}
                  onPress={() => {
                    setParentId(d.id);
                    setErrors((e) => ({ ...e, parentId: false }));
                    setMenuVisible(false);
                  }}
                  title={d.name}
                />
              ))}
            </Menu>

            {errors.parentId && (
              <Text style={styles.errorText}>Выберите родительский отдел</Text>
            )}
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>Отмена</Button>
          <Button mode="contained" onPress={handleSave}>
            Сохранить
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  input: { marginBottom: 4 },
  parentRow: { gap: 6, marginTop: 12 },
  parentLabel: { color: "#666" },

  errorText: {
    color: "#B00020",
    fontSize: 12,
    marginBottom: 4,
  },

  parentButton: {
    borderWidth: 1,
  },

  errorBorder: {
    borderColor: "#B00020",
  },
});

export default DepartmentFormDialog;
