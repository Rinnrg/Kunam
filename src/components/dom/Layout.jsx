import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Transition as ReactTransition, SwitchTransition } from 'react-transition-group';

import Footer from '@src/components/dom/Footer';
import PreFooter from '@src/components/dom/PreFooter';
import gsap from 'gsap';
import styles from '@src/components/dom/styles/layout.module.scss';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

function Layout({ children, layoutRef, mainRef, router }) {
  const [lenis, introOut, setIsLoading, isMenuOpen, setIsMenuOpen, setIsAbout] = useStore(
    useShallow((state) => [state.lenis, state.introOut, state.setIsLoading, state.isMenuOpen, state.setIsMenuOpen, state.setIsAbout]),
  );

  const enterTimelineRef = useRef();
  const exitTimelineRef = useRef();

  const [isEntering, setIsEntering] = useState(false);

  const menuTime = useMemo(() => (isMenuOpen ? 0.8 : 0), [isMenuOpen]);

  // Check if current page is admin page (login or dashboard)
  const isAdminPage = useMemo(() => router.asPath.startsWith('/admin'), [router.asPath]);

  const handleEnter = useCallback(
    () => {
      if (introOut) {
        if (exitTimelineRef.current) exitTimelineRef.current.pause();

        const tl = gsap.timeline({
          onComplete: () => {
            setIsAbout(router.asPath === '/about');
            setIsLoading(false);
            // Check if lenis exists and has start method before calling
            if (lenis && typeof lenis.start === 'function') {
              lenis.start();
            }
          },
        });

        enterTimelineRef.current = tl;
        setIsEntering(true);

        // Simple fade in transition
        tl.to(
          layoutRef.current,
          {
            opacity: 1,
            duration: 0.4,
            ease: 'power2.inOut',
            onComplete: () => {
              setIsAbout(router.asPath === '/about');
              setIsEntering(false);
            },
          },
          0,
        )
          .to(
            '#loader',
            {
              opacity: 0,
              duration: 0.3,
              ease: 'power2.inOut',
            },
            0,
          )
          .to(
            'header',
            {
              opacity: 1,
              duration: 0.3,
              ease: 'power2.inOut',
            },
            0.2,
          )
          .set(
            mainRef.current,
            {
              pointerEvents: 'auto',
            },
            0.4,
          );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [introOut],
  );

  const handleExit = useCallback(
    () => {
      if (introOut) {
        if (enterTimelineRef.current) enterTimelineRef.current.pause();

        // Check if lenis exists and has stop method before calling
        if (lenis && typeof lenis.stop === 'function') {
          lenis.stop();
        }
        if (isMenuOpen) {
          setIsMenuOpen(false);
        }
        if (isEntering === false) {
          const tl = gsap.timeline({
            onComplete: () => {
              setIsLoading(true);
              // Check if lenis exists and has scrollTo method before calling
              if (lenis && typeof lenis.scrollTo === 'function') {
                lenis.scrollTo(0, { force: true });
              }
            },
          });

          exitTimelineRef.current = tl;

          // Simple fade out transition
          if (document?.getElementById('scrollbar')) {
            tl.to(
              document.getElementById('scrollbar'),
              {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.inOut',
              },
              menuTime,
            );
          }

          tl.to(
            'header',
            {
              opacity: 0,
              duration: 0.3,
              ease: 'power2.inOut',
            },
            menuTime,
          )
            .to(
              layoutRef.current,
              {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.inOut',
              },
              menuTime,
            )
            .set('#loader', {
              opacity: 1,
            })
            .set('header', {
              left: 0,
              top: 0,
              scale: 1,
            });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [introOut, menuTime, isEntering],
  );

  // If admin page, render without layout animations and footer
  if (isAdminPage) {
    return children;
  }

  return (
    <>
      <SwitchTransition>
        <ReactTransition
          key={router.asPath}
          in={false}
          unmountOnExit
          timeout={{
            enter: introOut ? 500 : 0,
            exit: introOut ? 400 : 0,
          }}
          onEnter={handleEnter}
          onExit={handleExit}
        >
          {children}
        </ReactTransition>
      </SwitchTransition>

      <PreFooter />
      <footer className={styles.footer}>
        <Footer />
      </footer>
    </>
  );
}

export default Layout;
