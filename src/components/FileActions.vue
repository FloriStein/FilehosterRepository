<!-- FileActions.vue -->
<template>
  <div class="file-actions">
    <button @click="downloadSelectedFilesAsZip" :disabled="selectedFiles.size === 0">
      Download
    </button>
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

// Props und Emits
const props = defineProps<{
  selectedFiles: Set<string>;
  fileList: FileItem[];
}>();

const emit = defineEmits<{
  (e: "filesDeleted", updatedFileList: FileItem[]): void;
}>();

// Erstelle den Amplify Data Client für den Zugriff auf die Datenbank
const client = generateClient<Schema>();

// Funktion zum Löschen der ausgewählten Dateien inklusive Meta-Daten in der Datenbank
const deleteSelectedFiles = async () => {
  const filesToDelete = Array.from(props.selectedFiles);
  if (filesToDelete.length === 0) return;

  try {
    await Promise.all(
        filesToDelete.map(async (fileName) => {
          const path = `files/${fileName}`;
          // Datei aus dem S3 Storage löschen
          await remove({ path });
          // Entsprechende Meta-Daten löschen (Identifier ist fileName)
          await client.models.MetaData.delete({ fileName });
        })
    );

    // Aktualisiere die Dateiliste und informiere das Parent
    const updatedFileList = props.fileList.filter(
        (file) => !filesToDelete.includes(file.name)
    );
    emit("filesDeleted", updatedFileList);
  } catch (error) {
    console.error("Fehler beim Löschen der Dateien", error);
  }
};

// Funktion zum Herunterladen der ausgewählten Dateien als ZIP
const downloadSelectedFilesAsZip = async () => {
  const filesToDownload = Array.from(props.selectedFiles);
  if (filesToDownload.length === 0) return;

  const zip = new JSZip();

  try {
    await Promise.all(
        filesToDownload.map(async (fileName) => {
          const fileItem = props.fileList.find((file) => file.name === fileName);
          if (!fileItem) return;

          // Erhalte eine Presigned URL beim tatsächlichen Download
          const urlResponse = await getUrl({
            path: fileItem.path,
            options: { expiresIn: 5 }
          });
          const url = urlResponse.url.toString();

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Fehler beim Herunterladen von ${fileName}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          zip.file(fileName, arrayBuffer);
        })
    );

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "download.zip");
  } catch (error) {
    console.error("Fehler beim Herunterladen der Dateien:", error);
  }
};

defineExpose({});
</script>
