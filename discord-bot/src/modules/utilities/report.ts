// Re-exports the /report command from suggestions.ts so the command handler
// can register it as a standalone slash command.
export { reportData as data, reportExecute as execute } from "./suggestions.js";
