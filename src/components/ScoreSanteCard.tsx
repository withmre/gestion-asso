import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartPulse, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { ScoreSante } from '@/types';

interface ScoreSanteCardProps {
  score: ScoreSante;
}

export function ScoreSanteCard({ score }: ScoreSanteCardProps) {
  const [expanded, setExpanded] = useState(false);

  const couleurScore =
    score.niveau === 'ok' ? 'text-green-600 dark:text-green-400' :
    score.niveau === 'warning' ? 'text-amber-500' :
    'text-red-600 dark:text-red-400';

  const couleurBarre =
    score.niveau === 'ok' ? 'bg-green-500' :
    score.niveau === 'warning' ? 'bg-amber-400' :
    'bg-red-500';

  const labelNiveau =
    score.niveau === 'ok' ? 'Bonne santé' :
    score.niveau === 'warning' ? 'À surveiller' :
    'Situation critique';

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="bg-muted/50 border-b border-border">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <HeartPulse className="h-5 w-5" />
          Score de santé associative
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center gap-6 mb-4">
          <div className="flex flex-col items-center">
            <span className={`text-5xl font-bold ${couleurScore}`}>{score.score}</span>
            <span className="text-xs text-muted-foreground mt-1">/ 100</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-sm font-medium ${couleurScore}`}>{labelNiveau}</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${couleurBarre}`}
                style={{ width: `${score.score}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>40 — À surveiller</span>
              <span>70 — Bonne santé</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {expanded ? 'Masquer le détail' : 'Voir le détail des critères'}
        </button>

        {expanded && (
          <div className="mt-4 space-y-3">
            {score.criteres.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="mt-0.5 shrink-0">
                  {c.valeur
                    ? <CheckCircle className="h-4 w-4 text-green-500" />
                    : c.score > 0
                      ? <AlertCircle className="h-4 w-4 text-amber-400" />
                      : <XCircle className="h-4 w-4 text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{c.nom}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{c.score}/{c.poids} pts</span>
                  </div>
                  {c.suggestion && (
                    <p className="text-xs text-muted-foreground mt-0.5">{c.suggestion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
