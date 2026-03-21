import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, CheckCircle, AlertTriangle, Search, Trash2, Zap } from 'lucide-react';
import type { EcritureComptable, Transaction } from '@/types';

const COMPTES_PCA: Record<string, string> = {
  '101': 'Fonds associatifs',
  '106': 'Réserves',
  '211': 'Terrains',
  '215': 'Matériel informatique',
  '218': 'Autres immobilisations',
  '281': 'Amortissements',
  '401': 'Fournisseurs',
  '411': 'Adhérents',
  '512': 'Banque',
  '530': 'Caisse',
  '601': 'Achats',
  '606': 'Fournitures',
  '613': 'Loyers',
  '616': 'Assurances',
  '622': 'Honoraires',
  '623': 'Publicité',
  '626': 'Frais postaux',
  '627': 'Frais bancaires',
  '641': 'Salaires / bénévolat valorisé',
  '658': 'Charges diverses',
  '706': 'Ventes formations',
  '707': 'Ventes marchandises',
  '708': 'Ventes événementiel',
  '740': 'Subventions d\'exploitation',
  '750': 'Produits de gestion',
  '756': 'Cotisations',
  '757': 'Dons manuels',
  '758': 'Dons',
  '860': 'Bénévolat valorisé',
};

const JOURNAUX: Record<string, string> = {
  VTE: 'Journal des ventes',
  ACH: 'Journal des achats',
  BNQ: 'Journal de banque',
  CAI: 'Journal de caisse',
  OD: 'Opérations diverses',
};

interface ComptabiliteDoubleProps {
  ecritures: EcritureComptable[];
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onGenererDepuisTransactions: () => void;
}

export function ComptabiliteDouble({
  ecritures,
  transactions,
  onDelete,
  onGenererDepuisTransactions,
}: ComptabiliteDoubleProps) {
  const [search, setSearch] = useState('');
  const [journalFilter, setJournalFilter] = useState<string>('all');

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);

  const filtered = useMemo(() =>
    ecritures.filter(e => {
      const matchSearch = e.libelle.toLowerCase().includes(search.toLowerCase()) ||
        e.lignes.some(l => l.compte.includes(search) || l.libelle.toLowerCase().includes(search.toLowerCase()));
      const matchJournal = journalFilter === 'all' || e.journalCode === journalFilter;
      return matchSearch && matchJournal;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [ecritures, search, journalFilter]
  );

  // Balance des comptes
  const balance = useMemo(() => {
    const comptes: Record<string, { debit: number; credit: number }> = {};
    ecritures.forEach(e => {
      e.lignes.forEach(l => {
        if (!comptes[l.compte]) comptes[l.compte] = { debit: 0, credit: 0 };
        comptes[l.compte].debit += l.debit;
        comptes[l.compte].credit += l.credit;
      });
    });
    return Object.entries(comptes)
      .map(([compte, { debit, credit }]) => ({ compte, libelle: COMPTES_PCA[compte] || 'Compte ' + compte, debit, credit, solde: debit - credit }))
      .sort((a, b) => a.compte.localeCompare(b.compte));
  }, [ecritures]);

  const totalDebits = ecritures.reduce((s, e) => s + e.lignes.reduce((ls, l) => ls + l.debit, 0), 0);
  const totalCredits = ecritures.reduce((s, e) => s + e.lignes.reduce((ls, l) => ls + l.credit, 0), 0);
  const equilibree = Math.abs(totalDebits - totalCredits) < 0.01;

  const txsSansEcriture = transactions.filter(
    tx => !ecritures.some(e => e.transactionId === tx.id)
  );

  return (
    <div className="space-y-6">

      {/* En-tête avec état de la balance */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {equilibree
            ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" />Balance équilibrée</Badge>
            : <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />Balance déséquilibrée</Badge>
          }
          <span className="text-sm text-muted-foreground">{ecritures.length} écriture{ecritures.length > 1 ? 's' : ''}</span>
        </div>
        {txsSansEcriture.length > 0 && (
          <Button onClick={onGenererDepuisTransactions} className="bg-[#1E3A5F] hover:bg-[#16294a] text-white">
            <Zap className="h-4 w-4 mr-2" />
            Générer {txsSansEcriture.length} écriture{txsSansEcriture.length > 1 ? 's' : ''} manquante{txsSansEcriture.length > 1 ? 's' : ''}
          </Button>
        )}
      </div>

      <Tabs defaultValue="journal">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="journal" className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />Journal
          </TabsTrigger>
          <TabsTrigger value="balance" className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4" />Balance
          </TabsTrigger>
        </TabsList>

        {/* Journal des écritures */}
        <TabsContent value="journal" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" />
            </div>
            <select
              value={journalFilter}
              onChange={e => setJournalFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Tous les journaux</option>
              {Object.entries(JOURNAUX).map(([code, label]) => (
                <option key={code} value={code}>{code} · {label}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune écriture. Cliquez sur "Générer les écritures" pour importer depuis vos transactions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(ecriture => (
                <Card key={ecriture.id} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="text-xs">{ecriture.journalCode}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(ecriture.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{ecriture.libelle}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(ecriture.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-1 text-muted-foreground font-medium w-16">Compte</th>
                            <th className="text-left py-1 text-muted-foreground font-medium">Libellé</th>
                            <th className="text-right py-1 text-muted-foreground font-medium w-24">Débit</th>
                            <th className="text-right py-1 text-muted-foreground font-medium w-24">Crédit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ecriture.lignes.map((ligne, i) => (
                            <tr key={i} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                              <td className="py-1 font-mono text-muted-foreground">{ligne.compte}</td>
                              <td className="py-1 text-foreground">{COMPTES_PCA[ligne.compte] || ligne.libelle}</td>
                              <td className="py-1 text-right font-medium text-green-600 dark:text-green-400">{ligne.debit > 0 ? formatCurrency(ligne.debit) : '-'}</td>
                              <td className="py-1 text-right font-medium text-red-600 dark:text-red-400">{ligne.credit > 0 ? formatCurrency(ligne.credit) : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Balance des comptes */}
        <TabsContent value="balance" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="bg-muted/50 border-b border-border py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Balance générale</CardTitle>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">Total débits : <span className="font-medium text-foreground">{formatCurrency(totalDebits)}</span></span>
                  <span className="text-muted-foreground">Total crédits : <span className="font-medium text-foreground">{formatCurrency(totalCredits)}</span></span>
                  {equilibree
                    ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:bg-green-900/30 dark:text-green-400">Équilibrée</Badge>
                    : <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Déséquilibrée</Badge>
                  }
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {balance.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">Aucune écriture enregistrée.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground w-16">Compte</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Libellé</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Débit</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Crédit</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Solde</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balance.map((c, i) => (
                        <tr key={c.compte} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                          <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{c.compte}</td>
                          <td className="px-4 py-2 text-foreground">{c.libelle}</td>
                          <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">{formatCurrency(c.debit)}</td>
                          <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">{formatCurrency(c.credit)}</td>
                          <td className={`px-4 py-2 text-right font-medium ${c.solde >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                            {formatCurrency(Math.abs(c.solde))} {c.solde < 0 ? 'Cr' : 'Dt'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/50 font-semibold">
                        <td colSpan={2} className="px-4 py-2 text-xs text-foreground">TOTAL</td>
                        <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">{formatCurrency(totalDebits)}</td>
                        <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">{formatCurrency(totalCredits)}</td>
                        <td className="px-4 py-2 text-right text-xs">
                          {equilibree
                            ? <span className="text-green-600">✓</span>
                            : <span className="text-destructive">{formatCurrency(Math.abs(totalDebits - totalCredits))}</span>
                          }
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
