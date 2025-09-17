<script setup>
import Papa from 'papaparse'
import { ref, computed, onMounted } from 'vue'
import { driveToDirectUrl } from './utils/drive'

// ====== CONFIG ======
// Use "/estoque.csv" se estiver no public/ (CSV local)
// Ou cole aqui a URL publicada do Google Sheets que termina com "output=csv"
const CSV_URL = '/estoque.csv'

// Mapeamento dos nomes das colunas (iguais aos da sua planilha)
const COLS = {
  timestamp: 'Timestamp',
  id: 'Digite o Id do produto',
  nome: 'Digite o nome do produto',
  codigo: 'Digite o código do produto',
  marca: 'Digite a marca do produto',
  categoria: 'Digite a categoria do produto',
  imgFrente: 'Imagem a parte frontal do Produto',
  imgVerso: 'Imagem do verso do produto',
  descricao: 'Descrição do produto',
  precoCusto: 'Preço de custo do produto',
  precoVenda: 'Preço de venda do produto',
  quantidade: 'Quantidade'
}

const rawRows = ref([])
const loading = ref(true)
const error = ref(null)

const filtro = ref('')
const categoriaSelecionada = ref('Todas')
const ordenarPor = ref('nome')     // 'nome' | 'precoVenda' | 'quantidade' | 'timestamp'
const ordem = ref('asc')           // 'asc' | 'desc'

// Carrega CSV
async function loadCsv() {
  return new Promise((resolve, reject) => {
    Papa.parse(CSV_URL, {
      header: true,
      download: true,
      skipEmptyLines: true,
      complete: (res) => resolve(res.data),
      error: (err) => reject(err)
    })
  })
}

// Normaliza número levando em conta possíveis vírgulas
function toNumber(value) {
  if (value === undefined || value === null || value === '') return 0
  const s = String(value).replace(/\./g, '').replace(',', '.')
  const n = Number(s)
  return isNaN(n) ? 0 : n
}

function normalizeRow(r) {
  const frente = driveToDirectUrl(r[COLS.imgFrente])
  const verso  = driveToDirectUrl(r[COLS.imgVerso])

  return {
    timestamp: r[COLS.timestamp] || '',
    id: r[COLS.id]?.trim() || '',
    nome: r[COLS.nome]?.trim() || '',
    codigo: r[COLS.codigo]?.trim() || '',
    marca: r[COLS.marca]?.trim() || '',
    categoria: r[COLS.categoria]?.trim() || '',
    imgFrente: frente,
    imgVerso: verso,
    descricao: r[COLS.descricao] || '',
    precoCusto: toNumber(r[COLS.precoCusto]),
    precoVenda: toNumber(r[COLS.precoVenda]),
    quantidade: toNumber(r[COLS.quantidade]), // vazio vira 0
    // Dados derivados
    valorEmEstoque() { return this.precoCusto * this.quantidade },
    margem() {
      if (this.precoCusto <= 0) return 0
      return (this.precoVenda - this.precoCusto) / this.precoCusto
    }
  }
}

// Normaliza texto para comparação (lowercase + remove acentos)
function norm(s) {
  if (s == null) return ''
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // remove acentos
    .trim()
}

const linhas = computed(() => rawRows.value.map(normalizeRow))

const categorias = computed(() => {
  const set = new Set(linhas.value.map(l => l.categoria || 'Sem categoria'))
  return ['Todas', ...Array.from(set)]
})

const filtradas = computed(() => {
  const q = norm(filtro.value)
  const qDigits = q.replace(/\D/g, '') // só números (para comparar códigos sem separadores)
  const cat = categoriaSelecionada.value

  return linhas.value.filter(l => {
    // campos alvo da busca
    const nomeNorm = norm(l.nome)
    const codRaw  = (l.codigo ?? '').toString()
    const codNorm = norm(codRaw)
    const codDigits = codRaw.replace(/\D/g, '')

    // match por texto (nome/código)
    const matchTexto =
      q === '' ||
      nomeNorm.includes(q) ||
      codNorm.includes(q) ||
      (qDigits !== '' && codDigits.includes(qDigits))

    // filtro por categoria (se usar)
    const passaCat = (cat === 'Todas') ? true : (l.categoria || 'Sem categoria') === cat

    return matchTexto && passaCat
  })
})

const ordenadas = computed(() => {
  const arr = [...filtradas.value]
  const dir = ordem.value === 'asc' ? 1 : -1
  arr.sort((a, b) => {
    const key = ordenarPor.value
    let va = a[key]
    let vb = b[key]
    if (typeof va === 'function') va = va.call(a)
    if (typeof vb === 'function') vb = vb.call(b)

    if (typeof va === 'string') return va.localeCompare(vb) * dir
    if (typeof va === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb)) * dir
  })
  return arr
})

const totais = computed(() => {
  const qtd = filtradas.value.reduce((s, l) => s + l.quantidade, 0)
  const custo = filtradas.value.reduce((s, l) => s + (l.precoCusto * l.quantidade), 0)
  const venda = filtradas.value.reduce((s, l) => s + (l.precoVenda * l.quantidade), 0)
  return { qtd, custo, venda, lucro: venda - custo }
})

function toggleOrdem(col) {
  if (ordenarPor.value === col) {
    ordem.value = (ordem.value === 'asc') ? 'desc' : 'asc'
  } else {
    ordenarPor.value = col
    ordem.value = 'asc'
  }
}

onMounted(async () => {
  try {
    const data = await loadCsv()
    rawRows.value = data
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="container">
    <header class="topbar">
      <h1>🚀 Meu Estoque</h1>
      <p class="subtitle">Catálogo de produtos — estilo e-commerce</p>
    </header>

    <section class="toolbar card-ui">
      <input
        v-model="filtro"
        type="search"
        class="input"
        placeholder="Buscar por nome, código, marca, descrição…"
      />

      <div class="sort">
        <label class="label">Ordenar por:</label>
        <select v-model="ordenarPor" class="select">
          <option value="nome">Nome</option>
          <option value="precoVenda">Preço de venda</option>
          <option value="quantidade">Quantidade</option>
          <option value="timestamp">Data</option>
        </select>
        <button class="btn btn-dark" @click="toggleOrdem(ordenarPor)">
          {{ ordem === 'asc' ? '↑' : '↓' }}
        </button>
      </div>
    </section>

    <section v-if="loading" class="state">Carregando…</section>
    <section v-else-if="error" class="state error">Erro: {{ error }}</section>

    <section v-else class="summary">
      <div class="pill">Itens: <strong>{{ ordenadas.length }}</strong></div>
      <div class="pill">Qtd total: <strong>{{ totais.qtd }}</strong></div>
      <div class="pill">Custo: <strong>R$ {{ totais.custo.toFixed(2) }}</strong></div>
      <div class="pill">Potencial de venda: <strong>R$ {{ totais.venda.toFixed(2) }}</strong></div>
      <div class="pill pill-success">Lucro potencial: <strong>R$ {{ totais.lucro.toFixed(2) }}</strong></div>
    </section>

    <section class="grid">
      <article v-for="(p, i) in ordenadas" :key="p.id + '-' + i" class="card product">
        <div class="media">
          <img
            v-if="p.imgFrente"
            :src="p.imgFrente"
            alt="Imagem do produto (frente)"
            loading="lazy"
          />
          <div v-else class="media-placeholder">Sem imagem</div>
        </div>

        <div class="content">
          <header class="product-header">
            <h2 class="title">{{ p.nome || '(Sem nome)' }}</h2>
            <small class="sku">ID: {{ p.id }} • Cód: {{ p.codigo }}</small>
          </header>

          <p class="descr">{{ p.descricao }}</p>

          <dl class="meta">
            <div><dt>Marca</dt><dd>{{ p.marca || '—' }}</dd></div>
            <div><dt>Categoria</dt><dd>{{ p.categoria || '—' }}</dd></div>
            <div><dt>Quantidade</dt><dd>{{ p.quantidade }}</dd></div>
            <div><dt>Margem</dt><dd>{{ (p.margem()*100).toFixed(1) }}%</dd></div>
          </dl>

          <div class="pricing">
            <div class="price">
              <span class="price-label">Preço</span>
              <div class="price-values">
                <span class="price-sale">R$ {{ p.precoVenda.toFixed(2) }}</span>
                <span v-if="p.precoCusto>0" class="price-cost">custo: R$ {{ p.precoCusto.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <footer class="status">
            <span class="badge" :class="{'low': p.quantidade <= 0, 'ok': p.quantidade > 0}">
              {{ p.quantidade <= 0 ? 'Sem estoque' : 'Em estoque' }}
            </span>
          </footer>
        </div>
      </article>
    </section>
  </main>
</template>


<style scoped>/* ===== Paleta azul-claro ===== */
:root {
  --blue-25: #f4f9ff;       /* fundo clarinho */
  --blue-50: #e9f3ff;
  --blue-100:#d7ebff;
  --blue-300:#7cc4ff;       /* acentos */
  --blue-500:#3aa5ff;
  --blue-600:#1f8fff;       /* primário vivo */
  --blue-700:#136fce;       /* hover primário */
  --blue-800:#0a3d62;       /* botões escuros */
  --teal-500:#00bfa6;       /* sucesso/ganho */
  --gray-50:#f9fafb;
  --gray-100:#f3f4f6;
  --gray-200:#e5e7eb;
  --gray-300:#d1d5db;
  --gray-500:#6b7280;
  --gray-700:#374151;
  --white:#ffffff;
}

/* ===== Layout base ===== */
.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem 2rem;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  color: var(--gray-700);
}

/* Topo com vitrine */
.topbar {
  background: linear-gradient(120deg, var(--blue-600), var(--blue-300));
  color: var(--white);
  border-radius: 18px;
  padding: 1.2rem 1.4rem;
  box-shadow: 0 10px 30px rgba(31,143,255,0.25);
  margin-bottom: 1rem;
}
.topbar h1 { margin: 0; font-size: 1.85rem; font-weight: 800; letter-spacing: .2px; }
.subtitle { margin: .25rem 0 0; opacity: .95 }

/* Barra de filtros */
.card-ui {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: 14px;
  padding: .8rem;
  display: flex; gap: .75rem; align-items: center; flex-wrap: wrap;
  box-shadow: 0 6px 18px rgba(58,165,255,0.14);
}
.input, .select, .toolbar input[type="search"], .toolbar select, .toolbar button {
  padding: .65rem .75rem;
  border: 1px solid var(--gray-300);
  border-radius: 12px;
  background: var(--blue-25);
  min-width: 220px;
  transition: box-shadow .2s, border-color .2s, background .2s, transform .12s;
}
.input:focus, .select:focus, .toolbar input[type="search"]:focus, .toolbar select:focus {
  outline: none;
  border-color: var(--blue-600);
  box-shadow: 0 0 0 4px rgba(31,143,255,0.18);
  background: var(--white);
}
.label { font-size: .9rem; color: var(--gray-500); }
.sort { display: flex; gap: .5rem; align-items: center; }

/* Estados */
.state {
  padding: 1rem;
  background: var(--blue-50);
  border: 1px solid var(--blue-100);
  border-radius: 12px;
  margin-top: 1rem;
}
.state.error { color: #b00020; background: #fff3f3; border-color: #ffcdd2; }

/* Resumo em pílulas */
.summary {
  display: flex; flex-wrap: wrap; gap: .5rem;
  margin: 1rem 0;
}
.pill {
  background: var(--blue-50);
  color: var(--blue-800);
  border: 1px solid var(--blue-100);
  padding: .45rem .7rem;
  border-radius: 999px;
  font-size: .92rem;
}
.pill-success {
  background: #eafff8;
  color: #024e43;
  border-color: #b6f7ea;
}

/* Grid de produtos */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

/* Card com cara de e-commerce */
.card.product {
  display: grid;
  grid-template-rows: auto 1fr;
  border: 1px solid var(--gray-200);
  border-radius: 16px;
  background: var(--white);
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(0,0,0,0.06);
  transition: transform .16s ease, box-shadow .16s ease;
}
.card.product:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 44px rgba(31,143,255,0.22);
}

/* IMAGEM MAIOR + destaque */
.media {
  background: linear-gradient(180deg, var(--blue-50), #ffffff);
  display: grid; place-items: center;
  padding: .9rem;
}
.media img {
  width: 100%;
  height: 280px;               /* << maior que antes */
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--gray-200);
  transition: transform .2s ease, box-shadow .2s ease;
}
.card.product:hover .media img {
  transform: scale(1.02);
  box-shadow: 0 10px 24px rgba(0,0,0,0.08);
}
.media-placeholder {
  width: 100%;
  height: 280px;
  border: 2px dashed var(--gray-300);
  border-radius: 12px;
  display: grid; place-items: center;
  color: var(--gray-500);
  background: repeating-linear-gradient(45deg, #f7fbff, #f7fbff 10px, #eef6ff 10px, #eef6ff 20px);
}

/* Conteúdo do produto */
.content { padding: .95rem 1rem 1.05rem; display: flex; flex-direction: column; gap: .65rem; }
.product-header .title { margin: 0; font-size: 1.12rem; font-weight: 800; color: var(--gray-700); }
.sku { color: var(--gray-500); }
.descr { color: var(--gray-700); min-height: 2.4em; }

/* Meta */
.meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .35rem .9rem;
}
.meta dt { font-weight: 700; color: var(--gray-500); }
.meta dd { margin: 0; }

/* Preços + CTA */
.pricing {
  display: flex; align-items: flex-end; justify-content: space-between; gap: .75rem;
  border-top: 1px dashed var(--gray-200); padding-top: .7rem;
}
.price-label { font-size: .8rem; color: var(--gray-500); }
.price-values { display: flex; align-items: baseline; gap: .55rem; }
.price-sale {
  font-size: 1.38rem;
  font-weight: 900;
  color: var(--blue-700);
  letter-spacing: .2px;
}
.price-cost {
  font-size: .86rem;
  color: var(--gray-500);
  text-decoration: line-through;
}
.cta { display: flex; gap: .55rem; flex-wrap: wrap; }

/* Botões (azul escuro) */
.btn {
  border: 1px solid transparent;
  padding: .58rem .9rem;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease, background .12s ease, color .12s ease, border-color .12s ease;
}
.btn:active { transform: translateY(1px); }

.btn-primary {
  background: var(--blue-600);
  color: var(--white);
  box-shadow: 0 6px 16px rgba(31,143,255,0.28);
}
.btn-primary:hover { background: var(--blue-700); }

.btn-dark {
  background: var(--blue-800);
  color: var(--white);
  border-color: #08283e;
  box-shadow: 0 6px 16px rgba(10,61,98,0.28);
}
.btn-dark:hover { filter: brightness(1.08); }

.btn-outline {
  background: var(--white);
  color: var(--blue-800);
  border-color: var(--blue-800);
}
.btn-outline:hover { background: var(--blue-50); }

/* Status */
.status { display: flex; justify-content: flex-end; margin-top: .4rem; }
.badge {
  font-size: .8rem; padding: .28rem .65rem;
  border-radius: 999px; border: 1px solid var(--gray-300);
}
.badge.ok { background: #e9fbff; border-color: #b8ecff; color: #004f74; }
.badge.low { background: #fff2f2; border-color: #ffd6d6; color: #c62828; }

/* Responsivo */
@media (max-width: 520px) {
  .pricing { flex-direction: column; align-items: stretch; gap: .6rem; }
  .cta { justify-content: space-between; }
}
</style>
