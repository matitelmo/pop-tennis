import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    resend = new Resend(key);
  }
  return resend;
}

function fromAddress(): string {
  return process.env.EMAIL_FROM ?? "Pop Tennis <onboarding@resend.dev>";
}

function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await getResend().emails.send({
      from: fromAddress(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Email failed" };
  }
}

export async function sendMatchConfirmRequest(params: {
  toEmail: string;
  toName: string;
  submitterName: string;
  scoreSummary: string;
  communitySlug?: string;
}): Promise<void> {
  const partidoPath = params.communitySlug
    ? `/${params.communitySlug}/partido`
    : "/partido";
  await sendEmail({
    to: params.toEmail,
    subject: `${params.submitterName} cargó un partido — confirmá el resultado`,
    html: `
      <p>Hola ${params.toName},</p>
      <p><strong>${params.submitterName}</strong> cargó un partido:</p>
      <p>${params.scoreSummary}</p>
      <p><a href="${appUrl(partidoPath)}">Confirmar o disputar en la app</a></p>
      <p>Si no respondés en 24 horas, el resultado se confirma automáticamente.</p>
    `,
  });
}

export async function sendMatchReminder(params: {
  toEmail: string;
  toName: string;
  submitterName: string;
}): Promise<void> {
  await sendEmail({
    to: params.toEmail,
    subject: `Recordatorio: confirmá el partido vs ${params.submitterName}`,
    html: `
      <p>Hola ${params.toName},</p>
      <p>Quedan pocas horas para confirmar el partido que cargó <strong>${params.submitterName}</strong>.</p>
      <p><a href="${appUrl("/partido")}">Ir a confirmar</a></p>
    `,
  });
}

export async function sendChallengeEmail(params: {
  toEmail: string;
  toName: string;
  fromName: string;
  communitySlug?: string;
}): Promise<void> {
  const rankingPath = params.communitySlug
    ? `/${params.communitySlug}/ranking`
    : "/ranking";
  await sendEmail({
    to: params.toEmail,
    subject: `${params.fromName} te desafió`,
    html: `
      <p>Hola ${params.toName},</p>
      <p><strong>${params.fromName}</strong> quiere jugar contra vos.</p>
      <p><a href="${appUrl(rankingPath)}">Ver ranking y responder</a></p>
    `,
  });
}

export async function sendDisputeToAdmin(params: {
  adminEmail: string;
  matchId: string;
  submitterName: string;
  disputerName: string;
}): Promise<void> {
  await sendEmail({
    to: params.adminEmail,
    subject: `Disputa de partido — ${params.submitterName} vs ${params.disputerName}`,
    html: `
      <p>Se abrió una disputa en Fence.</p>
      <p>Partido: ${params.matchId}</p>
      <p>Cargado por: ${params.submitterName}</p>
      <p>Disputado por: ${params.disputerName}</p>
      <p><a href="${appUrl("/admin/disputes")}">Resolver disputa</a></p>
    `,
  });
}
