"""الصف الخامس الابتدائي · الإنجليزية · Past simple, comparatives, can/can't and should."""
from builder import *

PAST = cards([{"label": "play → played", "sub": "لعب"}, {"label": "visit → visited", "sub": "زار"}, {"label": "go → went", "sub": "ذهب"}, {"label": "eat → ate", "sub": "أكل"}])
COMP = cards([{"label": "big → bigger", "sub": "أكبر"}, {"label": "tall → taller", "sub": "أطول"}, {"label": "fast → faster", "sub": "أسرع"}, {"label": "beautiful → more beautiful", "sub": "أجمل"}])
spec = {
    "id": "g5en", "title": "الماضي البسيط والمقارنة", "subject": "الإنجليزية", "subjectId": "en", "gradeLabel": "الصف الخامس الابتدائي",
    "intro": {
        "text": "هلا {name}، اليوم نراجع الماضي البسيط والمقارنة وcan. سؤال سريع: أكمل: Yesterday I … football.",
        "visual": word("Yesterday I … football.", caption="⚽ أمس"),
        "choicesB": [ch("played", True), ch("play"), ch("plays")],
        "responses": {"correct": "played", "unclear": "امم… play؟", "strong": "played، لأن الجملة في الماضي نضيف ed"},
        "a1": "ممتاز 👏 Yesterday I played: في الماضي نضيف ed للفعل المنتظم.",
        "b1Adapt": "بدأ المعلم بقاعدة ed في الماضي",
        "b2": "كلمة Yesterday تعني أمس، يعني الفعل صار في الماضي. play في الماضي يصير…",
        "b2r": "نضيف ed: play + ed = … Yesterday I … football.",
        "b3": "ممتاز، played. الحين نكمل.",
    },
    "concepts": [
        {"id": "past", "name": "الماضي البسيط", "ok": "صح عليك 👏 الماضي البسيط مضبوط. الحين المقارنة.",
         "r": "قريب. الماضي البسيط: الفعل المنتظم نضيف له ed: played، visited. وبعض الأفعال تتغير: go → went، eat → ate، see → saw. وفعل «يكون»: was مع I/He/She، وwere مع You/We/They. والنفي: didn't + الفعل الأصلي.", "rStrategy": "past_rule", "rAdapt": "أعاد المعلم قاعدة ed والأفعال الشاذة",
         "pool": [
            [mc("p-1a", "أكمل: Last week we … our grandmother.", word("Last week we … our grandmother.", caption="👵"), "visited", "visit", "visits"),
             mc("p-1b", "أكمل: I … at home yesterday.", word("I … at home yesterday.", caption="🏠"), "was", "were", "am")],
            [mc("p-2a", "ماضي go هو…", word("go → ?", caption="🚶"), "went", "goed", "goes"),
             mc("p-2b", "أكمل: They … in Makkah last year.", word("They … in Makkah last year.", caption="🕋"), "were", "was", "are")],
            [mc("p-3a", "النفي الصحيح هو…", cards(["I didn't see him.", "I didn't saw him.", "I don't saw him."]), "I didn't see him.", "I didn't saw him.", "I don't saw him."),
             mc("p-3b", "أكمل: She … lunch at 2 o'clock. 🍽️", word("She … lunch at 2 o'clock.", caption="🍽️ أمس"), "ate", "eat", "eated")],
         ]},
        {"id": "compare", "name": "المقارنة", "ok": "ممتاز، المقارنة مضبوطة. باقي can وshould.",
         "r": "لا بأس. للمقارنة بين اثنين نضيف er: tall → taller، وبعدها than: Ali is taller than Sami. الصفة الطويلة نحط قبلها more: more beautiful. وgood تصير better.", "rStrategy": "comparative_rule", "rAdapt": "أعاد المعلم قاعدة er وthan",
         "pool": [
            [mc("c-1a", "أكمل: An elephant is … than a cat.", word("An elephant is … than a cat.", caption="🐘 🐱"), "bigger", "big", "biggest"),
             mc("c-1b", "أكمل: Ali is … than Sami.", word("Ali is … than Sami.", caption="📏"), "taller", "tall", "more tall")],
            [mc("c-2a", "أكمل: A car is … than a bike.", word("A car is … than a bike.", caption="🚗 🚲"), "faster", "fast", "more fast"),
             mc("c-2b", "أكمل: This book is … than that one.", word("This book is … than that one.", caption="📖📖"), "better", "gooder", "more good")],
            [mc("c-3a", "أكمل: Riyadh is … than my village.", word("Riyadh is … than my village.", caption="🏙️ 🏡"), "more beautiful", "beautifuler", "beautiful"),
             mc("c-3b", "الجملة الصحيحة هي…", cards(["Winter is colder than summer.", "Winter is more cold than summer.", "Winter is cold than summer."]), "Winter is colder than summer.", "Winter is more cold than summer.", "Winter is cold than summer.")],
         ]},
        {"id": "can", "name": "can وshould", "ok": "ممتاز يا {name}، خلصت الماضي والمقارنة وcan.",
         "r": "قريب. can يعني يقدر: I can swim أقدر أسبح، والنفي can't. should يعني ينبغي: You should sleep early. وبعد can وshould يأتي الفعل الأصلي بدون s.", "rStrategy": "modal_rule", "rAdapt": "أعاد المعلم can وcan't وshould",
         "pool": [
            [mc("k-1a", "«I can swim» تعني…", word("I can swim.", caption="🏊"), "أقدر أسبح", "أحب السباحة", "سبحت أمس"),
             mc("k-1b", "أكمل: A fish … fly. ❌", word("A fish … fly.", caption="🐟 ❌"), "can't", "can", "should")],
            [mc("k-2a", "أكمل: You … brush your teeth every day. 🪥", word("You … brush your teeth every day.", caption="🪥"), "should", "can't", "were"),
             mc("k-2b", "أكمل: Birds … fly. ✅", word("Birds … fly.", caption="🐦 ✅"), "can", "can't", "should")],
            [mc("k-3a", "الجملة الصحيحة هي…", cards(["She can ride a bike.", "She can rides a bike.", "She cans ride a bike."]), "She can ride a bike.", "She can rides a bike.", "She cans ride a bike."),
             mc("k-3b", "أكمل: You … eat too many sweets. 🍬", word("You … eat too many sweets.", caption="🍬 ❌"), "shouldn't", "should", "can")],
         ]},
    ],
    "bonus": {"text": "سؤال أخير: أكمل: We … to the park last Friday.", "visual": word("We … to the park last Friday.", caption="🌳 أمس"), "ok": "went", "wrong": "go", "retry": "last Friday يعني في الماضي. go في الماضي يصير…", "concept": "past"},
    "explain": [
        {"text": "الماضي البسيط: الفعل المنتظم نضيف له ed، وبعض الأفعال تتغير كلها.", "visual": PAST},
        {"text": "فعل «يكون» في الماضي: was مع I وHe وShe، وwere مع You وWe وThey. والنفي: didn't + الفعل الأصلي.", "visual": cards(["I was", "They were", "I didn't go"])},
        {"text": "المقارنة بين اثنين: نضيف er وبعدها than. الصفة الطويلة نحط قبلها more.", "visual": COMP},
        {"text": "can يعني يقدر، وcan't ما يقدر. should يعني ينبغي. وبعدها الفعل الأصلي بدون s.", "visual": cards([{"label": "I can swim", "icon": "🏊"}, {"label": "A fish can't fly", "icon": "🐟"}, {"label": "You should sleep early", "icon": "😴"}])},
        {"text": "كلمات الزمن الماضي: yesterday أمس، last week الأسبوع الماضي، last year السنة الماضية.", "visual": cards([{"label": "yesterday", "sub": "أمس"}, {"label": "last week", "sub": "الأسبوع الماضي"}, {"label": "last year", "sub": "السنة الماضية"}])},
    ],
    "doneNote": "راجعت الماضي البسيط، والمقارنة بـ er وthan، وcan وshould.",
    "endLine": "ممتاز يا {name}. اليوم راجعنا الماضي البسيط بـ ed والأفعال الشاذة، وقارنّا بـ er وthan، وعرفنا can وshould.",
    "ask": {"greeting": "هلا {name}! عندك سؤال عن الماضي البسيط أو المقارنة؟ أنا أسمعك.", "scope": "الإنجليزية الصف الخامس: الماضي البسيط المنتظم بـ ed والأفعال الشاذة، was/were، النفي بـ didn't، المقارنة بـ er وthan وmore، can وcan't وshould وshouldn't. اشرح بالعربي وأعطِ الأمثلة بالإنجليزي."},
}
write(build(spec), "en")
