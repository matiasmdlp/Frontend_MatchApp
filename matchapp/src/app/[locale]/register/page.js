"use client";

import { useState, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { Link } from '../../../i18n/navigation';
import { useRouter } from 'next/navigation'; // Redirección nativa

export default function RegisterPage() {
  const { register, userToken } = useContext(AuthContext);
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si el usuario ya está logueado, no debería estar aquí. Lo mandamos al inicio.
  if (userToken) {
    router.push('/');
    return null;
  }

  const handleRegister = async (e) => {
    e.preventDefault(); 
    setError('');
    
    // Validaciones Front-End
    if (!username || !email || !password || !confirmPassword) {
      return setError('Por favor, completa todos los campos.');
    }
    if (username.length < 3) {
      return setError('El nombre de usuario debe tener al menos 3 caracteres.');
    }
    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }
    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }

    setIsSubmitting(true);
    try {
      // Llamamos a la función de nuestro Context
      await register(username, email, password);
      // El Context se encarga de guardar el Token. 
      // Next.js detectará el cambio de estado y nos redirigirá automáticamente.
    } catch (err) {
      setError(err); // Error desde Node.js (ej: "Email ya existe")
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      
      {/* Título de la App */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500 tracking-tight">
          MatchApp
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Únete a la comunidad deportiva</p>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 relative overflow-hidden">
        
        {/* Decoración visual */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-green-500"></div>

        <h2 className="text-2xl font-extrabold text-gray-800 mb-6 text-center">Crear Cuenta</h2>
        
        {/* Caja de Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl animate-in fade-in slide-in-from-top-2">
            <p className="text-red-700 text-sm font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Nombre de Usuario</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
              placeholder="Ej: CarlosFutbol"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Correo Electrónico</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Contraseña</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Confirmar</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-xl mt-8 shadow-md hover:shadow-lg transition-all duration-200 flex justify-center items-center"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              "Registrarse Ahora"
            )}
          </button>

          <div className="mt-6 text-center pt-6 border-t border-gray-100">
            <p className="text-gray-500 text-sm font-medium">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/" className="text-green-600 hover:text-green-700 font-bold transition-colors">
                Inicia Sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}