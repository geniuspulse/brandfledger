// FIXED v4: src/app/(auth)/login/page.tsx  
// Same fix: dynamic() with ssr:false prevents hydration remount that wiped controlled state
"use client";
import dynamic from "next/dynamic";

const LoginForm = dynamic(() => import("./_login-form"), { ssr: false });

export default function LoginPage() {
  return <LoginForm />;
}
