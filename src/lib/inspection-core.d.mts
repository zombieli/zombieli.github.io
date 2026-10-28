/** Types for the unmodified, source-copied inspection notebook core.mjs. */
export type InspectionChecks = { isolation: boolean; housing: boolean; indicators: boolean }
export type InspectionCondition = '' | 'acceptable' | 'watch' | 'unsafe'
export type InspectionRecord = {
  id: string; status: 'draft' | 'submitted'; assetId: string; condition: InspectionCondition;
  checks: InspectionChecks; notes: string; createdAt: string; updatedAt: string; submittedAt: string | null;
}
export type InspectionPatch = Partial<Pick<InspectionRecord, 'assetId' | 'condition' | 'checks' | 'notes'>>
export const ASSETS: readonly { id: string; name: string; location: string }[]
export const CHECKS: readonly (keyof InspectionChecks)[]
export const CHECK_LABELS: Readonly<Record<keyof InspectionChecks, string>>
export const CONDITIONS: Readonly<Record<Exclude<InspectionCondition, ''>, string>>
export const BACKUP_MAX_BYTES: number
export function validateRecord(value: unknown): InspectionRecord
export function createDraft(id: string, now: string): InspectionRecord
export function updateDraft(record: InspectionRecord, patch: InspectionPatch, now: string): InspectionRecord
export function submitRecord(record: InspectionRecord, now: string): InspectionRecord
export function parseBackup(json: string, existingIds?: Set<string>): InspectionRecord[]
export function makeBackup(records: InspectionRecord[], now: string): { schemaVersion: number; exportedAt: string; records: InspectionRecord[] }
