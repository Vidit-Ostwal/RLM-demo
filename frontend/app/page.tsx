"use client"

import { useRef, useState } from "react"

type RawMessage = {
  role: "system" | "assistant" | "user"
  content: string
  code_blocks?: string[]
  code_blocks_observed?: string
  usage?: any
}

type ApiResponse = {
  messages: RawMessage[]
}

type UIMessage =
  | { type: "system"; text: string }
  | { type: "assistant"; text: string }
  | { type: "user"; text: string }
  | { type: "repl_call"; code: string }
  | { type: "repl_output"; text: string }

type DatasetSample = {
  context: string
  query: string
  expected_answer: string
}

export default function Home() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [loading, setLoading] = useState(false)

  const [dataset, setDataset] = useState<DatasetSample | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  const [activeModal, setActiveModal] = useState<
    | { type: "context" | "query" | "expected_answer" }
    | { type: "chat"; role: string; text: string }
    | null
  >(null)

  const [shuffleLoading, setShuffleLoading] = useState(false)

  const datasetIndexRef = useRef<number | null>(null)

  function truncate(text: string | undefined, max = 650) {
    if (!text) return ""
    return text.length > max ? text.slice(0, max) + "......." : text
  }

  async function shuffleDataset() {
    if (shuffleLoading) return
    setShuffleLoading(true)

    try {
      const index = Math.floor(Math.random() * 450) + 1
      datasetIndexRef.current = index

      const res = await fetch(`http://localhost:8000/get-dataset?index=${index}`)
      const data = await res.json()

      setDataset(data)
      setInput(data.query)
      setMessages([])
      setShowAnswer(false)
    } finally {
      setShuffleLoading(false)
    }
  }

  async function transformTrace(raw: RawMessage[]): Promise<UIMessage[]> {
    const out: UIMessage[] = []

    for (const msg of raw) {
      out.push({
        type: msg.role,
        text: msg.content,
      })

      if (msg.role === "assistant" && msg.code_blocks) {
        for (const code of msg.code_blocks) {
          out.push({
            type: "repl_call",
            code,
          })
        }
      }

      if (msg.role === "user" && msg.code_blocks_observed) {
        out.push({
          type: "repl_output",
          text: msg.code_blocks_observed,
        })
      }
    }

    return out
  }

  async function sendQuery() {
    if (loading) return
    if (!datasetIndexRef.current) return

    setLoading(true)

    try {
      const res = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index: datasetIndexRef.current,
        }),
      })

      const data: ApiResponse = await res.json()
      const uiMessages = await transformTrace(data.messages)
      setMessages(uiMessages)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="h-screen w-screen bg-slate-100 text-slate-900 flex flex-col p-6">
      <h1 className="text-2xl font-bold mb-4">RLM Learning Console</h1>

      {/* Dataset Viewer */}
      <div className="mb-6">
        <div className="grid grid-cols-10 gap-6 relative w-full">
          <div
            onClick={() => dataset && setActiveModal({ type: "context" })}
            className="col-span-7 bg-white border border-slate-300 rounded-lg p-4 h-52 overflow-hidden cursor-pointer hover:shadow"
          >
            <div className="font-semibold mb-2">Context</div>
            <div className="text-sm whitespace-pre-wrap text-slate-800 pb-10">
              {dataset ? truncate(dataset.context, 10000) : "No dataset loaded"}
            </div>
          </div>

          <div className="col-span-3 flex flex-col gap-4 h-52">
            <div
              onClick={() => dataset && setActiveModal({ type: "query" })}
              className="flex-1 bg-white border border-slate-300 rounded-lg p-4 overflow-hidden cursor-pointer hover:shadow"
            >
              <div className="font-semibold mb-2">User Query</div>
              <div className="text-sm text-slate-800 pb-6">
                {dataset ? truncate(dataset.query) : "No dataset loaded"}
              </div>
            </div>

            <div
              onClick={() => dataset && setActiveModal({ type: "expected_answer" })}
              className="flex-1 bg-white border border-slate-300 rounded-lg p-4 overflow-hidden cursor-pointer hover:shadow"
            >
              <div className="font-semibold mb-2">Expected Answer</div>
              <div className="text-sm text-slate-800 pb-6">
                {dataset ? truncate(dataset.expected_answer) : "No dataset loaded"}
              </div>
            </div>
          </div>

          <button
            disabled={shuffleLoading}
            onClick={shuffleDataset}
            className={`absolute -bottom-4 right-0 px-5 py-2 rounded text-white shadow ${shuffleLoading ? "bg-slate-400" : "bg-indigo-600"
              }`}
          >
            {shuffleLoading ? "Loading…" : "🔀 Shuffle"}
          </button>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((m, i) => {
          const isAssistant = m.type === "assistant"

          const role =
            m.type === "system"
              ? "SYSTEM"
              : m.type === "user"
                ? "USER"
                : m.type === "assistant"
                  ? "ASSISTANT"
                  : m.type === "repl_call"
                    ? "REPL CALL"
                    : "REPL OUTPUT"

          const align = isAssistant ? "ml-auto text-right" : "mr-auto text-left"

          const bg =
            m.type === "system"
              ? "bg-slate-100"
              : m.type === "user"
                ? "bg-blue-100"
                : m.type === "assistant"
                  ? "bg-slate-200"
                  : m.type === "repl_call"
                    ? "bg-black text-green-400"
                    : "bg-slate-900 text-slate-100"

          const fullText = m.type === "repl_call" ? m.code : m.text

          return (
            <div
              key={i}
              onClick={() => setActiveModal({ type: "chat", role, text: fullText })}
              className={`${align} max-w-[70%] cursor-pointer relative border border-slate-300 rounded-lg p-3 pt-6 ${bg} hover:shadow-md transition`}
            >
              {/* Floating role label */}
              <div className={`absolute -top-2 text-xs font-semibold text-slate-500 bg-transparent pointer-events-none ${align?.includes("ml-auto") ? "right-3" : "left-3"}`}>
                {role}
              </div>

              {/* Message */}
              <div className="text-sm whitespace-pre-wrap">
                {truncate(fullText, 150)}
              </div>
            </div>
          )
        })}

        {loading && <div className="text-slate-400 italic">Agent is thinking…</div>}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 border border-slate-300 rounded p-2 bg-slate-50 cursor-not-allowed"
          value={input}
          readOnly
          placeholder="Shuffle dataset to load a query..."
        />
        <button
          onClick={sendQuery}
          disabled={loading || !input.trim()}
          className={`px-6 rounded text-white font-medium transition-colors ${loading || !input.trim()
            ? "bg-slate-400 cursor-not-allowed"
            : "bg-slate-900 hover:bg-slate-800"
            }`}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>

      {/* Unified Modal (Dataset + Chat) */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-[80vw] max-w-4xl max-h-[80vh] overflow-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {activeModal.type === "chat" ? (
              <>
                <h2 className="text-xl font-semibold mb-4">{activeModal.role}</h2>
                <pre className="whitespace-pre-wrap text-slate-900">
                  {activeModal.text}
                </pre>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">
                  {activeModal.type === "context"
                    ? "Context"
                    : activeModal.type === "query"
                      ? "User Query"
                      : "Expected Answer"}
                </h2>

                <pre className="whitespace-pre-wrap text-slate-900">
                  {activeModal.type === "context"
                    ? dataset?.context
                    : activeModal.type === "query"
                      ? dataset?.query
                      : dataset?.expected_answer}
                </pre>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
