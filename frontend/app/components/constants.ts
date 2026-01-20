export const ROLE_BADGES = [
    {
        role: "system",
        label: "system",
        tooltipTitle: "System Prompt",
        tooltipDescription:
            "The system prompt defines the model's role, task, and constraints. It guides the model's behavior and ensures consistent responses.",
    },
    {
        role: "user",
        label: "user",
        tooltipTitle: "User Message",
        tooltipDescription: "Direct input provided by the user.",
    },
    {
        role: "assistant",
        label: "assistant",
        tooltipTitle: "Assistant Message",
        tooltipDescription:
            "Model-generated response based on context and tools. Hover over any assistant message to view the exact tokens and cost.",
    },
]

export const ENV_ROLE_BADGES = [
    {
        role: "repl_call",
        label: "repl_call",
        tooltipTitle: "REPL Call",
        tooltipDescription:
            "Code execution step initiated by the model in the assistant message to be executed in the REPL environment.",
    },
    {
        role: "repl_env_output",
        label: "repl_env_output",
        tooltipTitle: "REPL Output",
        tooltipDescription: "Execution result returned from the REPL environment. Returned back to parent LLM via user message",
    },
    {
        role: "sub_llm_call",
        label: "sub_llm_call",
        tooltipTitle: "Sub LLM Call",
        tooltipDescription: "A Sub LLM has been called in the assistant message.",
    },
]
