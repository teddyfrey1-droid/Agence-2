import { createContact, findContactByEmail } from "./contacts.repository";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";
import type { CreateContactInput, PublicContactFormInput } from "./contacts.schema";

export async function createNewContact(input: CreateContactInput) {
  return createContact(input);
}

/**
 * Handle public contact form submission.
 * Creates contact (with dedup), interaction, and follow-up task.
 */
export async function handlePublicContactForm(input: PublicContactFormInput) {
  return prisma.$transaction(async (tx) => {
    // Deduplicate: find existing contact by email
    let contact = await tx.contact.findFirst({
      where: { email: input.email },
    });

    if (!contact) {
      contact = await tx.contact.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone || null,
          company: input.company || null,
          type: "AUTRE",
          source: "SITE_WEB",
        },
      });
    }

    // Create interaction
    await tx.interaction.create({
      data: {
        type: "EMAIL_ENTRANT",
        subject: "Demande de contact via le site",
        content: input.message,
        contactId: contact.id,
      },
    });

    // Create follow-up task
    await tx.task.create({
      data: {
        title: `Rappeler ${contact.firstName} ${contact.lastName}`,
        description: `Contact reçu via le site web. Message: ${input.message}`,
        priority: "NORMALE",
        status: "A_FAIRE",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 day
        contactId: contact.id,
      },
    });

    return contact;
  });
}

/**
 * Handle public search request form.
 * Creates contact, search request, interaction, and follow-up task.
 */
export async function handlePublicSearchRequestForm(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  activity?: string;
  propertyTypes: string[];
  transactionType: string;
  budgetMin?: number;
  budgetMax?: number;
  surfaceMin?: number;
  surfaceMax?: number;
  districts: string[];
  description?: string;
}) {
  return prisma.$transaction(async (tx) => {
    // Deduplicate contact
    let contact = await tx.contact.findFirst({
      where: { email: input.email },
    });

    if (!contact) {
      contact = await tx.contact.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone || null,
          company: input.company || null,
          type: "ACQUEREUR",
          source: "SITE_WEB",
        },
      });
    }

    // Create search request
    const searchRequest = await tx.searchRequest.create({
      data: {
        reference: generateReference("DR"),
        status: "NOUVELLE",
        source: "SITE_WEB",
        contactId: contact.id,
        propertyTypes: input.propertyTypes as never[],
        transactionType: input.transactionType as never,
        budgetMin: input.budgetMin || null,
        budgetMax: input.budgetMax || null,
        surfaceMin: input.surfaceMin || null,
        surfaceMax: input.surfaceMax || null,
        districts: input.districts,
        activity: input.activity || null,
        description: input.description || null,
      },
    });

    // Create interaction
    await tx.interaction.create({
      data: {
        type: "EMAIL_ENTRANT",
        subject: "Nouvelle demande de recherche via le site",
        content: `Recherche: ${input.propertyTypes.join(", ")} — ${input.transactionType}`,
        contactId: contact.id,
        searchRequestId: searchRequest.id,
      },
    });

    // Create follow-up task
    await tx.task.create({
      data: {
        title: `Qualifier la demande de ${contact.firstName} ${contact.lastName}`,
        description: `Nouvelle demande de recherche (${searchRequest.reference}) reçue via le site.`,
        priority: "HAUTE",
        status: "A_FAIRE",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        contactId: contact.id,
        searchRequestId: searchRequest.id,
      },
    });

    return { contact, searchRequest };
  });
}

/**
 * Handle public property proposal form.
 * Creates contact, field spotting, interaction, and follow-up task.
 */
export async function handlePublicPropertyProposal(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  address: string;
  city?: string;
  propertyType?: string;
  surface?: number;
  transactionType?: string;
  price?: number;
  description?: string;
}) {
  return prisma.$transaction(async (tx) => {
    let contact = await tx.contact.findFirst({
      where: { email: input.email },
    });

    if (!contact) {
      contact = await tx.contact.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone || null,
          company: input.company || null,
          type: "PROPRIETAIRE",
          source: "SITE_WEB",
        },
      });
    }

    // Create field spotting as pre-property
    const spotting = await tx.fieldSpotting.create({
      data: {
        address: input.address,
        city: input.city || "Paris",
        status: "A_QUALIFIER",
        propertyType: (input.propertyType as never) || null,
        surface: input.surface || null,
        notes: input.description || null,
      },
    });

    // Interaction
    await tx.interaction.create({
      data: {
        type: "EMAIL_ENTRANT",
        subject: "Proposition de bien via le site",
        content: `Bien proposé: ${input.address}. ${input.description || ""}`,
        contactId: contact.id,
      },
    });

    // Task
    await tx.task.create({
      data: {
        title: `Évaluer le bien proposé par ${contact.firstName} ${contact.lastName}`,
        description: `Proposition: ${input.address}`,
        priority: "NORMALE",
        status: "A_FAIRE",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        contactId: contact.id,
      },
    });

    return { contact, spotting };
  });
}
