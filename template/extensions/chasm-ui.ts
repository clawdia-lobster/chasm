/**
 * Chasm UI — collapses tool output and shows what the narrator is doing.
 *
 * For debugging, every read/edit/write shows a brief notification
 * with the filename before the tool runs. Use Ctrl+O to expand
 * any individual tool and see its full output.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
    pi.on("session_start", async (_event, ctx) => {
        ctx.ui.setToolsExpanded(false);
    });

    pi.on("tool_call", async (event, ctx) => {
        if (event.toolName === "read" || event.toolName === "edit" || event.toolName === "write") {
            const path = (event.input as { path?: string })?.path;
            if (path) {
                ctx.ui.notify(`${event.toolName}: ${path}`, "info");
            }
        }
    });
}
