import { useRef } from 'react';

import FloatingMeshes from '@src/pages/components/home/components/floatingMeshes/Index';
import InfiniteText from '@src/components/animationComponents/infiniteText/Index';
import clsx from 'clsx';
import { gsap } from 'gsap';
import styles from '@src/pages/components/home/styles/home.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';

function Home() {
  const isMobile = useIsMobile();
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
      <div className={clsx(styles.topContainer, 'layout-grid-inner')}>
        <div className={styles.leftContainer}>
          <h2 className="h2">Remarkable</h2>
          <h2 className={clsx('h2', 'bold')}>Virtual Experiences</h2>
        </div>
        {!isMobile && (
          <h6 className={clsx('h6', styles.rightContainer)}>
            With years of experience, I create immersive digital environments that elevate your virtual presence. Join me in redefining digital interaction.
          </h6>
        )}
      </div>

      <div className={styles.bottomContainer}>
        <FloatingMeshes />
      </div>
      {isMobile && (
        <div className={styles.rightContainerMobile}>
          <h6 className="h6"> With years of experience, I create immersive digital environments that elevate your virtual presence. Join me in redefining digital interaction.</h6>
        </div>
      )}

      <div ref={infiniteTextRef} className={styles.infiniteContainer}>
        <InfiniteText text="Scroll Down" length={5} />
      </div>
    </section>
  );
}

export default Home;
