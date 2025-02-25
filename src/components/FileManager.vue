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
            @toggleSelection="toggleFileSelection"
            @updateFile="updateFile"
            @getUrlOnDemand="getUrlOnDemand"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineProps } from "vue";
import type { PropType } from "vue";
import { generateClient } from "aws-amplify/data";
import type { Schema } from '../../amplify/data/resource';
import type { FileItem } from "@/types/types";
import FileSearch from "./FileSearch.vue";
import FileUploader from "./FileUploader.vue";
import FileActions from "./FileActions.vue";
import FileList from "./FileList.vue";

// Sign-Out-Funktion als Prop erhalten
defineProps({
  signOut: {
    type: Function as PropType<() => void>,
    required: true
  }
});

// Amplify-Datenbank-Client
const client = generateClient<Schema>();

const searchQuery = ref("");
const fileList = ref<FileItem[]>([]);
const selectedFiles = ref<Set<string>>(new Set());

const filteredFiles = computed(() =>
    fileList.value.filter(file =>
        file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
);

let subscription: any = null;

// Funktion zum Abrufen der Metadaten
const fetchMetaData = () => {
  subscription = client.models.MetaData.observeQuery().subscribe({
    next: ({ items }) => {
      fileList.value = items.map((metadata) => ({
        name: metadata.fileName,
        path: metadata.path,
        uploadedAt: metadata.uploadedAt,
        size: metadata.size,
      }));
    },
    error: (err) => {
      console.error("Fehler beim Abrufen der Metadaten:", err);
    },
  });
};

// Auswahl umschalten
const toggleFileSelection = (fileName: string) => {
  if (selectedFiles.value.has(fileName)) {
    selectedFiles.value.delete(fileName);
  } else {
    selectedFiles.value.add(fileName);
  }
};

// Datei in der Liste aktualisieren
const updateFile = (updatedFile: FileItem) => {
  const index = fileList.value.findIndex(f => f.name === updatedFile.name);
  if (index !== -1) {
    fileList.value[index] = updatedFile;
  }
};

// Hochgeladene Datei hinzufügen
const handleUploadComplete = (uploadedFiles: FileItem[]) => {
  fileList.value.push(...uploadedFiles);
};

// Datei nach dem Löschen entfernen
const handleFilesDeleted = (updatedFileList: FileItem[]) => {
  selectedFiles.value.clear();
  fileList.value = updatedFileList;
};

// Funktion für das Abrufen der URL bei Bedarf
const getUrlOnDemand = async (file: FileItem): Promise<string | null> => {
  try {
    const urlResponse = await client.models.MetaData.get({ id: file.path });
    return urlResponse?.url ?? null;
  } catch (error) {
    console.error(`Fehler beim Laden der URL für ${file.name}`, error);
    return null;
  }
};

onMounted(fetchMetaData);

// Bei Komponenten-Zerstörung das Subscription-Observable abmelden
onUnmounted(() => {
  if (subscription) subscription.unsubscribe();
});
</script>
