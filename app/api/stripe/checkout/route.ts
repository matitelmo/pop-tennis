import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCommunityBySlug } from "@/lib/community/context";
import { communityPath } from "@/lib/community/paths";
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

    const { plan, communitySlug } = (await request.json()) as {
      plan: "monthly" | "annual";
      communitySlug: string;
    };

    const community = await getCommunityBySlug(communitySlug);
    if (!community?.settings.requires_subscription) {
      return NextResponse.json({ error: "Community does not require subscription" }, { status: 400 });
    }

    const priceId =
      plan === "annual"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      return NextResponse.json({ error: "Price not configured" }, { status: 500 });
    }

    const admin = createServiceClient();
    const { data: member } = await admin
      .from("community_members")
      .select("stripe_customer_id")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .single();

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const stripe = getStripe();
    let customerId = member?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name,
        metadata: { supabase_user_id: user.id, community_id: community.id },
      });
      customerId = customer.id;
      await admin
        .from("community_members")
        .update({ stripe_customer_id: customerId })
        .eq("community_id", community.id)
        .eq("user_id", user.id);
    }

    const subscribePath = communityPath(communitySlug, "subscribe");

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getAppUrl()}${subscribePath}?success=1`,
      cancel_url: `${getAppUrl()}${subscribePath}?canceled=1`,
      metadata: {
        supabase_user_id: user.id,
        community_id: community.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
