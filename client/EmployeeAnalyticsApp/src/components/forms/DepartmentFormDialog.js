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

  // ✅ ВАЖНО: когда открываем диалог с другим initial — обновляем state
  useEffect(() => {
    if (!visible) return;

    setName(initial?.name || "");
    setParentId(
      initial?.parent_id === null || initial?.parent_id === undefined
        ? null
        : initial?.parent_id,
    );
  }, [visible, initial]);

  const parentLabel = useMemo(() => {
    if (parentId === null) return "Без родителя";
    const found = deptSelect.find((d) => d.id === parentId);
    return found ? found.name : `ID ${parentId}`;
  }, [parentId, deptSelect]);

  const filteredParentOptions = useMemo(() => {
    // ✅ Нельзя выбрать самого себя как родителя
    if (!initial?.id) return deptSelect;
    return deptSelect.filter((d) => d.id !== initial.id);
  }, [deptSelect, initial]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

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
          <TextInput
            label="Название"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <View style={styles.parentRow}>
            <Text style={styles.parentLabel}>Родитель:</Text>

            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button mode="outlined" onPress={() => setMenuVisible(true)}>
                  {parentLabel}
                </Button>
              }
            >
              <Menu.Item
                onPress={() => {
                  setParentId(null);
                  setMenuVisible(false);
                }}
                title="Без родителя"
              />
              {filteredParentOptions.map((d) => (
                <Menu.Item
                  key={d.id}
                  onPress={() => {
                    setParentId(d.id);
                    setMenuVisible(false);
                  }}
                  title={d.name}
                />
              ))}
            </Menu>
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
  input: { marginBottom: 12 },
  parentRow: { gap: 8 },
  parentLabel: { marginBottom: 6, color: "#666" },
});

export default DepartmentFormDialog;
