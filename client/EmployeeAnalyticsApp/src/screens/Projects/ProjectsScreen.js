import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Appbar,
  Searchbar,
  FAB,
  ActivityIndicator,
  Text,
  Snackbar,
  Chip,
  Menu,
  Divider,
  Button,
} from "react-native-paper";
import * as DocumentPicker from "expo-document-picker";
import {
  useProjects,
  useDeleteProject,
  useProjectStatistics,
} from "../../hooks/api/useProjects";
import {
  useImportKanban,
  useValidateKanbanImport,
} from "../../hooks/api/useImport";
import ProjectCard from "../../components/common/ProjectCard";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from "../../utils/constants/projectStatus";

const ProjectsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [previousData, setPreviousData] = useState(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const importMutation = useImportKanban();
  const validateMutation = useValidateKanbanImport();

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const debouncedSetSearch = useCallback(
    debounce((query) => {
      setDebouncedSearchQuery(query);
    }, 300),
    [],
  );

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    debouncedSetSearch(query);
  };

  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useProjects();

  const { data: statistics } = useProjectStatistics();
  const deleteMutation = useDeleteProject();

  useEffect(() => {
    if (apiResponse?.data?.projects) {
      setPreviousData(apiResponse.data.projects);
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    }
  }, [apiResponse, isFirstLoad]);

  const displayData =
    isLoading && !previousData
      ? []
      : apiResponse?.data?.projects || previousData || [];

  const filteredProjects = displayData.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(debouncedSearchQuery.toLowerCase());

    const matchesStatus = !statusFilter || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Удаление проекта",
      "Вы уверены, что хотите удалить этот проект? Все связанные данные будут удалены.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
              setSnackbarMessage("✅ Проект удален");
              setSnackbarVisible(true);
            } catch (error) {
              setSnackbarMessage("❌ Ошибка при удалении");
              setSnackbarVisible(true);
            }
          },
        },
      ],
    );
  };

  const handleEdit = (project) => {
    navigation.navigate("ProjectForm", {
      projectId: project.id,
      projectName: project.name,
    });
  };

  const handleViewDetails = (project) => {
    navigation.navigate("ProjectDetailsScreen", { projectId: project.id });
  };

  const handleCreate = () => {
    navigation.navigate("ProjectForm");
  };

  const clearFilter = () => {
    setStatusFilter("");
    setFilterMenuVisible(false);
  };

  const handleImportPress = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
          "application/json",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (picked.canceled) {
        return;
      }

      const fileAsset = picked.assets?.[0];
      if (!fileAsset) {
        setSnackbarMessage("❌ Файл не выбран");
        setSnackbarVisible(true);
        return;
      }

      // Проверка файла перед импортом
      await validateMutation.mutateAsync(fileAsset);

      // Импорт
      const result = await importMutation.mutateAsync(fileAsset);

      const importedCount =
        result?.data?.data?.workload_entries?.created ||
        result?.data?.workload_entries?.created ||
        0;

      setSnackbarMessage(
        `✅ Импорт завершен${importedCount ? `, добавлено: ${importedCount}` : ""}`,
      );
      setSnackbarVisible(true);

      await refetch();
    } catch (e) {
      setSnackbarMessage(`❌ Ошибка импорта: ${e?.message || "неизвестно"}`);
      setSnackbarVisible(true);
    }
  };

  const renderStatistics = () => {
    if (!statistics?.data) return null;

    return (
      <View style={styles.statistics}>
        <Text variant="titleSmall" style={styles.statisticsTitle}>
          📊 Статистика проектов
        </Text>
        <View style={styles.statsRow}>
          <Chip style={styles.statChip} mode="outlined">
            Всего: {statistics.data.total || 0}
          </Chip>
          {Object.entries(statistics.data.byStatus || {}).map(
            ([status, count]) => (
              <Chip
                key={status}
                style={[
                  styles.statChip,
                  { borderColor: PROJECT_STATUS_COLORS[status] },
                ]}
                textStyle={{ color: PROJECT_STATUS_COLORS[status] }}
                mode="outlined"
              >
                {PROJECT_STATUS_LABELS[status]}: {count}
              </Chip>
            ),
          )}
        </View>
      </View>
    );
  };

  if (isFirstLoad && isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Загрузка проектов...</Text>
      </View>
    );
  }

  if (error && !previousData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Ошибка загрузки</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
        <Button
          mode="contained"
          onPress={refetch}
          style={styles.retryButton}
          icon="refresh"
        >
          Повторить
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Проекты" />
        <Appbar.Action icon="database-import" color="#09ff00" onPress={handleImportPress} />
        <Appbar.Action icon="refresh" onPress={onRefresh} />

        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="filter"
              onPress={() => setFilterMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            leadingIcon="filter-off"
            onPress={clearFilter}
            title="Без фильтра"
          />
          <Divider />
          {Object.values(PROJECT_STATUSES).map((status) => (
            <Menu.Item
              key={status}
              leadingIcon="circle"
              onPress={() => {
                setStatusFilter(status);
                setFilterMenuVisible(false);
              }}
              title={PROJECT_STATUS_LABELS[status]}
            />
          ))}
        </Menu>
      </Appbar.Header>

      {statusFilter && (
        <View style={styles.filterChipContainer}>
          <Chip icon="close" onPress={clearFilter} style={styles.filterChip}>
            {PROJECT_STATUS_LABELS[statusFilter]}
          </Chip>
        </View>
      )}

      <Searchbar
        placeholder="Поиск проектов..."
        onChangeText={handleSearchChange}
        value={searchQuery}
        style={styles.searchbar}
      />

      {(isFetching ||
        importMutation.isPending ||
        validateMutation.isPending) && (
        <View style={styles.fetchingIndicator}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.fetchingText}>
            {importMutation.isPending || validateMutation.isPending
              ? "Импорт данных..."
              : "Обновление..."}
          </Text>
        </View>
      )}

      {renderStatistics()}

      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="titleMedium" style={styles.emptyText}>
              {debouncedSearchQuery || statusFilter
                ? "Проекты не найдены"
                : "Проектов нет"}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {debouncedSearchQuery || statusFilter
                ? "Попробуйте изменить запрос"
                : "Создайте первый проект"}
            </Text>
          </View>
        }
        ListFooterComponent={
          isFetching && filteredProjects.length > 0 ? (
            <ActivityIndicator style={styles.footerLoader} color="#2196F3" />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2196F3"]}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreate}
        label="Добавить"
        color="#fff"
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3500}
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
    backgroundColor: "#f8f9fa",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  searchbar: {
    margin: 12,
    marginTop: 8,
    elevation: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterChipContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  filterChip: {
    alignSelf: "flex-start",
  },
  statistics: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statisticsTitle: {
    marginBottom: 8,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#999",
    textAlign: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 18,
    marginBottom: 8,
  },
  errorSubtext: {
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 10,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#2196F3",
  },
  snackbar: {
    backgroundColor: "#323232",
  },
  fetchingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#e3f2fd",
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  fetchingText: {
    marginLeft: 8,
    color: "#2196F3",
    fontSize: 14,
  },
  footerLoader: {
    paddingVertical: 20,
  },
});

export default ProjectsScreen;
