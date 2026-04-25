import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

let client: Anthropic | null = null;

export function getAIClient(): Anthropic | null {
  if (!apiKey) return null;
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

export function isAIEnabled(): boolean {
  return Boolean(apiKey);
}

export const AI_MODEL = model;

export interface BusinessCardData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  position?: string;
  address?: string;
  website?: string;
}

const BUSINESS_CARD_PROMPT = `Tu es un assistant qui extrait les informations d'une carte de visite.
Analyse l'image fournie et retourne UNIQUEMENT un JSON valide avec ces champs (tous optionnels, omets un champ si absent) :
{
  "firstName": string,
  "lastName": string,
  "email": string,
  "phone": string (ligne fixe),
  "mobile": string (ligne mobile),
  "company": string,
  "position": string (poste / fonction),
  "address": string,
  "website": string
}
Normalise les numéros de téléphone au format français (+33 ou 0X XX XX XX XX). Aucune explication, juste le JSON.`;

export async function extractBusinessCard(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<BusinessCardData> {
  const ai = getAIClient();
  if (!ai) throw new Error("IA désactivée : configurez ANTHROPIC_API_KEY");

  const response = await ai.messages.create({
    model,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          { type: "text", text: BUSINESS_CARD_PROMPT },
        ],
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Réponse IA illisible");
  const parsed = JSON.parse(jsonMatch[0]) as BusinessCardData;
  return parsed;
}

export interface ListingContext {
  type?: string | null;
  transactionType?: string | null;
  surface?: number | null;
  district?: string | null;
  city?: string | null;
  quarter?: string | null;
  price?: number | null;
  rentMonthly?: number | null;
  hasExtraction?: boolean;
  hasTerrace?: boolean;
  hasParking?: boolean;
  hasLoadingDock?: boolean;
  floor?: number | null;
  facadeLength?: number | null;
  ceilingHeight?: number | null;
  notes?: string | null;
}

export interface GeneratedListing {
  title: string;
  description: string;
  hooks: string[];
}

export async function generateListing(ctx: ListingContext): Promise<GeneratedListing> {
  const ai = getAIClient();
  if (!ai) throw new Error("IA désactivée : configurez ANTHROPIC_API_KEY");

  const facts = Object.entries(ctx)
    .filter(([, v]) => v !== null && v !== undefined && v !== "" && v !== false)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const prompt = `Tu es rédacteur d'annonces pour une agence d'immobilier commercial à Paris.
Rédige une annonce professionnelle et attractive à partir de ces caractéristiques :
${facts}

Ton : chaleureux mais professionnel. Pas d'exagération, pas d'emoji, pas de superlatifs creux.
Style concret qui met en avant l'emplacement, les atouts du local et la destination possible.

Retourne UNIQUEMENT un JSON valide :
{
  "title": "titre court et percutant (max 70 caractères)",
  "description": "description complète sur 4 à 6 phrases (max 800 caractères)",
  "hooks": ["3 accroches courtes sous forme de puces, max 50 caractères chacune"]
}`;

  const response = await ai.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Réponse IA illisible");
  const parsed = JSON.parse(jsonMatch[0]) as GeneratedListing;
  if (!parsed.title || !parsed.description) throw new Error("Réponse IA incomplète");
  return {
    title: parsed.title,
    description: parsed.description,
    hooks: Array.isArray(parsed.hooks) ? parsed.hooks.slice(0, 5) : [],
  };
}

const VOICE_CLEANUP_PROMPT = `Tu es un assistant qui transforme une transcription brute de note vocale en note de terrain structurée.
À partir du texte brut, retourne UNIQUEMENT un JSON avec :
{
  "summary": "note reformulée en français clair, phrases courtes, ponctuation correcte (max 400 caractères)",
  "tags": ["2 à 4 mots-clés utiles au CRM, ex: 'local vide', 'vitrine refaite', 'bail 3-6-9'"]
}
Ne rajoute aucune information absente du texte d'origine.`;

export interface StructuredNote {
  summary: string;
  tags: string[];
}

export async function structureVoiceNote(raw: string): Promise<StructuredNote> {
  const ai = getAIClient();
  if (!ai) throw new Error("IA désactivée : configurez ANTHROPIC_API_KEY");

  const response = await ai.messages.create({
    model,
    max_tokens: 512,
    messages: [
      { role: "user", content: `${VOICE_CLEANUP_PROMPT}\n\nTranscription brute:\n"""${raw}"""` },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { summary: raw, tags: [] };
  try {
    const parsed = JSON.parse(jsonMatch[0]) as StructuredNote;
    return {
      summary: parsed.summary || raw,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    };
  } catch {
    return { summary: raw, tags: [] };
  }
}
