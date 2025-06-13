'use client';

import Image, { ImageProps } from 'next/image';
import * as React from 'react';

import { cn } from '@/lib/utils';

type NextImageProps = {
  useSkeleton?: boolean;
  classNames?: {
    image?: string;
    blur?: string;
  };
  alt: string;
  priority?: boolean;
} & Omit<ImageProps, 'alt'>;

/**
 *
 * @description Must set width using `w-` className if not using fill or providing numerical width/height.
 * @param useSkeleton add background with pulse animation, don't use it if image is transparent
 */
export default function NextImage({
  useSkeleton = false,
  className,
  classNames,
  alt,
  src,
  width,
  height,
  fill,
  onLoad: propOnLoad,
  onError: propOnError,
  priority,
  ...rest
}: NextImageProps) {
  const [status, setStatus] = React.useState(
    useSkeleton ? 'loading' : 'complete'
  );

  const figureStyle = React.useMemo(() => {
    if (fill) return undefined;
    if (typeof width === 'number' && !(className?.includes('w-'))) {
      return { width: `${width}px` };
    }
    return undefined;
  }, [fill, width, className]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setStatus('complete');
    if (propOnLoad) {
      propOnLoad(e);
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setStatus('error');
    if (propOnError) {
      propOnError(e);
    }
  };

  return (
    <figure
      style={figureStyle}
      className={className}
    >
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : (typeof width === 'number' || typeof width === 'string' ? Number(width) : undefined)}
        height={fill ? undefined : (typeof height === 'number' || typeof height === 'string' ? Number(height) : undefined)}
        fill={fill}
        className={cn(
          classNames?.image,
          status === 'loading' && cn('animate-pulse', classNames?.blur)
        )}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        {...rest}
      />
    </figure>
  );
}
