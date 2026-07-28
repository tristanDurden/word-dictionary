import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId, error } = await requireUserId();
  if (error) {
    return error;
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing word id." }, { status: 400 });
  }

  const deleted = await prisma.wordEntry.deleteMany({
    where: { id, userId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Word entry not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
