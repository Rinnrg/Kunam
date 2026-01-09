import Image from 'next/image';
import styles from './LoadingSpinner.module.scss';

function LoadingSpinner({ size = 'medium', fullscreen = false }) {
  const sizeMap = {
    small: 50,
    medium: 70,
    large: 100,
  };

  const logoSizeMap = {
    small: 30,
    medium: 40,
    large: 60,
  };

  const radiusMap = {
    small: 25,
    medium: 35,
    large: 45,
  };

  const containerSize = sizeMap[size] || sizeMap.medium;
  const logoSize = logoSizeMap[size] || logoSizeMap.medium;
  const circleRadius = radiusMap[size] || radiusMap.medium;

  const content = (
    <div 
      className={styles.loadingContent} 
      style={{ width: `${containerSize}px`, height: `${containerSize}px` }}
    >
      <div className={styles.logoWrapper}>
        <Image
          src="/logo/logo 1 black.svg"
          alt="Loading"
          width={logoSize}
          height={logoSize}
          priority
          className={styles.logo}
        />
      </div>
      <div className={styles.spinnerCircle}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r={circleRadius} />
        </svg>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className={styles.loadingFullscreen}>
        {content}
      </div>
    );
  }

  return content;
}

export default LoadingSpinner;
