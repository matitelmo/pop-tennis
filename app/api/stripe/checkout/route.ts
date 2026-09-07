import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getStripe, getAppUrl } from "@/lib/stripe/client";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = (await request.json()) as { plan: "monthly" | "annual" };
    const priceId =
      plan === "annual"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      return NextResponse.json({ error: "Price not configured" }, { status: 500 });
    }

    const admin = createServiceClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, full_name")
      .eq("id", user.id)
      .single();

    const stripe = getStripe();
    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getAppUrl()}/subscribe?success=1`,
      cancel_url: `${getAppUrl()}/subscribe?canceled=1`,
      metadata: { supabase_user_id: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
