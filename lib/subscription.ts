import type { CommunityMember, SubscriptionStatus } from "@/types/database";

const ACTIVE_STATUSES: SubscriptionStatus[] = ["active", "comped"];

export function hasActiveSubscription(
  member: Pick<CommunityMember, "subscription_status">
): boolean {
  return ACTIVE_STATUSES.includes(member.subscription_status);
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
