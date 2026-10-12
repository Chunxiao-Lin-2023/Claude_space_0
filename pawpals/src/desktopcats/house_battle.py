"""对战: an action fight in one of the arenas (house_arena_art). Cats and family members, 1 v 1, 2 v 2 or
everyone for themselves; players (also over the network) and AI fighters of three levels.

Each fighter: HP and stamina. Player keys (v20): J attack (tap: three-hit combo, hold: charged heavy), K the
character's skill, L guard (hold to block, well timed: parry; L + a direction: roll), Space jump (J in the air: a
ground slam), E grab ammo / throw. Attacks snap to the nearest opponent. Knock someone out three times (or knock
them off the edge) to win. Mode "train" is a step-by-step tutorial against a sparring partner who does not fight
back (except when you practise blocking). The host runs the fight; guests send keys.
"""
import math
import random

from . import house_art as H
from . import house_arena_art as AA
from . import house_fanim as FA
from . import house_games as HG
from . import house_pals as PL
from . import house_places_art as PA

GRAV = 980.0
KO_TO_WIN = 3
TIME_LIMIT = 180.0
TRAVEL = 3.0

KITS = {
    "calico": dict(hp=95, speed=192, power=0.95, body=17, reach=48, skills=("pounce",), cat=True, name="三花猫",
                   style="又快又灵活"),
    "tabby": dict(hp=115, speed=168, power=1.1, body=19, reach=48, skills=("slam",), cat=True, name="狸花猫",
                  style="皮厚、力气大"),
    "adult": dict(hp=110, speed=152, power=1.05, body=15, reach=54, skills=("charge",), cat=False, name="大人",
                  style="手长，用枕头打"),
    "kid": dict(hp=90, speed=170, power=0.9, body=12, reach=48, skills=("throw",), cat=False, name="小孩",
                style="跑得快，会扔玩偶"),
}
SKILLS = {
    "pounce": dict(name="飞扑", cd=5.0, icon="🐾", desc="朝对手扑过去，扑中直接把它扑倒"),
    "flurry": dict(name="连环爪", cd=8.0, icon="💢", desc="一通乱挠"),
    "slam": dict(name="屁股压", cd=8.0, icon="💥", desc="跳起来一屁股砸地，震飞身边所有人"),
    "charge": dict(name="冲撞", cd=6.0, icon="💨", desc="往前猛冲，撞倒挡路的人"),
    "throw": dict(name="扔玩偶", cd=3.2, icon="🧸", desc="朝最近的对手扔个玩偶，远远也能打到"),
}
TAP = 0.18                                # J held longer than this turns into a charged heavy
AIM_RANGE = 190.0                         # attacks snap to an opponent this close
# light combo: (startup, active, recovery, damage, knockback, stun)
LIGHT = [(0.07, 0.09, 0.16, 6, 90, 0.22), (0.07, 0.09, 0.18, 7, 110, 0.25), (0.09, 0.11, 0.30, 10, 300, 0.45)]
AMMO = {
    "snowball": dict(name="雪球", dmg=8, kb=150, speed=520, arc=True, count=3, r=8),
    "pillow": dict(name="枕头", dmg=9, kb=240, speed=460, arc=True, count=3, r=12),
    "water": dict(name="水枪", dmg=3, kb=80, speed=700, arc=False, count=14, r=6, rate=0.13),
    "plush": dict(name="玩偶", dmg=11, kb=230, speed=500, arc=True, count=1, r=10),
    "yarn_bomb": dict(name="毛线炸弹", dmg=16, kb=320, speed=420, arc=True, count=1, r=10, boom=86),
}
ITEMS = {"fish": "小鱼（回血）", "power": "猫薄荷 / 咖啡（攻击加强）", "speed": "跑鞋（加速）", "shield": "护盾",
         "yarn_bomb": "毛线炸弹"}
DIFFS = {"easy": dict(name="简单", react=0.55, block=0.12, dodge=0.05, parry=0.0, skill=0.25, combo=1, aim=0.35),
         "normal": dict(name="普通", react=0.3, block=0.32, dodge=0.15, parry=0.12, skill=0.5, combo=2, aim=0.15),
         "hard": dict(name="困难", react=0.13, block=0.55, dodge=0.32, parry=0.35, skill=0.85, combo=3, aim=0.04)}
TEAM_COLORS = {0: "#e8473f", 1: "#3b8bd0", 2: "#f2b630", 3: "#5fb36a"}
TEAM_NAMES = {0: "红队", 1: "蓝队", 2: "黄队", 3: "绿队"}
# the tutorial: (key, what to do, the keys to show)
TRAIN_STEPS = [
    ("move", "用 WASD 走到陪练身边", "WASD"),
    ("tap", "按一下 J：普通攻击（会自动对准最近的对手）", "J"),
    ("combo", "快速连按 J 三下：三连击，第三下能把对手打倒", "J J J"),
    ("heavy", "按住 J 不放，看到身上发光蓄满力，再松开：重击", "按住 J"),
    ("skill", "按 K 放技能「{skill}」：{desc}", "K"),
    ("block", "陪练要打你了！它发光蓄力的时候，按住 L 挡住（出手瞬间按下是弹反）", "按住 L"),
    ("roll", "按住 L 再按方向键：翻滚躲开，翻滚的时候打不中你", "L + 方向"),
    ("jump", "按空格跳起来，在空中再按 J：从天而降砸下去", "空格 → J"),
    ("throw", "{throw_tip}", "E"),
]


def kit_of(a):
    if a.is_cat:
        return "tabby" if getattr(a.src, "kind", "") == "tabby" else "calico"
    return "kid" if a.role == "kid" else "adult"


def norm(x, y):
    d = math.hypot(x, y)
    return (x / d, y / d) if d > 1e-6 else (0.0, 0.0)


class Fighter:
    def __init__(self, a, team, ctrl):
        self.a = a
        self.uid = a.uid
        self.team = team
        self.ctrl = ctrl                  # player id, or "ai:easy" / "ai:normal" / "ai:hard"
        self.kit = kit_of(a)
        self.char = HG.char_of(a)
        k = KITS[self.kit]
        self.maxhp = k["hp"]
        self.hp = float(self.maxhp)
        self.stam = 100.0
        self.kos = 0                      # times knocked out
        self.score = 0                    # knock-outs dealt
        self.st, self.t = "idle", 0.0
        self.fx, self.fy = (1.0, 0.0) if team % 2 == 0 else (-1.0, 0.0)
        self.vx = self.vy = self.vz = 0.0
        self.kx = self.ky = 0.0           # knockback velocity
        self.z = 0.0
        self.combo = 0
        self.queued = False
        self.charge = 0.0
        self.cd = {"s1": 0.0, "s2": 0.0, "roll": 0.0, "throw": 0.0, "jump": 0.0}
        self.pdir = (0.0, 0.0)
        self.inv = 0.0
        self.buff = {}
        self.hold = None                  # [ammo kind, count]
        self.hit_ids = set()
        self.dur = 0.0
        self.data = {}
        self.flash = 0.0                  # white flash when hit
        self.pal, self.pal_cd, self.pal_t, self.pal_shield, self.slow_t = None, 0.0, 9.0, False, 0.0
        self.block_t = 0.0
        self.bounce_cd = 0.0
        self.hazard_cd = 0.0
        self.last_by = None
        self.ai = None
        self.inp = {"dx": 0.0, "dy": 0.0, "held": set(), "pressed": set()}
        self.buf = {}

    @property
    def x(self):
        return self.a.x

    @property
    def y(self):
        return self.a.y

    def alive(self):
        return self.st not in ("ko", "fall", "out")

    def busy(self):
        return self.st not in ("idle", "block", "charge")


class Battle:
    GAME = "melee"
    TOP = True                            # a top-down game (False: side view)
    MIN_FIGHTERS = 2
    TRAIN_STEPS = None                    # set below (TRAIN_STEPS)

    def __init__(self, world, f, teams, ctrls, mode, diff, kos=KO_TO_WIN, limit=TIME_LIMIT):
        self.game = self.GAME
        self.w = world
        self.f = f
        self.arena = AA.ARENAS[f]
        self.mode = mode                  # "1v1" / "2v2" / "ffa"
        self.diff = diff
        self.kos_to_win = kos
        self.limit = limit
        self.phase = "travel"             # travel -> count -> fight -> over
        self.t = 0.0
        self.clock = 0.0
        self.fighters = []
        wanted_pals = {}
        for row in teams:
            uid, team = row[0], row[1]
            a = world.agent_by_uid(uid)
            if a is None:
                continue
            wanted_pals[uid] = row[2] if len(row) > 2 and row[2] is not None else "?"
            ctrl = ctrls.get(uid) or ("ai:" + diff)
            self.fighters.append(Fighter(a, team, ctrl))
        self.projs = []
        self.items = []
        self.fx = []
        self.next_item = 8.0
        self.hz = {}                      # hazard state
        self.obst = []                    # destructible: {"k", "x", "y", "w", "d", "hp"}
        for x, y in self.arena.get("walls", []):
            self.obst.append({"k": "snow_wall", "x": x, "y": y, "w": 92, "d": 24, "hp": 3})
        for x, y in self.arena.get("castles", []):
            self.obst.append({"k": "castle", "x": x, "y": y, "w": 64, "d": 50, "hp": 3})
        self.result = None
        self.solid = self.static_blocks()
        self.ammo_piles = [it for it in world.items if it.f == f and it.type in ("snow_pile", "pillow_pile", "gun_crate")]
        self.banner = None
        self.ready = set()                # players who pressed J during the countdown
        self.train = None
        if mode == "train":
            self.limit = 1e9
            me = next((fi for fi in self.fighters if not fi.ctrl.startswith("ai:")), None)
            self.train = {"i": 0, "uid": me.uid if me is not None else None, "done_t": None}
        self.shake = 0.0
        self.setup()
        PL.assign(self, wanted_pals)

    def setup(self):
        """Per-game set-up after the fighters are known."""

    # ---- geometry -----------------------------------------------------------------------------------------
    def static_blocks(self):
        out = []
        for it in self.w.items:
            if it.f != self.f or it.cat.get("walk") or it.cat.get("flat"):
                continue
            blk = it.cat.get("block")
            if blk:
                bw, bd = blk if it.rot % 2 == 0 else (blk[1], blk[0])
                out.append((it.x - bw / 2, it.y - bd / 2, it.x + bw / 2, it.y + bd / 2))
            elif it.cat.get("h", 0) > 12:
                out.append(it.fp())
        return out

    def blocked(self, x, y, r=8.0, team=None):
        for x0, y0, x1, y1 in self.solid:
            if x0 - r < x < x1 + r and y0 - r * 0.6 < y < y1 + r * 0.6:
                return True
        for o in self.obst:
            if team is not None and o.get("team") == team:
                continue
            if o["hp"] > 0 and abs(x - o["x"]) < o["w"] / 2 + r and abs(y - o["y"]) < o["d"] / 2 + r * 0.6:
                return True
        return False

    def floor_ok(self, x, y):
        return AA.on_floor(self.f, x, y)

    def can_stand(self, x, y, r=8.0, air=False):
        if not (8 < x < H.PW - 8 and -40 < y < H.PD_PLACE - 6):
            return False
        if self.arena["pits"]:
            if not self.floor_ok(x, y):
                return True               # off the edge: allowed (they fall)
        elif not AA.on_floor(self.f, x, y):
            return False
        return air or not self.blocked(x, y, r)

    def zone_at(self, x, y):
        out = []
        for kind, sh, extra in self.arena.get("zones", []):
            if AA.in_shape(sh, x, y):
                out.append((kind, extra))
        return out

    def spawn_point(self, fi):
        sp = self.arena["spawns"]
        same = [f for f in self.fighters if f.team == fi.team]
        k = same.index(fi) if fi in same else 0
        if self.mode == "ffa":
            base = sp[[0, 2, 1, 3][self.fighters.index(fi) % 4]]
        else:
            base = sp[(0 if fi.team == 0 else 2) + (k % 2)]
        return base

    # ---- setup / travel --------------------------------------------------------------------------------------
    def begin(self):
        for fi in self.fighters:
            a = fi.a
            a.stop()
            a.release_spot()
            if not a.is_cat:
                held = self.w.held_cat(a)
                if held is not None:
                    self.w.set_down_cat(a)
                if a.state == "act":
                    a.end_act()
                a.act = "battle"
            else:
                if a.state == "carried":
                    c = self.w.carrier_of(a)
                    if c is not None:
                        self.w.set_down_cat(c)
                a.interrupt()
            a.ride = None
            a.in_tent = None
            a.guardian = None
            a.outing = None
            if a.f == self.f:
                continue
            sp = self.spawn_point(fi)
            x, y = sp[0], sp[1]
            a.path = [{"t": "travel", "f": self.f, "x": x, "y": y, "dur": TRAVEL, "battle": True}]
            a.then = None
            a.traveling = self.f
            a.set_state("idle", 1e9)
        self.say_banner("出发去%s！" % self.arena["name"], 2.5)

    def humans(self):
        return {fi.ctrl for fi in self.fighters if not fi.ctrl.startswith("ai:")}

    def nearest_enemy(self, fi, rng=AIM_RANGE):
        best = None
        for o in self.enemies(fi):
            if not o.alive():
                continue
            d = math.hypot(o.a.x - fi.a.x, (o.a.y - fi.a.y) * 1.1)
            if d <= rng and (best is None or d < best[0]):
                best = (d, o)
        return best[1] if best else None

    def aim(self, fi, rng=AIM_RANGE):
        """Attacks snap round to the nearest opponent in range."""
        o = self.nearest_enemy(fi, rng)
        if o is not None:
            ux, uy = norm(o.a.x - fi.a.x, o.a.y - fi.a.y)
            if ux or uy:
                fi.fx, fi.fy = ux, uy
        return o

    def tell(self, fi, text):
        """A hint about something that did not work: only for people, not for the AI."""
        if not str(fi.ctrl).startswith("ai:"):
            self.add_fx("text", fi, text=text, small=True)

    def say_banner(self, text, dur=2.5):
        self.banner = {"text": text, "until": self.t + dur}

    def all_here(self):
        return all(fi.a.f == self.f and fi.a.traveling is None and not fi.a.path for fi in self.fighters)

    def place_all(self):
        for fi in self.fighters:
            x, y = self.spawn_point(fi)
            fi.a.f, fi.a.x, fi.a.y, fi.a.h = self.f, x, y, 0.0
            fi.z = 0.0
            fi.hp = float(fi.maxhp)
            fi.stam = 100.0
            fi.st, fi.t = "idle", 0.0
        if self.train is not None:
            # the sparring partner waits a few steps away, in the open
            me = self.trainee()
            for fi in self.fighters:
                if me is None or fi is me:
                    continue
                for dx, dy in ((200, 0), (-200, 0), (160, 60), (160, -60), (240, 90), (240, -90), (120, 0), (-120, 0)):
                    x, y = me.a.x + dx, me.a.y + dy
                    if 60 < x < H.PW - 60 and self.floor_ok(x, y) and not self.blocked(x, y, 24) and \
                            not any(z[0] in ("slow", "belt", "slip") for z in self.zone_at(x, y)):
                        fi.a.x, fi.a.y = x, y
                        break
        for fi in self.fighters:
            ex = [o for o in self.fighters if o.team != fi.team]
            if ex:
                fi.fx, fi.fy = norm(ex[0].a.x - fi.a.x, ex[0].a.y - fi.a.y)

    # ---- per frame --------------------------------------------------------------------------------------------
    def step(self, dt):
        self.t += dt
        if self.phase == "travel":
            if self.all_here() or self.t > TRAVEL + 6:
                self.place_all()
                self.phase = "count"
                # with people playing, wait (up to 12 s) until everybody has read the controls card and pressed J
                self.count_t = 12.0 if self.humans() else 3.0
                self.w.sfx("chime", 1)
            for fi in self.fighters:
                self.pose(fi)
            self.post_pose()
            return
        if self.phase == "count":
            self.count_t -= dt
            hs = self.humans()
            if self.count_t > 3.0 and hs and hs <= self.ready:
                self.count_t = 3.0
            for fi in self.fighters:
                self.pose(fi)
            self.post_pose()
            if self.count_t <= 0:
                self.phase = "fight"
                for pl in self.w.play.players.values():
                    pl.pop("bpress", None)
                if self.train is not None:
                    self.train_enter(0)
                self.say_banner("开打！", 1.2)
                self.gong()
            return
        if self.phase == "over":
            if not getattr(self, "_recorded", False):
                try:
                    from . import house_records as REC
                    h = getattr(self.w, "house", None)
                    REC.record(self, self.w, getattr(h, "local_pid", None))
                except Exception as ex:
                    print("records:", repr(ex))
                    self._recorded = True
            self.over_t -= dt
            for fi in self.fighters:
                self.celebrate(fi, dt)
            self.step_fx(dt)
            return
        self.clock += dt
        self.shake = max(0.0, self.shake - dt * 3)
        if self.TOP:
            for fi in self.fighters:
                fi.flash = max(0.0, fi.flash - dt)
        self.step_game(dt)
        if self.phase == "fight":
            PL.step(self, dt)
        self.post_pose()

    def post_pose(self):
        """Top-down games: flash / recoil / roll spin over their own poses (side games animate in pose())."""
        if self.TOP:
            for fi in self.fighters:
                FA.animate_top(self, fi)

    def sound(self, name, who=None):
        try:
            self.w.app.play_sound(name, who.a.src if (who is not None and who.a.is_cat) else None)
        except Exception:
            pass

    def make_ai(self, fi):
        return TrainAI(self, fi) if self.train is not None else AI(self, fi, fi.ctrl[3:])

    def read_raw(self, fi):
        """A player's keys as they are: dx, dy and the raw battle keys (atk / skill / guard / jump / throw)."""
        inp = fi.inp
        pl = self.w.play.players.get(fi.ctrl)
        if pl is None or pl.get("agent") != fi.uid:
            fi.ctrl = "ai:" + self.diff
            inp["dx"] = inp["dy"] = 0.0
            inp["held"] = set()
            return
        dx, dy = pl.get("dir", (0.0, 0.0))
        inp["dx"], inp["dy"] = float(dx), float(dy)
        inp["held"] = set(pl.get("bheld", ()))
        raw = set(pl.pop("bpress", set()) or ())
        # older guests' key names
        for old, new in (("light", "atk"), ("s1", "skill"), ("block", "guard"), ("dodge", "jump")):
            if old in raw:
                raw.discard(old)
                raw.add(new)
        inp["pressed"] |= raw

    def control(self, dt):
        """Fill in every fighter's inputs: AI or player."""
        for fi in self.fighters:
            if fi.ctrl.startswith("ai:"):
                if fi.ai is None:
                    fi.ai = self.make_ai(fi)
                fi.ai.step(dt)
            elif self.GAME == "melee":
                self.read_player(fi)
            else:
                self.read_raw(fi)

    def step_game(self, dt):
        self.control(dt)
        for fi in self.fighters:
            # a press that lands while you can't act (being hit, mid-roll...) is kept for a moment
            buf = fi.buf
            for k in [k for k, until in buf.items() if until <= self.clock]:
                del buf[k]
            fi.inp["pressed"] |= set(buf)
            before = fi.st
            self.step_fighter(fi, dt)
            if before in ("idle", "block") or fi.st != before:
                buf.clear()
            else:
                for k in fi.inp["pressed"]:
                    if not (k in ("light", "atk") and before == "light"):
                        buf.setdefault(k, self.clock + 0.3)
            fi.inp["pressed"] = set()
        self.separate()
        self.step_projs(dt)
        self.step_items(dt)
        if self.train is None:
            self.step_hazards(dt)
        else:
            self.step_train(dt)
        self.step_fx(dt)
        for fi in self.fighters:
            self.pose(fi)
        self.check_end()

    def read_player(self, fi):
        pl = self.w.play.players.get(fi.ctrl)
        if pl is None or pl.get("agent") != fi.uid:
            # the player let go: an AI takes over
            fi.ctrl = "ai:" + self.diff
            return
        dx, dy = pl.get("dir", (0.0, 0.0))
        fi.inp["dx"], fi.inp["dy"] = dx, dy
        raw_held = set(pl.get("bheld", ()))
        raw = set(pl.pop("bpress", set()) or ())
        held = set()
        if "atk" in raw_held:
            held.add("atk")
        if "guard" in raw_held:
            held.add("block")
        moving = abs(dx) + abs(dy) > 0.1
        pressed = set()
        for k in raw:
            if k == "atk":
                pressed.add("atk")
            elif k == "skill":
                pressed.add("s1")
            elif k in ("jump", "throw"):
                pressed.add(k)
            elif k == "guard" and moving:
                pressed.add("dodge")       # L with a direction held: roll
            elif k in ("light", "heavy", "block", "dodge", "s1", "s2"):   # older guests
                pressed.add(k)
                if k in ("heavy", "block"):
                    held.add(k)
        # holding L, then pressing a direction: roll too
        was = abs(fi.pdir[0]) + abs(fi.pdir[1]) > 0.1
        if "guard" in raw_held and moving and not was:
            pressed.add("dodge")
        fi.pdir = (dx, dy)
        fi.inp["held"] = held
        fi.inp["pressed"] |= pressed

    def gong(self):
        for it in self.w.items:
            if it.f == self.f and it.type == "gong":
                it.state["ring"] = 1.0
                self.w.later(1.5, lambda it=it: it.state.__setitem__("ring", 0.0))
        self.w.sfx("chime", 0.5)

    # ---- one fighter --------------------------------------------------------------------------------------------
    def speed(self, fi):
        k = KITS[fi.kit]["speed"]
        if fi.buff.get("speed", 0) > self.clock:
            k *= 1.35
        zones = self.zone_at(fi.a.x, fi.a.y)
        if any(z[0] == "slow" for z in zones) and fi.z <= 0:
            k *= 0.55
        return k * PL.speed(self, fi)

    def step_fighter(self, fi, dt):
        a = fi.a
        fi.t += dt
        for k in fi.cd:
            fi.cd[k] = max(0.0, fi.cd[k] - dt)
        fi.inv = max(0.0, fi.inv - dt)
        fi.bounce_cd = max(0.0, fi.bounce_cd - dt)
        fi.hazard_cd = max(0.0, fi.hazard_cd - dt)
        if fi.st not in ("block", "charge", "roll") and fi.alive():
            fi.stam = min(100.0, fi.stam + dt * (26 if not any(z[0] == "slow" for z in self.zone_at(a.x, a.y)) else 10))
        inp = fi.inp
        held, pressed = inp["held"], inp["pressed"]
        mx, my = inp["dx"], inp["dy"]
        mn = math.hypot(mx, my)
        if mn > 1e-6:
            mx, my = mx / mn, my / mn
        st = fi.st
        want = (0.0, 0.0)
        sp = self.speed(fi)
        # ---- state machine
        if st in ("idle", "block", "charge"):
            if mn > 0.1 and st != "block":
                fi.fx, fi.fy = mx, my
            if st == "idle":
                want = (mx * sp, my * sp)
                if mn <= 0.1 and not fi.ctrl.startswith("ai:"):
                    # standing still: turn to face the nearest opponent
                    o = self.nearest_enemy(fi, 320)
                    if o is not None:
                        ux, uy = norm(o.a.x - a.x, o.a.y - a.y)
                        k = min(1.0, dt * 10)
                        fi.fx, fi.fy = norm(fi.fx + (ux - fi.fx) * k, fi.fy + (uy - fi.fy) * k)
                if "dodge" in pressed and fi.cd["roll"] <= 0 and fi.stam >= 16:
                    self.start(fi, "roll", 0.36)
                    fi.stam -= 16
                    fi.cd["roll"] = 0.45
                    d = (mx, my) if mn > 0.1 else (fi.fx, fi.fy)
                    fi.data["rd"] = d
                    fi.inv = 0.28
                    self.dust(fi)
                    self.note(fi, "roll")
                elif "jump" in pressed and fi.z <= 0 and fi.cd["jump"] <= 0 and fi.stam >= 8:
                    self.start(fi, "jump", 9)
                    fi.vz = 400 if KITS[fi.kit]["cat"] else 360
                    fi.stam -= 8
                    fi.cd["jump"] = 0.25
                    self.dust(fi)
                    self.note(fi, "jump")
                elif "atk" in pressed:
                    # J: a tap is a light hit, holding it charges a heavy (decided in "charge")
                    self.start(fi, "charge", 9)
                    fi.data["tap"] = True
                    fi.charge = 0.0
                elif "light" in pressed:
                    fi.combo = 0
                    self.aim(fi)
                    self.start(fi, "light", sum(LIGHT[0][:3]))
                elif "heavy" in held and fi.stam >= 10:
                    self.start(fi, "charge", 9)
                    fi.charge = 0.0
                elif "block" in held and fi.stam > 4:
                    self.start(fi, "block", 99)
                    fi.block_t = self.clock
                elif "s1" in pressed and fi.cd["s1"] <= 0:
                    self.skill(fi, 0)
                elif "s2" in pressed and fi.cd["s2"] <= 0:
                    self.skill(fi, 1)
                elif "throw" in pressed:
                    self.throw_or_grab(fi)
            elif st == "block":
                want = (mx * sp * 0.3, my * sp * 0.3)
                if "block" not in held or fi.stam <= 0:
                    self.start(fi, "idle", 0)
                elif "dodge" in pressed and fi.cd["roll"] <= 0 and fi.stam >= 16:
                    self.start(fi, "roll", 0.36)
                    fi.stam -= 16
                    fi.cd["roll"] = 0.45
                    fi.data["rd"] = (mx, my) if mn > 0.1 else (-fi.fx, -fi.fy)
                    fi.inv = 0.28
                    self.note(fi, "roll")
            elif st == "charge":
                tap = fi.data.get("tap")
                if tap:
                    fi.charge = max(0.0, min(0.8, fi.t - TAP))
                    if fi.t > TAP:
                        fi.stam = max(0.0, fi.stam - dt * 10)
                    still = "atk" in held
                else:
                    fi.charge = min(0.8, fi.charge + dt)
                    fi.stam = max(0.0, fi.stam - dt * 10)
                    still = "heavy" in held
                want = (mx * sp * 0.4, my * sp * 0.4)
                if tap and not still and fi.t < TAP:
                    fi.combo = 0
                    self.aim(fi)
                    self.start(fi, "light", sum(LIGHT[0][:3]))
                elif not still or fi.stam <= 0:
                    pw = fi.charge
                    self.aim(fi)
                    self.start(fi, "heavy", 0.12 + 0.12 + 0.36)
                    fi.data["power"] = pw
                    fi.stam = max(0.0, fi.stam - 14)
        elif st == "light":
            s, act, rec, dmg, kb, stun = LIGHT[fi.combo]
            step = 70 if fi.t < s + act else 0
            want = (fi.fx * step, fi.fy * step)
            if ("light" in pressed or "atk" in pressed) and fi.combo < 2:
                fi.queued = True
            if s <= fi.t < s + act:
                self.melee(fi, KITS[fi.kit]["reach"], 110, dmg, kb, stun, kd=fi.combo == 2, key="l%d" % fi.combo)
            if fi.t >= s + act + rec * 0.45 and fi.queued:
                fi.queued = False
                fi.combo += 1
                self.aim(fi)
                self.start(fi, "light", sum(LIGHT[fi.combo][:3]))
                fi.combo = min(fi.combo, 2)
            elif fi.t >= fi.dur:
                self.start(fi, "idle", 0)
        elif st == "heavy":
            pw = fi.data.get("power", 0.0)
            if 0.12 <= fi.t < 0.24:
                dmg = 13 + 16 * pw / 0.8
                kb = 260 + 220 * pw / 0.8
                if KITS[fi.kit]["cat"]:
                    self.melee(fi, 62, 360, dmg, kb, 0.5, kd=pw > 0.5, key="h", guard_break=pw >= 0.75)
                else:
                    self.melee(fi, KITS[fi.kit]["reach"] + 10, 130, dmg, kb, 0.5, kd=pw > 0.4, key="h",
                               guard_break=pw >= 0.75)
                if fi.t - dt < 0.12:
                    self.add_fx("swing" if not KITS[fi.kit]["cat"] else "spin", fi, r=62)
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
        elif st == "jump":
            want = (mx * sp * 0.9, my * sp * 0.9)
            if mn > 0.1:
                fi.fx, fi.fy = mx, my
            if ("atk" in pressed or "light" in pressed) and fi.z > 12:
                self.aim(fi, 150)
                self.start(fi, "dive", 9)
                fi.vz = min(fi.vz, -520)
                self.note(fi, "dive")
            elif "throw" in pressed and fi.hold:
                self.throw_or_grab(fi)
            elif fi.t > 0.05 and fi.z <= 0:
                self.start(fi, "idle", 0)
        elif st == "dive":
            want = (fi.fx * 120, fi.fy * 120)
            if fi.z <= 0 and not fi.data.get("boom"):
                fi.data["boom"] = True
                fi.vz = 0.0
                for o in self.enemies(fi):
                    if o.alive() and math.hypot(o.a.x - a.x, (o.a.y - a.y) * 1.15) < 58 + KITS[o.kit]["body"] and o.z < 30:
                        if self.hit(fi, o, 10, 230, 0.45, False, (o.a.x - a.x, o.a.y - a.y)):
                            self.note(fi, "hit", key="dive")
                self.add_fx("ring", fi, r=60)
                self.dust(fi)
                fi.t = 0.0
            if fi.data.get("boom") and fi.t >= 0.22:
                self.start(fi, "idle", 0)
        elif st == "roll":
            d = fi.data.get("rd", (fi.fx, fi.fy))
            want = (d[0] * 330, d[1] * 330)
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
        elif st in ("hit", "stun"):
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
        elif st == "down":
            if fi.t >= fi.dur:
                self.start(fi, "getup", 0.3)
                fi.inv = 0.5
        elif st == "getup":
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
        elif st == "throw":
            if fi.t >= 0.1 and not fi.data.get("done"):
                fi.data["done"] = True
                self.launch(fi, fi.data["ammo"])
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
        elif st == "skill":
            want = self.step_skill(fi, dt)
        elif st == "ko":
            if fi.t >= fi.dur:
                self.respawn(fi)
        elif st == "fall":
            fi.z -= 260 * dt
            if fi.t >= fi.dur:
                self.respawn(fi)
            return
        # ---- movement, forces, height
        ax, ay = want
        zones = self.zone_at(a.x, a.y) if fi.z <= 0 else []
        slip = any(z[0] == "slip" for z in zones)
        if slip and fi.st in ("idle", "block", "charge"):
            k = min(1.0, dt * 2.2)
            fi.vx += (ax - fi.vx) * k
            fi.vy += (ay - fi.vy) * k
        else:
            fi.vx, fi.vy = ax, ay
        for kind, extra in zones:
            if kind == "belt":
                fi.vx += extra[0] * (1.0 if fi.st != "roll" else 0.4)
                fi.vy += extra[1]
            elif kind == "bounce" and fi.z <= 0 and fi.bounce_cd <= 0 and fi.alive():
                fi.vz = extra
                fi.bounce_cd = 0.7
                self.bounce_item(a.x, a.y)
                self.w.sfx("splash", 6) if False else None
        fr = 1.6 if slip else 7.0
        fi.kx *= max(0.0, 1 - fr * dt)
        fi.ky *= max(0.0, 1 - fr * dt)
        vx, vy = fi.vx + fi.kx, fi.vy + fi.ky
        self.move(fi, vx * dt, vy * dt)
        if fi.z > 0 or fi.vz != 0:
            fi.vz -= GRAV * dt
            fi.z += fi.vz * dt
            if fi.z <= 0:
                fi.z = 0.0
                if fi.vz < -200 and fi.st in ("idle", "hit"):
                    self.dust(fi)
                fi.vz = 0.0
        a.h = fi.z
        if vx or vy:
            a.moved += math.hypot(vx, vy) * dt
        # off the edge
        if self.arena["pits"] and fi.alive() and fi.z <= 0 and not self.floor_ok(a.x, a.y):
            self.start(fi, "fall", 0.7)
            fi.kos += 1
            self.credit(fi)
            self.add_fx("text", fi, text="出界！")
            self.w.sfx("splash", 1)

    def start(self, fi, st, dur):
        fi.st, fi.t, fi.dur = st, 0.0, dur
        fi.hit_ids = set()
        fi.data = {k: v for k, v in fi.data.items() if k in ("rd",)} if st == "roll" else {}
        if st != "light":
            fi.queued = False

    def move(self, fi, dx, dy):
        a = fi.a
        r = KITS[fi.kit]["body"] * 0.6
        air = fi.z > 40
        nx, ny = a.x + dx, a.y + dy
        if self.can_stand(nx, ny, r, air):
            a.x, a.y = nx, ny
        elif self.can_stand(nx, a.y, r, air):
            a.x = nx
            fi.ky *= 0.5
        elif self.can_stand(a.x, ny, r, air):
            a.y = ny
            fi.kx *= 0.5
        else:
            if abs(fi.kx) + abs(fi.ky) > 200 and fi.alive():
                self.wall_bonk(fi)
            fi.kx = fi.ky = 0.0

    def wall_bonk(self, fi):
        # knocked into a wall / snow wall: a little extra
        for o in self.obst:
            if o["hp"] > 0 and abs(fi.a.x - o["x"]) < o["w"] / 2 + 30 and abs(fi.a.y - o["y"]) < o["d"] / 2 + 30:
                self.hurt_obstacle(o, 1)
        self.add_fx("stars", fi)

    def separate(self):
        fs = [f for f in self.fighters if f.alive() and f.a.f == self.f]
        for i, p in enumerate(fs):
            for q in fs[i + 1:]:
                if abs(p.z - q.z) > 30 or p.st == "roll" or q.st == "roll":
                    continue
                need = KITS[p.kit]["body"] + KITS[q.kit]["body"]
                dx, dy = q.a.x - p.a.x, q.a.y - p.a.y
                d = math.hypot(dx, dy)
                if d < need:
                    if d < 0.01:
                        dx, dy, d = 1.0, 0.0, 1.0
                    push = (need - d) / 2
                    self.move(p, -dx / d * push, -dy / d * push)
                    self.move(q, dx / d * push, dy / d * push)

    # ---- hits ------------------------------------------------------------------------------------------------
    def enemies(self, fi):
        if self.mode == "ffa":
            return [o for o in self.fighters if o is not fi]
        return [o for o in self.fighters if o.team != fi.team]

    def melee(self, fi, reach, arc, dmg, kb, stun, kd=False, key="", guard_break=False):
        for o in self.enemies(fi):
            if o.uid in fi.hit_ids or not o.alive() or o.inv > 0 or o.st in ("down",) and not kd:
                continue
            if abs(o.z - fi.z) > 42:
                continue
            dx, dy = o.a.x - fi.a.x, o.a.y - fi.a.y
            d = math.hypot(dx, dy * 1.15)
            if d > reach + 8 + KITS[o.kit]["body"]:
                continue
            if arc < 360 and d > 1:
                cosang = (dx * fi.fx + dy * fi.fy) / d
                if cosang < math.cos(math.radians(min(360, arc + 30) / 2)):
                    continue
            fi.hit_ids.add(o.uid)
            if self.hit(fi, o, dmg, kb, stun, kd, (dx, dy), guard_break):
                self.note(fi, "hit", key=key, power=fi.data.get("power", 0.0))

    def hit(self, att, o, dmg, kb, stun, kd, dirv, guard_break=False, proj=False):
        """att hits o (att may be None for a hazard)."""
        if not o.alive() or o.inv > 0:
            return False
        if PL.block(self, o):
            return False
        ux, uy = norm(*dirv)
        if att is not None:
            dmg *= KITS[att.kit]["power"] * (1.4 if att.buff.get("power", 0) > self.clock else 1.0)
        # blocking (facing the hit)
        if o.st == "block" and (ux * o.fx + uy * o.fy) < -0.2 and not guard_break:
            if self.clock - o.block_t < 0.18 and att is not None and not proj:
                # parry!
                self.start(att, "stun", 0.8)
                att.kx, att.ky = ux * -160, uy * -160
                self.add_fx("parry", o)
                self.add_fx("text", o, text="弹反！")
                self.w.sfx("chime", 3)
                self.note(o, "blocked", parry=True)
                return False
            o.stam -= dmg * 1.5
            o.hp -= dmg * 0.15
            FA.on_block(self, o, side=False)
            self.sound("block")
            o.kx, o.ky = ux * kb * 0.35, uy * kb * 0.35
            self.add_fx("block", o)
            self.note(o, "blocked")
            if o.stam <= 0:
                o.stam = 0
                self.start(o, "stun", 1.2)
                self.add_fx("text", o, text="破防！")
            self.check_ko(o, att)
            return True
        sh = o.buff.get("shield_hp", 0)
        if sh > 0 and o.buff.get("shield", 0) > self.clock:
            take = min(sh, dmg)
            o.buff["shield_hp"] = sh - take
            dmg -= take
            self.add_fx("shield", o)
        o.hp -= dmg
        o.last_by = att.uid if att is not None else o.last_by
        o.kx, o.ky = ux * kb, uy * kb
        if att is not None and dmg > 0:
            t = att.__dict__.setdefault("tally", {})
            t["hits"] = t.get("hits", 0) + 1
        if dmg > 0:
            heavy = dmg >= 12 or kd
            if self.GAME == "shoot":         # a snowball: a puff of snow
                FA.burst(self, "drop", o.a.x, o.a.y, o.z + 30, n=12, col="#ffffff", col2="#d8ecff", spd=220,
                         ang=math.degrees(math.atan2(uy, ux)), spread=140, g=500, dur=0.45, size=3, side=False)
                o.flash = 0.1
            else:
                FA.on_hit(self, att, o, dmg, heavy=heavy, side=False)
            self.sound("hit2" if heavy else "hit")
            if random.random() < 0.3:
                self.sound("mew" if o.a.is_cat else "oof", o)
        if att is not None and att.st != "skill":
            att.data["hitstop"] = 0.05
        if kd:
            self.start(o, "down", 0.85)
            o.vz = 260
        elif o.st not in ("down", "skill") or dmg > 8:
            self.start(o, "hit", stun)
        if dmg > 0:
            self.add_fx("hit", o, n=int(round(dmg)), big=dmg >= 12)
            self.w.sfx("dishes" if False else "chime", 0.15) if False else None
        if att is not None and not att.a.is_cat and random.random() < 0.15:
            att.a.say(random.choice(["看招！", "嘿！", "接着！"]), 1.0)
        if o.a.is_cat and random.random() < 0.25:
            o.a.say(random.choice(["喵！", "嗷！", "哈——"]), 0.9)
        self.check_ko(o, att)
        return True

    def check_ko(self, o, att):
        if o.hp > 0 or not o.alive():
            return
        if self.mode == "train":
            o.hp = float(o.maxhp)
            self.add_fx("text", o, text="（训练中，血量回满）", small=True)
            return
        o.hp = 0
        o.kos += 1
        self.start(o, "ko", 2.4)
        o.vz = 320
        self.credit(o)
        self.add_fx("ko", o)
        self.add_fx("text", o, text="击倒！")
        if o.a.is_cat:
            o.a.say(random.choice(["喵呜……", "我还会回来的！", "（眼冒金星）"]), 1.8)
        else:
            o.a.say(random.choice(["哎哟……", "你等着！", "认输认输……"]), 1.8)

    def credit(self, o):
        by = next((f for f in self.fighters if f.uid == o.last_by), None)
        if by is not None and by is not o:
            by.score += 1

    def respawn(self, fi):
        x, y = self.spawn_point(fi)
        fi.a.x, fi.a.y = x, y
        fi.z = 0.0
        fi.kx = fi.ky = fi.vz = 0.0
        fi.hp = float(fi.maxhp)
        fi.stam = 100.0
        fi.inv = 1.6
        fi.hold = None
        self.start(fi, "idle", 0)

    # ---- training ---------------------------------------------------------------------------------------------
    def train_text(self, i):
        key, text, keys = self.TRAIN_STEPS[i][:3]
        me = next((fi for fi in self.fighters if fi.uid == (self.train or {}).get("uid")), None)
        sk = SKILLS[KITS[me.kit]["skills"][0]] if me is not None else SKILLS["pounce"]
        if self.ammo_piles:
            pile = {"snow_pile": "雪球堆", "pillow_pile": "枕头堆", "gun_crate": "水枪箱"}.get(self.ammo_piles[0].type, "弹药堆")
            tip = "走到%s旁边按 E 拿弹药，再按 E 扔向陪练" % pile
        else:
            tip = "地上有个毛线炸弹：走过去就捡起来，再按 E 扔向陪练"
        return text.format(skill=sk["name"], desc=sk["desc"], throw_tip=tip), keys

    def train_enter(self, i):
        tr = self.train
        tr["i"] = i
        tr["done_t"] = None
        if i >= len(self.TRAIN_STEPS):
            self.phase = "over"
            self.over_t = 60.0
            self.result = {"teams": [], "text": getattr(self, "TRAIN_DONE", "训练完成！你已经会打架啦 🎉")}
            self.say_banner(self.result["text"], 60)
            for fi in self.fighters:
                fi.st = "over"
                fi.kx = fi.ky = 0.0
            self.gong()
            return
        key = self.TRAIN_STEPS[i][0]
        me = self.trainee()
        self.train_prepare(key, me)
        if self.GAME != "melee":
            for ev, kw in tr.get("seen", []):
                if self.train_ok(key, ev, kw):
                    tr["done_t"] = self.t - 0.6
                    if me is not None:
                        self.add_fx("text", me, text="✓ 这个你已经会了！", small=True)
                    break
            tr["seen"] = []
            return
        if key == "throw" and not self.ammo_piles and me is not None:
            x = min(max(me.a.x + 70 * (1 if me.a.x < H.PW / 2 else -1), 80), H.PW - 80)
            for dy in (0, 40, -40, 80, -80):
                if self.floor_ok(x, me.a.y + dy) and not self.blocked(x, me.a.y + dy, 20):
                    self.items.append({"k": "yarn_bomb", "x": x, "y": me.a.y + dy, "t": -1e9})
                    break
        if key == "heavy" and me is not None:
            me.stam = 100.0

    def train_prepare(self, key, me):
        """A game can set the stage for a tutorial step (fill the meter, drop an item...)."""

    def train_ok(self, key, ev, kw):
        """Does event ev complete tutorial step key? (each game has its own steps)"""
        for st in self.TRAIN_STEPS:
            if st[0] == key and len(st) > 3:
                test = st[3]
                return test(ev, kw) if callable(test) else ev == test
        return False

    def trainee(self):
        uid = (self.train or {}).get("uid")
        return next((fi for fi in self.fighters if fi.uid == uid), None)

    def note(self, fi, ev, **kw):
        """Something a fighter just did: moves the tutorial on (and is counted for the achievements)."""
        if self.phase == "fight" and fi is not None:
            t = fi.__dict__.setdefault("tally", {})
            t[ev] = t.get(ev, 0) + 1
        tr = self.train
        if tr is None or self.phase != "fight" or fi.uid != tr.get("uid"):
            return
        if self.GAME != "melee":
            # remember what was done, so a step already shown off before its turn counts straight away
            seen = tr.setdefault("seen", [])
            seen.append((ev, {k: v for k, v in kw.items() if isinstance(v, (str, int, float, bool))}))
            del seen[:-40]
        if tr.get("done_t") is not None or tr["i"] >= len(self.TRAIN_STEPS):
            return
        key = self.TRAIN_STEPS[tr["i"]][0]
        ok = self.train_ok(key, ev, kw) if self.GAME != "melee" else (key == "tap" and ev == "hit" and str(kw.get("key", "")).startswith("l")) or \
             (key == "combo" and ev == "hit" and kw.get("key") == "l2") or \
             (key == "heavy" and ev == "hit" and kw.get("key") == "h" and kw.get("power", 0) >= 0.3) or \
             (key == "skill" and ev == "skill") or \
             (key == "block" and ev == "blocked") or \
             (key == "roll" and ev == "roll") or \
             (key == "jump" and ev == "dive") or \
             (key == "throw" and ev == "launch")
        if ok:
            tr["done_t"] = self.t
            self.add_fx("text", fi, text="✓ 做到了！" if not kw.get("parry") else "✓ 弹反！太厉害了")
            self.w.sfx("chime", 2)

    def step_train(self, dt):
        tr = self.train
        if self.phase != "fight" or tr["i"] >= len(self.TRAIN_STEPS):
            return
        me = self.trainee()
        if me is None:
            return
        key = self.TRAIN_STEPS[tr["i"]][0]
        if key == "move" and tr["done_t"] is None:
            mate = next((o for o in self.enemies(me)), None)
            if mate is not None and math.hypot(mate.a.x - me.a.x, mate.a.y - me.a.y) < 110:
                self.note(me, "near")
                tr["done_t"] = self.t
                self.add_fx("text", me, text="✓ 做到了！")
                self.w.sfx("chime", 2)
        if self.GAME == "melee" and key == "throw" and not self.ammo_piles and tr["done_t"] is None and \
                not self.items and not me.hold and \
                not any(p["owner"] == me.uid for p in self.projs):
            self.train_enter(tr["i"])                  # dropped it somewhere silly: another one
        if tr["done_t"] is not None and self.t - tr["done_t"] > 1.2:
            self.train_enter(tr["i"] + 1)

    # ---- skills ------------------------------------------------------------------------------------------------
    def skill(self, fi, idx):
        sk = KITS[fi.kit]["skills"]
        if idx >= len(sk):
            return
        name = sk[idx]
        self.aim(fi, 300 if name in ("pounce", "charge") else (500 if name == "throw" else AIM_RANGE))
        self.note(fi, "skill")
        fi.cd["s1" if idx == 0 else "s2"] = SKILLS[name]["cd"]
        self.start(fi, "skill", {"pounce": 0.75, "flurry": 0.7, "slam": 0.85, "charge": 0.55, "throw": 0.3}[name])
        fi.data["sk"] = name
        if name == "pounce":
            fi.vz = 330
            self.add_fx("text", fi, text="飞扑！", small=True)
        elif name == "slam":
            fi.vz = 460
        elif name == "charge":
            self.add_fx("text", fi, text="冲啊！", small=True)
        elif name == "throw":
            ammo = self.arena.get("ammo") or "plush"
            if ammo == "water":
                ammo = "plush"
            fi.data["ammo"] = ammo
        if fi.a.is_cat:
            self.w.app.play_sound("hiss", fi.a.src) if name == "slam" and random.random() < 0.5 else None

    def step_skill(self, fi, dt):
        name = fi.data.get("sk")
        t = fi.t
        want = (0.0, 0.0)
        if name == "pounce":
            if t < 0.6:
                want = (fi.fx * 280, fi.fy * 280)
                self.melee(fi, 42, 200, 15, 280, 0.5, kd=True, key="p")
            if t >= fi.dur and fi.z <= 0:
                self.start(fi, "idle", 0)
        elif name == "flurry":
            want = (fi.fx * 60, fi.fy * 60)
            k = int(t / 0.13)
            if k != fi.data.get("k"):
                fi.data["k"] = k
                fi.hit_ids = set()
                self.add_fx("slash", fi)
            self.melee(fi, 50, 130, 4, 60, 0.2, key="f")
            if t >= fi.dur:
                self.start(fi, "idle", 0)
        elif name == "slam":
            if t >= 0.55 and fi.z <= 0 and not fi.data.get("boom"):
                fi.data["boom"] = True
                for o in self.enemies(fi):
                    d = math.hypot(o.a.x - fi.a.x, o.a.y - fi.a.y)
                    if d < 92 and o.z < 40:
                        self.hit(fi, o, 14, 330, 0.5, True, (o.a.x - fi.a.x, o.a.y - fi.a.y))
                self.add_fx("ring", fi, r=92)
                self.dust(fi)
                for ob in self.obst:
                    if math.hypot(ob["x"] - fi.a.x, ob["y"] - fi.a.y) < 110:
                        self.hurt_obstacle(ob, 2)
            if t >= fi.dur and fi.z <= 0:
                self.start(fi, "idle", 0)
        elif name == "charge":
            if t < 0.45:
                want = (fi.fx * 420, fi.fy * 420)
                self.melee(fi, 36, 160, 14, 380, 0.6, kd=True, key="c")
                if int(t * 20) % 2 == 0:
                    self.dust(fi)
            if t >= fi.dur:
                self.start(fi, "idle", 0)
        elif name == "throw":
            if t >= 0.1 and not fi.data.get("done"):
                fi.data["done"] = True
                self.launch(fi, fi.data.get("ammo", "plush"))
            if t >= fi.dur:
                self.start(fi, "idle", 0)
        return want

    # ---- throwing ----------------------------------------------------------------------------------------------
    def throw_or_grab(self, fi):
        if fi.hold:
            kind, n = fi.hold
            spec = AMMO[kind]
            if fi.cd["throw"] > 0:
                return
            fi.cd["throw"] = spec.get("rate", 0.35)
            n -= 1
            fi.hold = [kind, n] if n > 0 else None
            if kind == "water":
                self.aim(fi, 520)
                self.launch(fi, "water")
                return
            self.aim(fi, 520)
            self.start(fi, "throw", 0.3)
            fi.data["ammo"] = kind
            return
        for it in self.ammo_piles:
            if math.hypot(it.x - fi.a.x, it.y - fi.a.y) < 70:
                kind = {"snow_pile": "snowball", "pillow_pile": "pillow", "gun_crate": "water"}[it.type]
                fi.hold = [kind, AMMO[kind]["count"]]
                self.add_fx("text", fi, text="拿到%s×%d" % (AMMO[kind]["name"], AMMO[kind]["count"]), small=True)
                return

    def launch(self, fi, kind):
        self.note(fi, "launch")
        spec = AMMO[kind]
        sp = spec["speed"]
        # aim at the nearest enemy roughly in front, if there is one
        tx, ty = fi.fx, fi.fy
        best = None
        for o in self.enemies(fi):
            if not o.alive():
                continue
            dx, dy = o.a.x - fi.a.x, o.a.y - fi.a.y
            d = math.hypot(dx, dy)
            if d > 1 and (dx * fi.fx + dy * fi.fy) / d > 0.6 and (best is None or d < best[0]):
                best = (d, dx / d, dy / d)
        if best is not None:
            tx, ty = best[1], best[2]
        p = {"k": kind, "x": fi.a.x + tx * 20, "y": fi.a.y + ty * 20, "z": fi.z + (36 if not fi.a.is_cat else 20),
             "vx": tx * sp, "vy": ty * sp, "vz": 180 if spec["arc"] else 0.0, "owner": fi.uid, "team": fi.team,
             "life": 1.6 if spec["arc"] else 0.9, "r": spec["r"], "rot": 0.0}
        self.projs.append(p)

    def step_projs(self, dt):
        out = []
        for p in self.projs:
            p["life"] -= dt
            p["x"] += p["vx"] * dt
            p["y"] += p["vy"] * dt
            p["rot"] += dt * 12
            spec = AMMO[p["k"]]
            if spec["arc"]:
                p["vz"] -= GRAV * 0.55 * dt
                p["z"] += p["vz"] * dt
            done = p["life"] <= 0 or p["z"] <= 0 or not (0 < p["x"] < H.PW and -40 < p["y"] < H.PD_PLACE)
            if not done:
                for o in self.obst:
                    if o.get("team") is not None and o["team"] == p["team"]:
                        continue                  # your own team's snow wall: you throw from behind it
                    if o["hp"] > 0 and abs(p["x"] - o["x"]) < o["w"] / 2 and abs(p["y"] - o["y"]) < o["d"] / 2 + 6 \
                            and p["z"] < 46:
                        self.hurt_obstacle(o, 1)
                        done = True
                        break
            if not done and p["z"] < 60 and self.blocked(p["x"], p["y"], 0, team=p["team"]):
                done = True
            if not done:
                owner = next((f for f in self.fighters if f.uid == p["owner"]), None)
                for o in self.fighters:
                    if o.uid == p["owner"] or (self.mode != "ffa" and o.team == p["team"]) or not o.alive():
                        continue
                    if math.hypot(o.a.x - p["x"], (o.a.y - p["y"]) * 1.2) < KITS[o.kit]["body"] + p["r"] and \
                            abs(p["z"] - o.z - 20) < 40:
                        if p["k"] == "yarn_bomb":
                            break
                        self.hit(owner, o, spec["dmg"], spec["kb"], 0.3, False, (p["vx"], p["vy"]), proj=True)
                        done = True
                        self.add_fx("splash" if p["k"] in ("water", "snowball") else "poof", None, x=p["x"], y=p["y"],
                                    z=p["z"])
                        break
                else:
                    pass
                if not done and p["k"] == "yarn_bomb" and any(
                        math.hypot(o.a.x - p["x"], o.a.y - p["y"]) < 30 for o in self.fighters if o.uid != p["owner"]):
                    p["life"] = 0
                    done = True
            if done:
                if p["k"] == "yarn_bomb":
                    self.explode(p)
                elif p["life"] > 0 and p["z"] <= 0:
                    self.add_fx("splash" if p["k"] in ("water", "snowball") else "poof", None, x=p["x"], y=p["y"], z=0)
                continue
            out.append(p)
        self.projs = out

    def explode(self, p):
        owner = next((f for f in self.fighters if f.uid == p["owner"]), None)
        for o in self.fighters:
            if not o.alive() or o.uid == p["owner"]:
                continue
            d = math.hypot(o.a.x - p["x"], o.a.y - p["y"])
            if d < AMMO["yarn_bomb"]["boom"]:
                self.hit(owner, o, AMMO["yarn_bomb"]["dmg"], AMMO["yarn_bomb"]["kb"], 0.5, True,
                         (o.a.x - p["x"], o.a.y - p["y"]), proj=True)
        self.add_fx("boom", None, x=p["x"], y=p["y"], z=0, r=AMMO["yarn_bomb"]["boom"])
        self.w.sfx("splash", 1)

    def hurt_obstacle(self, o, n):
        o["hp"] -= n
        self.add_fx("poof", None, x=o["x"], y=o["y"] - 4, z=20)
        if o["hp"] <= 0:
            self.add_fx("text", None, x=o["x"], y=o["y"], z=40, text="哗啦！", small=True)

    # ---- items ------------------------------------------------------------------------------------------------
    def step_items(self, dt):
        self.next_item -= dt
        if self.next_item <= 0 and len(self.items) < 3 and self.train is None:
            self.next_item = random.uniform(9, 14)
            kinds = ["fish", "power", "speed", "shield", "yarn_bomb"]
            w = [3, 2, 2, 2, 1.5]
            if self.arena.get("items_bias") == "fish":
                w[0] = 7
            k = random.choices(kinds, weights=w)[0]
            for _ in range(20):
                x, y = random.uniform(120, H.PW - 120), random.uniform(60, H.PD_PLACE - 60)
                if self.floor_ok(x, y) and not self.blocked(x, y, 20) and \
                        not any(z[0] in ("slow", "belt") for z in self.zone_at(x, y)):
                    self.items.append({"k": k, "x": x, "y": y, "t": 0.0})
                    break
        for it in list(self.items):
            it["t"] += dt
            if it["t"] > 20:
                self.items.remove(it)
                continue
            for fi in self.fighters:
                if fi.alive() and fi.z < 30 and math.hypot(fi.a.x - it["x"], fi.a.y - it["y"]) < 30:
                    self.take_item(fi, it)
                    self.items.remove(it)
                    break

    def take_item(self, fi, it):
        k = it["k"]
        if k == "fish":
            fi.hp = min(fi.maxhp, fi.hp + 30)
            self.add_fx("text", fi, text="+30", heal=True)
        elif k == "power":
            fi.buff["power"] = self.clock + 8
            self.add_fx("text", fi, text="力量↑", small=True)
        elif k == "speed":
            fi.buff["speed"] = self.clock + 7
            self.add_fx("text", fi, text="速度↑", small=True)
        elif k == "shield":
            fi.buff["shield"] = self.clock + 10
            fi.buff["shield_hp"] = 30
            self.add_fx("text", fi, text="护盾", small=True)
        elif k == "yarn_bomb":
            fi.hold = ["yarn_bomb", 1]
            self.add_fx("text", fi, text="毛线炸弹（E 扔）", small=True)
        if fi.a.is_cat and k == "fish":
            fi.a.say("鱼！", 0.8)

    # ---- hazards ---------------------------------------------------------------------------------------------
    def step_hazards(self, dt):
        hz = self.arena.get("hazards", ())
        st = self.hz
        if "bucket" in hz:
            b = st.setdefault("bucket", {"next": 10.0, "warn": None})
            b["next"] -= dt
            tower = next((it for it in self.w.items if it.f == self.f and it.type == "bucket_tower"), None)
            if b["warn"] is None and b["next"] <= 2.0:
                target = random.choice([f for f in self.fighters if f.alive()] or self.fighters)
                b["warn"] = (target.a.x + random.uniform(-30, 30), target.a.y + random.uniform(-20, 20))
            if tower is not None:
                tower.state["tip"] = max(0.0, min(1.0, 1 - b["next"] / 0.5)) if b["next"] < 0.5 else \
                    max(0.0, tower.state.get("tip", 0) - dt * 2)
            if b["next"] <= 0:
                x, y = b["warn"]
                for fi in self.fighters:
                    d = math.hypot(fi.a.x - x, fi.a.y - y)
                    if d < 95 and fi.z < 40:
                        self.hit(None, fi, 6, 340, 0.5, False, (fi.a.x - x + 0.1, fi.a.y - y))
                self.add_fx("splash_big", None, x=x, y=y, z=0, r=95)
                self.w.sfx("splash", 0.5)
                b["next"] = random.uniform(11, 15)
                b["warn"] = None
        if "oranges" in hz:
            o = st.setdefault("oranges", {"next": 5.0, "list": []})
            o["next"] -= dt
            if o["next"] <= 0:
                o["next"] = random.uniform(4, 7)
                d = random.choice((-1, 1))
                o["list"].append({"x": 20 if d > 0 else H.PW - 20, "y": random.uniform(60, H.PD_PLACE - 60), "vx": 260 * d,
                                  "rot": 0.0})
            keep = []
            for r in o["list"]:
                r["x"] += r["vx"] * dt
                r["rot"] += r["vx"] * dt * 0.05
                if self.blocked(r["x"], r["y"], 10):
                    r["vx"] = -r["vx"] * 0.8
                    r["x"] += r["vx"] * dt * 2
                hitone = False
                for fi in self.fighters:
                    if fi.alive() and fi.z < 20 and fi.hazard_cd <= 0 and math.hypot(fi.a.x - r["x"], fi.a.y - r["y"]) < 26:
                        fi.hazard_cd = 1.0
                        self.hit(None, fi, 8, 260, 0.5, True, (r["vx"], 0))
                        hitone = True
                if 0 < r["x"] < H.PW and not hitone:
                    keep.append(r)
            o["list"] = keep
        if "yarnballs" in hz:
            ys = st.setdefault("yarnballs", {"list": [{"x": 300.0, "y": 240.0, "vx": 190.0, "vy": 130.0, "rot": 0.0},
                                                       {"x": 960.0, "y": 260.0, "vx": -170.0, "vy": -150.0, "rot": 0.0}]})
            for r in ys["list"]:
                nx, ny = r["x"] + r["vx"] * dt, r["y"] + r["vy"] * dt
                if not (40 < nx < H.PW - 40) or self.blocked(nx, r["y"], 14):
                    r["vx"] = -r["vx"]
                    nx = r["x"]
                if not (40 < ny < H.PD_PLACE - 30) or self.blocked(r["x"], ny, 14):
                    r["vy"] = -r["vy"]
                    ny = r["y"]
                r["x"], r["y"] = nx, ny
                r["rot"] += dt * 4
                for fi in self.fighters:
                    if fi.alive() and fi.z < 24 and fi.hazard_cd <= 0 and math.hypot(fi.a.x - r["x"], fi.a.y - r["y"]) < 30:
                        fi.hazard_cd = 1.0
                        self.hit(None, fi, 6, 260, 0.4, False, (fi.a.x - r["x"], fi.a.y - r["y"]))
        if "pinecones" in hz:
            pc = st.setdefault("pinecones", {"next": 3.0, "list": []})
            pc["next"] -= dt
            if pc["next"] <= 0:
                pc["next"] = random.uniform(1.8, 3.5)
                tgt = random.choice(self.fighters)
                x = min(max(tgt.a.x + random.uniform(-70, 70), 40), H.PW - 40)
                y = min(max(tgt.a.y + random.uniform(-50, 50), 30), H.PD_PLACE - 30)
                pc["list"].append({"x": x, "y": y, "t": 0.0})
            keep = []
            for r in pc["list"]:
                r["t"] += dt
                if r["t"] >= 1.2:
                    for fi in self.fighters:
                        if fi.alive() and fi.z < 30 and math.hypot(fi.a.x - r["x"], fi.a.y - r["y"]) < 32:
                            self.hit(None, fi, 10, 120, 0.6, False, (0.1, -1))
                            self.add_fx("stars", fi)
                    self.add_fx("poof", None, x=r["x"], y=r["y"], z=0)
                else:
                    keep.append(r)
            pc["list"] = keep
        if "waves" in hz:
            wv = st.setdefault("waves", {"next": 9.0, "y": None})
            wv["next"] -= dt
            if wv["y"] is None and wv["next"] <= 0:
                wv["y"] = float(H.PD_PLACE + 20)
                self.add_fx("text", None, x=630, y=440, z=40, text="浪来了！", small=True)
            if wv["y"] is not None:
                wv["y"] -= 150 * dt
                for fi in self.fighters:
                    if fi.alive() and fi.z < 30 and wv["y"] - 30 < fi.a.y < wv["y"] + 60:
                        fi.ky = min(fi.ky, -240)
                if wv["y"] < 230:
                    wv["y"] = None
                    wv["next"] = random.uniform(10, 14)
        if "crabs" in hz:
            cr = st.setdefault("crabs", {"list": [{"x": 300.0, "y": 330.0, "vx": 60.0}, {"x": 900.0, "y": 90.0, "vx": -55.0}]})
            for r in cr["list"]:
                r["x"] += r["vx"] * dt
                if not (60 < r["x"] < H.PW - 60) or self.blocked(r["x"], r["y"], 12):
                    r["vx"] = -r["vx"]
                for fi in self.fighters:
                    if fi.alive() and fi.z < 10 and fi.hazard_cd <= 0 and math.hypot(fi.a.x - r["x"], fi.a.y - r["y"]) < 26:
                        fi.hazard_cd = 1.2
                        self.hit(None, fi, 5, 160, 0.4, False, (fi.a.x - r["x"], fi.a.y - r["y"] + 0.1))
                        self.add_fx("text", fi, text="被夹了！", small=True)

    def bounce_item(self, x, y):
        for it in self.w.items:
            if it.f == self.f and it.type in ("big_bed", "mushroom") and abs(it.x - x) < 80 and abs(it.y - y) < 60:
                it.state["bounce"] = 1.0
                self.w.later(0.35, lambda it=it: it.state.__setitem__("bounce", 0.0))

    # ---- effects ---------------------------------------------------------------------------------------------
    def add_fx(self, k, fi, **kw):
        if fi is not None:
            kw.setdefault("x", fi.a.x)
            kw.setdefault("y", fi.a.y)
            kw.setdefault("z", fi.z + (30 if not fi.a.is_cat else 18))
            kw.setdefault("fx", fi.fx)
            kw.setdefault("fy", fi.fy)
            kw.setdefault("uid", fi.uid)
        d = {"k": k, "age": 0.0, "dur": {"text": 1.1, "hit": 0.5, "ko": 1.0, "ring": 0.5, "boom": 0.6, "splash_big": 0.7,
                                         "slash": 0.18, "swing": 0.25, "spin": 0.3}.get(k, 0.45)}
        d.update(kw)
        self.fx.append(d)
        if len(self.fx) > 150:
            self.fx = self.fx[-150:]

    def dust(self, fi):
        self.add_fx("dust", fi, z=0)

    def step_fx(self, dt):
        for e in self.fx:
            e["age"] += dt
        self.fx = [e for e in self.fx if e["age"] < e["dur"]]

    # ---- poses ----------------------------------------------------------------------------------------------
    def pose(self, fi):
        a = fi.a
        a.h = fi.z
        if abs(fi.fx) > 0.15:
            a.facing = 1 if fi.fx > 0 else -1
        st = fi.st
        moving = math.hypot(fi.vx, fi.vy) > 20
        cat = a.is_cat
        if self.phase in ("travel", "count") and st == "idle":
            if cat:
                a.set_pose("crouch" if self.phase == "count" else "stand")
            else:
                a.pose, a.view, a.prop, a.seat = "stand", "side", None, 0.0
            return
        if cat:
            p = {"idle": "run" if moving else "stand", "block": "arch", "charge": "crouch", "light": "swat",
                 "heavy": "kick", "roll": "belly", "hit": "annoyed", "stun": "grumpy", "down": "belly", "getup": "stretch",
                 "ko": "belly", "fall": "dangle", "throw": "swat"}.get(st, "stand")
            if st == "skill":
                sk = fi.data.get("sk")
                p = {"pounce": "jump", "flurry": "swat", "slam": "jump" if fi.z > 0 else "crouch"}.get(sk, "swat")
            elif st in ("jump", "dive"):
                p = "jump" if fi.z > 0 else "crouch"
            if fi.z > 0 and st in ("idle", "hit"):
                p = "jump"
            a.set_pose(p)
            a.running = moving
            if st == "light" and int(fi.t * 14) % 2:
                a.set_pose("stand")
        else:
            prop = "pillow"
            view = "side"
            p = {"idle": "run" if moving else "stand", "block": "crouch", "charge": "stretch", "light": "reach",
                 "heavy": "reach", "roll": "crouch", "hit": "stand", "stun": "stand", "down": "floor", "getup": "crouch",
                 "ko": "floor", "fall": "stand", "throw": "reach"}.get(st, "stand")
            if st == "skill":
                sk = fi.data.get("sk")
                p = {"charge": "run", "throw": "reach"}.get(sk, "reach")
            elif st == "jump":
                p = "stretch" if fi.z > 0 else "crouch"
            elif st == "dive":
                p = "reach" if fi.z > 0 else "crouch"
            if st in ("ko", "down"):
                prop = None
                view = "front"
            if fi.hold and st in ("idle",):
                prop = {"snowball": None, "water": None}.get(fi.hold[0], "pillow")
            a.pose, a.view, a.prop, a.seat = p, view, prop, 0.0

    def celebrate(self, fi, dt):
        a = fi.a
        win = self.result is not None and (fi.team in self.result.get("teams", ()) or self.train is not None)
        fi.z = max(0.0, fi.z - 200 * dt)
        a.h = fi.z
        if a.is_cat:
            a.set_pose(("happy" if int(self.t * 2) % 2 else "stretch") if win else "grumpy")
        else:
            a.pose = random.choice(("dance", "clap")) if win and int(self.t * 3) % 3 == 0 and a.pose not in ("dance", "clap") \
                else (a.pose if win else "stand")
            if not win:
                a.pose = "stand"
            a.view = "front"
            a.prop = None

    # ---- the end ------------------------------------------------------------------------------------------------
    def team_scores(self):
        if self.mode == "ffa":
            return {fi.team: fi.score for fi in self.fighters}
        sc = {}
        for fi in self.fighters:
            sc[fi.team] = sc.get(fi.team, 0) + fi.score
        return sc

    def team_kos(self):
        """Knock-outs suffered per team (what decides it)."""
        k = {}
        for fi in self.fighters:
            k[fi.team] = k.get(fi.team, 0) + fi.kos
        return k

    def check_end(self):
        if self.train is not None:
            return
        kos = self.team_kos()
        teams = sorted(set(fi.team for fi in self.fighters))
        loser = [tm for tm in teams if kos.get(tm, 0) >= self.kos_to_win]
        if self.mode == "ffa":
            alive = [tm for tm in teams if kos.get(tm, 0) < self.kos_to_win]
            if len(alive) <= 1:
                self.finish(alive)
                return
        elif loser:
            self.finish([tm for tm in teams if tm not in loser])
            return
        if self.clock >= self.limit:
            best = min(kos.get(tm, 0) for tm in teams)
            self.finish([tm for tm in teams if kos.get(tm, 0) == best])

    def finish(self, winners):
        self.phase = "over"
        self.over_t = 30.0
        draw = len(winners) != 1
        if draw:
            text = "平局！"
        elif self.mode == "ffa":
            fi = next(f for f in self.fighters if f.team == winners[0])
            text = "%s 赢了！" % fi.a.name
        else:
            names = "、".join(f.a.name for f in self.fighters if f.team == winners[0])
            text = "%s 赢了！（%s）" % (TEAM_NAMES.get(winners[0], ""), names)
        self.result = {"teams": winners if not draw else [], "text": text}
        self.say_banner(text, 30)
        self.gong()
        for fi in self.fighters:
            fi.st = "over"
            fi.kx = fi.ky = 0.0
            if fi.team in self.result["teams"]:
                fi.a.say(random.choice(["赢啦！", "耶！", "我最厉害！"]) if not fi.a.is_cat else "喵～（得意）", 2.5)
            elif not draw:
                fi.a.say(random.choice(["下次一定赢回来", "再来一局！", "哼"]) if not fi.a.is_cat else "喵……", 2.5)

    # ---- network ----------------------------------------------------------------------------------------------
    def to_net(self):
        return {"f": self.f, "ph": self.phase, "md": self.mode, "cl": round(self.clock, 1), "lm": self.limit,
                "kw": self.kos_to_win, "ct": round(getattr(self, "count_t", 0.0), 2),
                "fi": [[fi.uid, fi.team, fi.ctrl, int(fi.hp), fi.maxhp, int(fi.stam), fi.kos, fi.score, fi.st,
                        round(fi.cd["s1"], 1), round(fi.cd["s2"], 1), fi.hold, round(fi.inv, 2),
                        [k for k, v in fi.buff.items() if isinstance(v, float) and v > self.clock and k != "shield_hp"],
                        round(fi.fx, 2), round(fi.fy, 2), round(fi.z, 1), round(fi.charge, 2), fi.kit] for fi in self.fighters],
                "pr": [[p["k"], round(p["x"]), round(p["y"]), round(p["z"]), round(p["rot"], 1)] for p in self.projs],
                "itm": [[it["k"], round(it["x"]), round(it["y"])] for it in self.items],
                "ob": [[o["k"], o["x"], o["y"], o["hp"], o["w"], o["d"]] for o in self.obst],
                "fx": [dict(e, age=round(e["age"], 2)) for e in self.fx],
                "hz": self.hz_to_net(),
                "res": self.result, "bn": self.banner and [self.banner["text"], round(self.banner["until"] - self.t, 1)],
                "rdy": sorted(self.ready),
                "tr": self.train and [self.train["i"], self.train["uid"], self.train["done_t"] is not None] +
                list(self.train_text(self.train["i"]) if self.train["i"] < len(self.TRAIN_STEPS) else ("", "")),
                "gm": self.GAME, "sk": round(self.shake, 2), "x": self.net_extra(), "pal": PL.to_net(self),
                "fe": [self.fighter_extra(fi) for fi in self.fighters]}

    def net_extra(self):
        """Game state a guest needs for drawing (same attribute names as on the host)."""
        return {}

    def fighter_extra(self, fi):
        return {}

    def hz_to_net(self):
        out = {}
        for k, v in self.hz.items():
            if k == "bucket":
                out[k] = {"warn": v.get("warn"), "next": round(v["next"], 1)}
            elif k == "waves":
                out[k] = {"y": v.get("y")}
            elif "list" in v:
                out[k] = {"list": [{kk: (round(vv, 1) if isinstance(vv, float) else vv) for kk, vv in r.items()}
                                   for r in v["list"]]}
        return out


class RemoteBattle:
    """A guest's view of the host's fight: just the data to draw."""
    GAME = "melee"

    def __init__(self, world, d):
        self.w = world
        self.update(d)

    def update(self, d):
        self.f = int(d.get("f", 9))
        self.arena = AA.ARENAS.get(self.f, AA.ARENAS[9])
        self.phase = d.get("ph", "fight")
        self.mode = d.get("md", "1v1")
        self.clock = float(d.get("cl", 0))
        self.limit = float(d.get("lm", TIME_LIMIT))
        self.kos_to_win = int(d.get("kw", KO_TO_WIN))
        self.count_t = float(d.get("ct", 0))
        self.fighters = []
        for r in d.get("fi") or []:
            try:
                a = self.w.agent_by_uid(r[0])
                if a is None:
                    continue
                fi = Fighter.__new__(Fighter)
                fi.a, fi.uid, fi.team, fi.ctrl = a, r[0], int(r[1]), str(r[2])
                fi.hp, fi.maxhp, fi.stam, fi.kos, fi.score, fi.st = float(r[3]), int(r[4]), float(r[5]), int(r[6]), \
                    int(r[7]), str(r[8])
                fi.cd = {"s1": float(r[9]), "s2": float(r[10]), "roll": 0.0, "throw": 0.0}
                fi.hold = r[11]
                fi.inv = float(r[12])
                fi.bufflist = list(r[13])
                fi.fx, fi.fy, fi.z, fi.charge, fi.kit = float(r[14]), float(r[15]), float(r[16]), float(r[17]), str(r[18])
                fi.char = HG.char_of(a)
                fi.buff = {}
                self.fighters.append(fi)
            except (TypeError, ValueError, IndexError):
                pass
        self.projs = [{"k": r[0], "x": r[1], "y": r[2], "z": r[3], "rot": r[4]} for r in d.get("pr") or []]
        self.items = [{"k": r[0], "x": r[1], "y": r[2], "t": 0.0} for r in d.get("itm") or []]
        self.obst = [{"k": r[0], "x": r[1], "y": r[2], "hp": r[3],
                      "w": r[4] if len(r) > 5 else (92 if r[0] == "snow_wall" else 64),
                      "d": r[5] if len(r) > 5 else (24 if r[0] == "snow_wall" else 50)} for r in d.get("ob") or []]
        self.fx = list(d.get("fx") or [])
        self.hz = d.get("hz") or {}
        self.result = d.get("res")
        if self.result and getattr(self, "_my_recs", None):
            self.result.setdefault("recs", {}).update(self._my_recs)
        bn = d.get("bn")
        self.t = 0.0
        self.banner = {"text": bn[0], "until": float(bn[1])} if bn else None
        self.ready = set(d.get("rdy") or ())
        self.game = self.GAME = d.get("gm", "melee")
        self.shake = float(d.get("sk", 0.0))
        for k, v in (d.get("x") or {}).items():
            if not k.startswith("_"):
                setattr(self, k, v)
        for fi, e in zip(self.fighters, d.get("fe") or []):
            for k, v in (e or {}).items():
                setattr(fi, k, v)
            fi.a.hidden = bool(getattr(fi, "hidden", False))
        PL.from_net(self, d.get("pal") or {})
        tr = d.get("tr")
        self.train = None
        if tr:
            try:
                self.train = {"i": int(tr[0]), "uid": tr[1], "done": bool(tr[2]), "text": str(tr[3]), "keys": str(tr[4])}
            except (TypeError, ValueError, IndexError):
                self.train = None
        self.ammo_piles = [it for it in self.w.items if it.f == self.f and
                           it.type in ("snow_pile", "pillow_pile", "gun_crate")]

    def humans(self):
        return {fi.ctrl for fi in self.fighters if not fi.ctrl.startswith("ai:")}

    def step(self, dt):
        self.t += dt
        for e in self.fx:
            e["age"] = e.get("age", 0) + dt
        self.fx = [e for e in self.fx if e["age"] < e.get("dur", 0.5)]
        if self.phase == "over" and self.result and not getattr(self, "_recorded", False) and self.train is None:
            self._recorded = True
            try:
                from . import house_records as REC
                h = getattr(self.w, "house", None)
                me = h.my_agent() if h is not None else None
                REC.record_remote(self, self.w, me.uid if me is not None else None)
            except Exception as ex:
                print("records:", repr(ex))

    def team_kos(self):
        k = {}
        for fi in self.fighters:
            k[fi.team] = k.get(fi.team, 0) + fi.kos
        return k


# ======================================================================================================== AI
class AI:
    def __init__(self, b, fi, level):
        self.b = b
        self.fi = fi
        self.lv = DIFFS.get(level, DIFFS["normal"])
        self.next = 0.0
        self.target = None
        self.held = set()
        self.strafe = random.choice((-1, 1))
        self.plan = None

    def step(self, dt):
        fi = self.fi
        b = self.b
        inp = fi.inp
        self.next -= dt
        inp["held"] = set(self.held)
        if not fi.alive() or fi.st in ("hit", "stun", "down", "ko", "fall", "getup"):
            self.held.discard("block")
            self.held.discard("heavy")
            inp["dx"] = inp["dy"] = 0.0
            return
        # react to an attack coming in (checked often, acted on with the level's reflexes)
        threat = self.threat()
        if threat is not None and self.next <= 0:
            self.next = self.lv["react"] * random.uniform(0.7, 1.2)
            r = random.random()
            if r < self.lv["dodge"] and fi.cd["roll"] <= 0 and fi.stam > 20:
                ex, ey = norm(fi.a.x - threat.a.x, fi.a.y - threat.a.y)
                inp["dx"], inp["dy"] = -ey * self.strafe + ex * 0.5, ex * self.strafe + ey * 0.5
                if self.safe_dir(inp["dx"], inp["dy"]):
                    inp["pressed"].add("dodge")
                    return
            if r < self.lv["dodge"] + self.lv["block"] and fi.stam > 15:
                self.face(threat)
                self.held.add("block")
                inp["held"] = set(self.held)
                if random.random() < self.lv["parry"]:
                    pass
                return
        if "block" in self.held and (threat is None or fi.stam < 12):
            self.held.discard("block")
        if self.next > 0 and "heavy" not in self.held:
            self.move_plan(dt)
            return
        self.next = self.lv["react"] * random.uniform(0.6, 1.3)
        tgt = self.pick_target()
        self.target = tgt
        if tgt is None:
            inp["dx"] = inp["dy"] = 0.0
            return
        dx, dy = tgt.a.x - fi.a.x, tgt.a.y - fi.a.y
        d = math.hypot(dx, dy)
        reach = KITS[fi.kit]["reach"] + KITS[tgt.kit]["body"]
        # low on health: go for a fish if one is lying about
        if fi.hp < fi.maxhp * 0.4:
            fish = [it for it in b.items if it["k"] in ("fish", "shield")]
            if fish:
                it = min(fish, key=lambda it: math.hypot(it["x"] - fi.a.x, it["y"] - fi.a.y))
                self.plan = ("go", it["x"], it["y"])
                return
        if b.items and random.random() < 0.3 * self.lv["skill"]:
            it = min(b.items, key=lambda it: math.hypot(it["x"] - fi.a.x, it["y"] - fi.a.y))
            if math.hypot(it["x"] - fi.a.x, it["y"] - fi.a.y) < 220:
                self.plan = ("go", it["x"], it["y"])
                return
        # charged heavy release
        if "heavy" in self.held:
            if fi.charge > 0.5 + random.uniform(0, 0.3) or d < reach * 0.8:
                self.held.discard("heavy")
            self.plan = ("go", tgt.a.x, tgt.a.y)
            return
        # throwables
        if fi.hold and 120 < d < 420 and random.random() < 0.6:
            self.face(tgt)
            fi.inp["pressed"].add("throw")
            return
        ammo_piles = b.ammo_piles if hasattr(b, "ammo_piles") else []
        if not fi.hold and ammo_piles and random.random() < 0.25 * self.lv["skill"]:
            pile = min(ammo_piles, key=lambda it: math.hypot(it.x - fi.a.x, it.y - fi.a.y))
            if math.hypot(pile.x - fi.a.x, pile.y - fi.a.y) < 60:
                fi.inp["pressed"].add("throw")
                return
            if math.hypot(pile.x - fi.a.x, pile.y - fi.a.y) < 260:
                self.plan = ("go", pile.x, pile.y - 30)
                return
        sk = KITS[fi.kit]["skills"][0]
        if random.random() < self.lv["skill"] and fi.cd["s1"] <= 0:
            use = (sk == "pounce" and 90 < d < 190) or (sk == "charge" and 90 < d < 230) or \
                (sk == "throw" and 140 < d < 420) or (sk == "slam" and d < 90) or (sk == "flurry" and d < reach + 10)
            if use and (sk not in ("pounce", "charge") or abs(dy) < 50 or random.random() < 0.4):
                self.face(tgt)
                fi.inp["pressed"].add("s1")
                return
        if d < reach + 4:
            self.face(tgt)
            if tgt.st == "block" and random.random() < 0.5 * self.lv["skill"] + 0.1:
                self.held.add("heavy")             # charge through the guard
                return
            if random.random() < 0.15 and fi.stam > 30:
                self.held.add("heavy")
                return
            fi.inp["pressed"].add("light")
            self.combo_left = self.lv["combo"] - 1
            self.plan = ("combo", self.combo_left)
            return
        # get closer, a bit from the side
        side = self.strafe * (0.35 if d > 160 else 0.15)
        tx = tgt.a.x - dx / d * reach * 0.8 + (-dy / d) * side * 60
        ty = tgt.a.y - dy / d * reach * 0.8 + (dx / d) * side * 60
        self.plan = ("go", tx, ty)
        if random.random() < 0.05:
            self.strafe = -self.strafe

    def move_plan(self, dt):
        fi = self.fi
        inp = fi.inp
        if self.plan is None:
            inp["dx"] = inp["dy"] = 0.0
            return
        if self.plan[0] == "combo":
            if fi.st == "light" and self.plan[1] > 0 and fi.t > 0.1:
                inp["pressed"].add("light")
                self.plan = ("combo", self.plan[1] - 1)
            inp["dx"] = inp["dy"] = 0.0
            return
        _, x, y = self.plan
        aim = self.lv["aim"]
        dx, dy = x - fi.a.x, y - fi.a.y
        d = math.hypot(dx, dy)
        if d < 12:
            inp["dx"] = inp["dy"] = 0.0
            self.plan = None
            return
        ux, uy = dx / d + random.uniform(-aim, aim), dy / d + random.uniform(-aim, aim)
        if not self.safe_dir(ux, uy):
            # edge / obstacle ahead: slide round it
            for ang in (0.6, -0.6, 1.2, -1.2, 2.0, -2.0):
                c, s = math.cos(ang), math.sin(ang)
                vx, vy = ux * c - uy * s, ux * s + uy * c
                if self.safe_dir(vx, vy):
                    ux, uy = vx, vy
                    break
            else:
                ux = uy = 0.0
        inp["dx"], inp["dy"] = ux, uy

    def safe_dir(self, ux, uy):
        fi = self.fi
        b = self.b
        for k in (30, 60):
            x, y = fi.a.x + ux * k, fi.a.y + uy * k
            if b.arena["pits"] and not b.floor_ok(x, y):
                return False
            if b.blocked(x, y, 10):
                return False
        if "bucket" in b.hz and b.hz["bucket"].get("warn"):
            wx, wy = b.hz["bucket"]["warn"]
            if math.hypot(fi.a.x + ux * 40 - wx, fi.a.y + uy * 40 - wy) < 90 and self.lv["skill"] > 0.4:
                return False
        return True

    def face(self, tgt):
        fi = self.fi
        dx, dy = tgt.a.x - fi.a.x, tgt.a.y - fi.a.y
        ux, uy = norm(dx, dy)
        fi.fx, fi.fy = ux, uy
        fi.inp["dx"], fi.inp["dy"] = 0.0, 0.0

    def pick_target(self):
        fi = self.fi
        es = [o for o in self.b.enemies(fi) if o.alive()]
        if not es:
            return None
        if self.target in es and random.random() < 0.8:
            return self.target
        return min(es, key=lambda o: math.hypot(o.a.x - fi.a.x, o.a.y - fi.a.y) + o.hp * 0.5)

    def threat(self):
        fi = self.fi
        for o in self.b.enemies(fi):
            if not o.alive():
                continue
            d = math.hypot(o.a.x - fi.a.x, o.a.y - fi.a.y)
            if o.st in ("light", "heavy", "charge") and d < KITS[o.kit]["reach"] + 50:
                return o
            if o.st == "skill" and d < 200:
                return o
        for p in self.b.projs:
            if p["owner"] != fi.uid and math.hypot(p["x"] - fi.a.x, p["y"] - fi.a.y) < 140:
                vx, vy = p.get("vx", 0), p.get("vy", 0)
                if (fi.a.x - p["x"]) * vx + (fi.a.y - p["y"]) * vy > 0:
                    return next((f for f in self.b.fighters if f.uid == p["owner"]), None)
        return None


class TrainAI:
    """The sparring partner: stands still and takes it; swings slowly (glowing first) only while you learn to block
    and to roll."""

    def __init__(self, b, fi):
        self.b = b
        self.fi = fi
        self.wait = 1.5
        self.charging = 0.0

    def step(self, dt):
        fi = self.fi
        b = self.b
        inp = fi.inp
        inp["dx"] = inp["dy"] = 0.0
        inp["held"] = set()
        me = b.trainee()
        if me is None or not fi.alive() or fi.st in ("hit", "stun", "down", "getup") or b.train["i"] >= len(TRAIN_STEPS):
            self.charging = 0.0
            return
        key = TRAIN_STEPS[b.train["i"]][0]
        dx, dy = me.a.x - fi.a.x, me.a.y - fi.a.y
        d = math.hypot(dx, dy)
        if d > 1:
            fi.fx, fi.fy = dx / d, dy / d
        if key not in ("block", "roll") or b.train.get("done_t") is not None:
            self.charging = 0.0
            if d > 330:                                 # don't lose the trainee
                inp["dx"], inp["dy"] = dx / d * 0.5, dy / d * 0.5
            return
        if self.charging > 0:
            self.charging -= dt
            if self.charging > 0:
                inp["held"] = {"heavy"}
            return
        if d > 70:
            inp["dx"], inp["dy"] = dx / d * 0.6, dy / d * 0.6
            return
        self.wait -= dt
        if self.wait <= 0 and fi.st == "idle":
            self.wait = 2.2
            self.charging = 0.65                         # a long, glowing wind-up: time to press L
            inp["held"] = {"heavy"}


def battle_class(game):
    if game == "brawl":
        from .house_brawl import BrawlBattle
        return BrawlBattle
    if game == "bomb":
        from .house_bomb import BombBattle
        return BombBattle
    if game == "shoot":
        from .house_shoot import ShootBattle
        return ShootBattle
    if game == "race":
        from .house_race import RaceBattle
        return RaceBattle
    if game == "defend":
        from .house_defend import DefendBattle
        return DefendBattle
    if game == "paint":
        from .house_paint import PaintBattle
        return PaintBattle
    if game == "soccer":
        from .house_soccer import SoccerBattle
        return SoccerBattle
    if game == "fish":
        from .house_fishgrab import FishBattle
        return FishBattle
    if game == "hide":
        from .house_hide import HideBattle
        return HideBattle
    if game == "volley":
        from .house_volley import VolleyBattle
        return VolleyBattle
    return Battle


# ===================================================================================================== world mixin
class BattleWorld:
    def init_battle(self):
        self.battle = None
        from . import house_places as HPL
        for f, d in AA.ARENAS.items():
            HPL.LAYOUTS[f] = list(d.get("layout", []))

    def start_battle(self, f, teams, ctrls, mode="1v1", diff="normal", kos=KO_TO_WIN):
        if self.remote or f not in AA.ARENAS:
            return False
        if self.battle is not None and self.battle.phase != "over":
            return False
        if self.play.game:
            self.play.end_game(stopped=True)
        if self.battle is not None:
            self.end_battle(go_home=False)
        cls = battle_class(AA.ARENAS[f].get("game", "melee"))
        b = cls(self, f, teams, ctrls, mode, diff, kos)
        if len(b.fighters) < (1 if mode == "train" and cls.GAME == "race" else cls.MIN_FIGHTERS):
            return False
        self.battle = b
        b.begin()
        return True

    def in_battle(self, a):
        b = self.battle
        return b is not None and b.phase != "done" and any(fi.a is a for fi in b.fighters) and \
            not isinstance(b, RemoteBattle)

    def step_battle(self, dt):
        b = self.battle
        if b is None:
            return
        if isinstance(b, RemoteBattle):
            b.step(dt)
            return
        b.step(dt)
        for fi in b.fighters:
            a = fi.a
            a.t += dt
            a.st_t += dt
            a.tick_fx(dt)
            if a.path:
                if b.phase in ("travel", "count") or a.traveling is not None:
                    a.update_path(dt)     # on the way there
                else:
                    a.path = []           # nobody walks off in the middle of a fight
                    a.then = None
        if b.phase == "over" and b.over_t <= 0:
            self.end_battle()

    def end_battle(self, go_home=True):
        b = self.battle
        if b is None:
            return
        self.battle = None
        if isinstance(b, RemoteBattle):
            return
        for fi in b.fighters:
            a = fi.a
            a.h = 0.0
            a.hidden = False
            a.fanim = None
            a.rig = None
            if a.is_cat:
                a.set_state("idle", 1.0)
            else:
                a.act = "idle"
                a.pose, a.prop, a.view = "stand", None, "side"
                a.set_state("idle", 1.0)
            if go_home and a.f == b.f:
                x, y = self.random_floor(2) if self.outdoor_ok() else self.random_floor(0)
                tx, ty = H.GATE_OUT
                a.path = [{"t": "travel", "f": 2, "x": tx, "y": ty, "dur": TRAVEL, "battle": True}] + \
                    a.walk_steps(2, (tx, ty), (x, y), a.walk_v if not a.is_cat else 90)
                a.then = (lambda a=a: a.set_state("idle", 1.0))

    def leave_arena(self, a):
        """Someone standing about in an arena with no fight on: home they go."""
        if a.ctrl is not None or a.path:
            return
        x, y = self.random_floor(2) if self.outdoor_ok() else self.random_floor(0)
        tx, ty = H.GATE_OUT
        a.release_spot()
        a.path = [{"t": "travel", "f": 2, "x": tx, "y": ty, "dur": TRAVEL}] + \
            a.walk_steps(2, (tx, ty), (x, y), 90 if a.is_cat else a.walk_v)
        a.then = lambda: a.set_state("idle", 1.0)
        a.set_state("idle", 1e9)
        if not a.is_cat:
            a.act = "going_home"

    BATTLE_INPUTS = ("atk", "skill", "guard", "jump", "throw", "light", "heavy", "block", "dodge", "s1", "s2")

    def battle_input(self, pid, key, down):
        pl = self.play.players.get(pid)
        if pl is None or key not in self.BATTLE_INPUTS:
            return
        b = self.battle
        if b is not None and not isinstance(b, RemoteBattle) and b.phase in ("travel", "count"):
            if down and key == "atk":
                b.ready.add(pid)
            return
        held = pl.setdefault("bheld", set())
        if down:
            if key not in held:
                pl.setdefault("bpress", set()).add(key)
            if key in ("heavy", "block", "atk", "guard"):
                held.add(key)
        else:
            held.discard(key)

    def battle_to_net(self):
        b = self.battle
        if b is None or isinstance(b, RemoteBattle):
            return None
        return b.to_net()

    def battle_from_net(self, d):
        if not d:
            if isinstance(self.battle, RemoteBattle):
                for fi in self.battle.fighters:
                    fi.a.hidden = False
                    fi.a.fanim = None
                    fi.a.rig = None
            self.battle = None
            return
        if isinstance(self.battle, RemoteBattle):
            self.battle.update(d)
        else:
            self.battle = RemoteBattle(self, d)


Battle.TRAIN_STEPS = TRAIN_STEPS
