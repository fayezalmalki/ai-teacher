"""
Lesson builder: turns a compact spec (intro, B-path, concepts with pools,
explain cards) into the lesson JSON the engine runs. Same graph as every
built-in lesson: intro → a1 | b1 → b2 → b3 → p1 → p2 → … → END, bonus x1.

Usage from a spec file:  from builder import *; write(build(spec))
"""
import json, os

TEACHER = "الأستاذ نواف"
LEVELS = ["أساسي", "متوسط", "متقدم"]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def ch(l, ok=False): return {"l": l, "ok": True} if ok else {"l": l}
def q(id, text, visual, choices): return {"id": id, "text": text, "visual": visual, "choices": choices}
def mc(id, text, visual, ok, *wrong):
    """Multiple choice: the first label is the correct one; the UI shuffles nothing, so vary the position by hand."""
    return q(id, text, visual, [ch(ok, True)] + [ch(w) for w in wrong])
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
def table(head, rows, highlight=None):
    d = {"kind": "table", "head": head, "rows": rows}
    if highlight is not None: d["highlight"] = highlight
    return d
def bar(categories, values, highlight=None, xLabel=None, yLabel=None):
    d = {"kind": "chart", "type": "bar", "categories": categories, "values": values}
    if highlight: d["highlight"] = highlight
    if xLabel: d["xLabel"] = xLabel
    if yLabel: d["yLabel"] = yLabel
    return d
def pie(slices, highlight=None):
    d = {"kind": "chart", "type": "pie", "slices": [{"label": l, "value": v} for l, v in slices]}
    if highlight is not None: d["highlight"] = highlight
    return d
def blocks(value, highlight=None):
    d = {"kind": "blocks", "value": value}
    if highlight: d["highlight"] = highlight
    return d
def numberline(a, b, start=None, jump=None, step=None):
    d = {"kind": "numberline", "from": a, "to": b}
    if start is not None: d["start"] = start
    if jump is not None: d["jump"] = jump
    if step is not None: d["step"] = step
    return d
def pizza(filled, dividers): return {"kind": "pizza", "filled": filled, "dividers": dividers}
def fractions(*pairs): return {"kind": "fractions", "pairs": [{"n": n, "d": d} for n, d in pairs]}
def ruler(length, max=None, label=None):
    d = {"kind": "ruler", "length": length}
    if max: d["max"] = max
    if label: d["label"] = label
    return d
def cycle(stages, highlight=None):
    d = {"kind": "cycle", "stages": stages}
    if highlight is not None: d["highlight"] = highlight
    return d
NONE = {"kind": "none"}

def build(L):
    """L: id, title, subject, subjectId, grade, intro{text, visual, choicesB, responses{correct,unclear,dontknow,strong}, a1, b1Adapt, b2, b2r, b3},
    concepts: [{id, name, ok, r, rStrategy, rAdapt, d, pool: [[q...], [q...], [q...]]}], bonus{text, visual, ok, wrong, retry}, explain, endLine, ask{greeting, scope}, notes."""
    I = L["intro"]
    C = L["concepts"]
    first = C[0]["id"]
    steps = {
        "intro": {"text": I["text"], "visual": I["visual"], "concept": first, "listen": True},
        "a1": {"text": I["a1"], "visual": I.get("a1Visual", I["visual"]), "concept": first, "next": "p1", "mood": "encourage"},
        "b1": {"text": I.get("b1", "عادي، خلنا نمشي خطوة خطوة."), "visual": I["visual"], "concept": first, "next": "b2", "strategy": "step_by_step", "reexplain": True, "adapt": I["b1Adapt"], "log": "بدأ المعلم الشرح خطوة خطوة."},
        "b2": {"text": I["b2"], "visual": I.get("b2Visual", I["visual"]), "concept": first, "choices": "B", "onOk": "b3", "onWrong": "b2r", "question": True, "wrongLog": "أخطأ {name} في سؤال البداية، فأعاد المعلم الشرح."},
        "b2r": {"text": I["b2r"], "visual": I.get("b2Visual", I["visual"]), "concept": first, "choices": "B", "onOk": "b3", "onWrong": "b2r", "retry": True},
        "b3": {"text": I["b3"], "visual": I.get("b2Visual", I["visual"]), "concept": first, "next": "p1", "mood": "encourage", "log": "فهم {name} سؤال البداية."},
    }
    for i, c in enumerate(C):
        n = i + 1
        nxt = f"p{n+1}" if n < len(C) else "END"
        steps[f"p{n}"] = {"text": "سؤال", "visual": NONE, "concept": c["id"], "pool": c["id"], "onOk": f"p{n}ok", "onWrong": f"r{n}", "onLevelDown": f"d{n}", "askCount": 2}
        steps[f"p{n}ok"] = {"text": c["ok"], "visual": NONE, "concept": c["id"], "next": nxt, "mood": "encourage", "log": f"أجاب {{name}} على أسئلة {c['name']} بنجاح."}
        steps[f"r{n}"] = {"text": c["r"], "visual": NONE, "concept": c["id"], "next": f"p{n}", "reexplain": True, "strategy": c["rStrategy"], "adapt": c["rAdapt"]}
        steps[f"d{n}"] = {"text": c.get("d", "خلنا نجربها بسؤال أبسط."), "visual": NONE, "concept": c["id"], "next": f"p{n}", "reexplain": True, "log": f"خفّض المعلم المستوى في {c['name']}."}
    X = L["bonus"]
    steps["x1"] = {"text": X["text"], "visual": X["visual"], "concept": X.get("concept", first), "choices": "X", "onOk": "x2", "onWrong": "x1r", "question": True}
    steps["x1r"] = {"text": X["retry"], "visual": X["visual"], "concept": X.get("concept", first), "choices": "X", "onOk": "x2", "onWrong": "x1r", "retry": True}
    steps["x2"] = {"text": "ممتاز يا {name}. خلصنا المراجعة بقوة.", "visual": X.get("doneVisual", X["visual"]), "concept": X.get("concept", first), "next": "SUMMARY", "mood": "encourage", "log": "أجاب على السؤال الإضافي بنجاح."}
    R = I["responses"]
    return {
        "id": L["id"], "title": L["title"], "subject": L["subject"], "subjectId": L["subjectId"], **({"lang": "en"} if L["subjectId"] == "en" else {}), "teacher": TEACHER,
        "durationLabel": "10 دقائق", "levels": LEVELS,
        "levelUpAdapt": "رفع المعلم المستوى ← {level}", "levelDownAdapt": "خفّض المعلم المستوى ← {level}",
        "entry": "intro", "bonusEntry": "x1",
        "pools": {c["id"]: c["pool"] for c in C},
        "choiceSets": {"B": I["choicesB"], "X": [ch(X["ok"], True), ch(X["wrong"])]},
        "steps": steps,
        "introResponses": {
            "correct": {"transcript": R["correct"], "understanding": "good", "go": "a1", "log": "أجاب {name} على سؤال البداية من أول مرة.", "questions": 1, "correct": 1},
            "unclear": {"transcript": R["unclear"], "understanding": "unclear", "go": "b1", "log": "لم تكن إجابة {name} واضحة، فبدأ المعلم خطوة خطوة.", "questions": 1, "correct": 0},
            "dontknow": {"transcript": "ما أعرف", "understanding": "confused", "go": "b1", "log": "{name} لم يعرف الإجابة، فبدأ المعلم خطوة خطوة.", "questions": 1, "correct": 0},
            "strong": {"transcript": R["strong"], "understanding": "strong", "go": "p1", "log": "أظهر {name} فهمًا قويًا، فانتقل المعلم إلى الأسئلة مباشرة.", "questions": 1, "correct": 1},
        },
        "choiceTranscript": "اختار {name}: {choice}",
        "progress": [["a1", "b1", "p1"], ["p1"]] + [[f"p{i+1}ok"] for i in range(len(C))] + [["END"]],
        "notes": [
            {"text": "أجبت على سؤال البداية من أول مرة.", "when": [{"anyOf": ["a1"]}]},
            {"text": "احتجت الشرح خطوة خطوة في البداية.", "when": [{"anyOf": ["b1"]}]},
            {"text": "رجعنا خطوة ثم كملت.", "when": [{"anyOf": [f"d{i+1}" for i in range(len(C))]}]},
            {"text": L["doneNote"], "when": [{"anyOf": [f"p{len(C)}ok"]}]},
        ],
        "rating": [{"min": 0.85, "label": "ممتاز"}, {"min": 0.6, "label": "جيد جدًا"}, {"min": 0, "label": "جيد"}],
        "endLine": L["endLine"],
        "ask": {"cta": "اسأل الأستاذ نواف", "title": "اسأل الأستاذ نواف", "hint": "تكلم بصوتك، والأستاذ نواف يرد عليك مباشرة. دقيقتان.", "done": "خلصت",
                "unavailable": "المحادثة المفتوحة غير متاحة الآن. نكمل الدرس؟", "greeting": L["ask"]["greeting"], "scope": L["ask"]["scope"]},
        "askLog": "سأل {name} المعلم أسئلة إضافية في محادثة مفتوحة، وأجابه بأمثلة بسيطة.",
        "thinkingLabel": "أفهم إجابتك…",
        "thinkingRetryLabel": "لحظة، خلني أشوف أفضل طريقة أشرحها لك",
        "explain": L["explain"],
        "intro": {"eyebrow": f'{L["subject"]} · {L["gradeLabel"]} · 10 دقائق', "title": L["title"], "line": "هلا {name}. أولًا أشرح لك الأفكار بهدوء، وبعدين نجرب أسئلة الاختبار مع بعض."},
    }

def write(lesson, subdir):
    path = os.path.join(ROOT, "lib", "lessons", subdir, f'{lesson["id"]}.lesson.json')
    json.dump(lesson, open(path, "w", encoding="utf8"), ensure_ascii=False, indent=2)
    n = sum(len(p) for ls in lesson["pools"].values() for p in ls)
    print("wrote", os.path.relpath(path, ROOT), "·", len(lesson["steps"]), "steps ·", n, "pool questions")
