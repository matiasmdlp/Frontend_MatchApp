"use client";

import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../../../context/AuthContext';
import axios from '../../../../api/axiosConfig';
import { io } from 'socket.io-client';

export default function WebMatchRoom({ params }) {
  // En Next.js 15, resolvemos params con React.use() o await si es async component
  // Como es "use client", usamos destructuring directo o un useEffect para leer la URL
  const [matchId, setMatchId] = useState(null);
  const { userToken, userInfo, isLoading } = useContext(AuthContext);

  const [matchData, setMatchData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);

  const messagesEndRef = useRef(null);

  // Desempaquetar la promesa params en Next 15
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setMatchId(resolvedParams.matchId);
    };
    unwrapParams();
  }, [params]);

  // Cargar datos
  useEffect(() => {
    if (!matchId || !userToken) return;
    
    const fetchMatch = async () => {
      try {
        const response = await axios.get(`/matches/${matchId}`, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        setMatchData(response.data);
      } catch (error) {
        console.error("Error cargando sala:", error);
      }
    };
    fetchMatch();
  }, [matchId, userToken]);

  // Conectar Web Socket
  useEffect(() => {
    if (!matchId || !userToken) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
    const newSocket = io(socketUrl, { transports: ['websocket'], forceNew: true });
    
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit('join_match_room', matchId);
    });

    newSocket.on('load_message_history', (history) => {
      setMessages(history);
      scrollToBottom();
    });

    newSocket.on('receive_message', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();
    });

    return () => newSocket.disconnect();
  }, [matchId, userToken]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;
    
    socket.emit('send_message', {
      matchId: matchId,
      senderId: userInfo.id,
      senderName: userInfo.username,
      text: inputText
    });
    
    setInputText('');
  };

  if (isLoading || !matchData) return <div className="min-h-screen flex items-center justify-center">Conectando a la Sala...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* CABECERA */}
        <div className="bg-gray-800 text-white p-6 flex justify-between items-center">
          <div>
            <a href="/" className="text-gray-400 hover:text-white text-sm flex items-center mb-2 transition-colors">
              ← Volver al Dashboard
            </a>
            <h1 className="text-2xl md:text-3xl font-bold">{matchData.sport_name} {matchData.format_name}</h1>
            <p className="text-gray-300 mt-1">👑 {matchData.creator_name} VS ⚔️ {matchData.challenger_name}</p>
          </div>
          <div className={`px-4 py-2 rounded-full font-bold text-sm ${matchData.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-yellow-500'}`}>
            {matchData.status}
          </div>
        </div>

        {/* ZONA DE CHAT */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 flex flex-col gap-4">
          {messages.length === 0 && <p className="text-center text-gray-400 italic my-auto">Sin mensajes aún. Rompe el hielo.</p>}
          
          {messages.map((msg, idx) => {
            const sender = msg.sender || msg.sender_name;
            const isMe = sender === userInfo.username;
            
            return (
              <div key={msg.id || idx} className={`flex flex-col max-w-[70%] ${isMe ? 'self-end' : 'self-start'}`}>
                <span className={`text-[10px] font-bold mb-1 ${isMe ? 'text-right text-green-600' : 'text-gray-500'}`}>
                  {isMe ? 'Tú' : sender}
                </span>
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${isMe ? 'bg-green-500 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                  {msg.text || msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT DE MENSAJE */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-3">
          <input 
            type="text" 
            className="flex-1 bg-gray-100 border-none rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
            placeholder="Escribe un mensaje táctico..." 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
          />
          <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full px-8 py-3 transition-colors shadow-md hover:shadow-lg">
            Enviar
          </button>
        </form>

      </div>
    </div>
  );
}