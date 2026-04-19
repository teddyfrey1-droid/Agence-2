/**
 * Email utility — powered by Brevo (ex-Sendinblue).
 *
 * Variables d'environnement requises :
 *   BREVO_API_KEY=xkeysib-xxxxxxxxx
 *   APP_URL=https://votre-domaine.com
 *   EMAIL_FROM=contact@votre-domaine.com
 */

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const EMAIL_FROM_RAW = process.env.EMAIL_FROM || "noreply@retailplace.immo";
const AGENCY_NAME = process.env.AGENCY_NAME || "Retail Avenue";

/**
 * Escape HTML special characters to prevent HTML injection in email templates.
 * All user-provided strings MUST be passed through this before interpolation.
 */
function escapeHtml(unsafe: string | number | null | undefined): string {
  if (unsafe == null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Parse EMAIL_FROM: supports "Name <email>" or just "email"
function parseSender(): { email: string; name: string } {
  const match = EMAIL_FROM_RAW.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { email: EMAIL_FROM_RAW.trim(), name: AGENCY_NAME };
}

interface EmailAttachment {
  /** File name displayed in the recipient's client, e.g. "Contrat.pdf" */
  name: string;
  /** Base64-encoded file content (without data URL prefix) */
  content: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: { email: string; name?: string };
  attachments?: EmailAttachment[];
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn("[EMAIL] BREVO_API_KEY non configurée — email non envoyé");
    console.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`);
    return true;
  }

  const sender = parseSender();

  const payload: Record<string, unknown> = {
    sender,
    to: [{ email: options.to }],
    subject: options.subject,
    htmlContent: options.html,
  };
  if (options.replyTo) payload.replyTo = options.replyTo;
  if (options.attachments && options.attachments.length > 0) {
    payload.attachment = options.attachments.map((a) => ({ name: a.name, content: a.content }));
  }

  console.log(`[EMAIL] Envoi via Brevo → ${options.to} | Sender: ${sender.email} | Subject: ${options.subject}`);

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`[EMAIL] Brevo error ${response.status}:`, responseText);
      return false;
    }

    console.log(`[EMAIL] Envoyé avec succès à ${options.to}`);
    return true;
  } catch (err) {
    console.error("[EMAIL] Erreur réseau Brevo:", err);
    return false;
  }
}

// ─── Shared branded layout ───────────────────────────────────────────

/**
 * Absolute URL of the brand logo shown in email headers. `/logo-mark.svg` is
 * served from /public so this resolves to `<APP_URL>/logo-mark.svg`.
 */
const LOGO_URL = `${APP_URL.replace(/\/$/, "")}/logo-mark.svg`;

interface LayoutOptions {
  /** Eyebrow label above the main title, e.g. "Proposition de bien" */
  eyebrow: string;
  /** Main H1 title */
  title: string;
  /** HTML body content */
  content: string;
  /** Optional CTA button */
  cta?: { label: string; href: string };
  /** Optional footer line (defaults to agency coordinates) */
  footerNote?: string;
}

function brandedLayout(opts: LayoutOptions): string {
  const { eyebrow, title, content, cta, footerNote } = opts;
  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto;">
         <tr>
           <td align="center" bgcolor="#a68a4e" style="border-radius:8px;">
             <a href="${escapeHtml(cta.href)}"
                style="display:inline-block;padding:14px 32px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#ffffff;text-decoration:none;font-weight:600;letter-spacing:0.02em;">
               ${escapeHtml(cta.label)}
             </a>
           </td>
         </tr>
       </table>`
    : "";

  const footer =
    footerNote ||
    `Cet email vous est adressé par ${escapeHtml(AGENCY_NAME)} dans le cadre de la gestion de votre dossier commercial.`;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f2ec;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#23211d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f2ec" style="padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(32,31,29,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#fbf7ef 0%,#efe8d9 100%);padding:28px 32px;border-bottom:1px solid #e8dfcc;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left">
                    <img src="${escapeHtml(LOGO_URL)}" alt="${escapeHtml(AGENCY_NAME)}" height="32"
                      style="display:block;height:32px;width:auto;" />
                  </td>
                  <td align="right" style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8a815f;font-weight:600;">
                    ${escapeHtml(eyebrow)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 36px 28px;">
              <h1 style="margin:0 0 18px;font-family:'Georgia',serif;font-size:24px;line-height:1.25;color:#1a1a2e;font-weight:600;">
                ${escapeHtml(title)}
              </h1>
              <div style="font-size:15px;line-height:1.65;color:#3a3630;">
                ${content}
              </div>
              ${ctaHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px;">
              <div style="border-top:1px solid #ece6d8;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px 30px;font-size:12px;line-height:1.55;color:#8a857a;">
              <strong style="color:#3a3630;">${escapeHtml(AGENCY_NAME)}</strong><br />
              ${footer}
            </td>
          </tr>
        </table>
        <p style="max-width:600px;margin:16px auto 0;font-size:11px;line-height:1.5;color:#a39f95;">
          Si vous avez reçu cet email par erreur, merci de le supprimer. © ${new Date().getFullYear()} ${escapeHtml(AGENCY_NAME)}.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Email templates ────────────────────────────────────────────────

export async function sendInvitationEmail(
  to: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const activationUrl = `${APP_URL}/activation?token=${token}`;

  const content = `
    <p style="margin:0 0 14px;">Bonjour <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 14px;">
      Vous avez été invité(e) à rejoindre la plateforme ${escapeHtml(AGENCY_NAME)}.
      Cliquez sur le bouton ci-dessous pour activer votre compte et définir votre mot de passe.
    </p>
    <p style="margin:0;color:#6e695f;font-size:13px;">
      Ce lien expire dans 48 heures. Si vous n'êtes pas à l'origine de cette invitation, ignorez simplement cet email.
    </p>`;

  return sendEmail({
    to,
    subject: `Vous êtes invité à rejoindre ${AGENCY_NAME}`,
    html: brandedLayout({
      eyebrow: "Invitation",
      title: "Bienvenue à bord",
      content,
      cta: { label: "Activer mon compte", href: activationUrl },
      footerNote: `Lien direct : <a href="${escapeHtml(activationUrl)}" style="color:#a68a4e;">${escapeHtml(activationUrl)}</a>`,
    }),
  });
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${APP_URL}/reinitialisation-mot-de-passe?token=${token}`;

  const content = `
    <p style="margin:0 0 14px;">Bonjour <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 14px;">
      Vous avez demandé la réinitialisation de votre mot de passe.
      Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
    </p>
    <p style="margin:0;color:#6e695f;font-size:13px;">
      Ce lien expire dans une heure. Si vous n'avez pas fait cette demande, ignorez cet email — votre compte reste sécurisé.
    </p>`;

  return sendEmail({
    to,
    subject: `Réinitialisation de votre mot de passe — ${AGENCY_NAME}`,
    html: brandedLayout({
      eyebrow: "Sécurité",
      title: "Réinitialisation du mot de passe",
      content,
      cta: { label: "Choisir un nouveau mot de passe", href: resetUrl },
      footerNote: `Lien direct : <a href="${escapeHtml(resetUrl)}" style="color:#a68a4e;">${escapeHtml(resetUrl)}</a>`,
    }),
  });
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string
): Promise<boolean> {
  const loginUrl = `${APP_URL}/login`;

  const content = `
    <p style="margin:0 0 14px;">Bonjour <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 14px;">
      Votre compte a été activé avec succès. Vous pouvez désormais vous connecter à la plateforme
      et démarrer votre suivi d'activité.
    </p>`;

  return sendEmail({
    to,
    subject: `Votre compte ${AGENCY_NAME} est activé`,
    html: brandedLayout({
      eyebrow: "Compte activé",
      title: "Bienvenue !",
      content,
      cta: { label: "Se connecter", href: loginUrl },
    }),
  });
}

// ─── Property Share Email ────────────────────────────────────────────

export async function sendPropertyShareEmail(params: {
  to: string;
  recipientName: string;
  propertyTitle: string;
  propertyReference: string;
  propertyCity: string;
  propertyPrice: number | null;
  propertyRent: number | null;
  transactionType: string;
  shareToken: string;
  senderName: string;
  message?: string;
}): Promise<boolean> {
  const viewUrl = `${APP_URL}/biens/partage/${params.shareToken}`;
  const priceDisplay = params.transactionType === "LOCATION"
    ? params.propertyRent
      ? `${new Intl.NumberFormat("fr-FR").format(params.propertyRent)} € / mois HT HC`
      : "Prix sur demande"
    : params.propertyPrice
      ? `${new Intl.NumberFormat("fr-FR").format(params.propertyPrice)} €`
      : "Prix sur demande";

  const content = `
    <p style="margin:0 0 14px;">
      Bonjour${params.recipientName ? ` <strong>${escapeHtml(params.recipientName)}</strong>` : ""},
    </p>
    <p style="margin:0 0 18px;">
      <strong>${escapeHtml(params.senderName)}</strong> vous propose un bien qui pourrait correspondre à votre recherche.
    </p>
    ${params.message ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
        <tr><td style="border-left:3px solid #a68a4e;padding:10px 14px;background:#faf6ee;border-radius:0 8px 8px 0;font-style:italic;color:#3a3630;font-size:14px;line-height:1.55;">
          ${escapeHtml(params.message)}
        </td></tr>
      </table>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;border:1px solid #ece6d8;border-radius:10px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a815f;font-weight:600;">
            Réf. ${escapeHtml(params.propertyReference)}
          </p>
          <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#1a1a2e;">
            ${escapeHtml(params.propertyTitle)}
          </p>
          <p style="margin:0 0 10px;font-size:14px;color:#6e695f;">
            ${escapeHtml(params.propertyCity)}
          </p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#a68a4e;">
            ${priceDisplay}
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#6e695f;">
      L'accès à la fiche complète est personnel et confidentiel.
    </p>`;

  return sendEmail({
    to: params.to,
    subject: `Proposition de bien — ${params.propertyTitle} (${params.propertyReference})`,
    html: brandedLayout({
      eyebrow: "Proposition de bien",
      title: "Un bien sélectionné pour vous",
      content,
      cta: { label: "Voir la fiche du bien", href: viewUrl },
      footerNote: `Proposé par <strong>${escapeHtml(params.senderName)}</strong> — ${escapeHtml(AGENCY_NAME)}`,
    }),
  });
}

// ─── Client Follow-up Email ──────────────────────────────────────────

export async function sendFollowUpEmail(
  to: string,
  firstName: string,
  daysSinceLastActivity: number
): Promise<boolean> {
  const loginUrl = `${APP_URL}/espace-client`;

  const content = `
    <p style="margin:0 0 14px;">Bonjour <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 14px;">
      Nous n'avons pas eu de nouvelles depuis ${escapeHtml(daysSinceLastActivity)} jours.
      De nouveaux biens ont été ajoutés et pourraient correspondre à vos critères.
    </p>
    <p style="margin:0;">
      Connectez-vous à votre espace client pour consulter les dernières propositions.
    </p>`;

  return sendEmail({
    to,
    subject: `Êtes-vous toujours en recherche ? — ${AGENCY_NAME}`,
    html: brandedLayout({
      eyebrow: "Suivi de recherche",
      title: "Comment avance votre recherche ?",
      content,
      cta: { label: "Accéder à mon espace", href: loginUrl },
      footerNote: "Votre conseiller reste à votre disposition pour toute question.",
    }),
  });
}

// ─── Matching Property Email ─────────────────────────────────────────

export async function sendMatchingPropertyEmail(
  to: string,
  firstName: string,
  propertyTitle: string,
  propertyCity: string,
  score: number,
  propertyId: string
): Promise<boolean> {
  const propertyUrl = `${APP_URL}/espace-client/biens/${propertyId}`;

  const scoreColor = score >= 70 ? "#047857" : "#b45309";
  const scoreBg = score >= 70 ? "#ecfdf5" : "#fffbeb";

  const content = `
    <p style="margin:0 0 14px;">Bonjour <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 14px;">
      Nous avons identifié un bien qui correspond à vos critères.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 0;border:1px solid #ece6d8;border-radius:10px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#1a1a2e;">
            ${escapeHtml(propertyTitle)}
          </p>
          <p style="margin:0 0 12px;font-size:14px;color:#6e695f;">
            ${escapeHtml(propertyCity)}
          </p>
          <span style="display:inline-block;background:${scoreBg};color:${scoreColor};padding:5px 12px;border-radius:20px;font-size:13px;font-weight:600;">
            Score de compatibilité : ${escapeHtml(score)} %
          </span>
        </td>
      </tr>
    </table>`;

  return sendEmail({
    to,
    subject: `Nouveau bien correspondant à votre recherche — ${propertyTitle}`,
    html: brandedLayout({
      eyebrow: "Matching",
      title: "Un bien correspond à votre recherche",
      content,
      cta: { label: "Voir la fiche du bien", href: propertyUrl },
    }),
  });
}

// ─── Notification Email (generic for collaborators) ──────────────────

export async function sendNotificationEmail(
  to: string,
  firstName: string,
  title: string,
  message: string,
  link?: string
): Promise<boolean> {
  const actionUrl = link ? `${APP_URL}${link}` : `${APP_URL}/dashboard`;

  const content = `
    <p style="margin:0 0 14px;">Bonjour <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0;line-height:1.65;">${escapeHtml(message)}</p>`;

  return sendEmail({
    to,
    subject: `${title} — ${AGENCY_NAME}`,
    html: brandedLayout({
      eyebrow: "Notification",
      title,
      content,
      cta: { label: "Voir dans l'application", href: actionUrl },
    }),
  });
}

// ─── Contract Email (with PDF attachment) ────────────────────────────

export async function sendContractEmail(params: {
  to: string;
  subject: string;
  message: string;
  recipientName: string;
  recipientType: "BAILLEUR" | "CO_MANDATAIRE" | "PRENEUR" | "AGENCE";
  senderName: string;
  senderEmail: string;
  agencyName: string;
  propertyRef: string;
  propertyTitle: string;
  fileName: string;
  pdfBase64: string;
}): Promise<boolean> {
  const r = params.recipientType;
  const headline =
    r === "PRENEUR"
      ? "Feuille d'engagement — à signer par le preneur"
      : r === "BAILLEUR"
      ? "Contrat d'engagement à signer"
      : r === "CO_MANDATAIRE"
      ? "Convention de co-mandat à signer"
      : "Exemplaire interne — dossier d'engagement";
  const intro =
    r === "PRENEUR"
      ? "Veuillez trouver ci-joint la feuille d'engagement à signer préalablement à la transmission au bailleur. Merci de nous retourner le document signé, accompagné de la mention « Lu et approuvé »."
      : r === "BAILLEUR"
      ? "Veuillez trouver ci-joint le contrat d'engagement relatif à la commercialisation du bien ci-dessous. Le preneur a signé le document au préalable ; nous sollicitons désormais votre accord."
      : r === "CO_MANDATAIRE"
      ? "Veuillez trouver ci-joint la convention de co-mandat relative à la commercialisation conjointe du bien ci-dessous. La répartition des honoraires y est détaillée."
      : "Veuillez trouver ci-joint l'exemplaire de l'engagement archivé pour le dossier de l'agence.";

  const customMessage = (params.message || "").trim();
  const confidentialityNote =
    r === "CO_MANDATAIRE"
      ? "Document inter-agences — contient la répartition confidentielle des honoraires."
      : "Document personnalisé — la visibilité des honoraires dépend de la configuration choisie pour votre rôle.";

  const content = `
    <p style="margin:0 0 14px;">Bonjour <strong>${escapeHtml(params.recipientName)}</strong>,</p>
    <p style="margin:0 0 16px;line-height:1.65;">${escapeHtml(intro)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;background:#faf6ee;border-radius:10px;">
      <tr>
        <td style="padding:14px 18px;font-size:14px;line-height:1.6;color:#3a3630;">
          <strong style="color:#1a1a2e;">Référence :</strong> ${escapeHtml(params.propertyRef)}<br />
          <strong style="color:#1a1a2e;">Bien :</strong> ${escapeHtml(params.propertyTitle)}
        </td>
      </tr>
    </table>
    ${customMessage ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
        <tr><td style="border-left:3px solid #a68a4e;padding:10px 14px;background:#fbf7ef;border-radius:0 8px 8px 0;white-space:pre-line;font-size:14px;line-height:1.55;color:#3a3630;">
          ${escapeHtml(customMessage)}
        </td></tr>
      </table>` : ""}
    <p style="margin:0 0 4px;line-height:1.65;">
      Merci de bien vouloir retourner le document signé à l'adresse ci-dessous.
    </p>
    <p style="margin:22px 0 0;font-size:14px;color:#3a3630;line-height:1.6;">
      Cordialement,<br />
      <strong>${escapeHtml(params.senderName)}</strong><br />
      <span style="color:#6e695f;">${escapeHtml(params.agencyName)}</span><br />
      <a href="mailto:${escapeHtml(params.senderEmail)}" style="color:#a68a4e;">${escapeHtml(params.senderEmail)}</a>
    </p>
    <p style="margin:18px 0 0;font-size:11px;color:#8a857a;font-style:italic;">
      ${escapeHtml(confidentialityNote)}
    </p>`;

  return sendEmail({
    to: params.to,
    subject: params.subject,
    replyTo: { email: params.senderEmail, name: params.senderName },
    attachments: [
      {
        name: params.fileName,
        content: params.pdfBase64,
      },
    ],
    html: brandedLayout({
      eyebrow: "Document contractuel",
      title: headline,
      content,
      footerNote: `${escapeHtml(params.senderName)} · ${escapeHtml(params.agencyName)} · <a href="mailto:${escapeHtml(params.senderEmail)}" style="color:#a68a4e;">${escapeHtml(params.senderEmail)}</a>`,
    }),
  });
}
