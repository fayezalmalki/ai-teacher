"""الصف السادس الابتدائي · الإنجليزية · Present continuous, future (going to / will), reading a short text."""
from builder import *

READ = table(["Sara's day"], [["Sara wakes up at six."], ["She eats breakfast with her family."], ["She goes to school by bus."], ["After school she reads stories."], ["She plays with her cat."]])
spec = {
    "id": "g6en", "title": "المضارع المستمر والمستقبل والقراءة", "subject": "الإنجليزية", "subjectId": "en", "gradeLabel": "الصف السادس الابتدائي",
    "intro": {
        "text": "هلا {name}، اليوم نراجع المضارع المستمر والمستقبل ونقرأ نصًا قصيرًا. سؤال سريع: أكمل: Look! The boy … football now.",
        "visual": word("Look! The boy … football now.", caption="⚽ الآن"),
        "choicesB": [ch("is playing", True), ch("plays"), ch("played")],
        "responses": {"correct": "is playing", "unclear": "امم… plays؟", "strong": "is playing، لأن الشيء يصير الآن"},
        "a1": "ممتاز 👏 The boy is playing: الشيء يصير الآن، فنستخدم is + الفعل مع ing.",
        "b1Adapt": "بدأ المعلم بقاعدة am/is/are + ing",
        "b2": "كلمة now تعني الآن، والفعل الذي يصير الآن نحط معه is وing. play يصير…",
        "b2r": "is + play + ing = … The boy … football now.",
        "b3": "ممتاز، is playing. الحين نكمل.",
    },
    "concepts": [
        {"id": "continuous", "name": "المضارع المستمر", "ok": "صح عليك 👏 المضارع المستمر مضبوط. الحين المستقبل.",
         "r": "قريب. المضارع المستمر للشيء الذي يصير الآن: am/is/are + الفعل + ing. I am reading، She is cooking، They are playing. والنفي نحط not: She is not cooking. والسؤال نقدّم الفعل: Are you reading?", "rStrategy": "continuous_rule", "rAdapt": "أعاد المعلم قاعدة am/is/are + ing",
         "pool": [
            [mc("c-1a", "أكمل: I … a book now. 📖", word("I … a book now.", caption="📖 الآن"), "am reading", "read", "reads"),
             mc("c-1b", "أكمل: They … in the garden now. ⚽", word("They … in the garden now.", caption="⚽ الآن"), "are playing", "is playing", "play")],
            [mc("c-2a", "أكمل: My mother … dinner now. 🍲", word("My mother … dinner now.", caption="🍲 الآن"), "is cooking", "cooks", "are cooking"),
             mc("c-2b", "النفي الصحيح هو…", cards(["He is not sleeping.", "He not is sleeping.", "He isn't sleep."]), "He is not sleeping.", "He not is sleeping.", "He isn't sleep.")],
            [mc("c-3a", "السؤال الصحيح هو…", cards(["Are you listening?", "You are listening?", "Do you listening?"]), "Are you listening?", "You are listening?", "Do you listening?"),
             mc("c-3b", "أي جملة تصف شيئًا يحدث الآن؟", cards(["She is writing now.", "She writes every day.", "She wrote yesterday."]), "She is writing now.", "She writes every day.", "She wrote yesterday.")],
         ]},
        {"id": "future", "name": "المستقبل", "ok": "ممتاز، المستقبل مضبوط. باقي القراءة.",
         "r": "لا بأس. للمستقبل نستخدم will + الفعل: I will visit. أو going to للخطة: I am going to visit my uncle tomorrow. وكلمات المستقبل: tomorrow بكرة، next week الأسبوع الجاي.", "rStrategy": "future_rule", "rAdapt": "أعاد المعلم will وgoing to",
         "pool": [
            [mc("f-1a", "أكمل: Tomorrow I … my uncle.", word("Tomorrow I … my uncle.", caption="👨 بكرة"), "will visit", "visited", "visit"),
             mc("f-1b", "كلمة tomorrow تعني…", word("tomorrow"), "بكرة", "أمس", "الآن")],
            [mc("f-2a", "أكمل: We … to travel next week. ✈️", word("We … to travel next week.", caption="✈️"), "are going", "went", "go"),
             mc("f-2b", "أكمل: It … rain tomorrow. 🌧️", word("It … rain tomorrow.", caption="🌧️"), "will", "is", "was")],
            [mc("f-3a", "الجملة الصحيحة هي…", cards(["She is going to study.", "She going to study.", "She is going to studies."]), "She is going to study.", "She going to study.", "She is going to studies."),
             mc("f-3b", "النفي الصحيح: I … go out tonight.", word("I … go out tonight.", caption="🌙 ❌"), "won't", "didn't", "am not")],
         ]},
        {"id": "reading", "name": "القراءة", "ok": "ممتاز يا {name}، خلصت المضارع المستمر والمستقبل والقراءة.",
         "r": "قريب. لما نقرأ نصًا: نقرأ السؤال أولًا، ثم ندور على الكلمة المهمة في النص، والجواب يكون قريب منها. النص عن Sara ويومها.", "rStrategy": "reading_strategy", "rAdapt": "أعاد المعلم قراءة النص جملة جملة",
         "pool": [
            [mc("r-1a", "اقرأ: Sara wakes up at six. متى تصحو Sara؟", READ, "at six", "at seven", "at eight"),
             mc("r-1b", "How does Sara go to school?", READ, "by bus", "by car", "on foot")],
            [mc("r-2a", "What does Sara do after school?", READ, "She reads stories.", "She sleeps.", "She goes to the park."),
             mc("r-2b", "Who does Sara eat breakfast with?", READ, "her family", "her friends", "her teacher")],
            [mc("r-3a", "What animal does Sara have?", READ, "a cat", "a dog", "a bird"),
             mc("r-3b", "العنوان المناسب للنص هو…", READ, "Sara's day", "Sara's cat", "The school bus")],
         ]},
    ],
    "bonus": {"text": "سؤال أخير: أكمل: Listen! The birds … 🐦🎵", "visual": word("Listen! The birds …", caption="🐦🎵 الآن"), "ok": "are singing", "wrong": "sing", "retry": "Listen يعني الشيء يصير الآن: are + sing + ing. The birds…", "concept": "continuous"},
    "explain": [
        {"text": "المضارع المستمر للشيء الذي يصير الآن: am/is/are + الفعل + ing.", "visual": cards([{"label": "I am reading", "icon": "📖"}, {"label": "She is cooking", "icon": "🍲"}, {"label": "They are playing", "icon": "⚽"}])},
        {"text": "النفي نحط not: She is not cooking. والسؤال نقدّم الفعل: Are you reading?", "visual": cards(["She is not cooking.", "Are you reading?"])},
        {"text": "المستقبل بـ will + الفعل: It will rain tomorrow. أو going to للخطة: I am going to visit my uncle.", "visual": cards([{"label": "will visit", "sub": "tomorrow"}, {"label": "is going to study", "sub": "next week"}])},
        {"text": "كلمات الزمن: now الآن، tomorrow بكرة، next week الأسبوع الجاي، yesterday أمس.", "visual": cards([{"label": "now", "sub": "الآن"}, {"label": "tomorrow", "sub": "بكرة"}, {"label": "next week", "sub": "الأسبوع الجاي"}, {"label": "yesterday", "sub": "أمس"}])},
        {"text": "نقرأ نصًا قصيرًا عن Sara: نقرأ السؤال أولًا، ثم ندور على الكلمة المهمة في النص.", "visual": READ},
    ],
    "doneNote": "راجعت المضارع المستمر، والمستقبل بـ will وgoing to، وقرأت نصًا وأجبت عن أسئلته.",
    "endLine": "ممتاز يا {name}. اليوم راجعنا المضارع المستمر بـ ing، والمستقبل بـ will وgoing to، وقرأنا نصًا عن Sara وأجبنا عن أسئلته.",
    "ask": {"greeting": "هلا {name}! عندك سؤال عن ing أو will أو عن النص؟ أنا أسمعك.", "scope": "الإنجليزية الصف السادس: المضارع المستمر am/is/are + ing والنفي والسؤال، المستقبل بـ will وgoing to وكلمات الزمن، قراءة نص قصير والإجابة عن أسئلة Who وWhat وWhen وHow. اشرح بالعربي وأعطِ الأمثلة بالإنجليزي."},
}
write(build(spec), "en")
