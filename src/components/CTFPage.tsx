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
import type { CTFEvent, Person, CTFPlateforme, CTFType } from '@/types';
import { Trophy, Users, Plus, Trash2, Edit, Search, Filter } from 'lucide-react';

interface CTFPageProps {
  ctfEvents: CTFEvent[];
  persons: Person[];
  onAdd: (ctf: Omit<CTFEvent, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<CTFEvent>) => void;
  onDelete: (id: string) => void;
}

const plateformes: CTFPlateforme[] = ['HTB', 'RootMe', 'PicoCTF', 'THM', 'Autre'];

export function CTFPage({ ctfEvents, persons, onAdd, onUpdate, onDelete }: CTFPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [plateformeFilter, setPlateformeFilter] = useState<CTFPlateforme | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCTF, setEditingCTF] = useState<CTFEvent | null>(null);

  const [nom, setNom] = useState('');
  const [plateforme, setPlateforme] = useState<CTFPlateforme>('HTB');
  const [type, setType] = useState<CTFType>('online');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [rang, setRang] = useState('');
  const [totalEquipes, setTotalEquipes] = useState('');
  const [scoreObtenu, setScoreObtenu] = useState('');
  const [scoreMax, setScoreMax] = useState('');
  const [noteInterne, setNoteInterne] = useState('');

  const filteredCTFs = ctfEvents.filter(ctf => {
    const matchesSearch = ctf.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ctf.plateforme.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlateforme = plateformeFilter === 'all' || ctf.plateforme === plateformeFilter;
    return matchesSearch && matchesPlateforme;
  }).sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime());

  const resetForm = () => {
    setNom('');
    setPlateforme('HTB');
    setType('online');
    setDateDebut('');
    setDateFin('');
    setSelectedParticipants([]);
    setRang('');
    setTotalEquipes('');
    setScoreObtenu('');
    setScoreMax('');
    setNoteInterne('');
  };

  const handleSubmit = () => {
    if (!nom.trim() || !dateDebut) return;

    const ctfData: Omit<CTFEvent, 'id'> = {
      nom: nom.trim(),
      plateforme,
      type,
      dateDebut,
      dateFin: dateFin || dateDebut,
      participants: selectedParticipants,
      classement: rang && totalEquipes ? {
        rang: parseInt(rang),
        totalEquipes: parseInt(totalEquipes)
      } : undefined,
      scoreObtenu: scoreObtenu ? parseInt(scoreObtenu) : undefined,
      scoreMax: scoreMax ? parseInt(scoreMax) : undefined,
      noteInterne: noteInterne.trim() || undefined
    };

    if (editingCTF) {
      onUpdate(editingCTF.id, ctfData);
      setEditingCTF(null);
    } else {
      onAdd(ctfData);
    }

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (ctf: CTFEvent) => {
    setEditingCTF(ctf);
    setNom(ctf.nom);
    setPlateforme(ctf.plateforme);
    setType(ctf.type);
    setDateDebut(ctf.dateDebut);
    setDateFin(ctf.dateFin);
    setSelectedParticipants(ctf.participants);
    setRang(ctf.classement?.rang.toString() || '');
    setTotalEquipes(ctf.classement?.totalEquipes.toString() || '');
    setScoreObtenu(ctf.scoreObtenu?.toString() || '');
    setScoreMax(ctf.scoreMax?.toString() || '');
    setNoteInterne(ctf.noteInterne || '');
    setIsAddDialogOpen(true);
  };

  const toggleParticipant = (personId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };


  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              CTF & Compétitions ({ctfEvents.length})
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
              <Select value={plateformeFilter} onValueChange={(v) => setPlateformeFilter(v as CTFPlateforme | 'all')}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Plateforme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {plateformes.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-700 hover:bg-slate-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCTF ? 'Modifier le CTF' : 'Nouveau CTF'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom du CTF *</Label>
                        <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="CyberApocalypse 2025" />
                      </div>
                      <div className="space-y-2">
                        <Label>Plateforme *</Label>
                        <Select value={plateforme} onValueChange={(v) => setPlateforme(v as CTFPlateforme)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {plateformes.map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={type} onValueChange={(v) => setType(v as CTFType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="onsite">On-site</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date début *</Label>
                        <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Date fin</Label>
                      <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Participants</Label>
                      <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                        {persons.filter(p => p.type !== 'anonyme').map(person => (
                          <label key={person.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={selectedParticipants.includes(person.id)}
                              onChange={() => toggleParticipant(person.id)}
                              className="rounded"
                            />
                            <span className="text-sm">{person.prenom} {person.nom}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Rang</Label>
                        <Input type="number" value={rang} onChange={(e) => setRang(e.target.value)} placeholder="42" />
                      </div>
                      <div className="space-y-2">
                        <Label>Total équipes</Label>
                        <Input type="number" value={totalEquipes} onChange={(e) => setTotalEquipes(e.target.value)} placeholder="500" />
                      </div>
                      <div className="space-y-2">
                        <Label>Score obtenu</Label>
                        <Input type="number" value={scoreObtenu} onChange={(e) => setScoreObtenu(e.target.value)} placeholder="3500" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Score maximum</Label>
                      <Input type="number" value={scoreMax} onChange={(e) => setScoreMax(e.target.value)} placeholder="10000" />
                    </div>

                    <div className="space-y-2">
                      <Label>Note interne</Label>
                      <Textarea value={noteInterne} onChange={(e) => setNoteInterne(e.target.value)} placeholder="Commentaires..." />
                    </div>

                    <Button onClick={handleSubmit} className="w-full bg-slate-700 hover:bg-slate-800">
                      {editingCTF ? 'Enregistrer les modifications' : 'Créer le CTF'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Liste des CTFs */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Nom</TableHead>
                  <TableHead>Plateforme</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Classement</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCTFs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Aucun CTF trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCTFs.map((ctf, index) => (
                    <TableRow key={ctf.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <TableCell className="font-medium">
                        {ctf.nom}
                        {ctf.type === 'onsite' && (
                          <Badge variant="secondary" className="ml-2">On-site</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ctf.plateforme}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(ctf.dateDebut).toLocaleDateString('fr-FR')}
                        {ctf.dateFin !== ctf.dateDebut && (
                          <> - {new Date(ctf.dateFin).toLocaleDateString('fr-FR')}</>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="h-3 w-3" />
                          {ctf.participants.length}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ctf.classement ? (
                          <span className="text-sm font-medium">
                            {ctf.classement.rang} / {ctf.classement.totalEquipes}
                            <span className="text-gray-400 text-xs ml-1">
                              (top {((ctf.classement.rang / ctf.classement.totalEquipes) * 100).toFixed(1)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ctf.scoreObtenu !== undefined && ctf.scoreMax ? (
                          <span className="text-sm">
                            {ctf.scoreObtenu} / {ctf.scoreMax}
                            <span className="text-gray-400 text-xs ml-1">
                              ({((ctf.scoreObtenu / ctf.scoreMax) * 100).toFixed(0)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(ctf)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              if (confirm('Supprimer ce CTF ?')) onDelete(ctf.id);
                            }}
                            className="text-red-600 hover:text-red-800"
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
    </div>
  );
}
