"use client";

import dynamic from "next/dynamic";

const LoginForm = dynamic(
  () => import("@/app/components/user/Login").then((mod) => mod.LoginForm),
  {
    ssr: false,
  },
);

export default function LoginPage() {
  return <LoginForm />;
}
