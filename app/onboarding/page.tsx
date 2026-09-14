"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/Button";
import ProgressBars from "@/components/ProgressBars";
import { Keypad, PinDots } from "@/components/Keypad";
import { AGES, GRADES } from "@/lib/content/catalog";
import { PIN_ADVANCE_MS } from "@/lib/lesson-engine/timing";
import { PARENT_UNLOCK_KEY } from "@/lib/store/parent-gate";
import { useAppStore } from "@/lib/store/app-store";

function chip(on: boolean) {
  return on ? "border-primary bg-primary-tint text-primary" : "border-border-2 bg-surface text-ink";
}

export default function OnboardingPage() {
  const router = useRouter();
  const { state, hydrated, setChild, setPin, setOnboarded } = useAppStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(state.child.name);
  const [age, setAge] = useState(state.child.age);
  const [grade, setGrade] = useState(state.child.grade);
  const [pin, setPinDraft] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hydrated) {
      setName(state.child.name);
      setAge(state.child.age);
      setGrade(state.child.grade);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const next1 = () => {
    setChild({ name: name.trim() || "سلمان", age, grade });
    setPinDraft("");
    setStep(2);
  };

  const onKey = (k: string) => {
    if (k === "⌫") {
      setPinDraft((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const nextPin = pin + k;
    setPinDraft(nextPin);
    if (nextPin.length === 4) {
      timer.current = setTimeout(() => {
        setPin(nextPin);
        setOnboarded(true);
        setStep(3);
      }, PIN_ADVANCE_MS);
    }
  };

  const goParent = () => {
    try {
      window.sessionStorage.setItem(PARENT_UNLOCK_KEY, "1");
    } catch {}
    router.push("/parent");
  };

  const displayName = name.trim() || "سلمان";

  return (
    <Frame>
      <AppHeader />
      <div className="flex-1 grid place-items-center px-8 py-12">
        <div className="w-full max-w-[520px] flex flex-col gap-7">
          <ProgressBars total={3} filled={step} />

          {step === 1 && (
            <div className="flex flex-col gap-6 animate-[fadeUp_.35s_ease]">
              <div>
                <div className="text-[14px] text-muted">إعداد ولي الأمر · 1 من 3</div>
                <h1 className="text-[30px] font-bold mt-1.5 m-0">من الطالب؟</h1>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="child-name" className="text-[14px] text-ink-2">
                  اسم الطفل
                </label>
                <input
                  id="child-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-[18px] py-4 rounded-input border-2 border-border-2 text-[20px] outline-none bg-surface focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[14px] text-ink-2">العمر</div>
                <div className="flex gap-2 flex-wrap">
                  {AGES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAge(v)}
                      className={"w-[52px] h-12 rounded-chip border-2 text-[17px] font-semibold " + chip(age === v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[14px] text-ink-2">الصف</div>
                <div className="flex gap-2 flex-wrap">
                  {GRADES.map((g, i) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGrade(i + 1)}
                      className={"px-4 h-12 rounded-chip border-2 text-[15px] font-semibold " + chip(grade === i + 1)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={next1} className="self-start px-7 py-4 text-[17px] shadow-none">
                التالي
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6 items-center animate-[fadeUp_.35s_ease]">
              <div className="text-center">
                <div className="text-[14px] text-muted">إعداد ولي الأمر · 2 من 3</div>
                <h1 className="text-[30px] font-bold mt-1.5 m-0">اختر رمزًا لولي الأمر</h1>
                <div className="text-[15px] text-ink-2 mt-2">4 أرقام. تستخدمه للوصول إلى ملخصات {displayName} والإعدادات.</div>
              </div>
              <PinDots length={pin.length} />
              <Keypad onKey={onKey} />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6 items-center text-center animate-[fadeUp_.35s_ease]">
              <div className="w-24 h-24 rounded-full bg-success-tint text-success grid place-items-center text-[40px]">✓</div>
              <div>
                <h1 className="text-[30px] font-bold m-0">جاهز!</h1>
                <p className="text-[18px] leading-[1.7] text-ink-2 mt-2 m-0 text-pretty-wrap">
                  سلّم الجهاز لـ{displayName}. الأستاذ نواف بيبدأ بدرس قصير في الرياضيات، وبيوصلك ملخص بعدها.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <Button href="/home" className="px-7 py-4 text-[17px] shadow-none">
                  ابدأ كطالب
                </Button>
                <Button variant="secondary" onClick={goParent} className="px-7 py-4 text-[17px]">
                  عرض منطقة ولي الأمر
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Frame>
  );
}
