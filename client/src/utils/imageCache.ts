// Shared between usePrefetch (writer) and ImageGallery (reader): entries are
// exact thumbnailUrl() strings plus the browser's currentSrc, so both sides
// must build URLs identically or hits silently miss (skeleton re-flash).
export const loadedUrlCache = new Set<string>();
