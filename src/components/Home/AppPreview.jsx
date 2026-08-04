import shotTabla    from '../../assets/shot-tabla.webp';
import shotPartidos from '../../assets/shot-partidos.webp';
import shotPerfil   from '../../assets/shot-perfil.webp';

const SHOTS = [
  { src: shotTabla,    title: 'Tabla de posiciones', desc: 'Se recalcula sola con cada partido que cargás.' },
  { src: shotPartidos, title: 'Partidos y resultados', desc: 'Marcador, duración y el detalle de cada cruce.' },
  { src: shotPerfil,   title: 'Tu perfil de padelero', desc: 'Victorias, rachas, títulos y compañeros frecuentes.' },
];

// Marco de celular: la captura va adentro, con el mismo redondeo que el marco.
function Phone({ src, alt }) {
  return (
    <div className="relative w-[190px] sm:w-[210px] rounded-[2rem] border-[7px] border-border-strong bg-border-strong shadow-2xl shadow-black/60 overflow-hidden">
      <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-1.5 rounded-full bg-black/70 z-10" />
      <img
        src={src}
        alt={alt}
        width="624"
        height="1350"
        loading="lazy"
        decoding="async"
        className="block w-full h-auto rounded-[1.5rem]"
      />
    </div>
  );
}

export default function AppPreview() {
  return (
    <div className="mt-14">
      <h2 className="font-condensed font-bold text-sm tracking-widest text-muted text-center mb-1.5">ASÍ SE VE</h2>
      <p className="font-mono text-[11px] text-dim text-center mb-8">Capturas reales de torneos jugados en Padeleando</p>
      {/* En celular se desplaza al costado: apilados, los tres marcos alargaban la portada 1.500 px. */}
      <div className="flex gap-8 sm:gap-10 overflow-x-auto snap-x snap-mandatory sm:flex-wrap sm:justify-center sm:overflow-visible px-4 -mx-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SHOTS.map((s) => (
          <div key={s.title} className="flex flex-col items-center shrink-0 snap-center w-[190px] sm:w-[210px]">
            <Phone src={s.src} alt={s.title} />
            <h3 className="font-condensed font-bold text-[15px] text-white text-center mt-5">{s.title}</h3>
            <p className="font-sans text-[13px] text-secondary text-center leading-snug mt-1">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
