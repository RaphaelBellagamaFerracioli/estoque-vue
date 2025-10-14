<template>
  <div class="row g-4">
    <div v-for="p in produtos" :key="p.id" class="col-12 col-md-6 col-lg-4 col-xl-3">
      <ProductCard v-bind="p" />
    </div>
  </div>
</template>

<script setup>
import ProductCard from './ProductCard.vue'
defineProps({ produtos: Array })
</script>

<style scoped>
/* Usando Bootstrap, sem CSS customizado */
</style>
