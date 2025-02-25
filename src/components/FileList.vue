<template>
  <div class="file-table-container">
    <table class="file-table">
      <thead>
      <tr>
        <th>Select</th>
        <th>Name</th>
        <th>Upload date</th>
        <th>Size</th>
      </tr>
      </thead>
      <tbody>
      <tr
          v-for="file in fileList"
          :key="file.name"
          :class="{ selected: selectedFiles.has(file.name) }"
      >
        <td>
          <input
              type="checkbox"
              @change="toggleFileSelection(file.name)"
              :checked="selectedFiles.has(file.name)"
          />
        </td>
        <td>
          <a href="#" @click.prevent="openFileUrl(file)">
            {{ file.name }}
          </a>
        </td>
        <td>{{ formatDate(file.uploadedAt) }}</td>
        <td>{{ formatFileSize(file.size) }}</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";
import type { FileItem } from "@/types/types";

const props = defineProps<{
  fileList: FileItem[];
  selectedFiles: Set<string>;
  getUrlOnDemand: (file: FileItem) => Promise<string | null>;
}>();

const emit = defineEmits<{
  (e: "toggleSelection", fileName: string): void;
}>();

// Gibt den Toggle-Event an den Parent weiter
const toggleFileSelection = (fileName: string) => {
  emit("toggleSelection", fileName);
};

// Ruft die vom Parent bereitgestellte getUrlOnDemand-Methode auf
const openFileUrl = async (file: FileItem) => {
  try {
    const fileUrl = await props.getUrlOnDemand(file);
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  } catch (error) {
    console.error(`Fehler beim Laden der URL für ${file.name}`, error);
  }
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Unbekannt";
  return new Date(dateString).toLocaleString();
};

const formatFileSize = (size: number | undefined): string => {
  if (!size) return "Unbekannt";
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let formattedSize = size;
  while (formattedSize >= 1024 && unitIndex < units.length - 1) {
    formattedSize /= 1024;
    unitIndex++;
  }
  return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
};
</script>

