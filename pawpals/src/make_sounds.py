"""Pre-render the desktop app's synthesized sounds (sound.py) into a compact table for the page:
16 kHz mu-law, base64 -> sound_data.js (window.PawSoundData)."""
import base64
import json
import math
import os
import sys

DESKTOP = os.environ.get("PAWPALS_DESKTOP", os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, DESKTOP)
from desktopcats import sound as S   # noqa: E402

OUT_RATE = 16000


def mulaw(x):
    x = max(-1.0, min(1.0, x))
    mu = 255.0
    y = math.copysign(math.log1p(mu * abs(x)) / math.log1p(mu), x)
    return int(round((y + 1.0) * 127.5)) & 255


def resample(xs, src, dst):
    n = int(len(xs) * dst / src)
    out = []
    for i in range(n):
        t = i * src / dst
        j = int(t)
        f = t - j
        a = xs[j] if j < len(xs) else 0.0
        b = xs[j + 1] if j + 1 < len(xs) else 0.0
        out.append(a + (b - a) * f)
    return out


def main():
    data = {}
    for kind in ("calico", "tabby"):
        specs = S.build_specs("adult", kind)
        for stem, (snd, fn) in specs.items():
            xs = S._fade(S._normalize(fn(), S.LOUD.get(snd, 0.4)))
            xs = resample(xs, S.RATE, OUT_RATE)
            b = bytes(mulaw(v) for v in xs)
            data.setdefault(kind, {}).setdefault(snd, []).append(base64.b64encode(b).decode())
    js = "window.PawSoundData = " + json.dumps({"rate": OUT_RATE, "s": data}, separators=(",", ":")) + ";\n"
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sound_data.js")
    open(out, "w").write(js)
    print("sounds", sum(len(v) for k in data.values() for v in k.values()), "KB", len(js) // 1024)


if __name__ == "__main__":
    main()
