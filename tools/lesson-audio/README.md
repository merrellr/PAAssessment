# Lesson audio

Each lesson page has a **Listen** bar. It plays `audio/lessons/<course>-<lesson>.mp3` and is shown only for lessons
listed in `audio/lessons/index.json`. The voice is the same as Product+ Audio on www: Kokoro, an open-source model
run locally, voice `am_michael`. There is no API key and no cost.

## After changing a lesson

1. `node tests/ui/run-ui-tests.mjs les`
   This builds the test site that step 2 reads lessons from.
2. `node tools/lesson-audio/extract-scripts.mjs`
   This reads every lesson as a learner sees it and writes `tools/lesson-audio/scripts.json`.
   Practice blocks aren't read out. The narrator names the block and asks the listener to try it on the page.
3. `python tools/lesson-audio/narrate.py --models <folder with kokoro-v1.0.onnx and voices-v1.0.bin>`
   Only lessons whose script changed are narrated again.
4. Commit `audio/lessons/` and `tools/lesson-audio/scripts.json`.

The setup is at the top of `narrate.py`.

## Listen & watch

`listen.html` lists every Product+ article episode. It reads `https://www.productadvisory.co/assets/audio/episodes.json`,
which the www site publishes with the articles, so a new episode appears here by itself. The lesson page's course outline
also shows **Related listening**: the episodes on that course's skill area.
