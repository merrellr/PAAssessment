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

# Words the voice gets wrong as written.
SAY = [
    (r'\bSaaS\b', 'sass'), (r'\bPMs\b', 'P.M.s'), (r'\bPM\b', 'P.M.'), (r'\bAI\b', 'A.I.'), (r'\bUX\b', 'U.X.'), (r'\bUI\b', 'U.I.'),
    (r'\bMVPs\b', 'M.V.P.s'), (r'\bMVP\b', 'M.V.P.'), (r'\bKPIs\b', 'K.P.I.s'), (r'\bKPI\b', 'K.P.I.'), (r'\bOKRs\b', 'O.K.R.s'), (r'\bOKR\b', 'O.K.R.'),
    (r'\bSSO\b', 'S.S.O.'), (r'\bCEO\b', 'C.E.O.'), (r'\bCTO\b', 'C.T.O.'), (r'\bCPO\b', 'C.P.O.'), (r'\bB2B\b', 'B to B'), (r'\bB2C\b', 'B to C'),
    (r'\bLLMs\b', 'L.L.M.s'), (r'\bLLM\b', 'L.L.M.'), (r'\bRICE\b', 'rice'), (r'\bICE\b', 'ice'), (r'\bIT\b', 'I.T.'), (r'\bCSAT\b', 'C-sat'),
    (r'\bHIPAA\b', 'hippa'), (r'\be\.g\.', 'for example'), (r'\bi\.e\.', 'that is'), (r'\bvs\.?', 'versus'), (r'\s*&\s*', ' and '),
    (r'(\d)%', r'\1 percent'), (r'\s*—\s*', ', '), (r'(\d)\s*–\s*(\d)', r'\1 to \2'), (r'\s*–\s*', ', '), (r'→', ' to '), (r'×', ' times '),
]


def clean(s):
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
    return hashlib.sha256(json.dumps([VOICE, SPEED, lines]).encode()).hexdigest()[:16]


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
            parts = []
            for i, line in enumerate(lines):
                samples, sr = kokoro.create(line, voice=VOICE, speed=SPEED, lang='en-us')
                parts += [samples.astype(np.float32), np.zeros(int((0.55 if i == 1 else 0.2) * RATE), dtype=np.float32)]
            audio = np.concatenate(parts)
            mp3 = os.path.join(OUT, key + '.mp3')
            with tempfile.TemporaryDirectory() as d:
                wav = os.path.join(d, 'a.wav')
                sf.write(wav, audio, RATE)
                subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '48k',
                                '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact',
                                '-metadata', 'title=' + lesson['title'], '-metadata', 'artist=Product Advisory',
                                '-metadata', 'album=' + data[course]['title'], mp3], check=True)
            index[key] = {'duration': round(len(audio) / RATE, 1), 'bytes': os.path.getsize(mp3), 'hash': h}
            with open(index_path, 'w') as f:
                json.dump(dict(sorted(index.items())), f, indent=1)
            print('narrated', key, index[key]['duration'], 's', flush=True)
    # drop lessons that no longer exist
    keys = {f"{c}-{l['n']}" for c in data for l in data[c]['lessons']}
    for k in [k for k in index if k not in keys]:
        index.pop(k)
        try:
            os.remove(os.path.join(OUT, k + '.mp3'))
        except OSError:
            pass
    with open(index_path, 'w') as f:
        json.dump(dict(sorted(index.items())), f, indent=1)


if __name__ == '__main__':
    main()
