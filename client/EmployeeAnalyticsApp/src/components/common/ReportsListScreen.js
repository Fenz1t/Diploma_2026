import React from "react";
import { View, FlatList } from "react-native";
import ReportCard from "../../components/ReportCard";

const REPORTS = [
  { id: "employees", title: "Сотрудники" },
  { id: "workload", title: "Загрузка" },
  { id: "kpi", title: "KPI" },
  { id: "departments", title: "Отделы" },
  { id: "risks", title: "Риски" },
];

export default function ReportsListScreen({ navigation }) {
  return (
    <View style={{ padding: 16 }}>
      <FlatList
        data={REPORTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReportCard
            title={item.title}
            onPress={() =>
              navigation.navigate("ReportViewer", {
                type: item.id,
                title: item.title,
              })
            }
          />
        )}
      />
    </View>
  );
}
