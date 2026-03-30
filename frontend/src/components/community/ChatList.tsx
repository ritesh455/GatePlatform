import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getMyChats } from "../../services/communityService";
import { useSocket } from "../../contexts/SocketContext";
import { FaHashtag, FaChevronRight, FaRegCommentDots } from "react-icons/fa"; // Added icons for flair

export default function ChatList({ setRoomId }: any) {
  const { user } = useAuth();
  const socket = useSocket();

  const [chats, setChats] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<{ [key: number]: boolean }>({});

  // Load chats - Logic preserved
  useEffect(() => {
    const loadChats = async () => {
      if (!user) return;
      const data = await getMyChats(user.token);
      setChats(data.chats || []);
    };
    loadChats();
  }, [user]);

  // Listen for new messages - Logic preserved
  useEffect(() => {
    if (!socket) return;
    const handleMessage = (msg: any) => {
      setNotifications(prev => ({
        ...prev,
        [msg.groupId]: true
      }));
    };
    socket.on("receiveMessage", handleMessage);
    return () => {
      socket.off("receiveMessage", handleMessage);
    };
  }, [socket]);

  const openChat = (roomId: number) => {
    setRoomId(roomId);
    // remove notification - Logic preserved
    setNotifications(prev => ({
      ...prev,
      [roomId]: false
    }));
  };

  return (
    <div className="w-full md:w-80 flex flex-col bg-[#f8fafc] border-r border-slate-200 h-full">
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Messages</h2>
        <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" title="System Online"></div>
      </div>

      {/* Chat List Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <FaRegCommentDots className="text-4xl mb-3" />
            <p className="text-sm font-bold uppercase tracking-widest">No active chats</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.room_id}
              onClick={() => openChat(chat.room_id)}
              className="group relative flex items-center gap-4 p-4 rounded-[1.25rem] cursor-pointer transition-all duration-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 active:scale-[0.98]"
            >
              {/* Icon / Avatar Box */}
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0">
                <FaHashtag className="text-lg" />
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 truncate">
                    Study Chat <span className="text-blue-600">#{chat.username}</span>
                  </h3>
                  {notifications[chat.room_id] && (
                    <span className="flex h-2 w-2 rounded-full bg-red-500 ring-4 ring-red-100"></span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5 group-hover:text-slate-600 transition-colors">
                  Tap to view recent messages
                </p>
              </div>

              {/* Arrow Indicator */}
              <FaChevronRight className="text-[10px] text-slate-300 group-hover:text-slate-400 transition-all group-hover:translate-x-1" />

              {/* Notification Badge (Overlay) */}
              {notifications[chat.room_id] && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-lg shadow-red-200 uppercase tracking-tighter">
                  New
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer / Status Area */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-[0.2em]">
          Secure End-to-End Chat
        </p>
      </div>
    </div>
  );
}