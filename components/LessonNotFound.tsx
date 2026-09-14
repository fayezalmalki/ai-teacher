import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/Button";

export default function LessonNotFound() {
  return (
    <Frame>
      <AppHeader showChild />
      <div className="flex-1 grid place-items-center px-8 py-12 text-center">
        <div className="flex flex-col items-center gap-5">
          <div className="text-[24px] font-semibold">هذا الدرس غير متاح بعد</div>
          <div className="text-[15px] text-muted">درس الكسور هو المتاح حاليًا.</div>
          <Button href="/home" variant="secondary" className="px-6 py-3.5 text-[16px]">
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </Frame>
  );
}
