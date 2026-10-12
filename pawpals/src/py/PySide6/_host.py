"""The page behind the Qt stand-in: a command buffer the page replays, canvas ids, text measuring, timers, input
state. In the browser the page provides window.pawpalsHost; elsewhere (tests under CPython) rough fallbacks."""
import heapq
import json
import time

try:
    import js                                   # Pyodide
    _JS = getattr(js, "pawpalsHost", None)
except ImportError:
    js = None
    _JS = None

DEFAULT_FAMILY = "PingFang SC"
CJK_FAMILIES = ("Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC",
                "Noto Sans SC", "Source Han Sans SC", "WenQuanYi Micro Hei")
FONT_STACK = ('"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans SC", '
              '"Noto Sans CJK SC", system-ui, sans-serif')

from array import array as _array

# Painting goes out as one float32 stream (opcodes and numbers) plus a table of strings (colours, fonts, texts)
# that only grows: the page keeps its copy, each batch sends the new ones.
F = _array("f")
STRS = {}
NEW_STRS = []
BUF = []                       # (unused: kept for older callers)
_next_id = [1]


def s(t):
    """Index of string t in the shared table."""
    i = STRS.get(t)
    if i is None:
        if len(STRS) > 60000:              # rarely: start the table again (the page is told by index 0 reset)
            STRS.clear()
            NEW_STRS.clear()
            NEW_STRS.append("\u0000RESET")
            STRS["\u0000RESET"] = 0
        i = STRS[t] = len(STRS)
        NEW_STRS.append(t)
    return i


def take_bin():
    """(float32 bytes, new strings as JSON or "") of the commands so far; starts a new batch."""
    global F
    out = F
    F = _array("f")
    ns = ""
    if NEW_STRS:
        ns = json.dumps(NEW_STRS, ensure_ascii=False)
        NEW_STRS.clear()
    return out, ns


def pending():
    return len(F) > 0
_width_cache = {}
_metric_cache = {}
STATE = {"mx": 0, "my": 0, "mods": 0, "sw": 1280, "sh": 800, "dpr": 1.0}


def cmd(c):
    BUF.append(c)


def flush_to_page():
    """Have the page paint what is pending right now (pictures a dialog shows must exist first)."""
    if len(F) or NEW_STRS:
        data, ns = take_bin()
        if _JS is not None:
            from pyodide.ffi import to_js
            _JS.replay_bin(to_js(memoryview(data).cast("B")), ns)


def new_canvas(w, h):
    i = _next_id[0]
    _next_id[0] += 1
    F.extend((3, i, int(w), int(h)))
    return i


def free_canvas(i):
    F.extend((4, i))


def measure(css, text):
    key = (css, text)
    w = _width_cache.get(key)
    if w is None:
        if _JS is not None:
            w = float(_JS.measure(css, text))
        else:
            px = _px_of(css)
            w = sum(px if ord(ch) > 0x2e80 else px * 0.56 for ch in text)
        if len(_width_cache) > 20000:
            _width_cache.clear()
        _width_cache[key] = w
    return w


def font_metrics(css):
    m = _metric_cache.get(css)
    if m is None:
        if _JS is not None:
            r = _JS.metrics(css)
            m = (float(r[0]), float(r[1]))
        else:
            px = _px_of(css)
            m = (px * 0.92, px * 0.24)
        _metric_cache[css] = m
    return m


def _px_of(css):
    for part in css.split():
        if part.endswith("px"):
            try:
                return float(part[:-2])
            except ValueError:
                pass
    return 13.0


# ---- timers: the page calls pump() every frame ------------------------------------------------------------
_timers = {}
_heap = []
_tid = [1]


def set_timer(ms, fn, repeat):
    i = _tid[0]
    _tid[0] += 1
    due = time.monotonic() + max(0, ms) / 1000.0
    _timers[i] = (fn, max(1, ms) / 1000.0 if repeat else None)
    heapq.heappush(_heap, (due, i))
    return i


def clear_timer(i):
    _timers.pop(i, None)


def pump(now=None):
    now = time.monotonic() if now is None else now
    n = 0
    while _heap and _heap[0][0] <= now and n < 200:
        due, i = heapq.heappop(_heap)
        t = _timers.get(i)
        if t is None:
            continue
        fn, rep = t
        if rep is None:
            _timers.pop(i, None)
        else:
            heapq.heappush(_heap, (max(now, due + rep), i))
        n += 1
        try:
            fn()
        except Exception:
            import traceback
            traceback.print_exc()


# ---- input / screen state (the page keeps these current) ---------------------------------------------------
def mouse_pos():
    return STATE["mx"], STATE["my"]


def modifiers():
    return STATE["mods"]


def screen_size():
    return STATE["sw"], STATE["sh"]


def dpr():
    return STATE["dpr"]


def clipboard(text):
    if _JS is not None:
        _JS.clipboard(text)


def open_url(u):
    if _JS is not None:
        _JS.open_url(u)


def call(name, *a):
    """Anything else the page offers (menus, dialogs, sound, storage)."""
    if _JS is None:
        return None
    return getattr(_JS, name)(*a)
