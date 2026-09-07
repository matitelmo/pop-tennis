import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";

function subscriptionStatusFromStripe(
  status: Stripe.Subscription.Status
): "active" | "past_due" | "canceled" {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  return "canceled";
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Webhook signature error:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createServiceClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;
    if (userId) {
      await admin
        .from("profiles")
        .update({ subscription_status: "active" })
        .eq("id", userId);
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (profile) {
      const status =
        event.type === "customer.subscription.deleted"
          ? "canceled"
          : subscriptionStatusFromStripe(subscription.status);

      await admin
        .from("profiles")
        .update({ subscription_status: status })
        .eq("id", profile.id);
    }
  }

  return NextResponse.json({ received: true });
}
