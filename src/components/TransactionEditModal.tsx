import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Transaction, Person, TransactionType, VenteSousCategorie, DepenseCategorie } from '@/types';

interface TransactionEditModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Transaction>) => void;
  persons: Person[];
}

export function TransactionEditModal({ transaction, isOpen, onClose, onSave, persons }: TransactionEditModalProps) {
  const [type, setType] = useState<TransactionType>('adhesion');
  const [montant, setMontant] = useState('');
  const [date, setDate] = useState('');
  const [personId, setPersonId] = useState('');
  const [description, setDescription] = useState('');
  const [venteSousCategorie, setVenteSousCategorie] = useState<VenteSousCategorie>('formation');
  const [depenseCategorie, setDepenseCategorie] = useState<DepenseCategorie>('achats');
  const [dateDebutAdhesion, setDateDebutAdhesion] = useState('');
  const [dateFinAdhesion, setDateFinAdhesion] = useState('');

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setMontant(transaction.montant.toString());
      setDate(transaction.date);
      setPersonId(transaction.personId);
      setDescription(transaction.description || '');
      setVenteSousCategorie(transaction.venteSousCategorie || 'formation');
      setDepenseCategorie(transaction.depenseCategorie || 'achats');
      setDateDebutAdhesion(transaction.dateDebutAdhesion || '');
      setDateFinAdhesion(transaction.dateFinAdhesion || '');
    }
  }, [transaction]);

  const handleSubmit = () => {
    if (!transaction || !montant || !date) return;

    const updates: Partial<Transaction> = {
      type,
      montant: parseFloat(montant),
      date,
      personId,
      description: description.trim() || undefined
    };

    if (type === 'vente') {
      updates.venteSousCategorie = venteSousCategorie;
    }
    if (type === 'depense') {
      updates.depenseCategorie = depenseCategorie;
    }
    if (type === 'adhesion') {
      updates.dateDebutAdhesion = dateDebutAdhesion || undefined;
      updates.dateFinAdhesion = dateFinAdhesion || undefined;
    }

    onSave(transaction.id, updates);
    onClose();
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier la transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adhesion">Adhésion</SelectItem>
                <SelectItem value="don">Don</SelectItem>
                <SelectItem value="vente">Vente</SelectItem>
                <SelectItem value="depense">Dépense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant (€) *</Label>
              <Input type="number" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {type !== 'depense' && (
            <div className="space-y-2">
              <Label>Personne</Label>
              <Select value={personId} onValueChange={setPersonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une personne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anonyme">Anonyme</SelectItem>
                  {persons.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.prenom} {p.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'vente' && (
            <div className="space-y-2">
              <Label>Catégorie de vente</Label>
              <Select value={venteSousCategorie} onValueChange={(v) => setVenteSousCategorie(v as VenteSousCategorie)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formation">Formation</SelectItem>
                  <SelectItem value="evenementiel">Événementiel</SelectItem>
                  <SelectItem value="vetements">Vêtements</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'depense' && (
            <div className="space-y-2">
              <Label>Catégorie de dépense</Label>
              <Select value={depenseCategorie} onValueChange={(v) => setDepenseCategorie(v as DepenseCategorie)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="achats">Achats</SelectItem>
                  <SelectItem value="frais_bancaires">Frais bancaires</SelectItem>
                  <SelectItem value="prestations">Prestations</SelectItem>
                  <SelectItem value="loyer">Loyer</SelectItem>
                  <SelectItem value="charges">Charges</SelectItem>
                  <SelectItem value="autres">Autres</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'adhesion' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date début adhésion</Label>
                <Input type="date" value={dateDebutAdhesion} onChange={(e) => setDateDebutAdhesion(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date fin adhésion</Label>
                <Input type="date" value={dateFinAdhesion} onChange={(e) => setDateFinAdhesion(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description optionnelle..." />
          </div>

          <Button onClick={handleSubmit} className="w-full bg-slate-700 hover:bg-slate-800">
            Enregistrer les modifications
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
