# Simone call and SMS callback support

Business contact: **+1 (868) 763-1106**. Support identity: **Simone**.

## Available now

The `/voice-sms` page saves manual busy-call, unanswered-call and received-SMS notes as callback reminders. Authorized administrators can mark handled or reopen. Affiliate preview hides editing. Reminders persist in Lovable Cloud; the page loads the next 200 ordered by reminder time. Reminder times are displayed in the viewer's local time. This is an on-screen queue, not automatic notifications.

## Not activated

The Twilio connection was declined. No phone call is placed, SMS sent, or real AI conversation performed. The existing mobile number is a business contact, **not proof of a Twilio-provisioned number**. Do not label it as a live AI line. No satellite uplink is provided by this change.

To activate automatic busy/unanswered-call handling:
1. Connect a Twilio account and obtain a voice/SMS-enabled number with supported regional capabilities. Verify pricing and forwarding support with both providers.
2. Arrange conditional busy/no-answer forwarding on the existing mobile number to the Twilio number. Ordinary voice forwarding does not forward SMS; receiving texts on the original number requires explicit provider support or a supported port.
3. Implement provider-signature-verified TanStack public webhooks, using the Twilio account Auth Token for signature verification. Add unique provider event IDs for idempotent callback writes. Never accept unsigned events.
4. Return Simone's disclosed automated greeting, collect callback information, and persist inbound messages. Add a speech/conversational provider only when genuine AI voice answering is required; a static greeting is not conversational AI.
5. Configure status callbacks and verify an actual busy call, unanswered call and inbound SMS end to end before marking active. Provider acceptance is not delivery confirmation.
6. Before production SMS, enable Twilio SMS Pumping Protection and review SMS Geo Permissions. Recording needs notice/consent and private storage.

## GitHub

These are project TypeScript changes. Lovable Git sync, if already connected, manages syncing to the selected repository branch. This work does not establish or verify that connection and does not issue manual commits. Publish after reviewing the changes to update the public site.