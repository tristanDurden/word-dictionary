import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Folder } from "@/lib/types";

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

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) {
    return error;
  }

  const folders = await prisma.folder.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(folders.map(toFolder));
}

export async function POST(request: Request) {
  const { userId, error } = await requireUserId();
  if (error) {
    return error;
  }

  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const folder = await prisma.folder.create({
    data: { name, userId },
  });

  return NextResponse.json(toFolder(folder), { status: 201 });
}
