import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

export const OptimizedImage = React.memo(function OptimizedImage({ src, alt, className, fallback, ...props }: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error || !src) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-800 ${className}`}>
        <ImageOff className="w-1/4 h-1/4 max-w-10 max-h-10 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setError(true)}
      onLoad={() => setLoaded(true)}
      className={`${className} ${!loaded ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
      {...props}
    />
  );
});
