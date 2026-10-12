"""Everyday details of life in the cat house.

* Carrying and cuddling: a person can pick a cat up (``pr.hold``), walk around with it, sit down with
  it on the lap, or put it down; a cat that has had enough wriggles free.  A cat may also hop onto
  the lap of someone sitting on the sofa by itself, and hops off when that person gets up.
* Petting moods: leaning into the hand, rubbing, rolling over (sometimes the belly is a trap), or
  walking off when it has been petted enough.
* Mischief: a cat on a table or desk pats a cup / pen / remote over the edge; somebody sighs and
  picks it up.  A cat lies down on the laptop of whoever is working.
* Cats wrestle and chase each other; the kid runs to hug whoever comes home; a grown-up says
  good night at the kid's bed.

Mixed into ``house.World`` (``LifeWorld``); the agents call the helpers from their own logic.
"""

import math
import random

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QColor, QPainterPath, QPen

from . import house_art as H

LINES = {
    "pickup": ["来，抱抱{c}～", "{c}过来，抱一下", "让我抱抱～", "软乎乎的{c}！", "嘿咻，{c}好重哦"],
    "kid_pickup": ["{c}我抱你！", "抱抱抱～", "{c}给我抱一下嘛"],
    "holding": ["好软呀～", "{c}今天好乖", "听，在打呼噜呢", "暖烘烘的", "你是不是又胖了一点？"],
    "set_down": ["好啦，去玩吧", "放你下来咯", "下去吧～"],
    "wriggled": ["好好好，放你下来", "哎呀，不让抱了", "这么快就不耐烦啦"],
    "kid_wriggled": ["{c}别跑呀！", "我还没抱够呢……", "哼，小气鬼"],
    "lap_person": ["{c}又来占我的腿了", "好吧，那我不动了", "腿要麻了也不能动……", "{c}陪我看会儿"],
    "lap_stand": ["我得起来啦，{c}", "不好意思，要起身了", "让一让哦～"],
    "pet_refuse": ["好吧，不摸了", "摸够了是吧", "嫌弃我……"],
    "belly_trap": ["啊！又是肚皮陷阱！", "哎哟，咬我！", "就知道会这样……", "四只爪子全用上了！"],
    "belly_ok": ["肚皮好软～", "居然让我摸肚子了！", "翻肚皮了耶"],
    "laptop": ["{c}，我在工作呢……", "键盘上全是猫毛了", "你是想帮我打字吗？", "喂，挡住屏幕啦"],
    "laptop_lift": ["乖，下去玩", "这里不能睡哦", "来，去你自己的窝"],
    "laptop_keep": ["好吧，休息五分钟", "那就陪我一会儿吧"],
    "knock_watch": ["{c}，不许推！", "{c}……你别……", "它要推下去了！"],
    "knock_after": ["哎呀！{c}！", "又推下去了……", "{c}，你是故意的吧", "我就知道"],
    "pickup_drop": ["捡起来～", "还好没摔坏", "下次放远一点"],
    "hug_back": ["你回来啦！", "抱抱！", "我好想你！"],
    "hug_back_adult": ["我回来啦～", "今天乖不乖？", "来，抱一个"],
    "goodnight": ["晚安，宝贝", "做个好梦哦", "被子盖好～"],
    "wrestle": ["喵嗷！", "看招！", "嘿！", "喵呜～"],
}
CAT_LINES_LIFE = {
    "carried": ["呼噜呼噜……", "喵～（蹭蹭）", "这个高度不错", "抱稳一点喵"],
    "wriggle": ["喵呜——放我下来！", "不要抱了喵！", "喵！喵！", "我要下去！"],
    "lap": ["这里最暖和", "呼噜呼噜……", "不许动，我睡了", "腿垫子✓"],
    "lap_off": ["喵！（被赶下来了）", "哼……", "去别处睡"],
    "refuse": ["喵。（甩尾巴）", "现在不想被摸", "够了喵"],
    "knock": ["这个……下去吧", "（轻轻一推）", "让我看看会怎样", "嘿嘿"],
    "laptop": ["这里热乎乎的", "陪你上班喵", "按到什么键了？"],
    "wrestle": ["喵嗷！", "看招！", "嘿！吃我一爪", "喵呜～", "不服再来！"],
}
DROP_KINDS = ("mug", "pen", "remote", "cup", "book")


def pick(lines, **fmt):
    try:
        return random.choice(lines).format(**fmt)
    except (KeyError, IndexError):
        return random.choice(lines)


def life_line(key, **fmt):
    return pick(LINES[key], **fmt)


def cat_line(key, **fmt):
    return pick(CAT_LINES_LIFE[key], **fmt)


class LifeWorld:
    """Mixin for World."""

    def init_life(self):
        self.drops = []            # things a cat pushed off: {"f","x","y","z","vx","vy","vz","kind","rot","vr","rest"}
        self.next_goodnight = 0.0

    # ---- carrying ---------------------------------------------------------------------------------------
    def held_cat(self, pr):
        h = getattr(pr, "hold", None)
        if not h:
            return None
        c = self.agent_by_uid(h.get("uid"))
        if c is None or c.state != "carried":
            return None
        return c

    def carrier_of(self, c):
        if c.state != "carried":
            return None
        return self.agent_by_uid(c.data.get("by"))

    def carry_height(self, pr, mode):
        if mode == "lap":
            return pr.h + 4.0
        d = H.person_dims(pr.role)
        return pr.h + (d["leg"] + d["torso"] * 0.34 - 6) * pr.hs

    def can_pick_up(self, pr, c):
        return (c is not None and c.is_cat and c.state not in ("carried", "held", "fall", "ko") and c.stairs_u is None
                and not c.away and getattr(pr, "hold", None) is None and pr.stairs_u is None and not pr.away
                and pr.pose != "sleep")

    def pick_up_cat(self, pr, c, mode="carry"):
        if not self.can_pick_up(pr, c):
            return False
        if self.carried_by(pr) is not None:
            self.plush_put(pr, None, force=True)
        c.interrupt()
        c.release_spot()
        c.stop()
        c.running = False
        mood = c.src.stats.get("mood", 60)
        if c.ctrl is not None or mode == "lap":
            wr = None
        elif pr.role == "kid":
            wr = self.t + random.uniform(3.0, 6.5)
        elif mood > 70:
            wr = self.t + random.uniform(14, 30)
        else:
            wr = self.t + random.uniform(5, 11)
        leave = self.t + random.uniform(45, 150) if (mode == "lap" and c.ctrl is None) else None
        c.set_state("carried", 1e9, by=pr.uid, mode=mode, since=self.t, wriggle_at=wr, leave_at=leave)
        pr.hold = {"uid": c.uid, "mode": mode}
        if mode == "carry":
            pr.prop_saved = pr.prop if pr.prop not in ("hug", "lap") else None
            pr.prop = "hug"
            if pr.view == "back":
                pr.view = "front"
        self.sync_carried(c, pr)
        if random.random() < 0.45:
            self.app.play_sound("purr", c.src)
        return True

    def to_lap(self, pr):
        c = self.held_cat(pr)
        if c is None:
            return
        pr.hold["mode"] = "lap"
        c.data["mode"] = "lap"
        c.data["wriggle_at"] = None
        c.data["since"] = self.t
        if c.ctrl is None:
            c.data["leave_at"] = self.t + random.uniform(40, 140)
        if pr.prop == "hug":
            pr.prop = None
        self.sync_carried(c, pr)

    def to_carry(self, pr):
        c = self.held_cat(pr)
        if c is None:
            return
        pr.hold["mode"] = "carry"
        c.data["mode"] = "carry"
        c.data["leave_at"] = None
        pr.prop = "hug"

    def sync_carried(self, c, pr):
        c.f, c.x, c.y = pr.f, pr.x, pr.y - 1.5
        c.stairs_u = pr.stairs_u
        c.h = self.carry_height(pr, c.data.get("mode", "carry"))
        c.facing = pr.facing

    def set_down_cat(self, pr, ux=None, uy=None, onto=None, flee=False):
        """Let go of the cat: it hops down next to the person (that way), or onto a furniture spot."""
        c = self.held_cat(pr)
        pr.hold = None
        if pr.prop in ("hug", "lap"):
            pr.prop = getattr(pr, "prop_saved", None)
        pr.prop_saved = None
        if c is None:
            return False
        c.stairs_u = None
        c.f = pr.f
        if ux is None:
            ux, uy = float(pr.facing), -0.35
        n = math.hypot(ux, uy or 0.0) or 1.0
        ux, uy = ux / n, (uy or 0.0) / n
        if abs(ux) > 0.2:
            c.facing = 1 if ux > 0 else -1
        c.set_state("idle", 1e9)
        nav = self.nav[c.f]
        if onto is not None:
            key, sp = onto
            c.claim(key)
            c.path = [{"t": "jump", "x": sp["x"], "y": sp["y"], "h": sp["h"]}]
            c.then = lambda: c.set_state("rest", 1e9 if c.ctrl else random.uniform(20, 60), pose="sit")
            return True
        land = self.play.landing_point(c, ux, uy, dists=(42, 56, 30, 72, 20))
        if land is None:
            cell = nav.nearest(pr.x, pr.y, 8)
            land = nav.center(*cell) if cell else (pr.x, pr.y)
        c.path = [{"t": "jump", "x": land[0], "y": land[1], "h": 0.0}]
        if c.ctrl is not None:
            c.then = lambda: c.set_state("idle", 1e9)
        elif flee:
            def off():
                x, y = self.random_floor(c.f)
                if math.hypot(x - c.x, y - c.y) > 220:
                    x, y = c.x + (x - c.x) * 0.4, c.y + (y - c.y) * 0.4
                if not self.nav[c.f].ok_at(x, y):
                    c.set_state("rest", 5, pose="groom")
                    return
                c.go(c.f, x, y, 0, True, lambda: c.set_state("rest", random.uniform(4, 8), pose="groom"))
            c.then = off
        else:
            c.then = lambda: c.set_state("rest", random.uniform(4, 10), pose=random.choice(("sit", "groom", "stretch")))
        return True

    def drop_loose_cat(self, c):
        """The carrier vanished (left, went upstairs on a guest's screen...): the cat drops to its feet."""
        c.stairs_u = None
        nav = self.nav[c.f]
        if not nav.ok_at(c.x, c.y):
            cell = nav.nearest(c.x, c.y, 10)
            if cell:
                c.x, c.y = nav.center(*cell)
        c.set_state("fall", 3, vh=0.0)

    def step_carried(self, c, dt):
        pr = self.carrier_of(c)
        if pr is None or pr.away or getattr(pr, "hold", None) is None or pr.hold.get("uid") != c.uid:
            self.drop_loose_cat(c)
            return
        self.sync_carried(c, pr)
        mode = c.data.get("mode", "carry")
        st = c.src.stats
        st["mood"] = min(100.0, st["mood"] + dt * 0.12)
        if c.ctrl is not None:
            d = self.play.dir_of(c)
            if d[0] or d[1]:
                c.say(cat_line("wriggle"), 1.6)
                self.set_down_cat(pr, d[0], d[1])
                return
        wr = c.data.get("wriggle_at")
        if wr is not None and self.t >= wr:
            if self.t < wr + 1.4:
                c.set_pose("wriggle")
                if not c.data.get("wr_said"):
                    c.data["wr_said"] = True
                    c.say(cat_line("wriggle"), 1.8)
                    self.app.play_sound("meow", c.src)
                return
            if pr.ctrl is None:
                pr.say(life_line("kid_wriggled" if pr.role == "kid" else "wriggled", c=c.name), 2.2)
            self.set_down_cat(pr, -pr.facing, -0.2, flee=True)
            if pr.ctrl is None and pr.state == "act" and pr.act == "cuddle":
                pr.timer = min(pr.timer, 1.2)
            return
        la = c.data.get("leave_at")
        if mode == "lap" and la is not None and self.t >= la:
            self.set_down_cat(pr, random.choice((-1, 1)), -0.6)
            return
        if mode == "lap":
            dozy = self.t - c.data.get("since", self.t) > 10 and (st["energy"] < 90 or pr.pose == "doze")
            c.set_pose("sleep" if dozy else "loaf")
            if dozy and random.random() < dt * 0.12:
                c.spawn("z", 1)
            elif random.random() < dt * 0.05:
                c.spawn("heart", 1)
        else:
            c.set_pose("cradle")
            if random.random() < dt * 0.09:
                c.spawn("heart", 1)
            if not c.data.get("said") and self.t - c.data.get("since", self.t) > 1.5:
                c.data["said"] = True
                if random.random() < 0.4:
                    c.say(cat_line("carried"), 2.2)

    def cat_jump_to_lap(self, c, pr):
        """A cat's own idea: hop onto the lap of someone sitting down."""
        if getattr(pr, "hold", None) is not None or pr.seat <= 0 or pr.pose not in ("sit", "doze") or pr.ctrl:
            return False
        if pr.view == "back":
            return False             # seen from behind: it settles on the backrest next to them instead
        nav = self.nav[pr.f]
        tx, ty = None, None
        for ox, oy in ((0, -34), (pr.facing * 26, -26), (-pr.facing * 26, -26), (0, -48), (pr.facing * 40, -10)):
            if nav.ok_at(pr.x + ox, pr.y + oy):
                tx, ty = pr.x + ox, pr.y + oy
                break
        if tx is None:
            return False
        c.interrupt()
        c.release_spot()

        def arrive():
            if (getattr(pr, "hold", None) is not None or pr.seat <= 0 or pr.state != "act" or pr.f != c.f
                    or c.state not in ("idle", "rest")):
                c.set_state("rest", 4, pose="sit")
                return

            def landed():
                if self.pick_up_cat(pr, c, "lap"):
                    c.chat("lap", 0.5, p=pr.name)
                    if random.random() < 0.6:
                        pr.say(life_line("lap_person", c=c.name), 2.4)
                else:
                    c.set_state("rest", 3, pose="sit")
            c.facing = 1 if pr.x >= c.x else -1
            c.path = [{"t": "jump", "x": pr.x, "y": pr.y - 1.5, "h": pr.h + 4}]
            c.then = landed
        c.set_state("idle", 1e9)
        return c.go(pr.f, tx, ty, 0, False, arrive)

    # ---- the family -------------------------------------------------------------------------------------
    def greet_home(self, adult):
        """Someone came home and hung up the coat: the kid runs over for a hug."""
        kids = [k for k in self.present_people() if k.role == "kid" and k is not adult and k.ctrl is None
                and k.act not in ("sleep", "greet", "going_out", "fetch", "tidy") and k.state in ("idle", "act")
                and getattr(k, "hold", None) is None and k.act != "going:sleep"]
        if not kids or random.random() > 0.85:
            return False
        k = min(kids, key=lambda q: (q.f != adult.f, math.hypot(q.x - adult.x, q.y - adult.y)))
        nav = self.nav[adult.f]
        side = 1 if k.x < adult.x or k.f != adult.f else -1
        tx, ty = adult.x - side * 20, adult.y - 3
        if not nav.ok_at(tx, ty):
            side = -side
            tx = adult.x - side * 20
            if not nav.ok_at(tx, ty):
                return False
        k.stop()
        if k.state == "act":
            k.end_act()
        k.release_spot()
        adult.act = "greet"
        adult.set_state("act", 25)
        adult.pose = "stand"
        k.act = "greet"
        k.set_state("act", 40)

        def arrive():
            if adult.act != "greet" or adult.f != k.f:
                k.end_act()
                return
            k.facing = 1 if adult.x >= k.x else -1
            adult.facing = -k.facing
            k.view = adult.view = "side"
            k.pose, k.prop = "stand", "hug"
            adult.pose, adult.prop = "pet", "hug"
            k.say(life_line("hug_back"), 2.2)
            adult.say(life_line("hug_back_adult"), 2.4)
            k.spawn("heart", 2)
            adult.spawn("heart", 1)
            k.set_state("act", 3.0)
            adult.set_state("act", 3.0)
            k.act = adult.act = "greet"
        if not k.go(adult.f, tx, ty, 0, True, arrive):
            k.end_act()
            adult.end_act()
            return False
        return True

    def step_family(self, dt):
        self._fam_t = getattr(self, "_fam_t", 0.0) + dt
        if self._fam_t < 5.0:
            return
        self._fam_t = 0.0
        self.family_moments()
        if self.t < self.next_goodnight:
            return
        hr = self.hour()
        for kid in self.present_people():
            if kid.role != "kid" or kid.act != "sleep" or kid.state != "act" or kid.spot is None:
                continue
            if kid.st_t < 20 or kid.st_t > 3 * 3600:
                continue
            adults = [a for a in self.present_people() if a.role == "adult" and a.ctrl is None and not a.asleep_at(hr)
                      and getattr(a, "hold", None) is None and self.carried_by(a) is None
                      and (a.state == "idle" or (a.state == "act" and a.act in ("wander", "tv", "read", "phone", "wash")))]
            if not adults:
                return
            self.start_goodnight(random.choice(adults), kid)
            self.next_goodnight = self.t + 6 * 3600
            return

    PAIR_TALK = [("这集好看吗？", "嗯，挺有意思的"), ("要不要吃点水果？", "好呀～"), ("今天累不累？", "还好，有你们在"),
                 ("周末去哪玩？", "去公园野餐吧"), ("猫猫是不是又胖了？", "嘘，别让它听见"),
                 ("明天早点起吧", "好，一起去跑步")]
    COOK_TALK = [("我来切菜", "好，帮我把葱洗一下"), ("盐在哪儿？", "左边柜子里"), ("今天做什么？", "番茄炒蛋，你最爱的"),
                 ("尝尝咸不咸", "嗯……刚刚好")]
    SOFA_ACTS = ("tv", "read", "phone", "nap")

    def family_moments(self):
        """Small things between family members: leaning on each other on the sofa, helping with the cooking."""
        if self.remote:
            return
        people = [p for p in self.present_people() if p.ctrl is None]
        adults = [p for p in people if p.role == "adult"]
        for i, a in enumerate(people):
            for b in people[i + 1:]:
                if not (a.state == "act" and b.state == "act" and a.act in self.SOFA_ACTS and b.act in self.SOFA_ACTS):
                    continue
                if not (a.spot and b.spot and a.spot[0] == b.spot[0] and a.pose == "sit" and b.pose == "sit"):
                    continue
                if random.random() > 0.2 or self.t < max(getattr(a, "lean_next", 0), getattr(b, "lean_next", 0)):
                    continue
                dur = random.uniform(8, 16)
                side = 1 if b.x > a.x else -1
                a.lean = (side, self.t + dur, self.t)
                if b.role == "adult":
                    b.lean = (-side, self.t + dur, self.t)
                a.lean_next = b.lean_next = self.t + random.uniform(60, 140)
                q, r = random.choice(self.PAIR_TALK)
                a.say(q, 2.4)
                b.say(r, 2.4, delay=2.6)
                a.spawn("heart", 1)
                return
        cooks = [p for p in adults if p.act == "cook" and p.state == "act"]
        if cooks and random.random() < 0.25:
            cook = cooks[0]
            if any(p.act == "help_cook" for p in people):
                return
            h = self.hour()
            helpers = [p for p in adults if p is not cook and p.state in ("idle", "act")
                       and p.act in ("idle", "wander", "phone", "read", "tv") and not p.asleep_at(h)
                       and p.hold is None and not p.away]
            if not helpers:
                return
            hp = helpers[0]
            key, sp = hp.find_spot(("counter",), "wash")
            if key is None or sp["item"].f != cook.f:
                return
            hp.stop()
            if hp.state == "act":
                hp.end_act()
            if hp.go_do(key, sp, "help_cook", random.uniform(40, 90), "cook", None):
                q, r = random.choice(self.COOK_TALK)

                def talk():
                    if hp.act == "help_cook" and cook.act == "cook":
                        hp.say(q, 2.2)
                        cook.say(r, 2.4, delay=2.4)
                self.later(8.0, talk)

    def show_homework(self, kid):
        """Homework done: the kid takes it to a grown-up, who has a look and says something nice."""
        h = self.hour()
        adults = [p for p in self.present_people() if p.role == "adult" and p.act not in ("sleep", "going_out", "return")
                  and not p.asleep_at(h) and p.ctrl is None and not p.away]
        if not adults or random.random() > 0.8:
            return False
        ad = min(adults, key=lambda p: (p.f != kid.f, math.hypot(p.x - kid.x, p.y - kid.y)))
        nav = self.nav[ad.f]
        side = 1 if kid.x < ad.x or kid.f != ad.f else -1
        tx, ty = ad.x - side * 30, ad.y - 4
        if not nav.ok_at(tx, ty):
            tx = ad.x + side * 30
            if not nav.ok_at(tx, ty):
                tx, ty = self.stand_near(ad.f, ad.x, ad.y)
        kid.release_spot()
        kid.act = "show_homework"
        kid.pose, kid.prop, kid.seat, kid.h = "stand", "book", 0.0, 0.0
        kid.set_state("act", 60)

        def arrive():
            if ad.away or ad.act == "sleep":
                kid.end_act()
                return
            kid.facing = 1 if ad.x >= kid.x else -1
            kid.view = "side"
            kid.pose, kid.prop = "stand", "book"
            kid.set_state("act", 4.5)
            kid.say(random.choice(["我写完作业啦！", "你看你看，全对！", "帮我检查一下～"]), 2.2)
            if ad.seat <= 0 and ad.view == "back":
                ad.view = "side"
            if ad.seat <= 0:
                ad.facing = -kid.facing
            ad.say(random.choice(["真棒！", "写得真认真", "这道题做得好", "奖励你看一会儿动画片"]), 2.4, delay=2.2)
            self.later(2.4, lambda: kid.spawn("heart", 2))
        if not kid.go(ad.f, tx, ty, 0, False, arrive):
            kid.end_act()
            return False
        return True

    def start_goodnight(self, adult, kid):
        bed = self.item_by_id(kid.spot[0]) if kid.spot else None
        if bed is None:
            return False
        adult.stop()
        if adult.state == "act":
            adult.end_act()
        adult.release_spot()
        adult.act = "goodnight"
        adult.set_state("act", 90)
        tx, ty = self.stand_near(bed.f, kid.x, bed.fp()[1] - 4)

        def arrive():
            adult.facing = 1 if kid.x >= adult.x else -1
            adult.view = "side"
            adult.pose = "pet"
            adult.act = "goodnight"
            adult.set_state("act", 4.5)
            adult.say(life_line("goodnight"), 2.6)
            adult.spawn("heart", 1)
        if not adult.go(bed.f, tx, ty, 0, False, arrive):
            adult.end_act()
            return False
        return True

    # ---- petting moods ------------------------------------------------------------------------------------
    def pet_style(self, c):
        log = [t for t in getattr(c, "pet_log", []) if self.t - t < 150]
        log.append(self.t)
        c.pet_log = log
        mood = c.src.stats.get("mood", 60)
        if (len(log) > 3 and random.random() < 0.7) or (mood < 30 and random.random() < 0.6):
            return "refuse"
        r = random.random()
        if r < 0.28:
            return "belly"
        if r < 0.55:
            return "rub"
        return "lean"

    # ---- things pushed off tables ---------------------------------------------------------------------------
    def spawn_drop(self, f, x, y, z, kind, vx):
        self.drops.append({"f": f, "x": x, "y": y, "z": z, "vx": vx, "vy": random.uniform(-14, -4), "vz": 30.0,
                           "kind": kind, "rot": 0.0, "vr": random.choice((-1, 1)) * random.uniform(240, 420),
                           "rest": False, "t": 0.0, "id": random.randint(1, 1 << 30)})
        if len(self.drops) > 8:
            self.drops = self.drops[-8:]

    def step_drops(self, dt):
        for d in self.drops:
            d["t"] += dt
            if d["rest"]:
                continue
            d["vz"] -= 900 * dt
            d["x"] += d["vx"] * dt
            d["y"] += d["vy"] * dt
            d["z"] += d["vz"] * dt
            d["rot"] += d["vr"] * dt
            if d["z"] <= 0:
                d["z"] = 0.0
                if d["vz"] < -160:
                    d["vz"] = -d["vz"] * 0.3
                    d["vx"] *= 0.5
                    d["vr"] *= 0.5
                    if not d.get("clink"):
                        d["clink"] = True
                        self.on_drop_landed(d)
                else:
                    d["rest"] = True
                    d["rot"] = 90.0 if d["kind"] in ("mug", "cup", "remote", "pen") else 0.0
                    if not d.get("clink"):
                        d["clink"] = True
                        self.on_drop_landed(d)
            nav = self.nav[d["f"]]
            if not nav.ok_at(d["x"], d["y"]) and d["z"] < 30:
                d["vx"] = -d["vx"] * 0.3

    def on_drop_landed(self, d):
        """Clink! The cats look, a grown-up nearby comes to pick it up (a dropped morsel is for the cats)."""
        if d.get("kind") == "morsel":
            cats = [c for c in self.cats if c.f == d["f"] and c.ctrl is None and c.h < 0.5
                    and c.state in ("idle", "rest") and c.data.get("pose") != "sleep"
                    and math.hypot(c.x - d["x"], c.y - d["y"]) < 420]
            if cats:
                c = min(cats, key=lambda c: math.hypot(c.x - d["x"], c.y - d["y"]))
                c.interrupt()
                c.release_spot()
                c.act_morsel()
            return
        self.sfx("clink", 2)
        for c in self.cats:
            if c.f == d["f"] and c.free() and math.hypot(c.x - d["x"], c.y - d["y"]) < 260:
                c.facing = 1 if d["x"] >= c.x else -1
                c.spawn("ex", 1)
        adults = [p for p in self.present_people() if p.role == "adult" and p.f == d["f"] and p.ctrl is None
                  and p.act not in ("sleep", "away") and p.state in ("idle", "act") and getattr(p, "hold", None) is None]
        if not adults:
            return
        pr = min(adults, key=lambda p: math.hypot(p.x - d["x"], p.y - d["y"]))
        if pr.act in ("cook", "feed", "going_out", "return", "tidy") or pr.act.startswith("going"):
            return
        culprit = d.get("by")
        cname = culprit.name if culprit is not None else "猫"
        pr.say(life_line("knock_after", c=cname), 2.2)
        self.start_pickup_drop(pr, d)

    def start_pickup_drop(self, pr, d):
        pr.stop()
        if pr.state == "act":
            pr.end_act()
        pr.release_spot()
        pr.act = "pickup"
        pr.set_state("act", 40)
        nav = self.nav[d["f"]]
        tx, ty = d["x"] - 26, d["y"] + 6
        if not nav.ok_at(tx, ty):
            tx, ty = d["x"] + 26, d["y"] + 6
        if not nav.ok_at(tx, ty):
            cell = nav.nearest(d["x"], d["y"], 8)
            if cell is None:
                pr.end_act()
                return
            tx, ty = nav.center(*cell)

        def arrive():
            pr.facing = 1 if d["x"] >= pr.x else -1
            pr.view = "side"
            pr.pose = "crouch"
            pr.data["drop"] = d["id"]
            pr.set_state("act", 1.4)
            pr.data["drop"] = d["id"]
            pr.act = "pickup"
        if not pr.go(d["f"], tx, ty, 0, False, arrive):
            pr.end_act()

    def finish_pickup(self, pr):
        did = pr.data.get("drop")
        self.drops = [d for d in self.drops if d["id"] != did]
        if random.random() < 0.6:
            pr.say(life_line("pickup_drop"), 2.0)

    def drops_to_net(self):
        return [[d["f"], round(d["x"], 1), round(d["y"], 1), round(d["z"], 1), d["kind"], round(d["rot"]), d["id"]]
                + ([d.get("gift"), d.get("from")] if d["kind"] == "gift" else []) for d in self.drops]

    def drops_from_net(self, rows):
        out = []
        for r in rows or []:
            try:
                out.append({"f": int(r[0]), "x": float(r[1]), "y": float(r[2]), "z": float(r[3]), "kind": str(r[4]),
                            "rot": float(r[5]), "id": int(r[6]), "rest": True, "t": 0.0, "vx": 0, "vy": 0, "vz": 0,
                            "vr": 0})
                if len(r) >= 9 and out[-1]["kind"] == "gift":
                    out[-1]["gift"], out[-1]["from"] = str(r[7]), str(r[8])
            except (TypeError, ValueError, IndexError):
                pass
        self.drops = out


# ---- drawing ------------------------------------------------------------------------------------------------
def draw_drop(p, kind, x, y, rot):
    """A small household thing lying on / falling to the floor; (x, y) is its centre on screen."""
    p.save()
    p.translate(x, y)
    p.rotate(rot)
    ol = QPen(QColor(90, 64, 52, 220), 1.0)
    p.setPen(ol)
    if kind == "mug":
        p.setBrush(QColor("#f4f1ea"))
        p.drawRoundedRect(QRectF(-5, -6, 10, 12), 2, 2)
        p.setBrush(Qt.NoBrush)
        p.setPen(QPen(QColor(90, 64, 52, 220), 1.6))
        p.drawArc(QRectF(3, -3, 6, 6), -90 * 16, 180 * 16)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e57373"))
        p.drawRect(QRectF(-5, -2, 10, 3))
    elif kind == "cup":
        p.setBrush(QColor(170, 210, 235, 220))
        path = QPainterPath(QPointF(-5, -6))
        path.lineTo(5, -6)
        path.lineTo(3.5, 6)
        path.lineTo(-3.5, 6)
        path.closeSubpath()
        p.drawPath(path)
    elif kind == "pen":
        p.setBrush(QColor("#4f7fd1"))
        p.drawRoundedRect(QRectF(-8, -1.4, 16, 2.8), 1.2, 1.2)
        p.setBrush(QColor("#f2d16b"))
        p.drawRect(QRectF(6, -1.4, 2.5, 2.8))
    elif kind == "remote":
        p.setBrush(QColor("#3d3f46"))
        p.drawRoundedRect(QRectF(-3.5, -8, 7, 16), 2, 2)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e57373"))
        p.drawEllipse(QPointF(0, -5), 1.3, 1.3)
        p.setBrush(QColor("#bfc4cc"))
        for i in range(3):
            p.drawEllipse(QPointF(0, -1 + i * 2.6), 1.0, 0.8)
    elif kind == "morsel":
        p.setPen(QPen(QColor(120, 70, 40, 200), 0.6))
        p.setBrush(QColor("#c98a4b"))
        p.drawEllipse(QPointF(0, 0), 2.6, 1.8)
        p.setBrush(QColor("#e8b27a"))
        p.drawEllipse(QPointF(-0.6, -0.5), 1.0, 0.7)
    else:  # book
        p.setBrush(QColor("#7fb77e"))
        p.drawRect(QRectF(-7, -5, 14, 10))
        p.setPen(QPen(QColor(255, 255, 255, 200), 1.0))
        p.drawLine(QPointF(-5, -3), QPointF(4, -3))
    p.restore()


def drop_on_table(kind):
    """Table-top things a cat may target, drawn on the table edge before the push."""
    return kind in DROP_KINDS
