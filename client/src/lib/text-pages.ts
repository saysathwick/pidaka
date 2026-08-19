export const TEXT_LIMIT = 3000;
export const CARD_PAGE_SIZE = 500;

export function paginateText(text: string, pageSize = CARD_PAGE_SIZE): string[] {
  if (!text) return [""];
  if (text.length <= pageSize) return [text];

  const pages: string[] = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + pageSize, text.length);
    if (end < text.length) {
      const slice = text.slice(i, end);
      const breakAt = Math.max(slice.lastIndexOf("\n"), slice.lastIndexOf(" "));
      if (breakAt >= Math.floor(pageSize * 0.55)) {
        end = i + breakAt + 1;
      }
    }
    const page = text.slice(i, end);
    if (page.length) pages.push(page);
    i = end;
  }
  return pages.length ? pages : [text];
}
