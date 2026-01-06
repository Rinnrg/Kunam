import AppearTitle from '@src/components/animationComponents/appearTitle/Index';
import LinkText from '@src/components/animationComponents/linkText/Index';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import footerLinks from '@src/components/dom/navbar/constants/footerLinks';
import gsap from 'gsap';
import styles from '@src/components/dom/styles/footer.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import { useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import { useWindowSize } from '@darkroom.engineering/hamo';
import Image from 'next/image';

const Time = dynamic(() => import('@src/components/dom/Time'), { ssr: false });

function Footer() {
  const isMobile = useIsMobile();
  const footerRef = useRef();
  const [isLoading] = useStore(useShallow((state) => [state.isLoading]));
  const windowSize = useWindowSize();

  useIsomorphicLayoutEffect(() => {
    if (!isLoading) {
      // Footer animation disabled to fix positioning
      gsap.set(footerRef.current, { 
        height: 'auto',
        yPercent: 0,
        transform: 'translate(0%, 0%)'
      });
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
      {/* Company Info Section */}
      <div className={styles.companyInfo} style={{ gridColumn: isMobile ? '1 / 7' : '1 / 6' }}>
        <AppearTitle isFooter>
          <div className={styles.brandName}>
            <span className={styles.kunamText}>KUNAM</span>
          </div>
          <div className={styles.companyDescription}>
            <p>
              Sebagai Pusat Fashion Online di Asia, kami menciptakan kemudahan berbelanja gaya tanpa batas dengan cara memperluas jangkauan produk, mulai dari produk internasional hingga produk lokal
              dambaaan. Kami menjadikan Anda sebagai pusatnya.
            </p>
            <p className={styles.tagline}>
              KUNAM | Stand Out Loud.
            </p>
          </div>
          <div className={styles.contactInfo}>
            <h6 className={styles.title}>Layanan Pengaduan Konsumen KUNAM</h6>
            <p>E-mail: <a href="mailto:kunamcloth@gmail.com">kunamcloth@gmail.com</a></p>
            <p>WhatsApp: <a href="https://wa.me/6285190650113" target="_blank" rel="noopener noreferrer">+62 851 9065 0113</a></p>
          </div>
        </AppearTitle>
      </div>

      {/* Layanan Section */}
      <div className={styles.linksContainer} style={{ gridColumn: isMobile ? '1 / 4' : '7 / 10' }}>
        <AppearTitle isFooter>
          <h6 className={clsx(styles.title, 'h6')}>LAYANAN</h6>
          {footerLinks.layanan.map((link) => (
            <div key={link.title} className={styles.linkTextContainer}>
              <LinkText className={styles.linkText} title={link.title} href={link.href}>
                <span className="footer">{link.title}</span>
              </LinkText>
            </div>
          ))}
        </AppearTitle>
      </div>

      {/* Tentang Kami Section */}
      <div className={styles.linksContainer} style={{ gridColumn: isMobile ? '4 / 7' : '10 / 13' }}>
        <AppearTitle isFooter>
          <h6 className={clsx(styles.title, 'h6')}>TENTANG KAMI</h6>
          {footerLinks.tentangKami.map((link) => (
            <div key={link.title} className={styles.linkTextContainer}>
              <LinkText className={styles.linkText} title={link.title} href={link.href}>
                <span className="footer">{link.title}</span>
              </LinkText>
            </div>
          ))}
        </AppearTitle>
      </div>

      {/* Social Media Section */}
      <div className={styles.linksContainer} style={{ gridColumn: isMobile ? '1 / 7' : '13 / 17' }}>
        <AppearTitle isFooter>
          <h6 className={clsx(styles.title, 'h6')}>TEMUKAN KAMI</h6>
          <div className={styles.socialIcons}>
            {footerLinks.social.map((link) => (
              <div key={link.title} className={styles.socialIconContainer}>
                <LinkText target className={styles.socialLink} title={link.title} href={link.href}>
                  <Image 
                    src={`/logo/${link.icon}-white.svg`} 
                    alt={link.title}
                    width={32}
                    height={32}
                    className={styles.socialIcon}
                  />
                </LinkText>
              </div>
            ))}
          </div>
        </AppearTitle>
      </div>

      {/* Bottom Info */}
      <div className={styles.bottomContainer} style={{ gridColumn: '1 / 17' }}>
        <AppearTitle isFooter>
          <div className={styles.bottomInfo}>
            <div className={clsx('p-x', styles.bottomText)}>
              Current Time: <Time />
            </div>
            <div className="p-x">© 2025 · Kunam</div>
            <div className={clsx('p-x', styles.bottomText)}>All Rights Reserved</div>
          </div>
        </AppearTitle>
      </div>
    </section>
  );
}

export default Footer;
