/** Static library content: subjects, the lesson paths (built lessons carry a lessonId; the rest are placeholders), and copy. */

export const TEACHER = "الأستاذ نواف";
export const APP_NAME = "المعلم الذكي";

export const GRADES = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];
export const AGES = [6, 7, 8, 9, 10, 11, 12];

export function gradeLabel(grade: number): string {
  return "الصف " + (GRADES[grade - 1] ?? GRADES[0]) + " الابتدائي";
}

export type Tone = "blue" | "green" | "amber" | "neutral" | "rose" | "teal";

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
  { id: "en", name: "الإنجليزية", glyph: "A", tone: "rose", blurb: "حروف وكلمات وجمل بالإنجليزي، والأستاذ نواف يشرح بالعربي." },
  { id: "soc", name: "الدراسات الاجتماعية", glyph: "ج", tone: "teal", blurb: "وطني: الخريطة والرموز، تاريخ الدولة السعودية، والتضاريس والاقتصاد." },
];

/** done = finished by this child; today = the home's lesson; next = built and open; later = not built yet. */
export type LessonStatus = "done" | "today" | "next" | "later";

export interface LessonEntry {
  /** Set only for lessons that exist in the lesson engine. */
  lessonId?: string;
  title: string;
  meta: string;
  status: LessonStatus;
  /** School grade (1–6 primary, 7–9 intermediate). Lessons of the child's grade come first. */
  grade?: number;
}

/** Lesson paths per subject. Entries without a lessonId are planned lessons and show as "قريبًا". */
export const LESSONS: Record<string, LessonEntry[]> = {
  math: [
    { lessonId: "fractions", title: "الكسور", meta: "النصف والربع · 10 دقائق", status: "next", grade: 3 },
    { lessonId: "addsub", title: "الجمع والطرح", meta: "الآحاد والعشرات · 10 دقائق", status: "next", grade: 3 },
    { lessonId: "measure", title: "القياس", meta: "الطول والوزن · 10 دقائق", status: "next", grade: 3 },
    { lessonId: "g1math", title: "الأعداد والجمع والطرح", meta: "الصف الأول · مراجعة · 10 دقائق", status: "next", grade: 1 },
    { lessonId: "g2math", title: "الأعداد حتى 999 والجمع والطرح", meta: "الصف الثاني · مراجعة · 10 دقائق", status: "next", grade: 2 },
    { lessonId: "g4math", title: "الضرب والقسمة والكسور", meta: "الصف الرابع · مراجعة اختبار · 10 دقائق", status: "next", grade: 4 },
    { lessonId: "g5math", title: "الكسور العشرية والمساحة والبيانات", meta: "الصف الخامس · مراجعة اختبار · 10 دقائق", status: "next", grade: 5 },
    { lessonId: "g6math", title: "النسبة والأعداد الصحيحة والاحتمال", meta: "الصف السادس · مراجعة اختبار · 10 دقائق", status: "next", grade: 6 },
    { lessonId: "stats8", title: "البيانات والمعادلات", meta: "الصف الثاني المتوسط · مراجعة اختبار الفصل الثاني · 10 دقائق", status: "next", grade: 8 },
    { title: "الأعداد حتى 1000", meta: "الآحاد والعشرات والمئات", status: "later" },
    { title: "الأشكال الهندسية", meta: "المضلعات", status: "later" },
  ],
  ar: [
    { lessonId: "g1ar", title: "الحروف والحركات", meta: "الصف الأول · مراجعة · 10 دقائق", status: "next", grade: 1 },
    { lessonId: "tanween", title: "التنوين", meta: "فتح وضم وكسر · 10 دقائق", status: "next", grade: 3 },
    { lessonId: "g5ar", title: "الجملة والفعل والهمزة", meta: "الصف الخامس · مراجعة اختبار · 10 دقائق", status: "next", grade: 5 },
    { title: "أنواع الجمل", meta: "الاسمية والفعلية", status: "later" },
    { title: "الهمزة المتوسطة", meta: "", status: "later" },
    { title: "الأفعال", meta: "", status: "later" },
    { title: "القراءة الجهرية", meta: "", status: "later" },
  ],
  sci: [
    { lessonId: "water", title: "دورة الماء", meta: "من البحر للسحاب · 10 دقائق", status: "next", grade: 3 },
    { lessonId: "senses", title: "الحواس الخمس", meta: "نشوف ونسمع ونلمس · 10 دقائق", status: "next", grade: 3 },
    { lessonId: "g2sci", title: "النباتات والحيوانات والطقس", meta: "الصف الثاني · مراجعة · 10 دقائق", status: "next", grade: 2 },
    { lessonId: "g4sci", title: "المادة والحرارة والكهرباء", meta: "الصف الرابع · مراجعة اختبار · 10 دقائق", status: "next", grade: 4 },
    { lessonId: "g6sci", title: "الخلية والنظام البيئي والفضاء", meta: "الصف السادس · مراجعة اختبار · 10 دقائق", status: "next", grade: 6 },
    { title: "النبات وأجزاؤه", meta: "", status: "later" },
    { title: "الحيوانات وبيئاتها", meta: "", status: "later" },
    { title: "المادة وحالاتها", meta: "", status: "later" },
  ],
  isl: [
    { lessonId: "pillars", title: "أركان الإسلام", meta: "الخمسة بالترتيب · 10 دقائق", status: "next", grade: 3 },
    { title: "الوضوء", meta: "", status: "later" },
    { title: "سور قصيرة", meta: "", status: "later" },
    { title: "آداب الطعام", meta: "", status: "later" },
    { title: "الصدق", meta: "", status: "later" },
  ],
  en: [
    { lessonId: "g1en", title: "الحروف والألوان والأعداد", meta: "الصف الأول · Letters, colours, numbers · 10 دقائق", status: "next", grade: 1 },
    { lessonId: "g2en", title: "الكلمات والجمل البسيطة", meta: "الصف الثاني · Words and sentences · 10 دقائق", status: "next", grade: 2 },
    { lessonId: "g3en", title: "am, is, are والأسئلة", meta: "الصف الثالث · Be, plurals, questions · 10 دقائق", status: "next", grade: 3 },
    { lessonId: "g4en", title: "المضارع البسيط والوقت والأماكن", meta: "الصف الرابع · Present simple, time, places · 10 دقائق", status: "next", grade: 4 },
    { lessonId: "g5en", title: "الماضي البسيط والمقارنة", meta: "الصف الخامس · Past simple, comparing, can · 10 دقائق", status: "next", grade: 5 },
    { lessonId: "g6en", title: "المضارع المستمر والمستقبل والقراءة", meta: "الصف السادس · Tenses and reading · 10 دقائق", status: "next", grade: 6 },
    { title: "الأيام والشهور", meta: "Days and months", status: "later" },
    { title: "قصة قصيرة", meta: "A short story", status: "later" },
  ],
  soc: [
    { lessonId: "g4soc", title: "وطني: الموقع والرموز والخريطة", meta: "الصف الرابع · مراجعة · 10 دقائق", status: "next", grade: 4 },
    { lessonId: "g5soc", title: "تاريخ الدولة السعودية", meta: "الصف الخامس · مراجعة · 10 دقائق", status: "next", grade: 5 },
    { lessonId: "g6soc", title: "التضاريس والاقتصاد والمواطنة", meta: "الصف السادس · مراجعة · 10 دقائق", status: "next", grade: 6 },
    { title: "الأنبياء والرسل في الجزيرة", meta: "", status: "later" },
    { title: "الخليج العربي وجيراننا", meta: "", status: "later" },
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
