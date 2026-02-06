import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Appbar, ActivityIndicator, Text } from "react-native-paper";
import { usePositionEmployees } from "../../hooks/api/usePositions";
import PositionEmployeeCard from "../../components/common/PositionEmployeeCard";

const PositionEmployeesScreen = ({ route, navigation }) => {
  const { positionId, positionName } = route.params;

  const { data, isLoading, error } = usePositionEmployees(positionId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Загрузка...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Ошибка загрузки</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={positionName} />
      </Appbar.Header>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PositionEmployeeCard employee={item} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>Сотрудников нет</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PositionEmployeesScreen;
