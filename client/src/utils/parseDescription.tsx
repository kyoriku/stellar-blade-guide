import PrefetchableLink from "../components/PrefetchableLink";

export function parseDescription(text: string) {
  const parts = text.split(/(\[\[.*?\]\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[\[(.+?)\|(.+?)\]\]$/);
    if (match) {
      return (
        <PrefetchableLink
          key={i}
          to={`/${match[1]}`}
          className="text-cyan-400 underline decoration-cyan-400/30 underline-offset-2 hover:decoration-cyan-400 transition-colors"
        >
          {match[2]}
        </PrefetchableLink>
      );
    }
    return part;
  });
}
