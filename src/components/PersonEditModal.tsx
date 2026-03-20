import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Person, PersonType, TarifAdhesion } from '@/types';
import { X } from 'lucide-react';

interface PersonEditModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Person>) => void;
  tarifsAdhesion: TarifAdhesion[];
}

export function PersonEditModal({ person, isOpen, onClose, onSave, tarifsAdhesion }: PersonEditModalProps) {
  const [type, setType] = useState<PersonType>('membre');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [idDiscord, setIdDiscord] = useState('');
  const [nombreActivitesDiscord, setNombreActivitesDiscord] = useState('');
  const [estAJourCotisation, setEstAJourCotisation] = useState(false);
  const [tarifAdhesionId, setTarifAdhesionId] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    if (person) {
      setType(person.type);
      setNom(person.nom);
      setPrenom(person.prenom);
      setEmail(person.email || '');
      setTelephone(person.telephone || '');
      setIdDiscord(person.kpiDiscord?.idDiscord || '');
      setNombreActivitesDiscord(person.kpiDiscord?.nombreActivites.toString() || '');
      setEstAJourCotisation(person.estAJourCotisation);
      setTarifAdhesionId(person.tarifAdhesionId || '');
      setCertifications(person.certifications || []);
    }
  }, [person]);

  const handleSubmit = () => {
    if (!person || !nom.trim() || !prenom.trim()) return;

    const updates: Partial<Person> = {
      type,
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim() || undefined,
      telephone: telephone.trim() || undefined,
      estAJourCotisation,
      tarifAdhesionId: tarifAdhesionId || undefined,
      certifications: certifications.length > 0 ? certifications : undefined
    };

    if (idDiscord.trim()) {
      updates.kpiDiscord = {
        idDiscord: idDiscord.trim(),
        nombreActivites: parseInt(nombreActivitesDiscord) || 0,
        derniereActivite: person.kpiDiscord?.derniereActivite
      };
    } else {
      updates.kpiDiscord = undefined;
    }

    onSave(person.id, updates);
    onClose();
  };

  const addCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const removeCertification = (cert: string) => {
    setCertifications(certifications.filter(c => c !== cert));
  };

  if (!person) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier {person.prenom} {person.nom}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as PersonType)}>
                <SelectTrigger>
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
              <Label>Prénom *</Label>
              <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Discord</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Discord</Label>
                <Input value={idDiscord} onChange={(e) => setIdDiscord(e.target.value)} placeholder="123456789..." />
              </div>
              <div className="space-y-2">
                <Label>Nombre d'activités</Label>
                <Input type="number" value={nombreActivitesDiscord} onChange={(e) => setNombreActivitesDiscord(e.target.value)} />
              </div>
            </div>
          </div>

          {type === 'adherent' && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Adhésion</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox checked={estAJourCotisation} onCheckedChange={(c) => setEstAJourCotisation(c as boolean)} />
                  <Label>À jour de cotisation</Label>
                </div>
                <div className="space-y-2">
                  <Label>Tarif d'adhésion</Label>
                  <Select value={tarifAdhesionId} onValueChange={setTarifAdhesionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un tarif" />
                    </SelectTrigger>
                    <SelectContent>
                      {tarifsAdhesion.filter(t => t.estActif).map(tarif => (
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

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Certifications</h4>
            <div className="flex gap-2 mb-3">
              <Input 
                value={newCertification} 
                onChange={(e) => setNewCertification(e.target.value)} 
                placeholder="e.g., OSCP, CEH, eJPT"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
              />
              <Button type="button" onClick={addCertification} variant="outline">Ajouter</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {certifications.map(cert => (
                <Badge key={cert} variant="secondary" className="flex items-center gap-1">
                  {cert}
                  <button onClick={() => removeCertification(cert)} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full bg-slate-700 hover:bg-slate-800">
            Enregistrer les modifications
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
