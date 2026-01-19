import { ExpandIcon, CollapseIcon } from "./icons/ChatIcons"

type ChatExpandToggleProps = {
    expanded: boolean
    disabled: boolean
    onToggle: () => void
}

export function ChatExpandToggle({
    expanded,
    disabled,
    onToggle,
}: ChatExpandToggleProps) {
    return (
        <button
            disabled={disabled}
            onClick={!disabled ? onToggle : undefined}
            className={`transition ${disabled
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-500 hover:text-slate-800 cursor-pointer"
                }`}
        >
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </button>
    )
}
