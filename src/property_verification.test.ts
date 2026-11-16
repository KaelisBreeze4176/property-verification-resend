import { strict as assert } from "node:assert";
import { verificationRequest } from "./property_verification.ts";

const parsed = verificationRequest.safeParse({
  propertyId: "building-17",
  tenantId: "tenant-204",
  maintenanceRequestId: "repair-882",
  tenantDocument: "lease-204.pdf",
  inspectionReminder: "2026-11-08",
  messageId: "msg-42"
});

assert.equal(parsed.success, true);
assert.equal(verificationRequest.safeParse({ propertyId: "building-17" }).success, false);
console.log("property verification boundary: valid cases pass, incomplete cases are rejected");
