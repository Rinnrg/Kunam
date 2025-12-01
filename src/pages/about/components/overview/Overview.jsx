import AppearTitle from '@src/components/animationComponents/appearTitle/Index';
import clsx from 'clsx';
import styles from '@src/pages/about/components/overview/styles/overview.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';

function Overview() {
  const isMobile = useIsMobile();

  return (
    <section className={clsx(styles.root, 'layout-grid-inner')}>
      <div className={styles.title}>
        {isMobile ? (
          <AppearTitle key="mobile-queto">
            <h3 className="h3">The front-end developer&apos;s role </h3>
            <h3 className="h3">
              is like a kind host, <span className="medium">ensuring</span>
            </h3>
            <h3 className="h3">
              visitors have a <span className="medium">smooth</span> and
            </h3>
            <h3 className="h3">
              <span className="medium">enjoyable</span> experience.
            </h3>
          </AppearTitle>
        ) : (
          <AppearTitle key="desktop-queto">
            <h3 className="h3">The front-end developer&apos;s role is like a</h3>
            <h3 className="h3">
              kind host, <span className="medium">ensuring</span> visitors have
            </h3>
            <h3 className="h3">
              a <span className="medium">smooth</span> and <span className="medium">enjoyable</span> experience.
            </h3>
          </AppearTitle>
        )}
      </div>
      <div className={clsx(styles.text, 'p-l', styles.myStory)}>
        <AppearTitle>
          <span>Some words</span>
        </AppearTitle>
      </div>
      <div className={styles.desc}>
        {!isMobile ? (
          <AppearTitle key="desktop-overview">
            <h6 className="h6">Hey there! I&apos;m a 26-year-old front-end developer from Greece with a </h6>
            <h6 className="h6">passion for crafting amazing digital experiences. I studied software</h6>
            <h6 className="h6">engineering to deepen my understanding of how to build sleek and </h6>
            <h6 className="h6">efficient websites and apps.</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>When I&apos;m not busy coding, you&apos;ll often find me soaking up inspiration from</h6>
            <h6 className="h6">fashion and lifestyle. We believe in quality craftsmanship and timeless</h6>
            <h6 className="h6">design that enhances your everyday life.</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>From carefully curated clothing to lifestyle essentials, every product </h6>
            <h6 className="h6">is selected with attention to detail and a commitment to excellence.</h6>

            <h6 className={clsx(styles.paddingTop, 'h6')}>We&apos;re excited to be part of your style journey!</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>Kunam Team.</h6>
          </AppearTitle>
        ) : (
          <AppearTitle key="mobile-overview">
            <h6 className="h6">Welcome to Kunam! We are a brand dedicated to bringing you </h6>
            <h6 className="h6">quality products that blend style and functionality. Our collection </h6>
            <h6 className="h6">is carefully curated to meet the needs of modern living while </h6>
            <h6 className="h6">maintaining timeless appeal.</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>We draw inspiration from contemporary fashion trends and </h6>
            <h6 className="h6">lifestyle needs. Whether it&apos;s exploring new designs or</h6>
            <h6 className="h6">perfecting the details, we love bringing quality and</h6>
            <h6 className="h6">creativity to every piece.</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>Our mission is to provide products that enhance your lifestyle.</h6>
            <h6 className="h6">From clothing to accessories, every item is chosen with care</h6>
            <h6 className="h6">and passion.</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>We&apos;re looking forward to being part of your style journey!</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>Kunam Team.</h6>
          </AppearTitle>
        )}
      </div>
    </section>
  );
}
export default Overview;
