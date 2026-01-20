"use client"

import { useRef, useState, useEffect } from "react"
import { ChatExpandToggle } from "./components/ChatExpandToggle"
import { UIMessage, DatasetSample, ApiResponse, RawMessage } from "./types"
import { ROLE_BADGES, ENV_ROLE_BADGES } from "./components/constants"
import { getMessageBg } from "./components/getMessageBg"
import { truncate } from "./utils/truncate"
import { transformTrace } from "./utils/transformTrace"
import { RoleBadge, RoleBadgeEnv } from "./components/RoleBadge"
import { sleep } from "./utils/sleep"

/* --------------------------------------------------- */

export default function Home() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [visibleMessages, setVisibleMessages] = useState<UIMessage[]>([])
  const [replMessages, setReplMessages] = useState<UIMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [charLimit, setCharLimit] = useState(650)
  const [chatExpanded, setChatExpanded] = useState(false)
  const [dataset, setDataset] = useState<DatasetSample | null>(null)
  const [shuffleLoading, setShuffleLoading] = useState(false)
  const datasetIndexRef = useRef<number | null>(null)
  const initialLoadRef = useRef(false)
  const indexRef = useRef(0)
  const pausedRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [activeModal, setActiveModal] = useState<
    | { type: "context" | "query" | "expected_answer" }
    | { type: "chat"; role: string; text: string }
    | null
  >(null)

  useEffect(() => {
    if (initialLoadRef.current) return
    initialLoadRef.current = true
    shuffleDataset(10)
  }, [])


  async function runUntilPause() {
    while (true) {
      if (pausedRef.current) return

      const i = indexRef.current
      const msg = messages[i]
      if (!msg) return

      // 👇 pause point
      if (msg.type === "repl_call") {
        const output = messages[i + 1]

        if (output?.type === "repl_env_output") {
          const combinedMsg: UIMessage = {
            type: "repl_env_interaction",
            messages: [msg, output],
            text: "ADD REPL ENVIRONMENT INTERACTION TO THE CONTEXT AND CONTINUE",
          }

          setVisibleMessages(prev => [...prev, combinedMsg])
          setReplMessages([msg, output])
          indexRef.current += 2
          pausedRef.current = true
          return
        }
      }

      if (msg.type !== "repl_env_output") {
        setVisibleMessages(prev => [...prev, msg])
      }

      indexRef.current += 1
      await sleep(1000)
    }
  }


  useEffect(() => {
    setVisibleMessages([])
    setReplMessages([])
    indexRef.current = 0
    pausedRef.current = false

    // auto-start first step
    if (messages.length) {
      runUntilPause()
    }
  }, [messages])


  async function shuffleDataset(index?: number) {
    if (shuffleLoading) return
    setShuffleLoading(true)

    setCharLimit(Math.floor(Math.random() * 51) + 500)
    try {
      const targetIndex = (index ?? Math.floor(Math.random() * 450) + 1) % 15
      datasetIndexRef.current = targetIndex

      const res = await fetch(`http://localhost:8000/get-dataset?index=${targetIndex}`)
      const data = await res.json()

      setDataset(data)
      setInput(data.query)
      setMessages([])
      setVisibleMessages([])
    } finally {
      setShuffleLoading(false)
    }
  }

  async function sendQuery() {
    if (loading || shuffleLoading) return
    if (!datasetIndexRef.current) return

    setLoading(true)

    try {
      const res = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: datasetIndexRef.current }),
      })

      const data: ApiResponse = await res.json()

      if (!Array.isArray(data.messages)) {
        console.error("Invalid API response:", data)
        setMessages([])
        return
      }

      const uiMessages = await transformTrace(data.messages)
      setMessages(uiMessages)
    } finally {
      setLoading(false)
    }
  }


  /* -------- Modal typing -------- */
  const modalText =
    activeModal?.type === "chat"
      ? activeModal.text
      : activeModal?.type === "context"
        ? truncate(dataset?.context, 500000)
        : activeModal?.type === "query"
          ? dataset?.query
          : dataset?.expected_answer

  // What the UI should render
  const displayText = modalText

  return (
    <main className="h-screen w-screen bg-slate-100 text-slate-900 flex flex-col p-6">

      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-3 relative shrink-0">
        <h1 className="text-2xl font-bold">Recursive Language Model</h1>

        {/* Info button wrapper becomes the group */}
        <div className="relative group">
          <button className="w-5 h-5 flex items-center justify-center rounded-full border border-slate-400 text-slate-500 text-[10px] font-serif italic hover:bg-slate-300 hover:text-slate-700 transition-colors cursor-help">
            i
          </button>

          {/* Tooltip */}
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[450px] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 bg-white border border-slate-300 shadow-lg rounded-lg p-3 text-xs text-slate-700 z-50">
            <div className="font-semibold mb-1">Recursive Language Model</div>
            <p className="leading-relaxed">
              A Recursive Language Model (RLM) solves the long-context problem that limits traditional LLMs, which can only attend to a fixed number of tokens at once. Instead of feeding the whole input into the model, an RLM treats the prompt as an external environment and programmatically inspects, decomposes, and processes it. It uses a REPL where the model writes code to explore the data, makes recursive calls on smaller chunks, and combines results. This lets the model handle arbitrarily long input more accurately and cheaply than standard long-context tricks, dramatically outperforming base LLMs on complex tasks.
            </p>
          </div>
        </div>

        <div className="absolute right-1 group">
          <button
            onClick={() => { setDataset(null); setInput(""); setMessages([]); setVisibleMessages([]); }}
            className="text-xs text-slate-500 hover:text-slate-700 border border-slate-400 px-2 py-1 rounded bg-white hover:bg-slate-50 transition-colors uppercase"
          >
            Reset
          </button>

          <div className="pointer-events-none absolute right-0 top-full mt-2 w-[450px] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 bg-white border border-slate-300 shadow-lg rounded-lg p-3 text-xs text-slate-700 z-50">
            <div className="font-semibold mb-1">Reset</div>
            <p className="leading-relaxed">
              Clicking this will reset the application state and reload the page.
            </p>
          </div>
        </div>
      </div>

      {/* Dataset Viewer */}
      <div className="mb-6 shrink-0">
        <div className="grid grid-cols-10 gap-6 w-full h-[200px]">

          {/* ================= CONTEXT ================= */}
          <div className="col-span-6 relative group h-full">
            <div
              onClick={() => dataset && setActiveModal({ type: "context" })}
              className="h-full flex flex-col bg-white border border-slate-300 rounded-lg p-4 overflow-hidden cursor-pointer hover:shadow transition"
            >
              {/* Header */}
              <div className="pb-2 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wide shrink-0">
                CONTEXT
                {dataset && (
                  <span className="italic font-normal ml-2 text-slate-500 text-[13px] normal-case">
                    (~{dataset.context.length} chars)
                  </span>
                )}
              </div>

              {/* Scrollable content */}
              <div className="mt-2 flex-1 overflow-y-auto text-sm whitespace-pre-wrap text-slate-800 pr-1">
                {dataset
                  ? truncate(dataset.context, charLimit)
                  : "Click on the Shuffle dataset to load the dataset"}
              </div>
            </div>

            {/* Tooltip */}
            <div
              className="pointer-events-none absolute -top-2 left-1/3 -translate-x-1/2 -translate-y-full
        opacity-0 group-hover:opacity-100 transition
        bg-black text-white text-xs rounded-md px-3 py-2 w-96 shadow-lg z-50"
            >
              A longer contextual input that gives the model the necessary details and constraints needed to answer the user’s query properly.
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="col-span-4 flex flex-col gap-4 h-full">

            {/* ================= USER QUERY (80%) ================= */}
            <div className="relative group flex-[4] h-full">
              <div
                onClick={() => dataset && setActiveModal({ type: "query" })}
                className="h-full flex flex-col bg-white border border-slate-300 rounded-lg p-4 overflow-hidden cursor-pointer hover:shadow transition"
              >
                {/* Header */}
                <div className="pb-2 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wide shrink-0">
                  USER QUERY
                </div>

                {/* Scrollable content */}
                <div className="mt-2 flex-1 overflow-y-auto text-sm text-slate-800 whitespace-pre-wrap pr-1">
                  {dataset
                    ? truncate(dataset.query, 100)
                    : "Click on the Shuffle dataset to load the dataset"}
                </div>
              </div>

              {/* Tooltip */}
              <div
                className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full
          opacity-0 group-hover:opacity-100 transition
          bg-black text-white text-xs rounded-md px-3 py-2 w-64 shadow-lg z-50"
              >
                This is the exact query the user asked.
                The model must generate an answer for this.
              </div>
            </div>

            {/* ================= BUTTON ROW (20%) ================= */}
            <div className="flex-[1] flex items-end gap-3 shrink-0">

              <button
                disabled={shuffleLoading || loading}
                onClick={() => shuffleDataset()}
                className={`flex-1 px-4 py-2 rounded-md text-white text-xs shadow transition
            ${shuffleLoading || loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                  }`}
              >
                {shuffleLoading ? "LOADING..." : "SHUFFLE"}
              </button>

              <button
                onClick={sendQuery}
                disabled={loading || shuffleLoading || !input.trim()}
                className={`flex-1 px-4 py-2 rounded-md text-white text-xs shadow transition
            ${loading || shuffleLoading || !input.trim()
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 cursor-pointer"
                  }`}
              >
                {loading ? "RUNNING..." : "RUN RLM QUERY"}
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* OUTER WRAPPER (this expands) */}
      <div
        className={`grid grid-cols-10 gap-6 min-h-0 transition-all duration-300 ${chatExpanded
          ? "fixed inset-0 z-50 p-6 bg-slate-100"
          : "relative"
          }`}
      >

        {/* LEFT: CHAT (7 cols) */}
        <div className="col-span-6 min-h-0">
          <div className="border border-green-500 rounded-xl bg-black h-full flex flex-col min-h-0">

            {/* HEADER */}
            <div className="px-4 py-2 border-b border-green-500 bg-black shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">
                  Conversation Trace
                </span>

                <div className="ml-3 flex items-center gap-2 normal-case font-normal tracking-wide min-w-0">
                  {ROLE_BADGES.map((badge) => (
                    <RoleBadge key={badge.role} {...badge} />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {pausedRef.current && (
                  <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide rounded border border-red-500 bg-black text-red-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-pulse inline-flex h-full w-full rounded-full bg-red-500" />
                    </span>
                    <span className="whitespace-nowrap">
                      Paused · click on REPL Interaction button below
                    </span>
                  </div>
                )}

                <ChatExpandToggle
                  expanded={chatExpanded}
                  disabled={visibleMessages.length === 0}
                  onToggle={() => setChatExpanded(!chatExpanded)}
                />
              </div>
            </div>

            {/* SCROLL AREA */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-black">
              {visibleMessages.map((m, i) => {
                const isAssistant = m.type === "assistant" || m.type === "repl_call"
                const role = m.type.toUpperCase()
                const align = isAssistant ? "ml-auto" : "mr-auto"
                const fullText = m.type === "repl_call" ? m.code : m.text

                if (m.type === "repl_env_interaction") {
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setReplMessages([])
                        setVisibleMessages(prev => {
                          const last = prev.at(-1)
                          if (last?.type !== "repl_env_interaction") return prev
                          return [...prev.slice(0, -1), ...last.messages]
                        })

                        pausedRef.current = false
                        runUntilPause()
                      }}
                      className="
                mx-auto w-fit cursor-pointer
                border border-red-500
                rounded-full px-4 py-1
                bg-black text-red-400
                text-[10px] font-semibold
                uppercase tracking-widest
                hover:bg-red-950
                transition-colors
              "
                    >
                      {m.text}
                    </div>
                  )
                }

                const styles = getMessageBg(m.type)

                return (
                  <div
                    key={i}
                    onClick={() => setActiveModal({ type: "chat", role, text: fullText })}
                    className={`${align} w-fit max-w-[90%] cursor-pointer border rounded-lg p-3 pt-5 relative mt-2 group bg-black ${styles}`}>
                    {/* ROLE TAGS */}
                    <div className={`absolute -top-2 ${isAssistant ? "right-2" : "left-2"} flex gap-1`}>
                      <div className={`text-[10px] font-bold px-1 rounded border bg-black ${styles}`}>
                        {role}
                      </div>
                    </div>

                    {/* MESSAGE */}
                    <div className="whitespace-pre-wrap break-words text-xs text-left font-mono">{truncate(fullText, 1250)}</div>

                    {/* USAGE TOOLTIP */}
                    {m.type === "assistant" && m.usage && (
                      <div className="absolute top-6 right-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black border border-green-500 text-green-400 text-[12px] px-2 py-1 rounded pointer-events-none">
                        <div>Input Tokens: {m.usage.prompt_tokens}</div>
                        <div>Output Tokens: {m.usage.completion_tokens}</div>
                        <div>Total Tokens: {m.usage.total_tokens}</div>
                        <div>Cost: ${m.usage.cost}</div>
                      </div>
                    )}
                  </div>
                )
              })}

              {loading && (
                <div className="text-green-600 italic">Agent is thinking…</div>
              )}
            </div>
          </div>
        </div>


        {/* RIGHT PANEL (3 cols) */}
        <div className="col-span-4 min-h-0">
          <div className="border border-green-500 rounded-xl bg-black h-full flex flex-col min-h-0">

            {/* HEADER */}
            <div className="px-4 py-2 border-b border-green-500 shrink-0 flex items-center justify-between bg-black">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">
                  REPL ENVIRONMENT
                </span>

                <div className="ml-3 flex items-center gap-2 normal-case font-normal tracking-wide">
                  {ENV_ROLE_BADGES.map((badge) => (
                    <RoleBadgeEnv key={badge.role} {...badge} />
                  ))}
                </div>
              </div>

              <ChatExpandToggle
                expanded={chatExpanded}
                disabled={visibleMessages.length === 0}
                onToggle={() => setChatExpanded(!chatExpanded)}
              />
            </div>

            {/* SCROLL AREA */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-black">
              {replMessages.map((m, i) => {
                const isAssistant = m.type === "assistant" || m.type === "repl_call"
                const role = m.type.toUpperCase()
                const align = isAssistant ? "ml-auto" : "mr-auto"
                const fullText = m.type === "repl_call" ? m.code : m.text

                const styles = getMessageBg(m.type)
                return (
                  <div
                    key={i}
                    onClick={() => setActiveModal({ type: "chat", role, text: fullText })}
                    className={`${align} w-fit max-w-[90%] cursor-pointer border rounded-lg p-3 pt-5 relative mt-2 group bg-black ${styles}`}>
                    {/* ROLE TAGS */}

                    <div className={`absolute -top-2 ${isAssistant ? "right-2" : "left-2"} flex gap-1`}>

                      {m.type === "repl_call" && m.is_sub_llm_called && (
                        <div className={`text-[10px] font-bold px-1 rounded border bg-black ${styles}`}>
                          SUB_LLM_CALL
                        </div>
                      )}

                      <div className={`text-[10px] font-bold px-1 rounded border bg-black ${styles}`}>
                        {role}
                      </div>
                    </div>

                    {/* MESSAGE */}
                    <div className="whitespace-pre-wrap break-words text-xs text-left font-mono">{truncate(fullText, 1250)}</div>

                    {/* USAGE TOOLTIP */}
                    {m.type === "assistant" && m.usage && (
                      <div className="absolute top-6 right-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black border border-green-500 text-green-400 text-[12px] px-2 py-1 rounded pointer-events-none">
                        <div>Input Tokens: {m.usage.prompt_tokens}</div>
                        <div>Output Tokens: {m.usage.completion_tokens}</div>
                        <div>Total Tokens: {m.usage.total_tokens}</div>
                        <div>Cost: ${m.usage.cost}</div>
                      </div>
                    )}
                  </div>
                )
              })}

              {loading && (
                <div className="text-green-600 italic">Agent is thinking…</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unified Modal (Dataset + Chat) */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative bg-white rounded-xl p-6 w-[80vw] max-w-4xl max-h-[80vh] overflow-auto shadow-xl
                 font-sans text-[14px] leading-relaxed text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-medium mb-3 text-slate-700">
              {activeModal.type === "chat"
                ? activeModal.role
                : activeModal.type === "context"
                  ? "CONTEXT"
                  : activeModal.type === "query"
                    ? "USER QUERY"
                    : "EXPECTED ANSWER"}
            </h2>

            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4
                          cursor-pointer
                          text-slate-400 hover:text-slate-700
                          hover:bg-slate-100
                          rounded-full p-1
                          transition-all duration-150"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <hr className="border-slate-400 mb-4" />

            {/* 👇 Conversation box */}
            <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 max-h-[60vh] overflow-auto">
              <pre className="whitespace-pre-wrap font-sans text-slate-800">
                {displayText}
              </pre>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
