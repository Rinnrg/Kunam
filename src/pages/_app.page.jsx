/* eslint-disable react/jsx-props-no-spreading */

import '@src/styles/global.scss';
import '@src/styles/global.css';

import * as THREE from 'three';

import { useMemo, useRef, useEffect } from 'react';

import { Analytics } from '@vercel/analytics/react';
import Background from '@src/components/canvas/background/Index';
import { Canvas } from '@react-three/fiber';
import Layout from '@src/components/dom/Layout';
import Lenis from 'lenis';
import Loader from '@src/components/dom/Loader';
import Navbar from '@src/components/dom/navbar/Index';
import MenuLinks from '@src/components/dom/navbar/components/MenuLinks';
import AlertDialog from '@src/components/dom/AlertDialog';
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
  const [lenis, setLenis, isAbout, alertDialog, hideAlert] = useStore(useShallow((state) => [state.lenis, state.setLenis, state.isAbout, state.alertDialog, state.hideAlert]));

  const mainRef = useRef();
  const mainContainerRef = useRef();
  const layoutRef = useRef();
  const transitionOverlayRef = useRef();
  // Check if current page is admin page
  const isAdminPage = router.pathname.startsWith('/admin');
  const isLoginPage = router.pathname === '/login';

  useFoucFix();
  useScroll(() => {
    if (!isAdminPage) {
      ScrollTrigger.update();
    }
  });

  useIsomorphicLayoutEffect(() => {
    // Skip Lenis for admin pages
    if (isAdminPage) return undefined;

    // Check if it's a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // eslint-disable-next-line no-shadow
    const lenis = new Lenis({
      smoothWheel: true,
      smoothTouch: isMobile || isTouch, // Enable smooth touch for all touch devices
      syncTouch: isMobile || isTouch,   // Sync touch events on mobile/touch devices
      lerp: isMobile ? 0.08 : 0.1,      // Slightly lower lerp for mobile for better control
      duration: isMobile ? 1.0 : 1.2,    // Faster duration for mobile
      wrapper: mainRef.current || undefined,
      content: mainContainerRef.current || undefined,
      wheelMultiplier: 1,
      touchMultiplier: isMobile ? 1.2 : 2,  // Adjusted for better mobile experience
      infinite: false,
      normalizeWheel: true,
    });

    setLenis(lenis);
    
    // Start immediately for testing - remove stop
    // lenis.stop();
    
    // Safeguard: Ensure lenis starts
    setTimeout(() => {
      if (lenis) {
        console.log('Starting Lenis from timeout');
        lenis.start();
      }
    }, 100);
    
    // Safeguard: Start lenis after 3 seconds if loader doesn't start it
    const fallbackTimer = setTimeout(() => {
      if (lenis && !lenis.isScrolling) {
        console.log('Fallback: Starting Lenis');
        lenis.start();
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
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

  // Page Transition Effect
  useEffect(() => {
    const overlay = transitionOverlayRef.current;
    if (!overlay) return;

    // Initial page load - fade in from white
    gsap.fromTo(
      overlay,
      { opacity: 1 },
      { 
        opacity: 0, 
        duration: 0.6, 
        ease: 'power2.out',
        delay: 0.1
      }
    );

    // Handle route changes
    const handleRouteChangeStart = () => {
      gsap.to(overlay, {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.in',
      });
    };

    const handleRouteChangeComplete = () => {
      window.scrollTo(0, 0);
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.1
      });
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

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
        {/* Page Transition Overlay */}
        <div ref={transitionOverlayRef} className="page-transition-overlay" />
        <Component {...pageProps} />
      </SessionProvider>
    );
  }

  // Render login page with minimal wrapper (no header/footer)
  if (isLoginPage) {
    return (
      <SessionProvider session={pageProps.session}>
        {/* Page Transition Overlay */}
        <div ref={transitionOverlayRef} className="page-transition-overlay" />
        <Component {...pageProps} />
      </SessionProvider>
    );
  }

  return (
    <SessionProvider session={pageProps.session}>
      {/* Page Transition Overlay */}
      <div ref={transitionOverlayRef} className="page-transition-overlay" />
      
      <div className={styles.root}>
        {!isAdminPage && <MenuLinks />}
        {domElements}
        <div ref={layoutRef} id="layout" className={styles.layout}>
          {canvasElements}
          <main ref={mainRef} className={styles.main}>
            <div ref={mainContainerRef} id="mainContainer" className={styles.mainContainer}>
              {!isAdminPage && <Navbar />}
              <Layout layoutRef={layoutRef} mainRef={mainRef} router={router}>
                <Component {...pageProps} />
              </Layout>
            </div>
          </main>
        </div>
        
        {/* Global Alert Dialog */}
        <AlertDialog
          isOpen={alertDialog.isOpen}
          onClose={hideAlert}
          onConfirm={alertDialog.onConfirm}
          title={alertDialog.title}
          message={alertDialog.message}
          type={alertDialog.type}
          confirmText={alertDialog.confirmText}
          cancelText={alertDialog.cancelText}
          showCancel={alertDialog.showCancel}
        />
      </div>
    </SessionProvider>
  );
}

export default MyApp;
