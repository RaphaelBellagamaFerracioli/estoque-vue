<template>
  <section class="card p-3 mb-4 shadow-sm">
    <form class="row g-2 align-items-center">
      <div class="col-md-6 col-lg-5">
        <input v-model="search" type="search" class="form-control form-control-lg" placeholder="Buscar peça, código, marca..." />
      </div>
      <div class="col-md-3 col-lg-3">
        <select v-model="sortBy" class="form-select form-select-lg">
          <option value="nome">Nome</option>
          <option value="precoVenda">Preço</option>
          <option value="quantidade">Quantidade</option>
        </select>
      </div>
      <div class="col-md-3 col-lg-2">
        <button type="button" class="btn btn-primary btn-lg w-100">Ordenar</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { ref } from 'vue'
const search = ref('')
const sortBy = ref('nome')
</script>

<style scoped>
/* Usando Bootstrap, sem CSS customizado */
</style>
