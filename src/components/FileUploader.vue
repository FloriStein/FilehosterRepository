<template>
  <div class="file-uploader">
    <input
        type="file"
        ref="fileInput"
        @change="handleFileChange"
        multiple
        style="display: none"
    />
    <button @click="triggerFileSelect">Upload</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

// Amplify-Client
const client = generateClient<Schema>();

// Event-Emitter für den Upload-Abschluss
const emit = defineEmits<{
  (e: "uploadComplete", uploadedFiles: Array<{ name: string; path: string; size: number }>): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileSelect = () => {
  fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  const uploadedFiles = await Promise.all(
      Array.from(files).map(async (file) => {
        try {
          const path = `files/${file.name}`;
          const fileData = await file.arrayBuffer();

          // Datei in S3 hochladen
          await uploadData({ data: fileData, path });

          // Metadaten in der Datenbank speichern
          await client.models.MetaData.create({
            fileName: file.name,
            path,
            bucket: "fileHosterStorage",
            uploadedAt: new Date().toISOString(),
            size: Number(file.size),
          });

          return { name: file.name, path, size: file.size };
        } catch (error) {
          console.error("Fehler beim Hochladen", error);
          return null;
        }
      })
  );

  // Erfolgreiche Uploads an FileManager melden
  emit("uploadComplete", uploadedFiles.filter((f) => f !== null) as Array<{ name: string; path: string; size: number }>);

  // File-Input zurücksetzen
  target.value = "";
};
</script>
