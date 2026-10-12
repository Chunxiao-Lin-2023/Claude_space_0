# -*- coding: utf-8 -*-
"""Playing in the cat house: take control of a cat or a family member, walk around, use the furniture,
chat, and play -- cute fights (swat / pounce / pillow & yarn-ball throwing, hearts, knock-outs) and timed
mini-games (抢小鱼干, 捉蝴蝶).

Everything here runs on the machine that owns the world (the host when two people share a house). Inputs
arrive as commands: Play.command(pid, name, args) -- from this computer ("host") or from the friend who
joined over the network ("guest"). The guest only draws what the host sends (see house_net.py)."""

import math
import random
import time

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QColor, QFont, QFontMetricsF, QLinearGradient, QPainterPath, QPen, QRadialGradient

from . import house_art as H
from .art import clamp

PLAYER_COLORS = {"host": "#e8615a", "guest": "#3f8fe0", "guest2": "#3fae6a", "guest3": "#a05fd0", "ai": "#8a8a96"}
MAX_HEARTS = 5
KO_TO_WIN = 3
KO_TIME = 3.5
GAME_LEN = {"fish": 60.0, "bfly": 60.0, "fight": 120.0, "steal": 90.0}
STEAL_FISH = 6
STEAL_WIN = 3                          # fish the cats must get home to win
EMOTES_PERSON = ("wave", "heart", "clap", "dance")
EMOTES_CAT = ("meow", "heart", "roll", "stretch")
GAME_NAMES = {"fish": "抢小鱼干", "bfly": "捉蝴蝶", "fight": "打闹对决", "steal": "偷鱼大作战"}

OUCH = ["哎呀！", "喵呜！", "疼疼疼～", "啊！", "你来真的？！", "嗷！"]
KO_LINES = ["我……不行了……", "装死中……", "喵……（倒下）", "下次一定赢！"]
WIN_LINES = ["我赢啦！", "耶～", "哼哼，厉害吧", "再来一局？"]
NPC_HIT = {"cat": ["喵！？", "干嘛打我！", "哼，不理你了"], "person": ["哎呀～别闹！", "好啦好啦", "哈哈，住手～"]}
MEOWS = ["喵～", "喵喵！", "喵呜～", "咕噜咕噜", "喵？", "喵——"]
WAVES = ["嗨～", "你好呀！", "来玩呀～", "哈喽！"]
FISH_LINES = ["小鱼干！", "我的！", "好香～", "嘿嘿，又一条"]
BFLY_LINES = ["抓到啦！", "蝴蝶～", "嘿！", "好漂亮"]

# which spot kinds a controlled cat can use, and what it then does: (state, pose, duration)
JUMP_UP = 92.0          # highest a player's cat can leap from where it stands
CAT_USE = {
    "sleep": ("rest", "loaf", 1e9), "perch": ("rest", "sit", 1e9), "watch": ("rest", "sit", 1e9),
    "hide": ("rest", "loaf", 1e9), "watch_tank": ("rest", "sit", 1e9), "watch_birds": ("rest", "sit", 1e9),
    "watch_pond": ("rest", "sit", 1e9), "tv": ("rest", "sit", 1e9), "litter": ("rest", "sit", 4.0),
    "beg": ("rest", "beg", 1e9), "scratch": ("scratch", "stretch", 4.0), "bat": ("bat", "swat", 5.0),
    "nibble": ("nibble", "eat", 3.0), "eat": ("eat", "eat", 7.0), "drink": ("eat", "eat", 4.0),
    "play": ("play", "crouch", 8.0),
}
PERSON_USE = {"cook": "cook", "wash": "wash", "eat": "eat", "laundry": "laundry", "toilet": "toilet", "feed": "feed",
              "water": "water", "play": "play", "swing": "swing", "bbq": "bbq", "hang": "hang"}


_WORLD = [None]


def now():
    """Game time: the world's clock (it advances with the simulation)."""
    w = _WORLD[0]
    return w.t if w is not None else time.monotonic()


class Play:
    def __init__(self, world):
        self.world = world
        self.players = {}        # pid -> {"name", "agent": uid or None, "dir": (dx, dy)}
        self.game = None         # {"kind", "end", "scores": {pid: n}, "fighters": {pid: uid}}
        self.pickups = []        # {"id", "f", "x", "y", "t"}
        self.shots = []          # flying pillows / yarn balls
        self.banner = None       # {"text", "until"}
        self.dark = None         # (v27) 躲猫猫: the house is dark while a cat hides {"name", "until", "dur", "then"}
        self.fx = []             # particles to forward to the guest
        self.hearts = {}         # uid -> hearts (only during a fight)
        self.next_id = 1
        self.local = "host"      # who is sitting at this computer
        self.ai_cd = 0.0

    # ---- players ---------------------------------------------------------------------------------
    def add_player(self, pid, name):
        pl = self.players.setdefault(pid, {"name": name, "agent": None, "dir": (0.0, 0.0)})
        pl["name"] = name
        return pl

    def remove_player(self, pid):
        pl = self.players.pop(pid, None)
        if pl and pl.get("agent"):
            a = self.world.agent_by_uid(pl["agent"])
            if a is not None:
                self.release(a)
        if self.game:
            self.game["scores"].pop(pid, None)
            self.game.get("fighters", {}).pop(pid, None)

    def name_of(self, pid, viewer=None):
        if viewer is not None and pid == viewer:
            return "我"
        if pid == "ai":
            return "AI"
        pl = self.players.get(pid)
        return (pl or {}).get("name") or ("房主" if pid == "host" else "好友")

    def agent_of(self, pid):
        pl = self.players.get(pid)
        if not pl or not pl.get("agent"):
            return None
        return self.world.agent_by_uid(pl["agent"])

    def controller_of(self, a):
        return getattr(a, "ctrl", None)

    # ---- taking control ---------------------------------------------------------------------------
    def control(self, pid, uid):
        if uid is not None and str(uid).startswith(("v:", "n:")):
            return False                     # visiting strays can't be controlled
        pl = self.players.get(pid) or self.add_player(pid, self.name_of(pid))
        old = self.agent_of(pid)
        if uid is None:
            if old is not None:
                self.release(old)
            pl["agent"] = None
            return True
        a = self.world.agent_by_uid(uid)
        if a is None or a.away:
            return False
        if a.ctrl is not None and a.ctrl != pid:
            if a.ctrl == "ai":
                self.release(a)
            else:
                return False
        if old is not None and old is not a:
            self.release(old)
        pl["agent"] = a.uid
        pl["dir"] = (0.0, 0.0)
        a.ctrl = pid
        if a.state in ("held", "fall"):
            return True
        if a.is_cat:
            a.interrupt()
            if a.state not in ("rest", "eat"):
                a.set_state("idle", 1e9)
        else:
            if a.state == "act" and a.act == "sleep":
                a.end_act()
            elif a.state not in ("act",):
                a.stop()
                a.set_state("idle", 1e9)
        a.say("我来啦！" if not a.is_cat else random.choice(MEOWS))
        return True

    def release(self, a):
        a.ctrl = None
        a.data.pop("ctrl_act", None)
        if not a.is_cat and getattr(a, "hold", None) is not None and a.hold.get("mode") == "carry":
            self.world.set_down_cat(a)
            a.prop = None
        if a.state == "ko":
            a.set_state("idle", 1.0)
        if a.is_cat:
            if a.state == "idle":
                a.timer = 1.0
        elif a.state == "idle":
            a.timer = 1.0
        for pl in self.players.values():
            if pl.get("agent") == a.uid:
                pl["agent"] = None

    def dir_of(self, a):
        pl = self.players.get(a.ctrl)
        return pl["dir"] if pl else (0.0, 0.0)

    def runs(self, a):
        """(v26) Walk or run: the player's choice (R switches)."""
        pl = self.players.get(a.ctrl)
        return bool(pl and pl.get("run"))

    # ---- every frame, for a controlled agent (called from its update) -----------------------------
    def ctrl_step(self, a, dt):
        """Runs before the agent's own logic. True: this frame is handled here."""
        if a.state == "ko":
            a.timer -= dt
            if a.is_cat:
                a.set_pose("belly")
            else:
                a.pose, a.view, a.prop, a.seat = "floor", "front", None, 0.0
            if random.random() < dt * 1.5:
                a.spawn("z", 1)
            if a.timer <= 0:
                self.hearts[a.uid] = MAX_HEARTS if a.uid in self.hearts else 0
                a.data["inv"] = self.world.t + 1.5
                a.set_state("idle", 1e9)
                a.say("我又回来啦！")
            return True
        if a.ctrl == "ai":
            self.ai_step(a, dt)
        act = a.data.get("ctrl_act")
        if act is not None:
            self.step_action(a, act, dt)
            return True
        g = self.game
        if g and g["kind"] == "steal" and self.world.t < (g.get("stun") or {}).get(a.uid, 0):
            a.set_pose("grumpy") if a.is_cat else None
            return not a.path
        if a.state in ("held", "fall"):
            return False
        dx, dy = self.dir_of(a)
        if dx or dy:
            if a.stairs_u is not None or (a.path and a.path[0]["t"] in ("jump", "door", "stairs", "travel")):
                return False                       # (v26: keep going up / down the stairs with the key held)
            if a.path:
                a.path = []
                a.then = None
            if not self.leave_activity(a):
                return False
            self.manual_move(a, dx, dy, dt)
            return True
        return False

    def leave_activity(self, a):
        """Stop sitting / sleeping / eating before walking off. False if a hop down was started."""
        if a.is_cat:
            if a.h > 0.5:
                a.release_spot()
                ux, uy = self.dir_of(a)
                land = None
                if ux or uy:
                    n = math.hypot(ux, uy)
                    land = self.landing_point(a, ux / n, uy / n)
                if land is None:
                    nav = self.world.nav[a.f]
                    c = nav.nearest(a.x, a.y, 8)
                    land = nav.center(*c) if c is not None else None
                if land is not None:
                    x, y = land
                    a.path = [{"t": "jump", "x": x, "y": y, "h": 0.0}]
                    a.then = lambda: a.set_state("idle", 1e9)
                    a.set_state("idle", 1e9)
                    return False
                a.h = 0.0
            if a.spot is not None:
                a.release_spot()
            if a.state != "idle":
                a.set_state("idle", 1e9)
        else:
            if a.state == "act" or a.seat > 0 or a.h > 0.5:
                a.end_act()
                a.set_state("idle", 1e9)
            elif a.state != "idle":
                a.set_state("idle", 1e9)
        return True

    def manual_move(self, a, dx, dy, dt):
        w = self.world
        n = math.hypot(dx, dy) or 1.0
        run = self.runs(a)
        if a.is_cat:
            speed = a.run_v * 0.85 if run else a.walk_v * 1.15
        else:
            speed = a.walk_v * (2.1 if run else 1.3)
        vx, vy = dx / n * speed, dy / n * speed
        nav = w.nav[a.f]
        nx, ny = a.x + vx * dt, a.y + vy * dt
        if self.stair_mouth(a, dx, dy, nx, ny):
            return
        moved = False
        if nav.ok_at(nx, ny):
            a.x, a.y = nx, ny
            moved = True
        elif vx and nav.ok_at(nx, a.y):
            a.x = nx
            moved = True
        elif vy and nav.ok_at(a.x, ny):
            a.y = ny
            moved = True
        if not moved:
            self.try_portal(a, dx, dy)
        step = math.hypot(vx, vy) * dt
        a.moved += step if moved else 0.0
        a.motion = (vx, vy)
        if abs(vx) > 1:
            a.facing = 1 if vx > 0 else -1
        if a.is_cat:
            a.running = run
            a.set_pose(("run" if run else "walk") if moved else "stand")
        else:
            from .house import view_for
            a.pose = "walk" if moved else "stand"
            a.view = view_for(vx, vy, a.view)
            a.seat = 0.0

    def stair_mouth(self, a, dx, dy, nx, ny):
        """(v24) Walking into the foot of the stairs (from the front or from either side) goes up; walking into
        the head of the flight upstairs goes down. No need to hit it exactly head-on any more."""
        s = H.STAIR
        if a.f == 0:
            bx, by = H.STAIR_BOTTOM
            near = math.hypot(nx - bx, ny - by) < 52
            into = s["x0"] - 6 <= nx <= s["x1"] + 6 and s["y0"] - 26 <= ny <= s["y0"] + 40
            toward = dy > 0 or (dx and (bx - a.x) * dx > 0 and abs(a.y - by) < 28)
            if (near and toward) or into:
                a.path = [{"t": "stairs", "up": True}]
                return True
        elif a.f == 1:
            tx, ty = H.STAIR_TOP
            near = math.hypot(nx - tx, ny - ty) < 52
            into = s["x0"] - 6 <= nx <= s["x1"] + 6 and s["y1"] - 40 <= ny <= s["y1"] + 8
            toward = dy < 0 or (dx and (tx - a.x) * dx > 0 and abs(a.y - ty) < 28)
            if (near and toward) or into:
                a.path = [{"t": "stairs", "up": False}]
                return True
        return False

    def try_portal(self, a, dx, dy):
        """Walking into the stairs or the front door takes them."""
        if a.f == 0 and dy > 0 and math.hypot(a.x - H.STAIR_BOTTOM[0], a.y - H.STAIR_BOTTOM[1]) < 40:
            a.path = [{"t": "stairs", "up": True}]
        elif a.f == 1 and dy < 0 and math.hypot(a.x - H.STAIR_TOP[0], a.y - H.STAIR_TOP[1]) < 40:
            a.path = [{"t": "stairs", "up": False}]
        elif a.f == 0 and (dx * (-1 if H.SIDE_DOOR[0] == "left" else 1) > 0 or dy < 0) and \
                math.hypot(a.x - H.INSIDE_DOOR[0], a.y - H.INSIDE_DOOR[1]) < 46:
            a.path = [{"t": "door", "f": 2, "x": H.YARD_DOOR[0], "y": H.YARD_DOOR[1]}]
        elif a.f == 2 and dy > 0 and math.hypot(a.x - H.YARD_DOOR[0], a.y - H.YARD_DOOR[1]) < 46:
            a.path = [{"t": "door", "f": 0, "x": H.INSIDE_DOOR[0], "y": H.INSIDE_DOOR[1]}]

    # ---- commands ------------------------------------------------------------------------------------
    def command(self, pid, name, args):
        """Apply a player's input (validated: it may come over the network)."""
        try:
            return self._command(pid, name, args or {})
        except (TypeError, ValueError, KeyError) as ex:
            print("play command %r: %r" % (name, ex))
            return None

    def _command(self, pid, name, a):
        w = self.world
        if pid not in self.players:
            self.add_player(pid, self.name_of(pid))
        me = self.agent_of(pid)
        if name == "ctrl":
            uid = a.get("uid")
            return self.control(pid, str(uid) if uid else None)
        if name == "dir":
            dx = clamp(float(a.get("dx", 0)), -1, 1)
            dy = clamp(float(a.get("dy", 0)), -1, 1)
            self.players[pid]["dir"] = (dx, dy)
            return True
        if name == "gait":
            pl = self.players.get(pid)
            if pl is not None:
                pl["run"] = not pl.get("run")
                if me is not None:
                    me.say("跑起来！" if pl["run"] else "慢慢走～", 1.2)
            return True
        if name == "say":
            text = str(a.get("text", ""))[:40].strip()
            if text:
                if me is not None:
                    me.say(text, clamp(2.0 + 0.15 * len(text), 2.5, 6.0))
                else:
                    self.banner = {"text": "%s：%s" % (self.name_of(pid), text), "until": self.world.t + 4.5}
            return True
        if name == "bkey":
            self.world.battle_input(pid, str(a.get("k")), bool(a.get("d")))
            return True
        if name == "game":
            return self.start_game(str(a.get("kind")), pid)
        if name == "stop_game":
            self.end_game(stopped=True)
            return True
        if me is None or me.state == "ko":
            return False
        if name == "goto":
            f = int(a.get("f"))
            if f not in (0, 1, 2) and f not in getattr(w, "nav", {}):
                return False
            x = clamp(float(a.get("x")), 0, H.PW)
            y = clamp(float(a.get("y")), H.BALCONY[2], H.PD)
            if me.state in ("held", "fall") or me.stairs_u is not None:
                return False
            me.data.pop("ctrl_act", None)
            if not self.leave_activity(me):
                then = me.then
                me.then = lambda: (then and then(), me.go(f, x, y, 0, False))
                return True
            dist = math.hypot(x - me.x, y - me.y) + (400 if f != me.f else 0)
            ok = me.go(f, x, y, 0, self.runs(me), lambda: me.set_state("idle", 1e9))
            if ok:
                me.set_state("idle", 1e9)
            return ok
        if name == "use":
            it = w.item_by_id(int(a.get("item")))
            if it is None:
                return False
            pick = a.get("spot")
            return self.use_item(me, it, int(pick) if isinstance(pick, (int, float)) else None)
        if name == "click":
            other = w.agent_by_uid(str(a.get("uid")))
            if other is None or other is me:
                return False
            return self.interact(me, other, how="click")
        if name == "act":
            kind = str(a.get("kind"))
            tx, ty = a.get("tx"), a.get("ty")
            target = None
            if tx is not None and ty is not None and int(a.get("tf", -1)) == me.f:
                target = (clamp(float(tx), 0, H.PW), clamp(float(ty), H.BALCONY[2], H.PD))
            dirv = None
            if a.get("jdx") is not None or a.get("jdy") is not None:
                dirv = (clamp(float(a.get("jdx") or 0), -1, 1), clamp(float(a.get("jdy") or 0), -1, 1))
                if not (math.isfinite(dirv[0]) and math.isfinite(dirv[1])) or dirv == (0.0, 0.0):
                    dirv = None
            return self.action(me, kind, target, dirv)
        if name == "use_near":
            return self.use_near(me)
        if name == "emote":
            return self.emote(me, int(a.get("e", 1)))
        if name == "pick":
            if me.is_cat:
                return False
            pname = a.get("name") if a.get("name") in w.plush else w.plush_near(me, 400)
            if pname is None:
                return False
            if not self.leave_activity(me):
                return False
            ok = w.go_pick(me, pname, lambda ok: me.set_state("idle", 1e9) if me.state != "act" else None)
            return ok
        if name == "put" and not me.is_cat and getattr(me, "hold", None) is not None:
            it = w.item_by_id(int(a["item"])) if a.get("item") is not None else None
            return self.put_cat(me, it)
        if name == "put":
            if me.is_cat or w.carried_by(me) is None:
                return False
            it = w.item_by_id(int(a["item"])) if a.get("item") is not None else None
            if it is None and not a.get("floor"):
                it = w.surface_near(me)
            if not self.leave_activity(me):
                return False
            return w.go_put(me, it, lambda ok: me.set_state("idle", 1e9) if me.state != "act" else None)
        return False

    # ---- using furniture & meeting others -----------------------------------------------------------
    def use_item(self, a, it, pick=None):
        """pick: (v26) the spot that was clicked (a level of a cat tree, the top of a cupboard...)."""
        w = self.world
        if a.state in ("held", "fall"):
            return False
        cands = []
        for idx, sp in it.spots():
            if (sp["who"] == "cat") != a.is_cat:
                continue
            if a.is_cat and sp["kind"] not in CAT_USE:
                continue
            if not a.is_cat:
                if sp.get("kid") and a.role != "kid":
                    continue
                if sp["kind"] not in PERSON_USE and sp["kind"] not in ("sit", "sleep", "work"):
                    continue
            occ = w.occupied.get((it.id, idx))
            if occ is not None and occ is not a:
                continue
            cands.append((math.hypot(sp["x"] - a.x, sp["y"] - a.y), idx, sp))
        if not cands:
            a.say("喵？" if a.is_cat else "这个我用不了～")
            return False
        cands.sort(key=lambda c: (c[1] != pick, c[0]))
        _, idx, sp = cands[0]
        key = (it.id, idx)
        a.data.pop("ctrl_act", None)
        if a.is_cat:
            if a.h > 0.5 and a.spot != key:
                a.release_spot()
            state, pose, dur = CAT_USE[sp["kind"]]

            def arrive(sp=sp, state=state, pose=pose, dur=dur):
                a.face_spot(sp)
                if state == "eat":
                    food = sp["kind"] == "eat"
                    if food and it.state.get("food", 0) <= 2:
                        a.say("碗空了喵！")
                        a.set_state("rest", 1e9, pose="sit")
                        return
                    a.set_state("eat", dur, pose="eat", item=it.id, food=food)
                elif state == "rest":
                    a.set_state("rest", dur, pose=pose, then_sleep=sp["kind"] == "sleep")
                elif state == "play":
                    a.set_state("play", dur)
                else:
                    a.set_state(state, dur, pose=pose)
                if state == "bat":
                    it.state["swing"] = 1.0
            far = math.hypot(sp["x"] - a.x, sp["y"] - a.y) > 260 or sp["f"] != a.f
            ok = a.go_spot(key, far, arrive)
            if ok:
                a.set_state("idle", 1e9)
            return ok
        kind = sp["kind"]
        if kind == "sleep":
            return a.go_do(key, sp, "sleep", 1e9, "sleep", None)
        if kind == "sit":
            act = "bench" if it.type == "bench" else "read"
            return a.go_do(key, sp, act, 1e9, "sit", "book" if random.random() < 0.5 else None, None)
        if kind == "work":
            act = "homework" if a.role == "kid" else "laptop"
        else:
            act = PERSON_USE[kind]
        from .house import ACTS
        info = ACTS[act]
        dur = 3.5 if act == "feed" else (8.0 if act == "water" else 1e9)
        return a.go_do(key, sp, act, dur, info["pose"], info["prop"], info["line"])

    def put_cat(self, a, it=None):
        """Set down the cat in a's arms: in front of them, or (walking over first) onto furniture it."""
        w = self.world
        if it is not None:
            spots = [(k, sp) for k, sp in w.held_cat(a).free_spots(("perch", "sleep", "watch", "hide", "scratch"))
                     if sp["item"] is it] if w.held_cat(a) is not None else []
            if spots:
                key, sp = min(spots, key=lambda ks: math.hypot(ks[1]["x"] - a.x, ks[1]["y"] - a.y))
                if a.state == "act":
                    a.end_act()
                a.set_state("idle", 1e9)

                def arrive():
                    a.facing = 1 if sp["x"] >= a.x else -1
                    w.set_down_cat(a, onto=(key, sp))
                    a.set_state("idle", 1e9)
                if a.f == sp["f"] and math.hypot(sp["x"] - a.x, sp["y"] - a.y) < 70:
                    arrive()
                    return True
                tx, ty = w.stand_near(sp["f"], sp["x"], sp["y"])
                return a.go(sp["f"], tx, ty, 0, False, arrive)
        if a.state == "act" and a.seat > 0:
            a.end_act()
        ok = w.set_down_cat(a)
        a.pose = "stand"
        if a.state != "idle":
            a.set_state("idle", 1e9)
        return ok

    def hold_cat(self, a, c):
        """Clicking a cat as a person: pick it up (walking over first); clicking the one you hold: put it down."""
        w = self.world
        if getattr(a, "hold", None) is not None:
            return self.put_cat(a)
        if c.ctrl is not None:
            a.say("%s不让抱～" % c.name)
            return False
        if c.state == "carried" or c.h > 60 or c.stairs_u is not None:
            a.say("够不着%s" % c.name if c.h > 60 else "%s～" % c.name)
            return False
        self.leave_activity(a)
        return a.approach_cat(c, "cuddle", 1e9)

    def use_near(self, a):
        """E key: pick up / put down a toy, or use the closest furniture, or meet the closest cat / person."""
        w = self.world
        if not a.is_cat and getattr(a, "hold", None) is not None:
            return self.put_cat(a)
        if not a.is_cat:
            if w.carried_by(a) is not None:
                self.leave_activity(a)
                return w.go_put(a, w.surface_near(a), lambda ok: a.set_state("idle", 1e9))
            pname = w.plush_near(a, 90)
            if pname is not None:
                self.leave_activity(a)
                return w.go_pick(a, pname, lambda ok: a.set_state("idle", 1e9))
        best = None
        for it in w.items:
            if it.f != a.f:
                continue
            for idx, sp in it.spots():
                if (sp["who"] == "cat") != a.is_cat:
                    continue
                d = math.hypot(sp["x"] - a.x, sp["y"] - a.y)
                if d < 90 and (best is None or d < best[0]):
                    best = (d, "item", it)
        for o in w.agents():
            if o is a or o.f != a.f or not o.visible_on(a.f):
                continue
            d = math.hypot(o.x - a.x, o.y - a.y)
            if d < 70 and (best is None or d < best[0] - 15):
                best = (d, "agent", o)
        if best is None:
            a.say("这里没什么好玩的～" if not a.is_cat else "喵？")
            return False
        if best[1] == "item":
            return self.use_item(a, best[2])
        return self.interact(a, best[2])

    def interact(self, a, o, how="near"):
        """Clicking another character while you control one (how="click"), or E next to them."""
        if self.fighting(a, o):
            a.facing = 1 if o.x >= a.x else -1
            return self.action(a, "swat" if a.is_cat else "bonk", (o.x, o.y))
        if a.is_cat and not o.is_cat:
            if o.ctrl is None and o.away:
                return False
            return a.act_rub(o)
        if not a.is_cat and o.is_cat and o.uid.startswith("v:"):
            return self.world.feed_visitor(o, by=a)
        if a.is_cat and o.uid.startswith("v:"):
            return a.act_meet_visitor(o)
        if not a.is_cat and o.is_cat and how == "click":
            return self.hold_cat(a, o)
        if not a.is_cat and o.is_cat:
            if o.ctrl is not None or o.busy_with_people():
                a.say("%s～" % o.name)
                return False
            self.leave_activity(a)
            return a.approach_cat(o, "pet", 6.0)
        if a.is_cat and o.is_cat:
            self.leave_activity(a)
            side = 1 if a.x < o.x else -1
            tx, ty = o.x - side * 32, o.y

            def arrive():
                a.facing = side
                a.set_state("social", 4.0, pose=random.choice(("nuzzle", "greet")), other=o)
                a.spawn("heart", 1)
                if o.ctrl is None and o.free():
                    o.facing = -side
                    o.set_state("social", 4.0, pose="greet", other=a)
            return a.go(a.f, tx, ty, 0, False, arrive)
        # person and person
        a.facing = 1 if o.x >= a.x else -1
        a.say(random.choice(WAVES))
        a.pose = "wave"
        a.data["ctrl_act"] = {"kind": "wave", "t": 0.0}
        return True

    # ---- actions: swat, pounce, throw, bonk ------------------------------------------------------------
    def aim_dir(self, a, target=None, dirv=None):
        """Unit (dx, dy) of an action: the direction keys, else the mouse, else the way a is facing."""
        if dirv is not None:
            dx, dy = dirv
        elif target is not None and math.hypot(target[0] - a.x, target[1] - a.y) > 4:
            dx, dy = target[0] - a.x, target[1] - a.y
        else:
            dx, dy = float(a.facing), 0.0
        n = math.hypot(dx, dy) or 1.0
        return dx / n, dy / n

    def action(self, a, kind, target=None, dirv=None):
        if a.state in ("held", "fall", "ko", "carried") or a.stairs_u is not None or a.data.get("ctrl_act"):
            return False
        if a.path and a.path[0]["t"] in ("jump", "door"):
            return False
        if dirv is not None or target is not None:
            ux, uy = self.aim_dir(a, target, dirv)
            if abs(ux) > 0.15:
                a.facing = 1 if ux > 0 else -1
            if dirv is not None:
                target = (a.x + ux * 220, a.y + uy * 220)
        if kind in ("pounce", "throw") and a.is_cat:
            return self.leap(a, *self.aim_dir(a, target, dirv))
        if kind in ("meow", "emote"):
            if a.is_cat:
                a.say(random.choice(MEOWS))
                a.spawn("note", 1)
                self.world.app.play_sound("meow", a.src)
            else:
                a.say(random.choice(WAVES))
                a.data["ctrl_act"] = {"kind": "wave", "t": 0.0}
            return True
        if kind == "sleep":
            if a.is_cat:
                self.leave_activity(a)
                a.set_state("rest", 1e9, pose="loaf", then_sleep=True)
            return True
        if not self.leave_activity(a):
            return False
        if a.path:
            a.path = []
            a.then = None
        if target is not None and abs(target[0] - a.x) > 2:
            a.facing = 1 if target[0] > a.x else -1
        if kind == "swat" and a.is_cat:
            a.data["ctrl_act"] = {"kind": "swat", "t": 0.0, "hit": False}
            return True
        if kind == "bonk" and not a.is_cat:
            a.data["ctrl_act"] = {"kind": "bonk", "t": 0.0, "hit": False}
            return True
        if kind in ("throw", "pounce") and not a.is_cat:
            a.data["ctrl_act"] = {"kind": "throw", "t": 0.0, "done": False, "target": target}
            return True
        if kind == "bonk" and a.is_cat:
            return self.action(a, "swat", target)
        return False

    def landing_point(self, a, ux, uy, dists=(70, 95, 50, 120, 35)):
        """Where a cat lands when it jumps off something in direction (ux, uy)."""
        nav = self.world.nav[a.f]
        home = self.world.open_point(a.f)
        for dist in dists:
            x, y = a.x + ux * dist, a.y + uy * dist
            if nav.ok_at(x, y) and self.world.free_point(a.f, x, y, (a,)) and \
                    not H.wall_between(a.f, a.x, a.y, x, y) and nav.path((x, y), home) is not None:
                return x, y
        c = nav.nearest(a.x + ux * 60, a.y + uy * 60, 8)
        return nav.center(*c) if c else None

    def level_hop(self, a, up):
        """(v24) Space + ↑ / ↓ on a cat tree: the next level up (or down) nearby, whatever its direction."""
        w = self.world
        best = None
        for it in w.items:
            if it.f != a.f:
                continue
            for idx, sp in it.spots():
                if sp["who"] != "cat" or sp["h"] <= 0.5:
                    continue
                key = (it.id, idx)
                occ = w.occupied.get(key)
                if (occ is not None and occ is not a) or a.spot == key:
                    continue
                d = math.hypot(sp["x"] - a.x, sp["y"] - a.y)
                rise = sp["h"] - a.h
                if d > (130 if a.h > 0.5 else 80):
                    continue
                if H.wall_between(a.f, a.x, a.y, sp["x"], sp["y"]):
                    continue
                if up and 12 <= rise <= JUMP_UP:
                    score = rise + d * 0.6
                elif not up and a.h > 0.5 and 12 <= -rise <= 125:
                    score = -rise + d * 0.6
                else:
                    continue
                if best is None or score < best[0]:
                    best = (score, key, sp)
        return best

    def leap_target(self, a, ux, uy):
        """(v26) Where Space would take a cat going (ux, uy): ("level", key, spot) a level up / down,
        ("spot", key, spot) onto something that way, ("floor", (x, y)) down to the floor or a pounce, or None."""
        w = self.world
        if abs(uy) > 0.7 and abs(ux) < 0.5:
            best = self.level_hop(a, uy > 0)
            if best is not None:
                return ("level", best[1], best[2])
        best = None
        for it in w.items:
            if it.f != a.f:
                continue
            for idx, sp in it.spots():
                if sp["who"] != "cat" or sp["h"] <= 0.5:
                    continue
                key = (it.id, idx)
                occ = w.occupied.get(key)
                if (occ is not None and occ is not a) or a.spot == key:
                    continue
                rise = sp["h"] - a.h
                if rise > JUMP_UP or (a.h > 0.5 and -rise > 125):
                    continue
                dx, dy = sp["x"] - a.x, sp["y"] - a.y
                d = math.hypot(dx, dy)
                if d > (185 if a.h > 0.5 else 150) or H.wall_between(a.f, a.x, a.y, sp["x"], sp["y"]):
                    continue
                if d > 14:
                    along = (dx * ux + dy * uy) / d
                    if along < 0.5:
                        continue
                    score = d * (1.6 - along) + abs(rise) * 0.25
                else:
                    if abs(rise) < 15:
                        continue
                    score = 45 + abs(rise) * 0.25
                if best is None or score < best[0]:
                    best = (score, key, sp)
        if best is not None:
            return ("spot", best[1], best[2])
        if a.h > 0.5:
            land = self.landing_point(a, ux, uy)
            return ("floor", land) if land is not None else None
        nav = w.nav[a.f]
        ex, ey = a.x, a.y
        k = 10.0
        while k <= 130.0:
            x, y = a.x + ux * k, a.y + uy * k
            if not nav.ok_at(x, y):
                break
            ex, ey = x, y
            k += 8.0
        return ("floor", (ex, ey))

    def leap(self, a, ux, uy):
        """Space as a cat: jump that way - up onto the furniture there, down from a perch, or a pounce."""
        tg = self.leap_target(a, ux, uy)
        if tg is None:
            return False
        a.release_spot()
        a.stop()
        a.running = False
        a.set_state("idle", 1e9)
        if tg[0] in ("level", "spot"):
            _, key, sp = tg
            a.claim(key)
            a.path = [{"t": "jump", "x": sp["x"], "y": sp["y"], "h": sp["h"], "quick": True} if tg[0] == "level" else
                      {"t": "jump", "x": sp["x"], "y": sp["y"], "h": sp["h"], "pounce": True}]

            def landed():
                a.set_state("rest", 1e9, pose="sit")
                if sp["h"] >= 100 and random.random() < 0.5:
                    a.say(random.choice(["最高层！", "站得高看得远～", "喵！我上来啦", "这里视野真好"]))
            a.then = landed
            return True
        ex, ey = tg[1]
        if a.h > 0.5:
            a.path = [{"t": "jump", "x": ex, "y": ey, "h": 0.0}]
        else:
            a.path = [{"t": "jump", "x": ex, "y": ey, "h": 0.0, "pounce": True, "lift": 6.0 if abs(uy) < 0.7 else 16.0}]
        a.then = lambda: self.after_pounce(a)
        return True

    def emote(self, a, n):
        if a.state in ("held", "fall", "ko", "carried") or a.stairs_u is not None or a.data.get("ctrl_act") or a.path:
            return False
        names = EMOTES_CAT if a.is_cat else EMOTES_PERSON
        e = names[max(0, min(len(names) - 1, n - 1))]
        if a.is_cat and e == "meow":
            return self.action(a, "meow")
        if not a.is_cat and (a.state == "act" or a.seat > 0):
            a.end_act()
            a.set_state("idle", 1e9)
        elif a.is_cat and a.h < 0.5 and a.spot is not None:
            a.release_spot()
        a.data["ctrl_act"] = {"kind": "emote", "e": e, "t": 0.0}
        w = self.world
        if e == "heart":
            a.spawn("heart", 3)
        elif e == "clap":
            w.sfx("clap", 1.0)
        elif e == "dance":
            a.spawn("note", 2)
            w.sfx("pop", 1.0)
        elif e == "roll":
            a.spawn("heart", 1)
        return True

    EMOTE_LEN = {"wave": 1.4, "heart": 1.8, "clap": 1.4, "dance": 2.6, "roll": 2.0, "stretch": 1.5}

    def step_emote(self, a, act):
        e, t = act["e"], act["t"]
        if a.is_cat:
            a.set_pose({"heart": "nuzzle", "roll": "belly", "stretch": "stretch"}.get(e, "happy"))
            if e == "heart" and random.random() < 0.08:
                a.spawn("heart", 1)
        else:
            a.view = "front"
            a.pose = {"wave": "wave", "heart": "heart", "clap": "clap", "dance": "dance"}[e]
            a.prop = None if a.prop not in ("hug",) else a.prop
            if e == "dance" and random.random() < 0.06:
                a.spawn("note", 1)
        if t > self.EMOTE_LEN.get(e, 1.5):
            a.data.pop("ctrl_act", None)
            if a.is_cat:
                a.set_pose("stand")
            else:
                a.pose = "stand"

    def step_action(self, a, act, dt):
        act["t"] += dt
        k = act["kind"]
        if k == "emote":
            self.step_emote(a, act)
            return
        if k == "swat":
            a.set_pose("swat")
            if act["t"] > 0.16 and not act["hit"]:
                act["hit"] = True
                self.melee(a, 46)
            if act["t"] > 0.5:
                a.data.pop("ctrl_act", None)
                a.set_pose("stand")
        elif k == "bonk":
            a.pose, a.view, a.prop = "wave", "side", "pillow"
            if act["t"] > 0.18 and not act["hit"]:
                act["hit"] = True
                self.melee(a, 52)
            if act["t"] > 0.55:
                a.data.pop("ctrl_act", None)
                a.pose, a.prop = "stand", None
        elif k == "throw":
            a.pose, a.view = "reach", "side"
            if act["t"] > 0.12 and not act["done"]:
                act["done"] = True
                self.throw(a, act.get("target"))
            if act["t"] > 0.42:
                a.data.pop("ctrl_act", None)
                a.pose = "stand"
        elif k == "wave":
            a.pose = "wave"
            if act["t"] > 1.2:
                a.data.pop("ctrl_act", None)
                a.pose = "stand"
        else:
            a.data.pop("ctrl_act", None)

    def targets_near(self, a, x, y, r, ahead=None):
        out = []
        for o in self.world.agents():
            if o is a or o.away or o.f != a.f or o.stairs_u is not None or o.state == "ko":
                continue
            dx, dy = o.x - x, o.y - y
            if ahead is not None:
                if dx * ahead < -8 or abs(dx) > r or abs(dy) > 30:
                    continue
            elif math.hypot(dx, dy) > r:
                continue
            if abs(o.h - a.h) > 40:
                continue
            out.append(o)
        return out

    def melee(self, a, reach):
        hits = self.targets_near(a, a.x, a.y, reach, ahead=a.facing)
        for o in hits:
            self.hit(o, a)
        if not hits:
            self.fx_spawn(a, "q", 1)

    def after_pounce(self, a):
        a.set_state("idle", 1e9)
        for o in self.targets_near(a, a.x, a.y, 34):
            self.hit(o, a)
        if self.game and self.game["kind"] == "bfly" and a.f == 2:
            self.catch_butterflies(a, 44)

    def throw(self, a, target):
        sx, sy = a.x + a.facing * 14, a.y
        if target:
            dx, dy = target[0] - sx, target[1] - sy
        else:
            dx, dy = a.facing * 1.0, 0.0
        d = math.hypot(dx, dy) or 1.0
        sp = 320.0
        self.shots.append({"f": a.f, "x": sx, "y": sy, "z": 44.0 * a.hs, "vx": dx / d * sp, "vy": dy / d * sp,
                           "by": a.uid, "kind": "yarn" if a.role == "kid" else "pillow", "life": 1.15,
                           "spin": random.uniform(0, 360)})

    def fighting(self, a, o):
        g = self.game
        if not g or g["kind"] != "fight":
            return False
        uids = set(g["fighters"].values())
        return a.uid in uids and o.uid in uids

    def hit(self, o, a, power=1):
        t = self.world.t
        if o.data.get("inv", 0) > t:
            return
        dx, dy = o.x - a.x, o.y - a.y
        d = math.hypot(dx, dy) or 1.0
        nav = self.world.nav[o.f]
        if o.h < 0.5 and o.state not in ("held", "fall"):
            for k in (26, 16, 8):
                x, y = o.x + dx / d * k, o.y + dy / d * k
                if nav.ok_at(x, y):
                    o.x, o.y = x, y
                    break
        self.fx_spawn(o, "ex", 1)
        if self.fighting(a, o):
            hp = self.hearts.get(o.uid, MAX_HEARTS) - power
            self.hearts[o.uid] = max(0, hp)
            o.data["inv"] = t + 0.6
            if hp <= 0:
                self.knock_out(o, a)
            else:
                o.say(random.choice(OUCH), 1.6)
            return
        if o.ctrl is not None:
            o.say(random.choice(OUCH), 1.6)
            o.data["inv"] = t + 0.5
            return
        o.data["inv"] = t + 1.0
        if o.is_cat:
            if o.state not in ("held", "fall", "eat"):
                o.interrupt()
                o.release_spot()
                o.say(random.choice(NPC_HIT["cat"]))
                o.set_state("flee", 3.0)
        else:
            o.say(random.choice(NPC_HIT["person"]))

    def knock_out(self, o, a):
        g = self.game
        o.stop()
        o.release_spot()
        o.h = 0.0
        o.data.pop("ctrl_act", None)
        if not o.is_cat and o.state == "act":
            o.end_act()
        o.set_state("ko", KO_TIME)
        o.say(random.choice(KO_LINES), 2.5)
        self.fx_spawn(o, "ex", 2)
        winner = None
        for pid, uid in g["fighters"].items():
            if uid == a.uid:
                winner = pid
        if winner is not None:
            g["scores"][winner] = g["scores"].get(winner, 0) + 1
            self.banner = {"text": "%s 打倒了 %s！" % (self.name_of(winner), o.name), "until": self.world.t + 2.5}
            if g["scores"][winner] >= KO_TO_WIN:
                self.end_game()

    def fx_spawn(self, a, kind, n):
        a.spawn(kind, n)

    # ---- the AI opponent ----------------------------------------------------------------------------------
    def ai_step(self, a, dt):
        g = self.game
        pl = self.players.get("ai")
        if g and g["kind"] == "steal" and pl is not None:
            pl["dir"] = (0.0, 0.0)
            self.ai_steal(a, dt)
            return
        if not g or g["kind"] != "fight" or pl is None:
            return
        foe = None
        for pid, uid in g["fighters"].items():
            if pid != "ai":
                foe = self.world.agent_by_uid(uid)
        if foe is None or foe.state == "ko" or foe.f != a.f or foe.stairs_u is not None:
            pl["dir"] = (0.0, 0.0)
            if foe is not None and foe.f != a.f and not a.path and foe.stairs_u is None and random.random() < dt:
                a.go(foe.f, foe.x, foe.y, 0, True, lambda: a.set_state("idle", 1e9))
            return
        dx, dy = foe.x - a.x, foe.y - a.y
        d = math.hypot(dx, dy)
        self.ai_cd -= dt
        if d > 40:
            wob = 0.35 * math.sin(self.world.t * 2.3)
            pl["dir"] = (dx / d + wob * dy / d, dy / d - wob * dx / d)
        else:
            pl["dir"] = (0.0, 0.0)
            a.facing = 1 if dx >= 0 else -1
        if self.ai_cd <= 0 and not a.data.get("ctrl_act") and not a.path:
            if d < 46 and abs(dy) < 28:
                pl["dir"] = (0.0, 0.0)
                self.action(a, "swat" if a.is_cat else "bonk", (foe.x, foe.y))
                self.ai_cd = random.uniform(0.8, 1.5)
            elif a.is_cat and 70 < d < 140 and random.random() < 0.5:
                self.action(a, "pounce", (foe.x, foe.y))
                self.ai_cd = random.uniform(1.2, 2.0)
            elif not a.is_cat and 80 < d < 300 and random.random() < 0.6:
                self.action(a, "throw", (foe.x, foe.y))
                self.ai_cd = random.uniform(1.0, 1.8)
            else:
                self.ai_cd = 0.3

    # ---- games ------------------------------------------------------------------------------------------
    def start_game(self, kind, by):
        if kind not in GAME_LEN:
            return False
        if self.game:
            self.end_game(stopped=True)
        players = {pid: pl for pid, pl in self.players.items() if pid != "ai" and pl.get("agent")}
        if not players:
            self.banner = {"text": "先选一个角色（右键猫或家人 → 我来控制TA）", "until": self.world.t + 4}
            return False
        g = {"kind": kind, "end": self.world.t + GAME_LEN[kind], "scores": {pid: 0 for pid in players}, "fighters": {}}
        self.game = g
        if kind == "fight":
            for pid, pl in players.items():
                g["fighters"][pid] = pl["agent"]
            if len(g["fighters"]) < 2:
                me = self.world.agent_by_uid(list(g["fighters"].values())[0])
                foe = self.pick_ai_foe(me)
                if foe is None:
                    self.game = None
                    return False
                self.add_player("ai", "AI")
                self.control("ai", foe.uid)
                g["fighters"]["ai"] = foe.uid
                g["scores"]["ai"] = 0
                if foe.f != me.f or math.hypot(foe.x - me.x, foe.y - me.y) > 400:
                    foe.go(me.f, me.x + 80, me.y, 0, True, lambda: foe.set_state("idle", 1e9))
            self.hearts = {uid: MAX_HEARTS for uid in g["fighters"].values()}
            self.banner = {"text": "打闹对决开始！先打倒对方 %d 次就赢～" % KO_TO_WIN, "until": self.world.t + 3}
        elif kind == "steal":
            if not self.setup_steal(g, players):
                self.game = None
                return False
        elif kind == "fish":
            self.pickups = []
            for _ in range(6):
                self.spawn_fish()
            self.banner = {"text": "抢小鱼干开始！60 秒，看谁抢得多", "until": self.world.t + 3}
        else:
            self.banner = {"text": "捉蝴蝶开始！去院子里，靠近蝴蝶就能抓到", "until": self.world.t + 3.5}
            self.world.butterflies = []
            for _ in range(6):
                self.spawn_butterfly()
        return True

    # ---- 偷鱼大作战: cats sneak fish off the table and home to their bed; people shoo them -----------------
    def setup_steal(self, g, players):
        w = self.world
        table = w.dinner_table()
        if table is None:
            cands = [it for it in w.items if it.type in ("counter", "desk") and it.cat.get("h", 99) <= 86]
            table = cands[0] if cands else None
        if table is None:
            self.banner = {"text": "家里没有餐桌，没法偷鱼～", "until": w.t + 3}
            return False
        roles = {}
        for pid, pl in players.items():
            a = w.agent_by_uid(pl["agent"])
            if a is not None:
                roles[pid] = "cat" if a.is_cat else "guard"
        if "cat" not in roles.values():
            cat = next((c for c in w.cats if c.ctrl is None and c.state not in ("held", "carried")), None)
            if cat is None:
                self.banner = {"text": "没有空闲的猫来当小偷", "until": w.t + 3}
                return False
            self.add_player("ai", "AI")
            self.control("ai", cat.uid)
            roles["ai"] = "cat"
        elif "guard" not in roles.values():
            guard = next((p for p in w.present_people() if p.ctrl is None and p.role == "adult"), None) or \
                next((p for p in w.present_people() if p.ctrl is None), None)
            if guard is None:
                self.banner = {"text": "家里没人来看守", "until": w.t + 3}
                return False
            if guard.act == "sleep":
                guard.end_act()
            self.add_player("ai", "AI")
            self.control("ai", guard.uid)
            roles["ai"] = "guard"
        g["scores"] = {pid: 0 for pid in roles}
        g["roles"] = roles
        g["plate"] = [table.f, round(table.x, 1), round(table.y, 1), float(table.cat["h"]) + 0.5, STEAL_FISH]
        beds = [it for it in w.items if it.type in ("cat_bed", "cat_house", "box") and it.f == table.f]
        if beds:
            den = min(beds, key=lambda it: -math.hypot(it.x - table.x, it.y - table.y))
            g["den"] = [den.f, round(den.x, 1), round(den.y - 30, 1)]
        else:
            x, y = w.random_floor(table.f)
            g["den"] = [table.f, round(x, 1), round(y, 1)]
        nav = w.nav[g["den"][0]]
        if not nav.ok_at(g["den"][1], g["den"][2]):
            c = nav.nearest(g["den"][1], g["den"][2], 10)
            if c:
                g["den"][1], g["den"][2] = nav.center(*c)
        g.update(carry={}, grab={}, stun={}, stolen=0, caught=0)
        for pid, r in roles.items():
            a = self.agent_of(pid)
            if a is not None and r == "guard" and a.f != table.f:
                a.go(table.f, *w.stand_near(table.f, table.x, table.fp()[1] - 10), 0, True,
                     lambda a=a: a.set_state("idle", 1e9))
        self.banner = {"text": "偷鱼大作战！猫：跳上桌子叼走小鱼干，送回猫窝；人：靠近猫就能赶走它",
                       "until": w.t + 4.5}
        return True

    def step_steal(self, dt):
        g = self.game
        w = self.world
        t = w.t
        pf, px, py, pz, n = g["plate"]
        df, dx_, dy_ = g["den"]
        roles = g["roles"]
        for pid, r in roles.items():
            a = self.agent_of(pid)
            if a is None or r != "cat" or t < g["stun"].get(a.uid, 0):
                continue
            if not g["carry"].get(a.uid):
                near = a.f == pf and math.hypot(a.x - px, a.y - py) < 36 and a.h >= pz - 10
                if near and n > 0:
                    g["grab"][a.uid] = g["grab"].get(a.uid, 0.0) + dt
                    a.set_pose("eat")
                    if g["grab"][a.uid] >= 0.6:
                        g["grab"][a.uid] = 0.0
                        g["carry"][a.uid] = True
                        n -= 1
                        g["plate"][4] = n
                        a.say(random.choice(["叼到啦！", "嘿嘿～", "我的了！"]), 1.4)
                else:
                    g["grab"][a.uid] = 0.0
            elif a.f == df and math.hypot(a.x - dx_, a.y - dy_) < 44 and a.h < 40:
                g["carry"][a.uid] = False
                g["stolen"] = g.get("stolen", 0) + 1
                g["scores"][pid] = g["scores"].get(pid, 0) + 1
                a.say(random.choice(["得手！", "藏好啦～", "又一条！"]), 1.4)
                a.spawn("heart", 2)
        for pid, r in roles.items():
            gd = self.agent_of(pid)
            if gd is None or r != "guard" or t < g["stun"].get(gd.uid, 0):
                continue
            for qid, r2 in roles.items():
                th = self.agent_of(qid)
                if th is None or r2 != "cat" or th.f != gd.f or t < g["stun"].get(th.uid, 0):
                    continue
                busy = g["carry"].get(th.uid) or th.h > 1 or math.hypot(th.x - px, th.y - py) < 70
                if busy and math.hypot(th.x - gd.x, th.y - gd.y) < 38:
                    if g["carry"].get(th.uid):
                        g["carry"][th.uid] = False
                        g["plate"][4] += 1
                    g["caught"] = g.get("caught", 0) + 1
                    g["scores"][pid] = g["scores"].get(pid, 0) + 1
                    g["stun"][th.uid] = t + 1.6
                    g["stun"][gd.uid] = t + 0.6          # a short breather for the guard too
                    gd.say(random.choice(["抓到你啦！", "不许偷吃！", "下去下去～"]), 1.5)
                    th.say(random.choice(["喵呜！", "被发现了……", "哼！"]), 1.4)
                    th.spawn("ex", 1)
                    ux = 1 if th.x >= gd.x else -1
                    th.stop()
                    th.release_spot()
                    land = self.landing_point(th, ux, -0.3, dists=(60, 80, 40, 100))
                    if land is not None:
                        th.path = [{"t": "jump", "x": land[0], "y": land[1], "h": 0.0}]
                        th.then = lambda th=th: th.set_state("idle", 1e9)
                    th.set_state("idle", 1e9)
        if g["plate"][4] <= 0 and not any(g["carry"].values()):
            self.end_game()

    def ai_steal(self, a, dt):
        g = self.game
        w = self.world
        t = w.t
        if t < g["stun"].get(a.uid, 0):
            return
        self.ai_cd -= dt
        pf, px, py, pz, n = g["plate"]
        df, dx_, dy_ = g["den"]
        role = g["roles"].get("ai")
        if role == "cat":
            if g["carry"].get(a.uid):
                if not a.path or self.ai_cd <= 0:
                    self.ai_cd = 1.0
                    a.go(df, dx_, dy_, 0, True)
                return
            guard = next((self.agent_of(p) for p, r in g["roles"].items() if r == "guard"), None)
            if guard is not None and guard.f == a.f and math.hypot(guard.x - a.x, guard.y - a.y) < 70 and a.h < 1:
                if self.ai_cd <= 0:
                    self.ai_cd = 1.4
                    ux = 1 if a.x >= guard.x else -1
                    x, y = a.x + ux * 90, a.y + random.uniform(-40, 40)
                    if w.nav[a.f].ok_at(x, y):
                        a.go(a.f, x, y, 0, True)
                return
            if n > 0 and (a.f != pf or math.hypot(a.x - px, a.y - py) > 30 or a.h < pz - 10):
                if not a.path and self.ai_cd <= 0:
                    self.ai_cd = 0.8
                    a.release_spot()
                    a.go(pf, px + random.uniform(-10, 10), py, pz, False)
            return
        # guard
        thief = None
        for p2, r in g["roles"].items():
            th = self.agent_of(p2)
            if th is not None and r == "cat" and th.f == a.f:
                thief = th
        if thief is None:
            return
        danger = g["carry"].get(thief.uid) or thief.h > 1 or math.hypot(thief.x - px, thief.y - py) < 90
        if danger and t >= g["stun"].get(thief.uid, 0):
            if self.ai_cd <= 0:
                # notices a moment late; not quite as fast as a cat
                self.ai_cd = random.uniform(0.6, 1.0)
                a.go(a.f, thief.x, thief.y - 2, 0, random.random() < 0.6)
        elif not a.path and self.ai_cd <= 0:
            # stroll up and down a little way from the table, now and then looking away
            self.ai_cd = random.uniform(2.5, 4.5)
            side = random.choice((-1, 1))
            tx, ty = w.stand_near(pf, px + side * random.uniform(60, 130), py - random.uniform(70, 110))
            if math.hypot(tx - a.x, ty - a.y) > 30:
                a.go(pf, tx, ty, 0, False)

    def pick_ai_foe(self, me):
        w = self.world
        cands = [a for a in w.agents() if a is not me and not a.away and a.ctrl is None and a.state != "held"]
        if me.is_cat:
            cands.sort(key=lambda a: (not a.is_cat, a.f != me.f))
        else:
            cands.sort(key=lambda a: (a.is_cat, getattr(a, "role", "") != "kid", a.f != me.f))
        for a in cands:
            if not a.is_cat and a.act == "sleep":
                a.end_act()
            return a
        return None

    def end_game(self, stopped=False):
        g = self.game
        if not g:
            return
        self.game = None
        self.pickups = []
        if "ai" in self.players:
            self.remove_player("ai")
        self.hearts = {}
        for a in self.world.agents():
            if a.state == "ko":
                a.set_state("idle", 1e9 if a.ctrl else 1.0)
        if stopped:
            self.banner = {"text": "游戏结束", "until": self.world.t + 2}
            return
        sc = g["scores"]
        if not sc:
            return
        if g["kind"] == "steal":
            stolen = g.get("stolen", 0)
            cats_win = stolen >= STEAL_WIN
            win = [pid for pid, r in g.get("roles", {}).items() if (r == "cat") == cats_win]
            text = ("猫咪赢啦！偷走了 %d 条小鱼干" % stolen) if cats_win else \
                ("看守成功！只丢了 %d 条小鱼干，抓到猫 %d 次" % (stolen, g.get("caught", 0)))
            self.banner = {"text": text, "until": self.world.t + 6, "win": win}
            for pid in win:
                a = self.agent_of(pid)
                if a is not None:
                    a.say(random.choice(WIN_LINES), 3)
                    a.spawn("heart", 3)
            return
        best = max(sc.values())
        win = [pid for pid, v in sc.items() if v == best]
        unit = {"fish": "条小鱼干", "bfly": "只蝴蝶", "fight": "次"}[g["kind"]]
        detail = "  ".join("%s %d" % (self.name_of(pid), v) for pid, v in sc.items())
        if len(win) > 1 and len(sc) > 1:
            text = "平局！ %s" % detail
        else:
            text = "%s 赢了！ %s%s" % (self.name_of(win[0]), detail, "" if len(sc) > 1 else unit)
        self.banner = {"text": text, "until": self.world.t + 6, "win": win}
        for pid in win:
            a = self.agent_of(pid)
            if a is not None:
                a.say(random.choice(WIN_LINES), 3)
                a.spawn("heart", 3)

    def spawn_fish(self):
        w = self.world
        floors = [0, 1] + ([2] if w.outdoor_ok() else [])
        f = random.choice(floors)
        x, y = w.random_floor(f)
        self.pickups.append({"id": self.next_id, "f": f, "x": x, "y": y, "t": random.uniform(0, 6)})
        self.next_id += 1

    def spawn_butterfly(self):
        w = self.world
        x, y = w.random_floor(2)
        w.butterflies.append({"x": x, "y": y, "z": 40.0, "vx": 0.0, "vy": 0.0, "ph": random.uniform(0, 6),
                              "col": random.choice(("#f2c94c", "#ffffff", "#9fc3ef", "#f39ab3")),
                              "life": 200.0, "flee": 0.0})

    def catch_butterflies(self, a, r):
        w = self.world
        pid = a.ctrl
        for b in list(w.butterflies):
            if math.hypot(b["x"] - a.x, b["y"] - a.y) < r and b["z"] < 80:
                w.butterflies.remove(b)
                if self.game and pid in self.game["scores"]:
                    self.game["scores"][pid] += 1
                    a.say(random.choice(BFLY_LINES), 1.4)
                    a.spawn("heart", 1)
                self.spawn_butterfly()

    def go_dark(self, name, dur, then=None):
        self.dark = {"name": name, "until": self.world.t + dur, "dur": dur, "then": then}

    def step(self, dt):
        t = self.world.t
        if self.banner and self.banner["until"] < t:
            self.banner = None
        if self.dark and self.dark["until"] <= t:
            then, self.dark = self.dark.get("then"), None
            if then is not None:
                then()
        # flying pillows / yarn balls
        out = []
        for s in self.shots:
            s["life"] -= dt
            nx, ny = s["x"] + s["vx"] * dt, s["y"] + s["vy"] * dt
            s["spin"] += dt * 540
            hit = None
            src = self.world.agent_by_uid(s["by"])
            for o in self.world.agents():
                if o.uid == s["by"] or o.away or o.f != s["f"] or o.stairs_u is not None or o.state == "ko":
                    continue
                if math.hypot(o.x - nx, o.y - ny) < 22 and o.h < 60:
                    hit = o
                    break
            if hit is not None:
                if src is not None:
                    self.hit(hit, src)
                continue
            nav = self.world.nav.get(s["f"])
            if s["life"] <= 0 or (nav is not None and not nav.ok_at(nx, ny) and not H.inside(s["f"], nx, ny)):
                continue
            s["x"], s["y"] = nx, ny
            s["z"] = max(10.0, s["z"] - dt * 14)
            out.append(s)
        self.shots = out
        g = self.game
        if not g:
            return
        if g["kind"] == "fish":
            for pk in list(self.pickups):
                for pid in g["scores"]:
                    a = self.agent_of(pid)
                    if a is None or a.f != pk["f"] or a.stairs_u is not None or a.state == "ko":
                        continue
                    if math.hypot(a.x - pk["x"], a.y - pk["y"]) < 26 and a.h < 40:
                        g["scores"][pid] += 1
                        self.pickups.remove(pk)
                        a.say(random.choice(FISH_LINES), 1.2)
                        a.spawn("heart", 1)
                        self.spawn_fish()
                        break
        elif g["kind"] == "steal":
            self.step_steal(dt)
            if not self.game:
                return
        elif g["kind"] == "bfly":
            while len(self.world.butterflies) < 5:
                self.spawn_butterfly()
            for pid in g["scores"]:
                a = self.agent_of(pid)
                if a is not None and a.f == 2 and a.stairs_u is None and a.state != "ko":
                    self.catch_butterflies(a, 24 if a.is_cat else 30)
        if t >= g["end"]:
            self.end_game()

    # ---- network ------------------------------------------------------------------------------------------
    def to_net(self):
        t = self.world.t
        g = self.game
        return {
            "pl": {pid: [pl.get("name", ""), pl.get("agent")] for pid, pl in self.players.items()},
            "g": None if not g else {"k": g["kind"], "left": round(max(0.0, g["end"] - t), 1), "sc": g["scores"],
                                     "fi": g.get("fighters", {}),
                                     "st": None if g["kind"] != "steal" else {
                                         "plate": g["plate"], "den": g["den"], "carry": g.get("carry", {}),
                                         "roles": g.get("roles", {}), "stolen": g.get("stolen", 0),
                                         "stun": {u: round(v - t, 2) for u, v in (g.get("stun") or {}).items() if v > t}}},
            "pk": [[p["id"], p["f"], round(p["x"], 1), round(p["y"], 1)] for p in self.pickups],
            "sh": [[s["f"], round(s["x"], 1), round(s["y"], 1), round(s["z"], 1), s["kind"], int(s["spin"])]
                   for s in self.shots],
            "bn": None if not self.banner else [self.banner["text"], round(self.banner["until"] - t, 1),
                                                self.banner.get("win", [])],
            "hp": self.hearts,
            "dk": None if not self.dark else [self.dark["name"], round(self.dark["until"] - t, 2), self.dark["dur"]],
        }

    def from_net(self, d):
        t = self.world.t
        self.players = {pid: {"name": v[0], "agent": v[1], "dir": (0.0, 0.0)} for pid, v in (d.get("pl") or {}).items()}
        for a in self.world.agents():
            a.ctrl = None
        for pid, pl in self.players.items():
            a = self.world.agent_by_uid(pl["agent"]) if pl["agent"] else None
            if a is not None:
                a.ctrl = pid
        g = d.get("g")
        if g:
            if not self.game or self.game["kind"] != g["k"]:
                self.game = {"kind": g["k"]}
            self.game.update(end=t + g["left"], scores=g["sc"], fighters=g.get("fi", {}))
            st = g.get("st")
            if st:
                self.game.update(plate=st["plate"], den=st["den"], carry=st.get("carry", {}), roles=st.get("roles", {}),
                                 stolen=st.get("stolen", 0), stun={u: t + v for u, v in (st.get("stun") or {}).items()})
        else:
            self.game = None
        old = {p["id"]: p for p in self.pickups}
        self.pickups = [dict(old.get(i, {"t": random.uniform(0, 6)}), id=i, f=f, x=x, y=y) for i, f, x, y in d.get("pk", [])]
        self.shots = [{"f": f, "x": x, "y": y, "z": z, "kind": k, "spin": sp} for f, x, y, z, k, sp in d.get("sh", [])]
        bn = d.get("bn")
        self.banner = None if not bn else {"text": bn[0], "until": t + bn[1], "win": bn[2]}
        self.hearts = d.get("hp") or {}
        dk = d.get("dk")
        self.dark = None if not dk else {"name": dk[0], "until": t + dk[1], "dur": dk[2]}


# ==================================================================================================== drawing
def draw_fish_treat(p, sx, sy, t, scale=1.5, glow=True):
    """A little dried fish. With glow (the pick-up in 抢小鱼干) it bobs above a shadow; without, it is
    drawn flat at (sx, sy) - on a plate, or in a cat's mouth."""
    bob = 2.5 * math.sin(t * 3.0) if glow else 0.0
    p.save()
    p.translate(sx, sy - (10 if glow else 0) + bob)
    p.scale(scale, scale)
    p.setPen(Qt.NoPen)
    if glow:
        g = QRadialGradient(QPointF(0, 0), 16)
        g.setColorAt(0, QColor(255, 236, 160, 150))
        g.setColorAt(1, QColor(255, 236, 160, 0))
        p.setBrush(g)
        p.drawEllipse(QPointF(0, 0), 16, 12)
    p.setPen(QPen(QColor("#9c5a22"), 1.1))
    gr = QLinearGradient(-9, 0, 9, 0)
    gr.setColorAt(0, QColor("#f6b45a"))
    gr.setColorAt(1, QColor("#e08a3a"))
    p.setBrush(gr)
    path = QPainterPath(QPointF(-9, 0))
    path.quadTo(QPointF(-2, -6), QPointF(5, -1))
    path.lineTo(10, -5)
    path.lineTo(9, 0)
    path.lineTo(10, 5)
    path.lineTo(5, 1)
    path.quadTo(QPointF(-2, 6), QPointF(-9, 0))
    p.drawPath(path)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#3a2a22"))
    p.drawEllipse(QPointF(-5.5, -1), 1.1, 1.1)
    p.setPen(QPen(QColor(255, 255, 255, 170), 1))
    p.drawLine(QPointF(-2, -2), QPointF(2, -2.5))
    p.restore()
    if glow:
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(0, 0, 0, 40))
        p.drawEllipse(QPointF(sx, sy), 9, 3)


def draw_shot(p, sx, sy, kind, spin):
    p.save()
    p.translate(sx, sy)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(0, 0, 0, 30))
    p.restore()
    p.save()
    p.translate(sx, sy)
    p.rotate(spin)
    if kind == "yarn":
        p.setPen(QPen(QColor("#b8455f"), 1.0))
        p.setBrush(QColor("#ef7f9f"))
        p.drawEllipse(QPointF(0, 0), 7, 7)
        p.setPen(QPen(QColor("#ffd1dc"), 1.1))
        p.setBrush(Qt.NoBrush)
        p.drawArc(QRectF(-5, -6, 10, 12), 30 * 16, 120 * 16)
        p.drawArc(QRectF(-6, -4, 12, 9), 200 * 16, 120 * 16)
    else:
        p.setPen(QPen(QColor("#b9a98f"), 1.0))
        p.setBrush(QColor("#fbf8f1"))
        path = QPainterPath()
        path.moveTo(-11, -7)
        path.quadTo(QPointF(0, -4), QPointF(11, -7))
        path.quadTo(QPointF(8, 0), QPointF(11, 7))
        path.quadTo(QPointF(0, 4), QPointF(-11, 7))
        path.quadTo(QPointF(-8, 0), QPointF(-11, -7))
        p.drawPath(path)
        p.setPen(QPen(QColor(233, 160, 170), 1))
        p.drawLine(QPointF(-5, 0), QPointF(5, 0))
    p.restore()


def draw_marker(p, sx, sy, color, label, font):
    """Coloured arrow + name above a controlled character."""
    c = QColor(color)
    p.setPen(QPen(c.darker(140), 1.0))
    p.setBrush(c)
    p.drawPolygon([QPointF(sx - 6, sy - 10), QPointF(sx + 6, sy - 10), QPointF(sx, sy - 2)])
    fm = QFontMetricsF(font)
    w = fm.horizontalAdvance(label) + 14
    h = fm.height() + 2
    r = QRectF(sx - w / 2, sy - 12 - h, w, h)
    p.setBrush(c)
    p.drawRoundedRect(r, h / 2, h / 2)
    p.setFont(font)
    p.setPen(QColor("#ffffff"))
    p.drawText(r, Qt.AlignCenter, label)


def heart_shape(cx, cy, s):
    path = QPainterPath(QPointF(cx, cy + s * 0.9))
    path.cubicTo(QPointF(cx - s * 1.3, cy), QPointF(cx - s * 0.7, cy - s * 1.1), QPointF(cx, cy - s * 0.35))
    path.cubicTo(QPointF(cx + s * 0.7, cy - s * 1.1), QPointF(cx + s * 1.3, cy), QPointF(cx, cy + s * 0.9))
    return path


def draw_hearts(p, x, y, n, total=MAX_HEARTS, s=5.0):
    for i in range(total):
        path = heart_shape(x + i * s * 2.4, y, s)
        p.setPen(QPen(QColor("#b52a4c"), 0.9))
        p.setBrush(QColor("#ef4f72") if i < n else QColor(255, 255, 255, 170))
        p.drawPath(path)
