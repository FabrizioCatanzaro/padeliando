// Imágenes: skyscraper 160×600 para desktop, banner ~320×50 para mobile
const IMAGES = {
  sidebar:       'https://res.cloudinary.com/dymih4uxm/image/upload/v1774972695/skycraper_vertical_padeleando_gs901l.png',
  'mobile-top':    'https://res.cloudinary.com/dymih4uxm/image/upload/v1774972958/skycraper_horizontal_padeleando_1_b0zlet.png',
  'mobile-bottom':'https://res.cloudinary.com/dymih4uxm/image/upload/v1774972958/skycraper_horizontal_padeleando_1_b0zlet.png', 
}

const SLOTS = {
  sidebar:         'w-40',
  'mobile-top':    'w-full h-14',
  'mobile-bottom': 'w-full h-14',
}

const IMG_CLASSES = {
  sidebar:         'w-full h-auto rounded',
  'mobile-top':    'h-full w-auto',
  'mobile-bottom': 'h-full w-auto',
}

export default function AdBanner({ slot = 'sidebar' }) {
  const src = IMAGES[slot]
  if (!src) return null

  return (
    <div className={`flex items-center justify-center overflow-hidden ${SLOTS[slot]}`}>
      <img src={src} className={IMG_CLASSES[slot]} />
    </div>
  )
}
