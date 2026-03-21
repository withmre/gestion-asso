import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Person, PersonType, TarifAdhesion } from '@/types';
import { Search, Trash2, Edit, User, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

interface PersonListProps {
  persons: Person[];
  tarifsAdhesion: TarifAdhesion[];
  onDelete: (id: string) => void;
  onEdit: (person: Person) => void;
}

type SortField = 'nom' | 'type' | 'dateInscription' | 'estAJourCotisation';
type SortDirection = 'asc' | 'desc';

const typeLabels: Record<PersonType, string> = {
  adherent: 'Adhérent',
  membre: 'Membre',
  anonyme: 'Anonyme'
};

const PAGE_SIZE = 20;

export function PersonList({ persons, tarifsAdhesion, onDelete, onEdit }: PersonListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<PersonType | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('nom');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const filteredPersons = persons
    .filter(p => {
      const matchesSearch = 
        p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.kpiDiscord?.idDiscord.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'nom':
          comparison = `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'dateInscription':
          comparison = new Date(a.dateInscription).getTime() - new Date(b.dateInscription).getTime();
          break;
        case 'estAJourCotisation':
          comparison = Number(a.estAJourCotisation) - Number(b.estAJourCotisation);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredPersons.length / PAGE_SIZE);
  const paginatedPersons = filteredPersons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-primary ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const getTarifLabel = (tarifId?: string) => {
    if (!tarifId) return '-';
    const tarif = tarifsAdhesion.find(t => t.id === tarifId);
    return tarif ? `${tarif.libelle} (${tarif.montant}€)` : '-';
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="bg-muted/50 border-b border-border">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <User className="h-5 w-5" />
              Liste des personnes ({filteredPersons.length})
            </CardTitle>
          </div>
          
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Rechercher (nom, email, Discord...)"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-9 border-border"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as PersonType | 'all'); setCurrentPage(1); }}
              className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Tous les types</option>
              <option value="adherent">Adhérents</option>
              <option value="membre">Membres</option>
              <option value="anonyme">Anonymes</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="cursor-pointer text-foreground font-medium" onClick={() => handleSort('nom')}>
                  Nom <SortIcon field="nom" />
                </TableHead>
                <TableHead className="cursor-pointer text-foreground font-medium" onClick={() => handleSort('type')}>
                  Type <SortIcon field="type" />
                </TableHead>
                <TableHead className="text-foreground font-medium">Contact</TableHead>
                <TableHead className="text-foreground font-medium">Discord</TableHead>
                <TableHead className="text-foreground font-medium">Tarif</TableHead>
                <TableHead className="cursor-pointer text-foreground font-medium" onClick={() => handleSort('estAJourCotisation')}>
                  Cotisation <SortIcon field="estAJourCotisation" />
                </TableHead>
                <TableHead className="text-right text-foreground font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPersons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucune personne trouvée
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPersons.map((person, index) => (
                  <TableRow key={person.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/50'}>
                    <TableCell className="font-medium">
                      {person.prenom} {person.nom}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        person.type === 'adherent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        person.type === 'membre' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-muted text-foreground'
                      }>
                        {typeLabels[person.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {person.email && <div>{person.email}</div>}
                      {person.telephone && <div>{person.telephone}</div>}
                    </TableCell>
                    <TableCell>
                      {person.kpiDiscord ? (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          <MessageSquare className="h-3 w-3" />
                          {person.kpiDiscord.nombreActivites}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {getTarifLabel(person.tarifAdhesionId)}
                    </TableCell>
                    <TableCell>
                      {person.type === 'adherent' && (
                        <Badge className={person.estAJourCotisation ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}>
                          {person.estAJourCotisation ? 'À jour' : 'Non à jour'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(person)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(person.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
