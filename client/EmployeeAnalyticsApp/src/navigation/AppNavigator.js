import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Экран дашборда
import DashboardScreen from "../screens/Dashboard/DashboardScreen";
// Экран должностей
import PositionsScreen from "../screens/Positions/PositionsScreen";
import PositionFormScreen from "../screens/Positions/PositionFormScreen";
// Проекты
import ProjectsScreen from "../screens/Projects/ProjectsScreen";
import ProjectFormScreen from "../screens/Projects/ProjectFormScreen";
// Сотрудники+Отделы

import DepartmentsTreeScreen from "../screens/Employees/DepartmentsTreeScreen";
import DepartmentEmployeesScreen from "../screens/Employees/DepartmentEmployeesScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Стек для должностей
const PositionsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PositionsList" component={PositionsScreen} />
    <Stack.Screen
      name="PositionForm"
      component={PositionFormScreen}
      options={{
        headerShown: true,
        title: "Должность",
      }}
    />
  </Stack.Navigator>
);
const ProjectsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProjectsList" component={ProjectsScreen} />
    <Stack.Screen
      name="ProjectForm"
      component={ProjectFormScreen}
      options={{
        headerShown: true,
        title: "Проект",
      }}
    />
  </Stack.Navigator>
);
const EmployeesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DepartmentsTree" component={DepartmentsTreeScreen} />
    <Stack.Screen
      name="DepartmentEmployees"
      component={DepartmentEmployeesScreen}
    />
  </Stack.Navigator>
);

// Таб навигатор
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#2196F3",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 100,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: "Дашборд",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Employees"
        component={EmployeesStack}
        options={{
          tabBarLabel: "Сотрудники",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-group"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Positions"
        component={PositionsStack}
        options={{
          tabBarLabel: "Должности",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-tie"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsStack}
        options={{
          tabBarLabel: "Проекты",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="folder-multiple"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Главный навигатор
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
