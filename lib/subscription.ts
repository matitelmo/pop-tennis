import type { CommunityMember, SubscriptionStatus } from "@/types/database";
import type { CommunitySettings } from "@/lib/community/settings";

/** Set to true when Stripe subscription flows are ready to enforce. */
export const SUBSCRIPTION_GATES_ENABLED = false;

const ACTIVE_STATUSES: SubscriptionStatus[] = ["active", "comped"];

export function isSubscriptionRequired(settings: CommunitySettings): boolean {
  return SUBSCRIPTION_GATES_ENABLED && settings.requires_subscription;
}

export function hasActiveSubscription(
  member: Pick<CommunityMember, "subscription_status">
): boolean {
  if (!SUBSCRIPTION_GATES_ENABLED) return true;
  return ACTIVE_STATUSES.includes(member.subscription_status);
}

export function canUseCommunityFeatures(
  settings: CommunitySettings,
  member?: Pick<CommunityMember, "subscription_status"> | null
): boolean {
  if (!SUBSCRIPTION_GATES_ENABLED) return true;
  if (!isSubscriptionRequired(settings)) return true;
  return member ? hasActiveSubscription(member) : false;
}

export function isRatingFrozen(
  member: Pick<CommunityMember, "subscription_status">
): boolean {
  return member.subscription_status === "past_due" || member.subscription_status === "canceled";
}

export function subscriptionLabel(status: SubscriptionStatus): string {
  switch (status) {
    case "active":
      return "Activo";
    case "comped":
      return "Beta";
    case "past_due":
      return "Pago pendiente";
    case "canceled":
      return "Cancelado";
    default:
      return "Sin suscripción";
  }
}
