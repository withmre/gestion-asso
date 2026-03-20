import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Participation, Person } from '@/types';

interface ParticipationEditModalProps {
  participation: Participation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Participation>) => void;
  persons: Person[];
}

export function ParticipationEditModal({ participation, isOpen, onClose, onSave, persons }: ParticipationEditModalProps) {
  const [personId, setPersonId] = useState('');
  const [activiteType, setActiviteType] = useState<'formation' | 'evenement' | 'ctf'>('formation');
  const [activiteNom, setActiviteNom] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (participation) {
      setPersonId(participation.personId);
      setActiviteType(participation.activiteType);
      setActiviteNom(participation.activiteNom);
      setDate(participation.date);
      setDescription(participation.description || '');
    }
  }, [participation]);

  const handleSubmit = () => {
    if (!participation || !personId || !activiteNom.trim() || !date) return;

    onSave(participation.id, {
      personId,
      activiteType,
      activiteNom: activiteNom.trim(),
      date,
      description: description.trim() || undefined
    });
    onClose();
  };

  if (!participation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier la participation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Personne *</Label>
            <Select value={personId} onValueChange={setPersonId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une personne" />
              </SelectTrigger>
              <SelectContent>
                {persons.filter(p => p.type !== 'anonyme').map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.prenom} {p.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type d&apos;activité *</Label>
            <Select value={activiteType} onValueChange={(v) => setActiviteType(v as 'formation' | 'evenement' | 'ctf')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formation">Formation</SelectItem>
                <SelectItem value="evenement">Événement</SelectItem>
                <SelectItem value="ctf">CTF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nom de l&apos;activité *</Label>
            <Input value={activiteNom} onChange={(e) => setActiviteNom(e.target.value)} placeholder="Ex: Formation Excel, Soirée réseautage..." />
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Commentaires..." />
          </div>

          <Button onClick={handleSubmit} className="w-full bg-slate-700 hover:bg-slate-800">
            Enregistrer les modifications
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
