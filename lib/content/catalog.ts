/** Static library content: subjects, the lesson paths (built lessons carry a lessonId; the rest are placeholders), and copy. */

export const TEACHER = "الأستاذ نواف";
export const APP_NAME = "المعلم الذكي";

export const GRADES = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];
export const AGES = [6, 7, 8, 9, 10, 11, 12];

export function gradeLabel(grade: number): string {
  return "الصف " + (GRADES[grade - 1] ?? GRADES[0]) + " الابتدائي";
}

export type Tone = "blue" | "green" | "amber" | "neutral";

export interface Subject {
  id: string;
  name: string;
  glyph: string;
  tone: Tone;
  /** One line under the name on the subject cards. */
  blurb: string;
}

export const SUBJECTS: Subject[] = [
  { id: "math", name: "الرياضيات", glyph: "٪", tone: "blue", blurb: "أعداد، كسور، جمع وطرح، وقياس بأمثلة من البيت." },
  { id: "ar", name: "لغتي", glyph: "ل", tone: "green", blurb: "حروف وحركات وجمل، نقرأها ونسمعها مع بعض." },
  { id: "sci", name: "العلوم", glyph: "ع", tone: "amber", blurb: "الماء والحواس والنبات: نشوف ونجرب ونفهم." },
  { id: "isl", name: "الدراسات الإسلامية", glyph: "د", tone: "neutral", blurb: "أركان وآداب وسور قصيرة بأسلوب بسيط." },
];

/** done = finished by this child; today = the home's lesson; next = built and open; later = not built yet. */
export type LessonStatus = "done" | "today" | "next" | "later";

export interface LessonEntry {
  /** Set only for lessons that exist in the lesson engine. */
  lessonId?: string;
  title: string;
  meta: string;
  status: LessonStatus;
}

/** Lesson paths per subject. Entries without a lessonId are planned lessons and show as "قريبًا". */
export const LESSONS: Record<string, LessonEntry[]> = {
  math: [
    { lessonId: "fractions", title: "الكسور", meta: "النصف والربع · 10 دقائق", status: "next" },
    { lessonId: "addsub", title: "الجمع والطرح", meta: "الآحاد والعشرات · 10 دقائق", status: "next" },
    { lessonId: "measure", title: "القياس", meta: "الطول والوزن · 10 دقائق", status: "next" },
    { title: "الأعداد حتى 1000", meta: "الآحاد والعشرات والمئات", status: "later" },
    { title: "الأشكال الهندسية", meta: "المضلعات", status: "later" },
  ],
  ar: [
    { lessonId: "tanween", title: "التنوين", meta: "فتح وضم وكسر · 10 دقائق", status: "next" },
    { title: "أنواع الجمل", meta: "الاسمية والفعلية", status: "later" },
    { title: "الهمزة المتوسطة", meta: "", status: "later" },
    { title: "الأفعال", meta: "", status: "later" },
    { title: "القراءة الجهرية", meta: "", status: "later" },
  ],
  sci: [
    { lessonId: "water", title: "دورة الماء", meta: "من البحر للسحاب · 10 دقائق", status: "next" },
    { lessonId: "senses", title: "الحواس الخمس", meta: "نشوف ونسمع ونلمس · 10 دقائق", status: "next" },
    { title: "النبات وأجزاؤه", meta: "", status: "later" },
    { title: "الحيوانات وبيئاتها", meta: "", status: "later" },
    { title: "المادة وحالاتها", meta: "", status: "later" },
  ],
  isl: [
    { lessonId: "pillars", title: "أركان الإسلام", meta: "الخمسة بالترتيب · 10 دقائق", status: "next" },
    { title: "الوضوء", meta: "", status: "later" },
    { title: "سور قصيرة", meta: "", status: "later" },
    { title: "آداب الطعام", meta: "", status: "later" },
    { title: "الصدق", meta: "", status: "later" },
  ],
};

export const TOAST_DONE = "راجعنا هذا الدرس سابقًا. الملخص عند ولي الأمر.";
export const TOAST_LOCKED = "هذا الدرس قيد الإعداد. جرّب الدروس المفتوحة في نفس المادة.";

export const TODAY_LESSON = {
  lessonId: "fractions",
  subjectId: "math",
  eyebrow: "درس اليوم · الرياضيات",
  title: "الكسور",
  meta: "النصف والربع وثلاثة الأرباع · 10 دقائق",
  cta: "ابدأ مع الأستاذ نواف",
};

export const HOME_TODAY_LINE = "عندك درس واحد اليوم، 10 دقائق مع الأستاذ نواف.";

export const PARENT_WEEK = {
  eyebrow: "هذا الأسبوع",
  recommendations: [
    "مراجعة قصيرة للربع خلال الأسبوع القادم بمثال مختلف.",
    "درس القياس هو الخطوة الطبيعية بعد الكسور.",
    "{name} يجيب بثقة أكثر بالصوت من الاختيار، شجّعوه يتكلم.",
  ],
  durations: [10, 15, 20],
  reminderTime: "الساعة 5:00 مساءً",
};
