import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import type {
  Transaction,
  Person,
  Participation,
  Subvention,
  VenteSousCategorie,
  DepenseCategorie,
  DataStore,
} from '@/types';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '';

const depenseLabels: Record<DepenseCategorie, string> = {
  achats: 'Achats',
  frais_bancaires: 'Frais bancaires',
  prestations: 'Prestations',
  loyer: 'Loyer',
  charges: 'Charges',
  autres: 'Autres',
};

const venteLabels: Record<VenteSousCategorie, string> = {
  formation: 'Formation',
  evenementiel: 'Événementiel',
  vetements: 'Vêtements',
};

const subventionStatutLabels: Record<string, string> = {
  a_deposer: 'À déposer',
  en_cours: 'En cours',
  obtenue: 'Obtenue',
  refusee: 'Refusée',
};

/** Applique une largeur de colonne à une feuille */
function setCols(ws: XLSX.WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map((wch) => ({ wch }));
}

/** Construit les feuilles communes Adhésions / Dons / Ventes / Dépenses */
function buildTransactionSheets(
  transactions: Transaction[],
  persons: Person[],
  wb: XLSX.WorkBook
) {
  const adhesions = transactions.filter((t) => t.type === 'adhesion');
  const dons = transactions.filter((t) => t.type === 'don');
  const ventes = transactions.filter((t) => t.type === 'vente');
  const depenses = transactions.filter((t) => t.type === 'depense');

  const personName = (id: string) => {
    const p = persons.find((x) => x.id === id);
    return p ? `${p.prenom} ${p.nom}` : 'Anonyme';
  };
  const personEmail = (id: string) => persons.find((x) => x.id === id)?.email || '';
  const personTel = (id: string) => persons.find((x) => x.id === id)?.telephone || '';

  const totalAdhesions = adhesions.reduce((s, t) => s + t.montant, 0);
  const totalDons = dons.reduce((s, t) => s + t.montant, 0);
  const totalVentes = ventes.reduce((s, t) => s + t.montant, 0);
  const totalDepenses = depenses.reduce((s, t) => s + t.montant, 0);

  const adhesionsData: (string | number)[][] = [
    ['DATE', 'MONTANT (€)', 'ADHÉRENT', 'EMAIL', 'TÉLÉPHONE', 'DATE DÉBUT', 'DATE FIN', 'DESCRIPTION'],
    ...adhesions.map((t) => [
      fmtDate(t.date),
      t.montant,
      personName(t.personId),
      personEmail(t.personId),
      personTel(t.personId),
      t.dateDebutAdhesion ? fmtDate(t.dateDebutAdhesion) : '',
      t.dateFinAdhesion ? fmtDate(t.dateFinAdhesion) : '',
      t.description || '',
    ]),
    [],
    ['TOTAL', totalAdhesions, '', '', '', '', '', ''],
  ];
  const wsAdhesions = XLSX.utils.aoa_to_sheet(adhesionsData);
  setCols(wsAdhesions, [12, 12, 22, 26, 15, 12, 12, 32]);
  XLSX.utils.book_append_sheet(wb, wsAdhesions, 'Adhésions');

  const donsData: (string | number)[][] = [
    ['DATE', 'MONTANT (€)', 'DONATEUR', 'EMAIL', 'TÉLÉPHONE', 'DESCRIPTION'],
    ...dons.map((t) => [
      fmtDate(t.date),
      t.montant,
      personName(t.personId),
      personEmail(t.personId),
      personTel(t.personId),
      t.description || '',
    ]),
    [],
    ['TOTAL', totalDons, '', '', '', ''],
  ];
  const wsDons = XLSX.utils.aoa_to_sheet(donsData);
  setCols(wsDons, [12, 12, 22, 26, 15, 40]);
  XLSX.utils.book_append_sheet(wb, wsDons, 'Dons');

  const ventesData: (string | number)[][] = [
    ['DATE', 'MONTANT (€)', 'CATÉGORIE', 'CLIENT', 'EMAIL', 'TÉLÉPHONE', 'DESCRIPTION'],
    ...ventes.map((t) => [
      fmtDate(t.date),
      t.montant,
      t.venteSousCategorie ? venteLabels[t.venteSousCategorie] : '',
      personName(t.personId),
      personEmail(t.personId),
      personTel(t.personId),
      t.description || '',
    ]),
    [],
    ['TOTAL', totalVentes, '', '', '', '', ''],
  ];
  const wsVentes = XLSX.utils.aoa_to_sheet(ventesData);
  setCols(wsVentes, [12, 12, 16, 22, 26, 15, 32]);
  XLSX.utils.book_append_sheet(wb, wsVentes, 'Ventes');

  const depensesData: (string | number)[][] = [
    ['DATE', 'MONTANT (€)', 'CATÉGORIE', 'DESCRIPTION'],
    ...depenses.map((t) => [
      fmtDate(t.date),
      t.montant,
      t.depenseCategorie ? depenseLabels[t.depenseCategorie] : 'Autres',
      t.description || '',
    ]),
    [],
    ['TOTAL', totalDepenses, '', ''],
  ];
  const wsDepenses = XLSX.utils.aoa_to_sheet(depensesData);
  setCols(wsDepenses, [12, 12, 20, 44]);
  XLSX.utils.book_append_sheet(wb, wsDepenses, 'Dépenses');

  return { totalAdhesions, totalDons, totalVentes, totalDepenses };
}

interface ExcelExportMensuelData {
  transactions: Transaction[];
  persons: Person[];
  mois: number;
  annee: number;
}

export function useExcelExport() {
  const generateExcel = useCallback((data: ExcelExportMensuelData) => {
    const { transactions, persons, mois, annee } = data;

    const wb = XLSX.utils.book_new();

    const { totalAdhesions, totalDons, totalVentes, totalDepenses } =
      buildTransactionSheets(transactions, persons, wb);

    const totalRecettes = totalAdhesions + totalDons + totalVentes;
    const solde = totalRecettes - totalDepenses;

    const periodeLabel = new Date(annee, mois).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });

    const syntheseData: (string | number)[][] = [
      ['SYNTHÈSE COMPTABLE', '', ''],
      [`Période : ${periodeLabel}`, '', ''],
      [],
      ['RECETTES', 'Montant (€)', 'Nb opérations'],
      ['Adhésions', totalAdhesions, transactions.filter((t) => t.type === 'adhesion').length],
      ['Dons', totalDons, transactions.filter((t) => t.type === 'don').length],
      ['Ventes', totalVentes, transactions.filter((t) => t.type === 'vente').length],
      ['TOTAL RECETTES', totalRecettes, ''],
      [],
      ['DÉPENSES', 'Montant (€)', 'Nb opérations'],
      ...(
        ['achats', 'frais_bancaires', 'prestations', 'loyer', 'charges', 'autres'] as DepenseCategorie[]
      ).map((cat) => {
        const items = transactions.filter((t) => t.type === 'depense' && t.depenseCategorie === cat);
        return [depenseLabels[cat], items.reduce((s, t) => s + t.montant, 0), items.length];
      }),
      ['TOTAL DÉPENSES', totalDepenses, transactions.filter((t) => t.type === 'depense').length],
      [],
      ['SOLDE NET', solde, ''],
      [],
      ['Détail ventes', '', ''],
      ...(['formation', 'evenementiel', 'vetements'] as VenteSousCategorie[]).map((cat) => {
        const items = transactions.filter((t) => t.type === 'vente' && t.venteSousCategorie === cat);
        return [venteLabels[cat], items.reduce((s, t) => s + t.montant, 0), items.length];
      }),
    ];

    const wsSynthese = XLSX.utils.aoa_to_sheet(syntheseData);
    setCols(wsSynthese, [28, 16, 16]);
    wb.SheetNames.unshift('Synthèse');
    wb.Sheets['Synthèse'] = wsSynthese;

    const fileName = `comptabilite_${periodeLabel.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, []);

  const generateExcelAnnuel = useCallback(
    (annee: number, store: Pick<DataStore, 'transactions' | 'persons' | 'participations' | 'subventions' | 'actifs'>) => {
      const { transactions, persons, participations, subventions, actifs } = store;

      const txAnnee = transactions.filter(
        (t) => new Date(t.date).getFullYear() === annee
      );
      const partAnnee = participations.filter(
        (p) => new Date(p.date).getFullYear() === annee
      );

      const wb = XLSX.utils.book_new();

      const { totalAdhesions, totalDons, totalVentes, totalDepenses } =
        buildTransactionSheets(txAnnee, persons, wb);

      const totalRecettes = totalAdhesions + totalDons + totalVentes;
      const solde = totalRecettes - totalDepenses;

      const tresorerie = actifs
        .filter((a) => a.type === 'tresorerie')
        .reduce((s, a) => s + a.valeur, 0);

      const subObtenues = subventions.filter((s) => s.statut === 'obtenue');
      const montantSubObtenu = subObtenues.reduce((s, x) => s + (x.montantObtenu || 0), 0);
      const tauxAcceptation =
        subventions.length > 0
          ? Math.round((subObtenues.length / subventions.length) * 100)
          : 0;

      const sources = [
        { nom: 'Adhésions', montant: totalAdhesions },
        { nom: 'Dons', montant: totalDons },
        { nom: 'Ventes', montant: totalVentes },
      ].sort((a, b) => b.montant - a.montant);

      const syntheseData: (string | number)[][] = [
        [`RAPPORT ANNUEL ${annee}`, '', ''],
        [],
        ['TRÉSORERIE', '', ''],
        ['Solde bancaire déclaré', fmt(tresorerie), ''],
        ['Recettes de l\'exercice', fmt(totalRecettes), ''],
        ['Dépenses de l\'exercice', fmt(totalDepenses), ''],
        ['Solde net de l\'exercice', fmt(solde), ''],
        [],
        ['RECETTES PAR CATÉGORIE', 'Montant (€)', 'Nb'],
        ['Adhésions', totalAdhesions, txAnnee.filter((t) => t.type === 'adhesion').length],
        ['Dons', totalDons, txAnnee.filter((t) => t.type === 'don').length],
        ['Ventes', totalVentes, txAnnee.filter((t) => t.type === 'vente').length],
        ['TOTAL RECETTES', totalRecettes, ''],
        [],
        ['DÉPENSES PAR CATÉGORIE', 'Montant (€)', 'Nb'],
        ...(['achats', 'frais_bancaires', 'prestations', 'loyer', 'charges', 'autres'] as DepenseCategorie[]).map(
          (cat) => {
            const items = txAnnee.filter((t) => t.type === 'depense' && t.depenseCategorie === cat);
            return [depenseLabels[cat], items.reduce((s, t) => s + t.montant, 0), items.length];
          }
        ),
        ['TOTAL DÉPENSES', totalDepenses, txAnnee.filter((t) => t.type === 'depense').length],
        [],
        ['TOP 3 SOURCES DE REVENUS', '', ''],
        ...sources.map((s, i) => [`${i + 1}. ${s.nom}`, fmt(s.montant), '']),
        [],
        ['SUBVENTIONS', '', ''],
        ['Montant total obtenu', fmt(montantSubObtenu), ''],
        ['Taux d\'acceptation', `${tauxAcceptation} %`, ''],
        ['Nombre de dossiers déposés', subventions.filter((s) => s.statut !== 'a_deposer').length, ''],
        [],
        ['ACTIVITÉS', '', ''],
        ['Nombre de participations enregistrées', partAnnee.length, ''],
        ['Nombre de formations', partAnnee.filter((p) => p.activiteType === 'formation').length, ''],
        ['Nombre d\'événements', partAnnee.filter((p) => p.activiteType === 'evenement').length, ''],
      ];

      const wsSynthese = XLSX.utils.aoa_to_sheet(syntheseData);
      setCols(wsSynthese, [36, 18, 10]);
      wb.SheetNames.unshift('Synthèse annuelle');
      wb.Sheets['Synthèse annuelle'] = wsSynthese;

      const activitesData: (string | number)[][] = [
        ['DATE', 'PARTICIPANT', 'TYPE', 'NOM DE L\'ACTIVITÉ', 'DESCRIPTION'],
        ...partAnnee
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((p) => {
            const person = persons.find((x) => x.id === p.personId);
            const typeLabel =
              p.activiteType === 'formation'
                ? 'Formation'
                : p.activiteType === 'evenement'
                ? 'Événement'
                : 'CTF';
            return [
              fmtDate(p.date),
              person ? `${person.prenom} ${person.nom}` : 'Inconnu',
              typeLabel,
              p.activiteNom,
              (p as { description?: string }).description || '',
            ];
          }),
      ];
      const wsActivites = XLSX.utils.aoa_to_sheet(activitesData);
      setCols(wsActivites, [12, 22, 12, 32, 40]);
      XLSX.utils.book_append_sheet(wb, wsActivites, 'Activités');

      const subventionsData: (string | number)[][] = [
        ['ORGANISME', 'INTITULÉ', 'MONTANT DEMANDÉ (€)', 'MONTANT OBTENU (€)', 'STATUT', 'DATE DÉPÔT', 'DATE RÉPONSE', 'NOTES'],
        ...subventions
          .sort((a, b) => new Date(b.dateDepot).getTime() - new Date(a.dateDepot).getTime())
          .map((s) => [
            s.organisme,
            s.intitule,
            s.montantDemande,
            s.montantObtenu ?? '',
            subventionStatutLabels[s.statut] || s.statut,
            fmtDate(s.dateDepot),
            s.dateReponse ? fmtDate(s.dateReponse) : '',
            s.notes || '',
          ]),
        [],
        ['TOTAL DEMANDÉ', subventions.reduce((s, x) => s + x.montantDemande, 0), '', montantSubObtenu, '', '', '', ''],
      ];
      const wsSubventions = XLSX.utils.aoa_to_sheet(subventionsData);
      setCols(wsSubventions, [24, 32, 20, 20, 14, 14, 14, 40]);
      XLSX.utils.book_append_sheet(wb, wsSubventions, 'Subventions');

      XLSX.writeFile(wb, `rapport_annuel_${annee}.xlsx`);
    },
    []
  );

  return { generateExcel, generateExcelAnnuel };
}
