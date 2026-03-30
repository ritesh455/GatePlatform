import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getIncomingRequests,
  acceptStudyRequest
} from "../../services/communityService";
import { FaUserPlus, FaCheck, FaClock, FaUserCircle } from "react-icons/fa"; // Icons for a better GUI

export default function IncomingRequests({ setActiveRoom }: any) {
  const { user } = useAuth();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load incoming requests - Logic preserved
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      try {
        const data = await getIncomingRequests(user.token);
        setRequests(data.requests || []);
      } catch (err) {
        console.error("Failed to load requests", err);
      }
    };
    fetchRequests();
  }, [user]);

  const acceptRequest = async (id: number) => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await acceptStudyRequest(user.token, id);
      if (res.success) {
        // remove request from UI - Logic preserved
        setRequests((prev) => prev.filter((r) => r.id !== id));
        // open chat room - Logic preserved
        if (setActiveRoom) {
          setActiveRoom(res.groupId);
        }
      }
    } catch (err) {
      console.error("Accept request failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shadow-sm">
          <FaUserPlus className="text-lg" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
            Incoming Requests
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
            {requests.length} pending invitations
          </p>
        </div>
      </div>

      {/* REQUESTS LIST */}
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
            <FaClock className="text-slate-200 text-2xl mb-2" />
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
              No pending requests
            </p>
          </div>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="group flex items-center gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-xl shadow-slate-200/40 hover:border-blue-200 transition-all duration-300"
            >
              {/* Avatar Placeholder */}
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <FaUserCircle className="text-xl" />
              </div>

              {/* Sender Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 uppercase truncate">
                  User {r.sender_user_no}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Wants to study with you
                </p>
              </div>

              {/* Action Button */}
              <button
                disabled={loading}
                onClick={() => acceptRequest(r.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95 shrink-0"
              >
                {loading ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FaCheck className="text-[8px]" />
                    <span>Accept</span>
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>

      {/* FOOTER TIP */}
      <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-blue-50/50 rounded-2xl border border-blue-100/30">
        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></span>
        <p className="text-[9px] font-bold text-blue-600/70 uppercase tracking-tight">
          Accepted requests will open a new chat room immediately
        </p>
      </div>
    </div>
  );
}