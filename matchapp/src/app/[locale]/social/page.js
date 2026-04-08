"use client";

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import axios from '../../../api/axiosConfig';

export default function SocialPage() {
  const { userToken, isLoading } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchSocialData = async () => {
    try {
      const res = await axios.get('/friends', { headers: { Authorization: `Bearer ${userToken}` }});
      setFriends(res.data.acceptedFriends);
      setRequests(res.data.pendingRequests);
    } catch (err) { console.error("Error cargando amigos:", err); }
  };

  useEffect(() => {
    if (userToken) fetchSocialData();
  }, [userToken]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.length < 3) return alert('Escribe al menos 3 letras.');
    
    setIsSearching(true);
    try {
      const res = await axios.get(`/friends/search?query=${searchQuery}`, { headers: { Authorization: `Bearer ${userToken}` }});
      setSearchResults(res.data);
    } catch (err) { alert('Error en la búsqueda.'); } finally { setIsSearching(false); }
  };

  const handleAddFriend = async (friendId, name) => {
    try {
      await axios.post('/friends/request', { friend_id: friendId }, { headers: { Authorization: `Bearer ${userToken}` }});
      alert(`Solicitud enviada a ${name}`);
      setSearchResults(prev => prev.filter(u => u.id !== friendId));
    } catch (err) { alert(err.response?.data?.error || "Error al enviar."); }
  };

  const handleAcceptRequest = async (friendId) => {
    try {
      await axios.put('/friends/accept', { friend_id: friendId }, { headers: { Authorization: `Bearer ${userToken}` }});
      fetchSocialData();
    } catch (err) { alert("Error al aceptar."); }
  };

  const handleRemoveFriend = async (friendId, name) => {
    if(!window.confirm(`¿Seguro que quieres eliminar a ${name} de tus amigos?`)) return;
    try {
      await axios.delete(`/friends/${friendId}`, { headers: { Authorization: `Bearer ${userToken}` }});
      fetchSocialData();
    } catch (err) { alert("Error al eliminar."); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando Red Social...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* COLUMNA IZQUIERDA: BUSCADOR */}
      <div className="lg:col-span-1">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Comunidad</h2>
          <p className="text-gray-500 font-medium mb-6">Encuentra a otros deportistas para formar equipos.</p>
          
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Ej: Carlos..." 
              className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" disabled={isSearching} className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl font-bold transition-colors shadow-md">
              {isSearching ? '...' : 'Buscar'}
            </button>
          </form>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {searchResults.length === 0 && searchQuery.length > 2 && !isSearching && <p className="text-gray-400 text-sm text-center italic py-10">No hay resultados.</p>}
            {searchResults.map(user => (
              <div key={user.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm hover:border-blue-300 transition-colors">
                <div>
                  <p className="font-bold text-gray-800 text-lg">{user.username}</p>
                  <p className="text-xs text-gray-500 font-bold mt-1">⭐ Karma: {user.reliability_score}%</p>
                </div>
                <button onClick={() => handleAddFriend(user.id, user.username)} className="bg-green-100 hover:bg-green-200 text-green-700 p-3 rounded-xl font-extrabold transition-colors">
                  + Agregar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COLUMNA DERECHA: AMIGOS Y SOLICITUDES */}
      <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[70vh]">
        
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button onClick={() => setActiveTab('friends')} className={`flex-1 py-5 font-bold text-lg transition-colors ${activeTab === 'friends' ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
            Mis Amigos ({friends.length})
          </button>
          <button onClick={() => setActiveTab('requests')} className={`flex-1 py-5 font-bold text-lg transition-colors flex justify-center items-center gap-2 ${activeTab === 'requests' ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
            Solicitudes 
            {requests.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow-md animate-pulse">{requests.length}</span>}
          </button>
        </div>

        <div className="p-8 flex-1 bg-gray-50/30">
          {activeTab === 'friends' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.length === 0 ? <div className="col-span-2 text-center py-32 text-gray-400 font-medium text-xl">Tu lista de amigos está vacía.</div> : (
                friends.map(friend => (
                  <div key={friend.user_id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center group hover:border-blue-400 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-tr from-gray-100 to-gray-200 border border-gray-300 text-gray-600 rounded-full flex items-center justify-center font-black text-2xl shadow-inner">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-800 text-lg">{friend.username}</p>
                        <p className="text-sm text-green-600 font-bold mt-1">⭐ {friend.reliability_score}% <span className="text-gray-300 mx-2">|</span> <span className="text-blue-600">🏆 {friend.global_elo}</span></p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveFriend(friend.user_id, friend.username)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-3 rounded-xl transition-all opacity-0 group-hover:opacity-100 font-bold text-xl" title="Eliminar Amigo">
                      &times;
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {requests.length === 0 ? <div className="text-center py-32 text-gray-400 font-medium text-xl">No hay solicitudes pendientes.</div> : (
                requests.map(req => (
                  <div key={req.user_id} className="bg-white p-6 rounded-2xl border border-yellow-300 shadow-md flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-yellow-400"></div>
                    <div className="pl-4">
                      <p className="font-extrabold text-gray-800 text-lg mb-1"><span className="text-blue-600">{req.username}</span> te ha enviado una solicitud</p>
                      <p className="text-sm text-gray-500 font-bold">Fiabilidad Histórica: <span className="text-yellow-600">{req.reliability_score}%</span></p>
                    </div>
                    <button onClick={() => handleAcceptRequest(req.user_id)} className="bg-green-500 hover:bg-green-600 text-white font-extrabold py-3 px-8 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1">
                      Aceptar
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}