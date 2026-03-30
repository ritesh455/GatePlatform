import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import { getChatMessages, unfriend } from "../../services/communityService";
import { FaUserMinus, FaPaperPlane, FaHashtag, FaInfoCircle } from "react-icons/fa";

export default function ChatRoom({ groupId }: any) {
  const socket = useSocket();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUser, setTypingUser] = useState<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typingUser]);

  const handleUnfriend = async () => {
    if (!user) return;
    const confirmAction = window.confirm("Are you sure you want to remove this study partner?");
    if (!confirmAction) return;
    const res = await unfriend(user.token, groupId);
    if (res.success) {
      alert("Study partner removed");
      window.location.reload();
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    if (!user || !socket) return;
    socket.emit("typing", {
      groupId,
      userNo: user.userNo,
    });
  };

  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;
      try {
        const data = await getChatMessages(user.token, groupId);
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };
    loadMessages();
  }, [groupId, user]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("joinRoom", groupId);

    const handleMessage = (msg: any) => {
      if (msg.groupId === groupId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("userTyping", (data: any) => {
      if (data.groupId === groupId) {
        setTypingUser(data.userNo);
        setTimeout(() => {
          setTypingUser(null);
        }, 1500);
      }
    });

    socket.on("receiveMessage", handleMessage);
    return () => {
      socket.off("receiveMessage", handleMessage);
    };
  }, [socket, groupId]);

  const sendMessage = () => {
    if (!message.trim() || !user) return;
    socket?.emit("sendMessage", {
      groupId,
      senderId: user.userNo,
      message
    });
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-white md:rounded-r-[2.5rem] overflow-hidden">
      
      {/* CHAT HEADER */}
      <header className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-200">
            <FaHashtag className="text-sm" />
          </div>
          <div>
            <h2 className="font-black text-slate-800 tracking-tight leading-none uppercase text-sm">Study Room</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Chat ID: {groupId}</p>
          </div>
        </div>

        <button
          onClick={handleUnfriend}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest active:scale-95"
        >
          <FaUserMinus className="text-sm" />
          <span className="hidden sm:inline">Remove Partner</span>
        </button>
      </header>

      {/* MESSAGE AREA */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar"
      >
        <div className="flex justify-center mb-6">
          <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-widest shadow-sm">
            <FaInfoCircle className="text-green-500" /> Start of conversation
          </span>
        </div>

        {messages.map((m, i) => {
  // We check both sender_user_no (from DB) and senderId (from Socket)
  // We also ensure user exists to avoid errors
  const isMe = user?.userNo && (
    Number(m.sender_user_no) === Number(user.userNo) || 
    Number(m.senderId) === Number(user.userNo) ||
    Number(m.sender_id) === Number(user.userNo) // Added just in case
  );

  return (
    <div key={i} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[80%] sm:max-w-[70%] p-4 rounded-3xl shadow-sm text-sm leading-relaxed ${
        isMe 
        ? 'bg-green-600 text-white rounded-tr-sm' 
        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
      }`}>
        {/* Only show "Partner" label if it's NOT me */}
        {!isMe && (
          <p className="text-[10px] font-black uppercase tracking-tighter text-green-600 mb-1">
           {/* {m.username ? m.username : `User ${m.sender_user_no || m.senderId}`} */}
          </p>
        )}
        <p className="font-medium">{m.message}</p>
      </div>
    </div>
  );
})}

        {/* Typing Indicator */}
        {typingUser && typingUser !== user?.userNo && (
          <div className="flex items-center gap-2 animate-pulse pl-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce delay-200"></span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Partner is typing...
            </p>
          </div>
        )}
      </main>

      {/* MESSAGE INPUT */}
      <footer className="p-4 md:p-6 bg-white border-t border-slate-100">
        <div className="relative flex items-center gap-3">
          <input
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-[1.5rem] px-6 py-4 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          <button
            onClick={sendMessage}
            className="h-[52px] w-[52px] flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-xl shadow-green-200 active:scale-90 transition-all shrink-0"
          >
            <FaPaperPlane className="text-lg translate-x-[-1px] translate-y-[1px]" />
          </button>
        </div>
      </footer>
    </div>
  );
}