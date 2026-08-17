import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SavedWord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { userId, error } = await requireUserId();
  if (error) {
    return error;
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing word id." }, { status: 400 });
  }

  const body = (await request.json()) as {
    folderId?: string | null;
    isFinished?: boolean;
  };

  const hasFolderId = Object.prototype.hasOwnProperty.call(body, "folderId");
  const hasFinished = Object.prototype.hasOwnProperty.call(body, "isFinished");

  if (!hasFolderId && !hasFinished) {
    return NextResponse.json(
      { error: "folderId or isFinished is required." },
      { status: 400 },
    );
  }

  const data: { folderId?: string | null; isFinished?: boolean } = {};

  if (hasFinished) {
    data.isFinished = Boolean(body.isFinished);
  }

  if (hasFolderId) {
    const folderId = body.folderId ?? null;

    if (folderId === "finished") {
      data.isFinished = true;
    } else {
      if (folderId !== null) {
        const folder = await prisma.folder.findFirst({
          where: { id: folderId, userId },
          select: { id: true },
        });

        if (!folder) {
          return NextResponse.json(
            { error: "Folder not found." },
            { status: 404 },
          );
        }
      }

      data.folderId = folderId;
      if (!hasFinished) {
        data.isFinished = false;
      }
    }
  }

  const updated = await prisma.wordEntry.updateMany({
    where: { id, userId },
    data,
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Word entry not found." }, { status: 404 });
  }

  const entry = await prisma.wordEntry.findFirst({
    where: { id, userId },
  });

  if (!entry) {
    return NextResponse.json({ error: "Word entry not found." }, { status: 404 });
  }

  const response: SavedWord = {
    ...entry,
    createdAt: entry.createdAt.toISOString(),
  };

  return NextResponse.json(response);
}

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
