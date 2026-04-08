"use client";

import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, usePathname } from '../i18n/navigation'; 

export default function Navbar() {
  const { userToken, logout } = useContext(AuthContext);
  const pathname = usePathname();
  
  // Estado para el menú hamburguesa móvil
  const [isOpen, setIsOpen] = useState(false);

  if (!userToken) return null;

  const isActive = (path) => {
    if (path === '/' && pathname === '/') return 'bg-green-600 text-white';
    if (path !== '/' && pathname.includes(path)) return 'bg-green-600 text-white';
    return 'text-gray-300 hover:bg-gray-700 hover:text-white';
  };

  // Función para cerrar el menú al hacer clic en un enlace móvil
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="bg-gray-800 shadow-md sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO */}
          <div className="flex items-center">
            <Link href="/" onClick={closeMenu} className="flex-shrink-0">
              <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 tracking-tight">
                MatchApp
              </span>
            </Link>
          </div>

          {/* MENÚ DE ESCRITORIO (Oculto en móvil) */}
          <div className="hidden md:flex flex-1 justify-between items-center ml-10">
            <div className="flex items-baseline space-x-4">
              <Link href="/" className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${isActive('/')}`}>Inicio</Link>
              <Link href="/explore" className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${isActive('/explore')}`}>Explorar</Link>
              <Link href="/teams" className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${isActive('/teams')}`}>Equipos</Link>
              <Link href="/social" className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${isActive('/social')}`}>Social</Link>
              <Link href="/profile" className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${isActive('/profile')}`}>Perfil</Link>
            </div>
            
            <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-md">
              Cerrar Sesión
            </button>
          </div>

          {/* BOTÓN HAMBURGUESA (Visible SOLO en móvil) */}
          <div className="flex md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
            >
              <span className="sr-only">Abrir menú principal</span>
              {/* Ícono Hamburger o X dependiendo del estado */}
              {isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* MENÚ DESPLEGABLE MÓVIL */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700 animate-in slide-in-from-top-2">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" onClick={closeMenu} className={`block px-3 py-3 rounded-lg text-base font-bold ${isActive('/')}`}>🏠 Inicio</Link>
            <Link href="/explore" onClick={closeMenu} className={`block px-3 py-3 rounded-lg text-base font-bold ${isActive('/explore')}`}>🌍 Explorar</Link>
            <Link href="/teams" onClick={closeMenu} className={`block px-3 py-3 rounded-lg text-base font-bold ${isActive('/teams')}`}>🛡️ Equipos</Link>
            <Link href="/social" onClick={closeMenu} className={`block px-3 py-3 rounded-lg text-base font-bold ${isActive('/social')}`}>👥 Social</Link>
            <Link href="/profile" onClick={closeMenu} className={`block px-3 py-3 rounded-lg text-base font-bold ${isActive('/profile')}`}>👤 Mi Perfil</Link>
            
            <button onClick={() => { closeMenu(); logout(); }} className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white px-3 py-4 rounded-xl text-base font-extrabold transition-colors shadow-md flex justify-center items-center gap-2">
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}