import apiClient from "./client";

export const importApi = {
  importKanbanFile: async (fileAsset) => {
    const formData = new FormData();

    formData.append("file", {
      uri: fileAsset.uri,
      name: fileAsset.name || "kanban.xlsx",
      type:
        fileAsset.mimeType ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    formData.append("import_type", "kanban");

    const response = await apiClient.post("/import/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000,
    });

    return response.data;
  },

  validateKanbanFile: async (fileAsset) => {
    const formData = new FormData();

    formData.append("file", {
      uri: fileAsset.uri,
      name: fileAsset.name || "kanban.xlsx",
      type:
        fileAsset.mimeType ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const response = await apiClient.post("/import/import/validate", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000,
    });

    return response.data;
  },
};
