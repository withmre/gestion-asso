import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { Actif, Passif, ActifType } from '@/types';
import {
  Building2,
  Package,
  Wallet,
  TrendingDown,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Calculator,
} from 'lucide-react';

interface BilanPageProps {
  actifs: Actif[];
  passifs: Passif[];
  onAddActif: (actif: Omit<Actif, 'id'>) => void;
  onDeleteActif: (id: string) => void;
  onAddPassif: (passif: Omit<Passif, 'id'>) => void;
  onUpdatePassif: (id: string, updates: Partial<Passif>) => void;
  onDeletePassif: (id: string) => void;
  kpiBilan: {
    totalActif: number;
    totalPassif: number;
    capitauxPropres: number;
    tresorerie: number;
    valeurStocks: number;
    valeurImmobilisations: number;
    valeurNetteImmobilisations: number;
  };
}

const actifTypeLabels: Record<ActifType, string> = {
  immobilisation: 'Immobilisation',
  stock: 'Stock',
  tresorerie: 'Tresorerie',
};

const actifTypeIcons: Record<ActifType, React.ElementType> = {
  immobilisation: Building2,
  stock: Package,
  tresorerie: Wallet,
};

interface AmortissementInfo {
  valeurNette: number;
  tauxAmortissement: number;
  estAmorti: boolean;
}

function calcAmortissement(actif: Actif): AmortissementInfo | null {
  if (
    actif.type !== 'immobilisation' ||
    !actif.dateAcquisition ||
    !actif.dureeAmortissement ||
    actif.dureeAmortissement <= 0
  ) {
    return null;
  }
  const msParAn = 1000 * 3600 * 24 * 365.25;
  const anneesEcoulees = (Date.now() - new Date(actif.dateAcquisition).getTime()) / msParAn;
  const valeurNette = Math.max(
    0,
    actif.valeur - (actif.valeur / actif.dureeAmortissement) * anneesEcoulees
  );
  const tauxAmortissement = Math.min(
    100,
    Math.round((anneesEcoulees / actif.dureeAmortissement) * 100)
  );
  return { valeurNette, tauxAmortissement, estAmorti: tauxAmortissement >= 100 };
}

export function BilanPage({
  actifs,
  passifs,
  onAddActif,
  onDeleteActif,
  onAddPassif,
  onUpdatePassif,
  onDeletePassif,
  kpiBilan,
}: BilanPageProps) {
  const [activeTab, setActiveTab] = useState('actif');

  const [actifType, setActifType] = useState<ActifType>('immobilisation');
  const [actifNom, setActifNom] = useState('');
  const [actifDescription, setActifDescription] = useState('');
  const [actifValeur, setActifValeur] = useState('');
  const [actifQuantite, setActifQuantite] = useState('');
  const [actifDate, setActifDate] = useState('');
  const [actifDureeAmort, setActifDureeAmort] = useState('');

  const [passifNom, setPassifNom] = useState('');
  const [passifDescription, setPassifDescription] = useState('');
  const [passifMontant, setPassifMontant] = useState('');
  const [passifDateEcheance, setPassifDateEcheance] = useState('');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const handleAddActif = () => {
    if (!actifNom.trim() || !actifValeur) return;
    const valeur = parseFloat(actifValeur);
    const quantite = actifQuantite ? parseInt(actifQuantite) : undefined;
    onAddActif({
      type: actifType,
      nom: actifNom.trim(),
      description: actifDescription.trim() || undefined,
      valeur: quantite ? valeur * quantite : valeur,
      quantite,
      valeurUnitaire: quantite ? valeur : undefined,
      dateAcquisition: actifDate || undefined,
      dureeAmortissement: actifDureeAmort ? parseInt(actifDureeAmort) : undefined,
    });
    setActifNom(''); setActifDescription(''); setActifValeur('');
    setActifQuantite(''); setActifDate(''); setActifDureeAmort('');
  };

  const handleAddPassif = () => {
    if (!passifNom.trim() || !passifMontant) return;
    onAddPassif({
      nom: passifNom.trim(),
      description: passifDescription.trim() || undefined,
      montant: parseFloat(passifMontant),
      dateEcheance: passifDateEcheance || undefined,
      estPaye: false,
    });
    setPassifNom(''); setPassifDescription(''); setPassifMontant(''); setPassifDateEcheance('');
  };

  const actifsByType = {
    immobilisation: actifs.filter((a) => a.type === 'immobilisation'),
    stock: actifs.filter((a) => a.type === 'stock'),
    tresorerie: actifs.filter((a) => a.type === 'tresorerie'),
  };

  return (
    <div className="space-y-6">

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Actif</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(kpiBilan.totalActif)}</div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Passif</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(kpiBilan.totalPassif)}</div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Capitaux Propres</CardTitle>
            <Calculator className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(kpiBilan.capitauxPropres)}</div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tresorerie</CardTitle>
            <Wallet className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(kpiBilan.tresorerie)}</div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs immobilisations */}
      {actifsByType.immobilisation.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Immobilisations (valeur brute)</CardTitle>
              <Building2 className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{formatCurrency(kpiBilan.valeurImmobilisations)}</div>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Immobilisations (valeur nette)</CardTitle>
              <Building2 className="h-4 w-4 text-[#1E3A5F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1E3A5F]">{formatCurrency(kpiBilan.valeurNetteImmobilisations)}</div>
              <p className="text-xs text-muted-foreground mt-1">Apres deduction des amortissements</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="actif" className="data-[state=active]:bg-[#1E3A5F] data-[state=active]:text-white">
            <Building2 className="h-4 w-4 mr-2" />
            Actif ({actifs.length})
          </TabsTrigger>
          <TabsTrigger value="passif" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
            <TrendingDown className="h-4 w-4 mr-2" />
            Passif ({passifs.filter((p) => !p.estPaye).length} en attente)
          </TabsTrigger>
        </TabsList>

        {/* Actif */}
        <TabsContent value="actif" className="space-y-6 mt-6">
          <Card className="border border-border shadow-sm">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-lg font-semibold text-foreground">Ajouter un actif</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Type d&apos;actif</Label>
                  <Select value={actifType} onValueChange={(v) => setActifType(v as ActifType)}>
                    <SelectTrigger className="border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immobilisation">Immobilisation</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="tresorerie">Tresorerie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Nom</Label>
                  <Input value={actifNom} onChange={(e) => setActifNom(e.target.value)} placeholder="Ex : Ordinateur portable" className="border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label>Valeur unitaire (EUR)</Label>
                  <Input type="number" step="0.01" min="0" value={actifValeur} onChange={(e) => setActifValeur(e.target.value)} placeholder="0.00" className="border-border" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label>Quantite (optionnel)</Label>
                  <Input type="number" min="1" value={actifQuantite} onChange={(e) => setActifQuantite(e.target.value)} placeholder="1" className="border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date d&apos;acquisition</Label>
                  <Input type="date" value={actifDate} onChange={(e) => setActifDate(e.target.value)} className="border-border" />
                </div>
                {actifType === 'immobilisation' && (
                  <div className="space-y-1.5">
                    <Label>Duree amortissement (annees)</Label>
                    <Input type="number" min="1" max="50" value={actifDureeAmort} onChange={(e) => setActifDureeAmort(e.target.value)} placeholder="Ex : 3" className="border-border" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Description (optionnel)</Label>
                  <Input value={actifDescription} onChange={(e) => setActifDescription(e.target.value)} placeholder="Description..." className="border-border" />
                </div>
              </div>
              <Button onClick={handleAddActif} className="mt-4 bg-[#1E3A5F] hover:bg-[#16294a] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter l&apos;actif
              </Button>
            </CardContent>
          </Card>

          {(Object.keys(actifsByType) as ActifType[]).map((type) =>
            actifsByType[type].length > 0 ? (
              <Card key={type} className="border border-border shadow-sm">
                <CardHeader className="bg-muted/50 border-b border-border">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    {(() => { const Icon = actifTypeIcons[type]; return <Icon className="h-5 w-5" />; })()}
                    {actifTypeLabels[type]}
                    <Badge variant="secondary">{actifsByType[type].length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-foreground font-medium">Nom</TableHead>
                        <TableHead className="text-foreground font-medium">Description</TableHead>
                        {type === 'immobilisation' && (
                          <TableHead className="text-right text-foreground font-medium">Valeur brute</TableHead>
                        )}
                        <TableHead className="text-right text-foreground font-medium">
                          {type === 'immobilisation' ? 'Valeur nette' : 'Valeur'}
                        </TableHead>
                        <TableHead className="text-right text-foreground font-medium">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {actifsByType[type].map((actif, index) => {
                        const amort = calcAmortissement(actif);
                        return (
                          <TableRow key={actif.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/50'}>
                            <TableCell>
                              <div className="font-medium text-foreground">{actif.nom}</div>
                              {amort && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-red-300 rounded-full"
                                        style={{ width: `${amort.tauxAmortissement}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">{amort.tauxAmortissement}%</span>
                                  </div>
                                  {amort.estAmorti ? (
                                    <span className="inline-block bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs px-2 py-0.5 rounded font-medium">Amorti</span>
                                  ) : actif.dureeAmortissement ? (
                                    <span className="text-xs text-muted-foreground/60">
                                      Sur {actif.dureeAmortissement} an{actif.dureeAmortissement > 1 ? 's' : ''}
                                      {actif.dateAcquisition && ` - acquis le ${new Date(actif.dateAcquisition).toLocaleDateString('fr-FR')}`}
                                    </span>
                                  ) : null}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {actif.description}
                              {actif.quantite && actif.quantite > 1 && (
                                <span className="text-muted-foreground/60"> ({actif.quantite} x {formatCurrency(actif.valeurUnitaire || 0)})</span>
                              )}
                            </TableCell>
                            {type === 'immobilisation' && (
                              <TableCell className="text-right text-sm text-muted-foreground/60">{formatCurrency(actif.valeur)}</TableCell>
                            )}
                            <TableCell className="text-right font-medium text-foreground">
                              {formatCurrency(type === 'immobilisation' && amort ? amort.valeurNette : actif.valeur)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => onDeleteActif(actif.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : null
          )}
        </TabsContent>

        {/* Passif */}
        <TabsContent value="passif" className="space-y-6 mt-6">
          <Card className="border border-border shadow-sm">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-lg font-semibold text-foreground">Ajouter une dette</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Nom de la dette</Label>
                  <Input value={passifNom} onChange={(e) => setPassifNom(e.target.value)} placeholder="Ex : Facture fournisseur" className="border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label>Montant (EUR)</Label>
                  <Input type="number" step="0.01" min="0" value={passifMontant} onChange={(e) => setPassifMontant(e.target.value)} placeholder="0.00" className="border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date d&apos;echeance</Label>
                  <Input type="date" value={passifDateEcheance} onChange={(e) => setPassifDateEcheance(e.target.value)} className="border-border" />
                </div>
              </div>
              <div className="mt-4">
                <Label>Description (optionnel)</Label>
                <Input value={passifDescription} onChange={(e) => setPassifDescription(e.target.value)} placeholder="Description de la dette..." className="mt-1.5 border-border" />
              </div>
              <Button onClick={handleAddPassif} className="mt-4 bg-red-700 hover:bg-red-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter la dette
              </Button>
            </CardContent>
          </Card>

          {passifs.length > 0 && (
            <Card className="border border-border shadow-sm">
              <CardHeader className="bg-muted/50 border-b border-border">
                <CardTitle className="text-lg font-semibold text-foreground">Dettes enregistrees</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-foreground font-medium">Nom</TableHead>
                      <TableHead className="text-foreground font-medium">Description</TableHead>
                      <TableHead className="text-foreground font-medium">Echeance</TableHead>
                      <TableHead className="text-right text-foreground font-medium">Montant</TableHead>
                      <TableHead className="text-center text-foreground font-medium">Statut</TableHead>
                      <TableHead className="text-right text-foreground font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passifs.map((passif, index) => (
                      <TableRow key={passif.id} className={`${index % 2 === 0 ? 'bg-card' : 'bg-muted/50'} ${passif.estPaye ? 'opacity-60' : ''}`}>
                        <TableCell className="font-medium">{passif.nom}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{passif.description}</TableCell>
                        <TableCell className="text-sm">
                          {passif.dateEcheance ? new Date(passif.dateEcheance).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(passif.montant)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => onUpdatePassif(passif.id, { estPaye: !passif.estPaye })}
                            className={passif.estPaye ? 'text-green-700 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}
                          >
                            {passif.estPaye ? <><CheckCircle className="h-4 w-4 mr-1" />Paye</> : <><XCircle className="h-4 w-4 mr-1" />En attente</>}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => onDeletePassif(passif.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
