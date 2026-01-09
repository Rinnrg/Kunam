import styles from './LoadingSpinner.module.scss';

function LoadingSpinner({ size = 'medium', fullscreen = false }) {
  const sizeMap = {
    small: 40,
    medium: 60,
    large: 80,
  };

  const containerSize = sizeMap[size] || sizeMap.medium;

  const content = (
    <div 
      className={styles.loadingContent} 
      style={{ width: `${containerSize}px`, height: `${containerSize}px` }}
    >
      <div className={styles.spinnerCircle}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" />
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
