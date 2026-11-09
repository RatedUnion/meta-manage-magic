import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { BUSINESS_PHONE, SUPPORT_NAME, callbackInput } from "./simone";

const valid = { contactName: "Customer", phoneNumber: "+1(868)763-1106", reason: "busy", message: "Call back", reminderAt: "2026-11-09T15:00:00Z" };
describe("Simone callback requirements", () => {
  test("uses the requested business contact", () => { assert.equal(BUSINESS_PHONE, "+18687631106"); });
  test("uses the requested support name", () => { assert.equal(SUPPORT_NAME, "Simone"); });
  test("logs a busy call with a normalized callback number", () => { assert.equal(callbackInput.parse(valid).phoneNumber, "+18687631106"); });
  test("accepts unanswered calls", () => { assert.equal(callbackInput.parse({ ...valid, reason: "no-answer" }).reason, "no-answer"); });
  test("accepts SMS callback notes", () => { assert.equal(callbackInput.parse({ ...valid, reason: "sms" }).reason, "sms"); });
  test("rejects other callback reasons", () => { assert.equal(callbackInput.safeParse({ ...valid, reason: "completed" }).success, false); });
  test("rejects invalid phone numbers", () => { assert.equal(callbackInput.safeParse({ ...valid, phoneNumber: "123" }).success, false); });
});