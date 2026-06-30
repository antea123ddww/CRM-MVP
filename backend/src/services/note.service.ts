import { prisma } from "../lib/prisma";
import { RequestUser, tenantFilter } from "../lib/access";
import type { Prisma } from "@prisma/client";

type NoteInput = {
  content: string;
  companyId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
};

export async function getNotes(user?: RequestUser) {
  return prisma.note.findMany({
    where: tenantFilter<Prisma.NoteWhereInput>(user),
    include: {
      company: true,
      contact: true,
      lead: {
        include: {
          company: true,
        },
      },
      deal: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createNote(data: NoteInput, user?: RequestUser) {
  return prisma.note.create({
    data: {
      ...data,
      tenantId: user?.tenantId || undefined,
    },
  });
}

export async function updateNote(id: string, data: Pick<NoteInput, "content">) {
  return prisma.note.update({
    where: { id },
    data: {
      content: data.content,
    },
  });
}

export async function deleteNote(id: string) {
  return prisma.note.delete({
    where: { id },
  });
}
