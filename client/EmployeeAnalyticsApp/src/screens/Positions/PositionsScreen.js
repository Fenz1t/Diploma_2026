import React, { useState } from "react";
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
  Button,
} from "react-native-paper";
import { usePositions, useDeletePosition } from "../../hooks/api/usePositions";
import PositionCard from "../../components/common/PositionCard";

const PositionsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Получаем данные
  const { data: positions = [], isLoading, error, refetch } = usePositions();
  // Мутация для удаления
  const deleteMutation = useDeletePosition();

  // Поиск
  const filteredPositions = positions.filter((position) =>
    position.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Обновление списка
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Удаление должности
  const handleDelete = (id) => {
    Alert.alert(
      "Удаление должности",
      "Вы уверены, что хотите удалить эту должность?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
              setSnackbarMessage("✅ Должность удалена");
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
  const handleEdit = (position) => {
    navigation.navigate("PositionForm", {
      positionId: position.id,
      positionName: position.name,
    });
  };

  const handleViewEmployees = (position) => {
    navigation.navigate("PositionEmployees", {
      positionId: position.id,
      positionName: position.name,
    });
  };

  // Создание новой должности
  const handleCreate = () => {
    navigation.navigate("PositionForm");
  };

  // Загрузка
  if (isLoading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Загрузка должностей...</Text>
      </View>
    );
  }

  // Ошибка
  if (error) {
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
        <Appbar.Content title="Должности" />
        <Appbar.Action icon="refresh" onPress={onRefresh} />
      </Appbar.Header>

      <Searchbar
        placeholder="Поиск должностей..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        iconColor="#666"
      />

      <FlatList
        data={filteredPositions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PositionCard
            position={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewEmployees={handleViewEmployees}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="titleMedium" style={styles.emptyText}>
              {searchQuery ? "Ничего не найдено" : "Должностей нет"}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {searchQuery
                ? "Попробуйте другой запрос"
                : "Создайте первую должность"}
            </Text>
          </View>
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
    margin: 8,
    marginTop: 0,
    elevation: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
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
});

export default PositionsScreen;
