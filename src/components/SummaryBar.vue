<template>
  <div class="alert alert-secondary d-flex flex-wrap gap-4 align-items-center justify-content-between mb-4">
    <span>Itens: <strong>{{ totais.itens }}</strong></span>
    <span>Qtd total: <strong>{{ totais.qtd }}</strong></span>
    <span>Custo: <strong>R$ {{ totais.custo }}</strong></span>
    <span>Venda: <strong>R$ {{ totais.venda }}</strong></span>
    <span class="text-success">Lucro: <strong>R$ {{ totais.lucro }}</strong></span>
  </div>
</template>

defineProps({ totais: Object })
<script setup>
defineProps({ totais: Object })
</script>

<style scoped>
/* Usando Bootstrap, sem CSS customizado */
</style>
