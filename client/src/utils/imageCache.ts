// Resolved candidate URLs of images that have finished loading — nothing
// speculative goes in. Both writers record the browser's own currentSrc:
// usePrefetch from its detached warm-up image, ImageGallery from its rendered
// one. The reader (ImageGallery's mount-time seeding) has to predict which
// candidate a gallery will request, so it can be wrong — but a mispredict only
// costs an extra pulse, never a false hit. Writing a URL before its bytes
// arrive is what turns that into a gallery showing an empty box for a whole
// download, so keep the load handler the only writer.
export const loadedUrlCache = new Set<string>();
