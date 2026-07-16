import { NextResponse } from "next/server";
import { createLeadFeedbackReminders } from "@/features/leads/feedback-reminders";
import { createClientRenewalReminders } from "@/features/customers/renewal-reminders";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const [feedback, renewal] = await Promise.all([
    createLeadFeedbackReminders(),
    createClientRenewalReminders(),
  ]);
  return NextResponse.json({ success: true, feedback, renewal });
}
