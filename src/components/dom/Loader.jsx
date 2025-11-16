import Image from 'next/image';
import SplitType from 'split-type';
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
  const shortNameRef = useRef(null);
  const root = useRef(null);
  const router = useRouter();

  useIsomorphicLayoutEffect(() => {
    let ctx;
    if (!introOut) {
      setIsAbout(router.asPath === '/about');

      ctx = gsap.context(() => {
        gsap.delayedCall(3, () => {
          gsap.set('header', {
            autoAlpha: 0,
            ease: 'power2.inOut',
          });

          // Animate logo out
          gsap.to(logoRef.current, {
            ease: 'power4.inOut',
            y: '-12vw',
            opacity: 0,
            duration: 1,
          });

          // Animate "Stand Out Loud" text in
          gsap.to(shortNameRef.current, {
            opacity: 1,
            delay: 0.3,
          });
          const splittedShort = new SplitType(shortNameRef.current, {
            types: 'lines',
            tagName: 'span',
          });
          splittedShort.lines.forEach((line) => {
            gsap.to(line, {
              ease: 'power4.inOut',
              top: '0px',
              duration: 1,
            });
          });

          lenis.scrollTo(0, { force: true });
          gsap.set(document?.getElementById('layout'), {
            height: '90%',
          });

          gsap.set('main', {
            x: '100%',
            scale: 0.9,
            opacity: 1,
            border: '2px solid #f0f4f1',
            borderRadius: '1.3888888889vw',
          });

          gsap.to(root.current, {
            scale: 0.9,
            ease: 'power2.inOut',
            delay: 0.8,
            duration: 0.5,
            borderRadius: '1.3888888889vw',
          });
          gsap.to(root.current, {
            ease: 'power2.inOut',
            delay: 1.7,
            duration: 0.5,
            x: '-100%',
          });

          gsap.to('main', {
            ease: 'power2.inOut',
            delay: 1.7,
            duration: 0.5,
            x: '0px',
          });
          gsap.to('main', {
            ease: 'power2.inOut',
            delay: 2.2,
            duration: 0.5,
            scale: 1,
            borderRadius: 0,
          });
          gsap.to(document?.getElementById('layout'), {
            ease: 'power2.inOut',
            delay: 2.2,
            duration: 0.5,
            height: '100%',
          });
          gsap.to('header', {
            delay: 2.3,
            duration: 0.5,
            ease: 'power2.inOut',
            autoAlpha: 1,
          });
          gsap.to('main', {
            ease: 'power2.inOut',
            delay: 2.7,
            height: 'auto',
            border: 'none',
            pointerEvents: 'auto',
            onComplete: () => {
              setIntroOut(true);
              setIsLoading(false);
              lenis.start();
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

  return (
    <div id="loader" ref={root} className={clsx(styles.root, 'layout-block-inner')}>
      <div className={styles.innerContainer}>
        {!introOut && (
          <div className={styles.fullNameContainer}>
            <div ref={logoRef} style={{ display: 'flex', justifyContent: 'center' }}>
              <Image src="/logo/logo 1 black.svg" alt="Kunam" width={200} height={80} priority />
            </div>
          </div>
        )}

        {introOut && (
          <div className={styles.fullNameContainer}>
            <h2 className={clsx(styles.fullName, 'h2')}>Loading</h2>
          </div>
        )}

        {!introOut && (
          <div className={styles.shortNameContainer}>
            <h2 ref={shortNameRef} className={clsx(styles.shortName, 'h2')}>
              Stand Out Loud
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}
export default Loader;
