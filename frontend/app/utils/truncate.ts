export function truncate(text: string | undefined, max = 650) {
    if (!text) return ""
    return text.length > max ? text.slice(0, max) + "......." : text
}
