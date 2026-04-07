"use client";

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../../context/AuthContext';
import axios from '../../../../api/axiosConfig';
import { io } from 'socket.io-client';
import { Link } from '../../../../i18n/navigation';
import { useParams } from 'next/navigation';
import { useRouter } from '../../../../i18n/navigation';
import dynamic from 'next/dynamic';


// Importamos el mapa dinámicamente para que no crashee en SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

export default function WebMatchLobby() {
  const params = useParams();
  const matchId = params.matchId;
  const router = useRouter();
  const { userToken, userInfo } = useContext(AuthContext);

  const [matchData, setMatchData] = useState(null);
  const [myEligibleTeams, setMyEligibleTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    if (!matchId || !userToken) return;

    const fetchLobbyData = async () => {
      try {
        const resMatch = await axios.get(`/matches/${matchId}`, { headers: { Authorization: `Bearer ${userToken}` }});
        const match = resMatch.data;
        setMatchData(match);

        if (match.sport_type === 'TEAM_VS_TEAM' && match.players_per_team > 1) {
          const resTeams = await axios.get('/teams', { headers: { Authorization: `Bearer ${userToken}` }});
          const validTeams = resTeams.data.filter(t => t.is_captain && t.format_name === match.format_name && t.sport_name === match.sport_name);
          setMyEligibleTeams(validTeams.map(t => ({ label: t.name, value: t.id })));
        }
      } catch (err) {
        setError('No se pudo cargar el Lobby. Quizás fue cancelado.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLobbyData();
  }, [matchId, userToken]);

  const handleJoinMatch = async () => {
    setError('');
    const requiresTeam = matchData.players_per_team > 1;
    if (requiresTeam && !selectedTeam) return setError('Debes seleccionar con qué equipo quieres desafiar.');

    setIsJoining(true);
    try {
      await axios.post(`/matches/${matchId}/join`, { team_id: requiresTeam ? parseInt(selectedTeam) : null }, { headers: { Authorization: `Bearer ${userToken}` }});
      router.push(`/match-room/${matchId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al intentar unirte.');
      setIsJoining(false);
    }
  };

  // Ícono rojo nativo de Leaflet para evitar errores en web
  const getRedIcon = () => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      return new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41]
      });
    }
    return null;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Cargando Lobby...</div>;
  if (error && !matchData) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">{error}</div>;

  const requiresTeam = matchData.players_per_team > 1;

  return (
    <div className="min-h-[85vh] bg-gray-50 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* CABECERA */}
        <div className="bg-gray-800 text-white p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b-4 border-gray-900">
          <div>
            <Link href="/" className="text-gray-400 hover:text-white text-sm flex items-center mb-2 transition-colors w-max">
              ← Volver al Dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold">{matchData.sport_name} <span className="text-blue-400">{matchData.format_name}</span></h1>
            <p className="text-gray-300 mt-1 font-medium">👑 {matchData.creator_name} <span className="text-gray-500 mx-2">VS</span> ⚔️ {matchData.challenger_name || 'Buscando...'}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full font-bold text-sm w-max ${matchData.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-yellow-500'}`}>
              {matchData.status === 'CONFIRMED' ? 'Confirmado' : matchData.status}
            </div>

            {/* BOTÓN ABANDONAR / EXPULSAR (Solo aparece si el partido está confirmado) */}
            {matchData.status === 'CONFIRMED' && (
              <button 
                onClick={async () => {
                  const isCreator = matchData.is_me_creator;
                  const confirmMsg = isCreator ? '¿Seguro que quieres expulsar al rival? El partido volverá al mapa global.' : '¿Seguro que quieres abandonar este partido?';
                  
                  if(window.confirm(confirmMsg)) {
                    try {
                      await axios.post(`/matches/${matchId}/leave`, {}, { headers: { Authorization: `Bearer ${userToken}` }});
                      alert(isCreator ? 'Rival expulsado.' : 'Has abandonado el partido.');
                      // Lo devolvemos al Dashboard porque la sala de chat de este encuentro se borró
                      window.location.href = '/'; 
                    } catch (err) { alert("No se pudo realizar la acción."); }
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors border border-red-600 shadow-sm"
              >
                {matchData.is_me_creator ? 'Expulsar Rival' : 'Abandonar'}
              </button>
            )}
          </div>
        </div>

        {/* INFO CREADOR */}
        <div className="p-8 border-b border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-500 font-bold mb-3 uppercase tracking-wider">Detalles del Servidor</p>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
              {matchData.creator_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">Creado por: {matchData.creator_name}</p>
              <p className="text-sm text-gray-500 font-medium">⭐ Karma: {matchData.creator_karma}%</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <div className="flex-1 bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 font-bold flex items-center justify-center gap-2">
              <span>📅</span> {new Date(matchData.time_start_window).toLocaleDateString()} - {new Date(matchData.time_start_window).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            {/* BOTÓN PARA ABRIR MAPA */}
            <button onClick={() => setShowMapModal(true)} className="flex-1 bg-gray-800 hover:bg-gray-900 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
              <span>📍</span> Ver Ubicación
            </button>
          </div>
        </div>

        {/* ZONA DE DESAFÍO */}
        <div className="p-8">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold text-center border border-red-200">{error}</div>}

          {requiresTeam ? (
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-6">
              <h3 className="text-blue-800 font-bold text-lg mb-2">Prepara tu Táctica</h3>
              <p className="text-blue-600 text-sm mb-4">Elige qué equipo enviará al campo para este partido de {matchData.format_name}.</p>
              
              {myEligibleTeams.length > 0 ? (
                <select className="w-full p-4 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 outline-none shadow-sm cursor-pointer" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                  <option value="">Selecciona tu equipo...</option>
                  {myEligibleTeams.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-red-200 text-red-600 font-bold text-sm text-center">
                  ⚠️ No tienes equipos de {matchData.sport_name} en formato {matchData.format_name} donde seas capitán. Ve a la pestaña Equipos y crea uno primero.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center mb-6"><h3 className="text-gray-800 font-bold text-lg">Duelo Individual</h3><p className="text-gray-500">Jugarás este partido como {userInfo?.username}. No se requiere equipo.</p></div>
          )}

          <button onClick={handleJoinMatch} disabled={isJoining || (requiresTeam && !selectedTeam)} className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-extrabold text-xl py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex justify-center items-center gap-3">
            {isJoining ? 'Procesando...' : '🔥 DESAFIAR AL CREADOR 🔥'}
          </button>
        </div>

      </div>

      {/* MODAL DEL MAPA */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-2xl h-[70vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowMapModal(false)} className="absolute top-4 right-4 z-50 bg-white text-gray-600 hover:text-red-500 w-10 h-10 rounded-full font-bold text-xl shadow-md border border-gray-100 flex items-center justify-center transition-colors">
              &times;
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Ubicación del Partido</h2>
            <div className="flex-1 rounded-2xl overflow-hidden border-2 border-gray-200 z-0">
              <MapContainer center={[matchData.latitude, matchData.longitude]} zoom={15} className="w-full h-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[matchData.latitude, matchData.longitude]} icon={getRedIcon()} />
              </MapContainer>
            </div>
            <button onClick={() => setShowMapModal(false)} className="mt-4 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl transition-colors">Cerrar Mapa</button>
          </div>
        </div>
      )}

    </div>
  );
}