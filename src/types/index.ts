export type PersonType = 'adherent' | 'membre' | 'anonyme';
export type TransactionType = 'adhesion' | 'don' | 'vente' | 'depense';
export type VenteSousCategorie = 'formation' | 'evenementiel' | 'vetements';
export type DepenseCategorie = 'achats' | 'frais_bancaires' | 'prestations' | 'loyer' | 'charges' | 'autres';
export type TypeAdhesion = 'annuelle_civile' | 'annuelle_coulante' | 'mensuelle';
export type ActifType = 'immobilisation' | 'stock' | 'tresorerie';
export type CTFPlateforme = 'HTB' | 'RootMe' | 'PicoCTF' | 'THM' | 'Autre';
export type CTFType = 'online' | 'onsite';
export type SubventionStatut = 'en_cours' | 'obtenue' | 'refusee' | 'a_deposer';
export type PartenaireType = 'technique' | 'financier' | 'media' | 'autre';

export interface Person {
  id: string;
  type: PersonType;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  dateInscription: string;
  estAJourCotisation: boolean;
  dateDerniereCotisation?: string;
  dateFinAdhesion?: string;
  kpiDiscord?: {
    idDiscord: string;
    nombreActivites: number;
    derniereActivite?: string;
    scoreActivite?: number;
  };
  tarifAdhesionId?: string;
  certifications?: string[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  montant: number;
  date: string;
  personId: string;
  description?: string;
  partenaireId?: string;
  venteSousCategorie?: VenteSousCategorie;
  depenseCategorie?: DepenseCategorie;
  dateDebutAdhesion?: string;
  dateFinAdhesion?: string;
}

export interface Participation {
  id: string;
  personId: string;
  activiteType: 'formation' | 'evenement' | 'ctf';
  activiteNom: string;
  date: string;
  description?: string;
}

export interface CTFEvent {
  id: string;
  nom: string;
  plateforme: CTFPlateforme;
  dateDebut: string;
  dateFin: string;
  type: CTFType;
  participants: string[];
  classement?: {
    rang: number;
    totalEquipes: number;
  };
  scoreObtenu?: number;
  scoreMax?: number;
  noteInterne?: string;
}

export interface Subvention {
  id: string;
  organisme: string;
  intitule: string;
  montantDemande: number;
  montantObtenu?: number | null;
  dateDepot: string;
  dateReponse?: string | null;
  statut: SubventionStatut;
  notes?: string;
  documents?: string[];
}

export interface Partenaire {
  id: string;
  nom: string;
  type: PartenaireType;
  valeurApport?: number;
  url?: string;
  logoUrl?: string;
  contactNom?: string;
  contactEmail?: string;
  contactTelephone?: string;
  notes?: string;
  dateDebutPartenariat?: string;
}

export interface TarifAdhesion {
  id: string;
  libelle: string;
  montant: number;
  description?: string;
  estActif: boolean;
}

export interface Actif {
  id: string;
  type: ActifType;
  nom: string;
  description?: string;
  valeur: number;
  valeurNette?: number;
  quantite?: number;
  valeurUnitaire?: number;
  dateAcquisition?: string;
  dureeAmortissement?: number;
}

export interface Passif {
  id: string;
  nom: string;
  description?: string;
  montant: number;
  dateEcheance?: string;
  estPaye: boolean;
}

export interface AssociationParams {
  nom?: string;
  siteWeb?: string;
  adresse?: string;
  siret?: string;
  logoUrl?: string;
  typeAdhesion: TypeAdhesion;
  tarifsAdhesion: TarifAdhesion[];
  dateDebutExercice?: string;
}

export interface DataStore {
  persons: Person[];
  transactions: Transaction[];
  participations: Participation[];
  ctfEvents: CTFEvent[];
  subventions: Subvention[];
  partenaires: Partenaire[];
  actifs: Actif[];
  passifs: Passif[];
  params: AssociationParams;
}

export interface KPIPersonnes {
  totalAdherents: number;
  totalMembres: number;
  tauxConversion: number;
  moyenneActivitesParAdherent: number;
  moyenneActivitesParMembre: number;
  tauxFidelisation: number;
  top5MembresActifs: {
    person: Person;
    nbActivites: number;
    scoreDiscord: number;
    scoreTotal: number;
  }[];
  totalCertifies: number;
}

export interface KPIFinances {
  chiffreAffairesTotal: number;
  totalDepenses: number;
  soldeReel: number;
  repartitionRevenus: {
    adhesions: number;
    dons: number;
    ventes: number;
  };
  repartitionDepenses: {
    achats: number;
    fraisBancaires: number;
    prestations: number;
    loyer: number;
    charges: number;
    autres: number;
  };
  caDetailleVentes: {
    formations: number;
    evenementiel: number;
    vetements: number;
  };
  panierMoyen: number;
  donMoyen: number;
  evolutionMensuelle: {
    mois: string;
    recettes: number;
    depenses: number;
    solde: number;
  }[];
}

export interface KPIBilan {
  totalActif: number;
  totalPassif: number;
  capitauxPropres: number;
  tresorerie: number;
  valeurStocks: number;
  valeurImmobilisations: number;
  valeurNetteImmobilisations: number;
}

export interface KPICTF {
  totalCTF: number;
  meilleurClassement: { rang: number; totalEquipes: number; nomCTF: string } | null;
  tauxParticipationMoyen: number;
  top5Competiteurs: { person: Person; nbCTF: number }[];
  evolutionClassement: { nom: string; date: string; rang: number; totalEquipes: number }[];
}

export interface KPISubventions {
  montantTotalObtenu: number;
  montantTotalDemande: number;
  montantEnAttente: number;
  tauxAcceptation: number;
  totalEnCours: number;
  totalObtenues: number;
  totalRefusees: number;
}

export interface Alerte {
  id: string;
  type: 'adhesion' | 'passif' | 'subvention';
  niveau: 'info' | 'warning' | 'danger';
  titre: string;
  message: string;
  dateEcheance?: string;
  lien?: string;
}

export interface FilterState {
  search: string;
  type?: string;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface DiscordKPIData {
  idDiscord: string;
  nombreActivites: number;
  derniereActivite?: string;
}
