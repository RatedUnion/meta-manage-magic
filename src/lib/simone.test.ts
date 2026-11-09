import { describe, expect, test } from "bun:test";
import { BUSINESS_PHONE, SUPPORT_NAME, callbackInput } from "./simone";

const valid = { contactName: "Customer", phoneNumber: "+1(868)763-1106", reason: "busy", message: "Call back", reminderAt: "2026-11-09T15:00:00Z" };
describe("Simone callback requirements", () => {
  test("uses the requested business contact", () => { expect(BUSINESS_PHONE).toBe("+18687631106"); });
  test("uses the requested support name", () => { expect(SUPPORT_NAME).toBe("Simone"); });
  test("logs a busy call with a normalized callback number", () => { expect(callbackInput.parse(valid).phoneNumber).toBe("+18687631106"); });
  test("accepts unanswered calls", () => { expect(callbackInput.parse({ ...valid, reason: "no-answer" }).reason).toBe("no-answer"); });
  test("accepts SMS callback notes", () => { expect(callbackInput.parse({ ...valid, reason: "sms" }).reason).toBe("sms"); });
  test("rejects other callback reasons", () => { expect(callbackInput.safeParse({ ...valid, reason: "completed" }).success).toBe(false); });
  test("rejects invalid phone numbers", () => { expect(callbackInput.safeParse({ ...valid, phoneNumber: "123" }).success).toBe(false); });
});