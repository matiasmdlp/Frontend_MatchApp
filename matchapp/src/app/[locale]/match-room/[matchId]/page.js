"use client";

import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../../../context/AuthContext';
import axios from '../../../../api/axiosConfig';
import { io } from 'socket.io-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

export default function WebMatchRoom() {
  const params = useParams();
  const matchId = params.matchId;

  const { userToken, userInfo, isLoading } = useContext(AuthContext);

  const [matchData, setMatchData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  
  // SOLUCIÓN: Usamos useRef para guardar la conexión sin provocar re-renders
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);


  const [socket, setSocket] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(''); // 'CREATOR', 'CHALLENGER', 'DRAW'
  const [rivalAttended, setRivalAttended] = useState(true);
  const [isReporting, setIsReporting] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. CARGAR DATOS DEL PARTIDO
  useEffect(() => {
    if (!matchId || !userToken) return;
    
    const fetchMatch = async () => {
      const response = await axios.get(`/matches/${matchId}`, { headers: { Authorization: `Bearer ${userToken}` }});
        const data = response.data;
        setMatchData(data);

        if (data.status === 'PENDING_RESULT') {
          const isCreator = data.is_me_creator;
          const isChallenger = data.is_me_challenger;
          
          if ((isCreator && !data.creator_reported_winner) || (isChallenger && !data.challenger_reported_winner)) {
             setShowReportModal(true);
          }
        }
    };
    fetchMatch();
  }, [matchId, userToken]);

  // 2. CONEXIÓN AL WEB SOCKET
  useEffect(() => {
    if (!matchId || !userToken) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
    const newSocket = io(socketUrl, { transports: ['websocket'], forceNew: true });
    
    // Guardamos la conexión en la referencia (No dispara renders)
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log("Conectado al chat de la sala:", matchId);
      newSocket.emit('join_match_room', matchId);
    });

    newSocket.on('load_message_history', (history) => {
      setMessages(history);
      setTimeout(scrollToBottom, 100);
    });

    newSocket.on('receive_message', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(scrollToBottom, 100);
    });

    return () => {
      console.log("Desconectando chat...");
      newSocket.disconnect();
    };
  }, [matchId, userToken]);

  // 3. ENVIAR MENSAJE
  const handleSend = (e) => {
    e.preventDefault();
    
    // Leemos el socket desde la referencia actual
    if (!inputText.trim() || !socketRef.current) return;
    
    socketRef.current.emit('send_message', {
      matchId: matchId,
      senderId: userInfo.id,
      senderName: userInfo.username,
      text: inputText
    });
    
    setInputText('');
  };

  const getRedIcon = () => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      return new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41]
      });
    }
    return null;
  };

  const handleReportResult = async () => {
    if (!selectedWinner && rivalAttended) return alert('Debes seleccionar quién ganó o si fue empate.');

    setIsReporting(true);
    try {
      const response = await axios.post(`/matches/${matchId}/report`, {
        reported_winner: selectedWinner,
        rival_attended: rivalAttended
      }, { headers: { Authorization: `Bearer ${userToken}` }});
      
      alert(response.data.message);
      setShowReportModal(false);
      window.location.href = '/'; // Devolver al Dashboard
    } catch (err) {
      alert(err.response?.data?.error || 'Error al enviar el reporte.');
    } finally {
      setIsReporting(false);
    }
  };


  if (isLoading || !matchData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[85vh] border border-gray-200">
        
        {/* CABECERA DE LA SALA DE CHAT */}
        <div className="bg-gray-800 text-white p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b-4 border-gray-900">
          
          {/* INFO IZQUIERDA */}
          <div>
            <Link href="/" className="text-gray-400 hover:text-white text-sm flex items-center mb-3 transition-colors w-max">
              ← Volver al Dashboard
            </Link>
            
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-extrabold">
                {matchData.sport_name} <span className="text-blue-400">{matchData.format_name}</span>
              </h1>
              
              <button 
                onClick={() => setShowMapModal(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center transition-colors shadow-md"
              >
                📍 Mapa
              </button>
            </div>
            
            <p className="text-gray-300 font-medium mb-2">
              👑 {matchData.creator_name} <span className="text-gray-500 mx-2">VS</span> ⚔️ {matchData.challenger_name || 'Buscando...'}
            </p>

            {/* FECHA Y HORA (Nueva adición) */}
            <div className="inline-flex items-center bg-gray-700 text-gray-200 px-3 py-1 rounded-md text-xs font-bold border border-gray-600">
              📅 {matchData.time_start_window.split('T')[0].split('-').reverse().join('/')} a las {matchData.time_start_window.split('T')[1]}
            </div>
          </div>
          
          {/* BOTONES DERECHA */}
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full font-bold text-sm w-max shadow-inner ${matchData.status === 'CONFIRMED' ? 'bg-green-500' : (matchData.status === 'PENDING_RESULT' ? 'bg-purple-500' : 'bg-yellow-500')}`}>
              {matchData.status === 'CONFIRMED' ? 'Confirmado' : (matchData.status === 'PENDING_RESULT' ? 'Jugado' : matchData.status)}
            </div>

            {/* BOTÓN ABANDONAR / EXPULSAR (Corregido y con mejor rastreo de errores) */}
            {matchData.status === 'CONFIRMED' && (
              <button 
                onClick={async () => {
                  // Asumimos que si no hay challenger_name, es porque aún no se une nadie.
                  // Si el creador presiona este botón antes de que alguien se una, le diremos que use el botón de cancelar del mapa.
                  if (!matchData.challenger_name) {
                    return alert("Este partido aún no tiene rival. Si quieres cancelarlo, usa el botón 'Cancelar' desde el Mapa.");
                  }

                  const isCreator = matchData.is_me_creator;
                  const confirmMsg = isCreator 
                    ? `¿Seguro que quieres expulsar a ${matchData.challenger_name}? El partido volverá a buscar rival.` 
                    : `¿Seguro que quieres abandonar este partido? El creador tendrá que buscar otro rival.`;
                  
                  if(window.confirm(confirmMsg)) {
                    try {
                      // Hacemos el POST al backend
                      const response = await axios.post(`/matches/${matchId}/leave`, {}, { 
                        headers: { Authorization: `Bearer ${userToken}` }
                      });
                      
                      alert(response.data.message);
                      window.location.href = '/'; // Devolvemos al usuario al Dashboard
                      
                    } catch (err) { 
                      // Mostramos EXACTAMENTE qué dice el backend en vez del error genérico
                      alert(`Error: ${err.response?.data?.error || err.message || "No se pudo realizar la acción."}`);
                      console.error("Detalle del error al salir:", err.response?.data);
                    }
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors border border-red-600 shadow-sm"
              >
                {matchData.is_me_creator ? 'Expulsar Rival' : 'Abandonar Partido'}
              </button>
            )}
          </div>

        </div>

        {/* ZONA DE CHAT */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 flex flex-col gap-4 custom-scrollbar">
          {messages.length === 0 && (
            <div className="my-auto text-center">
              <span className="text-4xl mb-2 block">🏟️</span>
              <p className="text-gray-400 italic font-medium">Sin mensajes aún. Organiza los detalles tácticos aquí.</p>
            </div>
          )}
          
          {messages.map((msg, idx) => {
            const sender = msg.sender || msg.sender_name;
            const isMe = sender === userInfo.username;
            
            return (
              <div key={msg.id || idx} className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? 'self-end' : 'self-start'}`}>
                <span className={`text-[11px] font-bold mb-1 ${isMe ? 'text-right text-green-600' : 'text-gray-500 ml-1'}`}>
                  {isMe ? 'Tú' : sender}
                </span>
                <div className={`px-4 py-3 shadow-sm text-sm md:text-base ${isMe ? 'bg-green-500 text-white rounded-2xl rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-none'}`}>
                  {msg.text || msg.content}
                </div>
              </div>
            );
          })}
          {/* Ancla invisible para hacer scroll automático hasta abajo */}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* INPUT DE MENSAJE */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-3 items-center">
          <input 
            type="text" 
            className="flex-1 bg-gray-100 border border-gray-200 text-gray-800 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all shadow-inner"
            placeholder="Escribe un mensaje táctico..." 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="bg-green-500 disabled:bg-gray-300 hover:bg-green-600 text-white font-bold rounded-full px-6 md:px-8 py-3 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
          >
            Enviar
          </button>
        </form>

      </div>
      {showMapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-2xl h-[70vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowMapModal(false)} className="absolute top-4 right-4 z-50 bg-white text-gray-600 hover:text-red-500 w-10 h-10 rounded-full font-bold text-xl shadow-md border border-gray-100 flex items-center justify-center transition-colors">
              &times;
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Ubicación del Partido</h2>
            <div className="flex-1 rounded-2xl overflow-hidden border-2 border-gray-200 z-0">
              <MapContainer center={[matchData.latitude, matchData.longitude]} zoom={15} className="w-full h-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[matchData.latitude, matchData.longitude]} icon={getRedIcon()} />
              </MapContainer>
            </div>
            <button onClick={() => setShowMapModal(false)} className="mt-4 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl transition-colors">Cerrar Mapa</button>
          </div>
        </div>
      )}

      
      {/* MODAL: REPORTE DE RESULTADOS */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
            
            <div className="text-center mb-6">
              <span className="text-6xl block mb-2">🏆</span>
              <h2 className="text-3xl font-extrabold text-gray-800">¡El partido terminó!</h2>
              <p className="text-gray-500 font-medium mt-2">Por favor, ingresa el resultado con honestidad. Las mentiras bajan tu Karma.</p>
            </div>
            
            {/* PREGUNTA 1: ASISTENCIA */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-700 mb-3 text-center">¿Se presentó el rival a jugar?</h3>
              <div className="flex gap-4">
                <button 
                  onClick={() => setRivalAttended(true)}
                  className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all ${rivalAttended ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  Sí, llegó 👍
                </button>
                <button 
                  onClick={() => setRivalAttended(false)}
                  className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all ${!rivalAttended ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  No apareció 👎
                </button>
              </div>
            </div>

            {/* PREGUNTA 2: RESULTADO (Solo si llegó) */}
            {rivalAttended && (
              <div className="mb-8 space-y-3 animate-in slide-in-from-top-2">
                <h3 className="text-lg font-bold text-gray-700 mb-3 text-center">¿Cuál fue el resultado final?</h3>
                
                <button onClick={() => setSelectedWinner('CREATOR')} className={`w-full py-4 px-6 rounded-2xl font-bold text-left border-2 transition-all flex justify-between items-center ${selectedWinner === 'CREATOR' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <span>Ganó: {matchData?.creator_name}</span>
                  {selectedWinner === 'CREATOR' && <span>✅</span>}
                </button>

                <button onClick={() => setSelectedWinner('DRAW')} className={`w-full py-4 px-6 rounded-2xl font-bold text-left border-2 transition-all flex justify-between items-center ${selectedWinner === 'DRAW' ? 'bg-gray-100 border-gray-500 text-gray-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <span>Empate 🤝</span>
                  {selectedWinner === 'DRAW' && <span>✅</span>}
                </button>

                <button onClick={() => setSelectedWinner('CHALLENGER')} className={`w-full py-4 px-6 rounded-2xl font-bold text-left border-2 transition-all flex justify-between items-center ${selectedWinner === 'CHALLENGER' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <span>Ganó: {matchData?.challenger_name}</span>
                  {selectedWinner === 'CHALLENGER' && <span>✅</span>}
                </button>
              </div>
            )}

            {/* BOTÓN ENVIAR */}
            <button 
              onClick={handleReportResult}
              disabled={isReporting || (rivalAttended && !selectedWinner)}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-extrabold py-5 rounded-2xl transition-all shadow-lg hover:shadow-xl flex justify-center items-center"
            >
              {isReporting ? <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div> : 'Enviar Reporte Oficial'}
            </button>

          </div>
        </div>
      )}

    </div>
    
    


  );
}