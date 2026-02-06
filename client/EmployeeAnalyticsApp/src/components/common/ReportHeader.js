import React from "react";
import { View, Text } from "react-native";

export default function ReportHeader({ title, count }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>{title}</Text>
      <Text style={{ color: "#666" }}>Записей: {count}</Text>
    </View>
  );
}