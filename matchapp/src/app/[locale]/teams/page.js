"use client";

import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import axios from '../../../api/axiosConfig';
import { useRouter } from '../../../i18n/navigation';

export default function TeamsPage() {
  const { userToken, isLoading } = useContext(AuthContext);
  const router = useRouter();
  
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // --- ESTADOS PARA EL MODAL DE CREAR EQUIPO ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sportsList, setSportsList] = useState([]);
  const [formatsList, setFormatsList] = useState([]);
  
  const [teamName, setTeamName] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // 1. CARGAR MIS EQUIPOS Y LA LISTA DE DEPORTES
  const fetchTeamsAndSports = async () => {
    setLoadingTeams(true);
    try {
      // Pedimos mis equipos
      const resTeams = await axios.get('/teams', { headers: { Authorization: `Bearer ${userToken}` }});
      setTeams(resTeams.data);

      // Pedimos la lista de deportes para el Modal
      const resSports = await axios.get('/sports');
      // Filtramos SOLO los deportes que permiten equipos (TEAM_VS_TEAM y >1 jugador)
      const teamSports = resSports.data.filter(sport => sport.type === 'TEAM_VS_TEAM');
      setSportsList(teamSports.map(s => ({ ...s, value: s.id, label: s.name })));
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    if (userToken) fetchTeamsAndSports();
  }, [userToken]);

  // 2. MANEJAR EL CAMBIO DE DEPORTE EN EL MODAL
  const handleSportChange = (e) => {
    const sportId = parseInt(e.target.value);
    setSelectedSport(sportId);
    setSelectedFormat('');
    
    if (sportId) {
      const sport = sportsList.find(s => s.value === sportId);
      if (sport) {
        // Solo guardamos los formatos que exigen más de 1 jugador
        const validFormats = sport.formats.filter(f => f.players_per_team > 1);
        setFormatsList(validFormats.map(f => ({ ...f, value: f.id, label: f.name })));
      }
    } else {
      setFormatsList([]);
    }
  };

  // 3. ENVIAR EL NUEVO EQUIPO AL BACKEND
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError('');

    if (!teamName.trim() || !selectedFormat) {
      return setError('Debes ponerle un nombre al equipo y seleccionar un formato.');
    }

    setIsCreating(true);
    try {
      await axios.post('/teams', {
        name: teamName,
        sport_format_id: selectedFormat
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      // Si tuvo éxito, cerramos el modal, limpiamos el formulario y recargamos la lista
      setShowCreateModal(false);
      setTeamName('');
      setSelectedSport('');
      setSelectedFormat('');
      fetchTeamsAndSports(); 
    } catch (err) {
      setError(err.response?.data?.error || "Error al fundar el equipo.");
    } finally {
      setIsCreating(false);
    }
  };

  // --- RENDERIZADO VISUAL ---
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Mis Equipos</h1>
          <p className="text-gray-500 font-medium">Gestiona tus plantillas y estadísticas.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors w-full md:w-auto"
        >
          + Fundar Equipo
        </button>
      </div>

      {/* LISTA DE EQUIPOS */}
      {loadingTeams ? (
        <div className="text-center text-gray-500 py-20">Cargando tus equipos...</div>
      ) : teams.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center">
          <span className="text-6xl mb-4 block">🛡️</span>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Sin Equipos</h3>
          <p className="text-gray-500">No perteneces a ningún equipo. Crea el tuyo o espera a ser invitado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <div 
              key={team.id} 
              onClick={() => router.push(`/teams/${team.id}`)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 group-hover:bg-green-500 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">{team.name}</h3>
                {team.is_captain && <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded">👑 Capitán</span>}
              </div>
              
              <p className="text-blue-600 font-bold text-sm mb-4">{team.sport_name} - {team.format_name}</p>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-gray-600 text-sm font-medium flex items-center gap-1">👥 {team.current_members} / {team.players_per_team} Jugadores</span>
                <span className="text-gray-800 font-bold text-sm bg-gray-100 px-3 py-1 rounded-lg">ELO: {team.elo_rating}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FUNDAR NUEVO EQUIPO */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl font-bold">
              &times;
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Fundar Club</h2>
            <p className="text-gray-500 text-sm mb-6">Elige los colores y la disciplina de tu nuevo equipo.</p>
            
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold text-center border border-red-200">{error}</div>}

            <form onSubmit={handleCreateTeam} className="space-y-4">
              
              {/* Nombre */}
              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">Nombre del Equipo</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 font-medium rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: Los Galácticos FC"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Deporte */}
              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">Deporte</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 font-medium rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedSport}
                  onChange={handleSportChange}
                >
                  <option value="">Selecciona un deporte...</option>
                  {sportsList.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Formato */}
              {selectedSport && (
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">Formato</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 font-medium rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                  >
                    <option value="">Selecciona el formato...</option>
                    {formatsList.map(f => <option key={f.value} value={f.value}>{f.label} ({f.players_per_team} Jugadores)</option>)}
                  </select>
                </div>
              )}

              {/* Botón Guardar */}
              <button 
                type="submit" 
                disabled={isCreating || !teamName || !selectedFormat}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl mt-4 shadow-md transition-colors text-lg flex justify-center items-center"
              >
                {isCreating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Confirmar Fundación'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}