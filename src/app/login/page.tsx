import { SignInPage } from "@/components/ui/sign-in-flow-1";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — LogStrata",
  description: "Sign in to your LogStrata developer console.",
};

export default function LoginPage() {
  return <SignInPage />;
}
