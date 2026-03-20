import { useState, useRef } from 'react';
import JSZip from 'jszip';
import pako from 'pako';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileSpreadsheet, AlertTriangle, Building2, Calendar, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { AssociationParams, TypeAdhesion } from '@/types';
import { PinSetup } from './PinLock';

interface DataManagementProps {
  params: AssociationParams;
  onUpdateParams: (params: Partial<AssociationParams>) => void;
  onExportJSON: () => string;
  onImportJSON: (json: string) => boolean;
  onGenerateExcel: (mois: number, annee: number) => void;
  onGenerateExcelAnnuel: (annee: number) => void;
}

async function chiffrerJSON(json: string, motDePasse: string): Promise<string> {
  const encoder = new TextEncoder();
  const sel = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cle = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: sel, iterations: 100000, hash: 'SHA-256' },
    await crypto.subtle.importKey('raw', encoder.encode(motDePasse), 'PBKDF2', false, ['deriveKey']),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cle, encoder.encode(json));
  return JSON.stringify({
    algo: 'AES-256-GCM+PBKDF2-SHA256',
    iterations: 100000,
    sel: btoa(String.fromCharCode(...sel)),
    iv: btoa(String.fromCharCode(...iv)),
    donnees: btoa(String.fromCharCode(...new Uint8Array(chiffre))),
  });
}

async function dechiffrerJSON(contenu: string, motDePasse: string): Promise<string> {
  const encoder = new TextEncoder();
  const { sel: selB64, iv: ivB64, donnees: donneesB64, iterations } = JSON.parse(contenu);
  const sel = Uint8Array.from(atob(selB64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const chiffre = Uint8Array.from(atob(donneesB64), c => c.charCodeAt(0));
  const cle = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: sel, iterations: iterations || 100000, hash: 'SHA-256' },
    await crypto.subtle.importKey('raw', encoder.encode(motDePasse), 'PBKDF2', false, ['deriveKey']),
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const dechiffre = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cle, chiffre);
  return new TextDecoder().decode(dechiffre);
}

function contientDonneesRGPD(json: string): boolean {
  try {
    const data = JSON.parse(json);
    return (data.persons || []).some((p: { email?: string; telephone?: string }) => p.email || p.telephone);
  } catch {
    return false;
  }
}

export function DataManagement({ params, onUpdateParams, onExportJSON, onImportJSON, onGenerateExcel, onGenerateExcelAnnuel }: DataManagementProps) {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedAnnualYear, setSelectedAnnualYear] = useState(currentYear.toString());
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [mdpChiffrement, setMdpChiffrement] = useState('');
  const [mdpDechiffrement, setMdpDechiffrement] = useState('');
  const [erreurDechiffrement, setErreurDechiffrement] = useState<string | null>(null);
  const [exportEnCours, setExportEnCours] = useState(false);
  const [formatCompression, setFormatCompression] = useState<'json' | 'zip' | 'gz'>('json');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileChiffreRef = useRef<HTMLInputElement>(null);

  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
  const typeAdhesionLabels: Record<TypeAdhesion, string> = {
    annuelle_civile: 'Annuelle civile (1er janvier – 31 décembre)',
    annuelle_coulante: 'Annuelle coulante (1 an à partir du paiement)',
    mensuelle: 'Mensuelle',
  };

  const prochainVersion = (params.versionExport || 0) + 1;

  const nomFichier = (ext: string, chiffre = false) => {
    const d = new Date().toISOString().split('T')[0];
    const h = new Date().toTimeString().slice(0, 5).replace(':', 'h');
    return `backup_v${prochainVersion}_${d}_${h}${chiffre ? '_chiffre' : ''}.${ext}`;
  };

  const telecharger = (contenu: string, nom: string, type = 'application/json') => {
    const blob = new Blob([contenu], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const compresserEtTelecharger = async (contenu: string, nomBase: string) => {
    if (formatCompression === 'zip') {
      const zip = new JSZip();
      zip.file(`${nomBase}.json`, contenu);
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${nomBase}.zip`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } else if (formatCompression === 'gz') {
      const compressed = pako.gzip(new TextEncoder().encode(contenu));
      const blob = new Blob([compressed], { type: 'application/gzip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${nomBase}.json.gz`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } else {
      telecharger(contenu, `${nomBase}.json`);
    }
  };

  const decompresserFichier = async (file: File): Promise<string> => {
    if (file.name.endsWith('.zip')) {
      const zip = await JSZip.loadAsync(file);
      const fichierJSON = Object.values(zip.files).find(f => f.name.endsWith('.json'));
      if (!fichierJSON) throw new Error('Aucun fichier JSON trouvé dans l'archive ZIP.');
      return await fichierJSON.async('string');
    } else if (file.name.endsWith('.gz')) {
      const buffer = await file.arrayBuffer();
      const decompressed = pako.ungzip(new Uint8Array(buffer));
      return new TextDecoder().decode(decompressed);
    } else {
      return await file.text();
    }
  };

  const handleExportClair = async () => {
    const json = onExportJSON();
    const rgpd = contientDonneesRGPD(json);
    const doExport = async () => {
      const nomBase = nomFichier('json').replace('.json', '');
      await compresserEtTelecharger(json, nomBase);
      onUpdateParams({ versionExport: prochainVersion });
    };
    if (rgpd) {
      if (confirm('AVERTISSEMENT RGPD\n\nCe fichier contient des données personnelles (emails, téléphones).\nEn l\'exportant en clair, vous en devenez responsable de la sécurité du fichier.\n\nContinuer quand même ?')) {
        doExport();
      }
    } else {
      doExport();
    }
  };

  const handleExportChiffre = async () => {
    if (!mdpChiffrement) return;
    setExportEnCours(true);
    try {
      const json = onExportJSON();
      const chiffre = await chiffrerJSON(json, mdpChiffrement);
      const nomBase = nomFichier('json.enc', true).replace('.json.enc', '');
      if (formatCompression !== 'json') {
        await compresserEtTelecharger(chiffre, nomBase + '_chiffre');
      } else {
        telecharger(chiffre, nomFichier('json.enc', true));
      }
      onUpdateParams({ versionExport: prochainVersion });
      setMdpChiffrement('');
    } catch (e) {
      console.error(e);
    } finally {
      setExportEnCours(false);
    }
  };

  const handleImportClair = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const contenu = await decompresserFichier(file);
      const success = onImportJSON(contenu);
      if (success) { setImportSuccess(true); setImportError(null); setTimeout(() => setImportSuccess(false), 3000); }
      else setImportError('Format invalide.');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Erreur de lecture.');
    }
    e.target.value = '';
  };

  const handleImportChiffre = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mdpDechiffrement) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = await dechiffrerJSON(ev.target?.result as string, mdpDechiffrement);
        const success = onImportJSON(json);
        if (success) { setImportSuccess(true); setErreurDechiffrement(null); setMdpDechiffrement(''); setTimeout(() => setImportSuccess(false), 3000); }
        else setErreurDechiffrement('Données invalides après déchiffrement.');
      } catch { setErreurDechiffrement('Mot de passe incorrect ou fichier corrompu.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">

      <Card className="border border-border shadow-sm">
        <CardHeader className="bg-muted/50 border-b border-border">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Configuration de l&apos;association
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input value={params.nom || ''} onChange={(e) => onUpdateParams({ nom: e.target.value })} placeholder="Mon Association" />
          </div>
          <div className="space-y-1.5">
            <Label>RNA / SIRET</Label>
            <Input value={params.siret || ''} onChange={(e) => onUpdateParams({ siret: e.target.value })} placeholder="W123456789" />
          </div>
          <div className="space-y-1.5">
            <Label>Site web</Label>
            <Input type="url" value={params.siteWeb || ''} onChange={(e) => onUpdateParams({ siteWeb: e.target.value })} placeholder="https://exemple.fr" />
          </div>
          <div className="space-y-1.5">
            <Label>Adresse postale</Label>
            <Textarea value={params.adresse || ''} onChange={(e) => onUpdateParams({ adresse: e.target.value })} rows={2} className="resize-none" placeholder={"12 rue de la République\n75001 Paris"} />
          </div>
          <div className="space-y-1.5">
            <Label>URL du logo</Label>
            <Input type="url" value={params.logoUrl || ''} onChange={(e) => onUpdateParams({ logoUrl: e.target.value })} placeholder="https://exemple.fr/logo.png" />
            {params.logoUrl && (() => {
              try { new URL(params.logoUrl!); return true; } catch { return false; }
            })() && (
              <div className="mt-2 flex items-center gap-3">
                <img src={params.logoUrl} alt="Logo" className="h-10 w-10 rounded object-contain border border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-xs text-muted-foreground">Aperçu</span>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Type d&apos;adhésion</Label>
            <Select value={params.typeAdhesion} onValueChange={(v) => onUpdateParams({ typeAdhesion: v as TypeAdhesion })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="annuelle_civile">{typeAdhesionLabels.annuelle_civile}</SelectItem>
                <SelectItem value="annuelle_coulante">{typeAdhesionLabels.annuelle_coulante}</SelectItem>
                <SelectItem value="mensuelle">{typeAdhesionLabels.mensuelle}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="bg-muted/50 border-b border-border">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Verrouillage par code PIN
            {params.pinHash && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Activé</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-4">
            L&apos;application se verrouille après 5 minutes d&apos;inactivité. Le PIN est hashé (SHA-256) et ne quitte jamais votre navigateur.
          </p>
          <PinSetup existingHash={params.pinHash} onSave={(hash) => onUpdateParams({ pinHash: hash || undefined })} onSkip={() => {}} />
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="bg-muted/50 border-b border-border">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Comptable Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="mensuel">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="mensuel" className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />Mensuel</TabsTrigger>
              <TabsTrigger value="annuel" className="flex items-center gap-1.5"><FileSpreadsheet className="h-4 w-4" />Annuel</TabsTrigger>
            </TabsList>
            <TabsContent value="mensuel" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Mois</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Année</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => onGenerateExcel(parseInt(selectedMonth), parseInt(selectedYear))} className="w-full bg-[#1E3A5F] hover:bg-[#16294a] text-white">
                <FileSpreadsheet className="h-4 w-4 mr-2" />Générer le rapport mensuel
              </Button>
            </TabsContent>
            <TabsContent value="annuel" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label>Année</Label>
                <Select value={selectedAnnualYear} onValueChange={setSelectedAnnualYear}>
                  <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={() => onGenerateExcelAnnuel(parseInt(selectedAnnualYear))} className="w-full bg-[#4A7C59] hover:bg-[#3d6849] text-white">
                <FileSpreadsheet className="h-4 w-4 mr-2" />Générer le rapport annuel {selectedAnnualYear}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="bg-muted/50 border-b border-border">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Download className="h-5 w-5" />
            Sauvegarde des données
            <Badge variant="outline" className="text-xs font-normal">Prochaine : v{prochainVersion}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="clair">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="clair" className="flex items-center gap-1.5"><Download className="h-4 w-4" />Export clair</TabsTrigger>
              <TabsTrigger value="chiffre" className="flex items-center gap-1.5"><Lock className="h-4 w-4" />Export chiffré</TabsTrigger>
            </TabsList>

            <TabsContent value="clair" className="space-y-4 mt-0">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Si votre base contient des données personnelles (emails, téléphones), un avertissement RGPD s&apos;affichera. Vous êtes responsable de la sécurité du fichier.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Format de compression</Label>
                <Select value={formatCompression} onValueChange={v => setFormatCompression(v as 'json' | 'zip' | 'gz')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON brut (.json)</SelectItem>
                    <SelectItem value="zip">Archive ZIP (.zip) — recommandé</SelectItem>
                    <SelectItem value="gz">Gzip (.json.gz) — compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleExportClair} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Télécharger{formatCompression === 'zip' ? ' (.zip)' : formatCompression === 'gz' ? ' (.json.gz)' : ' (.json)'}
              </Button>
            </TabsContent>

            <TabsContent value="chiffre" className="space-y-4 mt-0">
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 dark:text-red-300 space-y-1">
                  <p className="font-semibold">Ne pas utiliser si vous ne savez pas déchiffrer le fichier.</p>
                  <p>Un fichier chiffré sans son mot de passe est irrécupérable de manière permanente.</p>
                  <p className="text-xs opacity-75">Algorithme : AES-256-GCM + PBKDF2-SHA256 (100 000 itérations)</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Mot de passe</Label>
                <Input type="password" value={mdpChiffrement} onChange={e => setMdpChiffrement(e.target.value)} placeholder="Mot de passe fort" />
              </div>
              <Button onClick={handleExportChiffre} disabled={!mdpChiffrement || exportEnCours} className="w-full bg-[#1E3A5F] hover:bg-[#16294a] text-white">
                <Lock className="h-4 w-4 mr-2" />{exportEnCours ? 'Chiffrement en cours...' : 'Télécharger chiffré (.json.enc)'}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t border-border space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Upload className="h-4 w-4" />Importer des données
            </h4>
            <Tabs defaultValue="imp-clair">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="imp-clair">Fichier clair</TabsTrigger>
                <TabsTrigger value="imp-chiffre">Fichier chiffré</TabsTrigger>
              </TabsList>

              <TabsContent value="imp-clair" className="mt-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full"><Upload className="h-4 w-4 mr-2" />Importer un fichier .json</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />Confirmer l&apos;importation
                      </DialogTitle>
                      <DialogDescription>L&apos;importation remplacera toutes les données actuelles de manière irréversible.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                      <input ref={fileInputRef} type="file" accept=".json,.zip,.gz" onChange={handleImportClair} className="border border-border rounded p-2 w-full text-sm" />
                      {importError && <p className="text-sm text-destructive">{importError}</p>}
                      {importSuccess && <p className="text-sm text-green-600 flex items-center gap-1"><ShieldCheck className="h-4 w-4" />Importation réussie.</p>}
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="imp-chiffre" className="space-y-3 mt-0">
                <div className="space-y-1.5">
                  <Label>Mot de passe du fichier</Label>
                  <Input type="password" value={mdpDechiffrement} onChange={e => setMdpDechiffrement(e.target.value)} placeholder="Mot de passe utilisé lors de l'export" />
                </div>
                <input ref={fileChiffreRef} type="file" accept=".enc,.json.enc" onChange={handleImportChiffre} className="hidden" />
                <Button variant="outline" disabled={!mdpDechiffrement} onClick={() => fileChiffreRef.current?.click()} className="w-full">
                  <Lock className="h-4 w-4 mr-2" />Déchiffrer et importer
                </Button>
                {erreurDechiffrement && <p className="text-sm text-destructive">{erreurDechiffrement}</p>}
                {importSuccess && <p className="text-sm text-green-600 flex items-center gap-1"><ShieldCheck className="h-4 w-4" />Importation réussie.</p>}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
