import { useState } from "react";
import FindPartner from "../components/community/FindPartner";
import IncomingRequests from "../components/community/IncomingRequests";
import ChatRoom from "../components/community/ChatRoom";
import ChatList from "../components/community/ChatList";
import SearchUser from "../components/community/SearchUser";
import { FaUsers, FaCompass, FaComments, FaRobot, FaUserPlus, FaEnvelopeOpenText } from "react-icons/fa";

type TabType = "discover" | "requests" | "messages";

export default function CommunityPage() {
  const [roomId, setRoomId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("discover");

  // Tab configuration for easy rendering
  const tabs = [
    { id: "discover", label: "Discover Friends", icon: <FaCompass /> },
    { id: "requests", label: "Incoming Requests", icon: <FaEnvelopeOpenText /> },
    { id: "messages", label: "Messages", icon: <FaComments /> },
  ];

  return (
    <div className="min-h-screen max-w-full bg-slate-50/50 p-4 md:p-8 lg:p-12 animate-in fade-in duration-700 overflow-x-hidden font-inter">
      
      {/* PAGE TITLE & HEADER */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-green-600 mb-1">
            <FaUsers className="text-xl" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Social Ecosystem</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Study <span className="text-green-600">Community</span>
          </h1>
        </div>
        
        <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
          Network Status: <span className="text-green-500">Optimized</span>
        </p>
      </header>

      {/* TABS NAVIGATION */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0 ${
                activeTab === tab.id
                  ? "bg-green-600 text-white shadow-lg shadow-green-200 scale-[1.02]"
                  : "text-slate-500 hover:text-green-600 hover:bg-green-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT AREA */}
      <div className="max-w-7xl mx-auto">
        
        {/* TAB 1: DISCOVER FRIENDS */}
        {activeTab === "discover" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <FaCompass className="text-green-500" />
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Discovery Zone</h2>
              </div>
              <div className="flex flex-col gap-8 relative z-10">
                <div className="w-full"><SearchUser /></div>
                <div className="h-px bg-slate-100 w-full opacity-50" />
                <div className="w-full"><FindPartner /></div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: INCOMING REQUESTS */}
        {activeTab === "requests" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-3 mb-8">
                <FaUserPlus className="text-green-500" />
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Request Inbox</h2>
              </div>
              <IncomingRequests setActiveRoom={(id:any) => { setRoomId(id); setActiveTab("messages"); }} />
            </section>
          </div>
        )}

        {/* TAB 3: MESSAGES (CHAT INTERFACE) */}
        {activeTab === "messages" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <main className="w-full">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden h-[75vh] lg:h-[80vh] flex flex-col md:flex-row">
                {/* Sidebar List */}
                <div className="w-full md:w-72 lg:w-80 shrink-0 border-r border-slate-50 flex flex-col">
                  <ChatList setRoomId={setRoomId} />
                </div>

                {/* Chat Conversation Area */}
                <div className="flex-1 bg-slate-50/30 relative flex flex-col overflow-hidden">
                  {roomId ? (
                    <div className="h-full w-full animate-in fade-in slide-in-from-right-4 duration-500">
                      <ChatRoom groupId={roomId} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 lg:p-12">
                      <div className="h-20 w-20 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50">
                        <FaComments className="text-3xl text-slate-200" />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">No Active Session</h3>
                      <p className="text-xs font-medium text-slate-400 max-w-[200px] leading-relaxed">
                        Select a study partner from the list to begin collaborating.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        )}
      </div>

      <footer className="max-w-7xl mx-auto mt-12 text-center pb-8">
        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">
          End-to-End Knowledge Exchange
        </p>
      </footer>
    </div>
  );
}