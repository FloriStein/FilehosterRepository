<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Schema } from '../../amplify/data/resource'
import { generateClient } from 'aws-amplify/data'

const client = generateClient<Schema>()

// create a reactive reference to the array of todos
const MetaData = ref<Array<Schema['MetaData']["type"]>>([]);

function fetchMetaData() {
  client.models.MetaData.observeQuery().subscribe({
    next: ({ items, isSynced }) => {
      MetaData.value = items
    },
  });
}
onMounted(() => {
  fetchMetaData();
});

</script>

<template>
  <div>
    <ul>
      <li
          v-for="metaData in MetaData"
          :key="metaData.fileName">
        {{ metaData.fileName }}
      </li>
    </ul>
  </div>
</template>