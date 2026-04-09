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

// Parse EMAIL_FROM: supports "Name <email>" or just "email"
function parseSender(): { email: string; name: string } {
  const match = EMAIL_FROM_RAW.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { email: EMAIL_FROM_RAW.trim(), name: "Retail Avenue" };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn("[EMAIL] BREVO_API_KEY non configurée — email non envoyé");
    console.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`);
    return true;
  }

  const sender = parseSender();

  const payload = {
    sender,
    to: [{ email: options.to }],
    subject: options.subject,
    htmlContent: options.html,
  };

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
          Bonjour ${firstName},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Vous avez été invité(e) à rejoindre la plateforme Retail Avenue.
          Cliquez sur le bouton ci-dessous pour activer votre compte et définir votre mot de passe.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${activationUrl}"
             style="background: #8B6914; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Activer mon compte
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          Ce lien expire dans 48 heures. Si vous n'avez pas demandé cette invitation, ignorez cet email.
        </p>
        <p style="color: #888; font-size: 14px;">
          Lien direct : <a href="${activationUrl}">${activationUrl}</a>
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
          Bonjour ${firstName},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Vous avez demandé la réinitialisation de votre mot de passe.
          Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="background: #8B6914; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
        <p style="color: #888; font-size: 14px;">
          Lien direct : <a href="${resetUrl}">${resetUrl}</a>
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
          Bonjour ${firstName},
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
          Bonjour${params.recipientName ? ` ${params.recipientName}` : ""},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          ${params.senderName} vous propose un bien qui pourrait vous intéresser :
        </p>
        ${params.message ? `<div style="background: #f5f5f0; border-left: 3px solid #8B6914; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;"><p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0; font-style: italic;">${params.message}</p></div>` : ""}
        <div style="background: #fafaf8; border: 1px solid #e5e5e0; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h2 style="color: #1a1a2e; font-size: 18px; margin: 0 0 8px 0;">${params.propertyTitle}</h2>
          <p style="color: #8B6914; font-size: 14px; margin: 0 0 4px 0;">${params.propertyReference}</p>
          <p style="color: #666; font-size: 14px; margin: 0 0 12px 0;">${params.propertyCity}</p>
          <p style="color: #1a1a2e; font-size: 20px; font-weight: 700; margin: 0;">${priceDisplay}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${viewUrl}"
             style="background: #8B6914; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Voir le bien
          </a>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center;">
          Proposé par ${params.senderName} — Retail Avenue
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
          Bonjour ${firstName},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Nous n'avons pas eu de nouvelles depuis ${daysSinceLastActivity} jours.
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
          Bonjour ${firstName},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Nous avons identifié un bien qui correspond à vos critères avec un score de compatibilité de <strong>${score}%</strong>.
        </p>
        <div style="background: #fafaf8; border: 1px solid #e5e5e0; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h2 style="color: #1a1a2e; font-size: 18px; margin: 0 0 8px 0;">${propertyTitle}</h2>
          <p style="color: #666; font-size: 14px; margin: 0 0 12px 0;">${propertyCity}</p>
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
        <h1 style="color: #1a1a2e; font-size: 24px;">${title}</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${firstName},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          ${message}
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
