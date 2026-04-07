"use client";

import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import dynamic from 'next/dynamic';
import axios from '../../../api/axiosConfig';
import { Link } from '../../../i18n/navigation';

// Importar el mapa dinámicamente para evitar errores SSR
const MapExplorer = dynamic(() => import('../../../components/MapExplorer'), { 
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-gray-500 bg-gray-50 rounded-2xl">Cargando Mapa Global...</div> 
});

export default function ExplorePage() {
  const { userToken, isLoading } = useContext(AuthContext);
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);

  // Cargar lista de deportes para los filtros
  useEffect(() => {
    if (userToken) {
      axios.get('/sports')
        .then(res => setSports(res.data))
        .catch(err => console.error("Error cargando deportes:", err));
    }
  }, [userToken]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-[90vh] bg-gray-100 flex flex-col md:flex-row p-4 md:p-6 gap-6">
      
      {/* BARRA LATERAL: FILTROS Y BOTÓN CREAR */}
      <div className="w-full md:w-1/4 lg:w-1/5 bg-white p-6 rounded-3xl shadow-lg border border-gray-200 flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Explorar</h2>
        
        {/* BOTÓN CREAR PARTIDO (Pasa los filtros por URL solo si existen) */}
        <Link 
          href={{
            pathname: '/create-match',
            query: {
              ...(selectedSport ? { sport: selectedSport } : {}),
              ...(selectedFormat ? { format: selectedFormat } : {})
            }
          }}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-center shadow-md mb-8 transition-colors flex items-center justify-center gap-2"
            >
            <span className="text-xl">➕</span> Nuevo Partido
        </Link>

        <h3 className="font-bold text-gray-600 mb-3 text-sm uppercase tracking-wider">Filtros Rápidos</h3>
        
        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {sports.map(sport => (
            <div key={sport.id} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
              <button 
                onClick={() => {
                  setSelectedSport(selectedSport === sport.id ? null : sport.id);
                  setSelectedFormat(null);
                }}
                className={`w-full text-left px-4 py-3 font-bold transition-colors ${selectedSport === sport.id ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {sport.name}
              </button>
              
              {/* SUB-MENÚ DE FORMATOS */}
              {selectedSport === sport.id && (
                <div className="p-2 grid grid-cols-2 gap-2 bg-white">
                  {sport.formats.map(format => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(selectedFormat === format.id ? null : format.id)}
                      className={`text-xs font-bold py-2 rounded-lg border transition-colors ${selectedFormat === format.id ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                    >
                      {format.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ÁREA DEL MAPA */}
      <div className="w-full md:w-3/4 lg:w-4/5 bg-white p-2 rounded-3xl shadow-lg border border-gray-200 min-h-[60vh] flex flex-col relative z-0">
        <div className="flex-1 rounded-2xl overflow-hidden border-2 border-gray-100 relative z-0">
           {/* Le pasamos los filtros al mapa para que solo dibuje esos pines */}
           <MapExplorer filterSport={selectedSport} filterFormat={selectedFormat} />
        </div>
      </div>

    </div>
  );
}