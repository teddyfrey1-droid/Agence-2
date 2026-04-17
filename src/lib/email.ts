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
  return { email: EMAIL_FROM_RAW.trim(), name: "Retail Avenue" };
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

// ─── Email templates ────────────────────────────────────────────────

export async function sendInvitationEmail(
  to: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const activationUrl = `${APP_URL}/activation?token=${token}`;

  return sendEmail({
    to,
    subject: "Vous êtes invité à rejoindre Retail Avenue",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a2e; font-size: 24px;">Bienvenue sur Retail Avenue</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${escapeHtml(firstName)},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Vous avez été invité(e) à rejoindre la plateforme Retail Avenue.
          Cliquez sur le bouton ci-dessous pour activer votre compte et définir votre mot de passe.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${escapeHtml(activationUrl)}"
             style="background: #8B6914; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Activer mon compte
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          Ce lien expire dans 48 heures. Si vous n'avez pas demandé cette invitation, ignorez cet email.
        </p>
        <p style="color: #888; font-size: 14px;">
          Lien direct : <a href="${escapeHtml(activationUrl)}">${escapeHtml(activationUrl)}</a>
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${APP_URL}/reinitialisation-mot-de-passe?token=${token}`;

  return sendEmail({
    to,
    subject: "Réinitialisation de votre mot de passe - Retail Avenue",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a2e; font-size: 24px;">Réinitialisation du mot de passe</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${escapeHtml(firstName)},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Vous avez demandé la réinitialisation de votre mot de passe.
          Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${escapeHtml(resetUrl)}"
             style="background: #8B6914; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
        <p style="color: #888; font-size: 14px;">
          Lien direct : <a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a>
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string
): Promise<boolean> {
  const loginUrl = `${APP_URL}/login`;

  return sendEmail({
    to,
    subject: "Votre compte Retail Avenue est activé",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a2e; font-size: 24px;">Bienvenue !</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${escapeHtml(firstName)},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginUrl}"
             style="background: #8B6914; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Se connecter
          </a>
        </div>
      </div>
    `,
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
  const viewUrl = `${APP_URL}/biens/${params.shareToken}?src=share`;
  const priceDisplay = params.transactionType === "LOCATION"
    ? params.propertyRent ? `${new Intl.NumberFormat("fr-FR").format(params.propertyRent)} €/mois` : "Prix sur demande"
    : params.propertyPrice ? `${new Intl.NumberFormat("fr-FR").format(params.propertyPrice)} €` : "Prix sur demande";

  return sendEmail({
    to: params.to,
    subject: `Proposition de bien — ${params.propertyTitle} (${params.propertyReference})`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a2e; font-size: 24px;">Proposition de bien</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour${params.recipientName ? ` ${escapeHtml(params.recipientName)}` : ""},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          ${escapeHtml(params.senderName)} vous propose un bien qui pourrait vous intéresser :
        </p>
        ${params.message ? `<div style="background: #f5f5f0; border-left: 3px solid #8B6914; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;"><p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0; font-style: italic;">${escapeHtml(params.message)}</p></div>` : ""}
        <div style="background: #fafaf8; border: 1px solid #e5e5e0; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h2 style="color: #1a1a2e; font-size: 18px; margin: 0 0 8px 0;">${escapeHtml(params.propertyTitle)}</h2>
          <p style="color: #8B6914; font-size: 14px; margin: 0 0 4px 0;">${escapeHtml(params.propertyReference)}</p>
          <p style="color: #666; font-size: 14px; margin: 0 0 12px 0;">${escapeHtml(params.propertyCity)}</p>
          <p style="color: #1a1a2e; font-size: 20px; font-weight: 700; margin: 0;">${priceDisplay}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${viewUrl}"
             style="background: #8B6914; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Voir le bien
          </a>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center;">
          Proposé par ${escapeHtml(params.senderName)} — Retail Avenue
        </p>
      </div>
    `,
  });
}

// ─── Client Follow-up Email ──────────────────────────────────────────

export async function sendFollowUpEmail(
  to: string,
  firstName: string,
  daysSinceLastActivity: number
): Promise<boolean> {
  const loginUrl = `${APP_URL}/espace-client`;

  return sendEmail({
    to,
    subject: "Êtes-vous toujours en recherche ? — Retail Avenue",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a2e; font-size: 24px;">Comment avance votre recherche ?</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${escapeHtml(firstName)},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Nous n'avons pas eu de nouvelles depuis ${escapeHtml(daysSinceLastActivity)} jours.
          De nouveaux biens ont été ajoutés et pourraient correspondre à vos critères.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Connectez-vous à votre espace client pour consulter les dernières propositions.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginUrl}"
             style="background: #8B6914; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Accéder à mon espace
          </a>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center;">
          Votre conseiller reste à votre disposition pour toute question.
        </p>
      </div>
    `,
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

  return sendEmail({
    to,
    subject: `Nouveau bien correspondant à votre recherche — ${propertyTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a2e; font-size: 24px;">Un bien correspond à votre recherche</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${escapeHtml(firstName)},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Nous avons identifié un bien qui correspond à vos critères avec un score de compatibilité de <strong>${escapeHtml(score)}%</strong>.
        </p>
        <div style="background: #fafaf8; border: 1px solid #e5e5e0; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h2 style="color: #1a1a2e; font-size: 18px; margin: 0 0 8px 0;">${escapeHtml(propertyTitle)}</h2>
          <p style="color: #666; font-size: 14px; margin: 0 0 12px 0;">${escapeHtml(propertyCity)}</p>
          <div style="display: inline-block; background: ${score >= 70 ? "#ecfdf5" : "#fffbeb"}; color: ${score >= 70 ? "#059669" : "#d97706"}; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">
            Score : ${score}%
          </div>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${propertyUrl}"
             style="background: #8B6914; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Voir le bien
          </a>
        </div>
      </div>
    `,
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

  return sendEmail({
    to,
    subject: `${title} — Retail Avenue`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a2e; font-size: 24px;">${escapeHtml(title)}</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${escapeHtml(firstName)},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          ${escapeHtml(message)}
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${actionUrl}"
             style="background: #8B6914; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Voir dans l'application
          </a>
        </div>
      </div>
    `,
  });
}

// ─── Contract Email (with PDF attachment) ────────────────────────────

export async function sendContractEmail(params: {
  to: string;
  subject: string;
  message: string;
  recipientName: string;
  recipientType: "BAILLEUR" | "CO_MANDATAIRE";
  senderName: string;
  senderEmail: string;
  agencyName: string;
  propertyRef: string;
  propertyTitle: string;
  fileName: string;
  pdfBase64: string;
}): Promise<boolean> {
  const isBailleur = params.recipientType === "BAILLEUR";
  const headline = isBailleur
    ? "Contrat d'engagement à signer"
    : "Convention de co-mandat à signer";
  const intro = isBailleur
    ? "Veuillez trouver ci-joint le contrat d'engagement relatif à la commercialisation du bien ci-dessous."
    : "Veuillez trouver ci-joint la convention de co-mandat relative à la commercialisation conjointe du bien ci-dessous.";

  const customMessage = (params.message || "").trim();

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
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #23211e;">
        <div style="border-bottom: 2px solid #a68a4e; padding-bottom: 12px; margin-bottom: 24px;">
          <div style="font-size: 12px; letter-spacing: 0.08em; color: #6e695f;">${escapeHtml(params.agencyName.toUpperCase())}</div>
          <h1 style="margin: 6px 0 0; color: #201f1d; font-size: 22px;">${escapeHtml(headline)}</h1>
        </div>
        <p style="font-size: 15px; line-height: 1.6;">
          Bonjour ${escapeHtml(params.recipientName)},
        </p>
        <p style="font-size: 15px; line-height: 1.6;">
          ${escapeHtml(intro)}
        </p>
        <div style="background: #f9f6f0; border-radius: 8px; padding: 14px 18px; margin: 18px 0; font-size: 14px;">
          <div><strong>Référence :</strong> ${escapeHtml(params.propertyRef)}</div>
          <div><strong>Bien :</strong> ${escapeHtml(params.propertyTitle)}</div>
        </div>
        ${
          customMessage
            ? `<p style="font-size: 15px; line-height: 1.6; white-space: pre-line; border-left: 3px solid #a68a4e; padding-left: 12px; color: #3a3630;">${escapeHtml(customMessage)}</p>`
            : ""
        }
        <p style="font-size: 15px; line-height: 1.6;">
          Merci de bien vouloir retourner le document signé à l'adresse ci-dessous.
        </p>
        <p style="font-size: 15px; line-height: 1.6; margin-top: 28px;">
          Cordialement,<br />
          <strong>${escapeHtml(params.senderName)}</strong><br />
          <span style="color: #6e695f;">${escapeHtml(params.agencyName)}</span><br />
          <a href="mailto:${escapeHtml(params.senderEmail)}" style="color: #a68a4e;">${escapeHtml(params.senderEmail)}</a>
        </p>
        <p style="font-size: 11px; color: #8a857a; margin-top: 32px; border-top: 1px solid #e8e3d8; padding-top: 12px;">
          ${isBailleur
            ? "Document personnalisé — votre exemplaire ne comporte pas la répartition d'honoraires entre intermédiaires."
            : "Document inter-agences — contient la répartition confidentielle des honoraires."}
        </p>
      </div>
    `,
  });
}
