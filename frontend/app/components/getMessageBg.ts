export function getMessageBg(type: string) {
    switch (type) {
        case "system":
            return "border-purple-500 text-purple-400"
        case "user":
            return "border-cyan-500 text-cyan-400"
        case "assistant":
            return "border-green-500 text-green-400"
        case "repl_call":
        case "sub_llm_call":
            return "border-orange-500 text-orange-400"
        case "repl_env_output":
            return "border-yellow-400 text-yellow-300"
        default:
            return "border-slate-600 text-slate-300"
    }
}