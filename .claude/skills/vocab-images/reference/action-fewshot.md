# Few-shot examples for actionPrompt drafting

Approved reference set (24 examples). Claude uses this table as few-shot
context when drafting `subject` for new `verbos` entries in `state/drafts.json`
— match this style (short clause, one concrete anchoring prop, no ambiguity
without a caption) rather than inventing a new voice. These rows are already
approved; don't "improve" them when reusing them as context.

Format: the `actionPrompt` column is the text that fills the
`[ACTION_EN, e.g. "..."]` slot in `.claude/prompts/action.md`.

| hiragana | romaji | meaning | actionPrompt |
|---|---|---|---|
| たべる | taberu | comer | eating rice from a bowl with chopsticks, mouth open mid-bite |
| のむ | nomu | beber | drinking water from a glass, tilted back, glass touching lips |
| きく | kiku | escuchar | wearing headphones, eyes closed, listening to music notes floating nearby |
| はなす | hanasu | hablar | two characters facing each other, speech bubble with sound lines (no text) |
| かく | kaku | escribir | writing with a pencil on a notebook, visible pencil lines on the page |
| よむ | yomu | leer | reading an open book, eyes on the page |
| かう | kau | comprar | handing money to a shopkeeper across a counter, receiving a bag |
| うる | uru | vender | standing behind a market stall with price sign, handing a bag, receiving coins |
| あるく | aruku | caminar | mid-stride walking calmly, one foot forward, arms swinging (not running) |
| はしる | hashiru | correr | running with motion lines |
| のる | noru | montar / subir | stepping up into a bus door, hand on railing |
| おきる | okiru | levantarse | sitting up in bed, stretching arms, alarm clock beside bed |
| ねる | neru | dormir | lying in bed asleep, eyes closed, "Zzz" symbol above head |
| いく | iku | ir | walking toward a road/signpost ahead, motion lines behind |
| くる | kuru | venir | walking toward viewer with arms open, waving, approaching |
| かえる | kaeru | regresar | walking toward an open house door, waving |
| あう | au | encontrarse | two characters shaking hands, meeting face to face |
| まつ | matsu | esperar | standing arms crossed, looking at wristwatch, foot tapping |
| しごとする | shigoto suru | trabajar | sitting at desk with laptop and papers, typing |
| べんきょうする | benkyou suru | estudiar | sitting at desk with open book and notebook, pencil in hand |
| あそぶ | asobu | jugar | playing with a ball, joyful expression, mid-action |
| つかう | tsukau | usar | holding and tapping a smartphone screen |
| あける | akeru | abrir | pushing a door open, mid-swing |
| しめる | shimeru | cerrar | pushing a door shut, mid-swing (mirror of abrir) |

## Flagged — not in the few-shot set

| hiragana | romaji | meaning | status |
|---|---|---|---|
| みる | miru | ver / mirar | ⚠️ Too generic ("watching" applies to almost any scene). Needs a specific anchoring prop before it can be drafted — don't auto-draft this one from few-shot alone, ask the user for the anchor first. |
