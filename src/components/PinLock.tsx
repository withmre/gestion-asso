import { useState, useEffect, useCallback } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface PinLockProps {
  pinHash: string | undefined;
  onUnlock: () => void;
}

export function PinLock({ pinHash, onUnlock }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!blockedUntil) return;
    const interval = setInterval(() => {
      const secs = Math.ceil((blockedUntil - Date.now()) / 1000);
      if (secs <= 0) {
        setBlockedUntil(null);
        setAttempts(0);
        setRemaining(0);
        clearInterval(interval);
      } else {
        setRemaining(secs);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [blockedUntil]);

  const handleUnlock = useCallback(async () => {
    if (blockedUntil) return;
    if (!pin) return;

    const hash = await hashPin(pin);
    if (hash === pinHash) {
      setError('');
      onUnlock();
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setPin('');
      if (next >= 3) {
        const until = Date.now() + 30000;
        setBlockedUntil(until);
        setError('Trop de tentatives. Réessayez dans 30 secondes.');
      } else {
        setError(`Code incorrect. ${3 - next} tentative${3 - next > 1 ? 's' : ''} restante${3 - next > 1 ? 's' : ''}.`);
      }
    }
  }, [pin, pinHash, attempts, blockedUntil, onUnlock]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleUnlock();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUnlock]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4">
        <div className="flex flex-col items-center gap-6 p-8 rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">Application verrouillée</h2>
            <p className="text-sm text-muted-foreground mt-1">Entrez votre code PIN pour continuer</p>
          </div>

          <div className="w-full space-y-3">
            <Label className="text-foreground">Code PIN</Label>
            <div className="relative">
              <Input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••"
                className="text-center text-2xl tracking-[0.5em] pr-10"
                disabled={!!blockedUntil}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            {blockedUntil && (
              <p className="text-sm text-amber-500 text-center">
                Déblocage dans {remaining} seconde{remaining > 1 ? 's' : ''}
              </p>
            )}

            <Button
              onClick={handleUnlock}
              disabled={!pin || !!blockedUntil}
              className="w-full"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Déverrouiller
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PinSetupProps {
  onSave: (hash: string) => void;
  onSkip: () => void;
  existingHash?: string;
}

export function PinSetup({ onSave, onSkip, existingHash }: PinSetupProps) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (pin.length < 4) {
      setError('Le PIN doit contenir au moins 4 chiffres.');
      return;
    }
    if (pin !== confirm) {
      setError('Les deux codes ne correspondent pas.');
      return;
    }
    const hash = await hashPin(pin);
    onSave(hash);
    setSuccess(true);
    setError('');
    setTimeout(() => setSuccess(false), 2000);
    setPin('');
    setConfirm('');
  };

  const handleRemove = async () => {
    onSave('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>{existingHash ? 'Nouveau code PIN' : 'Définir un code PIN'}</Label>
        <div className="relative">
          <Input
            type={showPin ? 'text' : 'password'}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="4 à 6 chiffres"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPin(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Confirmer le code PIN</Label>
        <Input
          type={showPin ? 'text' : 'password'}
          value={confirm}
          onChange={e => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Répétez le code"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Code PIN enregistré.</p>}

      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1" disabled={!pin || !confirm}>
          <Lock className="h-4 w-4 mr-2" />
          {existingHash ? 'Modifier le PIN' : 'Activer le PIN'}
        </Button>
        {existingHash && (
          <Button variant="outline" onClick={handleRemove} className="text-destructive border-destructive/50 hover:bg-destructive/10">
            Désactiver
          </Button>
        )}
        {!existingHash && (
          <Button variant="ghost" onClick={onSkip}>
            Ignorer
          </Button>
        )}
      </div>
    </div>
  );
}
