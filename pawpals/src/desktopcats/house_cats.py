"""Cat care in the house: personalities, food and treats, need bubbles, and stray cats visiting the garden.

* Personalities: 猫猫 is clingy and likes heights; 咕咕 is a foodie, a sleepyhead and a bit of a rascal.
  ``trait_w(cat, key)`` scales how often they choose things; tastes decide how they take their food.
* Food: the bowls are filled with the food you picked (dry / wet / fish can / chicken can / freeze-dried
  mix); a favourite is wolfed down with hearts, a "meh" one is sniffed and left.
* Treats: right-click a cat → 喂零食. A family member brings it: a lickable stick held out, a dried fish or
  freeze-dried bits put on the floor, a pot of cat grass. Too many in a day and the cat is fed up.
* Need bubbles: a hungry / sleepy / lonely / bored cat shows a little thought bubble.
* Visitors: now and then a stray wanders into the garden. Feed it and it leaves a small gift by the gate
  when it goes. Visitors and gifts are kept in 访客图鉴.

Mixed into ``house.World`` (``CatCareWorld``); the Visitor agent class lives in house.py.
"""

import datetime
import math
import random

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QColor, QFont, QPainterPath, QPen, QPixmap, QPainter, QPolygonF

from . import house_art as H

TRAITS = {
    "calico": {"label": "黏人 · 爱爬高", "w": {"lap": 1.7, "rub": 1.7, "perch": 1.5, "knock": 0.6, "beg": 0.9},
               "friendly": 0.8, "love": ("chicken", "stick"), "meh": ("dry",)},
    "tabby": {"label": "贪吃 · 爱睡懒觉 · 小捣蛋", "w": {"eat": 1.4, "beg": 1.7, "sleep": 1.4, "knock": 1.8,
                                                        "lap": 0.9, "perch": 0.85},
              "friendly": 0.35, "love": ("fish", "dried_fish"), "meh": ()},
}
FOODS = {"dry": "干粮", "wet": "湿粮", "fish": "鱼肉罐头", "chicken": "鸡肉罐头", "fdmix": "冻干拌粮"}
TREATS = {"stick": "猫条", "dried_fish": "小鱼干", "fd": "冻干", "grass": "猫草"}
TREAT_LIMIT = 4                     # treats a day before a cat is fed up with them

VISITORS = {
    "v_ginger": {"name": "橘子", "desc": "胖乎乎的大橘，什么都想尝一口", "w": 4},
    "v_black": {"name": "小煤球", "desc": "黑得发亮，有点酷，其实很好奇", "w": 3},
    "v_gray": {"name": "灰灰", "desc": "安静的灰色虎斑，最爱晒太阳", "w": 3},
    "v_white": {"name": "奶糖", "desc": "雪白软乎，难得一见", "w": 1},
}
GIFTS = [("pinecone", "小松果", 5), ("feather", "漂亮的羽毛", 5), ("leaf", "一片红叶", 4), ("cap", "闪亮的瓶盖", 4),
         ("stone", "圆圆的小石头", 5), ("flower", "一朵小野花", 4), ("button", "一颗纽扣", 3), ("marble", "玻璃珠", 2),
         ("clover", "四叶草", 1)]
GIFT_NAMES = {k: n for k, n, _ in GIFTS}
VISIT_FREQ = {"often": 9 * 60, "sometimes": 25 * 60, "rare": 60 * 60}

LINES = {
    "love": ["好吃！", "这个最好吃了喵～", "（吧唧吧唧）还要！", "幸福～"],
    "ok": ["嗯，能吃", "（埋头吃）", "饱饱的"],
    "meh": ["（闻了闻）……", "又是这个？", "不太想吃……", "喵。（走开）"],
    "treat_love": ["猫条！！", "最爱这个了！", "呼噜呼噜～还要", "（疯狂舔）"],
    "treat_ok": ["谢谢喵～", "好香", "嗯嗯！"],
    "treat_tired": ["今天吃够啦", "（扭头）不要了", "吃腻了……"],
    "give_treat": ["来，{c}，给你个好吃的", "{c}～零食时间！", "就一点点哦"],
    "visitor_come": ["院子里来了只{v}！", "咦，是{v}", "{v}又来玩啦"],
    "visitor_feed": ["来，{v}，吃点东西", "饿了吧？给你～", "别怕，吃吧"],
    "gift": ["门口有个小礼物！", "咦，这是谁留下的？", "是{v}送的吧"],
    "hiss": ["哈——！", "这是我家！", "（炸毛）"],
    "greet_visitor": ["你好呀～", "一起玩吗？", "（闻闻）"],
}


def trait(c):
    return TRAITS.get(getattr(c, "kind", ""), {})


def trait_w(c, key):
    return float(trait(c).get("w", {}).get(key, 1.0))


def taste(c, food):
    t = trait(c)
    if food in t.get("love", ()):
        return "love"
    if food in t.get("meh", ()):
        return "meh"
    return "ok"


def tastes_text(c):
    t = trait(c)
    love = [FOODS.get(k) or TREATS.get(k) for k in t.get("love", ())]
    meh = [FOODS.get(k) or TREATS.get(k) for k in t.get("meh", ())]
    out = "爱吃：" + "、".join(love) if love else "什么都爱吃"
    if meh:
        out += "；不太爱：" + "、".join(meh)
    return out


def today():
    return datetime.date.today().isoformat()


class CatCareWorld:
    def init_care(self):
        self.curtains = {}                  # (storey, room) -> True closed / False open, set by a click
        self.curtain_dark = None
        self.visitors = []
        self.next_visit_check = self.t + random.uniform(120, 300)
        self.gifts_here = []                # gifts lying in the garden: drops of kind "gift"

    # ---- settings ---------------------------------------------------------------------------------------
    def house_cfg(self, key, default=None):
        try:
            return self.app.cfg["house"].get(key, default)
        except Exception:
            return default

    ERRANDS = ("feed", "feed_visitor", "treat", "fridge", "serve", "return", "going_out", "show_homework", "pickup",
               "relay", "goodnight", "clear", "scoop", "fix_scratcher", "tidy", "fetch", "outing", "going_home")

    def on_errand(self, p):
        """Busy with something somebody asked for (don't send them off on another errand mid-way)."""
        return p.act in self.ERRANDS or p.act.startswith("going")

    def food_choice(self):
        k = self.house_cfg("food", "dry")
        return k if k in FOODS else "dry"

    def fill_bowls(self, kind=None):
        kind = kind if kind in FOODS else self.food_choice()
        for it in self.items_of("bowls"):
            it.state["food"] = 100.0
            it.state["kind"] = kind

    # ---- things you can click ------------------------------------------------------------------------
    def use_appliance(self, it):
        """Clicking the washer, the stove or the fridge: somebody comes and uses it."""
        h = self.hour()
        free = [p for p in self.present_people() if p.ctrl is None and p.act != "sleep" and not p.asleep_at(h)
                and getattr(p, "hold", None) is None and p.state in ("idle", "act")
                and p.act not in ("cook", "laundry") and not self.on_errand(p)]
        if it.type == "washer" and it.state.get("on"):
            self.play.banner = {"text": "洗衣机还在转呢", "until": self.t + 2.0}
            return False
        adults = [p for p in free if p.role == "adult"]
        pool = adults if it.type in ("washer", "stove") else free
        if not pool:
            self.play.banner = {"text": "现在没人有空", "until": self.t + 2.0}
            return False
        pr = min(pool, key=lambda p: (p.f != it.f, math.hypot(p.x - it.x, p.y - it.y)))
        pr.stop()
        if pr.state == "act":
            pr.end_act()
        if it.type == "washer":
            ok = pr.start_act("laundry")
        elif it.type == "stove":
            ok = pr.start_act("cook")
        else:
            ok = self.fridge_visit(pr, it)
        if ok:
            pr.say(random.choice(["我来～", "好嘞", "交给我"]), 1.5)
        return ok

    def fridge_visit(self, pr, it):
        x0, y0, x1, y1 = it.fp()
        tx, ty = self.stand_near(it.f, it.x, y0 - 8)
        pr.release_spot()
        pr.act = "fridge"
        pr.set_state("act", 60)

        def arrive():
            pr.facing = 1 if it.x >= pr.x else -1
            pr.view, pr.pose, pr.act = "back", "reach", "fridge"
            it.state["open"] = True
            pr.set_state("act", 2.4)
            pr.say(random.choice(["喝口牛奶～", "拿个苹果", "冰箱里有什么好吃的？", "来瓶酸奶"]), 2.0)
            for c in self.cats:
                if c.f == it.f and c.free() and random.random() < 0.6 and math.hypot(c.x - it.x, c.y - it.y) < 400:
                    c.act_beg(pr) if hasattr(c, "act_beg") else None
            self.later(2.4, lambda: it.state.pop("open", None))
        if not pr.go(it.f, tx, ty, 0, False, arrive):
            pr.end_act()
            return False
        return True

    # ---- eating ----------------------------------------------------------------------------------------
    def eat_reaction(self, c, it):
        """Called when a cat starts eating from a bowl: returns the taste and makes it show."""
        food = it.state.get("kind", "dry")
        r = taste(c, food)
        if r == "love":
            c.spawn("heart", 2)
            c.say(random.choice(LINES["love"]), 2.0)
            c.src.stats["mood"] = min(100.0, c.src.stats["mood"] + 6)
        elif r == "meh":
            c.say(random.choice(LINES["meh"]), 2.0)
            c.src.stats["mood"] = max(0.0, c.src.stats["mood"] - 2)
        return r

    # ---- treats ----------------------------------------------------------------------------------------
    def treats_today(self, c):
        rec = getattr(c, "treat_log", None)
        if not rec or rec[0] != today():
            c.treat_log = [today(), 0]
        return c.treat_log[1]

    def give_treat(self, c, kind, by=None):
        """A family member (or the one you control) brings cat c a treat."""
        if kind not in TREATS or c is None or not c.is_cat or c.away or c.uid.startswith("v:"):
            return False
        if c.state in ("carried", "held", "fall") or c.stairs_u is not None:
            return False
        giver = by
        if giver is None:
            h = self.hour()
            cands = [p for p in self.present_people() if p.ctrl is None and p.act != "sleep" and not p.asleep_at(h)
                     and getattr(p, "hold", None) is None and p.state in ("idle", "act") and not self.on_errand(p)]
            if cands:
                giver = min(cands, key=lambda p: (p.f != c.f, math.hypot(p.x - c.x, p.y - c.y)))
        if giver is None:
            # nobody about: it simply appears in front of the cat
            self.serve_treat(c, kind, None)
            return True
        giver.stop()
        if giver.state == "act":
            giver.end_act()
        giver.release_spot()
        giver.treat_kind = kind
        giver.say(random.choice(LINES["give_treat"]).format(c=c.name), 2.0)
        return giver.approach_cat(c, "treat", 30)

    def serve_treat(self, c, kind, giver):
        """The treat reaches the cat: how it is eaten depends on the treat (and on how many it has had)."""
        n = self.treats_today(c)
        c.interrupt()
        c.release_spot()
        if giver is not None:
            c.facing = 1 if giver.x >= c.x else -1
        if n >= TREAT_LIMIT or (n >= TREAT_LIMIT - 1 and random.random() < 0.5):
            c.set_state("rest", 4, pose="grumpy")
            c.say(random.choice(LINES["treat_tired"]), 2.2)
            if giver is not None:
                giver.say(random.choice(["好吧，今天吃得够多了", "不吃啦？那留着明天", "吃腻了呀"]), 2.0, delay=1.2)
                giver.timer = min(giver.timer, 2.0)
            return
        c.treat_log[1] = n + 1
        love = kind in trait(c).get("love", ())
        st = c.src.stats
        st["mood"] = min(100.0, st["mood"] + (12 if love else 7))
        st["hunger"] = max(0.0, st["hunger"] - 6)
        try:
            self.app.add_aff(c.src, 1)
        except Exception:
            pass
        c.say(random.choice(LINES["treat_love" if love else "treat_ok"]), 2.2)
        c.spawn("heart", 3 if love else 1)
        self.tally(giver, "treat")
        if kind == "stick":
            # licking it from the packet the person holds out
            c.set_state("treat", 6.0, kind=kind, by=giver.uid if giver else None)
            if giver is not None:
                giver.pose, giver.prop, giver.view = "pet", "stick", "side"
                giver.set_state("act", 6.2)
                giver.act = "treat"
        else:
            d = {"f": c.f, "x": c.x + c.facing * 16, "y": c.y - 2, "z": 0.0, "vx": 0, "vy": 0, "vz": 0,
                 "kind": "t_" + kind, "rot": 0.0, "vr": 0, "rest": True, "t": 0.0, "id": random.randint(1, 1 << 30)}
            if not self.nav[c.f].ok_at(d["x"], d["y"]):
                d["x"] = c.x - c.facing * 16
                c.facing = -c.facing
            self.drops.append(d)
            c.set_state("treat", 5.0 if kind == "grass" else 3.0, kind=kind, drop=d["id"])
            if giver is not None:
                giver.pose, giver.view = "pet", "side"
                giver.set_state("act", 1.6)
                giver.act = "treat"
        self.app.play_sound("eat", c.src)

    # ---- tallies for the status card ---------------------------------------------------------------------
    def tally(self, a, key):
        if a is None:
            return
        d = getattr(a, "tallies", None)
        if not d or d.get("_day") != today():
            d = a.tallies = {"_day": today()}
        d[key] = d.get(key, 0) + 1

    # ---- need bubbles ----------------------------------------------------------------------------------
    def need_icon(self, c):
        st = c.src.stats
        if c.state in ("eat", "carried", "petted", "treat", "morsel") or c.data.get("pose") == "sleep":
            return None
        if st.get("hunger", 0) > 72:
            return "fish"
        if st.get("energy", 100) < 22:
            return "moon"
        if st.get("mood", 60) < 38:
            return "heart"
        if st.get("energy", 0) > 80 and st.get("mood", 60) < 60 and random.random() < 0.4:
            return "yarn"
        return None

    # ---- visitors ----------------------------------------------------------------------------------------
    def visit_record(self, kind):
        book = self.app.cfg["house"].setdefault("visitors_book", {})
        rec = book.setdefault(kind, {"visits": 0, "fed": 0, "first": None, "last": None})
        return rec

    def gift_book(self):
        return self.app.cfg["house"].setdefault("gifts", [])

    def step_visitors(self, dt):
        if self.remote:
            return
        for v in list(self.visitors):
            if v.gone:
                self.visitors.remove(v)
        freq = self.house_cfg("visitors", "sometimes")
        if freq not in VISIT_FREQ or self.t < self.next_visit_check:
            return
        self.next_visit_check = self.t + 60
        if self.visitors or not self.outdoor_ok() or not (8 <= self.hour() < 18):
            return
        if random.random() < 60.0 / VISIT_FREQ[freq]:
            self.spawn_visitor()

    def spawn_visitor(self, kind=None):
        kinds = list(VISITORS)
        kind = kind if kind in VISITORS else random.choices(kinds, weights=[VISITORS[k]["w"] for k in kinds])[0]
        v = self.make_visitor(kind)
        gx, gy = H.GATE_OUT
        v.f, v.x, v.y = 2, gx, gy
        v.leave_at = self.t + random.uniform(240, 560)
        self.visitors.append(v)
        rec = self.visit_record(kind)
        rec["visits"] = rec.get("visits", 0) + 1
        rec["first"] = rec.get("first") or today()
        rec["last"] = today()
        self.app.save()
        x, y = self.random_floor(2)
        v.go(2, x, y, 0, False, lambda: v.set_state("rest", random.uniform(4, 9), pose="sit"))
        # someone notices
        for p in self.present_people():
            if p.f == 2 or random.random() < 0.3:
                if p.act != "sleep" and p.ctrl is None:
                    p.say(random.choice(LINES["visitor_come"]).format(v=VISITORS[kind]["name"]), 2.4)
                    break
        return v

    def feed_visitor(self, v, by=None):
        fb = getattr(v, "feeding_by", None) if v is not None else None
        if fb is not None and fb.act == "feed_visitor" and fb.state == "act":
            return False                       # someone is already on the way with a dish
        if v is None or v.leaving or v.fed:
            if by is not None and v is not None and v.fed:
                by.say("它已经吃过啦", 1.6)
            return False
        giver = by
        if giver is None:
            h = self.hour()
            cands = [p for p in self.present_people() if p.ctrl is None and p.act != "sleep" and not p.asleep_at(h)
                     and getattr(p, "hold", None) is None and p.state in ("idle", "act") and not self.on_errand(p)]
            if not cands:
                return False
            giver = min(cands, key=lambda p: (p.f != 2, math.hypot(p.x - v.x, p.y - v.y)))
        giver.stop()
        if giver.state == "act":
            giver.end_act()
        giver.release_spot()
        v.stop()
        v.set_state("rest", 60, pose="sit", waiting=True)
        side = 1 if giver.x < v.x or giver.f != v.f else -1
        tx, ty = v.x - side * 40, v.y
        if not self.nav[2].ok_at(tx, ty):
            tx = v.x + side * 40
        giver.act = "feed_visitor"
        giver.set_state("act", 60)
        giver.prop = "food"
        v.feeding_by = giver

        def arrive():
            if v not in self.visitors or v.leaving:
                giver.end_act()
                return
            giver.facing = 1 if v.x >= giver.x else -1
            giver.view, giver.pose = "side", "feed"
            giver.say(random.choice(LINES["visitor_feed"]).format(v=v.name), 2.0)
            giver.set_state("act", 2.0)
            giver.act = "feed_visitor"
            d = {"f": 2, "x": v.x - side * 14, "y": v.y - 3, "z": 0.0, "vx": 0, "vy": 0, "vz": 0, "kind": "dish",
                 "rot": 0.0, "vr": 0, "rest": True, "t": 0.0, "id": random.randint(1, 1 << 30)}
            self.drops.append(d)
            v.facing = -side
            v.set_state("treat", 6.0, kind="dish", drop=d["id"], visitor_meal=True)
            self.tally(giver, "visitor")
        if not giver.go(2, tx, ty, 0, False, arrive):
            giver.end_act()
            v.set_state("idle", 1)
            return False
        return True

    def visitor_fed(self, v):
        v.fed = True
        v.leave_gift = True
        rec = self.visit_record(v.kind)
        rec["fed"] = rec.get("fed", 0) + 1
        self.app.save()
        v.spawn("heart", 2)

    def visitor_leaves(self, v):
        """At the gate: a fed visitor leaves a small gift there."""
        if getattr(v, "leave_gift", False):
            names = [g for g in GIFTS]
            se = H.season()
            weights = [w * (3 if (k == "leaf" and se == "autumn") or (k == "flower" and se == "spring") else 1)
                       for k, n, w in names]
            k = random.choices([g[0] for g in names], weights=weights)[0]
            gx = (H.GATE[0] + H.GATE[1]) / 2
            x, y = gx + random.uniform(-30, 30), 34 + random.uniform(0, 20)
            if not self.nav[2].ok_at(x, y):
                cell = self.nav[2].nearest(gx, 40, 10)
                x, y = self.nav[2].center(*cell) if cell else (gx, 40)
            self.drops.append({"f": 2, "x": x, "y": y, "z": 0.0, "vx": 0, "vy": 0, "vz": 0, "kind": "gift",
                               "gift": k, "from": v.kind, "rot": 0.0, "vr": 0, "rest": True, "t": 0.0,
                               "id": random.randint(1, 1 << 30)})
        v.gone = True
        v.away = True

    def collect_gift(self, did, by=None):
        d = next((x for x in self.drops if x["id"] == did and x.get("kind") == "gift"), None)
        if d is None:
            return None
        self.drops.remove(d)
        rec = {"gift": d.get("gift"), "from": d.get("from"), "date": today()}
        self.gift_book().append(rec)
        self.app.save()
        name = GIFT_NAMES.get(d.get("gift"), "小礼物")
        who = VISITORS.get(d.get("from"), {}).get("name", "流浪猫")
        text = "收到了%s送的礼物：%s！" % (who, name)
        try:
            self.play.banner = {"text": "🎁 " + text, "until": self.t + 4.0}
        except Exception:
            pass
        if by is not None:
            by.say(random.choice(LINES["gift"]).format(v=who), 2.2)
        return text

    def visitors_to_net(self):
        return [[v.uid, v.kind] for v in self.visitors if not v.gone]


# ---- drawing --------------------------------------------------------------------------------------------
def draw_think(p, x, y, icon, alpha=1.0, s=1.0):
    """A thought bubble with a little picture: fish (hungry), moon (sleepy), heart (lonely), yarn (bored)."""
    p.save()
    p.setOpacity(alpha)
    p.translate(x, y)
    p.scale(s, s)
    p.setPen(QPen(QColor("#c9b29a"), 1.0))
    p.setBrush(QColor(255, 252, 246, 235))
    p.drawEllipse(QPointF(-4, 10), 2.2, 2.2)
    p.drawEllipse(QPointF(-1, 5), 3.2, 3.2)
    path = QPainterPath()
    for dx, dy, r in ((-8, -12, 8), (2, -15, 9), (10, -11, 7), (0, -7, 8)):
        path.addEllipse(QPointF(dx, dy), r, r * 0.85)
    p.drawPath(path.simplified())
    cx, cy = 1, -12
    p.setPen(Qt.NoPen)
    if icon == "fish":
        p.setBrush(QColor("#f29a3e"))
        pp = QPainterPath(QPointF(cx - 7, cy))
        pp.quadTo(QPointF(cx - 1, cy - 5), QPointF(cx + 4, cy))
        pp.lineTo(cx + 8, cy - 3)
        pp.lineTo(cx + 8, cy + 3)
        pp.lineTo(cx + 4, cy)
        pp.quadTo(QPointF(cx - 1, cy + 5), QPointF(cx - 7, cy))
        p.drawPath(pp)
        p.setBrush(QColor("#3a2a22"))
        p.drawEllipse(QPointF(cx - 4, cy - 0.8), 0.9, 0.9)
    elif icon == "moon":
        p.setBrush(QColor("#f2c94c"))
        p.drawEllipse(QPointF(cx, cy), 5.5, 5.5)
        p.setBrush(QColor(255, 252, 246))
        p.drawEllipse(QPointF(cx + 2.6, cy - 1.8), 4.6, 4.6)
        p.setPen(QColor("#8a7bb0"))
        f = QFont()
        f.setPixelSize(6)
        f.setBold(True)
        p.setFont(f)
        p.drawText(QPointF(cx + 3, cy + 5), "z")
    elif icon == "heart":
        p.setBrush(QColor("#ff6f91"))
        p.drawEllipse(QPointF(cx - 2.2, cy - 1.5), 3, 3)
        p.drawEllipse(QPointF(cx + 2.2, cy - 1.5), 3, 3)
        p.drawPolygon(QPolygonF([QPointF(cx - 5, cy - 0.5), QPointF(cx + 5, cy - 0.5), QPointF(cx, cy + 5)]))
    elif icon == "yarn":
        p.setBrush(QColor("#9fc3ef"))
        p.drawEllipse(QPointF(cx, cy), 5, 5)
        p.setPen(QPen(QColor("#5e8fc8"), 0.8))
        p.setBrush(Qt.NoBrush)
        p.drawArc(QRectF(cx - 4, cy - 4, 8, 8), 30 * 16, 120 * 16)
        p.drawArc(QRectF(cx - 3, cy - 2, 6, 6), 200 * 16, 120 * 16)
        p.drawLine(QPointF(cx + 4, cy + 3), QPointF(cx + 8, cy + 5))
    p.restore()


def draw_care_drop(p, kind, x, y, t, gift=None):
    """Treats on the floor, a visitor's dish, and gifts. Returns True if it handled the kind."""
    if kind == "t_dried_fish":
        p.setPen(QPen(QColor("#9c5a22"), 0.8))
        p.setBrush(QColor("#e9a356"))
        pp = QPainterPath(QPointF(x - 6, y))
        pp.quadTo(QPointF(x - 1, y - 3.5), QPointF(x + 3, y))
        pp.lineTo(x + 6, y - 2.5)
        pp.lineTo(x + 6, y + 2.5)
        pp.lineTo(x + 3, y)
        pp.quadTo(QPointF(x - 1, y + 3.5), QPointF(x - 6, y))
        p.drawPath(pp)
        return True
    if kind == "t_fd":
        p.setPen(QPen(QColor("#b48a5a"), 0.5))
        for i, (dx, dy) in enumerate(((-3, 0), (1, -1), (4, 1), (0, 2))):
            p.setBrush(QColor(("#f3d9b1", "#e8c08a", "#f7e3c4", "#dcae76")[i]))
            p.drawRect(QRectF(x + dx - 1.6, y + dy - 1.6, 3.2, 3.2))
        return True
    if kind == "t_grass":
        p.setPen(QPen(QColor("#9c5a3a"), 0.7))
        p.setBrush(QColor("#d98a5f"))
        p.drawRoundedRect(QRectF(x - 5, y - 4, 10, 5), 1.5, 1.5)
        p.setPen(QPen(QColor("#5fb653"), 1.0))
        for i in range(7):
            a = -0.6 + i * 0.2
            p.drawLine(QPointF(x - 3 + i, y - 4), QPointF(x - 3 + i + math.sin(a + t) * 1.5, y - 12 + abs(i - 3)))
        return True
    if kind == "dish":
        p.setPen(QPen(QColor("#9a8a7a"), 0.7))
        p.setBrush(QColor("#f4f1ea"))
        p.drawEllipse(QPointF(x, y), 6.5, 2.4)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#c98a4b"))
        p.drawEllipse(QPointF(x, y - 0.8), 4, 1.3)
        return True
    if kind == "gift":
        draw_gift(p, gift, x, y - 3, t, 1.0, sparkle=True)
        return True
    return False


def draw_gift(p, kind, x, y, t=0.0, s=1.0, sparkle=False):
    p.save()
    p.translate(x, y)
    p.scale(s, s)
    if sparkle:
        k = 0.5 + 0.5 * math.sin(t * 3)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 240, 160, int(90 * k)))
        p.drawEllipse(QPointF(0, 0), 10, 6)
    p.setPen(QPen(QColor(90, 64, 52, 200), 0.7))
    if kind == "pinecone":
        p.setBrush(QColor("#9a6a3e"))
        p.drawEllipse(QPointF(0, 0), 3.4, 5)
        p.setPen(QPen(QColor("#6b4423"), 0.6))
        for k in (-2, 0, 2):
            p.drawLine(QPointF(-3, k), QPointF(3, k + 1))
    elif kind == "feather":
        p.setBrush(QColor("#7fb3e6"))
        pp = QPainterPath(QPointF(-6, 3))
        pp.quadTo(QPointF(-1, -5), QPointF(6, -4))
        pp.quadTo(QPointF(1, 2), QPointF(-6, 3))
        p.drawPath(pp)
        p.drawLine(QPointF(-7, 4), QPointF(5, -3.5))
    elif kind == "leaf":
        p.setBrush(QColor("#d9542b"))
        pp = QPainterPath(QPointF(-5, 2))
        pp.quadTo(QPointF(-1, -6), QPointF(5, -2))
        pp.quadTo(QPointF(0, 4), QPointF(-5, 2))
        p.drawPath(pp)
        p.drawLine(QPointF(-6, 3), QPointF(4, -1.5))
    elif kind == "cap":
        p.setBrush(QColor("#c0c6cf"))
        p.drawEllipse(QPointF(0, 0), 4, 2.6)
        p.setBrush(QColor("#e53935"))
        p.drawEllipse(QPointF(0, -0.4), 2.6, 1.6)
    elif kind == "stone":
        p.setBrush(QColor("#a8a39b"))
        p.drawEllipse(QPointF(0, 0), 4.5, 3)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 255, 255, 120))
        p.drawEllipse(QPointF(-1.5, -1), 1.4, 0.8)
    elif kind == "flower":
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#ffffff"))
        for a in range(0, 360, 72):
            p.drawEllipse(QPointF(math.cos(math.radians(a)) * 2.6, math.sin(math.radians(a)) * 2.0), 2, 1.6)
        p.setBrush(QColor("#f2c94c"))
        p.drawEllipse(QPointF(0, 0), 1.4, 1.4)
    elif kind == "button":
        p.setBrush(QColor("#5e9bd6"))
        p.drawEllipse(QPointF(0, 0), 3.4, 3.4)
        p.setBrush(QColor("#2f5e8f"))
        for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
            p.drawEllipse(QPointF(dx, dy), 0.5, 0.5)
    elif kind == "marble":
        p.setBrush(QColor(140, 200, 240, 220))
        p.drawEllipse(QPointF(0, 0), 3.2, 3.2)
        p.setPen(QPen(QColor("#e57373"), 0.9))
        p.drawArc(QRectF(-2, -2, 4, 4), 30 * 16, 200 * 16)
    else:  # clover
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#4caf50"))
        for a in (45, 135, 225, 315):
            p.drawEllipse(QPointF(math.cos(math.radians(a)) * 2.2, math.sin(math.radians(a)) * 2.2), 2.2, 2.2)
        p.setPen(QPen(QColor("#388e3c"), 0.8))
        p.drawLine(QPointF(0, 0), QPointF(2, 5))
    p.restore()


def cat_pixmap(kind, size=64):
    from . import art
    pm = QPixmap(size, size)
    pm.fill(Qt.transparent)
    p = QPainter(pm)
    p.setRenderHint(QPainter.Antialiasing)
    p.scale(size / 120.0, size / 120.0)
    p.translate(-15, 10)
    art.draw_cat(p, art.POSES["sit"](0.3, None), kind)
    p.end()
    return pm


def gift_pixmap(kind, size=40):
    pm = QPixmap(size, size)
    pm.fill(Qt.transparent)
    p = QPainter(pm)
    p.setRenderHint(QPainter.Antialiasing)
    draw_gift(p, kind, size / 2, size / 2, 0.0, size / 14.0)
    p.end()
    return pm


def open_book(parent, app):
    """访客图鉴: the stray cats that have visited and the gifts they left."""
    from PySide6.QtWidgets import QDialog, QGridLayout, QLabel, QScrollArea, QVBoxLayout, QWidget, QFrame
    dlg = QDialog(parent)
    dlg.setWindowTitle("访客图鉴")
    dlg.setMinimumWidth(460)
    lay = QVBoxLayout(dlg)
    book = app.cfg["house"].get("visitors_book") or {}
    gifts = app.cfg["house"].get("gifts") or []
    head = QLabel("<b>来过院子的猫</b>")
    lay.addWidget(head)
    grid = QGridLayout()
    for i, (kind, info) in enumerate(VISITORS.items()):
        rec = book.get(kind)
        box = QFrame()
        box.setFrameShape(QFrame.StyledPanel)
        bl = QVBoxLayout(box)
        pic = QLabel()
        pm = cat_pixmap(kind, 72)
        if not rec:
            img = pm.toImage()
            for yy in range(img.height()):
                for xx in range(img.width()):
                    c = img.pixelColor(xx, yy)
                    if c.alpha() > 0:
                        img.setPixelColor(xx, yy, QColor(120, 120, 130, c.alpha()))
            pm = QPixmap.fromImage(img)
        pic.setPixmap(pm)
        pic.setAlignment(Qt.AlignCenter)
        bl.addWidget(pic)
        if rec:
            txt = "<b>%s</b><br><span style='color:#7a6a5a'>%s</span><br>来过 %d 次 · 吃过 %d 次" % (
                info["name"], info["desc"], rec.get("visits", 0), rec.get("fed", 0))
        else:
            txt = "<b>？？？</b><br><span style='color:#9a8a7a'>还没来过</span>"
        lab = QLabel(txt)
        lab.setWordWrap(True)
        lab.setAlignment(Qt.AlignCenter)
        bl.addWidget(lab)
        grid.addWidget(box, i // 2, i % 2)
    lay.addLayout(grid)
    lay.addWidget(QLabel("<b>收到的小礼物</b>（%d 件）" % len(gifts)))
    wrap = QWidget()
    gl = QGridLayout(wrap)
    gl.setContentsMargins(8, 6, 8, 6)
    gl.setHorizontalSpacing(10)
    gl.setVerticalSpacing(4)
    if not gifts:
        tip = QLabel("还没有。给来访的猫喂点吃的，它走的时候可能会在门口留下小礼物。")
        tip.setWordWrap(True)
        gl.addWidget(tip, 0, 0, 1, 2)
    for i, g in enumerate(reversed(gifts[-60:])):
        pic = QLabel()
        pic.setPixmap(gift_pixmap(g.get("gift"), 32))
        pic.setFixedSize(36, 36)
        pic.setAlignment(Qt.AlignCenter)
        gl.addWidget(pic, i, 0)
        who = VISITORS.get(g.get("from"), {}).get("name", "流浪猫")
        gl.addWidget(QLabel("<b>%s</b>　<span style='color:#7a6a5a'>%s 送的 · %s</span>" % (
            GIFT_NAMES.get(g.get("gift"), "小礼物"), who, g.get("date", ""))), i, 1)
    gl.setColumnStretch(1, 1)
    gl.setRowStretch(max(1, len(gifts[-60:])), 1)
    sc = QScrollArea()
    sc.setWidget(wrap)
    sc.setWidgetResizable(True)
    sc.setMinimumHeight(200)
    lay.addWidget(sc)
    dlg.exec()
