import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { Subvention, SubventionStatut } from '@/types';
import { FileText, Plus, Trash2, Edit, Search, Filter, Download, Euro } from 'lucide-react';

interface SubventionsPageProps {
  subventions: Subvention[];
  onAdd: (subvention: Omit<Subvention, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Subvention>) => void;
  onDelete: (id: string) => void;
  onExportExcel: () => void;
}

const statuts: { value: SubventionStatut; label: string; color: string }[] = [
  { value: 'a_deposer', label: 'À déposer', color: 'bg-gray-100 text-gray-700' },
  { value: 'en_cours', label: 'En cours', color: 'bg-amber-100 text-amber-700' },
  { value: 'obtenue', label: 'Obtenue', color: 'bg-green-100 text-green-700' },
  { value: 'refusee', label: 'Refusée', color: 'bg-red-100 text-red-700' }
];

export function SubventionsPage({ subventions, onAdd, onUpdate, onDelete, onExportExcel }: SubventionsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<SubventionStatut | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSubvention, setEditingSubvention] = useState<Subvention | null>(null);

  const [organisme, setOrganisme] = useState('');
  const [intitule, setIntitule] = useState('');
  const [montantDemande, setMontantDemande] = useState('');
  const [montantObtenu, setMontantObtenu] = useState('');
  const [dateDepot, setDateDepot] = useState('');
  const [dateReponse, setDateReponse] = useState('');
  const [statut, setStatut] = useState<SubventionStatut>('a_deposer');
  const [notes, setNotes] = useState('');

  const filteredSubventions = subventions.filter(s => {
    const matchesSearch = s.organisme.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.intitule.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = statutFilter === 'all' || s.statut === statutFilter;
    return matchesSearch && matchesStatut;
  }).sort((a, b) => new Date(b.dateDepot).getTime() - new Date(a.dateDepot).getTime());

  const resetForm = () => {
    setOrganisme('');
    setIntitule('');
    setMontantDemande('');
    setMontantObtenu('');
    setDateDepot('');
    setDateReponse('');
    setStatut('a_deposer');
    setNotes('');
  };

  const handleSubmit = () => {
    if (!organisme.trim() || !intitule.trim() || !montantDemande || !dateDepot) return;

    const subventionData: Omit<Subvention, 'id'> = {
      organisme: organisme.trim(),
      intitule: intitule.trim(),
      montantDemande: parseFloat(montantDemande),
      montantObtenu: montantObtenu ? parseFloat(montantObtenu) : null,
      dateDepot,
      dateReponse: dateReponse || null,
      statut,
      notes: notes.trim() || undefined,
      documents: []
    };

    if (editingSubvention) {
      onUpdate(editingSubvention.id, subventionData);
      setEditingSubvention(null);
    } else {
      onAdd(subventionData);
    }

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (subvention: Subvention) => {
    setEditingSubvention(subvention);
    setOrganisme(subvention.organisme);
    setIntitule(subvention.intitule);
    setMontantDemande(subvention.montantDemande.toString());
    setMontantObtenu(subvention.montantObtenu?.toString() || '');
    setDateDepot(subvention.dateDepot);
    setDateReponse(subvention.dateReponse || '');
    setStatut(subvention.statut);
    setNotes(subvention.notes || '');
    setIsAddDialogOpen(true);
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Subventions & Financements ({subventions.length})
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-48"
                />
              </div>
              <Select value={statutFilter} onValueChange={(v) => setStatutFilter(v as SubventionStatut | 'all')}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {statuts.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={onExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-700 hover:bg-slate-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingSubvention ? 'Modifier la subvention' : 'Nouvelle subvention'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Organisme *</Label>
                      <Input value={organisme} onChange={(e) => setOrganisme(e.target.value)} placeholder="Mairie de Paris, ANSSI..." />
                    </div>

                    <div className="space-y-2">
                      <Label>Intitulé *</Label>
                      <Input value={intitule} onChange={(e) => setIntitule(e.target.value)} placeholder="Aide au développement associatif" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Montant demandé (€) *</Label>
                        <Input type="number" step="0.01" value={montantDemande} onChange={(e) => setMontantDemande(e.target.value)} placeholder="5000" />
                      </div>
                      <div className="space-y-2">
                        <Label>Montant obtenu (€)</Label>
                        <Input type="number" step="0.01" value={montantObtenu} onChange={(e) => setMontantObtenu(e.target.value)} placeholder="3000" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date de dépôt *</Label>
                        <Input type="date" value={dateDepot} onChange={(e) => setDateDepot(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Date de réponse</Label>
                        <Input type="date" value={dateReponse} onChange={(e) => setDateReponse(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <Select value={statut} onValueChange={(v) => setStatut(v as SubventionStatut)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuts.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Documents requis, contacts..." />
                    </div>

                    <Button onClick={handleSubmit} className="w-full bg-slate-700 hover:bg-slate-800">
                      {editingSubvention ? 'Enregistrer les modifications' : 'Créer la subvention'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Liste des subventions */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Organisme</TableHead>
                  <TableHead>Intitulé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant demandé</TableHead>
                  <TableHead className="text-right">Montant obtenu</TableHead>
                  <TableHead>Date dépôt</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubventions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Aucune subvention trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubventions.map((subvention, index) => {
                    const statutConfig = statuts.find(s => s.value === subvention.statut);
                    return (
                      <TableRow key={subvention.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <TableCell className="font-medium">{subvention.organisme}</TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs truncate">{subvention.intitule}</TableCell>
                        <TableCell>
                          <Badge className={statutConfig?.color || ''}>
                            {statutConfig?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(subvention.montantDemande)}</TableCell>
                        <TableCell className="text-right">
                          {subvention.montantObtenu !== null && subvention.montantObtenu !== undefined
                            ? formatCurrency(subvention.montantObtenu)
                            : <span className="text-gray-400">-</span>
                          }
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(subvention.dateDepot).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(subvention)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                if (confirm('Supprimer cette subvention ?')) onDelete(subvention.id);
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
