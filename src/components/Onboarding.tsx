import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ChevronLeft, X, Building2, Settings, Upload, Lock, CheckCircle, BarChart3 } from 'lucide-react';
import type { AssociationParams, TypeAdhesion } from '@/types';
import { PinSetup } from './PinLock';

interface OnboardingProps {
  onComplete: (params: Partial<AssociationParams>) => void;
  onSkip: () => void;
}

const ETAPES = [
  { titre: 'Bienvenue', icone: BarChart3, description: 'Configurer votre espace en 5 étapes rapides' },
  { titre: 'Association', icone: Building2, description: 'Informations de base' },
  { titre: 'Adhésions', icone: Settings, description: 'Type et tarifs' },
  { titre: 'Import', icone: Upload, description: 'Données existantes' },
  { titre: 'Sécurité', icone: Lock, description: 'Protection PIN (optionnel)' },
];

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [etape, setEtape] = useState(0);
  const [params, setParams] = useState<Partial<AssociationParams>>({
    typeAdhesion: 'annuelle_civile',
  });
  const [fileImport, setFileImport] = useState<File | null>(null);

  const update = (updates: Partial<AssociationParams>) =>
    setParams(prev => ({ ...prev, ...updates }));

  const suivant = () => {
    if (etape < ETAPES.length - 1) setEtape(e => e + 1);
    else handleTerminer();
  };

  const precedent = () => setEtape(e => Math.max(0, e - 1));

  const handleTerminer = () => {
    onComplete(params);
  };

  const pctProgress = Math.round((etape / (ETAPES.length - 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4">
        <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-[#1E3A5F] px-6 py-5 relative">
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              title="Passer l'assistant"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              {ETAPES.map((e, i) => {
                const Icon = e.icone;
                return (
                  <div key={i} className="flex items-center gap-1">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                      i < etape ? 'bg-green-400 text-white' :
                      i === etape ? 'bg-white text-[#1E3A5F]' :
                      'bg-white/20 text-white/50'
                    }`}>
                      {i < etape ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                    </div>
                    {i < ETAPES.length - 1 && (
                      <div className={`h-0.5 w-6 ${i < etape ? 'bg-green-400' : 'bg-white/20'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <h2 className="text-lg font-bold text-white">{ETAPES[etape].titre}</h2>
            <p className="text-sm text-white/70">{ETAPES[etape].description}</p>
            <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/80 rounded-full transition-all duration-300" style={{ width: `${pctProgress}%` }} />
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 min-h-[300px] flex flex-col">
            <div className="flex-1">

              {/* Étape 0 - Bienvenue */}
              {etape === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1E3A5F]/10 mx-auto mb-2">
                    <BarChart3 className="h-8 w-8 text-[#1E3A5F]" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-foreground">Bienvenue dans votre outil de gestion</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Cet assistant va vous aider à configurer l&apos;application en quelques minutes.
                      Toutes vos données sont stockées <strong>uniquement dans votre navigateur</strong> — aucun serveur, aucune dépendance externe.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {[
                      { titre: 'Comptabilité', desc: 'Adhésions, dons, ventes, dépenses' },
                      { titre: 'Membres', desc: 'Adhérents, activités, Discord' },
                      { titre: 'Subventions', desc: 'Suivi des dossiers' },
                      { titre: 'Analyses', desc: 'KPIs, projections, santé' },
                    ].map(f => (
                      <div key={f.titre} className="p-3 rounded-lg bg-muted/40 border border-border">
                        <p className="text-sm font-medium text-foreground">{f.titre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Étape 1 - Association */}
              {etape === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Nom de l&apos;association *</Label>
                    <Input
                      value={params.nom || ''}
                      onChange={e => update({ nom: e.target.value })}
                      placeholder="Association de Cybersécurité CyberV"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>RNA / SIRET</Label>
                    <Input
                      value={params.siret || ''}
                      onChange={e => update({ siret: e.target.value })}
                      placeholder="W123456789"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Site web</Label>
                    <Input
                      type="url"
                      value={params.siteWeb || ''}
                      onChange={e => update({ siteWeb: e.target.value })}
                      placeholder="https://exemple.fr"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>URL du logo (optionnel)</Label>
                    <Input
                      type="url"
                      value={params.logoUrl || ''}
                      onChange={e => update({ logoUrl: e.target.value })}
                      placeholder="https://exemple.fr/logo.png"
                    />
                  </div>
                </div>
              )}

              {/* Étape 2 - Adhésions */}
              {etape === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Type d&apos;adhésion</Label>
                    <Select
                      value={params.typeAdhesion || 'annuelle_civile'}
                      onValueChange={v => update({ typeAdhesion: v as TypeAdhesion })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annuelle_civile">Annuelle civile (1er jan. – 31 déc.)</SelectItem>
                        <SelectItem value="annuelle_coulante">Annuelle coulante (1 an à partir du paiement)</SelectItem>
                        <SelectItem value="mensuelle">Mensuelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <p className="text-sm text-muted-foreground">
                      Les tarifs d&apos;adhésion (standard, étudiant, bienfaiteur) sont pré-configurés avec des valeurs par défaut.
                      Vous pourrez les modifier dans <strong>Paramètres → Tarifs</strong> à tout moment.
                    </p>
                  </div>
                </div>
              )}

              {/* Étape 3 - Import */}
              {etape === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Si vous avez déjà utilisé cet outil ou une version précédente, importez votre sauvegarde JSON pour restaurer vos données.
                  </p>
                  <div className="space-y-1.5">
                    <Label>Fichier de sauvegarde JSON (optionnel)</Label>
                    <input
                      type="file"
                      accept=".json,.enc"
                      onChange={e => setFileImport(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-muted-foreground border border-border rounded-lg p-2 bg-background cursor-pointer"
                    />
                  </div>
                  {fileImport && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700 dark:text-green-400">{fileImport.name} sélectionné</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Vous pouvez également ignorer cette étape et importer vos données plus tard depuis <strong>Paramètres → Sauvegarde</strong>.
                  </p>
                </div>
              )}

              {/* Étape 4 - PIN */}
              {etape === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Le verrouillage par PIN protège l&apos;accès à l&apos;application après 5 minutes d&apos;inactivité.
                    Cette étape est entièrement facultative.
                  </p>
                  <PinSetup
                    onSave={(hash) => update({ pinHash: hash || undefined })}
                    onSkip={() => suivant()}
                  />
                </div>
              )}

            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={etape === 0 ? onSkip : precedent}
                className="text-muted-foreground"
              >
                {etape === 0 ? (
                  <><X className="h-4 w-4 mr-1.5" />Passer</>
                ) : (
                  <><ChevronLeft className="h-4 w-4 mr-1" />Précédent</>
                )}
              </Button>

              <span className="text-xs text-muted-foreground">{etape + 1} / {ETAPES.length}</span>

              <Button
                onClick={suivant}
                disabled={etape === 1 && !params.nom?.trim()}
                className="bg-[#1E3A5F] hover:bg-[#16294a] text-white"
              >
                {etape === ETAPES.length - 1 ? (
                  <><CheckCircle className="h-4 w-4 mr-1.5" />Terminer</>
                ) : (
                  <>Suivant<ChevronRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
