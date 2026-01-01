import { useEffect, useRef, useCallback } from 'react';

import Link from 'next/link';
import clsx from 'clsx';
import footerLinks from '@src/components/dom/navbar/constants/footerLinks';
import gsap from 'gsap';
import menuLinks from '@src/components/dom/navbar/constants/menuLinks';
import styles from '@src/components/dom/navbar/styles/menuLinks.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';
import { useRouter } from 'next/router';
import { useStore } from '@src/store';

function MenuLinks() {
  const timeline = useRef(gsap.timeline({ paused: true, defaults: { duration: 0.92, ease: 'expo.inOut' } }));
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen, lenis, isLoading] = useStore((state) => [state.isMenuOpen, state.setIsMenuOpen, state.lenis, state.isLoading]);
  const menuRef = useRef();
  const menuLinksItemsRef = useRef([]);
  const router = useRouter();

  const setupMenuAnimation = useCallback(
    (gsapTimeline, refs) => {
      const fluidCanvas = document?.getElementById('fluidCanvas');
      const layout = document?.getElementById('layout');
      const scrollbar = document?.getElementById('scrollbar');
      const headers = document?.querySelectorAll('header');

      // Set initial states for menu
      gsap.set(refs.menuRef.current, { pointerEvents: 'none', autoAlpha: 0, visibility: 'hidden' });
      gsap.set(refs.menuLinksItemsRef.current, { x: '100%' });

      // Set initial states for layout (normal position)
      gsap.set(layout, { scale: 1, x: 0, opacity: 1, borderRadius: '0vw' });
      gsap.set(scrollbar, { opacity: 1, scale: 1, x: 0 });
      gsap.set(headers, { autoAlpha: 1, x: 0, scale: 1 });

      gsapTimeline
        .to(refs.menuRef.current, { autoAlpha: 1, visibility: 'visible', pointerEvents: 'auto', duration: 0.6, ease: 'power2.out' }, 0)
        .to(fluidCanvas, { duration: 0, opacity: 0 }, 0)
        .to(refs.menuLinksItemsRef.current, { x: 0, stagger: 0.05, duration: 0.8, ease: 'power2.out' }, 0.1)
        .to(
          layout,
          {
            scale: isMobile ? 1 : 0.7,
            x: isMobile ? 0 : '-35vw',
            opacity: isMobile ? 0.05 : 0.4,
            borderRadius: isMobile ? '0vw' : '2vw',
            duration: 0.8,
            ease: 'power2.out',
          },
          0,
        )
        .to(scrollbar, { opacity: 0, scale: 0.7, x: isMobile ? 0 : '-35vw', duration: 0.8, ease: 'power2.out' }, 0)
        .to(headers, { autoAlpha: 0, x: isMobile ? 0 : '-35vw', scale: 0.7, duration: 0.8, ease: 'power2.out', overwrite: true }, 0);
    },
    [isMobile],
  );

  useEffect(() => {
    const tl = timeline.current;
    const refs = { menuRef, menuLinksItemsRef };
    const ctx = gsap.context(() => {
      setupMenuAnimation(tl, refs, isMobile);
    });

    return () => {
      if (tl) {
        tl.kill();
      }
      ctx.kill();
    };
  }, [isLoading, isMobile, setupMenuAnimation]);

  useEffect(() => {
    const tl = timeline.current;
    if (isMenuOpen) {
      tl.play();
    } else {
      tl.reverse();
    }
  }, [isMenuOpen]);

  const goToBottom = () => {
    setIsMenuOpen(false);

    setTimeout(() => {
      const mainElement = document.querySelector('main');
      if (mainElement && lenis) {
        const mainHeight = mainElement.scrollHeight;
        lenis.scrollTo(mainHeight, {
          duration: 1.5,
          force: true,
          easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
          onComplete: () => {
            lenis.start();
          },
        });
      }
    }, 850);
  };

  const renderMenuLinks = (links, refs, pathname) =>
    links.map((link, index) => {
      const hasSubmenu = link.submenu && link.submenu.length > 0;
      const isClickable = link.href !== undefined;
      
      let content;
      
      if (isClickable) {
        content = (
          <div className={styles.menuItemWrapper}>
            <Link aria-label={`Go ${link.title}`} scroll={false} href={link.href}>
              <span>{link.title}</span>
            </Link>
            {hasSubmenu && (
              <div className={styles.submenu}>
                {link.submenu.filter((sublink) => sublink.href).map((sublink) => (
                  <Link
                    key={sublink.title}
                    aria-label={`Go to ${sublink.title}`}
                    scroll={false}
                    href={sublink.href}
                    target={sublink.external ? '_blank' : undefined}
                    rel={sublink.external ? 'noopener noreferrer' : undefined}
                    className={styles.submenuItem}
                  >
                    <span>{sublink.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      } else if (hasSubmenu) {
        content = (
          <div className={styles.menuItemWrapper}>
            <span className={styles.menuTitle}>{link.title}</span>
            <div className={styles.submenu}>
              {link.submenu.filter((sublink) => sublink.href).map((sublink) => (
                <Link
                  key={sublink.title}
                  aria-label={`Go to ${sublink.title}`}
                  scroll={false}
                  href={sublink.href}
                  target={sublink.external ? '_blank' : undefined}
                  rel={sublink.external ? 'noopener noreferrer' : undefined}
                  className={styles.submenuItem}
                >
                  <span>{sublink.title}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      } else {
        content = (
          <span
            onClick={goToBottom}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                goToBottom();
              }
            }}
          >
            {link.title}
          </span>
        );
      }
      
      return (
        <div
          ref={(el) => {
            menuLinksItemsRef.current[index + 1] = el;
          }}
          key={link.title}
          className={clsx(styles.menuListItem, pathname === link.href && styles.menuListItemActive)}
        >
          {content}
        </div>
      );
    });

  return (
    <nav id="menu" ref={menuRef} className={styles.menu}>
      <div className={clsx(styles.menuWrapper, 'layout-block-inner')}>
        <div
          ref={(el) => {
            menuLinksItemsRef.current[0] = el;
          }}
          className={styles.menuList}
        >
          {renderMenuLinks(menuLinks, menuLinksItemsRef, router.pathname)}
        </div>
        <div
          ref={(el) => {
            menuLinksItemsRef.current[menuLinks.length + 1] = el;
          }}
          className={styles.menuList}
        >
          <div
            role="presentation"
            ref={(el) => {
              menuLinksItemsRef.current[menuLinks.length + 1] = el;
            }}
            className={styles.menuListItem}
          >
            <Link aria-label="Send email" scroll={false} href="mailto:info@kunam.com">
              <span>GET IN TOUCH</span>
            </Link>
          </div>
        </div>
        <div
          ref={(el) => {
            menuLinksItemsRef.current[menuLinks.length + 2] = el;
          }}
          className={styles.menuList}
        >
          {footerLinks.social.map((link, index) => (
            <div
              ref={(el) => {
                menuLinksItemsRef.current[menuLinks.length + index + 2] = el;
              }}
              key={link.title}
              className={styles.menuListItem}
            >
              <Link aria-label={`Find me on ${link.title}`} target="_blank" rel="noopener noreferrer" scroll={false} href={link.href}>
                <span>{link.title}</span>
              </Link>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setIsMenuOpen(false);
            if (lenis) {
              lenis.start();
            }
          }}
          className={styles.menuClose}
        >
          <p>&#10005;</p>
        </button>
      </div>
    </nav>
  );
}

export default MenuLinks;
