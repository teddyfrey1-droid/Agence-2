/**
 * Email utility for sending transactional emails.
 *
 * CONFIGURATION REQUISE EN PRODUCTION :
 * ─────────────────────────────────────
 * 1. Installer un provider d'email : npm install resend (ou nodemailer)
 * 2. Ajouter dans .env :
 *    RESEND_API_KEY=re_xxxxxxxxxxxxxxx
 *    APP_URL=https://votre-domaine.com
 *    EMAIL_FROM=noreply@votre-domaine.com
 * 3. Remplacer les fonctions sendEmail ci-dessous par l'implémentation Resend/Nodemailer
 *
 * Pour l'instant, les emails sont loggés en console (mode développement).
 */

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@laplace.immo";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  // ──────────────────────────────────────────────────────────────
  // MODE PRODUCTION : Décommenter et configurer Resend :
  //
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // const { error } = await resend.emails.send({
  //   from: EMAIL_FROM,
  //   to: options.to,
  //   subject: options.subject,
  //   html: options.html,
  // });
  // return !error;
  // ──────────────────────────────────────────────────────────────

  // Mode développement : log en console
  console.log("═══════════════════════════════════════");
  console.log("📧 EMAIL (dev mode - pas envoyé)");
  console.log(`   To: ${options.to}`);
  console.log(`   Subject: ${options.subject}`);
  console.log(`   From: ${EMAIL_FROM}`);
  console.log("───────────────────────────────────────");
  console.log(options.html.replace(/<[^>]*>/g, "").trim().substring(0, 500));
  console.log("═══════════════════════════════════════");
  return true;
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
