import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Card } from "react-native-paper";

const DashboardScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            📊 Дашборд
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Мобильное приложение для учета сотрудников
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Быстрый доступ</Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("Positions")}
            style={styles.button}
            icon="account-tie"
          >
            Должности
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
  },
  button: {
    marginTop: 16,
  },
});

export default DashboardScreen;
