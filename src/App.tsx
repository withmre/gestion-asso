import { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { useDataStore } from '@/hooks/useDataStore';
import { useExcelExport } from '@/hooks/useExcelExport';
import { Dashboard } from '@/components/Dashboard';
import { WarningBanner } from '@/components/WarningBanner';
import { AlertsPanel } from '@/components/AlertsPanel';
import { PersonForm } from '@/components/PersonForm';
import { PersonList } from '@/components/PersonList';
import { PersonEditModal } from '@/components/PersonEditModal';
import { HelloAssoImport } from '@/components/HelloAssoImport';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { TransactionEditModal } from '@/components/TransactionEditModal';
import { ParticipationForm } from '@/components/ParticipationForm';
import { ParticipationList } from '@/components/ParticipationList';
import { ParticipationEditModal } from '@/components/ParticipationEditModal';
import { DiscordImport } from '@/components/DiscordImport';
import { BilanPage } from '@/components/BilanPage';
import { SubventionsPage } from '@/components/SubventionsPage';
import { CTFPage } from '@/components/CTFPage';
import { PartenairesPage } from '@/components/PartenairesPage';
import { DataManagement } from '@/components/DataManagement';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Onboarding } from '@/components/Onboarding';
import { ComptabiliteDouble } from '@/components/ComptabiliteDouble';
import { KPIManager } from '@/components/KPIManager';
import { CertificatGenerator } from '@/components/CertificatGenerator';
import { VisuelsRS } from '@/components/VisuelsRS';
import { MentoratPage } from '@/components/MentoratPage';
import { PinLock } from '@/components/PinLock';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Settings,
  BarChart3,
  Calendar,
  Scale,
  FileText,
  Handshake,
  Trophy,
  BookOpen,
  GraduationCap,
  Sliders,
  Award,
  ImageIcon,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import type {
  Person,
  Transaction,
  Participation,
  DiscordKPIData,
  CTFEvent,
  Subvention,
  Partenaire,
} from '@/types';

// ---------------------------------------------------------------------------
// Groupes de navigation pour la sidebar
// ---------------------------------------------------------------------------
const NAV_GROUPS = [
  {
    label: 'Vue générale',
    items: [
      { value: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { value: 'persons',       icon: Users,        label: 'Personnes' },
      { value: 'transactions',  icon: Receipt,      label: 'Transactions' },
      { value: 'participations',icon: Calendar,     label: 'Activités' },
      { value: 'mentorat',      icon: GraduationCap,label: 'Mentorat' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { value: 'bilan',        icon: Scale,    label: 'Bilan' },
      { value: 'subventions',  icon: FileText, label: 'Subventions' },
      { value: 'comptabilite', icon: BookOpen, label: 'Comptabilité' },
    ],
  },
  {
    label: 'Communauté',
    items: [
      { value: 'ctf',         icon: Trophy,    label: 'CTF' },
      { value: 'partenaires', icon: Handshake, label: 'Partenaires' },
    ],
  },
  {
    label: 'Outils',
    items: [
      { value: 'kpi',         icon: Sliders,   label: 'Mes KPIs' },
      { value: 'certificats', icon: Award,     label: 'Certificats' },
      { value: 'visuels',     icon: ImageIcon, label: 'Visuels RS' },
    ],
  },
  {
    label: '',
    items: [
      { value: 'settings', icon: Settings, label: 'Paramètres' },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  dashboard:    'Tableau de bord',
  persons:      'Gestion des personnes',
  transactions: 'Transactions',
  participations:'Activités',
  bilan:        'Bilan',
  subventions:  'Subventions',
  ctf:          'CTF et compétitions',
  partenaires:  'Partenaires et sponsors',
  mentorat:     'Mentorat',
  kpi:          'Indicateurs personnalisés',
  comptabilite: 'Comptabilité (partie double)',
  certificats:  'Certificats',
  visuels:      'Visuels réseaux sociaux',
  settings:     'Paramètres',
};

// ---------------------------------------------------------------------------
// Composant Sidebar
// ---------------------------------------------------------------------------
interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  logoNode: React.ReactNode;
  nomAssociation: string;
  isDark: boolean;
  onToggleTheme: () => void;
}

function Sidebar({ activeTab, onTabChange, collapsed, onToggle, logoNode, nomAssociation, isDark, onToggleTheme }: SidebarProps) {
  return (
    <aside
      className={`
        flex flex-col h-screen sticky top-0 bg-card border-r border-border transition-all duration-200 shrink-0
        ${collapsed ? 'w-14' : 'w-56'}
      `}
    >
      {/* Logo + nom */}
      <div className="flex items-center gap-3 px-3 py-4 border-b border-border min-h-[60px]">
        <div className="shrink-0">{logoNode}</div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{nomAssociation}</p>
            <p className="text-xs text-muted-foreground">ERP associatif</p>
          </div>
        )}
      </div>

      {/* Liens de navigation */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-4 px-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {!collapsed && group.label && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1">
                {group.label}
              </p>
            )}
            {collapsed && group.label && gi > 0 && (
              <div className="border-t border-border my-2" />
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ value, icon: Icon, label }) => {
                const isActive = activeTab === value;
                return (
                  <li key={value}>
                    <button
                      onClick={() => onTabChange(value)}
                      title={collapsed ? label : undefined}
                      className={`
                        w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium transition-colors
                        ${isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }
                        ${collapsed ? 'justify-center' : ''}
                      `}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                      {!collapsed && isActive && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bas de sidebar : thème + collapse */}
      <div className="border-t border-border p-2 flex flex-col gap-1">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-1'}`}>
          {!collapsed && <span className="text-xs text-muted-foreground">Thème</span>}
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
        </div>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? 'Agrandir la sidebar' : 'Réduire la sidebar'}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <><X className="h-3.5 w-3.5" /><span>Réduire</span></>}
        </button>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
function App() {
  const {
    isLoaded,
    hasSeenWarning,
    params,
    persons,
    transactions,
    participations,
    actifs,
    passifs,
    ctfEvents,
    subventions,
    partenaires,
    addPerson,
    updatePerson,
    deletePerson,
    getPersonByEmail,
    getPersonByDiscordId,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addParticipation,
    updateParticipation,
    deleteParticipation,
    addCTFEvent,
    updateCTFEvent,
    deleteCTFEvent,
    addSubvention,
    updateSubvention,
    deleteSubvention,
    addPartenaire,
    updatePartenaire,
    deletePartenaire,
    addActif,
    deleteActif,
    addPassif,
    updatePassif,
    deletePassif,
    updateParams,
    exportToJSON,
    importFromJSON,
    calculateKPIPersonnes,
    calculateKPIFinances,
    calculateKPIBilan,
    calculateKPICTF,
    calculateKPISubventions,
    calculateAlertes,
    getTransactionsByPeriod,
    getTransactionsByYear,
    ecritures,
    addEcriture,
    deleteEcriture,
    genererEcritureDepuisTransaction,
    evenementsPrev,
    addEvenementPrev,
    deleteEvenementPrev,
    kpisCustom,
    calculateScoreSante,
    calculateProjectionTresorerie,
    sessionsMentorat,
    addSessionMentorat,
    updateSessionMentorat,
    deleteSessionMentorat,
    addKPICustom,
    updateKPICustom,
    deleteKPICustom,
    markWarningAsSeen,
  } = useDataStore();

  const { generateExcel, generateExcelAnnuel } = useExcelExport();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored ? stored === 'dark' : false;
  });
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding_done'));
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingParticipation, setEditingParticipation] = useState<Participation | null>(null);

  // Verrouillage automatique après 5 minutes d'inactivité
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (params.pinHash) {
      timerRef.current = setTimeout(() => setIsLocked(true), 5 * 60 * 1000);
    }
  }, [params.pinHash]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  const handleOnboardingComplete = (newParams: Partial<import('@/types').AssociationParams>) => {
    updateParams(newParams);
    localStorage.setItem('onboarding_done', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('onboarding_done', 'true');
    setShowOnboarding(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const kpiPersonnes   = calculateKPIPersonnes();
  const kpiFinances    = calculateKPIFinances();
  const kpiBilan       = calculateKPIBilan();
  const kpiCTF         = calculateKPICTF();
  const kpiSubventions = calculateKPISubventions();
  const alertes        = calculateAlertes();
  const scoreSante     = calculateScoreSante();
  const projectionTresorerie = calculateProjectionTresorerie();

  // Handlers
  const handleAddPerson = (personData: Omit<Person, 'id' | 'dateInscription'>) => {
    addPerson({ ...personData, dateInscription: new Date().toISOString().split('T')[0] });
    toast.success('Personne ajoutée');
  };

  const handleDeletePerson = (id: string) => {
    if (confirm('Supprimer cette personne ? Ses transactions et participations seront aussi supprimées.')) {
      deletePerson(id);
      toast.success('Personne supprimée');
    }
  };

  const handleSavePerson = (id: string, updates: Partial<Person>) => {
    updatePerson(id, updates);
    setEditingPerson(null);
    toast.success('Personne mise à jour');
  };

  const handleHelloAssoImport = (personsData: Omit<Person, 'id' | 'dateInscription'>[]) => {
    let created = 0, updated = 0;
    personsData.forEach((personData) => {
      const existing = getPersonByEmail(personData.email || '');
      if (existing) {
        updatePerson(existing.id, { ...personData, dateDerniereCotisation: personData.dateDerniereCotisation || existing.dateDerniereCotisation });
        updated++;
      } else {
        addPerson({ ...personData, dateInscription: new Date().toISOString().split('T')[0] });
        created++;
      }
    });
    toast.success(`Import terminé : ${created} créés, ${updated} mis à jour`);
    return { created, updated };
  };

  const handleDiscordImport = (discordData: DiscordKPIData[]) => {
    let matched = 0, unmatched = 0;
    discordData.forEach((data) => {
      const person = getPersonByDiscordId(data.idDiscord);
      if (person) {
        updatePerson(person.id, { kpiDiscord: { idDiscord: data.idDiscord, nombreActivites: data.nombreActivites, derniereActivite: data.derniereActivite } });
        matched++;
      } else {
        unmatched++;
      }
    });
    toast.success(`Import Discord : ${matched} membres mis à jour, ${unmatched} IDs introuvables`);
    return { matched, unmatched };
  };

  const handleAddTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    addTransaction(transactionData);
    const label = transactionData.type === 'depense' ? 'Dépense' : transactionData.type === 'adhesion' ? 'Adhésion' : transactionData.type === 'don' ? 'Don' : 'Vente';
    toast.success(`${label} enregistrée`);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Supprimer cette transaction ?')) {
      deleteTransaction(id);
      toast.success('Transaction supprimée');
    }
  };

  const handleSaveTransaction = (id: string, updates: Partial<Transaction>) => {
    updateTransaction(id, updates);
    setEditingTransaction(null);
    toast.success('Transaction mise à jour');
  };

  const handleAddParticipation = (participationData: Omit<Participation, 'id'>) => {
    addParticipation(participationData);
    toast.success('Participation enregistrée');
  };

  const handleDeleteParticipation = (id: string) => {
    if (confirm('Supprimer cette participation ?')) {
      deleteParticipation(id);
      toast.success('Participation supprimée');
    }
  };

  const handleSaveParticipation = (id: string, updates: Partial<Participation>) => {
    updateParticipation(id, updates);
    setEditingParticipation(null);
    toast.success('Participation mise à jour');
  };

  const handleAddCTF    = (ctf: Omit<CTFEvent, 'id'>)               => { addCTFEvent(ctf); toast.success('Événement CTF ajouté'); };
  const handleUpdateCTF = (id: string, u: Partial<CTFEvent>)        => { updateCTFEvent(id, u); toast.success('Événement CTF mis à jour'); };
  const handleDeleteCTF = (id: string)                              => { if (confirm('Supprimer cet événement CTF ?')) { deleteCTFEvent(id); toast.success('Événement supprimé'); } };

  const handleAddSubvention    = (s: Omit<Subvention, 'id'>)        => { addSubvention(s); toast.success('Subvention ajoutée'); };
  const handleUpdateSubvention = (id: string, u: Partial<Subvention>)=> { updateSubvention(id, u); toast.success('Subvention mise à jour'); };
  const handleDeleteSubvention = (id: string)                       => { if (confirm('Supprimer cette subvention ?')) { deleteSubvention(id); toast.success('Subvention supprimée'); } };

  const handleExportSubventionsExcel = () => {
    generateExcelAnnuel(selectedYear, { transactions, persons, participations, subventions, actifs });
    toast.success('Export Excel généré');
  };

  const handleAddPartenaire    = (p: Omit<Partenaire, 'id'>)         => { addPartenaire(p); toast.success('Partenaire ajouté'); };
  const handleUpdatePartenaire = (id: string, u: Partial<Partenaire>)=> { updatePartenaire(id, u); toast.success('Partenaire mis à jour'); };
  const handleDeletePartenaire = (id: string)                        => { if (confirm('Supprimer ce partenaire ?')) { deletePartenaire(id); toast.success('Partenaire supprimé'); } };

  const handleGenerateExcel = (mois: number, annee: number) => {
    generateExcel({ transactions: getTransactionsByPeriod(mois, annee), persons, mois, annee });
    toast.success('Rapport mensuel généré');
  };

  const handleGenerateExcelAnnuel = (annee: number) => {
    generateExcelAnnuel(annee, { transactions: getTransactionsByYear(annee), persons, participations, subventions, actifs });
    toast.success(`Rapport annuel ${annee} généré`);
  };

  const handleImportJSON = (json: string): boolean => {
    const success = importFromJSON(json);
    if (success) toast.success('Données importées');
    else toast.error("Erreur lors de l'importation");
    return success;
  };

  const handleGenererEcritures = () => {
    const txsSansEcriture = transactions.filter(tx => !ecritures.some(e => e.transactionId === tx.id));
    txsSansEcriture.forEach(tx => {
      const lignes = genererEcritureDepuisTransaction(tx);
      if (lignes.length > 0) {
        const journal: 'VTE' | 'ACH' | 'BNQ' | 'CAI' | 'OD' =
          tx.type === 'depense' ? 'ACH' : tx.type === 'adhesion' ? 'BNQ' : 'VTE';
        addEcriture({ date: tx.date, libelle: tx.description || tx.type, lignes, transactionId: tx.id, journalCode: journal });
      }
    });
    toast.success('Écritures comptables générées');
  };

  const urlEstSure = (url: string | undefined): boolean => {
    if (!url) return false;
    try { const p = new URL(url); return p.protocol === 'https:' || p.protocol === 'http:'; }
    catch { return false; }
  };

  const logoNode = params.logoUrl && urlEstSure(params.logoUrl) ? (
    <img src={params.logoUrl} alt="Logo" className="h-8 w-8 rounded object-contain"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  ) : (
    <div className="bg-[#1E3A5F] p-1.5 rounded-lg">
      <BarChart3 className="h-5 w-5 text-white" />
    </div>
  );

  return (
    <div className="h-full bg-background flex">
      <Toaster position="top-right" richColors />

      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
      )}

      {isLocked && params.pinHash && (
        <PinLock pinHash={params.pinHash} onUnlock={() => setIsLocked(false)} />
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
        logoNode={logoNode}
        nomAssociation={params.nom || 'Mon association'}
        isDark={isDark}
        onToggleTheme={() => setIsDark(v => !v)}
      />

      {/* Zone principale */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <WarningBanner hasSeenWarning={hasSeenWarning} onMarkAsSeen={markWarningAsSeen} />

        {/* Topbar */}
        <header className="bg-card border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{PAGE_TITLES[activeTab]}</h1>
            <p className="text-xs text-muted-foreground capitalize">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {alertes.length > 0 && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">
              {alertes.length} alerte{alertes.length > 1 ? 's' : ''}
            </span>
          )}
        </header>

        {/* Contenu */}
        <main className="flex-1 overflow-auto p-6 space-y-4">
          <AlertsPanel alertes={alertes} />
          <div className={activeTab === 'settings' ? 'max-w-3xl mx-auto' : 'space-y-0'}>

            {activeTab === 'dashboard' && (
              <Dashboard
                kpiPersonnes={kpiPersonnes}
                kpiFinances={kpiFinances}
                kpiCTF={kpiCTF}
                kpiSubventions={kpiSubventions}
                scoreSante={scoreSante}
                projectionTresorerie={projectionTresorerie}
                evenementsPrev={evenementsPrev}
                onAddEvenementPrev={addEvenementPrev}
                onDeleteEvenementPrev={deleteEvenementPrev}
                kpisCustom={kpisCustom}
                nbSessionsMentorat={sessionsMentorat.length}
                heuresTotalesMentorat={sessionsMentorat.filter(s => s.statut === 'realisee').reduce((acc, s) => acc + s.dureeMinutes, 0)}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            )}

            {activeTab === 'persons' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-6">
                    <PersonForm tarifsAdhesion={params.tarifsAdhesion} onSubmit={handleAddPerson} />
                    <HelloAssoImport persons={persons} onImport={handleHelloAssoImport} />
                  </div>
                  <div className="lg:col-span-2">
                    <PersonList persons={persons} tarifsAdhesion={params.tarifsAdhesion} onDelete={handleDeletePerson} onEdit={setEditingPerson} />
                  </div>
                </div>
                <PersonEditModal person={editingPerson} isOpen={!!editingPerson} onClose={() => setEditingPerson(null)} onSave={handleSavePerson} tarifsAdhesion={params.tarifsAdhesion} />
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <TransactionForm persons={persons} onSubmit={handleAddTransaction} />
                  </div>
                  <div className="lg:col-span-2">
                    <TransactionList transactions={transactions} persons={persons} onDelete={handleDeleteTransaction} onEdit={setEditingTransaction} />
                  </div>
                </div>
                <TransactionEditModal transaction={editingTransaction} isOpen={!!editingTransaction} onClose={() => setEditingTransaction(null)} onSave={handleSaveTransaction} persons={persons} />
              </div>
            )}

            {activeTab === 'participations' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-6">
                    <ParticipationForm persons={persons} onSubmit={handleAddParticipation} />
                    <DiscordImport persons={persons} onImport={handleDiscordImport} />
                  </div>
                  <div className="lg:col-span-2">
                    <ParticipationList participations={participations} persons={persons} onDelete={handleDeleteParticipation} onEdit={setEditingParticipation} />
                  </div>
                </div>
                <ParticipationEditModal participation={editingParticipation} isOpen={!!editingParticipation} onClose={() => setEditingParticipation(null)} onSave={handleSaveParticipation} persons={persons} />
              </div>
            )}

            {activeTab === 'bilan' && (
              <BilanPage actifs={actifs} passifs={passifs} onAddActif={addActif} onDeleteActif={deleteActif} onAddPassif={addPassif} onUpdatePassif={updatePassif} onDeletePassif={deletePassif} kpiBilan={kpiBilan} />
            )}

            {activeTab === 'subventions' && (
              <SubventionsPage subventions={subventions} onAdd={handleAddSubvention} onUpdate={handleUpdateSubvention} onDelete={handleDeleteSubvention} onExportExcel={handleExportSubventionsExcel} />
            )}

            {activeTab === 'ctf' && (
              <CTFPage ctfEvents={ctfEvents} persons={persons} onAdd={handleAddCTF} onUpdate={handleUpdateCTF} onDelete={handleDeleteCTF} />
            )}

            {activeTab === 'partenaires' && (
              <PartenairesPage partenaires={partenaires} onAdd={handleAddPartenaire} onUpdate={handleUpdatePartenaire} onDelete={handleDeletePartenaire} />
            )}

            {activeTab === 'mentorat' && (
              <MentoratPage sessions={sessionsMentorat} persons={persons} onAdd={addSessionMentorat} onUpdate={updateSessionMentorat} onDelete={deleteSessionMentorat} />
            )}

            {activeTab === 'kpi' && (
              <KPIManager kpisCustom={kpisCustom} onAdd={addKPICustom} onUpdate={updateKPICustom} onDelete={deleteKPICustom} />
            )}

            {activeTab === 'comptabilite' && (
              <ComptabiliteDouble ecritures={ecritures} transactions={transactions} onDelete={deleteEcriture} onGenererDepuisTransactions={handleGenererEcritures} />
            )}

            {activeTab === 'certificats' && (
              <CertificatGenerator persons={persons} ctfEvents={ctfEvents} sessionsMentorat={sessionsMentorat} params={params} />
            )}

            {activeTab === 'visuels' && (
              <VisuelsRS kpiFinances={kpiFinances} kpiPersonnes={kpiPersonnes} ctfEvents={ctfEvents} scoreSante={scoreSante} params={params} />
            )}

            {activeTab === 'settings' && (
              <DataManagement
                params={params}
                onUpdateParams={updateParams}
                onExportJSON={exportToJSON}
                onImportJSON={handleImportJSON}
                onGenerateExcel={handleGenerateExcel}
                onGenerateExcelAnnuel={handleGenerateExcelAnnuel}
              />
            )}

          </div>
        </main>

        <footer className="bg-card border-t border-border px-6 py-3 shrink-0">
          <p className="text-center text-xs text-muted-foreground">
            Gestion comptable associative · Données stockées localement dans votre navigateur
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
