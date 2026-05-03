import test from "node:test";
import assert from "node:assert/strict";
import { previewImportRows } from "../src/services/importService.js";

test("previewImportRows detecta invalidos y validos", () => {
  const rows = [
    { name: "Ana", phone: "11 1234 5678", group: "Clientes" },
    { name: "", phone: "123", group: "Clientes" },
  ];
  const result = previewImportRows(rows);

  assert.equal(result.totalRows, 2);
  assert.equal(result.validRows, 1);
  assert.equal(result.invalidRows, 1);
  assert.equal(result.preview.length, 2);
});
