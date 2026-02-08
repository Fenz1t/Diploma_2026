import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Card, Text, Avatar, IconButton, Menu } from "react-native-paper";
import { API_BASE_URL } from "../../services/api/client";

const EmployeeCard = ({ employee, onEdit, onDelete, onPress }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const hasPhoto = !!employee?.photo_url;
  const baseUrl = API_BASE_URL.replace(/\/api$/, "");
  const photoUrl = hasPhoto ? `${baseUrl}${employee.photo_url}` : null;

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.content}>
        {hasPhoto ? (
          <Avatar.Image size={40} source={{ uri: photoUrl }} />
        ) : (
          <Avatar.Icon size={40} icon="account" />
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{employee.full_name}</Text>
          <Text style={styles.position}>
            {employee.position?.name || "Без должности"}
          </Text>
        </View>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              onEdit?.(employee);
            }}
            title="Редактировать"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              onDelete?.(employee);
            }}
            title="Удалить"
          />
        </Menu>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginVertical: 6 },
  content: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1, marginLeft: 12 },
  name: { fontWeight: "700", fontSize: 16 },
  position: { color: "#666", fontSize: 13 },
});

export default EmployeeCard;
