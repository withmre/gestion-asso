import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Plus, Trash2, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { ProjectionTresorerie, EvenementPrevisionnel } from '@/types';

interface ProjectionTresorerieCardProps {
  projection: ProjectionTresorerie[];
  onAddEvenement: (e: Omit<EvenementPrevisionnel, 'id'>) => void;
  onDeleteEvenement: (id: string) => void;
  evenements: EvenementPrevisionnel[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

export function ProjectionTresorerieCard({
  projection,
  onAddEvenement,
  onDeleteEvenement,
  evenements,
}: ProjectionTresorerieCardProps) {
  const [libelle, setLibelle] = useState('');
  const [montant, setMontant] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'recette' | 'depense'>('depense');
  const [showForm, setShowForm] = useState(false);

  const soldeCritique = projection.find(p => p.soldePrevu < 0);

  const handleAdd = () => {
    if (!libelle.trim() || !montant || !date) return;
    onAddEvenement({ libelle: libelle.trim(), montant: parseFloat(montant), date, type });
    setLibelle('');
    setMontant('');
    setDate('');
    setShowForm(false);
  };

  const chartData = projection.map(p => ({
    mois: p.mois.split(' ')[0],
    'Solde prévu': p.soldePrevu,
    'Recettes prévisionnelles': p.recettesPrevisionnelles,
    'Dépenses prévisionnelles': p.depensesPrevisionnelles,
  }));

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="bg-muted/50 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Projection de trésorerie — 6 mois
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(v => !v)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Événement
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">

        {soldeCritique && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">
              Point critique estimé en <strong>{soldeCritique.mois}</strong> — solde prévu négatif ({formatCurrency(soldeCritique.soldePrevu)}).
              Envisagez de réduire les dépenses ou de lancer une campagne d&apos;adhésions.
            </p>
          </div>
        )}

        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="mois" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tickFormatter={v => `${Math.round(v / 1000)}k€`} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <RechartsTooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="Recettes prévisionnelles" stroke="#4A7C59" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Dépenses prévisionnelles" stroke="#B91C1C" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Solde prévu" stroke="#1E3A5F" strokeWidth={2.5} strokeDasharray="none" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>

        <p className="text-xs text-muted-foreground text-center">
          Projection basée sur la moyenne des 6 derniers mois. Les événements prévisionnels ajustent les courbes.
        </p>

        {showForm && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
            <h4 className="text-sm font-medium text-foreground">Ajouter un événement prévisionnel</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Libellé</Label>
                <Input value={libelle} onChange={e => setLibelle(e.target.value)} placeholder="Ex : Achat matériel lab" />
              </div>
              <div className="space-y-1.5">
                <Label>Montant (€)</Label>
                <Input type="number" min="0" step="0.01" value={montant} onChange={e => setMontant(e.target.value)} placeholder="500" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={v => setType(v as 'recette' | 'depense')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recette">Recette prévue</SelectItem>
                    <SelectItem value="depense">Dépense prévue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Mois estimé</Label>
                <Input type="month" value={date} onChange={e => setDate(e.target.value + '-01')} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!libelle || !montant || !date} className="flex-1">
                Ajouter
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </div>
        )}

        {evenements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Événements prévisionnels</h4>
            <div className="space-y-2">
              {evenements.map(e => (
                <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2">
                    {e.type === 'recette'
                      ? <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                      : <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                    }
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.libelle}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${e.type === 'recette' ? 'text-green-600' : 'text-red-600'}`}>
                      {e.type === 'recette' ? '+' : '-'}{formatCurrency(e.montant)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteEvenement(e.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
