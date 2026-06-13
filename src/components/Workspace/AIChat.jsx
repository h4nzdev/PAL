import { useState } from 'react'
import { Bot, Send, Zap } from 'lucide-react'
import { fetchGroqResponse } from "../../lib/groqClient";

const QUICK_ACTIONS = [
  'Generate Next Phase',
  'Break down selected task',
  'Summarize progress',
  'Suggest improvements',
]

export default function AIChat({ journeyName, nodes }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm your AI co-pilot for **${journeyName}**. I can see your full project tree and help you plan, break down tasks, or generate next steps.`,
    },
  ]);
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buildPrompt = (userMessage) => {
    const taskCount = nodes.filter((n) => n.type === "task").length;
    const doneCount = nodes.filter(
      (n) => n.type === "task" && n.checked,
    ).length;
    const nodeSummary = nodes
      .slice(0, 10)
      .map(
        (n) =>
          `- ${n.type}: ${n.content}${n.dueDate ? ` (due ${n.dueDate})` : ""}${n.checked ? " ✅" : ""}`,
      )
      .join("\n");

    return `You are an AI project co-pilot for the journey titled "${journeyName}".
The project contains ${taskCount} tasks, ${doneCount} completed.
Here are up to 10 nodes from the current journey:
${nodeSummary}

Answer the user question directly and help them with planning, next steps, or task breakdowns.

User: ${userMessage}
AI:`;
  };

  const send = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages((m) => [...m, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const prompt = buildPrompt(userMessage);
      const completion = await fetchGroqResponse(prompt);
      setMessages((m) => [...m, { role: "assistant", content: completion }]);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to connect to Groq.");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Sorry, I could not generate a response right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2 flex-shrink-0">
        <Bot size={15} className="text-emerald-400" />
        <span className="text-white text-sm font-medium">AI Co-Pilot</span>
        <span className="ml-auto text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
          Groq
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div
              className={`rounded-xl p-3 text-sm leading-relaxed ${
                m.role === "assistant"
                  ? "bg-white/5 text-gray-200 max-w-full"
                  : "bg-emerald-500/20 text-emerald-100 border border-emerald-500/20 max-w-[90%]"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {error && (
          <div className="rounded-xl p-3 text-sm leading-relaxed bg-rose-500/10 text-rose-200 border border-rose-500/20">
            {error}
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/5 flex flex-wrap gap-1.5 flex-shrink-0">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => setInput(action)}
            className="text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-2.5 py-1 rounded-full transition-all flex items-center gap-1"
          >
            <Zap size={10} /> {action}
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-white/5 flex gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything about this journey..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-lg transition-all flex-shrink-0 disabled:opacity-50"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
