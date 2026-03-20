import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TransactionType, VenteSousCategorie, DepenseCategorie, Person } from '@/types';

interface TransactionFormProps {
  persons: Person[];
  onSubmit: (transaction: {
    type: TransactionType;
    montant: number;
    date: string;
    personId: string;
    description?: string;
    venteSousCategorie?: VenteSousCategorie;
    depenseCategorie?: DepenseCategorie;
    dateDebutAdhesion?: string;
    dateFinAdhesion?: string;
  }) => void;
}

export function TransactionForm({ persons, onSubmit }: TransactionFormProps) {
  const [activeTab, setActiveTab] = useState<TransactionType>('adhesion');
  
  const [montant, setMontant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [personId, setPersonId] = useState('');
  const [description, setDescription] = useState('');
  
  const [venteCategorie, setVenteCategorie] = useState<VenteSousCategorie>('formation');
  const [depenseCategorie, setDepenseCategorie] = useState<DepenseCategorie>('achats');
  const [dateDebutAdhesion, setDateDebutAdhesion] = useState('');
  const [dateFinAdhesion, setDateFinAdhesion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!montant || !date) return;

    const baseTransaction = {
      montant: parseFloat(montant),
      date,
      personId: personId || 'anonyme',
      description: description.trim() || undefined
    };

    let transaction: Parameters<typeof onSubmit>[0];

    switch (activeTab) {
      case 'adhesion':
        transaction = {
          ...baseTransaction,
          type: 'adhesion',
          dateDebutAdhesion: dateDebutAdhesion || undefined,
          dateFinAdhesion: dateFinAdhesion || undefined
        };
        break;
      case 'don':
        transaction = {
          ...baseTransaction,
          type: 'don'
        };
        break;
      case 'vente':
        transaction = {
          ...baseTransaction,
          type: 'vente',
          venteSousCategorie: venteCategorie
        };
        break;
      case 'depense':
        transaction = {
          ...baseTransaction,
          type: 'depense',
          depenseCategorie: depenseCategorie
        };
        break;
    }

    onSubmit(transaction);

    setMontant('');
    setDescription('');
    setPersonId('');
    setDateDebutAdhesion('');
    setDateFinAdhesion('');
    setVenteCategorie('formation');
    setDepenseCategorie('achats');
  };

  const renderCommonFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="montant" className="text-gray-700">Montant (€) *</Label>
          <Input
            id="montant"
            type="number"
            step="0.01"
            min="0"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="0.00"
            className="border-gray-300"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date" className="text-gray-700">Date *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-gray-300"
            required
          />
        </div>
      </div>

      {activeTab !== 'depense' && (
        <div className="space-y-2">
          <Label htmlFor="person" className="text-gray-700">Personne associée</Label>
          <Select value={personId} onValueChange={setPersonId}>
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="Sélectionner une personne (optionnel)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anonyme">Anonyme</SelectItem>
              {persons.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.prenom} {p.nom} ({p.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-700">Description</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description optionnelle..."
          className="border-gray-300"
        />
      </div>
    </>
  );

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-800">Nouvelle Transaction</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TransactionType)}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="adhesion" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs">
              Adhésion
            </TabsTrigger>
            <TabsTrigger value="don" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">
              Don
            </TabsTrigger>
            <TabsTrigger value="vente" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-xs">
              Vente
            </TabsTrigger>
            <TabsTrigger value="depense" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">
              Dépense
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TabsContent value="adhesion" className="space-y-4 mt-0">
              {renderCommonFields()}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateDebut" className="text-gray-700">Date début adhésion</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    value={dateDebutAdhesion}
                    onChange={(e) => setDateDebutAdhesion(e.target.value)}
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFin" className="text-gray-700">Date fin adhésion</Label>
                  <Input
                    id="dateFin"
                    type="date"
                    value={dateFinAdhesion}
                    onChange={(e) => setDateFinAdhesion(e.target.value)}
                    className="border-gray-300"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Enregistrer l&apos;adhésion
              </Button>
            </TabsContent>

            <TabsContent value="don" className="space-y-4 mt-0">
              {renderCommonFields()}
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                Enregistrer le don
              </Button>
            </TabsContent>

            <TabsContent value="vente" className="space-y-4 mt-0">
              {renderCommonFields()}
              <div className="space-y-2">
                <Label htmlFor="categorie" className="text-gray-700">Catégorie de vente *</Label>
                <Select value={venteCategorie} onValueChange={(v) => setVenteCategorie(v as VenteSousCategorie)}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formation">Formation</SelectItem>
                    <SelectItem value="evenementiel">Événementiel</SelectItem>
                    <SelectItem value="vetements">Vêtements</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                Enregistrer la vente
              </Button>
            </TabsContent>

            <TabsContent value="depense" className="space-y-4 mt-0">
              {renderCommonFields()}
              <div className="space-y-2">
                <Label htmlFor="depenseCategorie" className="text-gray-700">Catégorie de dépense *</Label>
                <Select value={depenseCategorie} onValueChange={(v) => setDepenseCategorie(v as DepenseCategorie)}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="achats">Achats</SelectItem>
                    <SelectItem value="frais_bancaires">Frais bancaires</SelectItem>
                    <SelectItem value="prestations">Prestations externes</SelectItem>
                    <SelectItem value="loyer">Loyer</SelectItem>
                    <SelectItem value="charges">Charges (eau, élec, etc.)</SelectItem>
                    <SelectItem value="autres">Autres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
                Enregistrer la dépense
              </Button>
            </TabsContent>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
