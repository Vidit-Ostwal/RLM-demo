import { getMessageBg } from "./getMessageBg"

export function RoleBadge({
    role,
    label,
    tooltipTitle,
    tooltipDescription,
}: {
    role: string
    label: string
    tooltipTitle?: string
    tooltipDescription?: string
}) {
    return (
        <div className="relative group min-w-0">
            {/* Badge */}
            <div
                className={`
          text-[10px] font-semibold uppercase tracking-wide
          px-3 py-1 rounded border border-slate-300 cursor-help
          ${getMessageBg(role)}
          max-w-full truncate whitespace-nowrap overflow-hidden
        `}
                title={label} // native tooltip for truncated text
            >
                {label}
            </div>

            {/* Tooltip */}
            {(tooltipTitle || tooltipDescription) && (
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[450px] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 bg-white border border-slate-300 shadow-lg rounded-lg p-3 text-xs text-slate-700 z-50">
                    {tooltipTitle && <div className="font-semibold mb-1">{tooltipTitle}</div>}
                    {tooltipDescription && <p className="leading-relaxed">{tooltipDescription}</p>}
                </div>
            )}
        </div>
    )
}


export function RoleBadgeEnv({
    role,
    label,
    tooltipTitle,
    tooltipDescription,
}: {
    role: string
    label: string
    tooltipTitle?: string
    tooltipDescription?: string
}) {
    return (
        <div className="relative group min-w-0">
            {/* Badge */}
            <div
                className={`
          text-[10px] font-semibold uppercase tracking-wide
          px-3 py-1 rounded 
          border border-green-500
          bg-black text-green-400
          hover:bg-green-950
          max-w-full truncate whitespace-nowrap overflow-hidden
        `}
                title={label} // native tooltip for truncated text
            >
                {label}
            </div>

            {/* Tooltip */}
            {(tooltipTitle || tooltipDescription) && (
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[450px] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 bg-white border border-slate-300 shadow-lg rounded-lg p-3 text-xs text-slate-700 z-50">
                    {tooltipTitle && <div className="font-semibold mb-1">{tooltipTitle}</div>}
                    {tooltipDescription && <p className="leading-relaxed">{tooltipDescription}</p>}
                </div>
            )}
        </div>
    )
}