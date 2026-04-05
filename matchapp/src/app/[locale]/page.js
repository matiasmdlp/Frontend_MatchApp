"use client";

import { useState, useContext, useEffect } from 'react'; 
import axios from '../../api/axiosConfig'; 
import { AuthContext } from '../../context/AuthContext';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

const MapExplorer = dynamic(() => import('../../components/MapExplorer'), { 
    ssr: false, 
    loading: () => <div className="flex h-full items-center justify-center text-gray-500">Cargando Mapa...</div> 
});

export default function Home() {
  const { userToken, userInfo, login, logout, isLoading } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myMatches, setMyMatches] = useState([]);

  // Cargamos los diccionarios de Login y Dashboard
  const tLogin = useTranslations('Login');
  const tDash = useTranslations('Dashboard');

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError('');
    setIsSubmitting(true);
    
    if (!email || !password) {
      setError(tLogin('errorEmpty')); 
      setIsSubmitting(false);
      return;
    }
    
    try {
      await login(email, password);
    } catch (err) {
      setError(err); 
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (userToken) {
      const fetchMatches = async () => {
        try {
          const response = await axios.get('/matches/my-matches', {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          setMyMatches(response.data.upcoming.filter(m => m.status === 'CONFIRMED' || m.status === 'PENDING_RESULT'));
        } catch (error) {
          console.error("Error cargando mis partidos web:", error);
        }
      };
      fetchMatches();
    }
  }, [userToken]);


  if (isLoading) return <div className="min-h-screen flex items-center justify-center">{tLogin('loading')}</div>;

  // --- DASHBOARD (Logueado) ---
  if (userToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row p-4 md:p-8 gap-6">
        
        {/* COLUMNA IZQUIERDA: PERFIL Y MENÚ */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col">
          <div className="w-32 h-32 bg-gradient-to-tr from-green-400 to-blue-500 text-white rounded-full flex items-center justify-center text-5xl font-extrabold mx-auto mb-6 shadow-lg border-4 border-white">
            {userInfo?.username?.charAt(0).toUpperCase()}
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2 text-center">{tDash('greeting', { username: userInfo?.username })}</h1>
          <p className="text-center text-gray-500 mb-8 font-medium">Panel de Control</p>
          
          <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-200 shadow-inner">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <span className="text-gray-600 font-semibold flex items-center gap-2">⭐ {tDash('reliability')}</span> 
              <span className="text-green-600 font-bold text-lg">{userInfo?.reliability_score}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-semibold flex items-center gap-2">🏆 {tDash('elo')}</span> 
              <span className="text-blue-600 font-bold text-lg">{userInfo?.global_elo} <span className="text-xs text-gray-400">{tDash('pts')}</span></span>
            </div>
          </div>

          {/* LISTA DE MIS PARTIDOS EN LA WEB */}
          <div className="w-full text-left mb-6">
            <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Mis Próximos Partidos</h3>
            {myMatches.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center">No tienes partidos agendados.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {myMatches.map(match => (
                  <div key={match.id} className="bg-gray-50 p-3 rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-800 text-sm">{match.sport_name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold text-white ${match.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {match.status === 'CONFIRMED' ? 'Confirmado' : 'Falta Resultado'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">📅 {new Date(match.time_start_window).toLocaleDateString()}</p>
                    <a 
                      href={`/match-room/${match.id}`} 
                      className="block text-center w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Abrir Chat del Partido
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto">
            <button onClick={logout} className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-4 px-4 rounded-xl transition-colors duration-200 shadow-sm">
              {tDash('logoutButton')}
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: EL MAPA INTERACTIVO */}
        <div className="w-full md:w-2/3 lg:w-3/4 bg-white p-2 rounded-3xl shadow-xl border border-gray-100 min-h-[600px] flex flex-col relative z-0">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-2xl font-bold text-gray-800">Explorador Global</h2>
            <p className="text-gray-500 text-sm">Descubre partidos buscando rivales en todo el mundo.</p>
          </div>
          
          <div className="flex-1 rounded-2xl overflow-hidden m-2 border-2 border-gray-100 relative z-0">
             {/* AQUÍ INYECTAMOS EL COMPONENTE DEL MAPA */}
             <MapExplorer />
          </div>
        </div>

      </div>
    );
  }

  // --- PANTALLA DE LOGIN ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-600 tracking-tight">
          SportMatch
        </h1>
        {/* TRADUCCIÓN */}
        <p className="text-gray-500 mt-2 font-medium">{tLogin('subtitle')}</p>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{tLogin('title')}</h2>
        
        {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg"><p className="text-red-700 text-sm font-semibold">{error}</p></div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">{tLogin('emailLabel')}</label>
            <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-300" placeholder={tLogin('emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">{tLogin('passwordLabel')}</label>
            <input type="password" className="w-full px-4 py-3 rounded-xl border border-gray-300" placeholder={tLogin('passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl mt-6 flex justify-center items-center">
            {isSubmitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : tLogin('submitButton')}
          </button>
        </form>
      </div>
    </div>
  );
}