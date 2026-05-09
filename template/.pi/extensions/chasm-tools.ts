/**
 * Chasm Tools — replaces read, write, and edit with compact renderers.
 *
 * The model still gets full content, diffs, and success confirmations.
 * The player sees only a single line per tool call. Result content is hidden.
 *
 * Player can expand with Ctrl+O or click the tool row (the expansion will show
 * the compact call line again, since the result area is intentionally empty).
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import * as fs from "node:fs/promises";
import * as nodePath from "node:path";
import { constants } from "node:fs";

const str = (x: unknown): string | null => {
    if (typeof x === "string") return x;
    return null;
};

const resolvePath = (p: string): string => {
    if (nodePath.isAbsolute(p)) return p;
    return nodePath.resolve(process.cwd(), p);
};

const shortenPath = (p: string): string => {
    const resolved = resolvePath(p);
    const cwd = process.cwd();
    if (resolved.startsWith(cwd + nodePath.sep)) {
        return resolved.slice(cwd.length + 1);
    }
    return p;
};

const renderLine = (args: any, _result: any, theme: any, context: any, verb: string) => {
    const rawPath = str(args?.path);
    const displayPath = rawPath ? shortenPath(rawPath) : "unknown";
    const text = `${theme.fg("toolTitle", theme.bold(verb))} ${theme.fg("muted", displayPath)}`;
    const component = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
    component.setText(text);
    return component;
};

const renderResultStub = (_result: any, _options: any, _theme: any, context: any) => {
    // Result area is intentionally empty — the model got the data silently
    const component = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
    component.setText("");
    return component;
};

export default function (pi: ExtensionAPI) {
    // --- Replace built-in read ---
    pi.registerTool({
        name: "read",
        label: "read",
        description: "Read the contents of a file. Supports offset/limit for large files. When you need the full file, continue with offset until complete.",
        parameters: Type.Object({
            path: Type.String({ description: "Path to the file to read (relative or absolute)" }),
            offset: Type.Optional(Type.Number({ description: "Line number to start reading from (1-indexed)" })),
            limit: Type.Optional(Type.Number({ description: "Maximum number of lines to read" })),
        }),
        async execute(_toolCallId, params, _signal) {
            const rawPath = str(params.path);
            if (!rawPath) throw new Error("Missing path parameter");
            const absolutePath = resolvePath(rawPath);

            try {
                await fs.access(absolutePath, constants.R_OK);
            } catch {
                throw new Error(`File not found or not readable: ${params.path}`);
            }

            const buffer = await fs.readFile(absolutePath);
            const text = buffer.toString("utf-8");
            const allLines = text.split("\n");

            const startLine = params.offset ? Math.max(0, params.offset - 1) : 0;
            if (startLine >= allLines.length) {
                throw new Error(`Offset ${params.offset} is beyond end of file (${allLines.length} lines total)`);
            }

            const endLine = params.limit !== undefined
                ? Math.min(startLine + params.limit, allLines.length)
                : allLines.length;
            const selectedLines = allLines.slice(startLine, endLine);
            let finalText = selectedLines.join("\n");
            if (endLine + (startLine === 0 ? 1 : 0)  /*hack to simplify continuation detection*/) {
                if (allLines.length > endLine) {
                     const remaining = allLines.length - endLine;
                     finalText += `\n\n[${remaining} more lines. Use offset=${endLine + 1} to continue.]`;
                }
            }

            return {
                content: [{ type: "text" as const, text: finalText }],
                details: {},
            };
        },
        renderCall(args: any, theme: any, context: any) {
            return renderLine(args, null, theme, context, "read");
        },
        renderResult(_result: any, _options: any, theme: any, context: any) {
            return renderResultStub(_result, _options, theme, context);
        },
    });

    // --- Replace built-in write ---
    pi.registerTool({
        name: "write",
        label: "write",
        description: "Write content to a file. Creates the file if it does not exist, overwrites if it does. Use this to create new files or overwrite existing ones.",
        parameters: Type.Object({
            path: Type.String({ description: "Path to the file" }),
            content: Type.String({ description: "File content" }),
            append: Type.Optional(Type.Boolean({ description: "Append to existing file instead of overwriting" })),
        }),
        async execute(_toolCallId, params, _signal) {
            const rawPath = str(params.path);
            if (!rawPath) throw new Error("Missing path parameter");
            const absolutePath = resolvePath(rawPath);

            const parentDir = nodePath.dirname(absolutePath);
            await fs.mkdir(parentDir, { recursive: true });

            if (params.append) {
                await fs.appendFile(absolutePath, params.content, "utf-8");
            } else {
                await fs.writeFile(absolutePath, params.content, "utf-8");
            }

            return {
                content: [{ type: "text" as const, text: `Wrote ${rawPath} (${params.content.length} chars).` }],
                details: {},
            };
        },
        renderCall(args: any, theme: any, context: any) {
            return renderLine(args, null, theme, context, "write");
        },
        renderResult(_result: any, _options: any, theme: any, context: any) {
            return renderResultStub(_result, _options, theme, context);
        },
    });

    // --- Replace built-in edit ---
    pi.registerTool({
        name: "edit",
        label: "edit",
        description:
            "Make targeted edits to a file. Uses targeted replacement to avoid full rewrites. " +
            "Provide an edits array with oldText/newText pairs. oldText must be unique in the file. " +
            "Do not include overlapping or nested edits. If two changes touch the same block, merge them into one edit.",
        parameters: Type.Object({
            path: Type.String({ description: "Path to the file to edit (relative or absolute)" }),
            edits: Type.Array(
                Type.Object({
                    oldText: Type.String({ description: "Exact text for one targeted replacement. Must be unique in the original file and must not overlap with any other edits[].oldText in the same call." }),
                    newText: Type.String({ description: "Replacement text for this targeted edit." }),
                }, { additionalProperties: false }),
                { description: "One or more targeted replacements. Each edit is matched against the original file, not incrementally." },
            ),
        }, { additionalProperties: false }),
        async execute(_toolCallId, params, _signal) {
            const rawPath = str(params.path);
            if (!rawPath) throw new Error("Missing path parameter");
            const absolutePath = resolvePath(rawPath);

            try {
                await fs.access(absolutePath, constants.R_OK | constants.W_OK);
            } catch {
                throw new Error(`File not found or not writable: ${params.path}`);
            }

            let content = await fs.readFile(absolutePath, "utf-8");
            const edits = params.edits;

            for (const edit of edits) {
                if (!content.includes(edit.oldText)) {
                    throw new Error(`oldText not found in file: "${edit.oldText.slice(0, 80)}${edit.oldText.length > 80 ? "..." : ""}"`);
                }
                content = content.replace(edit.oldText, edit.newText);
            }

            await fs.writeFile(absolutePath, content, "utf-8");

            return {
                content: [{ type: "text" as const, text: `Applied ${edits.length} edit(s) to ${rawPath}.` }],
                details: {},
            };
        },
        renderCall(args: any, theme: any, context: any) {
            return renderLine(args, null, theme, context, "edit");
        },
        renderResult(_result: any, _options: any, theme: any, context: any) {
            return renderResultStub(_result, _options, theme, context);
        },
    });
}
