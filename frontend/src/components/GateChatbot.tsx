"use client";

import React, { useEffect, useState } from "react";
import { Send, Trash } from "lucide-react";
import { apiService } from "../services/api";

interface Message {
  role: "user" | "bot";
  text: string;
}

const STORAGE_KEY = "gate_ai_chat";

const GateChatbot: React.FC = () => {

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const cleanAIText = (text: string) => {
  return text
    .replace(/[#*`]/g, "")      // remove # * `
    .replace(/\$/g, "")         // remove $
    .replace(/\\\{/g, "{")      // fix latex braces
    .replace(/\\\}/g, "}")
    .replace(/\n{2,}/g, "\n\n") // normalize spacing
    .trim();
};

  /* ---------------- Load Local Chat ---------------- */
useEffect(() => {
  if (typeof window === "undefined") return;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  } catch (error) {
    console.error("Error loading chat:", error);
    localStorage.removeItem(STORAGE_KEY);
  }
}, []);

  /* ---------------- Save Local Chat ---------------- */

useEffect(() => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error("Error saving chat:", error);
  }
}, [messages]);

  /* ---------------- Send Message ---------------- */

  const sendMessage = async () => {

    if (!input.trim()) return;

    const question = input;

    const userMessage: Message = {
      role: "user",
      text: question
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {

      const res: any = await apiService.askGateAI(question);

      console.log("AI RESPONSE:", res); // DEBUG

      let answer = "";

if (res?.answer) {
  answer = res.answer;
} else if (res?.data?.answer) {
  answer = res.data.answer;
} else if (typeof res === "string") {
  answer = res;
}

      if (!answer) {
        answer = "AI could not generate an answer.";
      }

      const botMessage: Message = {
        role: "bot",
        text: cleanAIText(answer)
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {

      console.error("Chatbot error:", error);

      setMessages(prev => [
        ...prev,
        { role: "bot", text: "AI service failed. Please try again." }
      ]);

    }

    setLoading(false);
  };

  /* ---------------- Clear Chat ---------------- */

  const clearChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[80vh]">

      <div className="flex justify-between items-center mb-4">

        <h1 className="text-3xl font-bold text-slate-900">
          GATE AI Tutor
        </h1>

        <button
          onClick={clearChat}
          className="flex items-center gap-1 text-red-500 hover:text-red-600"
        >
          <Trash size={16} />
          Clear Chat
        </button>

      </div>

      {/* Chat Window */}

      <div className="flex-1 overflow-y-auto bg-white border rounded-lg p-4 space-y-4">

        {messages.length === 0 && (
          <p className="text-slate-500">
            Ask any GATE related question.
          </p>
        )}

        {messages.map((msg, index) => (

          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >

            <div
              className={`max-w-xl px-4 py-2 rounded-lg whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-slate-800"
              }`}
            >
              {msg.text}
            </div>

          </div>

        ))}

        {loading && (
          <p className="text-slate-500">AI is thinking...</p>
        )}

      </div>

      {/* Input */}

      <div className="flex mt-4 gap-2">

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask GATE question..."
          className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />

        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
        >
          <Send size={18} />
          Send
        </button>

      </div>

    </div>
  );
};

export default GateChatbot;











// "use client";

// import React, { useEffect, useState } from "react";
// import { Send, Trash } from "lucide-react";
// import { apiService } from "../services/api";

// interface Message {
//   role: "user" | "bot";
//   text: string;
// }

// const STORAGE_KEY = "gate_ai_chat_history";

// const GateChatbot: React.FC = () => {

//   const [messages, setMessages] = useState<Message[]>(() => {
//   if (typeof window !== "undefined") {
//     const saved = localStorage.getItem("gate_ai_chat_history");
//     return saved ? JSON.parse(saved) : [];
//   }
//   return [];
// });
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);

//   /* ---------------- Clean AI markdown ---------------- */

//   const cleanAIText = (text: string) => {
//     return text
//       .replace(/[#*`]/g, "")
//       .replace(/\$/g, "")
//       .replace(/\n{2,}/g, "\n\n")
//       .trim();
//   };

//   /* ---------------- Load chat on startup ---------------- */

//   useEffect(() => {

//     if (typeof window === "undefined") return;

//     const savedChat = localStorage.getItem(STORAGE_KEY);

//     if (savedChat) {
//       try {
//         setMessages(JSON.parse(savedChat));
//       } catch {
//         localStorage.removeItem(STORAGE_KEY);
//       }
//     }

//   }, []);

//   /* ---------------- Save chat when messages change ---------------- */

// useEffect(() => {
//   localStorage.setItem("gate_ai_chat_history", JSON.stringify(messages));
// }, [messages]);

//   /* ---------------- Send message ---------------- */

//   const sendMessage = async () => {

//     if (!input.trim()) return;

//     const question = input;

//     const userMessage: Message = {
//       role: "user",
//       text: question
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setInput("");
//     setLoading(true);

//     try {

//       const res: any = await apiService.askGateAI(question);

//       let answer = "";

//       if (res?.answer) answer = res.answer;
//       else if (res?.data?.answer) answer = res.data.answer;

//       if (!answer) answer = "AI could not generate an answer.";

//       const botMessage: Message = {
//         role: "bot",
//         text: cleanAIText(answer)
//       };

//       setMessages(prev => [...prev, botMessage]);

//     } catch (error) {

//       console.error("Chatbot error:", error);

//       setMessages(prev => [
//         ...prev,
//         { role: "bot", text: "AI service failed. Please try again." }
//       ]);

//     }

//     setLoading(false);
//   };

//   /* ---------------- Clear chat ---------------- */

// const clearChat = () => {
//   localStorage.removeItem("gate_ai_chat_history");
//   setMessages([]);
// };

//   return (
//     <div className="max-w-4xl mx-auto flex flex-col h-[80vh]">

//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-3xl font-bold text-slate-900">
//           GATE AI Tutor
//         </h1>

//         <button
//           onClick={clearChat}
//           className="flex items-center gap-1 text-red-500 hover:text-red-600"
//         >
//           <Trash size={16} />
//           Clear Chat
//         </button>
//       </div>

//       {/* Chat Window */}

//       <div className="flex-1 overflow-y-auto bg-white border rounded-lg p-4 space-y-4">

//         {messages.length === 0 && (
//           <p className="text-slate-500">
//             Ask any GATE related question.
//           </p>
//         )}

//         {messages.map((msg, index) => (

//           <div
//             key={index}
//             className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
//           >

//             <div
//               className={`max-w-xl px-4 py-2 rounded-lg whitespace-pre-wrap ${
//                 msg.role === "user"
//                   ? "bg-blue-500 text-white"
//                   : "bg-gray-100 text-slate-800"
//               }`}
//             >
//               {msg.text}
//             </div>

//           </div>

//         ))}

//         {loading && (
//           <p className="text-slate-500">AI is thinking...</p>
//         )}

//       </div>

//       {/* Input */}

//       <div className="flex mt-4 gap-2">

//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           placeholder="Ask GATE question..."
//           className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
//           onKeyDown={(e) => {
//             if (e.key === "Enter") sendMessage();
//           }}
//         />

//         <button
//           onClick={sendMessage}
//           className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
//         >
//           <Send size={18} />
//           Send
//         </button>

//       </div>

//     </div>
//   );
// };

// export default GateChatbot;