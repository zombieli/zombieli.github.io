export type ManualUrlState = { query: string; manual: string; category: string }
export function readState(location: string): ManualUrlState
export function writeState(location: string, state: ManualUrlState): string
