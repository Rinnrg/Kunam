import { useRef } from 'react';

import InfiniteText from '@src/components/animationComponents/infiniteText/Index';
import clsx from 'clsx';
import { gsap } from 'gsap';
import styles from '@src/pages/components/home/styles/home.module.scss';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';

function Home() {
  const rootRef = useRef();
  const infiniteTextRef = useRef();

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top+=3%',
            end: 'top+=5%',
            toggleActions: 'play none reverse none',
            scroller: document.querySelector('main'),
            invalidateOnRefresh: true,
          },
        })
        .to(infiniteTextRef.current, {
          opacity: 0,
          duration: 0.6,
        });
    });

    return () => ctx.kill();
  }, []);

  return (
    <section ref={rootRef} className={clsx(styles.root)}>
      <div className={clsx(styles.centerContainer)}>
        <h2 className="h2">Elevate Your</h2>
        <h2 className={clsx('h2', 'bold')}>Style Statement</h2>
        <p className={styles.subtitle}>Discover premium clothing that defines your unique identity</p>
        <div className={styles.ctaContainer}>
          <button type="button" className={styles.primaryButton}>Shop Collection</button>
          <button type="button" className={styles.secondaryButton}>View Lookbook</button>
        </div>
      </div>

      <div ref={infiniteTextRef} className={styles.infiniteContainer}>
        <InfiniteText text="New Arrivals — Limited Edition" length={5} />
      </div>
    </section>
  );
}

export default Home;
