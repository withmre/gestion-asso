import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Alerte } from '@/types';
import { AlertTriangle, ChevronDown, ChevronUp, Calendar, Euro, FileText, X } from 'lucide-react';

interface AlertsPanelProps {
  alertes: Alerte[];
}

export function AlertsPanel({ alertes }: AlertsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  if (alertes.length === 0) return null;

  const visibleAlertes = alertes.filter(a => !dismissedAlerts.includes(a.id));
  if (visibleAlertes.length === 0) return null;

  const dangerCount = visibleAlertes.filter(a => a.niveau === 'danger').length;
  const warningCount = visibleAlertes.filter(a => a.niveau === 'warning').length;
  const infoCount = visibleAlertes.filter(a => a.niveau === 'info').length;

  const getIcon = (type: Alerte['type']) => {
    switch (type) {
      case 'adhesion': return <Calendar className="h-4 w-4" />;
      case 'passif': return <Euro className="h-4 w-4" />;
      case 'subvention': return <FileText className="h-4 w-4" />;
    }
  };

  const getNiveauColor = (niveau: Alerte['niveau']) => {
    switch (niveau) {
      case 'danger': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getNiveauBadge = (niveau: Alerte['niveau']) => {
    switch (niveau) {
      case 'danger': return <Badge className="bg-red-100 text-red-700">Urgent</Badge>;
      case 'warning': return <Badge className="bg-amber-100 text-amber-700">Attention</Badge>;
      case 'info': return <Badge className="bg-blue-100 text-blue-700">Info</Badge>;
    }
  };

  const dismissAlert = (id: string) => {
    setDismissedAlerts([...dismissedAlerts, id]);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border border-border shadow-sm">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-muted/50 border-b border-border cursor-pointer hover:bg-muted transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Alertes & Rappels
                <div className="flex gap-2 ml-2">
                  {dangerCount > 0 && (
                    <Badge className="bg-red-100 text-red-700">{dangerCount}</Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge className="bg-amber-100 text-amber-700">{warningCount}</Badge>
                  )}
                  {infoCount > 0 && (
                    <Badge className="bg-blue-100 text-blue-700">{infoCount}</Badge>
                  )}
                </div>
              </CardTitle>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-4">
            <div className="space-y-3">
              {visibleAlertes.map((alerte) => (
                <div 
                  key={alerte.id} 
                  className={`flex items-start justify-between p-3 rounded-lg border ${getNiveauColor(alerte.niveau)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(alerte.type)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{alerte.titre}</span>
                        {getNiveauBadge(alerte.niveau)}
                      </div>
                      <p className="text-sm opacity-90">{alerte.message}</p>
                      {alerte.dateEcheance && (
                        <p className="text-xs opacity-75 mt-1">
                          Échéance : {new Date(alerte.dateEcheance).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => dismissAlert(alerte.id)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
