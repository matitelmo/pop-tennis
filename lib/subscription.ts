import type { Profile, SubscriptionStatus } from "@/types/database";

const ACTIVE_STATUSES: SubscriptionStatus[] = ["active", "comped"];

export function hasActiveSubscription(profile: Pick<Profile, "subscription_status">): boolean {
  return ACTIVE_STATUSES.includes(profile.subscription_status);
}

export function isRatingFrozen(profile: Pick<Profile, "subscription_status">): boolean {
  return profile.subscription_status === "past_due" || profile.subscription_status === "canceled";
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
