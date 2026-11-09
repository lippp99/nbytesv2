import Image from "next/image";
import monogram from "../../../../public/brand/nb-orange.png";
import { AdminLoginForm } from "./admin-login-form";
import { loginCopy } from "./login-copy";

/** Admin sign-in on the dashboard tokens (data-app), design B: brand mark above one centred card with a stepper. */
export function LoginView() {
  return (
    <main data-app className="flex min-h-dvh flex-1 items-center justify-center bg-app-page px-4 py-10 text-app-text">
      <div className="w-full max-w-130">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <Image src={monogram} alt="" sizes="28px" className="size-7" />
          <span className="text-app-body font-semibold text-app-text">{loginCopy.brand}</span>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
