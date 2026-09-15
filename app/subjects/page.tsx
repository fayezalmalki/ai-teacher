import type { Metadata } from "next";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import SubjectCards from "@/components/SubjectCards";

export const metadata: Metadata = { title: "المواد" };

/** The library: every subject with its open lessons. Reachable from the header on every screen. */
export default function SubjectsPage() {
  return (
    <Frame>
      <AppHeader showChild showParent showSubjects={false} backHref="/home" />
      <div className="flex-1 flex flex-col gap-8 px-6 sm:px-10 pt-12 pb-16 max-w-[1040px] w-full mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[44px] font-bold m-0">المواد</h1>
          <p className="text-[17px] text-ink-2 m-0 max-w-[520px]">اختر مادة وجرّب أي درس مفتوح. كل درس 10 دقائق مع الأستاذ نواف، بالصوت أو بالقراءة.</p>
        </div>
        <SubjectCards progress />
        <Footer variant="slim" className="mt-auto" />
      </div>
    </Frame>
  );
}
