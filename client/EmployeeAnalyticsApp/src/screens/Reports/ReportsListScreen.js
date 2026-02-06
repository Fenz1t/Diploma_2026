import React from "react";
import { View, FlatList } from "react-native";
import ReportCard from "../../components/common/ReportCard";

const REPORTS = [
  { type: "employees", title: "Сотрудники" },
  { type: "workload", title: "Загрузка сотрудников" },
  { type: "kpi", title: "KPI" },
  { type: "departments", title: "Отделы" },
  { type: "risks", title: "Риски" },
];

export default function ReportsListScreen({ navigation }) {
  return (
    <View style={{ padding: 16 }}>
      <FlatList
        data={REPORTS}
        keyExtractor={(item) => item.type}
        renderItem={({ item }) => (
          <ReportCard
            title={item.title}
            onPress={() =>
              navigation.navigate("ReportViewer", {
                type: item.type,
                title: item.title,
              })
            }
          />
        )}
      />
    </View>
  );
}
