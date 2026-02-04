import React, { useMemo, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import {
  Appbar,
  Searchbar,
  ActivityIndicator,
  Text,
  Switch,
} from "react-native-paper";
import { useEmployeesByDepartment } from "../../hooks/api/useEmployees";
import EmployeeCard from "../../components/common/EmployeeCard";

const DepartmentEmployeesScreen = ({ route, navigation }) => {
  const { departmentId, departmentName } = route.params;

  const [searchQuery, setSearchQuery] = useState("");
  const [includeChildren, setIncludeChildren] = useState(false);

  const {
    data: employees = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useEmployeesByDepartment(departmentId, includeChildren);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter((e) => e.full_name.toLowerCase().includes(q));
  }, [employees, searchQuery]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={navigation.goBack} />
        <Appbar.Content title={departmentName} />
        <Appbar.Action icon="refresh" onPress={refetch} />
      </Appbar.Header>

      <View style={styles.top}>
        <Searchbar
          placeholder="Поиск сотрудников..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Включая подотделы</Text>
          <Switch
            value={includeChildren}
            onValueChange={(v) => setIncludeChildren(v)}
          />
        </View>

        {isFetching && (
          <View style={styles.fetchRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.fetchText}>Обновление…</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text>Загрузка сотрудников…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text>Ошибка загрузки</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <EmployeeCard
              employee={item}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>Сотрудников нет</Text>}
          contentContainerStyle={{ paddingBottom: 110, paddingTop: 6 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  top: { padding: 12 },
  searchbar: { marginBottom: 10 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  switchLabel: { color: "#666" },
  fetchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  fetchText: { color: "#666" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", marginTop: 40, color: "#666" },
});

export default DepartmentEmployeesScreen;
