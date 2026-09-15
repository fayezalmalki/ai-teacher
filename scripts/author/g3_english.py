"""الصف الثالث الابتدائي · الإنجليزية · am/is/are, plurals, question words."""
from builder import *

BE = cards([{"label": "I am", "sub": "أنا"}, {"label": "You are", "sub": "أنت"}, {"label": "He is", "sub": "هو"}, {"label": "She is", "sub": "هي"}, {"label": "They are", "sub": "هم"}])
spec = {
    "id": "g3en", "title": "am, is, are والأسئلة", "subject": "الإنجليزية", "subjectId": "en", "gradeLabel": "الصف الثالث الابتدائي",
    "intro": {
        "text": "هلا {name}، اليوم نراجع فعل «يكون» am, is, are والجمع والأسئلة. سؤال سريع: أكمل الجملة: I … a student.",
        "visual": word("I … a student.", caption="🧑‍🎓"),
        "choicesB": [ch("am", True), ch("is"), ch("are")],
        "responses": {"correct": "am", "unclear": "امم… is؟", "strong": "am، لأن مع I نقول am"},
        "a1": "ممتاز 👏 I am a student: أنا طالب. مع I دائمًا am.",
        "b1Adapt": "بدأ المعلم بفعل «يكون» مع كل ضمير",
        "b2": "الفعل يتغير مع الشخص: I am، You are، He is. أنا طالب: I … a student.",
        "b2r": "مع I نقول… am. I … a student.",
        "b3": "ممتاز، I am. الحين نكمل.",
    },
    "concepts": [
        {"id": "be", "name": "am, is, are", "ok": "صح عليك 👏 فعل «يكون» مضبوط. الحين الجمع.",
         "r": "قريب. مع I نقول am، ومع He وShe وIt نقول is، ومع You وWe وThey نقول are. I am، he is، they are.", "rStrategy": "recite_be", "rAdapt": "أعاد المعلم am, is, are مع الضمائر",
         "pool": [
            [mc("b-1a", "أكمل: She … a teacher.", word("She … a teacher.", caption="👩‍🏫"), "is", "am", "are"),
             mc("b-1b", "أكمل: They … my friends.", word("They … my friends.", caption="👦👧"), "are", "is", "am")],
            [mc("b-2a", "أكمل: It … a cat.", word("It … a cat.", caption="🐱"), "is", "are", "am"),
             mc("b-2b", "أكمل: We … happy. 😊", word("We … happy.", caption="😊"), "are", "am", "is")],
            [mc("b-3a", "الجملة الصحيحة هي…", cards(["He is tall.", "He are tall.", "He am tall."]), "He is tall.", "He are tall.", "He am tall."),
             mc("b-3b", "النفي الصحيح هو…", cards(["I am not sad.", "I not am sad.", "I is not sad."]), "I am not sad.", "I not am sad.", "I is not sad.")],
         ]},
        {"id": "plurals", "name": "الجمع", "ok": "ممتاز، الجمع مضبوط. باقي الأسئلة.",
         "r": "لا بأس. للجمع نضيف s: cat → cats، book → books. وإذا انتهت الكلمة بـ s أو x أو ch أو sh نضيف es: box → boxes. وبعض الكلمات تتغير: child → children، man → men.", "rStrategy": "plural_rule", "rAdapt": "أعاد المعلم قاعدة الجمع بـ s وes",
         "pool": [
            [mc("p-1a", "جمع cat هو…", cards([{"label": "cat", "icon": "🐱"}, {"label": "?", "icon": "🐱🐱"}]), "cats", "cates", "cat"),
             mc("p-1b", "جمع book هو…", word("book → ?", caption="📖📖"), "books", "bookes", "book")],
            [mc("p-2a", "جمع box هو…", word("box → ?", caption="📦📦"), "boxes", "boxs", "box"),
             mc("p-2b", "جمع bus هو…", word("bus → ?", caption="🚌🚌"), "buses", "buss", "bus")],
            [mc("p-3a", "جمع child هو…", word("child → ?", caption="🧒🧒"), "children", "childs", "childes"),
             mc("p-3b", "أكمل: Two … are on the desk. 🖊️🖊️", word("Two … are on the desk.", caption="🖊️🖊️"), "pens", "pen", "penes")],
         ]},
        {"id": "questions", "name": "الأسئلة", "ok": "ممتاز يا {name}، خلصت am, is, are والجمع والأسئلة.",
         "r": "قريب. كلمات السؤال: What وش، Where وين، How many كم، How old كم عمرك. What is this? هذا وش؟ Where is the cat? وين القطة؟", "rStrategy": "question_words", "rAdapt": "أعاد المعلم كلمات السؤال ومعانيها",
         "pool": [
            [mc("q-1a", "«What is this?» تعني…", word("What is this?", caption="❓"), "ما هذا؟", "أين هذا؟", "كم هذا؟"),
             mc("q-1b", "نسأل عن المكان بكلمة…", cards(["Where", "What", "How"]), "Where", "What", "How")],
            [mc("q-2a", "… old are you? — I am nine.", word("… old are you?", caption="🎂 9"), "How", "What", "Where"),
             mc("q-2b", "… is the cat? — Under the desk.", word("… is the cat?", caption="🐱 🪑"), "Where", "What", "How many")],
            [mc("q-3a", "… books do you have? — Three.", word("… books do you have?", caption="📖📖📖"), "How many", "Where", "What"),
             mc("q-3b", "الجواب المناسب لـ «What is your name?» هو…", cards(["My name is Sara.", "I am nine.", "In Riyadh."]), "My name is Sara.", "I am nine.", "In Riyadh.")],
         ]},
    ],
    "bonus": {"text": "سؤال أخير: أكمل: You … my friend. 🤝", "visual": word("You … my friend.", caption="🤝"), "ok": "are", "wrong": "is", "retry": "مع You نقول… are. You … my friend.", "concept": "be"},
    "explain": [
        {"text": "فعل «يكون» يتغير مع الشخص: I am، You are، He is، She is، They are.", "visual": BE},
        {"text": "والنفي نحط not بعده: I am not، He is not، They are not.", "visual": cards(["I am not", "He is not", "They are not"])},
        {"text": "للجمع نضيف s: cat → cats. وإذا انتهت بـ s أو x أو ch أو sh نضيف es: box → boxes.", "visual": cards([{"label": "cats", "icon": "🐱🐱"}, {"label": "books", "icon": "📖📖"}, {"label": "boxes", "icon": "📦📦"}])},
        {"text": "بعض الكلمات تتغير كلها في الجمع: child → children، man → men.", "visual": cards([{"label": "children", "sub": "child"}, {"label": "men", "sub": "man"}])},
        {"text": "كلمات السؤال: What وش، Where وين، How many كم، How old كم عمرك.", "visual": cards([{"label": "What", "sub": "وش"}, {"label": "Where", "sub": "وين"}, {"label": "How many", "sub": "كم"}, {"label": "How old", "sub": "كم عمرك"}])},
    ],
    "doneNote": "راجعت am, is, are، وجمع الأسماء، وكلمات السؤال.",
    "endLine": "ممتاز يا {name}. اليوم راجعنا am, is, are مع الضمائر، وجمعنا الأسماء بـ s وes، وسألنا بـ What وWhere وHow many.",
    "ask": {"greeting": "هلا {name}! عندك سؤال عن am وis وare أو عن الجمع؟ أنا أسمعك.", "scope": "الإنجليزية الصف الثالث: فعل to be مع الضمائر والنفي بـ not، جمع الأسماء بـ s وes والجموع الشاذة، كلمات السؤال What وWhere وHow many وHow old. اشرح بالعربي وأعطِ الأمثلة بالإنجليزي."},
}
write(build(spec), "en")
