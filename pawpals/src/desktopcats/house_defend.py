"""合作守家 (at the 毛绒城堡): everybody is on one team, guarding the plush castle in the middle of the lawn from waves
of 灰尘精 (little dust bunnies that nibble the castle), 毛球怪 (fluff balls that charge at you), 袜子怪 (odd socks that
throw socks from a distance) and, in the last wave, the 灰尘大王. Between waves there are a few seconds to repair the
castle (E next to it). The castle's HP running out loses; clearing every wave wins.

J attacks (three-hit combo, hold to charge a shock-wave ring), K is each character's own skill, L + direction rolls,
Space jumps. Attacks snap to the nearest monster.
"""
import math
import random

from . import house_art as H
from . import house_battle as HB
from . import house_fanim as FA
from . import house_games as HG
from . import house_pals as PL
from . import house_tdgame as TD

CASTLE = dict(x=630.0, y=300.0, w=150.0, d=70.0)
CASTLE_HP = 120.0
MOBS = {
    "dust": dict(name="灰尘精", hp=16, sp=88, r=14, bite=0.8, pdmg=4, cd=1.0),
    "fur": dict(name="毛球怪", hp=40, sp=62, r=21, bite=1.5, pdmg=7, cd=1.2),
    "sock": dict(name="袜子怪", hp=28, sp=72, r=16, bite=1.0, pdmg=5, cd=2.2),
    "boss": dict(name="灰尘大王", hp=360, sp=42, r=44, bite=3.0, pdmg=12, cd=1.6),
}
DIFF_K = {"easy": 0.7, "normal": 0.95, "hard": 1.2}
BITE_K = {"easy": 0.6, "normal": 0.85, "hard": 1.1}
LIGHT = [(0.07, 0.09, 0.16, 9, 90), (0.07, 0.09, 0.18, 10, 110), (0.09, 0.11, 0.30, 16, 300)]
SPAWN_PTS = [("w", 30, None), ("e", 1230, None), ("n", None, 470)]


def castle_rect(pad=0.0):
    c = CASTLE
    return (c["x"] - c["w"] / 2 - pad, c["y"] - c["d"] / 2 - pad, c["x"] + c["w"] / 2 + pad, c["y"] + c["d"] / 2 + pad)


def to_castle(x, y):
    """Distance from a point to the castle's footprint, and the nearest point on it."""
    x0, y0, x1, y1 = castle_rect()
    nx, ny = TD.clamp(x, x0, x1), TD.clamp(y, y0, y1)
    return math.hypot(x - nx, (y - ny) * 1.2), nx, ny


class DefendBattle(TD.TopGame):
    GAME = "defend"
    TRAIN_DONE = "训练完成！可以去守城堡啦 🏰"
    MIN_FIGHTERS = 1
    FREE_STATES = ("idle",)

    def setup(self):
        for fi in self.fighters:
            fi.team = 0                            # one team, everyone
            fi.maxhp = TD.HP[fi.char]
            fi.hp = float(fi.maxhp)
            fi.cds = {"k": 0.0}
            fi.combo, fi.combo_t, fi.charge = 0, 0.0, 0.0
        self.limit = 1e9
        self.castle = {"hp": CASTLE_HP, "max": CASTLE_HP, "hit": 0.0}
        x0, y0, x1, y1 = castle_rect()
        self.solid.append((x0, y0, x1, y1))
        self.waves = max(1, min(8, self.kos_to_win)) if self.mode != "train" else 1
        self.wave = 0
        self.wphase = "break"
        self.wtimer = 5.0
        self.spawn_q = []
        self.spawn_t = 0.0
        self.mobs = []
        self.mid = 0
        self.turrets = []
        self.shots = []
        self.warns = []
        self.drops = []
        self.kills = 0
        self.left = 0
        self.n_players = len(self.fighters)
        self.hp_k = (1 + 0.15 * (self.n_players - 1)) * DIFF_K.get(self.diff, 1.0)

    def spawn_point(self, fi):
        pts = [(520, 215), (740, 215), (590, 165), (670, 165)]
        return pts[self.fighters.index(fi) % 4]

    def place_all(self):
        super().place_all()
        for fi in self.fighters:
            fi.fx, fi.fy = (0.0, -1.0)

    # ---- the world ---------------------------------------------------------------------------------------------
    def step_world(self, dt):
        self.left = len(self.spawn_q) + len(self.mobs)
        self.castle["hit"] = max(0.0, self.castle["hit"] - dt)
        if self.train is None:
            self.step_waves(dt)
        else:
            self.train_mobs(dt)
        self.step_mobs(dt)
        self.step_turrets(dt)
        self.step_shots(dt)
        self.step_warns(dt)
        self.step_drops(dt)

    def wave_list(self, w):
        n = self.n_players
        count = int(round((4 + 2.5 * w) * (0.75 + 0.25 * n) * DIFF_K.get(self.diff, 1.0)))
        kinds, weights = ["dust"], [1.0]
        if w >= 2:
            kinds.append("fur")
            weights.append(0.5)
        if w >= (2 if self.waves <= 3 else 3):
            kinds.append("sock")
            weights.append(0.45)
        out = random.choices(kinds, weights=weights, k=count)
        if w == self.waves:
            out.insert(len(out) // 3, "boss")
        return out

    def step_waves(self, dt):
        if self.wphase == "break":
            self.wtimer -= dt
            if self.wtimer <= 0:
                self.wave += 1
                self.wphase = "wave"
                self.spawn_q = self.wave_list(self.wave)
                self.spawn_t = 0.5
                last = self.wave == self.waves
                self.say_banner("最后一波！灰尘大王来了！" if last else "第 %d 波来了！" % self.wave, 2.2)
                self.sound("boom" if last else "whoosh")
                self.gong()
        elif self.wphase == "wave":
            if self.spawn_q:
                self.spawn_t -= dt
                if self.spawn_t <= 0:
                    self.spawn_t = max(0.6, 1.6 - 0.08 * self.wave) * random.uniform(0.7, 1.2) / (0.8 + 0.2 * self.n_players)
                    self.spawn_mob(self.spawn_q.pop(0))
            elif not self.mobs:
                if self.wave >= self.waves:
                    self.wphase = "done"
                else:
                    self.wphase = "break"
                    self.wtimer = 10.0
                    self.say_banner("第 %d 波打退了！休息一下，快去修城堡（E）" % self.wave, 3.0)
                    self.w.sfx("chime", 2)
                    for fi in self.fighters:
                        if fi.alive():
                            fi.hp = min(float(fi.maxhp), fi.hp + fi.maxhp * 0.25)

    def spawn_mob(self, kind, x=None, y=None):
        spec = MOBS[kind]
        if x is None:
            side = random.choice(SPAWN_PTS)
            if side[0] == "n":
                x, y = random.uniform(120, 1140), 468.0
            else:
                x, y = float(side[1]), random.uniform(70, 430)
        hp = spec["hp"] * self.hp_k
        if kind == "boss":
            hp = spec["hp"] * (0.55 + 0.45 * self.n_players) * DIFF_K.get(self.diff, 1.0)
        self.mid += 1
        m = {"id": self.mid, "k": kind, "x": x, "y": y, "hp": hp, "mx": hp, "kx": 0.0, "ky": 0.0, "face": 1,
             "t": 0.0, "st": "walk", "stt": 0.0, "cd": random.uniform(0.3, 1.0), "tgt": None, "retgt": 0.0,
             "fl": 0.0, "slow": 0.0, "stun": 0.0, "r": spec["r"], "dir": (0.0, 0.0), "summon": 6.0, "slam": 4.0}
        self.mobs.append(m)
        FA.burst(self, "smoke", x, y, 10, n=8, col="#b8b0a8", col2="#e8e2da", spd=90, g=-60, dur=0.6, size=7,
                 side=False)
        if kind == "boss":
            self.shake = 1.0
        return m

    # ---- monsters ----------------------------------------------------------------------------------------------
    def step_mobs(self, dt):
        alive = [fi for fi in self.fighters if fi.alive()]
        for m in list(self.mobs):
            spec = MOBS[m["k"]]
            m["t"] += dt
            m["fl"] = max(0.0, m["fl"] - dt)
            m["slow"] = max(0.0, m["slow"] - dt)
            m["cd"] = max(0.0, m["cd"] - dt)
            m["kx"] *= max(0.0, 1 - 6 * dt)
            m["ky"] *= max(0.0, 1 - 6 * dt)
            self.mob_move(m, m["kx"] * dt, m["ky"] * dt)
            if m["stun"] > 0:
                m["stun"] -= dt
                continue
            sp = spec["sp"] * (0.5 if m["slow"] > 0 else 1.0)
            m["retgt"] -= dt
            if m["retgt"] <= 0:
                m["retgt"] = 0.5
                m["tgt"] = self.mob_target(m, alive)
            if m["st"] == "charge":
                m["stt"] -= dt
                ux, uy = m["dir"]
                self.mob_move(m, ux * 270 * dt, uy * 270 * dt)
                for fi in alive:
                    if fi.inv <= 0 and fi.z < 30 and TD.dist(fi.a.x, fi.a.y, m["x"], m["y"]) < m["r"] + 16:
                        self.hurt_player(fi, spec["pdmg"], (ux, uy), kd=True, by=m)
                        m["stt"] = 0.0
                if m["stt"] <= 0:
                    m["st"] = "walk"
                    m["cd"] = 1.4
                continue
            if m["st"] == "slam":
                m["stt"] -= dt
                if m["stt"] <= 0:
                    m["st"] = "walk"
                continue
            tx, ty, kind = self.target_point(m)
            d = TD.dist(tx, ty, m["x"], m["y"])
            if m["k"] == "boss":
                m["summon"] -= dt
                m["slam"] -= dt
                if m["summon"] <= 0:
                    m["summon"] = 9.0
                    for k in range(2 + (1 if self.n_players > 1 else 0)):
                        a = random.uniform(0, math.tau)
                        self.spawn_mob("dust", m["x"] + math.cos(a) * 60, m["y"] + math.sin(a) * 40)
                    self.add_fx("text", None, x=m["x"], y=m["y"], z=110, text="出来吧，小灰尘们！", small=True)
                near = [fi for fi in alive if TD.dist(fi.a.x, fi.a.y, m["x"], m["y"]) < 140]
                if near and m["slam"] <= 0:
                    m["slam"] = 5.5
                    m["st"], m["stt"] = "slam", 1.3
                    self.warns.append({"x": m["x"], "y": m["y"], "r": 125.0, "t": 0.0, "dur": 1.0, "dmg": spec["pdmg"],
                                       "src": m["id"]})
                    continue
            if m["k"] == "fur" and kind == "player" and d < 210 and m["cd"] <= 0:
                m["st"], m["stt"] = "charge", 0.7
                m["dir"] = HB.norm(tx - m["x"], ty - m["y"])
                m["face"] = 1 if m["dir"][0] >= 0 else -1
                continue
            if m["k"] == "sock" and kind == "player" and d < 330:
                if d < 130:
                    ux, uy = HB.norm(m["x"] - tx, m["y"] - ty)      # too close: back off
                    self.mob_move(m, ux * sp * dt, uy * sp * dt)
                if m["cd"] <= 0:
                    m["cd"] = spec["cd"] * random.uniform(0.8, 1.2)
                    self.throw_sock(m, tx, ty)
                continue
            reach = m["r"] + (6 if kind == "castle" else 18)
            if d > reach:
                ux, uy = HB.norm(tx - m["x"], ty - m["y"])
                m["face"] = 1 if ux >= 0 else -1
                if not self.mob_move(m, ux * sp * dt, uy * sp * dt):
                    # walled in: chew through a barricade in the way
                    bar = self.barricade_near(m)
                    if bar is not None and m["cd"] <= 0:
                        m["cd"] = spec["cd"]
                        self.hurt_obstacle(bar, 1)
                        m["st"], m["stt"] = "bite", 0.3
            elif m["cd"] <= 0:
                m["cd"] = spec["cd"] * random.uniform(0.85, 1.15)
                if kind == "castle":
                    self.hurt_castle(spec["bite"], m)
                else:
                    fi = self.fighter(m["tgt"])
                    if fi is not None:
                        self.hurt_player(fi, spec["pdmg"], (fi.a.x - m["x"], fi.a.y - m["y"]), by=m)
        self.separate_mobs()

    def fighter(self, uid):
        return next((f for f in self.fighters if f.uid == uid), None)

    def mob_target(self, m, alive):
        k = m["k"]
        rng = {"dust": 80, "fur": 280, "sock": 320, "boss": 0}[k]
        best = None
        for fi in alive:
            d = TD.dist(fi.a.x, fi.a.y, m["x"], m["y"])
            if d < rng and (best is None or d < best[0]):
                best = (d, fi.uid)
        return best[1] if best else "castle"

    def target_point(self, m):
        if m["tgt"] not in (None, "castle"):
            fi = self.fighter(m["tgt"])
            if fi is not None and fi.alive():
                return fi.a.x, fi.a.y, "player"
            m["tgt"] = "castle"
        d, nx, ny = to_castle(m["x"], m["y"])
        return nx, ny, "castle"

    def mob_move(self, m, dx, dy):
        r = m["r"] * 0.6
        nx, ny = m["x"] + dx, m["y"] + dy
        nx, ny = TD.clamp(nx, 24, H.PW - 24), TD.clamp(ny, 24, H.PD_PLACE - 6)
        if not self.blocked(nx, ny, r):
            m["x"], m["y"] = nx, ny
            return True
        if not self.blocked(nx, m["y"], r):
            m["x"] = nx
            return abs(dx) > abs(dy) * 0.3
        if not self.blocked(m["x"], ny, r):
            m["y"] = ny
            return abs(dy) > abs(dx) * 0.3
        return False

    def barricade_near(self, m):
        for o in self.obst:
            if o["k"] == "barricade" and o["hp"] > 0 and abs(o["x"] - m["x"]) < o["w"] / 2 + m["r"] + 16 and \
                    abs(o["y"] - m["y"]) < o["d"] / 2 + m["r"] + 16:
                return o
        return None

    def separate_mobs(self):
        ms = self.mobs
        for i, p in enumerate(ms):
            for q in ms[i + 1:]:
                need = (p["r"] + q["r"]) * 0.8
                dx, dy = q["x"] - p["x"], q["y"] - p["y"]
                d = math.hypot(dx, dy)
                if 0.01 < d < need:
                    push = (need - d) / 2
                    self.mob_move(p, -dx / d * push, -dy / d * push)
                    self.mob_move(q, dx / d * push, dy / d * push)

    def throw_sock(self, m, tx, ty):
        ux, uy = HB.norm(tx - m["x"], ty - m["y"])
        d = TD.dist(tx, ty, m["x"], m["y"])
        t = max(0.35, d / 300.0)
        self.shots.append({"k": "sock", "x": m["x"], "y": m["y"], "z": 26.0, "vx": ux * d / t, "vy": uy * d / t,
                           "vz": 0.5 * HB.GRAV * 0.55 * t, "team": "m", "dmg": MOBS["sock"]["pdmg"], "life": t + 0.3,
                           "rot": 0.0, "tgt": None})
        m["st"], m["stt"] = "throw", 0.3

    def hurt_castle(self, n, m=None):
        c = self.castle
        if c["hp"] <= 0:
            return
        c["hp"] = max(0.0 if self.train is None else 30.0, c["hp"] - n * BITE_K.get(self.diff, 1.0))
        c["hit"] = 0.3
        x0, y0, x1, y1 = castle_rect()
        x = TD.clamp(m["x"], x0, x1) if m else CASTLE["x"]
        y = TD.clamp(m["y"], y0, y1) if m else CASTLE["y"]
        FA.burst(self, "feather", x, y, 30, n=5, col="#fff3dc", col2="#f7b8cf", spd=120, g=200, dur=0.7, size=4,
                 side=False)
        if random.random() < 0.3:
            self.sound("hit")

    def hurt_player(self, fi, dmg, dirv, kd=False, by=None):
        if not fi.alive() or fi.inv > 0 or fi.st == "roll":
            return False
        if PL.block(self, fi):
            return False
        ux, uy = HB.norm(*dirv)
        fi.hp -= dmg
        fi.kx, fi.ky = ux * (260 if kd else 120), uy * (260 if kd else 120)
        FA.on_hit(self, None, fi, dmg, heavy=kd, side=False)
        self.add_fx("hit", fi, n=int(round(dmg)), big=kd)
        self.sound("hit2" if kd else "hit")
        if random.random() < 0.3:
            self.sound("mew" if fi.a.is_cat else "oof", fi)
        if fi.hp <= 0:
            if self.train is not None:
                fi.hp = float(fi.maxhp)
                self.add_fx("text", fi, text="（训练中，血量回满）", small=True)
                return True
            fi.hp = 0.0
            fi.kos += 1
            self.start(fi, "ko", 5.0)
            fi.vz = 260
            FA.on_ko(self, fi, side=False)
            self.add_fx("text", fi, text="晕倒了！5 秒后回来")
            fi.a.say("喵呜……" if fi.a.is_cat else "哎哟……", 1.6)
            return True
        self.start(fi, "down" if kd else "hit", 0.7 if kd else 0.25)
        if kd:
            fi.vz = 200
        return True

    def hurt_mob(self, m, dmg, dirv, att=None, kb=120.0, stun=0.0):
        if m not in self.mobs:
            return False
        if att is not None and att.buff.get("power", 0) > self.clock:
            dmg *= 1.4
        ux, uy = HB.norm(*dirv)
        m["hp"] -= dmg
        k = kb * (0.35 if m["k"] == "boss" else 1.0)
        m["kx"], m["ky"] = ux * k, uy * k
        m["fl"] = 0.12
        if stun > 0:
            m["stun"] = max(m["stun"], stun * (0.4 if m["k"] == "boss" else 1.0))
        if m["st"] in ("charge", "throw") and m["k"] != "boss":
            m["st"] = "walk"
        z = 22 if m["k"] != "boss" else 50
        self.add_fx("hit", None, x=m["x"], y=m["y"], z=z, n=int(round(dmg)), big=dmg >= 12)
        col = {"dust": "#d8d0c4", "fur": "#f2c4d8", "sock": "#9fd2ee", "boss": "#a89a8a"}[m["k"]]
        FA.burst(self, "spark", m["x"], m["y"], z, n=6 + int(dmg / 2), col="#fff6c8", col2=col, spd=260,
                 ang=math.degrees(math.atan2(uy, ux)), spread=120, g=400, dur=0.3, size=3, side=False)
        if att is not None:
            self.note(att, "mob_hit")
            t = att.__dict__.setdefault("tally", {})
            t["hits"] = t.get("hits", 0) + 1
        if m["hp"] <= 0:
            self.kill_mob(m, att)
        return True

    def kill_mob(self, m, att):
        if m not in self.mobs:
            return
        self.mobs.remove(m)
        self.kills += 1
        big = m["k"] == "boss"
        FA.burst(self, "smoke", m["x"], m["y"], 20, n=14 if big else 7, col="#c9c0b4", col2="#efe9e0", spd=160,
                 g=-80, dur=0.8, size=9 if big else 6, side=False)
        FA.burst(self, "star", m["x"], m["y"], 24, n=10 if big else 4, col="#ffd34c", col2="#ffffff", spd=220, g=200,
                 dur=0.6, size=5, side=False)
        self.add_fx("text", None, x=m["x"], y=m["y"], z=40, text="噗！" if not big else "灰尘大王被打败了！")
        if big:
            self.shake = 1.0
            self.sound("boom")
        if att is not None:
            att.score += 1
            self.note(att, "kill", k=m["k"])
        r = random.random()
        if r < 0.1:
            self.drops.append({"k": "fish", "x": m["x"], "y": m["y"], "t": 0.0})
        elif r < 0.18:
            self.drops.append({"k": "yarn", "x": m["x"], "y": m["y"], "t": 0.0})

    # ---- turrets / shots / warnings / drops --------------------------------------------------------------------
    def step_turrets(self, dt):
        keep = []
        for tu in self.turrets:
            tu["t"] -= dt
            tu["cd"] -= dt
            if tu["t"] <= 0:
                FA.burst(self, "smoke", tu["x"], tu["y"], 10, n=6, col="#c9c0b4", spd=80, g=-60, dur=0.5, size=6,
                         side=False)
                continue
            if tu["cd"] <= 0:
                m = self.nearest_mob(tu["x"], tu["y"], 340)
                if m is not None:
                    tu["cd"] = 0.65
                    tu["face"] = 1 if m["x"] >= tu["x"] else -1
                    self.shots.append({"k": "plush", "x": tu["x"], "y": tu["y"], "z": 34.0, "vx": 0.0, "vy": 0.0,
                                       "vz": 0.0, "team": "p", "dmg": 8, "life": 1.4, "rot": 0.0, "tgt": m["id"],
                                       "own": tu["own"]})
            keep.append(tu)
        self.turrets = keep

    def nearest_mob(self, x, y, rng=1e9):
        best = None
        for m in self.mobs:
            d = TD.dist(m["x"], m["y"], x, y)
            if d < rng and (best is None or d < best[0]):
                best = (d, m)
        return best[1] if best else None

    def step_shots(self, dt):
        keep = []
        for s in self.shots:
            s["life"] -= dt
            s["rot"] += dt * 10
            if s.get("tgt") is not None:
                m = next((m for m in self.mobs if m["id"] == s["tgt"]), None)
                if m is None:
                    s["tgt"] = None
                else:
                    ux, uy = HB.norm(m["x"] - s["x"], m["y"] - s["y"])
                    sp = 480.0
                    s["vx"], s["vy"] = ux * sp, uy * sp
                    s["z"] += (20 - s["z"]) * min(1.0, dt * 4)
            else:
                s["vz"] -= HB.GRAV * 0.55 * dt
                s["z"] += s["vz"] * dt
            s["x"] += s["vx"] * dt
            s["y"] += s["vy"] * dt
            done = s["life"] <= 0 or s["z"] <= 0
            if s["team"] == "p":
                for m in self.mobs:
                    if TD.dist(m["x"], m["y"], s["x"], s["y"]) < m["r"] + 10:
                        own = self.fighter(s.get("own"))
                        self.hurt_mob(m, s["dmg"], (s["vx"], s["vy"]), own, kb=90)
                        if s["k"] == "snow":
                            m["slow"] = max(m["slow"], 2.5)
                        done = True
                        break
            else:
                for fi in self.fighters:
                    if fi.alive() and fi.z < 40 and TD.dist(fi.a.x, fi.a.y, s["x"], s["y"]) < 20:
                        self.hurt_player(fi, s["dmg"], (s["vx"], s["vy"]))
                        done = True
                        break
                if not done and to_castle(s["x"], s["y"])[0] < 8 and s["z"] < 60:
                    self.hurt_castle(1.5)
                    done = True
            if done:
                self.add_fx("poof", None, x=s["x"], y=s["y"], z=max(0.0, s["z"]))
                if s["k"] == "fire":
                    FA.burst(self, "spark", s["x"], s["y"], s["z"], n=10, col="#ffcf3a", col2="#ff6a3a", spd=240,
                             g=300, dur=0.35, size=3, side=False)
            else:
                keep.append(s)
        self.shots = keep

    def step_warns(self, dt):
        keep = []
        for w in self.warns:
            w["t"] += dt
            if w["t"] >= w["dur"]:
                for fi in self.fighters:
                    if fi.alive() and fi.z < 30 and TD.dist(fi.a.x, fi.a.y, w["x"], w["y"]) < w["r"]:
                        self.hurt_player(fi, w["dmg"], (fi.a.x - w["x"] + 0.1, fi.a.y - w["y"]), kd=True)
                FA.burst(self, "rock", w["x"], w["y"], 4, n=16, col="#8d8576", col2="#b9ae9a", spd=320, g=900,
                         dur=0.7, size=5, side=False)
                self.add_fx("ringz", None, x=w["x"], y=w["y"], z=2, r=w["r"], col="#ffffff", dur=0.35)
                self.shake = 0.8
                self.sound("boom")
            else:
                keep.append(w)
        self.warns = keep

    def step_drops(self, dt):
        keep = []
        for d in self.drops:
            d["t"] += dt
            took = None
            for fi in self.fighters:
                if fi.alive() and TD.dist(fi.a.x, fi.a.y, d["x"], d["y"]) < 30:
                    took = fi
                    break
            if took is not None:
                if d["k"] == "fish":
                    took.hp = min(float(took.maxhp), took.hp + 25)
                    self.add_fx("text", took, text="+25", heal=True)
                else:
                    self.castle["hp"] = min(self.castle["max"], self.castle["hp"] + 8)
                    self.add_fx("text", took, text="🧶 城堡 +8", heal=True)
                self.sound("chime")
                continue
            if d["t"] < 15:
                keep.append(d)
        self.drops = keep

    # ---- fighters ----------------------------------------------------------------------------------------------
    def step_fighter(self, fi, dt):
        self.tick(fi, dt)
        fi.combo_t = max(0.0, fi.combo_t - dt)
        inp = fi.inp
        held, pressed = inp["held"], inp["pressed"]
        mx, my, mn = self.stick(fi)
        sp = self.base_speed(fi)
        st = fi.st
        want = self.common_states(fi, dt, sp, mx, my)
        if st == "ko":
            fi.vz -= HB.GRAV * dt
            fi.z = max(0.0, fi.z + fi.vz * dt)
            if fi.t >= fi.dur:
                self.respawn(fi)
            return
        if want is None:
            want = (0.0, 0.0)
            if st == "idle":
                want = (mx * sp, my * sp)
                if mn > 0.1:
                    fi.fx, fi.fy = mx, my
                if self.try_roll(fi, mx, my, mn):
                    pass
                elif self.try_jump(fi):
                    pass
                elif "atk" in pressed:
                    self.aim_mob(fi)
                    self.start(fi, "charge", 9)
                    fi.charge = 0.0
                elif "skill" in pressed:
                    if fi.cds["k"] <= 0:
                        self.use_skill(fi)
                    else:
                        self.tell(fi, "技能冷却中")
                elif "throw" in pressed:
                    if to_castle(fi.a.x, fi.a.y)[0] < 48:
                        self.start(fi, "repair", 0.7)
                    else:
                        self.tell(fi, "走到城堡旁边才能修")
            elif st == "charge":
                want = (mx * sp * 0.4, my * sp * 0.4)
                fi.charge = min(1.0, max(0.0, (fi.t - 0.18) / 0.55))
                if "atk" not in held:
                    if fi.t < 0.18 or fi.charge < 0.5:
                        self.light(fi)
                    else:
                        self.shock(fi)
            elif st == "atk":
                step = fi.data.get("step", 0)
                su, ac, rc, dmg, kb = LIGHT[step]
                if "atk" in pressed and step < 2:
                    fi.data["queued"] = True
                if fi.t >= su and not fi.data.get("hit"):
                    fi.data["hit"] = True
                    self.swing(fi, dmg, kb, step)
                if fi.t >= su + ac + rc * (0.5 if fi.data.get("queued") else 1.0):
                    if fi.data.get("queued") and step < 2:
                        self.light(fi, step + 1)
                    else:
                        self.start(fi, "idle", 0)
                want = (fi.fx * 60, fi.fy * 60) if fi.t < su + ac else (0.0, 0.0)
            elif st == "shock":
                if fi.t >= fi.dur:
                    self.start(fi, "idle", 0)
            elif st == "repair":
                if mn > 0.1 and fi.t > 0.15:
                    self.start(fi, "idle", 0)
                elif fi.t >= fi.dur:
                    n = 6.0 if self.wphase == "break" else 3.0
                    c = self.castle
                    if c["hp"] < c["max"]:
                        c["hp"] = min(c["max"], c["hp"] + n)
                        self.add_fx("text", fi, text="🔨 +%d" % n, heal=True, small=True)
                        x0, y0, x1, y1 = castle_rect()
                        FA.burst(self, "star", TD.clamp(fi.a.x, x0, x1), TD.clamp(fi.a.y, y0, y1), 40, n=6,
                                 col="#ffd34c", col2="#ffffff", spd=140, g=100, dur=0.5, size=4, side=False)
                        self.note(fi, "repair")
                    else:
                        self.tell(fi, "城堡是满血的")
                    self.start(fi, "idle", 0)
            elif st == "skill":
                self.step_skill(fi, dt)
                want = fi.data.get("want", (0.0, 0.0))
        self.physics(fi, dt, want)

    def respawn(self, fi):
        x, y = self.spawn_point(fi)
        fi.a.x, fi.a.y = x, y
        fi.z = 0.0
        fi.kx = fi.ky = fi.vz = 0.0
        fi.hp = float(fi.maxhp)
        fi.inv = 2.0
        self.start(fi, "idle", 0)
        self.add_fx("text", fi, text="回来啦！", small=True)

    def aim_mob(self, fi, rng=220.0):
        m = self.nearest_mob(fi.a.x, fi.a.y, rng)
        if m is not None:
            self.face_to(fi, m["x"], m["y"])
        return m

    def light(self, fi, step=None):
        if step is None:
            step = fi.combo if fi.combo_t > 0 and fi.combo < 2 else 0
        self.aim_mob(fi)
        self.start(fi, "atk", 9)
        fi.data["step"] = step
        fi.combo = step + 1
        fi.combo_t = 0.6

    def swing(self, fi, dmg, kb, step):
        reach = 70 if fi.a.is_cat else 78
        n = 0
        for m in list(self.mobs):
            dx, dy = m["x"] - fi.a.x, m["y"] - fi.a.y
            d = math.hypot(dx, dy * 1.15)
            if d > reach + m["r"]:
                continue
            if d > 1 and (dx * fi.fx + dy * fi.fy) / d < math.cos(math.radians(80)):
                continue
            self.hurt_mob(m, dmg, (dx, dy), fi, kb=kb, stun=0.3 if step == 2 else 0.0)
            n += 1
        col = HG.CHARS[fi.char]["color"]
        self.add_fx("swing", fi, r=reach, z=fi.z + 22)
        self.sound("whoosh" if n == 0 else ("hit2" if step == 2 else "hit"))
        if step == 2:
            self.note(fi, "combo3")
        if n and step == 2:
            FA.burst(self, "glow", fi.a.x + fi.fx * 40, fi.a.y + fi.fy * 40, 24, n=8, col=col, col2="#ffffff", spd=160,
                     g=0, dur=0.35, size=4, side=False)

    def shock(self, fi):
        self.start(fi, "shock", 0.35)
        r = 115.0
        for m in list(self.mobs):
            d = TD.dist(m["x"], m["y"], fi.a.x, fi.a.y)
            if d < r + m["r"]:
                self.hurt_mob(m, 20, (m["x"] - fi.a.x + 0.1, m["y"] - fi.a.y), fi, kb=300, stun=0.6)
        self.add_fx("ringz", None, x=fi.a.x, y=fi.a.y, z=4, r=r, col=HG.CHARS[fi.char]["color"], dur=0.4)
        FA.burst(self, "dust", fi.a.x, fi.a.y, 2, n=14, col="#d9c9b0", col2="#bfae96", spd=260, g=0, dur=0.5, size=6,
                 side=False)
        self.shake = 0.4
        self.sound("boom")
        self.note(fi, "wave")

    # ---- skills ------------------------------------------------------------------------------------------------
    def use_skill(self, fi):
        sk = HG.SKILLS["defend"][fi.char][0]
        name = sk["key"]
        ok = True
        if name == "whirl":
            self.start(fi, "skill", 0.55)
            fi.data.update(sk="whirl", hits=0)
        elif name == "quake":
            self.start(fi, "skill", 9)
            fi.data.update(sk="quake")
            fi.vz = 420
        elif name == "barricade":
            x, y = fi.a.x + fi.fx * 64, fi.a.y + fi.fy * 54
            vertical = abs(fi.fx) > abs(fi.fy)
            w, d = (26.0, 96.0) if vertical else (100.0, 24.0)
            if 40 < x < H.PW - 40 and 30 < y < H.PD_PLACE - 20 and not self.blocked(x, y, 20) and to_castle(x, y)[0] > 20:
                self.obst.append({"k": "barricade", "x": x, "y": y, "w": w, "d": d, "hp": 8, "team": 0})
                FA.burst(self, "feather", x, y, 20, n=10, col="#ffffff", col2="#f7b8cf", spd=150, g=200, dur=0.7,
                         size=4, side=False)
                self.start(fi, "skill", 0.35)
                fi.data.update(sk="barricade")
            else:
                ok = False
        elif name == "mend":
            c = self.castle
            c["hp"] = min(c["max"], c["hp"] + 12)
            x0, y0, x1, y1 = castle_rect()
            FA.burst(self, "glow", CASTLE["x"], CASTLE["y"], 60, n=16, col="#b8e0a8", col2="#ffffff", spd=200, g=-60,
                     dur=0.8, size=5, side=False)
            self.add_fx("text", None, x=CASTLE["x"], y=CASTLE["y"], z=120, text="🧶 城堡 +12", heal=True)
            for o in self.fighters:
                if o.alive() and TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y) < 200:
                    o.hp = min(float(o.maxhp), o.hp + 20)
                    self.add_fx("text", o, text="+20", heal=True, small=True)
            self.start(fi, "skill", 0.5)
            fi.data.update(sk="mend")
        elif name == "turret":
            x, y = fi.a.x + fi.fx * 40, fi.a.y + fi.fy * 30
            if self.blocked(x, y, 14):
                x, y = fi.a.x, fi.a.y
            self.turrets.append({"x": x, "y": y, "t": 10.0, "cd": 0.3, "own": fi.uid, "face": 1 if fi.fx >= 0 else -1})
            self.start(fi, "skill", 0.4)
            fi.data.update(sk="turret")
        if ok:
            fi.cds["k"] = sk["cd"]
            self.skill_banner(fi, sk)
        else:
            self.tell(fi, "这里放不下")

    def step_skill(self, fi, dt):
        sk = fi.data.get("sk")
        if sk == "whirl":
            fi.a.facing = 1 if int(fi.t * 16) % 2 == 0 else -1
            if fi.data["hits"] == 0 and fi.t >= 0.05 or fi.data["hits"] == 1 and fi.t >= 0.3:
                fi.data["hits"] += 1
                for m in list(self.mobs):
                    if TD.dist(m["x"], m["y"], fi.a.x, fi.a.y) < 90 + m["r"]:
                        self.hurt_mob(m, 11, (m["x"] - fi.a.x + 0.1, m["y"] - fi.a.y), fi, kb=200)
                self.add_fx("spin", fi, r=90, z=fi.z + 10)
                self.sound("whoosh")
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
        elif sk == "quake":
            if fi.t > 0.1 and fi.z <= 0:
                for m in list(self.mobs):
                    if TD.dist(m["x"], m["y"], fi.a.x, fi.a.y) < 135 + m["r"]:
                        self.hurt_mob(m, 18, (m["x"] - fi.a.x + 0.1, m["y"] - fi.a.y), fi, kb=260, stun=1.5)
                FA.burst(self, "rock", fi.a.x, fi.a.y, 4, n=16, col="#8d8576", col2="#b9ae9a", spd=320, g=900,
                         dur=0.7, size=5, side=False)
                self.add_fx("ringz", None, x=fi.a.x, y=fi.a.y, z=2, r=135, col="#c9b294", dur=0.4)
                self.shake = 0.7
                self.sound("boom")
                self.start(fi, "shock", 0.3)
        elif fi.t >= fi.dur:
            self.start(fi, "idle", 0)

    # ---- pals (灵宝) -------------------------------------------------------------------------------------------
    def pal_act(self, fi, name, px, py, pz):
        if name == "兔兔":
            if fi.hp < fi.maxhp * 0.85:
                fi.hp = min(float(fi.maxhp), fi.hp + fi.maxhp * 0.12)
            elif self.castle["hp"] < self.castle["max"]:
                self.castle["hp"] = min(self.castle["max"], self.castle["hp"] + 4)
                self.add_fx("text", None, x=CASTLE["x"], y=CASTLE["y"], z=110, text="🐰 城堡 +4", heal=True,
                            small=True)
            else:
                fi.pal_cd = 1.0
                return False
            FA.burst(self, "glow", fi.a.x, fi.a.y, 50, n=10, col="#ff8fb0", col2="#ffffff", spd=90, ang=90,
                     spread=120, g=-120, dur=0.8, size=4, side=False)
            return True
        if name in ("baby dragon", "snow ball"):
            m = self.nearest_mob(fi.a.x, fi.a.y, 600)
            if m is None:
                fi.pal_cd = 0.8
                return False
            self.shots.append({"k": "fire" if name == "baby dragon" else "snow", "x": px, "y": py, "z": pz,
                               "vx": 0.0, "vy": 0.0, "vz": 0.0, "team": "p",
                               "dmg": 12 if name == "baby dragon" else 4, "life": 2.0, "rot": 0.0, "tgt": m["id"],
                               "own": fi.uid})
            self.sound("whoosh")
            return True
        return None

    # ---- poses -------------------------------------------------------------------------------------------------
    def pose(self, fi):
        if self.base_pose(fi):
            return
        st = fi.st
        t = fi.a.t
        if st == "charge":
            self.tpose(fi, "crouch", rig=FA.R["crouch"])
        elif st == "atk":
            step = fi.data.get("step", 0)
            u = min(1.0, fi.t / 0.3)
            rig = FA.R[("jab", "cross", "kick")[step]] if fi.t > 0.05 else FA.R[("jab_w", "cross_w", "kick_w")[step]]
            self.tpose(fi, ("f_swat", "f_swat", "f_leap")[step], rig=rig, prop="pillow" if step < 2 else None, fu=u)
        elif st == "shock":
            self.tpose(fi, "f_slam", rig=FA.R["up"], fu=min(1.0, fi.t / 0.3))
        elif st == "repair":
            self.tpose(fi, "crouch", rig=FA.R["place"])
        elif st == "skill":
            sk = fi.data.get("sk")
            if sk == "whirl":
                self.tpose(fi, "f_frenzy", rig=FA.R["spin"], fu=min(1.0, fi.t / 0.55))
            elif sk == "quake":
                self.tpose(fi, "jump" if fi.vz > 0 else "f_slam", rig=FA.R["rise"] if fi.vz > 0 else FA.R["air3"])
            elif sk == "mend":
                self.tpose(fi, "happy", rig=FA.R["wand"])
            else:
                self.tpose(fi, "f_swat", rig=FA.R["place"])
        else:
            self.tpose(fi, "stand")

    def celebrate(self, fi, dt):
        super().celebrate(fi, dt)

    # ---- the end -----------------------------------------------------------------------------------------------
    def check_end(self):
        if self.train is not None:
            return
        if self.castle["hp"] <= 0:
            self.finish_with([], "城堡被攻破了……再来一次吧！")
            self.result["rank"] = "守到第 %d 波 · 打倒 %d 只怪" % (self.wave, self.kills)
            for fi in self.fighters:
                fi.a.say("呜呜，城堡……" if not fi.a.is_cat else "喵……", 2.5)
        elif self.wphase == "done":
            self.finish_with([0], "守住了！毛绒城堡安然无恙 🎉")
            self.result["rank"] = "%d 波全部打退 · 打倒 %d 只怪 · 城堡还剩 %d%%" % (
                self.waves, self.kills, int(100 * self.castle["hp"] / self.castle["max"]))

    # ---- network -----------------------------------------------------------------------------------------------
    def net_extra(self):
        return {"castle": {"hp": round(self.castle["hp"], 1), "max": self.castle["max"],
                           "hit": round(self.castle["hit"], 2)},
                "wave": self.wave, "waves": self.waves, "wphase": self.wphase, "wtimer": round(self.wtimer, 1),
                "left": len(self.spawn_q) + len(self.mobs), "kills": self.kills,
                "mobs": [{"id": m["id"], "k": m["k"], "x": round(m["x"]), "y": round(m["y"]), "hp": round(m["hp"]),
                          "mx": round(m["mx"]), "face": m["face"], "st": m["st"], "fl": round(m["fl"], 2),
                          "slow": round(m["slow"], 1), "stun": round(m["stun"], 1), "r": m["r"]} for m in self.mobs],
                "turrets": [{"x": round(tu["x"]), "y": round(tu["y"]), "t": round(tu["t"], 1), "face": tu["face"]}
                            for tu in self.turrets],
                "shots": [{"k": s["k"], "x": round(s["x"]), "y": round(s["y"]), "z": round(s["z"]),
                           "rot": round(s["rot"], 1)} for s in self.shots],
                "warns": [{"x": round(w["x"]), "y": round(w["y"]), "r": w["r"], "t": round(w["t"], 2),
                           "dur": w["dur"]} for w in self.warns],
                "drops": [{"k": d["k"], "x": round(d["x"]), "y": round(d["y"])} for d in self.drops]}

    def fighter_extra(self, fi):
        return {"cds": {"k": round(fi.cds["k"], 1)}, "charge": round(fi.charge, 2)}

    # ---- tutorial ----------------------------------------------------------------------------------------------
    def train_mobs(self, dt):
        """Practice monsters: a few dust bunnies that wander in, a fluff ball for the roll lesson."""
        tr = self.train
        if self.phase != "fight" or tr is None or tr["i"] >= len(self.TRAIN_STEPS):
            return
        key = self.TRAIN_STEPS[tr["i"]][0]
        dusts = [m for m in self.mobs if m["k"] == "dust"]
        if key in ("hit", "combo", "wave", "skill") and len(dusts) < 3:
            me = self.trainee()
            x = (me.a.x if me else 630) + random.choice((-1, 1)) * random.uniform(120, 200)
            y = random.uniform(100, 200)
            self.spawn_mob("dust", TD.clamp(x, 60, 1200), y)
        if key == "roll" and not any(m["k"] == "fur" for m in self.mobs):
            me = self.trainee()
            if me is not None:
                m = self.spawn_mob("fur", TD.clamp(me.a.x + 260, 60, 1200), me.a.y)
                m["hp"] = m["mx"] = 9999
        if key != "roll":
            for m in list(self.mobs):
                if m["k"] == "fur":
                    self.mobs.remove(m)

    def train_prepare(self, key, me):
        if key == "repair":
            self.castle["hp"] = 60.0

    def step_train(self, dt):
        super().step_train(dt)
        tr = self.train
        if tr is None or tr["i"] >= len(self.TRAIN_STEPS) or tr.get("done_t") is not None:
            return
        me = self.trainee()
        if me is not None and self.TRAIN_STEPS[tr["i"]][0] == "castle" and to_castle(me.a.x, me.a.y)[0] < 60:
            self.note(me, "near_castle")

    def make_ai(self, fi):
        return DefendAI(self, fi)


DefendBattle.TRAIN_STEPS = [
    ("castle", "这是毛绒城堡，要守住它！先用 WASD 走到城堡旁边", "WASD", "near_castle", "走过去"),
    ("hit", "灰尘精来咬城堡了！按 J 打它（会自动对准最近的怪）", "J", "mob_hit", "攻击"),
    ("combo", "快速连按 J 三下：三连击，第三下最重", "J J J", "combo3", "三连击"),
    ("wave", "按住 J 蓄力，松开打出一圈冲击波，打一大片", "按住 J", "wave", "冲击波"),
    ("roll", "毛球怪会冲过来撞人！按住 L 再按方向键翻滚躲开", "L + 方向", "roll", "翻滚"),
    ("skill", "按 K：技能「{k}」——{desc}", "K", "skill", "技能"),
    ("repair", "城堡被咬坏了：站在城堡旁边按 E 修好它（两波之间修得更快）", "E", "repair", "修城堡"),
]


# ======================================================================================================== AI
class DefendAI:
    def __init__(self, b, fi):
        self.b = b
        self.fi = fi
        self.lv = TD.level_of(fi, b) if b.train is None else TD.AI_LEVELS["easy"]
        self.steer = TD.Steer(b, fi)
        self.atk_t = 0.0
        self.hold = 0.0
        self.think = 0.0
        self.target = None

    def step(self, dt):
        fi, b = self.fi, self.b
        TD.clear_inputs(fi)
        inp = fi.inp
        if self.hold > 0:
            self.hold -= dt
            if self.hold > 0 and fi.st == "charge":
                inp["held"] = {"atk"}
            return
        if not fi.alive() or fi.st not in ("idle", "atk", "charge"):
            return
        self.atk_t -= dt
        self.think -= dt
        lv = self.lv
        # dodge: a fluff ball charging at me, the king's slam
        for m in b.mobs:
            if m["st"] == "charge" and TD.dist(m["x"], m["y"], fi.a.x, fi.a.y) < 130 and random.random() < lv["smart"] * 0.5:
                ux, uy = m["dir"]
                inp["dx"], inp["dy"] = -uy, ux
                inp["pressed"].add("guard")
                inp["held"] = {"guard"}
                return
        for w in b.warns:
            if TD.dist(w["x"], w["y"], fi.a.x, fi.a.y) < w["r"] + 10 and random.random() < lv["smart"]:
                ux, uy = HB.norm(fi.a.x - w["x"] + 0.1, fi.a.y - w["y"])
                self.steer.go(fi.a.x + ux * 200, fi.a.y + uy * 200, dt)
                if random.random() < 0.3:
                    inp["pressed"].add("guard")
                    inp["held"] = {"guard"}
                return
        # between waves: mend the castle
        c = b.castle
        if b.wphase == "break" and c["hp"] < c["max"] - 2 and b.train is None:
            d, nx, ny = to_castle(fi.a.x, fi.a.y)
            if d < 40:
                inp["pressed"].add("throw")
            else:
                ux, uy = HB.norm(fi.a.x - nx + 0.01, fi.a.y - ny)
                self.steer.go(nx + ux * 26, ny + uy * 26, dt)
            return
        # skill
        name = HG.SKILLS["defend"][fi.char][0]["key"]
        if fi.cds["k"] <= 0 and random.random() < lv["skill"] * dt * 3:
            near = sum(1 for m in b.mobs if TD.dist(m["x"], m["y"], fi.a.x, fi.a.y) < 120)
            use = (name in ("whirl", "quake") and near >= 2) or \
                  (name == "mend" and (c["hp"] < c["max"] * 0.75 or fi.hp < fi.maxhp * 0.5)) or \
                  (name == "turret" and len(b.mobs) >= 3) or \
                  (name == "barricade" and near >= 1 and len([o for o in b.obst if o["hp"] > 0]) < 3)
            if use:
                inp["pressed"].add("skill")
                return
        # pick a monster: the ones at the castle first
        if self.think <= 0 or self.target not in b.mobs:
            self.think = lv["react"]
            best = None
            for m in b.mobs:
                d = TD.dist(m["x"], m["y"], fi.a.x, fi.a.y)
                dc = to_castle(m["x"], m["y"])[0]
                score = d + 0.5 * dc - (120 if m["k"] == "boss" else 0) - (160 if dc < m["r"] + 20 else 0) + \
                    (120 if m["k"] == "sock" and d > 150 else 0)
                if best is None or score < best[0]:
                    best = (score, m)
            self.target = best[1] if best else None
        m = self.target
        if m is None:
            # nothing to fight: stand guard in front of the castle
            hx, hy = b.spawn_point(fi)
            self.steer.go(hx, hy, dt, stop=20)
            return
        d = TD.dist(m["x"], m["y"], fi.a.x, fi.a.y)
        reach = (70 if fi.a.is_cat else 78) + m["r"] - 12
        if d > reach:
            self.steer.go(m["x"], m["y"], dt, stop=reach * 0.8)
            return
        if self.atk_t <= 0:
            many = sum(1 for o in b.mobs if TD.dist(o["x"], o["y"], fi.a.x, fi.a.y) < 110)
            if fi.st == "idle" and many >= 3 and random.random() < lv["smart"] * 0.5:
                inp["pressed"].add("atk")
                inp["held"] = {"atk"}
                self.hold = 0.85
                self.atk_t = 1.2
                return
            inp["pressed"].add("atk")
            self.atk_t = 0.16 if fi.st == "atk" else lv["rate"] * 0.35
