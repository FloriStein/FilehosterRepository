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

/**
 * Props: signOut-Funktion für die Benutzerabmeldung
 */
defineProps({
  signOut: {
    type: Function as PropType<() => void>,
    required: true,
  },
});

// Amplify-Datenbank-Client initialisieren
const client = generateClient<Schema>();

// Reaktive Zustände für Datei-Management
const searchQuery = ref(""); // Suchanfrage
const fileList = ref<FileItem[]>([]); // Liste aller Dateien
const selectedFiles = ref<Set<string>>(new Set()); // Auswahl von Dateien

/**
 * Computed Property: Gefilterte Dateien basierend auf der Suchanfrage
 */
const filteredFiles = computed(() =>
    fileList.value.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
);

// Subscription-Referenzen
let querySub: { unsubscribe: () => void } | null = null;
let deleteSub: { unsubscribe: () => void } | null = null;

/**
 * Lifecycle Hook: Lädt die Datei-Metadaten bei der Komponentenerstellung und setzt Subscriptions
 */
onMounted(() => {
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

/**
 * Lifecycle Hook: Bereinigt Subscriptions beim Entladen der Komponente
 */
onUnmounted(() => {
  querySub?.unsubscribe();
  deleteSub?.unsubscribe();
});

/**
 * Datei-Auswahl umschalten
 * @param fileName - Der Name der Datei, die ausgewählt oder abgewählt wird
 */
const toggleFileSelection = (fileName: string) => {
  if (selectedFiles.value.has(fileName)) {
    selectedFiles.value.delete(fileName);
  } else {
    selectedFiles.value.add(fileName);
  }
};

/**
 * Aktualisiert eine Datei in der Liste
 * @param updatedFile - Die aktualisierte Datei mit neuen Metadaten
 */
const updateFile = (updatedFile: FileItem) => {
  const index = fileList.value.findIndex((f) => f.name === updatedFile.name);
  if (index !== -1) {
    fileList.value[index] = updatedFile;
  }
};

/**
 * Callback für erfolgreiche Datei-Uploads
 * @param uploadedFiles - Liste der hochgeladenen Dateien
 */
const handleUploadComplete = (uploadedFiles: Array<{ name: string; path: string; size: number }>) => {
  console.log("Upload complete event empfangen, aber die Liste wird über observeQuery aktualisiert.", uploadedFiles);
};

/**
 * Callback für gelöschte Dateien, setzt die Auswahl zurück
 * @param updatedFileList - Die aktualisierte Datei-Liste nach Löschvorgang
 */
const handleFilesDeleted = (updatedFileList: FileItem[]) => {
  selectedFiles.value.clear();
  fileList.value = updatedFileList;
};

/**
 * Lädt eine Datei-URL dynamisch bei Bedarf
 * @param file - Die Datei, für die die URL abgerufen wird
 * @returns Die URL der Datei oder null im Fehlerfall
 */
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
