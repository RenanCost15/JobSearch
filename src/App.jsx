import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArchiveRestore,
  BellRing,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  Clipboard,
  CloudDownload,
  Database,
  Download,
  ExternalLink,
  FileDown,
  Filter,
  Home,
  Import,
  Laptop,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trash2,
  X
} from 'lucide-react';
import seedCompanies from './data/companies.json';
import seedVacancies from './data/vacancies.json';

const PROFILE_PHOTO = `${import.meta.env.BASE_URL}renan-costa.jpg`;

const COMPANY_KEY = 'jobsearch.react.companies.v3';
const VACANCY_KEY = 'jobsearch.react.vacancies.v3';
const SNAPSHOT_KEY = 'jobsearch.react.snapshots.v3';
const THEME_KEY = 'jobsearch.theme';
const PHONE = '(83) 9 9900-8017';
const MAX_SNAPSHOTS = 30;

const companyStatuses = [
  'Não iniciado',
  'Pesquisar canal',
  'Pronto para enviar',
  'Enviado',
  'Follow-up',
  'Respondeu',
  'Entrevista',
  'Banco de talentos',
  'Sem retorno',
  'Encerrado'
];

const vacancyStatuses = [
  'Verificar disponibilidade',
  'Salva',
  'Candidatura preparada',
  'Candidatado',
  'Entrevista',
  'Encerrada'
];

const navItems = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'companies', label: 'Empresas', icon: Building2 },
  { id: 'vacancies', label: 'Vagas', icon: BriefcaseBusiness },
  { id: 'followups', label: 'Follow-ups', icon: CalendarClock }
];

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    if (saved) return safeParse(saved, initialValue);
    if (key === COMPANY_KEY) {
      const legacy = localStorage.getItem('JobSearch.data.v2') || localStorage.getItem('renanJobCRM_v2');
      const migrated = legacy ? safeParse(legacy, null) : null;
      if (Array.isArray(migrated)) return migrated.map(normalizeCompany);
    }
    return initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, days) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return '—';
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat('pt-BR').format(parsed);
}

function defaultMessage(company) {
  const localIntro = company.modality?.startsWith('Presencial')
    ? 'Estou estabelecendo residência em Patos-PB'
    : 'Resido em Patos-PB e tenho estrutura para trabalho totalmente remoto';

  return `Olá, equipe de ${company.sector || 'Recursos Humanos'} da ${company.company}! Meu nome é Renan Costa.\n\n${localIntro} e gostaria de colocar meu currículo à disposição para oportunidades em ${company.targetRoles || 'áreas administrativas, atendimento ou suporte'}.\n\nSou estudante de Sistemas de Informação pela UFRN e tenho experiência prática com atendimento ao cliente, apoio administrativo e comercial, organização de processos, estoque, planilhas, relatórios, dashboards e suporte técnico. Tenho perfil organizado, comunicativo, proativo e disponibilidade para trabalhar em qualquer horário.\n\nAcredito que meu perfil pode contribuir com a equipe e fico à disposição para processos seletivos atuais ou futuros. Encaminho meu currículo para avaliação.\n\nAtenciosamente,\nRenan Costa\nTelefone/WhatsApp: ${PHONE}`;
}

function normalizeCompany(company) {
  return {
    ...company,
    compatibility: Number(company.compatibility || 0),
    sent: Boolean(company.sent),
    status: company.status || 'Não iniciado',
    tags: Array.isArray(company.tags) ? company.tags : []
  };
}

function createSnapshot(companies, vacancies, reason) {
  const list = safeParse(localStorage.getItem(SNAPSHOT_KEY), []);
  const snapshot = {
    id: crypto.randomUUID?.() || String(Date.now()),
    createdAt: new Date().toISOString(),
    reason,
    companies,
    vacancies
  };
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify([snapshot, ...list].slice(0, MAX_SNAPSHOTS)));
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const HANDLE_DB = 'JobSearchReactHandles';
const HANDLE_STORE = 'handles';
const HANDLE_KEY = 'automaticBackup';

function openHandleDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(HANDLE_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readHandle() {
  const db = await openHandleDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(HANDLE_STORE).objectStore(HANDLE_STORE).get(HANDLE_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveHandle(handle) {
  const db = await openHandleDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HANDLE_STORE, 'readwrite');
    transaction.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

async function deleteHandle() {
  const db = await openHandleDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HANDLE_STORE, 'readwrite');
    transaction.objectStore(HANDLE_STORE).delete(HANDLE_KEY);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

function copyText(text, notify) {
  navigator.clipboard
    ?.writeText(text)
    .then(() => notify('Copiado para a área de transferência.'))
    .catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      notify('Copiado para a área de transferência.');
    });
}

function AppLogo({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="JobSearch" className="brand-logo" />
      {!compact && (
        <div>
          <strong>JobSearch</strong>
          <span>Renan Costa</span>
        </div>
      )}
    </div>
  );
}

function IconButton({ title, children, className = '', ...props }) {
  return (
    <button className={`icon-button ${className}`} title={title} aria-label={title} type="button" {...props}>
      {children}
    </button>
  );
}

function Modal({ title, subtitle, onClose, children, footer, wide = false }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-panel ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true">
        <header className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <IconButton title="Fechar" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </header>
        <div className="modal-content">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail, accent = false }) {
  return (
    <article className={`stat-card ${accent ? 'stat-accent' : ''}`}>
      <div className="stat-icon"><Icon size={20} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function PriorityBadge({ priority }) {
  return <span className={`priority priority-${priority?.toLowerCase()}`}>{priority || 'C'}</span>;
}

function FitBar({ value }) {
  return (
    <div className="fit-wrap">
      <div className="fit-track"><i style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} /></div>
      <span>{value || 0}%</span>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <Search size={28} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function App() {
  const [companies, setCompanies] = useStoredState(COMPANY_KEY, seedCompanies.map(normalizeCompany));
  const [vacancies, setVacancies] = useStoredState(VACANCY_KEY, seedVacancies);
  const [activePage, setActivePage] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [detail, setDetail] = useState(null);
  const [editor, setEditor] = useState(null);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoBackupState, setAutoBackupState] = useState('local');
  const importRef = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#050507' : '#f4f4f7');
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!('showSaveFilePicker' in window) || !('indexedDB' in window)) return;
      try {
        const handle = await readHandle();
        if (handle && (await handle.queryPermission({ mode: 'readwrite' })) === 'granted' && mounted) {
          setAutoBackupState('file');
        }
      } catch {
        if (mounted) setAutoBackupState('local');
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = window.setTimeout(() => createSnapshot(companies, vacancies, 'alteração automática'), 1000);
    return () => window.clearTimeout(timer);
  }, [companies, vacancies]);

  useEffect(() => {
    if (autoBackupState !== 'file') return undefined;
    const timer = window.setTimeout(async () => {
      try {
        const handle = await readHandle();
        if (!handle || (await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
          setAutoBackupState('attention');
          return;
        }
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify({
          project: 'JobSearch',
          version: '3.0.0-react',
          exportedAt: new Date().toISOString(),
          companies,
          vacancies
        }, null, 2));
        await writable.close();
      } catch {
        setAutoBackupState('attention');
      }
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [companies, vacancies, autoBackupState]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2300);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const metrics = useMemo(() => {
    const sent = companies.filter((item) => item.sent || ['Enviado', 'Follow-up', 'Respondeu', 'Entrevista'].includes(item.status)).length;
    const due = companies.filter((item) => item.followUpDate && item.followUpDate <= today() && !['Entrevista', 'Encerrado'].includes(item.status)).length;
    return {
      companies: companies.length,
      local: companies.filter((item) => item.modality?.startsWith('Presencial')).length,
      remote: companies.filter((item) => item.modality?.startsWith('Remoto')).length,
      vacancies: vacancies.length,
      sent,
      interviews: companies.filter((item) => item.status === 'Entrevista').length + vacancies.filter((item) => item.status === 'Entrevista').length,
      due
    };
  }, [companies, vacancies]);

  function changePage(page) {
    setActivePage(page);
    setSidebarOpen(false);
  }

  function notify(message) {
    setToast(message);
  }

  function updateCompany(id, patch, reason = 'empresa atualizada') {
    setCompanies((current) => current.map((item) => item.id === id ? normalizeCompany({ ...item, ...patch }) : item));
    notify(reason);
  }

  function markSent(company, checked = true) {
    const patch = checked
      ? {
          sent: true,
          status: ['Não iniciado', 'Pesquisar canal', 'Pronto para enviar'].includes(company.status) ? 'Enviado' : company.status,
          sentDate: company.sentDate || today(),
          lastContact: today(),
          followUpDate: company.followUpDate || addDays(today(), 7)
        }
      : { sent: false, sentDate: '', status: company.status === 'Enviado' ? 'Não iniciado' : company.status };
    updateCompany(company.id, patch, checked ? 'Envio registrado.' : 'Envio desmarcado.');
  }

  function saveCompany(data) {
    if (data.id) {
      setCompanies((current) => current.map((item) => item.id === data.id ? normalizeCompany({ ...item, ...data }) : item));
    } else {
      setCompanies((current) => [normalizeCompany({
        ...data,
        id: `EMP-${Date.now()}`,
        sent: false,
        sentDate: '',
        followUpDate: '',
        lastContact: '',
        status: 'Não iniciado',
        tags: ['manual']
      }), ...current]);
    }
    setEditor(null);
    notify('Empresa salva.');
  }

  function saveVacancy(data) {
    if (data.id) {
      setVacancies((current) => current.map((item) => item.id === data.id ? { ...item, ...data, fit: Number(data.fit || 0) } : item));
    } else {
      setVacancies((current) => [{
        ...data,
        id: `JOB-${Date.now()}`,
        fit: Number(data.fit || 0),
        status: data.status || 'Verificar disponibilidade'
      }, ...current]);
    }
    setEditor(null);
    notify('Vaga salva.');
  }

  function removeItem(type, id) {
    if (!window.confirm('Excluir este registro?')) return;
    createSnapshot(companies, vacancies, 'antes de excluir');
    if (type === 'company') setCompanies((current) => current.filter((item) => item.id !== id));
    if (type === 'vacancy') setVacancies((current) => current.filter((item) => item.id !== id));
    setDetail(null);
    notify('Registro excluído.');
  }

  async function enableAutomaticFileBackup() {
    if (!('showSaveFilePicker' in window)) {
      window.alert('O backup automático em arquivo está disponível no Chrome ou Edge em conexão HTTPS. Os snapshots locais continuam ativos.');
      return;
    }
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'JobSearch-backup-auto.json',
        types: [{ description: 'Backup JSON', accept: { 'application/json': ['.json'] } }]
      });
      await saveHandle(handle);
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify({
        project: 'JobSearch',
        version: '3.0.0-react',
        exportedAt: new Date().toISOString(),
        companies,
        vacancies
      }, null, 2));
      await writable.close();
      setAutoBackupState('file');
      notify('Backup automático em arquivo ativado.');
    } catch (error) {
      if (error?.name !== 'AbortError') window.alert('Não foi possível ativar o backup automático em arquivo.');
    }
  }

  async function disableAutomaticFileBackup() {
    try { await deleteHandle(); } catch {}
    setAutoBackupState('local');
    notify('Backup automático em arquivo desativado.');
  }

  function exportBackup() {
    const payload = {
      project: 'JobSearch',
      version: '3.0.0-react',
      exportedAt: new Date().toISOString(),
      companies,
      vacancies
    };
    downloadFile(`JobSearch-backup-${today()}.json`, JSON.stringify(payload, null, 2), 'application/json');
    notify('Backup exportado.');
  }

  function exportCsv() {
    const columns = ['company', 'city', 'modality', 'segment', 'priority', 'compatibility', 'sector', 'targetRoles', 'channelType', 'contact', 'status', 'sentDate', 'followUpDate', 'sourceUrl'];
    const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [columns.join(';'), ...companies.map((item) => columns.map((key) => quote(item[key])).join(';'))];
    downloadFile(`JobSearch-empresas-${today()}.csv`, `\ufeff${rows.join('\n')}`, 'text/csv;charset=utf-8');
  }

  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const importedCompanies = Array.isArray(parsed) ? parsed : (parsed.companies || parsed.items);
        const importedVacancies = parsed.vacancies;
        if (!Array.isArray(importedCompanies)) throw new Error('Formato inválido');
        createSnapshot(companies, vacancies, 'antes de importar');
        setCompanies(importedCompanies.map(normalizeCompany));
        if (Array.isArray(importedVacancies)) setVacancies(importedVacancies);
        notify('Backup importado.');
      } catch {
        window.alert('Arquivo inválido. Use um backup JSON exportado pelo JobSearch.');
      }
    };
    reader.readAsText(file);
  }

  function restoreSnapshot(snapshot) {
    if (!window.confirm('Restaurar esta versão? O estado atual será preservado em um novo snapshot.')) return;
    createSnapshot(companies, vacancies, 'antes de restaurar');
    setCompanies(snapshot.companies.map(normalizeCompany));
    setVacancies(snapshot.vacancies || []);
    setSnapshotOpen(false);
    notify('Versão restaurada.');
  }

  function renderPage() {
    if (activePage === 'companies') {
      return <CompaniesPage companies={companies} updateCompany={updateCompany} markSent={markSent} setDetail={setDetail} setEditor={setEditor} notify={notify} />;
    }
    if (activePage === 'vacancies') {
      return <VacanciesPage vacancies={vacancies} setVacancies={setVacancies} setDetail={setDetail} setEditor={setEditor} notify={notify} />;
    }
    if (activePage === 'followups') {
      return <FollowupsPage companies={companies} markSent={markSent} updateCompany={updateCompany} setDetail={setDetail} />;
    }
    return <Dashboard metrics={metrics} companies={companies} vacancies={vacancies} changePage={changePage} setDetail={setDetail} />;
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <AppLogo />
          <IconButton title="Fechar menu" className="mobile-only" onClick={() => setSidebarOpen(false)}><X size={20} /></IconButton>
        </div>

        <nav className="main-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={activePage === id ? 'nav-active' : ''} onClick={() => changePage(id)}>
              <Icon size={19} />
              <span>{label}</span>
              {id === 'followups' && metrics.due > 0 && <b>{metrics.due}</b>}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <div className="sidebar-card-icon"><BellRing size={18} /></div>
          <div>
            <strong>Monitoramento semanal</strong>
            <span>Segundas-feiras, 8h</span>
          </div>
          <i className="online-dot" />
        </div>

        <div className="sidebar-profile">
          <img src={PROFILE_PHOTO} alt="Foto de perfil de Renan Costa" className="profile-photo" />
          <div><strong>Renan Costa</strong><span>Patos-PB · remoto Brasil</span></div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-overlay" type="button" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu" />}

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <IconButton title="Abrir menu" className="desktop-hidden" onClick={() => setSidebarOpen(true)}><Menu size={21} /></IconButton>
            <div>
              <span className="topbar-kicker">JobSearch</span>
              <h1>{navItems.find((item) => item.id === activePage)?.label || 'Visão geral'}</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <button className="button button-ghost" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
            </button>
            <button className="button button-ghost hide-small" type="button" onClick={() => setSnapshotOpen(true)}><ArchiveRestore size={18} /> Versões</button>
            <button className="button button-ghost hide-small" type="button" onClick={exportBackup}><CloudDownload size={18} /> Backup</button>
            <button className="button button-primary" type="button" onClick={() => setEditor({ type: activePage === 'vacancies' ? 'vacancy' : 'company', data: null })}>
              <Plus size={18} /> {activePage === 'vacancies' ? 'Nova vaga' : 'Nova empresa'}
            </button>
            <button className="more-button" type="button" onClick={() => setSettingsOpen(true)} title="Configurações e backup"><Settings2 size={18} /></button>
            <button className="more-button" type="button" onClick={() => importRef.current?.click()} title="Importar backup"><Import size={18} /></button>
            <input ref={importRef} className="hidden-input" type="file" accept=".json" onChange={(event) => { importBackup(event.target.files?.[0]); event.target.value = ''; }} />
          </div>
        </header>

        <main className="page-content">{renderPage()}</main>
      </section>

      {detail && (
        <DetailModal
          detail={detail}
          companies={companies}
          vacancies={vacancies}
          setDetail={setDetail}
          setEditor={setEditor}
          removeItem={removeItem}
          updateCompany={updateCompany}
          setVacancies={setVacancies}
          notify={notify}
        />
      )}

      {editor && (
        <EditorModal editor={editor} onClose={() => setEditor(null)} saveCompany={saveCompany} saveVacancy={saveVacancy} />
      )}

      {snapshotOpen && (
        <SnapshotsModal onClose={() => setSnapshotOpen(false)} restoreSnapshot={restoreSnapshot} />
      )}

      {settingsOpen && (
        <BackupSettingsModal
          state={autoBackupState}
          onClose={() => setSettingsOpen(false)}
          onEnable={enableAutomaticFileBackup}
          onDisable={disableAutomaticFileBackup}
          onExport={exportBackup}
          onCsv={exportCsv}
          onVersions={() => { setSettingsOpen(false); setSnapshotOpen(true); }}
        />
      )}

      {toast && <div className="toast"><Check size={17} /> {toast}</div>}
    </div>
  );
}

function Dashboard({ metrics, companies, vacancies, changePage, setDetail }) {
  const topCompanies = [...companies].sort((a, b) => (a.priority || 'C').localeCompare(b.priority || 'C') || b.compatibility - a.compatibility).slice(0, 6);
  const topVacancies = [...vacancies].sort((a, b) => b.fit - a.fit).slice(0, 5);
  const progress = metrics.companies ? Math.round((metrics.sent / metrics.companies) * 100) : 0;

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <span className="eyebrow"><Sparkles size={15} /> Estratégia profissional de candidaturas</span>
          <h2>Presencial em Patos. Remoto para todo o Brasil.</h2>
          <p>Organize empresas, vagas, mensagens, envios e follow-ups em um único painel. A base inicial reúne alvos locais, empresas remotas e oportunidades encontradas em fontes públicas.</p>
          <div className="hero-actions">
            <button className="button button-primary" type="button" onClick={() => changePage('companies')}><Building2 size={18} /> Ver empresas</button>
            <button className="button button-secondary" type="button" onClick={() => changePage('vacancies')}><BriefcaseBusiness size={18} /> Ver vagas</button>
          </div>
        </div>
        <div className="progress-card">
          <div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` }}><span>{progress}%</span></div>
          <div><strong>Base contatada</strong><span>{metrics.sent} de {metrics.companies} empresas</span></div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard icon={Database} label="Empresas" value={metrics.companies} detail="base consolidada" accent />
        <StatCard icon={Home} label="Patos presencial" value={metrics.local} detail="alvos locais" />
        <StatCard icon={Laptop} label="Remoto Brasil" value={metrics.remote} detail="confirmar abrangência" />
        <StatCard icon={BriefcaseBusiness} label="Vagas mapeadas" value={metrics.vacancies} detail="oportunidades atuais" />
        <StatCard icon={Send} label="Candidaturas" value={metrics.sent} detail="envios registrados" />
        <StatCard icon={CalendarClock} label="Follow-ups" value={metrics.due} detail="pendentes hoje" />
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <header className="panel-header"><div><span className="panel-kicker">Prioridade</span><h3>Empresas mais aderentes</h3></div><button className="text-button" type="button" onClick={() => changePage('companies')}>Ver todas <ChevronRight size={16} /></button></header>
          <div className="compact-list">
            {topCompanies.map((company) => (
              <button key={company.id} className="compact-row" type="button" onClick={() => setDetail({ type: 'company', id: company.id })}>
                <div className="company-avatar">{company.company.slice(0, 2).toUpperCase()}</div>
                <div className="compact-main"><strong>{company.company}</strong><span>{company.segment} · {company.modality}</span></div>
                <div className="compact-side"><PriorityBadge priority={company.priority} /><span>{company.compatibility}%</span></div>
              </button>
            ))}
          </div>
        </article>

        <article className="panel">
          <header className="panel-header"><div><span className="panel-kicker">Oportunidades</span><h3>Vagas com maior aderência</h3></div><button className="text-button" type="button" onClick={() => changePage('vacancies')}>Ver todas <ChevronRight size={16} /></button></header>
          <div className="compact-list">
            {topVacancies.map((vacancy) => (
              <button key={vacancy.id} className="compact-row" type="button" onClick={() => setDetail({ type: 'vacancy', id: vacancy.id })}>
                <div className="company-avatar vacancy-avatar"><BriefcaseBusiness size={18} /></div>
                <div className="compact-main"><strong>{vacancy.title}</strong><span>{vacancy.company} · {vacancy.location}</span></div>
                <div className="compact-side"><span className="fit-number">{vacancy.fit}%</span><span>{vacancy.modality}</span></div>
              </button>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function CompaniesPage({ companies, updateCompany, markSent, setDetail, setEditor, notify }) {
  const [search, setSearch] = useState('');
  const [modality, setModality] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [segment, setSegment] = useState('');

  const segments = useMemo(() => [...new Set(companies.map((item) => item.segment).filter(Boolean))].sort(), [companies]);
  const filtered = useMemo(() => companies.filter((company) => {
    const haystack = [company.company, company.city, company.segment, company.sector, company.targetRoles, company.contact].join(' ').toLowerCase();
    if (search && !haystack.includes(search.toLowerCase())) return false;
    if (modality && company.modality !== modality) return false;
    if (priority && company.priority !== priority) return false;
    if (status && company.status !== status) return false;
    if (segment && company.segment !== segment) return false;
    return true;
  }).sort((a, b) => (a.priority || 'C').localeCompare(b.priority || 'C') || b.compatibility - a.compatibility || a.company.localeCompare(b.company)), [companies, search, modality, priority, status, segment]);

  return (
    <div className="page-stack">
      <section className="section-heading">
        <div><span className="eyebrow"><Target size={15} /> Base de prospecção</span><h2>Empresas e canais</h2><p>Priorize Patos presencial e empresas remotas que aceitem candidatos residentes na Paraíba.</p></div>
        <div className="heading-count"><strong>{filtered.length}</strong><span>resultados</span></div>
      </section>

      <section className="filter-panel">
        <label className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar empresa, setor, cargo ou contato" /></label>
        <select value={modality} onChange={(event) => setModality(event.target.value)}><option value="">Todas as modalidades</option><option>Presencial em Patos</option><option>Remoto para qualquer localidade</option></select>
        <select value={segment} onChange={(event) => setSegment(event.target.value)}><option value="">Todos os segmentos</option>{segments.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="">Prioridades</option><option>A</option><option>B</option><option>C</option></select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos os status</option>{companyStatuses.map((item) => <option key={item}>{item}</option>)}</select>
        <button className="button button-secondary filter-clear" type="button" onClick={() => { setSearch(''); setModality(''); setSegment(''); setPriority(''); setStatus(''); }}><Filter size={17} /> Limpar</button>
      </section>

      <section className="data-panel desktop-table">
        <table className="data-table">
          <thead><tr><th>Envio</th><th>Empresa</th><th>Prioridade</th><th>Área e cargos</th><th>Canal</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtered.map((company) => (
              <tr key={company.id}>
                <td><button className={`check-button ${company.sent ? 'checked' : ''}`} type="button" onClick={() => markSent(company, !company.sent)}>{company.sent && <Check size={15} />}</button></td>
                <td><button className="company-link" type="button" onClick={() => setDetail({ type: 'company', id: company.id })}><strong>{company.company}</strong><span>{company.city} · {company.modality}</span></button></td>
                <td><PriorityBadge priority={company.priority} /><FitBar value={company.compatibility} /></td>
                <td><strong className="cell-title">{company.segment}</strong><span className="cell-muted line-clamp">{company.targetRoles}</span></td>
                <td><strong className="cell-title">{company.channelType}</strong><span className="cell-muted line-clamp">{company.contact}</span><em className="confidence-label">{company.confidence || 'A confirmar'}</em></td>
                <td><select className="status-select" value={company.status} onChange={(event) => updateCompany(company.id, { status: event.target.value }, 'Status atualizado.')}>{companyStatuses.map((item) => <option key={item}>{item}</option>)}</select><span className="cell-muted">{company.followUpDate ? `Follow-up: ${formatDate(company.followUpDate)}` : 'Sem follow-up'}</span></td>
                <td><div className="table-actions"><IconButton title="Ver detalhes" onClick={() => setDetail({ type: 'company', id: company.id })}><MoreHorizontal size={18} /></IconButton><IconButton title="Copiar mensagem" onClick={() => copyText(`Assunto: ${company.subject}\n\n${company.message || defaultMessage(company)}`, notify)}><Clipboard size={17} /></IconButton><IconButton title="Editar" onClick={() => setEditor({ type: 'company', data: company })}><Pencil size={17} /></IconButton></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState title="Nenhuma empresa encontrada" description="Ajuste os filtros ou cadastre um novo alvo." />}
      </section>

      <section className="mobile-cards">
        {filtered.map((company) => (
          <article className="entity-card" key={company.id}>
            <header><div><strong>{company.company}</strong><span>{company.city} · {company.modality}</span></div><PriorityBadge priority={company.priority} /></header>
            <FitBar value={company.compatibility} />
            <div className="entity-meta"><span><Building2 size={15} /> {company.segment}</span><span><MessageSquareText size={15} /> {company.channelType}</span></div>
            <select className="status-select" value={company.status} onChange={(event) => updateCompany(company.id, { status: event.target.value }, 'Status atualizado.')}>{companyStatuses.map((item) => <option key={item}>{item}</option>)}</select>
            <footer><button className="button button-secondary" type="button" onClick={() => setDetail({ type: 'company', id: company.id })}>Detalhes</button><button className="button button-primary" type="button" onClick={() => markSent(company, true)}><Send size={16} /> Marcar envio</button></footer>
          </article>
        ))}
        {!filtered.length && <EmptyState title="Nenhuma empresa encontrada" description="Ajuste os filtros ou cadastre um novo alvo." />}
      </section>
    </div>
  );
}

function VacanciesPage({ vacancies, setVacancies, setDetail, setEditor, notify }) {
  const [search, setSearch] = useState('');
  const [modality, setModality] = useState('');
  const [status, setStatus] = useState('');
  const filtered = useMemo(() => vacancies.filter((vacancy) => {
    const haystack = [vacancy.title, vacancy.company, vacancy.location, vacancy.area, vacancy.modality].join(' ').toLowerCase();
    if (search && !haystack.includes(search.toLowerCase())) return false;
    if (modality && !vacancy.modality.toLowerCase().includes(modality.toLowerCase())) return false;
    if (status && vacancy.status !== status) return false;
    return true;
  }).sort((a, b) => b.fit - a.fit), [vacancies, search, modality, status]);

  function updateVacancy(id, patch) {
    setVacancies((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
    notify('Vaga atualizada.');
  }

  return (
    <div className="page-stack">
      <section className="section-heading"><div><span className="eyebrow"><BriefcaseBusiness size={15} /> Oportunidades mapeadas</span><h2>Banco de vagas</h2><p>Vagas recentes identificadas em fontes públicas. Confirme a disponibilidade e os requisitos antes da candidatura.</p></div><div className="heading-count"><strong>{filtered.length}</strong><span>vagas</span></div></section>
      <section className="filter-panel vacancies-filter"><label className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar vaga, empresa ou área" /></label><select value={modality} onChange={(event) => setModality(event.target.value)}><option value="">Todas as modalidades</option><option value="Presencial">Presencial</option><option value="Remoto">Remoto</option></select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos os status</option>{vacancyStatuses.map((item) => <option key={item}>{item}</option>)}</select><button className="button button-secondary filter-clear" type="button" onClick={() => { setSearch(''); setModality(''); setStatus(''); }}><Filter size={17} /> Limpar</button></section>
      <section className="vacancy-grid">
        {filtered.map((vacancy) => (
          <article className="vacancy-card" key={vacancy.id}>
            <header><div className="vacancy-icon"><BriefcaseBusiness size={20} /></div><div className="fit-pill">{vacancy.fit}% aderente</div></header>
            <div className="vacancy-title"><span>{vacancy.company}</span><h3>{vacancy.title}</h3></div>
            <div className="vacancy-tags"><span>{vacancy.location}</span><span>{vacancy.modality}</span><span>{vacancy.area}</span></div>
            <p>{vacancy.notes}</p>
            <div className="vacancy-source"><ShieldCheck size={16} /><span>{vacancy.sourceType} · {vacancy.published}</span></div>
            <select className="status-select" value={vacancy.status} onChange={(event) => updateVacancy(vacancy.id, { status: event.target.value })}>{vacancyStatuses.map((item) => <option key={item}>{item}</option>)}</select>
            <footer><button className="button button-secondary" type="button" onClick={() => setDetail({ type: 'vacancy', id: vacancy.id })}>Detalhes</button><a className="button button-primary" href={vacancy.sourceUrl} target="_blank" rel="noreferrer">Abrir fonte <ExternalLink size={16} /></a><IconButton title="Editar" onClick={() => setEditor({ type: 'vacancy', data: vacancy })}><Pencil size={17} /></IconButton></footer>
          </article>
        ))}
      </section>
      {!filtered.length && <EmptyState title="Nenhuma vaga encontrada" description="Altere os filtros ou adicione uma oportunidade manualmente." />}
    </div>
  );
}

function FollowupsPage({ companies, updateCompany, setDetail }) {
  const due = companies.filter((item) => item.followUpDate && item.followUpDate <= today() && !['Entrevista', 'Encerrado'].includes(item.status)).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
  const upcoming = companies.filter((item) => item.followUpDate && item.followUpDate > today() && !['Entrevista', 'Encerrado'].includes(item.status)).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate)).slice(0, 12);

  function complete(company) {
    updateCompany(company.id, { status: 'Follow-up', lastContact: today(), followUpDate: addDays(today(), 7) }, 'Follow-up registrado e reagendado.');
  }

  return (
    <div className="page-stack">
      <section className="section-heading"><div><span className="eyebrow"><CalendarClock size={15} /> Acompanhamento</span><h2>Follow-ups e retornos</h2><p>Organize as cobranças de retorno sem perder o timing dos processos seletivos.</p></div><div className="heading-count warning"><strong>{due.length}</strong><span>vencidos</span></div></section>
      <section className="dashboard-grid">
        <article className="panel"><header className="panel-header"><div><span className="panel-kicker">Ação necessária</span><h3>Follow-ups vencidos</h3></div></header>{due.length ? <div className="followup-list">{due.map((company) => <div className="followup-row" key={company.id}><button className="followup-main" type="button" onClick={() => setDetail({ type: 'company', id: company.id })}><strong>{company.company}</strong><span>Previsto para {formatDate(company.followUpDate)} · {company.status}</span></button><button className="button button-primary" type="button" onClick={() => complete(company)}><Check size={16} /> Registrar</button></div>)}</div> : <EmptyState title="Nenhum follow-up vencido" description="Você está em dia com os acompanhamentos." />}</article>
        <article className="panel"><header className="panel-header"><div><span className="panel-kicker">Próximos dias</span><h3>Agenda de retornos</h3></div></header>{upcoming.length ? <div className="followup-list">{upcoming.map((company) => <div className="followup-row" key={company.id}><button className="followup-main" type="button" onClick={() => setDetail({ type: 'company', id: company.id })}><strong>{company.company}</strong><span>{formatDate(company.followUpDate)} · {company.status}</span></button><span className="date-chip">{formatDate(company.followUpDate)}</span></div>)}</div> : <EmptyState title="Agenda vazia" description="Os próximos retornos aparecerão aqui." />}</article>
      </section>
    </div>
  );
}

function DetailModal({ detail, companies, vacancies, setDetail, setEditor, removeItem, updateCompany, setVacancies, notify }) {
  const item = detail.type === 'company' ? companies.find((entry) => entry.id === detail.id) : vacancies.find((entry) => entry.id === detail.id);
  if (!item) return null;

  if (detail.type === 'vacancy') {
    return (
      <Modal title={item.title} subtitle={`${item.company} · ${item.location}`} onClose={() => setDetail(null)} footer={<><button className="button button-danger" type="button" onClick={() => removeItem('vacancy', item.id)}><Trash2 size={17} /> Excluir</button><button className="button button-secondary" type="button" onClick={() => setEditor({ type: 'vacancy', data: item })}><Pencil size={17} /> Editar</button><a className="button button-primary" href={item.sourceUrl} target="_blank" rel="noreferrer">Abrir fonte <ExternalLink size={17} /></a></>}>
        <div className="detail-grid"><div><span>Empresa</span><strong>{item.company}</strong></div><div><span>Aderência</span><strong>{item.fit}%</strong></div><div><span>Modalidade</span><strong>{item.modality}</strong></div><div><span>Área</span><strong>{item.area}</strong></div><div><span>Status</span><strong>{item.status}</strong></div><div><span>Fonte</span><strong>{item.sourceType}</strong></div></div><div className="detail-section"><h3>Observações estratégicas</h3><p>{item.notes}</p></div>
      </Modal>
    );
  }

  const message = item.message || defaultMessage(item);
  return (
    <Modal title={item.company} subtitle={`${item.city} · ${item.modality}`} wide onClose={() => setDetail(null)} footer={<><button className="button button-danger" type="button" onClick={() => removeItem('company', item.id)}><Trash2 size={17} /> Excluir</button><button className="button button-secondary" type="button" onClick={() => setEditor({ type: 'company', data: item })}><Pencil size={17} /> Editar</button><button className="button button-primary" type="button" onClick={() => copyText(`Assunto: ${item.subject}\n\n${message}`, notify)}><Clipboard size={17} /> Copiar pacote</button></>}>
      <div className="detail-grid"><div><span>Prioridade</span><strong><PriorityBadge priority={item.priority} /> {item.compatibility}% de aderência</strong></div><div><span>Status</span><select className="status-select" value={item.status} onChange={(event) => updateCompany(item.id, { status: event.target.value }, 'Status atualizado.')}>{companyStatuses.map((status) => <option key={status}>{status}</option>)}</select></div><div><span>Setor</span><strong>{item.sector}</strong></div><div><span>Canal</span><strong>{item.channelType}</strong></div><div><span>Contato</span><strong>{item.contact}</strong></div><div><span>Confiabilidade</span><strong>{item.confidence || 'A confirmar'}</strong></div></div><div className="detail-section"><h3>Cargos-alvo</h3><p>{item.targetRoles}</p></div><div className="message-layout"><div className="message-block"><header><div><span>Assunto sugerido</span><strong>{item.subject}</strong></div><IconButton title="Copiar assunto" onClick={() => copyText(item.subject, notify)}><Clipboard size={17} /></IconButton></header></div><div className="message-block"><header><div><span>Mensagem personalizada</span><strong>Pronta para envio</strong></div><IconButton title="Copiar mensagem" onClick={() => copyText(message, notify)}><Clipboard size={17} /></IconButton></header><pre>{message}</pre></div></div><div className="detail-section detail-source"><div><h3>Fonte e observações</h3><p>{item.notes || 'Sem observações adicionais.'}</p></div>{item.sourceUrl && <a className="button button-secondary" href={item.sourceUrl} target="_blank" rel="noreferrer">Abrir canal <ExternalLink size={16} /></a>}</div>
    </Modal>
  );
}

function EditorModal({ editor, onClose, saveCompany, saveVacancy }) {
  const isCompany = editor.type === 'company';
  const initial = editor.data || (isCompany ? {
    company: '', city: 'Patos-PB', modality: 'Presencial em Patos', segment: 'Serviços e consultoria', priority: 'B', compatibility: 80,
    sector: 'RH / Administrativo', targetRoles: 'Assistente administrativo, atendimento ou suporte', channelType: 'Pesquisar canal', contact: '', sourceUrl: '',
    notes: '', verifiedAt: today(), status: 'Não iniciado', subject: 'Currículo – Renan Costa – Área administrativa', message: '', confidence: 'Contato a confirmar', sourceName: 'Cadastro manual'
  } : {
    title: '', company: '', location: 'Patos-PB', modality: 'Presencial', area: 'Administrativo', published: 'Recente', fit: 80, sourceType: 'Cadastro manual', sourceUrl: '', status: 'Verificar disponibilidade', notes: ''
  });
  const [form, setForm] = useState(initial);

  function change(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  function submit(event) { event.preventDefault(); if (isCompany) saveCompany(form); else saveVacancy(form); }

  return (
    <Modal title={editor.data ? (isCompany ? 'Editar empresa' : 'Editar vaga') : (isCompany ? 'Nova empresa' : 'Nova vaga')} subtitle="Todos os campos podem ser atualizados posteriormente." wide onClose={onClose} footer={<><button className="button button-secondary" type="button" onClick={onClose}>Cancelar</button><button className="button button-primary" form="editor-form" type="submit"><Check size={17} /> Salvar</button></>}>
      <form id="editor-form" className="editor-grid" onSubmit={submit}>
        {isCompany ? <>
          <label><span>Empresa *</span><input required value={form.company} onChange={(event) => change('company', event.target.value)} /></label>
          <label><span>Cidade</span><input value={form.city} onChange={(event) => change('city', event.target.value)} /></label>
          <label><span>Modalidade</span><select value={form.modality} onChange={(event) => change('modality', event.target.value)}><option>Presencial em Patos</option><option>Remoto para qualquer localidade</option></select></label>
          <label><span>Segmento</span><input value={form.segment} onChange={(event) => change('segment', event.target.value)} /></label>
          <label><span>Prioridade</span><select value={form.priority} onChange={(event) => change('priority', event.target.value)}><option>A</option><option>B</option><option>C</option></select></label>
          <label><span>Compatibilidade</span><input type="number" min="0" max="100" value={form.compatibility} onChange={(event) => change('compatibility', event.target.value)} /></label>
          <label><span>Setor</span><input value={form.sector} onChange={(event) => change('sector', event.target.value)} /></label>
          <label><span>Canal</span><input value={form.channelType} onChange={(event) => change('channelType', event.target.value)} /></label>
          <label className="span-two"><span>Cargos-alvo</span><input value={form.targetRoles} onChange={(event) => change('targetRoles', event.target.value)} /></label>
          <label className="span-two"><span>Contato / instruções</span><input value={form.contact} onChange={(event) => change('contact', event.target.value)} /></label>
          <label><span>Confiabilidade</span><input value={form.confidence} onChange={(event) => change('confidence', event.target.value)} /></label>
          <label><span>Data de verificação</span><input type="date" value={form.verifiedAt} onChange={(event) => change('verifiedAt', event.target.value)} /></label>
          <label className="span-two"><span>URL da fonte</span><input type="url" value={form.sourceUrl} onChange={(event) => change('sourceUrl', event.target.value)} /></label>
          <label className="span-two"><span>Assunto</span><input value={form.subject} onChange={(event) => change('subject', event.target.value)} /></label>
          <label className="span-two"><span>Mensagem personalizada</span><textarea rows="10" value={form.message} onChange={(event) => change('message', event.target.value)} placeholder="Deixe em branco para usar o modelo automático." /></label>
          <label className="span-two"><span>Observações</span><textarea rows="4" value={form.notes} onChange={(event) => change('notes', event.target.value)} /></label>
        </> : <>
          <label className="span-two"><span>Título da vaga *</span><input required value={form.title} onChange={(event) => change('title', event.target.value)} /></label>
          <label><span>Empresa *</span><input required value={form.company} onChange={(event) => change('company', event.target.value)} /></label>
          <label><span>Localidade</span><input value={form.location} onChange={(event) => change('location', event.target.value)} /></label>
          <label><span>Modalidade</span><input value={form.modality} onChange={(event) => change('modality', event.target.value)} /></label>
          <label><span>Área</span><input value={form.area} onChange={(event) => change('area', event.target.value)} /></label>
          <label><span>Aderência (%)</span><input type="number" min="0" max="100" value={form.fit} onChange={(event) => change('fit', event.target.value)} /></label>
          <label><span>Publicação</span><input value={form.published} onChange={(event) => change('published', event.target.value)} /></label>
          <label><span>Tipo de fonte</span><input value={form.sourceType} onChange={(event) => change('sourceType', event.target.value)} /></label>
          <label><span>Status</span><select value={form.status} onChange={(event) => change('status', event.target.value)}>{vacancyStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="span-two"><span>URL da fonte</span><input type="url" value={form.sourceUrl} onChange={(event) => change('sourceUrl', event.target.value)} /></label>
          <label className="span-two"><span>Observações</span><textarea rows="5" value={form.notes} onChange={(event) => change('notes', event.target.value)} /></label>
        </>}
      </form>
    </Modal>
  );
}

function BackupSettingsModal({ state, onClose, onEnable, onDisable, onExport, onCsv, onVersions }) {
  const status = state === 'file'
    ? { label: 'Arquivo automático ativo', detail: 'O arquivo autorizado é atualizado após alterações.', tone: 'success' }
    : state === 'attention'
      ? { label: 'Autorização necessária', detail: 'Ative novamente o arquivo para continuar os backups automáticos.', tone: 'warning' }
      : { label: 'Snapshots locais ativos', detail: 'As versões são preservadas automaticamente neste navegador.', tone: 'neutral' };

  return (
    <Modal title="Proteção e portabilidade" subtitle="Backups locais automáticos e exportações externas." onClose={onClose}>
      <div className={`backup-status-card backup-${status.tone}`}>
        <ShieldCheck size={22} />
        <div><strong>{status.label}</strong><span>{status.detail}</span></div>
      </div>
      <div className="settings-actions">
        <button className="settings-action" type="button" onClick={onEnable}><Database size={19} /><div><strong>Ativar arquivo automático</strong><span>Compatível com Chrome e Edge em HTTPS.</span></div><ChevronRight size={18} /></button>
        <button className="settings-action" type="button" onClick={onVersions}><ArchiveRestore size={19} /><div><strong>Versões automáticas</strong><span>Visualize ou restaure snapshots locais.</span></div><ChevronRight size={18} /></button>
        <button className="settings-action" type="button" onClick={onExport}><FileDown size={19} /><div><strong>Exportar backup JSON</strong><span>Inclui empresas, vagas e acompanhamento.</span></div><Download size={18} /></button>
        <button className="settings-action" type="button" onClick={onCsv}><FileDown size={19} /><div><strong>Exportar empresas em CSV</strong><span>Versão tabular para análise externa.</span></div><Download size={18} /></button>
      </div>
      {state !== 'local' && <button className="button button-danger backup-disable" type="button" onClick={onDisable}>Desativar arquivo automático</button>}
    </Modal>
  );
}

function SnapshotsModal({ onClose, restoreSnapshot }) {
  const snapshots = safeParse(localStorage.getItem(SNAPSHOT_KEY), []);
  return (
    <Modal title="Versões automáticas" subtitle={`Até ${MAX_SNAPSHOTS} versões preservadas no navegador.`} onClose={onClose}>
      <div className="snapshot-list">{snapshots.length ? snapshots.map((snapshot) => <div className="snapshot-row" key={snapshot.id}><div><strong>{new Date(snapshot.createdAt).toLocaleString('pt-BR')}</strong><span>{snapshot.reason} · {snapshot.companies?.length || 0} empresas · {snapshot.vacancies?.length || 0} vagas</span></div><button className="button button-secondary" type="button" onClick={() => restoreSnapshot(snapshot)}><ArchiveRestore size={16} /> Restaurar</button></div>) : <EmptyState title="Nenhuma versão disponível" description="As versões são criadas automaticamente após alterações." />}</div>
    </Modal>
  );
}

export default App;
