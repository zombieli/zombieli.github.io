import { validateReport, compareReports, MAX_FILE_BYTES } from './core.mjs';
const $ = id => document.getElementById(id);
const state = {baseline:null,candidate:null,result:null,filter:'all',tokens:{baseline:0,candidate:0},errors:{baseline:'',candidate:''}};
const node = (tag,text,className) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; };
const empty = message => { const box=node('div',undefined,'empty'); box.append(node('div','Δ','empty-symbol'),node('h3',message),node('p','Select valid baseline and candidate JSON reports to continue.')); return box; };
function clearResult(message = 'Waiting for two reports') {
  state.result = null; $('result').replaceChildren(empty(message)); $('cases').replaceChildren(); $('filters').hidden=true; $('footnote').hidden=true; $('download').disabled=true;
}
function showErrors(policyError='') { const message = [state.errors.baseline,state.errors.candidate,policyError].filter(Boolean).join(' '); $('error').textContent=message; $('error').hidden=!message; }
function update() {
  showErrors();
  if (!state.baseline || !state.candidate) return;
  try {
    const ratioText=$('slowdown-ratio').value, msText=$('slowdown-ms').value;
    if (!ratioText || !msText) throw new Error('Enter both timing thresholds.');
    state.result=compareReports(state.baseline,state.candidate,{allowRemoved:$('allow-removed').checked,allowSkipped:$('allow-skipped').checked,slowdownRatio:Number(ratioText),slowdownMs:Number(msText)});
    render();
  } catch (e) { clearResult('Comparison needs valid inputs'); showErrors(e.message); }
}
function render() {
  const result=state.result, counts=result.counts;
  const banner=node('div',undefined,`verdict ${result.verdict}`), icon=node('span',result.verdict === 'pass' ? '✓' : '!','verdict-symbol'), content=node('div');
  const heading=node('h3',{pass:'Ready to proceed',fail:'Action required',incomplete:'Coverage incomplete'}[result.verdict]); heading.id='verdict';
  content.append(heading,node('p',result.reasons.join(' · ') || 'No candidate failures or unpermitted coverage gaps.'),node('p',`${result.baselineLabel || 'Baseline'} → ${result.candidateLabel || 'Candidate'} · ${counts.baseline} → ${counts.candidate} tests`,'report-labels'));
  banner.append(icon,content);
  const metrics=node('div',undefined,'metrics');
  for (const [number,label,style] of [[counts.candidateFailures,'Failures','danger'],[counts.recoveries,'Recoveries','good'],[counts.removed+counts.newSkipped,'Coverage gaps','warn'],[counts.slower,'Slower cases','warn']]) { const metric=node('div',undefined,`metric ${style}`); metric.append(node('strong',String(number)),node('span',label)); metrics.append(metric); }
  $('result').replaceChildren(banner,metrics); $('filters').hidden=false; $('footnote').hidden=false; $('download').disabled=false; renderRows();
}
function renderRows() {
  if (!state.result) return;
  const query=$('search').value.toLowerCase();
  const predicates={all:()=>true,failures:r=>r.candidate?.status==='failed',coverage:r=>r.kind==='removed'||r.newSkipped,recoveries:r=>r.kind==='recovery'||r.kind==='resumed',timing:r=>r.timing==='slower'||r.timing==='faster'};
  const rows=state.result.rows.filter(r=>predicates[state.filter](r)&&`${r.suite} ${r.name}`.toLowerCase().includes(query));
  const title=node('div',undefined,'list-heading'); title.append(node('span',`${rows.length} CASE${rows.length===1?'':'S'} SHOWN`),node('span','CHANGE / TIMING'));
  const fragment=document.createDocumentFragment(); fragment.append(title);
  for (const r of rows) {
    const row=node('div',undefined,'case-row'), left=node('div'), right=node('div',undefined,'case-right');
    left.append(node('div',r.suite,'case-suite'),node('div',r.name,'case-name'),node('div',`${r.baseline?.status ?? 'absent'} → ${r.candidate?.status ?? 'absent'}`,'case-status'));
    right.append(node('span',r.kind.replaceAll('-',' '),`badge ${r.kind}`));
    const duration=r.deltaMs === null ? '—' : `${r.deltaMs>0?'+':''}${Number(r.deltaMs.toFixed(2))} ms${r.timing==='slower'?' · slower':r.timing==='faster'?' · faster':''}`;
    right.append(node('span',duration,`duration ${r.timing}`)); row.append(left,right); fragment.append(row);
  }
  if (!rows.length) fragment.append(node('p','No cases match this view.','no-results'));
  $('cases').replaceChildren(fragment);
}
for (const slot of ['baseline','candidate']) $(slot+'-file').addEventListener('change',async event => {
  const token=++state.tokens[slot], file=event.target.files[0]; state[slot]=null; state.errors[slot]=''; clearResult('Reading report'); showErrors();
  if (!file) { $(slot+'-status').textContent='No report selected'; clearResult(); return; }
  $(slot+'-status').textContent=`Reading ${file.name}…`;
  try {
    if (file.size > MAX_FILE_BYTES) throw new Error('File exceeds the 5 MiB limit.');
    const raw=await file.text(); if (token !== state.tokens[slot]) return;
    let parsed; try { parsed=JSON.parse(raw); } catch { throw new Error('Malformed JSON.'); }
    const report=validateReport(parsed); state[slot]=report;
    $(slot+'-status').textContent=`${report.label || file.name} · ${report.cases.length} tests`; update();
  } catch(e) {
    if (token !== state.tokens[slot]) return;
    state[slot]=null; state.errors[slot]=`${slot === 'baseline'?'Baseline':'Candidate'}: ${e.message}`; $(slot+'-status').textContent='Report rejected'; clearResult('Report could not be compared'); showErrors();
  }
});
$('sample').addEventListener('click',async () => {
  const tokens={baseline:++state.tokens.baseline,candidate:++state.tokens.candidate}; state.baseline=null; state.candidate=null; state.errors={baseline:'',candidate:''}; clearResult('Loading sample reports'); showErrors();
  for (const slot of ['baseline','candidate']) { $(slot+'-file').value=''; $(slot+'-status').textContent='Loading sample…'; }
  await Promise.all(['baseline','candidate'].map(async slot => {
    try {
      const response=await fetch(`./samples/${slot}.json`);
      if (!response.ok) throw new Error('Sample report could not be loaded.');
      const report=validateReport(await response.json());
      if (tokens[slot]!==state.tokens[slot]) return;
      state[slot]=report; state.errors[slot]='';
      $(slot+'-status').textContent=`${report.label} · ${report.cases.length} tests`;
      update();
    } catch(e) {
      if (tokens[slot]!==state.tokens[slot]) return;
      state[slot]=null; state.errors[slot]=`${slot === 'baseline'?'Baseline':'Candidate'}: ${e.message}`;
      $(slot+'-status').textContent='Sample report rejected';
      clearResult('Sample report unavailable'); showErrors();
    }
  }));
});
for (const id of ['allow-removed','allow-skipped','slowdown-ratio','slowdown-ms']) $(id).addEventListener('input',() => { clearResult(); update(); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click',() => { state.filter=button.dataset.filter; document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button))); renderRows(); }));
$('search').addEventListener('input',renderRows);
$('download').addEventListener('click',() => { if (!state.result) return; const url=URL.createObjectURL(new Blob([JSON.stringify(state.result,null,2)+'\n'],{type:'application/json'})); const a=node('a'); a.href=url; a.download='test-report-delta.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); });
