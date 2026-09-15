"""
Authoring template: a school exam → a lesson JSON.

This is the script that produced lib/lessons/math/stats8.lesson.json from a
warraq.co term exam (الصف الثاني المتوسط · الرياضيات · الفصل الثاني). Copy it for
the next exam: fill the intro, the B-path, one `concept_copy` entry per concept,
the pools (levels × questions) and the explain cards, then run

    python3 scripts/author-stats8.py && npm test

The graph shape matches every other lesson (intro → a1 | b1..b3 → p1 → p2 → …
→ END, bonus x1), extended to any number of concepts.
"""
import json, os
TEACHER = "الأستاذ نواف"
LEVELS = ["أساسي", "متوسط", "متقدم"]
def ch(l, ok=False): return {"l": l, "ok": True} if ok else {"l": l}
def q(id, text, visual, choices): return {"id": id, "text": text, "visual": visual, "choices": choices}
def word(t, marks=None, caption=None):
    d = {"kind": "word", "text": t}
    if marks is not None: d["marks"] = marks
    if caption: d["caption"] = caption
    return d
def cards(items, highlight=None, numbered=False):
    d = {"kind": "cards", "items": [{"label": i} if isinstance(i, str) else i for i in items]}
    if highlight is not None: d["highlight"] = highlight
    if numbered: d["numbered"] = True
    return d
def pie(h=None):
    d = {"kind": "chart", "type": "pie", "slices": [{"label": "علوم", "value": 20}, {"label": "تاريخ", "value": 48}, {"label": "فنون", "value": 32}]}
    if h is not None: d["highlight"] = h
    return d
def hist(h=None):
    d = {"kind": "chart", "type": "bar", "categories": ["50-59", "60-69", "70-79", "80-89", "90-99"], "values": [9, 14, 24, 12, 5], "xLabel": "الدرجات", "yLabel": "التكرار"}
    if h: d["highlight"] = h
    return d
def box(h=None):
    d = {"kind": "chart", "type": "box", "min": 20, "q1": 40, "median": 60, "q3": 80, "max": 100, "from": 0, "to": 120, "label": "سرعات السيارات (كم/سا)"}
    if h: d["highlight"] = h
    return d
FREQ = {"kind": "table", "head": ["اللون", "التكرار"], "rows": [["أحمر", "3"], ["أخضر", "2"], ["أزرق", "1"], ["المجموع", "6"]], "highlight": 3}

C = ["data", "algebra", "problems"]
concept_copy = {
    "data": dict(ok="صح عليك 👏 تقرأ التمثيلات البيانية صح. الحين نروح للمعادلات.", okLog="أجاب {name} على أسئلة تمثيل البيانات بنجاح.",
                 r="قريب. تذكّر: النسبة نحوّلها لعدد بالضرب في الكل والقسمة على 100، وفي المدرج نجمع أعمدة الفئات المطلوبة.", rStrategy="reread_chart", rAdapt="أعاد المعلم قراءة التمثيل البياني",
                 d="خلنا نرجع خطوة ونقرأ الرسم مرة ثانية.", dLog="خفّض المعلم المستوى في تمثيل البيانات."),
    "algebra": dict(ok="ممتاز، المعادلات واضحة عندك. باقي حل المسائل.", okLog="أجاب {name} على أسئلة المعادلات بنجاح.",
                    r="لا بأس. اجمع حدود س في طرف والأعداد في الطرف الثاني، وتأكد من الإشارة لما تنقل حدًّا.", rStrategy="collect_terms", rAdapt="أعاد المعلم خطوات حل المعادلة",
                    d="خلنا نجربها بمعادلة أبسط.", dLog="خفّض المعلم المستوى في المعادلات."),
    "problems": dict(ok="ممتاز يا {name}، خلصت مراجعة الاختبار كاملة.", okLog="أجاب {name} على أسئلة حل المسائل بنجاح.",
                     r="فكّر بالاستراتيجية أول: عدّ الطرق بالضرب، والمحيط نجمع الأضلاع كلها، والمكعب ضلعه × ضلعه × ضلعه.", rStrategy="pick_strategy", rAdapt="أعاد المعلم اختيار الاستراتيجية",
                     d="خلنا نجربها بمسألة أسهل.", dLog="خفّض المعلم المستوى في حل المسائل."),
}
steps = {
    "intro": {"text": "هلا {name}، اليوم نراجع اختبار الفصل الثاني: تمثيل البيانات، والمعادلات، وحل المسائل. قبل ما نبدأ: لو 20% من 90 شخص يفضّلون العلوم، كم عددهم؟", "visual": pie(0), "concept": "data", "listen": True},
    "a1": {"text": "ممتاز 👏 20% من 90 = 18. النسبة نحوّلها لعدد: 90 × 20 ÷ 100.", "visual": pie(0), "concept": "data", "next": "p1", "mood": "encourage"},
    "b1": {"text": "عادي، خلنا نمشي خطوة خطوة.", "visual": pie(), "concept": "data", "next": "b2", "strategy": "step_by_step", "reexplain": True, "adapt": "بدأ المعلم بالنسبة المئوية خطوة خطوة", "log": "بدأ المعلم شرح النسبة المئوية خطوة خطوة."},
    "b2": {"text": "20% يعني 20 من كل 100. عندنا 90 شخص: نضرب 90 × 20 ثم نقسم على 100. كم الناتج؟", "visual": pie(0), "concept": "data", "choices": "B", "onOk": "b3", "onWrong": "b2r", "question": True, "wrongLog": "أخطأ {name} في تحويل النسبة إلى عدد، فأعاد المعلم الشرح."},
    "b2r": {"text": "90 × 20 = 1800، و1800 ÷ 100 = ؟", "visual": pie(0), "concept": "data", "choices": "B", "onOk": "b3", "onWrong": "b2r", "retry": True},
    "b3": {"text": "ممتاز، 18 شخصًا. الحين نكمل.", "visual": pie(0), "concept": "data", "next": "p1", "mood": "encourage", "log": "فهم {name} تحويل النسبة إلى عدد."},
}
for i, c in enumerate(C):
    n = i + 1
    cc = concept_copy[c]
    nxt = f"p{n+1}" if n < len(C) else "END"
    steps[f"p{n}"] = {"text": "سؤال", "visual": {"kind": "none"}, "concept": c, "pool": c, "onOk": f"p{n}ok", "onWrong": f"r{n}", "onLevelDown": f"d{n}", "askCount": 2}
    steps[f"p{n}ok"] = {"text": cc["ok"], "visual": {"kind": "none"}, "concept": c, "next": nxt, "mood": "encourage", "log": cc["okLog"]}
    steps[f"r{n}"] = {"text": cc["r"], "visual": {"kind": "none"}, "concept": c, "next": f"p{n}", "reexplain": True, "strategy": cc["rStrategy"], "adapt": cc["rAdapt"]}
    steps[f"d{n}"] = {"text": cc["d"], "visual": {"kind": "none"}, "concept": c, "next": f"p{n}", "reexplain": True, "log": cc["dLog"]}
steps["x1"] = {"text": "سؤال أخير: إذا كانت د(س) = 2س + 10، فما قيمة د(2)؟", "visual": word("د(س) = 2س + 10"), "concept": "algebra", "choices": "X", "onOk": "x2", "onWrong": "x1r", "question": True}
steps["x1r"] = {"text": "عوّض س = 2: 2 × 2 + 10 = ؟", "visual": word("د(2) = 2 × 2 + 10"), "concept": "algebra", "choices": "X", "onOk": "x2", "onWrong": "x1r", "retry": True}
steps["x2"] = {"text": "ممتاز يا {name}. خلصنا المراجعة بقوة.", "visual": word("د(2) = 14"), "concept": "algebra", "next": "SUMMARY", "mood": "encourage", "log": "أجاب على السؤال الإضافي بنجاح."}

pools = {
    "data": [
        [q("d-1a", "من القطاعات الدائرية: أي مادة يفضّلها أكثر الأشخاص؟", pie(), [ch("التاريخ", True), ch("العلوم"), ch("الفنون")]),
         q("d-1b", "في جدول التكرار، مجموع كل التكرارات يساوي…", FREQ, [ch("عدد البيانات الأصلية", True), ch("أكبر تكرار"), ch("عدد الفئات")])],
        [q("d-2a", "المدرج التكراري يوضح توزيع درجات طلاب. كم طالبًا حصل على 70 فأكثر ولم يتجاوز 89؟", hist([2, 3]), [ch("36", True), ch("38"), ch("24")]),
         q("d-2b", "البيانات: أحمر، أخضر، أحمر، أزرق، أخضر، أحمر. تكرار اللون الأخضر في جدول التكرار = 3. صح أو خطأ؟", cards(["أحمر", "أخضر", "أحمر", "أزرق", "أخضر", "أحمر"]), [ch("خطأ، تكراره 2", True), ch("صح")])],
        [q("d-3a", "التمثيل بالصندوق وطرفيه لسرعات مجموعة من السيارات. ما طول الطرف الأيمن، من الربيع الأعلى إلى القيمة العظمى؟", box("right"), [ch("20", True), ch("40"), ch("30")]),
         q("d-3b", "البيانات: 6، 7، 15، 18، 24، 31، 32. الربيع الأدنى 7 والربيع الأعلى 31. كم المدى الربيعي؟", {"kind": "table", "head": ["الربيع الأدنى", "الوسيط", "الربيع الأعلى"], "rows": [["7", "18", "31"]], "highlight": 0}, [ch("24", True), ch("18"), ch("26")])],
    ],
    "algebra": [
        [q("a-1a", "اشترى أحمد قلمين بسعر واحد ودفع 9 ريالات رسوم توصيل، والمبلغ الإجمالي 17 ريالًا. كم سعر القلم الواحد؟", word("2س + 9 = 17"), [ch("4 ريالات", True), ch("8 ريالات"), ch("3 ريالات")]),
         q("a-1b", "ما أساس المتتابعة الحسابية: 7، 13، 19، 25، …؟", cards(["7", "13", "19", "25", "…"]), [ch("6", True), ch("5"), ch("13")])],
        [q("a-2a", "ما قيمة س في المعادلة: 4س − 5 = 3س − 3؟", word("4س − 5 = 3س − 3"), [ch("س = 2", True), ch("س = 3"), ch("س = 5")]),
         q("a-2b", "وسّع العبارة باستخدام الخاصية التوزيعية: 5(س − 5)", word("5(س − 5)"), [ch("5س − 25", True), ch("5س − 5"), ch("10س − 25")])],
        [q("a-3a", "شركة توصيل أولى تتقاضى 28 ريالًا ثابتة و5 ريالات لكل كيلومتر، وثانية 7 ريالات ثابتة و8 لكل كيلومتر. بعد كم كيلومتر تتساوى التكلفة؟", word("28 + 5س = 7 + 8س"), [ch("س = 7", True), ch("س = 12"), ch("س = 8")]),
         q("a-3b", "حلّ المتباينة: س − 4 > 8", word("س − 4 > 8"), [ch("س > 12", True), ch("س > 8"), ch("س > 4")])],
    ],
    "problems": [
        [q("p-1a", "يمتلك طالب 5 قمصان و4 بناطيل. كم طريقة يمكنه اختيار طقم كامل؟", cards([{"label": "5", "sub": "قمصان"}, {"label": "×", "sub": ""}, {"label": "4", "sub": "بناطيل"}]), [ch("20", True), ch("9"), ch("25")]),
         q("p-1b", "مستطيل طوله 25 م وعرضه 18 م. باستعمال خطوة «تحقّق»: هل محيطه 43 م؟", cards([{"label": "25", "sub": "الطول"}, {"label": "18", "sub": "العرض"}]), [ch("خطأ، محيطه 86 م", True), ch("صح")])],
        [q("p-2a", "ما اسم القطعة المستقيمة الناتجة عن تقاطع وجهين في شكل ثلاثي الأبعاد؟", cards(["الحرف", "الرأس", "الوجه"]), [ch("الحرف", True), ch("الرأس"), ch("الوجه")]),
         q("p-2b", "عند ترتيب مربعات متطابقة بجانب بعضها، هل الشكل الناتج من تدوير ترتيب سابق يُعدّ ترتيبًا جديدًا مختلفًا؟", cards(["▭▭", "▯▯"]), [ch("لا، هو نفس الترتيب", True), ch("نعم، ترتيب جديد")])],
        [q("p-3a", "بنى مهندس نموذج مكعب كبير من 216 مكعبًا صغيرًا متطابقًا بدون فراغات. كم طول ضلع المكعب الكبير بعدد المكعبات؟", word("216 = ؟ × ؟ × ؟"), [ch("6", True), ch("36"), ch("8")]),
         q("p-3b", "مجموع ثلاثة أعداد فردية متتالية يساوي 21. ما أكبر هذه الأعداد؟", word("س + (س + 2) + (س + 4) = 21"), [ch("9", True), ch("7"), ch("11")])],
    ],
}
lesson = {
    "id": "stats8", "title": "درس البيانات والمعادلات", "subject": "الرياضيات", "subjectId": "math", "teacher": TEACHER,
    "durationLabel": "10 دقائق", "levels": LEVELS,
    "levelUpAdapt": "رفع المعلم المستوى ← {level}", "levelDownAdapt": "خفّض المعلم المستوى ← {level}",
    "entry": "intro", "bonusEntry": "x1",
    "pools": pools,
    "choiceSets": {"B": [ch("18", True), ch("20"), ch("23")], "X": [ch("14", True), ch("12")]},
    "steps": steps,
    "introResponses": {
        "correct": {"transcript": "ثمانية عشر", "understanding": "good", "go": "a1", "log": "حوّل {name} النسبة المئوية إلى عدد من أول سؤال.", "questions": 1, "correct": 1},
        "unclear": {"transcript": "امم… عشرين؟ مو متأكد", "understanding": "unclear", "go": "b1", "log": "لم تكن إجابة {name} واضحة، فبدأ المعلم بالنسبة المئوية خطوة خطوة.", "questions": 1, "correct": 0},
        "dontknow": {"transcript": "ما أعرف", "understanding": "confused", "go": "b1", "log": "{name} لم يعرف الإجابة، فبدأ المعلم بالنسبة المئوية خطوة خطوة.", "questions": 1, "correct": 0},
        "strong": {"transcript": "18، لأن 20% من 90 يعني 90 ÷ 5", "understanding": "strong", "go": "p1", "log": "أظهر {name} فهمًا قويًا، فانتقل المعلم إلى الأسئلة مباشرة.", "questions": 1, "correct": 1},
    },
    "choiceTranscript": "اختار {name}: {choice}",
    "progress": [["a1", "b1", "p1"], ["p1"], ["p1ok"], ["p2ok"], ["p3ok"], ["END"]],
    "notes": [
        {"text": "حوّلت النسبة المئوية إلى عدد من أول سؤال.", "when": [{"anyOf": ["a1"]}]},
        {"text": "احتجت النسبة المئوية خطوة خطوة.", "when": [{"anyOf": ["b1"]}]},
        {"text": "رجعنا خطوة ثم كملت.", "when": [{"anyOf": ["d1", "d2", "d3"]}]},
        {"text": "راجعت الاختبار كاملًا: البيانات والمعادلات وحل المسائل.", "when": [{"anyOf": ["p3ok"]}]},
    ],
    "rating": [{"min": 0.85, "label": "ممتاز"}, {"min": 0.6, "label": "جيد جدًا"}, {"min": 0, "label": "جيد"}],
    "endLine": "ممتاز يا {name}. اليوم راجعنا تمثيل البيانات بالقطاعات والمدرج والصندوق، وحل المعادلات والمتباينات، واستراتيجيات حل المسألة.",
    "ask": {"cta": "اسأل الأستاذ نواف", "title": "اسأل الأستاذ نواف", "hint": "تكلم بصوتك، والأستاذ نواف يرد عليك مباشرة. دقيقتان.", "done": "خلصت",
            "unavailable": "المحادثة المفتوحة غير متاحة الآن. نكمل الدرس؟", "greeting": "هلا {name}! عندك سؤال عن الإحصاء أو المعادلات؟ أنا أسمعك.",
            "scope": "مراجعة رياضيات الصف الثاني المتوسط، الفصل الثاني: القطاعات الدائرية، المدرج التكراري، الصندوق وطرفاه، المدى الربيعي، جدول التكرار، المعادلات ذات الخطوتين، المتباينات، الخاصية التوزيعية، المتتابعة الحسابية، مبدأ العد، المحيط، الحرف في المجسمات."},
    "askLog": "سأل {name} المعلم أسئلة إضافية في محادثة مفتوحة، وأجابه بأمثلة بسيطة.",
    "thinkingLabel": "أفهم إجابتك…",
    "thinkingRetryLabel": "لحظة، خلني أشوف أفضل طريقة أشرحها لك",
    "explain": [
        {"text": "القطاعات الدائرية تقسم الكل إلى نسب. لتحويل النسبة إلى عدد: الكل × النسبة ÷ 100. مثلًا 90 × 20 ÷ 100 = 18.", "visual": pie(0)},
        {"text": "المدرج التكراري يجمع الدرجات في فئات. لمعرفة عدد الطلاب في أكثر من فئة نجمع الأعمدة: 24 + 12 = 36.", "visual": hist([2, 3])},
        {"text": "التمثيل بالصندوق: الصندوق من الربيع الأدنى إلى الأعلى، والخط في وسطه الوسيط، والطرفان إلى أصغر وأكبر قيمة. المدى الربيعي = الربيع الأعلى − الربيع الأدنى.", "visual": box("box")},
        {"text": "لحل معادلة فيها س في الطرفين، نجمع حدود س في طرف والأعداد في الطرف الآخر: 4س − 3س = −3 + 5، إذن س = 2.", "visual": word("4س − 5 = 3س − 3")},
        {"text": "المتتابعة الحسابية يزيد كل حد عن اللي قبله بعدد ثابت اسمه الأساس: 13 − 7 = 6.", "visual": cards(["7", "13", "19", "25", "…"], 1)},
    ],
    "intro": {"eyebrow": "الرياضيات · الصف الثاني المتوسط · 10 دقائق", "title": "درس البيانات والمعادلات", "line": "هلا {name}. أولًا أشرح لك الأفكار بهدوء، وبعدين نجرب أسئلة الاختبار مع بعض."},
}
path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "lib", "lessons", "math", "stats8.lesson.json")
json.dump(lesson, open(path, "w", encoding="utf8"), ensure_ascii=False, indent=2)
print("wrote", path, len(steps), "steps,", sum(len(p) for ls in pools.values() for p in ls), "pool questions")
