"""横版格斗: a side-view fighting game on platforms (in the spirit of KOF / 死神vs火影 / 冒险岛).

J: three-hit ground combo, ↑J launcher, ↓J sweep, J in the air: air combo (the third hit spikes down).
K / ↑K / ↓K: three skills of the character's own (house_games.SKILLS["brawl"]).
L: hold to block (a block just as the hit lands is a parry); L + left / right: a quick dash with a moment of
invincibility. Space: jump, double jump; ↓ + Space drops through a platform. E: grab and throw (unblockable) when
touching an opponent, or throw the plush you picked up. Hitting and getting hit fill the 怒气 meter; full, J + K
together fires the super, with a cut-in.
"""
import math
import random

from . import house_art as H
from . import house_battle as HB
from . import house_games as HG
from . import house_pals as PL
from . import house_fanim as FA
from . import house_side as SD

STATS = {
    "calico": dict(hp=95, speed=260, jump=740, jump2=620, power=0.95, reach=1.0),
    "tabby": dict(hp=120, speed=210, jump=700, jump2=580, power=1.15, reach=1.05),
    "dad": dict(hp=115, speed=205, jump=680, jump2=560, power=1.1, reach=1.3),
    "mom": dict(hp=105, speed=220, jump=690, jump2=570, power=1.0, reach=1.25),
    "kid": dict(hp=90, speed=245, jump=720, jump2=600, power=0.9, reach=1.05),
}
# startup, active, recovery, hit box (front x0, x1 in px * reach; z0, z1 as a fraction of the body height),
# damage, knockback (x, z), stun, flags
MOVES = {
    "j1": dict(su=0.06, ac=0.07, rc=0.15, box=(0, 48, 0.15, 0.95), dmg=5, kb=(45, 0), stun=0.34),
    "j2": dict(su=0.06, ac=0.07, rc=0.17, box=(0, 52, 0.15, 0.95), dmg=6, kb=(55, 0), stun=0.36),
    "j3": dict(su=0.09, ac=0.09, rc=0.30, box=(0, 62, 0.1, 1.0), dmg=9, kb=(380, 300), stun=0.5, kd=True),
    "uj": dict(su=0.08, ac=0.10, rc=0.26, box=(-8, 44, 0.3, 1.7), dmg=8, kb=(50, 700), stun=0.5, launch=True),
    "dj": dict(su=0.08, ac=0.10, rc=0.30, box=(0, 66, -0.05, 0.35), dmg=8, kb=(170, 260), stun=0.45, kd=True),
    "aj1": dict(su=0.05, ac=0.08, rc=0.12, box=(0, 48, -0.2, 0.9), dmg=5, kb=(70, 300), stun=0.4, air=True),
    "aj2": dict(su=0.05, ac=0.08, rc=0.12, box=(0, 50, -0.2, 0.9), dmg=6, kb=(80, 330), stun=0.4, air=True),
    "aj3": dict(su=0.07, ac=0.10, rc=0.22, box=(-10, 54, -0.5, 0.6), dmg=8, kb=(220, -650), stun=0.5, air=True,
                spike=True),
}
METER_MAX = 100.0
DASH_V = 680.0


class BrawlFighter(HB.Fighter):
    @property
    def x(self):
        return self.a.x

    @x.setter
    def x(self, v):
        self.a.x = v


def setup_side_fighter(fi, stage):
    fi.__class__ = BrawlFighter
    fi.ground = True
    fi.face = 1
    fi.w, fi.hgt = SD.body(fi.char)
    fi.hw = fi.w / 2
    fi.jumps = 1
    fi.drop_t = 0.0
    fi.hs = 0.0                    # hit stop
    fi.meter = 0.0
    fi.combo_n = 0
    fi.combo_t = 0.0
    fi.juggle = 0
    fi.armor = False
    fi.hidden = False
    fi.cds = {}
    fi.aj = 0
    fi.held_item = None
    fi.last = {}
    fi.pend = None
    fi.kd_land = False
    fi.dash_cd = 0.0
    fi.grab_by = None
    fi.flash = 0.0
    fi.land_t = 0.0
    fi.spin = 0.0


class BrawlBattle(HB.Battle):
    GAME = "brawl"
    TOP = False

    def setup(self):
        self.stage = SD.Stage(SD.STAGES[self.f])
        self.cutin = None
        self.projs = []
        self.obst = []
        for fi in self.fighters:
            st = STATS[fi.char]
            fi.maxhp = st["hp"]
            fi.hp = float(st["hp"])
            setup_side_fighter(fi, self.stage)
        self.next_item = 9.0

    # ---- placement ---------------------------------------------------------------------------------------------
    def spawn_point(self, fi):
        sp = self.stage.d["spawns"]
        if self.mode == "ffa":
            k = [0, 2, 1, 3][self.fighters.index(fi) % 4]
        else:
            same = [f for f in self.fighters if f.team == fi.team]
            k = (0 if fi.team == 0 else 2) + (same.index(fi) % 2 if fi in same else 0)
        x, z = sp[k % len(sp)]
        return x, self.stage.lane, z

    def place_all(self):
        for fi in self.fighters:
            x, y, z = self.spawn_point(fi)
            a = fi.a
            a.f, a.x, a.y, a.h = self.f, x, y, z
            fi.z, fi.vx, fi.vz, fi.ground = z, 0.0, 0.0, True
            fi.hp = float(fi.maxhp)
            fi.st, fi.t = "idle", 0.0
        if self.train is not None:
            me = self.trainee()
            for fi in self.fighters:
                if me is not None and fi is not me:
                    fi.x = min(self.stage.xmax - 60, me.x + 260)
                    fi.z = 0.0
        for fi in self.fighters:
            o = self.nearest(fi, 2000)
            if o is not None:
                fi.face = 1 if o.x >= fi.x else -1

    def begin(self):
        super().begin()
        # walk in at their spawn spots (the generic travel uses spawn_point's x, y)
        for fi in self.fighters:
            a = fi.a
            if a.path and a.path[0].get("t") == "travel":
                x, y, z = self.spawn_point(fi)
                a.path[0]["x"], a.path[0]["y"] = x, y

    # ---- helpers -----------------------------------------------------------------------------------------------
    def nearest(self, fi, rng=260.0, same_level=False):
        best = None
        for o in self.enemies(fi):
            if not o.alive() or o.hidden:
                continue
            d = abs(o.x - fi.x) + abs(o.z - fi.z) * (1.6 if same_level else 0.6)
            if d <= rng and (best is None or d < best[0]):
                best = (d, o)
        return best[1] if best else None

    def hurtbox(self, fi):
        return (fi.x - fi.hw, fi.x + fi.hw, fi.z, fi.z + fi.hgt)

    def hitbox(self, fi, box):
        r = STATS[fi.char]["reach"]
        x0, x1 = box[0] * r, box[1] * r
        if fi.face > 0:
            xa, xb = fi.x + x0, fi.x + x1
        else:
            xa, xb = fi.x - x1, fi.x - x0
        return (xa, xb, fi.z + box[2] * fi.hgt, fi.z + box[3] * fi.hgt)

    def face_nearest(self, fi, rng=240.0):
        o = self.nearest(fi, rng)
        if o is not None and abs(o.x - fi.x) > 4:
            fi.face = 1 if o.x > fi.x else -1
        return o

    def can_act(self, fi):
        return fi.st in ("idle", "run", "air", "block")

    # ---- the frame ---------------------------------------------------------------------------------------------
    def step_game(self, dt):
        self.bflash = max(0.0, getattr(self, "bflash", 0.0) - dt * 2.5)
        self.dim = max(0.0, getattr(self, "dim", 0.0) - dt * 1.5)
        if any(fi.st == "super" for fi in self.fighters):
            self.dim = max(self.dim, 0.55)
        if getattr(self, "freeze", 0.0) > 0:
            self.freeze -= dt                     # a beat of stillness on the big hits
            self.step_fx(dt)
            for fi in self.fighters:
                fi.flash = max(0.0, fi.flash - dt * 0.3)
                self.pose(fi)
            return
        if getattr(self, "slow", 0.0) > 0:
            self.slow -= dt
            dt *= 0.35                            # slow motion
        if self.cutin is not None:
            self.cutin["t"] -= dt
            self.step_fx(dt)
            if self.cutin["t"] <= 0:
                self.cutin = None
            for fi in self.fighters:
                self.pose(fi)
            return
        self.control(dt)
        for fi in self.fighters:
            buf = fi.buf
            for k in [k for k, until in buf.items() if until <= self.clock]:
                del buf[k]
            fi.inp["pressed"] |= set(buf)
            for k in fi.inp["pressed"]:
                fi.last[k] = self.clock
            before = fi.st
            self.step_fighter(fi, dt)
            if self.can_act(fi) and before in ("idle", "run", "air", "block") or fi.st != before:
                buf.clear()
            else:
                for k in fi.inp["pressed"]:
                    if k in ("skill", "jump", "throw", "atk") and not (k == "atk" and before == "atk"):
                        buf.setdefault(k, self.clock + 0.25)
            fi.inp["pressed"] = set()
        self.step_projs(dt)
        self.step_items(dt)
        if self.train is not None:
            self.step_train(dt)
        self.step_fx(dt)
        for fi in self.fighters:
            self.pose(fi)
        self.check_end()

    def step_fighter(self, fi, dt):
        a = fi.a
        fi.flash = max(0.0, fi.flash - dt)
        fi.land_t = max(0.0, fi.land_t - dt)
        if fi.st in ("juggle", "grabbed") or (fi.st == "ko" and not fi.ground):
            fi.spin += dt * (-fi.face) * (720 if fi.st != "grabbed" else 200)
        elif fi.st not in ("down", "ko"):
            fi.spin = 0.0
        if fi.hs > 0:
            fi.hs -= dt
            if fi.st == "atk" and "atk" in fi.inp["pressed"]:
                fi.queued = True             # pressed during the hit-stop: still counts
            return
        fi.t += dt
        for k in list(fi.cds):
            fi.cds[k] = max(0.0, fi.cds[k] - dt)
        fi.inv = max(0.0, fi.inv - dt)
        fi.drop_t = max(0.0, fi.drop_t - dt)
        fi.dash_cd = max(0.0, fi.dash_cd - dt)
        if fi.combo_t > 0:
            fi.combo_t -= dt
            if fi.combo_t <= 0:
                fi.combo_n = 0
        if fi.st == "block":
            fi.stam = max(0.0, fi.stam - dt * 4)
        else:
            fi.stam = min(100.0, fi.stam + dt * 18)
        inp = fi.inp
        dx, dy = inp["dx"], inp["dy"]
        held, pressed = inp["held"], inp["pressed"]
        up, down = dy > 0.5, dy < -0.5
        mx = 1 if dx > 0.3 else (-1 if dx < -0.3 else 0)
        st = fi.st
        S = STATS[fi.char]
        want_vx = None
        fly = False
        if fi.pend is not None:
            # J pressed with a full meter: wait a moment to see if K follows (J + K = super)
            fi.pend -= dt
            if "skill" in pressed and fi.meter >= METER_MAX:
                fi.pend = None
                self.start_super(fi)
                return
            if fi.pend <= 0:
                fi.pend = None
                pressed = pressed | {"atk_go"}
                pdy = getattr(fi, "pend_dy", 0.0)
                up, down = pdy > 0.5, pdy < -0.5           # the direction held when J was pressed
        if st in ("idle", "run", "air", "block"):
            # super: J and K together
            if fi.meter >= METER_MAX and (("atk" in pressed and "skill" in pressed) or
                                          ("skill" in pressed and self.clock - fi.last.get("atk", -9) < 0.15) or
                                          ("atk" in pressed and self.clock - fi.last.get("skill", -9) < 0.15 and
                                           st != "skill")):
                self.start_super(fi)
                return
            if "atk" in pressed and fi.meter >= METER_MAX and "atk_go" not in pressed:
                fi.pend = 0.08
                fi.pend_dy = dy
                pressed = pressed - {"atk"}
            if "atk_go" in pressed:
                pressed = pressed | {"atk"}
            dash = ("guard" in pressed and mx != 0) or \
                ("guard" in held and mx != 0 and abs(fi.pdir[0]) < 0.3)
            fi.pdir = (dx, dy)
            if dash and fi.dash_cd <= 0 and fi.stam >= 12:
                fi.face = mx
                self.start(fi, "dash", 0.2)
                fi.stam -= 12
                fi.inv = 0.16
                fi.dash_cd = 0.45
                fi.vx = DASH_V * mx
                fi.vz = 0.0
                self.add_fx("dash", fi, fx=mx)
                FA.on_dash(self, fi)
                self.sound("whoosh")
                self.note(fi, "dash")
                return
            if "jump" in pressed:
                if down and fi.ground and self.stage.on_oneway(fi.x, fi.z, fi.hw):
                    fi.drop_t = 0.3
                    fi.ground = False
                    fi.vz = -60.0
                    self.start(fi, "air", 0)
                elif fi.ground:
                    fi.vz = S["jump"]
                    fi.ground = False
                    fi.jumps = 1
                    self.start(fi, "air", 0)
                    self.add_fx("dust", fi, z=fi.z)
                    self.note(fi, "jump")
                elif fi.jumps > 0:
                    fi.vz = S["jump2"]
                    fi.jumps = 0
                    self.add_fx("ring2", fi, z=fi.z, r=26)
                    self.note(fi, "jump2")
                st = fi.st
            if "atk" in pressed:
                if not fi.ground:
                    if fi.aj < 3:
                        self.face_nearest(fi, 160)
                        self.start_move(fi, "aj%d" % (fi.aj + 1))
                        fi.aj += 1
                        return
                elif up:
                    self.face_nearest(fi)
                    self.start_move(fi, "uj")
                    return
                elif down:
                    self.face_nearest(fi)
                    self.start_move(fi, "dj")
                    return
                else:
                    self.face_nearest(fi)
                    fi.combo = 0
                    self.start_move(fi, "j1")
                    return
            if "skill" in pressed:
                key = "uk" if up else ("dk" if down else "k")
                if fi.cds.get(key, 0) <= 0:
                    self.start_skill(fi, key)
                    return
                self.tell(fi, "技能冷却中")
            if "throw" in pressed:
                if self.try_grab(fi) or self.throw_item(fi) or self.pick_item(fi):
                    return
            if fi.ground:
                if "guard" in held and mx == 0 and fi.stam > 0:
                    if fi.st != "block":
                        self.start(fi, "block", 99)
                        fi.block_t = self.clock
                    want_vx = 0.0
                else:
                    if fi.st not in ("idle", "run"):
                        self.start(fi, "idle", 0)
                    fi.st = "run" if mx else "idle"
                    want_vx = mx * S["speed"] * PL.speed(self, fi)
                    if mx:
                        fi.face = mx
                    else:
                        self.face_nearest(fi, 320)
            else:
                if fi.st != "air":
                    self.start(fi, "air", 0)
                want_vx = mx * S["speed"] * 0.85 * PL.speed(self, fi)
                if mx:
                    fi.face = mx
        elif st == "atk":
            mv = MOVES[fi.data["mv"]]
            t = fi.t
            had = fi.queued
            if "atk" in pressed:
                fi.queued = True
            if t < mv["su"] and fi.ground:
                want_vx = fi.face * 60
            elif fi.ground:
                want_vx = 0.0
            else:
                want_vx = fi.vx * 0.98
            name = fi.data["mv"]
            # a launcher that connected can be cancelled into a jump to chase (死神vs火影 style)
            if name == "uj" and fi.hit_ids and t >= mv["su"] + mv["ac"] * 0.5 and "jump" in pressed and fi.ground:
                fi.vz = S["jump"] * 1.12
                fi.ground = False
                fi.jumps = 1
                self.start(fi, "air", 0)
                self.add_fx("dust", fi, z=fi.z)
                self.note(fi, "jump")
                return
            if mv["su"] <= t < mv["su"] + mv["ac"] and not fi.data.get("swung"):
                fi.data["swung"] = True
                self.swing_fx(fi, name)
            if mv["su"] <= t < mv["su"] + mv["ac"]:
                self.melee_box(fi, mv, name)
                if fi.st != "atk":
                    return
            nxt = {"j1": "j2", "j2": "j3", "aj1": "aj2", "aj2": "aj3"}.get(name)
            if fi.queued and nxt and t >= mv["su"] + mv["ac"] + mv["rc"] * 0.3:
                fi.queued = False
                if name.startswith("aj"):
                    if fi.ground:
                        self.start(fi, "idle", 0)
                    else:
                        fi.aj += 1
                        self.start_move(fi, nxt)
                else:
                    if up and name == "j1":
                        self.start_move(fi, "uj")
                    elif down:
                        self.start_move(fi, "dj")
                    else:
                        self.start_move(fi, nxt)
                if had and "atk" in pressed:
                    fi.queued = True         # pressed again right as the next hit started
                return
            if t >= mv["su"] + mv["ac"] + mv["rc"]:
                self.start(fi, "idle" if fi.ground else "air", 0)
            if mv.get("air") and fi.ground and t > mv["su"]:
                self.start(fi, "idle", 0)
        elif st == "dash":
            fly = True
            want_vx = fi.vx
            if fi.t >= fi.dur:
                fi.vx *= 0.3
                self.start(fi, "idle" if fi.ground else "air", 0)
                fly = False
        elif st == "hit":
            want_vx = None
            if fi.t >= fi.dur:
                self.start(fi, "idle" if fi.ground else "air", 0)
        elif st == "grabbed":
            fly = True
            g = next((o for o in self.fighters if o.uid == fi.grab_by), None)
            if g is not None:
                fi.x = g.x + g.face * (g.hw + fi.hw + 2)
                fi.z = g.z + (g.hgt * 0.7 if fi.data.get("lift") else 4)
                fi.vx = fi.vz = 0.0
            if fi.t >= fi.dur or g is None or g.st not in ("skill", "throwing"):
                self.start(fi, "air", 0)
                fly = False
        elif st == "juggle":
            want_vx = fi.vx * 0.995
            if fi.ground and fi.t > 0.05:
                if fi.data.get("fallv", 0) < -620 and not fi.data.get("bounced"):
                    # slammed into the floor: a bounce first
                    fi.data["bounced"] = True
                    fi.vz, fi.ground = 300.0, False
                    fi.vx *= 0.6
                    FA.on_land(self, fi, hard=True)
                    self.shake = max(self.shake, 0.45)
                    self.sound("hit2")
                elif fi.kd_land or fi.juggle >= 2 or fi.data.get("kd"):
                    slide = fi.vx
                    self.start(fi, "down", 0.6)
                    fi.data["slide"] = slide
                    fi.inv = 0.9
                    FA.on_land(self, fi, hard=True)
                    self.add_fx("stars", fi)
                    fi.juggle = 0
                    fi.kd_land = False
                else:
                    self.start(fi, "idle", 0)
                    FA.on_land(self, fi)
                    fi.juggle = 0
                    fi.kd_land = False
        elif st == "down":
            sl = fi.data.get("slide", 0.0) * max(0.0, 1 - fi.t * 3.5)
            want_vx = sl
            if abs(sl) > 60 and int(fi.t * 20) % 3 == 0:
                FA.on_land(self, fi)
            if fi.t >= fi.dur:
                self.start(fi, "getup", 0.38)
                fi.data["gu"] = random.randint(0, 1)
                fi.inv = 0.5
        elif st == "getup":
            want_vx = 0.0
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
        elif st in ("skill", "super", "throwing"):
            want_vx, fly = self.step_skill(fi, dt)
        elif st == "ko":
            fi.vx *= 0.98
            if fi.t >= fi.dur:
                self.respawn(fi)
                return
        elif st == "fall":
            if fi.t >= fi.dur:
                self.respawn(fi)
            return
        elif st == "over":
            want_vx = 0.0
        # ---- physics
        if want_vx is not None:
            if fi.ground and st in ("idle", "run", "block", "atk"):
                k = min(1.0, dt * 18)
                fi.vx += (want_vx - fi.vx) * k
            elif st == "air":
                k = min(1.0, dt * 9)
                fi.vx += (want_vx - fi.vx) * k
            else:
                fi.vx = want_vx
        if st == "hit":
            fi.vx *= max(0.0, 1 - dt * 6)
        fi.vx += fi.kx
        fi.kx *= max(0.0, 1 - dt * 8)
        prev_vz = fi.vz
        hit = self.stage.move(fi, dt, fi.hw, fi.hgt, drop=fi.drop_t > 0, fly=fly)
        fi.vx -= fi.kx
        if fi.st == "juggle":
            if not fi.ground:
                fi.data["fallv"] = prev_vz
            if hit == "wall" and abs(fi.vx) > 240 and not fi.data.get("walled"):
                # knocked into the wall: bounce off it
                fi.data["walled"] = True
                fi.vx = -fi.vx * 0.45
                fi.vz = max(fi.vz, 260.0)
                FA.on_wall(self, fi)
                self.shake = max(self.shake, 0.6)
                self.sound("hit2")
        if fi.st == "juggle" and fi.vz < 120:
            fi.vz += SD.G * 0.4 * dt          # hang in the air a little: room for an air combo
        if hit == "land":
            fi.jumps = 1
            fi.aj = 0
            if prev_vz < -300:
                fi.land_t = 0.14
            if fi.st == "air":
                self.start(fi, "idle", 0)
                FA.on_land(self, fi, hard=prev_vz < -700)
                self.note(fi, "land")
        if fi.ground:
            fi.aj = 0
        a.h = fi.z
        a.y = self.stage.lane
        a.facing = fi.face
        if fi.z < SD.KILL_Z and fi.alive():
            fi.kos += 1
            self.credit(fi)
            self.start(fi, "fall", 0.6)

    # ---- show ----------------------------------------------------------------------------------------------------
    def sound(self, name, who=None):
        try:
            self.w.app.play_sound(name, who.a.src if (who is not None and who.a.is_cat) else None)
        except Exception:
            pass

    def swing_fx(self, fi, name):
        """The blade of light / swoosh of a normal move, as its hit frames begin."""
        col = HG.CHARS[fi.char]["color"]
        cat = fi.a.is_cat
        if name in ("j1", "j2", "aj1", "aj2"):
            if cat:
                FA.slash(self, fi, r=30, a0=-80 if name in ("j1", "aj1") else -40, sweep=130, col=col, dz=0.6, dx=22)
            else:
                FA.slash(self, fi, r=24, a0=-25, sweep=50, col="#ffffff", dz=0.62, dx=34, dur=0.14)
        elif name == "j3":
            FA.slash(self, fi, r=50 if not cat else 40, a0=-40 if not cat else -90, sweep=130, col=col, dz=0.55, dx=24)
        elif name == "uj":
            FA.slash(self, fi, r=46, a0=80, sweep=-170, col=col, dz=0.75, dx=12)
        elif name == "dj":
            FA.slash(self, fi, r=56, a0=-8, sweep=60, col=col, dz=0.12, dx=26)
            FA.on_dash(self, fi)
        elif name == "aj3":
            FA.slash(self, fi, r=50, a0=-120, sweep=170, col=col, dz=0.4, dx=14)
        self.sound("whoosh")

    # ---- moves -------------------------------------------------------------------------------------------------
    def start_move(self, fi, name):
        self.start(fi, "atk", 9)
        fi.data["mv"] = name
        fi.queued = False
        if name.startswith("aj"):
            fi.vz = max(fi.vz, 120.0)     # a little float in the air combo

    def start(self, fi, st, dur):
        fi.st, fi.t, fi.dur = st, 0.0, dur
        fi.hit_ids = set()
        fi.data = {}
        fi.armor = False
        if st != "atk":
            fi.queued = False

    def melee_box(self, fi, mv, key, dmg_k=1.0):
        box = self.hitbox(fi, mv["box"])
        for o in self.enemies(fi):
            if o.uid in fi.hit_ids or not self.hittable(o):
                continue
            if SD.boxes_overlap(box, self.hurtbox(o)):
                fi.hit_ids.add(o.uid)
                self.apply_hit(fi, o, mv["dmg"] * dmg_k, mv["kb"], mv["stun"], kd=mv.get("kd"),
                               launch=mv.get("launch"), spike=mv.get("spike"), key=key)

    def hittable(self, o):
        return o.alive() and o.inv <= 0 and not o.hidden and o.st not in ("down", "getup", "grabbed", "ko", "fall")

    def apply_hit(self, att, o, dmg, kb, stun, kd=False, launch=False, spike=False, key="", unblockable=False,
                  from_x=None):
        """att (or None) hits o. Knockback x points away from att (or from from_x)."""
        if not self.hittable(o):
            return False
        if PL.block(self, o):
            return False
        src = att.x if att is not None else (from_x if from_x is not None else o.x - 1)
        s = 1 if o.x >= src else -1
        if att is not None:
            dmg *= STATS[att.char]["power"]
        # guarding, facing the hit
        if o.st == "block" and o.face == -s and not unblockable and o.ground:
            if att is not None and self.clock - o.block_t < 0.15:
                self.start(att, "hit", 0.75)
                att.kx = -s * 160
                o.meter = min(METER_MAX, o.meter + 12)
                self.add_fx("parry", o)
                FA.on_block(self, o, parry=True)
                self.sound("block")
                self.add_fx("text", o, text="弹反！")
                self.note(o, "blocked", parry=True)
                self.w.sfx("chime", 3)
                return False
            o.hp -= dmg * 0.12
            o.stam -= dmg * 2.2
            o.kx = s * min(260, abs(kb[0]) * 0.5 + 60)
            o.meter = min(METER_MAX, o.meter + dmg * 0.5)
            self.add_fx("block", o, fx=-s)
            FA.on_block(self, o)
            self.sound("block")
            self.note(o, "blocked")
            if o.stam <= 0:
                o.stam = 0
                self.start(o, "hit", 1.0)
                self.add_fx("text", o, text="破防！")
            self.check_ko(o, att)
            return True
        if o.armor and not kd and not launch:
            o.hp -= dmg * 0.7
            self.add_fx("hit", o, n=int(round(dmg * 0.7)))
            self.check_ko(o, att)
            return True
        o.hp -= dmg
        o.last_by = att.uid if att is not None else o.last_by
        if att is not None:
            att.meter = min(METER_MAX, att.meter + dmg * 1.3)
            att.combo_n = att.combo_n + 1 if att.combo_t > 0 else 1
            att.combo_t = 1.1
            att.hs = 0.05 if dmg < 12 else 0.09
            if att.st == "atk":
                att.queued = att.queued
        o.meter = min(METER_MAX, o.meter + dmg * 0.8)
        o.hs = 0.05 if dmg < 12 else 0.09
        kx, kz = kb
        airborne = not o.ground
        if launch or kd or airborne or kz > 150 or spike:
            o.juggle += 1
            self.start(o, "juggle", 9)
            o.vx = s * kx
            o.vz = kz if kz else 200.0
            o.ground = False
            o.data["kd"] = kd or spike
            o.kd_land = kd or spike
            if o.juggle >= 6:
                o.inv = 9.0                # no endless juggles: falls untouchable
        else:
            self.start(o, "hit", stun)
            o.kx = s * kx
        self.add_fx("hit", o, n=int(round(dmg)), big=dmg >= 12)
        heavy = dmg >= 11 or kd or launch or spike
        FA.on_hit(self, att, o, dmg, heavy=heavy, launch=launch)
        if heavy and att is not None:
            att.hs = o.hs = 0.11
        self.sound("hit2" if heavy else "hit")
        if random.random() < 0.35:
            self.sound("mew" if o.a.is_cat else "oof", o)
        if dmg >= 14:
            self.shake = max(self.shake, 0.6)
        if att is not None and att.combo_n >= 3:
            self.add_fx("combo", att, n=att.combo_n)
            att.max_combo = max(getattr(att, "max_combo", 0), att.combo_n)
        self.note(att, "hit", key=key) if att is not None else None
        if o.a.is_cat and random.random() < 0.2:
            o.a.say(random.choice(["喵！", "嗷！"]), 0.8)
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
        self.start(o, "ko", 2.2)
        o.vz = 520
        o.vx = (1 if att is None or o.x >= att.x else -1) * 260
        o.ground = False
        o.inv = 9
        self.credit(o)
        self.add_fx("ko", o)
        FA.on_ko(self, o)
        self.freeze = max(getattr(self, "freeze", 0.0), 0.18)
        self.sound("boom")
        self.add_fx("text", o, text="击倒！")
        self.shake = 1.0
        o.a.say(random.choice(["喵呜……", "（眼冒金星）"]) if o.a.is_cat else random.choice(["哎哟……", "认输认输……"]), 1.8)

    def respawn(self, fi):
        x, y, z = self.spawn_point(fi)
        fi.x, fi.z = x, z + 60
        fi.vx = fi.vz = fi.kx = 0.0
        fi.ground = False
        fi.hp = float(fi.maxhp)
        fi.stam = 100.0
        fi.inv = 1.6
        fi.hidden = False
        fi.held_item = None
        fi.juggle = 0
        self.start(fi, "air", 0)

    # ---- grab / items --------------------------------------------------------------------------------------------
    def try_grab(self, fi):
        if not fi.ground:
            return False
        r = 50 * STATS[fi.char]["reach"]
        for o in self.enemies(fi):
            if self.hittable(o) and o.ground and abs(o.z - fi.z) < 20 and 0 <= (o.x - fi.x) * fi.face <= r + o.hw:
                self.start(fi, "throwing", 0.42)
                fi.data["sk"] = "grabthrow"
                fi.data["tgt"] = o.uid
                self.start(o, "grabbed", 0.42)
                o.grab_by = fi.uid
                o.data["lift"] = True
                self.add_fx("text", fi, text="抓住了！", small=True)
                return True
            if self.hittable(o) and o.ground and abs(o.z - fi.z) < 20 and 0 <= (fi.x - o.x) * fi.face <= r * 0.6:
                fi.face = -fi.face
                return self.try_grab(fi)
        return False

    def pick_item(self, fi):
        for it in list(self.items):
            if it["k"] == "plush" and abs(it["x"] - fi.x) < 40 and abs(it.get("z", 0) - fi.z) < 30:
                fi.held_item = "plush"
                self.items.remove(it)
                self.add_fx("text", fi, text="捡到玩偶（E 扔）", small=True)
                return True
        return False

    def throw_item(self, fi):
        if not fi.held_item:
            return False
        fi.held_item = None
        self.face_nearest(fi, 500)
        self.proj(fi, "plush", vx=560, vz=240, g=1300, dmg=9, kb=(240, 220), kd=False)
        self.start(fi, "skill", 0.25)
        fi.data["sk"] = "toss"
        self.note(fi, "throw")
        return True

    def step_items(self, dt):
        if self.train is None:
            self.next_item -= dt
            if self.next_item <= 0 and len(self.items) < 3:
                self.next_item = random.uniform(11, 16)
                k = random.choices(["fish", "meter", "plush"], weights=[3, 2, 2])[0]
                x = random.uniform(self.stage.xmin + 60, self.stage.xmax - 60)
                self.items.append({"k": k, "x": x, "y": self.stage.lane, "z": 420.0, "vz": 0.0, "t": 0.0, "g": False})
        for it in list(self.items):
            it["t"] += dt
            if not it["g"]:
                it["vz"] -= 900 * dt
                nz = it["z"] + it["vz"] * dt
                for x0, x1, top, oneway in self.stage.surfaces():
                    if x0 <= it["x"] <= x1 and it["z"] >= top >= nz:
                        nz, it["g"], it["vz"] = top, True, 0.0
                it["z"] = nz
            if it["t"] > 18 or it["z"] < -200:
                self.items.remove(it)
                continue
            if it["k"] in ("fish", "meter"):
                for fi in self.fighters:
                    if fi.alive() and abs(fi.x - it["x"]) < 30 and it["z"] - 10 < fi.z + fi.hgt and fi.z < it["z"] + 30:
                        if it["k"] == "fish":
                            fi.hp = min(fi.maxhp, fi.hp + 25)
                            self.add_fx("text", fi, text="+25", heal=True)
                        else:
                            fi.meter = min(METER_MAX, fi.meter + 45)
                            self.add_fx("text", fi, text="怒气 +45", small=True)
                        self.items.remove(it)
                        self.note(fi, "item")
                        break

    # ---- projectiles -------------------------------------------------------------------------------------------
    def proj(self, fi, k, vx=500.0, vz=0.0, g=0.0, dmg=8.0, kb=(200, 200), kd=False, life=2.0, r=12, z=None, x=None,
             **extra):
        p = {"k": k, "x": fi.x + fi.face * (fi.hw + 8) if x is None else x, "y": self.stage.lane,
             "z": (fi.z + fi.hgt * 0.55) if z is None else z, "vx": vx * fi.face, "vz": vz, "g": g,
             "owner": fi.uid, "team": fi.team, "dmg": dmg, "kb": list(kb), "kd": kd, "life": life, "r": r,
             "rot": 0.0, "hit": [], "face": fi.face}
        p.update(extra)
        self.projs.append(p)
        return p

    def step_projs(self, dt):
        out = []
        for p in self.projs:
            p["life"] -= dt
            p["rot"] += dt * 10
            k = p["k"]
            owner = next((f for f in self.fighters if f.uid == p["owner"]), None)
            if k == "slipper" and p.get("back") is None and p["life"] < p.get("turn", 1.2):
                p["back"] = True
                p["hit"] = []
            if k == "slipper" and p.get("back") and owner is not None:
                d = owner.x - p["x"]
                p["vx"] = SD.sign(d) * 600
                p["vz"] = ((owner.z + owner.hgt * 0.5) - p["z"]) * 4
                if abs(d) < 24 and abs(owner.z + owner.hgt * 0.5 - p["z"]) < 40:
                    p["life"] = 0
            if k == "rccar":
                # drives along whatever it is on
                p["vz"] -= SD.G * dt
                nz = p["z"] + p["vz"] * dt
                for x0, x1, top, oneway in self.stage.surfaces():
                    if x0 <= p["x"] <= x1 and p["z"] >= top - 1 >= nz - 1:
                        nz, p["vz"] = top, 0.0
                p["z"] = nz
                p["x"] += p["vx"] * dt
                if not (self.stage.xmin < p["x"] < self.stage.xmax):
                    p["vx"] = -p["vx"]
            else:
                p["vz"] -= p.get("g", 0.0) * dt
                p["x"] += p["vx"] * dt
                p["z"] += p["vz"] * dt
            done = p["life"] <= 0 or p["z"] < -60 or not (-80 < p["x"] < H.PW + 80)
            if k in ("plush", "rainplush") and p["vz"] < 0:
                for x0, x1, top, oneway in self.stage.surfaces():
                    if x0 <= p["x"] <= x1 and abs(p["z"] - top) < 8:
                        done = True
            if not done:
                for o in self.fighters:
                    if o.uid == p["owner"] or o.uid in p["hit"] or (self.mode != "ffa" and o.team == p["team"]):
                        continue
                    if not self.hittable(o):
                        continue
                    hb = self.hurtbox(o)
                    r = p["r"]
                    if hb[0] - r < p["x"] < hb[1] + r and hb[2] - r < p["z"] < hb[3] + r:
                        p["hit"].append(o.uid)
                        if k == "rccar" or k == "sofa_boom":
                            self.add_fx("boom", None, x=p["x"], y=self.stage.lane, z=p["z"], r=60)
                            FA.burst(self, "smoke", p["x"], self.stage.lane, p["z"] + 10, n=10, col="#7a7a7a",
                                     col2="#a8a8a8", spd=120, g=-80, dur=0.8, size=8)
                            FA.burst(self, "spark", p["x"], self.stage.lane, p["z"] + 10, n=14, col="#ffcf3a",
                                     col2="#e8473f", spd=380, g=500, dur=0.4, size=3)
                            self.sound("boom")
                        self.apply_hit(owner, o, p["dmg"], p["kb"], 0.4, kd=p.get("kd"), launch=p.get("launch"),
                                       key=k, from_x=p["x"] - p["vx"] * 0.01)
                        if not p.get("pierce"):
                            done = True
                            break
            if done:
                if k == "rccar" and p["life"] <= 0:
                    self.add_fx("boom", None, x=p["x"], y=self.stage.lane, z=p["z"], r=50)
                elif k in ("plush", "rainplush", "slipper"):
                    self.add_fx("poof", None, x=p["x"], y=self.stage.lane, z=p["z"])
                continue
            out.append(p)
        self.projs = out

    # ---- skills ------------------------------------------------------------------------------------------------
    def start_skill(self, fi, key):
        sk = HG.SKILLS["brawl"][fi.char][{"k": 0, "uk": 1, "dk": 2}[key]]
        fi.cds[key] = sk["cd"]
        name = sk["key"]
        self.face_nearest(fi, 420 if name in ("shadow", "slipper", "plush", "rccar", "vacuum") else 260)
        dur = {"pounce": 0.5, "upclaw": 0.55, "shadow": 0.6, "roll": 0.8, "buttslam": 1.6, "hiss": 0.5,
               "charge": 0.6, "liftup": 0.75, "slipper": 0.35, "spatula": 0.65, "pole": 0.45, "vacuum": 1.0,
               "plush": 0.3, "bounce": 1.4, "rccar": 0.35}[name]
        self.start(fi, "skill", dur)
        fi.data["sk"] = name
        fi.data["slot"] = key
        self.add_fx("skillname", fi, text=sk["icon"] + " " + sk["name"], color=HG.CHARS[fi.char]["color"])
        FA.on_skill(self, fi, sk["key"])
        self.sound("whoosh")
        self.note(fi, "skill", key=key)
        S = STATS[fi.char]
        if name == "pounce":
            fi.vx, fi.vz, fi.ground = fi.face * 560, 260, False
            FA.slash(self, fi, r=40, a0=-60, sweep=120, dz=0.5, dx=30)
        elif name == "upclaw":
            fi.inv = 0.14
            fi.vx, fi.vz, fi.ground = fi.face * 80, 760, False
        elif name == "roll":
            fi.armor = True
        elif name == "buttslam":
            fi.vx, fi.vz, fi.ground = fi.face * 60, 820, False
        elif name == "charge":
            fi.armor = True
        elif name == "bounce":
            fi.vx, fi.vz, fi.ground = fi.face * 120, 960, False
        elif name == "shadow":
            fi.inv = 0.4
            fi.hidden = True
            self.add_fx("smoke", fi)
        if fi.a.is_cat and name in ("hiss", "buttslam") and random.random() < 0.6:
            self.w.app.play_sound("hiss", fi.a.src) if name == "hiss" else None

    def step_skill(self, fi, dt):
        """Returns (vx wanted, fly)."""
        name = fi.data.get("sk")
        t = fi.t
        S = STATS[fi.char]
        r = S["reach"]
        want, fly = None, False
        if fi.st == "super":
            return self.step_super(fi, dt)
        if name == "grabthrow":
            want = 0.0
            o = next((x for x in self.fighters if x.uid == fi.data.get("tgt")), None)
            if t >= 0.3 and not fi.data.get("done") and o is not None:
                fi.data["done"] = True
                o.st = "air"
                o.x = fi.x - fi.face * (fi.hw + o.hw + 4)
                o.inv = 0.0
                self.apply_hit(fi, o, 10, (380, 420), 0.5, kd=True, key="throw", unblockable=True,
                               from_x=fi.x + fi.face * 10)
                self.note(fi, "throw")
                self.shake = max(self.shake, 0.4)
        elif name == "toss":
            want = 0.0
        elif name == "pounce":
            want = fi.vx
            if t < 0.42:
                self.melee_box(fi, dict(box=(-4, 44, 0.0, 1.0), dmg=11, kb=(320, 320), stun=0.5, kd=True), "pounce")
            if fi.ground and t > 0.12:
                fi.dur = min(fi.dur, t + 0.12)
        elif name == "upclaw":
            want = fi.vx
            if t < 0.35:
                k = int(t / 0.12)
                if k != fi.data.get("k"):
                    fi.data["k"] = k
                    fi.hit_ids = set()
                    self.add_fx("claw", fi, up=True)
                    FA.slash(self, fi, r=40, a0=80, sweep=-170, dz=0.6, dx=10)
                self.melee_box(fi, dict(box=(-6, 40, 0.2, 1.6), dmg=5, kb=(60, 680), stun=0.5, launch=True), "upclaw")
        elif name == "shadow":
            want = 0.0
            if t >= 0.2 and not fi.data.get("moved"):
                fi.data["moved"] = True
                o = self.nearest(fi, 600)
                if o is not None:
                    fi.x = min(max(o.x - o.face * (o.hw + fi.hw + 6), self.stage.xmin + 20), self.stage.xmax - 20)
                    fi.z = o.z
                    fi.face = 1 if o.x > fi.x else -1
                else:
                    fi.x = min(max(fi.x + fi.face * 160, self.stage.xmin + 20), self.stage.xmax - 20)
                fi.hidden = False
                self.add_fx("smoke", fi)
                FA.on_skill(self, fi, "shadow")
            if 0.28 <= t < 0.4:
                self.melee_box(fi, dict(box=(0, 46, 0.1, 1.0), dmg=9, kb=(260, 260), stun=0.5, kd=True), "shadow")
                if t - dt < 0.28:
                    self.add_fx("claw", fi)
                    FA.slash(self, fi, r=36, a0=-70, sweep=140, dz=0.55, dx=20)
        elif name == "roll":
            want = fi.face * 470
            k = int(t / 0.12)
            if k != fi.data.get("k"):
                fi.data["k"] = k
                fi.hit_ids = set()
                FA.on_land(self, fi)
            self.melee_box(fi, dict(box=(-10, 30, 0.0, 0.9), dmg=3.5, kb=(200, 120), stun=0.3), "roll")
        elif name == "buttslam":
            want = fi.vx
            if fi.vz < 0 and not fi.data.get("dive") and fi.z > 40:
                fi.data["dive"] = True
                fi.vz = -1150
            if fi.data.get("dive"):
                self.melee_box(fi, dict(box=(-20, 20, -0.4, 0.4), dmg=9, kb=(120, -400), stun=0.5, kd=True), "buttslam")
            if fi.ground and fi.data.get("dive") and not fi.data.get("boom"):
                fi.data["boom"] = True
                fi.dur = t + 0.3
                self.shockwave(fi, 120, 12, (300, 380))
                self.shake = max(self.shake, 0.7)
            elif fi.ground and t > 0.3 and not fi.data.get("dive"):
                fi.dur = min(fi.dur, t + 0.1)
        elif name == "hiss":
            want = 0.0
            if 0.12 <= t < 0.3:
                if t - dt < 0.12:
                    self.add_fx("hiss", fi, fx=fi.face)
                box = self.hitbox(fi, (0, 120, 0.0, 1.4))
                for o in self.enemies(fi):
                    if o.uid not in fi.hit_ids and self.hittable(o) and SD.boxes_overlap(box, self.hurtbox(o)):
                        fi.hit_ids.add(o.uid)
                        if o.st == "block" and o.face == -fi.face:
                            self.add_fx("block", o, fx=-fi.face)
                            continue
                        o.hp -= 3
                        self.start(o, "hit", 1.1)
                        self.add_fx("text", o, text="吓呆了！", small=True)
                        self.note(fi, "hit", key="hiss")
        elif name == "charge":
            want = fi.face * 560 if t < 0.48 else 0.0
            if t < 0.48:
                self.melee_box(fi, dict(box=(0, 40, 0.0, 1.0), dmg=12, kb=(460, 300), stun=0.5, kd=True), "charge")
                if int(t * 20) % 3 == 0 and int((t - dt) * 20) % 3 != 0:
                    FA.on_dash(self, fi)
                    FA.on_skill(self, fi, "charge")
        elif name == "liftup":
            want = 0.0
            if t < 0.15 and not fi.data.get("tgt"):
                box = self.hitbox(fi, (0, 52, 0.0, 1.0))
                for o in self.enemies(fi):
                    if self.hittable(o) and SD.boxes_overlap(box, self.hurtbox(o)):
                        fi.data["tgt"] = o.uid
                        self.start(o, "grabbed", 0.6)
                        o.grab_by = fi.uid
                        o.data["lift"] = True
                        break
            o = next((x for x in self.fighters if x.uid == fi.data.get("tgt")), None)
            if o is not None and t >= 0.45 and not fi.data.get("done"):
                fi.data["done"] = True
                o.st = "air"
                o.x = fi.x + fi.face * (fi.hw + o.hw)
                self.apply_hit(fi, o, 8, (40, 820), 0.5, launch=True, key="liftup", unblockable=True)
                self.add_fx("text", fi, text="举高高！", small=True)
            elif o is None and t > 0.2:
                fi.dur = min(fi.dur, 0.4)
        elif name == "slipper":
            want = 0.0
            if t >= 0.12 and not fi.data.get("done"):
                fi.data["done"] = True
                self.proj(fi, "slipper", vx=640, dmg=6, kb=(160, 160), life=1.7, turn=1.1, r=14)
        elif name == "spatula":
            want = fi.face * 40
            k = int(t / 0.14)
            if k != fi.data.get("k"):
                fi.data["k"] = k
                fi.hit_ids = set()
            last = t > 0.5
            if k != fi.data.get("arc"):
                fi.data["arc"] = k
                FA.slash(self, fi, r=60, a0=-20 + 90 * (k % 4), sweep=150, dz=0.55, dx=0, dur=0.18)
                if k % 2 == 0:
                    FA.on_skill(self, fi, "spatula")
            box = (fi.x - 64 * r, fi.x + 64 * r, fi.z, fi.z + fi.hgt * 1.05)
            for o in self.enemies(fi):
                if o.uid not in fi.hit_ids and self.hittable(o) and SD.boxes_overlap(box, self.hurtbox(o)):
                    fi.hit_ids.add(o.uid)
                    self.apply_hit(fi, o, 6 if last else 3, (240, 220) if last else (60, 0), 0.3, kd=last,
                                   key="spatula")
        elif name == "pole":
            want = 0.0
            if 0.12 <= t < 0.24:
                if not fi.data.get("fx"):
                    fi.data["fx"] = True
                    FA.on_skill(self, fi, "pole")
                self.melee_box(fi, dict(box=(10, 120, 0.5, 2.2), dmg=9, kb=(120, 700), stun=0.5, launch=True), "pole")
        elif name == "vacuum":
            want = 0.0
            if t < 0.8 and int(t * 10) != int((t - dt) * 10):
                FA.burst(self, "glow", fi.x + fi.face * 220, self.stage.lane, fi.z + 30, n=8, col="#bfe0ff",
                         col2="#ffffff", spd=380, ang=180 if fi.face > 0 else 0, spread=40, g=0, dur=0.5, size=4)
            if t < 0.8:
                for o in self.enemies(fi):
                    dxo = (o.x - fi.x) * fi.face
                    if 0 < dxo < 300 and abs(o.z - fi.z) < 90 and self.hittable(o):
                        o.kx = -fi.face * 220
                        if o.st == "block":
                            o.stam -= dt * 20
            if 0.8 <= t < 0.95:
                self.melee_box(fi, dict(box=(0, 70, 0.0, 1.0), dmg=8, kb=(320, 200), stun=0.5, kd=True), "vacuum")
        elif name == "plush":
            want = 0.0
            if t >= 0.1 and not fi.data.get("done"):
                fi.data["done"] = True
                self.proj(fi, "plush", vx=520, vz=280, g=1250, dmg=8, kb=(200, 200), r=13)
        elif name == "bounce":
            want = fi.vx
            if fi.vz > 0:
                self.melee_box(fi, dict(box=(-14, 30, 0.0, 1.0), dmg=6, kb=(120, 500), stun=0.4, launch=True), "bounce")
            if fi.ground and t > 0.2 and not fi.data.get("boom"):
                fi.data["boom"] = True
                self.shockwave(fi, 80, 6, (200, 260))
                fi.dur = t + 0.15
        elif name == "rccar":
            want = 0.0
            if t >= 0.15 and not fi.data.get("done"):
                fi.data["done"] = True
                self.proj(fi, "rccar", vx=380, dmg=12, kb=(260, 420), kd=True, life=3.0, r=16, z=fi.z,
                          x=fi.x + fi.face * 30)
        if fi.st in ("skill", "throwing") and t >= fi.dur:
            fi.hidden = False
            fi.armor = False
            self.start(fi, "idle" if fi.ground else "air", 0)
        return want, fly

    def shockwave(self, fi, r, dmg, kb):
        self.add_fx("wave", fi, z=fi.z, r=r)
        FA.burst(self, "rock", fi.x, self.stage.lane, fi.z + 4, n=14, col="#8d8576", col2="#c9c0ae", spd=380,
                 ang=90, spread=150, g=1300, dur=0.7, size=5)
        FA.burst(self, "dust", fi.x, self.stage.lane, fi.z + 2, n=10, col="#d9c9b0", spd=260, ang=90, spread=176,
                 g=0, dur=0.6, size=7)
        self.sound("boom")
        for o in self.enemies(fi):
            if self.hittable(o) and abs(o.x - fi.x) < r + o.hw and abs(o.z - fi.z) < 50:
                self.apply_hit(fi, o, dmg, kb, 0.5, kd=True, key="wave", from_x=fi.x)

    # ---- supers -------------------------------------------------------------------------------------------------
    def start_super(self, fi):
        sk = HG.SKILLS["brawl"][fi.char][3]
        fi.meter = 0.0
        fi.pend = None
        self.face_nearest(fi, 900)
        self.start(fi, "super", 9)
        fi.data["sk"] = sk["key"]
        fi.armor = True
        fi.inv = 1.0
        self.cutin = {"uid": fi.uid, "name": sk["name"], "char": fi.char, "t": 1.0, "dur": 1.0}
        self.w.sfx("chime", 2)
        FA.burst(self, "glow", fi.x, self.stage.lane, fi.z + fi.hgt * 0.5, n=24, col=HG.CHARS[fi.char]["color"],
                 col2="#ffffff", spd=-220, g=0, dur=0.9, size=6)
        self.note(fi, "super")

    def step_super(self, fi, dt):
        name = fi.data["sk"]
        t = fi.t
        want, fly = 0.0, False
        if name == "s_nine":
            if not fi.data.get("lock"):
                want = fi.face * 760 if t < 0.4 else 0.0
                box = self.hitbox(fi, (-4, 44, 0.0, 1.0))
                for o in self.enemies(fi):
                    if o.alive() and not o.hidden and o.st not in ("ko", "fall") and SD.boxes_overlap(box, self.hurtbox(o)):
                        fi.data["lock"] = o.uid
                        fi.data["t0"] = t
                        self.start(o, "hit", 2.0)
                        break
                if t > 0.5 and not fi.data.get("lock"):
                    self.end_super(fi)
            else:
                o = next((x for x in self.fighters if x.uid == fi.data["lock"]), None)
                u = t - fi.data["t0"]
                k = int(u / 0.11)
                if o is not None and k != fi.data.get("k") and k < 9:
                    fi.data["k"] = k
                    o.hp -= 3 * STATS[fi.char]["power"]
                    o.st, o.t, o.dur = "hit", 0.0, 2.0
                    self.add_fx("claw", o, up=k % 2 == 0)
                    self.add_fx("hit", o, n=3)
                    FA.slash(self, o, r=34 + 3 * k, a0=-90 + 40 * (k % 3), sweep=160, col=HG.CHARS[fi.char]["color"],
                             dz=0.5, dx=0, dur=0.16)
                    FA.on_hit(self, fi, o, 4)
                    self.sound("hit")
                    fi.x = o.x - fi.face * (o.hw + fi.hw) * (1 if k % 2 == 0 else -1)
                    fi.face = 1 if o.x > fi.x else -1
                if o is not None and u >= 1.05 and not fi.data.get("fin"):
                    fi.data["fin"] = True
                    o.st = "idle"
                    o.inv = 0
                    o.hp = max(1.0, o.hp) if o.hp <= 0 and False else o.hp
                    self.apply_hit(fi, o, 16, (520, 560), 0.6, kd=True, key="super", unblockable=True)
                    self.shake = 1.0
                    self.bflash, self.slow = 1.0, 0.5
                    FA.burst(self, "star", o.x, self.stage.lane, o.z + 40, n=16, col=HG.CHARS[fi.char]["color"],
                             col2="#ffffff", spd=420, g=300, dur=0.8, size=7)
                if u >= 1.3:
                    self.end_super(fi)
        elif name == "s_mountain":
            fly = True
            if t < 0.35:
                fi.z += 1400 * dt
                fi.hidden = fi.z > 330
            elif t < 1.35:
                fi.hidden = True
                o = self.nearest(fi, 2000)
                if o is not None:
                    fi.x += (o.x - fi.x) * min(1.0, dt * 4)
                fi.data["mark"] = fi.x
            else:
                fi.hidden = False
                fly = False
                fi.vz = min(fi.vz, -1500)
                if fi.ground and not fi.data.get("boom"):
                    fi.data["boom"] = True
                    self.add_fx("wave", fi, z=fi.z, r=280)
                    for o in self.enemies(fi):
                        if o.alive() and not o.hidden and o.st not in ("ko", "fall") and abs(o.x - fi.x) < 280:
                            o.inv = 0
                            if o.st in ("down", "getup"):
                                o.st = "idle"
                            self.apply_hit(fi, o, 30 if abs(o.x - fi.x) < 90 else 20, (460, 560), 0.6, kd=True,
                                           key="super", unblockable=True)
                    self.shake = 1.2
                    self.bflash, self.slow = 1.0, 0.45
                    FA.burst(self, "rock", fi.x, self.stage.lane, fi.z + 4, n=26, col="#8d8576", col2="#c9c0ae",
                             spd=560, ang=90, spread=160, g=1300, dur=0.9, size=7)
                    FA.burst(self, "dust", fi.x, self.stage.lane, fi.z + 4, n=16, col="#d9c9b0", spd=420, ang=90,
                             spread=178, g=0, dur=0.9, size=10)
                    self.sound("boom")
                    fi.data["end"] = t + 0.4
                if fi.data.get("end") and t >= fi.data["end"]:
                    self.end_super(fi)
                if t > 3.0:
                    self.end_super(fi)
        elif name == "s_sofa":
            if t >= 0.45 and not fi.data.get("done"):
                fi.data["done"] = True
                self.proj(fi, "sofa", vx=760, dmg=26, kb=(560, 380), kd=True, life=2.2, r=36, pierce=True,
                          z=fi.z + fi.hgt * 0.6, unblockable=True)
                self.shake = 0.6
                FA.burst(self, "feather", fi.x, self.stage.lane, fi.z + fi.hgt, n=16, col="#ffffff", col2="#d8ead8",
                         spd=260, g=120, dur=1.0, size=5)
                self.sound("whoosh")
            if t >= 0.75:
                self.end_super(fi)
        elif name == "s_clean":
            if t < 1.2:
                for o in self.enemies(fi):
                    if o.alive() and not o.hidden and o.st not in ("ko", "fall"):
                        o.kx = SD.sign(fi.x - o.x) * min(520, abs(fi.x - o.x) * 3)
                        if abs(o.z - fi.z) > 30:
                            o.vz = (fi.z - o.z) * 3
                            o.ground = False
                        if o.st == "block":
                            o.st = "idle"
                        o.data["vac"] = True
                if int(t * 10) % 3 == 0:
                    self.add_fx("suck", fi)
            elif not fi.data.get("done"):
                fi.data["done"] = True
                fi.hp = min(fi.maxhp, fi.hp + 20)
                self.add_fx("text", fi, text="+20", heal=True)
                box = (fi.x - 150, fi.x + 150, fi.z - 30, fi.z + 140)
                for o in self.enemies(fi):
                    if o.alive() and not o.hidden and o.st not in ("ko", "fall") and SD.boxes_overlap(box, self.hurtbox(o)):
                        o.inv = 0
                        if o.st in ("down", "getup"):
                            o.st = "idle"
                        self.apply_hit(fi, o, 24, (540, 480), 0.6, kd=True, key="super", unblockable=True,
                                       from_x=fi.x)
                self.add_fx("wave", fi, z=fi.z, r=160)
                self.shake = 0.9
                self.bflash, self.slow = 0.8, 0.35
                FA.burst(self, "glow", fi.x, self.stage.lane, fi.z + 40, n=24, col="#bfe0ff", col2="#e4639b",
                         spd=520, g=0, dur=0.7, size=6)
                self.sound("boom")
            if t >= 1.5:
                self.end_super(fi)
        elif name == "s_rain":
            if t < 2.4:
                fi.data["acc"] = fi.data.get("acc", 0.0) + dt
                while fi.data["acc"] >= 0.07:
                    fi.data["acc"] -= 0.07
                    es = [o for o in self.enemies(fi) if o.alive()]
                    tx = random.choice(es).x if es else fi.x
                    x = min(max(tx + random.uniform(-160, 160), 60), H.PW - 60)
                    p = self.proj(fi, "rainplush", x=x, z=430, vx=0, vz=-200, g=900, dmg=4, kb=(80, 160), r=14,
                                  pierce=False, life=2.0)
                    p["vx"] = random.uniform(-30, 30)
                    p["kind"] = random.choice(("bunny", "bear", "duck"))
            if t >= 2.6:
                self.end_super(fi)
        return want, fly

    def end_super(self, fi):
        fi.hidden = False
        fi.armor = False
        fi.inv = 0.3
        self.start(fi, "idle" if fi.ground else "air", 0)

    # ---- poses -------------------------------------------------------------------------------------------------
    def pose(self, fi):
        fi.a.h = fi.z
        fi.a.facing = fi.face
        fi.a.hidden = bool(fi.hidden)
        FA.animate(self, fi)

    def celebrate(self, fi, dt):
        a = fi.a
        a.hidden = False
        a.fanim = dict(rot=0.0, pz=0.0, sx=1.0, sy=1.0, dx=0.0, dy=0.0, fl=0.0, gh=0, op=1.0)
        a.rig = None
        fi.hidden = False
        if not fi.ground:
            fi.vx = 0.0
            self.stage.move(fi, dt, fi.hw, fi.hgt)
        a.h = fi.z
        win = self.result is not None and (fi.team in self.result.get("teams", ()) or self.train is not None)
        if a.is_cat:
            a.set_pose(("happy" if int(self.t * 2) % 2 else "stretch") if win else "grumpy")
        else:
            a.pose = ("dance" if int(self.t * 1.5) % 2 else "clap") if win else "stand"
            a.view = "front"
            a.prop = None

    # ---- network -----------------------------------------------------------------------------------------------
    def net_extra(self):
        return {"cutin": self.cutin, "stage_f": self.f, "dim": round(getattr(self, "dim", 0.0), 2),
                "bflash": round(getattr(self, "bflash", 0.0), 2)}

    def fighter_extra(self, fi):
        return {"meter": round(fi.meter, 1), "cds": {k: round(v, 1) for k, v in fi.cds.items()},
                "combo_n": fi.combo_n, "combo_t": round(fi.combo_t, 2), "hidden": fi.hidden, "face": fi.face,
                "held_item": fi.held_item, "ground": fi.ground, "data": {"sk": fi.data.get("sk"),
                                                                          "mark": fi.data.get("mark")}}

    # ---- tutorial ----------------------------------------------------------------------------------------------
    def train_text(self, i):
        key, text, keys = self.TRAIN_STEPS[i][:3]
        me = self.trainee()
        ch = me.char if me is not None else "calico"
        sks = HG.SKILLS["brawl"][ch]
        return text.format(k=sks[0]["name"], uk=sks[1]["name"], dk=sks[2]["name"], sp=sks[3]["name"]), keys

    def train_prepare(self, key, me):
        if me is None:
            return
        if key == "super":
            me.meter = METER_MAX
        for fi in self.fighters:
            if fi is not me:
                fi.hp = float(fi.maxhp)

    def make_ai(self, fi):
        return BrawlTrainAI(self, fi) if self.train is not None else BrawlAI(self, fi, fi.ctrl[3:])


def _hit(key):
    return lambda ev, kw: ev == "hit" and kw.get("key") == key


BrawlBattle.TRAIN_STEPS = [
    ("move", "用 A / D 走到陪练身边", "A / D", "near", "走路"),
    ("combo", "连按 J 三下：三连击，第三下把对手打飞", "J J J", _hit("j3"), "三连击"),
    ("uj", "按住 W（↑）再按 J：把对手挑上天", "↑ + J", _hit("uj"), "挑空"),
    ("air", "趁它在天上：按空格跳起来，空中按 J 连着打", "空格 → J", lambda ev, kw: ev == "hit" and
     str(kw.get("key", "")).startswith("aj"), "空中连击"),
    ("dj", "按住 S（↓）再按 J：扫腿，把对手扫倒", "↓ + J", _hit("dj"), "扫腿"),
    ("k", "按 K 放技能「{k}」", "K", lambda ev, kw: ev == "skill" and kw.get("key") == "k", "技能 K"),
    ("uk", "按住 W 再按 K：「{uk}」", "↑ + K", lambda ev, kw: ev == "skill" and kw.get("key") == "uk", "技能 ↑K"),
    ("dk", "按住 S 再按 K：「{dk}」", "↓ + K", lambda ev, kw: ev == "skill" and kw.get("key") == "dk", "技能 ↓K"),
    ("block", "陪练要打你了！它发光的时候按住 L 挡住", "按住 L", "blocked", "格挡"),
    ("dash", "按住 L 再按 A 或 D：瞬步闪身", "L + ←→", "dash", "瞬步"),
    ("jump2", "按空格跳，在空中再按一次空格：二段跳，跳上高处的平台", "空格 空格", "jump2", "二段跳"),
    ("throw", "贴着陪练按 E：抓住它扔出去（格挡也挡不住）", "E", "throw", "抓投"),
    ("super", "怒气满了！同时按 J + K：大招「{sp}」", "J + K", "super", "大招"),
]


# ======================================================================================================== AI
class BrawlAI:
    LEVELS = {"easy": dict(react=0.5, block=0.15, combo=1, skill=0.25, aggro=0.5, air=0.1, dash=0.05),
              "normal": dict(react=0.28, block=0.35, combo=2, skill=0.5, aggro=0.75, air=0.3, dash=0.15),
              "hard": dict(react=0.14, block=0.6, combo=3, skill=0.8, aggro=0.95, air=0.55, dash=0.3)}

    def __init__(self, b, fi, level):
        self.b = b
        self.fi = fi
        self.lv = self.LEVELS.get(level, self.LEVELS["normal"])
        self.next = random.uniform(0.2, 0.6)
        self.guard = 0.0
        self.combo_left = 0
        self.tgt = None
        self.wait = 0.0

    def press(self, *keys):
        self.fi.inp["pressed"].update(keys)

    def step(self, dt):
        fi, b = self.fi, self.b
        inp = fi.inp
        inp["dx"] = inp["dy"] = 0.0
        inp["held"] = set()
        self.next -= dt
        if not fi.alive() or fi.st in ("hit", "juggle", "down", "getup", "grabbed", "super"):
            self.guard = 0
            return
        es = [o for o in b.enemies(fi) if o.alive() and not o.hidden]
        if not es:
            return
        if self.tgt not in es or random.random() < 0.01:
            self.tgt = min(es, key=lambda o: abs(o.x - fi.x) + abs(o.z - fi.z) * 1.5)
        o = self.tgt
        dxp = o.x - fi.x
        dz = o.z - fi.z
        reach = 50 * STATS[fi.char]["reach"] + o.hw
        # keep blocking for a moment
        if self.guard > 0:
            self.guard -= dt
            inp["held"] = {"guard"}
            return
        # threat: an attacker close by, facing me
        if fi.ground and fi.st in ("idle", "run") and o.st in ("atk", "skill") and abs(dxp) < reach + 50 and \
                abs(dz) < 60 and o.face == SD.sign(fi.x - o.x) and self.next <= 0:
            self.next = self.lv["react"]
            r = random.random()
            if r < self.lv["block"]:
                self.guard = 0.45
                inp["held"] = {"guard"}
                return
            if r < self.lv["block"] + self.lv["dash"]:
                inp["dx"] = -SD.sign(dxp)
                inp["held"] = {"guard"}
                self.press("guard")
                return
        if fi.st not in ("idle", "run", "air", "atk"):
            return
        # super
        if fi.meter >= METER_MAX and abs(dxp) < 260 and abs(dz) < 80 and random.random() < 0.05 + self.lv["skill"] * 0.1:
            self.press("atk", "skill")
            return
        # combos in progress
        if fi.st == "atk":
            if self.combo_left > 0 and fi.t > 0.1:
                self.press("atk")
                self.combo_left -= 1
            return
        if self.next > 0 and fi.st != "air":
            # move while waiting
            self.move_to(o, reach)
            return
        self.next = self.lv["react"] * random.uniform(0.6, 1.3)
        sks = HG.SKILLS["brawl"][fi.char]
        # skills
        if random.random() < self.lv["skill"] * 0.5:
            choice = None
            d = abs(dxp)
            if fi.cds.get("k", 0) <= 0 and 90 < d < 300 and abs(dz) < 60 and fi.ground:
                choice = "k"
            elif fi.cds.get("uk", 0) <= 0 and d < 110 and dz > 50:
                choice = "uk"
            elif fi.cds.get("dk", 0) <= 0 and ((sks[2]["key"] in ("shadow", "slipper", "rccar", "vacuum") and 120 < d < 420
                                                and abs(dz) < 60) or (sks[2]["key"] == "hiss" and d < 110)):
                choice = "dk"
            if choice:
                fi.face = 1 if dxp > 0 else -1
                inp["dy"] = {"k": 0.0, "uk": 1.0, "dk": -1.0}[choice]
                self.press("skill")
                return
        # in reach: attack
        if abs(dxp) < reach and abs(dz) < 40:
            if o.st == "block" and random.random() < 0.5:
                self.press("throw")
                return
            r = random.random()
            if r < 0.2:
                inp["dy"] = 1.0
                self.press("atk")
                self.combo_left = 0
                self.wait = 0.3
            elif r < 0.32:
                inp["dy"] = -1.0
                self.press("atk")
            else:
                self.press("atk")
                self.combo_left = self.lv["combo"] - 1
            return
        # target in the air near me: jump and air-attack
        if dz > 40 and abs(dxp) < 120 and random.random() < self.lv["air"] + 0.2:
            if fi.ground:
                self.press("jump")
            elif fi.jumps > 0 and fi.vz < 100 and dz > 30:
                self.press("jump")
            elif abs(o.z - fi.z) < 50:
                self.press("atk")
            return
        if random.random() < self.lv["aggro"]:
            self.move_to(o, reach)

    def move_to(self, o, reach):
        fi, b = self.fi, self.b
        inp = fi.inp
        dxp = o.x - fi.x
        dz = o.z - fi.z
        if dz > 60:
            # target higher up: get under a platform near it and jump
            if fi.ground:
                if abs(dxp) < 200:
                    self.press("jump")
                inp["dx"] = SD.sign(dxp)
            else:
                inp["dx"] = SD.sign(dxp) if abs(dxp) > 10 else 0
                if fi.jumps > 0 and fi.vz < 60:
                    self.press("jump")
            return
        if dz < -60 and fi.ground and b.stage.on_oneway(fi.x, fi.z, fi.hw) and random.random() < 0.08:
            inp["dy"] = -1.0
            self.press("jump")
            return
        if abs(dxp) > reach * 0.8:
            inp["dx"] = SD.sign(dxp)
            if abs(dxp) > 360 and random.random() < self.lv["dash"] * 0.1 and fi.ground:
                inp["held"] = {"guard"}
                self.press("guard")


class BrawlTrainAI:
    """The sparring partner: stands still; swings slowly only while you practise blocking."""

    def __init__(self, b, fi):
        self.b = b
        self.fi = fi
        self.wait = 1.5
        self.charging = 0.0

    def step(self, dt):
        fi, b = self.fi, self.b
        inp = fi.inp
        inp["dx"] = inp["dy"] = 0.0
        inp["held"] = set()
        me = b.trainee()
        if me is None or not fi.alive() or b.train["i"] >= len(b.TRAIN_STEPS):
            return
        key = b.TRAIN_STEPS[b.train["i"]][0]
        if fi.st in ("idle", "run") and abs(me.x - fi.x) > 4:
            fi.face = 1 if me.x > fi.x else -1
        if fi.ground and fi.z > 5 and me.ground and me.z < 5 and fi.st in ("idle", "run") and key != "jump2":
            fi.drop_t = 0.3                 # knocked up onto a platform: come back down to the trainee
            fi.ground = False
            return
        if key == "move" or fi.st not in ("idle", "run", "air"):
            self.charging = 0.0
            return
        if key == "jump2":
            return
        if key == "block" and b.train.get("done_t") is None:
            if abs(me.x - fi.x) > 70 and fi.ground:
                inp["dx"] = SD.sign(me.x - fi.x) * 0.6
                return
            self.wait -= dt
            if self.wait <= 0:
                self.wait = 2.0
                fi.data["tele"] = True
                b.add_fx("text", fi, text="（蓄力……）", small=True)
                b.start(fi, "skill", 0.9)
                fi.data["sk"] = "tele"
            return
        # otherwise walk back near the trainee if they wandered off
        if abs(me.x - fi.x) > 380 and fi.ground:
            inp["dx"] = SD.sign(me.x - fi.x) * 0.5


# the partner's slow, glowing swing in the "block" step
_orig_step_skill = BrawlBattle.step_skill


def _step_skill(self, fi, dt):
    if fi.data.get("sk") == "tele":
        if 0.7 <= fi.t < 0.85:
            self.melee_box(fi, dict(box=(0, 70, 0.0, 1.1), dmg=6, kb=(200, 0), stun=0.4), "tele")
        if fi.t >= fi.dur:
            self.start(fi, "idle", 0)
        return 0.0, False
    return _orig_step_skill(self, fi, dt)


BrawlBattle.step_skill = _step_skill
