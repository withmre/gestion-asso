import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Transaction, Person, TransactionType, VenteSousCategorie, DepenseCategorie } from '@/types';
import { Search, Trash2, Pencil, Receipt, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  persons: Person[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

type SortField = 'date' | 'type' | 'montant' | 'person';
type SortDirection = 'asc' | 'desc';

const typeLabels: Record<TransactionType, string> = {
  adhesion: 'Adhésion',
  don: 'Don',
  vente: 'Vente',
  depense: 'Dépense',
};

const venteLabels: Record<VenteSousCategorie, string> = {
  formation: 'Formation',
  evenementiel: 'Événementiel',
  vetements: 'Vêtements',
};

const depenseLabels: Record<DepenseCategorie, string> = {
  achats: 'Achats',
  frais_bancaires: 'Frais bancaires',
  prestations: 'Prestations',
  loyer: 'Loyer',
  charges: 'Charges',
  autres: 'Autres',
};

const typeColors: Record<TransactionType, string> = {
  adhesion: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  don: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  vente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  depense: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export function TransactionList({ transactions, persons, onDelete, onEdit }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const getPersonName = (personId: string): string => {
    if (personId === 'anonyme') return 'Anonyme';
    const person = persons.find((p) => p.id === personId);
    return person ? `${person.prenom} ${person.nom}` : 'Inconnu';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filtered = transactions
    .filter((t) => {
      const matchesSearch =
        getPersonName(t.personId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        typeLabels[t.type].toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date': cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case 'type': cmp = a.type.localeCompare(b.type); break;
        case 'montant': cmp = a.montant - b.montant; break;
        case 'person': cmp = getPersonName(a.personId).localeCompare(getPersonName(b.personId)); break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-primary ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const totalRecettes = transactions.filter((t) => t.type !== 'depense').reduce((s, t) => s + t.montant, 0);
  const totalDepenses = transactions.filter((t) => t.type === 'depense').reduce((s, t) => s + t.montant, 0);
  const solde = totalRecettes - totalDepenses;

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="bg-muted/50 border-b border-border">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Liste des transactions ({transactions.length})
            </CardTitle>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-full">
              <ArrowUpRight className="h-4 w-4" />
              <span>Recettes : <strong>{formatCurrency(totalRecettes)}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-1 rounded-full">
              <ArrowDownLeft className="h-4 w-4" />
              <span>Dépenses : <strong>{formatCurrency(totalDepenses)}</strong></span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${solde >= 0 ? 'text-blue-700 bg-blue-50' : 'text-red-700 bg-red-50'}`}>
              <span>Solde : <strong>{formatCurrency(solde)}</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-border"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
              className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Tous les types</option>
              <option value="adhesion">Adhésions</option>
              <option value="don">Dons</option>
              <option value="vente">Ventes</option>
              <option value="depense">Dépenses</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="cursor-pointer text-foreground font-medium" onClick={() => handleSort('date')}>
                  Date <SortIcon field="date" />
                </TableHead>
                <TableHead className="cursor-pointer text-foreground font-medium" onClick={() => handleSort('type')}>
                  Type <SortIcon field="type" />
                </TableHead>
                <TableHead className="cursor-pointer text-foreground font-medium text-right" onClick={() => handleSort('montant')}>
                  Montant <SortIcon field="montant" />
                </TableHead>
                <TableHead className="cursor-pointer text-foreground font-medium" onClick={() => handleSort('person')}>
                  Personne <SortIcon field="person" />
                </TableHead>
                <TableHead className="text-foreground font-medium">Détails</TableHead>
                <TableHead className="text-right text-foreground font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune transaction trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((transaction, index) => (
                  <TableRow key={transaction.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/50'}>
                    <TableCell className="text-sm">
                      {new Date(transaction.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[transaction.type]}`}>
                        {typeLabels[transaction.type]}
                      </span>
                      {transaction.venteSousCategorie && (
                        <span className="ml-2 text-xs text-muted-foreground">({venteLabels[transaction.venteSousCategorie]})</span>
                      )}
                      {transaction.depenseCategorie && (
                        <span className="ml-2 text-xs text-muted-foreground">({depenseLabels[transaction.depenseCategorie]})</span>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${transaction.type === 'depense' ? 'text-red-600' : 'text-green-600'}`}>
                      {transaction.type === 'depense' ? '-' : '+'}{formatCurrency(transaction.montant)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {transaction.type === 'depense' ? '-' : getPersonName(transaction.personId)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {transaction.description}
                      {transaction.dateDebutAdhesion && (
                        <div className="text-xs text-muted-foreground">
                          Du {new Date(transaction.dateDebutAdhesion).toLocaleDateString('fr-FR')}
                          {transaction.dateFinAdhesion && ` au ${new Date(transaction.dateFinAdhesion).toLocaleDateString('fr-FR')}`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(transaction)}
                          className="text-muted-foreground hover:text-[#1E3A5F] hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(transaction.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
