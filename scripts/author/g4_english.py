"""الصف الرابع الابتدائي · الإنجليزية · Present simple, time and days, prepositions of place."""
from builder import *

DAYS = cards([{"label": "Monday", "sub": "الاثنين"}, {"label": "Tuesday", "sub": "الثلاثاء"}, {"label": "Wednesday", "sub": "الأربعاء"}, {"label": "Thursday", "sub": "الخميس"}, {"label": "Friday", "sub": "الجمعة"}])
PLACES = cards([{"label": "in", "icon": "📦", "sub": "في"}, {"label": "on", "icon": "🪑", "sub": "على"}, {"label": "under", "icon": "⬇️", "sub": "تحت"}, {"label": "next to", "icon": "↔️", "sub": "بجانب"}])
spec = {
    "id": "g4en", "title": "المضارع البسيط والوقت والأماكن", "subject": "الإنجليزية", "subjectId": "en", "gradeLabel": "الصف الرابع الابتدائي",
    "intro": {
        "text": "هلا {name}، اليوم نراجع المضارع البسيط والوقت والأماكن. سؤال سريع: أكمل: She … to school every day.",
        "visual": word("She … to school every day.", caption="🏫"),
        "choicesB": [ch("goes", True), ch("go"), ch("going")],
        "responses": {"correct": "goes", "unclear": "امم… go؟", "strong": "goes، لأن مع She نضيف s"},
        "a1": "ممتاز 👏 She goes to school: مع He وShe وIt نضيف s للفعل.",
        "b1Adapt": "بدأ المعلم بقاعدة الـ s مع He/She/It",
        "b2": "في المضارع البسيط: I go، You go، لكن She go…s. أكمل: She … to school.",
        "b2r": "مع She نضيف s: go + s = … She … to school.",
        "b3": "ممتاز، goes. الحين نكمل.",
    },
    "concepts": [
        {"id": "present", "name": "المضارع البسيط", "ok": "صح عليك 👏 المضارع البسيط مضبوط. الحين الوقت والأيام.",
         "r": "قريب. المضارع البسيط للعادات: I play every day. مع He وShe وIt نضيف s: He plays. والنفي: I don't play، She doesn't play. والسؤال: Do you play? Does she play?", "rStrategy": "present_rule", "rAdapt": "أعاد المعلم قاعدة المضارع البسيط والنفي",
         "pool": [
            [mc("t-1a", "أكمل: I … football every Friday. ⚽", word("I … football every Friday.", caption="⚽"), "play", "plays", "playing"),
             mc("t-1b", "أكمل: He … milk. 🥛", word("He … milk.", caption="🥛"), "drinks", "drink", "drinking")],
            [mc("t-2a", "النفي الصحيح: I … like fish.", word("I … like fish.", caption="🐟 ❌"), "don't", "doesn't", "not"),
             mc("t-2b", "النفي الصحيح: She … eat meat.", word("She … eat meat.", caption="🥩 ❌"), "doesn't", "don't", "not")],
            [mc("t-3a", "السؤال الصحيح هو…", cards(["Does he play?", "Do he play?", "Does he plays?"]), "Does he play?", "Do he play?", "Does he plays?"),
             mc("t-3b", "أكمل: My father … in a hospital. 🏥", word("My father … in a hospital.", caption="🏥"), "works", "work", "working")],
         ]},
        {"id": "time", "name": "الوقت والأيام", "ok": "ممتاز، الوقت والأيام مضبوطة. باقي الأماكن.",
         "r": "لا بأس. نسأل عن الوقت: What time is it? ونجاوب: It's three o'clock الساعة ثلاث. والنص: half past three، والربع: quarter past three. وأيام الأسبوع تبدأ بحرف كبير: Sunday، Monday…", "rStrategy": "time_rule", "rAdapt": "أعاد المعلم قراءة الساعة وأيام الأسبوع",
         "pool": [
            [mc("m-1a", "«It's three o'clock» تعني…", word("3:00", caption="🕒"), "الساعة ثلاث", "الساعة ثلاث ونص", "الساعة ثلاث وربع"),
             mc("m-1b", "يوم الجمعة بالإنجليزي…", cards(["Friday", "Thursday", "Saturday"]), "Friday", "Thursday", "Saturday")],
            [mc("m-2a", "الساعة 3:30 نقول…", word("3:30", caption="🕞"), "half past three", "three o'clock", "quarter past three"),
             mc("m-2b", "اليوم الذي يأتي بعد Monday هو…", DAYS, "Tuesday", "Sunday", "Wednesday")],
            [mc("m-3a", "الساعة 7:15 نقول…", word("7:15", caption="🕖"), "quarter past seven", "half past seven", "seven o'clock"),
             mc("m-3b", "نسأل عن الوقت بـ…", cards(["What time is it?", "Where is it?", "How old is it?"]), "What time is it?", "Where is it?", "How old is it?")],
         ]},
        {"id": "places", "name": "الأماكن", "ok": "ممتاز يا {name}، خلصت المضارع البسيط والوقت والأماكن.",
         "r": "قريب. حروف المكان: in في (داخل)، on على (فوق السطح)، under تحت، next to بجانب، between بين. The cat is under the desk: القطة تحت المكتب.", "rStrategy": "prepositions", "rAdapt": "أعاد المعلم حروف المكان مع الصور",
         "pool": [
            [mc("l-1a", "الكتاب على المكتب: The book is … the desk.", word("The book is … the desk.", caption="📖 فوق 🪑"), "on", "in", "under"),
             mc("l-1b", "القلم في الحقيبة: The pen is … the bag.", word("The pen is … the bag.", caption="🖊️ داخل 🎒"), "in", "on", "under")],
            [mc("l-2a", "القطة تحت الطاولة: The cat is … the table.", word("The cat is … the table.", caption="🐱 تحت"), "under", "on", "next to"),
             mc("l-2b", "«next to» تعني…", word("next to"), "بجانب", "تحت", "بين")],
            [mc("l-3a", "الكرة بين الكرسيين: The ball is … the chairs.", word("The ball is … the chairs.", caption="🪑⚽🪑"), "between", "under", "in"),
             mc("l-3b", "أين القطة؟ Where is the cat? — It is … the box. 📦🐱", word("It is … the box.", caption="🐱 داخل 📦"), "in", "on", "between")],
         ]},
    ],
    "bonus": {"text": "سؤال أخير: أكمل: We … English on Sunday.", "visual": word("We … English on Sunday.", caption="📚"), "ok": "study", "wrong": "studies", "retry": "مع We ما نضيف s. We … English.", "concept": "present"},
    "explain": [
        {"text": "المضارع البسيط للعادات اليومية: I play، You play، لكن مع He وShe وIt نضيف s: He plays.", "visual": cards([{"label": "I play", "sub": "أنا ألعب"}, {"label": "He plays", "sub": "هو يلعب"}, {"label": "She goes", "sub": "هي تذهب"}])},
        {"text": "النفي: I don't play، She doesn't play. والسؤال: Do you play? Does she play?", "visual": cards(["I don't play.", "She doesn't play.", "Does she play?"])},
        {"text": "الوقت: What time is it? It's three o'clock. والنص half past، والربع quarter past.", "visual": cards([{"label": "3:00", "sub": "three o'clock"}, {"label": "3:15", "sub": "quarter past three"}, {"label": "3:30", "sub": "half past three"}])},
        {"text": "أيام الأسبوع تبدأ بحرف كبير: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.", "visual": DAYS},
        {"text": "حروف المكان: in في، on على، under تحت، next to بجانب.", "visual": PLACES},
    ],
    "doneNote": "راجعت المضارع البسيط، والوقت والأيام، وحروف المكان.",
    "endLine": "ممتاز يا {name}. اليوم راجعنا المضارع البسيط والـ s مع He وShe، وقرأنا الساعة والأيام، وعرفنا in وon وunder.",
    "ask": {"greeting": "هلا {name}! عندك سؤال عن المضارع البسيط أو الساعة؟ أنا أسمعك.", "scope": "الإنجليزية الصف الرابع: المضارع البسيط مع s للغائب والنفي بـ don't/doesn't والسؤال بـ Do/Does، قراءة الساعة o'clock وhalf past وquarter past، أيام الأسبوع، حروف المكان in وon وunder وnext to وbetween. اشرح بالعربي وأعطِ الأمثلة بالإنجليزي."},
}
write(build(spec), "en")
