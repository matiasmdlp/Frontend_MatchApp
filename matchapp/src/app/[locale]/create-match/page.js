"use client";

import { useState, useContext, useEffect, Suspense } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import axios from '../../../api/axiosConfig';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const LocationPickerMap = dynamic(() => import('../../../components/LocationPickerMap'), { 
  ssr: false,
  loading: () => <div className="h-full bg-gray-100 flex items-center justify-center rounded-xl border border-gray-300 text-gray-500">Cargando mapa interactivo...</div>
});

// 1. ESTE ES EL FORMULARIO REAL (Que lee los params)
function CreateMatchForm() {
  const { userToken } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultSport = searchParams.get('sport') ? parseInt(searchParams.get('sport')) : null;
  const defaultFormat = searchParams.get('format') ? parseInt(searchParams.get('format')) : null;

  const [sportsList, setSportsList] = useState([]);
  const [formatsList, setFormatsList] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [eligibleTeams, setEligibleTeams] = useState([]);

  const [selectedSport, setSelectedSport] = useState(defaultSport);
  const [selectedFormat, setSelectedFormat] = useState(defaultFormat);
  const [selectedTeam, setSelectedTeam] = useState('');
  
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  const [requiresTeam, setRequiresTeam] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Carga Inicial de Datos de la BD
  useEffect(() => {
    if (!userToken) return;

    const fetchData = async () => {
      try {
        const [resSports, resTeams] = await Promise.all([
          axios.get('/sports'),
          axios.get('/teams', { headers: { Authorization: `Bearer ${userToken}` }})
        ]);
        
        const loadedSports = resSports.data.map(s => ({ ...s, value: s.id, label: s.name }));
        setSportsList(loadedSports);
        setMyTeams(resTeams.data.filter(t => t.is_captain));

        // Si vinimos con filtros desde el mapa, auto-seleccionamos el deporte
        if (defaultSport) {
          const sportObj = loadedSports.find(s => s.value === defaultSport);
          if (sportObj) {
            const mappedFormats = sportObj.formats.map(f => ({ ...f, value: f.id, label: f.name }));
            setFormatsList(mappedFormats);

            // Si también vinimos con formato, lo auto-seleccionamos y buscamos equipos
            if (defaultFormat) {
              const formatObj = mappedFormats.find(f => f.value === defaultFormat);
              if (formatObj && formatObj.players_per_team > 1) {
                setRequiresTeam(true);
                const validTeams = resTeams.data.filter(t => t.is_captain && t.format_name === formatObj.label && t.sport_name === sportObj.label);
                setEligibleTeams(validTeams.map(t => ({ label: t.name, value: t.id })));
              }
            }
          }
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    fetchData();
  }, [userToken, defaultSport, defaultFormat]);

  // Manejador cuando el usuario cambia el deporte manualmente
  const handleSportChange = (e) => {
    const sportId = parseInt(e.target.value);
    setSelectedSport(sportId);
    setSelectedFormat('');
    setSelectedTeam('');
    setEligibleTeams([]);
    setRequiresTeam(false);

    if (sportId) {
      const sport = sportsList.find(s => s.value === sportId);
      setFormatsList(sport.formats.map(f => ({ ...f, value: f.id, label: f.name })));
    } else {
      setFormatsList([]);
    }
  };

  // Manejador cuando el usuario cambia el formato manualmente
  const handleFormatChange = (e) => {
    const formatId = parseInt(e.target.value);
    setSelectedFormat(formatId);
    setSelectedTeam('');

    if (formatId) {
      const formatObj = formatsList.find(f => f.value === formatId);
      if (formatObj && formatObj.players_per_team > 1) {
        setRequiresTeam(true);
        const sportName = sportsList.find(s => s.value === selectedSport)?.label;
        const validTeams = myTeams.filter(t => t.format_name === formatObj.label && t.sport_name === sportName);
        setEligibleTeams(validTeams.map(t => ({ label: t.name, value: t.id })));
      } else {
        setRequiresTeam(false);
        setEligibleTeams([]);
      }
    } else {
      setRequiresTeam(false);
      setEligibleTeams([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedFormat || !matchDate || !matchTime || !selectedLocation) return setError('Faltan datos obligatorios (Deporte, Fecha, Hora o Ubicación).');
    if (requiresTeam && !selectedTeam) return setError('Este formato exige que selecciones un equipo tuyo.');

    setIsSubmitting(true);
    try {
      // 1. FORMA SEGURA DE MANEJAR LA HORA LOCAL DEL USUARIO
      // Extraemos año, mes, día, hora y minuto
      const [year, month, day] = matchDate.split('-');
      const [hours, minutes] = matchTime.split(':');
      
      // Creamos la fecha forzando a que JavaScript use el huso horario local de la computadora
      const startDateTime = new Date(year, month - 1, day, hours, minutes);
      
      // Calculamos el final del partido (+2 horas)
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

      const matchData = {
        sport_format_id: selectedFormat,
        creator_team_id: requiresTeam ? parseInt(selectedTeam) : null,
        // Usamos toISOString() que es el formato estándar ISO 8601 (UTC) que PostgreSQL ama
        time_start_window: startDateTime.toISOString(),
        time_end_window: endDateTime.toISOString(),
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng
      };

      await axios.post('/matches', matchData, { headers: { Authorization: `Bearer ${userToken}` }});
      router.push('/explore');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al publicar el partido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Nuevo Encuentro</h1>
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold text-center border border-red-200">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Deporte</label>
            <select className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" value={selectedSport || ''} onChange={handleSportChange}>
              <option value="">Selecciona un deporte...</option>
              {sportsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">Formato</label>
            <select className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-200" value={selectedFormat || ''} onChange={handleFormatChange} disabled={!selectedSport}>
              <option value="">Selecciona formato...</option>
              {formatsList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>

        {requiresTeam && (
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <label className="block text-blue-800 font-bold mb-2">Tu Equipo para este formato</label>
            {eligibleTeams.length > 0 ? (
              <select className="w-full p-3 bg-white border border-blue-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                <option value="">Selecciona con quién jugarás...</option>
                {eligibleTeams.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            ) : (
              <p className="text-red-500 text-sm font-bold bg-white p-3 rounded-lg border border-red-200 text-center">⚠️ No tienes equipos compatibles creados.</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Fecha</label>
            <input type="date" className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">Hora</label>
            <input type="time" className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Ubicación de la cancha</label>
          <div className="h-64 w-full rounded-xl overflow-hidden border-2 border-gray-200 relative z-0">
            <LocationPickerMap onLocationSelect={setSelectedLocation} />
          </div>
          {selectedLocation && <p className="text-green-600 text-sm mt-2 font-bold text-right">✅ Coordenadas listas</p>}
        </div>

        <button type="submit" disabled={isSubmitting || (requiresTeam && eligibleTeams.length === 0)} className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl mt-4 shadow-md hover:shadow-lg transition-colors text-lg">
          {isSubmitting ? 'Publicando...' : 'Publicar Servidor'}
        </button>
      </form>
    </div>
  );
}

// 2. COMPONENTE PRINCIPAL (Envuelve al formulario en Suspense para evitar errores SSR)
export default function PageWrapper() {
  const { isLoading } = useContext(AuthContext);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">Cargando tu cuenta...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Suspense es obligatorio en Next 15 para usar useSearchParams() */}
        <Suspense fallback={<div className="bg-white p-10 rounded-2xl text-center text-gray-500 shadow-md">Analizando filtros del mapa...</div>}>
          <CreateMatchForm />
        </Suspense>
      </div>
    </div>
  );
}