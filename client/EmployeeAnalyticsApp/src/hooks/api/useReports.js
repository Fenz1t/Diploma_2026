import { useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { reportsApi } from "../../services/api/reportsApi";
import { encode as btoa } from "base-64";

export function useReports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReport = async (type) => {
    setLoading(true);
    try {
      let result = [];

      switch (type) {
        case "employees":
          result = await reportsApi.getEmployees();
          break;
        case "workload":
          result = await reportsApi.getWorkload();
          break;
        case "kpi":
          result = await reportsApi.getKPI();
          break;
        case "departments":
          result = await reportsApi.getDepartments();
          break;
        case "risks":
          result = await reportsApi.getRisks();
          break;
        default:
          result = [];
      }

      setData(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error("Load report error:", e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type, format) => {
    try {
      const res = await reportsApi.quickExport({ type, format });
      const ext = format === "pdf" ? "pdf" : "xlsx";
      const fileUri = FileSystem.documentDirectory + `report_${type}.${ext}`;

      const binary = new Uint8Array(res.data);
      let binaryStr = "";
      for (let i = 0; i < binary.length; i++) {
        binaryStr += String.fromCharCode(binary[i]);
      }
      const base64 = btoa(binaryStr);

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: "base64",
      });

      await Sharing.shareAsync(fileUri);
    } catch (e) {
      console.error("Export error:", e);
    }
  };

  return { loadReport, data, loading, exportReport };
}
