import { useState, useEffect } from 'react'

// Anuncios por slot. Cada entrada: { src, href? }
// - href opcional: si existe, la imagen es clickeable y abre en nueva pestaña.
// - Para el slot 'sidebar' solo tenemos imágenes verticales (desktop).
// - mobile-top / mobile-bottom quedan pendientes hasta tener las imágenes horizontales.
const ADS = {
  sidebar: [
    {
      src:  'https://res.cloudinary.com/dm80qflwa/image/upload/v1776916486/Skycraper_canchas_zi0c5c.png',
      href: 'mailto:fabricando.dev@gmail.com?subject=Publicidad%20en%20Padeleando&body=Hola%20Padeleando!',
    },
    {
      src:  'https://res.cloudinary.com/dm80qflwa/image/upload/v1776917142/skycraper_carniceria_xmkjpv.png',
      href: 'mailto:fabricando.dev@gmail.com?subject=Publicidad%20en%20Padeleando&body=Hola%20Padeleando!',
    },
    {
      src:  'https://res.cloudinary.com/dm80qflwa/image/upload/v1776916486/skycraper_indumentaria_asbock.png',
      href: 'mailto:fabricando.dev@gmail.com?subject=Publicidad%20en%20Padeleando&body=Hola%20Padeleando!',
    },
    {
      src:  'https://res.cloudinary.com/dm80qflwa/image/upload/v1776917143/skycraper_hamburguesa_jqoxkj.png',
      href: 'mailto:fabricando.dev@gmail.com?subject=Publicidad%20en%20Padeleando&body=Hola%20Padeleando!',
    },
  ],
  'mobile-top':    [],
  'mobile-bottom': [],
}

const SLOT_CLASSES = {
  sidebar:         'w-40 aspect-[160/600]',
  'mobile-top':    'w-full h-14',
  'mobile-bottom': 'w-full h-14 bg-base',
}

const ROTATION_MS = 7_000

export default function AdBanner({ slot = 'sidebar' }) {
  const ads = ADS[slot] ?? []
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (ads.length <= 1) return
    const id = setInterval(() => {
      setIdx(i => (i + 1) % ads.length)
    }, ROTATION_MS)
    return () => clearInterval(id)
  }, [ads.length])

  if (ads.length === 0) return null

  return (
    <div className={`relative overflow-hidden rounded ${SLOT_CLASSES[slot]}`}>
      {ads.map((ad, i) => {
        const active = i === idx
        const wrapperClass = `absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`
        const img = (
          <img src={ad.src} alt="Publicidad" className="w-full h-full object-contain" />
        )
        return ad.href ? (
          <a key={i} href={ad.href} target="_blank" rel="noopener noreferrer" className={wrapperClass}>
            {img}
          </a>
        ) : (
          <div key={i} className={wrapperClass}>
            {img}
          </div>
        )
      })}
    </div>
  )
}
