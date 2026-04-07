"use client";

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../../context/AuthContext';
import axios from '../../../../api/axiosConfig';
import { useParams, useRouter } from 'next/navigation';
import { Link } from '../../../../i18n/navigation';

export default function TeamDetailsWeb() {
  const params = useParams();
  const teamId = params.teamId;
  const router = useRouter();
  const { userToken, userInfo, isLoading } = useContext(AuthContext);

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [eligibleFriends, setEligibleFriends] = useState([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. CARGAR DATOS DEL EQUIPO Y LA PLANTILLA
  const fetchTeamData = async () => {
    setLoadingData(true);
    setError('');
    try {
      // Buscar los detalles básicos del equipo (De la lista general)
      const resTeams = await axios.get('/teams', { headers: { Authorization: `Bearer ${userToken}` }});
      const currentTeam = resTeams.data.find(t => t.id === parseInt(teamId));
      
      if (!currentTeam) {
        setError("Equipo no encontrado o no tienes acceso.");
        setLoadingData(false);
        return;
      }
      setTeam(currentTeam);

      // Cargar la plantilla (jugadores)
      const resMembers = await axios.get(`/teams/${teamId}/members`, { headers: { Authorization: `Bearer ${userToken}` }});
      setMembers(resMembers.data);

      // Si soy el capitán, cargo mis amigos disponibles para fichar
      if (currentTeam.is_captain) {
        const resFriends = await axios.get(`/teams/${teamId}/eligible-friends`, { headers: { Authorization: `Bearer ${userToken}` }});
        setEligibleFriends(resFriends.data);
      }
    } catch (err) {
      setError("Error cargando la información del equipo.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (userToken && teamId) fetchTeamData();
  }, [userToken, teamId]);

  // 2. ACCIONES DE GESTIÓN (Fichar, Expulsar, Salir, Disolver)
  const handleAddFriend = async (friendId) => {
    setIsActionLoading(true);
    try {
      await axios.post(`/teams/${teamId}/add-member`, { friend_id: friendId }, { headers: { Authorization: `Bearer ${userToken}` }});
      setShowInviteModal(false);
      fetchTeamData(); // Recargar plantilla
    } catch (err) {
      alert(err.response?.data?.error || "Error al añadir jugador.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveMember = async (userIdToRemove, isMe) => {
    const confirmMsg = isMe ? "¿Seguro que quieres abandonar este equipo?" : "¿Seguro que quieres expulsar a este jugador?";
    if (!window.confirm(confirmMsg)) return;

    try {
      await axios.delete(`/teams/${teamId}/members/${userIdToRemove}`, { headers: { Authorization: `Bearer ${userToken}` }});
      if (isMe) {
        router.push('/teams'); // Si me salgo, vuelvo a la lista de equipos
      } else {
        fetchTeamData(); // Si expulso a otro, recargo la tabla
      }
    } catch (err) {
      alert(err.response?.data?.error || "Error al modificar la plantilla.");
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm("⚠️ ¿Estás completamente seguro de disolver el equipo? Esta acción no se puede deshacer y todos los jugadores serán expulsados.")) return;
    
    try {
      await axios.delete(`/teams/${teamId}`, { headers: { Authorization: `Bearer ${userToken}` }});
      router.push('/teams');
    } catch (err) {
      alert("Error al disolver el equipo.");
    }
  };

  if (isLoading || loadingData) return <div className="min-h-screen flex items-center justify-center">Cargando Escudo...</div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center text-red-500 font-bold"><p>{error}</p><Link href="/teams" className="mt-4 text-blue-500 underline">Volver</Link></div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      
      {/* CABECERA DEL EQUIPO */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-green-500 p-8 md:p-12 text-white relative">
          <Link href="/teams" className="absolute top-6 left-6 text-white/80 hover:text-white font-bold flex items-center gap-2 transition-colors">
            ← Volver
          </Link>
          <div className="mt-6">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2">{team.name}</h1>
            <p className="text-xl font-medium text-blue-100">{team.sport_name} <span className="mx-2">•</span> {team.format_name}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-gray-100">
          <div><p className="text-gray-500 text-sm">Rol</p><p className="font-bold text-lg text-gray-800">{team.is_captain ? '👑 Capitán' : '🏃‍♂️ Jugador'}</p></div>
          <div><p className="text-gray-500 text-sm">Plantilla</p><p className="font-bold text-lg text-gray-800">{members.length} / {team.players_per_team}</p></div>
          <div><p className="text-gray-500 text-sm">ELO Global</p><p className="font-bold text-lg text-blue-600">{team.elo_rating} pts</p></div>
          <div><p className="text-gray-500 text-sm">Estado</p><p className="font-bold text-lg text-green-500">Activo</p></div>
        </div>
      </div>

      {/* ZONA DE PLANTILLA Y GESTIÓN */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 md:p-8">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">Plantilla Actual</h2>
          
          {/* Botón de Fichar (Solo Capitán) */}
          {team.is_captain && (
            <button onClick={() => setShowInviteModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-sm">
              + Invitar Amigo
            </button>
          )}
        </div>

        {/* TABLA DE JUGADORES */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="p-4 rounded-tl-xl">Jugador</th>
                <th className="p-4">Rol</th>
                <th className="p-4">Fiabilidad</th>
                <th className="p-4 rounded-tr-xl text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => {
                const isMe = member.user_id === userInfo.id;
                return (
                  <tr key={member.user_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">{member.username.charAt(0).toUpperCase()}</div>
                      {member.username} {isMe && <span className="text-xs text-gray-400 font-normal ml-2">(Tú)</span>}
                    </td>
                    <td className="p-4">{member.is_captain ? <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Capitán</span> : 'Jugador'}</td>
                    <td className="p-4 font-medium text-green-600">{member.reliability_score}%</td>
                    <td className="p-4 text-right">
                      {isMe && !team.is_captain && (
                        <button onClick={() => handleRemoveMember(member.user_id, true)} className="text-red-500 hover:text-red-700 text-sm font-bold px-3 py-1 bg-red-50 rounded-lg">Abandonar</button>
                      )}
                      {team.is_captain && !isMe && (
                        <button onClick={() => handleRemoveMember(member.user_id, false)} className="text-red-500 hover:text-red-700 text-sm font-bold px-3 py-1 bg-red-50 rounded-lg">Expulsar</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ZONA DE PELIGRO (Solo Capitán) */}
        {team.is_captain && (
          <div className="mt-12 pt-6 border-t border-red-100">
            <h3 className="text-red-600 font-bold mb-2">Zona de Peligro</h3>
            <button onClick={handleDeleteTeam} className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-6 py-2 rounded-xl font-bold transition-colors">
              Disolver Equipo
            </button>
          </div>
        )}
      </div>

      {/* MODAL PARA FICHAR AMIGOS */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Fichar Amigos</h2>
            
            {eligibleFriends.length === 0 ? (
              <p className="text-gray-500 text-center py-6 bg-gray-50 rounded-xl">No tienes amigos disponibles o ya están todos en el equipo.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {eligibleFriends.map(friend => (
                  <div key={friend.user_id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <span className="font-bold text-gray-700">{friend.username}</span>
                    <button 
                      onClick={() => handleAddFriend(friend.user_id)}
                      disabled={isActionLoading}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      {isActionLoading ? '...' : 'Fichar'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <button onClick={() => setShowInviteModal(false)} className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}