import { useEffect, useRef, useState } from 'react';
import { X, Navigation, Loader2, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const PIN_HTML = `<div style="width:20px;height:20px;background:#e8f04a;border:3px solid #0a0e1a;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.6)"></div>`;
// Sesgo hacia Argentina para la búsqueda de direcciones (bbox: minLon,minLat,maxLon,maxLat).
const AR_BBOX = '-73.6,-55.1,-53.6,-21.8';

// Arma una etiqueta legible a partir de las propiedades de un feature de Photon.
function featureLabel(props = {}) {
  const street = [props.street, props.housenumber].filter(Boolean).join(' ');
  const parts = [props.name, street, props.city, props.state].filter(Boolean);
  return [...new Set(parts)].join(', ');
}

export default function MapPicker({ initialLat, initialLon, onConfirm, onClose }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const markerRef     = useRef(null);
  const LRef          = useRef(null);
  const iconRef       = useRef(null);
  // Etiqueta conocida del pin actual cuando vino de un resultado de búsqueda
  // (incluye altura). Se limpia si el pin se coloca/mueve a mano → ahí sí usamos reverse.
  const pinLabelRef   = useRef('');
  const [locating,    setLocating]   = useState(false);
  const [confirming,  setConfirming] = useState(false);
  const [hasPin,      setHasPin]     = useState(!!(initialLat && initialLon));
  const [query,       setQuery]      = useState('');
  const [searching,   setSearching]  = useState(false);
  const [results,     setResults]    = useState([]);

  // Coloca o mueve el pin (arrastrable) y opcionalmente centra el mapa.
  function placePin(lat, lon, zoom) {
    const L = LRef.current, map = mapRef.current;
    if (!L || !map) return;
    if (zoom) map.setView([lat, lon], zoom);
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    } else {
      markerRef.current = L.marker([lat, lon], { icon: iconRef.current, draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => { pinLabelRef.current = ''; setHasPin(true); });
    }
    setHasPin(true);
  }

  useEffect(() => {
    import('leaflet').then(({ default: L }) => {
      if (mapRef.current) return;

      const startLat = initialLat ?? -38;
      const startLon = initialLon ?? -63;
      const startZoom = initialLat ? 15 : 4;

      const map = L.map(containerRef.current, { center: [startLat, startLon], zoom: startZoom });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      LRef.current = L;
      iconRef.current = L.divIcon({ className: '', html: PIN_HTML, iconSize: [20, 20], iconAnchor: [10, 10] });
      mapRef.current = map;

      if (initialLat && initialLon) placePin(initialLat, initialLon);
      map.on('click', (e) => { pinLabelRef.current = ''; placePin(e.latlng.lat, e.latlng.lng); });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      LRef.current = null;
      iconRef.current = null;
    };
  }, []);

  async function handleSearch(e) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const r = await fetch(`https://photon.komoot.io/api?q=${encodeURIComponent(q)}&limit=5&bbox=${AR_BBOX}`);
      const data = await r.json();
      setResults(Array.isArray(data.features) ? data.features : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function selectResult(feature) {
    const coords = feature?.geometry?.coordinates;
    if (!Array.isArray(coords)) return;
    const [lon, lat] = coords;
    const label = featureLabel(feature.properties);
    placePin(lat, lon, 16);
    pinLabelRef.current = label;   // conservamos la altura del resultado elegido
    setQuery(label);
    setResults([]);
  }

  function handleMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        pinLabelRef.current = '';
        placePin(coords.latitude, coords.longitude, 16);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  async function handleConfirm() {
    if (!markerRef.current) return;
    const { lat, lng } = markerRef.current.getLatLng();
    // Si el pin vino de la búsqueda, esa etiqueta ya trae la altura: la usamos tal cual.
    // Solo geocodificamos al revés cuando el pin se colocó a mano (click / mi ubicación / arrastre).
    let displayName = pinLabelRef.current;
    if (!displayName) {
      setConfirming(true);
      try {
        const r = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&limit=1`);
        const data = await r.json();
        const p = data.features?.[0]?.properties;
        if (p) displayName = featureLabel(p);
      } catch { /* si falla el reverse geocode igual confirmamos con coords */ }
      setConfirming(false);
    }
    onConfirm(lat, lng, displayName);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border-mid rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-mid">
          <span className="font-mono text-[11px] text-[#555] tracking-widest">ELEGIR UBICACIÓN</span>
          <button onClick={onClose} className="bg-transparent border-none text-[#555] hover:text-white cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Buscador de direcciones */}
        <div className="relative px-3 pt-3">
          <form onSubmit={handleSearch} className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar dirección (calle, ciudad...)"
              className="w-full bg-base border border-border-mid text-white pl-8 pr-20 py-2 rounded text-sm outline-none font-sans"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono border border-border-mid text-[#888] hover:border-border-strong hover:text-white transition-colors cursor-pointer bg-transparent disabled:opacity-40"
            >
              {searching ? <Loader2 size={11} className="animate-spin" /> : 'BUSCAR'}
            </button>
          </form>

          {results.length > 0 && (
            <ul className="absolute left-3 right-3 z-1000 mt-1 bg-surface border border-border-mid rounded-md shadow-xl overflow-hidden max-h-56 overflow-y-auto">
              {results.map((f, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => selectResult(f)}
                    className="w-full text-left px-3 py-2 text-xs font-sans text-[#ccc] hover:bg-base hover:text-white transition-colors bg-transparent border-none cursor-pointer border-b border-border-mid last:border-b-0"
                  >
                    {featureLabel(f.properties) || 'Ubicación sin nombre'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div ref={containerRef} style={{ height: 320, width: '100%' }} className="mt-3" />

        <div className="px-3 pt-2 pb-0.5 text-center font-mono text-[11px] text-[#444]">
          Tocá el mapa para colocar el pin · podés arrastrarlo para ajustar
        </div>

        <div className="p-3 flex gap-2">
          <button
            onClick={handleMyLocation}
            disabled={locating}
            className="flex items-center gap-1.5 bg-transparent border border-border-mid text-[#888] hover:border-border-strong hover:text-white transition-colors px-3 py-2 rounded text-xs font-mono cursor-pointer disabled:opacity-40 whitespace-nowrap"
          >
            {locating ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
            MI UBICACIÓN
          </button>
          <button
            onClick={handleConfirm}
            disabled={!hasPin || confirming}
            style={{ background: '#e8f04a', color: '#0a0e1a', border: 'none', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 14, letterSpacing: 2, borderRadius: 4, cursor: hasPin ? 'pointer' : 'default', opacity: hasPin ? 1 : 0.4 }}
            className="flex-1 flex items-center justify-center gap-2 py-2"
          >
            {confirming && <Loader2 size={13} className="animate-spin" />}
            CONFIRMAR
          </button>
        </div>
      </div>
    </div>
  );
}
