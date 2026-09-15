/** Static library content for the MVP. Only the fractions lesson is live. */

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
  pct: number;
  meta: string;
}

export const SUBJECTS: Subject[] = [
  { id: "math", name: "الرياضيات", glyph: "٪", tone: "blue", pct: 55, meta: "3 من 5 دروس" },
  { id: "ar", name: "لغتي", glyph: "ل", tone: "green", pct: 40, meta: "2 من 5 دروس" },
  { id: "sci", name: "العلوم", glyph: "ع", tone: "amber", pct: 20, meta: "1 من 5 دروس" },
  { id: "isl", name: "الدراسات الإسلامية", glyph: "د", tone: "neutral", pct: 0, meta: "لم تبدأ" },
];

export type LessonStatus = "done" | "today" | "next" | "later";

export interface LessonEntry {
  /** Set only for lessons that exist in the lesson engine. */
  lessonId?: string;
  title: string;
  meta: string;
  status: LessonStatus;
}

export const LESSONS: Record<string, LessonEntry[]> = {
  math: [
    { title: "الأعداد حتى 1000", meta: "8 دقائق", status: "done" },
    { lessonId: "addsub", title: "الجمع والطرح", meta: "الآحاد والعشرات · 10 دقائق", status: "next" },
    { lessonId: "fractions", title: "الكسور", meta: "النصف والربع · 10 دقائق", status: "today" },
    { lessonId: "measure", title: "القياس", meta: "الطول والوزن · 10 دقائق", status: "next" },
    { title: "الأشكال الهندسية", meta: "المضلعات", status: "later" },
  ],
  ar: [
    { title: "الهمزة المتوسطة", meta: "8 دقائق", status: "done" },
    { title: "أنواع الجمل", meta: "9 دقائق", status: "done" },
    { title: "التنوين", meta: "10 دقائق", status: "next" },
    { title: "الأفعال", meta: "", status: "later" },
    { title: "القراءة الجهرية", meta: "", status: "later" },
  ],
  sci: [
    { title: "النبات وأجزاؤه", meta: "8 دقائق", status: "done" },
    { lessonId: "water", title: "دورة الماء", meta: "من البحر للسحاب · 10 دقائق", status: "next" },
    { title: "الحيوانات وبيئاتها", meta: "", status: "later" },
    { title: "المادة وحالاتها", meta: "", status: "later" },
    { title: "الحواس الخمس", meta: "", status: "later" },
  ],
  isl: [
    { title: "أركان الإسلام", meta: "8 دقائق", status: "next" },
    { title: "الوضوء", meta: "", status: "later" },
    { title: "سور قصيرة", meta: "", status: "later" },
    { title: "آداب الطعام", meta: "", status: "later" },
    { title: "الصدق", meta: "", status: "later" },
  ],
};

export const TOAST_DONE = "راجعنا هذا الدرس سابقًا. الملخص عند ولي الأمر.";
export const TOAST_LOCKED = "هذا الدرس في النموذج القادم. درس الكسور هو المتاح حاليًا.";

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
