import test from "node:test";
import assert from "node:assert/strict";
import { buildAudienceWhere } from "../src/services/audienceService.js";

test("buildAudienceWhere arma filtros combinados", () => {
  const where = buildAudienceWhere("user_1", {
    groups: ["VIP"],
    tags: ["hot"],
    optInOnly: true,
    search: "ana",
  });

  assert.equal(where.userId, "user_1");
  assert.equal(where.optIn, true);
  assert.equal(where.AND.length, 3);
});
