export function thumbnailUrl(url: string, width = 1200): string {
  return url.replace('/upload/f_webp,q_auto/', `/upload/f_webp,q_auto,w_${width}/`);
}
