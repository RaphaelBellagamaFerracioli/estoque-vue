export function driveToDirectUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  try {
    // Extrai ID de formatos comuns:
    // - open?id=FILE_ID
    // - file/d/FILE_ID/view
    // - uc?id=FILE_ID&export=view
    // - sharing links
    let fileId: string | null = null;

    const u = new URL(url);

    // 1) open?id=
    if (u.searchParams.get('id')) {
      fileId = u.searchParams.get('id');
    }

    // 2) /file/d/FILE_ID/
    if (!fileId) {
      const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (m) fileId = m[1]; 
    }

    // 3) uc?id=
    if (!fileId && u.hostname.includes('google') && u.searchParams.get('id')) {
      fileId = u.searchParams.get('id');
    }

    if (!fileId) return null;

    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch {
    return null;
  }
}
