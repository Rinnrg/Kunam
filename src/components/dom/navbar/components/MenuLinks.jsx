import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import clsx from 'clsx';
import footerLinks from '@src/components/dom/navbar/constants/footerLinks';
import { getMenuLinks } from '@src/components/dom/navbar/constants/menuLinks';
import styles from '@src/components/dom/navbar/styles/menuLinks.module.scss';
import { useRouter } from 'next/router';
import { useStore } from '@src/store';

function MenuLinks() {
  const [isMenuOpen, setIsMenuOpen, lenis] = useStore((state) => [state.isMenuOpen, state.setIsMenuOpen, state.lenis]);
  const menuRef = useRef();
  const router = useRouter();
  const [menuLinks, setMenuLinks] = useState(getMenuLinks([]));

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        
        if (data.success && data.categories) {
          setMenuLinks(getMenuLinks(data.categories));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Simple CSS-based animation via class toggle
  useEffect(() => {
    if (menuRef.current) {
      if (isMenuOpen) {
        menuRef.current.classList.add(styles.menuOpen);
      } else {
        menuRef.current.classList.remove(styles.menuOpen);
      }
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

  const renderMenuLinks = (links, pathname) =>
    links.map((link) => {
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
        <div className={styles.menuList}>
          {renderMenuLinks(menuLinks, router.pathname)}
        </div>
        <div className={styles.menuList}>
          <div className={styles.menuListItem}>
            <Link aria-label="Send email" scroll={false} href="mailto:info@kunam.com">
              <span>GET IN TOUCH</span>
            </Link>
          </div>
        </div>
        <div className={styles.menuList}>
          {footerLinks.social.map((link) => (
            <div
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
