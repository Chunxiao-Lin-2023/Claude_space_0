"""The house as a home: weather outside, meals, wear and chores, the family passing on reminders,
and the small sounds of it all.

* Weather: snow builds up in the garden while it snows (with footprints) and melts afterwards; rain and
  snow show on the windows (house_art.draw_window_weather); umbrellas and scarves outside.
* Meals: when the cooking is done the cook carries the dish to the table and calls everyone; the dishes
  empty as people eat, a morsel sometimes drops for a waiting cat, and someone clears up and washes.
* Wear: the scratcher gets clawed up, the litter box needs scooping, plants dry out. The grown-ups
  notice and fix it (``start_chore``).
* Reminders: when a cat brings a to-do or reminder, a family member comes over and says it too.

Mixed into ``house.World`` (``HomeWorld``).
"""

import math
import random

from . import house_art as H

LINES = {
    "serve": ["开饭啦！", "吃饭咯～快来", "菜好了，洗手吃饭！", "今天做了好吃的"],
    "come_eat": ["来了来了！", "好香啊", "我饿坏了"],
    "clear": ["我来收拾吧", "收碗收碗", "吃饱了，洗碗去"],
    "morsel_kid": ["偷偷给你一块～", "嘘，别告诉妈妈", "给你尝尝"],
    "scoop": ["铲屎官上岗！", "来，铲一铲", "干干净净～"],
    "scratcher": ["给你们换个新的猫抓板～", "这个都被抓烂啦", "新猫抓板！"],
    "water": ["喝水啦", "叶子都蔫了，快浇浇", "多喝点水～"],
    "relay": ["{u}，{t}", "{u}～{t}", "提醒你一下：{t}"],
}
CAT_LINES_HOME = {
    "morsel": ["好吃！", "掉下来的就是我的", "喵呜（吧唧吧唧）"],
    "beg_table": ["给我一口嘛", "（盯——）", "我也要吃"],
    "litter_dirty": ["该铲屎了喵", "这个……不太干净", "喵！（嫌弃）"],
    "rain": ["下雨了……", "雨点在敲窗户", "今天不出门了喵"],
    "snow": ["下雪了！白白的", "外面好冷的样子", "雪花飘飘"],
}
MEAL_HOURS = [(6.0, 9.5), (10.5, 13.8), (16.5, 20.5)]


def pick(lines, **fmt):
    try:
        return random.choice(lines).format(**fmt)
    except (KeyError, IndexError):
        return random.choice(lines)


class HomeWorld:
    def init_home(self):
        self.snow = 0.0
        self.prints = []                 # footprints in the snow: [x, y, age]
        self.home_t = 0.0
        self.sfx_at = {}
        self.relay_t = -1e9
        if not self.remote:
            self.load_wear()

    # ---- persistence of wear (so a worn scratcher stays worn) --------------------------------------------
    WEAR_KEYS = ("wear", "dirty", "water")

    def load_wear(self):
        conf = self.app.cfg["house"].get("wear")
        if not isinstance(conf, dict):
            return
        for k, v in conf.items():
            try:
                idx = int(k)
            except ValueError:
                continue
            if 0 <= idx < len(self.items) and isinstance(v, dict):
                for key in self.WEAR_KEYS:
                    if isinstance(v.get(key), (int, float)):
                        self.items[idx].state[key] = float(v[key])

    def save_wear(self):
        if self.remote:
            return
        out = {}
        for i, it in enumerate(self.items):
            d = {k: round(float(it.state[k]), 3) for k in self.WEAR_KEYS if k in it.state}
            if d:
                out[str(i)] = d
        self.app.cfg["house"]["wear"] = out
        self.app.save()

    # ---- sounds -------------------------------------------------------------------------------------------
    def sfx(self, name, gap=8.0):
        if self.remote:
            return
        t = self.t
        if t - self.sfx_at.get(name, -1e9) < gap:
            return
        self.sfx_at[name] = t
        try:
            if self.house is not None and not self.house.isVisible():
                return
            self.app.play_sound(name)
        except Exception:
            pass

    # ---- every frame ---------------------------------------------------------------------------------------
    def step_home(self, dt):
        wx = self.weather()
        if wx == "snow":
            self.snow = min(1.0, self.snow + dt / 900.0)
        elif self.snow > 0:
            self.snow = max(0.0, self.snow - dt / (400.0 if wx == "hot" else 2400.0))
        for pr in self.prints:
            pr[2] += dt
        self.prints = [pr for pr in self.prints if pr[2] < 90] if self.prints else self.prints
        self.home_t += dt
        if self.home_t < 0.5:
            return
        step = self.home_t
        self.home_t = 0.0
        # footprints
        if self.snow > 0.15:
            for a in self.agents():
                if a.f == 2 and not a.away and a.stairs_u is None and a.h < 1 and (a.path or a.state == "chase"):
                    last = getattr(a, "_print_at", None)
                    if last is None or math.hypot(last[0] - a.x, last[1] - a.y) > (9 if a.is_cat else 14):
                        side = getattr(a, "_print_side", 1)
                        a._print_side = -side
                        a._print_at = (a.x, a.y)
                        self.prints.append([a.x, a.y + side * (2 if a.is_cat else 3), 0.0])
            if len(self.prints) > 160:
                self.prints = self.prints[-160:]
        # plants dry out indoors; rain waters the garden
        for it in self.items:
            if it.type in ("plant", "flowers", "flower_bed"):
                w = float(it.state.get("water", 1.0))
                if it.f == 2 and wx in ("rain", "snow"):
                    w = min(1.0, w + step / 200.0)
                else:
                    w = max(0.0, w - step / (5 * 3600.0 if it.f != 2 else 3 * 3600.0))
                it.state["water"] = w
        self.wear_save_t = getattr(self, "wear_save_t", 0.0) + step
        if self.wear_save_t > 120:
            self.wear_save_t = 0.0
            self.save_wear()
        # quiet household sounds
        if wx == "rain" and random.random() < step / 70.0:
            self.sfx("rain", 40)
        sleepers = [p for p in self.present_people() if p.act == "sleep"]
        if sleepers and random.random() < step / 90.0:
            self.sfx("snore", 60)
        if any(it.state.get("on") for it in self.items_of("tv")) and random.random() < step / 50.0:
            self.sfx("tv", 30)

    # ---- meals ---------------------------------------------------------------------------------------------
    def dinner_table(self, f=None):
        tables = self.items_of("table")
        if not tables:
            return None
        if f is not None:
            same = [t for t in tables if t.f == f]
            if same:
                return same[0]
        return tables[0]

    def start_serve(self, pr):
        """The cooking is done: carry the dish to the table and call everyone."""
        h = self.hour()
        if not any(a <= h < b for a, b in MEAL_HOURS):
            return False
        table = self.dinner_table(pr.f)
        if table is None or table.state.get("meal"):
            return False
        x0, y0, x1, y1 = table.fp()
        tx, ty = self.stand_near(table.f, table.x, y0 - 6)
        pr.release_spot()
        pr.act = "serve"
        pr.prop = "dish"
        pr.set_state("act", 60)

        def arrive():
            pr.facing = 1 if table.x >= pr.x else -1
            pr.view = "back"
            table.state["meal"] = {"left": 1.0, "t": self.t, "kind": random.randint(0, 3)}
            pr.prop = None
            pr.say(pick(LINES["serve"]), 2.4)
            self.sfx("dishes", 5)
            pr.set_state("act", 3.0)
            pr.act = "serve"
            for o in self.present_people():
                if o is pr or o.ctrl is not None or o.act in ("sleep", "eat", "going:eat") or o.away:
                    continue
                if o.state == "idle" or (o.state == "act" and o.act in ("wander", "tv", "read", "phone", "play",
                                                                        "homework", "laptop", "nap", "bench")):
                    o.stop()
                    if o.state == "act":
                        o.end_act()
                    if o.start_act("eat") and random.random() < 0.5:
                        o.say(pick(LINES["come_eat"]), 1.8, delay=0.8)
            # the cook eats too
            self.later(1.2, lambda: pr.state == "act" and pr.act == "serve" and (pr.end_act(), pr.start_act("eat")))
        if not pr.go(table.f, tx, ty, 0, False, arrive):
            pr.end_act()
            return False
        return True

    def later(self, delay, fn):
        self.timers = getattr(self, "timers", [])
        self.timers.append((self.t + delay, fn))

    def run_timers(self):
        ts = getattr(self, "timers", None)
        if not ts:
            return
        due = [x for x in ts if x[0] <= self.t]
        self.timers = [x for x in ts if x[0] > self.t]
        for _, fn in due:
            try:
                fn()
            except Exception:
                pass

    def eat_tick(self, pr, dt):
        """Someone eating at the table: the food goes down; a morsel may drop for the cat."""
        it = self.item_by_id(pr.spot[0]) if pr.spot else None
        if it is None or it.type != "table":
            return
        meal = it.state.get("meal")
        if not meal or meal.get("dirty"):
            return
        meal["left"] = max(0.0, float(meal.get("left", 1.0)) - dt * 0.0045)
        beggar = next((c for c in self.cats if c.state == "rest" and c.data.get("beg_for") == pr.uid), None)
        chance = 0.05 if (pr.role == "kid" and beggar is not None) else 0.008
        if random.random() < dt * chance:
            side = random.choice((-1, 1))
            self.spawn_drop(pr.f, pr.x + side * 8, pr.y - 6, 30.0, "morsel", side * 20)
            if pr.role == "kid" and beggar is not None:
                pr.say(pick(LINES["morsel_kid"]), 2.0)

    def meal_done(self, pr, table):
        meal = table.state.get("meal") if table is not None else None
        if not meal:
            return
        others = [o for o in self.people if o is not pr and o.act in ("eat", "going:eat")
                  and (o.act == "going:eat" or (o.spot and o.spot[0] == table.id))]
        if not others:
            meal["dirty"] = True              # everyone has finished: the plates wait to be cleared
            meal["left"] = 0.0

    def morsel_on_floor(self, f):
        return [d for d in self.drops if d.get("kind") == "morsel" and d["z"] < 6 and d["f"] == f]

    # ---- chores --------------------------------------------------------------------------------------------
    def chore_weights(self, pr):
        """Extra things a grown-up might decide to do: [(weight, name)]."""
        out = []
        for it in self.items_of("litter"):
            d = float(it.state.get("dirty", 0.0))
            if d > 0.5:
                out.append((3 + 6 * d, "scoop"))
                break
        for it in self.items_of("scratcher"):
            if float(it.state.get("wear", 0.0)) > 0.85:
                out.append((2.5, "fix_scratcher"))
                break
        if any((t.state.get("meal") or {}).get("dirty") for t in self.items_of("table")):
            out.append((7.0, "clear"))
        return out

    def thirst_max(self):
        best = 0.0
        outdoor = self.outdoor_ok()
        for it in self.items:
            if it.type in ("plant", "flowers", "flower_bed") and (it.f != 2 or outdoor):
                best = max(best, 1.0 - float(it.state.get("water", 1.0)))
        return best

    def start_chore(self, pr, name):
        if name == "scoop":
            its = sorted(self.items_of("litter"), key=lambda i: -float(i.state.get("dirty", 0)))
            if not its:
                return False
            it = its[0]
            return self._chore_at(pr, it, "scoop", 4.0, "crouch", "scoop", lambda: (
                it.state.__setitem__("dirty", 0.0), pr.say(pick(LINES["scoop"]), 2.0), self.save_wear()))
        if name == "fix_scratcher":
            its = sorted(self.items_of("scratcher"), key=lambda i: -float(i.state.get("wear", 0)))
            if not its:
                return False
            it = its[0]
            return self._chore_at(pr, it, "fix_scratcher", 3.0, "crouch", None, lambda: (
                it.state.__setitem__("wear", 0.0), pr.say(pick(LINES["scratcher"]), 2.2), self.save_wear()))
        if name == "clear":
            tables = [t for t in self.items_of("table") if (t.state.get("meal") or {}).get("dirty")]
            if not tables:
                return False
            table = tables[0]

            def done():
                table.state.pop("meal", None)
                self.sfx("dishes", 4)
                pr.say(pick(LINES["clear"]), 2.0)
                pr.prop = "plates"
                key, sp = pr.find_spot(("counter",), "wash")
                pr.act = "idle"
                if key is not None:
                    pr.go_do(key, sp, "wash", random.uniform(20, 40), "cook", None, "wash")
                else:
                    pr.prop = None
                    pr.end_act()
            return self._chore_at(pr, table, "clear", 2.0, "stand", None, done, keep_going=True)
        return False

    def _chore_at(self, pr, it, act, dur, pose, prop, done, keep_going=False):
        x0, y0, x1, y1 = it.fp()
        tx, ty = self.stand_near(it.f, it.x, y0 - 8)
        pr.stop()
        if pr.state == "act":
            pr.end_act()
        pr.release_spot()
        pr.act = act
        pr.set_state("act", 90)

        def arrive():
            pr.facing = 1 if it.x >= pr.x else -1
            pr.view = "side" if pose != "stand" else "back"
            pr.pose, pr.prop = pose, prop
            pr.act = act
            pr.set_state("act", dur)
            pr.data["chore_done"] = done
            pr.data["chore_keep"] = keep_going
        if not pr.go(it.f, tx, ty, 0, False, arrive):
            pr.end_act()
            return False
        return True

    # ---- reminders -----------------------------------------------------------------------------------------
    def family_relay(self, text, reason, cat=None):
        """A to-do / reminder brought by a cat: a family member comes along and says it as well."""
        if self.remote or not text or reason not in ("todo", "reminder", "remind", "msg"):
            return False
        if self.t - self.relay_t < 45:
            return False
        h = self.hour()
        cands = [p for p in self.present_people() if p.ctrl is None and p.act != "sleep" and not p.asleep_at(h)
                 and p.state in ("idle", "act") and getattr(p, "hold", None) is None
                 and p.act not in ("going_out", "return", "serve", "clear")]
        if not cands:
            return False
        if cat is not None:
            cands.sort(key=lambda p: (p.f != cat.f, math.hypot(p.x - cat.x, p.y - cat.y)))
        pr = cands[0]
        self.relay_t = self.t
        short = text if len(text) <= 22 else text[:21] + "…"
        line = pick(LINES["relay"], u=self.app.title_for(), t=short)
        pr.stop()
        if pr.state == "act":
            pr.end_act()
        pr.release_spot()
        f = cat.f if cat is not None else pr.f
        x, y = self.front_spot(f, (cat.x + 46) if cat is not None else pr.x)
        pr.act = "relay"
        pr.set_state("act", 40)

        def arrive():
            pr.view = "front"
            pr.pose = "wave"
            pr.act = "relay"
            pr.say(line, 4.0)
            pr.set_state("act", 4.5)
        if not pr.go(f, x, y, 0, False, arrive):
            pr.say(line, 4.0, delay=3.0)
            pr.end_act()
        return True
