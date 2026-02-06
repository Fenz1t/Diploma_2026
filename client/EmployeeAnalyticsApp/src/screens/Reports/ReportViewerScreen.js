import React, { useEffect, useState } from "react";
import { View, Button } from "react-native";
import { useReports } from "../../hooks/api/useReports";
import ReportTable from "../../components/common/ReportTable";
import ReportHeader from "../../components/common/ReportHeader";
import ExportModal from "../../components/common/ExportModal";
import LoadingView from "../../components/common/LoadingView";

export default function ReportViewerScreen({ route }) {
  const { type, title } = route.params;
  const { loadReport, data, loading, exportReport } = useReports();
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    loadReport(type);
  }, [type]);

  if (loading) return <LoadingView />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <ReportHeader title={title} count={data.length} />

      <Button
        title="Выгрузить отчет"
        onPress={() => setShowExport(true)}
        style={{ marginBottom: 16 }}
      />

      {/* Одна таблица для всех отчетов! */}
      <ReportTable
        data={data}
        reportType={type} // передаем тип для правильного отображения колонок
      />

      <ExportModal
        visible={showExport}
        onClose={() => setShowExport(false)}
        onSelect={(format) => exportReport(type, format)}
      />
    </View>
  );
}
