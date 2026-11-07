import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { isValidGalleryImage } from '../utils/image'

// The image lightbox on the level, type and walkthrough pages: one slide per
// thumbnail the page shows, in page order, opened on the thumbnail clicked. A
// click names its gallery and its position there, never a URL: entries share
// screenshots on purpose (shop entries share the merchant and map shots, some
// grouped pickups share one shot), so one file can sit on dozens of cards, and
// the old lookup by URL opened every copy at the first card that used it.

/** The two fields a gallery reads from an image; collectible and walkthrough images both have them. */
interface GalleryImage {
  url: string;
  alt: string;
}

/** One lightbox slide: the full-size file and its alt. */
export interface LightboxSlide {
  src: string;
  alt: string;
}

/**
 * One gallery on a page, in page order. `key` is what the gallery reports with a
 * click: a collectible's id on the level and type pages, where each collectible
 * shows once (the id is already its card's React key), and a section's index on
 * a walkthrough page, where nothing else is unique (an image's `order` only
 * counts within its section).
 */
export interface GallerySource {
  key: number;
  images: readonly GalleryImage[];
}

/** A thumbnail click: its gallery's key and its position among the images that gallery shows. */
export type ImageClickHandler = (galleryKey: number, position: number) => void;

export interface PageSlides {
  slides: LightboxSlide[];
  /** Each gallery's first slide and slide count, by key. */
  galleries: ReadonlyMap<number, { start: number; count: number }>;
}

/**
 * One slide per thumbnail the page shows, in page order. A gallery's thumbnails
 * are its images that pass isValidGalleryImage, the filter ImageGallery lays them
 * out from, so a thumbnail's position there is its slide's place in the run.
 */
export function buildPageSlides(galleries: readonly GallerySource[]): PageSlides {
  const slides: LightboxSlide[] = [];
  const byKey = new Map<number, { start: number; count: number }>();
  for (const { key, images } of galleries) {
    const shown = images.filter(isValidGalleryImage);
    if (shown.length === 0) continue; // ImageGallery renders nothing for it
    // A key seen twice can't tell its clicks apart, so the first gallery keeps it.
    // No page repeats one; both galleries' slides stay, as the page shows both.
    if (!byKey.has(key)) byKey.set(key, { start: slides.length, count: shown.length });
    for (const image of shown) slides.push({ src: image.url, alt: image.alt });
  }
  return { slides, galleries: byKey };
}

/** The slide a click opens, or null when the page shows no such thumbnail, so nothing opens. */
export function slideIndex(page: PageSlides, galleryKey: number, position: number): number | null {
  const gallery = page.galleries.get(galleryKey);
  if (!gallery || !Number.isInteger(position) || position < 0 || position >= gallery.count) return null;
  return gallery.start + position;
}

// Each page's galleries, walked in the order its JSX renders them, from the value
// its JSX maps over (after its filters and sort). Module-level on purpose:
// usePageLightbox memoizes on the walker, and an inline arrow would rebuild the
// slides on every render.

type CardLike = { id: number; images?: readonly GalleryImage[] };
type LocationLike = { collectibles: readonly CardLike[] };

/** A level page: location by location, card by card. */
export function levelPageGalleries(locations: readonly LocationLike[]): GallerySource[] {
  return locations.flatMap(location =>
    location.collectibles.map(card => ({ key: card.id, images: card.images ?? [] })));
}

/** A type page: level by level, then as a level page. A-Z is one level holding one location. */
export function typePageGalleries(levels: readonly { locations: readonly LocationLike[] }[]): GallerySource[] {
  return levels.flatMap(level => levelPageGalleries(level.locations));
}

/** A walkthrough page: section by section, keyed by index. None before it loads. */
export function walkthroughGalleries(
  sections: readonly { images?: readonly GalleryImage[] }[] | undefined,
): GallerySource[] {
  return (sections ?? []).map((section, index) => ({ key: index, images: section.images ?? [] }));
}

/**
 * A page's lightbox. Pass the value the page's JSX maps its galleries from (after
 * its filters and sort) and that page's walker above; hand `onImageClick` to the
 * galleries and the `lightbox` fields to <Lightbox>.
 *
 * Both arguments must keep their identity between renders (the page's useMemo or
 * the query's data, and a module-level walker): a new slides array sends an open
 * lightbox back to the slide it opened on.
 */
export function usePageLightbox<T>(rendered: T, galleriesOf: (rendered: T) => readonly GallerySource[]) {
  const page = useMemo(() => buildPageSlides(galleriesOf(rendered)), [rendered, galleriesOf]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // A Back or Forward between two pages of one kind keeps the page mounted (its
  // route has no key), so the lightbox closes when the path changes, during the
  // render that brings the next page's slides. The path lives in state, not a
  // ref, as the pages' filtersFor does: React may set aside a render it has
  // started. It closes at once, without the library's fade.
  const { pathname } = useLocation();
  const [pathFor, setPathFor] = useState(pathname);
  if (pathname !== pathFor) {
    setPathFor(pathname);
    setOpen(false);
  }

  // The click handler reads the slides of the last commit, the thumbnails on
  // screen, through a ref set in a layout effect: never during render, which React
  // may set aside, and not in a passive effect, which can run after a click. So the
  // handler keeps one identity, and memo(CollectibleSection) and memo(ImageGallery)
  // bail out on a filter, sort or data change as well as on a progress toggle.
  const committed = useRef(page);
  useLayoutEffect(() => {
    committed.current = page;
  }, [page]);

  const onImageClick = useCallback<ImageClickHandler>((galleryKey, position) => {
    const slide = slideIndex(committed.current, galleryKey, position);
    if (slide === null) return;
    setIndex(slide);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return { onImageClick, lightbox: { open, close, slides: page.slides, index } };
}
