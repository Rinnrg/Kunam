/* eslint-disable react/jsx-props-no-spreading */

import '@src/styles/global.scss';
import '@src/styles/global.css';

import * as THREE from 'three';

import { useMemo, useRef } from 'react';

import { Analytics } from '@vercel/analytics/react';
import Background from '@src/components/canvas/background/Index';
import { Canvas } from '@react-three/fiber';
import Layout from '@src/components/dom/Layout';
import Lenis from 'lenis';
import Loader from '@src/components/dom/Loader';
import Navbar from '@src/components/dom/navbar/Index';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Scrollbar from '@src/components/dom/Scrollbar';
import { SessionProvider } from 'next-auth/react';
import Tempus from '@darkroom.engineering/tempus';
import { View } from '@react-three/drei';
import { gsap } from 'gsap';
import styles from '@src/pages/app.module.scss';
import useFoucFix from '@src/hooks/useFoucFix';
import { useFrame } from '@darkroom.engineering/hamo';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import useScroll from '@src/hooks/useScroll';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

if (typeof window !== 'undefined') {
  gsap.defaults({ ease: 'none' });
  gsap.registerPlugin(ScrollTrigger);

  gsap.ticker.lagSmoothing(0);
  gsap.ticker.remove(gsap.updateRoot);
  Tempus?.add((time) => {
    gsap.updateRoot(time / 1000);
  }, 0);

  window.scrollTo(0, 0);
  window.history.scrollRestoration = 'manual';
  ScrollTrigger.clearScrollMemory(window.history.scrollRestoration);
}

function MyApp({ Component, pageProps, router }) {
  const [lenis, setLenis, isAbout] = useStore(useShallow((state) => [state.lenis, state.setLenis, state.isAbout]));

  const mainRef = useRef();
  const mainContainerRef = useRef();
  const layoutRef = useRef();

  // Check if current page is admin page
  const isAdminPage = router.pathname.startsWith('/admin');

  useFoucFix();
  useScroll(() => {
    if (!isAdminPage) {
      ScrollTrigger.update();
    }
  });

  useIsomorphicLayoutEffect(() => {
    // Skip Lenis for admin pages
    if (isAdminPage) return undefined;
    
    // eslint-disable-next-line no-shadow
    const lenis = new Lenis({
      smoothWheel: true,
      smoothTouch: false,
      syncTouch: false,
      lerp: 0.1,
      duration: 1.2,
      wrapper: mainRef.current || undefined,
      content: mainContainerRef.current || undefined,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    setLenis(lenis);
    lenis.stop();

    return () => {
      lenis.destroy();
      setLenis(null);
    };
  }, [isAdminPage]);

  useIsomorphicLayoutEffect(() => {
    if (lenis) {
      ScrollTrigger.refresh();
    }
  }, [lenis]);

  useFrame((time) => {
    if (lenis) {
      lenis.raf(time);
    }
  }, 0);

  const domElements = useMemo(
    () => (
      <>
        {!isAdminPage && <Loader />}
        {!isAdminPage && (
          <div className={styles.background}>
            <Background />
          </div>
        )}
        {!isAdminPage && <Scrollbar />}
        {!isAdminPage && <Navbar />}
        <Analytics />
      </>
    ),
    [isAdminPage],
  );

  const canvasElements = useMemo(() => {
    if (isAdminPage) return null;

    return (
      <Canvas
        gl={{
          pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.5) : 1,
          outputColorSpace: isAbout === false ? THREE.LinearSRGBColorSpace : THREE.SRGBColorSpace,
          antialias: false,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
        }}
        style={{ zIndex: 0 }}
        resize={{ debounce: { resize: 50, scroll: 50 }, polyfill: undefined }}
        className={styles.canvasContainer}
        dpr={[1, 1.5]}
      >
        <View.Port />
      </Canvas>
    );
  }, [isAbout, isAdminPage]);

  // Render admin pages with minimal wrapper
  if (isAdminPage) {
    return (
      <SessionProvider session={pageProps.session}>
        <Component {...pageProps} />
      </SessionProvider>
    );
  }

  return (
    <SessionProvider session={pageProps.session}>
      <div className={styles.root}>
        {domElements}
        <div ref={layoutRef} id="layout" className={styles.layout}>
          {canvasElements}
          <main ref={mainRef} className={styles.main}>
            <div ref={mainContainerRef} id="mainContainer" className={styles.mainContainer}>
              <Layout layoutRef={layoutRef} mainRef={mainRef} router={router}>
                <Component {...pageProps} />
              </Layout>
            </div>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}

export default MyApp;
