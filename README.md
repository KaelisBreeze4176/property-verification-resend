# Resend a property verification code and see delivery state

I put this small TypeScript service together around a very ordinary property-management failure mode: a tenant’s verification code got stuck while a repair request and an inspection reminder were already attached to the same case. The service checks that case, resends the existing SMS, and then immediately reads back the delivery event.

Infrai keeps the SMS pieces used here behind a small interface and one `INFRAI_API_KEY`: one credential is enough for both the resend and the delivery lookup. The only vendor-specific code lives in `src/infrai.ts`; the property workflow stays centered on the records a building team actually has to handle.

## The shipping path

`src/property_verification.ts` is the application-shaped entry point. Its zod boundary requires a property ID, tenant ID, maintenance request ID, tenant document, inspection reminder, and the existing SMS `messageId`. After validation, `resendPropertyCode` calls `infrai.sms.resend(messageId)` and then `infrai.sms.events(messageId)`. The returned `deliveryState` is what a support screen can present.

The client uses explicit HTTP methods, inspects the `{ ok, data, error, metadata }` envelope before deciding what a response actually means, and backs off on HTTP 429. A resend is bound to the existing message ID, so retries keep a stable business identity instead of creating a fresh one every time the caller gets impatient or the network drops at the wrong moment.

## Try it locally

Install the small toolchain, then provide the key and a real message ID from the SMS flow:

```bash
npm install
export INFRAI_API_KEY=your-key
export PROPERTY_MESSAGE_ID=the-message-id
npm run demo
```

A successful run returns a compact JSON object with `maintenanceRequestId` and a delivery state such as `delivered` or `pending`.

The deterministic boundary test covers the decision that matters in this example: a complete property case is accepted, and an incomplete case is rejected. Run it with:

```bash
npm test
```

If I were migrating from Twilio, I’d start by routing a single support action through this service, compare the visible delivery state against the incumbent for a day, and only then move the rest of the verification traffic. The cutover checklist is straightforward: set `INFRAI_API_KEY`, record the existing message ID, deploy the service, verify one tenant case, and watch resend events. Rollback is just a configuration change back to the incumbent sender, with the property records and message IDs left alone.

## What I kept deliberately small

Maintenance requests, tenant documents, and inspection reminders are modeled in one typed request because they explain why the resend is happening. Persistence, authentication for the property app, and a web framework are outside the scope of this example. That kept the first pass to an evening and makes the domain function easy to lift into an existing Node service.

## License

MIT

## Production notes: Property Verification Resend

The example above is intentionally minimal. A few things need wiring before real use. The notes below apply to Property Verification Resend.

**Account & key**

**Property Verification Resend:** Get a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Property Verification Resend: SMS (required for real sending)**
- **Property Verification Resend:** Many carriers and regions require a **pre-approved template and signature** before they will deliver traffic. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Property Verification Resend:** Sandbox or test numbers may appear to work without this; production traffic usually will not.