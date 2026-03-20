import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Download, Users, Trophy, BookOpen, Pencil, FileText } from 'lucide-react';
import type { Person, CTFEvent, SessionMentorat, AssociationParams } from '@/types';

interface CertificatGeneratorProps {
  persons: Person[];
  ctfEvents: CTFEvent[];
  sessionsMentorat: SessionMentorat[];
  params: AssociationParams;
}

// ── Génération PDF via canvas natif (pas de dépendance externe) ─────────────

function creerCanvas(largeur: number, hauteur: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = largeur;
  c.height = hauteur;
  return c;
}

function telechargerCanvas(canvas: HTMLCanvasElement, nom: string) {
  const lien = document.createElement('a');
  lien.download = nom;
  lien.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
}

interface DonneesCertificat {
  titre: string;
  destinataire: string;
  corps: string;
  dateEmission: string;
  nomAssociation: string;
  sousTitre?: string;
  couleurAccent?: string;
}

function genererPDFCertificat(data: DonneesCertificat) {
  // On utilise jsPDF via CDN chargé dynamiquement
  // Fallback : génération PNG via canvas
  const W = 1122; // A4 paysage 96dpi
  const H = 794;
  const canvas = creerCanvas(W, H);
  const ctx = canvas.getContext('2d')!;
  const accent = data.couleurAccent || '#1E3A5F';

  // Fond blanc
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Bordure décorative extérieure
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  // Bordure intérieure fine
  ctx.strokeStyle = accent + '40';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // Coins décoratifs
  const coinTaille = 30;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  [[44, 44], [W - 44, 44], [44, H - 44], [W - 44, H - 44]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, coinTaille / 2, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Titre "CERTIFICAT"
  ctx.fillStyle = accent;
  ctx.font = 'bold 14px serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '8px';
  ctx.fillText('CERTIFICAT', W / 2, 110);

  // Ligne décorative sous "CERTIFICAT"
  const lgLigne = 200;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - lgLigne, 122);
  ctx.lineTo(W / 2 + lgLigne, 122);
  ctx.stroke();

  // Titre du certificat
  ctx.fillStyle = '#1A1A2E';
  ctx.font = 'bold 36px serif';
  ctx.letterSpacing = '0px';
  ctx.fillText(data.titre.toUpperCase(), W / 2, 185);

  // Sous-titre si présent
  if (data.sousTitre) {
    ctx.font = 'italic 18px serif';
    ctx.fillStyle = '#555555';
    ctx.fillText(data.sousTitre, W / 2, 220);
  }

  // "est décerné à"
  ctx.font = 'italic 20px serif';
  ctx.fillStyle = '#666666';
  ctx.fillText('est décerné à', W / 2, data.sousTitre ? 270 : 255);

  // Nom du destinataire
  ctx.font = 'bold 44px serif';
  ctx.fillStyle = accent;
  ctx.fillText(data.destinataire, W / 2, data.sousTitre ? 330 : 315);

  // Ligne décorative sous le nom
  ctx.strokeStyle = accent + '60';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 250, data.sousTitre ? 348 : 333);
  ctx.lineTo(W / 2 + 250, data.sousTitre ? 348 : 333);
  ctx.stroke();

  // Corps du texte
  const lignesCorps = data.corps.split('\n');
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#444444';
  const baseY = data.sousTitre ? 395 : 380;
  lignesCorps.forEach((ligne, i) => {
    ctx.fillText(ligne, W / 2, baseY + i * 28);
  });

  // Date et organisation en bas
  const baseFooter = H - 100;

  ctx.strokeStyle = accent + '30';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, baseFooter);
  ctx.lineTo(W - 80, baseFooter);
  ctx.stroke();

  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#888888';
  ctx.textAlign = 'left';
  ctx.fillText(`Délivré le ${data.dateEmission}`, 80, baseFooter + 28);

  ctx.textAlign = 'right';
  ctx.fillText(data.nomAssociation, W - 80, baseFooter + 28);

  ctx.textAlign = 'center';
  ctx.font = 'italic 11px sans-serif';
  ctx.fillStyle = '#AAAAAA';
  ctx.fillText('Document généré électroniquement — non signé', W / 2, H - 36);

  // Télécharger
  const nomFichier = `certificat_${data.destinataire.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
  telechargerCanvas(canvas, nomFichier);
}

// ── Composant principal ──────────────────────────────────────────────────────

export function CertificatGenerator({ persons, ctfEvents, sessionsMentorat, params }: CertificatGeneratorProps) {
  const nomAssociation = params.nom || 'Association';

  // Adhésion
  const [personId, setPersonId] = useState('');

  // CTF
  const [ctfPersonId, setCtfPersonId] = useState('');
  const [ctfEventId, setCtfEventId] = useState('all');

  // Mentorat
  const [mentoratRole, setMentoratRole] = useState<'mentor' | 'apprenti'>('mentor');
  const [mentoratPersonId, setMentoratPersonId] = useState('');

  // Personnalisé
  const [customTitre, setCustomTitre] = useState('');
  const [customDestinataire, setCustomDestinataire] = useState('');
  const [customCorps, setCustomCorps] = useState('Pour sa contribution exceptionnelle et son engagement.\n\nEn reconnaissance de son dévouement.');
  const [customSousTitre, setCustomSousTitre] = useState('');

  const dateAujourd = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const personName = (id: string) => {
    const p = persons.find(x => x.id === id);
    return p ? `${p.prenom} ${p.nom}` : '';
  };

  // ── Générateurs ──

  const genererAdhesion = () => {
    if (!personId) return;
    const p = persons.find(x => x.id === personId)!;
    genererPDFCertificat({
      titre: "Certificat d'adhésion",
      destinataire: `${p.prenom} ${p.nom}`,
      corps: `En qualité de membre ${p.type === 'adherent' ? 'adhérent' : 'associé'} de ${nomAssociation}.\n\nCe certificat atteste de son inscription et de son engagement\nauprès de l'association.${p.dateDerniereCotisation ? `\n\nDate d'adhésion : ${new Date(p.dateDerniereCotisation).toLocaleDateString('fr-FR')}` : ''}`,
      dateEmission: dateAujourd,
      nomAssociation,
      couleurAccent: '#1E3A5F',
    });
  };

  const genererCTF = () => {
    if (!ctfPersonId) return;
    const p = persons.find(x => x.id === ctfPersonId)!;
    const evts = ctfEventId === 'all'
      ? ctfEvents.filter(e => e.participants.includes(ctfPersonId))
      : ctfEvents.filter(e => e.id === ctfEventId && e.participants.includes(ctfPersonId));

    const lignesEvts = evts.slice(0, 4).map(e => {
      const rang = e.classement ? ` — Rang ${e.classement.rang}/${e.classement.totalEquipes}` : '';
      return `• ${e.nom} (${e.plateforme})${rang}`;
    }).join('\n');

    genererPDFCertificat({
      titre: 'Certificat de participation CTF',
      sousTitre: 'Capture The Flag — Cybersécurité',
      destinataire: `${p.prenom} ${p.nom}`,
      corps: `Pour sa participation aux compétitions de cybersécurité\norganisées ou suivies par ${nomAssociation}.\n\n${lignesEvts || `${evts.length} compétition(s) enregistrée(s)`}`,
      dateEmission: dateAujourd,
      nomAssociation,
      couleurAccent: '#0F4C75',
    });
  };

  const genererMentorat = () => {
    if (!mentoratPersonId) return;
    const p = persons.find(x => x.id === mentoratPersonId)!;
    const sessions = sessionsMentorat.filter(s =>
      s.statut === 'realisee' && (mentoratRole === 'mentor' ? s.mentorId === mentoratPersonId : s.apprentiId === mentoratPersonId)
    );
    const heures = Math.round(sessions.reduce((acc, s) => acc + s.dureeMinutes, 0) / 60);
    const themes = [...new Set(sessions.map(s => s.thematiqueAbordee))].slice(0, 3).join(', ');

    genererPDFCertificat({
      titre: mentoratRole === 'mentor' ? 'Attestation de mentorat' : 'Certificat de formation',
      sousTitre: mentoratRole === 'mentor' ? 'Mentor bénévole' : 'Parcours d\'apprentissage',
      destinataire: `${p.prenom} ${p.nom}`,
      corps: mentoratRole === 'mentor'
        ? `Pour son engagement bénévole en tant que mentor au sein de ${nomAssociation}.\n\n${sessions.length} session(s) animée(s) — ${heures}h de mentorat${themes ? `\nThématiques : ${themes}` : ''}`
        : `Pour son investissement dans son parcours de formation\nauprès des mentors de ${nomAssociation}.\n\n${sessions.length} session(s) suivie(s) — ${heures}h d'apprentissage${themes ? `\nThématiques : ${themes}` : ''}`,
      dateEmission: dateAujourd,
      nomAssociation,
      couleurAccent: '#4A7C59',
    });
  };

  const genererPersonnalise = () => {
    if (!customTitre || !customDestinataire) return;
    genererPDFCertificat({
      titre: customTitre,
      sousTitre: customSousTitre || undefined,
      destinataire: customDestinataire,
      corps: customCorps,
      dateEmission: dateAujourd,
      nomAssociation,
      couleurAccent: '#1E3A5F',
    });
  };

  const adherents = persons.filter(p => p.type !== 'anonyme');
  const competiteurs = persons.filter(p => ctfEvents.some(e => e.participants.includes(p.id)));
  const mentorsAppr = persons.filter(p => sessionsMentorat.some(s => s.mentorId === p.id || s.apprentiId === p.id));

  return (
    <div className="space-y-6">

      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <p className="text-sm text-muted-foreground">
          Les certificats sont générés localement dans votre navigateur sous forme d&apos;image PNG haute résolution (format A4 paysage).
          Aucune donnée n&apos;est envoyée sur un serveur externe.
        </p>
      </div>

      <Tabs defaultValue="adhesion">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="adhesion" className="flex items-center gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" />Adhésion
          </TabsTrigger>
          <TabsTrigger value="ctf" className="flex items-center gap-1.5 text-xs">
            <Trophy className="h-3.5 w-3.5" />CTF
          </TabsTrigger>
          <TabsTrigger value="mentorat" className="flex items-center gap-1.5 text-xs">
            <BookOpen className="h-3.5 w-3.5" />Mentorat
          </TabsTrigger>
          <TabsTrigger value="personnalise" className="flex items-center gap-1.5 text-xs">
            <Pencil className="h-3.5 w-3.5" />Libre
          </TabsTrigger>
        </TabsList>

        {/* Adhésion */}
        <TabsContent value="adhesion" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-[#1E3A5F]" />
                Certificat d&apos;adhésion
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Atteste qu&apos;une personne est membre de l&apos;association avec sa date d&apos;adhésion.
              </p>
              <div className="space-y-1.5">
                <Label>Membre *</Label>
                <Select value={personId} onValueChange={setPersonId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un membre" /></SelectTrigger>
                  <SelectContent>
                    {adherents.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.prenom} {p.nom}
                        <Badge variant="outline" className="ml-2 text-xs">{p.type}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {personId && (
                <div className="p-3 rounded-lg bg-[#1E3A5F]/5 border border-[#1E3A5F]/20 text-sm space-y-1">
                  <p className="font-medium text-foreground">Aperçu :</p>
                  <p className="text-muted-foreground">Destinataire : <span className="text-foreground">{personName(personId)}</span></p>
                  <p className="text-muted-foreground">Type : <span className="text-foreground">{persons.find(p => p.id === personId)?.type}</span></p>
                </div>
              )}
              <Button onClick={genererAdhesion} disabled={!personId} className="w-full bg-[#1E3A5F] hover:bg-[#16294a] text-white">
                <Download className="h-4 w-4 mr-2" />Générer le certificat
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CTF */}
        <TabsContent value="ctf" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Certificat de participation CTF
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Atteste la participation aux compétitions Capture The Flag.
              </p>
              <div className="space-y-1.5">
                <Label>Compétiteur *</Label>
                <Select value={ctfPersonId} onValueChange={setCtfPersonId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {(competiteurs.length > 0 ? competiteurs : adherents).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.prenom} {p.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Compétition (optionnel)</Label>
                <Select value={ctfEventId} onValueChange={setCtfEventId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les compétitions</SelectItem>
                    {ctfEvents.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nom} — {e.plateforme}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {ctfPersonId && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm">
                  <p className="text-amber-800 dark:text-amber-300">
                    {ctfEvents.filter(e => e.participants.includes(ctfPersonId)).length} compétition(s) trouvée(s) pour ce membre.
                  </p>
                </div>
              )}
              <Button onClick={genererCTF} disabled={!ctfPersonId} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                <Download className="h-4 w-4 mr-2" />Générer le certificat CTF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mentorat */}
        <TabsContent value="mentorat" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#4A7C59]" />
                Attestation de mentorat
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Attestation pour un mentor (heures bénévoles) ou un apprenti (parcours de formation).
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Rôle</Label>
                  <Select value={mentoratRole} onValueChange={v => setMentoratRole(v as 'mentor' | 'apprenti')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mentor">Mentor</SelectItem>
                      <SelectItem value="apprenti">Apprenti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Personne *</Label>
                  <Select value={mentoratPersonId} onValueChange={setMentoratPersonId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {(mentorsAppr.length > 0 ? mentorsAppr : adherents).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.prenom} {p.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {mentoratPersonId && (() => {
                const sessions = sessionsMentorat.filter(s =>
                  s.statut === 'realisee' && (mentoratRole === 'mentor' ? s.mentorId === mentoratPersonId : s.apprentiId === mentoratPersonId)
                );
                const heures = Math.round(sessions.reduce((a, s) => a + s.dureeMinutes, 0) / 60);
                return (
                  <div className="p-3 rounded-lg bg-[#4A7C59]/10 border border-[#4A7C59]/20 text-sm">
                    <p className="text-muted-foreground">{sessions.length} session(s) réalisée(s) — {heures}h</p>
                  </div>
                );
              })()}
              <Button onClick={genererMentorat} disabled={!mentoratPersonId} className="w-full bg-[#4A7C59] hover:bg-[#3d6849] text-white">
                <Download className="h-4 w-4 mr-2" />Générer l&apos;attestation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Libre */}
        <TabsContent value="personnalise" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Certificat personnalisé
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Titre du certificat *</Label>
                  <Input value={customTitre} onChange={e => setCustomTitre(e.target.value)} placeholder="Ex : Certificat d'excellence" />
                </div>
                <div className="space-y-1.5">
                  <Label>Sous-titre (optionnel)</Label>
                  <Input value={customSousTitre} onChange={e => setCustomSousTitre(e.target.value)} placeholder="Ex : Compétition nationale" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Destinataire *</Label>
                <Input value={customDestinataire} onChange={e => setCustomDestinataire(e.target.value)} placeholder="Prénom Nom" />
              </div>
              <div className="space-y-1.5">
                <Label>Corps du texte</Label>
                <Textarea value={customCorps} onChange={e => setCustomCorps(e.target.value)} rows={4} className="resize-none font-mono text-sm" />
                <p className="text-xs text-muted-foreground">Utilisez des sauts de ligne pour séparer les paragraphes.</p>
              </div>
              <Button onClick={genererPersonnalise} disabled={!customTitre || !customDestinataire} className="w-full bg-[#1E3A5F] hover:bg-[#16294a] text-white">
                <Download className="h-4 w-4 mr-2" />Générer le certificat
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
