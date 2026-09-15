import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import Teacher from "@/components/Teacher";
import { SketchButton, SketchCard, SketchLink } from "@/components/Sketch";

const CARDS: { title: string; body: string; tint: "blue" | "yellow" | "green" }[] = [
  { title: "يشرح", body: "بأمثلة من حياة الطفل: بيتزا، شوكولاتة، أشياء يعرفها.", tint: "blue" },
  { title: "يسمع", body: "الطفل يجيب بصوته، والمعلم يفهمه حتى لو كانت إجابته غير مرتّبة.", tint: "yellow" },
  { title: "يتكيّف", body: "ما فهم؟ يغيّر المثال. فهم بسرعة؟ يرفع المستوى.", tint: "green" },
];

export default function LandingPage() {
  return (
    <Frame>
      <AppHeader back={false} showParent />
      <div className="flex-1 flex flex-col gap-[72px] px-6 sm:px-10 pt-12 pb-20 max-w-[1040px] w-full mx-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-10 items-center">
          <div className="flex flex-col gap-6 items-start min-w-0">
            <h1 className="font-display text-[40px] sm:text-[52px] font-bold leading-[1.2] text-pretty-wrap m-0">
              معلم يشرح، يسمع، ويغيّر طريقته حسب طفلك.
            </h1>
            <p className="text-[18px] leading-[1.7] text-ink-2 max-w-[420px] m-0">درس قصير كل يوم مع الأستاذ نواف، وملخص لك بعده.</p>
            <div className="flex gap-3.5 flex-wrap mt-2">
              <SketchButton href="/onboarding" index={0}>
                ابدأ الإعداد
              </SketchButton>
              <SketchButton href="/profiles" variant="white" index={1}>
                أنا طالب
              </SketchButton>
            </div>
            <SketchLink href="/lesson/fractions/session">جرّب درس الكسور الآن ←</SketchLink>
          </div>
          <div className="grid place-items-center py-6">
            <div className="relative w-[260px] h-[260px] motion animate-float">
              <Teacher size={260} hero />
              <div className="absolute -right-5 sm:-right-[30px] top-5 px-3.5 py-2 ink-2 r-bubble-1 bg-surface text-[14px] font-semibold whitespace-nowrap motion animate-pop-in" style={{ animationDelay: ".3s" }}>
                خلنا نجربها بطريقة ثانية
              </div>
              <div className="absolute -left-4 sm:-left-6 bottom-[30px] px-3.5 py-2 ink-2 r-bubble-2 bg-yellow text-[14px] font-semibold whitespace-nowrap motion animate-pop-in" style={{ animationDelay: ".6s" }}>
                أنا أسمعك
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {CARDS.map((c, i) => (
            <SketchCard key={c.title} index={i} tint={c.tint} className="p-[26px] flex flex-col gap-2">
              <div className="font-display text-[26px] font-bold">{c.title}</div>
              <div className="text-[15px] leading-[1.65] text-ink-2">{c.body}</div>
            </SketchCard>
          ))}
        </div>

        <Footer variant="full" className="mt-2" />
      </div>
    </Frame>
  );
}
