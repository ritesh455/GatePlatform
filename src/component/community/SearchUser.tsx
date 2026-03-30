import { useState } from "react";
import { sendStudyRequest } from "../../services/communityService";
import { useAuth } from "../../contexts/AuthContext";
import { FaSearch, FaUserPlus, FaUserCircle, FaCompass } from "react-icons/fa"; // Premium icons

export default function SearchUser() {
  const { user } = useAuth();

  const [username, setUsername] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchUser = async () => {
    try {
      if (!username.trim()) {
        alert("Enter username to search");
        return;
      }

      setIsSearching(true);
      const res = await fetch(
        `https://gateplatform.onrender.com/api/auth/search-user?username=${username}`
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        setResults([]);
        return;
      }

      setResults(data.users || []);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const sendRequest = async (userId: number) => {
    if (!user) return;
    try {
      const res = await sendStudyRequest(user.token, userId);
      if (!res.success) {
        alert(res.message);
        return;
      }
      alert("Request sent successfully");
    } catch (error) {
      console.error("Request failed", error);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full animate-in fade-in duration-500">
      
      {/* SEARCH INPUT GROUP */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <FaSearch className={`text-sm transition-colors duration-300 ${username ? 'text-blue-500' : 'text-slate-500'}`} />
        </div>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchUser()}
          placeholder="Find study partners by username..."
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-[1.5rem] py-4 pl-12 pr-32 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-medium shadow-sm"
        />
        <button
          onClick={searchUser}
          disabled={isSearching}
          className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:bg-slate-300 shadow-lg shadow-blue-200"
        >
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Search"
          )}
        </button>
      </div>

      {/* SEARCH RESULTS */}
      <div className="space-y-3">
        {results.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
              Results Found ({results.length})
            </p>
            {results.map((u) => (
              <div
                key={u.user_no}
                className="group flex justify-between items-center bg-white border border-slate-100 p-4 rounded-[1.5rem] shadow-xl shadow-slate-200/40 hover:border-blue-200 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <FaUserCircle className="text-xl" />
                  </div>
                  <div>
                    <span className="font-black text-slate-800 uppercase text-sm tracking-tight">{u.username}</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Active Student</p>
                  </div>
                </div>

                <button
                  onClick={() => sendRequest(u.user_no)}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  <FaUserPlus className="text-[10px]" />
                  <span>Send Request</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          username && !isSearching && (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
              <FaCompass className="text-slate-200 text-3xl mb-3" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                No explorers found with that name
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}