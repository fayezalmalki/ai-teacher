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
    { title: "الجمع والطرح", meta: "10 دقائق · جيد جدًا", status: "done" },
    { lessonId: "fractions", title: "الكسور", meta: "النصف والربع · 10 دقائق", status: "today" },
    { title: "القياس", meta: "الطول والوزن", status: "later" },
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
    { title: "دورة الماء", meta: "10 دقائق", status: "next" },
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

export const LAST_SESSION = {
  title: "الجمع والطرح حتى 1000",
  ratingWord: "جيدًا جدًا",
  quote: "الجمع بالعمود صار سهلًا عليك.",
  streak: [1, 1, 0, 1, 0, 0, 0],
  streakLabel: "3 أيام هذا الأسبوع",
};

export interface ParentSessionRow {
  title: string;
  meta: string;
  rating: string;
  tone: "green" | "amber";
}

export const PARENT_WEEK = {
  eyebrow: "هذا الأسبوع",
  stats: [
    { k: "جلسات", v: "3" },
    { k: "وقت التعلم", v: "28 دقيقة" },
    { k: "إجابات صحيحة", v: "11 من 14" },
  ],
  highlight: { k: "أبرز تحسّن", v: "المقارنة بين الكسور" },
  sessions: [
    { title: "الكسور", meta: "اليوم · 9 دقائق · 5 أسئلة", rating: "جيد جدًا", tone: "green" },
    { title: "الجمع والطرح", meta: "أمس · 10 دقائق · 5 أسئلة", rating: "جيد جدًا", tone: "green" },
    { title: "دورة الماء", meta: "قبل 3 أيام · 9 دقائق · 4 أسئلة", rating: "جيد", tone: "amber" },
  ] as ParentSessionRow[],
  narrative:
    "في جلسة الكسور، لم يفهم {name} الربع من الشرح الأول، فغيّر المعلم المثال إلى الشوكولاتة ثم رفع المستوى بعد إجابته الصحيحة.",
  recommendations: [
    "مراجعة قصيرة للربع خلال الأسبوع القادم بمثال مختلف.",
    "درس القياس هو الخطوة الطبيعية بعد الكسور.",
    "{name} يجيب بثقة أكثر بالصوت من الاختيار، شجّعوه يتكلم.",
  ],
  durations: [10, 15, 20],
  reminderTime: "الساعة 5:00 مساءً",
};
