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
import {
  useProjects,
  useDeleteProject,
  useProjectStatistics,
} from "../../hooks/api/useProjects";
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

  // Дебаунс для поиска (задержка 300мс)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const debouncedSetSearch = useCallback(
    debounce((query) => {
      setDebouncedSearchQuery(query);
    }, 300),
    [],
  );

  // Обработчик изменения поиска
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    debouncedSetSearch(query);
  };

  // Получаем данные
  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useProjects();

  // Получаем статистику
  const { data: statistics } = useProjectStatistics();

  // Мутация для удаления
  const deleteMutation = useDeleteProject();

  // Сохраняем предыдущие данные
  useEffect(() => {
    if (apiResponse?.data?.projects) {
      setPreviousData(apiResponse.data.projects);
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    }
  }, [apiResponse, isFirstLoad]);

  // Используем либо текущие данные, либо предыдущие
  const displayData =
    isLoading && !previousData
      ? []
      : apiResponse?.data?.projects || previousData || [];

  // Локальный поиск и фильтрация по статусу
  const filteredProjects = displayData.filter((project) => {
    // Фильтр по поиску
    const matchesSearch = project.name
      .toLowerCase()
      .includes(debouncedSearchQuery.toLowerCase());

    // Фильтр по статусу
    const matchesStatus = !statusFilter || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Извлекаем пагинацию
  const pagination = apiResponse?.data?.pagination;

  // Обновление списка
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Удаление проекта
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

  // Редактирование
  const handleEdit = (project) => {
    navigation.navigate("ProjectForm", {
      projectId: project.id,
      projectName: project.name,
    });
  };

  // Просмотр деталей
  const handleViewDetails = (project) => {
    navigation.navigate("ProjectDetails", { projectId: project.id });
  };

  // Создание нового проекта
  const handleCreate = () => {
    navigation.navigate("ProjectForm");
  };

  // Очистка фильтра
  const clearFilter = () => {
    setStatusFilter("");
    setFilterMenuVisible(false);
  };

  // Статистика проектов
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

  // Первая загрузка
  if (isFirstLoad && isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Загрузка проектов...</Text>
      </View>
    );
  }

  // Ошибка
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

      {/* Индикатор загрузки при обновлении */}
      {isFetching && !isFirstLoad && (
        <View style={styles.fetchingIndicator}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.fetchingText}>Обновление...</Text>
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
