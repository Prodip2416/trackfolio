type Item = { str: string; x: number; y: number; w: number }

/**
 * Extracts a PDF's text as reading-order lines (top→bottom, left→right).
 * Items on the same baseline (±3pt) form a line; touching items are glued without
 * a space so a 7-digit number split across text runs stays intact.
 */
export async function extractPdfText(data: Uint8Array): Promise<string> {
  // Loaded lazily: pdf.js (unpdf, needs Node >= 22) is only pulled in when a PDF is checked,
  // so a runtime problem there can never break page rendering — the check just reports an error.
  const { getDocumentProxy } = await import('unpdf')
  // verbosity 0: silence pdf.js font warnings (SutonnyMJ has non-standard TrueType hints)
  const pdf = await getDocumentProxy(data, { verbosity: 0 })
  const pages: string[] = []
  try {
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const content = await page.getTextContent()
      const items: Item[] = []
      for (const it of content.items) {
        if (!('str' in it) || !it.str) continue
        items.push({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width })
      }
      pages.push(itemsToLines(items).join('\n'))
    }
  } finally {
    await pdf.cleanup()
  }
  return pages.join('\n')
}

export function itemsToLines(items: Item[]): string[] {
  const lines: { y: number; items: Item[] }[] = []
  for (const it of [...items].sort((a, b) => b.y - a.y)) {
    const line = lines.find(l => Math.abs(l.y - it.y) <= 3)
    if (line) line.items.push(it)
    else lines.push({ y: it.y, items: [it] })
  }
  return lines.map(l => {
    const sorted = l.items.sort((a, b) => a.x - b.x)
    let out = ''
    let prevEnd = -Infinity
    for (const it of sorted) {
      const gap = it.x - prevEnd
      out += out && gap > 1 ? ' ' + it.str : it.str
      prevEnd = it.x + it.w
    }
    return out.replace(/\s+/g, ' ').trim()
  })
}
