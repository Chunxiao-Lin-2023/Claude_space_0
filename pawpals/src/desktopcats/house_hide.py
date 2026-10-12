"""躲猫猫 (in the 躲猫猫小屋): one seeker, everybody else hides in the furniture; every round someone else seeks.

A round: the seeker counts to ten with their eyes covered while the others hide (walk up to a wardrobe, the bed, a box...
and press E to get in; E again to get out). Then the seeker searches: J next to a piece of furniture looks inside, J
next to someone out in the open catches them. A hiding place rustles now and then (a tail or a pair of ears peeks
out) -- more often when the seeker is close. Each character has a hiding trick and a seeking trick on K.

Points: the seeker gets 2 for everyone found (and 2 more for finding everybody), a hider who lasts the round gets 3.
After every player has been the seeker (as many times as agreed) the most points wins. No 灵宝 in this game.
"""
import math
import random

from . import house_art as H
from . import house_battle as HB
from . import house_fanim as FA
from . import house_games as HG
from . import house_tdgame as TD

SPOT_NAMES = {"wardrobe": "衣柜里", "bed": "床底下", "kid_bed": "小床底下", "sofa": "沙发后面", "armchair": "单人沙发后面",
              "box": "纸箱里", "toy_box": "玩具箱里", "plant": "盆栽后面", "bookshelf": "书架后面", "fridge": "冰箱后面",
              "counter": "橱柜里", "washer": "洗衣机里", "table": "桌子底下", "coat_rack": "大衣里面"}
HIDE_T, SEEK_T, REVEAL_T = 10.0, 45.0, 3.2
SEEK_HOME = (630.0, 140.0)
NOTICE = {"easy": 0.3, "normal": 0.55, "hard": 0.85}


class HideBattle(TD.TopGame):
    GAME = "hide"
    TRAIN_DONE = "训练完成！会躲也会找啦 🙈"
    FREE_STATES = ("idle", "hidden", "count")

    def setup(self):
        self.limit = 1e9
        self.spots = []
        for it in self.w.items:
            if it.f != self.f or it.type not in SPOT_NAMES:
                continue
            d = it.cat.get("d", 40)
            ex, ey = it.x, max(30.0, it.y - d / 2 - 18)
            self.spots.append({"id": len(self.spots), "type": it.type, "name": SPOT_NAMES[it.type], "x": ex, "y": ey,
                               "ix": it.x, "iy": it.y, "h": it.cat.get("h", 40), "w": it.cat.get("w", 40),
                               "who": None, "rus": 0.0, "peek": "tail", "decoy": 0.0, "noise": [], "searched": -99.0,
                               "glow": 0.0, "rus_at": -99.0})
        self.order = [fi.uid for fi in self.fighters]
        human = [fi.uid for fi in self.fighters if not fi.ctrl.startswith("ai:")]
        if human:                                   # the human hides first (the fun part) and seeks second
            self.order.remove(human[0])
            self.order.insert(1 if len(self.order) >= 1 else 0, human[0])
        self.rounds = max(1, min(3, self.kos_to_win)) * len(self.order) if self.mode != "train" else 99
        self.rnd = -1
        self.rphase = "wait"
        self.rtimer = 0.0
        self.seeker = None
        self.balls = []
        self.found = 0
        for fi in self.fighters:
            fi.maxhp = 100
            fi.hp = 100.0
            fi.cds = {"k": 0.0}
            fi.role = "hide"
            fi.spot = None
            fi.caught = False
            fi.disguise = fi.sneak = fi.radar = fi.outline = fi.still = fi.hush = 0.0
            fi.rus_t = random.uniform(6, 12)
            fi.bench = None
            fi.survived = 0

    def place_all(self):
        super().place_all()
        self.next_round()

    # ---- rounds ------------------------------------------------------------------------------------------------
    def next_round(self):
        self.rnd += 1
        if self.train is None and self.rnd >= self.rounds:
            self.end_game()
            return
        n = len(self.order)
        self.seeker = self.order[self.rnd % n] if self.train is None else next(
            (f.uid for f in self.fighters if f.uid != self.train.get("uid")), self.order[0])
        self.found = 0
        self.balls = []
        for s in self.spots:
            s.update(who=None, rus=0.0, decoy=0.0, noise=[], searched=-99.0, glow=0.0)
        bench = 0
        for i, fi in enumerate(self.fighters):
            fi.role = "seek" if fi.uid == self.seeker else "hide"
            fi.spot = None
            fi.caught = False
            fi.disguise = fi.sneak = fi.radar = fi.outline = fi.still = fi.hush = 0.0
            fi.cds["k"] = 0.0
            fi.a.hidden = False
            fi.inv = 0.0
            fi.bench = None
            if fi.role == "seek":
                fi.a.x, fi.a.y = SEEK_HOME
                fi.fx, fi.fy = 0.0, 1.0
                self.start(fi, "count", 99)
            else:
                fi.a.x, fi.a.y = 540.0 + bench * 60, 110.0 + (bench % 2) * 30
                fi.fx, fi.fy = 0.0, -1.0
                bench += 1
                self.start(fi, "idle", 0)
            fi.z = 0.0
        if self.train is not None:
            self.rphase, self.rtimer = "seek", 1e9
            sk = next(f for f in self.fighters if f.uid == self.seeker)
            self.start(sk, "idle", 0)
            return
        self.rphase, self.rtimer = "hide", HIDE_T
        sk = next(f for f in self.fighters if f.uid == self.seeker)
        self.say_banner("第 %d / %d 轮：%s 来找！大家快躲起来～" % (self.rnd + 1, self.rounds, sk.a.name), 2.6)
        sk.a.say("一、二、三……" if not sk.a.is_cat else "喵、喵、喵……", 3.0)
        self.w.sfx("chime", 1)

    def step_world(self, dt):
        for s in self.spots:
            s["rus"] = max(0.0, s["rus"] - dt)
            s["glow"] = max(0.0, s["glow"] - dt)
            s["decoy"] = max(0.0, s["decoy"] - dt)
            keep = []
            for t in s["noise"]:
                t -= dt
                if t <= 0:
                    self.rustle(s, 1.0, fake=True)
                else:
                    keep.append(t)
            s["noise"] = keep
            if s["decoy"] > 0 and random.random() < dt / 4.0:
                self.rustle(s, 0.9, fake=True)
        self.step_balls(dt)
        if self.rphase == "wait":
            return
        self.rtimer -= dt
        if self.rphase == "hide":
            if self.rtimer <= 0:
                self.rphase, self.rtimer = "seek", SEEK_T
                sk = self.seeker_fi()
                if sk is not None:
                    self.start(sk, "idle", 0)
                    sk.a.say("我来啦！" if not sk.a.is_cat else "喵！（睁眼）", 1.5)
                self.say_banner("找啦！", 1.2)
                self.gong()
        elif self.rphase == "seek":
            self.step_rustles(dt)
            hiders = [f for f in self.fighters if f.role == "hide"]
            if self.train is None and hiders and all(f.caught for f in hiders):
                sk = self.seeker_fi()
                if sk is not None:
                    sk.score += 2
                    self.add_fx("text", sk, text="全找到了！+2")
                self.end_round("全都找到了！")
            elif self.rtimer <= 0:
                for f in hiders:
                    if not f.caught:
                        f.score += 3
                        f.survived += 1
                        self.add_fx("text", f, text="没被找到 +3")
                        self.note(f, "survive")
                self.end_round("时间到！")
        elif self.rphase == "reveal":
            if self.rtimer <= 0:
                self.next_round()

    def end_round(self, text):
        self.rphase, self.rtimer = "reveal", REVEAL_T
        for f in self.fighters:
            if f.role == "hide" and not f.caught:
                self.pop_out(f, "我在这里！")
            if f.st in ("search", "count"):
                self.start(f, "idle", 0)
        self.say_banner(text, 2.0)
        self.w.sfx("chime", 2)

    def end_game(self):
        scores = {}
        for f in self.fighters:
            scores[f.team] = scores.get(f.team, 0) + f.score
        win = self.winners_by(scores)
        parts = ["%s %d 分" % (self.team_label(tm), v) for tm, v in sorted(scores.items(), key=lambda kv: -kv[1])]
        text = "平局！" if len(win) != 1 else "%s 赢了！" % self.team_label(win[0])
        self.finish_with(win if len(win) == 1 else [], text)
        self.result["rank"] = " · ".join(parts)
        for f in self.fighters:
            f.a.hidden = False

    def check_end(self):
        pass

    def seeker_fi(self):
        return next((f for f in self.fighters if f.uid == self.seeker), None)

    # ---- spots -------------------------------------------------------------------------------------------------
    def spot_near(self, x, y, r=72.0, free=None):
        best = None
        for s in self.spots:
            d = TD.dist(s["x"], s["y"], x, y)
            if d < r and (free is None or (s["who"] is None) == free) and (best is None or d < best[0]):
                best = (d, s)
        return best[1] if best else None

    def rustle(self, s, dur=0.9, fake=False):
        s["rus"] = max(s["rus"], dur)
        s["peek"] = random.choice(("tail", "ears", "tail", "paw"))
        s["rus_at"] = self.t
        if not fake or random.random() < 0.7:
            self.add_fx("text", None, x=s["ix"], y=s["iy"], z=s["h"] + 20, text="沙沙…", small=True)

    def step_rustles(self, dt):
        sk = self.seeker_fi()
        for f in self.fighters:
            if f.role != "hide" or f.caught or f.spot is None:
                continue
            s = self.spots[f.spot]
            f.still = max(0.0, f.still - dt)
            f.hush = max(0.0, getattr(f, "hush", 0.0) - dt)
            near = sk is not None and TD.dist(sk.a.x, sk.a.y, s["x"], s["y"]) < 110
            f.rus_t -= dt * (2.0 if near else 1.0)
            if f.rus_t <= 0:
                lv = f.ctrl[3:] if f.ctrl.startswith("ai:") else "normal"
                f.rus_t = random.uniform(*{"easy": (7, 12), "normal": (11, 17), "hard": (14, 22)}.get(lv, (11, 17)))
                if f.still <= 0 and f.hush <= 0:
                    self.rustle(s)

    def enter_spot(self, fi, s):
        s["who"] = fi.uid
        fi.spot = s["id"]
        fi.a.x, fi.a.y = s["x"], s["y"]
        fi.a.hidden = True
        fi.disguise = 0.0
        fi.sneak = 0.0
        self.start(fi, "hidden", 99)
        fi.rus_t = random.uniform(8, 14)
        self.add_fx("poof", None, x=s["x"], y=s["y"], z=10)
        self.note(fi, "hid")

    def leave_spot(self, fi):
        if fi.spot is not None:
            s = self.spots[fi.spot]
            if s["who"] == fi.uid:
                s["who"] = None
            fi.spot = None
        fi.a.hidden = fi.sneak > 0 or fi.disguise > 0
        fi.still = 0.0
        self.start(fi, "idle", 0)
        self.note(fi, "unhid")

    def pop_out(self, fi, text):
        if fi.spot is not None:
            s = self.spots[fi.spot]
            s["glow"] = 1.2
            if s["who"] == fi.uid:
                s["who"] = None
        fi.spot = None
        fi.a.hidden = False
        fi.disguise = 0.0
        fi.sneak = 0.0
        if fi.st == "hidden":
            self.start(fi, "idle", 0)
        self.add_fx("text", fi, text=text)
        FA.burst(self, "star", fi.a.x, fi.a.y, 40, n=8, col="#ffd34c", col2="#ffffff", spd=180, g=200, dur=0.6, size=5,
                 side=False)

    def catch(self, sk, fi):
        if fi.caught:
            return
        fi.caught = True
        fi.caught_n = getattr(fi, "caught_n", 0) + 1
        self.pop_out(fi, "被找到了！")
        self.found += 1
        sk.score += 2
        self.note(sk, "catch")
        t = sk.__dict__.setdefault("tally", {})
        t["hits"] = t.get("hits", 0) + 1
        self.sound("mew" if fi.a.is_cat else "oof", fi)
        self.add_fx("text", sk, text="找到 %s 了！+2" % fi.a.name)
        fi.a.say(random.choice(["被发现了！", "哎呀！", "下次躲得更好"]) if not fi.a.is_cat else "喵！（被抓到了）", 1.6)
        if self.train is not None:
            # practice: the partner hides again in a moment
            fi.caught = False
            fi.data["rehide"] = 1.8
            return
        benches = [o.bench for o in self.fighters if o.bench is not None]
        k = 0
        while k in benches:
            k += 1
        fi.bench = k
        self.start(fi, "out", 99)
        fi.inv = 99

    # ---- balls (弹力球) ----------------------------------------------------------------------------------------
    def step_balls(self, dt):
        keep = []
        for b in self.balls:
            b["t"] += dt
            b["x"] += b["vx"] * dt
            b["y"] += b["vy"] * dt
            b["rot"] += dt * 12
            for s in self.spots:
                if s["id"] in b["hit"]:
                    continue
                if TD.dist(s["x"], s["y"], b["x"], b["y"]) < 46 or \
                        (abs(s["ix"] - b["x"]) < s["w"] / 2 and abs(s["iy"] - b["y"]) < 30):
                    b["hit"].append(s["id"])
                    if s["who"] is not None:
                        self.rustle(s, 1.4)
                        s["yelp"] = self.t
                        self.add_fx("text", None, x=s["ix"], y=s["iy"], z=s["h"] + 40, text="哎呀！")
            if b["t"] < 1.3 and 20 < b["x"] < H.PW - 20 and 20 < b["y"] < H.PD_PLACE - 10 and not self.blocked(b["x"], b["y"], 4):
                keep.append(b)
            else:
                self.add_fx("poof", None, x=b["x"], y=b["y"], z=8)
        self.balls = keep

    # ---- fighters ----------------------------------------------------------------------------------------------
    def step_fighter(self, fi, dt):
        self.tick(fi, dt)
        for k in ("disguise", "sneak", "radar", "outline"):
            setattr(fi, k, max(0.0, getattr(fi, k) - dt))
        inp = fi.inp
        pressed = inp["pressed"]
        mx, my, mn = self.stick(fi)
        st = fi.st
        if st == "out":
            # sitting on the bench along the front
            bx, by = 260.0 + (fi.bench or 0) * 90, 34.0
            d = TD.dist(bx, by, fi.a.x, fi.a.y)
            if d > 6:
                ux, uy = HB.norm(bx - fi.a.x, by - fi.a.y)
                self.physics(fi, dt, (ux * 220, uy * 220))
            else:
                fi.vx = fi.vy = 0.0
                fi.fx, fi.fy = 0.0, -1.0
            return
        if "rehide" in fi.data:
            fi.data["rehide"] -= dt
        sp = self.base_speed(fi) * (1.3 if fi.sneak > 0 else 1.0)
        if fi.role == "seek" and self.rphase in ("hide", "wait"):
            self.physics(fi, dt, (0.0, 0.0))
            return
        if st == "hidden":
            fi.vx = fi.vy = 0.0
            if "throw" in pressed and self.rphase != "reveal":
                self.leave_spot(fi)
            elif "skill" in pressed:
                self.use_skill(fi)
            return
        if fi.disguise > 0 and (mn > 0.1 or "jump" in pressed):
            fi.disguise = 0.0
            fi.a.hidden = fi.sneak > 0
            self.add_fx("poof", fi)
        want = self.common_states(fi, dt, sp, mx, my)
        if want is None:
            want = (0.0, 0.0)
            if st == "idle":
                want = (mx * sp, my * sp)
                if mn > 0.1:
                    fi.fx, fi.fy = mx, my
                if self.rphase == "reveal":
                    pass
                elif self.try_roll(fi, mx, my, mn, cd=0.9):
                    pass
                elif self.try_jump(fi):
                    pass
                elif "skill" in pressed:
                    self.use_skill(fi)
                elif fi.role == "hide" and "throw" in pressed:
                    s = self.spot_near(fi.a.x, fi.a.y, 60, free=True)
                    if s is not None:
                        self.enter_spot(fi, s)
                    elif self.spot_near(fi.a.x, fi.a.y, 60) is not None:
                        self.tell(fi, "这里已经有人了")
                    else:
                        self.tell(fi, "走到家具旁边再按 E")
                elif fi.role == "seek" and "atk" in pressed and self.rphase == "seek":
                    self.seek_press(fi)
                elif fi.role == "hide" and "atk" in pressed:
                    self.tell(fi, "你是躲的人：按 E 躲进家具")
                elif fi.role == "seek" and "throw" in pressed:
                    self.tell(fi, "你是找的人：按 J 搜家具")
            elif st == "search":
                if fi.t >= fi.dur:
                    self.search_done(fi)
            elif st in ("skill", "grab"):
                want = (mx * sp * 0.5, my * sp * 0.5)
                if fi.t >= fi.dur:
                    self.start(fi, "idle", 0)
        self.physics(fi, dt, want)
        if fi.role == "hide" and not fi.caught:
            fi.a.hidden = fi.sneak > 0 or fi.disguise > 0 or fi.spot is not None

    def seek_press(self, fi):
        # someone out in the open (or a "plush" that is really a hider)
        best = None
        for o in self.fighters:
            if o.role != "hide" or o.caught or o.spot is not None:
                continue
            if o.sneak > 0:
                continue
            d = TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y)
            if d < 56 and (best is None or d < best[0]):
                best = (d, o)
        if best is not None:
            o = best[1]
            self.face_to(fi, o.a.x, o.a.y)
            self.start(fi, "grab", 0.3)
            self.add_fx("swing", fi, r=50, z=fi.z + 20)
            self.catch(fi, o)
            if o.disguise > 0:
                self.add_fx("text", o, text="原来这只玩偶是你！")
            return
        s = self.spot_near(fi.a.x, fi.a.y, 72)
        if s is None:
            self.tell(fi, "走到家具旁边再按 J 搜")
            self.start(fi, "grab", 0.25)
            return
        self.face_to(fi, s["ix"], s["iy"])
        self.start(fi, "search", 0.6)
        fi.data["spot"] = s["id"]
        s["rus"] = max(s["rus"], 0.45)
        self.note(fi, "search")

    def search_done(self, fi):
        s = self.spots[fi.data.get("spot", 0)]
        s["searched"] = self.t
        self.start(fi, "idle", 0)
        if s["decoy"] > 0:
            s["decoy"] = 0.0
            self.add_fx("text", fi, text="是一件外套！被骗了")
            self.start(fi, "dizzy", 1.0)
            return
        o = next((f for f in self.fighters if f.uid == s["who"]), None)
        if o is None:
            self.add_fx("text", None, x=s["ix"], y=s["iy"], z=s["h"] + 20, text="这里没人……", small=True)
            return
        if o.still > 0:
            o.still = 0.0
            self.add_fx("text", None, x=s["ix"], y=s["iy"], z=s["h"] + 20, text="这里没人……", small=True)
            return
        self.catch(fi, o)

    # ---- skills ------------------------------------------------------------------------------------------------
    def use_skill(self, fi):
        if self.rphase not in ("seek", "hide") or (fi.role == "seek" and self.rphase != "seek"):
            return
        if fi.cds["k"] > 0:
            self.tell(fi, "技能冷却中")
            return
        sks = HG.SKILLS["hide"][fi.char]
        sk = sks[0] if fi.role == "hide" else sks[1]
        name = sk["key"]
        ok = True
        if name == "disguise":
            if fi.spot is not None:
                self.tell(fi, "先从家具里出来")
                ok = False
            else:
                fi.disguise = 10.0
                fi.a.hidden = True
                fi.data["plush"] = random.choice(("bunny", "bear", "duck"))
                self.add_fx("poof", fi)
        elif name == "still":
            if fi.spot is None:
                self.tell(fi, "躲进家具里才能用")
                ok = False
            else:
                fi.still = 11.0
        elif name == "decoy":
            free = [s for s in self.spots if s["who"] is None and s["decoy"] <= 0]
            # the coat goes somewhere away from you (closest to the seeker), to lead them off
            far = [s for s in free if TD.dist(s["x"], s["y"], fi.a.x, fi.a.y) > 240] or free
            seeker = self.seeker_fi()
            if far:
                s = min(far, key=lambda s: TD.dist(s["x"], s["y"], seeker.a.x, seeker.a.y)) if seeker is not None \
                    else random.choice(far)
                s["decoy"] = 25.0
                self.rustle(s, 0.8, fake=True)
                fi.hush = 12.0                    # and you keep very quiet meanwhile
            else:
                ok = False
        elif name == "sneak":
            if fi.spot is not None:
                self.leave_spot(fi)
            fi.sneak = 3.0
            fi.a.hidden = True
            self.add_fx("poof", fi)
        elif name == "noise":
            free = [s for s in self.spots if s["who"] is None]
            random.shuffle(free)
            for k, s in enumerate(free[:3]):
                s["noise"] += [0.4 + k * 0.9, 4.5 + k * 1.1]       # they ring twice
            fi.hush = 10.0
        elif name == "radar":
            fi.radar = 2.0
        elif name == "hiss":
            for o in self.fighters:
                if o.role == "hide" and not o.caught and o.spot is not None and \
                        TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y) < 240:
                    self.rustle(self.spots[o.spot], 1.3)
            self.add_fx("hiss", fi)
            self.add_fx("ringz", None, x=fi.a.x, y=fi.a.y, z=10, r=240, col="#b38ae0", dur=0.45)
        elif name == "flash":
            fi.data["flash"] = 0.6
            for o in self.fighters:
                if o.role != "hide" or o.caught:
                    continue
                dx, dy = o.a.x - fi.a.x, o.a.y - fi.a.y
                d = math.hypot(dx, dy)
                if d < 320 and (d < 30 or (dx * fi.fx + dy * fi.fy) / d > math.cos(math.radians(36))):
                    o.outline = 1.6
        elif name == "dinner":
            for o in self.fighters:
                # the cats can't help it; people only sometimes give themselves away
                if o.role == "hide" and not o.caught and o.spot is not None and (o.a.is_cat or random.random() < 0.35):
                    self.rustle(self.spots[o.spot], 1.2)
                    if o.a.is_cat:
                        self.add_fx("text", None, x=o.a.x, y=o.a.y, z=70, text="开饭？！", small=True)
            fi.a.say("开饭啦——！", 1.6)
        elif name == "ball":
            self.balls.append({"x": fi.a.x + fi.fx * 20, "y": fi.a.y + fi.fy * 16, "vx": fi.fx * 430,
                               "vy": fi.fy * 360, "t": 0.0, "rot": 0.0, "hit": []})
        if ok:
            fi.cds["k"] = sk["cd"]
            if fi.st != "hidden":
                self.start(fi, "skill", 0.3)
            self.add_fx("skillname", fi, text=sk["icon"] + " " + sk["name"], color=HG.CHARS[fi.char]["color"])
            self.sound("whoosh")
            self.note(fi, "skill_hide" if fi.role == "hide" else "skill_seek")
            self.note(fi, "skill")

    # ---- poses -------------------------------------------------------------------------------------------------
    def pose(self, fi):
        st = fi.st
        if st == "count":
            fi.a.facing = 1
            self.tpose(fi, "sit", rig=FA.R["block"], view="back")
            if not fi.a.is_cat:
                fi.a.pose, fi.a.rig, fi.a.view = "stand", None, "back"
            return
        if st == "out":
            moving = math.hypot(fi.vx, fi.vy) > 20
            self.tpose(fi, "run" if moving else "sit", "run" if moving else "stand",
                       view="side" if moving else "front")
            return
        if self.base_pose(fi):
            return
        if st == "search":
            self.tpose(fi, "f_swat", rig=FA.R["grab"], fu=(fi.t * 3) % 1.0)
        elif st == "grab":
            self.tpose(fi, "f_leap", rig=FA.R["grab"])
        elif st == "skill":
            self.tpose(fi, "f_hiss", rig=FA.R["throw"])
        elif st == "hidden":
            self.tpose(fi, "crouch")
        else:
            self.tpose(fi, "stand")

    def celebrate(self, fi, dt):
        if fi.st == "out" or fi.caught:
            fi.st = "idle"
        super().celebrate(fi, dt)

    # ---- network -----------------------------------------------------------------------------------------------
    def net_extra(self):
        return {"spots": [{"x": s["x"], "y": s["y"], "ix": s["ix"], "iy": s["iy"], "h": s["h"], "w": s["w"],
                           "name": s["name"], "type": s["type"], "occ": s["who"] is not None,
                           "who": s["who"], "rus": round(s["rus"], 2), "peek": s["peek"], "glow": round(s["glow"], 2),
                           "decoy": s["decoy"] > 0} for s in self.spots],
                "rphase": self.rphase, "rtimer": round(self.rtimer, 1), "rnd": self.rnd, "rounds": self.rounds,
                "seeker": self.seeker,
                "balls": [{"x": round(b["x"]), "y": round(b["y"]), "rot": round(b["rot"], 1)} for b in self.balls]}

    def fighter_extra(self, fi):
        return {"cds": {"k": round(fi.cds["k"], 1)}, "role": fi.role, "spot": fi.spot, "caught": fi.caught,
                "disguise": round(fi.disguise, 1), "sneak": round(fi.sneak, 1), "radar": round(fi.radar, 1),
                "outline": round(fi.outline, 1), "still": round(fi.still, 1), "hidden": bool(fi.a.hidden),
                "data": {"plush": fi.data.get("plush"), "flash": fi.data.get("flash", 0)}}

    # ---- tutorial ----------------------------------------------------------------------------------------------
    def train_prepare(self, key, me):
        if me is None:
            return
        mate = next((f for f in self.fighters if f is not me), None)
        if key == "search":
            # swap: the trainee seeks now, the partner hides
            for f in (me, mate):
                if f is None:
                    continue
                if f.spot is not None or f.a.hidden:
                    self.pop_out(f, "")
                f.disguise = f.sneak = 0.0
            me.role, me.cds["k"] = "seek", 0.0
            self.seeker = me.uid
            if mate is not None:
                mate.role = "hide"
                mate.caught = False
                mate.data["rehide"] = 0.0

    def step_train(self, dt):
        super().step_train(dt)

    def make_ai(self, fi):
        return HideTrainAI(self, fi) if self.train is not None else HideAI(self, fi)


HideBattle.TRAIN_STEPS = [
    ("hide", "你先来躲！走到一件家具旁边（衣柜、床、纸箱都行），按 E 躲进去", "E", "hid", "躲进去"),
    ("out", "躲进去以后谁也看不见你。再按一次 E 从家具里出来", "E", "unhid", "出来"),
    ("hskill", "按 K：躲的技能「{k}」——{desc}", "K", "skill_hide", "躲的技能"),
    ("search", "现在换你来找！走到任意一件家具旁边，按 J 搜一搜", "J", "search", "搜家具"),
    ("catch", "陪练躲起来了！家具会时不时动一下、露出尾巴：找到他，按 J 搜", "J", "catch", "找到他"),
    ("sskill", "按 K：找人的技能「{k2}」——{desc2}", "K", "skill_seek", "找的技能"),
]


# ======================================================================================================== AI
class HideAI:
    def __init__(self, b, fi):
        self.b = b
        self.fi = fi
        lv = fi.ctrl[3:] if str(fi.ctrl).startswith("ai:") else b.diff
        self.lvname = lv
        self.lv = TD.level_of(fi, b)
        self.steer = TD.Steer(b, fi)
        self.goal = None
        self.think = 0.0
        self.heard = {}
        self.rolled = {}
        self.bolt_t = 0.0

    def step(self, dt):
        b, fi = self.b, self.fi
        TD.clear_inputs(fi)
        if fi.st not in ("idle", "hidden") or fi.caught or b.rphase in ("wait", "reveal"):
            return
        if fi.role == "hide":
            self.hide(dt)
        elif b.rphase == "seek":
            self.seek(dt)

    # -- hiding
    def pick_spot(self):
        b, fi = self.b, self.fi
        sk = b.seeker_fi()
        taken = {o.ai.goal for o in b.fighters if o is not fi and getattr(o, "ai", None) is not None and
                 isinstance(o.ai, HideAI) and o.ai.goal is not None}
        free = [s for s in b.spots if s["who"] is None and s["id"] not in taken]
        if not free:
            return None
        sx, sy = (sk.a.x, sk.a.y) if sk is not None else SEEK_HOME
        free.sort(key=lambda s: -TD.dist(s["x"], s["y"], sx, sy))
        if self.lvname == "easy":
            free.sort(key=lambda s: TD.dist(s["x"], s["y"], fi.a.x, fi.a.y))
            pool = free[:3]
        elif self.lvname == "hard":
            pool = free[:max(2, int(len(free) * 0.4))]
        else:
            pool = free[:max(2, int(len(free) * 0.7))]
        return random.choice(pool)["id"]

    def hide(self, dt):
        b, fi = self.b, self.fi
        inp = fi.inp
        sk = b.seeker_fi()
        name = HG.SKILLS["hide"][fi.char][0]["key"]
        if fi.spot is not None:
            self.goal = fi.spot
            if b.rphase != "seek" or sk is None:
                return
            s = b.spots[fi.spot]
            d = TD.dist(sk.a.x, sk.a.y, s["x"], s["y"])
            if fi.cds["k"] <= 0 and random.random() < self.lv["skill"] * dt * 2:
                if (name == "still" and d < 150) or (name == "noise" and d < 360) or (name == "decoy") or \
                        (name == "sneak" and d < 130):
                    inp["pressed"].add("skill")
                    if name == "sneak":
                        self.goal = None
                    return
            # the seeker is searching right next to me: make a run for it
            searching = sk.st == "search" and sk.data.get("spot") != fi.spot and d < 140
            if searching and random.random() < self.lv["smart"] * 0.25 * dt * 10:
                inp["pressed"].add("throw")
                self.goal = None
            return
        if self.goal is None or b.spots[self.goal]["who"] not in (None, fi.uid):
            self.goal = self.pick_spot()
        if fi.disguise > 0:
            if sk is None or TD.dist(sk.a.x, sk.a.y, fi.a.x, fi.a.y) > 90:
                return                                   # keep still
        if sk is not None and b.rphase == "seek" and name == "disguise" and fi.cds["k"] <= 0 and \
                TD.dist(sk.a.x, sk.a.y, fi.a.x, fi.a.y) < 200 and fi.disguise <= 0:
            inp["pressed"].add("skill")
            return
        if self.goal is None:
            return
        s = b.spots[self.goal]
        if TD.dist(s["x"], s["y"], fi.a.x, fi.a.y) < 30:
            inp["pressed"].add("throw")
        else:
            self.steer.go(s["x"], s["y"], dt, stop=6)

    # -- seeking
    def seek(self, dt):
        b, fi = self.b, self.fi
        inp = fi.inp
        notice = NOTICE.get(self.lvname, 0.65)
        # someone out in the open
        best = None
        for o in b.fighters:
            if o.role != "hide" or o.caught or o.spot is not None or o.sneak > 0:
                continue
            if o.disguise > 0 and not (TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y) < 160 and random.random() < notice * dt * 2):
                continue
            d = TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y)
            if d < 420 and (best is None or d < best[0]):
                best = (d, o)
        if best is not None:
            o = best[1]
            if best[0] < 50:
                inp["pressed"].add("atk")
            else:
                self.steer.go(o.a.x + o.vx * 0.2, o.a.y + o.vy * 0.2, dt, stop=4)
            return
        name = HG.SKILLS["hide"][fi.char][1]["key"]
        if fi.cds["k"] <= 0 and random.random() < self.lv["skill"] * dt * (3 if name in ("flash", "ball") else 1):
            if name in ("flash", "ball"):
                # aim it: at the furniture I am heading for, from a little way off
                s = b.spots[self.goal] if self.goal is not None else None
                if s is not None and 70 < TD.dist(s["x"], s["y"], fi.a.x, fi.a.y) < 300:
                    b.face_to(fi, s["x"], s["y"])
                    inp["pressed"].add("skill")
                    return
            else:
                inp["pressed"].add("skill")
                return
        # a yelp from a bouncy ball, an outline in the torch light: certain
        for s in b.spots:
            if b.t - s.get("yelp", -99.0) < 2.0:
                if s["id"] not in self.heard:
                    self.think = 0.0
                self.heard[s["id"]] = b.t
        for o in b.fighters:
            if o.role == "hide" and not o.caught and o.spot is not None and o.outline > 0:
                if o.spot not in self.heard:
                    self.think = 0.0
                self.heard[o.spot] = b.t
        # the rustles I noticed
        for s in b.spots:
            if s["rus"] > 0 and self.rolled.get(s["id"]) != s["rus_at"]:
                self.rolled[s["id"]] = s["rus_at"]             # one look per rustle
                # a rustle far away is easier to miss
                d = TD.dist(s["x"], s["y"], fi.a.x, fi.a.y)
                if random.random() < notice * (1.0 if d < 250 else 0.6):
                    self.heard[s["id"]] = b.t
        for k in list(self.heard):
            if b.t - abs(self.heard[k]) > 6:
                del self.heard[k]
        self.think -= dt
        if self.goal is None or self.think <= 0 or b.t - b.spots[self.goal]["searched"] < 0.6:
            self.think = 2.5
            best = None
            for s in b.spots:
                d = TD.dist(s["x"], s["y"], fi.a.x, fi.a.y)
                memory = {"easy": 6.0, "normal": 14.0, "hard": 40.0}.get(self.lvname, 14.0)
                score = d + (500 if b.t - s["searched"] < memory else 0) - (600 if self.heard.get(s["id"], -1) > 0 else 0)
                score += random.uniform(0, 300)
                if fi.radar > 0:
                    pass
                if best is None or score < best[0]:
                    best = (score, s["id"])
            self.goal = best[1] if best else None
        # 雷达: head toward the arrow
        if fi.radar > 0:
            tgt = min((o for o in b.fighters if o.role == "hide" and not o.caught),
                      key=lambda o: TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y), default=None)
            if tgt is not None and tgt.spot is not None:
                self.goal = tgt.spot
        if self.goal is None:
            return
        s = b.spots[self.goal]
        if TD.dist(s["x"], s["y"], fi.a.x, fi.a.y) < 46:
            b.face_to(fi, s["ix"], s["iy"])
            inp["pressed"].add("atk")
            self.heard.pop(s["id"], None)
            self.think = 0.0
        else:
            self.steer.go(s["x"], s["y"], dt, stop=8)


class HideTrainAI(HideAI):
    """The partner: while you learn to hide it just wanders; then it hides (and fidgets a lot)."""

    def step(self, dt):
        b, fi = self.b, self.fi
        TD.clear_inputs(fi)
        tr = b.train
        if tr is None or tr["i"] >= len(b.TRAIN_STEPS):
            return
        if fi.role == "seek":
            self.steer.go(630, 200, dt, stop=20, slow=60)
            fi.inp["dx"] *= 0.4
            fi.inp["dy"] *= 0.4
            return
        if fi.data.get("rehide", 0) > 0:
            return
        if fi.spot is not None:
            fi.rus_t = min(fi.rus_t, 3.0)
            return
        self.hide(dt)
