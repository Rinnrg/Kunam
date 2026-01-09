import Image from 'next/image';
import clsx from 'clsx';
import gsap from 'gsap';
import styles from '@src/components/dom/styles/loader.module.scss';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import { useRef } from 'react';
import { useRouter } from 'next/router';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

function Loader() {
  const [lenis, introOut, setIntroOut, setIsLoading, setIsAbout] = useStore(useShallow((state) => [state.lenis, state.introOut, state.setIntroOut, state.setIsLoading, state.setIsAbout]));

  const logoRef = useRef(null);
  const root = useRef(null);
  const router = useRouter();

  useIsomorphicLayoutEffect(() => {
    let ctx;
    if (!introOut) {
      setIsAbout(router.asPath === '/about');

      // Detect mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileDevice = isMobile || isTouch;

      ctx = gsap.context(() => {
        // Simple fade out animation
        const introDelay = isMobileDevice ? 0.2 : 0.3; // Reduced delay

        gsap.delayedCall(introDelay, () => {
          console.log('Loader animation starting...');
          
          // Immediately disable loader pointer events and lower z-index
          if (root.current) {
            root.current.style.pointerEvents = 'none';
            root.current.style.zIndex = '-1';
            console.log('Loader pointer-events disabled and z-index lowered immediately');
          }
          
          // Check if lenis exists before calling methods
          if (lenis && typeof lenis.scrollTo === 'function') {
            lenis.scrollTo(0, { force: true });
            console.log('Lenis scrollTo(0) called');
          } else {
            console.warn('Lenis not available in Loader');
          }
          
          // Set initial states - ensure page is interactive IMMEDIATELY
          gsap.set('main', {
            opacity: 1,
            pointerEvents: 'auto',
            zIndex: 1,
          });
          
          // Set body to be interactive
          gsap.set('body', {
            pointerEvents: 'auto',
            overflow: 'auto',
          });
          
          console.log('Main and body set to interactive');

          // Immediately disable loader pointer events before animation
          if (root.current) {
            root.current.style.pointerEvents = 'none';
            console.log('Loader pointer-events disabled immediately');
          }
          
          // Faster fade out loader
          gsap.to(root.current, {
            opacity: 0,
            duration: 0.3, // Reduced from 0.6 to 0.3
            ease: 'power2.out',
            onStart: () => {
              // Disable pointer events at animation start
              if (root.current) {
                root.current.style.pointerEvents = 'none';
              }
            },
            onComplete: () => {
              console.log('Loader animation complete!');
              
              // Start lenis BEFORE setting introOut
              if (lenis && typeof lenis.start === 'function') {
                lenis.start();
                console.log('Lenis started from Loader');
              } else {
                console.warn('Lenis not available to start');
              }
              
              // Ensure everything is interactive
              gsap.set(['main', 'body', '#mainContainer'], {
                pointerEvents: 'auto',
              });
              
              console.log('All elements set to interactive');
              
              // Now set state to remove loader from DOM
              setIntroOut(true);
              setIsLoading(false);
              
              console.log('Loader removed from DOM');
            },
          });
        });
      });
    } else if (ctx) {
      ctx.kill();
    }

    return () => {
      if (ctx) {
        ctx.kill();
      }
    };
  }, [lenis, introOut]);

  return !introOut ? (
    <div id="loader" ref={root} className={clsx(styles.root, 'layout-block-inner')}>
      <div className={styles.innerContainer}>
        <div className={styles.fullNameContainer}>
          <div ref={logoRef} style={{ display: 'flex', justifyContent: 'center' }}>
            <Image src="/logo/logo 1 black.svg" alt="Kunam" width={100} height={40} priority />
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
export default Loader;
