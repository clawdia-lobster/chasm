/**
 * Chasm Tools — compact rendering for built-in file tools.
 *
 * Replaces the built-in read, write, and edit tools with versions that delegate
 * execution to the originals (via createReadTool/createWriteTool/createEditTool)
 * but render compact single-line output instead of full file contents.
 *
 * The model still gets full content, diffs, and success confirmations.
 * The player sees only a brief summary per tool call. Expand with Ctrl+O.
 *
 * Based on the built-in-tool-renderer.ts example from pi.
 */

import type { EditToolDetails, ExtensionAPI, ReadToolDetails } from "@earendil-works/pi-coding-agent";
import { createEditTool, createReadTool, createWriteTool } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

export default function (pi: ExtensionAPI) {
    const cwd = process.cwd();

    // --- Read tool: path + line count ---
    const originalRead = createReadTool(cwd);
    pi.registerTool({
        name: "read",
        label: "read",
        description: originalRead.description,
        parameters: originalRead.parameters,

        async execute(toolCallId, params, signal, onUpdate) {
            return originalRead.execute(toolCallId, params, signal, onUpdate);
        },

        renderCall(args, theme) {
            let text = theme.fg("toolTitle", theme.bold("read "));
            text += theme.fg("muted", args.path);
            if (args.offset || args.limit) {
                const parts: string[] = [];
                if (args.offset) parts.push(`offset=${args.offset}`);
                if (args.limit) parts.push(`limit=${args.limit}`);
                text += theme.fg("dim", ` (${parts.join(", ")})`);
            }
            return new Text(text, 0, 0);
        },

        renderResult(result, { expanded, isPartial }, theme) {
            if (isPartial) return new Text(theme.fg("dim", "reading…"), 0, 0);

            const details = result.details as ReadToolDetails | undefined;
            const content = result.content[0];

            if (content?.type === "image") {
                return new Text(theme.fg("dim", "image loaded"), 0, 0);
            }

            if (content?.type !== "text") {
                return new Text("", 0, 0);
            }

            const lineCount = content.text.split("\n").length;
            let text = theme.fg("dim", `${lineCount} lines`);

            if (details?.truncation?.truncated) {
                text += theme.fg("dim", ` of ${details.truncation.totalLines}`);
            }

            if (expanded) {
                const lines = content.text.split("\n").slice(0, 20);
                for (const line of lines) {
                    text += `\n${theme.fg("dim", line)}`;
                }
                if (lineCount > 20) {
                    text += `\n${theme.fg("dim", `… ${lineCount - 20} more`)}`;
                }
            }

            return new Text(text, 0, 0);
        },
    });

    // --- Write tool: path + line count ---
    const originalWrite = createWriteTool(cwd);
    pi.registerTool({
        name: "write",
        label: "write",
        description: originalWrite.description,
        parameters: originalWrite.parameters,

        async execute(toolCallId, params, signal, onUpdate) {
            return originalWrite.execute(toolCallId, params, signal, onUpdate);
        },

        renderCall(args, theme) {
            let text = theme.fg("toolTitle", theme.bold("write "));
            text += theme.fg("muted", args.path);
            const lineCount = args.content.split("\n").length;
            text += theme.fg("dim", ` (${lineCount} lines)`);
            return new Text(text, 0, 0);
        },

        renderResult(result, { isPartial }, theme) {
            if (isPartial) return new Text(theme.fg("dim", "writing…"), 0, 0);

            const content = result.content[0];
            if (content?.type === "text" && content.text.startsWith("Error")) {
                return new Text(theme.fg("error", content.text.split("\n")[0]), 0, 0);
            }

            return new Text(theme.fg("dim", "written"), 0, 0);
        },
    });

    // --- Edit tool: path + diff stats ---
    const originalEdit = createEditTool(cwd);
    pi.registerTool({
        name: "edit",
        label: "edit",
        description: originalEdit.description,
        parameters: originalEdit.parameters,
        renderShell: "self",

        async execute(toolCallId, params, signal, onUpdate) {
            return originalEdit.execute(toolCallId, params, signal, onUpdate);
        },

        renderCall(args, theme) {
            let text = theme.fg("toolTitle", theme.bold("edit "));
            text += theme.fg("muted", args.path);
            return new Text(text, 0, 0);
        },

        renderResult(result, { expanded, isPartial }, theme) {
            if (isPartial) return new Text(theme.fg("dim", "editing…"), 0, 0);

            const details = result.details as EditToolDetails | undefined;
            const content = result.content[0];

            if (content?.type === "text" && content.text.startsWith("Error")) {
                return new Text(theme.fg("error", content.text.split("\n")[0]), 0, 0);
            }

            if (!details?.diff) {
                return new Text(theme.fg("dim", "applied"), 0, 0);
            }

            // Count additions and removals from the diff
            const diffLines = details.diff.split("\n");
            let additions = 0;
            let removals = 0;
            for (const line of diffLines) {
                if (line.startsWith("+") && !line.startsWith("+++")) additions++;
                if (line.startsWith("-") && !line.startsWith("---")) removals++;
            }

            let text = theme.fg("dim", `+${additions}/-${removals}`);

            if (expanded) {
                for (const line of diffLines.slice(0, 30)) {
                    if (line.startsWith("+") && !line.startsWith("+++")) {
                        text += `\n${theme.fg("success", line)}`;
                    } else if (line.startsWith("-") && !line.startsWith("---")) {
                        text += `\n${theme.fg("error", line)}`;
                    } else {
                        text += `\n${theme.fg("dim", line)}`;
                    }
                }
                if (diffLines.length > 30) {
                    text += `\n${theme.fg("dim", `… ${diffLines.length - 30} more`)}`;
                }
            }

            return new Text(text, 0, 0);
        },
    });
}
