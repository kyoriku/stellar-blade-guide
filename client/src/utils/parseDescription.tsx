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
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {match[2]}
        </PrefetchableLink>
      );
    }
    return part;
  });
}
