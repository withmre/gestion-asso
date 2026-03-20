import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, FileSpreadsheet, AlertTriangle, Building2, Calendar } from 'lucide-react';
import type { AssociationParams, TypeAdhesion } from '@/types';

interface DataManagementProps {
  params: AssociationParams;
  onUpdateParams: (params: Partial<AssociationParams>) => void;
  onExportJSON: () => string;
  onImportJSON: (json: string) => boolean;
  onGenerateExcel: (mois: number, annee: number) => void;
  onGenerateExcelAnnuel: (annee: number) => void;
}

export function DataManagement({
  params,
  onUpdateParams,
  onExportJSON,
  onImportJSON,
  onGenerateExcel,
  onGenerateExcelAnnuel,
}: DataManagementProps) {
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedAnnualYear, setSelectedAnnualYear] = useState(currentYear.toString());
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  const typeAdhesionLabels: Record<TypeAdhesion, string> = {
    annuelle_civile: 'Annuelle civile (1er janvier – 31 décembre)',
    annuelle_coulante: 'Annuelle coulante (1 an à partir du paiement)',
    mensuelle: 'Mensuelle',
  };

  const handleExportJSON = () => {
    const json = onExportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `association_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = onImportJSON(content);
        if (success) {
          setImportSuccess(true);
          setImportError(null);
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          setImportError('Format de fichier invalide');
        }
      } catch {
        setImportError('Erreur lors de la lecture du fichier');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">

      {/* ── Configuration de l'association ─────────────────────────────── */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Configuration de l&apos;association
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">

          {/* Nom */}
          <div className="space-y-1.5">
            <Label htmlFor="nom" className="text-gray-700">Nom de l&apos;association</Label>
            <Input
              id="nom"
              value={params.nom || ''}
              onChange={(e) => onUpdateParams({ nom: e.target.value })}
              placeholder="Mon Association"
              className="border-gray-300"
            />
          </div>

          {/* RNA / SIRET */}
          <div className="space-y-1.5">
            <Label htmlFor="siret" className="text-gray-700">RNA / SIRET</Label>
            <Input
              id="siret"
              value={params.siret || ''}
              onChange={(e) => onUpdateParams({ siret: e.target.value })}
              placeholder="W123456789 ou 123 456 789 00010"
              className="border-gray-300"
            />
          </div>

          {/* Site web */}
          <div className="space-y-1.5">
            <Label htmlFor="siteWeb" className="text-gray-700">Site web</Label>
            <Input
              id="siteWeb"
              type="url"
              value={params.siteWeb || ''}
              onChange={(e) => onUpdateParams({ siteWeb: e.target.value })}
              placeholder="https://exemple.fr"
              className="border-gray-300"
            />
          </div>

          {/* Adresse */}
          <div className="space-y-1.5">
            <Label htmlFor="adresse" className="text-gray-700">Adresse postale</Label>
            <Textarea
              id="adresse"
              value={params.adresse || ''}
              onChange={(e) => onUpdateParams({ adresse: e.target.value })}
              placeholder={"12 rue de la République\n75001 Paris"}
              rows={2}
              className="border-gray-300 resize-none"
            />
          </div>

          {/* URL du logo */}
          <div className="space-y-1.5">
            <Label htmlFor="logoUrl" className="text-gray-700">URL du logo</Label>
            <Input
              id="logoUrl"
              type="url"
              value={params.logoUrl || ''}
              onChange={(e) => onUpdateParams({ logoUrl: e.target.value })}
              placeholder="https://exemple.fr"
              className="border-gray-300"
            />
            {params.logoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={params.logoUrl}
                  alt="Aperçu du logo"
                  className="h-10 w-10 rounded object-contain border border-gray-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-xs text-gray-500">Aperçu du logo</span>
              </div>
            )}
          </div>

          {/* Type d'adhésion */}
          <div className="space-y-1.5">
            <Label htmlFor="typeAdhesion" className="text-gray-700">Type d&apos;adhésion</Label>
            <Select
              value={params.typeAdhesion}
              onValueChange={(v) => onUpdateParams({ typeAdhesion: v as TypeAdhesion })}
            >
              <SelectTrigger className="border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annuelle_civile">{typeAdhesionLabels.annuelle_civile}</SelectItem>
                <SelectItem value="annuelle_coulante">{typeAdhesionLabels.annuelle_coulante}</SelectItem>
                <SelectItem value="mensuelle">{typeAdhesionLabels.mensuelle}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Ce paramètre détermine comment les dates d&apos;adhésion sont calculées et les alertes générées.
            </p>
          </div>

        </CardContent>
      </Card>

      {/* ── Export Comptable Excel ──────────────────────────────────────── */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Comptable Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="mensuel" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100">
              <TabsTrigger value="mensuel" className="flex items-center gap-1.5 data-[state=active]:bg-white">
                <Calendar className="h-4 w-4" />
                Rapport mensuel
              </TabsTrigger>
              <TabsTrigger value="annuel" className="flex items-center gap-1.5 data-[state=active]:bg-white">
                <FileSpreadsheet className="h-4 w-4" />
                Rapport annuel
              </TabsTrigger>
            </TabsList>

            {/* Mensuel */}
            <TabsContent value="mensuel" className="space-y-4 mt-0">
              <p className="text-sm text-gray-500">
                Génère un fichier Excel avec les feuilles Synthèse, Adhésions, Dons, Ventes et Dépenses pour le mois sélectionné.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-700">Mois</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-700">Année</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={() => onGenerateExcel(parseInt(selectedMonth), parseInt(selectedYear))}
                className="w-full bg-[#1E3A5F] hover:bg-[#16294a] text-white"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Générer le rapport mensuel
              </Button>
            </TabsContent>

            {/* Annuel */}
            <TabsContent value="annuel" className="space-y-4 mt-0">
              <p className="text-sm text-gray-500">
                Génère un rapport complet de l&apos;année avec les feuilles Synthèse annuelle, Adhésions, Dons, Ventes, Dépenses, Activités et Subventions.
              </p>
              <div className="space-y-1.5">
                <Label className="text-gray-700">Année</Label>
                <Select value={selectedAnnualYear} onValueChange={setSelectedAnnualYear}>
                  <SelectTrigger className="border-gray-300 max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => onGenerateExcelAnnuel(parseInt(selectedAnnualYear))}
                className="w-full bg-[#4A7C59] hover:bg-[#3d6849] text-white"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Générer le rapport annuel {selectedAnnualYear}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Sauvegarde JSON ────────────────────────────────────────────── */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Sauvegarde des données
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>Important :</strong> Exportez régulièrement vos données.
              Tout est stocké localement dans votre navigateur.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Exporter les données</h4>
              <p className="text-xs text-gray-500 mb-3">
                Sauvegarde complète : Personnes, Transactions, Activités, Bilan, Subventions, Partenaires, Paramètres.
              </p>
              <Button
                onClick={handleExportJSON}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter JSON
              </Button>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Importer des données</h4>
              <p className="text-xs text-gray-500 mb-3">
                Restaurez depuis un fichier JSON de sauvegarde. <strong>Remplace</strong> les données actuelles.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importer JSON
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Confirmer l&apos;importation
                    </DialogTitle>
                    <DialogDescription>
                      L&apos;importation remplacera toutes les données actuelles de manière irréversible.
                      Assurez-vous d&apos;avoir exporté une sauvegarde avant de continuer.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="border-gray-300"
                    />
                    {importError && (
                      <p className="text-sm text-red-600">{importError}</p>
                    )}
                    {importSuccess && (
                      <p className="text-sm text-green-700 font-medium">Importation réussie.</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
