<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style lang="scss">
@use '@/design/index.scss' as *;

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}
</style>
