import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Participation, Person } from '@/types';
import { Search, Trash2, Pencil, Calendar } from 'lucide-react';

interface ParticipationListProps {
  participations: Participation[];
  persons: Person[];
  onDelete: (id: string) => void;
  onEdit: (participation: Participation) => void;
}

type SortField = 'date' | 'person' | 'type' | 'nom';
type SortDirection = 'asc' | 'desc';

const typeLabels: Record<string, string> = {
  formation: 'Formation',
  evenement: 'Événement',
  ctf: 'CTF',
};

const typeColors: Record<string, string> = {
  formation: 'bg-purple-100 text-purple-800',
  evenement: 'bg-orange-100 text-orange-800',
  ctf: 'bg-cyan-100 text-cyan-800',
};

export function ParticipationList({ participations, persons, onDelete, onEdit }: ParticipationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const getPersonName = (personId: string): string => {
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

  const filtered = participations
    .filter((p) => {
      const matchesSearch =
        getPersonName(p.personId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.activiteNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.activiteType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || p.activiteType === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date': cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case 'person': cmp = getPersonName(a.personId).localeCompare(getPersonName(b.personId)); break;
        case 'type': cmp = a.activiteType.localeCompare(b.activiteType); break;
        case 'nom': cmp = a.activiteNom.localeCompare(b.activiteNom); break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-primary ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="bg-muted/50 border-b border-border">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Liste des participations ({participations.length})
            </CardTitle>
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
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Tous les types</option>
              <option value="formation">Formations</option>
              <option value="evenement">Événements</option>
              <option value="ctf">CTF</option>
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
                <TableHead className="cursor-pointer text-foreground font-medium" onClick={() => handleSort('person')}>
                  Personne <SortIcon field="person" />
                </TableHead>
                <TableHead className="cursor-pointer text-foreground font-medium" onClick={() => handleSort('type')}>
                  Type <SortIcon field="type" />
                </TableHead>
                <TableHead className="cursor-pointer text-foreground font-medium" onClick={() => handleSort('nom')}>
                  Activité <SortIcon field="nom" />
                </TableHead>
                <TableHead className="text-right text-foreground font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucune participation trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((participation, index) => (
                  <TableRow key={participation.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/50'}>
                    <TableCell className="text-sm">
                      {new Date(participation.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {getPersonName(participation.personId)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[participation.activiteType] || 'bg-muted text-foreground'}`}>
                        {typeLabels[participation.activiteType] || participation.activiteType}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {participation.activiteNom}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(participation)}
                          className="text-muted-foreground hover:text-[#1E3A5F] hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(participation.id)}
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
