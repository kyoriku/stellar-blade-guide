// utils/parseDescription.ts
import { Link } from 'react-router-dom'

export function parseDescription(text: string) {
  const parts = text.split(/(\[\[.*?\]\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[\[(.+?)\|(.+?)\]\]$/);
    if (match) {
      return <Link key={ i } to = {`/${match[1]}`
    } className = "text-cyan-400 hover:text-cyan-300 transition-colors" > { match[2]} </Link>;
  }
    return part;
});
}