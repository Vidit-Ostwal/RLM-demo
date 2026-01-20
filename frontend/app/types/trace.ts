export type RawMessage = {
    role: "system" | "assistant" | "user"
    content: string
    code_blocks?: string[]
    code_blocks_observed?: string
    usage?: any
}

export type UIMessage =
    | { type: "system"; text: string }
    | { type: "assistant"; text: string; usage?: any }
    | { type: "user"; text: string }
    | { type: "repl_call"; code: string; is_sub_llm_called: boolean }
    | { type: "repl_env_output"; text: string }
    | { type: "repl_env_interaction"; messages: UIMessage[]; text: string }
