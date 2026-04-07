"use client";

import { useEffect, useState, useContext } from 'react';
// AÑADE 'useMap' AQUÍ
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { useRouter } from '../i18n/navigation'; // <-- USA ESTE


const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });
};

// NUEVO: Vuela al GPS cuando esté listo
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

// Aceptamos los filtros por props desde la página de Explorar
export default function MapExplorer({ filterSport, filterFormat }) {
  const { userToken } = useContext(AuthContext);
  const router = useRouter();
  
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState([-35.4474, -71.687215]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn("⚠️ GPS Explorador falló:", err.message), // <-- Cambia a console.warn
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 } // <-- Opciones más amigables
      );
    }

    const fetchMatches = async () => {
      try {
        const response = await axios.get('/matches', { headers: { Authorization: `Bearer ${userToken}` }});
        setMatches(response.data);
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    if (userToken) fetchMatches();
  }, [userToken]);

  // Aplicar filtros en tiempo real
  const filteredMatches = matches.filter(match => {
    if (filterFormat) return match.format_id === filterFormat;
    if (filterSport) return match.sport_id === filterSport;
    return true;
  });

  if (isLoading) return <div className="flex justify-center items-center h-full text-gray-500">Cargando mapa interactivo...</div>;

  return (
    <MapContainer center={userLocation} zoom={13} scrollWheelZoom={true} className="w-full h-full z-0">
      
      {/* AÑADE EL CONTROLADOR AQUÍ */}
      <MapController center={userLocation} />

      <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {filteredMatches.map((match) => (
        <Marker key={match.id} position={[match.latitude, match.longitude]} icon={createCustomIcon(match.sport_name === 'Fútbol' ? 'green' : 'blue')}>
          <Popup>
            <div className="text-center p-2 min-w-[150px]">
              <h3 className="font-bold text-lg text-gray-800">{match.sport_name}</h3>
              <p className="text-sm text-gray-600 font-medium mb-2">{match.format_name}</p>
              <p className="text-xs text-blue-600 font-bold mb-3">
                📅 {new Date(match.time_start_window).toLocaleDateString()} a las {new Date(match.time_start_window).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
              <button 
                className={`${match.is_mine ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white font-bold py-2 px-4 rounded w-full transition-colors shadow-md`}
                onClick={async () => {
                  if (match.is_mine) {
                    if(window.confirm('¿Seguro que quieres eliminar este partido que creaste?')) {
                      try {
                        await axios.delete(`/matches/${match.id}`, { headers: { Authorization: `Bearer ${userToken}` }});
                        window.location.reload(); // Recargamos para que desaparezca el pin
                      } catch (e) { alert("No se pudo cancelar"); }
                    }
                  } else {
                    router.push(`/match-lobby/${match.id}`);
                  }
                }}
              >
                {match.is_mine ? 'Cancelar (Creado por mí)' : 'Ver Detalles / Unirse'}
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}