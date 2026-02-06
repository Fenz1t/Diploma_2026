import React from "react";
import { StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";

const PositionEmployeeCard = ({ employee }) => {
  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <Text variant="titleMedium">{employee.full_name}</Text>
        <Text>{employee.email}</Text>
        <Text>{employee.department?.name}</Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
});

export default PositionEmployeeCard;
