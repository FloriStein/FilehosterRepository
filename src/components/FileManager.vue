<template>
  <div class="file-manager">
    <!-- Linke Spalte: Suchfeld, Uploader, Aktionen -->
    <div class="left-column">
      <FileSearch v-model="searchQuery" />
      <FileUploader @uploadComplete="handleUploadComplete" />
      <FileActions
          :selectedFiles="selectedFiles"
          :fileList="fileList"
          @filesDeleted="handleFilesDeleted"
      />
      <!-- Sign-Out Button unten in der linken Spalte -->
      <div class="sign-out-container">
        <button class="sign-out-button" @click="signOut">Sign Out</button>
      </div>
    </div>
    <!-- Rechte Spalte: Datei-Liste -->
    <div class="right-column">
      <div class="file-list-container">
        <FileList
            :fileList="filteredFiles"
            :selectedFiles="selectedFiles"
            :getUrlOnDemand="getUrlOnDemand"
            @toggleSelection="toggleFileSelection"
            @updateFile="updateFile"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineProps } from "vue";
import type { PropType } from "vue";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import type { FileItem } from "@/types/types";
import FileSearch from "./FileSearch.vue";
import FileUploader from "./FileUploader.vue";
import FileActions from "./FileActions.vue";
import FileList from "./FileList.vue";
import { getUrl } from "aws-amplify/storage";

// Sign-Out-Funktion als Prop erhalten
defineProps({
  signOut: {
    type: Function as PropType<() => void>,
    required: true,
  },
});

// Amplify-Datenbank-Client initialisieren
const client = generateClient<Schema>();

// Zustände
const searchQuery = ref("");
const fileList = ref<FileItem[]>([]);
const selectedFiles = ref<Set<string>>(new Set());

// Computed: Gefilterte Dateien basierend auf der Suchanfrage
const filteredFiles = computed(() =>
    fileList.value.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
);

// Subscription-Variablen
let querySub: { unsubscribe: () => void } | null = null;
let deleteSub: { unsubscribe: () => void } | null = null;

onMounted(() => {
  // Initiales Laden der Metadaten
  querySub = client.models.MetaData.observeQuery().subscribe({
    next: ({ items }) => {
      fileList.value = items.map((metadata) => ({
        name: metadata.fileName,
        bucket: metadata.bucket,
        path: metadata.path,
        uploadedAt: metadata.uploadedAt,
        size: metadata.size,
      }));
    },
    error: (err: any) => {
      console.error("Fehler beim Abrufen der Metadaten:", err);
    },
  });

  // Subscription für gelöschte Dateien
  deleteSub = client.models.MetaData.onDelete().subscribe({
    next: (deletedItem: any) => {
      fileList.value = fileList.value.filter(
          (item) => item.name !== deletedItem.fileName
      );
    },
    error: (error: any) => {
      console.warn("Fehler bei onDelete:", error);
    },
  });
});

onUnmounted(() => {
  querySub?.unsubscribe();
  deleteSub?.unsubscribe();
});

// Toggle der Dateiauswahl
const toggleFileSelection = (fileName: string) => {
  if (selectedFiles.value.has(fileName)) {
    selectedFiles.value.delete(fileName);
  } else {
    selectedFiles.value.add(fileName);
  }
};

// Aktualisieren einer Datei in der Liste
const updateFile = (updatedFile: FileItem) => {
  const index = fileList.value.findIndex((f) => f.name === updatedFile.name);
  if (index !== -1) {
    fileList.value[index] = updatedFile;
  }
};

// Dateien nach erfolgreichem Upload: Nur Logging, da die Subscription aktualisiert
const handleUploadComplete = (uploadedFiles: Array<{ name: string; path: string; size: number }>) => {
  console.log("Upload complete event empfangen, aber die Liste wird über observeQuery aktualisiert.", uploadedFiles);
};

// Aktualisieren der Datei-Liste nach dem Löschen (falls benötigt)
const handleFilesDeleted = (updatedFileList: FileItem[]) => {
  selectedFiles.value.clear();
  fileList.value = updatedFileList;
};

// Funktion zum Abrufen der URL bei Bedarf
const getUrlOnDemand = async (file: FileItem): Promise<string | null> => {
  try {
    const urlResponse = await getUrl({
      path: file.path,
      options: { expiresIn: 5 },
    });
    return urlResponse.url.toString();
  } catch (error) {
    console.error(`Fehler beim Laden der URL für ${file.name}`, error);
    return null;
  }
};
</script>
