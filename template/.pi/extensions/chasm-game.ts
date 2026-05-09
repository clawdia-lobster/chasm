/**
 * Chasm Game Tools — save and sync commands for game state discipline.
 *
 * save: registered as both a tool (LLM calls it) and a /save command (user
 *       invokes it). The tool description reminds the model to persist state
 *       before saving, establishing the pattern from turn 1.
 *
 * sync: /sync command for the user. Sends a steer message telling the model
 *       to re-read key state files and persist any pending changes.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default function (pi: ExtensionAPI) {
    // --- save tool (LLM calls this) ---
    pi.registerTool({
        name: "save",
        label: "save",
        description:
            "Checkpoint game state with a git commit. " +
            "BEFORE saving, ensure all changes are persisted to disk: " +
            "update WORLD_STATE.md (player location, time, conditions), " +
            "create any new place/character/item files, " +
            "update existing entity files for changes, " +
            "create event files for significant occurrences. " +
            "If you haven't written state files this turn, do that first, then save.",
        parameters: {
            type: "object",
            properties: {
                message: {
                    type: "string",
                    description: 'Commit message, e.g. "[narrative] Player enters the abandoned lighthouse"',
                },
            },
            required: ["message"],
            additionalProperties: false,
        },
        async execute(_toolCallId, params, _signal) {
            const cwd = process.env.PI_MEMORY_DIR || process.cwd();
            try {
                await execFileAsync("git", ["-C", cwd, "add", "-A"], { timeout: 5000 });
                await execFileAsync("git", ["-C", cwd, "commit", "--quiet", "-m", params.message], { timeout: 5000 });
            } catch (err: any) {
                // git commit fails if nothing to commit — that's fine
                if (err?.stderr?.includes("nothing to commit")) {
                    return { content: [{ type: "text" as const, text: "Nothing to save — no changes since last commit." }], details: {} };
                }
                throw err;
            }
            return { content: [{ type: "text" as const, text: `Saved: ${params.message}` }], details: {} };
        },
        renderCall(args, theme) {
            return new Text(theme.fg("toolTitle", theme.bold("save ")) + theme.fg("dim", args.message.slice(0, 60)), 0, 0);
        },
        renderResult(result, _options, theme) {
            const text = result.content[0]?.type === "text" ? result.content[0].text : "saved";
            return new Text(theme.fg("dim", text), 0, 0);
        },
    });

    // --- /save command (user invokes) ---
    pi.registerCommand("save", {
        description: "Save game state (reminds narrator to persist changes first)",
        handler: async (_args, ctx) => {
            ctx.ui.notify("Saving — narrator should persist state first", "info");
            pi.sendUserMessage(
                "The player wants to save. Before committing, check that all state is current: " +
                "WORLD_STATE.md, current place, player character, any changed entities. " +
                "Write any pending changes, then call the save tool.",
                { deliverAs: "steer" },
            );
        },
    });

    // --- /sync command (user invokes to force state re-read) ---
    pi.registerCommand("sync", {
        description: "Force narrator to re-read and persist state (use when things feel stale)",
        handler: async (_args, ctx) => {
            ctx.ui.notify("Syncing state — narrator will re-read key files", "info");
            pi.sendUserMessage(
                "Sync state now: re-read WORLD_STATE.md, your current place file, and your " +
                "character file. If any of these are out of date, update them. If you've made " +
                "changes this turn that aren't persisted, write them now. Then save.",
                { deliverAs: "steer" },
            );
        },
    });
}
