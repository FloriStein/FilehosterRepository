<script setup lang="ts">
import type { Schema } from 'amplify/data/resource.ts'
import { generateClient } from 'aws-amplify/data'

const client = generateClient<Schema>()

async function createTodo() {
  await client.models.Todo.create({
    content: window.prompt("Todo content?"),
    isDone: false
  })
}
</script>

<template>
  <div>
    <button @click="createTodo">Add new todo</button>
  </div>
</template>