<template>
  <span :class="quantidade <= 0 ? 'badge bg-danger' : 'badge bg-success'">
    <span v-if="quantidade <= 0">Sem estoque</span>
    <span v-else>Em estoque</span>
  </span>
</template>

defineProps({ quantidade: Number })
<script setup>
defineProps({ quantidade: Number })
</script>

<style scoped>
/* Usando Bootstrap, sem CSS customizado */
</style>
