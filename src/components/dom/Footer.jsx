import AppearTitle from '@src/components/animationComponents/appearTitle/Index';
import Link from 'next/link';
import LinkText from '@src/components/animationComponents/linkText/Index';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import footerLinks from '@src/components/dom/navbar/constants/footerLinks';
import gsap from 'gsap';
import menuLinks from '@src/components/dom/navbar/constants/menuLinks';
import styles from '@src/components/dom/styles/footer.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import { useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import { useWindowSize } from '@darkroom.engineering/hamo';

const Time = dynamic(() => import('@src/components/dom/Time'), { ssr: false });
const GoTop = dynamic(() => import('@src/components/dom/GoTop'), { ssr: false });

function Footer() {
  const isMobile = useIsMobile();
  const footerRef = useRef();
  const [isLoading] = useStore(useShallow((state) => [state.isLoading]));
  const windowSize = useWindowSize();

  useIsomorphicLayoutEffect(() => {
    if (!isLoading) {
      const setupFooterAnimation = () => {
        gsap.set(footerRef.current, { height: 'auto' });
        const allSections = document.querySelectorAll('#mainContainer section');
        if (allSections.length > 1) {
          const lastSection = allSections[allSections.length - 2];
          if (footerRef.current.offsetHeight <= windowSize.height) {
            gsap.set(footerRef.current, { yPercent: -50 });
            const uncover = gsap.timeline({ paused: true });
            gsap.set(footerRef.current, { height: '100.5svh' });
            uncover.to(footerRef.current, {
              yPercent: 0,
              ease: 'none',
            });
            ScrollTrigger.create({
              id: 'footerTrigger',
              trigger: lastSection,
              start: 'bottom bottom',
              end: '+=100%',
              animation: uncover,
              scrub: true,
              scroller: document?.querySelector('main'),
            });
          } else {
            gsap.set(footerRef.current, { transform: 'translate(0%, 0%)', height: 'auto' });
          }
        }
      };

      setupFooterAnimation(footerRef, windowSize);
    }

    return () => {
      const footerTrigger = ScrollTrigger.getById('footerTrigger');
      if (footerTrigger) {
        footerTrigger.kill();
      }
    };
  }, [isLoading, windowSize.height]);

  return (
    <section ref={footerRef} className={clsx(styles.root, 'layout-grid-inner')} role="contentinfo">
      <div style={{ gridColumn: isMobile ? '1 / 3' : '1 / 5' }} className={styles.linksContainer}>
        <AppearTitle isFooter>
          <h6 className={clsx(styles.title, 'h6')}>Sitemap</h6>
          {menuLinks.slice(0, -1).map((link) => (
            <div key={link.title} className={styles.linkTextContainer}>
              <LinkText className={styles.linkText} title={link.title} href={link.href}>
                <span className="footer">{link.title}</span>
              </LinkText>
            </div>
          ))}
        </AppearTitle>
      </div>
      <div style={{ gridColumn: isMobile ? '3 / 7' : '5 / 9' }} className={styles.linksContainer}>
        <AppearTitle isFooter>
          <h6 className={clsx(styles.title, 'h6')}>Follow Us</h6>
          {footerLinks.map((link) => (
            <div key={link.title} className={styles.linkTextContainer}>
              <LinkText target className={styles.linkText} title={link.title} href={link.href}>
                <span className="footer">{link.title}</span>
              </LinkText>
            </div>
          ))}
        </AppearTitle>
      </div>
      <div className={styles.middleContainer} style={{ gridColumn: '1 / 9' }}>
        <AppearTitle isFooter>
          <div className={clsx('p-x', styles.middleText)}>
            Current Time: <Time />
          </div>
        </AppearTitle>
      </div>

      <div className={styles.middleContainer} style={{ gridColumn: '9 / 13' }}>
        <AppearTitle isFooter>
          <div className="p-x">Availability</div>
          <div className={clsx('p-x', styles.middleText)}>Currently available for limited projects</div>
        </AppearTitle>
      </div>
      <div className={styles.middleContainer} style={{ gridColumn: '13 / 17', textAlign: isMobile ? 'left' : 'right' }}>
        <AppearTitle isFooter>
          <div className="p-x">© 2025 · Kunam</div>
          <div className={clsx('p-x', styles.middleText)}>All Rights Reserved</div>
        </AppearTitle>
      </div>

      <div className={styles.giats}>
        <span className={styles.kunamText}>KUNAM</span>
      </div>
      <div className={styles.goToTop}>
        <GoTop />
      </div>
    </section>
  );
}

export default Footer;
