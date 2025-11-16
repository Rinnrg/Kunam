import AppearByWords from '@src/components/animationComponents/appearByWords/Index';
import AppearTitle from '@src/components/animationComponents/appearTitle/Index';
import Badge from '@src/pages/components/clients/components/Badge';
import clsx from 'clsx';
import { gsap } from 'gsap';
import styles from '@src/pages/components/clients/styles/clients.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import { useRef } from 'react';
import { useWindowSize } from '@darkroom.engineering/hamo';

function Clients() {
  const isMobile = useIsMobile();
  const textRefs = useRef([]);
  const badgeRefs = useRef([]);
  const rootRef = useRef();
  const windowSize = useWindowSize();

  const setupScrollAnimation = () => {
    const ctx = gsap.context(() => {
      if (!isMobile) {
        const vw = (coef) => windowSize.height * (coef / 100);
        textRefs.current.forEach((textRef, index) => {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: rootRef.current,
                start: index === 0 ? `top-=${vw(35)}` : `top+=${vw(35 + 5.5555556 * index)}`,
                end: index === 0 ? `bottom-=${vw(35 + 5.5555556 * index)}` : `bottom+=${vw(25)}`,
                toggleActions: 'play none reverse none',
                scrub: true,
                scroller: document?.querySelector('main'),
                invalidateOnRefresh: true,
              },
            })
            .to(textRef, {
              top: `${10 + 30 * index + 5.5555556 * index}vw`,
            });
        });
      }
    });

    return ctx;
  };

  useIsomorphicLayoutEffect(() => {
    const ctx = setupScrollAnimation(textRefs, rootRef, windowSize, isMobile);
    return () => ctx.kill();
  }, [isMobile, windowSize.height]);

  return (
    <section ref={rootRef} className={clsx(styles.root, 'layout-grid-inner')}>
      <h1 className={clsx(styles.sectionTitle, 'h1')}>
        <AppearByWords>Clients</AppearByWords>
      </h1>
      {isMobile ? <div className={styles.mobileEmpty} /> : null}
      {isMobile ? (
        <div className={styles.mobileCount}>
          <AppearTitle>2024</AppearTitle>
        </div>
      ) : null}
      <div
        ref={(el) => {
          badgeRefs.current[0] = el;
        }}
        className={styles.first}
      >
        <Badge name="company1" />
      </div>
      {isMobile ? <div className={styles.mobileEmptySecond} /> : null}
      {isMobile ? (
        <div className={styles.textMobile}>
          <AppearTitle>
            <h4 className={clsx('h4', 'bold')}>Company 1</h4>
          </AppearTitle>
          <AppearTitle>
            <div className="p-l">Lorem ipsum dolor sit amet, consectetur</div>
            <div className="p-l">adipiscing elit. Sed do eiusmod tempor</div>
            <div className="p-l">incididunt ut labore et dolore magna aliqua.</div>
            <div className="p-l">Ut enim ad minim veniam, quis nostrud</div>
            <div className="p-l">exercitation ullamco laboris nisi ut aliquip</div>
            <div className="p-l">ex ea commodo consequat. Duis aute irure</div>
            <div className="p-l">dolor in reprehenderit in voluptate velit</div>
            <div className="p-l">esse cillum dolore eu fugiat nulla pariatur.</div>
          </AppearTitle>
        </div>
      ) : null}
      {!isMobile ? (
        <>
          <div className={styles.firstEmpty} />
          <div
            ref={(el) => {
              textRefs.current[0] = el;
            }}
            className={styles.firstText}
          >
            <AppearTitle>
              <h6 className="h6">2024</h6>
            </AppearTitle>
            <AppearTitle>
              <h4 className={clsx('h4', 'bold', styles.title)}>Company 1</h4>
            </AppearTitle>
            <AppearTitle>
              <div className="p-l">Lorem ipsum dolor sit amet, consectetur</div>
              <div className="p-l">adipiscing elit. Sed do eiusmod tempor</div>
              <div className="p-l">incididunt ut labore et dolore magna aliqua.</div>
              <div className="p-l">Ut enim ad minim veniam, quis nostrud</div>
              <div className="p-l">exercitation ullamco laboris nisi ut aliquip</div>
              <div className="p-l">ex ea commodo consequat. Duis aute irure</div>
              <div className="p-l">dolor in reprehenderit in voluptate velit</div>
              <div className="p-l">esse cillum dolore eu fugiat nulla pariatur.</div>
            </AppearTitle>
          </div>
        </>
      ) : null}
      {!isMobile ? <div className={styles.secondEmpty} /> : null}
      {isMobile ? <div className={styles.mobileEmpty} /> : null}
      {isMobile ? (
        <div className={styles.mobileCount}>
          <AppearTitle>2023</AppearTitle>
        </div>
      ) : null}
      <div
        ref={(el) => {
          badgeRefs.current[1] = el;
        }}
        className={styles.second}
      >
        <Badge name="company2" />
      </div>
      {isMobile ? <div className={styles.mobileEmptySecond} /> : null}
      {isMobile ? (
        <div className={styles.textMobile}>
          <AppearTitle>
            <h4 className={clsx('h4', 'bold')}>Company 2</h4>
          </AppearTitle>
          <AppearTitle>
            <div className="p-l">Lorem ipsum dolor sit amet, consectetur</div>
            <div className="p-l">adipiscing elit. Sed do eiusmod tempor</div>
            <div className="p-l">incididunt ut labore et dolore magna aliqua.</div>
            <div className="p-l">Ut enim ad minim veniam, quis nostrud</div>
            <div className="p-l">exercitation ullamco laboris nisi ut aliquip</div>
            <div className="p-l">ex ea commodo consequat. Duis aute irure</div>
            <div className="p-l">dolor in reprehenderit in voluptate velit</div>
            <div className="p-l">esse cillum dolore eu fugiat nulla pariatur.</div>
          </AppearTitle>
        </div>
      ) : null}
      {!isMobile ? (
        <>
          <div
            ref={(el) => {
              textRefs.current[1] = el;
            }}
            className={styles.secondText}
          >
            <AppearTitle>
              <h6 className="h6">2023</h6>
            </AppearTitle>
            <AppearTitle>
              <h4 className={clsx('h4', 'bold', styles.title)}>Company 2</h4>
            </AppearTitle>
            <AppearTitle>
              <div className="p-l">Lorem ipsum dolor sit amet, consectetur</div>
              <div className="p-l">adipiscing elit. Sed do eiusmod tempor</div>
              <div className="p-l">incididunt ut labore et dolore magna aliqua.</div>
              <div className="p-l">Ut enim ad minim veniam, quis nostrud</div>
              <div className="p-l">exercitation ullamco laboris nisi ut aliquip</div>
              <div className="p-l">ex ea commodo consequat. Duis aute irure</div>
              <div className="p-l">dolor in reprehenderit in voluptate velit</div>
              <div className="p-l">esse cillum dolore eu fugiat nulla pariatur.</div>
            </AppearTitle>
          </div>
          <div className={styles.fourthEmpty} />
        </>
      ) : null}
      {isMobile ? <div className={styles.mobileEmpty} /> : null}
      {isMobile ? (
        <div className={styles.mobileCount}>
          <AppearTitle>2021</AppearTitle>
        </div>
      ) : null}
      <div
        ref={(el) => {
          badgeRefs.current[2] = el;
        }}
        className={styles.third}
      >
        <Badge name="company3" />
      </div>
      {isMobile ? <div className={styles.mobileEmptySecond} /> : null}
      {isMobile ? (
        <div className={styles.textMobile}>
          <AppearTitle>
            <h4 className={clsx('h4', 'bold')}>Company 3</h4>
          </AppearTitle>
          <AppearTitle>
            <div className="p-l">Lorem ipsum dolor sit amet, consectetur</div>
            <div className="p-l">adipiscing elit. Sed do eiusmod tempor</div>
            <div className="p-l">incididunt ut labore et dolore magna aliqua.</div>
            <div className="p-l">Ut enim ad minim veniam, quis nostrud</div>
            <div className="p-l">exercitation ullamco laboris nisi ut aliquip</div>
            <div className="p-l">ex ea commodo consequat. Duis aute irure</div>
            <div className="p-l">dolor in reprehenderit in voluptate velit</div>
            <div className="p-l">esse cillum dolore eu fugiat nulla pariatur.</div>
          </AppearTitle>
        </div>
      ) : null}
      {!isMobile ? (
        <>
          <div className={styles.fifthEmpty} />
          <div
            ref={(el) => {
              textRefs.current[2] = el;
            }}
            className={styles.thirdText}
          >
            <AppearTitle>
              <h6 className="h6">2021</h6>
            </AppearTitle>
            <AppearTitle>
              <h4 className={clsx('h4', 'bold', styles.title)}>Company 3</h4>
            </AppearTitle>
            <AppearTitle>
              <div className="p-l">Lorem ipsum dolor sit amet, consectetur</div>
              <div className="p-l">adipiscing elit. Sed do eiusmod tempor</div>
              <div className="p-l">incididunt ut labore et dolore magna aliqua.</div>
              <div className="p-l">Ut enim ad minim veniam, quis nostrud</div>
              <div className="p-l">exercitation ullamco laboris nisi ut aliquip</div>
              <div className="p-l">ex ea commodo consequat. Duis aute irure</div>
              <div className="p-l">dolor in reprehenderit in voluptate velit</div>
              <div className="p-l">esse cillum dolore eu fugiat nulla pariatur.</div>
            </AppearTitle>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default Clients;
