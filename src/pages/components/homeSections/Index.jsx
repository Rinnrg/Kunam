import { useRef } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { gsap } from 'gsap';
import styles from '@src/pages/components/homeSections/styles/homeSections.module.scss';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import AppearTitle from '@src/components/animationComponents/appearTitle/Index';

function HomeSections({ sections }) {
  const rootRef = useRef();

  useIsomorphicLayoutEffect(() => {
    if (!rootRef.current) {
      return undefined;
    }
    
    const ctx = gsap.context(() => {
      const cards = rootRef.current?.querySelectorAll(`.${styles.imageCard}`);
      
      if (!cards || cards.length === 0) return;
      
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 50,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: index * 0.1,
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              end: 'top 60%',
              toggleActions: 'play none none reverse',
              scroller: document.querySelector('main'),
            },
          }
        );
      });
    }, rootRef);

    return () => {
      ctx.kill();
    };
  }, [sections]);

  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div ref={rootRef} className={clsx(styles.root)}>
      {sections.map((section) => (
        <div key={section.id} className={styles.section}>
          <AppearTitle>
            <h2 className={styles.sectionTitle}>{section.judul}</h2>
          </AppearTitle>
          <div className={styles.imageGrid}>
            {section.gambar.map((image, index) => (
              <div key={index} className={styles.imageCard}>
                <Image
                  src={image}
                  alt={`${section.judul} - Image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  quality={85}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default HomeSections;
