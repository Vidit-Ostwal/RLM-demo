import { RawMessage, UIMessage } from "../types"

export async function transformTrace(
    raw?: RawMessage[]
): Promise<UIMessage[]> {
    if (!Array.isArray(raw)) {
        console.warn("transformTrace: raw is not array", raw)
        return []
    }

    const out: UIMessage[] = []

    for (const msg of raw) {
        const content = msg.content ?? ""

        // assistant messages with code blocks
        if (
            msg.role === "assistant" &&
            Array.isArray(msg.code_blocks) &&
            msg.code_blocks.length > 0
        ) {
            out.push({ type: "assistant", text: content, usage: msg.usage })

            for (const code of msg.code_blocks) {
                const is_sub_llm_called = code.includes("llm_query") || code.includes("llm_query_batched")
                out.push({ type: "repl_call", code, is_sub_llm_called })
            }
            continue
        }

        // user messages with observed code output
        if (
            msg.role === "user" &&
            typeof msg.code_blocks_observed === "string" &&
            msg.code_blocks_observed.length > 0
        ) {
            out.push({ type: "repl_env_output", text: msg.code_blocks_observed })
            out.push({ type: "user", text: content })
            continue
        }

        // default case
        out.push({ type: msg.role, text: content })
    }
    console.log("transformTrace out:", out)

    return out
}