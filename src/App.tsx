import { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored ? stored === 'dark' : false;
  });
  const [isLocked, setIsLocked] = useState(false);

  // Appliquer le thème sur <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_done');
  });
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

  const handleToggleTheme = () => setIsDark(v => !v);

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

  const kpiPersonnes = calculateKPIPersonnes();
  const kpiFinances = calculateKPIFinances();
  const kpiBilan = calculateKPIBilan();
  const kpiCTF = calculateKPICTF();
  const kpiSubventions = calculateKPISubventions();
  const alertes = calculateAlertes();
  const scoreSante = calculateScoreSante();
  const projectionTresorerie = calculateProjectionTresorerie();

  const handleAddPerson = (personData: Omit<Person, 'id' | 'dateInscription'>) => {
    addPerson({ ...personData, dateInscription: new Date().toISOString().split('T')[0] });
    toast.success('Personne ajoutée avec succès');
  };

  const handleDeletePerson = (id: string) => {
    if (confirm('Supprimer cette personne ? Toutes ses transactions et participations seront également supprimées.')) {
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
    let created = 0;
    let updated = 0;
    personsData.forEach((personData) => {
      const existing = getPersonByEmail(personData.email || '');
      if (existing) {
        updatePerson(existing.id, {
          ...personData,
          dateDerniereCotisation:
            personData.dateDerniereCotisation || existing.dateDerniereCotisation,
        });
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
    let matched = 0;
    let unmatched = 0;
    discordData.forEach((data) => {
      const person = getPersonByDiscordId(data.idDiscord);
      if (person) {
        updatePerson(person.id, {
          kpiDiscord: {
            idDiscord: data.idDiscord,
            nombreActivites: data.nombreActivites,
            derniereActivite: data.derniereActivite,
          },
        });
        matched++;
      } else {
        unmatched++;
      }
    });
    toast.success(`Import Discord : ${matched} membres mis à jour, ${unmatched} IDs non trouvés`);
    return { matched, unmatched };
  };

  const handleAddTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    addTransaction(transactionData);
    const label =
      transactionData.type === 'depense' ? 'Dépense' :
      transactionData.type === 'adhesion' ? 'Adhésion' :
      transactionData.type === 'don' ? 'Don' : 'Vente';
    toast.success(`${label} enregistrée avec succès`);
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
    toast.success('Participation enregistrée avec succès');
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

  const handleAddCTF = (ctf: Omit<CTFEvent, 'id'>) => {
    addCTFEvent(ctf);
    toast.success('Événement CTF ajouté');
  };

  const handleUpdateCTF = (id: string, updates: Partial<CTFEvent>) => {
    updateCTFEvent(id, updates);
    toast.success('Événement CTF mis à jour');
  };

  const handleDeleteCTF = (id: string) => {
    if (confirm('Supprimer cet événement CTF ?')) {
      deleteCTFEvent(id);
      toast.success('Événement CTF supprimé');
    }
  };

  const handleAddSubvention = (s: Omit<Subvention, 'id'>) => {
    addSubvention(s);
    toast.success('Subvention ajoutée');
  };

  const handleUpdateSubvention = (id: string, updates: Partial<Subvention>) => {
    updateSubvention(id, updates);
    toast.success('Subvention mise à jour');
  };

  const handleDeleteSubvention = (id: string) => {
    if (confirm('Supprimer cette subvention ?')) {
      deleteSubvention(id);
      toast.success('Subvention supprimée');
    }
  };

  const handleExportSubventionsExcel = () => {
    generateExcelAnnuel(selectedYear, { transactions, persons, participations, subventions, actifs });
    toast.success('Export Excel généré');
  };

  const handleAddPartenaire = (p: Omit<Partenaire, 'id'>) => {
    addPartenaire(p);
    toast.success('Partenaire ajouté');
  };

  const handleUpdatePartenaire = (id: string, updates: Partial<Partenaire>) => {
    updatePartenaire(id, updates);
    toast.success('Partenaire mis à jour');
  };

  const handleDeletePartenaire = (id: string) => {
    if (confirm('Supprimer ce partenaire ?')) {
      deletePartenaire(id);
      toast.success('Partenaire supprimé');
    }
  };

  const handleGenerateExcel = (mois: number, annee: number) => {
    generateExcel({ transactions: getTransactionsByPeriod(mois, annee), persons, mois, annee });
    toast.success('Rapport mensuel généré');
  };

  const handleGenerateExcelAnnuel = (annee: number) => {
    generateExcelAnnuel(annee, {
      transactions: getTransactionsByYear(annee),
      persons,
      participations,
      subventions,
      actifs,
    });
    toast.success(`Rapport annuel ${annee} généré`);
  };

  const handleImportJSON = (json: string): boolean => {
    const success = importFromJSON(json);
    if (success) {
      toast.success('Données importées avec succès');
    } else {
      toast.error("Erreur lors de l'importation");
    }
    return success;
  };


  const urlEstSure = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  };

  const headerIcon = params.logoUrl && urlEstSure(params.logoUrl) ? (
    <img
      src={params.logoUrl}
      alt="Logo association"
      className="h-10 w-10 rounded object-contain"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  ) : (
    <div className="bg-[#1E3A5F] p-2 rounded-lg">
      <BarChart3 className="h-6 w-6 text-white" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      {showOnboarding && (
        <Onboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {isLocked && params.pinHash && (
        <PinLock pinHash={params.pinHash} onUnlock={() => setIsLocked(false)} />
      )}

      <WarningBanner hasSeenWarning={hasSeenWarning} onMarkAsSeen={markWarningAsSeen} />

      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {headerIcon}
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {params.nom || 'Association Comptabilité'}
                </h1>
                <p className="text-xs text-muted-foreground">Gestion comptable et analytique</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden md:block">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <ThemeToggle isDark={isDark} onToggle={handleToggleTheme} />
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Panneau d'alertes (affiché uniquement si alertes présentes) */}
        <div className="mb-6">
          <AlertsPanel alertes={alertes} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

          {/* Navigation — 9 onglets */}
          <TabsList className="grid w-full grid-cols-14 bg-card border border-border p-1">
            {[
              { value: 'dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
              { value: 'persons',       icon: Users,           label: 'Personnes' },
              { value: 'transactions',  icon: Receipt,         label: 'Transactions' },
              { value: 'participations',icon: Calendar,        label: 'Activités' },
              { value: 'bilan',         icon: Scale,           label: 'Bilan' },
              { value: 'subventions',   icon: FileText,        label: 'Subventions' },
              { value: 'ctf',           icon: Trophy,          label: 'CTF' },
              { value: 'partenaires',   icon: Handshake,       label: 'Partenaires' },
              { value: 'mentorat',      icon: GraduationCap,   label: 'Mentorat' },
      { value: 'kpi',           icon: Sliders,         label: 'Mes KPIs' },
      { value: 'comptabilite',  icon: BookOpen,         label: 'Comptabilité' },
      { value: 'certificats',   icon: Award,           label: 'Certificats' },
      { value: 'visuels',       icon: ImageIcon,       label: 'Visuels RS' },
      { value: 'settings',      icon: Settings,        label: 'Paramètres' },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1 text-xs"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Dashboard ─────────────────────────────────────────────── */}
          <TabsContent value="dashboard" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Tableau de bord</h2>
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
          </TabsContent>

          {/* ── Personnes ─────────────────────────────────────────────── */}
          <TabsContent value="persons" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Gestion des personnes</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <PersonForm tarifsAdhesion={params.tarifsAdhesion} onSubmit={handleAddPerson} />
                <HelloAssoImport persons={persons} onImport={handleHelloAssoImport} />
              </div>
              <div className="lg:col-span-2">
                <PersonList
                  persons={persons}
                  tarifsAdhesion={params.tarifsAdhesion}
                  onDelete={handleDeletePerson}
                  onEdit={setEditingPerson}
                />
              </div>
            </div>
            <PersonEditModal
              person={editingPerson}
              isOpen={!!editingPerson}
              onClose={() => setEditingPerson(null)}
              onSave={handleSavePerson}
              tarifsAdhesion={params.tarifsAdhesion}
            />
          </TabsContent>

          {/* ── Transactions ──────────────────────────────────────────── */}
          <TabsContent value="transactions" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Gestion des transactions</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <TransactionForm persons={persons} onSubmit={handleAddTransaction} />
              </div>
              <div className="lg:col-span-2">
                <TransactionList
                  transactions={transactions}
                  persons={persons}
                  onDelete={handleDeleteTransaction}
                  onEdit={setEditingTransaction}
                />
              </div>
            </div>
            <TransactionEditModal
              transaction={editingTransaction}
              isOpen={!!editingTransaction}
              onClose={() => setEditingTransaction(null)}
              onSave={handleSaveTransaction}
              persons={persons}
            />
          </TabsContent>

          {/* ── Activités ─────────────────────────────────────────────── */}
          <TabsContent value="participations" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Gestion des activités</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <ParticipationForm persons={persons} onSubmit={handleAddParticipation} />
                <DiscordImport persons={persons} onImport={handleDiscordImport} />
              </div>
              <div className="lg:col-span-2">
                <ParticipationList
                  participations={participations}
                  persons={persons}
                  onDelete={handleDeleteParticipation}
                  onEdit={setEditingParticipation}
                />
              </div>
            </div>
            <ParticipationEditModal
              participation={editingParticipation}
              isOpen={!!editingParticipation}
              onClose={() => setEditingParticipation(null)}
              onSave={handleSaveParticipation}
              persons={persons}
            />
          </TabsContent>

          {/* ── Bilan ─────────────────────────────────────────────────── */}
          <TabsContent value="bilan" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Bilan & Stocks</h2>
            <BilanPage
              actifs={actifs}
              passifs={passifs}
              onAddActif={addActif}
              onDeleteActif={deleteActif}
              onAddPassif={addPassif}
              onUpdatePassif={updatePassif}
              onDeletePassif={deletePassif}
              kpiBilan={kpiBilan}
            />
          </TabsContent>

          {/* ── Subventions ───────────────────────────────────────────── */}
          <TabsContent value="subventions" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Subventions & Financements</h2>
            <SubventionsPage
              subventions={subventions}
              onAdd={handleAddSubvention}
              onUpdate={handleUpdateSubvention}
              onDelete={handleDeleteSubvention}
              onExportExcel={handleExportSubventionsExcel}
            />
          </TabsContent>

          {/* ── CTF ───────────────────────────────────────────────────── */}
          <TabsContent value="ctf" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">CTF & Compétitions</h2>
            <CTFPage
              ctfEvents={ctfEvents}
              persons={persons}
              onAdd={handleAddCTF}
              onUpdate={handleUpdateCTF}
              onDelete={handleDeleteCTF}
            />
          </TabsContent>

          {/* ── Partenaires ───────────────────────────────────────────── */}
          <TabsContent value="partenaires" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Partenaires & Sponsors</h2>
            <PartenairesPage
              partenaires={partenaires}
              onAdd={handleAddPartenaire}
              onUpdate={handleUpdatePartenaire}
              onDelete={handleDeletePartenaire}
            />
          </TabsContent>

          {/* ── Mentorat ─────────────────────────────────────────────── */}
          <TabsContent value="mentorat" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Suivi du mentorat</h2>
            <MentoratPage
              sessions={sessionsMentorat}
              persons={persons}
              onAdd={addSessionMentorat}
              onUpdate={updateSessionMentorat}
              onDelete={deleteSessionMentorat}
            />
          </TabsContent>

          {/* ── KPIs personnalisés ────────────────────────────────────────── */}
          <TabsContent value="kpi" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Indicateurs personnalisés</h2>
            <KPIManager
              kpisCustom={kpisCustom}
              onAdd={addKPICustom}
              onUpdate={updateKPICustom}
              onDelete={deleteKPICustom}
            />
          </TabsContent>

          {/* ── Comptabilité double entrée ─────────────────────────── */}
          <TabsContent value="comptabilite" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Comptabilité — Partie double</h2>
            <ComptabiliteDouble
              ecritures={ecritures}
              transactions={transactions}
              persons={persons}
              onDelete={deleteEcriture}
              onGenererDepuisTransactions={handleGenererEcritures}
            />
          </TabsContent>

          {/* ── Certificats ─────────────────────────────────────────── */}
          <TabsContent value="certificats" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Générateur de certificats</h2>
            <CertificatGenerator
              persons={persons}
              ctfEvents={ctfEvents}
              sessionsMentorat={sessionsMentorat}
              params={params}
            />
          </TabsContent>

          {/* ── Visuels RS ────────────────────────────────────────────────── */}
          <TabsContent value="visuels" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Visuels pour les réseaux sociaux</h2>
            <VisuelsRS
              kpiFinances={kpiFinances}
              kpiPersonnes={kpiPersonnes}
              ctfEvents={ctfEvents}
              scoreSante={scoreSante}
              params={params}
            />
          </TabsContent>

          {/* ── Paramètres ────────────────────────────────────────────── */}
          <TabsContent value="settings" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Paramètres et exports</h2>
            <div className="max-w-2xl">
              <DataManagement
                params={params}
                onUpdateParams={updateParams}
                onExportJSON={exportToJSON}
                onImportJSON={handleImportJSON}
                onGenerateExcel={handleGenerateExcel}
                onGenerateExcelAnnuel={handleGenerateExcelAnnuel}
              />
            </div>
          </TabsContent>

        </Tabs>
      </main>

      <footer className="bg-card border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Application de gestion comptable pour association — Données stockées localement
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
