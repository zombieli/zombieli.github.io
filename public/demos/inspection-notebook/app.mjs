import { ASSETS, CHECKS, CHECK_LABELS, CONDITIONS, BACKUP_MAX_BYTES, createDraft, updateDraft, submitRecord, parseBackup, makeBackup } from './core.mjs';
import { openStorage, listRecords, importRecords, saveRecord } from './storage.mjs';
const $ = id => document.getElementById(id);
let records = [];
let selected = null;
let filter = 'all';
let ready = false;
let busy = false;
let dirty = false;
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function message(text, error = false) {
  $('notice').hidden = true; $('error').hidden = true;
  if (text) { const target = $(error ? 'error' : 'notice'); target.textContent=text; target.hidden=false; }
}
function controls() {
  for (const id of ['new','samples','export','import-file']) $(id).disabled = !ready || busy;
  for (const button of document.querySelectorAll('.record-card button,.editor-actions button')) button.disabled = !ready || busy;
  const form=$('inspection-form');
  if(form) {
    const locked=!ready || busy || selected?.status==='submitted';
    for(const field of form.querySelectorAll('input,select,textarea'))field.disabled=locked;
    form.setAttribute('aria-busy',String(busy));
  }
  if($('close-editor'))$('close-editor').disabled=!ready || busy;
}
async function action(callback) {
  if (busy) return;
  busy=true;controls();message('');
  try { await callback(); }
  catch(error) { message(error.message || 'This action could not be completed. Retry after checking device storage.',true); }
  finally { busy=false;controls(); }
}
const date = value => new Intl.DateTimeFormat('en-AU',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
function renderRecords() {
  $('total').textContent = records.length;
  $('draft-count').textContent = records.filter(r=>r.status==='draft').length;
  $('submitted-count').textContent = records.filter(r=>r.status==='submitted').length;
  $('record-list').replaceChildren();
  const filtered = records.filter(r=>filter==='all'||r.status===filter);
  if (!filtered.length) {
    const empty=element('div','empty');
    empty.append(element('strong','',records.length ? 'No matching inspections' : 'No inspections yet'),element('span','',records.length ? 'Choose another status to see your records.' : 'Start a draft, or load fictional examples to explore.'));
    $('record-list').append(empty);
  }
  for (const record of filtered) {
    const asset=ASSETS.find(a=>a.id===record.assetId);
    const card=element('article',`record-card${selected?.id===record.id?' selected':''}`);
    const top=element('div','record-top');top.append(element('span','asset-code',record.assetId||'ASSET NOT SELECTED'),element('span',`badge ${record.status}`,record.status==='draft'?'Draft':'Submitted'));
    const bottom=element('div','record-bottom');
    const meta=element('div','record-meta');meta.append(element('div','',record.condition?CONDITIONS[record.condition]:'Condition not recorded'),element('div','',`Updated ${date(record.updatedAt)}`));
    const button=element('button','',record.status==='draft'?'Edit draft':'View inspection');button.type='button';
    button.setAttribute('aria-label',`${button.textContent}: ${asset?.name||'New inspection'}`);
    button.addEventListener('click',()=>{if (!confirmClose()) return;selected=record;renderEditor();renderRecords();$('asset').focus();});
    bottom.append(meta,button);card.append(top,element('h3','',asset?.name||'New inspection'),element('p','record-location',asset?.location||'Select an asset to continue'),bottom);
    $('record-list').append(card);
  }
  controls();
}
function confirmClose() {
  return !dirty || window.confirm('Discard unsaved edits? Your last saved draft will be kept.');
}
function renderEditor() {
  $('editor').hidden=!selected;$('guide').hidden=Boolean(selected);dirty=false;
  if (!selected) { $('editor').replaceChildren();return; }
  const submitted=selected.status==='submitted';
  $('editor').innerHTML=`<div class="editor-heading"><div><p class="eyebrow">${submitted?'FIXED RECORD':'IN PROGRESS'}</p><h2 id="editor-title">${submitted?'Submitted inspection':'Inspection draft'}</h2></div><button type="button" id="close-editor" class="close" aria-label="Close inspection">×</button></div>
    <p class="editor-note">${submitted?'This completed record is read-only. Export a backup to retain a copy.':'Edits are saved when you choose Save draft. Submission makes the completed record read-only.'}</p>
    <form id="inspection-form"><label for="asset">Fictional equipment asset</label><select id="asset" ${submitted?'disabled':''}><option value="">Select a training asset</option>${ASSETS.map(a=>`<option value="${a.id}">${a.id} · ${a.name}</option>`).join('')}</select>
    <fieldset ${submitted?'disabled':''}><legend>Equipment condition</legend><div class="condition-options">${Object.entries(CONDITIONS).map(([value,label])=>`<label class="choice" for="condition-${value}"><input id="condition-${value}" type="radio" name="condition" value="${value}">${label}</label>`).join('')}</div></fieldset>
    <fieldset ${submitted?'disabled':''}><legend>Completion checklist · all required</legend>${CHECKS.map(key=>`<label class="check" for="check-${key}"><input id="check-${key}" type="checkbox">${CHECK_LABELS[key]}</label>`).join('')}</fieldset>
    <label for="notes">Inspection notes</label><textarea id="notes" maxlength="2000" aria-describedby="notes-hint" ${submitted?'disabled':''}></textarea><p id="notes-hint" class="notes-hint">Optional · maximum 2,000 characters. Training observations only.</p>
    ${submitted?'': '<div class="editor-actions"><button id="save" type="button" class="secondary">Save draft</button><button type="submit" class="primary">Submit inspection</button></div>'}</form>
    <p class="record-stamp" id="record-stamp"></p>`;
  $('asset').value=selected.assetId;$('notes').value=selected.notes;
  if (selected.condition) $(`condition-${selected.condition}`).checked=true;
  for (const key of CHECKS) $(`check-${key}`).checked=selected.checks[key];
  $('record-stamp').textContent = `Record ${selected.id} · Created ${date(selected.createdAt)}${submitted ? ` · Submitted ${date(selected.submittedAt)}` : ''}`;
  $('inspection-form').addEventListener('input',()=>{dirty=true;});
  $('inspection-form').addEventListener('submit',event=>{event.preventDefault();if (!submitted)action(()=>persist(true));});
  if (!submitted) $('save').addEventListener('click',()=>action(()=>persist(false)));
  $('close-editor').addEventListener('click',()=>{if(!confirmClose())return;selected=null;renderEditor();renderRecords();$('new').focus();});
  controls();
}
function editorValue() {
  return {assetId:$('asset').value,condition:document.querySelector('input[name="condition"]:checked')?.value||'',checks:Object.fromEntries(CHECKS.map(key=>[key,$(`check-${key}`).checked])),notes:$('notes').value};
}
async function persist(submit) {
  const now=new Date().toISOString();
  let next=updateDraft(selected,editorValue(),now);
  if (submit) next=submitRecord(next,now);
  await saveRecord(next,selected.updatedAt);
  dirty=false;selected=next;await refresh();renderEditor();
  message(submit?'Inspection submitted. This record is now read-only.':'Draft saved on this device.');
}
async function refresh() {records=await listRecords();renderRecords();}
async function initialise() {
  await action(async()=>{
    try {await openStorage();await refresh();ready=true;$('retry').hidden=true;}
    catch(error) {ready=false;$('retry').hidden=false;$('record-list').replaceChildren(element('p','empty','Device storage unavailable. Enable browser storage and retry.'));throw error;}
  });
}
$('new').addEventListener('click',()=>action(async()=>{
  if(!confirmClose())return;
  const record=createDraft(crypto.randomUUID(),new Date().toISOString());await importRecords([record]);selected=record;await refresh();renderEditor();
  message('New draft created on this device.');
}).then(()=>{if(selected?.status==='draft')$('asset')?.focus();}));
for (const button of document.querySelectorAll('[data-filter]')) button.addEventListener('click',()=>{
  filter=button.dataset.filter;for (const other of document.querySelectorAll('[data-filter]')) other.setAttribute('aria-pressed',String(other===button));renderRecords();
});
$('samples').addEventListener('click',()=>action(async()=>{
  const now=new Date().toISOString();
  const draft=updateDraft(createDraft(crypto.randomUUID(),now),{assetId:'TRN-204',condition:'watch',checks:{isolation:true,housing:false,indicators:false},notes:'Fictional example: review the training unit housing label before completion.'},now);
  const record=submitRecord(updateDraft(createDraft(crypto.randomUUID(),now),{assetId:'TRN-305',condition:'acceptable',checks:{isolation:true,housing:true,indicators:true},notes:'Fictional example: all training checklist items completed. No real equipment inspected.'},now),now);
  await importRecords([draft,record]);await refresh();message('Added 2 fictional examples. Existing records were kept.');
}));
$('export').addEventListener('click',()=>action(async()=>{
  const value=makeBackup(await listRecords(),new Date().toISOString());
  const blob=new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob);const link=element('a');link.href=url;link.download=`inspection-notebook-${value.exportedAt.slice(0,10)}.json`;
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);message(`Exported ${value.records.length} record${value.records.length===1?'':'s'} to a JSON backup.`);
}));
$('import-file').addEventListener('change',()=>action(async()=>{
  const file=$('import-file').files[0];if(!file)return;
  try {
    if (file.size>BACKUP_MAX_BYTES)throw new Error('Backup exceeds the 16 MB limit.');
    const imported=parseBackup(await file.text());await importRecords(imported);await refresh();message(`Imported ${imported.length} record${imported.length===1?'':'s'}. Existing records were kept.`);
  } finally {$('import-file').value='';}
}));
$('retry').addEventListener('click',initialise);
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
function network() {$('network').textContent=navigator.onLine?'Online · saved on this device':'Offline · saved on this device';}
window.addEventListener('online',network);window.addEventListener('offline',network);network();
async function enableOffline() {
  if (!('serviceWorker' in navigator)) {$('offline-ready').textContent='Offline caching unavailable in this browser.';return;}
  try {
    await navigator.serviceWorker.register('./sw.js',{scope:'./'});await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
    $('offline-ready').textContent='Ready for offline reload';
  } catch {$('offline-ready').textContent='Offline caching unavailable. Reconnect and reload to retry.';}
}
initialise();enableOffline();
