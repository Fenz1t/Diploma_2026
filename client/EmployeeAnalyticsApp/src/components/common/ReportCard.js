import React from "react";
import { TouchableOpacity, Text } from "react-native";

export default function ReportCard({ title, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 14,
        marginBottom: 12,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "600" }}>{title}</Text>
    </TouchableOpacity>
  );
}
