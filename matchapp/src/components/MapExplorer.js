"use client"; 

import { useEffect, useState, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';

// Solución al bug clásico de los íconos rotos en Leaflet + React
const createCustomIcon = (color) => {
  return new L.Icon({
    // Usamos íconos genéricos alojados en un CDN gratuito
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

export default function MapExplorer() {
  const { userToken } = useContext(AuthContext);
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState([-34.6037, -58.3816]); // Buenos Aires por defecto

  // 1. OBTENER PARTIDOS Y UBICACIÓN DEL NAVEGADOR
  useEffect(() => {
    // Pedir ubicación al navegador
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Error GPS Navegador:", error.message);
        }
      );
    }

    // Pedir partidos al Backend
    const fetchMatches = async () => {
      try {
        const response = await axios.get('/matches', {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        setMatches(response.data);
      } catch (error) {
        console.error("Error cargando partidos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userToken) fetchMatches();
  }, [userToken]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full text-gray-500">Cargando mapa interactivo...</div>;
  }

  return (
    <MapContainer 
      center={userLocation} 
      zoom={13} 
      scrollWheelZoom={true} 
      className="rounded-2xl shadow-inner border border-gray-200"
    >
      {/* MAGIA DE OPENSTREETMAP */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* DIBUJAR PINES (Markers) */}
      {matches.map((match) => {
        // Color verde para Fútbol, azul para los demás
        const markerColor = match.sport_name === 'Fútbol' ? 'green' : 'blue';
        
        return (
          <Marker 
            key={match.id} 
            position={[match.latitude, match.longitude]}
            icon={createCustomIcon(markerColor)}
          >
            <Popup>
              <div className="text-center p-2">
                <h3 className="font-bold text-lg text-gray-800">{match.sport_name}</h3>
                <p className="text-sm text-gray-600 font-medium mb-2">{match.format_name}</p>
                <p className="text-xs text-blue-600 font-bold mb-3">
                  📅 {new Date(match.time_start_window).toLocaleDateString()} a las {new Date(match.time_start_window).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                <button 
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full transition-colors"
                  onClick={() => alert(`En un futuro esto abrirá la sala de chat del partido #${match.id}`)}
                >
                  Ver Detalles
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}