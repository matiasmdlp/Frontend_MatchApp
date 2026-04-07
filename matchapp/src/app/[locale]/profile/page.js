"use client";

import { useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';

export default function ProfilePage() {
  const { userInfo, isLoading } = useContext(AuthContext);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-8">Mi Perfil</h1>
      
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-gray-100">
          <div className="w-32 h-32 bg-green-500 text-white rounded-full flex items-center justify-center text-5xl font-bold shadow-md">
            {userInfo?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-800">{userInfo?.username}</h2>
            <p className="text-gray-500 text-lg">{userInfo?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center">
            <span className="text-4xl block mb-2">⭐</span>
            <p className="text-gray-500 font-medium">Fiabilidad (Karma)</p>
            <p className="text-3xl font-bold text-green-600">{userInfo?.reliability_score}%</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center">
            <span className="text-4xl block mb-2">🏆</span>
            <p className="text-gray-500 font-medium">Ranking Global</p>
            <p className="text-3xl font-bold text-blue-600">{userInfo?.global_elo} ELO</p>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400 italic">
          Próximamente: Cambiar contraseña y subir foto de perfil.
        </div>
      </div>
    </div>
  );
}