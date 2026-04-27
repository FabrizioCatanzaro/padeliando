import { useEffect, useRef, useState } from 'react';
import { X, Navigation, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const PIN_HTML = `<div style="width:20px;height:20px;background:#e8f04a;border:3px solid #0a0e1a;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.6)"></div>`;

export default function MapPicker({ initialLat, initialLon, onConfirm, onClose }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const markerRef     = useRef(null);
  const [locating,    setLocating]   = useState(false);
  const [confirming,  setConfirming] = useState(false);
  const [hasPin,      setHasPin]     = useState(!!(initialLat && initialLon));

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

      const icon = L.divIcon({ className: '', html: PIN_HTML, iconSize: [20, 20], iconAnchor: [10, 10] });

      function placeMarker(lat, lng) {
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
          markerRef.current.on('dragend', () => setHasPin(true));
        }
        setHasPin(true);
      }

      if (initialLat && initialLon) placeMarker(initialLat, initialLon);

      map.on('click', (e) => placeMarker(e.latlng.lat, e.latlng.lng));
      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  function handleMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        import('leaflet').then(({ default: L }) => {
          const { latitude: lat, longitude: lng } = coords;
          const icon = L.divIcon({ className: '', html: PIN_HTML, iconSize: [20, 20], iconAnchor: [10, 10] });
          mapRef.current.setView([lat, lng], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(mapRef.current);
          }
          setHasPin(true);
          setLocating(false);
        });
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  async function handleConfirm() {
    if (!markerRef.current) return;
    const { lat, lng } = markerRef.current.getLatLng();
    setConfirming(true);
    let displayName = '';
    try {
      const r = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&limit=1`);
      const data = await r.json();
      const p = data.features?.[0]?.properties;
      if (p) {
        const parts = [p.name, p.street, p.city, p.state].filter(Boolean);
        displayName = [...new Set(parts)].join(', ');
      }
    } catch { /* si falla el reverse geocode igual confirmamos con coords */ }
    setConfirming(false);
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

        <div ref={containerRef} style={{ height: 320, width: '100%' }} />

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
