import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/Button";

const CARDS = [
  { n: "١", tone: "bg-primary-tint text-primary", title: "يشرح", body: "بصوت هادئ وأمثلة من حياة الطفل: بيتزا، شوكولاتة، أشياء يعرفها." },
  { n: "٢", tone: "bg-success-tint text-success", title: "يسمع", body: "الطفل يجيب بصوته، والمعلم يفهم إجابته حتى لو كانت غير مرتّبة." },
  { n: "٣", tone: "bg-warning-tint text-warning", title: "يتكيّف", body: "لم يفهم؟ يغيّر المثال. فهم بسرعة؟ يرفع المستوى. وأنت تستلم ملخصًا واضحًا." },
];

const FLOW = ["يختار الطفل درس اليوم", "الأستاذ نواف يشرح", "أسئلة تتكيّف مع فهمه"];

export default function LandingPage() {
  return (
    <Frame>
      <AppHeader back={false} showParent />
      <div className="flex-1 flex flex-col gap-14 px-10 pt-14 pb-12">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-10 items-center">
          <div className="flex flex-col gap-[22px] items-start">
            <div className="text-[14px] text-primary font-semibold">لأطفال المرحلة الابتدائية</div>
            <h1 className="text-[40px] font-bold leading-[1.3] text-pretty-wrap m-0">
              معلم يشرح لطفلك، يسمعه، ويغيّر طريقته حسب فهمه.
            </h1>
            <p className="text-[18px] leading-[1.7] text-ink-2 text-pretty-wrap max-w-[460px] m-0">
              درس قصير كل يوم مع الأستاذ نواف. صوت، أمثلة بصرية، وملخص لك بعد كل جلسة.
            </p>
            <div className="flex gap-3 flex-wrap mt-1.5">
              <Button href="/onboarding" className="px-7 py-4 text-[17px]">
                ابدأ الإعداد
              </Button>
              <Button href="/profiles" variant="secondary" className="px-7 py-4 text-[17px]">
                ادخل كطالب
              </Button>
            </div>
            <Button href="/lesson/fractions/session" variant="link" className="text-[15px] gap-1.5">
              <span>جرّب درس الكسور مع الأستاذ نواف الآن</span>
              <span>←</span>
            </Button>
          </div>
          <div className="grid place-items-center">
            <div className="relative w-[260px] h-[260px] animate-float">
              <div className="absolute inset-0 rounded-full bg-primary-tint" />
              <div className="absolute inset-7 rounded-full bg-surface grid place-items-center text-[88px] font-bold text-primary shadow-character">
                ن
              </div>
              <div className="absolute -right-2 top-9 px-4 py-2.5 rounded-pill bg-surface shadow-pill text-[14px] font-medium animate-[fadeUp_.6s_ease_.2s_both]">
                خلنا نجربها بطريقة ثانية
              </div>
              <div className="absolute -left-4 bottom-11 px-4 py-2.5 rounded-pill bg-success-tint text-success text-[14px] font-medium animate-[fadeUp_.6s_ease_.5s_both]">
                أنا أسمعك
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {CARDS.map((c) => (
            <div key={c.title} className="rounded-card bg-surface-2 p-[26px] flex flex-col gap-2.5">
              <div className={"w-11 h-11 rounded-input grid place-items-center font-bold " + c.tone}>{c.n}</div>
              <div className="text-[20px] font-semibold">{c.title}</div>
              <div className="text-[15px] leading-[1.65] text-ink-2">{c.body}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[18px]">
          <div className="text-[14px] text-muted">كيف تسير الجلسة</div>
          <div className="flex gap-2.5 flex-wrap items-center">
            {FLOW.map((f) => (
              <div key={f} className="contents">
                <div className="px-[18px] py-3 rounded-pill border border-border-2 text-[15px]">{f}</div>
                <span className="text-arrow">←</span>
              </div>
            ))}
            <div className="px-[18px] py-3 rounded-pill bg-primary-tint text-primary text-[15px] font-medium">ملخص لولي الأمر</div>
          </div>
        </div>
      </div>
    </Frame>
  );
}
