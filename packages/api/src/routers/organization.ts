import { createDb, institution, organization } from "@app/db";
import { eq } from "drizzle-orm";

import { publicProcedure, router } from "../index";

export const organizationRouter = router({
  list: publicProcedure.query(async () => {
    const db = createDb();
    const rows = await db
      .select({
        id: organization.id,
        name: organization.name,
        type: organization.type,
        category: organization.category,
        relevance: organization.relevance,
        website: organization.website,
        institutionId: organization.institutionId,
        institutionName: institution.name,
        institutionSlug: institution.slug,
        institutionType: institution.institutionType,
      })
      .from(organization)
      .innerJoin(institution, eq(organization.institutionId, institution.id))
      .orderBy(institution.name, organization.name);

    return rows;
  }),
});
