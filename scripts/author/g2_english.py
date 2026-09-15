"""الصف الثاني الابتدائي · الإنجليزية · Words (family, school, animals), simple sentences, numbers to 20."""
from builder import *

FAMILY = cards([{"label": "father", "icon": "👨", "sub": "أب"}, {"label": "mother", "icon": "👩", "sub": "أم"}, {"label": "brother", "icon": "👦", "sub": "أخ"}, {"label": "sister", "icon": "👧", "sub": "أخت"}])
SCHOOL = cards([{"label": "book", "icon": "📖"}, {"label": "pen", "icon": "🖊️"}, {"label": "bag", "icon": "🎒"}, {"label": "desk", "icon": "🪑"}])
spec = {
    "id": "g2en", "title": "الكلمات والجمل البسيطة", "subject": "الإنجليزية", "subjectId": "en", "gradeLabel": "الصف الثاني الابتدائي",
    "intro": {
        "text": "هلا {name}، اليوم نراجع كلمات وجمل بالإنجليزي. سؤال سريع: كلمة book معناها…",
        "visual": word("book", caption="📖"),
        "choicesB": [ch("كتاب", True), ch("قلم"), ch("حقيبة")],
        "responses": {"correct": "كتاب", "unclear": "امم… قلم؟", "strong": "كتاب، وpen قلم"},
        "a1": "ممتاز 👏 book يعني كتاب. This is a book: هذا كتاب.",
        "b1Adapt": "بدأ المعلم بكلمات المدرسة واحدة واحدة",
        "b2": "شوف الصورة: 📖. نقرأ فيه ونحمله للمدرسة. book هو…",
        "b2r": "book… 📖… الشيء الذي نقرأ فيه هو…",
        "b3": "ممتاز، book كتاب. الحين نكمل.",
    },
    "concepts": [
        {"id": "words", "name": "الكلمات", "ok": "صح عليك 👏 كلماتك ممتازة. الحين الجمل.",
         "r": "قريب. كلمات العائلة: father أب، mother أم، brother أخ، sister أخت. وكلمات المدرسة: book كتاب، pen قلم، bag حقيبة. والحيوانات: cat قطة، dog كلب، bird طائر.", "rStrategy": "recite_words", "rAdapt": "أعاد المعلم الكلمات مع الصور",
         "pool": [
            [mc("w-1a", "كلمة mother تعني…", word("mother", caption="👩"), "أم", "أب", "أخت"),
             mc("w-1b", "القلم بالإنجليزي…", cards([{"label": "pen", "icon": "🖊️"}, {"label": "bag", "icon": "🎒"}, {"label": "book", "icon": "📖"}]), "pen", "bag", "book")],
            [mc("w-2a", "أي كلمة تعني «أخ»؟", cards(["brother", "sister", "father"]), "brother", "sister", "father"),
             mc("w-2b", "الطائر 🐦 بالإنجليزي…", cards([{"label": "bird", "icon": "🐦"}, {"label": "fish", "icon": "🐟"}, {"label": "cat", "icon": "🐱"}]), "bird", "fish", "cat")],
            [mc("w-3a", "أي كلمة ليست من العائلة؟", cards(["father", "sister", "desk"]), "desk", "father", "sister"),
             mc("w-3b", "الكلمة التي تعني «حقيبة» هي…", word("b_g", [1], "🎒"), "bag", "big", "bug")],
         ]},
        {"id": "sentences", "name": "الجمل", "ok": "ممتاز، جملك مرتبة. باقي الأعداد.",
         "r": "لا بأس. الجملة البسيطة: This is a book هذا كتاب. وقبل الاسم نحط a، وإذا بدأ بصوت a e i o u نحط an: an apple. وأنا عندي: I have a pen.", "rStrategy": "sentence_pattern", "rAdapt": "أعاد المعلم نمط الجملة This is a…",
         "pool": [
            [mc("s-1a", "This is a … 🐱", word("This is a …", caption="🐱"), "cat", "book", "pen"),
             mc("s-1b", "جملة This is a bag تعني…", word("This is a bag.", caption="🎒"), "هذه حقيبة", "هذا كتاب", "هذا قلم")],
            [mc("s-2a", "نقول: … apple 🍎", word("… apple", caption="🍎"), "an", "a", "the"),
             mc("s-2b", "أكمل: I … a pen.", word("I … a pen.", caption="🖊️"), "have", "am", "is")],
            [mc("s-3a", "اختر الجملة المرتبة:", cards(["This is a dog.", "Dog a this is."]), "This is a dog.", "Dog a this is."),
             mc("s-3b", "أكمل: My … is a doctor. 👩‍⚕️", word("My … is a doctor.", caption="👩‍⚕️ أمي"), "mother", "book", "cat")],
         ]},
        {"id": "numbers", "name": "الأعداد", "ok": "ممتاز يا {name}، خلصت الكلمات والجمل والأعداد.",
         "r": "قريب. بعد ten نكمل: eleven 11، twelve 12، thirteen 13… عشرين twenty. ونسأل كم: How many? ونجاوب بالعدد.", "rStrategy": "count_aloud", "rAdapt": "عدّ المعلم من eleven إلى twenty ببطء",
         "pool": [
            [mc("n-1a", "How many? 🍎🍎🍎", cards(["🍎", "🍎", "🍎"]), "three", "two", "four"),
             mc("n-1b", "العدد 12 بالإنجليزي…", word("12"), "twelve", "eleven", "twenty")],
            [mc("n-2a", "twenty يساوي…", word("twenty"), "20", "12", "2"),
             mc("n-2b", "العدد الذي يأتي بعد ten هو…", word("ten", caption="10"), "eleven", "twelve", "nine")],
            [mc("n-3a", "fifteen يساوي…", word("fifteen"), "15", "50", "5"),
             mc("n-3b", "ten + ten = ؟", word("10 + 10 = ?"), "twenty", "twelve", "eleven")],
         ]},
    ],
    "bonus": {"text": "سؤال أخير: This is a … 🐶", "visual": word("This is a …", caption="🐶"), "ok": "dog", "wrong": "cat", "retry": "🐶 كلب بالإنجليزي… This is a…", "concept": "sentences"},
    "explain": [
        {"text": "كلمات العائلة: father أب، mother أم، brother أخ، sister أخت.", "visual": FAMILY},
        {"text": "كلمات المدرسة: book كتاب، pen قلم، bag حقيبة، desk مكتب.", "visual": SCHOOL},
        {"text": "الجملة البسيطة: This is a book يعني هذا كتاب. وقبل الاسم نحط a، وإذا بدأ بصوت a e i o u نحط an: an apple.", "visual": cards([{"label": "a book", "icon": "📖"}, {"label": "an apple", "icon": "🍎"}])},
        {"text": "عندي كذا: I have a pen. I have a bag.", "visual": word("I have a pen.", caption="🖊️")},
        {"text": "الأعداد من 11 إلى 20: eleven, twelve, thirteen, fourteen, fifteen… twenty.", "visual": cards([{"label": "eleven", "sub": "11"}, {"label": "twelve", "sub": "12"}, {"label": "thirteen", "sub": "13"}, {"label": "fifteen", "sub": "15"}, {"label": "twenty", "sub": "20"}])},
    ],
    "doneNote": "راجعت كلمات العائلة والمدرسة، والجمل البسيطة، والأعداد حتى 20.",
    "endLine": "ممتاز يا {name}. اليوم راجعنا كلمات العائلة والمدرسة، وركّبنا جملًا بـ This is a…، وعدّينا إلى twenty.",
    "ask": {"greeting": "هلا {name}! عندك سؤال عن كلمة أو جملة بالإنجليزي؟ أنا أسمعك.", "scope": "الإنجليزية الصف الثاني: كلمات العائلة والمدرسة والحيوانات، الجملة البسيطة This is a / I have a، أداتا a وan، الأعداد من eleven إلى twenty وسؤال How many. اشرح بالعربي وأعطِ الكلمة الإنجليزية."},
}
write(build(spec), "en")
