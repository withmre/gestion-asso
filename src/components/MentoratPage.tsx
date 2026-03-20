import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Trash2, Pencil, Star, Clock, BookOpen, Search } from 'lucide-react';
import type { SessionMentorat, Person } from '@/types';

const STATUTS: { value: SessionMentorat['statut']; label: string; color: string }[] = [
  { value: 'planifiee', label: 'Planifiée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'realisee', label: 'Réalisée', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'annulee', label: 'Annulée', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

interface SessionFormData {
  mentorId: string;
  apprentiId: string;
  date: string;
  dureeMinutes: number;
  thematiqueAbordee: string;
  objectifSession: string;
  notesPrivees: string;
  progressionPercue: number;
  statut: SessionMentorat['statut'];
}

const formVide: SessionFormData = {
  mentorId: '', apprentiId: '', date: new Date().toISOString().split('T')[0],
  dureeMinutes: 60, thematiqueAbordee: '', objectifSession: '', notesPrivees: '',
  progressionPercue: 3, statut: 'planifiee',
};

interface MentoratPageProps {
  sessions: SessionMentorat[];
  persons: Person[];
  onAdd: (s: Omit<SessionMentorat, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<SessionMentorat>) => void;
  onDelete: (id: string) => void;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`transition-colors ${n <= value ? 'text-amber-400' : 'text-muted-foreground/30'} hover:text-amber-400`}
        >
          <Star className="h-5 w-5 fill-current" />
        </button>
      ))}
    </div>
  );
}

function PersonName({ id, persons }: { id: string; persons: Person[] }) {
  const p = persons.find(x => x.id === id);
  return <span>{p ? `${p.prenom} ${p.nom}` : 'Inconnu'}</span>;
}

export function MentoratPage({ sessions, persons, onAdd, onUpdate, onDelete }: MentoratPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionMentorat | null>(null);
  const [form, setForm] = useState<SessionFormData>(formVide);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('all');

  const mentors = persons.filter(p => p.roleMentorat === 'mentor' || p.roleMentorat === 'les_deux');
  const apprentis = persons.filter(p => p.roleMentorat === 'apprenti' || p.roleMentorat === 'les_deux');

  const update = (f: Partial<SessionFormData>) => setForm(prev => ({ ...prev, ...f }));

  const openCreate = () => {
    setForm(formVide);
    setEditingSession(null);
    setShowForm(true);
  };

  const openEdit = (s: SessionMentorat) => {
    setForm({
      mentorId: s.mentorId, apprentiId: s.apprentiId, date: s.date,
      dureeMinutes: s.dureeMinutes, thematiqueAbordee: s.thematiqueAbordee,
      objectifSession: s.objectifSession || '', notesPrivees: s.notesPrivees || '',
      progressionPercue: s.progressionPercue || 3, statut: s.statut,
    });
    setEditingSession(s);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.mentorId || !form.apprentiId || !form.thematiqueAbordee || !form.date) return;
    const data: Omit<SessionMentorat, 'id'> = {
      mentorId: form.mentorId, apprentiId: form.apprentiId, date: form.date,
      dureeMinutes: form.dureeMinutes, thematiqueAbordee: form.thematiqueAbordee,
      objectifSession: form.objectifSession || undefined,
      notesPrivees: form.notesPrivees || undefined,
      progressionPercue: form.progressionPercue as SessionMentorat['progressionPercue'],
      statut: form.statut,
    };
    if (editingSession) {
      onUpdate(editingSession.id, data);
    } else {
      onAdd(data);
    }
    setShowForm(false);
  };

  const filtered = useMemo(() =>
    sessions.filter(s => {
      const mentor = persons.find(p => p.id === s.mentorId);
      const apprenti = persons.find(p => p.id === s.apprentiId);
      const matchSearch = s.thematiqueAbordee.toLowerCase().includes(search.toLowerCase()) ||
        `${mentor?.prenom} ${mentor?.nom}`.toLowerCase().includes(search.toLowerCase()) ||
        `${apprenti?.prenom} ${apprenti?.nom}`.toLowerCase().includes(search.toLowerCase());
      const matchStatut = statutFilter === 'all' || s.statut === statutFilter;
      return matchSearch && matchStatut;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [sessions, persons, search, statutFilter]
  );

  // Stats
  const realisees = sessions.filter(s => s.statut === 'realisee');
  const heuresTotales = realisees.reduce((s, x) => s + x.dureeMinutes, 0);
  const progressionMoy = realisees.filter(s => s.progressionPercue).length > 0
    ? realisees.filter(s => s.progressionPercue).reduce((s, x) => s + (x.progressionPercue || 0), 0) / realisees.filter(s => s.progressionPercue).length
    : 0;

  // Binômes actifs
  const binomes = useMemo(() => {
    const map = new Map<string, { mentorId: string; apprentiId: string; nbSessions: number; derniereDate: string }>();
    sessions.forEach(s => {
      const key = `${s.mentorId}:${s.apprentiId}`;
      const existing = map.get(key);
      if (!existing || s.date > existing.derniereDate) {
        map.set(key, { mentorId: s.mentorId, apprentiId: s.apprentiId, nbSessions: (existing?.nbSessions || 0) + 1, derniereDate: s.date });
      } else {
        map.set(key, { ...existing, nbSessions: existing.nbSessions + 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.nbSessions - a.nbSessions);
  }, [sessions]);

  const thematiques = useMemo(() => {
    const counts: Record<string, number> = {};
    realisees.forEach(s => { counts[s.thematiqueAbordee] = (counts[s.thematiqueAbordee] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [realisees]);

  const personOptions = persons.filter(p => p.type !== 'anonyme');

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Sessions totales', value: sessions.length.toString(), icon: BookOpen, color: 'text-blue-600' },
          { label: 'Sessions réalisées', value: realisees.length.toString(), icon: Users, color: 'text-green-600' },
          { label: 'Heures de mentorat', value: `${Math.round(heuresTotales / 60)}h${heuresTotales % 60 > 0 ? String(heuresTotales % 60).padStart(2, '0') : ''}`, icon: Clock, color: 'text-amber-600' },
          { label: 'Progression moyenne', value: progressionMoy > 0 ? `${progressionMoy.toFixed(1)} / 5` : '—', icon: Star, color: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Binômes + thématiques */}
      {(binomes.length > 0 || thematiques.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {binomes.length > 0 && (
            <Card className="border border-border shadow-sm">
              <CardHeader className="bg-muted/50 border-b border-border">
                <CardTitle className="text-base font-semibold">Binômes actifs</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {binomes.slice(0, 5).map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground"><PersonName id={b.mentorId} persons={persons} /></span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-foreground"><PersonName id={b.apprentiId} persons={persons} /></span>
                    </div>
                    <Badge variant="outline" className="text-xs">{b.nbSessions} session{b.nbSessions > 1 ? 's' : ''}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {thematiques.length > 0 && (
            <Card className="border border-border shadow-sm">
              <CardHeader className="bg-muted/50 border-b border-border">
                <CardTitle className="text-base font-semibold">Thématiques les plus abordées</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {thematiques.map(([theme, count], i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground">{theme}</span>
                        <span className="text-xs text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(count / thematiques[0][1]) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Liste des sessions */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="bg-muted/50 border-b border-border">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sessions de mentorat ({sessions.length})
            </CardTitle>
            <Button size="sm" onClick={openCreate} className="bg-[#1E3A5F] hover:bg-[#16294a] text-white">
              <Plus className="h-4 w-4 mr-1.5" />Nouvelle session
            </Button>
          </div>
          <div className="flex gap-3 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" />
            </div>
            <select
              value={statutFilter}
              onChange={e => setStatutFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Tous les statuts</option>
              {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune session. Créez vos premières sessions de mentorat.</p>
              {mentors.length === 0 && (
                <p className="text-xs mt-2 text-amber-600 dark:text-amber-400">
                  Astuce : définissez le rôle "Mentor" sur les personnes concernées dans la page Personnes.
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Mentor</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Apprenti</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Thématique</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Durée</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Progression</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Statut</TableHead>
                  <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s, i) => {
                  const statut = STATUTS.find(x => x.value === s.statut);
                  return (
                    <TableRow key={s.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <TableCell className="text-sm">{new Date(s.date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="text-sm font-medium"><PersonName id={s.mentorId} persons={persons} /></TableCell>
                      <TableCell className="text-sm"><PersonName id={s.apprentiId} persons={persons} /></TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{s.thematiqueAbordee}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.dureeMinutes >= 60 ? `${Math.floor(s.dureeMinutes / 60)}h${s.dureeMinutes % 60 > 0 ? String(s.dureeMinutes % 60).padStart(2, '0') : ''}` : `${s.dureeMinutes}min`}
                      </TableCell>
                      <TableCell>
                        {s.progressionPercue ? (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(n => (
                              <Star key={n} className={`h-3.5 w-3.5 ${n <= (s.progressionPercue || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/20'}`} />
                            ))}
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${statut?.color}`}>{statut?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="h-7 w-7 p-0">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onDelete(s.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog formulaire */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {editingSession ? 'Modifier la session' : 'Nouvelle session de mentorat'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Mentor *</Label>
                <Select value={form.mentorId} onValueChange={v => update({ mentorId: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {(mentors.length > 0 ? mentors : personOptions).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.prenom} {p.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Apprenti *</Label>
                <Select value={form.apprentiId} onValueChange={v => update({ apprentiId: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {(apprentis.length > 0 ? apprentis : personOptions).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.prenom} {p.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => update({ date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Durée (minutes)</Label>
                <Input type="number" min="15" step="15" value={form.dureeMinutes} onChange={e => update({ dureeMinutes: parseInt(e.target.value) || 60 })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Thématique abordée *</Label>
              <Input value={form.thematiqueAbordee} onChange={e => update({ thematiqueAbordee: e.target.value })} placeholder="Ex : Introduction au Pentest, OSINT, CTF..." />
            </div>

            <div className="space-y-1.5">
              <Label>Objectif de la session</Label>
              <Input value={form.objectifSession} onChange={e => update({ objectifSession: e.target.value })} placeholder="Ex : Comprendre les techniques de reconnaissance" />
            </div>

            <div className="space-y-1.5">
              <Label>Notes (privées)</Label>
              <Textarea value={form.notesPrivees} onChange={e => update({ notesPrivees: e.target.value })} rows={3} className="resize-none" placeholder="Notes internes sur la session..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={form.statut} onValueChange={v => update({ statut: v as SessionMentorat['statut'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Progression perçue</Label>
                <StarRating value={form.progressionPercue} onChange={v => update({ progressionPercue: v })} />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={!form.mentorId || !form.apprentiId || !form.thematiqueAbordee || !form.date}
                className="flex-1 bg-[#1E3A5F] hover:bg-[#16294a] text-white"
              >
                {editingSession ? 'Enregistrer' : 'Créer la session'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
