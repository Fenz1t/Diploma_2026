import React from "react";
import { View, StyleSheet } from "react-native";
import { IconButton, Text } from "react-native-paper";

const DepartmentTreeNode = ({
  dept,
  depth,
  expanded,
  onToggle,
  onOpenEmployees,
  onOpenMenu,
}) => {
  const hasChildren = !!dept.children?.length;

  return (
    <View style={[styles.row, { paddingLeft: 12 + depth * 16 }]}>
      {/* "линия дерева" */}
      <View style={styles.line} />

      <IconButton
        icon={
          hasChildren
            ? expanded
              ? "chevron-down"
              : "chevron-right"
            : "circle-small"
        }
        size={22}
        onPress={() => hasChildren && onToggle(dept.id)}
        disabled={!hasChildren}
      />

      <Text style={styles.name} numberOfLines={1}>
        {dept.name}
      </Text>

      {/* Кнопка перейти к сотрудникам отдела */}
      <IconButton
        icon="account-group"
        size={20}
        onPress={() => onOpenEmployees(dept)}
      />

      {/* ⋮ меню */}
      <IconButton
        icon="dots-vertical"
        size={20}
        onPress={() => onOpenMenu(dept)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  line: {
    position: "absolute",
    left: 18,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#f0f0f0",
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
});

export default DepartmentTreeNode;
