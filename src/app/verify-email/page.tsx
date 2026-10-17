import { EmailVerification } from "@/features/account/EmailVerification";
export const metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <EmailVerification />;
}
