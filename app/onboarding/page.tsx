"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import ProgressBars from "@/components/ProgressBars";
import { Keypad, PinDots } from "@/components/Keypad";
import { SketchButton, SketchChip } from "@/components/Sketch";
import { AGES, GRADES } from "@/lib/content/catalog";
import { toArabicDigits } from "@/lib/format";
import { PIN_ADVANCE_MS } from "@/lib/lesson-engine/timing";
import { PARENT_UNLOCK_KEY } from "@/lib/store/parent-gate";
import { DEMO_CHILD } from "@/lib/store/state";
import { useAppStore } from "@/lib/store/app-store";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<Frame>{null}</Frame>}>
      <Onboarding />
    </Suspense>
  );
}

/**
 * Three flows share this screen:
 * - first run: rename the demo child, set the PIN, done (3 steps);
 * - add a child (?new=1, or any later visit): who + done, the PIN already exists;
 * - edit a child (?child=id, from the parent area): who, then back to the parent area.
 */
function Onboarding() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, hydrated, child, setChild, addChild, updateChild, setActiveChild, setPin, setOnboarded } = useAppStore();
  const editId = params.get("child");
  const editing = editId ? state.children.find((c) => c.id === editId) : undefined;
  const firstRun = !state.onboarded && !editId && !params.get("new");
  const needsPin = firstRun;
  const totalSteps = needsPin ? 3 : 2;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  // The form rests empty; a profile being edited (or the first-run demo child) is prefilled.
  const [name, setName] = useState("");
  const [age, setAge] = useState(DEMO_CHILD.age);
  const [grade, setGrade] = useState(DEMO_CHILD.grade);
  const [pin, setPinDraft] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    const src = editing ?? (firstRun ? child : undefined);
    if (src) {
      setName(src.name);
      setAge(src.age);
      setGrade(src.grade);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const canContinue = name.trim().length > 0;
  const next1 = () => {
    if (!canContinue) return;
    const profile = { name: name.trim(), age, grade };
    if (editing) {
      updateChild(editing.id, profile);
      router.push("/parent");
      return;
    }
    if (firstRun) setChild(profile);
    else {
      const id = addChild(profile);
      setActiveChild(id);
    }
    setPinDraft("");
    setStep(needsPin ? 2 : 3);
  };
  const stepBack = () => {
    if (timer.current) clearTimeout(timer.current);
    setPinDraft("");
    setStep((s) => (s === 3 && needsPin ? 2 : 1));
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

  const displayName = name.trim() || child.name;
  const filled = step === 1 ? 1 : step === 2 ? 2 : totalSteps;

  return (
    <Frame>
      <AppHeader onBack={step > 1 ? stepBack : undefined} backHref={editing ? "/parent" : "/"} />
      <div className="flex-1 grid place-items-center px-6 sm:px-8 pt-10 pb-20">
        <div className="w-full max-w-[480px] min-w-0 flex flex-col gap-8">
          <ProgressBars total={totalSteps} filled={filled} />

          {step === 1 && (
            <div className="flex flex-col gap-[26px] min-w-0 motion animate-fade-up-fast">
              <h1 className="font-display text-[38px] font-bold m-0">{editing ? "تعديل الطالب" : "من الطالب؟"}</h1>
              <input
                id="child-name"
                aria-label="اسم الطفل"
                value={name}
                placeholder="اكتب اسم طفلك"
                onChange={(e) => setName(e.target.value)}
                className="w-full min-w-0 px-5 py-4 r-input ink bg-surface font-display font-semibold text-[22px] outline-none placeholder:text-faint placeholder:font-normal focus:shadow-[4px_4px_0_var(--color-primary-tint)]"
              />
              <div className="flex flex-col gap-2.5">
                <div className="text-[14px] text-muted">العمر</div>
                <div className="flex gap-2 flex-wrap">
                  {AGES.map((v) => (
                    <SketchChip key={v} selected={age === v} onClick={() => setAge(v)} className="w-[50px] font-display text-[18px] font-bold">
                      {toArabicDigits(v)}
                    </SketchChip>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="text-[14px] text-muted">الصف</div>
                <div className="flex gap-2 flex-wrap">
                  {GRADES.map((g, i) => (
                    <SketchChip key={g} selected={grade === i + 1} onClick={() => setGrade(i + 1)} className="px-4 text-[15px]">
                      {g}
                    </SketchChip>
                  ))}
                </div>
              </div>
              <SketchButton onClick={next1} disabled={!canContinue} className="self-start">
                {editing ? "حفظ" : "التالي"}
              </SketchButton>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-[26px] items-center text-center motion animate-fade-up-fast">
              <div>
                <h1 className="font-display text-[38px] font-bold m-0">رمز ولي الأمر</h1>
                <div className="text-[15px] text-ink-2 mt-1.5">٤ أرقام لملخصات {displayName} والإعدادات.</div>
              </div>
              <PinDots length={pin.length} />
              <Keypad onKey={onKey} />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-[26px] items-center text-center motion animate-fade-up-fast">
              <div className="w-24 h-24 r-dot ink bg-yellow grid place-items-center text-[40px] motion animate-pop-in">★</div>
              <h1 className="font-display text-[38px] font-bold m-0">جاهز!</h1>
              <p className="text-[18px] leading-[1.7] text-ink-2 m-0 text-pretty-wrap">
                سلّم الجهاز لـ{displayName}. الأستاذ نواف يبدأ بدرس قصير، ويوصلك الملخص بعده.
              </p>
              <div className="flex gap-3.5 flex-wrap justify-center">
                <SketchButton href="/home" index={0}>
                  ابدأ كطالب
                </SketchButton>
                <SketchButton variant="white" index={1} onClick={goParent}>
                  منطقة ولي الأمر
                </SketchButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </Frame>
  );
}
