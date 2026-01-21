export function getMessageBg(type: string) {
    switch (type) {
        case "system prompt":
            return "border-violet-400/60 text-violet-300 hover:bg-violet-950/50 hover:border-violet-400"
        case "user message":
            return "border-sky-400/60 text-sky-300 hover:bg-sky-950/50 hover:border-sky-400"
        case "assistant message":
            return "border-emerald-400/60 text-emerald-300 hover:bg-emerald-950/50 hover:border-emerald-400"
        case "repl_call":
        case "sub_llm_call":
            return "border-amber-400/60 text-amber-300 hover:bg-amber-950/50 hover:border-amber-400"
        case "repl_env_output":
            return "border-lime-400/60 text-lime-300 hover:bg-lime-950/50 hover:border-lime-400"
        default:
            return "border-slate-500/60 text-slate-400 hover:bg-slate-900/50 hover:border-slate-500"
    }
}