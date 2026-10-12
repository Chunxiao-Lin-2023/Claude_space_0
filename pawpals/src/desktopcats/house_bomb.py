"""泡泡堂 (in the yarn factory): a grid of spools that never break and boxes that do. J drops a yarn bomb at your feet;
after a moment it bursts in a cross. Caught in the burst you are wrapped in a ball of yarn: a team-mate's touch
frees you, an opponent's touch (or waiting too long) pops you — that counts as being knocked out. Boxes hide
power-ups: 💣 one more bomb, 🔥 longer bursts, 👟 faster feet, 📍 a needle (E: free yourself).
L kicks the bomb in front of you; Space hops over it. K is the character's own trick.
"""
import math
import random
from collections import deque

from . import house_art as H
from . import house_battle as HB
from . import house_fanim as FA
from . import house_games as HG
from . import house_pals as PL

COLS, ROWS = 15, 9
X0, Y0 = 30.0, 15.0
CW, CH = 80.0, 50.0
FUSE = 2.6
FLAME_T = 0.5
TRAP_T = 4.5
ITEM_KINDS = ("bomb", "fire", "speed", "needle")
ITEM_NAMES = {"bomb": "炸弹+1", "fire": "火力+1", "speed": "速度+1", "needle": "针（E 自救）"}
MAX = {"bomb": 6, "fire": 7, "speed": 4, "needle": 2}


def cx(c):
    return X0 + (c + 0.5) * CW


def cy(r):
    return Y0 + (r + 0.5) * CH


def col_of(x):
    return int(min(COLS - 1, max(0, (x - X0) // CW)))


def row_of(y):
    return int(min(ROWS - 1, max(0, (y - Y0) // CH)))


SPAWN_CELLS = [(0, 0), (14, 8), (14, 0), (0, 8)]


class BombBattle(HB.Battle):
    GAME = "bomb"

    def setup(self):
        self.obst = []
        self.projs = []
        self.items = []
        self.grid = [[None] * ROWS for _ in range(COLS)]   # None / "hard" / "soft"
        self.hidden_items = {}
        self.bombs = []
        self.flames = []                                     # {"c", "r", "t"}
        self.cell_items = []                                 # {"c", "r", "k", "safe"}
        self.next_bomb_id = 1
        rnd = random.Random()
        for c in range(COLS):
            for r in range(ROWS):
                if c % 2 == 1 and r % 2 == 1:
                    self.grid[c][r] = "hard"
        safe = set()
        for (sc, sr) in SPAWN_CELLS:
            for dc, dr in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0), (0, 2), (0, -2)):
                safe.add((sc + dc, sr + dr))
        for c in range(COLS):
            for r in range(ROWS):
                if self.grid[c][r] is None and (c, r) not in safe and rnd.random() < 0.62:
                    self.grid[c][r] = "soft"
                    if rnd.random() < 0.42:
                        self.hidden_items[(c, r)] = rnd.choices(ITEM_KINDS, weights=[4, 4, 3, 1])[0]
        for fi in self.fighters:
            fi.maxhp = 1
            fi.hp = 1.0
            fi.nb, fi.fire, fi.spd, fi.needles = 1, 2, 0, 0
            if fi.char == "mom":
                fi.needles = 1                 # 妈妈的针线包: always carries one needle
            fi.trapped = 0.0
            fi.dead_t = 0.0
            fi.cds = {"k": 0.0}
            fi.hop_cd = 0.0
            fi.fdir = (1 if fi.team % 2 == 0 else -1, 0)
            fi.hop = None
            fi.trap_by = None
        self.rebuild_obst()

    # ---- grid helpers ------------------------------------------------------------------------------------------
    def rebuild_obst(self):
        out = []
        for c in range(COLS):
            for r in range(ROWS):
                g = self.grid[c][r]
                if g:
                    out.append({"k": "b_" + g, "x": cx(c), "y": cy(r), "w": CW - 4, "d": CH - 4, "hp": 1})
        for bm in self.bombs:
            out.append({"k": "b_bomb", "x": bm["x"], "y": bm["y"], "w": 40, "d": 30, "hp": 1, "fuse": round(bm["fuse"], 2),
                        "team": bm["team"], "frozen": bm.get("frozen", 0) > 0, "mini": bm.get("mini", False),
                        "char": bm.get("char")})
        self.obst = out

    def bomb_at(self, c, r):
        return next((b for b in self.bombs if b["c"] == c and b["r"] == r and not b.get("moving")), None)

    def is_solid(self, c, r, fi=None):
        if not (0 <= c < COLS and 0 <= r < ROWS):
            return True
        if self.grid[c][r]:
            return True
        b = self.bomb_at(c, r)
        if b is not None and (fi is None or fi.uid not in b["pass"]):
            return True
        return False

    def cell(self, fi):
        return col_of(fi.a.x), row_of(fi.a.y)

    def spawn_point(self, fi):
        if self.mode == "ffa":
            k = self.fighters.index(fi) % 4
        else:
            same = [f for f in self.fighters if f.team == fi.team]
            j = same.index(fi) % 2 if fi in same else 0
            k = (0, 3)[j] if fi.team % 2 == 0 else (1, 2)[j]
        c, r = SPAWN_CELLS[k % 4]
        return cx(c), cy(r)

    def place_all(self):
        for fi in self.fighters:
            x, y = self.spawn_point(fi)
            fi.a.f, fi.a.x, fi.a.y, fi.a.h = self.f, x, y, 0.0
            fi.z = 0.0
            fi.st, fi.t = "idle", 0.0
        if self.train is not None:
            me = self.trainee()
            for fi in self.fighters:
                if fi is not me and me is not None:
                    # the partner waits a few cells away, the boxes between cleared a little
                    c, r = 4, 0
                    for cc in range(1, 5):
                        if self.grid[cc][0] == "soft" and cc not in (3,):
                            pass
                    self.grid[5][0] = None
                    self.grid[4][0] = None
                    self.grid[3][0] = "soft"
                    self.hidden_items[(3, 0)] = "fire"
                    fi.a.x, fi.a.y = cx(5), cy(0)
            self.rebuild_obst()

    # ---- the frame ---------------------------------------------------------------------------------------------
    def step_game(self, dt):
        self.control(dt)
        for fi in self.fighters:
            buf = fi.buf
            for k in [k for k, until in buf.items() if until <= self.clock]:
                del buf[k]
            fi.inp["pressed"] |= set(buf)
            before = fi.st
            self.step_fighter(fi, dt)
            if before in ("idle", "walk", "place", "kick", "skill") and getattr(fi, "hop", None) is None \
                    and fi.trapped <= 0:
                buf.clear()                      # the keys were handled (no second bomb from one press while walking)
            else:
                for k in fi.inp["pressed"]:
                    buf.setdefault(k, self.clock + 0.2)
            fi.inp["pressed"] = set()
        self.step_bombs(dt)
        self.step_touch()
        if self.train is not None:
            self.step_train(dt)
        self.step_fx(dt)
        self.rebuild_obst()
        for fi in self.fighters:
            self.pose(fi)
        self.check_end()

    def speed_of(self, fi):
        return (150.0 + 28 * fi.spd) * (1.05 if fi.char == "calico" else 1.0) * PL.speed(self, fi)

    def step_fighter(self, fi, dt):
        a = fi.a
        fi.t += dt
        fi.inv = max(0.0, fi.inv - dt)
        fi.hop_cd = max(0.0, fi.hop_cd - dt)
        for k in fi.cds:
            fi.cds[k] = max(0.0, fi.cds[k] - dt)
        inp = fi.inp
        pressed = inp["pressed"]
        if fi.st == "ko":
            if fi.t >= 2.5:
                self.respawn(fi)
            return
        if fi.st == "out":
            return
        if fi.trapped > 0:
            fi.trapped -= dt
            # wriggle slowly
            self.walk(fi, inp["dx"], inp["dy"], dt, 0.18)
            if "throw" in pressed and fi.needles > 0:
                fi.needles -= 1
                self.free(fi, "用针扎破了！")
                self.note(fi, "needle")
            elif fi.trapped <= 0:
                self.pop(fi, None)
            return
        if fi.hop is not None:
            h = fi.hop
            h["t"] += dt
            u = min(1.0, h["t"] / h["dur"])
            a.x = h["x0"] + (h["x1"] - h["x0"]) * u
            a.y = h["y0"] + (h["y1"] - h["y0"]) * u
            fi.z = math.sin(u * math.pi) * 46
            a.h = fi.z
            if u >= 1.0:
                fi.hop = None
                fi.z = 0.0
                a.h = 0.0
                fi.st = "idle"
            return
        if fi.st in ("place", "kick", "skill") and fi.t >= fi.dur:
            fi.st = "idle"
        dx, dy = inp["dx"], inp["dy"]
        if "atk" in pressed:
            self.place_bomb(fi)
        if "skill" in pressed:
            if fi.cds["k"] <= 0:
                self.use_skill(fi)
            else:
                self.tell(fi, "技能冷却中")
        if "guard" in pressed:
            self.kick(fi)
        if "jump" in pressed:
            self.hop(fi)
        if "throw" in pressed:
            self.tell(fi, "没被困住时不用针") if fi.needles else None
        if fi.hop is None:
            self.walk(fi, dx, dy, dt, 1.0)

    def walk(self, fi, dx, dy, dt, k):
        """Grid-friendly walking: line up with the row / column, slide round corners."""
        a = fi.a
        if abs(dx) < 0.3 and abs(dy) < 0.3:
            if fi.st == "walk":
                fi.st = "idle"
            return
        if abs(dx) >= abs(dy):
            mvx, mvy = (1 if dx > 0 else -1), 0
        else:
            mvx, mvy = 0, (1 if dy > 0 else -1)
        fi.fdir = (mvx, mvy)
        if fi.st == "idle":
            fi.st = "walk"
        a.facing = mvx if mvx else a.facing
        dist = self.speed_of(fi) * k * dt
        c, r = col_of(a.x), row_of(a.y)
        if mvx:
            # line up with the row first (corner help)
            ty = cy(r)
            if abs(a.y - ty) > 1:
                step = min(dist, abs(ty - a.y))
                a.y += step if ty > a.y else -step
                dist -= step * 0.5
            nx = a.x + mvx * dist
            lead_c = col_of(nx + mvx * CW * 0.36)
            if lead_c != c and self.is_solid(lead_c, r, fi):
                # blocked: maybe slip round the corner if mostly past it
                nx = min(nx, cx(c)) if mvx > 0 else max(nx, cx(c))
                self.corner(fi, c, r, mvx, 0, dt)
            a.x = nx
        else:
            tx = cx(c)
            if abs(a.x - tx) > 1:
                step = min(dist, abs(tx - a.x))
                a.x += step if tx > a.x else -step
                dist -= step * 0.5
            ny = a.y + mvy * dist
            lead_r = row_of(ny + mvy * CH * 0.36)
            if lead_r != r and self.is_solid(c, lead_r, fi):
                ny = min(ny, cy(r)) if mvy > 0 else max(ny, cy(r))
            a.y = ny
        a.x = min(max(a.x, X0 + 16), X0 + COLS * CW - 16)
        a.y = min(max(a.y, Y0 + 10), Y0 + ROWS * CH - 10)
        # left the bomb you were standing on: it is solid for you now
        nc, nr = col_of(a.x), row_of(a.y)
        for bm in self.bombs:
            if fi.uid in bm["pass"] and (bm["c"], bm["r"]) != (nc, nr):
                if abs(a.x - bm["x"]) > CW * 0.6 or abs(a.y - bm["y"]) > CH * 0.6:
                    bm["pass"].discard(fi.uid)
        a.moved += dist

    def corner(self, fi, c, r, mvx, mvy, dt):
        pass

    # ---- bombs -------------------------------------------------------------------------------------------------
    def own_bombs(self, fi):
        return [b for b in self.bombs if b["owner"] == fi.uid and not b.get("extra")]

    def new_bomb(self, fi, c, r, fire=None, fuse=FUSE, extra=False, mini=False, safe=False):
        if not (0 <= c < COLS and 0 <= r < ROWS) or self.grid[c][r] or self.bomb_at(c, r) is not None:
            return None
        bm = {"id": self.next_bomb_id, "c": c, "r": r, "x": cx(c), "y": cy(r), "fuse": fuse,
              "fire": fire if fire is not None else fi.fire, "owner": fi.uid, "team": fi.team, "pass": set(),
              "extra": extra, "mini": mini, "char": fi.char, "safe": fi.uid if safe else None}
        self.next_bomb_id += 1
        for o in self.fighters:
            if col_of(o.a.x) == c and row_of(o.a.y) == r:
                bm["pass"].add(o.uid)
        self.bombs.append(bm)
        return bm

    def place_bomb(self, fi):
        if len(self.own_bombs(fi)) >= fi.nb:
            self.tell(fi, "炸弹用完了，等它炸")
            return False
        c, r = self.cell(fi)
        bm = self.new_bomb(fi, c, r)
        if bm is None:
            return False
        fi.st, fi.t, fi.dur = "place", 0.0, 0.2
        self.note(fi, "bomb")
        return True

    def kick(self, fi):
        c, r = self.cell(fi)
        dc, dr = fi.fdir
        bm = self.bomb_at(c + dc, r + dr)
        if bm is None:
            bm = next((b for b in self.bombs if b["c"] == c and b["r"] == r and not b.get("moving")
                       and fi.uid in b["pass"] and (dc or dr)), None)
        if bm is None:
            self.tell(fi, "面前没有炸弹")
            return False
        bm["moving"] = (dc, dr)
        bm["pass"] = set()
        fi.st, fi.t, fi.dur = "kick", 0.0, 0.25
        self.add_fx("text", fi, text="踢！", small=True)
        self.note(fi, "kick")
        return True

    def hop(self, fi):
        if fi.hop_cd > 0:
            return False
        c, r = self.cell(fi)
        dc, dr = fi.fdir
        if self.bomb_at(c + dc, r + dr) is not None and not self.is_solid(c + 2 * dc, r + 2 * dr, fi):
            tc, tr = c + 2 * dc, r + 2 * dr
            self.note(fi, "hop")
        elif self.bomb_at(c + dc, r + dr) is not None:
            self.tell(fi, "炸弹后面没地方落脚")
            return False
        elif not self.is_solid(c + dc, r + dr, fi):
            tc, tr = c + dc, r + dr
        else:
            tc, tr = c, r
        fi.hop = {"x0": fi.a.x, "y0": fi.a.y, "x1": cx(tc), "y1": cy(tr), "t": 0.0, "dur": 0.38}
        fi.hop_cd = 2.2
        fi.st = "hop"
        return True

    def step_bombs(self, dt):
        for bm in list(self.bombs):
            if bm.get("frozen", 0) > 0:
                bm["frozen"] -= dt
            else:
                bm["fuse"] -= dt
            mv = bm.get("moving")
            if mv:
                dc, dr = mv
                bm["x"] += dc * 420 * dt
                bm["y"] += dr * 420 * dt * (CH / CW)
                c, r = col_of(bm["x"]), row_of(bm["y"])
                nc, nr = c + dc, r + dr
                ahead_x, ahead_y = cx(c) + dc * CW * 0.05, cy(r) + dr * CH * 0.05
                past = (dc and (bm["x"] - ahead_x) * dc >= 0) or (dr and (bm["y"] - ahead_y) * dr >= 0)
                blocked = self.is_solid(nc, nr) or any(col_of(o.a.x) == nc and row_of(o.a.y) == nr and o.alive()
                                                    for o in self.fighters)
                if past and blocked:
                    bm["c"], bm["r"] = c, r
                    bm["x"], bm["y"] = cx(c), cy(r)
                    bm["moving"] = None
                else:
                    bm["c"], bm["r"] = c, r
            if bm["fuse"] <= 0 and not bm.get("dummy"):
                self.explode(bm)
        for fl in self.flames:
            fl["t"] -= dt
        self.flames = [fl for fl in self.flames if fl["t"] > 0]
        for it in self.cell_items:
            it["safe"] = max(0.0, it.get("safe", 0) - dt)
        # anyone standing in flames is caught
        for fi in self.fighters:
            if not fi.alive() or fi.trapped > 0 or fi.inv > 0 or fi.hop is not None and fi.z > 20:
                continue
            c, r = self.cell(fi)
            fl = next((f for f in self.flames if f["c"] == c and f["r"] == r and f.get("safe") != fi.uid), None)
            if fl is not None:
                self.trap(fi, fl.get("owner"))

    def explode(self, bm):
        if bm not in self.bombs:
            return
        self.bombs.remove(bm)
        cells = [(bm["c"], bm["r"])]
        broke = []
        chain = []
        for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            for k in range(1, bm["fire"] + 1):
                c, r = bm["c"] + dc * k, bm["r"] + dr * k
                if not (0 <= c < COLS and 0 <= r < ROWS):
                    break
                g = self.grid[c][r]
                if g == "hard":
                    break
                cells.append((c, r))
                if g == "soft":
                    broke.append((c, r))
                    break
                other = self.bomb_at(c, r)
                if other is not None:
                    chain.append(other)
                    break
        for c, r in cells:
            self.flames.append({"c": c, "r": r, "t": FLAME_T, "owner": bm["owner"], "team": bm["team"],
                                "dir": 0 if (c, r) == (bm["c"], bm["r"]) else (1 if r == bm["r"] else 2),
                                "char": bm.get("char"), "safe": bm.get("safe")})
            # items lying in the blast burn up (except ones this blast just uncovered)
            self.cell_items = [it for it in self.cell_items if not (it["c"] == c and it["r"] == r and it["safe"] <= 0)]
        owner = next((f for f in self.fighters if f.uid == bm["owner"]), None)
        for c, r in broke:
            self.grid[c][r] = None
            self.add_fx("poof", None, x=cx(c), y=cy(r), z=20)
            FA.burst(self, "rock", cx(c), cy(r), 22, n=8, col="#c4935a", col2="#e8c38a", spd=200, g=700,
                     dur=0.55, size=5, side=False)
            k = self.hidden_items.pop((c, r), None)
            if k:
                self.cell_items.append({"c": c, "r": r, "k": k, "safe": FLAME_T + 0.1})
            if owner is not None:
                self.note(owner, "box")
        self.add_fx("ring", None, x=bm["x"], y=bm["y"], z=0, r=40)
        FA.burst(self, "spark", bm["x"], bm["y"], 14, n=12, col="#ffcf3a", col2="#ff7a3a", spd=260, g=300,
                 dur=0.4, size=3, side=False)
        FA.burst(self, "smoke", bm["x"], bm["y"], 18, n=6, col="#9a9088", col2="#c8bfb4", spd=60, g=-120,
                 dur=0.7, size=8, side=False)
        if random.random() < 0.6:
            self.sound("boom")
        self.w.sfx("splash", 0.6) if random.random() < 0.3 else None
        for o in chain:
            o["fuse"] = min(o["fuse"], 0.08)

    def trap(self, fi, by):
        if PL.block(self, fi):
            return
        fi.trapped = TRAP_T
        fi.trap_by = by
        fi.last_by = by
        fi.st = "trapped"
        fi.hop = None
        fi.flash = 0.12
        FA.burst(self, "glow", fi.a.x, fi.a.y, 30, n=10, col="#b8a3ea", col2="#ffffff", spd=160, g=0, dur=0.5,
                 size=5, side=False)
        self.sound("mew" if fi.a.is_cat else "oof", fi)
        self.add_fx("text", fi, text="被毛线缠住了！", small=True)
        if fi.a.is_cat:
            fi.a.say("喵？！", 1.0)
        att = next((f for f in self.fighters if f.uid == by), None)
        if att is not None and att is not fi:
            self.note(att, "trap")

    def free(self, fi, text):
        fi.trapped = 0.0
        fi.st = "idle"
        fi.inv = 1.0
        self.add_fx("poof", fi)
        self.add_fx("text", fi, text=text, small=True)

    def pop(self, fi, by):
        fi.trapped = 0.0
        if by is not None:
            fi.last_by = by
        if self.mode == "train":
            self.free(fi, "（训练中：放你出来）")
            if by is not None:
                att = next((f for f in self.fighters if f.uid == by), None)
                if att is not None:
                    self.note(att, "pop")
            return
        fi.kos += 1
        self.credit(fi)
        fi.st, fi.t = "ko", 0.0
        self.add_fx("boom", fi, z=0, r=40)
        self.add_fx("text", fi, text="啪！出局", small=False)
        # lose a little power
        for k, base in (("nb", 1), ("fire", 2), ("spd", 0)):
            setattr(fi, k, max(base, getattr(fi, k) - 1))

    def respawn(self, fi):
        if self.mode == "ffa" and fi.kos >= self.kos_to_win:
            fi.st = "out"                  # out of this round: watches from the side
            fi.a.hidden = True
            return
        x, y = self.spawn_point(fi)
        c, r = col_of(x), row_of(y)
        fi.a.x, fi.a.y = x, y
        fi.st, fi.t = "idle", 0.0
        fi.inv = 2.0
        if fi.char == "mom":
            fi.needles = max(fi.needles, 1)
        self.grid[c][r] = None
        for b in list(self.bombs):
            if (b["c"], b["r"]) == (c, r):
                self.bombs.remove(b)

    def step_touch(self):
        # touching a trapped player: a friend frees them, an opponent pops them
        for fi in self.fighters:
            if fi.trapped <= 0:
                continue
            for o in self.fighters:
                if o is fi or not o.alive() or o.trapped > 0 or o.st == "ko":
                    continue
                if math.hypot(o.a.x - fi.a.x, (o.a.y - fi.a.y) * 1.4) < 34:
                    friend = self.mode != "ffa" and o.team == fi.team
                    if friend:
                        self.free(fi, "%s 救了我！" % o.a.name)
                        self.note(o, "rescue")
                    else:
                        self.pop(fi, o.uid)
                        if self.mode == "train":
                            pass
                    break
        # picking up items
        for fi in self.fighters:
            if not fi.alive() or fi.trapped > 0 or fi.st == "ko":
                continue
            c, r = self.cell(fi)
            for it in list(self.cell_items):
                if it["c"] == c and it["r"] == r:
                    k = it["k"]
                    attr = {"bomb": "nb", "fire": "fire", "speed": "spd", "needle": "needles"}[k]
                    setattr(fi, attr, min(MAX[k], getattr(fi, attr) + 1))
                    self.cell_items.remove(it)
                    self.add_fx("text", fi, text=ITEM_NAMES[k], small=True)
                    self.note(fi, "item")

    def alive_ok(self, fi):
        return fi.st not in ("ko", "out")

    # ---- skills ------------------------------------------------------------------------------------------------
    def use_skill(self, fi):
        sk = HG.SKILLS["bomb"][fi.char][0]
        name = sk["key"]
        c, r = self.cell(fi)
        dc, dr = fi.fdir
        ok = False
        dirs = [(dc, dr)] + [d for d in ((1, 0), (-1, 0), (0, 1), (0, -1)) if d != (dc, dr)]
        if name == "lob":
            for ddc, ddr in dirs:
                for k in (3, 2, 4):
                    tc, tr = c + ddc * k, r + ddr * k
                    if 0 <= tc < COLS and 0 <= tr < ROWS and not self.grid[tc][tr] and self.bomb_at(tc, tr) is None:
                        bm = self.new_bomb(fi, tc, tr, extra=True)
                        if bm:
                            self.add_fx("lob", fi, x0=fi.a.x, y0=fi.a.y, x1=cx(tc), y1=cy(tr), z=0)
                            ok = True
                            break
                if ok:
                    break
        elif name == "stomp":
            mine = [b for b in self.bombs if b["owner"] == fi.uid]
            for b in mine:
                b["fuse"] = 0.05
            ok = bool(mine)
        elif name == "line":
            n = 0
            for ddc, ddr in dirs[:1]:            # only the way you face (no surprise row behind your back)
                for k in range(1, 4):
                    tc, tr = c + ddc * k, r + ddr * k
                    if self.is_solid(tc, tr) or not (0 <= tc < COLS and 0 <= tr < ROWS):
                        break
                    if self.new_bomb(fi, tc, tr, extra=True, fuse=FUSE + 0.2 * k, safe=True):
                        n += 1
                if n:
                    break
            ok = n > 0
        elif name == "freeze":
            for b in self.bombs:
                if abs(b["c"] - c) <= 2 and abs(b["r"] - r) <= 2:
                    b["frozen"] = 3.0
                    ok = True
            self.add_fx("ring", fi, z=0, r=110)
            ok = True
        elif name == "minis":
            for ddc, ddr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if self.new_bomb(fi, c + ddc, r + ddr, fire=1, fuse=1.8, extra=True, mini=True, safe=True):
                    ok = True
        if ok:
            fi.cds["k"] = sk["cd"]
            fi.st, fi.t, fi.dur = "skill", 0.0, 0.3
            self.add_fx("skillname", fi, text=sk["icon"] + " " + sk["name"], color=HG.CHARS[fi.char]["color"])
            self.note(fi, "skill")
        else:
            self.tell(fi, "这里放不了")

    # ---- end ---------------------------------------------------------------------------------------------------
    def check_ko(self, o, att):
        pass

    def pose(self, fi):
        a = fi.a
        a.h = fi.z
        st = fi.st
        if self.phase in ("travel", "count"):
            if a.is_cat:
                a.set_pose("crouch" if self.phase == "count" else "stand")
            else:
                a.pose, a.view, a.prop, a.seat = "stand", "front", None, 0.0
            return
        moving = st == "walk"
        dx, dy = fi.fdir
        if a.is_cat:
            p = {"walk": "run", "place": "crouch", "kick": "kick", "skill": "swat", "trapped": "belly", "ko": "belly",
                 "hop": "jump"}.get(st, "stand")
            a.set_pose(p)
            a.running = moving
        else:
            view = "side" if dx else ("back" if dy > 0 else "front")
            p = {"walk": "walk", "place": "crouch", "kick": "reach", "skill": "reach", "trapped": "crouch",
                 "ko": "floor", "hop": "stretch"}.get(st, "stand")
            a.pose, a.view, a.prop, a.seat = p, view if st in ("walk", "kick", "hop") else ("front" if st != "ko"
                                                                                           else "front"), None, 0.0

    def celebrate(self, fi, dt):
        fi.trapped = 0.0
        super().celebrate(fi, dt)

    # ---- network -----------------------------------------------------------------------------------------------
    def net_extra(self):
        return {"obst": self.obst, "flames": [{"c": f["c"], "r": f["r"], "t": round(f["t"], 2), "dir": f["dir"],
                                               "char": f.get("char")} for f in self.flames],
                "cell_items": [{"c": i["c"], "r": i["r"], "k": i["k"]} for i in self.cell_items]}

    def fighter_extra(self, fi):
        return {"nb": fi.nb, "fire": fi.fire, "spd": fi.spd, "needles": fi.needles, "trapped": round(fi.trapped, 2),
                "cds": {"k": round(fi.cds["k"], 1)}, "fdir": list(fi.fdir)}

    # ---- tutorial ----------------------------------------------------------------------------------------------
    def train_text(self, i):
        key, text, keys = self.TRAIN_STEPS[i][:3]
        me = self.trainee()
        sk = HG.SKILLS["bomb"][me.char if me is not None else "calico"][0]
        return text.format(k=sk["name"], desc=sk["desc"]), keys

    def train_prepare(self, key, me):
        if me is None:
            return
        mate = next((f for f in self.fighters if f is not me), None)
        if key == "pop" and mate is not None and mate.trapped <= 0:
            self.trap(mate, None)
        if key in ("pop",) and mate is not None:
            mate.trapped = max(mate.trapped, 9.0)
        if key == "box":
            me.nb = max(me.nb, 1)
        # a practice bomb that won't go off, right in front of you
        self.bombs = [bm for bm in self.bombs if not bm.get("dummy")]
        if key in ("kick", "hop"):
            c, r = self.cell(me)
            for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if not self.is_solid(c + dc, r + dr) and not self.is_solid(c + 2 * dc, r + 2 * dr) and \
                        not any(self.cell(o) == (c + dc, r + dr) for o in self.fighters):
                    bm = self.new_bomb(me, c + dc, r + dr, fuse=99.0, extra=True)
                    if bm is not None:
                        bm["dummy"] = True
                        bm["frozen"] = 999.0
                        me.fdir = (dc, dr)
                        me.a.x, me.a.y = cx(c), cy(r)
                    break

    def step_train(self, dt):
        super().step_train(dt)
        tr = self.train
        if tr is None or tr["i"] >= len(self.TRAIN_STEPS):
            return
        key = self.TRAIN_STEPS[tr["i"]][0]
        me = self.trainee()
        mate = next((f for f in self.fighters if f is not me), None)
        if key == "pop" and mate is not None and tr.get("done_t") is None and mate.trapped <= 0 and mate.st != "ko":
            self.trap(mate, None)
            mate.trapped = 9.0
        if key == "item" and tr.get("done_t") is None and not self.cell_items and me is not None:
            # make sure there is something to pick up
            c, r = self.cell(me)
            for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0)):
                if 0 <= c + dc < COLS and 0 <= r + dr < ROWS and not self.grid[c + dc][r + dr]:
                    self.cell_items.append({"c": c + dc, "r": r + dr, "k": "fire", "safe": 0.0})
                    break

    def make_ai(self, fi):
        return BombTrainAI(self, fi) if self.train is not None else BombAI(self, fi, fi.ctrl[3:])


BombBattle.TRAIN_STEPS = [
    ("box", "走到纸箱旁边按 J 放炸弹，然后马上走开躲到拐角！炸开箱子就过关", "J", "box", "炸箱子"),
    ("item", "箱子里掉了道具：走过去捡起来", "WASD", "item", "捡道具"),
    ("kick", "面前放了一颗练习炸弹（不会炸）：面朝它按 L，把它踢出去", "L", "kick", "踢炸弹"),
    ("hop", "面前又有一颗练习炸弹：面朝它按空格，从它上面跳过去", "空格", "hop", "跳炸弹"),
    ("skill", "按 K：技能「{k}」——{desc}", "K", "skill", "技能"),
    ("trap", "把炸弹放在陪练旁边，用爆炸把它困住", "J", "trap", "困住对手"),
    ("pop", "陪练被毛线困住了：快走过去碰它一下，它就出局了", "WASD", "pop", "戳破"),
]


# ======================================================================================================== AI
class BombAI:
    LEVELS = {"easy": dict(react=0.5, careful=0.75, aggro=0.4, skill=0.2),
              "normal": dict(react=0.25, careful=0.95, aggro=0.65, skill=0.5),
              "hard": dict(react=0.1, careful=1.0, aggro=0.9, skill=0.8)}

    def __init__(self, b, fi, level):
        self.b = b
        self.fi = fi
        self.lv = self.LEVELS.get(level, self.LEVELS["normal"])
        self.next = random.uniform(0.2, 0.5)
        self.path = []
        self.goal = None

    # danger: cells a bomb will burn, and how soon
    def danger(self, extra=None):
        b = self.b
        d = {}
        bombs = list(b.bombs) + (list(extra) if isinstance(extra, list) else ([extra] if extra else []))
        for bm in bombs:
            if bm.get("safe") is not None and bm.get("safe") == self.fi.uid:
                continue                          # my own 一排炸弹 can't catch me
            tfuse = bm["fuse"] + (3 if bm.get("frozen", 0) > 0 else 0)
            for c, r in self.blast(bm):
                d[(c, r)] = min(d.get((c, r), 99), tfuse)
        for fl in b.flames:
            if fl.get("safe") is not None and fl.get("safe") == self.fi.uid:
                continue
            d[(fl["c"], fl["r"])] = 0.0
        return d

    def blast(self, bm):
        b = self.b
        out = [(bm["c"], bm["r"])]
        for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            for k in range(1, bm["fire"] + 1):
                c, r = bm["c"] + dc * k, bm["r"] + dr * k
                if not (0 <= c < COLS and 0 <= r < ROWS) or b.grid[c][r] == "hard":
                    break
                out.append((c, r))
                if b.grid[c][r] == "soft":
                    break
        return out

    def bfs(self, start, goal_fn, danger, max_n=200, allow_bomb_start=True):
        b = self.b
        q = deque([(start, [])])
        seen = {start}
        sp = b.speed_of(self.fi)
        while q and len(seen) < max_n:
            (c, r), path = q.popleft()
            if goal_fn(c, r) and (c, r) != start or (goal_fn(c, r) and not path and (c, r) == start):
                return path
            for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nc, nr = c + dc, r + dr
                if (nc, nr) in seen or not (0 <= nc < COLS and 0 <= nr < ROWS):
                    continue
                if b.grid[nc][nr] or b.bomb_at(nc, nr) is not None:
                    continue
                t_arrive = (len(path) + 1) * CW / sp
                dt_ = danger.get((nc, nr))
                if dt_ is not None and dt_ - 0.25 < t_arrive < dt_ + FLAME_T + 0.1:
                    continue
                seen.add((nc, nr))
                q.append(((nc, nr), path + [(nc, nr)]))
        return None

    def step(self, dt):
        fi, b = self.fi, self.b
        inp = fi.inp
        inp["dx"] = inp["dy"] = 0.0
        if not fi.alive() or fi.st == "ko":
            return
        here = b.cell(fi)
        if fi.trapped > 0:
            if fi.needles > 0 and fi.trapped < 3.5:
                inp["pressed"].add("throw")
            # wriggle towards a team-mate
            mates = [o for o in b.fighters if o is not fi and o.team == fi.team and o.alive() and b.mode != "ffa"]
            if mates:
                self.steer(b.cell(mates[0]))
            return
        danger = self.danger()
        self.next -= dt
        in_danger = here in danger
        if in_danger:
            if self.goal is None or self.goal in danger or self.next <= 0:
                path = self.bfs(here, lambda c, r: (c, r) not in danger, danger)
                self.path = path or []
                self.goal = self.path[-1] if self.path else None
                self.next = self.lv["react"]
                if not self.path and fi.cds["k"] <= 0 and HG.SKILLS["bomb"][fi.char][0]["key"] == "freeze":
                    inp["pressed"].add("skill")         # (stomp would set off its own bombs right on top of it)
            self.follow()
            return
        if self.next > 0 and self.path:
            self.follow()
            return
        self.next = self.lv["react"] * random.uniform(0.7, 1.3)
        es = [o for o in b.enemies(fi) if o.alive() and o.st != "ko"]
        # pop a trapped opponent / free a trapped friend
        targets = [b.cell(o) for o in b.fighters if o.trapped > 0 and o is not fi and
                   (o in es or (b.mode != "ffa" and o.team == fi.team))]
        if targets:
            path = self.bfs(here, lambda c, r: (c, r) in targets, danger)
            if path is not None:
                self.path, self.goal = path, (path[-1] if path else here)
                self.follow()
                return
        # a bomb here would catch an opponent / break a box, and I can still get away
        can_place = len(b.own_bombs(fi)) < fi.nb and b.bomb_at(*here) is None
        if can_place:
            fake = {"c": here[0], "r": here[1], "fire": fi.fire, "fuse": FUSE}
            reach = set(self.blast(fake))
            hits_enemy = any(b.cell(o) in reach for o in es)
            hits_box = any(b.grid[c][r] == "soft" for c, r in reach)
            if (hits_enemy and random.random() < self.lv["aggro"] + 0.1) or (hits_box and random.random() < 0.6):
                d2 = self.danger(extra=fake)
                esc = self.bfs(here, lambda c, r: (c, r) not in d2, d2)
                if esc or random.random() > self.lv["careful"]:
                    inp["pressed"].add("atk")
                    self.path = esc or []
                    self.goal = self.path[-1] if self.path else None
                    return
        # skill
        if fi.cds["k"] <= 0 and random.random() < self.lv["skill"] * 0.3 and es:
            name = HG.SKILLS["bomb"][fi.char][0]["key"]
            o = min(es, key=lambda o: abs(b.cell(o)[0] - here[0]) + abs(b.cell(o)[1] - here[1]))
            oc = b.cell(o)
            dist_ = abs(oc[0] - here[0]) + abs(oc[1] - here[1])
            if (name == "lob" and dist_ <= 4) or (name == "line" and (oc[0] == here[0] or oc[1] == here[1]) and dist_ <= 4) \
                    or (name == "minis" and dist_ <= 2) or (name == "stomp" and any(
                        b.cell(o) in set(self.blast(bm)) for bm in b.bombs if bm["owner"] == fi.uid) and not any(
                        here in set(self.blast(bm)) for bm in b.bombs if bm["owner"] == fi.uid)):
                if name in ("lob", "line"):
                    fi.fdir = (1 if oc[0] > here[0] else -1, 0) if abs(oc[0] - here[0]) >= abs(oc[1] - here[1]) else \
                        (0, 1 if oc[1] > here[1] else -1)
                d2 = danger
                if name == "line":
                    # the row of bombs in front: only if there is still a way out of all their blasts
                    fakes = []
                    for k in range(1, 4):
                        tc, tr = here[0] + fi.fdir[0] * k, here[1] + fi.fdir[1] * k
                        if not (0 <= tc < COLS and 0 <= tr < ROWS) or b.is_solid(tc, tr):
                            break
                        fakes.append({"c": tc, "r": tr, "fire": fi.fire, "fuse": FUSE + 0.2 * k, "safe": fi.uid})
                    d2 = self.danger(extra=fakes)
                    esc = self.bfs(here, lambda c, r: (c, r) not in d2, d2)
                    if fakes and esc is not None:
                        inp["pressed"].add("skill")
                        self.path = esc
                        self.goal = esc[-1] if esc else None
                        return
                elif name != "minis" or self.bfs(here, lambda c, r: (c, r) not in d2 and
                                                 abs(c - here[0]) + abs(r - here[1]) >= 2, d2):
                    inp["pressed"].add("skill")
                    return
        # where to go: an item, a box to bomb, an opponent
        items = {(it["c"], it["r"]) for it in b.cell_items}
        path = None
        if items:
            path = self.bfs(here, lambda c, r: (c, r) in items, danger, max_n=120)
        if path is None and es and random.random() < self.lv["aggro"]:
            ecells = {b.cell(o) for o in es}
            path = self.bfs(here, lambda c, r: any(abs(c - ec) + abs(r - er) <= 1 for ec, er in ecells), danger)
        if path is None:
            def near_box(c, r):
                return any(0 <= c + dc < COLS and 0 <= r + dr < ROWS and b.grid[c + dc][r + dr] == "soft"
                           for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            path = self.bfs(here, near_box, danger)
        if path is None and es:
            ecells = {b.cell(o) for o in es}
            path = self.bfs(here, lambda c, r: (c, r) in ecells, danger)
        self.path = path or []
        self.goal = self.path[-1] if self.path else None
        self.follow()

    def follow(self):
        fi, b = self.fi, self.b
        while self.path and b.cell(fi) == self.path[0] and \
                abs(fi.a.x - cx(self.path[0][0])) < 8 and abs(fi.a.y - cy(self.path[0][1])) < 6:
            self.path.pop(0)
        if self.path:
            self.steer(self.path[0])

    def steer(self, cell):
        fi = self.fi
        tx, ty = cx(cell[0]), cy(cell[1])
        dx, dy = tx - fi.a.x, ty - fi.a.y
        inp = fi.inp
        if abs(dx) > 4 and abs(dy) < 5:
            inp["dx"] = 1.0 if dx > 0 else -1.0
        elif abs(dy) > 3:
            inp["dy"] = 1.0 if dy > 0 else -1.0
        elif abs(dx) > 2:
            inp["dx"] = 1.0 if dx > 0 else -1.0


class BombTrainAI:
    """The sparring partner just stands there (and wriggles when caught)."""

    def __init__(self, b, fi):
        self.b = b
        self.fi = fi

    def step(self, dt):
        self.fi.inp["dx"] = self.fi.inp["dy"] = 0.0
