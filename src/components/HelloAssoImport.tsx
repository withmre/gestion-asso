import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Upload, Users, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import type { Person } from '@/types';

interface HelloAssoImportProps {
  persons: Person[];
  onImport: (persons: Omit<Person, 'id' | 'dateInscription'>[]) => { created: number; updated: number };
}

interface ParsedMember {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateAdhesion: string;
  montant?: number;
  discord?: string;
}

interface FieldChange {
  champ: string;
  ancien: string;
  nouveau: string;
}

interface MemberUpdate {
  existing: Person;
  parsed: ParsedMember;
  changes: FieldChange[];
}

interface PendingImport {
  toCreate: ParsedMember[];
  toUpdate: MemberUpdate[];
}

function parseHelloAssoCSV(data: Record<string, string>[]): ParsedMember[] {
  const members: ParsedMember[] = [];
  for (const row of data) {
    // Ignorer les commandes non validées
    const statut = row['Statut de la commande'] || row['Statut'] || 'Validé';
    if (statut && statut !== 'Validé' && statut !== 'Valide') continue;

    // Email : format HelloAsso réel = "Email payeur", fallback formats anciens
    const email =
      row['Email payeur'] ||
      row['Email'] || row['email'] || row['E-mail'] || row['Adresse email'] || '';

    // Nom : format HelloAsso réel = "Nom adhérent", fallback
    const nom =
      row['Nom adhérent'] || row['Nom adherent'] ||
      row['Nom'] || row['nom'] || row['LastName'] || '';

    // Prénom : format HelloAsso réel = "Prénom adhérent", fallback
    const prenom =
      row['Prénom adhérent'] || row['Prenom adherent'] ||
      row['Prenom'] || row['prenom'] || row['FirstName'] || row['Prénom'] || '';

    if (!email || (!nom && !prenom)) continue;

    const telephone =
      row['Telephone'] || row['telephone'] || row['Phone'] || row['Téléphone'] || '';

    // Date : format HelloAsso = "Date de la commande" → "20/03/2026 09:12"
    const dateRaw =
      row['Date de la commande'] ||
      row["Date d'adhesion"] || row["Date d'adhésion"] ||
      row['Date'] || row['date'] || '';

    let dateAdhesion = new Date().toISOString().split('T')[0];
    if (dateRaw) {
      // Format "DD/MM/YYYY HH:MM" ou "DD/MM/YYYY"
      const parts = dateRaw.trim().split(' ')[0].split('/');
      if (parts.length === 3) {
        dateAdhesion = parts[2] + '-' + parts[1].padStart(2, '0') + '-' + parts[0].padStart(2, '0');
      } else {
        dateAdhesion = dateRaw;
      }
    }

    // Montant : format HelloAsso = "Montant tarif" → "20,00"
    const montantStr =
      row['Montant tarif'] || row['Montant'] || row['montant'] || row['Amount'] || '0';
    const montant = parseFloat(montantStr.replace(',', '.')) || undefined;

    // Discord : colonne custom HelloAsso CyberV
    const discord = row['Pseudo Discord'] || row['pseudo_discord'] || '';

    members.push({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      telephone: telephone.trim() || undefined,
      dateAdhesion,
      montant,
      discord: discord.trim() || undefined,
    });
  }
  return members;
}

function detectChanges(existing: Person, parsed: ParsedMember): FieldChange[] {
  const changes: FieldChange[] = [];

  const check = (champ: string, ancien: string | undefined, nouveau: string | undefined) => {
    const a = (ancien || '').trim();
    const n = (nouveau || '').trim();
    if (n && a !== n) {
      changes.push({ champ, ancien: a || '(vide)', nouveau: n });
    }
  };

  check('Prenom', existing.prenom, parsed.prenom);
  check('Nom', existing.nom, parsed.nom);
  check('Telephone', existing.telephone, parsed.telephone);
  check(
    'Derniere cotisation',
    existing.dateDerniereCotisation,
    parsed.dateAdhesion
  );

  return changes;
}

function membersToImportPayload(
  toCreate: ParsedMember[],
  toUpdate: MemberUpdate[]
): Omit<Person, 'id' | 'dateInscription'>[] {
  const fromCreate = toCreate.map((m) => ({
    type: 'adherent' as const,
    nom: m.nom,
    prenom: m.prenom,
    email: m.email,
    telephone: m.telephone,
    estAJourCotisation: true,
    dateDerniereCotisation: m.dateAdhesion,
    ...(m.discord ? { kpiDiscord: { idDiscord: m.discord, nombreActivites: 0, derniereActivite: undefined } } : {}),
  }));

  const fromUpdate = toUpdate.map(({ parsed }) => ({
    type: 'adherent' as const,
    nom: parsed.nom,
    prenom: parsed.prenom,
    email: parsed.email,
    telephone: parsed.telephone,
    estAJourCotisation: true,
    dateDerniereCotisation: parsed.dateAdhesion,
    ...(parsed.discord ? { kpiDiscord: { idDiscord: parsed.discord, nombreActivites: 0, derniereActivite: undefined } } : {}),
  }));

  return [...fromCreate, ...fromUpdate];
}

export function HelloAssoImport({ persons, onImport }: HelloAssoImportProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);
    setResult(null);
    setPendingImport(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        try {
          const parsedMembers = parseHelloAssoCSV(
            results.data as Record<string, string>[]
          );

          if (parsedMembers.length === 0) {
            setError('Aucun membre valide detecte dans le fichier. Verifiez le format CSV.');
            setIsParsing(false);
            return;
          }

          const toCreate: ParsedMember[] = [];
          const toUpdate: MemberUpdate[] = [];

          for (const parsed of parsedMembers) {
            const existing = persons.find(
              (p) => p.email?.toLowerCase() === parsed.email.toLowerCase()
            );
            if (existing) {
              const changes = detectChanges(existing, parsed);
              toUpdate.push({ existing, parsed, changes });
            } else {
              toCreate.push(parsed);
            }
          }

          const hasUpdatesWithChanges = toUpdate.some((u) => u.changes.length > 0);

          if (hasUpdatesWithChanges) {
            setPendingImport({ toCreate, toUpdate });
            setIsParsing(false);
          } else {
            const payload = membersToImportPayload(toCreate, toUpdate);
            const importResult = onImport(payload);
            setResult(importResult);
            setIsParsing(false);
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Erreur lors du parsing du fichier'
          );
          setIsParsing(false);
        }
      },
      error: (err) => {
        setError(`Erreur de lecture du fichier : ${err.message}`);
        setIsParsing(false);
      },
    });

    e.target.value = '';
  };

  const handleConfirm = () => {
    if (!pendingImport) return;
    const payload = membersToImportPayload(
      pendingImport.toCreate,
      pendingImport.toUpdate
    );
    const importResult = onImport(payload);
    setResult(importResult);
    setPendingImport(null);
  };

  const handleCancel = () => {
    setPendingImport(null);
  };

  const updatesWithChanges = pendingImport?.toUpdate.filter((u) => u.changes.length > 0) ?? [];

  return (
    <>
      <Card className="border border-border shadow-sm">
        <CardHeader className="bg-muted/50 border-b border-border">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" />
            Importer depuis HelloAsso
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Uploadez un fichier CSV exporte depuis HelloAsso. Les doublons sont
            detectes par adresse email. Une confirmation sera demandee avant de
            modifier les profils existants.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            variant="outline"
            className="w-full border-border text-foreground hover:bg-muted/50"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isParsing ? 'Analyse en cours...' : 'Selectionner un fichier CSV'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Import termine. <strong>{result.created}</strong> nouveaux
                membres crees, <strong>{result.updated}</strong> membres mis a
                jour.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ── Modal de confirmation ─────────────────────────────────────── */}
      <Dialog open={!!pendingImport} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmation de mise a jour
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {pendingImport && (
                <>
                  {pendingImport.toCreate.length > 0 && (
                    <span>
                      <strong>{pendingImport.toCreate.length}</strong> nouveau
                      {pendingImport.toCreate.length > 1 ? 'x membres' : ' membre'} seront
                      crees.{' '}
                    </span>
                  )}
                  <span>
                    Les <strong>{updatesWithChanges.length}</strong> membre
                    {updatesWithChanges.length > 1 ? 's' : ''} ci-dessous seront
                    modifies. Verifiez les changements avant de confirmer.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {updatesWithChanges.length > 0 && (
            <div className="mt-4 space-y-4">
              {updatesWithChanges.map(({ existing, changes }) => (
                <div
                  key={existing.id}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  {/* En-tete membre */}
                  <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b border-border">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground text-sm">
                      {existing.prenom} {existing.nom}
                    </span>
                    <span className="text-xs text-muted-foreground">{existing.email}</span>
                  </div>

                  {/* Tableau des changements */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-4 py-1.5 text-xs font-medium text-muted-foreground w-1/3">
                          Champ
                        </th>
                        <th className="text-left px-4 py-1.5 text-xs font-medium text-muted-foreground w-1/3">
                          Valeur actuelle
                        </th>
                        <th className="text-left px-4 py-1.5 text-xs font-medium text-muted-foreground w-1/3">
                          Nouvelle valeur
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {changes.map((change, i) => (
                        <tr
                          key={i}
                          className={i % 2 === 0 ? 'bg-card' : 'bg-muted/50'}
                        >
                          <td className="px-4 py-2 text-muted-foreground font-medium">
                            {change.champ}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground/60 line-through">
                            {change.ancien}
                          </td>
                          <td className="px-4 py-2 text-[#4A7C59] font-medium">
                            {change.nouveau}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Membres sans changement (juste mis a jour silencieusement) */}
          {pendingImport && pendingImport.toUpdate.length > updatesWithChanges.length && (
            <p className="text-xs text-muted-foreground/60 mt-2">
              {pendingImport.toUpdate.length - updatesWithChanges.length} membre
              {pendingImport.toUpdate.length - updatesWithChanges.length > 1 ? 's' : ''}{' '}
              deja a jour (aucun changement detecte).
            </p>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-border text-foreground hover:bg-muted/50"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-[#1E3A5F] hover:bg-[#16294a] text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmer l&apos;import
              {pendingImport && (
                <span className="ml-1 opacity-80">
                  ({pendingImport.toCreate.length + pendingImport.toUpdate.length} membres)
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
