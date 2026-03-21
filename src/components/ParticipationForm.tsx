import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Person } from '@/types';
import { Calendar } from 'lucide-react';

interface ParticipationFormProps {
  persons: Person[];
  onSubmit: (participation: {
    personId: string;
    activiteType: 'formation' | 'evenement';
    activiteNom: string;
    date: string;
  }) => void;
}

export function ParticipationForm({ persons, onSubmit }: ParticipationFormProps) {
  const [personId, setPersonId] = useState('');
  const [activiteType, setActiviteType] = useState<'formation' | 'evenement'>('formation');
  const [activiteNom, setActiviteNom] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !activiteNom.trim()) return;

    onSubmit({
      personId,
      activiteType,
      activiteNom: activiteNom.trim(),
      date
    });

    setActiviteNom('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="bg-muted/50 border-b border-border">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Nouvelle Participation
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="person" className="text-foreground">Personne *</Label>
            <Select value={personId} onValueChange={setPersonId}>
              <SelectTrigger className="border-border">
                <SelectValue placeholder="Sélectionner une personne" />
              </SelectTrigger>
              <SelectContent>
                {persons.filter(p => p.type !== 'anonyme').map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.prenom} {p.nom} ({p.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-foreground">Type d&apos;activité *</Label>
            <Select value={activiteType} onValueChange={(v) => setActiviteType(v as 'formation' | 'evenement')}>
              <SelectTrigger className="border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formation">Formation</SelectItem>
                <SelectItem value="evenement">Événement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nom" className="text-foreground">Nom de l&apos;activité *</Label>
            <Input
              id="nom"
              value={activiteNom}
              onChange={(e) => setActiviteNom(e.target.value)}
              placeholder="Ex: Formation Excel, Soirée réseautage..."
              className="border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-foreground">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-border"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            Enregistrer la participation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
