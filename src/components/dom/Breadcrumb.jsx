import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './Breadcrumb.module.scss';

// Helper function to format path segment to readable label
function formatLabel(path) {
  return path
    .split('-')
    .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

// Helper function to generate breadcrumb from path
function generateBreadcrumbFromPath(pathname) {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];

  paths.forEach((path, index) => {
    // Skip if it's a dynamic route parameter like [id]
    if (path.startsWith('[') && path.endsWith(']')) {
      return;
    }

    const label = formatLabel(path);
    const href = `/${paths.slice(0, index + 1).join('/')}`;
    
    breadcrumbs.push({
      label,
      href: index === paths.length - 1 ? null : href,
    });
  });

  return breadcrumbs;
}

function Breadcrumb({ items }) {
  const router = useRouter();

  // If items are not provided, generate from current path
  const breadcrumbItems = items || generateBreadcrumbFromPath(router.pathname);

  return (
    <nav className={styles.breadcrumb}>
      <Link href="/">Home</Link>
      {breadcrumbItems.map((item, index) => (
        <span key={index}>
          <span className={styles.separator}>&gt;</span>
          {item.href && index !== breadcrumbItems.length - 1 ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span className={styles.current}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumb;
