<!-- FileActions.vue -->
<template>
  <div class="file-actions">
    <!-- Button zum Herunterladen der ausgewählten Dateien als ZIP -->
    <button @click="downloadSelectedFilesAsZip" :disabled="selectedFiles.size === 0">
      Download
    </button>
    <!-- Button zum Löschen der ausgewählten Dateien -->
    <button @click="deleteSelectedFiles" :disabled="selectedFiles.size === 0">
      Delete
    </button>
  </div>
</template>

<script setup lang="ts">
import { remove, getUrl } from "aws-amplify/storage";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import type { FileItem } from "@/types/types";

// Definiert die empfangenen Props: Eine Menge von ausgewählten Dateinamen und die gesamte Dateiliste
const props = defineProps<{
  selectedFiles: Set<string>; // Enthält die Namen der aktuell ausgewählten Dateien
  fileList: FileItem[]; // Enthält die gesamte Liste der Dateien
}>();

// Definiert Events, die an das übergeordnete Element gesendet werden können
const emit = defineEmits<{
  (e: "filesDeleted", updatedFileList: FileItem[]): void;
}>();

// Erstellt den Amplify Data Client, um auf die Datenbank (Meta-Daten) zuzugreifen
const client = generateClient<Schema>();

/**
 * Löscht die ausgewählten Dateien sowohl aus dem S3-Speicher als auch aus der Datenbank.
 */
const deleteSelectedFiles = async () => {
  const filesToDelete = Array.from(props.selectedFiles); // Konvertiert das Set in ein Array
  if (filesToDelete.length === 0) return; // Falls keine Dateien ausgewählt sind, wird die Funktion beendet

  try {
    await Promise.all(
        filesToDelete.map(async (fileName) => {
          const path = `files/${fileName}`;
          // Löscht die Datei aus dem S3-Storage
          await remove({ path });
          // Löscht die Meta-Daten der Datei aus der Datenbank
          await client.models.MetaData.delete({ fileName });
        })
    );

    // Aktualisiert die Dateiliste, indem die gelöschten Dateien entfernt werden
    const updatedFileList = props.fileList.filter(
        (file) => !filesToDelete.includes(file.name)
    );
    emit("filesDeleted", updatedFileList); // Sendet das aktualisierte Dateiliste-Event
  } catch (error) {
    console.error("Fehler beim Löschen der Dateien", error);
  }
};

/**
 * Erstellt ein ZIP-Archiv mit den ausgewählten Dateien und lädt es herunter.
 */
const downloadSelectedFilesAsZip = async () => {
  const filesToDownload = Array.from(props.selectedFiles); // Konvertiert das Set in ein Array
  if (filesToDownload.length === 0) return; // Falls keine Dateien ausgewählt sind, wird die Funktion beendet

  const zip = new JSZip(); // Erstellt eine neue ZIP-Datei

  try {
    await Promise.all(
        filesToDownload.map(async (fileName) => {
          const fileItem = props.fileList.find((file) => file.name === fileName);
          if (!fileItem) return; // Falls die Datei nicht gefunden wird, überspringen

          // Holt die Presigned-URL für den Download
          const urlResponse = await getUrl({
            path: fileItem.path,
            options: { expiresIn: 5 }, // Die URL ist nur 5 Sekunden gültig
          });
          const url = urlResponse.url.toString();

          // Holt die Datei über die Presigned-URL
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Fehler beim Herunterladen von ${fileName}`);
          }

          // Konvertiert die Datei in ein ArrayBuffer, um sie ins ZIP-Archiv einzufügen
          const arrayBuffer = await response.arrayBuffer();
          zip.file(fileName, arrayBuffer);
        })
    );

    // Generiert die ZIP-Datei als Blob und startet den Download
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "download.zip");
  } catch (error) {
    console.error("Fehler beim Herunterladen der Dateien:", error);
  }
};

// Exponiert keine Funktionen nach außen
defineExpose({});
</script>
