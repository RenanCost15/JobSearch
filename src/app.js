const SEED = window.JOBSEARCH_SEED || [];
const META = window.JOBSEARCH_META || {};

const APP_KEY = 'JobSearch.data.v2';
const SNAP_KEY = 'JobSearch.snapshots.v2';
const SETTINGS_KEY = 'JobSearch.settings.v2';
const THEME_KEY = 'JobSearch.theme.v1';
const PHONE = '(83) 9 9900-8017';
const MAX_SNAPSHOTS = 40;

const statuses = [
  'Não iniciado','Pesquisar canal','Pronto para enviar','Enviado','Follow-up',
  'Respondeu','Entrevista','Banco de talentos','Sem retorno','Encerrado'
];

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

let items = loadItems();
let mode = 'all';
let editing = null;
let current = null;
let dirty = false;
let saveTimer = null;
let deferredInstall = null;

function esc(v=''){
  return String(v).replace(/[&<>"']/g,m=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
}
function today(){ return new Date().toISOString().slice(0,10); }
function plus(date,n){ const x = new Date(`${date}T12:00:00`); x.setDate(x.getDate()+n); return x.toISOString().slice(0,10); }
function toast(text){
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),1900);
}

function loadItems(){
  try{
    const raw = localStorage.getItem(APP_KEY);
    return raw ? JSON.parse(raw) : structuredClone(SEED);
  }catch{
    return structuredClone(SEED);
  }
}
function settings(){
  try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');}
  catch{return {};}
}
function setSettings(next){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings(), ...next }));
}
function byId(id){ return items.find(item => item.id === id); }

function profile(segment){
  if(segment==='Indústria e distribuição') return 'Tenho experiência em apoio administrativo e comercial, atendimento a gestores, vendedores e clientes, organização de estoque e processos, planilhas, relatórios e dashboards.';
  if(segment==='Varejo e shopping') return 'Tenho experiência com atendimento ao cliente, caixa, estoque, cadastro de mercadorias, apoio administrativo e comercial e organização de processos.';
  if(segment==='Saúde') return 'Tenho experiência com atendimento presencial e digital, organização de documentos e processos, planilhas, relatórios e suporte administrativo e técnico.';
  if(segment==='Educação') return 'Tenho vivência em apoio técnico-administrativo na UFRN, suporte de TI, atendimento, documentos, planilhas e relatórios, além de experiência como monitor acadêmico.';
  if(segment==='Telecom e tecnologia') return 'Sou estudante de Sistemas de Informação e possuo experiência com suporte técnico, atendimento a usuários, sistemas, planilhas e relatórios.';
  if(segment==='Financeiro e cooperativas') return 'Tenho experiência em atendimento, rotinas administrativas, planilhas, relatórios e indicadores, além de perfil analítico, organizado e comunicativo. Tenho interesse inclusive em estágio.';
  if(segment==='Remoto') return 'Tenho experiência em atendimento, apoio administrativo, suporte técnico, planilhas e ferramentas digitais. Possuo estrutura para trabalho remoto e disponibilidade de horário.';
  if(segment==='Setor público e institucional') return 'Tenho experiência em apoio técnico-administrativo na UFRN, atendimento, documentos, planilhas, relatórios e suporte de TI.';
  return 'Tenho experiência em apoio administrativo, atendimento, organização de processos, planilhas, relatórios, dashboards e suporte a equipes.';
}
function buildMessage(company){
  if(company.message) return company.message;
  const intro = company.modality.startsWith('Presencial')
    ? 'Estou estabelecendo residência em Patos-PB'
    : 'Resido em Patos-PB e tenho estrutura para trabalho totalmente remoto';
  return `Olá, equipe de ${company.sector} da ${company.company}! Meu nome é Renan Costa.\n\n${intro} e gostaria de colocar meu currículo à disposição para oportunidades em ${company.targetRoles}.\n\n${profile(company.segment)} Sou organizado, responsável, proativo e tenho disponibilidade para trabalhar em qualquer horário.\n\nAcredito que meu perfil pode contribuir com a equipe e fico à disposição para processos atuais ou futuros. Encaminho meu currículo para avaliação.\n\nAtenciosamente,\nRenan Costa\nTelefone/WhatsApp: ${PHONE}`;
}
function copy(text){
  navigator.clipboard?.writeText(text)
    .then(()=>toast('Copiado.'))
    .catch(()=>{
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast('Copiado.');
    });
}

function themeColor(theme){
  return theme === 'dark' ? '#020102' : '#f4f7fb';
}
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  const icon = $('#themeIcon');
  const label = $('#themeLabel');
  if(icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  if(label) label.textContent = theme === 'dark' ? 'Escuro' : 'Claro';
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content', themeColor(theme));
}
function toggleTheme(){
  const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function checksum(value){
  let h = 2166136261;
  const str = JSON.stringify(value);
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
function snapshots(){
  try{return JSON.parse(localStorage.getItem(SNAP_KEY)||'[]');}
  catch{return [];}
}
function createSnapshot(reason='automático', force=false){
  const list = snapshots();
  const hash = checksum(items);
  const last = list[0];
  if(!force && last && last.hash === hash) return;
  const now = new Date();
  if(!force && last && now - new Date(last.createdAt) < 120000) return;
  list.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: now.toISOString(),
    reason,
    hash,
    count: items.length,
    data: structuredClone(items)
  });
  localStorage.setItem(SNAP_KEY, JSON.stringify(list.slice(0,MAX_SNAPSHOTS)));
  updateBackupStatus('local');
}
function save(reason='alteração'){
  localStorage.setItem(APP_KEY, JSON.stringify(items));
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{
    createSnapshot(reason);
    autoFileBackup();
  }, 1200);
  render();
}

function filteredItems(){
  const q = $('#q').value.toLowerCase();
  const fm = $('#fm').value;
  const fs = $('#fs').value;
  const fp = $('#fp').value;
  const fst = $('#fst').value;
  const fc = $('#fc').value;

  return items
    .filter((company)=>{
      if(mode==='local' && !company.modality.startsWith('Presencial')) return false;
      if(mode==='remote' && !company.modality.startsWith('Remoto')) return false;
      if(mode==='due'){
        if(!company.followUpDate || company.followUpDate > today()) return false;
        if(['Entrevista','Encerrado'].includes(company.status)) return false;
      }
      if(q && ![
        company.company, company.segment, company.targetRoles, company.sector,
        company.contact, company.notes, company.confidence, company.city
      ].join(' ').toLowerCase().includes(q)) return false;
      if(fm && company.modality !== fm) return false;
      if(fs && company.segment !== fs) return false;
      if(fp && company.priority !== fp) return false;
      if(fst && company.status !== fst) return false;
      if(fc && company.confidence !== fc) return false;
      return true;
    })
    .sort((a,b)=> a.priority.localeCompare(b.priority) || b.compatibility - a.compatibility || a.company.localeCompare(b.company));
}

function stats(){
  const total = items.length;
  const local = items.filter(item => item.modality.startsWith('Presencial')).length;
  const remote = items.filter(item => item.modality.startsWith('Remoto')).length;
  const sent = items.filter(item => item.sent || ['Enviado','Follow-up','Respondeu','Entrevista'].includes(item.status)).length;
  const interviews = items.filter(item => item.status === 'Entrevista').length;
  const due = items.filter(item => item.followUpDate && item.followUpDate <= today() && !['Entrevista','Encerrado'].includes(item.status)).length;

  Object.entries({ total, local, remote, sent, interviews, due }).forEach(([key,value])=>{
    const el = document.querySelector(`[data-s="${key}"]`);
    if(el) el.textContent = value;
  });

  const pct = total ? Math.round((sent / total) * 100) : 0;
  $('#pct').textContent = `${pct}%`;
  $('#pctbar').style.width = `${pct}%`;
}

function render(){
  stats();
  const rows = filteredItems();
  $('#count').textContent = `${rows.length} alvo(s)`;

  $('#tbody').innerHTML = rows.map((company)=>{
    const followText = company.followUpDate ? `Follow-up: ${company.followUpDate}` : '—';
    return `
      <tr>
        <td><input class="check" type="checkbox" ${company.sent ? 'checked' : ''} onchange="sent('${company.id}', this.checked)"></td>
        <td>
          <div class="company">${esc(company.company)}</div>
          <div class="sub">${esc(company.city)} · ${esc(company.modality)}</div>
        </td>
        <td class="priority-cell">
          <span class="priority-badge ${esc(company.priority)}">${esc(company.priority)}</span>
          <div class="bar"><i style="width:${company.compatibility || 0}%"></i></div>
          <div class="sub">${company.compatibility || 0}% compatível</div>
        </td>
        <td>
          <div>${esc(company.segment)}</div>
          <div class="sub truncate" title="${esc(company.targetRoles)}">${esc(company.targetRoles)}</div>
        </td>
        <td>
          <div>${esc(company.sector)}</div>
          <div class="sub">${esc(company.channelType)}</div>
          <span class="confidence">${esc(company.confidence || 'A confirmar')}</span>
        </td>
        <td class="contact-cell">${esc(company.contact || '—')}</td>
        <td>
          <select class="status" onchange="statusChange('${company.id}', this.value)">
            ${statuses.map((status)=>`<option ${company.status===status ? 'selected' : ''}>${status}</option>`).join('')}
          </select>
          <div class="sub">${followText}</div>
        </td>
        <td class="actions-cell">
          <div class="row-actions">
            <button class="btn" onclick="details('${company.id}')" type="button">Ver</button>
            <button class="btn" onclick="copyPack('${company.id}')" type="button">Copiar</button>
            <button class="btn" onclick="editItem('${company.id}')" type="button">Editar</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  $('#cards').innerHTML = rows.map((company)=>`
    <article class="card">
      <div class="card-header">
        <div>
          <div class="company">${esc(company.company)}</div>
          <span class="sub">${esc(company.modality)} · ${company.compatibility || 0}% compatível</span>
        </div>
        <span class="priority-badge ${esc(company.priority)}">${esc(company.priority)}</span>
      </div>
      <p><strong>Setor:</strong> ${esc(company.sector)}</p>
      <p><strong>Cargos:</strong> ${esc(company.targetRoles)}</p>
      <span class="confidence">${esc(company.confidence || 'A confirmar')}</span>
      <select class="status" onchange="statusChange('${company.id}', this.value)">
        ${statuses.map((status)=>`<option ${company.status===status ? 'selected' : ''}>${status}</option>`).join('')}
      </select>
      <div class="row-actions">
        <button class="btn" onclick="details('${company.id}')" type="button">Abrir</button>
        <button class="btn" onclick="copyPack('${company.id}')" type="button">Copiar</button>
        <button class="btn" onclick="editItem('${company.id}')" type="button">Editar</button>
        <button class="btn" onclick="sent('${company.id}', true)" type="button">Enviado</button>
      </div>
    </article>
  `).join('');

  $('#empty').style.display = rows.length ? 'none' : 'block';
}

function sent(id, checked){
  const company = byId(id);
  if(!company) return;
  company.sent = checked;
  if(checked){
    company.sentDate = company.sentDate || today();
    company.lastContact = today();
    company.followUpDate = company.followUpDate || plus(today(), 7);
    if(['Não iniciado','Pesquisar canal','Pronto para enviar'].includes(company.status)) company.status = 'Enviado';
  }else{
    company.sentDate = '';
    if(company.status === 'Enviado') company.status = 'Não iniciado';
  }
  save('envio atualizado');
  toast(checked ? 'Envio registrado.' : 'Marcação removida.');
}
function statusChange(id, value){
  const company = byId(id);
  if(!company) return;
  company.status = value;
  if(['Enviado','Follow-up','Respondeu','Entrevista'].includes(value)){
    company.sent = true;
    company.sentDate = company.sentDate || today();
    company.lastContact = today();
    company.followUpDate = company.followUpDate || plus(today(), 7);
  }
  save('status atualizado');
}
function copyPack(id){
  const company = byId(id);
  if(!company) return;
  copy(`Assunto: ${company.subject}\n\n${buildMessage(company)}`);
}
function details(id){
  current = id;
  const company = byId(id);
  if(!company) return;
  $('#dt').textContent = company.company;
  $('#db').innerHTML = `
    <dl class="details">
      <dt>Modalidade</dt><dd>${esc(company.modality)}</dd>
      <dt>Prioridade</dt><dd>${esc(company.priority)} · ${company.compatibility || 0}%</dd>
      <dt>Confiabilidade</dt><dd>${esc(company.confidence || 'A confirmar')}</dd>
      <dt>Setor</dt><dd>${esc(company.sector)}</dd>
      <dt>Cargos</dt><dd>${esc(company.targetRoles)}</dd>
      <dt>Canal</dt><dd>${esc(company.channelType)}</dd>
      <dt>Contato</dt><dd>${esc(company.contact || '—')}</dd>
      <dt>Assunto</dt><dd>${esc(company.subject || '—')} <button class="btn" type="button" onclick="copy(byId('${id}').subject || '')">Copiar</button></dd>
      <dt>Mensagem</dt>
      <dd>
        <div class="message">${esc(buildMessage(company))}</div>
        <br>
        <button class="btn" type="button" onclick="copy(buildMessage(byId('${id}')))">Copiar mensagem</button>
        <button class="btn" type="button" onclick="copyPack('${id}')">Copiar pacote</button>
      </dd>
      <dt>Canal / fonte</dt>
      <dd>
        ${company.sourceUrl ? `<a href="${esc(company.sourceUrl)}" target="_blank" rel="noopener">Abrir canal ou fonte</a>` : 'Não informado'}
        <div class="sub">${esc(company.sourceName || '')}</div>
      </dd>
      <dt>Verificado em</dt><dd>${esc(company.verifiedAt || '—')}</dd>
      <dt>Datas</dt><dd>Enviado: ${company.sentDate || '—'} | Follow-up: ${company.followUpDate || '—'} | Último contato: ${company.lastContact || '—'}</dd>
      <dt>Observações</dt><dd>${esc(company.notes || '—')}</dd>
    </dl>
  `;
  $('#details').classList.add('open');
}
function closeM(id){ $('#'+id).classList.remove('open'); }
function view(nextMode, button){
  mode = nextMode;
  $$('.tab').forEach(tab => tab.classList.remove('active'));
  if(button) button.classList.add('active');
  render();
}
function clearFilters(){ ['q','fm','fs','fp','fst','fc'].forEach((id)=>$('#'+id).value=''); render(); }

function editItem(id=null){
  editing = id;
  const company = id
    ? byId(id)
    : {
        company:'', city:'Patos-PB', modality:'Presencial em Patos', segment:'Serviços e consultoria',
        priority:'B', compatibility:80, sector:'RH / Administrativo', targetRoles:'Assistente administrativo ou suporte',
        channelType:'Pesquisar canal', contact:'', sourceUrl:'', notes:'', verifiedAt:today(), status:'Não iniciado',
        sentDate:'', followUpDate:'', lastContact:'', subject:'', message:'', confidence:'Contato a confirmar',
        sourceName:'Cadastro manual'
      };

  const form = $('#form');
  for(const key in company){
    if(form.elements[key] && typeof company[key] !== 'object') form.elements[key].value = company[key] ?? '';
  }
  if(id && !company.message) form.elements.message.value = buildMessage(company);
  $('#ft').textContent = id ? 'Editar empresa' : 'Adicionar empresa';
  $('#editor').classList.add('open');
}
function removeCurrent(){
  if(!current) return;
  if(confirm('Excluir este registro?')){
    createSnapshot('antes de excluir', true);
    items = items.filter(item => item.id !== current);
    save('registro excluído');
    closeM('details');
    toast('Excluído.');
  }
}
function resetSeed(){
  if(confirm('Restaurar a base inicial do projeto? Exporte um backup antes.')){
    createSnapshot('antes de restaurar', true);
    items = structuredClone(SEED);
    save('base restaurada');
    toast('Base inicial restaurada.');
  }
}

function download(name, content, type){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
function exportPayload(){
  return { project:'JobSearch', version:META.version || '2.0.0', exportedAt:new Date().toISOString(), meta:META, items };
}
function exportJSON(){
  download(`JobSearch-backup-${today()}.json`, JSON.stringify(exportPayload(), null, 2), 'application/json');
}
function exportCSV(){
  const cols = ['company','city','modality','segment','priority','compatibility','sector','targetRoles','channelType','contact','confidence','subject','message','status','sentDate','followUpDate','lastContact','notes','sourceUrl'];
  const q = (v) => '"' + String(v ?? '').replace(/"/g,'""') + '"';
  const csv = '\ufeff' + [
    cols.join(';'),
    ...items.map((company)=>cols.map((key)=>q(key==='message' ? buildMessage(company) : company[key])).join(';'))
  ].join('\n');
  download(`JobSearch-${today()}.csv`, csv, 'text/csv;charset=utf-8');
}
function importData(raw){
  const parsed = JSON.parse(raw);
  const arr = Array.isArray(parsed) ? parsed : parsed.items;
  if(!Array.isArray(arr)) throw new Error('Formato inválido');
  createSnapshot('antes de importar', true);
  items = arr;
  save('backup importado');
  toast('Backup importado.');
}

$('#importer').addEventListener('change', (event)=>{
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{ importData(reader.result); }
    catch{ alert('Arquivo de backup inválido.'); }
  };
  reader.readAsText(file);
  event.target.value = '';
});

$('#form').addEventListener('submit', (event)=>{
  event.preventDefault();
  const company = Object.fromEntries(new FormData(event.target));
  company.compatibility = Number(company.compatibility) || 0;
  if(!company.subject) company.subject = `Currículo – Renan Costa – ${(company.targetRoles || '').split(',')[0] || 'Candidatura'}`;
  if(editing){
    const index = items.findIndex(item => item.id === editing);
    if(index >= 0) items[index] = { ...items[index], ...company };
  }else{
    items.push({ ...company, id:`EMP-${Date.now()}`, sent:false, tags:[] });
  }
  save('registro salvo');
  closeM('editor');
  toast('Salvo.');
});

// Backup automático em arquivo
const DB='JobSearchHandles';
const STORE='handles';
const HANDLE_KEY='autoBackup';
function openDB(){
  return new Promise((resolve,reject)=>{
    const req = indexedDB.open(DB,1);
    req.onupgradeneeded = ()=> req.result.createObjectStore(STORE);
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  });
}
async function dbGet(key){
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const req = db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  });
}
async function dbSet(key,value){
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).put(value,key);
    tx.oncomplete = ()=> resolve();
    tx.onerror = ()=> reject(tx.error);
  });
}
async function dbDel(key){
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = ()=> resolve();
    tx.onerror = ()=> reject(tx.error);
  });
}

function updateBackupStatus(state, text){
  const el = $('#backupStatus');
  el.className = 'backup-status ' + (state==='ok' ? 'ok' : state==='warn' ? 'warn' : '');
  el.innerHTML = `<span class="dot"></span>${text || ({ ok:'Backup automático ativo', local:'Backup local ativo', warn:'Somente backup local' }[state] || 'Backup local ativo')}`;
}
async function writeBackupFile(handle){
  const permission = await handle.queryPermission({ mode:'readwrite' });
  if(permission !== 'granted') throw new Error('permission');
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(exportPayload(), null, 2));
  await writable.close();
  dirty = false;
  setSettings({ lastAutoBackup:new Date().toISOString() });
  updateBackupStatus('ok');
}
async function enableAutoBackup(){
  if(!('showSaveFilePicker' in window)){
    updateBackupStatus('warn','Navegador sem backup em arquivo');
    alert('O backup automático em arquivo funciona no Chrome ou Edge quando o site está hospedado em HTTPS. Os snapshots locais continuam ativos.');
    return;
  }
  try{
    let handle = await dbGet(HANDLE_KEY);
    if(handle){
      const permission = await handle.requestPermission({ mode:'readwrite' });
      if(permission === 'granted'){
        setSettings({ autoFile:true });
        dirty = true;
        await writeBackupFile(handle);
        toast('Backup automático reativado.');
        return;
      }
    }
    handle = await showSaveFilePicker({
      suggestedName:'JobSearch-backup-auto.json',
      types:[{ description:'Backup JSON', accept:{ 'application/json':['.json'] } }]
    });
    await dbSet(HANDLE_KEY, handle);
    setSettings({ autoFile:true });
    dirty = true;
    await writeBackupFile(handle);
    toast('Backup automático em arquivo ativado.');
  }catch(error){
    if(error.name !== 'AbortError') alert('Não foi possível ativar o backup automático.');
  }
}
async function autoFileBackup(){
  const currentSettings = settings();
  if(!currentSettings.autoFile || !dirty) return;
  try{
    const handle = await dbGet(HANDLE_KEY);
    if(!handle){ updateBackupStatus('warn'); return; }
    await writeBackupFile(handle);
  }catch{
    updateBackupStatus('warn','Autorize novamente o arquivo');
  }
}
async function disableAutoBackup(){
  await dbDel(HANDLE_KEY);
  setSettings({ autoFile:false });
  updateBackupStatus('local','Backup local ativo');
  toast('Backup em arquivo desativado.');
}
async function initBackup(){
  createSnapshot('inicialização');
  const currentSettings = settings();
  if(currentSettings.autoFile){
    try{
      const handle = await dbGet(HANDLE_KEY);
      if(handle && (await handle.queryPermission({ mode:'readwrite' })) === 'granted'){
        updateBackupStatus('ok');
        return;
      }
    }catch{}
  }
  updateBackupStatus('local','Backup local ativo');
}
function openSnapshots(){
  const list = snapshots();
  $('#snapshotList').innerHTML = list.length
    ? list.map((snapshot)=>`
        <div class="snapshot">
          <div>
            <strong>${new Date(snapshot.createdAt).toLocaleString('pt-BR')}</strong>
            <small>${esc(snapshot.reason)} · ${snapshot.count} registros · ${snapshot.hash}</small>
          </div>
          <div class="row-actions">
            <button class="btn" type="button" onclick="restoreSnapshot('${snapshot.id}')">Restaurar</button>
            <button class="btn" type="button" onclick="downloadSnapshot('${snapshot.id}')">Baixar</button>
          </div>
        </div>
      `).join('')
    : '<div class="empty">Nenhum snapshot disponível.</div>';
  $('#snapshots').classList.add('open');
}
function restoreSnapshot(id){
  const snapshot = snapshots().find((entry)=>entry.id===id);
  if(snapshot && confirm('Restaurar esta versão? O estado atual será salvo antes.')){
    createSnapshot('antes de restaurar', true);
    items = structuredClone(snapshot.data);
    save('snapshot restaurado');
    closeM('snapshots');
    toast('Versão restaurada.');
  }
}
function downloadSnapshot(id){
  const snapshot = snapshots().find((entry)=>entry.id===id);
  if(!snapshot) return;
  download(
    `JobSearch-snapshot-${snapshot.createdAt.slice(0,19).replace(/:/g,'-')}.json`,
    JSON.stringify({ project:'JobSearch', exportedAt:snapshot.createdAt, items:snapshot.data }, null, 2),
    'application/json'
  );
}

setInterval(()=>{
  if(dirty) autoFileBackup();
  createSnapshot('intervalo automático');
}, 15 * 60 * 1000);

window.addEventListener('beforeunload', ()=>{
  localStorage.setItem(APP_KEY, JSON.stringify(items));
});
window.addEventListener('beforeinstallprompt', (event)=>{
  event.preventDefault();
  deferredInstall = event;
  $('#installBtn').style.display = 'inline-flex';
});
async function installApp(){
  if(!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  $('#installBtn').style.display = 'none';
}

if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

const segments = [...new Set(items.map(item => item.segment).filter(Boolean))].sort();
const confidences = [...new Set(items.map(item => item.confidence).filter(Boolean))].sort();
$('#fs').innerHTML = '<option value="">Todos</option>' + segments.map(item=>`<option>${esc(item)}</option>`).join('');
$('#fc').innerHTML = '<option value="">Todas</option>' + confidences.map(item=>`<option>${esc(item)}</option>`).join('');
$('#fst').innerHTML = '<option value="">Todos</option>' + statuses.map(item=>`<option>${item}</option>`).join('');
$('#formStatus').innerHTML = statuses.map(item=>`<option>${item}</option>`).join('');
$('#versionLabel').textContent = `v${META.version || '2.0.0'}`;
['q','fm','fs','fp','fst','fc'].forEach((id)=>$('#'+id).addEventListener(id==='q' ? 'input' : 'change', render));
applyTheme(localStorage.getItem(THEME_KEY) || document.documentElement.getAttribute('data-theme') || 'dark');
initBackup();
render();
