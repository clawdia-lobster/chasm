/**
 * Chasm Footer — shows world name, player location, and game state.
 *
 * Line 1: 🎲 World Name • location
 * Line 2: day N · time · weather · inventory count · context% · model
 *
 * Reads WORLD.md and WORLD_STATE.md from PI_MEMORY_DIR on each render.
 * Falls back to "Chasm" / "unknown" if files are missing or uninitialised.
 */

import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import * as fs from "node:fs";
import * as nodePath from "node:path";

interface WorldState {
    worldName: string;
    location: string;
    day: string;
    timeOfDay: string;
    weather: string;
    inventoryCount: number;
}

function readWorldState(): WorldState {
    const memDir = process.env.PI_MEMORY_DIR ?? "";
    const defaults: WorldState = {
        worldName: "Chasm",
        location: "unknown",
        day: "1",
        timeOfDay: "",
        weather: "",
        inventoryCount: 0,
    };

    if (!memDir) return defaults;

    try {
        // Read world name from WORLD.md
        const worldPath = nodePath.join(memDir, "WORLD.md");
        if (fs.existsSync(worldPath)) {
            const text = fs.readFileSync(worldPath, "utf-8");
            const firstLine = text.split("\n")[0] ?? "";
            const title = firstLine.replace(/^#+\s*/, "").trim();
            if (title && !title.includes("Your World") && !title.includes("TODO")) {
                defaults.worldName = title;
            }
        }

        // Read state from WORLD_STATE.md
        const statePath = nodePath.join(memDir, "WORLD_STATE.md");
        if (fs.existsSync(statePath)) {
            const text = fs.readFileSync(statePath, "utf-8");
            const get = (key: string): string => {
                const match = text.match(new RegExp(`^-\\s+${key}:\\s*(.+)`, "m"));
                return match ? match[1].trim().replace(/`/g, "") : "";
            };
            const getRaw = (key: string): string => {
                const match = text.match(new RegExp(`^-\\s+${key}:\\s*(.+)`, "m"));
                return match ? match[1].trim() : "";
            };

            const location = get("current_place") || get("starting_place") || get("location");
            if (location) defaults.location = location.replace(/\[\[|\]\]/g, "");

            const day = get("day");
            if (day) defaults.day = day;

            const timeOfDay = get("time_of_day");
            if (timeOfDay) defaults.timeOfDay = timeOfDay;

            const weather = get("condition");
            if (weather) defaults.weather = weather;

            // Count inventory items
            const invMatch = text.match(/inventory:\s*\n((?:\s+-\s+.+\n?)*)/);
            if (invMatch) {
                defaults.inventoryCount = (invMatch[1].match(/^\s+-\s+/gm) || []).length;
            }
        }
    } catch {
        // File read errors — use defaults
    }

    return defaults;
}

export default function (pi: ExtensionAPI) {
    pi.on("session_start", async (_event, ctx) => {
        ctx.ui.setToolsExpanded(false);
        ctx.ui.setFooter((tui, theme, footerData) => {
            const unsub = footerData.onBranchChange(() => tui.requestRender());

            return {
                dispose: unsub,
                invalidate() {},
                render(width: number): string[] {
                    const state = readWorldState();
                    const model = ctx.model?.id || "no-model";

                    // Token counts from session
                    let input = 0, output = 0, cost = 0;
                    for (const e of ctx.sessionManager.getBranch()) {
                        if (e.type === "message" && e.message.role === "assistant") {
                            const m = e.message as AssistantMessage;
                            input += m.usage.input;
                            output += m.usage.output;
                            cost += m.usage.cost.total;
                        }
                    }
                    const fmt = (n: number) =>
                        n < 1000 ? `${n}` : n < 1000000 ? `${(n / 1000).toFixed(1)}k` : `${(n / 1000000).toFixed(1)}M`;

                    // Context usage
                    const contextUsage = ctx.getContextUsage();
                    const contextWindow = contextUsage?.contextWindow ?? 0;
                    const contextPercent = contextUsage?.percent;
                    const contextFmt = contextPercent !== null && contextPercent !== undefined
                        ? `${contextPercent.toFixed(1)}%/${fmt(contextWindow)}`
                        : `?/${fmt(contextWindow)}`;

                    let contextStr: string;
                    if (contextPercent === null || contextPercent === undefined) {
                        contextStr = contextFmt;
                    } else if (contextPercent > 90) {
                        contextStr = theme.fg("error", contextFmt);
                    } else if (contextPercent > 70) {
                        contextStr = theme.fg("warning", contextFmt);
                    } else {
                        contextStr = contextFmt;
                    }

                    // Line 1: 🎲 World Name • location
                    const dice = "🎲";
                    const worldDisplay = theme.fg("accent", `${dice} ${state.worldName}`);
                    const locDisplay = state.location !== "unknown"
                        ? theme.fg("dim", ` • ${state.location}`)
                        : "";
                    const line1 = truncateToWidth(worldDisplay + locDisplay, width);

                    // Line 2: day · time · weather · inv · context · model
                    const parts: string[] = [];
                    parts.push(`day ${state.day}`);
                    if (state.timeOfDay) parts.push(state.timeOfDay);
                    if (state.weather) parts.push(state.weather);
                    if (state.inventoryCount > 0) parts.push(`⚔${state.inventoryCount}`);

                    // Token stats
                    if (input || output) {
                        const tokenParts: string[] = [];
                        if (input) tokenParts.push(`↑${fmt(input)}`);
                        if (output) tokenParts.push(`↓${fmt(output)}`);
                        if (cost) tokenParts.push(`$${cost.toFixed(3)}`);
                        parts.push(tokenParts.join(" "));
                    }

                    const leftPlain = parts.join(" · ");
                    const leftStr = theme.fg("dim", leftPlain) + "  " + contextStr;

                    // Right side: model
                    let rightSide = model;
                    if (ctx.model?.reasoning) {
                        const level = pi.getThinkingLevel();
                        rightSide = level === "off" ? `${model} · no thinking` : `${model} · ${level}`;
                    }
                    const rightStr = theme.fg("dim", rightSide);

                    const padding = Math.max(2, width - visibleWidth(leftPlain) - visibleWidth(rightSide) - 3);
                    const line2 = truncateToWidth(leftStr + " ".repeat(padding) + rightStr, width);

                    return [line1, line2];
                },
            };
        });
    });
}
