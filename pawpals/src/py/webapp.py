"""PawPals in the browser: a light stand-in for the desktop App that hosts only the cat house (with the family, the
town and the arenas), driven by the page's animation loop."""
import json
import random
import sys
import time

from PySide6.QtCore import Qt, QPointF
from PySide6.QtGui import QFont, QColor, QMouseEvent, QWheelEvent, QKeyEvent, QPaintEvent
from PySide6.QtWidgets import QWidget, QMenu, menu_pick, dlg_event  # noqa: F401 (the page calls dlg_event)
from PySide6 import _host

from desktopcats import config as C
from desktopcats import art

SAVE_KEY = "pawpals.cfg"


class WebCatSrc:
    """Stands in for a desktop cat (the house only needs its kind, name, looks and stats)."""

    def __init__(self, app, kind):
        self.app = app
        self.kind = kind
        self.name = app.cfg["names"].get(kind) or C.DEFAULT_NAMES[kind]
        self.acc_h = None
        self.acc_b = None
        st = app.cfg.setdefault("web_stats", {}).setdefault(kind, {})
        self.stats = st
        for k, v in (("hunger", 30.0), ("energy", 80.0), ("mood", 75.0)):
            st.setdefault(k, v)
        self._treats = app.cfg.setdefault("web_treats", {})

    @property
    def shape(self):
        return self.app.body_shape(self.kind)

    def line(self, key, **fmt):
        lines = C.LINES.get(key) or {}
        pool = list(lines.get(self.kind, [])) + list(lines.get("any", [])) if isinstance(lines, dict) else list(lines)
        if not pool:
            return "喵～"
        t = random.choice(pool)
        try:
            return t.format(**fmt)
        except Exception:
            return t

    def treats_today(self):
        d = time.strftime("%Y-%m-%d")
        rec = self._treats.get(self.kind) or {}
        return rec.get("n", 0) if rec.get("d") == d else 0

    def say(self, *a, **k):
        pass

    def spawn(self, *a, **k):
        pass

    def feed(self, *a, **k):
        pass


class WebApp:
    """What the house asks of the desktop App, for the page."""
    is_win = False

    def __init__(self):
        self.cfg = self.load_cfg()
        self.apply_colors()
        self.font = QFont("PingFang SC")
        self.font.setPixelSize(13)
        self.font.setWeight(QFont.DemiBold)
        self.bubble_font = QFont(self.font)
        self.bubble_font.setPixelSize(C.BUBBLE_FONT.get(self.cfg["look"]["font"], 13))
        self.power_index = 3
        self.power = dict(C.POWER[min(len(C.POWER) - 1, 3)])
        self.power["fps"] = 30
        self.quiet = False
        self.host = None
        self.todo_app = None
        self.todo = []
        self.house_bg = None
        self.linkhub = None
        self.play_mode = None
        self.weather = None
        self.holidays = []
        self.settings_win = None
        self.cats = [WebCatSrc(self, "calico"), WebCatSrc(self, "tabby")]
        self.names = {c.kind: c.name for c in self.cats}
        self._save_due = 0.0
        self.cfg["house"]["on"] = True
        self.house = make_house(self)
        QWidget._canvas = self.house
        self.house.show()

    # ---- settings ---------------------------------------------------------------------------------------
    def load_cfg(self):
        import copy
        cfg = copy.deepcopy(C.DEFAULT_CFG)
        raw = _host.call("load", SAVE_KEY)
        if raw:
            try:
                C.deep_merge(cfg, json.loads(str(raw)))
            except Exception:
                pass
        cfg["house"].setdefault("mirror", True)
        if not raw:                                      # a new home: the whole family, called 爸爸 / 妈妈
            cfg["sound"]["on"] = True
            from desktopcats import house_art as HA
            cfg["house"]["people"] = [dict(p) for p in HA.DEFAULT_PEOPLE] + [dict(HA.KID_DEFAULT)]
            cfg["house"]["kid_off_v22"] = True
            if not cfg["user"].get("titles"):
                cfg["user"]["titles"] = "爸爸、妈妈"
        return cfg

    def save(self):
        self._save_due = time.monotonic() + 1.5          # written a moment later, once

    def flush_save(self, force=False):
        if self._save_due and (force or time.monotonic() >= self._save_due):
            self._save_due = 0.0
            try:
                _host.call("store", SAVE_KEY, json.dumps(self.cfg, ensure_ascii=False))
            except Exception as ex:
                print("save failed:", ex, file=sys.stderr)

    def get_cfg(self, key):
        d = self.cfg
        for k in key.split("."):
            d = d[k]
        return d

    def set_cfg(self, key, value, after=None):
        parts = key.split(".")
        d = self.cfg
        for k in parts[:-1]:
            d = d[k]
        d[parts[-1]] = value
        self.save()
        if after is not None:
            after()

    def toggle(self, key, after=None):
        self.set_cfg(key, not self.get_cfg(key), after)

    # ---- looks ------------------------------------------------------------------------------------------
    def apply_colors(self):
        look = self.cfg["look"]
        merged = {}
        for kind in ("calico", "tabby"):
            preset = C.COAT_PRESETS[kind].get(look["coat"].get(kind, ""), {})
            merged[kind] = dict(preset, **self.cfg["colors"].get(kind, {}))
            if look["eye"].get(kind):
                merged[kind]["eye"] = look["eye"][kind]
            if look["eye2"].get(kind):
                merged[kind]["eye2"] = look["eye2"][kind]
        art.apply_colors(merged)

    def body_shape(self, kind):
        return C.BODY_SHAPES.get(self.cfg["look"]["shape"].get(kind, "标准"), (1.0, 1.0))

    def bubble_style(self):
        return C.BUBBLES.get(self.cfg["look"]["bubble"], C.BUBBLES["奶油"])

    def titles(self, cat=None):
        import re
        u = self.cfg["user"]
        own = (u.get("per_cat") or {}).get(cat.kind, "").strip() if cat is not None else ""
        src = own or u.get("titles", "")
        out = [t.strip() for t in re.split(r"[,，、;；/\s]+", src) if t.strip()]
        return out or ["主人"]

    def title_for(self, cat=None):
        return random.choice(self.titles(cat))

    def weather_tag(self):
        return None

    def holidays_on(self, day):
        return []

    def battle_fps(self):
        return 40

    def add_aff(self, cat, n):
        a = self.cfg.setdefault("affection", {})
        a[cat.kind] = a.get(cat.kind, 0) + n
        self.save()

    def level(self, cat):
        return C.level_of(self.cfg.get("affection", {}).get(cat.kind, 0))

    # ---- sound ------------------------------------------------------------------------------------------
    SOUND_EVENT = {"meow": "meow", "mew": "meow", "purr": "purr", "trill": "trill", "hiss": "hiss",
                   "eat": "eat", "chirp": "chirp", "chime": "chime", "clink": "house", "dishes": "house",
                   "door": "house", "snore": "house", "rain": "house", "tv": "house", "splash": "house",
                   "clap": "house", "pop": "house", "hit": "battle", "hit2": "battle", "whoosh": "battle",
                   "block": "battle", "boom": "battle", "oof": "battle", "rustle": "house"}
    BATTLE = ("hit", "hit2", "whoosh", "block", "boom", "oof")

    def play_sound(self, name, cat=None, force=False):
        """Like the desktop: the same per-event switches and spacing, played by the page."""
        s = self.cfg["sound"]
        if not s["on"] and not force:
            return False
        if not force and not s["events"].get(self.SOUND_EVENT.get(name, name), True):
            return False
        gap = {0: 9.0, 1: 4.5, 2: 2.0}.get(s["freq"], 4.5) if name in ("meow", "mew", "trill") else 1.2
        if name in self.BATTLE:
            gap = {"whoosh": 0.12, "boom": 0.3, "oof": 1.0}.get(name, 0.08)
        now = time.monotonic()
        last = self.__dict__.setdefault("_snd_last", {})
        gap_any = 0.06 if name in self.BATTLE else 0.35
        if now - last.get("*", 0.0) < gap_any or now - last.get(name, 0.0) < gap:
            return False
        last[name] = last["*"] = now
        try:
            _host.call("sound", name, getattr(cat, "kind", "calico"), s.get("volume", 45))
        except Exception:
            pass
        return True

    # ---- menus ------------------------------------------------------------------------------------------
    def styled_menu(self, title=None, parent=None):
        return QMenu(title, parent) if title else QMenu(parent)

    def add(self, m, label, fn, checked=None, enabled=True):
        a = m.addAction(label)
        if checked is not None:
            a.setCheckable(True)
            a.setChecked(bool(checked))
        a.setEnabled(enabled)
        a.triggered.connect(fn)
        return a

    def todo_menu(self, m):
        pass

    def focus_menu(self, m):
        pass

    def remind_menu(self, m):
        pass

    def hide_menu(self, m):
        pass

    def fill_common(self, m, cat=None, house=False):
        sm = self.styled_menu("设置", m)
        tm = self.styled_menu("话痨程度", sm)
        for i, label in enumerate(C.TALK_LEVELS):
            self.add(tm, label, lambda i=i: self.set_cfg("talk", i), i == self.cfg["talk"])
        sm.addMenu(tm)
        self.add(sm, "音效", lambda: self.toggle("sound.on"), self.cfg["sound"]["on"])
        self.add(sm, "夜间模式", lambda: self.toggle("night"), self.cfg["night"])
        sm.addSeparator()
        self.add(sm, "名字、称呼、音量…", lambda: self.open_settings())
        self.add(sm, "重置存档…", self.reset_save)
        m.addMenu(sm)

    def reset_save(self):
        if _host.call("confirm", "把小屋、猫咪和家人的存档全部清空，重新开始？"):
            _host.call("store", SAVE_KEY, "")
            _host.call("reload")

    def open_settings(self, page=None):
        """The page's settings: names, what the family is called, sound, how chatty."""
        from PySide6.QtWidgets import (QDialog, QVBoxLayout, QGridLayout, QLabel, QLineEdit, QCheckBox, QSlider,
                                       QComboBox, QDialogButtonBox)
        dlg = QDialog()
        dlg.setWindowTitle("小屋设置")
        dlg.setMinimumWidth(420)
        lay = QVBoxLayout(dlg)
        g = QGridLayout()
        lay.addLayout(g)
        cats = {}
        for i, c in enumerate(self.cats):
            g.addWidget(QLabel("三花猫的名字" if c.kind == "calico" else "狸花猫的名字"), i, 0)
            e = QLineEdit(c.name)
            e.setMaxLength(8)
            g.addWidget(e, i, 1)
            cats[c.kind] = e
        g.addWidget(QLabel("猫咪怎么叫大人"), 2, 0)
        titles = QLineEdit(self.cfg["user"].get("titles", ""))
        titles.setPlaceholderText("例如：爸爸、妈妈")
        g.addWidget(titles, 2, 1)
        g.addWidget(QLabel("联机时我的名字"), 3, 0)
        me = QLineEdit(self.cfg["house"].get("net_name", ""))
        me.setMaxLength(12)
        g.addWidget(me, 3, 1)
        g.addWidget(QLabel("话痨程度"), 4, 0)
        talk = QComboBox()
        for t in C.TALK_LEVELS:
            talk.addItem(t)
        talk.setCurrentIndex(int(self.cfg.get("talk", 1)))
        g.addWidget(talk, 4, 1)
        snd = QCheckBox("音效（按 M 也能静音）")
        snd.setChecked(bool(self.cfg["sound"]["on"]))
        lay.addWidget(snd)
        vol = QSlider()
        vol.setRange(0, 100)
        vol.setValue(int(self.cfg["sound"].get("volume", 45)))
        row = QGridLayout()
        row.addWidget(QLabel("音量"), 0, 0)
        row.addWidget(vol, 0, 1)
        lay.addLayout(row)
        lay.addWidget(QLabel("<span style='color:#9a8a76'>家人的长相、家具摆放这些在桌面版里改；网页版的存档只在这个浏览器里。</span>"))
        bb = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        bb.accepted.connect(dlg.accept)
        bb.rejected.connect(dlg.reject)
        lay.addWidget(bb)

        def apply():
            for c in self.cats:
                n = cats[c.kind].text().strip()[:8]
                if n:
                    c.name = n
                    self.cfg["names"][c.kind] = n
            self.cfg["user"]["titles"] = titles.text().strip()
            self.cfg["house"]["net_name"] = me.text().strip()[:12]
            self.cfg["talk"] = talk.currentIndex()
            self.cfg["sound"]["on"] = snd.isChecked()
            self.cfg["sound"]["volume"] = vol.value()
            try:
                self.house.world.rebuild_people()
            except Exception:
                pass
            self.save()
            self.house.update()
        dlg._web_then = apply
        dlg.exec()

    def close_house(self, background=None):
        _host.call("go_hub")

    def todo_show(self, *a):
        return False

    def __getattr__(self, name):
        if name.startswith("__"):
            raise AttributeError(name)
        print("WebApp: no", name, file=sys.stderr)
        return lambda *a, **k: None


# ==================================================================================================== the house, for the page
HUB = True
WEB_REFRESH = 0.07          # seconds between redraws of a character's picture


class _FakeEvent:
    """A right-click at widget point p (for opening the house menu from a button)."""

    def __init__(self, p):
        self._p = p

    def position(self):
        return self._p

    def globalPosition(self):
        return self._p


def make_house(app):
    from desktopcats.house import HouseWindow
    from desktopcats import house_cats as HC

    class WebHouse(HouseWindow):
        """The desktop house window with the bits that only make sense on a desktop swapped for page versions."""

        def place_for_mode(self, first=False):
            self.apply_size(self.avail().width())

        def save_geom(self):
            pass

        def grip_rect(self):
            from PySide6.QtCore import QRectF
            return QRectF(-500, -500, 1, 1)          # no resize grip: the page sizes the house

        def on_button(self, key):
            if key == "home":
                if HUB:
                    _host.call("go_hub")
                else:                                   # no game hall around: the house menu instead
                    r = self.button_rects()["home"]
                    from PySide6.QtCore import QPointF as P
                    self.context_menu(_FakeEvent(P(r.left() * self.k, (r.bottom() + 4) * self.k)))
                return
            return super().on_button(key)

        def cached_body(self, pp, owner, box, draw, sig=None):
            """(web) Characters are drawn into a little picture refreshed ~14 times a second (or when the pose
            changes) and blitted in between: vector-drawing every character every frame is the slow part here."""
            from PySide6.QtCore import QRectF
            from PySide6.QtGui import QPixmap, QPainter
            tr = pp.worldTransform()
            sc = max(abs(tr.m11()) + abs(tr.m21()), abs(tr.m22()) + abs(tr.m12())) * _host.dpr()
            sc = max(0.25, round(sc * 4) / 4.0)
            cache = self.__dict__.setdefault("_pcache", {})
            now = time.monotonic()
            hit = cache.get(id(owner))
            if hit is None or now - hit[0] > WEB_REFRESH or hit[1] != sc or hit[2] != sig:
                pm = QPixmap(max(1, int(box.width() * sc) + 2), max(1, int(box.height() * sc) + 2))
                pm.fill(Qt.transparent)
                q = QPainter(pm)
                q.setRenderHint(QPainter.Antialiasing)
                q.scale(sc, sc)
                q.translate(-box.left(), -box.top())
                draw(q)
                q.end()
                hit = cache[id(owner)] = (now, sc, sig, pm)
                if len(cache) > 60:
                    cache.clear()
            pm = hit[3]
            pp.drawPixmap(QRectF(box.left(), box.top(), pm.width() / sc, pm.height() / sc), pm,
                          QRectF(0, 0, pm.width(), pm.height()))

        def host_net(self, port=0, quiet=False):
            web_host(self)
            return True

        def net_failed(self, why):
            self.net = None
            self.flash("没连上：%s" % why, 8)
            self.update()

        def battle_dialog(self, f=None, mode=None):
            from desktopcats.house_battle_ui import BattleDialog
            dlg = BattleDialog(self, self.world, f, mode)

            def then():
                cfg = dlg.config()
                self.hcmd("battle", **cfg)
                self.follow_uid = None
                self.set_mode("one", cfg["f"])
            dlg._web_then = then
            dlg.exec()

    return WebHouse(app)


# ==================================================================================================== page API
APP = None
_last = [time.monotonic()]
TICK = 1 / 30.0


def start(hub=True, phone=False):
    global APP, HUB
    HUB = bool(hub)
    import desktopcats.house as HH
    HH.WEB_HOME_LABEL = "⌂ 游戏厅" if HUB else "☰ 菜单"
    from desktopcats import house_net as HN
    HN.fill_menu = web_fill_menu
    APP = WebApp()
    if phone and APP.house.mode == "all":             # a phone screen: one storey at a time is easier to read
        APP.house.set_mode("one", APP.house.view)
    return True


def frame(now=None):
    """One animation frame: timers, the world's clock, painting when the house asked for it.
    Returns 1 when there are commands for the page (take them with take_bin / take_strs), else 0."""
    t = time.monotonic()
    if t - _last[0] < TICK - 0.004 and not _host.NEW_STRS and not len(_host.F):
        return 0                                   # the house runs on a 30 Hz clock, like on the desktop
    dt = min(0.1, max(0.0, t - _last[0]))
    _last[0] = t
    _host.pump(t)
    h = APP.house
    try:
        h.step(dt)
    except Exception:
        import traceback
        traceback.print_exc()
    APP.flush_save()
    if h._dirty:
        h._dirty = False
        try:
            h.paintEvent(QPaintEvent(h.rect()))
        except Exception:
            import traceback
            traceback.print_exc()
    return 1 if (len(_host.F) or _host.NEW_STRS) else 0


_pending_strs = [""]


def take_bin():
    """The float32 command stream as a memoryview (the page copies it out); take_strs() right after."""
    data, ns = _host.take_bin()
    _pending_strs[0] = ns
    return memoryview(data).cast("B")


def take_strs():
    ns = _pending_strs[0]
    _pending_strs[0] = ""
    return ns


def resize(w, h, dpr):
    _host.STATE["dpr"] = float(dpr)
    _host.STATE["sw"], _host.STATE["sh"] = int(w), int(h)
    hw = APP.house
    hw.avail = lambda: __import__("PySide6.QtCore", fromlist=["QRect"]).QRect(0, 0, int(w), int(h))
    try:
        hw.apply_size(int(w))
    except Exception:
        import traceback
        traceback.print_exc()
    hw._dirty = True


def mouse(kind, x, y, button, buttons, mods):
    _host.STATE["mx"], _host.STATE["my"] = x, y
    _host.STATE["mods"] = mods
    h = APP.house
    e = QMouseEvent(x, y, x, y, button, buttons, mods)
    try:
        if kind == "down":
            h.mousePressEvent(e)
        elif kind == "up":
            h.mouseReleaseEvent(e)
        elif kind == "move":
            h.mouseMoveEvent(e)
        elif kind == "dbl":
            h.mouseDoubleClickEvent(e)
        elif kind == "leave":
            h.leaveEvent(e)
    except Exception:
        import traceback
        traceback.print_exc()
    if kind != "move":
        h._dirty = True


def wheel(x, y, dx, dy, mods):
    h = APP.house
    try:
        h.wheelEvent(QWheelEvent(x, y, x, y, dx, dy, mods))
    except Exception:
        import traceback
        traceback.print_exc()


def key(kind, code, text, mods, auto):
    _host.STATE["mods"] = mods
    h = APP.house
    e = QKeyEvent(code, text, mods, bool(auto))
    try:
        (h.keyPressEvent if kind == "down" else h.keyReleaseEvent)(e)
    except Exception:
        import traceback
        traceback.print_exc()
    h._dirty = True


def pick(tok, path):
    menu_pick(tok, path)
    APP.house._dirty = True


def blur():
    h = APP.house
    try:
        h.focusOutEvent(None)
    except Exception:
        pass


def ui_state():
    """For the touch controls: "" (nothing to steer), "cat", "person" or "battle"."""
    h = APP.house
    me = h.my_agent()
    if me is None:
        return ""
    b = h.world.battle
    if b is not None and getattr(b, "phase", "") != "done":
        fs = getattr(b, "fighters", None)
        if (fs and any(getattr(fi, "a", None) is me for fi in fs)) or (not fs and h.view == getattr(b, "f", None)):
            return "battle"
    return "cat" if me.is_cat else "person"


def save_now():
    APP.flush_save(force=True)


# ==================================================================================================== sharing the house (PeerJS)
NET_CONNS = {}


class WebConn:
    """One PeerJS data connection, with the interface house_net's Conn has (send / close / last_rx / closed)."""

    def __init__(self, cid, on_msg, on_close):
        self.cid = int(cid)
        self.on_msg = on_msg
        self.on_close = on_close
        self.closed = False
        self._rx = time.monotonic()
        self.opened = time.monotonic()
        NET_CONNS[self.cid] = self

    @property
    def last_rx(self):
        """Pages can stall for a while (a phone locking, a busy tab): give up only after a minute of silence."""
        now = time.monotonic()
        return max(self._rx, now - 10.0) if now - self._rx < 60 else self._rx

    @last_rx.setter
    def last_rx(self, v):
        self._rx = v

    def send(self, obj):
        if self.closed:
            return
        try:
            _host.call("net_send", self.cid, json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
        except Exception as ex:
            print("net send:", ex, file=sys.stderr)

    def close(self, why=""):
        if self.closed:
            return
        self.send({"t": "bye", "why": why})
        self.closed = True
        NET_CONNS.pop(self.cid, None)
        _host.call("net_close", self.cid)
        self.on_close(self, why)

    def _data(self, text):
        self._rx = time.monotonic()
        try:
            msg = json.loads(text)
        except ValueError:
            return
        if isinstance(msg, dict):
            try:
                self.on_msg(self, msg)
            except Exception:
                import traceback
                traceback.print_exc()

    def _gone(self, why):
        if not self.closed:
            self.closed = True
            NET_CONNS.pop(self.cid, None)
            self.on_close(self, why)


def net_classes():
    from desktopcats import house_net as HN

    class WebNetHost(HN.NetHost):
        def __init__(self, house, code):
            from PySide6.QtCore import QObject
            QObject.__init__(self)
            self.house = house
            self.port = 0
            self.code = code
            self.upnp = None
            self.v6 = []
            self.guests = {}
            self.pending = []
            self.acc = 0.0
            self.sent_layout = self.sent_people = self.sent_look = None
            self.sig_t = 0.0
            self.last_items = {}
            self.ready = False
            house.world.fx_log = []
            _host.call("net_host", code)

        def status_text(self):
            if not self.ready:
                return "正在开房间…"
            if self.guests:
                return "联机中：%s（房间码 %s）" % ("、".join(self.guest_names()), self.code)
            return "房间开着，房间码 %s（等人进来）" % self.code

        def incoming(self, cid):
            c = WebConn(cid, self._msg, self._closed)
            self.pending.append(c)

        def close(self, why="房主关闭了房间"):
            for c in list(self.pending):
                c.close(why)
            for g in list(self.guests.values()):
                g["conn"].close(why)
            _host.call("net_stop")
            self.house.world.fx_log = None

    class WebNetClient(HN.NetClient):
        def __init__(self, house, code, name):
            from PySide6.QtCore import QObject
            QObject.__init__(self)
            self.house = house
            self.code, self.name = code, name
            self.port = 0
            self.hosts, self.host, self.hi = ["peer"], "peer", 0
            self.joined = False
            self.refused = False
            self.host_name = ""
            self.pending_layout = None
            self.ping_t = 0.0
            self.results, self.tried = [], []
            self.started = time.monotonic()
            self.got_tcp = False
            cid = int(_host.call("net_join", code))
            self.conn = WebConn(cid, self._msg, self._closed)

        def opened(self):
            self.got_tcp = True
            self.conn.send({"t": "join", "proto": HN.PROTO, "code": self.code, "name": self.name})

        def _closed(self, c, why):
            NET_LOG.append((round(time.monotonic(), 1), "client closed", why, self.joined))
            if c is not self.conn:
                return
            if self.joined:
                self.house.leave_remote(why or "连接断开了")
            elif not self.refused:
                self.house.net_failed(why or "连不上房主（房间码对吗？房主开着房间吗？）")

        def tick(self, dt):
            t = time.monotonic()
            if not self.joined:
                if t - self.started > 30 and not self.conn.closed:
                    self.conn.closed = True
                    _host.call("net_close", self.conn.cid)
                    self.house.net_failed("连接超时：确认房间码对、房主开着房间")
                return
            self.ping_t += dt
            if self.ping_t > 3:
                self.ping_t = 0.0
                self.conn.send({"t": "ping"})
            if t - self.conn.last_rx > 15:
                self.conn.close("太久没收到房主的消息")

    return WebNetHost, WebNetClient


ROOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def new_room_code():
    return "".join(random.choice(ROOM_CHARS) for _ in range(4))


def ask_name(house):
    name = (house.app.cfg["house"].get("net_name") or "").strip()
    if name:
        return name
    r = _host.call("prompt", "你的名字（联机时对方会看到）", "")
    if r is None:
        return None
    name = str(r).strip()[:12] or "好友"
    house.app.cfg["house"]["net_name"] = name
    house.app.save()
    return name


def web_fill_menu(house, m, inline=False):
    """🌐 联机 ▸ on the page: rooms by a 4-letter code (PeerJS)."""
    app = house.app
    nm = m if inline else app.styled_menu("联机（两个人）", m)
    net = house.net
    if not HUB:
        app.add(nm, "联机只能在游戏厅的网址里玩", lambda: None, enabled=False)
    elif net is None:
        app.add(nm, "两个人一起玩这间小屋", lambda: None, enabled=False)
        app.add(nm, "开房间（我当房主）", lambda: web_host(house))
        app.add(nm, "加入房间…", lambda: web_join(house))
    elif net.is_client:
        app.add(nm, net.status_text(), lambda: None, enabled=False)
        app.add(nm, "离开，回自己的小屋", house.stop_net)
    else:
        app.add(nm, net.status_text(), lambda: None, enabled=False)
        app.add(nm, "复制房间码 %s" % net.code, lambda: _host.clipboard(net.code))
        app.add(nm, "关闭房间", house.stop_net)
    if not inline:
        m.addMenu(nm)


def web_host(house):
    if ask_name(house) is None:
        return
    WebNetHost, _ = net_classes()
    house.stop_net()
    house.net = WebNetHost(house, new_room_code())
    house.world.play.players.get("host", {})["name"] = house.my_name()
    house.flash("正在开房间…", 4)


def web_join(house):
    r = _host.call("prompt", "输入房主给你的 4 位房间码", "")
    if r is None:
        return
    code = "".join(ch for ch in str(r).upper() if ch.isalnum())
    if len(code) != 4:
        _host.call("toast", "房间码是 4 位字母或数字")
        return
    name = ask_name(house)
    if name is None:
        return
    _, WebNetClient = net_classes()
    house.stop_net()
    house.net = WebNetClient(house, code, name)
    house.flash("正在连接房间 %s …" % code, 10)


NET_LOG = []


def net_event(cid, kind, text=""):
    """The page: something happened on PeerJS (cid 0 = the room itself)."""
    h = APP.house
    if kind != "data":
        NET_LOG.append((round(time.monotonic(), 1), int(cid), kind, str(text)[:40]))
        del NET_LOG[:-40]
    net = h.net
    cid = int(cid)
    try:
        if kind == "host_ready":
            if net is not None and not net.is_client:
                net.ready = True
                h.flash("房间开好了！房间码 %s —— 发给朋友，TA 在“🌐 联机 → 加入房间”里输入" % net.code, 12)
                _host.call("info", "房间开好了", "房间码：%s\n\n把房间码发给朋友，TA 打开游戏厅里的猫猫咕咕，"
                                              "右键（或长按）小屋空白处 → 🌐 联机 → 加入房间，输入房间码。\n"
                                              "最多 3 位客人。关掉这个网页房间就关了。" % net.code)
        elif kind == "host_error":
            if net is not None and not net.is_client:
                h.net = None
                h.flash("房间没开成：%s" % text, 8)
        elif kind == "incoming":
            if net is not None and not net.is_client:
                net.incoming(cid)
        elif kind == "open":
            if net is not None and net.is_client and net.conn.cid == cid:
                net.opened()
        elif kind == "data":
            c = NET_CONNS.get(cid)
            if c is not None:
                c._data(text)
        elif kind in ("close", "error"):
            c = NET_CONNS.get(cid)
            if c is not None:
                c._gone(text)
    except Exception:
        import traceback
        traceback.print_exc()
    h._dirty = True
