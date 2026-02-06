import React from "react";
import { View, ActivityIndicator } from "react-native";

export default function LoadingView() {
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
