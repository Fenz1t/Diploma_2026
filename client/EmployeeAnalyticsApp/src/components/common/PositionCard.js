import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, IconButton, Menu } from "react-native-paper";
const PositionCard = ({ position, onEdit, onDelete, onViewEmployees }) => {
  const [menuVisible, setMenuVisible] = React.useState(false);

  // Принудительно пересоздаем меню каждый раз
  const menuKey = `menu-${position.id}-${menuVisible}`;

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content style={styles.content}>
        <View style={styles.info}>
          <Text variant="titleMedium" style={styles.title}>
            {position.name}
          </Text>
        </View>

        <Menu
          key={menuKey} // Уникальный ключ принуждает к пересозданию
          visible={menuVisible}
          onDismiss={() => {
            setMenuVisible(false);
            // Небольшая задержка перед возможным повторным открытием
            setTimeout(() => {}, 100);
          }}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={() => {
                // Закрываем все другие меню перед открытием нового
                setMenuVisible(true);
              }}
            />
          }
          style={styles.menu}
          contentStyle={styles.menuContent}
        >
          <Menu.Item
            leadingIcon="pencil"
            onPress={() => {
              setMenuVisible(false);
              setTimeout(() => onEdit(position), 150);
            }}
            title="Редактировать"
          />
          <Menu.Item
            leadingIcon="account-group"
            onPress={() => {
              setMenuVisible(false);
              setTimeout(() => onViewEmployees(position), 150);
            }}
            title="Сотрудники"
          />
          <Menu.Item
            leadingIcon="delete"
            onPress={() => {
              setMenuVisible(false);
              setTimeout(() => onDelete(position.id), 150);
            }}
            title="Удалить"
            titleStyle={{ color: "#d32f2f" }}
          />
        </Menu>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    position: "relative",
  },
  info: {
    flex: 1,
  },
  title: {
    fontWeight: "600",
  },
  id: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  menu: {
    marginTop: 8,
  },
  menuContent: {
    borderRadius: 8,
  },
});

export default PositionCard;
