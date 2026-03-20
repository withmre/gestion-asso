import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, MessageSquare, CheckCircle, AlertCircle, Users } from 'lucide-react';
import type { Person, DiscordKPIData } from '@/types';

interface DiscordImportProps {
  persons: Person[];
  onImport: (data: DiscordKPIData[]) => { matched: number; unmatched: number };
}

export function DiscordImport({ persons, onImport }: DiscordImportProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<{ matched: number; unmatched: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<DiscordKPIData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);
    setResult(null);
    setPreview([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!Array.isArray(parsed)) {
          throw new Error('Le fichier JSON doit contenir un tableau d\'objets');
        }

        const discordData: DiscordKPIData[] = parsed.map((item: Record<string, unknown>) => ({
          idDiscord: String(item.id_discord || item.idDiscord || item.user_id || item.id || ''),
          nombreActivites: Number(item.nombre_activites || item.nombreActivites || item.activities || item.count || 0),
          derniereActivite: String(item.derniere_activite || item.derniereActivite || item.last_activity || '') || undefined
        })).filter(d => d.idDiscord);

        if (discordData.length === 0) {
          throw new Error('Aucune donnée Discord valide trouvée dans le fichier');
        }

        setPreview(discordData.slice(0, 5));
        const importResult = onImport(discordData);
        setResult(importResult);
        setIsParsing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du parsing du fichier JSON');
        setIsParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const personsWithDiscord = persons.filter(p => p.kpiDiscord?.idDiscord);

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="bg-muted/50 border-b border-border">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Importer KPIs Discord (Draftbot)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800 text-sm">
            <Users className="h-4 w-4" />
            <span>
              <strong>{personsWithDiscord.length}</strong> membres ont un ID Discord enregistré
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Uploadez un fichier JSON généré par Draftbot ou un bot Discord. 
          Le système fera correspondre les IDs Discord pour mettre à jour les KPI d&apos;activité.
        </p>

        <p className="text-xs text-muted-foreground">
          Format attendu : <code className="bg-muted px-1 rounded">[&#123;&quot;id_discord&quot;: &quot;123...&quot;, &quot;nombre_activites&quot;: 5&#125;]</code>
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isParsing}
          variant="outline"
          className="w-full border-border text-primary hover:bg-muted/50"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isParsing ? 'Analyse en cours...' : 'Sélectionner un fichier JSON'}
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
              Import terminé ! <strong>{result.matched}</strong> membres correspondants,{' '}
              <strong>{result.unmatched}</strong> IDs Discord non trouvés.
            </AlertDescription>
          </Alert>
        )}

        {preview.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground mb-2">Aperçu des données détectées :</p>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
              {preview.map((data, index) => {
                const matchedPerson = persons.find(p => p.kpiDiscord?.idDiscord === data.idDiscord);
                return (
                  <div key={index} className="text-sm flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{data.idDiscord.substring(0, 8)}...</span>
                    <span className="text-muted-foreground/60">-</span>
                    <span className="font-medium">{data.nombreActivites} activités</span>
                    {matchedPerson ? (
                      <span className="text-green-600 text-xs">({matchedPerson.prenom} {matchedPerson.nom})</span>
                    ) : (
                      <span className="text-red-500 text-xs">(non trouvé)</span>
                    )}
                  </div>
                );
              })}
              {preview.length === 5 && <p className="text-xs text-muted-foreground/60 italic">...</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
