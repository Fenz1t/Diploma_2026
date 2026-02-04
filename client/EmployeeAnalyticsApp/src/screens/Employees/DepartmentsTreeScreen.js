import React, { useMemo, useState } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { Appbar } from "react-native-paper";

import {
  useDepartmentsHierarchy,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "../../hooks/api/useDepartments";

import DepartmentTreeNode from "../../components/common/DepartmentTreeNode";
import DepartmentFormDialog from "../../components/forms/DepartmentFormDialog";

const DepartmentsTreeScreen = ({ navigation }) => {
  const { data: tree = [], refetch, isFetching } = useDepartmentsHierarchy();

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const [expandedIds, setExpandedIds] = useState(new Set());

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  // ✅ Показываем только корни (parent_id === null) — у тебя это "Руководство"
  const roots = useMemo(() => tree.filter((d) => d.parent_id === null), [tree]);

  const toggle = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openEmployees = (dept) => {
    navigation.navigate("DepartmentEmployees", {
      departmentId: dept.id,
      departmentName: dept.name,
    });
  };

  // ✅ ВОТ ТУТ ВМЕСТО БАГНУТОГО MENU — ALERT
  const openMenu = (dept) => {
    Alert.alert(
      dept.name,
      "Выберите действие",
      [
        {
          text: "Редактировать",
          onPress: () => {
            setEditingDept(dept);
            setDialogVisible(true);
          },
        },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Удаление отдела",
              `Удалить "${dept.name}"?`,
              [
                { text: "Отмена", style: "cancel" },
                {
                  text: "Удалить",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await deleteMutation.mutateAsync(dept.id);
                      refetch?.();
                    } catch (e) {
                      Alert.alert(
                        "Ошибка",
                        e?.message || "Не удалось удалить отдел",
                      );
                    }
                  },
                },
              ],
              { cancelable: true },
            );
          },
        },
        { text: "Отмена", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const renderNode = (dept, depth = 0) => {
    const expanded = expandedIds.has(dept.id);

    return (
      <View key={dept.id}>
        <DepartmentTreeNode
          dept={dept}
          depth={depth}
          expanded={expanded}
          onToggle={toggle}
          onOpenEmployees={openEmployees}
          onOpenMenu={openMenu}
        />

        {expanded &&
          dept.children?.map((child) => renderNode(child, depth + 1))}
      </View>
    );
  };

  const handleCreate = () => {
    setEditingDept(null);
    setDialogVisible(true);
  };

  const handleSubmit = async (payload) => {
    try {
      if (editingDept) {
        // ⚠️ Тут ВАЖНО: у тебя в хуке может ожидаться payload или data
        // Если у тебя было { id, payload } — оставляем так:
        await updateMutation.mutateAsync({ id: editingDept.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      setDialogVisible(false);
      setEditingDept(null);
      refetch?.();
    } catch (e) {
      Alert.alert("Ошибка", e?.message || "Не удалось сохранить отдел");
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Отделы" />
        <Appbar.Action icon="refresh" onPress={() => refetch?.()} />
        <Appbar.Action icon="plus" onPress={handleCreate} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.list}>
        {roots.map((r) => renderNode(r, 0))}
      </ScrollView>

      <DepartmentFormDialog
        visible={dialogVisible}
        onDismiss={() => {
          setDialogVisible(false);
          setEditingDept(null);
        }}
        onSubmit={handleSubmit}
        initial={editingDept}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  list: { paddingBottom: 120, paddingTop: 8 },
});

export default DepartmentsTreeScreen;
