"use client";

import { useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';

export default function ProfilePage() {
  const { userInfo, isLoading } = useContext(AuthContext);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">Cargando Perfil...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Mi Cuenta</h1>
          <p className="text-gray-500 font-medium">Gestiona tu identidad y credenciales deportivas.</p>
        </div>
        <button className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors opacity-50 cursor-not-allowed" title="Próximamente">
          Editar Perfil
        </button>
      </div>
      
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100">
        
        {/* AVATAR Y DATOS BÁSICOS */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-gray-100">
          <div className="relative group cursor-pointer">
            <div className="w-40 h-40 bg-gradient-to-tr from-green-400 to-blue-500 text-white rounded-full flex items-center justify-center text-6xl font-extrabold shadow-2xl border-4 border-white">
              {userInfo?.username?.charAt(0).toUpperCase()}
            </div>
            {/* Overlay "Cambiar foto" falso para el futuro */}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white font-bold text-sm">Cambiar Foto</span>
            </div>
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-4xl font-extrabold text-gray-800 mb-2">{userInfo?.username}</h2>
            <p className="text-gray-500 text-lg font-medium bg-gray-50 inline-block px-4 py-2 rounded-lg border border-gray-200">{userInfo?.email}</p>
          </div>
        </div>

        {/* ESTADÍSTICAS DEL DEPORTISTA */}
        <h3 className="text-xl font-bold text-gray-800 mb-6">Reputación Deportiva</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-3xl border border-green-200 text-center shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-9xl opacity-10">⭐</div>
            <p className="text-green-800 font-bold text-lg mb-2 uppercase tracking-wide">Fiabilidad (Karma)</p>
            <p className="text-5xl font-black text-green-600">{userInfo?.reliability_score}%</p>
            <p className="text-green-700 text-sm font-medium mt-4">Calculado en base a tu asistencia a partidos.</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-3xl border border-blue-200 text-center shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-9xl opacity-10">🏆</div>
            <p className="text-blue-800 font-bold text-lg mb-2 uppercase tracking-wide">Ranking Global</p>
            <p className="text-5xl font-black text-blue-600">{userInfo?.global_elo}</p>
            <p className="text-blue-700 text-sm font-medium mt-4">Puntos obtenidos por victorias en partidos.</p>
          </div>
        </div>

      </div>
    </div>
  );
}