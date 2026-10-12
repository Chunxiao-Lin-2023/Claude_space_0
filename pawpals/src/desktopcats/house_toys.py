# -*- coding: utf-8 -*-
"""The plush toys can leave their castle shelf: people carry them around, hug them in bed, put them on a
sofa, a bed, a table or the floor; the kid sometimes takes one along, and a grown-up tidies them back now
and then. Mixed into World (house.py).

A toy's place is one of
    {"at": "castle"}                                          on its shelf spot in the (first) castle
    {"at": "held", "by": uid}                                 in someone's arms
    {"at": "item", "item": id, "u": u, "v": v, "z": z}       on a piece of furniture (item coordinates)
    {"at": "floor", "f": f, "x": x, "y": y}                   on the floor"""

import math
import random

from . import house_art as H

NAMES = [n for n, k, c in H.PLUSHIES]
KIND = {n: (k, c) for n, k, c in H.PLUSHIES}

# where a toy can sit on each piece of furniture: (u, v, z) in item coordinates
SURFACES = {
    "bed": [(-30, 48, 36), (30, 48, 36), (-36, -44, 35), (36, -44, 35)],
    "kid_bed": [(-14, 48, 36), (16, -24, 35)],
    "sofa": [(-52, -6, 33), (52, -6, 33), (-20, 17, 60)],
    "armchair": [(-25, -6, 40), (25, -6, 40)],
    "window_seat": [(-26, -3, 35), (26, -3, 35)],
    "cat_bed": [(0, 0, 11)],
    "desk": [(-26, 26, 52)],
    "table": [(-22, -8, 53), (22, -8, 53)],
    "toy_box": [(-8, 0, 30), (10, 0, 30)],
    "bookshelf": [(-2, 0, 124)],
    "wardrobe": [(0, 0, 132)],
    "shoe_cabinet": [(-16, 0, 46)],
    "tv": [(-28, 2, 32)],
    "counter": [(22, -8, 58)],
    "washer": [(0, 0, 60)],
    "fridge": [(0, 0, 118)],
    "window_seat_": [],
    "rug": [(-44, -12, 1), (44, 12, 1)],
    "bench": [(-40, 0, 26), (38, 0, 26)],
    "picnic": [(-34, 22, 1), (34, -20, 1)],
    "sandbox": [(-20, 12, 4)],
    "cat_house": [(0, 0, 58)],
    "box": [(0, 0, 30)],
}
REACH = 85.0
HOLD_TIME = 360.0   # seconds a family member (not a player) keeps carrying a toy
PICK_LINES = ["抱抱{t}～", "{t}，跟我走吧", "找到{t}啦", "{t}软软的"]
PUT_LINES = ["{t}乖乖坐好", "{t}在这里等我哦", "放这里好看吗？"]
TIDY_LINES = ["{t}，回城堡咯", "我把{t}放回去～", "玩具要收好"]
BED_LINES = ["抱着{t}睡觉～", "{t}晚安"]


class PlushWorld:
    # ---- setup / saving --------------------------------------------------------------------------
    def init_plush(self):
        self.plush = {n: {"at": "castle"} for n in NAMES}
        self.plush_check_t = 0.0
        if not self.remote:
            self.load_plush()
        self.sync_plush()

    def load_plush(self):
        conf = self.app.cfg["house"].get("plush_pos")
        if not isinstance(conf, dict):
            return
        for name, v in conf.items():
            if name not in self.plush or not isinstance(v, list) or not v:
                continue
            try:
                if v[0] == "item" and 0 <= int(v[1]) < len(self.items):
                    it = self.items[int(v[1])]
                    self.plush[name] = {"at": "item", "item": it.id, "u": float(v[2]), "v": float(v[3]),
                                        "z": float(v[4])}
                elif v[0] == "floor" and int(v[1]) in (0, 1, 2):
                    self.plush[name] = {"at": "floor", "f": int(v[1]), "x": H.mx(float(v[2])), "y": float(v[3])}
            except (TypeError, ValueError, IndexError):
                pass

    def save_plush(self):
        if self.remote:
            return
        out = {}
        for name, pl in self.plush.items():
            at = pl["at"]
            if at == "item":
                it = self.item_by_id(pl["item"])
                if it is not None and it in self.items:
                    out[name] = ["item", self.items.index(it), pl["u"], pl["v"], pl["z"]]
            elif at in ("floor", "held"):
                w = self.plush_where(name)
                if w is not None:
                    out[name] = ["floor", w[0], round(H.mx(w[1]), 1), round(w[2] - (8 if at == "held" else 0), 1)]
        self.app.cfg["house"]["plush_pos"] = out
        self.app.save()

    def sync_plush(self):
        """Tell the castle sprites which toys are not on their shelves."""
        main = self.primary_castle()
        away = tuple(sorted(n for n, pl in self.plush.items() if pl["at"] != "castle"))
        for c in self.items_of("castle"):
            c.state["plush_off"] = away if c is main else tuple(NAMES)

    # ---- where things are ------------------------------------------------------------------------
    def primary_castle(self):
        cs = self.items_of("castle")
        return cs[0] if cs else None

    def plush_where(self, name):
        """(f, x, y, z, item) of a toy in world coordinates, or None if it can't be seen."""
        pl = self.plush.get(name)
        if not pl:
            return None
        at = pl["at"]
        if at == "castle":
            c = self.primary_castle()
            if c is None:
                return None
            u, z = H.PLUSH_SPOTS[NAMES.index(name)]
            dx, dy = H.rot_vec(c.rot, u, -10)
            return c.f, c.x + dx, c.y + dy, z, c
        if at == "held":
            a = self.agent_by_uid(pl["by"])
            if a is None or a.away:
                return None
            return a.f, a.x, a.y, a.h + 40, None
        if at == "item":
            it = self.item_by_id(pl["item"])
            if it is None:
                return None
            dx, dy = H.rot_vec(it.rot, pl["u"], pl["v"])
            return it.f, it.x + dx, it.y + dy, pl["z"], it
        return pl["f"], pl["x"], pl["y"], 0.0, None

    def carried_by(self, a):
        for name, pl in self.plush.items():
            if pl["at"] == "held" and pl["by"] == a.uid:
                return name
        return None

    def misplaced_plush(self):
        return [n for n, pl in self.plush.items() if pl["at"] in ("item", "floor")]

    def free_surfaces(self, it):
        """Free toy places on a piece of furniture: [(u, v, z)]."""
        if it.type == "castle":
            return []
        taken = [(pl["u"], pl["v"]) for pl in self.plush.values() if pl["at"] == "item" and pl["item"] == it.id]
        return [s for s in SURFACES.get(it.type, []) if all(math.hypot(s[0] - u, s[1] - v) > 12 for u, v in taken)]

    # ---- picking up and putting down -----------------------------------------------------------------
    def plush_pick(self, a, name, force=False):
        if a.is_cat or name not in self.plush:
            return False
        pl = self.plush[name]
        if pl["at"] == "held":
            return pl["by"] == a.uid
        w = self.plush_where(name)
        if w is None:
            return False
        if not force and (w[0] != a.f or math.hypot(w[1] - a.x, w[2] - a.y) > REACH + 30):
            return False
        held = self.carried_by(a)
        if held is not None:
            self.plush_put(a, None, force=True)
        self.plush[name] = {"at": "held", "by": a.uid, "t": self.t}
        a.say(random.choice(PICK_LINES).format(t=name), 2.2)
        self.sync_plush()
        self.save_plush()
        return True

    def plush_put(self, a, it=None, force=False):
        """Put down what a is carrying: on furniture it (nearest free place), back in the castle, or on the floor."""
        name = self.carried_by(a)
        if name is None:
            return False
        if it is not None and (force or (it.f == a.f and math.hypot(it.x - a.x, it.y - a.y) < REACH + 70)):
            if it.type == "castle" and it is self.primary_castle():
                self.plush[name] = {"at": "castle"}
                a.say(random.choice(TIDY_LINES).format(t=name), 2.2)
                self.sync_plush()
                self.save_plush()
                return True
            spots = self.free_surfaces(it)
            if spots:
                lx, ly = self.to_local(it, a.x, a.y)
                u, v, z = min(spots, key=lambda s: math.hypot(s[0] - lx, s[1] - ly))
                self.plush[name] = {"at": "item", "item": it.id, "u": u, "v": v, "z": z}
                a.say(random.choice(PUT_LINES).format(t=name), 2.2)
                self.sync_plush()
                self.save_plush()
                return True
        nav = self.nav[a.f]
        x, y = a.x + a.facing * 18, a.y - 8
        if not nav.ok_at(x, y):
            x, y = a.x, a.y - 4
        self.plush[name] = {"at": "floor", "f": a.f, "x": x, "y": y}
        self.sync_plush()
        self.save_plush()
        return True

    @staticmethod
    def to_local(it, x, y):
        dx, dy = x - it.x, y - it.y
        r = it.rot
        if r == 0:
            return dx, dy
        if r == 1:
            return -dy, dx
        if r == 2:
            return -dx, -dy
        return dy, -dx

    def surface_near(self, a, dist=REACH + 40):
        best = None
        for it in self.items:
            if it.f != a.f or not (self.free_surfaces(it) or (it.type == "castle" and it is self.primary_castle())):
                continue
            x0, y0, x1, y1 = it.fp()
            dx = max(x0 - a.x, 0, a.x - x1)
            dy = max(y0 - a.y, 0, a.y - y1)
            d = math.hypot(dx, dy)
            if d < dist and (best is None or d < best[0]):
                best = (d, it)
        return best[1] if best else None

    def plush_near(self, a, dist=REACH):
        best = None
        for name in NAMES:
            if self.plush[name]["at"] == "held":
                continue
            w = self.plush_where(name)
            if w is None or w[0] != a.f:
                continue
            d = math.hypot(w[1] - a.x, w[2] - a.y)
            if d < dist and (best is None or d < best[0]):
                best = (d, name)
        return best[1] if best else None

    # ---- walking over first ------------------------------------------------------------------------
    def stand_near(self, f, x, y):
        nav = self.nav[f]
        for ox, oy in ((0, -30), (0, -46), (26, -24), (-26, -24), (34, 0), (-34, 0), (0, 0), (0, 34)):
            if nav.ok_at(x + ox, y + oy):
                return x + ox, y + oy
        c = nav.nearest(x, y, 10)
        return nav.center(*c) if c else (x, y)

    def go_pick(self, a, name, then=None):
        w = self.plush_where(name)
        if w is None or self.plush[name]["at"] == "held":
            return False
        f, x, y = w[0], w[1], w[2]

        def arrive():
            ok = self.plush_pick(a, name)
            if then:
                then(ok)
        if a.f == f and math.hypot(a.x - x, a.y - y) < REACH:
            a.facing = 1 if x >= a.x else -1
            arrive()
            return True
        tx, ty = self.stand_near(f, x, y)
        return a.go(f, tx, ty, 0, False, lambda: (setattr(a, "facing", 1 if x >= a.x else -1), arrive()))

    def go_put(self, a, it, then=None):
        if self.carried_by(a) is None:
            return False

        def arrive():
            ok = self.plush_put(a, it)
            if then:
                then(ok)
        if it is None:
            arrive()
            return True
        x0, y0, x1, y1 = it.fp()
        dx = max(x0 - a.x, 0, a.x - x1)
        dy = max(y0 - a.y, 0, a.y - y1)
        if it.f == a.f and math.hypot(dx, dy) < REACH:
            arrive()
            return True
        tx, ty = self.stand_near(it.f, it.x, y0 - 2)
        return a.go(it.f, tx, ty, 0, False, arrive)

    # ---- the family's habits -------------------------------------------------------------------------
    def plush_step(self, dt):
        self.plush_check_t += dt
        if self.plush_check_t < 2.0:
            return
        self.plush_check_t = 0.0
        changed = False
        for name, pl in self.plush.items():
            if pl["at"] == "held":
                a = self.agent_by_uid(pl["by"])
                if a is None:
                    self.plush[name] = {"at": "castle"}
                    changed = True
                elif (a.ctrl is None and not a.away and self.t - pl.get("t", self.t) > HOLD_TIME and not a.path
                      and a.free_to_visit()):
                    # family members don't carry a toy around forever: put it down somewhere nice
                    it = self.surface_near(a)
                    if it is None and a.role == "kid" and random.random() < 0.5:
                        it = self.primary_castle()
                    if it is not None:
                        self.go_put(a, it)
                    else:
                        self.plush_put(a, None)
                    pl["t"] = self.t
            elif pl["at"] == "item" and self.item_by_id(pl["item"]) is None:
                self.plush[name] = {"at": "castle"}
                changed = True
        if changed:
            self.sync_plush()
            self.save_plush()

    def item_removed_plush(self, it):
        """A piece of furniture is gone: its toys drop to the floor where it stood."""
        changed = False
        for name, pl in self.plush.items():
            if pl["at"] == "item" and pl["item"] == it.id:
                self.plush[name] = {"at": "floor", "f": it.f, "x": it.x, "y": max(4.0, it.y - 10)}
                changed = True
            elif pl["at"] == "castle" and it.type == "castle" and len(self.items_of("castle")) <= 1:
                u, z = H.PLUSH_SPOTS[NAMES.index(name)]
                self.plush[name] = {"at": "floor", "f": it.f, "x": it.x + u * 1.5, "y": max(4.0, it.y - 24)}
                changed = True
        if changed:
            self.sync_plush()
            self.save_plush()

    def plush_to_net(self):
        return self.plush

    def plush_from_net(self, d):
        if isinstance(d, dict):
            self.plush = {n: v for n, v in d.items() if n in NAMES and isinstance(v, dict) and "at" in v}
            for n in NAMES:
                self.plush.setdefault(n, {"at": "castle"})
            self.sync_plush()
