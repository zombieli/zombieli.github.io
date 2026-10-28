export const ASSETS = Object.freeze([
  { id: 'TRN-101', name: 'Bench power module', location: 'Training bay A' },
  { id: 'TRN-204', name: 'Ventilation test unit', location: 'Training bay B' },
  { id: 'TRN-305', name: 'Sensor interface panel', location: 'Training bay C' }
]);
export const CHECKS = Object.freeze(['isolation', 'housing', 'indicators']);
export const CHECK_LABELS = Object.freeze({ isolation: 'Isolation point identified', housing: 'Housing and cable entries checked', indicators: 'Labels and indicators checked' });
export const CONDITIONS = Object.freeze({ acceptable: 'Acceptable', watch: 'Needs attention', unsafe: 'Out of service' });
const FIELDS = ['id','status','assetId','condition','checks','notes','createdAt','updatedAt','submittedAt'];
const MAX_RECORDS = 1000;
export const BACKUP_MAX_BYTES = 16_000_000;
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function exactFields(value, fields, label) {
  if (!object(value) || Object.keys(value).length !== fields.length || !fields.every(key => Object.hasOwn(value,key))) throw new Error(`${label}: unexpected or missing field.`);
}
function timestamp(value) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw new Error('Invalid timestamp: use a canonical ISO UTC timestamp.');
}
function requireCompletion(record) {
  if (!record.assetId) throw new Error('Select a fictional asset before submitting.');
  if (!record.condition) throw new Error('Select a condition before submitting.');
  if (!CHECKS.every(key => record.checks[key])) throw new Error('Complete every checklist item before submitting.');
}
export function validateRecord(record) {
  exactFields(record,FIELDS,'Record');
  if (typeof record.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(record.id)) throw new Error('Invalid record identity.');
  if (!['draft','submitted'].includes(record.status)) throw new Error('Invalid record status.');
  if (record.assetId !== '' && !ASSETS.some(asset => asset.id === record.assetId)) throw new Error('Unknown asset.');
  if (typeof record.condition !== 'string' || (record.condition !== '' && !Object.hasOwn(CONDITIONS,record.condition))) throw new Error('Unknown condition.');
  exactFields(record.checks,CHECKS,'Checklist');
  if (!CHECKS.every(key => typeof record.checks[key] === 'boolean')) throw new Error('Checklist values must be booleans.');
  if (typeof record.notes !== 'string' || record.notes.length > 2000) throw new Error('Notes must contain at most 2000 characters.');
  timestamp(record.createdAt); timestamp(record.updatedAt);
  if (record.updatedAt < record.createdAt) throw new Error('Updated timestamp precedes creation timestamp.');
  if (record.status === 'draft') {
    if (record.submittedAt !== null) throw new Error('A draft cannot have a submission timestamp.');
  } else {
    requireCompletion(record); timestamp(record.submittedAt);
    if (record.submittedAt !== record.updatedAt) throw new Error('Submission timestamp must equal the final update timestamp.');
  }
  return { ...record, checks: { ...record.checks } };
}
export function createDraft(id, now) {
  return validateRecord({id,status:'draft',assetId:'',condition:'',checks:Object.fromEntries(CHECKS.map(key=>[key,false])),notes:'',createdAt:now,updatedAt:now,submittedAt:null});
}
export function updateDraft(record, patch, now) {
  const valid = validateRecord(record);
  if (valid.status !== 'draft') throw new Error('Submitted records are read-only.');
  if (!object(patch) || Object.keys(patch).some(key => !['assetId','condition','checks','notes'].includes(key))) throw new Error('Cannot update protected record fields.');
  timestamp(now);
  const updatedAt = new Date(Math.max(Date.parse(now),Date.parse(valid.updatedAt)+1)).toISOString();
  return validateRecord({...valid,...patch,updatedAt});
}
export function submitRecord(record, now) {
  const valid = validateRecord(record);
  if (valid.status !== 'draft') throw new Error('Submitted records are read-only.');
  requireCompletion(valid);
  timestamp(now);
  const submittedAt = new Date(Math.max(Date.parse(now),Date.parse(valid.updatedAt))).toISOString();
  return validateRecord({...valid,status:'submitted',updatedAt:submittedAt,submittedAt});
}
function validateRecords(records, existingIds = new Set()) {
  if (!Array.isArray(records) || records.length > MAX_RECORDS) throw new Error('Backup must contain an array of at most 1000 records.');
  const seen = new Set();
  return records.map(record => {
    const valid = validateRecord(record);
    if (seen.has(valid.id)) throw new Error(`Duplicate identity in backup: ${valid.id}.`);
    if (existingIds.has(valid.id)) throw new Error(`Record ${valid.id} already exists. Nothing was imported.`);
    seen.add(valid.id); return valid;
  });
}
export function parseBackup(json, existingIds = new Set()) {
  if (typeof json !== 'string' || new TextEncoder().encode(json).length > BACKUP_MAX_BYTES) throw new Error('Backup exceeds the 16 MB limit.');
  let value;
  try { value = JSON.parse(json); } catch { throw new Error('Invalid JSON backup.'); }
  exactFields(value,['schemaVersion','exportedAt','records'],'Backup');
  if (value.schemaVersion !== 1) throw new Error('Unsupported backup schema version.');
  timestamp(value.exportedAt);
  return validateRecords(value.records,existingIds);
}
export function makeBackup(records, now) {
  timestamp(now);
  return {schemaVersion:1, exportedAt:now, records:validateRecords(records)};
}
