import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Image, Download, Instagram, Linkedin, RefreshCw } from 'lucide-react';
import type { KPIFinances, KPIPersonnes, CTFEvent, AssociationParams, ScoreSante } from '@/types';

interface VisuelsRSProps {
  kpiFinances: KPIFinances;
  kpiPersonnes: KPIPersonnes;
  ctfEvents: CTFEvent[];
  scoreSante: ScoreSante;
  params: AssociationParams;
}

type FormatRS = 'carre' | 'paysage' | 'story';
type TypeVisuel = 'bilan_mois' | 'top_membres' | 'ctf_resultat' | 'rapport_annuel';

const FORMATS: Record<FormatRS, { w: number; h: number; label: string; icon: string }> = {
  carre:    { w: 1080, h: 1080, label: '1080×1080 — Instagram / Post', icon: 'carré' },
  paysage:  { w: 1200, h: 630,  label: '1200×630 — LinkedIn / Twitter', icon: 'paysage' },
  story:    { w: 1080, h: 1920, label: '1080×1920 — Story / Reels', icon: 'portrait' },
};

const THEMES_COULEURS = [
  { id: 'cyber',   label: 'Cyber (défaut)',    fond: '#0A0F1E', accent: '#06B6D4', texte: '#E2E8F0' },
  { id: 'marine',  label: 'Marine',            fond: '#1E3A5F', accent: '#FFFFFF', texte: '#FFFFFF' },
  { id: 'vert',    label: 'Vert sauge',        fond: '#1A2F1E', accent: '#4A7C59', texte: '#E8F5E9' },
  { id: 'clair',   label: 'Clair professionnel', fond: '#F8FAFC', accent: '#1E3A5F', texte: '#1F2937' },
];

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}

function dessinerFond(ctx: CanvasRenderingContext2D, w: number, h: number, fond: string, accent: string) {
  ctx.fillStyle = fond;
  ctx.fillRect(0, 0, w, h);

  // Motif géométrique cyber subtil
  ctx.strokeStyle = accent + '15';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 60) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, h);
    ctx.stroke();
  }
  for (let j = 0; j < h; j += 60) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(w, j);
    ctx.stroke();
  }

  // Gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, fond + 'CC');
  grad.addColorStop(0.4, fond + '00');
  grad.addColorStop(0.8, fond + '00');
  grad.addColorStop(1, fond + 'EE');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Barre d'accent en haut
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, 6);

  // Barre d'accent en bas
  ctx.fillRect(0, h - 6, w, 6);
}

function dessinerLogo(ctx: CanvasRenderingContext2D, nom: string, x: number, y: number, accent: string, texte: string) {
  ctx.font = `bold 22px sans-serif`;
  ctx.fillStyle = accent;
  ctx.textAlign = 'left';
  ctx.fillText(nom.toUpperCase(), x, y);
}

export function VisuelsRS({ kpiFinances, kpiPersonnes, ctfEvents, scoreSante, params }: VisuelsRSProps) {
  const [format, setFormat] = useState<FormatRS>('carre');
  const [typeVisuel, setTypeVisuel] = useState<TypeVisuel>('bilan_mois');
  const [themeId, setThemeId] = useState('cyber');
  const [hashtags, setHashtags] = useState(params.hashtagsRS || '#cybersecurite #association');
  const [ctfId, setCtfId] = useState(ctfEvents[0]?.id || '');
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [generated, setGenerated] = useState(false);

  const theme = THEMES_COULEURS.find(t => t.id === themeId) || THEMES_COULEURS[0];
  const { w, h } = FORMATS[format];
  const nomAssoc = params.nom || 'Association';
  const maintenant = new Date();
  const moisLabel = maintenant.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const formatMonnaie = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  const generer = useCallback(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const { fond, accent, texte } = theme;
    const cx = w / 2;

    dessinerFond(ctx, w, h, fond, accent);

    // Logo / nom association
    const padX = w * 0.08;
    dessinerLogo(ctx, nomAssoc, padX, h * 0.08, accent, texte);

    if (typeVisuel === 'bilan_mois') {
      // Titre
      ctx.font = `bold ${w * 0.045}px sans-serif`;
      ctx.fillStyle = texte;
      ctx.textAlign = 'center';
      ctx.fillText('BILAN DU MOIS', cx, h * 0.18);

      ctx.font = `${w * 0.028}px sans-serif`;
      ctx.fillStyle = accent;
      ctx.fillText(moisLabel.toUpperCase(), cx, h * 0.24);

      // Stats en grille
      const stats = [
        { label: 'Chiffre d\'affaires', val: formatMonnaie(kpiFinances.chiffreAffairesTotal) },
        { label: 'Dépenses', val: formatMonnaie(kpiFinances.totalDepenses) },
        { label: 'Solde net', val: formatMonnaie(kpiFinances.soldeReel) },
        { label: 'Adhérents actifs', val: kpiPersonnes.totalAdherents.toString() },
      ];

      const cols = format === 'story' ? 2 : 2;
      const rows = Math.ceil(stats.length / cols);
      const cellW = (w - padX * 2) / cols;
      const cellH = (h * 0.45) / rows;
      const startY = h * 0.32;

      stats.forEach((s, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx2 = padX + col * cellW + cellW / 2;
        const cy2 = startY + row * cellH;

        // Fond de la cellule
        ctx.fillStyle = accent + '18';
        const padding = w * 0.02;
        ctx.beginPath();
        ctx.roundRect(cx2 - cellW / 2 + padding, cy2, cellW - padding * 2, cellH * 0.8, 12);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.font = `bold ${w * 0.055}px sans-serif`;
        ctx.fillStyle = accent;
        ctx.fillText(s.val, cx2, cy2 + cellH * 0.45);

        ctx.font = `${w * 0.022}px sans-serif`;
        ctx.fillStyle = texte + 'AA';
        ctx.fillText(s.label, cx2, cy2 + cellH * 0.7);
      });

    } else if (typeVisuel === 'top_membres') {
      ctx.font = `bold ${w * 0.045}px sans-serif`;
      ctx.fillStyle = texte;
      ctx.textAlign = 'center';
      ctx.fillText('TOP MEMBRES ACTIFS', cx, h * 0.18);

      ctx.font = `${w * 0.025}px sans-serif`;
      ctx.fillStyle = accent;
      ctx.fillText(moisLabel.toUpperCase(), cx, h * 0.24);

      const top = kpiPersonnes.top5MembresActifs.slice(0, 3);
      const medailles = ['🥇', '🥈', '🥉'];
      const startY = h * 0.32;
      const espacement = h * 0.14;

      top.forEach((item, i) => {
        const y = startY + i * espacement;
        const prenom = item.person.prenom;

        ctx.fillStyle = accent + (i === 0 ? 'FF' : i === 1 ? 'BB' : '77');
        ctx.font = `bold ${w * 0.038}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}.`, padX, y);

        ctx.fillStyle = texte;
        ctx.font = `${w * 0.035}px sans-serif`;
        ctx.fillText(prenom, padX + w * 0.08, y);

        ctx.fillStyle = accent;
        ctx.font = `bold ${w * 0.032}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(`${item.scoreTotal} pts`, w - padX, y);
      });

    } else if (typeVisuel === 'ctf_resultat') {
      const evt = ctfEvents.find(e => e.id === ctfId) || ctfEvents[0];
      if (!evt) {
        ctx.fillStyle = texte;
        ctx.textAlign = 'center';
        ctx.font = `${w * 0.03}px sans-serif`;
        ctx.fillText('Aucun CTF enregistré', cx, h / 2);
      } else {
        ctx.font = `bold ${w * 0.04}px sans-serif`;
        ctx.fillStyle = accent;
        ctx.textAlign = 'center';
        ctx.fillText('RÉSULTATS CTF', cx, h * 0.18);

        ctx.font = `bold ${w * 0.055}px sans-serif`;
        ctx.fillStyle = texte;
        ctx.fillText(evt.nom, cx, h * 0.28);

        ctx.font = `${w * 0.025}px sans-serif`;
        ctx.fillStyle = texte + '99';
        ctx.fillText(`${evt.plateforme} — ${new Date(evt.dateDebut).toLocaleDateString('fr-FR')}`, cx, h * 0.35);

        if (evt.classement) {
          ctx.font = `bold ${w * 0.08}px sans-serif`;
          ctx.fillStyle = accent;
          ctx.fillText(`${evt.classement.rang}`, cx, h * 0.52);

          ctx.font = `${w * 0.03}px sans-serif`;
          ctx.fillStyle = texte;
          ctx.fillText(`sur ${evt.classement.totalEquipes} équipes`, cx, h * 0.6);

          const pct = Math.round((1 - evt.classement.rang / evt.classement.totalEquipes) * 100);
          ctx.font = `bold ${w * 0.035}px sans-serif`;
          ctx.fillStyle = pct >= 90 ? '#10B981' : pct >= 70 ? '#F59E0B' : texte;
          ctx.fillText(`Top ${100 - pct}%`, cx, h * 0.69);
        }

        ctx.font = `${w * 0.025}px sans-serif`;
        ctx.fillStyle = texte + '88';
        ctx.fillText(`${evt.participants.length} participant(s)`, cx, h * 0.77);
      }

    } else if (typeVisuel === 'rapport_annuel') {
      const annee = maintenant.getFullYear() - 1;

      ctx.font = `bold ${w * 0.045}px sans-serif`;
      ctx.fillStyle = texte;
      ctx.textAlign = 'center';
      ctx.fillText(`RAPPORT ${annee}`, cx, h * 0.18);

      ctx.font = `${w * 0.025}px sans-serif`;
      ctx.fillStyle = accent;
      ctx.fillText(nomAssoc.toUpperCase(), cx, h * 0.24);

      const chiffres = [
        { val: kpiPersonnes.totalAdherents.toString(), label: 'adhérents' },
        { val: formatMonnaie(kpiFinances.chiffreAffairesTotal), label: 'de recettes' },
        { val: `${kpiPersonnes.tauxFidelisation.toFixed(0)}%`, label: 'fidélisation' },
        { val: `${scoreSante.score}/100`, label: 'santé asso.' },
      ];

      const cellW2 = (w - padX * 2) / 2;
      const cellH2 = h * 0.22;
      const startY2 = h * 0.32;

      chiffres.forEach((c, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx3 = padX + col * cellW2 + cellW2 / 2;
        const cy3 = startY2 + row * cellH2;

        ctx.fillStyle = accent + '20';
        ctx.beginPath();
        ctx.roundRect(cx3 - cellW2 / 2 + w * 0.02, cy3, cellW2 - w * 0.04, cellH2 * 0.8, 10);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.font = `bold ${w * 0.055}px sans-serif`;
        ctx.fillStyle = accent;
        ctx.fillText(c.val, cx3, cy3 + cellH2 * 0.45);

        ctx.font = `${w * 0.02}px sans-serif`;
        ctx.fillStyle = texte + 'AA';
        ctx.fillText(c.label, cx3, cy3 + cellH2 * 0.68);
      });
    }

    // Hashtags en bas
    const hashY = h * 0.92;
    ctx.textAlign = 'center';
    ctx.font = `${w * 0.018}px sans-serif`;
    ctx.fillStyle = accent + 'BB';
    ctx.fillText(hashtags, cx, hashY);

    setGenerated(true);
  }, [format, typeVisuel, themeId, hashtags, ctfId, kpiFinances, kpiPersonnes, ctfEvents, scoreSante, params]);

  const telecharger = () => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const lien = document.createElement('a');
    lien.download = `visuel_${typeVisuel}_${format}_${Date.now()}.png`;
    lien.href = canvas.toDataURL('image/png', 1.0);
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
  };

  const previewW = Math.min(480, w);
  const previewH = Math.round(previewW * h / w);

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Options */}
        <div className="space-y-4">
          <Card className="border border-border shadow-sm">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Image className="h-5 w-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">

              <div className="space-y-1.5">
                <Label>Type de visuel</Label>
                <Select value={typeVisuel} onValueChange={v => { setTypeVisuel(v as TypeVisuel); setGenerated(false); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bilan_mois">Bilan du mois</SelectItem>
                    <SelectItem value="top_membres">Top membres actifs</SelectItem>
                    <SelectItem value="ctf_resultat">Résultat CTF</SelectItem>
                    <SelectItem value="rapport_annuel">Rapport annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {typeVisuel === 'ctf_resultat' && ctfEvents.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Compétition CTF</Label>
                  <Select value={ctfId} onValueChange={v => { setCtfId(v); setGenerated(false); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ctfEvents.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Format</Label>
                <Select value={format} onValueChange={v => { setFormat(v as FormatRS); setGenerated(false); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORMATS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <div className="flex items-center gap-2">
                          {k === 'carre' && <Instagram className="h-3.5 w-3.5" />}
                          {k === 'paysage' && <Linkedin className="h-3.5 w-3.5" />}
                          {k === 'story' && <span className="text-xs">📱</span>}
                          {v.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Palette de couleurs</Label>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES_COULEURS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setThemeId(t.id); setGenerated(false); }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${themeId === t.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.fond }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.accent }} />
                      </div>
                      <p className="text-xs text-foreground">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Hashtags</Label>
                <Input
                  value={hashtags}
                  onChange={e => { setHashtags(e.target.value); setGenerated(false); }}
                  placeholder="#cybersecurite #association"
                />
              </div>

              <Button onClick={generer} className="w-full bg-[#1E3A5F] hover:bg-[#16294a] text-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Générer le visuel
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Aperçu */}
        <div className="space-y-4">
          <Card className="border border-border shadow-sm">
            <CardHeader className="bg-muted/50 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Aperçu</CardTitle>
                <Badge variant="outline" className="text-xs">{FORMATS[format].w}×{FORMATS[format].h}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center gap-4">
              <div className="w-full flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[200px]">
                <canvas
                  ref={previewRef}
                  style={{ width: previewW, height: previewH, maxWidth: '100%' }}
                  className="rounded shadow-lg"
                />
              </div>

              {!generated && (
                <p className="text-sm text-muted-foreground text-center">
                  Cliquez sur "Générer le visuel" pour voir l&apos;aperçu.
                </p>
              )}

              {generated && (
                <Button onClick={telecharger} className="w-full bg-[#4A7C59] hover:bg-[#3d6849] text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger en PNG haute résolution
                </Button>
              )}
            </CardContent>
          </Card>

          {generated && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">
                Le fichier téléchargé est en résolution native {FORMATS[format].w}×{FORMATS[format].h}px,
                adapté à la publication sur les réseaux sociaux. Aucune donnée personnelle nominative n&apos;est incluse dans l&apos;image.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
