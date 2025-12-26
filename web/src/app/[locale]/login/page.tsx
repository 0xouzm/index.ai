import { redirect } from "next/navigation";

export const runtime = "edge";

interface LoginRedirectProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginRedirect({ params }: LoginRedirectProps) {
  const { locale } = await params;
  redirect(`/${locale}/auth`);
}
