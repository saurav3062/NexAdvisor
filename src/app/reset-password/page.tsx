import { PasswordRecovery } from "@/features/account/PasswordRecovery";
export const metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <PasswordRecovery reset />;
}
