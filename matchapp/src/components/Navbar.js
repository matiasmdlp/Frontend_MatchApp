"use client";

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// 1. IMPORTAMOS NUESTROS COMPONENTES MÁGICOS DE IDIOMA
import { Link, usePathname } from '../i18n/navigation'; 

export default function Navbar() {
  const { userToken, logout } = useContext(AuthContext);
  const pathname = usePathname(); // Ahora este pathname YA SABE el idioma

  if (!userToken) return null;

  // 2. Función de estilo más precisa (ahora pathname devuelve '/explore' en lugar de '/es/explore')
  const isActive = (path) => {
    // Si estamos en inicio ('/') y la ruta comprobada es '/', es activo
    if (path === '/' && pathname === '/') return 'bg-green-600 text-white';
    // Si no es inicio, comprobamos si incluye el path
    if (path !== '/' && pathname.includes(path)) return 'bg-green-600 text-white';
    
    return 'text-gray-300 hover:bg-gray-700 hover:text-white';
  };

  return (
    <nav className="bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                MatchApp
              </span>
            </div>
            
            {/* ENLACES AHORA USAN EL LINK DE NEXT-INTL */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${isActive('/')}`}>
                  Inicio
                </Link>
                <Link href="/explore" className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${isActive('/explore')}`}>
                  Explorar
                </Link>
                <Link href="/teams" className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${isActive('/teams')}`}>
                  Equipos
                </Link>
                <Link href="/profile" className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${isActive('/profile')}`}>
                  Perfil
                </Link>
              </div>
            </div>
          </div>

          <div>
            <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors shadow-md">
              Cerrar Sesión
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}