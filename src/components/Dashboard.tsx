import { ScoreSanteCard } from './ScoreSanteCard';
import { ProjectionTresorerieCard } from './ProjectionTresorerieCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { KPIPersonnes, KPIFinances, KPICTF, KPISubventions, ScoreSante, ProjectionTresorerie, EvenementPrevisionnel, KPICustom } from '@/types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line
} from 'recharts';
import { Users, TrendingUp, DollarSign, HelpCircle, TrendingDown, Wallet, Trophy, FileText, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface DashboardProps {
  kpiPersonnes: KPIPersonnes;
  kpiFinances: KPIFinances;
  kpiCTF: KPICTF;
  kpiSubventions: KPISubventions;
  scoreSante: ScoreSante;
  projectionTresorerie: ProjectionTresorerie[];
  evenementsPrev: EvenementPrevisionnel[];
  onAddEvenementPrev: (e: Omit<EvenementPrevisionnel, 'id'>) => void;
  onDeleteEvenementPrev: (id: string) => void;
  kpisCustom: KPICustom[];
  nbSessionsMentorat?: number;
  heuresTotalesMentorat?: number;
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const COLORS_REVENUS = ['#3B82F6', '#10B981', '#F59E0B'];
const COLORS_DEPENSES = ['#EF4444', '#F97316', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function KPICard({ title, value, icon: Icon, iconColor, tooltip, trend }: { 
  title: string; 
  value: string; 
  icon: React.ElementType; 
  iconColor: string;
  tooltip?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent><p className="max-w-xs text-xs">{tooltip}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-foreground'}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard({ kpiPersonnes, kpiFinances, kpiCTF, kpiSubventions, scoreSante, projectionTresorerie, evenementsPrev, onAddEvenementPrev, onDeleteEvenementPrev, kpisCustom, nbSessionsMentorat = 0, heuresTotalesMentorat = 0, selectedYear, onYearChange }: DashboardProps) {
  const repartitionData = [
    { name: 'Adhésions', value: kpiFinances.repartitionRevenus.adhesions },
    { name: 'Dons', value: kpiFinances.repartitionRevenus.dons },
    { name: 'Ventes', value: kpiFinances.repartitionRevenus.ventes },
  ].filter(d => d.value > 0);

  const depensesData = [
    { name: 'Achats', value: kpiFinances.repartitionDepenses.achats },
    { name: 'Frais bancaires', value: kpiFinances.repartitionDepenses.fraisBancaires },
    { name: 'Prestations', value: kpiFinances.repartitionDepenses.prestations },
    { name: 'Loyer', value: kpiFinances.repartitionDepenses.loyer },
    { name: 'Charges', value: kpiFinances.repartitionDepenses.charges },
    { name: 'Autres', value: kpiFinances.repartitionDepenses.autres },
  ].filter(d => d.value > 0);


  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  const formatNumber = (value: number) => 
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value);


  const valeurKPICustom = (kpi: KPICustom): string => {
    const metriques: Record<string, number> = {
      totalAdherents: kpiPersonnes.totalAdherents,
      totalMembres: kpiPersonnes.totalMembres,
      tauxConversion: kpiPersonnes.tauxConversion,
      tauxFidelisation: kpiPersonnes.tauxFidelisation,
      chiffreAffaires: kpiFinances.chiffreAffairesTotal,
      totalDepenses: kpiFinances.totalDepenses,
      soldeReel: kpiFinances.soldeReel,
      panierMoyen: kpiFinances.panierMoyen,
      donMoyen: kpiFinances.donMoyen,
      totalCTF: kpiCTF.totalCTF,
      montantSubventions: kpiSubventions.montantTotalObtenu,
      tauxAcceptationSubventions: kpiSubventions.tauxAcceptation,
      nbSessions: nbSessionsMentorat,
      heuresTotalesMentorat: heuresTotalesMentorat,
    };
    const a = metriques[kpi.metriqueA] ?? 0;
    const b = metriques[kpi.metriqueB] ?? 1;
    let result = 0;
    if (kpi.operation === 'diviser') result = b !== 0 ? a / b : 0;
    else if (kpi.operation === 'soustraire') result = a - b;
    else if (kpi.operation === 'multiplier') result = a * b;
    else if (kpi.operation === 'pourcentage') result = b !== 0 ? (a / b) * 100 : 0;
    if (kpi.format === 'montant') return formatCurrency(result);
    if (kpi.format === 'pourcentage') return `${formatNumber(result)}%`;
    return formatNumber(result);
  };

  const soldeTrend = kpiFinances.soldeReel >= 0 ? 'up' : 'down';
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Sélecteur d'année */}
        <div className="flex justify-end">
          <Select value={selectedYear.toString()} onValueChange={(v) => onYearChange(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Personnes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Adhérents" value={kpiPersonnes.totalAdherents.toString()} icon={Users} iconColor="text-blue-600" />
          <KPICard title="Membres" value={kpiPersonnes.totalMembres.toString()} icon={Users} iconColor="text-green-600" />
          <KPICard title="Taux conversion" value={`${formatNumber(kpiPersonnes.tauxConversion)}%`} icon={TrendingUp} iconColor="text-amber-600" />
        </div>

        {/* KPI Finances */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Chiffre d'affaires" value={formatCurrency(kpiFinances.chiffreAffairesTotal)} icon={DollarSign} iconColor="text-green-600" trend="up" />
          <KPICard title="Dépenses" value={formatCurrency(kpiFinances.totalDepenses)} icon={TrendingDown} iconColor="text-red-600" trend="down" />
          <KPICard title="Solde" value={formatCurrency(kpiFinances.soldeReel)} icon={Wallet} iconColor={soldeTrend === 'up' ? 'text-green-600' : 'text-red-600'} trend={soldeTrend} />
          <KPICard title="Panier moyen" value={formatCurrency(kpiFinances.panierMoyen)} icon={DollarSign} iconColor="text-blue-600" />
        </div>

        {/* KPI CTF & Subventions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="CTF participés" value={kpiCTF.totalCTF.toString()} icon={Trophy} iconColor="text-amber-500" />
          <KPICard title="Meilleur classement" value={kpiCTF.meilleurClassement ? `${kpiCTF.meilleurClassement.rang}/${kpiCTF.meilleurClassement.totalEquipes}` : '-'} icon={Trophy} iconColor="text-yellow-500" />
          <KPICard title="Subventions obtenues" value={formatCurrency(kpiSubventions.montantTotalObtenu)} icon={FileText} iconColor="text-green-600" />
          <KPICard title="Taux acceptation" value={`${formatNumber(kpiSubventions.tauxAcceptation)}%`} icon={TrendingUp} iconColor="text-blue-600" />
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border shadow-sm">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-lg font-semibold text-gray-800">Répartition des revenus</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {repartitionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={repartitionData} cx="50%" cy="50%" labelLine={false} 
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80} fill="#8884d8" dataKey="value">
                      {repartitionData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_REVENUS[index % COLORS_REVENUS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-muted-foreground text-center py-8">Aucune donnée</p>}
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-lg font-semibold text-gray-800">Répartition des dépenses</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {depensesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={depensesData} cx="50%" cy="50%" labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80} fill="#8884d8" dataKey="value">
                      {depensesData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_DEPENSES[index % COLORS_DEPENSES.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-muted-foreground text-center py-8">Aucune dépense</p>}
            </CardContent>
          </Card>
        </div>

        {/* Évolution mensuelle - 3 courbes */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="bg-muted/50 border-b border-border">
            <CardTitle className="text-lg font-semibold text-gray-800">Évolution mensuelle</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={kpiFinances.evolutionMensuelle}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="recettes" stroke="#10B981" strokeWidth={2} name="Recettes" />
                <Line type="monotone" dataKey="depenses" stroke="#EF4444" strokeWidth={2} name="Dépenses" />
                <Line type="monotone" dataKey="solde" stroke="#3B82F6" strokeWidth={2} name="Solde net" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 5 membres actifs */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="bg-muted/50 border-b border-border">
            <CardTitle className="text-lg font-semibold text-gray-800">Top 5 membres les plus actifs</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {kpiPersonnes.top5MembresActifs.length > 0 ? (
              <div className="space-y-3">
                {kpiPersonnes.top5MembresActifs.map((item, index) => (
                  <div key={item.person.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-foreground">{item.person.prenom} {item.person.nom}</span>
                      <span className="text-sm text-muted-foreground">({item.person.type})</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.nbActivites} participations
                      {item.scoreDiscord > 0 && <span className="ml-2 text-indigo-600">+ {item.scoreDiscord} Discord</span>}
                      <span className="ml-2 font-medium">= {item.scoreTotal} total</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-center py-4">Aucune activité enregistrée</p>}
          </CardContent>
        </Card>

        {/* Score de santé */}
        <ScoreSanteCard score={scoreSante} />

        {/* Projection de trésorerie */}
        <ProjectionTresorerieCard
          projection={projectionTresorerie}
          onAddEvenement={onAddEvenementPrev}
          onDeleteEvenement={onDeleteEvenementPrev}
          evenements={evenementsPrev}
        />

        {/* KPIs personnalisés */}
        {kpisCustom.length > 0 && (
          <Card className="border border-border shadow-sm">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-lg font-semibold text-foreground">Mes indicateurs personnalisés</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kpisCustom.map(kpi => (
                  <Card key={kpi.id} className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.nom}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{valeurKPICustom(kpi)}</div>
                      <p className="text-xs text-muted-foreground mt-1">{kpi.metriqueA} {kpi.operation} {kpi.metriqueB}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </TooltipProvider>
  );
}
