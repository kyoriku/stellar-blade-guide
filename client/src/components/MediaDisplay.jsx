import React, { useEffect } from 'react';
import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';

const MediaDisplay = ({ title, text, images, showHr, addBottomMargin }) => {
  useEffect(() => {
    const lightbox = GLightbox({
      selector: '.glightbox',
      loop: true,
      touchNavigation: true,
      closeButton: true,
      arrows: true,
    });

    return () => {
      lightbox.destroy();
    };
  }, []);

  const renderText = () => {
    if (Array.isArray(text)) {
      return (
        <div>
          <strong>{title}</strong>
          <ul>
            {text.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <p>
        <strong>{title}</strong>
        <span> &#8211; </span>
        {text}
      </p>
    );
  };

  const renderImages = () => {
    if (images.length >= 4) {
      return (
        <div>
          <table>
            <tbody>
              <tr>
                <td className="px-1 px-md-2 pb-2 pb-md-3">
                  <a href={images[0].src} className="glightbox" data-gallery="gallery1">
                    <img
                      src={images[0].src}
                      alt={images[0].alt}
                      className="img-fluid rounded"
                      loading='lazy'
                      width='443'
                      height='249.19'
                    />
                  </a>
                </td>
                <td className="px-1 px-md-2 pb-2 pb-md-3">
                  <a href={images[1].src} className="glightbox" data-gallery="gallery1">
                    <img
                      src={images[1].src}
                      alt={images[1].alt}
                      className="img-fluid rounded"
                      loading='lazy'
                      width='443'
                      height='249.19'
                    />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          <table>
            <tbody>
              <tr>
                {images.slice(2).map((image) => (
                  <td key={image.id} className="px-1 px-md-2">
                    <a href={image.src} className="glightbox" data-gallery="gallery1">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className={`img-fluid rounded ${addBottomMargin ? 'mb-3' : ''}`}
                        loading='lazy'
                        width='443'
                        height='249.19'
                      />
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <table>
        <tbody>
          <tr>
            {images.map((image) => (
              <td key={image.id} className="px-1 px-md-2 py-0">
                <a href={image.src} className="glightbox" data-gallery="gallery1">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className={`img-fluid rounded img-bg ${addBottomMargin ? 'mb-3' : ''}`}
                    loading='lazy'
                    width='902'
                    height='507.38'
                  />
                </a>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <div>
      {/* {renderText()} */}
      {renderImages()}
      {showHr && <hr />}
    </div>
  );
};

export default MediaDisplay;
