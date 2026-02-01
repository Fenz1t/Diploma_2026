import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Card, Text, IconButton, Chip } from "react-native-paper";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from "../../utils/constants/projectStatus";

const ProjectCard = ({ project, onEdit, onDelete, onViewDetails }) => {
  const showMenu = () => {
    Alert.alert(
      project.name,
      "Выберите действие",
      [
        {
          text: "Редактировать",
          onPress: () => onEdit(project),
          style: "default",
        },
        {
          text: "Детали",
          onPress: () => onViewDetails(project),
          style: "default",
        },
        {
          text: "Удалить",
          onPress: () => onDelete(project.id),
          style: "destructive",
        },
        {
          text: "Отмена",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return "Не указано";
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            {project.name}
          </Text>
          <IconButton icon="dots-vertical" size={20} onPress={showMenu} />
        </View>

        <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
          {project.description || "Описание отсутствует"}
        </Text>

        <View style={styles.dates}>
          <Text variant="bodySmall" style={styles.date}>
            📅 Начало: {formatDate(project.start_date)}
          </Text>
          <Text variant="bodySmall" style={styles.date}>
            🎯 Завершение: {formatDate(project.end_date)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Chip
            mode="outlined"
            style={[
              styles.statusChip,
              { borderColor: PROJECT_STATUS_COLORS[project.status] },
            ]}
            textStyle={{ color: PROJECT_STATUS_COLORS[project.status] }}
          >
            {PROJECT_STATUS_LABELS[project.status] || project.status}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  content: {
    paddingVertical: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  description: {
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  dates: {
    marginBottom: 12,
  },
  date: {
    color: "#888",
    fontSize: 13,
    marginBottom: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusChip: {
  },
});

export default ProjectCard;
