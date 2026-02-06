import React from "react";
import { Modal, View, StyleSheet } from "react-native";
import { Button, Text, Card, useTheme } from "react-native-paper";

export default function ExportModal({ visible, onClose, onSelect }) {
  const theme = useTheme();

  const handleExcel = () => {
    console.log("Excel pressed");
    onSelect("excel");
  };

  const handlePDF = () => {
    console.log("PDF pressed");
    onSelect("pdf");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Card style={styles.card} elevation={5}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.title}>
              Экспорт отчета
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Выберите формат экспорта
            </Text>

            <View style={styles.buttonsContainer}>
              <Button
                mode="contained"
                onPress={handleExcel}
                style={[styles.button, styles.excelButton]}
                icon="microsoft-excel"
                contentStyle={styles.buttonContent}
              >
                Excel
              </Button>

              <Button
                mode="contained"
                onPress={handlePDF}
                style={[styles.button, styles.pdfButton]}
                icon="file-pdf-box"
                contentStyle={styles.buttonContent}
              >
                PDF
              </Button>

              <Button
                mode="outlined"
                onPress={onClose}
                style={styles.cancelButton}
                contentStyle={styles.buttonContent}
              >
                Отмена
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 8,
  },
  title: {
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
  excelButton: {
    backgroundColor: "#217346",
  },
  pdfButton: {
    backgroundColor: "#F40F02",
  },
  cancelButton: {
    borderColor: "#999",
  },
});
