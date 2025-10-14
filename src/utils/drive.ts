/** Extrai o FILE_ID de formatos comuns do Google Drive */
export function extractDriveId(raw?: string | null): string | null {
  if (!raw) return null
  let s = String(raw).trim()

  // Suporte a =HYPERLINK("url"; "texto") (Sheets)
  s = s.replace(/^=HYPERLINK\(\s*"([^"]+)"\s*(?:;|,)\s*".*"\s*\)$/i, '$1')
  s = s.replace(/^"(.*)"$/, '$1').trim()

  try {
    const u = new URL(s)
    // Se for um link direto (ex: .jpg, .png, .webp), retorna o próprio link
    if (/\.(jpg|jpeg|png|webp|gif)$/i.test(u.pathname)) {
      return s
    }

    // Se for Drive, tenta extrair o ID
    const byQuery = u.searchParams.get('id')
    if (byQuery) return byQuery

    const parts = u.pathname.split('/').filter(Boolean)
    const idx = parts.findIndex(p => p === 'd')
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]
  } catch {
    // não é uma URL válida
  }

  const m1 = s.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/)
  if (m1) return m1[1]

  const m2 = s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/)
  if (m2) return m2[1]

  const m3 = s.match(/\b([a-zA-Z0-9_-]{25,})\b/)
  return m3 ? m3[1] : s // se nada casar, retorna o próprio link
}

/** URL exibível do Google Drive (imagem direta ou URL normal) */
export const driveViewUrl = (input: string): string => {
  if (!input) return ''

  // Se já é um link direto (jpg/png/webp/gif), retorna como está
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(input)) return input

  // Se for um link completo do Drive
  const id = extractDriveId(input)
  if (!id) return input

  // Se for um ID simples (sem domínio)
  if (!/^https?:\/\//.test(id))
    return `https://drive.google.com/uc?export=view&id=${id}`

  return id
}

/** Miniatura redimensionada (opcional — usada por alguns cards) */
export const driveThumbUrl = (input: string, size = 'w1200'): string => {
  if (!input) return ''

  // Se já é um link direto (jpg/png/webp/gif), retorna como está
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(input)) return input

  const id = extractDriveId(input)
  if (!id) return input

  if (!/^https?:\/\//.test(id))
    return `https://drive.google.com/thumbnail?id=${id}&sz=${size}`

  return id
}
