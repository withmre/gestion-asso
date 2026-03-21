import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { PersonType, TarifAdhesion } from '@/types';
import { MessageSquare, User } from 'lucide-react';

interface PersonFormProps {
  tarifsAdhesion: TarifAdhesion[];
  onSubmit: (person: {
    type: PersonType;
    nom: string;
    prenom: string;
    email?: string;
    telephone?: string;
    kpiDiscord?: {
      idDiscord: string;
      nombreActivites: number;
      derniereActivite?: string;
    };
    estAJourCotisation: boolean;
    tarifAdhesionId?: string;
  }) => void;
}

export function PersonForm({ tarifsAdhesion, onSubmit }: PersonFormProps) {
  const [type, setType] = useState<PersonType>('membre');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [idDiscord, setIdDiscord] = useState('');
  const [nombreActivitesDiscord, setNombreActivitesDiscord] = useState('');
  const [estAJourCotisation, setEstAJourCotisation] = useState(false);
  const [tarifAdhesionId, setTarifAdhesionId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim()) return;

    const personData: Parameters<typeof onSubmit>[0] = {
      type,
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim() || undefined,
      telephone: telephone.trim() || undefined,
      estAJourCotisation,
      tarifAdhesionId: tarifAdhesionId || undefined,
    };

    if (idDiscord.trim()) {
      personData.kpiDiscord = {
        idDiscord: idDiscord.trim(),
        nombreActivites: parseInt(nombreActivitesDiscord) || 0
      };
    }

    onSubmit(personData);

    setNom('');
    setPrenom('');
    setEmail('');
    setTelephone('');
    setIdDiscord('');
    setNombreActivitesDiscord('');
    setEstAJourCotisation(false);
    setTarifAdhesionId('');
  };


  const tarifsActifs = tarifsAdhesion.filter(t => t.estActif);

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="bg-muted/50 border-b border-border">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <User className="h-5 w-5" />
          Nouvelle Personne
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-foreground">Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as PersonType)}>
                <SelectTrigger className="border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adherent">Adhérent</SelectItem>
                  <SelectItem value="membre">Membre</SelectItem>
                  <SelectItem value="anonyme">Anonyme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom" className="text-foreground">Prénom *</Label>
              <Input
                id="prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Prénom"
                className="border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nom" className="text-foreground">Nom *</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom"
              className="border-border"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone" className="text-foreground">Téléphone</Label>
              <Input
                id="telephone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="01 23 45 67 89"
                className="border-border"
              />
            </div>
          </div>

          {/* Discord */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              Discord (optionnel)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">ID Discord</Label>
                <Input
                  value={idDiscord}
                  onChange={(e) => setIdDiscord(e.target.value)}
                  placeholder="123456789012345678"
                  className="border-border font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Activités Discord</Label>
                <Input
                  type="number"
                  min="0"
                  value={nombreActivitesDiscord}
                  onChange={(e) => setNombreActivitesDiscord(e.target.value)}
                  placeholder="0"
                  className="border-border"
                />
              </div>
            </div>
          </div>

          {type === 'adherent' && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-foreground mb-3">Adhésion</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="aJourCotisation"
                    checked={estAJourCotisation}
                    onCheckedChange={(checked) => setEstAJourCotisation(checked as boolean)}
                  />
                  <Label htmlFor="aJourCotisation" className="text-foreground cursor-pointer">
                    À jour de cotisation
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Tarif d&apos;adhésion</Label>
                  <Select value={tarifAdhesionId} onValueChange={setTarifAdhesionId}>
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder="Sélectionner un tarif" />
                    </SelectTrigger>
                    <SelectContent>
                      {tarifsActifs.map(tarif => (
                        <SelectItem key={tarif.id} value={tarif.id}>
                          {tarif.libelle} ({tarif.montant}€)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            Ajouter la personne
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
