import { useEffect, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import { Loader2 } from 'lucide-react'
import type { LightboxSlide } from '../hooks/usePageLightbox'

// The image lightbox on the level, type and walkthrough pages, in one place so the
// three keep the same settings. Each page passes it usePageLightbox's `lightbox`
// fields: <PageLightbox {...lightbox} />. Below 768px wide its slides lose their padding.

interface PageLightboxProps {
  open: boolean;
  close: () => void;
  slides: LightboxSlide[];
  index: number;
}

export default function PageLightbox({ open, close, slides, index }: PageLightboxProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Lightbox
      open={open}
      close={close}
      slides={slides}
      index={index}
      plugins={[Zoom]}
      zoom={{ scrollToZoom: true }}
      controller={{ closeOnBackdropClick: true }}
      animation={{ fade: 150, swipe: 150 }}
      // preload 1, not the library default of 2: slides are the full-size
      // WebP files (3840x2160, ~33MB each once decoded), so the default's
      // five-slide window costs ~166MB. These URLs are never shared with the
      // gallery tiles, which load -w variants, so each preloaded slide is a
      // cold fetch too. Keep padding in this same object: a bare
      // carousel={{ preload: 1 }} would drop the override.
      carousel={{ preload: 1, padding: isMobile ? "0%" : "4%" }}
      styles={{
        container: {
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(5px)"
        }
      }}
      render={{
        iconLoading: () => <Loader2 className="w-10 h-10 text-white animate-spin" />,
      }}
    />
  );
}
