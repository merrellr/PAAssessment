"""Lesson audio, step 2: narrate tools/lesson-audio/scripts.json into audio/lessons/<course>-<n>.mp3.

Same voice as Product+ Audio on www: Kokoro (open-source, run locally, no cost, no API key), voice "am_michael".
Writes audio/lessons/index.json: { "<course>-<n>": { "duration": seconds, "bytes": n, "hash": "..." } }.
lesson.html reads it to show "Listen to this lesson". A lesson is only narrated again when its script changes.

Setup (once):
    python3 -m venv ~/tts && . ~/tts/bin/activate && pip install kokoro-onnx soundfile
    download kokoro-v1.0.onnx and voices-v1.0.bin from
    https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0 into a folder
Run (from the repo root, after step 1, tools/lesson-audio/extract-scripts.mjs):
    python tools/lesson-audio/narrate.py --models <that folder> [course-or-course-n ...]
"""
import argparse, hashlib, json, os, re, subprocess, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPTS = os.path.join(ROOT, 'tools', 'lesson-audio', 'scripts.json')
OUT = os.path.join(ROOT, 'audio', 'lessons')
VOICE, SPEED, RATE = 'am_michael', 1.0, 24000

# Words the voice gets wrong as written. Short forms (AI, PM, KPIs...) are in LEX below, not here: spelled with dots
# ("A.I.") the voice stops after every letter. Same rules as Product+ Audio on www (src/audio/make_audio.py).
SAY = [
    (r'\bB2B\b', 'B to B'), (r'\bRICE\b', 'rice'), (r'\bICE\b', 'ice'),
    (r'\be\.g\.', 'for example'), (r'\bi\.e\.', 'that is'), (r'\bvs\.?', 'versus'), (r'\s*&\s*', ' and '),
    (r'(\d)%', r'\1 percent'), (r'\s*—\s*', ', '), (r'(\d)\s*–\s*(\d)', r'\1 to \2'), (r'\s*–\s*', ', '), (r'→', ' to '), (r'×', ' times '),
    (r'\b24/7\b', 'twenty four seven'), (r'\bA/B\b', 'A B'), (r'(\d)\.0\b', r'\1 point oh'),
    (r'(\d)\s?GB(?=\s+(?:[A-Z]|i[A-Z]))', r'\1 gigabyte'), (r'(\d)\s?TB(?=\s+(?:[A-Z]|i[A-Z]))', r'\1 terabyte'),
    (r'(\d)\s?GB\b', r'\1 gigabytes'), (r'(\d)\s?TB\b', r'\1 terabytes'),
]

# Short forms said as letters, as one word with no gap. Spelled "A.I." the voice stops after every letter,
# and "PMs", "LLMs", "KPIs" lose their "s", so each is given its sound directly (IPA, as the voice's own lexicon writes it).
LEX = {
    'AI': 'ˌeɪˈaɪ', 'AIs': 'ˌeɪˈaɪz', "AI's": 'ˌeɪˈaɪz',
    'PM': 'pˌiːˈɛm', 'PMs': 'pˌiːˈɛmz', "PM's": 'pˌiːˈɛmz',
    'KPI': 'kˌeɪpˌiːˈaɪ', 'KPIs': 'kˌeɪpˌiːˈaɪz',
    'LLM': 'ˌɛlˌɛlˈɛm', 'LLMs': 'ˌɛlˌɛlˈɛmz',
    'MVP': 'ˌɛmvˌiːpˈiː', 'MVPs': 'ˌɛmvˌiːpˈiːz',
    'PRD': 'pˌiːˌɑːɹdˈiː', 'PRDs': 'pˌiːˌɑːɹdˈiːz',
    'OKR': 'ˌoʊkˌeɪˈɑːɹ', 'OKRs': 'ˌoʊkˌeɪˈɑːɹz',
    'UX': 'jˌuːˈɛks', 'EHR': 'ˌiːˌeɪtʃˈɑːɹ', 'EHRs': 'ˌiːˌeɪtʃˈɑːɹz', 'ROI': 'ˌɑːɹˌoʊˈaɪ',
    'QA': 'kjˌuːˈeɪ', 'UI': 'jˌuːˈaɪ', 'CSAT': 'sˈiːsˌæt', 'B2C': 'bˌiːtəsˈiː', 'SSO': 'ˌɛsˌɛsˈoʊ', 'SaaS': 'sˈæs', 'HIPAA': 'hˈɪpə', 'MoSCoW': 'mˈɑːskaʊ',
}
LEX_RE = re.compile(r"(?<![\w'])(" + '|'.join(sorted(map(re.escape, LEX), key=len, reverse=True)) + r")(?![\w'])")

ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'x x twenty thirty forty fifty sixty seventy eighty ninety'.split()


def words(n):
    return ONES[n] if n < 20 else TENS[n // 10] + ('' if n % 10 == 0 else ' ' + ONES[n % 10])


def say_year(m):
    """2026 -> twenty twenty six, 1983 -> nineteen eighty three, the 1980s -> nineteen eighties (2000-2009 read fine as is)."""
    y, plural = int(m.group(1)), m.group(2)
    if 2000 <= y <= 2009 and not plural:
        return m.group(0)
    hi, lo = divmod(y, 100)
    if plural and lo % 10 == 0:
        last = TENS[lo // 10][:-1] + 'ies' if lo >= 20 else 'hundreds'
        return words(hi) + ' ' + last
    return words(hi) + ' ' + ('hundred' if lo == 0 else ('oh ' + ONES[lo] if lo < 10 else words(lo))) + (plural or '')


def say_clock(m):
    """7:10 AM -> 7 10 AM; 11:00 AM -> 11 AM; 8:05 -> 8 oh 5. Without AM/PM or "at", 4:30 is a time taken (4 minutes 30)."""
    before, h, mm, ampm = m.group(1) or '', int(m.group(2)), int(m.group(3)), m.group(4) or ''
    if ampm or before.strip().lower() in ('at', 'a', 'by', 'until'):
        mins = '' if mm == 0 else (' oh ' + ONES[mm] if mm < 10 else ' ' + words(mm))
        return before + str(h) + mins + ampm
    return before + str(h) + (' minute' if h == 1 else ' minutes') + ('' if mm == 0 else ' ' + words(mm))


YEAR = re.compile(r'(?<![\d$,.])\b(19[0-9]{2}|20[0-9]{2})(s?)\b(?![,.]\d)')
CLOCK = re.compile(r'(\b\w+\s)?\b(\d{1,2}):(\d{2})\b(\s?(?:AM|PM|am|pm|a\.m\.|p\.m\.))?')


# Same rule as Product+ Audio on www (src/audio/make_audio.py).
MONEY = re.compile(r'(\b(?:[Aa]n?|[Tt]he)\s+)?\$(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?(\s?(?:thousand|million|billion|trillion)\b|[kK]\b|M\b|B\b|bn\b)?(?=(\s+[A-Z])?)')
SCALE = {'k': 'thousand', 'K': 'thousand', 'M': 'million', 'B': 'billion', 'bn': 'billion'}


def say_money(m):
    """"$500" is read "500 dollars", not "dollar 500". $21.99 -> 21 dollars and 99 cents; $5.9 billion -> 5.9 billion dollars.
    In a title or after a/an/the ("The $100 Staircase", "a $200 phone") it describes the next word: 100 dollar, 3 dollar 67."""
    art, whole, cents, scale, title_next = m.group(1) or '', m.group(2), m.group(3), m.group(4), m.group(5)
    if cents and len(cents) == 1:
        cents += '0'
    if scale:
        word = SCALE.get(scale.strip(), scale.strip())
        return art + whole + ('.' + cents.rstrip('0') if cents and cents.rstrip('0') else '') + ' ' + word + (' dollar' if art else ' dollars')
    n = int(whole.replace(',', '') or 0)
    if art or title_next:
        return art + whole + ' dollar' + (' ' + cents if cents and cents != '00' else '')
    if n == 0 and cents:
        return str(int(cents)) + (' cent' if int(cents) == 1 else ' cents')
    out = whole + (' dollar' if n == 1 else ' dollars')
    if cents and cents != '00':
        out += ' and ' + str(int(cents)) + (' cent' if int(cents) == 1 else ' cents')
    return out


def clean(s):
    s = MONEY.sub(say_money, s)
    s = CLOCK.sub(say_clock, s)
    s = YEAR.sub(say_year, s)
    for a, b in SAY:
        s = re.sub(a, b, s)
    s = re.sub(r'\s+', ' ', s).strip()
    if s and s[-1] not in '.!?:;"\'”’)':
        s += '.'
    return s


def script(course_title, lesson):
    title = re.sub(r'^Lesson (\d+):\s*', r'Lesson \1. ', lesson['title'])
    return [clean(course_title.replace(' — ', ', ')), clean(title)] + [clean(x) for x in lesson['lines']]


def script_hash(lines):
    return hashlib.sha256(json.dumps([VOICE, SPEED, LEX, lines]).encode()).hexdigest()[:16]


def phonemes(kokoro, text):
    """The line as phonemes, with the LEX words given their fixed sound and the rest from the voice's own lexicon."""
    out = []
    for i, part in enumerate(LEX_RE.split(text)):
        if i % 2:
            out.append(LEX[part])
        elif part.strip():
            lead, trail = part[:1].isspace() or part[:1] == '-', part[-1:].isspace() or part[-1:] == '-'
            core = part.strip(' -')
            ph = kokoro.tokenizer.phonemize(core, 'en-us') if re.search(r'\w', core) else core
            out.append((' ' if lead else '') + ph + (' ' if trail else ''))
        else:
            out.append(' ' if part else '')
    return re.sub(r' +', ' ', ''.join(out)).strip()



def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--models', required=True)
    ap.add_argument('--force', action='store_true')
    ap.add_argument('only', nargs='*')
    o = ap.parse_args()
    import numpy as np, soundfile as sf
    from kokoro_onnx import Kokoro
    kokoro = Kokoro(os.path.join(o.models, 'kokoro-v1.0.onnx'), os.path.join(o.models, 'voices-v1.0.bin'))
    data = json.load(open(SCRIPTS))
    os.makedirs(OUT, exist_ok=True)
    index_path = os.path.join(OUT, 'index.json')
    index = json.load(open(index_path)) if os.path.exists(index_path) else {}
    for course in sorted(data):
        for lesson in data[course]['lessons']:
            key = f"{course}-{lesson['n']}"
            if o.only and course not in o.only and key not in o.only:
                continue
            lines = script(data[course]['title'], lesson)
            h = script_hash(lines)
            if not o.force and index.get(key, {}).get('hash') == h and os.path.exists(os.path.join(OUT, key + '.mp3')):
                continue
            parts, times, t = [], [], 0.0
            for i, line in enumerate(lines):
                samples, sr = kokoro.create(phonemes(kokoro, line), voice=VOICE, speed=SPEED, is_phonemes=True)
                d, gap = len(samples) / RATE, (0.55 if i == 1 else 0.2)
                times.append([round(t, 2), round(t + d, 2)])
                parts += [samples.astype(np.float32), np.zeros(int(gap * RATE), dtype=np.float32)]
                t += d + gap
            audio = np.concatenate(parts)
            mp3 = os.path.join(OUT, key + '.mp3')
            with tempfile.TemporaryDirectory() as d:
                wav = os.path.join(d, 'a.wav')
                sf.write(wav, audio, RATE)
                subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '48k',
                                '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact',
                                '-metadata', 'title=' + lesson['title'], '-metadata', 'artist=Product Advisory',
                                '-metadata', 'album=' + data[course]['title'], mp3], check=True)
            # when each line is read, for the read-along on the lesson page: [[start, end], ...], one per script line
            # (the first two are the course and lesson titles)
            os.makedirs(os.path.join(OUT, 'lines'), exist_ok=True)
            with open(os.path.join(OUT, 'lines', key + '.json'), 'w') as f:
                json.dump(times, f, separators=(',', ':'))
            index[key] = {'duration': round(len(audio) / RATE, 1), 'bytes': os.path.getsize(mp3), 'hash': h, 'lines': len(times)}
            with open(index_path, 'w') as f:
                json.dump(dict(sorted(index.items())), f, indent=1)
            print('narrated', key, index[key]['duration'], 's', flush=True)
    # drop lessons that no longer exist
    keys = {f"{c}-{l['n']}" for c in data for l in data[c]['lessons']}
    for k in [k for k in index if k not in keys]:
        index.pop(k)
        for f in (k + '.mp3', os.path.join('lines', k + '.json')):
            try:
                os.remove(os.path.join(OUT, f))
            except OSError:
                pass
    with open(index_path, 'w') as f:
        json.dump(dict(sorted(index.items())), f, indent=1)


if __name__ == '__main__':
    main()
