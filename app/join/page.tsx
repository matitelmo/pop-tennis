import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted">
          <Trophy className="h-9 w-9 text-accent" />
        </div>
        <h1 className="mt-6 text-3xl font-black text-white">Venice Pop Tennis League</h1>
        <p className="mt-3 text-lg text-zinc-300">
          Track your rank. Log matches. Find partners.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Prove it at Venice Beach — official rankings for drop-in pop tennis.
        </p>

        <ul className="mt-8 space-y-3 text-left text-sm text-zinc-400">
          <li className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
            Men&apos;s &amp; Women&apos;s leaderboards
          </li>
          <li className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
            Confirmed match results — fair rankings
          </li>
          <li className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
            Weekly rival bonus · Find players with your schedule
          </li>
          <li className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
            <strong className="text-white">$10/mo</strong> or{" "}
            <strong className="text-white">$60/yr</strong> to log matches
          </li>
        </ul>

        <div className="mt-10 flex flex-col gap-3">
          <Link href="/register">
            <Button className="w-full" size="lg">
              Join the league — free signup
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="w-full" size="lg">
              I already have an account
            </Button>
          </Link>
          <Link href="/ranking" className="text-sm font-bold text-accent">
            Browse rankings →
          </Link>
        </div>
      </div>
    </div>
  );
}
