// src/utils/drive.ts
/** Extrai o FILE_ID de formatos comuns do Google Drive */
export function extractDriveId(raw?: string | null): string | null {
  if (!raw) return null;
  let s = String(raw).trim();

  // =HYPERLINK("url"; "texto") ou com vírgula
  s = s.replace(/^=HYPERLINK\(\s*"([^"]+)"\s*(?:;|,)\s*".*"\s*\)$/i, '$1');
  s = s.replace(/^"(.*)"$/, '$1').trim();

  // Tenta como URL válida
  try {
    const u = new URL(s);
    const byQuery = u.searchParams.get('id');
    if (byQuery) return byQuery;

    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex(p => p === 'd');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    // segue para regex
  }

  const m1 = s.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
  if (m1) return m1[1];

  const m2 = s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m2) return m2[1];

  const m3 = s.match(/\b([a-zA-Z0-9_-]{25,})\b/);
  return m3 ? m3[1] : null;
}

/** URL exibível (página mínima que costuma servir a imagem) */
export const driveViewUrl = (id: string) =>
  `https://drive.google.com/uc?export=view&id=${id}`;

/** Miniatura redimensionada (mais estável / leve) */
export const driveThumbUrl = (id: string, size = 'w1200') =>
  `https://drive.google.com/thumbnail?id=${id}&sz=${size}`;
