"""الصف الأول الابتدائي · الإنجليزية · Letters, colours and numbers (Nawaf explains in Arabic, the items are English)."""
from builder import *

COLOURS = cards([{"label": "red", "icon": "🔴"}, {"label": "blue", "icon": "🔵"}, {"label": "green", "icon": "🟢"}, {"label": "yellow", "icon": "🟡"}])
spec = {
    "id": "g1en", "title": "الحروف والألوان والأعداد", "subject": "الإنجليزية", "subjectId": "en", "gradeLabel": "الصف الأول الابتدائي",
    "intro": {
        "text": "هلا {name}، اليوم نتعلم إنجليزي مع بعض. قبل ما نبدأ: أول حرف في كلمة cat وش هو؟",
        "visual": word("cat", [0], "🐱 قطة"),
        "choicesB": [ch("c", True), ch("k"), ch("s")],
        "responses": {"correct": "سي", "unclear": "امم… كي؟", "strong": "c، وبعدها a وبعدها t"},
        "a1": "ممتاز 👏 حرف c. c… a… t: cat يعني قطة.",
        "b1Adapt": "بدأ المعلم بتهجئة الكلمة حرفًا حرفًا",
        "b2": "نتهجّى مع بعض من اليسار: c… a… t. أول حرف سمعناه هو…",
        "b2r": "كـ… كـ… cat. أول حرف هو…",
        "b3": "ممتاز، حرف c. الحين نكمل.",
    },
    "concepts": [
        {"id": "letters", "name": "الحروف", "ok": "صح عليك 👏 تعرف الحروف الإنجليزية. الحين الألوان.",
         "r": "قريب. الحروف الإنجليزية 26 حرفًا، ولكل حرف شكل كبير Capital وشكل صغير small: A a، B b، C c. ونقرأها من اليسار إلى اليمين.", "rStrategy": "spell_slowly", "rAdapt": "أعاد المعلم الحروف ببطء",
         "pool": [
            [mc("l-1a", "الشكل الصغير لحرف A هو…", word("A"), "a", "e", "o"),
             mc("l-1b", "أول حرف في كلمة dog هو…", word("dog", [0], "🐶 كلب"), "d", "b", "g")],
            [mc("l-2a", "الحرف الناقص في كلمة s_n هو…", word("s_n", [1], "☀️ شمس"), "u", "a", "o"),
             mc("l-2b", "الحرف الذي يأتي بعد B في الأبجدية هو…", cards(["A", "B", "?"], highlight=2), "C", "D", "A")],
            [mc("l-3a", "أي كلمة تبدأ بحرف m؟", cards([{"label": "map", "icon": "🗺️"}, {"label": "cat", "icon": "🐱"}, {"label": "pen", "icon": "🖊️"}]), "map", "cat", "pen"),
             mc("l-3b", "كم حرفًا في كلمة book؟", word("book", caption="📖 كتاب"), "four", "three", "five")],
         ]},
        {"id": "colours", "name": "الألوان", "ok": "ممتاز، الألوان مضبوطة. باقي الأعداد.",
         "r": "لا بأس. red أحمر، blue أزرق، green أخضر، yellow أصفر، black أسود، white أبيض.", "rStrategy": "recite_colours", "rAdapt": "أعاد المعلم الألوان الستة",
         "pool": [
            [mc("c-1a", "اللون الأحمر بالإنجليزي…", cards([{"label": "red", "icon": "🔴"}, {"label": "blue", "icon": "🔵"}, {"label": "green", "icon": "🟢"}], highlight=0), "red", "blue", "green"),
             mc("c-1b", "اللون الأزرق بالإنجليزي…", cards([{"label": "blue", "icon": "🔵"}, {"label": "yellow", "icon": "🟡"}, {"label": "red", "icon": "🔴"}], highlight=0), "blue", "yellow", "red")],
            [mc("c-2a", "الشمس sun لونها…", word("sun", caption="☀️"), "yellow", "blue", "green"),
             mc("c-2b", "كلمة green تعني…", word("green", caption="🟢"), "أخضر", "أحمر", "أسود")],
            [mc("c-3a", "black and white يعني…", cards([{"label": "black", "icon": "⚫"}, {"label": "white", "icon": "⚪"}]), "أسود وأبيض", "أحمر وأزرق", "أخضر وأصفر"),
             mc("c-3b", "أي كلمة ليست لونًا؟", cards(["red", "cat", "blue"]), "cat", "red", "blue")],
         ]},
        {"id": "numbers", "name": "الأعداد", "ok": "ممتاز يا {name}، خلصت الحروف والألوان والأعداد.",
         "r": "قريب. نعدّ بالإنجليزي ببطء: one, two, three, four, five, six, seven, eight, nine, ten.", "rStrategy": "count_aloud", "rAdapt": "عدّ المعلم من one إلى ten ببطء",
         "pool": [
            [mc("n-1a", "كم تفاحة؟ بالإنجليزي…", cards(["🍎", "🍎"]), "two", "one", "three"),
             mc("n-1b", "العدد 5 بالإنجليزي…", word("5"), "five", "four", "six")],
            [mc("n-2a", "كم نجمة؟", cards(["⭐", "⭐", "⭐", "⭐"]), "four", "three", "five"),
             mc("n-2b", "العدد الذي يأتي بعد seven هو…", word("seven", caption="7"), "eight", "six", "nine")],
            [mc("n-3a", "ten يساوي…", word("ten"), "10", "9", "8"),
             mc("n-3b", "three + two = ؟", word("3 + 2 = ?"), "five", "four", "six")],
         ]},
    ],
    "bonus": {"text": "سؤال أخير: أول حرف في كلمة sun هو…", "visual": word("sun", [0], "☀️"), "ok": "s", "wrong": "n", "retry": "سـ… sun. أول حرف هو…", "concept": "letters"},
    "explain": [
        {"text": "الحروف الإنجليزية 26 حرفًا، ولكل حرف شكل كبير وشكل صغير. ونقرأ الإنجليزي من اليسار إلى اليمين.", "visual": cards([{"label": "A a", "sub": "ay"}, {"label": "B b", "sub": "bee"}, {"label": "C c", "sub": "see"}])},
        {"text": "كل كلمة تبدأ بحرف: cat تبدأ بـ c، وdog تبدأ بـ d، وsun تبدأ بـ s.", "visual": cards([{"label": "cat", "icon": "🐱"}, {"label": "dog", "icon": "🐶"}, {"label": "sun", "icon": "☀️"}])},
        {"text": "الألوان: red أحمر، blue أزرق، green أخضر، yellow أصفر.", "visual": COLOURS},
        {"text": "نعدّ من واحد إلى خمسة: one, two, three, four, five.", "visual": cards([{"label": "one", "sub": "1"}, {"label": "two", "sub": "2"}, {"label": "three", "sub": "3"}, {"label": "four", "sub": "4"}, {"label": "five", "sub": "5"}])},
        {"text": "ومن ستة إلى عشرة: six, seven, eight, nine, ten.", "visual": cards([{"label": "six", "sub": "6"}, {"label": "seven", "sub": "7"}, {"label": "eight", "sub": "8"}, {"label": "nine", "sub": "9"}, {"label": "ten", "sub": "10"}])},
    ],
    "doneNote": "راجعت الحروف والألوان والأعداد بالإنجليزي كاملة.",
    "endLine": "ممتاز يا {name}. اليوم تعرفنا على الحروف الإنجليزية، والألوان، وعدّينا من one إلى ten.",
    "ask": {"greeting": "هلا {name}! عندك سؤال عن الحروف أو الألوان بالإنجليزي؟ أنا أسمعك.", "scope": "الإنجليزية الصف الأول: الحروف الكبيرة والصغيرة وأصواتها، أول حرف في الكلمة، الألوان الأساسية، العد من one إلى ten. اشرح بالعربي وأعطِ الكلمة الإنجليزية."},
}
write(build(spec), "en")
