import { useEffect, useRef } from 'react';
import styles from './Charts.module.scss';

export default function OrdersChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Sample data if no data provided
    const chartData = data || {
      pending: 5,
      processing: 8,
      completed: 25,
      cancelled: 2,
    };

    const colors = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      completed: '#10b981',
      cancelled: '#ef4444',
    };

    const labels = {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    const total = Object.values(chartData).reduce((sum, val) => sum + val, 0);
    
    // Draw donut chart
    const centerX = rect.width / 2;
    const centerY = rect.height / 2 - 20;
    const radius = Math.min(rect.width, rect.height) / 3;
    const innerRadius = radius * 0.6;

    let startAngle = -Math.PI / 2;

    Object.entries(chartData).forEach(([key, value]) => {
      const sliceAngle = (value / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      // Draw slice
      ctx.fillStyle = colors[key];
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();

      startAngle = endAngle;
    });

    // Draw center circle (white)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw total in center
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, centerX, centerY - 10);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('Total Orders', centerX, centerY + 15);

    // Draw legend
    let legendY = rect.height - 80;
    Object.entries(chartData).forEach(([key, value]) => {
      const legendX = 20;
      
      // Draw color box
      ctx.fillStyle = colors[key];
      ctx.fillRect(legendX, legendY, 12, 12);
      
      // Draw label
      ctx.fillStyle = '#334155';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${labels[key]}: ${value}`, legendX + 20, legendY + 9);
      
      legendY += 20;
    });

  }, [data]);

  return (
    <div className={styles.chartContainer}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
