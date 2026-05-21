import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, Image } from "react-native";
import {
  Appbar,
  Text,
  TextInput,
  Button,
  Switch,
  Snackbar,
  ActivityIndicator,
  Portal,
  Modal,
  List,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useDepartmentsSelect } from "../../hooks/api/useDepartments";
import { usePositions } from "../../hooks/api/usePositions";
import { useCreateEmployee } from "../../hooks/api/useEmployees";

const EmployeeFormScreen = ({ route, navigation }) => {
  const presetDepartmentId = route.params?.departmentId || null;

  const { data: departments = [], isLoading: isDepartmentsLoading } =
    useDepartmentsSelect();
  const { data: positions = [], isLoading: isPositionsLoading } =
    usePositions();

  const createEmployeeMutation = useCreateEmployee();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hireDate, setHireDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [isActive, setIsActive] = useState(true);
  const [departmentId, setDepartmentId] = useState(presetDepartmentId);
  const [positionId, setPositionId] = useState(null);
  const [photo, setPhoto] = useState(null);

  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [positionModalVisible, setPositionModalVisible] = useState(false);

  const [snackbar, setSnackbar] = useState({ visible: false, text: "" });

  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === departmentId),
    [departments, departmentId],
  );

  const selectedPosition = useMemo(
    () => positions.find((p) => p.id === positionId),
    [positions, positionId],
  );

  const pickPhoto = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      setSnackbar({
        visible: true,
        text: "Нет доступа к галерее. Разрешите доступ в настройках.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        name: asset.fileName || `employee-${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      });
    }
  };

  const validate = () => {
    if (!fullName.trim() || fullName.trim().length < 5) {
      return "ФИО должно быть не менее 5 символов";
    }
    if (!email.trim()) {
      return "Email обязателен";
    }
    if (!hireDate.trim()) {
      return "Дата приема обязательна";
    }
    return null;
  };

  const handleCreate = async () => {
    const validationError = validate();
    if (validationError) {
      setSnackbar({ visible: true, text: validationError });
      return;
    }

    try {
      await createEmployeeMutation.mutateAsync({
        full_name: fullName,
        email,
        phone,
        hire_date: hireDate,
        is_active: isActive,
        department_id: departmentId,
        position_id: positionId,
        photo,
      });

      setSnackbar({ visible: true, text: "✅ Сотрудник успешно создан" });

      setTimeout(() => {
        navigation.goBack();
      }, 700);
    } catch (error) {
      setSnackbar({
        visible: true,
        text: `❌ ${error?.message || "Ошибка создания сотрудника"}`,
      });
    }
  };

  if (isDepartmentsLoading || isPositionsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Новый сотрудник" />
      </Appbar.Header>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Основные данные</Text>

          <TextInput
            label="ФИО"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            label="Телефон"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
          />

          <TextInput
            label="Дата приема (YYYY-MM-DD)"
            value={hireDate}
            onChangeText={setHireDate}
            style={styles.input}
          />

          <Button
            mode="outlined"
            onPress={() => setDepartmentModalVisible(true)}
            style={styles.input}
          >
            {selectedDepartment?.name || "Выбрать отдел"}
          </Button>

          <Button
            mode="outlined"
            onPress={() => setPositionModalVisible(true)}
            style={styles.input}
          >
            {selectedPosition?.name || "Выбрать должность"}
          </Button>

          <View style={styles.switchRow}>
            <Text>Активный сотрудник</Text>
            <Switch value={isActive} onValueChange={setIsActive} />
          </View>

          <Text style={styles.sectionTitle}>Фото сотрудника</Text>
          <Button mode="outlined" onPress={pickPhoto}>
            {photo ? "Изменить фото" : "Выбрать фото"}
          </Button>

          {photo?.uri ? (
            <Image source={{ uri: photo.uri }} style={styles.preview} />
          ) : (
            <Text style={styles.hint}>Фото не выбрано</Text>
          )}

          <Button
            mode="contained"
            onPress={handleCreate}
            loading={createEmployeeMutation.isPending}
            disabled={createEmployeeMutation.isPending}
            style={styles.submitBtn}
          >
            Создать сотрудника
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={departmentModalVisible}
          onDismiss={() => setDepartmentModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Выберите отдел</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {departments.map((d) => (
              <List.Item
                key={d.id}
                title={d.name}
                onPress={() => {
                  setDepartmentId(d.id);
                  setDepartmentModalVisible(false);
                }}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={positionModalVisible}
          onDismiss={() => setPositionModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Выберите должность</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {positions.map((p) => (
              <List.Item
                key={p.id}
                title={p.name}
                onPress={() => {
                  setPositionId(p.id);
                  setPositionModalVisible(false);
                }}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        duration={3000}
        onDismiss={() => setSnackbar({ visible: false, text: "" })}
      >
        {snackbar.text}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scroll: { flex: 1 },
  form: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  input: { marginBottom: 12 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  preview: {
    marginTop: 12,
    width: 100,
    height: 100,
    borderRadius: 8,
    alignSelf: "center",
  },
  hint: { color: "#666", marginTop: 8 },
  submitBtn: { marginTop: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  modal: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontWeight: "700", marginBottom: 8, fontSize: 16 },
});

export default EmployeeFormScreen;
