import { useState, useEffect } from 'react';
import { AlertTriangle, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WarningBannerProps {
  hasSeenWarning: boolean;
  onMarkAsSeen: () => void;
}

export function WarningBanner({ hasSeenWarning, onMarkAsSeen }: WarningBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!hasSeenWarning) {
      setIsVisible(true);
    }
  }, [hasSeenWarning]);

  if (!isVisible) return null;

  const handleClose = () => {
    onMarkAsSeen();
    setIsVisible(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-w-2xl w-full bg-card rounded-lg shadow-2xl border-2 border-amber-500 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Attention importante</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-amber-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-900 font-medium leading-relaxed">
              Cette application ne possède <strong>pas de serveur central</strong>. 
              100% de vos données sont sauvegardées <strong>localement dans votre navigateur</strong>.
            </p>
          </div>

          <div className="space-y-3 text-foreground">
            <p className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>Si vous videz votre cache ou vos cookies, vous perdrez toutes vos données.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>Si vous changez d&apos;ordinateur ou de navigateur, vos données ne suivront pas.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span><strong>Solution :</strong> Exportez régulièrement vos données via la page Paramètres.</span>
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Download className="h-5 w-5 text-slate-600" />
            <p className="text-sm text-slate-600">
              Nous vous recommandons d&apos;exporter vos données au moins une fois par semaine 
              et avant toute mise à jour de votre navigateur.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/50 px-6 py-4 flex justify-end">
          <Button
            onClick={handleClose}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            J&apos;ai compris, ne plus afficher
          </Button>
        </div>
      </div>
    </div>
  );
}
