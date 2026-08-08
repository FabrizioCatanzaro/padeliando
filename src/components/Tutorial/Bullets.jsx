// Lista con la flecha lima que ya usaban FormatosSection y JugadoresSection,
// extraída para no repetir el markup en cada sección nueva.
export default function Bullets({ items = [], className = '' }) {
  if (!items.length) return null

  return (
    <ul className={`flex flex-col gap-2 mb-4 ${className}`}>
      {items.map((item, i) => (
        <li
          key={i}
          className="flex gap-3 items-start text-[14px] text-secondary font-sans leading-relaxed"
        >
          <span className="text-brand mt-0.5 shrink-0">›</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
