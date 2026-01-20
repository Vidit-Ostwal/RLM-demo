export function getMessageBg(type: string) {
    switch (type) {
        case "user":
            return "bg-blue-100"
        case "assistant":
            return "bg-slate-200"
        case "repl_call":
        case "repl_env_output":
        case "sub_llm_call":
            return "bg-black text-green-400"
        default:
            return "bg-slate-900 text-slate-100"
    }
}