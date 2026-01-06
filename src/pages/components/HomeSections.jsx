import { useState, useEffect, useRef } from 'react';
import styles from './HomeSections.module.scss';

export default function HomeSections() {
  const [sections, setSections] = useState([]);
  const [currentSlides, setCurrentSlides] = useState({});
  const carouselRefs = useRef({});

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/home-sections');
      const data = await response.json();
      if (data.success) {
        setSections(data.sections);
        // Initialize slide indexes
        const initialSlides = {};
        data.sections.forEach(section => {
          if (section.layoutType === 'slider') {
            initialSlides[section.id] = 0;
          }
        });
        setCurrentSlides(initialSlides);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const intervals = [];

    sections.forEach(section => {
      if (section.layoutType === 'slider' && section.autoplay) {
        const interval = setInterval(() => {
          setCurrentSlides(prev => ({
            ...prev,
            [section.id]: (prev[section.id] + 1) % section.images.length
          }));
        }, section.interval || 3000);
        intervals.push(interval);
      }
    });

    return () => intervals.forEach(clearInterval);
  }, [sections]);

  const goToSlide = (sectionId, index) => {
    setCurrentSlides(prev => ({
      ...prev,
      [sectionId]: index
    }));
  };

  const nextSlide = (sectionId, totalImages) => {
    setCurrentSlides(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] + 1) % totalImages
    }));
  };

  const prevSlide = (sectionId, totalImages) => {
    setCurrentSlides(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] - 1 + totalImages) % totalImages
    }));
  };

  const renderSlider = (section) => {
    const currentIndex = currentSlides[section.id] || 0;

    return (
      <div className={styles.sliderContainer}>
        <div className={styles.sliderWrapper}>
          {section.images.map((image, index) => (
            <div
              key={index}
              className={`${styles.slide} ${
                index === currentIndex ? styles.active : ''
              }`}
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={`${section.title} ${index + 1}`} />
            </div>
          ))}
        </div>

        <button
          type="button"
          className={`${styles.navBtn} ${styles.prevBtn}`}
          onClick={() => prevSlide(section.id, section.images.length)}
        >
          ‹
        </button>
        <button
          type="button"
          className={`${styles.navBtn} ${styles.nextBtn}`}
          onClick={() => nextSlide(section.id, section.images.length)}
        >
          ›
        </button>

        <div className={styles.dots}>
          {section.images.map((_, index) => (
            <button
              type="button"
              key={index}
              className={`${styles.dot} ${
                index === currentIndex ? styles.active : ''
              }`}
              onClick={() => goToSlide(section.id, index)}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderGrid = (section) => {
    return (
      <div
        className={styles.gridContainer}
        style={{
          gridTemplateColumns: `repeat(${section.columns || 3}, 1fr)`,
        }}
      >
        {section.images.map((image, index) => (
          <div key={index} className={styles.gridItem}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={`${section.title} ${index + 1}`} />
          </div>
        ))}
      </div>
    );
  };

  const renderMasonry = (section) => {
    return (
      <div className={styles.masonryContainer}>
        {section.images.map((image, index) => (
          <div key={index} className={styles.masonryItem}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={`${section.title} ${index + 1}`} />
          </div>
        ))}
      </div>
    );
  };

  const renderCarousel = (section) => {
    const scroll = (direction, sectionId) => {
      const scrollRef = carouselRefs.current[sectionId];
      if (scrollRef) {
        const scrollAmount = direction === 'left' ? -300 : 300;
        scrollRef.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };

    return (
      <div className={styles.carouselContainer}>
        <button
          type="button"
          className={`${styles.carouselBtn} ${styles.carouselPrev}`}
          onClick={() => scroll('left', section.id)}
        >
          ‹
        </button>
        <div 
          className={styles.carouselWrapper} 
          ref={(el) => { carouselRefs.current[section.id] = el; }}
        >
          {section.images.map((image, index) => (
            <div key={index} className={styles.carouselItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={`${section.title} ${index + 1}`} />
            </div>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.carouselBtn} ${styles.carouselNext}`}
          onClick={() => scroll('right', section.id)}
        >
          ›
        </button>
      </div>
    );
  };

  const renderSection = (section) => {
    switch (section.layoutType) {
      case 'grid':
        return renderGrid(section);
      case 'masonry':
        return renderMasonry(section);
      case 'carousel':
        return renderCarousel(section);
      case 'slider':
      default:
        return renderSlider(section);
    }
  };

  if (sections.length === 0) return null;

  return (
    <div className={styles.homeSections}>
      {sections.map((section) => (
        <section key={section.id} className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            {renderSection(section)}
          </div>
        </section>
      ))}
    </div>
  );
}
