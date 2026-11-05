import { useState } from 'react'

export const DISH_PLACEHOLDER = '/images/dish-placeholder.svg'

function unsplashSrcSet(url) {
  if (!url?.startsWith('https://images.unsplash.com/')) return undefined
  const base = url.split('?')[0]
  return [400, 800, 1200].map((w) => `${base}?auto=format&fit=crop&w=${w}&q=75 ${w}w`).join(', ')
}

export function DishImage({ item, alt = '', className = '', sizes = '(max-width: 640px) 100vw, 400px', ...rest }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const hasPhoto = Boolean(item?.image) && item.image !== failedSrc
  const src = hasPhoto ? item.image : DISH_PLACEHOLDER

  return (
    <img
      src={src}
      srcSet={hasPhoto ? unsplashSrcSet(src) : undefined}
      sizes={hasPhoto ? sizes : undefined}
      alt={alt}
      width="640"
      height="480"
      loading="lazy"
      decoding="async"
      className={`dish-img ${className}`.trim()}
      onError={() => setFailedSrc(item?.image ?? null)}
      {...rest}
    />
  )
}
