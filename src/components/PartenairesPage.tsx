import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { Partenaire, PartenaireType } from '@/types';
import { Handshake, Plus, Trash2, Edit, Search, Filter, ExternalLink, Mail } from 'lucide-react';

interface PartenairesPageProps {
  partenaires: Partenaire[];
  onAdd: (partenaire: Omit<Partenaire, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Partenaire>) => void;
  onDelete: (id: string) => void;
}

const typesPartenaire: { value: PartenaireType; label: string; color: string }[] = [
  { value: 'technique', label: 'Technique', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'financier', label: 'Financier', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'media', label: 'Média', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'autre', label: 'Autre', color: 'bg-muted text-foreground' }
];

export function PartenairesPage({ partenaires, onAdd, onUpdate, onDelete }: PartenairesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<PartenaireType | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPartenaire, setEditingPartenaire] = useState<Partenaire | null>(null);

  const [nom, setNom] = useState('');
  const [type, setType] = useState<PartenaireType>('technique');
  const [valeurApport, setValeurApport] = useState('');
  const [url, setUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactNom, setContactNom] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactTelephone, setContactTelephone] = useState('');
  const [notes, setNotes] = useState('');
  const [dateDebutPartenariat, setDateDebutPartenariat] = useState('');

  const filteredPartenaires = partenaires.filter(p => {
    const matchesSearch = p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.contactNom?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  }).sort((a, b) => a.nom.localeCompare(b.nom));

  const resetForm = () => {
    setNom('');
    setType('technique');
    setValeurApport('');
    setUrl('');
    setLogoUrl('');
    setContactNom('');
    setContactEmail('');
    setContactTelephone('');
    setNotes('');
    setDateDebutPartenariat('');
  };

  const handleSubmit = () => {
    if (!nom.trim()) return;

    const partenaireData: Omit<Partenaire, 'id'> = {
      nom: nom.trim(),
      type,
      valeurApport: valeurApport ? parseFloat(valeurApport) : undefined,
      url: url.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      contactNom: contactNom.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactTelephone: contactTelephone.trim() || undefined,
      notes: notes.trim() || undefined,
      dateDebutPartenariat: dateDebutPartenariat || undefined
    };

    if (editingPartenaire) {
      onUpdate(editingPartenaire.id, partenaireData);
      setEditingPartenaire(null);
    } else {
      onAdd(partenaireData);
    }

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (partenaire: Partenaire) => {
    setEditingPartenaire(partenaire);
    setNom(partenaire.nom);
    setType(partenaire.type);
    setValeurApport(partenaire.valeurApport?.toString() || '');
    setUrl(partenaire.url || '');
    setLogoUrl(partenaire.logoUrl || '');
    setContactNom(partenaire.contactNom || '');
    setContactEmail(partenaire.contactEmail || '');
    setContactTelephone(partenaire.contactTelephone || '');
    setNotes(partenaire.notes || '');
    setDateDebutPartenariat(partenaire.dateDebutPartenariat || '');
    setIsAddDialogOpen(true);
  };

  const formatCurrency = (value?: number) => 
    value !== undefined 
      ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
      : '-';

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="bg-muted/50 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Handshake className="h-5 w-5 text-indigo-500" />
              Partenaires & Sponsors ({partenaires.length})
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-48"
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as PartenaireType | 'all')}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {typesPartenaire.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPartenaire ? 'Modifier le partenaire' : 'Nouveau partenaire'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom *</Label>
                        <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du partenaire" />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={type} onValueChange={(v) => setType(v as PartenaireType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {typesPartenaire.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Valeur de l'apport (€)</Label>
                        <Input type="number" step="0.01" value={valeurApport} onChange={(e) => setValeurApport(e.target.value)} placeholder="5000" />
                      </div>
                      <div className="space-y-2">
                        <Label>Date début partenariat</Label>
                        <Input type="date" value={dateDebutPartenariat} onChange={(e) => setDateDebutPartenariat(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Site web</Label>
                      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://exemple.fr" />
                    </div>

                    <div className="space-y-2">
                      <Label>URL du logo</Label>
                      <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://exemple.fr" />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-foreground mb-3">Contact</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nom</Label>
                          <Input value={contactNom} onChange={(e) => setContactNom(e.target.value)} placeholder="Prénom Nom" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contact@..." />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label>Téléphone</Label>
                        <Input value={contactTelephone} onChange={(e) => setContactTelephone(e.target.value)} placeholder="01 23 45 67 89" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Informations complémentaires..." />
                    </div>

                    <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90">
                      {editingPartenaire ? 'Enregistrer les modifications' : 'Créer le partenaire'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Liste des partenaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPartenaires.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground bg-card rounded-lg border border-border">
            Aucun partenaire trouvé
          </div>
        ) : (
          filteredPartenaires.map((partenaire) => {
            const typeConfig = typesPartenaire.find(t => t.value === partenaire.type);
            return (
              <Card key={partenaire.id} className="border border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{partenaire.nom}</h3>
                      <Badge className={typeConfig?.color || ''}>
                        {typeConfig?.label}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(partenaire)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          if (confirm('Supprimer ce partenaire ?')) onDelete(partenaire.id);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {partenaire.valeurApport !== undefined && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Apport : <span className="font-medium">{formatCurrency(partenaire.valeurApport)}</span>
                    </p>
                  )}

                  {partenaire.dateDebutPartenariat && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Depuis le {new Date(partenaire.dateDebutPartenariat).toLocaleDateString('fr-FR')}
                    </p>
                  )}

                  {partenaire.contactNom && (
                    <p className="text-sm text-muted-foreground mb-1">{partenaire.contactNom}</p>
                  )}

                  <div className="flex gap-2 mt-3">
                    {partenaire.url && (
                      <a href={partenaire.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Site
                        </Button>
                      </a>
                    )}
                    {partenaire.contactEmail && (
                      <a href={`mailto:${partenaire.contactEmail}`}>
                        <Button variant="outline" size="sm">
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
