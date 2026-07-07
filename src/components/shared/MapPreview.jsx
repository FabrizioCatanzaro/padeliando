import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const PIN_HTML = `<div style="width:18px;height:18px;background:#e8f04a;border:3px solid #0a0e1a;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.6)"></div>`;

// Mini-mapa de solo lectura: muestra un pin en lat/lon, sin interacción.
// Se usa para que el admin vea de un vistazo dónde cae la ubicación propuesta.
export default function MapPreview({ lat, lon, height = 150 }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    if (lat == null || lon == null) return;
    let cancelled = false;

    import('leaflet').then(({ default: L }) => {
      if (cancelled || mapRef.current || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [lat, lon], zoom: 15,
        zoomControl: false, attributionControl: false,
        dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
        boxZoom: false, keyboard: false, touchZoom: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      const icon = L.divIcon({ className: '', html: PIN_HTML, iconSize: [18, 18], iconAnchor: [9, 9] });
      L.marker([lat, lon], { icon }).addTo(map);
      mapRef.current = map;
      // El card se renderiza dentro de un flex column; forzamos el recálculo de tiles.
      setTimeout(() => mapRef.current?.invalidateSize(), 0);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lon]);

  if (lat == null || lon == null) return null;
  return (
    <div ref={containerRef} style={{ height, width: '100%' }}
      className="rounded-md overflow-hidden border border-border-mid" />
  );
}
