import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_COMMUNITY_SLUG,
  isCommunitySlug,
  LEGACY_MAIN_PATHS,
} from "@/lib/community/paths";
import { isValidSlugFormat } from "@/lib/community/slug-format";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const segments = path.split("/").filter(Boolean);
  const firstSegment = segments[0] ?? "";

  const lastCommunity =
    request.cookies.get("last_community")?.value ?? DEFAULT_COMMUNITY_SLUG;
  const defaultCommunity = isCommunitySlug(lastCommunity)
    ? lastCommunity
    : DEFAULT_COMMUNITY_SLUG;

  if (LEGACY_MAIN_PATHS.includes(firstSegment as (typeof LEGACY_MAIN_PATHS)[number])) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultCommunity}/${firstSegment}${segments.length > 1 ? `/${segments.slice(1).join("/")}` : ""}`;
    return NextResponse.redirect(url);
  }

  if (path === "/join") {
    const url = request.nextUrl.clone();
    url.pathname = "/join/venice-beach";
    return NextResponse.redirect(url);
  }

  const isCommunityRoute = isValidSlugFormat(firstSegment);
  const communitySlug = isCommunityRoute ? firstSegment : null;
  const subPath = isCommunityRoute ? `/${segments.slice(1).join("/")}` : path;

  let communityValid = false;
  if (communitySlug) {
    const { data: communityRow } = await supabase
      .from("communities")
      .select("slug")
      .eq("slug", communitySlug)
      .maybeSingle();
    communityValid = Boolean(communityRow);
  }

  const isPublic =
    path.startsWith("/join") ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/communities") ||
    path.startsWith("/api/stripe/webhook") ||
    path.startsWith("/api/cron") ||
    (communitySlug && subPath.startsWith("/ranking"));

  const isAuthRoute = path.startsWith("/login") || path.startsWith("/register");
  const isProtected =
    subPath.startsWith("/partido") ||
    subPath.startsWith("/historial") ||
    subPath.startsWith("/reglas") ||
    subPath.startsWith("/perfil") ||
    subPath.startsWith("/subscribe") ||
    path.startsWith("/admin");

  if (communitySlug && !communityValid) {
    const url = request.nextUrl.clone();
    url.pathname = "/communities";
    return NextResponse.redirect(url);
  }

  if (communitySlug && communityValid) {
    supabaseResponse.cookies.set("last_community", communitySlug, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (communitySlug) {
      url.searchParams.set("community", communitySlug);
    }
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    const redirectCommunity =
      request.nextUrl.searchParams.get("community") ?? defaultCommunity;
    url.pathname = `/${redirectCommunity}/ranking`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (path === "/") {
    const url = request.nextUrl.clone();
    if (user) {
      url.pathname = `/${defaultCommunity}/ranking`;
    } else {
      url.pathname = "/communities";
    }
    return NextResponse.redirect(url);
  }

  if (!user && !isPublic && path !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
