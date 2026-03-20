import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pencil, Sliders, TrendingUp } from 'lucide-react';
import type { KPICustom } from '@/types';

const METRIQUES: { value: string; label: string; groupe: string }[] = [
  { value: 'totalAdherents', label: 'Nombre d\'adhérents', groupe: 'Membres' },
  { value: 'totalMembres', label: 'Nombre de membres', groupe: 'Membres' },
  { value: 'tauxConversion', label: 'Taux de conversion (%)', groupe: 'Membres' },
  { value: 'tauxFidelisation', label: 'Taux de fidélisation (%)', groupe: 'Membres' },
  { value: 'moyenneActivitesAdherent', label: 'Activités moy. par adhérent', groupe: 'Membres' },
  { value: 'moyenneActivitesMembre', label: 'Activités moy. par membre', groupe: 'Membres' },
  { value: 'chiffreAffaires', label: 'Chiffre d\'affaires total', groupe: 'Finances' },
  { value: 'totalDepenses', label: 'Total dépenses', groupe: 'Finances' },
  { value: 'soldeReel', label: 'Solde réel', groupe: 'Finances' },
  { value: 'panierMoyen', label: 'Panier moyen', groupe: 'Finances' },
  { value: 'donMoyen', label: 'Don moyen', groupe: 'Finances' },
  { value: 'totalCTF', label: 'CTF participés', groupe: 'CTF' },
  { value: 'montantSubventions', label: 'Subventions obtenues (€)', groupe: 'Subventions' },
  { value: 'tauxAcceptationSubventions', label: 'Taux d\'acceptation subventions (%)', groupe: 'Subventions' },
  { value: 'nbSessions', label: 'Sessions mentorat', groupe: 'Mentorat' },
  { value: 'heuresTotalesMentorat', label: 'Heures de mentorat', groupe: 'Mentorat' },
];

const OPERATIONS = [
  { value: 'diviser', label: 'A ÷ B' },
  { value: 'soustraire', label: 'A − B' },
  { value: 'multiplier', label: 'A × B' },
  { value: 'pourcentage', label: 'A / B × 100 (%)' },
];

const FORMATS = [
  { value: 'nombre', label: 'Nombre (ex : 42)' },
  { value: 'pourcentage', label: 'Pourcentage (ex : 42%)' },
  { value: 'montant', label: 'Montant en € (ex : 42,00 €)' },
];

const COULEURS = [
  { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
  { value: 'green', label: 'Vert', class: 'bg-green-500' },
  { value: 'amber', label: 'Ambre', class: 'bg-amber-500' },
  { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { value: 'red', label: 'Rouge', class: 'bg-red-500' },
];

const KPI_PREDEFINIS: Omit<KPICustom, 'id'>[] = [
  { nom: 'Ratio adhérents/membres', metriqueA: 'totalAdherents', operation: 'diviser', metriqueB: 'totalMembres', format: 'nombre', icone: 'users', couleur: 'blue' },
  { nom: 'Dépenses / Recettes', metriqueA: 'totalDepenses', operation: 'pourcentage', metriqueB: 'chiffreAffaires', format: 'pourcentage', icone: 'trending', couleur: 'amber' },
  { nom: 'Marge nette', metriqueA: 'chiffreAffaires', operation: 'soustraire', metriqueB: 'totalDepenses', format: 'montant', icone: 'wallet', couleur: 'green' },
  { nom: 'Coût par adhérent', metriqueA: 'totalDepenses', operation: 'diviser', metriqueB: 'totalAdherents', format: 'montant', icone: 'dollar', couleur: 'purple' },
];

interface KPIManagerProps {
  kpisCustom: KPICustom[];
  onAdd: (kpi: Omit<KPICustom, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<KPICustom>) => void;
  onDelete: (id: string) => void;
}

function KPIForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: KPICustom;
  onSave: (data: Omit<KPICustom, 'id'>) => void;
  onCancel: () => void;
}) {
  const [nom, setNom] = useState(initial?.nom || '');
  const [metriqueA, setMetriqueA] = useState(initial?.metriqueA || 'totalAdherents');
  const [operation, setOperation] = useState<KPICustom['operation']>(initial?.operation || 'diviser');
  const [metriqueB, setMetriqueB] = useState(initial?.metriqueB || 'totalMembres');
  const [format, setFormat] = useState<KPICustom['format']>(initial?.format || 'nombre');
  const [couleur, setCouleur] = useState(initial?.couleur || 'blue');

  const labelA = METRIQUES.find(m => m.value === metriqueA)?.label || metriqueA;
  const labelB = METRIQUES.find(m => m.value === metriqueB)?.label || metriqueB;
  const labelOp = OPERATIONS.find(o => o.value === operation)?.label || '';
  const preview = labelOp.replace('A', labelA).replace('B', labelB);

  const handleSave = () => {
    if (!nom.trim()) return;
    onSave({ nom: nom.trim(), metriqueA, operation, metriqueB, format, icone: 'trending', couleur });
  };

  const groupes = [...new Set(METRIQUES.map(m => m.groupe))];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nom du KPI *</Label>
        <Input value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : Ratio adhérents/membres" autoFocus />
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 rounded-lg bg-muted/30 border border-border">
        <div className="space-y-1.5">
          <Label>Métrique A</Label>
          <Select value={metriqueA} onValueChange={setMetriqueA}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {groupes.map(g => (
                <div key={g}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{g}</div>
                  {METRIQUES.filter(m => m.groupe === g).map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Opération</Label>
          <Select value={operation} onValueChange={v => setOperation(v as KPICustom['operation'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {OPERATIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Métrique B</Label>
          <Select value={metriqueB} onValueChange={setMetriqueB}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {groupes.map(g => (
                <div key={g}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{g}</div>
                  {METRIQUES.filter(m => m.groupe === g).map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="p-2 rounded bg-muted/50 text-xs text-muted-foreground">
          <span className="font-medium">Formule : </span>{preview}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Format d&apos;affichage</Label>
          <Select value={format} onValueChange={v => setFormat(v as KPICustom['format'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Couleur</Label>
          <Select value={couleur} onValueChange={setCouleur}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${COULEURS.find(c => c.value === couleur)?.class}`} />
                <span>{COULEURS.find(c => c.value === couleur)?.label}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {COULEURS.map(c => (
                <SelectItem key={c.value} value={c.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${c.class}`} />
                    {c.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={!nom.trim()} className="flex-1 bg-[#1E3A5F] hover:bg-[#16294a] text-white">
          {initial ? 'Enregistrer' : 'Créer le KPI'}
        </Button>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
      </div>
    </div>
  );
}

export function KPIManager({ kpisCustom, onAdd, onUpdate, onDelete }: KPIManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPICustom | null>(null);


  const opLabel: Record<string, string> = {
    diviser: '÷', soustraire: '−', multiplier: '×', pourcentage: '% de',
  };

  const metriqueLabel = (v: string) => METRIQUES.find(m => m.value === v)?.label || v;

  return (
    <div className="space-y-6">
      <Card className="border border-border shadow-sm">
        <CardHeader className="bg-muted/50 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sliders className="h-5 w-5" />
              Mes indicateurs personnalisés
            </CardTitle>
            <Button size="sm" onClick={() => setShowForm(true)} className="bg-[#1E3A5F] hover:bg-[#16294a] text-white">
              <Plus className="h-4 w-4 mr-1.5" />Créer un KPI
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {kpisCustom.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aucun KPI personnalisé. Créez vos propres indicateurs ou utilisez les modèles ci-dessous.</p>
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                {KPI_PREDEFINIS.map((k, i) => (
                  <button
                    key={i}
                    onClick={() => onAdd(k)}
                    className="text-left p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                  >
                    <p className="text-xs font-medium text-foreground">{k.nom}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{metriqueLabel(k.metriqueA)} {opLabel[k.operation]} {metriqueLabel(k.metriqueB)}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {kpisCustom.map(kpi => (
                <div key={kpi.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${COULEURS.find(c => c.value === kpi.couleur)?.class || 'bg-blue-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{kpi.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {metriqueLabel(kpi.metriqueA)} {opLabel[kpi.operation]} {metriqueLabel(kpi.metriqueB)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {kpi.format === 'montant' ? '€' : kpi.format === 'pourcentage' ? '%' : '#'}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setEditingKPI(kpi)} className="h-7 w-7 p-0">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(kpi.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              <p className="text-xs text-muted-foreground text-center pt-2">
                Les valeurs calculées sont visibles en temps réel dans le Dashboard.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog création */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />Créer un indicateur personnalisé
            </DialogTitle>
          </DialogHeader>
          <KPIForm onSave={data => { onAdd(data); setShowForm(false); }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog édition */}
      <Dialog open={!!editingKPI} onOpenChange={v => { if (!v) setEditingKPI(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />Modifier le KPI
            </DialogTitle>
          </DialogHeader>
          {editingKPI && (
            <KPIForm
              initial={editingKPI}
              onSave={data => { onUpdate(editingKPI.id, data); setEditingKPI(null); }}
              onCancel={() => setEditingKPI(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
