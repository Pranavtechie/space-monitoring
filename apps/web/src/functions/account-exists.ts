import { createDb } from "@app/db";
import { user } from "@app/db/schema/auth";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

const accountExistsInput = z.object({
  email: z.email(),
});

export const accountExists = createServerFn({ method: "POST" })
  .inputValidator((input) => accountExistsInput.parse(input))
  .handler(async ({ data }) => {
    const db = createDb();
    const existingUser = await db.query.user.findFirst({
      columns: {
        id: true,
      },
      where: eq(user.email, data.email.toLowerCase()),
    });

    return Boolean(existingUser);
  });
