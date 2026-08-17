import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Folder } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function toFolder(folder: {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}): Folder {
  return {
    id: folder.id,
    name: folder.name,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { userId, error } = await requireUserId();
  if (error) {
    return error;
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Folder id is required." }, { status: 400 });
  }

  const folder = await prisma.folder.findFirst({
    where: { id, userId },
  });

  if (!folder) {
    return NextResponse.json({ error: "Folder not found." }, { status: 404 });
  }

  return NextResponse.json(toFolder(folder));
}

export async function PATCH(request: Request, context: RouteContext) {
  const { userId, error } = await requireUserId();
  if (error) {
    return error;
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Folder id is required." }, { status: 400 });
  }

  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const updated = await prisma.folder.updateMany({
    where: { id, userId },
    data: { name },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Folder not found." }, { status: 404 });
  }

  const folder = await prisma.folder.findFirst({
    where: { id, userId },
  });

  return NextResponse.json(toFolder(folder!));
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId, error } = await requireUserId();
  if (error) {
    return error;
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Folder id is required." }, { status: 400 });
  }

  const deleted = await prisma.folder.deleteMany({
    where: { id, userId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Folder not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
