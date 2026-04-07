"use client";

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

// 1. EL MARCADOR QUE PONES CON EL CLICK
function LocationMarker({ position, setPosition, onLocationSelect }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng); 
    },
  });

  return position === null ? null : <Marker position={position} icon={redIcon} />;
}

// 2. EL CONTROLADOR QUE VUELA AL GPS SUAVEMENTE
function MapController({ center, isGpsReady }) {
  const map = useMap();
  
  useEffect(() => {
    // Solo vuela si ya obtuvimos el GPS real
    if (isGpsReady && center) {
      console.log("🚁 Volando a coordenadas:", center);
      // flyTo es una animación suave de Leaflet
      map.flyTo(center, 14, { animate: true, duration: 1.5 });
    }
  }, [isGpsReady, center, map]); // Solo reacciona si el GPS cambia a "listo"
  
  return null;
}

// 3. EL COMPONENTE PRINCIPAL
export default function LocationPickerMap({ onLocationSelect }) {
  const [position, setPosition] = useState(null);
  
  const defaultLocation = [-35.4474, -71.687215];
  const [center, setCenter] = useState(defaultLocation);
  
  // Estados para controlar UI sin romper Next.js
  const [gpsStatus, setGpsStatus] = useState("Buscando GPS...");
  const [isGpsReady, setIsGpsReady] = useState(false);

  // Usamos una referencia para no pedir el GPS dos veces (React Strict Mode)
  const gpsRequested = useRef(false);

  useEffect(() => {
    // Si ya pedimos el GPS, no lo pedimos de nuevo
    if (gpsRequested.current) return;
    gpsRequested.current = true;

    // Función asíncrona segura para el useEffect
    const fetchLocation = async () => {
      if (!("geolocation" in navigator)) {
        // Envolvemos los setStates inmediatos en un setTimeout de 0ms 
        // para que pasen a la cola de eventos y Next.js no llore por "cascading renders"
        setTimeout(() => setGpsStatus("GPS no soportado"), 0);
        return;
      }

      console.log("🛰️ Solicitando GPS al navegador...");

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("✅ GPS Encontrado:", pos.coords.latitude, pos.coords.longitude);
          setCenter([pos.coords.latitude, pos.coords.longitude]);
          setGpsStatus("Ubicación exacta encontrada.");
          setIsGpsReady(true);
        },
        (error) => {
          // Cambiamos a console.warn para que Next.js no salte con una pantalla de error gigante
          console.warn("⚠️ El navegador no pudo dar el GPS:", error.message);
          
          let errorMsg = "Usa el mapa manualmente.";
          if (error.code === 1) errorMsg = "Permiso de GPS denegado.";
          if (error.code === 2) errorMsg = "Red sin ubicación.";
          if (error.code === 3) errorMsg = "El satélite tardó demasiado.";
          
          // Actualizamos el cartelito del mapa
          setGpsStatus(errorMsg);
          // Opcional: Apagamos el isGpsReady por si estaba trabado
          setIsGpsReady(false);
        },
        { 
          enableHighAccuracy: false, 
          timeout: 10000, 
          maximumAge: 300000 
        }
      );
    };

    fetchLocation();
  }, []);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      
      {/* LETRERO INFORMATIVO DE GPS */}
      <div className="absolute top-2 left-2 z-[1000] bg-white/95 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md border border-gray-200 flex items-center gap-2">
        {!isGpsReady && !gpsStatus.includes("denegado") && (
          <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        )}
        <span className={isGpsReady ? "text-green-600" : "text-gray-700"}>{gpsStatus}</span>
      </div>

      <MapContainer 
        center={defaultLocation} // Inicia siempre en default para evitar saltos raros
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        {/* Pasamos isGpsReady para que vuele solo cuando se confirme */}
        <MapController center={center} isGpsReady={isGpsReady} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
}