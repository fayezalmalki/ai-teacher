"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import { Keypad, PinDots } from "@/components/Keypad";
import { PIN_ADVANCE_MS } from "@/lib/lesson-engine/timing";
import { unlockParent } from "@/lib/store/parent-gate";
import { useAppStore } from "@/lib/store/app-store";

export default function ParentPinPage() {
  const router = useRouter();
  const { state } = useAppStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onKey = (k: string) => {
    if (k === "⌫") {
      setPin((p) => p.slice(0, -1));
      setError(false);
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      timer.current = setTimeout(() => {
        if (next === state.pin) {
          unlockParent();
          router.push("/parent");
        } else {
          setPin("");
          setError(true);
        }
      }, PIN_ADVANCE_MS);
    }
  };

  const hint = error
    ? "الرمز غير صحيح، حاول مرة ثانية."
    : state.onboarded
      ? "أدخل رمز ولي الأمر"
      : "أدخل رمز ولي الأمر (في النموذج: ١٢٣٤)";

  return (
    <Frame>
      <AppHeader />
      <div className="flex-1 grid place-items-center px-6 sm:px-8 pt-10 pb-20">
        <div className="flex flex-col gap-[26px] items-center text-center">
          <h1 className="font-display text-[38px] font-bold m-0">ولي الأمر</h1>
          <div className={"text-[15px] " + (error ? "text-error" : "text-ink-2")}>{hint}</div>
          <PinDots length={pin.length} error={error} />
          <Keypad onKey={onKey} />
        </div>
      </div>
    </Frame>
  );
}
