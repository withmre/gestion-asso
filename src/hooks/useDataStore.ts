import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  Person,
  Transaction,
  Participation,
  CTFEvent,
  Subvention,
  Partenaire,
  TarifAdhesion,
  Actif,
  Passif,
  DataStore,
  KPIPersonnes,
  KPIFinances,
  KPIBilan,
  KPICTF,
  KPISubventions,
  Alerte,
  AssociationParams,
  EcritureComptable,
  EvenementPrevisionnel,
  KPICustom,
  ScoreSante,
  ProjectionTresorerie,
  LigneEcriture,
  SessionMentorat,
} from '@/types';

const STORAGE_KEY = 'association_comptabilite_data_v3';
const WARNING_KEY = 'association_warning_shown_v3';

const tarifsParDefaut: TarifAdhesion[] = [
  { id: uuidv4(), libelle: 'Tarif standard', montant: 30, estActif: true },
  { id: uuidv4(), libelle: 'Tarif étudiant', montant: 15, estActif: true },
  { id: uuidv4(), libelle: 'Tarif bienfaiteur', montant: 60, estActif: true },
];

const paramsParDefaut: AssociationParams = {
  typeAdhesion: 'annuelle_civile',
  tarifsAdhesion: tarifsParDefaut,
};

const storeVide: DataStore = {
  persons: [],
  transactions: [],
  participations: [],
  ctfEvents: [],
  subventions: [],
  partenaires: [],
  actifs: [],
  passifs: [],
  ecritures: [],
  evenementsPrev: [],
  kpisCustom: [],
  sessionsMentorat: [],
  params: paramsParDefaut,
};

export function useDataStore() {
  const [data, setData] = useState<DataStore>(storeVide);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasSeenWarning, setHasSeenWarning] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const warningSeen = localStorage.getItem(WARNING_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData({
          ...storeVide,
          ...parsed,
          params: { ...paramsParDefaut, ...parsed.params },
        });
      } catch (e) {
        console.error('Impossible de charger les données locales :', e);
      }
    }

    setHasSeenWarning(warningSeen === 'true');
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const markWarningAsSeen = useCallback(() => {
    localStorage.setItem(WARNING_KEY, 'true');
    setHasSeenWarning(true);
  }, []);

  const updateParams = useCallback((updates: Partial<AssociationParams>) => {
    setData(prev => ({ ...prev, params: { ...prev.params, ...updates } }));
  }, []);

  const addTarifAdhesion = useCallback((tarif: Omit<TarifAdhesion, 'id'>): TarifAdhesion => {
    const nouveau = { ...tarif, id: uuidv4() };
    setData(prev => ({
      ...prev,
      params: { ...prev.params, tarifsAdhesion: [...prev.params.tarifsAdhesion, nouveau] },
    }));
    return nouveau;
  }, []);

  const updateTarifAdhesion = useCallback((id: string, updates: Partial<TarifAdhesion>) => {
    setData(prev => ({
      ...prev,
      params: {
        ...prev.params,
        tarifsAdhesion: prev.params.tarifsAdhesion.map(t => t.id === id ? { ...t, ...updates } : t),
      },
    }));
  }, []);

  const deleteTarifAdhesion = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      params: {
        ...prev.params,
        tarifsAdhesion: prev.params.tarifsAdhesion.filter(t => t.id !== id),
      },
    }));
  }, []);

  const addPerson = useCallback((person: Omit<Person, 'id'>): Person => {
    const nouveau = { ...person, id: uuidv4() };
    setData(prev => ({ ...prev, persons: [...prev.persons, nouveau] }));
    return nouveau;
  }, []);

  const updatePerson = useCallback((id: string, updates: Partial<Person>) => {
    setData(prev => ({
      ...prev,
      persons: prev.persons.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const deletePerson = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      persons: prev.persons.filter(p => p.id !== id),
      transactions: prev.transactions.filter(t => t.personId !== id),
      participations: prev.participations.filter(p => p.personId !== id),
      ctfEvents: prev.ctfEvents.map(ctf => ({
        ...ctf,
        participants: ctf.participants.filter(pid => pid !== id),
      })),
    }));
  }, []);

  const getPersonById = useCallback((id: string) => {
    return data.persons.find(p => p.id === id);
  }, [data.persons]);

  const getPersonByEmail = useCallback((email: string) => {
    return data.persons.find(p => p.email?.toLowerCase() === email.toLowerCase());
  }, [data.persons]);

  const getPersonByDiscordId = useCallback((discordId: string) => {
    return data.persons.find(p => p.kpiDiscord?.idDiscord === discordId);
  }, [data.persons]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>): Transaction => {
    const nouveau = { ...tx, id: uuidv4() };
    setData(prev => ({ ...prev, transactions: [...prev.transactions, nouveau] }));
    return nouveau;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  }, []);

  const addParticipation = useCallback((p: Omit<Participation, 'id'>): Participation => {
    const nouveau = { ...p, id: uuidv4() };
    setData(prev => ({ ...prev, participations: [...prev.participations, nouveau] }));
    return nouveau;
  }, []);

  const updateParticipation = useCallback((id: string, updates: Partial<Participation>) => {
    setData(prev => ({
      ...prev,
      participations: prev.participations.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const deleteParticipation = useCallback((id: string) => {
    setData(prev => ({ ...prev, participations: prev.participations.filter(p => p.id !== id) }));
  }, []);

  const addCTFEvent = useCallback((ctf: Omit<CTFEvent, 'id'>): CTFEvent => {
    const nouveau = { ...ctf, id: uuidv4() };
    setData(prev => ({ ...prev, ctfEvents: [...prev.ctfEvents, nouveau] }));
    return nouveau;
  }, []);

  const updateCTFEvent = useCallback((id: string, updates: Partial<CTFEvent>) => {
    setData(prev => ({
      ...prev,
      ctfEvents: prev.ctfEvents.map(ctf => ctf.id === id ? { ...ctf, ...updates } : ctf),
    }));
  }, []);

  const deleteCTFEvent = useCallback((id: string) => {
    setData(prev => ({ ...prev, ctfEvents: prev.ctfEvents.filter(c => c.id !== id) }));
  }, []);

  const addSubvention = useCallback((s: Omit<Subvention, 'id'>): Subvention => {
    const nouveau = { ...s, id: uuidv4() };
    setData(prev => ({ ...prev, subventions: [...prev.subventions, nouveau] }));
    return nouveau;
  }, []);

  const updateSubvention = useCallback((id: string, updates: Partial<Subvention>) => {
    setData(prev => ({
      ...prev,
      subventions: prev.subventions.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const deleteSubvention = useCallback((id: string) => {
    setData(prev => ({ ...prev, subventions: prev.subventions.filter(s => s.id !== id) }));
  }, []);

  const addPartenaire = useCallback((p: Omit<Partenaire, 'id'>): Partenaire => {
    const nouveau = { ...p, id: uuidv4() };
    setData(prev => ({ ...prev, partenaires: [...prev.partenaires, nouveau] }));
    return nouveau;
  }, []);

  const updatePartenaire = useCallback((id: string, updates: Partial<Partenaire>) => {
    setData(prev => ({
      ...prev,
      partenaires: prev.partenaires.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const deletePartenaire = useCallback((id: string) => {
    setData(prev => ({ ...prev, partenaires: prev.partenaires.filter(p => p.id !== id) }));
  }, []);

  const addActif = useCallback((a: Omit<Actif, 'id'>): Actif => {
    const nouveau = { ...a, id: uuidv4() };
    setData(prev => ({ ...prev, actifs: [...prev.actifs, nouveau] }));
    return nouveau;
  }, []);

  const updateActif = useCallback((id: string, updates: Partial<Actif>) => {
    setData(prev => ({
      ...prev,
      actifs: prev.actifs.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  }, []);

  const deleteActif = useCallback((id: string) => {
    setData(prev => ({ ...prev, actifs: prev.actifs.filter(a => a.id !== id) }));
  }, []);

  const addPassif = useCallback((p: Omit<Passif, 'id'>): Passif => {
    const nouveau = { ...p, id: uuidv4() };
    setData(prev => ({ ...prev, passifs: [...prev.passifs, nouveau] }));
    return nouveau;
  }, []);

  const updatePassif = useCallback((id: string, updates: Partial<Passif>) => {
    setData(prev => ({
      ...prev,
      passifs: prev.passifs.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const deletePassif = useCallback((id: string) => {
    setData(prev => ({ ...prev, passifs: prev.passifs.filter(p => p.id !== id) }));
  }, []);

  const exportToJSON = useCallback((): string => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const importFromJSON = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed.persons) || !Array.isArray(parsed.transactions)) return false;
      setData({ ...storeVide, ...parsed, params: { ...paramsParDefaut, ...parsed.params } });
      return true;
    } catch {
      return false;
    }
  }, []);

  const calculateValeurNette = useCallback((actif: Actif): number => {
    if (!actif.dureeAmortissement || !actif.dateAcquisition || actif.type !== 'immobilisation') {
      return actif.valeur;
    }
    const anneesEcoulees =
      (new Date().getTime() - new Date(actif.dateAcquisition).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const tauxConsome = Math.min(anneesEcoulees / actif.dureeAmortissement, 1);
    return Math.max(0, Math.round(actif.valeur * (1 - tauxConsome) * 100) / 100);
  }, []);

  const calculateKPIPersonnes = useCallback((): KPIPersonnes => {
    const adherents = data.persons.filter(p => p.type === 'adherent');
    const membres = data.persons.filter(p => p.type === 'membre');
    const total = adherents.length + membres.length;

    const tauxConversion = total > 0 ? (adherents.length / total) * 100 : 0;

    const nbActivites = (personId: string) =>
      data.participations.filter(p => p.personId === personId).length;

    const moyenneActivitesParAdherent =
      adherents.length > 0
        ? adherents.reduce((s, p) => s + nbActivites(p.id), 0) / adherents.length
        : 0;

    const moyenneActivitesParMembre =
      membres.length > 0
        ? membres.reduce((s, p) => s + nbActivites(p.id), 0) / membres.length
        : 0;

    const anneeActuelle = new Date().getFullYear();
    const adherentsFideles = adherents.filter(a => {
      if (!a.dateDerniereCotisation) return false;
      return new Date(a.dateDerniereCotisation).getFullYear() >= anneeActuelle - 1;
    });
    const tauxFidelisation =
      adherents.length > 0 ? (adherentsFideles.length / adherents.length) * 100 : 0;

    const top5MembresActifs = data.persons
      .map(p => ({
        person: p,
        nbActivites: nbActivites(p.id),
        scoreDiscord: p.kpiDiscord?.nombreActivites || 0,
        scoreTotal: nbActivites(p.id) + (p.kpiDiscord?.nombreActivites || 0),
      }))
      .sort((a, b) => b.scoreTotal - a.scoreTotal)
      .slice(0, 5);

    return {
      totalAdherents: adherents.length,
      totalMembres: membres.length,
      tauxConversion,
      moyenneActivitesParAdherent,
      moyenneActivitesParMembre,
      tauxFidelisation,
      top5MembresActifs,
    };
  }, [data]);

  const calculateKPIFinances = useCallback((): KPIFinances => {
    const txs = data.transactions;

    const recettes = txs.filter(t => t.type !== 'depense');
    const depenses = txs.filter(t => t.type === 'depense');

    const chiffreAffairesTotal = recettes.reduce((s, t) => s + t.montant, 0);
    const totalDepenses = depenses.reduce((s, t) => s + t.montant, 0);

    const adhesions = txs.filter(t => t.type === 'adhesion').reduce((s, t) => s + t.montant, 0);
    const dons = txs.filter(t => t.type === 'don').reduce((s, t) => s + t.montant, 0);
    const ventes = txs.filter(t => t.type === 'vente').reduce((s, t) => s + t.montant, 0);

    const sumDepenseCat = (cat: string) =>
      depenses.filter(t => t.depenseCategorie === cat).reduce((s, t) => s + t.montant, 0);

    const repartitionDepenses = {
      achats: sumDepenseCat('achats'),
      fraisBancaires: sumDepenseCat('frais_bancaires'),
      prestations: sumDepenseCat('prestations'),
      loyer: sumDepenseCat('loyer'),
      charges: sumDepenseCat('charges'),
      autres: sumDepenseCat('autres'),
    };

    const sumVente = (cat: string) =>
      txs.filter(t => t.type === 'vente' && t.venteSousCategorie === cat).reduce((s, t) => s + t.montant, 0);

    const nbVentes = txs.filter(t => t.type === 'vente').length;
    const nbDons = txs.filter(t => t.type === 'don').length;

    const now = new Date();
    const evolutionMensuelle = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const moisLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      const meme = (t: Transaction) =>
        new Date(t.date).getMonth() === date.getMonth() &&
        new Date(t.date).getFullYear() === date.getFullYear();

      const rec = txs.filter(t => t.type !== 'depense' && meme(t)).reduce((s, t) => s + t.montant, 0);
      const dep = txs.filter(t => t.type === 'depense' && meme(t)).reduce((s, t) => s + t.montant, 0);
      return { mois: moisLabel, recettes: rec, depenses: dep, solde: rec - dep };
    });

    return {
      chiffreAffairesTotal,
      totalDepenses,
      soldeReel: chiffreAffairesTotal - totalDepenses,
      repartitionRevenus: { adhesions, dons, ventes },
      repartitionDepenses,
      caDetailleVentes: {
        formations: sumVente('formation'),
        evenementiel: sumVente('evenementiel'),
        vetements: sumVente('vetements'),
      },
      panierMoyen: nbVentes > 0 ? ventes / nbVentes : 0,
      donMoyen: nbDons > 0 ? dons / nbDons : 0,
      evolutionMensuelle,
    };
  }, [data]);

  const calculateKPIBilan = useCallback((): KPIBilan => {
    const actifsAvecNette = data.actifs.map(a => ({ ...a, valeurNette: calculateValeurNette(a) }));

    const totalActif = actifsAvecNette.reduce((s, a) => s + (a.valeurNette ?? a.valeur), 0);
    const totalPassif = data.passifs.filter(p => !p.estPaye).reduce((s, p) => s + p.montant, 0);

    return {
      totalActif,
      totalPassif,
      capitauxPropres: totalActif - totalPassif,
      tresorerie: actifsAvecNette.filter(a => a.type === 'tresorerie').reduce((s, a) => s + a.valeur, 0),
      valeurStocks: actifsAvecNette.filter(a => a.type === 'stock').reduce((s, a) => s + (a.valeurNette ?? a.valeur), 0),
      valeurImmobilisations: actifsAvecNette.filter(a => a.type === 'immobilisation').reduce((s, a) => s + a.valeur, 0),
      valeurNetteImmobilisations: actifsAvecNette.filter(a => a.type === 'immobilisation').reduce((s, a) => s + (a.valeurNette ?? a.valeur), 0),
    };
  }, [data, calculateValeurNette]);

  const calculateKPICTF = useCallback((): KPICTF => {
    const ctfs = data.ctfEvents;

    if (ctfs.length === 0) {
      return { totalCTF: 0, meilleurClassement: null, tauxParticipationMoyen: 0, top5Competiteurs: [], evolutionClassement: [] };
    }

    const avecClassement = ctfs.filter(c => c.classement);

    const meilleurClassement = avecClassement.length > 0
      ? avecClassement.reduce<{ rang: number; totalEquipes: number; nomCTF: string } | null>((best, ctf) => {
          if (!ctf.classement) return best;
          const ratio = ctf.classement.rang / ctf.classement.totalEquipes;
          if (!best || ratio < best.rang / best.totalEquipes) {
            return { ...ctf.classement, nomCTF: ctf.nom };
          }
          return best;
        }, null)
      : null;

    const compteParMembre = new Map<string, number>();
    ctfs.forEach(ctf => ctf.participants.forEach(pid => {
      compteParMembre.set(pid, (compteParMembre.get(pid) || 0) + 1);
    }));

    const top5Competiteurs = Array.from(compteParMembre.entries())
      .map(([personId, nbCTF]) => ({
        person: data.persons.find(p => p.id === personId) ?? { id: personId, nom: 'Inconnu', prenom: '', type: 'membre' as const, dateInscription: '', estAJourCotisation: false },
        nbCTF,
      }))
      .sort((a, b) => b.nbCTF - a.nbCTF)
      .slice(0, 5);

    return {
      totalCTF: ctfs.length,
      meilleurClassement,
      tauxParticipationMoyen: ctfs.reduce((s, c) => s + c.participants.length, 0) / ctfs.length,
      top5Competiteurs,
      evolutionClassement: avecClassement
        .map(ctf => ({ nom: ctf.nom, date: ctf.dateDebut, rang: ctf.classement!.rang, totalEquipes: ctf.classement!.totalEquipes }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    };
  }, [data.ctfEvents, data.persons]);

  const calculateKPISubventions = useCallback((): KPISubventions => {
    const subs = data.subventions;
    const obtenues = subs.filter(s => s.statut === 'obtenue');
    const refusees = subs.filter(s => s.statut === 'refusee');
    const decidees = obtenues.length + refusees.length;

    return {
      montantTotalObtenu: obtenues.reduce((s, x) => s + (x.montantObtenu || 0), 0),
      montantTotalDemande: subs.reduce((s, x) => s + x.montantDemande, 0),
      montantEnAttente: subs.filter(s => s.statut === 'en_cours').reduce((s, x) => s + x.montantDemande, 0),
      tauxAcceptation: decidees > 0 ? (obtenues.length / decidees) * 100 : 0,
      totalEnCours: subs.filter(s => s.statut === 'en_cours').length,
      totalObtenues: obtenues.length,
      totalRefusees: refusees.length,
    };
  }, [data.subventions]);

  const calculateAlertes = useCallback((): Alerte[] => {
    const alertes: Alerte[] = [];
    const maintenant = new Date();

    const joursRestants = (dateStr: string) =>
      Math.ceil((new Date(dateStr).getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24));

    data.persons.forEach(person => {
      if (person.type !== 'adherent' || !person.dateFinAdhesion) return;
      const jours = joursRestants(person.dateFinAdhesion);
      const nom = `${person.prenom} ${person.nom}`;

      if (jours < 0) {
        alertes.push({ id: `adhesion-${person.id}`, type: 'adhesion', niveau: 'danger', titre: `Adhésion de ${nom}`, message: `Expirée depuis ${Math.abs(jours)} jours`, dateEcheance: person.dateFinAdhesion });
      } else if (jours <= 7) {
        alertes.push({ id: `adhesion-${person.id}`, type: 'adhesion', niveau: 'warning', titre: `Adhésion de ${nom}`, message: `Expire dans ${jours} jours`, dateEcheance: person.dateFinAdhesion });
      } else if (jours <= 30) {
        alertes.push({ id: `adhesion-${person.id}`, type: 'adhesion', niveau: 'info', titre: `Adhésion de ${nom}`, message: `Expire dans ${jours} jours`, dateEcheance: person.dateFinAdhesion });
      }
    });

    data.passifs.filter(p => !p.estPaye && p.dateEcheance).forEach(passif => {
      const jours = joursRestants(passif.dateEcheance!);
      if (jours < 0) {
        alertes.push({ id: `passif-${passif.id}`, type: 'passif', niveau: 'danger', titre: `Dette : ${passif.nom}`, message: `Échéance dépassée de ${Math.abs(jours)} jours`, dateEcheance: passif.dateEcheance });
      } else if (jours <= 7) {
        alertes.push({ id: `passif-${passif.id}`, type: 'passif', niveau: 'warning', titre: `Dette : ${passif.nom}`, message: `Échéance dans ${jours} jours`, dateEcheance: passif.dateEcheance });
      }
    });

    data.subventions.forEach(sub => {
      if (sub.statut === 'a_deposer' && !sub.dateDepot) {
        alertes.push({ id: `sub-${sub.id}`, type: 'subvention', niveau: 'info', titre: `Subvention à déposer : ${sub.organisme}`, message: 'Aucune date de dépôt définie' });
      }
      if (sub.statut === 'en_cours' && sub.dateDepot) {
        const joursEcoules = Math.ceil((maintenant.getTime() - new Date(sub.dateDepot).getTime()) / (1000 * 60 * 60 * 24));
        if (joursEcoules > 90) {
          alertes.push({ id: `sub-${sub.id}`, type: 'subvention', niveau: 'warning', titre: `Subvention en attente : ${sub.organisme}`, message: `Sans réponse depuis ${joursEcoules} jours`, dateEcheance: sub.dateDepot });
        }
      }
    });

    const ordre = { danger: 0, warning: 1, info: 2 };
    return alertes.sort((a, b) => ordre[a.niveau] - ordre[b.niveau]);
  }, [data.persons, data.passifs, data.subventions]);

  const getTransactionsByPeriod = useCallback((mois: number, annee: number): Transaction[] => {
    return data.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === mois && d.getFullYear() === annee;
    });
  }, [data.transactions]);

  const getTransactionsByYear = useCallback((annee: number): Transaction[] => {
    return data.transactions.filter(t => new Date(t.date).getFullYear() === annee);
  }, [data.transactions]);


  // ── Écritures comptables ────────────────────────────────────────────────

  const addEcriture = useCallback((e: Omit<EcritureComptable, 'id'>): EcritureComptable => {
    const nouveau = { ...e, id: uuidv4() };
    setData(prev => ({ ...prev, ecritures: [...prev.ecritures, nouveau] }));
    return nouveau;
  }, []);

  const deleteEcriture = useCallback((id: string) => {
    setData(prev => ({ ...prev, ecritures: prev.ecritures.filter(e => e.id !== id) }));
  }, []);

  // ── Événements prévisionnels ────────────────────────────────────────────

  const addEvenementPrev = useCallback((e: Omit<EvenementPrevisionnel, 'id'>): EvenementPrevisionnel => {
    const nouveau = { ...e, id: uuidv4() };
    setData(prev => ({ ...prev, evenementsPrev: [...prev.evenementsPrev, nouveau] }));
    return nouveau;
  }, []);

  const deleteEvenementPrev = useCallback((id: string) => {
    setData(prev => ({ ...prev, evenementsPrev: prev.evenementsPrev.filter(e => e.id !== id) }));
  }, []);

  // ── KPIs personnalisés ──────────────────────────────────────────────────

  const addKPICustom = useCallback((k: Omit<KPICustom, 'id'>): KPICustom => {
    const nouveau = { ...k, id: uuidv4() };
    setData(prev => ({ ...prev, kpisCustom: [...prev.kpisCustom, nouveau] }));
    return nouveau;
  }, []);

  const updateKPICustom = useCallback((id: string, updates: Partial<KPICustom>) => {
    setData(prev => ({
      ...prev,
      kpisCustom: prev.kpisCustom.map(k => k.id === id ? { ...k, ...updates } : k),
    }));
  }, []);

  const deleteKPICustom = useCallback((id: string) => {
    setData(prev => ({ ...prev, kpisCustom: prev.kpisCustom.filter(k => k.id !== id) }));
  }, []);

  // ── Génération automatique d'écritures comptables ──────────────────────

  const genererEcritureDepuisTransaction = useCallback((tx: import('@/types').Transaction): LigneEcriture[] => {
    const lignes: LigneEcriture[] = [];
    if (tx.type === 'adhesion') {
      lignes.push({ compte: '512', libelle: 'Banque', debit: tx.montant, credit: 0 });
      lignes.push({ compte: '756', libelle: 'Cotisations', debit: 0, credit: tx.montant });
    } else if (tx.type === 'don') {
      lignes.push({ compte: '512', libelle: 'Banque', debit: tx.montant, credit: 0 });
      lignes.push({ compte: '758', libelle: 'Dons', debit: 0, credit: tx.montant });
    } else if (tx.type === 'vente') {
      const compte = tx.venteSousCategorie === 'formation' ? '706' : tx.venteSousCategorie === 'evenementiel' ? '708' : '707';
      lignes.push({ compte: '512', libelle: 'Banque', debit: tx.montant, credit: 0 });
      lignes.push({ compte, libelle: 'Vente', debit: 0, credit: tx.montant });
    } else if (tx.type === 'depense') {
      const compte = tx.depenseCategorie === 'frais_bancaires' ? '627'
        : tx.depenseCategorie === 'prestations' ? '622'
        : tx.depenseCategorie === 'loyer' ? '613'
        : tx.depenseCategorie === 'charges' ? '641'
        : '606';
      lignes.push({ compte, libelle: tx.description || 'Charge', debit: tx.montant, credit: 0 });
      lignes.push({ compte: '512', libelle: 'Banque', debit: 0, credit: tx.montant });
    }
    return lignes;
  }, []);

  // ── Score de santé associative ──────────────────────────────────────────

  const calculateScoreSante = useCallback((): ScoreSante => {
    const txs = data.transactions;
    const recettes = txs.filter(t => t.type !== 'depense').reduce((s, t) => s + t.montant, 0);
    const depenses = txs.filter(t => t.type === 'depense').reduce((s, t) => s + t.montant, 0);
    const solde = recettes - depenses;
    const tresorerie = data.actifs.filter(a => a.type === 'tresorerie').reduce((s, a) => s + a.valeur, 0);

    const adherents = data.persons.filter(p => p.type === 'adherent');
    const anneeActuelle = new Date().getFullYear();
    const adherentsFideles = adherents.filter(a => {
      if (!a.dateDerniereCotisation) return false;
      return new Date(a.dateDerniereCotisation).getFullYear() >= anneeActuelle - 1;
    });
    const tauxFidelisation = adherents.length > 0 ? adherentsFideles.length / adherents.length : 0;

    const now = new Date();
    const moisCourant = txs.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const aDesActivitesCeMois = data.participations.some(p => {
      const d = new Date(p.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const ratioDepenses = recettes > 0 ? depenses / recettes : 1;
    const subventionsEnCours = data.subventions.filter(s => s.statut === 'en_cours').length;

    const criteres = [
      {
        nom: 'Trésorerie positive',
        valeur: solde >= 0 && tresorerie >= 0,
        poids: 25,
        score: (solde >= 0 && tresorerie >= 0) ? 25 : 0,
        suggestion: solde < 0 ? 'Les dépenses dépassent les recettes. Réduisez les charges ou augmentez les recettes.' : undefined,
      },
      {
        nom: 'Taux de renouvellement > 70%',
        valeur: tauxFidelisation >= 0.7,
        poids: 20,
        score: tauxFidelisation >= 0.7 ? 20 : Math.round(tauxFidelisation * 20),
        suggestion: tauxFidelisation < 0.7 ? 'Relancez les adhérents non renouvelés avec un message personnalisé.' : undefined,
      },
      {
        nom: 'Activités ce mois',
        valeur: aDesActivitesCeMois || moisCourant.length > 0,
        poids: 15,
        score: (aDesActivitesCeMois || moisCourant.length > 0) ? 15 : 0,
        suggestion: !aDesActivitesCeMois ? 'Aucune activité ce mois. Planifiez un atelier ou un événement.' : undefined,
      },
      {
        nom: 'Subventions en cours',
        valeur: subventionsEnCours > 0 || data.subventions.some(s => s.statut === 'obtenue'),
        poids: 15,
        score: (subventionsEnCours > 0 || data.subventions.some(s => s.statut === 'obtenue')) ? 15 : 0,
        suggestion: subventionsEnCours === 0 ? 'Déposez des dossiers de subvention auprès de votre mairie ou région.' : undefined,
      },
      {
        nom: 'Ratio dépenses/recettes < 80%',
        valeur: ratioDepenses < 0.8,
        poids: 25,
        score: ratioDepenses < 0.8 ? 25 : ratioDepenses < 1 ? Math.round((1 - ratioDepenses) * 25 * 2) : 0,
        suggestion: ratioDepenses >= 0.8 ? `Ratio actuel : ${Math.round(ratioDepenses * 100)}%. Optimisez vos charges.` : undefined,
      },
    ];

    const score = criteres.reduce((s, c) => s + c.score, 0);
    const niveau: ScoreSante['niveau'] = score >= 70 ? 'ok' : score >= 40 ? 'warning' : 'danger';

    return { score, niveau, criteres };
  }, [data]);

  // ── Projection de trésorerie ────────────────────────────────────────────

  const calculateProjectionTresorerie = useCallback((): ProjectionTresorerie[] => {
    const now = new Date();
    const txs = data.transactions;

    // Calculer la moyenne des 6 derniers mois
    const moyennes = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const moisTxs = txs.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      return {
        recettes: moisTxs.filter(t => t.type !== 'depense').reduce((s, t) => s + t.montant, 0),
        depenses: moisTxs.filter(t => t.type === 'depense').reduce((s, t) => s + t.montant, 0),
      };
    });

    const moyRec = moyennes.reduce((s, m) => s + m.recettes, 0) / 6;
    const moyDep = moyennes.reduce((s, m) => s + m.depenses, 0) / 6;

    const tresorerieActuelle = data.actifs.filter(a => a.type === 'tresorerie').reduce((s, a) => s + a.valeur, 0);
    const soldeActuel = txs.filter(t => t.type !== 'depense').reduce((s, t) => s + t.montant, 0)
      - txs.filter(t => t.type === 'depense').reduce((s, t) => s + t.montant, 0);
    let soldeRef = tresorerieActuelle || soldeActuel;

    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      const moisLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

      const evtsMois = data.evenementsPrev.filter(e => {
        const ed = new Date(e.date);
        return ed.getMonth() === date.getMonth() && ed.getFullYear() === date.getFullYear();
      });

      const recEvts = evtsMois.filter(e => e.type === 'recette').reduce((s, e) => s + e.montant, 0);
      const depEvts = evtsMois.filter(e => e.type === 'depense').reduce((s, e) => s + e.montant, 0);

      const recTotal = moyRec + recEvts;
      const depTotal = moyDep + depEvts;
      soldeRef = soldeRef + recTotal - depTotal;

      return {
        mois: moisLabel,
        soldePrevu: Math.round(soldeRef),
        recettesPrevisionnelles: Math.round(recTotal),
        depensesPrevisionnelles: Math.round(depTotal),
        evenements: evtsMois,
      };
    });
  }, [data]);

  const addSessionMentorat = useCallback((s: Omit<SessionMentorat, 'id'>): SessionMentorat => {
    const nouveau = { ...s, id: uuidv4() };
    setData(prev => ({ ...prev, sessionsMentorat: [...prev.sessionsMentorat, nouveau] }));
    return nouveau;
  }, []);

  const updateSessionMentorat = useCallback((id: string, updates: Partial<SessionMentorat>) => {
    setData(prev => ({
      ...prev,
      sessionsMentorat: prev.sessionsMentorat.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const deleteSessionMentorat = useCallback((id: string) => {
    setData(prev => ({ ...prev, sessionsMentorat: prev.sessionsMentorat.filter(s => s.id !== id) }));
  }, []);

  return {
    data,
    isLoaded,
    hasSeenWarning,
    markWarningAsSeen,
    params: data.params,
    updateParams,
    tarifsAdhesion: data.params.tarifsAdhesion,
    addTarifAdhesion,
    updateTarifAdhesion,
    deleteTarifAdhesion,
    persons: data.persons,
    addPerson,
    updatePerson,
    deletePerson,
    getPersonById,
    getPersonByEmail,
    getPersonByDiscordId,
    transactions: data.transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    participations: data.participations,
    addParticipation,
    updateParticipation,
    deleteParticipation,
    ctfEvents: data.ctfEvents,
    addCTFEvent,
    updateCTFEvent,
    deleteCTFEvent,
    subventions: data.subventions,
    addSubvention,
    updateSubvention,
    deleteSubvention,
    partenaires: data.partenaires,
    addPartenaire,
    updatePartenaire,
    deletePartenaire,
    actifs: data.actifs,
    addActif,
    updateActif,
    deleteActif,
    calculateValeurNette,
    passifs: data.passifs,
    addPassif,
    updatePassif,
    deletePassif,
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
    ecritures: data.ecritures,
    addEcriture,
    deleteEcriture,
    genererEcritureDepuisTransaction,
    evenementsPrev: data.evenementsPrev,
    addEvenementPrev,
    deleteEvenementPrev,
    kpisCustom: data.kpisCustom,
    addKPICustom,
    updateKPICustom,
    deleteKPICustom,
    calculateScoreSante,
    calculateProjectionTresorerie,
    sessionsMentorat: data.sessionsMentorat,
    addSessionMentorat,
    updateSessionMentorat,
    deleteSessionMentorat,
  };
}
