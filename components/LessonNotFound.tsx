import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import { SketchButton } from "@/components/Sketch";

export default function LessonNotFound() {
  return (
    <Frame>
      <AppHeader showChild backHref="/home" />
      <div className="flex-1 grid place-items-center px-8 pt-10 pb-20 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="font-display text-[34px] font-bold">هذا الدرس غير متاح بعد</div>
          <div className="text-[16px] text-ink-2">الدروس المفتوحة كلها في صفحة المواد.</div>
          <SketchButton href="/subjects" variant="white" size="sm">
            المواد
          </SketchButton>
        </div>
      </div>
    </Frame>
  );
}
