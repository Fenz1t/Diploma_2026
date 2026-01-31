import React from "react";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppNavigator from "./src/navigation/AppNavigator";

// Создаем клиент React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 минут
    },
  },
});

// Тема React Native Paper
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2196F3",
    secondary: "#03A9F4",
    background: "#f8f9fa",
    surface: "#ffffff",
  },
  roundness: 8,
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <AppNavigator />
      </PaperProvider>
    </QueryClientProvider>
  );
}
