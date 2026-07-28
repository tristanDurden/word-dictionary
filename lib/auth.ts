import { NextResponse } from "next/server";

import { auth } from "@/auth";

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Sign in required." }, { status: 401 }),
    };
  }

  return { userId, error: null };
}
