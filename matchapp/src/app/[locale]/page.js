"use client";

import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useTranslations } from 'next-intl';
import axios from '../../api/axiosConfig';
import { Link } from '../../i18n/navigation';

export default function Home() {
  const { userToken, userInfo, login, isLoading } = useContext(AuthContext);
  
  // Estados Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados Partidos
  const [futureMatches, setFutureMatches] = useState([]);
  const [toEvaluateMatches, setToEvaluateMatches] = useState([]);
  const [myLobbies, setMyLobbies] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  const tLogin = useTranslations('Login');

  useEffect(() => {
    if (userToken) {
      const fetchMatches = async () => {
        try {
          const response = await axios.get('/matches/my-matches', { headers: { Authorization: `Bearer ${userToken}` }});
          
          // 1. Partidos Futuros Confirmados
          setFutureMatches(response.data.upcoming.filter(m => m.status === 'CONFIRMED'));
          // 2. Partidos Pasados esperando evaluación (Tercer Tiempo)
          setToEvaluateMatches(response.data.upcoming.filter(m => m.status === 'PENDING_RESULT'));
          // 3. Mis Lobbies (Buscando rival)
          setMyLobbies(response.data.upcoming.filter(m => m.status === 'WAITING_CHALLENGER'));
          
        } catch (error) { console.error("Error cargando partidos:", error); } finally { setIsLoadingMatches(false); }
      };
      fetchMatches();
    }
  }, [userToken]);

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError(''); setIsSubmitting(true);
    try { await login(email, password); } catch (err) { setError(err); } finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  // --- VISTA DE INICIO (LOGUEADO) ---
  if (userToken) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        
        {/* CABECERA DE PERFIL RÁPIDA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">
              {userInfo?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">¡Bienvenido de vuelta, {userInfo?.username}!</h1>
              <p className="text-sm text-gray-500">⭐ {userInfo?.reliability_score}% Fiabilidad | 🏆 {userInfo?.global_elo} ELO</p>
            </div>
          </div>
          <Link href="/explore" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors hidden md:block shadow-md">
            + Buscar Nuevos Partidos
          </Link>
        </div>

        {isLoadingMatches ? (
          <div className="text-center text-gray-500 py-10">Cargando tu calendario...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMNA 1: POR EVALUAR (URGENTES) */}
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex justify-between items-center">
                <span>🏆 Evalua a tu Rival</span>
                <span className="bg-red-100 text-red-600 text-xs py-1 px-3 rounded-full font-bold">{toEvaluateMatches.length}</span>
              </h2>
              {toEvaluateMatches.length === 0 ? <p className="text-gray-400 text-sm italic">Todo evaluado al día.</p> : (
                toEvaluateMatches.map(match => (
                  <div key={match.id} className="bg-red-50 p-4 rounded-xl mb-3 border border-red-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-red-800 text-sm">{match.sport_name}</span>
                      <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded font-bold">{match.format_name}</span>
                    </div>
                    <p className="text-xs text-red-600 font-medium mb-1">
                      📅 {match.time_start_window.split('T')[0].split('-').reverse().join('/')} a las {match.time_start_window.split('T')[1].substring(0, 5)}
                    </p>
                    <p className="text-xs text-gray-600 font-bold mb-3 border-t border-red-100 pt-2 mt-2">
                      ⚔️ Jugado contra: {match.is_creator ? (match.challenger_name || 'Desconocido') : (match.creator_name || 'Desconocido')}
                    </p>
                    <Link href={`/match-room/${match.id}`} className="block text-center bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                      Evaluar Resultado
                    </Link>
                  </div>
                ))
              )}
            </div>

            {/* COLUMNA 2: FUTUROS */}
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex justify-between items-center">
                <span>🗓️ Próximos Partidos</span>
                <span className="bg-green-100 text-green-600 text-xs py-1 px-3 rounded-full font-bold">{futureMatches.length}</span>
              </h2>
              {futureMatches.length === 0 ? <p className="text-gray-400 text-sm italic">No tienes partidos confirmados.</p> : (
                futureMatches.map(match => (
                  <div key={match.id} className="bg-green-50 p-4 rounded-xl mb-3 border border-green-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-green-900 text-sm">{match.sport_name}</span>
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded font-bold">{match.format_name}</span>
                    </div>
                    <p className="text-xs text-green-700 font-bold mb-1">
                      📅 {match.time_start_window.split('T')[0].split('-').reverse().join('/')} a las {match.time_start_window.split('T')[1].substring(0, 5)}
                    </p>
                    <p className="text-xs text-gray-600 font-bold mb-3 border-t border-green-100 pt-2 mt-2">
                      ⚔️ Rival: {match.is_creator ? (match.challenger_name || 'Desconocido') : (match.creator_name || 'Desconocido')}
                    </p>
                    <Link href={`/match-room/${match.id}`} className="block text-center bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                      Abrir Sala de Chat
                    </Link>
                  </div>
                ))
              )}
            </div>

            {/* COLUMNA 3: MIS LOBBIES */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex justify-between items-center">
                <span>📡 Mis Servidores</span>
                <span className="bg-blue-100 text-blue-600 text-xs py-1 px-3 rounded-full font-bold">{myLobbies.length}</span>
              </h2>
              {myLobbies.length === 0 ? <p className="text-gray-400 text-sm italic">No tienes Lobbies buscando rival.</p> : (
                myLobbies.map(match => (
                  <div key={match.id} className="bg-blue-50 p-4 rounded-xl mb-3 border border-blue-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-blue-900 text-sm">{match.sport_name}</span>
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-bold">{match.format_name}</span>
                    </div>
                    <p className="text-xs text-blue-600 font-bold mb-3">
                      📅 {match.time_start_window.split('T')[0].split('-').reverse().join('/')} a las {match.time_start_window.split('T')[1].substring(0, 5)}
                    </p>
                    <p className="text-xs text-gray-500 italic mb-3 border-t border-blue-100 pt-2 mt-2">
                      Esperando que alguien acepte el desafío...
                    </p>
                    <Link href={`/match-room/${match.id}`} className="block text-center bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                      Ver Sala (Buscando)
                    </Link>
                  </div>
                ))
              )}
            </div>

          </div>
        )}
      </div>
    );
  }

  // --- LOGIN (SIN CAMBIOS, SOLO RECORTADO POR BREVEDAD) ---
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      {/* ... Tu código de formulario de Login (sigue igual) ... */}
      <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-600 tracking-tight text-center mb-8">MatchApp Web</h1>
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
        <form onSubmit={handleLogin} className="space-y-5">
          <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-green-500 text-white font-bold py-3.5 rounded-xl">{isSubmitting ? "Cargando..." : "Entrar"}</button>
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm font-medium">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}