<template>
  <div class="card h-100 shadow-sm rounded-3 overflow-hidden">
    <!-- Área da imagem -->
    <div class="ratio ratio-4x3 bg-light">
      <img
        v-if="isImagemValida(img)"
        :src="img"
        alt="Imagem da peça"
        class="card-img-top object-fit-cover w-100 h-100"
      />
      <div
        v-else
        class="d-flex flex-column justify-content-center align-items-center w-100 h-100 text-muted"
      >
        <i class="bi bi-image fs-1"></i>
        <span>Sem imagem</span>
      </div>
    </div>

    <!-- Corpo da card -->
    <div class="card-body d-flex flex-column">
      <h5 class="card-title fw-bold text-primary mb-1">{{ nome }}</h5>
      <p class="card-text text-secondary small mb-2">{{ descricao }}</p>

      <ul class="list-group list-group-flush mb-2">
        <li class="list-group-item py-1">
          Marca: <strong>{{ marca || '—' }}</strong>
        </li>
        <li class="list-group-item py-1">
          Categoria: <strong>{{ categoria || '—' }}</strong>
        </li>
        <li class="list-group-item py-1">
          Qtd: <strong>{{ quantidade }}</strong>
        </li>
      </ul>

      <div class="mt-auto">
        <div class="d-flex align-items-baseline gap-2 mb-2 flex-wrap">
          <span class="fs-5 text-success fw-semibold">
            R$ {{ precoVenda.toFixed(2) }}
          </span>
          <span
            v-if="precoCusto && precoCusto > 0"
            class="text-muted text-decoration-line-through small"
          >
            Custo: R$ {{ precoCusto.toFixed(2) }}
          </span>
        </div>
        <StatusBadge :quantidade="quantidade" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  nome: string
  descricao: string
  marca: string
  categoria: string
  quantidade: number
  precoVenda: number
  precoCusto?: number
  img?: string
}>()

// Função utilitária: valida formato e domínio da imagem
function isImagemValida(url?: string): boolean {
  if (!url) return false
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)
}
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}

.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
