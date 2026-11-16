import { z } from "zod";
import { infrai } from "./infrai.ts";

export const verificationRequest = z.object({
  propertyId: z.string().min(1),
  tenantId: z.string().min(1),
  maintenanceRequestId: z.string().min(1),
  tenantDocument: z.string().min(1),
  inspectionReminder: z.string().min(1),
  messageId: z.string().min(1)
});

export type VerificationRequest = z.infer<typeof verificationRequest>;

export type PropertyCase = VerificationRequest & { deliveryState: string };

export async function resendPropertyCode(input: unknown): Promise<PropertyCase> {
  const request = verificationRequest.parse(input);
  await infrai.sms.resend(request.messageId);
  const events = await infrai.sms.events(request.messageId) as { status?: string };
  return { ...request, deliveryState: events.status ?? "pending" };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const messageId = process.env.PROPERTY_MESSAGE_ID;
  if (!messageId) throw new Error("PROPERTY_MESSAGE_ID is required");
  const result = await resendPropertyCode({
    propertyId: "building-17",
    tenantId: "tenant-204",
    maintenanceRequestId: "repair-882",
    tenantDocument: "lease-204.pdf",
    inspectionReminder: "2026-11-08",
    messageId
  });
  console.log(JSON.stringify({ maintenanceRequestId: result.maintenanceRequestId, deliveryState: result.deliveryState }, null, 2));
}
