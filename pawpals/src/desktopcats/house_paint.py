"""涂地占领 (in the 颜料广场): spray paint and cover the square in your colour; whoever owns the most ground when the
time is up wins.

The ground is a grid of 30-unit cells. J (hold) sprays blobs of paint that land a short way ahead (and snap toward
an opponent nearby); getting hit fills up your 晕 meter, and a full one knocks you out for a moment (you come back at
your start). Hold L on your own colour to dive in and swim: fast, hidden-ish, and it refills your paint tank. Other
teams' colour slows you down. E throws a paint bomb, K is each character's own trick.
"""
import math
import random

from . import house_art as H
from . import house_battle as HB
from . import house_fanim as FA
from . import house_games as HG
from . import house_pals as PL
from . import house_tdgame as TD

CELL = 30.0
COLS, ROWS = 42, 16
PAINT_COL = {0: "#ff4f7b", 1: "#2fa6ff", 2: "#ffc21f", 3: "#3fd35a"}
INK_MAX = 100.0
SHOT_COST = 2.6
BOMB_COST = 35.0
G2 = HB.GRAV * 0.55


def cell_of(x, y):
    return int(x // CELL), int(y // CELL)


def lob(x0, y0, z0, x1, y1, speed):
    """Velocities to throw something from (x0, y0, z0) so it comes down at (x1, y1)."""
    d = math.hypot(x1 - x0, y1 - y0)
    t = max(0.18, d / speed)
    ux, uy = HB.norm(x1 - x0, y1 - y0)
    vz = (0.5 * G2 * t * t - z0) / t
    return ux * d / t, uy * d / t, vz


class PaintBattle(TD.TopGame):
    GAME = "paint"
    TRAIN_DONE = "训练完成！去把广场涂满吧 🎨"
    FREE_STATES = ("idle", "swim")

    def setup(self):
        self.limit = 60.0 * max(1, min(5, self.kos_to_win)) if self.mode != "train" else 1e9
        self.grid = bytearray(COLS * ROWS)
        self.mask = bytearray(COLS * ROWS)
        for c in range(COLS):
            for r in range(ROWS):
                x, y = (c + 0.5) * CELL, (r + 0.5) * CELL
                if self.floor_ok(x, y) and 22 < x < H.PW - 22 and 22 < y < H.PD_PLACE - 12 and not self.blocked(x, y, 4):
                    self.mask[r * COLS + c] = 1
        self.total = sum(self.mask)
        self.gver = 0
        self.area = {}
        self.count_t = 0.0
        self.blobs = []
        self.sprinklers = []
        self.rains = []
        for fi in self.fighters:
            fi.maxhp = 100
            fi.hp = 100.0
            fi.ink = INK_MAX
            fi.splat = 0.0
            fi.splat_t = 0.0
            fi.shot_cd = 0.0
            fi.roller = 0.0
            fi.cds = {"k": 0.0}
            fi.swim = False
            fi.painted = 0
            fi.hit_cd = {}
        self.recount()

    def spawn_point(self, fi):
        sp = self.arena["spawns"]
        if self.mode == "ffa":
            return sp[self.fighters.index(fi) % 4]
        same = [f for f in self.fighters if f.team == fi.team]
        k = same.index(fi) if fi in same else 0
        return sp[(0 if fi.team == 0 else 2) + (k % 2)]

    def place_all(self):
        super().place_all()
        if self.train is not None:
            me = self.trainee()
            for fi in self.fighters:
                if fi is not me:
                    fi.a.x, fi.a.y = 520.0, 250.0
        # a little patch of your own colour to start on
        for fi in self.fighters:
            self.paint_at(fi.a.x, fi.a.y, 70, fi.team, None)

    # ---- the grid ----------------------------------------------------------------------------------------------
    def cell(self, x, y):
        c, r = cell_of(x, y)
        if 0 <= c < COLS and 0 <= r < ROWS:
            return self.grid[r * COLS + c]
        return 0

    def paint_at(self, x, y, rad, team, who):
        n = 0
        v = team + 1
        c0, c1 = int((x - rad) // CELL), int((x + rad) // CELL)
        r0, r1 = int((y - rad) // CELL), int((y + rad) // CELL)
        for c in range(max(0, c0), min(COLS - 1, c1) + 1):
            cx = (c + 0.5) * CELL
            for r in range(max(0, r0), min(ROWS - 1, r1) + 1):
                i = r * COLS + c
                if not self.mask[i] or self.grid[i] == v:
                    continue
                cy = (r + 0.5) * CELL
                if (cx - x) ** 2 + (cy - y) ** 2 <= rad * rad:
                    self.grid[i] = v
                    n += 1
        if n:
            self.gver += 1
            if who is not None:
                who.painted += n
        return n

    def paint_cone(self, x, y, fx, fy, rad, half_deg, team, who):
        n = 0
        cosm = math.cos(math.radians(half_deg))
        for c in range(COLS):
            cx = (c + 0.5) * CELL
            if abs(cx - x) > rad + CELL:
                continue
            for r in range(ROWS):
                i = r * COLS + c
                if not self.mask[i]:
                    continue
                cy = (r + 0.5) * CELL
                dx, dy = cx - x, cy - y
                d = math.hypot(dx, dy)
                if d <= rad and (d < 20 or (dx * fx + dy * fy) / d >= cosm) and self.grid[i] != team + 1:
                    self.grid[i] = team + 1
                    n += 1
        if n:
            self.gver += 1
            if who is not None:
                who.painted += n
        return n

    def recount(self):
        cnt = {}
        for v in self.grid:
            if v:
                cnt[v - 1] = cnt.get(v - 1, 0) + 1
        self.area = {fi.team: cnt.get(fi.team, 0) for fi in self.fighters}

    # ---- the world ---------------------------------------------------------------------------------------------
    def step_world(self, dt):
        self.step_blobs(dt)
        self.step_sprinklers(dt)
        self.step_rains(dt)
        self.count_t -= dt
        if self.count_t <= 0:
            self.count_t = 0.3
            self.recount()

    def throw_blob(self, fi, tx, ty, kind="blob", speed=520.0, z0=28.0, team=None, own=None, splat=26.0, rad=36.0):
        x0, y0 = (fi.a.x, fi.a.y) if fi is not None else (tx, ty)
        if fi is not None:
            ux, uy = HB.norm(tx - x0, ty - y0)
            x0, y0 = x0 + ux * 14, y0 + uy * 14
        return self.blob_from(x0, y0, z0, tx, ty, kind, speed, team if team is not None else fi.team,
                              own if own is not None else (fi.uid if fi else None), splat, rad)

    def blob_from(self, x0, y0, z0, tx, ty, kind, speed, team, own, splat, rad):
        vx, vy, vz = lob(x0, y0, z0, tx, ty, speed)
        b = {"k": kind, "x": x0, "y": y0, "z": z0, "vx": vx, "vy": vy, "vz": vz, "team": team, "own": own,
             "splat": splat, "rad": rad, "t": 0.0}
        self.blobs.append(b)
        return b

    def step_blobs(self, dt):
        keep = []
        for b in self.blobs:
            b["t"] += dt
            b["vz"] -= G2 * dt
            b["x"] += b["vx"] * dt
            b["y"] += b["vy"] * dt
            b["z"] += b["vz"] * dt
            done = b["z"] <= 0 or not (0 < b["x"] < H.PW and 0 < b["y"] < H.PD_PLACE) or b["t"] > 3
            if not done and b["z"] < 50 and self.blocked(b["x"], b["y"], 0):
                done = True
            if not done and b["k"] == "blob":
                for o in self.fighters:
                    if o.team == b["team"] or not o.alive() or o.uid == b["own"]:
                        continue
                    if TD.dist(o.a.x, o.a.y, b["x"], b["y"]) < 20 and abs(b["z"] - o.z - 20) < 34:
                        self.splat(o, b["splat"], self.fighter(b["own"]), (b["vx"], b["vy"]), b["team"])
                        done = True
                        break
            if done:
                self.land_blob(b)
            else:
                keep.append(b)
        self.blobs = keep

    def fighter(self, uid):
        return next((f for f in self.fighters if f.uid == uid), None)

    def land_blob(self, b):
        own = self.fighter(b["own"])
        x, y = b["x"], b["y"]
        col = PAINT_COL.get(b["team"], "#ffffff")
        if b["k"] == "bomb":
            self.paint_at(x, y, 92, b["team"], own)
            for o in self.fighters:
                if o.team != b["team"] and o.alive() and TD.dist(o.a.x, o.a.y, x, y) < 88:
                    self.splat(o, 70, own, (o.a.x - x + 0.1, o.a.y - y), b["team"])
            FA.burst(self, "drop", x, y, 6, n=26, col=col, col2="#ffffff", spd=360, g=700, dur=0.7, size=5, side=False)
            self.add_fx("ringz", None, x=x, y=y, z=2, r=92, col=col, dur=0.35)
            self.sound("boom")
            self.shake = 0.3
        else:
            self.paint_at(x, y, b["rad"], b["team"], own)
            FA.burst(self, "drop", x, y, 4, n=6, col=col, col2=col, spd=160, g=600, dur=0.35, size=3, side=False)

    def step_sprinklers(self, dt):
        keep = []
        for s in self.sprinklers:
            s["t"] -= dt
            s["cd"] -= dt
            s["rot"] += dt * 6
            if s["cd"] <= 0:
                s["cd"] = 0.16
                a = random.uniform(0, math.tau)
                r = random.uniform(30, 135)
                self.blob_from(s["x"], s["y"], 30, s["x"] + math.cos(a) * r, s["y"] + math.sin(a) * r * 0.85, "blob",
                               380, s["team"], s["own"], 14, 30)
            if s["t"] > 0:
                keep.append(s)
            else:
                FA.burst(self, "smoke", s["x"], s["y"], 10, n=5, col="#c9c0b4", spd=80, g=-60, dur=0.5, size=5,
                         side=False)
        self.sprinklers = keep

    def step_rains(self, dt):
        keep = []
        for d in self.rains:
            d["t"] += dt
            if d["t"] >= 0.55:
                own = self.fighter(d["own"])
                self.paint_at(d["x"], d["y"], 44, d["team"], own)
                for o in self.fighters:
                    if o.team != d["team"] and o.alive() and TD.dist(o.a.x, o.a.y, d["x"], d["y"]) < 40:
                        self.splat(o, 40, own, (0.1, 1.0), d["team"])
                col = PAINT_COL.get(d["team"], "#fff")
                FA.burst(self, "drop", d["x"], d["y"], 4, n=10, col=col, col2="#ffffff", spd=220, g=700, dur=0.45,
                         size=4, side=False)
            else:
                keep.append(d)
        self.rains = keep

    def splat(self, o, amount, att, dirv, team):
        if not o.alive() or o.inv > 0:
            return False
        if PL.block(self, o):
            return False
        o.splat += amount
        o.splat_t = 1.2
        o.flash = 0.1
        o.splat_col = PAINT_COL.get(team, "#ffffff")
        o.last_by = att.uid if att is not None else o.last_by
        ux, uy = HB.norm(*dirv)
        o.kx, o.ky = ux * 90, uy * 90
        if o.swim:
            self.unswim(o)
        FA.burst(self, "drop", o.a.x, o.a.y, o.z + 26, n=8, col=PAINT_COL.get(team, "#fff"), col2="#ffffff", spd=200,
                 ang=math.degrees(math.atan2(uy, ux)), spread=140, g=500, dur=0.4, size=3.5, side=False)
        if att is not None:
            self.note(att, "hit_by_me")
            t = att.__dict__.setdefault("tally", {})
            t["hits"] = t.get("hits", 0) + 1
        if random.random() < 0.4:
            self.sound("hit")
        if o.splat >= 100:
            self.splatted(o, att, team)
        return True

    def splatted(self, o, att, team):
        if self.mode == "train":
            o.splat = 0.0
            self.add_fx("text", o, text="（训练中）被涂晕了！", small=True)
            if att is not None:
                self.note(att, "splat_ko")
            return
        o.splat = 100.0
        o.kos += 1
        self.start(o, "ko", 2.5)
        self.paint_at(o.a.x, o.a.y, 64, team, att)
        col = PAINT_COL.get(team, "#fff")
        FA.burst(self, "drop", o.a.x, o.a.y, 30, n=30, col=col, col2="#ffffff", spd=380, g=700, dur=0.8, size=5,
                 side=False)
        self.add_fx("text", o, text="被涂晕了！")
        self.sound("boom")
        if att is not None:
            att.score += 1
            self.note(att, "splat_ko")
        o.a.say("哇，全是颜料！" if not o.a.is_cat else "喵呜！（一身颜料）", 1.6)

    # ---- fighters ----------------------------------------------------------------------------------------------
    def unswim(self, fi):
        fi.swim = False
        fi.a.hidden = False
        if fi.st == "swim":
            self.start(fi, "idle", 0)
        FA.burst(self, "drop", fi.a.x, fi.a.y, 6, n=8, col=PAINT_COL.get(fi.team, "#fff"), spd=180, g=600, dur=0.4,
                 size=4, side=False)

    def step_fighter(self, fi, dt):
        self.tick(fi, dt)
        fi.shot_cd = max(0.0, fi.shot_cd - dt)
        fi.roller = max(0.0, fi.roller - dt)
        fi.splat_t = max(0.0, fi.splat_t - dt)
        for k in list(fi.hit_cd):
            fi.hit_cd[k] -= dt
            if fi.hit_cd[k] <= 0:
                del fi.hit_cd[k]
        if fi.splat_t <= 0 and fi.st != "ko":
            fi.splat = max(0.0, fi.splat - 22 * dt)
        inp = fi.inp
        held, pressed = inp["held"], inp["pressed"]
        mx, my, mn = self.stick(fi)
        st = fi.st
        if st == "ko":
            if fi.t >= fi.dur:
                self.respawn(fi)
            return
        here = self.cell(fi.a.x, fi.a.y)
        own = here == fi.team + 1
        enemy = here != 0 and not own
        sp = self.base_speed(fi) * (0.6 if enemy and fi.z <= 0 else (1.08 if own else 1.0))
        if not fi.swim and fi.shot_cd <= 0 and st != "swim":
            fi.ink = min(INK_MAX, fi.ink + 6 * dt)
        want = None
        if st == "swim":
            if "guard" not in held or not own or fi.z > 0:
                self.unswim(fi)
                st = "idle"
            else:
                fi.ink = min(INK_MAX, fi.ink + 42 * dt)
                if fi.ink >= INK_MAX - 0.5 and not fi.data.get("full"):
                    fi.data["full"] = True
                    self.note(fi, "refilled")
                    self.add_fx("text", fi, text="颜料满了", small=True)
                if mn > 0.1:
                    fi.fx, fi.fy = mx, my
                want = (mx * sp * 1.65, my * sp * 1.65)
                if random.random() < dt * 8 and mn > 0.1:
                    FA.burst(self, "drop", fi.a.x - mx * 12, fi.a.y - my * 12, 2, n=2, col=PAINT_COL[fi.team % 4],
                             spd=90, g=500, dur=0.3, size=3, side=False)
                if "jump" in pressed:
                    self.unswim(fi)
                    self.start(fi, "jump", 9)
                    fi.vz = 380
        if want is None and fi.roller > 0 and st in ("idle", "skill"):
            if mn > 0.1:
                k = min(1.0, dt * 5)
                fi.fx, fi.fy = HB.norm(fi.fx + (mx - fi.fx) * k, fi.fy + (my - fi.fy) * k)
            want = (fi.fx * sp * 1.15, fi.fy * sp * 1.15)
            self.paint_at(fi.a.x + fi.fx * 22, fi.a.y + fi.fy * 18, 46, fi.team, fi)
            for o in self.fighters:
                if o.team != fi.team and o.alive() and o.uid not in fi.hit_cd and \
                        TD.dist(o.a.x, o.a.y, fi.a.x + fi.fx * 24, fi.a.y + fi.fy * 18) < 34:
                    fi.hit_cd[o.uid] = 0.6
                    self.splat(o, 100, fi, (fi.fx, fi.fy), fi.team)
                    o.kx, o.ky = fi.fx * 320, fi.fy * 320
            if fi.st != "skill":
                self.start(fi, "skill", 9)
                fi.data["sk"] = "roller"
            if fi.roller <= dt + 1e-6:
                self.start(fi, "idle", 0)
        if want is None:
            want = self.common_states(fi, dt, sp, mx, my)
        if want is None:
            want = (0.0, 0.0)
            if st == "idle":
                want = (mx * sp, my * sp)
                if mn > 0.1:
                    fi.fx, fi.fy = mx, my
                if "guard" in held and own and fi.z <= 0:
                    fi.swim = True
                    fi.a.hidden = True
                    fi.data = {}
                    self.start(fi, "swim", 99)
                    fi.data["full"] = fi.ink >= INK_MAX - 0.5
                    self.note(fi, "swim")
                    FA.burst(self, "drop", fi.a.x, fi.a.y, 4, n=10, col=PAINT_COL[fi.team % 4], spd=200, g=700,
                             dur=0.4, size=4, side=False)
                elif not own and self.try_roll(fi, mx, my, mn):
                    pass
                elif self.try_jump(fi, 360):
                    pass
                elif "skill" in pressed:
                    if fi.cds["k"] <= 0:
                        self.use_skill(fi)
                    else:
                        self.tell(fi, "技能冷却中")
                elif "throw" in pressed:
                    if fi.ink >= BOMB_COST:
                        self.bomb(fi)
                    else:
                        self.tell(fi, "颜料不够了（在自己颜色上按住 L 补）")
                if fi.st == "idle" and ("atk" in held or "atk" in pressed):
                    self.spray(fi, dt)
            elif st == "skill":
                want = fi.data.get("want", (0.0, 0.0))
                if fi.data.get("sk") == "rainbow":
                    want = (fi.fx * 720, fi.fy * 720)
                    self.paint_at(fi.a.x, fi.a.y, 40, fi.team, fi)
                if fi.t >= fi.dur:
                    self.start(fi, "idle", 0)
        if fi.st == "jump" and ("atk" in held or "atk" in pressed):
            self.spray(fi, dt)
        self.physics(fi, dt, want)
        fi.a.hidden = fi.swim

    def aim(self, fi, rng=280.0):
        best = None
        for o in self.enemies(fi):
            if not o.alive():
                continue
            dx, dy = o.a.x - fi.a.x, o.a.y - fi.a.y
            d = math.hypot(dx, dy)
            if d < rng and d > 1 and (dx * fi.fx + dy * fi.fy) / d > 0.2 and (best is None or d < best[0]):
                best = (d, o)
        return best[1] if best else None

    def spray(self, fi, dt):
        if fi.shot_cd > 0:
            return
        if fi.ink < SHOT_COST:
            if not fi.data.get("dry"):
                fi.data["dry"] = True
                self.tell(fi, "没颜料了！在自己颜色上按住 L 潜下去补")
            return
        fi.data.pop("dry", None)
        fi.shot_cd = 0.11 if fi.char != "kid" else 0.095
        fi.ink -= SHOT_COST
        o = self.aim(fi)
        if o is not None:
            d = TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y)
            jit = random.uniform(-12, 12)
            tx, ty = o.a.x + o.vx * d / 900 + jit, o.a.y + o.vy * d / 900 + jit
            self.face_to(fi, o.a.x, o.a.y)
        else:
            a = math.atan2(fi.fy, fi.fx) + random.uniform(-0.12, 0.12)
            r = random.uniform(190, 240)
            tx, ty = fi.a.x + math.cos(a) * r, fi.a.y + math.sin(a) * r
        self.throw_blob(fi, tx, ty, z0=fi.z + 28)
        self.note(fi, "paint_shot")
        if random.random() < 0.25:
            self.sound("whoosh")

    def bomb(self, fi):
        fi.ink -= BOMB_COST
        o = self.aim(fi, 260)
        tx, ty = (o.a.x, o.a.y) if o is not None else (fi.a.x + fi.fx * 200, fi.a.y + fi.fy * 200)
        self.throw_blob(fi, tx, ty, kind="bomb", speed=380, z0=fi.z + 36)
        self.start(fi, "throw", 0.3)
        self.note(fi, "bomb")

    def respawn(self, fi):
        x, y = self.spawn_point(fi)
        fi.a.x, fi.a.y = x, y
        fi.z = 0.0
        fi.kx = fi.ky = fi.vz = 0.0
        fi.splat = 0.0
        fi.ink = INK_MAX
        fi.inv = 1.5
        fi.swim = False
        fi.a.hidden = False
        self.start(fi, "idle", 0)

    def common_states(self, fi, dt, sp, mx, my):
        if fi.st == "throw":
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
            return (mx * sp * 0.5, my * sp * 0.5)
        return super().common_states(fi, dt, sp, mx, my)

    # ---- skills ------------------------------------------------------------------------------------------------
    def use_skill(self, fi):
        sk = HG.SKILLS["paint"][fi.char][0]
        name = sk["key"]
        col = PAINT_COL.get(fi.team, "#fff")
        if name == "rainbow":
            self.start(fi, "skill", 0.36)
            fi.data["sk"] = "rainbow"
            fi.inv = 0.36
        elif name == "roller":
            fi.roller = 3.0
            self.start(fi, "skill", 9)
            fi.data["sk"] = "roller"
        elif name == "sprinkler":
            x, y = fi.a.x + fi.fx * 30, fi.a.y + fi.fy * 24
            if self.blocked(x, y, 10):
                x, y = fi.a.x, fi.a.y
            self.sprinklers.append({"x": x, "y": y, "t": 6.0, "cd": 0.0, "team": fi.team, "own": fi.uid, "rot": 0.0})
            self.start(fi, "skill", 0.35)
            fi.data["sk"] = "sprinkler"
        elif name == "brush":
            self.paint_cone(fi.a.x, fi.a.y, fi.fx, fi.fy, 165, 70, fi.team, fi)
            for o in self.enemies(fi):
                dx, dy = o.a.x - fi.a.x, o.a.y - fi.a.y
                d = math.hypot(dx, dy)
                if o.alive() and d < 165 and (d < 20 or (dx * fi.fx + dy * fi.fy) / d > math.cos(math.radians(70))):
                    self.splat(o, 60, fi, (dx, dy), fi.team)
            self.add_fx("swing", fi, r=150, z=fi.z + 20)
            FA.burst(self, "drop", fi.a.x + fi.fx * 80, fi.a.y + fi.fy * 60, 20, n=20, col=col, col2="#ffffff", spd=300,
                     ang=math.degrees(math.atan2(fi.fy, fi.fx)), spread=140, g=600, dur=0.6, size=5, side=False)
            self.start(fi, "skill", 0.4)
            fi.data["sk"] = "brush"
        elif name == "rain":
            o = self.aim(fi, 320)
            cx, cy = (o.a.x, o.a.y) if o is not None else (fi.a.x + fi.fx * 180, fi.a.y + fi.fy * 160)
            for k in range(8):
                a = random.uniform(0, math.tau)
                r = random.uniform(0, 110) if k else 0.0
                self.rains.append({"x": TD.clamp(cx + math.cos(a) * r, 30, H.PW - 30),
                                   "y": TD.clamp(cy + math.sin(a) * r * 0.8, 30, H.PD_PLACE - 20), "t": -k * 0.12,
                                   "team": fi.team, "own": fi.uid})
            self.start(fi, "skill", 0.45)
            fi.data["sk"] = "rain"
        fi.cds["k"] = sk["cd"]
        self.skill_banner(fi, sk)

    # ---- pals --------------------------------------------------------------------------------------------------
    def pal_act(self, fi, name, px, py, pz):
        if name == "兔兔":
            if fi.splat > 30 or fi.ink < 40:
                fi.splat = 0.0
                fi.ink = min(INK_MAX, fi.ink + 40)
                FA.burst(self, "glow", fi.a.x, fi.a.y, 40, n=10, col="#ff8fb0", col2="#ffffff", spd=90, ang=90,
                         spread=120, g=-120, dur=0.8, size=4, side=False)
                self.add_fx("text", fi, text="🐰 补满颜料", small=True)
                return True
            fi.pal_cd = 1.0
            return False
        return None

    def pal_land(self, own, o, kind, x, y, z):
        if kind == "fire":
            self.splat(o, 30, own, (o.a.x - x + 0.1, o.a.y - y), own.team if own else 0)
            self.paint_at(o.a.x, o.a.y, 40, own.team if own else 0, own)
            return True
        return False

    # ---- poses -------------------------------------------------------------------------------------------------
    def pose(self, fi):
        if fi.st == "swim":
            self.tpose(fi, "belly", rig=FA.R["slide"])
            return
        if self.base_pose(fi):
            if fi.st == "idle" and ("atk" in fi.inp["held"]) and self.phase == "fight":
                self.tpose(fi, "f_swat", rig=FA.R["jab"], prop="can", fu=(fi.a.t * 4) % 1.0)
            return
        st = fi.st
        if st == "throw":
            self.tpose(fi, "f_swat", rig=FA.R["throw"])
        elif st == "skill":
            sk = fi.data.get("sk")
            if sk == "rainbow":
                self.tpose(fi, "f_dash", rig=FA.R["dash"])
            elif sk == "roller":
                self.tpose(fi, "run", rig=FA.R["charge"])
            elif sk == "brush":
                self.tpose(fi, "f_sweep", rig=FA.R["sweep"], fu=min(1.0, fi.t / 0.4))
            else:
                self.tpose(fi, "f_swat", rig=FA.R["throw"])
        else:
            self.tpose(fi, "stand")

    # ---- the end -----------------------------------------------------------------------------------------------
    def check_end(self):
        if self.train is not None:
            return
        if self.clock >= self.limit:
            self.recount()
            win = self.winners_by(self.area)
            parts = ["%s %d%%" % (self.team_label(tm), round(100 * v / max(1, self.total)))
                     for tm, v in sorted(self.area.items(), key=lambda kv: -kv[1])]
            text = "平局！" if len(win) != 1 else "%s 赢了！" % self.team_label(win[0])
            self.finish_with(win if len(win) == 1 else [], text)
            self.result["rank"] = " · ".join(parts)

    # ---- network -----------------------------------------------------------------------------------------------
    def net_extra(self):
        return {"grid": "".join(chr(48 + v) for v in self.grid), "gver": self.gver, "total": self.total,
                "area": {str(k): v for k, v in self.area.items()},
                "blobs": [{"k": b["k"], "x": round(b["x"]), "y": round(b["y"]), "z": round(b["z"]), "team": b["team"]}
                          for b in self.blobs],
                "sprinklers": [{"x": round(s["x"]), "y": round(s["y"]), "team": s["team"], "rot": round(s["rot"], 1),
                                "t": round(s["t"], 1)} for s in self.sprinklers],
                "rains": [{"x": round(d["x"]), "y": round(d["y"]), "t": round(d["t"], 2), "team": d["team"]}
                          for d in self.rains]}

    def fighter_extra(self, fi):
        return {"cds": {"k": round(fi.cds["k"], 1)}, "ink": round(fi.ink), "splat": round(fi.splat),
                "swim": fi.swim, "hidden": fi.swim, "roller": round(fi.roller, 1),
                "splat_col": getattr(fi, "splat_col", None)}

    # ---- tutorial ----------------------------------------------------------------------------------------------
    def train_prepare(self, key, me):
        if me is None:
            return
        if key == "refill":
            me.ink = 10.0
        if key == "bomb":
            me.ink = INK_MAX

    def step_train(self, dt):
        super().step_train(dt)
        tr = self.train
        if tr is None or tr["i"] >= len(self.TRAIN_STEPS) or tr.get("done_t") is not None:
            return
        me = self.trainee()
        if me is not None and self.TRAIN_STEPS[tr["i"]][0] == "shoot" and me.painted >= 45:
            self.note(me, "painted")

    def make_ai(self, fi):
        return PaintTrainAI(self, fi) if self.train is not None else PaintAI(self, fi)


PaintBattle.TRAIN_STEPS = [
    ("shoot", "按住 J 喷颜料，把地面涂成你的颜色（涂一大片）", "按住 J", "painted", "喷颜料"),
    ("swim", "站在自己的颜色上按住 L：潜进颜料里游，又快又不容易被打到", "按住 L", "swim", "潜游"),
    ("refill", "颜料快用完了！潜在自己的颜色里游一会儿，把颜料补满", "按住 L", "refilled", "补颜料"),
    ("hit", "朝陪练喷颜料（会自动对准），把他涂晕", "按住 J", "splat_ko", "涂晕对手"),
    ("bomb", "按 E 扔颜料炸弹，一下炸开一大片", "E", "bomb", "颜料炸弹"),
    ("skill", "按 K：技能「{k}」——{desc}", "K", "skill", "技能"),
]


# ======================================================================================================== AI
class PaintAI:
    def __init__(self, b, fi):
        self.b = b
        self.fi = fi
        self.lv = TD.level_of(fi, b)
        self.steer = TD.Steer(b, fi)
        self.goal = None
        self.goal_t = 0.0
        self.mode = "paint"

    def pick_goal(self):
        b, fi = self.b, self.fi
        best = None
        for _ in range(28):
            c, r = random.randrange(COLS), random.randrange(ROWS)
            i = r * COLS + c
            if not b.mask[i] or b.grid[i] == fi.team + 1:
                continue
            x, y = (c + 0.5) * CELL, (r + 0.5) * CELL
            d = TD.dist(x, y, fi.a.x, fi.a.y)
            score = d - (90 if b.grid[i] else 0) + random.uniform(0, 120)
            if best is None or score < best[0]:
                best = (score, (x, y))
        return best[1] if best else None

    def own_spot(self):
        b, fi = self.b, self.fi
        best = None
        c0, r0 = cell_of(fi.a.x, fi.a.y)
        for dc in range(-8, 9):
            for dr in range(-6, 7):
                c, r = c0 + dc, r0 + dr
                if 0 <= c < COLS and 0 <= r < ROWS and b.grid[r * COLS + c] == fi.team + 1:
                    d = abs(dc) + abs(dr)
                    if best is None or d < best[0]:
                        best = (d, ((c + 0.5) * CELL, (r + 0.5) * CELL))
        return best[1] if best else None

    def step(self, dt):
        b, fi = self.b, self.fi
        TD.clear_inputs(fi)
        inp = fi.inp
        lv = self.lv
        if not fi.alive() or fi.st not in ("idle", "swim", "skill"):
            return
        if fi.st == "skill" and fi.roller > 0:
            o = b.aim(fi, 400)
            if o is not None:
                ux, uy = HB.norm(o.a.x - fi.a.x, o.a.y - fi.a.y)
                inp["dx"], inp["dy"] = ux, uy
            elif self.goal:
                self.steer.go(*self.goal, dt)
            return
        self.goal_t -= dt
        o = b.aim(fi, 300)
        if o is None:
            # anyone in range at all (aim() only looks ahead)
            for e in b.enemies(fi):
                if e.alive() and TD.dist(e.a.x, e.a.y, fi.a.x, fi.a.y) < 220 and not getattr(e, "swim", False):
                    o = e
                    break
        # refill
        if fi.st == "swim":
            if fi.ink >= 92 or (o is not None and TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y) < 160 and fi.ink > 40):
                return                                  # let go of L: pops out
            inp["held"] = {"guard"}
            if self.goal and random.random() < 0.5:
                self.steer.go(*self.goal, dt)
            return
        if fi.ink < 14 + 10 * (1 - lv["smart"]):
            spot = self.own_spot()
            if spot is not None:
                if b.cell(fi.a.x, fi.a.y) == fi.team + 1:
                    inp["held"] = {"guard"}
                else:
                    self.steer.go(*spot, dt, stop=6)
                return
        # skill
        name = HG.SKILLS["paint"][fi.char][0]["key"]
        if fi.cds["k"] <= 0 and random.random() < lv["skill"] * dt * 1.5:
            d = TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y) if o is not None else 999
            use = (name == "rainbow") or (name == "roller") or (name == "sprinkler" and o is None) or \
                  (name == "brush" and (d < 160 or o is None)) or (name == "rain" and d < 300)
            if use:
                if o is not None:
                    b.face_to(fi, o.a.x, o.a.y)
                inp["pressed"].add("skill")
                return
        if o is not None:
            d = TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y)
            b.face_to(fi, o.a.x, o.a.y)
            if fi.ink >= BOMB_COST + 20 and d < 220 and random.random() < lv["smart"] * dt * 1.5:
                inp["pressed"].add("throw")
                return
            inp["held"] = {"atk"}
            # strafe at a comfortable distance
            want = 170
            ux, uy = HB.norm(o.a.x - fi.a.x, o.a.y - fi.a.y)
            k = 1 if d > want else -1
            s = 1 if int(b.clock * 0.7 + hash(fi.uid) % 3) % 2 else -1
            inp["dx"], inp["dy"] = ux * k * 0.6 - uy * s * 0.6, uy * k * 0.6 + ux * s * 0.6
            return
        if self.goal is None or self.goal_t <= 0 or b.cell(*self.goal) == fi.team + 1:
            self.goal = self.pick_goal()
            self.goal_t = 3.0
        if self.goal is not None:
            self.steer.go(*self.goal, dt, stop=20)
            if fi.ink > 20:
                inp["held"] = {"atk"}


class PaintTrainAI:
    """The partner strolls about a little and never shoots back."""

    def __init__(self, b, fi):
        self.b = b
        self.fi = fi
        self.t = 0.0
        self.goal = (fi.a.x, fi.a.y)
        self.steer = TD.Steer(b, fi)

    def step(self, dt):
        fi = self.fi
        TD.clear_inputs(fi)
        fi.ink = INK_MAX
        self.t -= dt
        if self.t <= 0:
            self.t = random.uniform(2, 4)
            self.goal = (TD.clamp(fi.a.x + random.uniform(-80, 80), 300, 900), TD.clamp(fi.a.y + random.uniform(-60, 60), 120, 380))
        self.steer.go(*self.goal, dt, stop=10, slow=60)
        fi.inp["dx"] *= 0.5
        fi.inp["dy"] *= 0.5
