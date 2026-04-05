/**
 * Email utility — powered by Brevo (ex-Sendinblue).
 *
 * Variables d'environnement requises :
 *   BREVO_API_KEY=xkeysib-xxxxxxxxx
 *   APP_URL=https://votre-domaine.com
 *   EMAIL_FROM=contact@votre-domaine.com
 */

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@laplace.immo";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn("BREVO_API_KEY non configurée — email loggé en console uniquement");
    console.log(`📧 [DEV] To: ${options.to} | Subject: ${options.subject}`);
    return true;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { email: EMAIL_FROM, name: "La Place" },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Brevo email error:", response.status, error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Brevo email send failed:", err);
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
    subject: "Vous êtes invité à rejoindre La Place",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a2e; font-size: 24px;">Bienvenue sur La Place</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${firstName},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Vous avez été invité(e) à rejoindre la plateforme La Place.
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
    subject: "Réinitialisation de votre mot de passe - La Place",
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
    subject: "Votre compte La Place est activé",
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
