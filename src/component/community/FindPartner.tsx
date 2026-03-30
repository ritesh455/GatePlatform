import { useState } from "react";
import { findRandomPartner, sendStudyRequest } from "../../services/communityService";
import { useAuth } from "../../contexts/AuthContext";
import { FaSearch, FaBrain, FaUserGraduate, FaPaperPlane, FaRobot } from "react-icons/fa";

export default function FindPartner() {
  const [students, setStudents] = useState<any[]>([]);
  const { user } = useAuth();

  const findPartners = async () => {
    if (!user) return;
    const data = await findRandomPartner(user.token);
    setStudents(data.matched_students || []);
  };

  const findWeakPartner = async () => {
    if (!user) return;
    const res = await fetch(
      "https://gateplatform.onrender.com/api/community/find-weakness-partner",
      {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      }
    );
    const data = await res.json();
    if (!data.success) {
      alert(data.message);
      return;
    }
    setStudents(data.matches || []);
  };

  const sendRequest = async (id: number) => {
    try {
      if (!user) return;
      const res = await sendStudyRequest(user.token, id);
      if (!res.success) {
        alert(res.message);
        return;
      }
      alert("Request sent successfully");
    } catch (err: any) {
      console.error(err);
      alert("Failed to send request");
    }
  };

  return (
    // REMOVED: max-w-6xl and large padding. ADDED: w-full
    <div className="w-full animate-in fade-in duration-500">
      
      {/* HEADER SECTION - Made padding smaller and gap tighter */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5 mb-6">
        <div className="flex flex-col gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Partner <span className="text-blue-600">Match</span>
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              Find your perfect peer
            </p>
          </div>

          {/* BUTTONS: Adjusted for narrow containers */}
          <div className="flex flex-col gap-2">
            <button
              onClick={findPartners}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all w-full"
            >
              <FaSearch className="text-[10px]" />
              Find Random
            </button>
            <button
              onClick={findWeakPartner}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-100 active:scale-95 transition-all w-full"
            >
              <FaBrain className="text-[10px]" />
              Match Weakness
            </button>
          </div>
        </div>
      </div>

      {/* MATCHES GRID - Adjusted cols for narrow sidebar */}
      <div className="grid grid-cols-1 gap-4">
        {students?.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
            <FaUserGraduate className="text-slate-200 text-xl mx-auto mb-2" />
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest px-4">
              Search above to find peers
            </p>
          </div>
        ) : (
          students.map((s) => (
            <div 
              key={s.student_user_no} 
              className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-blue-200 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <FaRobot className="text-lg" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-800 uppercase text-[11px] truncate">
                    User {s.student_user_no}
                  </h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    Available
                  </p>
                </div>
              </div>

              <button
                onClick={() => sendRequest(s.student_user_no)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-[0.98]"
              >
                <FaPaperPlane className="text-[9px]" />
                Send Request
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}