# -*- coding: utf-8 -*-
"""猫咪小屋: an optional 2.5D two-storey house window, drawn straight-on (a front 3/4 view). 二楼 follows
the user's floor plan, 一楼 is designed around it, 户外 is the garden; the storeys are joined by the stairs in
楼道. The window shows all three at once (stacked) or one at a time. While the house is open the two cats
live inside it (the desktop cats are hidden) together with the family and furniture you arrange.

World model: every agent (cat or person) stands on storey f at (x, y) with height h above the floor
(furniture tops). Paths are lists of steps: walk / jump / stairs, found with A* on a coarse grid that
knows the walls, doors and furniture. Furniture offers spots (where a cat sleeps, perches, scratches...;
where a person sits, cooks, sleeps...). See house_art.CATALOG."""

import copy as _copy
import heapq
import math
import random
import re
import sys
import time

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QColor, QCursor, QFont, QFontMetricsF, QGuiApplication, QPainter, QPainterPath, QPen, \
    QLinearGradient, QPixmap, QRadialGradient, QRegion
from PySide6.QtWidgets import QWidget

from . import art
from . import house_art as H
from . import house_play as HP
from .house_play import Play
from .house_toys import KIND as PLUSH_KIND, NAMES as PLUSH_NAMES, PlushWorld
from .house_life import LifeWorld, life_line, cat_line, draw_drop
from . import house_tv as TV
from .house_home import HomeWorld, CAT_LINES_HOME, pick as home_pick, LINES as HOME_LINES
from . import house_cats as HC
from . import house_places_art as PA
from . import house_places as HPL
from . import house_arena_art as AA
from . import house_games_art as GA
from . import house_games2_art as GA2
from . import house_battle as HB
from . import house_map as HM
from . import house_games as HG
from .art import POSES, RUN_POSES, STRIDE_RUN, STRIDE_WALK, blend, clamp, draw_cat, draw_particle, lerp

CS = 0.52                         # cat art units -> house units
JUMP = 86.0                       # highest a cat jumps from the floor / between perches
HOP_D = 185.0                     # (v26) farthest a cat hops across, from one surface to another
HOP_DROP = 125.0                  # (v26) furthest down it hops onto another surface
HOP_KINDS = ("perch", "sleep", "watch")
CELL = 12.0                       # navigation grid
GX0, GY0 = -12.0, H.BALCONY[2] - 24.0
GW = int((H.PW + 24) / CELL) + 1
GH = int((H.PD - GY0 + 12) / CELL) + 1
U = H.UI

PEOPLE_LINES = {
    "cook": ["做饭咯～", "今天吃什么好呢", "{c}别扒拉我裤腿～", "好香呀"],
    "eat": ["开饭啦！", "嗯，好吃～", "{c}，这个你不能吃哦"],
    "feed": ["开饭啦，{c}、{d}！", "小馋猫们，吃饭了～", "碗空啦？来来来"],
    "pet": ["乖～", "{c}好软呀", "摸摸头～", "今天也很可爱嘛", "呼噜呼噜的"],
    "wand": ["来来来，抓逗猫棒！", "{c}，看这里～", "跳起来！"],
    "tv": ["这集好看", "遥控器呢？", "{c}也来看？"],
    "read": ["……", "这本书不错"],
    "go_out": ["我出门一趟～", "乖乖在家哦"],
    "back": ["我回来啦！", "有没有想我呀", "回家咯～"],
    "sleep": ["晚安～", "睡觉咯", "{c}晚安"],
    "wake": ["早上好～", "嗯……天亮了"],
    "homework": ["这道题好难……", "写完作业就去玩！", "{c}别坐我本子上！"],
    "play": ["猫猫来玩！", "嘿嘿～", "看我的小熊！"],
    "chase": ["别跑！", "{c}等等我～"],
    "caught": ["抓到你啦～", "抱抱！"],
    "click_adult": ["怎么啦？", "嗨～", "要不要一起撸猫？", "今天辛苦啦"],
    "click_kid": ["嘻嘻～", "你好呀！", "我在陪猫猫玩！"],
    "scold": ["{c}！不许吃花！", "{c}，下来～", "哎呀{c}"],
    "water": ["浇浇水～", "快快长大"],
    "laptop": ["再干一会儿活…", "嗯……"],
    "nap": ["眯一会儿……"],
    "laundry": ["洗衣服咯", "{c}别钻洗衣机！"],
    "wash": ["洗洗碗～", "哗啦啦"],
    "swing": ["荡高高！", "再高一点～", "呼——"],
    "picnic": ["野餐咯～", "今天天气真好"],
    "bbq": ["烤串好啦！", "好香～", "{c}，这个烫"],
    "hang": ["晒晒太阳", "今天衣服干得快"],
    "plush": ["{t}陪我玩！", "我最喜欢{t}了", "{t}，和猫猫做朋友吧", "今天抱{t}睡觉"],
}
CAT_LINES = {
    "tree": ["这里视野最好！", "爬高高～", "我是山大王"],
    "hide": ["嘘……", "躲起来，看谁能找到我", "（悄悄溜走）"],
    "high": ["高处才安心", "嘿嘿，够不着我吧", "俯视众生～"],
    "tank": ["鱼……鱼！", "好想抓一条", "它在看我"],
    "window": ["看鸟鸟", "外面有只小鸟", "晒太阳～"],
    "coat": ["这条围巾在动！", "喵！抓到了", "嘿！嘿！"],
    "tv": ["电视里有鸟！", "抓不到……"],
    "lap": ["{p}的腿最舒服", "陪{p}一起～", "呼噜呼噜"],
    "beg": ["好香……给我一口嘛", "喵～（期待）", "{p}～分我一点"],
    "empty": ["碗空了喵！", "{p}，没饭啦！", "饭饭……"],
    "plant": ["这草好香", "就啃一口"],
    "scratch": ["磨磨爪子", "唰唰唰"],
    "bed": ["一起睡～", "被窝好暖"],
    "kid": ["{p}陪我玩～", "抓到啦！"],
    "box": ["这个箱子归我了", "箱子好安心"],
    "home": ["这是我们的家～", "家里真好"],
    "flee": ["才不给抓！", "喵呜～跑！"],
    "stairs": ["上楼看看", "下楼巡逻"],
    "washer": ["这上面暖暖的", "轰隆隆～"],
    "sun": ["晒太阳最舒服了", "暖洋洋～", "草地软软的"],
    "bird": ["鸟鸟在吃东西……", "嘘，别出声", "咔咔咔咔"],
    "plush": ["把{t}拍下来！", "{t}，你怎么不动？", "我和{t}谁更可爱", "{t}软软的～"],
}
CAT_LINES.update({k + "_life": v for k, v in __import__("desktopcats.house_life", fromlist=["x"]).CAT_LINES_LIFE.items()})
CAT_LINES.update({k + "_home": v for k, v in __import__("desktopcats.house_home", fromlist=["x"]).CAT_LINES_HOME.items()})


# What the plush toys say. Each has a little personality.
PLUSH_LINES = {
    "兔兔": {"hello": ["你好呀，我是兔兔～", "{u}，抱抱我嘛", "我的耳朵是不是很软？"],
           "cat": ["{c}，耳朵不可以咬哦", "{c}，过来一起晒太阳？", "{c}，你的胡子好长"],
           "person": ["{p}，今晚抱我睡吧", "{p}，我的耳朵软不软？", "{p}，我想去院子里看花"],
           "night": ["晚安，baby dragon", "嘘……大家都睡着啦"],
           "self": ["baby dragon，你今天又装成龙了吗？", "avocado，你会游泳吗？"]},
    "baby dragon": {"hello": ["嗷呜！我是 baby dragon！", "别看我是兔子，我其实是龙！", "{u}，我会保护城堡的"],
                    "cat": ["{c}，我会喷火哦（其实不会）", "嗷呜～吓到你了吗，{c}？", "{c}，你是来抢城堡的吗！"],
                    "person": ["{p}，我今天很勇敢！", "{p}，给我讲个龙的故事嘛", "{p}，我是龙，不是兔子！"],
                    "night": ["我在守护城堡……zzz", "嗷……呜……（打哈欠）"],
                    "self": ["兔兔，我们是不是双胞胎？", "禾宝，我们一起去冒险吧！"]},
    "avocado": {"hello": ["我叫 avocado，但我是鸭子！", "嘎嘎～{u}好！", "嘎！今天有好吃的吗？"],
                "cat": ["{c}，我不是吃的！", "嘎！{c}别靠太近", "{c}，你见过池塘里的鱼吗？"],
                "person": ["{p}，我想去池塘游泳", "{p}，今天晚饭吃什么呀？", "嘎嘎，{p}回来啦！"],
                "night": ["嘎……梦到池塘了", "嘎……（小声）晚安"],
                "self": ["snow ball，你又睡着了吗？", "大家都叫我牛油果，我明明是鸭子"]},
    "snow ball": {"hello": ["我是 snow ball，白白的～", "呼……有点困，{u}好", "下雪的时候我最开心"],
                  "cat": ["{c}，你的毛和我一样软", "{c}，借我靠一下", "{c}，一起打个盹？"],
                  "person": ["{p}，抱抱我取暖", "{p}，什么时候下雪呀？", "{p}，我想睡觉了……"],
                  "night": ["呼……噜……", "好暖和……"],
                  "self": ["禾宝，冬天快到了吗？", "呼……avocado 别吵"]},
    "禾宝": {"hello": ["我是禾宝，一只小驯鹿～", "{u}，我的角还在长呢", "我以后要去雪地里跑！"],
           "cat": ["{c}，别咬我的角呀", "{c}，我们一起拉雪橇吧！", "{c}，你跳得好高"],
           "person": ["{p}，我会长得很高吗？", "{p}，带我去院子里看看", "{p}，我想看星星"],
           "night": ["星星好亮……", "晚安，城堡里的大家"],
           "self": ["snow ball，我们去北边看雪吧", "兔兔，你的耳朵借我暖暖"]},
}
CAT_TO_PLUSH = ["喵？玩具会说话？", "喵～（歪头）", "我才不咬呢", "呼噜呼噜", "{t}，你身上有我的味道", "喵！（伸爪子）"]
PERSON_TO_PLUSH = ["好呀，{t}～", "{t}今天真乖", "嘘，{t}，猫在睡觉", "等我忙完就陪你，{t}", "{t}最可爱了"]
KID_TO_PLUSH = ["{t}！我来啦！", "{t}最可爱了！", "{t}，我们去玩过家家！", "嘻嘻，{t}说话啦"]
PLUSH_TO_PLUSH = ["嗯嗯～", "我也是！", "嘻嘻", "好呀好呀", "嘘——小声点", "{a}说得对"]


def pick(pool, **fmt):
    s = random.choice(pool)
    try:
        return s.format(**fmt)
    except (KeyError, IndexError):
        return s


def plush_name():
    return random.choice(H.PLUSHIES)[0]


def screen_facing(dx, dy, default=1):
    """Left / right on screen for a move by (dx, dy) in the world (the view is straight-on)."""
    if abs(dx) < 0.5:
        return default
    return 1 if dx > 0 else -1


def view_for(dx, dy, prev="side"):
    """Which way a person is seen while moving by (dx, dy): front (coming closer), back or side."""
    sx, sy = abs(dx), abs(dy) * H.KY
    if sx < 1e-6 and sy < 1e-6:
        return prev
    if sy > sx * 1.25:
        return "front" if dy < 0 else "back"
    if sx > sy * 0.9:
        return "side"
    return prev


# ======================================================================================== furniture
class Item:
    _next = 1

    def __init__(self, typ, f, x, y, rot=0):
        self.id = Item._next
        Item._next += 1
        self.type, self.f, self.x, self.y, self.rot = typ, int(f), float(x), float(y), int(rot) % 4
        self.state = {"food": 100.0, "coat": True, "swing": 0.0, "on": False}

    @property
    def cat(self):
        return H.CATALOG[self.type]

    def fp(self):
        return H.footprint(self)

    def spot(self, idx):
        s = self.cat["spots"][idx]
        dx, dy = H.rot_vec(self.rot, s["u"], s["v"])
        x, y = self.x + dx, self.y + dy
        if s.get("face"):
            fx, fy = H.rot_vec(self.rot, *s["face"])
        else:
            x0, y0, x1, y1 = self.fp()
            if x0 <= x <= x1 and y0 <= y <= y1:
                fx, fy = H.rot_vec(self.rot, 0, -1)
            else:
                fx, fy = self.x - x, self.y - y
        return dict(s, x=x, y=y, f=self.f, fx=fx, fy=fy, item=self)

    def spots(self):
        return [(i, self.spot(i)) for i in range(len(self.cat["spots"]))]

    def to_cfg(self):
        """Saved in the un-mirrored layout, so flipping left / right never loses an arrangement."""
        return [self.type, self.f, round(H.mx(self.x), 1), round(self.y, 1), H.mrot(self.rot)]


# ======================================================================================== navigation
class Nav:
    """Walkable grid of one storey: rooms minus walls, the stair flight / opening and furniture."""

    def __init__(self, f, items):
        self.f = f
        self.free = [[False] * GW for _ in range(GH)]
        walls = H.FLOORS[f]["walls"]
        s = H.STAIR
        blocks = []
        for it in items:
            if it.f != f or it.cat.get("walk"):
                continue
            blk = it.cat.get("block")
            if it.cat.get("flat") and not blk:
                continue
            if blk:
                bw, bd = blk if it.rot % 2 == 0 else (blk[1], blk[0])
                x0, y0, x1, y1 = it.x - bw / 2, it.y - bd / 2, it.x + bw / 2, it.y + bd / 2
            else:
                x0, y0, x1, y1 = it.fp()
            blocks.append((x0 - 3, y0 - 3, x1 + 3, y1 + 3))
        for j in range(GH):
            cy = GY0 + CELL * (j + 0.5)
            for i in range(GW):
                cx = GX0 + CELL * (i + 0.5)
                if not H.inside(f, cx, cy):
                    continue
                if cx < 16 or cx > H.PW - 16 or cy > H.depth(f) - 8:
                    continue                      # (keep clear of the side walls: bodies are wide)
                if f in (0, 1) and s["x0"] - 6 < cx < s["x1"] + 6 and s["y0"] - 4 < cy < s["y1"] + 6:
                    continue
                bad = False
                for x0, y0, x1, y1, gaps in walls:
                    if y0 == y1:
                        if abs(cy - y0) < 8 and min(x0, x1) - 4 < cx < max(x0, x1) + 4:
                            if not any(g0 + 6 < cx < g1 - 6 for g0, g1 in gaps):
                                bad = True
                                break
                    else:
                        # walls running front to back are seen edge-on: stand well clear of them, or a body
                        # half covers the wall
                        if abs(cx - x0) < 20 and min(y0, y1) - 4 < cy < max(y0, y1) + 4:
                            if not any(g0 + 6 < cy < g1 - 6 for g0, g1 in gaps):
                                bad = True
                                break
                if bad:
                    continue
                if any(b[0] < cx < b[2] and b[1] < cy < b[3] for b in blocks):
                    continue
                self.free[j][i] = True

    @staticmethod
    def cell(x, y):
        return int((x - GX0) // CELL), int((y - GY0) // CELL)

    @staticmethod
    def center(i, j):
        return GX0 + CELL * (i + 0.5), GY0 + CELL * (j + 0.5)

    def ok(self, i, j):
        return 0 <= i < GW and 0 <= j < GH and self.free[j][i]

    def ok_at(self, x, y):
        return self.ok(*self.cell(x, y))

    def nearest(self, x, y, radius=10):
        i0, j0 = self.cell(x, y)
        if self.ok(i0, j0):
            return i0, j0
        best = None
        for r in range(1, radius + 1):
            for j in range(j0 - r, j0 + r + 1):
                for i in range(i0 - r, i0 + r + 1):
                    if max(abs(i - i0), abs(j - j0)) != r or not self.ok(i, j):
                        continue
                    cx, cy = self.center(i, j)
                    d = (cx - x) ** 2 + (cy - y) ** 2
                    if best is None or d < best[0]:
                        best = (d, i, j)
            if best is not None:
                return best[1], best[2]
        return None

    def line_free(self, a, b):
        (x0, y0), (x1, y1) = a, b
        n = int(math.hypot(x1 - x0, y1 - y0) / 5) + 1
        for k in range(n + 1):
            t = k / n
            if not self.ok_at(lerp(x0, x1, t), lerp(y0, y1, t)):
                return False
        return True

    def path(self, start, goal):
        """List of points from start to goal (both snapped to the grid), or None."""
        s = self.nearest(*start)
        g = self.nearest(*goal)
        if s is None or g is None:
            return None
        if s == g:
            return [goal]
        openq = [(0.0, s)]
        came = {s: None}
        cost = {s: 0.0}
        gi, gj = g
        while openq:
            _, cur = heapq.heappop(openq)
            if cur == g:
                break
            ci, cj = cur
            for di, dj, w in ((1, 0, 1.0), (-1, 0, 1.0), (0, 1, 1.0), (0, -1, 1.0),
                              (1, 1, 1.414), (1, -1, 1.414), (-1, 1, 1.414), (-1, -1, 1.414)):
                ni, nj = ci + di, cj + dj
                if not self.ok(ni, nj):
                    continue
                if di and dj and not (self.ok(ci + di, cj) and self.ok(ci, cj + dj)):
                    continue
                nc = cost[cur] + w
                if nc < cost.get((ni, nj), 1e18):
                    cost[(ni, nj)] = nc
                    came[(ni, nj)] = cur
                    heapq.heappush(openq, (nc + math.hypot(ni - gi, nj - gj), (ni, nj)))
        if g not in came:
            return None
        cells = []
        cur = g
        while cur is not None:
            cells.append(cur)
            cur = came[cur]
        cells.reverse()
        pts = [self.center(i, j) for i, j in cells]
        out = []
        anchor = start if self.line_free(start, pts[0]) else pts[0]
        if anchor is not start:
            out.append(pts[0])
        k = 0
        while k < len(pts) - 1:
            far = k + 1
            for m in range(len(pts) - 1, k, -1):
                if self.line_free(anchor, pts[m]):
                    far = m
                    break
            out.append(pts[far])
            anchor = pts[far]
            k = far
        out.append(goal)
        return out


# ======================================================================================== agents
class Agent:
    is_cat = False
    walk_v = 60.0
    run_v = 140.0

    def __init__(self, world):
        self.world = world
        self.f, self.x, self.y, self.h = 1, 300.0, 120.0, 0.0
        self.facing = 1
        self.path = []
        self.jump_info = None
        self.then = None
        self.state, self.timer, self.st_t, self.data = "idle", 2.0, 0.0, {}
        self.spot = None
        self.bubble = None
        self.pending = []
        self.particles = []
        self.t = random.uniform(0, 10)
        self.stairs_u = None
        self.hit = QRectF()
        self.moved = 0.0
        self.running = False
        self.away = False
        self.seat = 0.0
        self.motion = (0.0, 0.0)
        self.hits = {}
        self.ctrl = None                  # player id while someone controls this character
        self.uid = "a%d" % id(self)
        self.traveling = None             # storey being travelled to (off screen, between home and a place)
        self.hidden = False               # people of the places when they are not there
        self.ride = None                  # boat id while in a rowing boat
        self.in_tent = None               # tent item id while inside (camping)
        self.guardian = None              # (cats) uid of the person holding the leash when out
        self.anim = None
        self.outing = None
        self.npc = None

    # ---- speech & effects --------------------------------------------------------------
    def say(self, text, dur=None, delay=0.0):
        if not text:
            return
        if dur is None:
            dur = clamp(1.4 + 0.13 * len(text), 1.8, 4.8)
        now = time.monotonic()
        if delay > 0:
            self.pending.append((now + delay, text, dur))
            return
        self.bubble = {"text": text, "t0": now, "until": now + dur}

    def spawn(self, kind, n=1):
        fx = getattr(self.world, "fx_log", None)
        if fx is not None and len(fx) < 40:
            fx.append([self.uid, kind, n])
        for _ in range(n):
            pt = {"kind": kind, "dx": random.uniform(-6, 6), "dy": -4, "vx": random.uniform(-12, 12),
                  "vy": random.uniform(-44, -28), "life": 0.0, "max": 1.3, "size": random.uniform(1.0, 1.3)}
            if kind == "z":
                pt.update(dx=6 * self.facing, vx=10 * self.facing, vy=-18, max=2.2)
            elif kind in ("q", "ex"):
                pt.update(dx=8 * self.facing, vx=0, vy=-16, max=1.1)
            self.particles.append(pt)

    def tick_fx(self, dt):
        now = time.monotonic()
        if self.pending:
            due = [x for x in self.pending if x[0] <= now]
            self.pending = [x for x in self.pending if x[0] > now]
            for _, text, dur in due:
                self.say(text, dur)
        if self.bubble and self.bubble["until"] < now:
            self.bubble = None
        for pt in self.particles:
            pt["life"] += dt
            pt["dx"] += pt["vx"] * dt
            pt["dy"] += pt["vy"] * dt
        self.particles = [pt for pt in self.particles if pt["life"] < pt["max"]]

    # ---- state ---------------------------------------------------------------------------
    def set_state(self, st, dur=3.0, **data):
        self.state, self.timer, self.st_t, self.data = st, dur, 0.0, data

    def claim(self, key):
        self.release_spot()
        if key is not None:
            self.world.occupied[key] = self
            self.spot = key

    def release_spot(self):
        if self.spot is not None and self.world.occupied.get(self.spot) is self:
            del self.world.occupied[self.spot]
        self.spot = None

    def spot_info(self):
        if self.spot is None:
            return None
        it = self.world.item_by_id(self.spot[0])
        if it is None:
            return None
        return it.spot(self.spot[1])

    def on_item(self):
        oid = self.data.get("on") if isinstance(self.data, dict) else None
        if oid is not None and not self.path:
            it = self.world.item_by_id(oid)
            if it is not None:
                return it
        sp = self.spot_info()
        if sp is not None and abs(self.x - sp["x"]) < 2 and abs(self.y - sp["y"]) < 2 and not self.path:
            return sp["item"]
        return None

    # ---- movement ------------------------------------------------------------------------
    def stop(self):
        self.path = []
        self.then = None
        self.jump_info = None
        if self.stairs_u is not None:
            up = self.stairs_u >= 0.5
            self.stairs_u = None
            if up:
                self.f, (self.x, self.y) = 1, H.STAIR_TOP
            else:
                self.f, (self.x, self.y) = 0, H.STAIR_BOTTOM
            self.h = 0.0

    def go(self, f, x, y, h=0.0, run=False, then=None):
        steps = self.plan(f, x, y, h, run)
        if steps is None:
            return False
        self.path = steps
        self.then = then
        self.running = run
        return True

    def walk_steps(self, f, a, b, v):
        pts = self.world.nav[f].path(a, b)
        if pts is None:
            return [{"t": "walk", "x": b[0], "y": b[1], "v": v}]
        return [{"t": "walk", "x": x, "y": y, "v": v} for x, y in pts]

    def launch_point(self, f, x, y, start):
        """(v26) The floor point to jump up to (x, y) from: in front of or beside the furniture it is on (never the
        gap behind a bed head or a cupboard), close to it, and somewhere the cat can actually walk to."""
        w = self.world
        nav = w.nav.get(f)
        if nav is None:
            return None
        under = None
        for it in w.items:
            if it.f != f or it.cat.get("flat"):
                continue
            x0, y0, x1, y1 = it.fp()
            if x0 - 2 <= x <= x1 + 2 and y0 - 2 <= y <= y1 + 2:
                if under is None or it.cat["h"] > under.cat["h"]:
                    under = it
        cands = []
        if under is not None:
            x0, y0, x1, y1 = under.fp()
            cx = clamp(x, x0 + 8, x1 - 8)
            for gap in (14, 26, 40):
                cands += [(cx, y0 - gap, 0.0), (x0 - gap, clamp(y, y0 + 6, y1 - 6), 18.0),
                          (x1 + gap, clamp(y, y0 + 6, y1 - 6), 18.0), (x0 - gap, y0 - gap, 10.0),
                          (x1 + gap, y0 - gap, 10.0)]
        else:
            for r in (24, 40, 60):
                for k in range(8):
                    a = k * math.pi / 4
                    cands.append((x + math.cos(a) * r, y + math.sin(a) * r, 12.0 if math.sin(a) > 0.3 else 0.0))
        scored = []
        for cx, cy, pref in cands:
            if not nav.ok_at(cx, cy) or H.wall_between(f, cx, cy, x, y):
                continue
            d = math.hypot(cx - x, cy - y)
            if d > 120:
                continue
            scored.append((pref + d * 0.6 + math.hypot(cx - start[0], cy - start[1]) * 0.05, cx, cy))
        scored.sort()
        for _, cx, cy in scored[:6]:
            if math.hypot(cx - start[0], cy - start[1]) < 4 or nav.path(start, (cx, cy)) is not None:
                return cx, cy
        c = nav.nearest(x, y, 8)
        return nav.center(*c) if c else None

    def plan(self, f, x, y, h, run):
        v = self.run_v if run else self.walk_v
        w = self.world
        steps = []
        cf, cx, cy, ch = self.f, self.x, self.y, self.h
        d0 = math.hypot(x - cx, y - cy)
        if self.is_cat and ch > 0.5 and h > 0.5 and cf == f and w.hop_ok(f, (cx, cy, ch), (x, y, h)):
            return [{"t": "jump", "x": x, "y": y, "h": h}]      # perch to perch, no need to get down first
        if self.is_cat and ch > 0.5 and h > 0.5 and cf == f:
            # (v24) up or down a tree a level at a time, or across the room from one thing to the next, without
            # touching the floor (v26: over everything a cat can stand on)
            hops = self.world.perch_route(f, (cx, cy, ch), (x, y, h), me=self)
            if hops:
                return [{"t": "jump", "x": px, "y": py, "h": ph, "quick": i < len(hops) - 1}
                        for i, (px, py, ph) in enumerate(hops)]
        if ch > 0.5:
            if self.is_cat and ch > 95:
                # (v24) climb down a level or two first, instead of one big drop from the top
                for px, py, ph in w.down_chain(cf, cx, cy, ch, me=self):
                    steps.append({"t": "jump", "x": px, "y": py, "h": ph, "quick": True})
                    cx, cy, ch = px, py, ph
            nav = w.nav[cf]
            # (v26) down in front of / beside what it's on, somewhere connected to the rest of the floor (never
            # into the gap behind a bed head)
            lp = self.launch_point(cf, cx, cy, (x, y) if cf == f else self.world.open_point(cf)) if self.is_cat \
                else None
            if lp is None:
                c = nav.nearest(cx, cy, 8)
                lp = nav.center(*c) if c else (cx, cy)
            nx, ny = lp
            steps.append({"t": "jump", "x": nx, "y": ny, "h": 0.0})
            cx, cy, ch = nx, ny, 0.0
        while cf != f:
            if cf in PA.PLACES or (f in PA.PLACES and cf == 2):
                if cf in PA.PLACES:
                    steps += self.walk_steps(cf, (cx, cy), PA.entry_in(cf), v)
                    ox, oy = PA.entry_out(cf)
                else:
                    steps += self.walk_steps(2, (cx, cy), H.GATE_IN, v)
                    ox, oy = H.GATE_OUT
                steps.append({"t": "walk", "x": ox, "y": oy, "v": v})
                dest = f if f in PA.PLACES else 2
                tx, ty = PA.entry_out(dest) if dest in PA.PLACES else H.GATE_OUT
                steps.append({"t": "travel", "f": dest, "x": tx, "y": ty, "dur": HM.travel_time(cf, dest)})
                cx, cy, cf = tx, ty, dest
                continue
            if f in PA.PLACES:
                nxt = 0 if cf == 1 else 2
            else:
                nxt = f if cf == 0 else 0
            if cf == 0 and nxt == 1:
                steps += self.walk_steps(0, (cx, cy), H.STAIR_BOTTOM, v)
                steps.append({"t": "stairs", "up": True})
                cx, cy = H.STAIR_TOP
            elif cf == 1:
                steps += self.walk_steps(1, (cx, cy), H.STAIR_TOP, v)
                steps.append({"t": "stairs", "up": False})
                cx, cy = H.STAIR_BOTTOM
            elif cf == 0 and nxt == 2:
                steps += self.walk_steps(0, (cx, cy), H.INSIDE_DOOR, v)
                steps.append({"t": "door", "f": 2, "x": H.YARD_DOOR[0], "y": H.YARD_DOOR[1]})
                cx, cy = H.YARD_DOOR
            else:
                steps += self.walk_steps(2, (cx, cy), H.YARD_DOOR, v)
                steps.append({"t": "door", "f": 0, "x": H.INSIDE_DOOR[0], "y": H.INSIDE_DOOR[1]})
                cx, cy = H.INSIDE_DOOR
            cf = nxt
        if h > 0.5:
            chain = w.reach_chain(f, x, y, h, me=self) if self.is_cat else w.reach_chain(f, x, y, h)
            if chain is None:
                return None
            for px, py, ph in chain + [(x, y, h)]:
                if ch < 0.5:
                    lp = self.launch_point(f, px, py, (cx, cy))
                    if lp is None:
                        return None
                    ax, ay = lp
                    steps += self.walk_steps(f, (cx, cy), (ax, ay), v)
                steps.append({"t": "jump", "x": px, "y": py, "h": ph})
                cx, cy, ch = px, py, ph
        else:
            steps += self.walk_steps(f, (cx, cy), (x, y), v)
        return steps

    def update_path(self, dt):
        if getattr(self, "pause", 0.0) > 0:
            self.pause -= dt
            return True
        moving = False
        while self.path and dt > 1e-6:
            st = self.path[0]
            kind = st["t"]
            if kind == "walk":
                dx, dy = st["x"] - self.x, st["y"] - self.y
                d = math.hypot(dx, dy)
                step = st["v"] * dt
                if d > 0.6:
                    self.facing = screen_facing(dx, dy, self.facing)
                    self.motion = (dx, dy)
                if d <= step:
                    self.x, self.y = st["x"], st["y"]
                    self.moved += d
                    dt -= d / st["v"]
                    self.path.pop(0)
                else:
                    self.x += dx / d * step
                    self.y += dy / d * step
                    self.moved += step
                    dt = 0
                moving = True
            elif kind == "stairs":
                if self.stairs_u is None:
                    self.stairs_u = 0.0 if st["up"] else 1.0
                    it = self.world.item_by_id(self.spot[0]) if self.spot is not None else None
                    if it is None or it.f == self.f:
                        self.release_spot()        # (a seat claimed on the storey we are heading to stays ours)
                dur = 3.2 if not self.is_cat else 2.0
                self.stairs_u += (dt / dur) * (1 if st["up"] else -1)
                self.motion = (0.0, 1.0 if st["up"] else -1.0)
                self.moved += dt * (self.run_v if self.is_cat else self.walk_v) * 0.7
                dt = 0
                moving = True
                if (st["up"] and self.stairs_u >= 1.0) or (not st["up"] and self.stairs_u <= 0.0):
                    self.stairs_u = None
                    if st["up"]:
                        self.f, (self.x, self.y) = 1, H.STAIR_TOP
                    else:
                        self.f, (self.x, self.y) = 0, H.STAIR_BOTTOM
                    self.path.pop(0)
            elif kind == "door":
                if "k" not in st:
                    st["k"] = 0.0
                    self.release_spot()
                    self.f, self.x, self.y, self.h = st["f"], st["x"], st["y"], 0.0
                    if not self.is_cat:
                        self.world.sfx("door", 3)
                    self.world.house.door_t = 0.8
                    self.world.house.door_f = st["f"]
                st["k"] += dt / 0.35
                dt = 0
                moving = True
                if st["k"] >= 1.0:
                    self.path.pop(0)
            elif kind == "jump":
                if self.is_cat and "prep" not in st:
                    # gather before the leap: a longer crouch (and a little wiggle) for a big jump up
                    rise = st["h"] - self.h
                    dist = math.hypot(st["x"] - self.x, st["y"] - self.y)
                    if st.get("quick"):
                        st["prep"] = 0.06 + min(0.08, max(0.0, rise) * 0.001)   # one hop of a run: keep the flow
                    elif rise > 25 or st.get("pounce"):
                        st["prep"] = 0.18 + min(0.22, max(0.0, rise) * 0.003)
                    else:
                        st["prep"] = 0.12 if (dist > 40 or rise < -25) else 0.07
                    if abs(st["x"] - self.x) > 2:
                        self.facing = screen_facing(st["x"] - self.x, st["y"] - self.y, self.facing)
                if st.get("prep", 0.0) > 0:
                    st["prep"] -= dt
                    dt = 0
                    moving = True
                    continue
                if "k" not in st:
                    st.update(k=0.0, x0=self.x, y0=self.y, h0=self.h)
                    dist = math.hypot(st["x"] - self.x, st["y"] - self.y) + abs(st["h"] - self.h)
                    st["dur"] = 0.34 + dist * 0.0022 + st.get("extra", 0.0)
                    st["apex"] = 14 + max(0.0, st["h"] - self.h) * 0.22 + st.get("lift", 0.0)
                    self.facing = screen_facing(st["x"] - self.x, st["y"] - self.y, self.facing)
                    self.motion = (st["x"] - self.x, st["y"] - self.y)
                st["k"] = min(1.0, st["k"] + dt / st["dur"])
                k = st["k"]
                self.x = lerp(st["x0"], st["x"], k)
                self.y = lerp(st["y0"], st["y"], k)
                self.h = lerp(st["h0"], st["h"], k) + st["apex"] * 4 * k * (1 - k)
                if self.is_cat:
                    rise = (st["h"] - st["h0"]) + (st["y"] - st["y0"]) * H.KY + st["apex"] * 4 * (1 - 2 * k)
                    run = abs(st["x"] - st["x0"]) + 30.0
                    self.jump_info = (k, math.degrees(math.atan2(rise, run)))
                dt = 0
                moving = True
                if k >= 1.0:
                    self.h = st["h"]
                    self.path.pop(0)
                    if self.is_cat:
                        self.jump_info = None
                        self.landed = 0.12 + min(0.2, max(0.0, st["h0"] - st["h"]) * 0.002)
            elif kind == "wait":
                st["left"] = st.get("left", st.get("dur", 0.4)) - dt
                dt = 0
                if st["left"] <= 0:
                    self.path.pop(0)
            elif kind == "travel":
                if "k" not in st:
                    st["k"] = 0.0
                    self.release_spot()
                    self.traveling = st["f"]
                    self.h = 0.0
                    if not st.get("cat"):
                        self.world.on_travel_start(self, st)
                st["k"] += dt / max(0.1, st.get("dur", 5.0))
                dt = 0
                moving = True
                if st["k"] >= 1.0:
                    self.f, self.x, self.y, self.h = st["f"], st["x"], st["y"], 0.0
                    self.traveling = None
                    self.path.pop(0)
                    self.world.on_travel_end(self)
            else:
                self.path.pop(0)
        if not self.path and self.then is not None:
            fn, self.then = self.then, None
            fn()
        return moving or bool(self.path)

    # ---- geometry ------------------------------------------------------------------------
    def visible_on(self, f):
        if self.away or self.hidden or self.traveling is not None or self.in_tent is not None:
            return False
        if self.stairs_u is not None:
            return f == 0 or (f == 1 and self.stairs_u > 0.45)
        return self.f == f

    def world_pos(self, view):
        """(x, y, z) in the coordinates of the storey being viewed."""
        if self.stairs_u is not None:
            s = H.STAIR
            u = self.stairs_u
            y = lerp(s["y0"] - 8, s["y1"] + 8, u)
            z = u * H.FH - (H.FH if view == 1 else 0)
            return (s["x0"] + s["x1"]) / 2, y, z
        return self.x, self.y, self.h

    def screen(self, view):
        x, y, z = self.world_pos(view)
        return H.iso(x, y, z)

    def free_to_visit(self):
        if self.ctrl is not None:
            return False
        if self.is_cat:
            return self.state in ("idle", "rest") and not self.path
        return self.state == "idle" or (self.state == "act" and self.act in ("wander", "read", "phone", "tv"))

    def visit_castle(self, castle):
        """Walk over to the castle shelf (someone asked a plush to come and chat)."""
        sp = [s for _, s in castle.spots() if s["kind"] in ("play", "bat") and
              (s["who"] == "cat") == self.is_cat]
        if not sp:
            return
        sp = sp[0]
        if self.is_cat:
            self.interrupt()
            self.release_spot()
            self.go(castle.f, sp["x"], sp["y"], 0, False, lambda: (self.face_spot(sp), self.set_state("rest", 8, pose="sit")))
        else:
            self.stop()
            if self.state == "act":
                self.end_act()
            self.act = "visit"
            self.go(castle.f, sp["x"], sp["y"], 0, False,
                    lambda: (setattr(self, "facing", screen_facing(sp["fx"], sp["fy"])), self.set_state("act", 8),
                             setattr(self, "pose", "stand"), setattr(self, "view", "back")))


# ---------------------------------------------------------------------------------------- cats
HIDE_DARK = 3.0                       # (v27) seconds the house stays dark while a cat hides for 躲猫猫
HIDE_W = {"off": 0.0, "rare": 0.25, "sometimes": 0.6, "often": 1.5}    # cats hiding by themselves (cfg hideseek.freq)

class HCat(Agent):
    is_cat = True
    walk_v = 52.0
    walk_scale = 1.5                  # (v26) bigger, slower steps: they read better at the house's size
    run_v = 165.0

    def __init__(self, world, src):
        super().__init__(world)
        self.src = src
        self.kind = src.kind
        self.uid = "c:" + src.kind
        self.pose = "stand"
        self.gait = 0.0
        self.swing = 0.0
        self.blend_from = None
        self.blend_t = 1.0
        self.next_blink = time.monotonic() + random.uniform(1, 4)
        self.blink_until = 0.0
        self.landed = 0.0
        self.q = None
        self.last_line = 0.0
        self.set_state("idle", random.uniform(1, 3))

    @property
    def name(self):
        return self.src.name

    def line(self, key, **fmt):
        if key in CAT_LINES:
            fmt.setdefault("p", self.world.someone_name())
            return pick(CAT_LINES[key], **fmt)
        try:
            return self.src.line(key, **fmt)
        except Exception:
            return "喵～"

    def chat(self, key, chance=0.5, **fmt):
        now = time.monotonic()
        if random.random() < chance and now - self.last_line > 6 and now - self.world.last_talk > 2.5:
            self.last_line = now
            self.world.last_talk = now
            self.say(self.line(key, **fmt))

    def head_offset(self):
        return 24 * CS * self.facing, -54 * CS

    def set_pose(self, name):
        if name != self.pose:
            if self.q is not None:
                self.blend_from = self.q
                self.blend_t = 0.0
            self.pose = name

    # ---- needs -----------------------------------------------------------------------------
    def tick_needs(self, dt):
        s = self.src.stats
        s["hunger"] = min(100.0, s["hunger"] + dt * 100 / 3600)
        if self.state == "rest" and self.data.get("pose") == "sleep":
            s["energy"] = min(100.0, s["energy"] + dt * 0.6)
        else:
            busy = self.running or self.state in ("play", "wand", "flee")
            s["energy"] = max(0.0, s["energy"] - dt * (0.03 + (0.15 if busy else 0)))
        s["mood"] += ((35 if s["hunger"] > 80 else 58) - s["mood"]) * dt * 0.002

    # ---- decisions -------------------------------------------------------------------------
    def free(self):
        return self.ctrl is None and self.state in ("idle", "rest") and not self.path and not self.data.get("locked")

    def busy_with_people(self):
        return self.ctrl is not None or self.state in ("wand", "petted", "flee", "present", "held", "fall", "ko",
                                                       "carried", "hiding")

    def decide(self):
        w = self.world
        s = self.src.stats
        hr = w.hour()
        if self.f in AA.ARENAS:
            w.leave_arena(self)
            return
        if self.f in PA.PLACES:
            if not w.cat_place_decide(self):
                self.set_state("rest", 3, pose="sit")
            return
        g = w.guardian(self) if self.guardian else None
        if g is not None:
            if g.f in PA.PLACES or g.traveling is not None:
                if w.cat_follow(self, g):            # catching up with its person (the leash is clipped on outside)
                    return
            elif g.outing is not None:
                if w.cat_follow(self, g, home=True):
                    return
            else:
                self.guardian = None
        if self.f == 2 and not w.outdoor_ok() and self.spot is None:
            # dusk / rain: back inside
            x, y = w.random_floor(0)
            self.go(0, x, y, 0, w.weather() == "rain", lambda: self.set_state("rest", 6, pose="groom"))
            return
        if getattr(self, "parkour", None):
            if self.parkour_step():
                return
        night = w.everyone_asleep() or hr >= 23 or hr < 6
        options = []
        tw = lambda k: HC.trait_w(self, k)
        if w.items_of("bowls") and s["hunger"] > 45:
            options.append(((8 + (s["hunger"] - 45) / 4) * tw("eat"), self.act_eat))
        options.append((((100 - s["energy"]) / 9 + (9 if night else 0) + 1.5) * tw("sleep"), self.act_sleep))
        options.append((3.0 * tw("perch"), self.act_perch))
        options.append((2.4, self.act_wander))
        if not night:
            options.append((1.6, lambda: self.act_spot(("watch",), "rest", "sit", (15, 40), "window")))
            options.append((1.2, lambda: self.act_spot(("scratch",), "scratch", "stretch", (3, 6), "scratch")))
            options.append((1.0, lambda: self.act_spot(("bat",), "bat", "swat", (4, 8), "coat")))
            options.append((1.2, lambda: self.act_spot(("hide",), "rest", "loaf", (20, 60), "box")))
            options.append((HIDE_W.get(self.world.app.cfg.get("hideseek", {}).get("freq", "sometimes"), 0.6),
                            self.act_hideaway))
            options.append((1.1, lambda: self.act_spot(("watch_tank",), "rest", "sit", (10, 25), "tank")))
            options.append((0.5, lambda: self.act_spot(("nibble",), "nibble", "eat", (3, 5), "plant")))
            options.append((0.35, lambda: self.act_spot(("litter",), "rest", "sit", (3, 5), None)))
            options.append((1.4, self.act_social))
            if s["energy"] > 50:
                options.append((1.1, self.act_zoom))
            options.append((0.9 * tw("knock"), self.act_knock))
            if any(w.plush[n]["at"] == "floor" and w.plush[n].get("f") == self.f for n in PLUSH_NAMES):
                options.append((0.9, self.act_plush_bat))
            options.append((1.0, self.act_stairs))
            if s["energy"] > 30:
                options.append((3.2 * tw("perch"), self.act_parkour))
            if s["energy"] > 20:
                options.append((2.6 * tw("perch"), self.act_climb))
        if w.outdoor_ok() and w.items_on(2):
            options.append((2.0, self.act_sunbathe))
            options.append((1.4, lambda: self.act_spot(("watch_birds",), "rest", "sit", (15, 40), "bird")))
            options.append((1.0, lambda: self.act_spot(("watch_pond",), "rest", "sit", (12, 30), "tank")))
            if w.butterflies:
                options.append((1.6, self.act_hunt))
        for pr in w.present_people():
            if pr.act in ("tv", "read", "phone", "nap") and pr.spot is not None:
                options.append((2.6 * tw("lap"), lambda pr=pr: self.act_lap(pr)))
            elif pr.act == "cook":
                options.append((3.0 * tw("beg"), lambda pr=pr: self.act_beg(pr)))
            elif pr.act == "play" and pr.role == "kid":
                options.append((3.0, lambda pr=pr: self.act_kidplay(pr)))
            elif pr.act == "sleep" and night:
                options.append((4.0, lambda pr=pr: self.act_lap(pr)))
            elif pr.act == "laundry":
                options.append((1.5, lambda: self.act_spot(("sleep",), "rest", "loaf", (20, 50), "washer",
                                                           types=("washer",))))
            elif pr.act in ("idle", "wander") and not pr.path:
                options.append((1.0 * tw("rub"), lambda pr=pr: self.act_rub(pr)))
            elif pr.act == "laptop" and pr.state == "act" and pr.spot is not None and not night:
                options.append((1.3, lambda pr=pr: self.act_laptop(pr)))
        if any(it.state.get("on") for it in w.items_of("tv")):
            options.append((2.0, lambda: self.act_spot(("tv",), "rest", "sit", (12, 30), "tv")))
        wx = w.weather()
        if wx in ("rain", "snow") and not night:
            options.append((2.6, lambda: self.act_spot(("watch",), "rest", random.choice(("sit", "loaf")), (25, 70),
                                                       ("rain_home" if wx == "rain" else "snow_home"))))
        if w.morsel_on_floor(self.f):
            options.append((7.0, self.act_morsel))
        for v in w.visitors:
            if v.f == self.f and not v.away and not v.leaving and math.hypot(v.x - self.x, v.y - self.y) < 320:
                options.append((3.0, lambda v=v: self.act_meet_visitor(v)))
                break
        for pr in w.present_people():
            if pr.act == "eat" and pr.state == "act" and pr.f == self.f and pr.spot is not None:
                options.append((2.2 * tw("beg"), lambda pr=pr: self.act_beg_table(pr)))
                break
        random.shuffle(options)
        total = sum(o[0] for o in options)
        r = random.uniform(0, total)
        for weight, fn in options:
            r -= weight
            if r <= 0:
                if fn():
                    return
                break
        self.act_wander()

    def go_spot(self, key, run=False, then=None):
        it = self.world.item_by_id(key[0])
        if it is None:
            return False
        sp = it.spot(key[1])
        self.claim(key)
        ok = self.go(it.f, sp["x"], sp["y"], sp["h"], run, then)
        if not ok:
            self.release_spot()
        return ok

    def free_spots(self, kinds, types=None):
        out = []
        outdoor = self.world.outdoor_ok()
        for it in self.world.items:
            if types is not None and it.type not in types:
                continue
            if not self.world.same_region(it.f, self.f):
                continue
            if it.f == 2 and not outdoor:
                continue
            for idx, sp in it.spots():
                if sp["who"] == "cat" and sp["kind"] in kinds:
                    key = (it.id, idx)
                    occ = self.world.occupied.get(key)
                    if occ is None or occ is self:
                        out.append((key, sp))
        return out

    def face_spot(self, sp):
        self.facing = screen_facing(sp["fx"], sp["fy"], self.facing)

    def hop(self, dx, dy=0.0, lift=10.0, then=None):
        """A short leap on the floor by (dx, dy); shortened if it would land somewhere it can't stand."""
        nav = self.world.nav[self.f]
        for k in (1.0, 0.6, 0.3, 0.0):
            x, y = self.x + dx * k, self.y + dy * k
            if nav.ok_at(x, y):
                break
        if abs(x - self.x) > 1:
            self.facing = 1 if x > self.x else -1
        self.path = [{"t": "jump", "x": x, "y": y, "h": 0.0, "lift": lift, "extra": lift * 0.004}]
        self.then = then
        return True

    def act_spot(self, kinds, state, pose, dur, line=None, run=False, types=None):
        spots = self.free_spots(kinds, types)
        if not spots:
            return False
        random.shuffle(spots)
        spots.sort(key=lambda ks: (ks[1]["f"] != self.f) * 1.0 + random.random())
        for key, sp in spots[:3]:
            def arrive(key=key, sp=sp):
                self.face_spot(sp)
                if sp["kind"] == "litter":
                    it = sp["item"]
                    dirty = float(it.state.get("dirty", 0.0))
                    if dirty > 0.75:
                        # too dirty: complain about it instead
                        self.release_spot()
                        self.set_state("rest", 5, pose="grumpy")
                        self.chat("litter_dirty_home", 1.0)
                        self.world.app.play_sound("meow", self.src)
                        return
                    it.state["dirty"] = min(1.0, dirty + 0.2)
                self.set_state(state, random.uniform(*dur), pose=pose, line=line)
                if sp["item"].type == "castle":
                    self.chat("plush", 0.7, t=plush_name())
                elif line:
                    self.chat(line, 0.45)
                if state == "bat":
                    sp["item"].state["swing"] = 1.0
            if self.go_spot(key, run, arrive):
                return True
        return False

    def act_eat(self):
        spots = self.free_spots(("eat", "drink"))
        if not spots:
            return False
        spots.sort(key=lambda ks: (ks[1]["kind"] != "eat", ks[1]["f"] != self.f))
        key, sp = spots[0]

        def arrive():
            it = sp["item"]
            self.face_spot(sp)
            if sp["kind"] == "eat" and it.state.get("food", 0) <= 2:
                self.set_state("rest", 5, pose="sit")
                self.say(self.line("empty"))
                self.world.request_feed(self)
                self.world.app.play_sound("meow", self.src)
                return
            taste = self.world.eat_reaction(self, it) if sp["kind"] == "eat" else "ok"
            dur = {"love": 5.5, "ok": 7, "meh": 2.2}[taste] if sp["kind"] == "eat" else 4
            self.set_state("eat", dur, pose="eat", item=it.id, food=sp["kind"] == "eat", taste=taste)
            if taste == "ok":
                self.chat("eat_start", 0.5)
            self.world.app.play_sound("eat", self.src)
        return self.go_spot(key, False, arrive)

    def act_sleep(self):
        w = self.world
        best = []
        for key, sp in self.free_spots(("sleep",)):
            score = random.uniform(0, 1)
            it = sp["item"]
            if it.type in ("bed", "kid_bed") and any(pr.act == "sleep" and pr.spot and pr.spot[0] == it.id
                                                     for pr in w.people):
                score += 1.5
            if it.type == "cat_bed":
                score += 0.6
            if sp["f"] != self.f:
                score -= 0.4
            best.append((score, key, sp))
        best.sort(key=lambda b: -b[0])
        for _, key, sp in best[:3]:
            def arrive(sp=sp):
                self.set_state("rest", random.uniform(90, 260), pose="loaf", then_sleep=True)
                it = sp["item"]
                if it.type in ("bed", "kid_bed"):
                    self.chat("bed", 0.4)
                elif it.type == "washer":
                    self.chat("washer", 0.4)
                elif sp["h"] >= 110:
                    self.chat("high", 0.4)
            if self.go_spot(key, False, arrive):
                return True
        x, y = w.random_floor(self.f)
        return self.go(self.f, x, y, 0, False,
                       lambda: self.set_state("rest", random.uniform(60, 160), pose="loaf", then_sleep=True))

    def act_perch(self):
        spots = self.free_spots(("perch", "watch", "sleep"))
        if not spots:
            return False
        key, sp = random.choice(spots)

        def arrive():
            self.set_state("rest", random.uniform(12, 45), pose=random.choice(("sit", "sit", "loaf")))
            if sp["item"].type == "cat_tree":
                self.chat("tree", 0.35)
            elif sp["h"] >= 110:
                self.chat("high", 0.35)
        return self.go_spot(key, False, arrive)

    def act_sunbathe(self):
        x, y = self.world.random_floor(2)
        self.release_spot()
        return self.go(2, x, y, 0, False,
                       lambda: (self.set_state("rest", random.uniform(30, 90), pose=random.choice(("loaf", "belly")),
                                               then_sleep=random.random() < 0.4), self.chat("sun", 0.4)))

    def act_hunt(self):
        bs = self.world.butterflies
        if not bs:
            return False
        b = random.choice(bs)
        self.release_spot()

        def arrive():
            if math.hypot(b["x"] - self.x, b["y"] - self.y) < 60 and b in self.world.butterflies:
                self.facing = screen_facing(b["x"] - self.x, b["y"] - self.y, self.facing)
                self.path = [{"t": "jump", "x": self.x + (b["x"] - self.x) * 0.5, "y": self.y + (b["y"] - self.y) * 0.5,
                              "h": 0.0}]
                b["flee"] = 3.0
                self.then = lambda: (self.set_state("rest", 4, pose="sit"), self.chat("bug_miss", 0.6))
            else:
                self.set_state("rest", 3, pose="sit")
        self.set_state("idle", 1e9)
        return self.go(2, b["x"], b["y"], 0, True, arrive)

    def act_wander(self):
        f = self.f if random.random() < 0.85 else random.choice(self.world.floors_ok(self.f))
        x, y = self.world.random_floor(f)
        self.release_spot()
        pose = random.choice(("sit", "sit", "groom", "stand", "loaf", "belly", "stretch"))
        return self.go(f, x, y, 0, False, lambda: self.set_state("rest", random.uniform(5, 16), pose=pose))

    def act_stairs(self):
        f = 1 - self.f if self.f in (0, 1) else 0
        x, y = self.world.random_floor(f)
        self.release_spot()
        self.chat("stairs", 0.3)
        return self.go(f, x, y, 0, random.random() < 0.4,
                       lambda: self.set_state("rest", random.uniform(4, 10), pose="sit"))

    def act_parkour(self):
        """Hop from shelf to shelf (cat tree, wall shelves, cupboards...) without touching the floor."""
        spots = [(k, sp) for k, sp in self.free_spots(("perch", "sleep", "watch")) if sp["h"] >= 25 and
                 sp["item"].f == self.f]
        if len(spots) < 3:
            return False

        w = self.world

        def near(a, b):
            return w.hop_ok(self.f, (a["x"], a["y"], a["h"]), (b["x"], b["y"], b["h"]))
        random.shuffle(spots)
        best = None
        for k0, s0 in spots[:10]:
            chain = [(k0, s0)]
            for _ in range(random.randint(3, 6)):
                nxt = [(k, sp) for k, sp in spots if near(chain[-1][1], sp) and all(k != c[0] for c in chain)]
                if not nxt:
                    break
                # prefer going up, then wandering along
                nxt.sort(key=lambda ks: -(ks[1]["h"] - chain[-1][1]["h"]) + random.uniform(-40, 40))
                chain.append(nxt[0])
            if len(chain) >= 3 and (best is None or len(chain) > len(best)):
                best = chain
        if best is None:
            return False
        k0, s0 = best[0]
        steps = self.plan(self.f, s0["x"], s0["y"], s0["h"], False)
        if steps is None:
            return False
        for k, sp in best[1:]:
            if random.random() < 0.6:
                steps.append({"t": "wait", "dur": random.uniform(0.08, 0.45), "pose": random.choice(("crouch", "sit", "crouch"))})
            steps.append({"t": "jump", "x": sp["x"], "y": sp["y"], "h": sp["h"], "quick": True})
        last_key = best[-1][0]
        self.claim(last_key)
        self.path = steps
        self.running = False

        def arrive():
            self.set_state("rest", random.uniform(15, 40), pose=random.choice(("loaf", "sit", "loaf")))
            self.chat("high", 0.3)
        self.then = arrive
        self.chat("tree", 0.25)
        return True

    # ---- (v24) hide and seek at home: tucked away under the bed, behind the sofa, in the wardrobe... -----------
    def act_hideaway(self, game=False):
        """Hide in a piece of furniture. game: 躲猫猫 you asked for -- it says so, peeks more often after a
        minute, and being found makes it happier."""
        if any(c is not self and c.state == "hiding" for c in self.world.cats):
            return False                          # one hide-and-seek at a time
        spots = self.free_spots(("hideaway",))
        spots = [ks for ks in spots if ks[1]["f"] == self.f] or spots
        if not spots:
            return False
        key, sp = random.choice(spots)
        self.hide_game, self.hide_t0 = game, time.monotonic()
        if game:
            return self.hide_in_dark(key, sp)

        def arrive():
            self.set_state("hiding", random.uniform(180, 300) if not game else 300, pose="loaf", hideaway=key)
            self.hidden = True
            self.face_spot(sp)
            if game:
                house = self.world.house
                if house is not None:
                    house.flash("🙈 %s藏好啦——点它躲的家具找找看（找不到的话，留意露出来的尾巴和耳朵）" % self.name, 6)
                others = [c for c in self.world.cats if c is not self and c.f == self.f and not c.uid.startswith("v:")]
                if others:
                    others[0].say("%s藏好啦～" % self.name, 2.4)
        if self.go_spot(key, False, arrive):
            self.chat("hide", 0.25)
            if game:
                self.say(random.choice(["我去躲啦，不许偷看！", "数到十哦～", "嘿嘿，找不到我的"]), 2.2)
            return True
        return False

    def hide_in_dark(self, key, sp):
        """(v27) 躲猫猫 you asked for: the house goes dark ("…正在找位置") for a few seconds, the cat slips straight
        into the hiding place meanwhile (no point watching it walk there) and the lights come back on."""
        it = self.world.item_by_id(key[0])
        if it is None:
            return False
        self.interrupt()
        self.claim(key)
        self.f, self.x, self.y, self.h = it.f, sp["x"], sp["y"], sp["h"]
        self.parkour = []
        self.set_state("hiding", 300 + HIDE_DARK, pose="loaf", hideaway=key)
        self.hidden = True
        self.face_spot(sp)
        self.bubble = None

        def lights_on():
            if self.state != "hiding":
                return
            self.hide_t0 = time.monotonic()
            house = self.world.house
            if house is not None:
                house.flash("🙈 %s藏好啦——点它躲的家具找找看（找不到的话，留意露出来的尾巴和耳朵）" % self.name, 6)
            others = [c for c in self.world.cats if c is not self and c.f == self.f and not c.uid.startswith("v:")]
            if others:
                others[0].say("%s藏好啦～" % self.name, 2.4)
        self.world.play.go_dark(self.name, HIDE_DARK, lights_on)
        return True

    def st_hiding(self, dt):
        self.set_pose("loaf")
        self.hidden = True
        if getattr(self, "hide_game", False) and self.world.play.dark is None:
            t = self.world.t
            hw = self.world.house
            if self.rustle(t) > 0 and self.rustle(t - dt) <= 0 and hw is not None and hw.isVisible():
                try:
                    self.world.app.play_sound("rustle")
                except Exception:
                    pass
        self.timer -= dt
        if self.timer <= 0:
            self.come_out(False)

    def come_out(self, found):
        """Out of the hiding place: found (somebody clicked there) or just bored of waiting."""
        it = None
        if self.spot is not None:
            it = self.world.item_by_id(self.spot[0])
        self.hidden = False
        self.release_spot()
        nav = self.world.nav[self.f]
        if it is not None:
            x0, y0, x1, y1 = it.fp()
            c = nav.nearest(self.x, y0 - 30, 10)
        else:
            c = nav.nearest(self.x, self.y, 10)
        nx, ny = nav.center(*c) if c else (self.x, self.y)
        self.h = 0.0
        self.set_state("idle", 1e9)
        self.path = [{"t": "jump", "x": nx, "y": ny, "h": 0.0, "lift": 18.0 if found else 6.0}]
        game, t0 = getattr(self, "hide_game", False), getattr(self, "hide_t0", None)
        self.hide_game = False
        if found:
            secs = time.monotonic() - t0 if t0 else 0
            self.say(random.choice(["被你发现啦！", "喵！你怎么知道我在这", "嘿嘿，被抓到了", "喵呜～找到我了"])
                     + (("（%d 秒）" % secs) if game else ""), 2.6)
            try:
                st = self.src.stats
                st["mood"] = min(100.0, st["mood"] + (12 if game else 6))
                self.world.app.add_aff(self.src, 3 if game else 1)
            except Exception:
                pass
            self.spawn("heart", 3 if game else 2)
            self.world.app.play_sound("meow", self.src)
            self.then = lambda: self.set_state("rest", 4.0, pose="happy")
        else:
            self.say(random.choice(["（伸了个懒腰）", "都没人来找我……", "喵～睡了一觉才出来"]), 2.4)
            self.then = lambda: self.set_state("rest", 2.5, pose="stretch")

    def peek(self, t):
        """(kind, strength) of what is peeking out of the hiding place right now: a tail, ears, eyes or a paw.
        (v27) Once every ~30 seconds for a moment (the little tell in hide_tell is there all the time)."""
        seed = (sum(map(ord, self.uid)) % 13) * 0.77
        period = 30.0
        u = (t + seed + 12.0) % period
        if u > 1.6:
            return None, 0.0
        kinds = ("tail", "ears", "eyes", "paw", "tail")
        kind = kinds[int((t + seed + 12.0) // period) % len(kinds)]
        return kind, math.sin(u / 1.6 * math.pi)

    def rustle(self, t):
        """(v27) 0..1: the hiding place gives a little shake now and then (every 15-25 s, ~0.45 s long)."""
        seed = (sum(map(ord, self.uid)) % 11) * 1.31
        n = math.floor((t + seed) / 20.0)
        at = n * 20.0 + ((n * 7919 + len(self.uid) * 31) % 100) / 100.0 * 10.0 - 5.0 + 10.0
        u = t + seed - at
        if 0.0 <= u < 0.45:
            return math.sin(u / 0.45 * math.pi)
        return 0.0

    def hide_tell(self, key, style):
        """(v27) What always shows of a hiding cat if you look closely, picked once per hiding place:
        (kind, side) -- a tail tip, a tuft of fur or the tips of the ears; side -1 / 1 = which end of the furniture."""
        kid = key[0] if isinstance(key[0], int) else sum(map(ord, str(key[0])))
        hsh = sum(map(ord, self.uid)) * 31 + kid * 7 + int(key[1] or 0) * 13
        kinds = {"top": ("ears", "tail"), "door": ("tail", "fur")}.get(style, ("tail", "fur"))
        return kinds[hsh % len(kinds)], (-1 if (hsh // 3) % 2 else 1)

    TREES = ("cat_tree", "big_cat_tree", "tree_tower", "tree_castle", "tree_big", "wall_steps")

    def act_climb(self):
        """(v24) Run up a cat tree level by level (a quick hop at a time) to the top, or to a cubby on the way."""
        w = self.world
        trees = [it for it in w.items if it.f == self.f and it.type in self.TREES]
        if not trees:
            return False
        it = random.choice(trees)
        spots = sorted([(idx, sp) for idx, sp in it.spots() if sp["who"] == "cat" and sp["h"] > 0.5 and
                        sp["kind"] in ("perch", "sleep")], key=lambda isp: isp[1]["h"])
        free = [(idx, sp) for idx, sp in spots if w.occupied.get((it.id, idx)) in (None, self)]
        if len(free) < 2:
            return False
        # where to stop: usually the top, sometimes a cubby on the way
        sleepy = self.src.stats["energy"] < 45
        cubbies = [isp for isp in free if isp[1]["kind"] == "sleep"]
        goal = random.choice(cubbies) if (cubbies and (sleepy or random.random() < 0.35)) else free[-1]
        ladder = []
        for isp in free:                          # one spot per level, each one clearly higher than the last
            if isp is goal or isp[1]["h"] > goal[1]["h"] - 14:
                continue
            if not ladder or isp[1]["h"] >= ladder[-1][1]["h"] + 14:
                ladder.append(isp)
        first = ladder[0] if ladder else goal
        steps = self.plan(self.f, first[1]["x"], first[1]["y"], first[1]["h"], True)
        if steps is None:
            return False
        cur = first[1]
        for idx, sp in ladder[1:] + [goal]:
            if sp is cur:
                continue
            hops = w.perch_route(self.f, (cur["x"], cur["y"], cur["h"]), (sp["x"], sp["y"], sp["h"]), max_hops=3,
                                 me=self)
            if hops is None:
                break
            if random.random() < 0.35:
                steps.append({"t": "wait", "dur": random.uniform(0.06, 0.3), "pose": "crouch"})
            for px, py, ph in hops:
                steps.append({"t": "jump", "x": px, "y": py, "h": ph, "quick": True})
            cur = sp
            if sp is goal[1]:
                break
        self.release_spot()
        self.claim((it.id, goal[0]))
        self.path = steps
        self.running = True

        def arrive():
            if goal[1]["kind"] == "sleep":
                self.set_state("rest", random.uniform(30, 90), pose="loaf", then_sleep=sleepy or random.random() < 0.5)
            else:
                self.set_state("rest", random.uniform(10, 35), pose=random.choice(("sit", "loaf", "sit")))
                if goal[1]["h"] >= 110:
                    self.chat("high", 0.4)
        self.then = arrive
        self.chat("tree", 0.3)
        return True

    def parkour_step(self):
        """Next hop of a shelf run (called from decide)."""
        while self.parkour:
            key = self.parkour.pop(0)
            it = self.world.item_by_id(key[0])
            occ = self.world.occupied.get(key)
            if it is None or (occ is not None and occ is not self):
                continue
            sp = it.spot(key[1])
            self.claim(key)
            self.path = [{"t": "jump", "x": sp["x"], "y": sp["y"], "h": sp["h"]}]
            last = not self.parkour

            def arrive(last=last):
                if last:
                    self.set_state("rest", random.uniform(15, 40), pose=random.choice(("loaf", "sit", "loaf")))
                    self.chat("high", 0.3)
                else:
                    self.set_state("rest", random.uniform(0.5, 1.6), pose=random.choice(("sit", "crouch", "sit")))
            self.then = arrive
            return True
        return False

    def act_zoom(self):
        if self.h > 0.5:
            return False
        self.release_spot()
        path = []
        x, y = self.x, self.y
        nav = self.world.nav[self.f]
        lows = [sp for _, sp in self.free_spots(("perch", "sleep")) if 22 <= sp["h"] <= JUMP and sp["item"].f == self.f]
        for _ in range(random.randint(3, 4)):
            nx, ny = self.world.random_floor(self.f)
            near = [sp for sp in lows if math.hypot(sp["x"] - nx, sp["y"] - ny) < 160]
            if near and random.random() < 0.55:
                # on the way: up onto something low and straight off the other side, without stopping
                sp = random.choice(near)
                c = nav.nearest(sp["x"] - 40, sp["y"], 8)
                if c is not None:
                    ax, ay = nav.center(*c)
                    path += self.walk_steps(self.f, (x, y), (ax, ay), self.run_v)
                    path.append({"t": "jump", "x": sp["x"], "y": sp["y"], "h": sp["h"], "quick": True})
                    c2 = nav.nearest(sp["x"] + (sp["x"] - ax) * 1.4, sp["y"] + (sp["y"] - ay) * 1.4, 8)
                    bx, by = nav.center(*c2) if c2 is not None else (ax, ay)
                    path.append({"t": "jump", "x": bx, "y": by, "h": 0.0, "quick": True})
                    x, y = bx, by
                    continue
            path += self.walk_steps(self.f, (x, y), (nx, ny), self.run_v)
            x, y = nx, ny
        self.path = path
        self.running = True
        self.then = lambda: self.set_state("rest", 4, pose="pant")
        return True

    def act_social(self):
        o = self.world.other_cat(self)
        if o is None or not o.free() or o.f != self.f or o.h > 0.5 or o.stairs_u is not None or self.h > 0.5:
            return False
        side = 1 if self.x < o.x else -1
        tx, ty = o.x - side * 30, o.y
        if not self.world.nav[self.f].ok_at(tx, ty):
            tx = o.x + side * 30
        kinds = ["nuzzle", "groom_other", "greet"]
        if self.src.stats["energy"] > 40 and o.src.stats["energy"] > 40 and self.h < 0.5:
            kinds += ["wrestle", "wrestle"]
        kind = random.choice(kinds)
        o.set_state("rest", 8, pose="sit", locked=True)
        self.release_spot()

        def arrive():
            self.facing = screen_facing(o.x - self.x, o.y - self.y)
            o.facing = -self.facing
            if kind == "wrestle":
                dur = random.uniform(4.5, 8)
                self.set_state("wrestle", dur, other=o, lead=True, next=0.0)
                o.set_state("wrestle", dur, other=self, lead=False, next=0.35)
                self.chat("wrestle_life", 0.4)
                return
            self.set_state("social", 5.0, pose=kind, other=o)
            o.set_state("social", 5.0, pose="sit" if kind == "groom_other" else kind, other=self)
            if kind == "greet":
                self.chat("greet_a", 0.5)
            self.spawn("heart", 1)
        return self.go(self.f, tx, ty, 0, False, arrive)

    def act_lap(self, pr):
        if pr.spot is None:
            return False
        if pr.act != "sleep" and random.random() < 0.6 and self.h < 0.5 and self.world.cat_jump_to_lap(self, pr):
            return True
        it = self.world.item_by_id(pr.spot[0])
        if it is None:
            return False
        spots = [(k, sp) for k, sp in self.free_spots(("perch", "sleep")) if sp["item"] is it]
        if not spots:
            return False
        key, sp = min(spots, key=lambda ks: math.hypot(ks[1]["x"] - pr.x, ks[1]["y"] - pr.y))

        def arrive():
            self.facing = screen_facing(pr.x - self.x, pr.y - self.y, self.facing)
            if pr.act == "sleep":
                self.set_state("rest", random.uniform(120, 300), pose="loaf", then_sleep=True)
                self.chat("bed", 0.4)
            else:
                self.set_state("rest", random.uniform(20, 60), pose="loaf", then_sleep=random.random() < 0.5)
                self.chat("lap", 0.5, p=pr.name)
                if random.random() < 0.5:
                    self.world.app.play_sound("purr", self.src)
        return self.go_spot(key, False, arrive)

    def act_beg(self, pr):
        spots = [(k, sp) for k, sp in self.free_spots(("beg",)) if sp["item"].f == pr.f]
        if not spots:
            return False
        key, sp = spots[0]

        def arrive():
            self.facing = screen_facing(pr.x - self.x, pr.y - self.y, self.facing)
            self.set_state("rest", random.uniform(6, 12), pose="beg")
            self.chat("beg", 0.6, p=pr.name)
        return self.go_spot(key, False, arrive)

    def near_point(self, pr, dist):
        nav = self.world.nav[pr.f]
        angs = [0, 180] if random.random() < 0.5 else [180, 0]
        angs += [15, 165, 345, 195, 35, 145, 325, 215]
        for a in angs:
            x, y = pr.x + math.cos(math.radians(a)) * dist, pr.y + math.sin(math.radians(a)) * dist
            if nav.ok_at(x, y) and self.world.free_point(pr.f, x, y, (self, pr)):
                return x, y
        c = nav.nearest(pr.x + dist, pr.y, 4)
        return nav.center(*c) if c else (pr.x, pr.y)

    def act_kidplay(self, pr):
        x, y = self.near_point(pr, 42)
        self.release_spot()

        def arrive():
            self.facing = screen_facing(pr.x - self.x, pr.y - self.y)
            self.set_state("play", random.uniform(10, 20), toward=pr)
            self.chat("kid", 0.4, p=pr.name)
        return self.go(pr.f, x, y, 0, True, arrive)

    def act_rub(self, pr):
        x, y = self.near_point(pr, 28)
        self.release_spot()

        def arrive():
            self.facing = screen_facing(pr.x - self.x, pr.y - self.y)
            self.set_state("rest", 4.0, pose="nuzzle")
            self.spawn("heart", 1)
        return self.go(pr.f, x, y, 0, False, arrive)

    # ---- mischief & play ------------------------------------------------------------------
    def act_laptop(self, pr):
        """Lie down right on the laptop of whoever is working."""
        it = self.world.item_by_id(pr.spot[0]) if pr.spot else None
        if it is None or it.cat.get("h", 99) > JUMP or self.h > 0.5:
            return False
        h = it.cat["h"]
        x0, y0, x1, y1 = it.fp()
        tx = clamp(it.x + (pr.x - it.x) * 0.3, x0 + 14, x1 - 14)
        ty = clamp(it.y + (pr.y - it.y) * 0.3, y0 + 10, y1 - 10)
        self.release_spot()

        def arrive():
            if pr.act != "laptop" or pr.state != "act":
                self.set_state("rest", 3, pose="sit")
                return
            self.facing = screen_facing(pr.x - self.x, pr.y - self.y, self.facing)
            self.set_state("laptop", random.uniform(18, 45), by=pr.uid, on=it.id, react=random.uniform(2.5, 5))
            self.chat("laptop_life", 0.5)
        return self.go(it.f, tx, ty, h, False, arrive)

    def st_laptop(self, dt):
        pr = self.world.agent_by_uid(self.data.get("by"))
        self.timer -= dt
        self.set_pose("loaf" if self.st_t < 6 else "sleep")
        if pr is None or pr.act != "laptop" or pr.state != "act":
            self.timer = min(self.timer, 0.5)
        elif self.st_t > self.data.get("react", 4) and not self.data.get("reacted"):
            self.data["reacted"] = True
            pr.say(life_line("laptop", c=self.name), 2.4)
            if random.random() < 0.5:
                self.data["lift"] = self.st_t + 2.6
            else:
                self.data["keep"] = True
        if self.data.get("lift") and self.st_t > self.data["lift"]:
            if pr is not None:
                pr.say(life_line("laptop_lift"), 2.0)
            self.timer = 0
        if self.timer <= 0:
            self.leave_top()

    def leave_top(self, then_pose="groom"):
        """Hop down off the furniture top it is on, to the front."""
        land = self.world.play.landing_point(self, random.choice((-0.5, 0.5)), -1.0, dists=(50, 70, 36, 90))
        self.data.pop("on", None)
        if land is None:
            self.h = 0.0
            self.set_state("rest", 4, pose=then_pose)
            return
        self.set_state("idle", 1e9)
        self.path = [{"t": "jump", "x": land[0], "y": land[1], "h": 0.0}]
        self.then = lambda: self.set_state("rest", random.uniform(4, 9), pose=then_pose)

    def act_meet_visitor(self, v):
        if self.h > 0.5 or v.away:
            return False
        x, y = self.near_point(v, 36)
        self.release_spot()

        def arrive():
            if v.away or v.leaving:
                self.set_state("rest", 3, pose="sit")
                return
            self.facing = screen_facing(v.x - self.x, v.y - self.y, self.facing)
            if random.random() < HC.trait(self).get("friendly", 0.5):
                self.set_state("social", 4.0, pose="nuzzle", other=v)
                self.say(random.choice(HC.LINES["greet_visitor"]), 1.8)
                self.spawn("heart", 1)
                if v.state in ("idle", "rest"):
                    v.facing = -self.facing
                    v.set_state("rest", 4.0, pose="greet")
            else:
                self.set_state("rest", 2.5, pose="arch")
                self.say(random.choice(HC.LINES["hiss"]), 1.6)
                self.world.app.play_sound("hiss", self.src)
                if v.state in ("idle", "rest") and not v.data.get("waiting"):
                    side = 1 if v.x >= self.x else -1
                    v.hop(side * 50, random.uniform(-15, 15), lift=10,
                          then=lambda: v.set_state("rest", 5, pose="grumpy"))
                    if random.random() < 0.3:
                        v.leave_at = min(v.leave_at, self.world.t + 20)
        return self.go(v.f, x, y, 0, False, arrive)

    def st_treat(self, dt):
        kind = self.data.get("kind")
        self.timer -= dt
        if kind == "stick":
            self.set_pose("lick")
            by = self.world.agent_by_uid(self.data.get("by")) if self.data.get("by") else None
            if by is not None:
                self.facing = 1 if by.x >= self.x else -1
        else:
            self.set_pose("eat")
        if random.random() < dt * 0.8:
            self.spawn("heart", 1)
        if self.timer <= 0:
            did = self.data.get("drop")
            if did is not None:
                self.world.drops = [d for d in self.world.drops if d["id"] != did]
            if self.data.get("visitor_meal"):
                self.world.visitor_fed(self)
            self.set_state("rest", random.uniform(4, 8), pose="groom")

    def act_morsel(self):
        drops = self.world.morsel_on_floor(self.f)
        if not drops or self.h > 0.5:
            return False
        d = min(drops, key=lambda d: math.hypot(d["x"] - self.x, d["y"] - self.y))
        if d.get("claimed") and d["claimed"] is not self:
            return False
        d["claimed"] = self
        side = 1 if self.x < d["x"] else -1
        tx, ty = d["x"] - side * 14, d["y"]
        if not self.world.nav[self.f].ok_at(tx, ty):
            tx, ty = d["x"], d["y"]
        self.release_spot()

        def arrive():
            if d not in self.world.drops:
                self.set_state("rest", 3, pose="sit")
                return
            self.facing = 1 if d["x"] >= self.x else -1
            self.set_state("morsel", 2.2, drop=d["id"])
            self.world.app.play_sound("eat", self.src)
        return self.go(self.f, tx, ty, 0, True, arrive)

    def st_morsel(self, dt):
        self.set_pose("eat")
        self.timer -= dt
        if self.timer <= 0:
            did = self.data.get("drop")
            self.world.drops = [d for d in self.world.drops if d["id"] != did]
            self.src.stats["hunger"] = max(0.0, self.src.stats["hunger"] - 4)
            self.chat("morsel_home", 0.6)
            self.set_state("rest", random.uniform(3, 6), pose="groom")

    def act_beg_table(self, pr):
        if self.h > 0.5:
            return False
        x, y = self.near_point(pr, 26)
        self.release_spot()

        def arrive():
            if pr.act != "eat":
                self.set_state("rest", 3, pose="sit")
                return
            self.facing = screen_facing(pr.x - self.x, pr.y - self.y, self.facing)
            self.set_state("rest", random.uniform(10, 20), pose="beg", beg_for=pr.uid)
            self.chat("beg_table_home", 0.5)
        return self.go(pr.f, x, y, 0, False, arrive)

    KNOCK_TYPES = ("table", "desk", "counter", "shoe_cabinet", "nightstand", "coffee_table", "dresser")

    def act_knock(self):
        """Jump onto a table, find something near the edge, and pat it off."""
        w = self.world
        if self.h > 0.5 or w.everyone_asleep():
            return False
        cands = [it for it in w.items if it.type in self.KNOCK_TYPES and it.f == self.f
                 and 30 < it.cat.get("h", 99) <= JUMP]
        if not cands:
            return False
        it = random.choice(cands)
        if any(d.get("table") and d.get("item") == it.id for d in w.drops):
            return False
        x0, y0, x1, y1 = it.fp()
        if x1 - x0 < 40:
            return False
        tx = random.uniform(x0 + 16, x1 - 16)
        ty = y0 + 9
        h = it.cat["h"]
        self.release_spot()

        def arrive():
            side = random.choice((-1, 1))
            if not (x0 + 6 < self.x + side * 16 < x1 - 6):
                side = -side
            self.facing = side
            kind = random.choice(("mug", "pen", "remote", "cup", "book")) if it.type != "counter" else \
                random.choice(("mug", "cup"))
            d = {"f": it.f, "x": self.x + side * 15, "y": self.y - 3, "z": h, "vx": 0.0, "vy": 0.0, "vz": 0.0,
                 "kind": kind, "rot": 0.0, "vr": 0.0, "rest": True, "t": 0.0, "id": random.randint(1, 1 << 30),
                 "table": True, "item": it.id, "by": self}
            w.drops.append(d)
            self.set_state("knock", 9.0, on=it.id, drop=d["id"], side=side)
        return self.go(it.f, tx, ty, h, False, arrive)

    def st_knock(self, dt):
        w = self.world
        t = self.st_t
        d = next((x for x in w.drops if x["id"] == self.data.get("drop")), None)
        self.timer -= dt
        if d is None:
            self.leave_top()
            return
        if d.get("table"):
            if t < 1.4:
                self.set_pose("sit")                       # look at it... then at you
                if t > 0.7:
                    self.facing = -self.data["side"] if int(t * 2) % 2 == 0 else self.data["side"]
                return
            self.facing = self.data["side"]
            if not self.data.get("warned"):
                self.data["warned"] = True
                pr = next((p for p in w.present_people() if p.f == self.f and p.act != "sleep"
                           and math.hypot(p.x - self.x, p.y - self.y) < 320), None)
                if pr is not None and random.random() < 0.7:
                    pr.say(life_line("knock_watch", c=self.name), 2.0)
                else:
                    self.chat("knock_life", 0.6)
            self.set_pose("swat" if int(t * 2.2) % 2 == 0 else "sit")
            d["x"] += self.data["side"] * dt * 6.0          # nudge, nudge...
            it = w.item_by_id(d.get("item"))
            over = it is None or not (it.fp()[0] - 1 < d["x"] < it.fp()[2] + 1) or t > 3.6
            if over:
                d.pop("table", None)
                d.update(rest=False, vx=self.data["side"] * random.uniform(30, 60), vy=random.uniform(-26, -10),
                         vz=40.0, vr=self.data["side"] * random.uniform(260, 460))
                self.data["fell"] = t
            return
        if t - self.data.get("fell", t) < 2.2:
            self.set_pose("sit")                          # watch it fall
            return
        self.leave_top("sit")

    def act_plush_bat(self):
        w = self.world
        names = [n for n in PLUSH_NAMES if w.plush[n]["at"] == "floor" and w.plush[n].get("f") == self.f]
        if not names or self.h > 0.5:
            return False
        name = random.choice(names)
        pl = w.plush[name]
        side = random.choice((-1, 1))
        tx, ty = pl["x"] - side * 26, pl["y"] + 2
        if not w.nav[self.f].ok_at(tx, ty):
            side = -side
            tx = pl["x"] - side * 26
        self.release_spot()

        def arrive():
            if w.plush[name].get("at") != "floor":
                self.set_state("rest", 3, pose="sit")
                return
            self.facing = side
            self.set_state("plushbat", random.uniform(4, 7), toy=name, side=side)
        return self.go(self.f, tx, ty, 0, False, arrive)

    def st_plushbat(self, dt):
        w = self.world
        name = self.data.get("toy")
        pl = w.plush.get(name, {})
        self.timer -= dt
        if pl.get("at") != "floor":
            self.set_state("rest", 3, pose="sit")
            return
        ph = int(self.st_t * 1.8) % 3
        self.set_pose(("crouch", "swat", "sit")[ph])
        if ph == 1 and not self.data.get("hit%d" % int(self.st_t * 1.8)):
            self.data["hit%d" % int(self.st_t * 1.8)] = True
            nx = pl["x"] + self.data["side"] * random.uniform(8, 18)
            ny = pl["y"] + random.uniform(-6, 6)
            if w.nav[pl["f"]].ok_at(nx, ny):
                pl["x"], pl["y"] = nx, ny
                if math.hypot(self.x - pl["x"], self.y - pl["y"]) > 34:
                    self.hop(self.data["side"] * 14, 0, lift=5)
            if random.random() < 0.25:
                w.plush_say(name, random.choice(["别拍我啦～", "哎哟哎哟", "转圈圈——", "我要告诉妈妈！"]))
        if self.timer <= 0:
            w.save_plush()
            self.set_state("rest", random.uniform(4, 8), pose="groom")

    def st_wrestle(self, dt):
        """Play-fighting: little hops in and out, swats, rolling onto the back to kick."""
        o = self.data.get("other")
        self.timer -= dt
        if o is None or o.state not in ("wrestle", "chasecat") or o.f != self.f:
            self.timer = min(self.timer, 0.2)
        if self.timer <= 0:
            if self.data.get("lead") and o is not None and o.state == "wrestle" and random.random() < 0.6:
                # ...and it turns into a chase round the room
                runner, chaser = (o, self) if random.random() < 0.5 else (self, o)
                x, y = self.world.random_floor(self.f)
                runner.set_state("idle", 1e9)
                runner.go(runner.f, x, y, 0, True, lambda r=runner: r.set_state("rest", 4, pose="pant"))
                dur = random.uniform(4, 7)
                chaser.set_state("chasecat", dur, other=runner, length=dur)
                if runner.state == "wrestle":
                    runner.set_state("idle", 1e9)
                return
            self.set_state("rest", random.uniform(3, 6), pose=random.choice(("pant", "groom", "sit")))
            return
        if o is not None:
            self.facing = screen_facing(o.x - self.x, o.y - self.y, self.facing)
        if self.st_t >= self.data.get("next", 0):
            r = random.random()
            d = (o.x - self.x) if o is not None else 0
            if r < 0.3 and o is not None:
                step = clamp(d - (24 if d > 0 else -24), -26, 26)          # pounce in
                self.hop(step, random.uniform(-6, 6), lift=random.uniform(6, 14))
                self.data["move"] = "jump"
            elif r < 0.45:
                self.hop(-self.facing * random.uniform(10, 20), random.uniform(-6, 6), lift=8)   # spring back
                self.data["move"] = "jump"
            elif r < 0.62 and not self.data.get("lead"):
                self.data["move"] = "kick"
            elif r < 0.8:
                self.data["move"] = "swat"
            else:
                self.data["move"] = "crouch"
            self.data["next"] = self.st_t + random.uniform(0.45, 0.9)
            if random.random() < 0.15:
                self.chat("wrestle_life", 0.5)
        mv = self.data.get("move", "crouch")
        if mv != "jump":
            self.set_pose(mv)

    def st_chasecat(self, dt):
        """Chasing the other cat round the room (re-aims each time it catches up with where it was)."""
        o = self.data.get("other")
        if o is None or o.f != self.f or self.st_t > self.data.get("length", 6) or (not o.path and o.state != "idle"):
            self.stop()
            self.set_state("rest", random.uniform(3, 5), pose="pant")
            return
        side = 1 if o.x > self.x else -1
        tx, ty = o.x - 24 * side, o.y
        if not self.world.nav[self.f].ok_at(tx, ty):
            tx, ty = o.x, o.y
        if not self.go(self.f, tx, ty, 0, True):
            self.set_state("rest", 3, pose="pant")
        self.set_pose("run")

    # ---- driven by others --------------------------------------------------------------
    def interrupt(self):
        self.parkour = []
        if self.state == "hiding":
            self.hidden = False
        self.stop()
        self.running = False
        if self.h > 0.5 and self.spot_info() is None:
            self.h = 0.0
        o = self.data.get("other")
        if o is not None and o.state == "social":
            o.set_state("idle", 1.0)

    def present(self, text, after=None, reason=None, tid=None):
        """A message / to-do / reminder: come to the front of the storey and say it."""
        lines = list(after or [])
        w = self.world
        busy = (w.battle is not None and w.in_battle(self)) or self.traveling is not None or self.f not in (0, 1, 2)
        if self.state == "held" or self.ctrl is not None or busy:
            self.say(text)                      # in a fight / out and about: just say it where it is
            for i, ln in enumerate(lines):
                self.say(ln, 4.0, 3.6 + i * 4.2)
            return
        self.interrupt()
        self.release_spot()
        x, y = self.world.front_spot(self.f, self.x)

        def arrive():
            self.facing = 1
            self.set_state("present", 7.5 + 4.2 * len(lines), pose="sit", reason=reason, tid=tid)
            self.say(text)
            for i, ln in enumerate(lines):
                self.say(ln, 4.0, 3.6 + i * 4.2)
        self.go(self.f, x, y, 0, True, arrive)
        self.say(text)
        self.world.house.show_floor_of(self)

    # ---- update ------------------------------------------------------------------------
    def update(self, dt):
        self.t += dt
        self.st_t += dt
        self.tick_fx(dt)
        self.tick_needs(dt)
        if self.landed > 0:
            self.landed -= dt
        self.look_cd = getattr(self, "look_cd", 0.0) - dt
        if self.look_cd <= 0:
            self.look_cd = 0.35
            self.update_gaze()
        self.think_cd = getattr(self, "think_cd", random.uniform(10, 30)) - dt
        if self.think_cd <= 0:
            self.think_cd = random.uniform(35, 75)
            icon = self.world.need_icon(self) if self.ctrl is None and not self.uid.startswith("v:") else None
            if icon:
                self.think = (icon, time.monotonic() + 3.2)
        if self.state == "carried":
            self.world.step_carried(self, dt)
            return
        if self.state == "held":
            self.set_pose("dangle")
            self.swing = math.sin(self.t * 4) * 6
            return
        if self.state == "fall":
            self.data["vh"] = self.data.get("vh", 0) - 900 * dt
            self.h += self.data["vh"] * dt
            if self.h <= 0:
                self.h = 0.0
                self.set_state("rest", 2.0, pose="sit")
                self.landed = 0.25
                self.chat("land", 0.5)
            else:
                self.set_pose("jump")
            return
        if self.state == "flee":
            self.timer -= dt
            if self.timer <= 0:
                self.stop()
                self.running = False
                self.set_state("rest", 4, pose="pant")
                return
        if self.ctrl is not None and self.world.play.ctrl_step(self, dt):
            return
        if self.path:
            self.update_path(dt)
            if self.path:
                st = self.path[0]
                jumping = st["t"] == "jump"
                if st["t"] == "wait":
                    self.set_pose(st.get("pose", "sit"))
                elif getattr(self, "pause", 0.0) > 0 and not jumping:
                    self.set_pose("stand")
                elif jumping and st.get("prep", 0.0) > 0:
                    self.set_pose("crouch")
                else:
                    self.set_pose("jump" if jumping else ("run" if (self.running or self.state == "flee") else "walk"))
            else:
                self.jump_info = None
            return
        self.running = False
        if self.landed > 0:
            self.set_pose("land")
            return
        getattr(self, "st_" + self.state, self.st_idle)(dt)

    def st_idle(self, dt):
        if self.ctrl is not None:
            self.set_pose("sit" if self.st_t > 5 else "stand")
            return
        self.set_pose("stand")
        self.timer -= dt
        if self.timer <= 0:
            self.decide()
            if not self.path and self.state == "idle":
                self.timer = random.uniform(2, 5)

    def st_rest(self, dt):
        pose = self.data.get("pose", "sit")
        if pose == "grumpy_wake":
            pose = "grumpy" if self.st_t < 1.4 else "yawn"
        if self.data.get("then_sleep") and self.st_t > 6:
            pose = self.data["pose"] = "sleep"
            if random.random() < dt * 0.15:
                self.spawn("z", 1)
        if (pose == "groom" and self.st_t > 4) or (pose == "stretch" and self.st_t > 1.6) or \
                (pose == "nuzzle" and self.st_t > 3):
            pose = self.data["pose"] = "sit"
        self.set_pose(pose)
        sp = self.spot_info()
        if sp is not None and sp["kind"] == "watch" and random.random() < dt * 0.05:
            self.world.app.play_sound("chirp", self.src)
        if sp is not None and sp["kind"] == "tv" and pose in ("sit", "loaf") and \
                self.world.tv_programme(sp["item"]) in ("cat", "sea", "nature"):
            # something moving on the screen: chatter at it, and now and then reach up and paw at it
            if (self.st_t % 7.0) > 5.6:
                self.set_pose("swat")
            if random.random() < dt * 0.04:
                self.world.app.play_sound("chirp", self.src)
        self.timer -= dt
        if self.timer <= 0:
            self.set_state("idle", random.uniform(1, 3))
            if pose == "sleep":
                self.set_state("rest", 1.6, pose="yawn")

    def st_eat(self, dt):
        self.set_pose("eat")
        it = self.world.item_by_id(self.data.get("item"))
        s = self.src.stats
        if self.data.get("food") and it is not None:
            rate = {"love": 4.5, "ok": 3.0, "meh": 1.2}.get(self.data.get("taste"), 3.0)
            take = min(it.state.get("food", 0), dt * rate)
            it.state["food"] = it.state.get("food", 0) - take
            s["hunger"] = max(0.0, s["hunger"] - take * 2.2)
            if it.state["food"] <= 0.5:
                self.timer = min(self.timer, 0.5)
        self.timer -= dt
        if self.timer <= 0:
            self.chat("eat_done", 0.4)
            s["mood"] = min(100.0, s["mood"] + 4)
            self.set_state("rest", random.uniform(4, 8), pose="groom")

    def st_scratch(self, dt):
        self.set_pose("stretch")
        sp = self.spot_info()
        if sp is not None:
            it = sp["item"]
            it.state["wear"] = min(1.0, float(it.state.get("wear", 0.0)) + dt * 0.004)
        self.timer -= dt
        if self.timer <= 0:
            self.set_state("rest", 3, pose="sit")

    def st_bat(self, dt):
        self.set_pose("swat" if int(self.st_t * 1.6) % 3 != 2 else "sit")
        sp = self.spot_info()
        if sp is not None:
            sp["item"].state["swing"] = 1.0
        self.timer -= dt
        if self.timer <= 0:
            self.set_state("rest", 3, pose="sit")

    def st_nibble(self, dt):
        self.set_pose("eat")
        self.timer -= dt
        if self.st_t > 1.0 and not self.data.get("scolded"):
            self.data["scolded"] = True
            pr = self.world.nearest_adult(self)
            if pr is not None and random.random() < 0.6:
                pr.say(pick(PEOPLE_LINES["scold"], c=self.name))
        if self.timer <= 0:
            self.set_state("rest", 3, pose="sit")

    def st_social(self, dt):
        self.set_pose(self.data.get("pose", "sit"))
        o = self.data.get("other")
        if o is not None and o.state != "social":
            self.timer = min(self.timer, 0.3)
        self.timer -= dt
        if self.timer <= 0:
            self.set_state("rest", random.uniform(3, 8), pose=random.choice(("sit", "groom", "loaf")))

    def st_play(self, dt):
        pr = self.data.get("toward")
        if pr is not None:
            self.facing = screen_facing(pr.x - self.x, pr.y - self.y, self.facing)
        ph = int(self.st_t * 1.4) % 4
        self.set_pose(("crouch", "swat", "crouch", "happy")[ph])
        if ph == 1 and random.random() < dt * 1.2 and self.h < 0.5:
            # little sideways hops and pounces around the kid, not just straight up
            side = random.choice((-1, 1))
            self.hop(side * random.uniform(16, 34), random.uniform(-10, 10), lift=random.uniform(4, 14))
        self.timer -= dt
        if self.timer <= 0 or (pr is not None and pr.act != "play"):
            self.set_state("rest", 4, pose="pant" if self.src.stats["energy"] < 40 else "sit")

    def st_wand(self, dt):
        pr = self.data.get("by")
        if pr is None or pr.act != "wand":
            self.set_state("rest", 4, pose="happy")
            return
        self.facing = screen_facing(pr.x - self.x, pr.y - self.y, self.facing)
        ph = (self.st_t * 1.3) % 3
        if ph < 1.0:
            self.set_pose("crouch")
        elif ph < 1.15 and not self.path:
            # leap at the feather: it flicks from side to side, so does the cat
            tip = pr.x + pr.facing * 46 + math.sin(self.world.t * 1.7) * 26
            dx = clamp(tip - self.x, -40, 40)
            if abs(dx) < 8:
                dx = random.choice((-1, 1)) * 14
            self.hop(dx, random.uniform(-6, 6), lift=random.uniform(16, 30))
        else:
            self.set_pose("swat")
        self.src.stats["mood"] = min(100.0, self.src.stats["mood"] + dt * 0.5)

    def st_petted(self, dt):
        """Being stroked. How it goes depends on the cat's mood (see LifeWorld.pet_style)."""
        style = self.data.get("style", "lean")
        t = self.st_t
        by = self.world.agent_by_uid(self.data["by"]) if self.data.get("by") else None
        self.timer -= dt
        if style == "refuse":
            if t < 1.0:
                self.set_pose("grumpy")
                if not self.data.get("said"):
                    self.data["said"] = True
                    self.chat("refuse_life", 1.0)
                return
            if by is not None and by.state == "act" and by.act == "pet":
                by.say(life_line("pet_refuse"), 1.8)
                by.timer = min(by.timer, 0.6)
            side = -1 if (by is not None and by.x > self.x) else (1 if by is not None else random.choice((-1, 1)))
            x, y = self.x + side * random.uniform(60, 110), self.y + random.uniform(-30, 30)
            nav = self.world.nav[self.f]
            if not nav.ok_at(x, y):
                x, y = self.world.random_floor(self.f)
            self.set_state("idle", 1e9)
            if not self.go(self.f, x, y, 0, False, lambda: self.set_state("rest", random.uniform(5, 10), pose="groom")):
                self.set_state("rest", 5, pose="groom")
            return
        if style == "belly":
            trap = self.data.get("trap")
            if t < 0.45:
                self.set_pose("loaf")
            elif trap is not None and t > trap:
                if t < trap + 1.3:
                    self.set_pose("kick")
                    if not self.data.get("kicked"):
                        self.data["kicked"] = True
                        self.spawn("ex", 1)
                        if by is not None:
                            by.say(life_line("belly_trap"), 2.2)
                        self.world.app.play_sound("meow", self.src)
                    return
                if by is not None and by.state == "act" and by.act == "pet":
                    by.pose = "stand"
                    by.timer = min(by.timer, 0.8)
                side = -1 if (by is not None and by.x > self.x) else 1
                self.set_state("idle", 1e9)
                self.hop(side * random.uniform(30, 50), random.uniform(-12, 12), lift=8,
                         then=lambda: self.set_state("rest", random.uniform(4, 8), pose="groom"))
                return
            else:
                self.set_pose("belly")
                if not self.data.get("said") and t > 1.0:
                    self.data["said"] = True
                    if by is not None and random.random() < 0.5:
                        by.say(life_line("belly_ok"), 2.0)
        elif style == "rub":
            self.set_pose("nuzzle" if (t % 2.6) < 1.8 else "happy")
            if random.random() < dt * 1.6:
                self.spawn("heart", 1)
        else:
            self.set_pose("happy" if t < 2.5 else "loaf")
            if t > 2.5 and self.q is not None and random.random() < dt * 0.4:
                self.spawn("heart", 1)
        if random.random() < dt * 0.8:
            self.spawn("heart", 1)
        if not self.data.get("purr") and t > 0.8:
            self.data["purr"] = True
            if random.random() < 0.5:
                self.world.app.play_sound("purr", self.src)
        if self.timer <= 0:
            self.set_state("rest", random.uniform(4, 10), pose=random.choice(("sit", "groom", "loaf")))

    def st_flee(self, dt):
        if not self.path:
            x, y = self.world.random_floor(self.f)
            self.go(self.f, x, y, 0, True)

    def st_present(self, dt):
        self.set_pose("sit")
        self.timer -= dt
        if self.timer <= 0:
            self.set_state("idle", 2)

    # ---- drawing ---------------------------------------------------------------------------
    LOOK_POSES = ("sit", "stand", "loaf", "beg", "happy", "crouch", "walk", "eat", "groom", "cradle", "pant", "swat")

    def update_gaze(self):
        """Pick something worth looking at: someone walking by, a thing falling, a butterfly, the TV."""
        w = self.world
        self.look_at = None
        if self.pose in ("sleep", "belly", "kick", "dangle", "wriggle", "jump"):
            return
        best = None
        hx, hy = self.x, self.y
        for d in w.drops:
            if d["f"] == self.f and not d.get("rest") and not d.get("table"):
                best = (0, (d["x"], d["y"], d["z"]))
        for a in w.agents():
            if a is self or a.away or a.f != self.f or not a.visible_on(self.f):
                continue
            dist = math.hypot(a.x - hx, a.y - hy)
            if dist > 230:
                continue
            score = dist - (90 if a.path else 0) - (60 if a.bubble else 0) - (40 if a.is_cat else 0)
            if a.path or a.bubble or dist < 90:
                if best is None or score < best[0]:
                    z = a.h + (20 if a.is_cat else 70 * getattr(a, "hs", 1.0))
                    best = (score, (a.x, a.y, z))
        if self.f == 2:
            for b in w.butterflies:
                dist = math.hypot(b["x"] - hx, b["y"] - hy)
                if dist < 200 and (best is None or dist - 120 < best[0]):
                    best = (dist - 120, (b["x"], b["y"], b["z"]))
        sp = self.spot_info()
        if sp is not None and sp["kind"] == "tv":
            it = sp["item"]
            best = (-999, (it.x, it.y, 60))
        if best is None:
            self.behind_t = 0.0
            return
        tx, ty, tz = best[1]
        self.look_at = (tx, ty, tz)
        # it is behind: a cat sitting about turns round to see
        dx = tx - self.x
        if dx * self.facing < -25 and self.state in ("rest", "idle") and not self.path and self.ctrl is None \
                and self.pose in ("sit", "loaf", "stand") and self.data.get("pose") != "sleep":
            self.behind_t = getattr(self, "behind_t", 0.0) + 0.35
            if self.behind_t > 1.6:
                self.facing = -self.facing
                self.behind_t = 0.0
        else:
            self.behind_t = 0.0

    def apply_gaze(self, q):
        tgt = getattr(self, "look_at", None)
        if tgt is None or self.pose not in self.LOOK_POSES:
            return
        hx, hy = H.iso(self.x, self.y, self.h + 22)
        tx, ty = H.iso(*tgt)
        dx, dy = (tx - hx) * self.facing, ty - hy
        n = math.hypot(dx, dy)
        if n < 4:
            return
        k = min(1.0, n / 60.0)
        if dx < 0:
            k *= 0.4                       # only the eyes can look back over the shoulder
        q["lookx"] = clamp(dx / n * k, -1.0, 1.0)
        q["looky"] = clamp(dy / n * k, -1.0, 1.0)
        if dx > 0:
            q["hrot"] += clamp(dy / n * 10, -10, 10)

    def build_q(self, dt):
        q = POSES.get(self.pose, POSES["stand"])(self.t, self)
        self.apply_gaze(q)
        q["acc_h"], q["acc_b"] = self.src.acc_h, self.src.acc_b
        try:
            fb, fh = getattr(self.src, "shape", None) or self.world.app.body_shape(self.kind)
        except Exception:
            fb, fh = 1.0, 1.0
        if fb != 1.0:
            for k in ("brx", "bry", "cr", "hprx", "hpry"):
                q[k] *= fb
        if fh != 1.0:
            q["hs"] *= fh
        now = time.monotonic()
        if q["eyes"] in ("open", "big", "half"):
            if now > self.next_blink:
                self.blink_until = now + 0.13
                self.next_blink = now + random.uniform(2, 6)
            if now < self.blink_until:
                q["eyes"] = "closed"
        if self.bubble and now - self.bubble["t0"] < 1.0 and q["mouth"] == "w":
            q["mouth"] = "open" if int((now - self.bubble["t0"]) * 8) % 2 == 0 else "w"
        if self.blend_t < 1.0 and self.blend_from is not None:
            self.blend_t = min(1.0, self.blend_t + dt / 0.2)
            tt = self.blend_t * self.blend_t * (3 - 2 * self.blend_t)
            q = blend(self.blend_from, q, tt)
        self.q = q
        return q

    def advance_gait(self):
        stride = STRIDE_RUN if self.pose in RUN_POSES else STRIDE_WALK * getattr(self, "walk_scale", 1.0)
        self.gait = (self.gait + self.moved / (stride * CS)) % 1000.0
        self.moved = 0.0


ACT_TEXT = {"cook": "做饭", "wash": "洗碗", "eat": "吃饭", "read": "看书", "phone": "玩手机", "laptop": "用电脑工作",
            "tv": "看电视", "nap": "打盹", "water": "浇花", "laundry": "洗衣服", "toilet": "上厕所", "homework": "写作业",
            "play": "玩玩具", "wander": "随便走走", "feed": "喂猫", "wand": "拿逗猫棒逗猫", "pet": "摸猫", "chase": "追猫",
            "go_out": "准备出门", "going_out": "出门", "away": "出门了", "return": "回家挂外套", "bench": "坐在长椅上",
            "swing": "荡秋千", "picnic": "野餐", "bbq": "烧烤", "hang": "晾衣服", "sleep": "睡觉", "cuddle": "抱猫",
            "lapsit": "抱着猫坐着", "serve": "上菜", "clear": "收拾碗筷", "scoop": "铲猫砂", "fix_scratcher": "换猫抓板",
            "pickup": "捡东西", "greet": "抱抱", "goodnight": "说晚安", "relay": "传话", "tidy": "收拾娃娃",
            "fetch": "拿娃娃", "treat": "喂零食", "feed_visitor": "喂流浪猫", "fridge": "开冰箱拿吃的",
            "help_cook": "帮忙做饭", "show_homework": "拿作业给大人看", "praise": "看作业", "chat": "聊天",
            "class": "上课", "teach": "讲课", "bars": "玩单杠", "hoop": "投篮", "tag": "追着玩", "slide": "滑滑梯",
            "seesaw": "玩跷跷板", "buy": "买东西", "icecream": "吃冰淇淋", "pigeons": "喂鸽子", "kite": "放风筝",
            "jog": "跑步", "fish": "钓鱼", "row": "划船", "ducks": "喂鸭子", "shop": "逛超市", "pay": "结账",
            "pet_look": "看小猫小狗", "order": "点咖啡", "cafe": "喝咖啡", "vending": "买饮料", "hike": "爬山",
            "view": "用望远镜看风景", "photo": "拍照", "rest": "歇一会儿", "campfire": "围着篝火", "hammock": "躺吊床",
            "stars": "看星星", "outing": "出门", "going_home": "回家", "work": "工作", "walk_dog": "遛狗",
            "idle": "发呆"}
CAT_STATE_TEXT = {"eat": "吃饭", "carried": "被抱着", "petted": "被摸摸", "laptop": "趴在电脑上", "knock": "在桌上搞破坏",
                  "wrestle": "打闹", "chasecat": "追着跑", "plushbat": "拍娃娃", "social": "蹭蹭", "play": "陪小宝玩",
                  "wand": "扑逗猫棒", "morsel": "吃掉下来的东西", "flee": "逃跑", "present": "传话", "treat": "吃零食",
                  "scratch": "磨爪子", "bat": "拍东西", "nibble": "啃叶子", "held": "被拎起来", "fall": "往下跳",
                  "ko": "晕乎乎"}
CAT_POSE_TEXT = {"sleep": "睡觉", "loaf": "揣手手", "groom": "舔毛", "sit": "坐着发呆", "belly": "翻肚皮晒太阳",
                 "beg": "讨吃的", "pant": "歇口气", "grumpy": "有点不高兴", "yawn": "打哈欠", "stretch": "伸懒腰"}


def activity_text(a):
    if a.is_cat:
        if a.path:
            return "跑来跑去" if a.running else "走动"
        if a.state in CAT_STATE_TEXT:
            return CAT_STATE_TEXT[a.state]
        pose = a.data.get("pose") or a.pose
        sp = a.spot_info() if hasattr(a, "spot_info") else None
        if sp is not None and sp["kind"] == "tv":
            return "看电视"
        if sp is not None and sp["kind"] in ("watch", "watch_birds"):
            return "看窗外"
        return CAT_POSE_TEXT.get(pose, "闲着")
    act = a.act or "idle"
    if act.startswith("going:"):
        return "去" + ACT_TEXT.get(act[6:], act[6:])
    if a.path and act in ("idle", "wander"):
        return "走动"
    return ACT_TEXT.get(act, act)


# ---------------------------------------------------------------------------------------- visitors
class VisitorSrc:
    """Stands in for a desktop cat: a stray that only visits the garden."""

    def __init__(self, kind):
        self.kind = kind
        self.name = HC.VISITORS.get(kind, {}).get("name", "流浪猫")
        self.acc_h = None
        self.acc_b = None
        self.shape = (1.0, 1.0)
        self.stats = {"hunger": 60.0, "energy": 80.0, "mood": 55.0}

    def line(self, key, **fmt):
        return random.choice(["喵？", "（东张西望）", "喵～", "（闻闻）"])


class Visitor(HCat):
    """A stray cat wandering round the garden for a few minutes."""
    walk_v = 46.0

    def __init__(self, world, kind):
        super().__init__(world, VisitorSrc(kind))
        self.uid = "v:" + kind
        self.leave_at = world.t + 300
        self.leave_gift = False
        self.leaving = self.gone = self.fed = False

    def chat(self, key, chance=0.5, **fmt):
        return

    def decide(self):
        w = self.world
        if self.leaving:
            return
        if w.t > self.leave_at or not w.outdoor_ok():
            self.leave()
            return
        r = random.random()
        if r < 0.25 and self.act_spot(("watch_pond",), "rest", "sit", (10, 25)):
            return
        if r < 0.4 and self.act_spot(("watch_birds",), "rest", "sit", (8, 18)):
            return
        if r < 0.5 and self.act_spot(("nibble",), "nibble", "eat", (3, 5)):
            return
        x, y = w.random_floor(2)
        pose = random.choice(("sit", "loaf", "groom", "stand", "belly"))
        self.go(2, x, y, 0, False, lambda: self.set_state("rest", random.uniform(5, 14), pose=pose))

    def leave(self):
        self.leaving = True
        self.release_spot()
        self.stop()
        self.set_state("idle", 1e9, leaving=True)
        gx, gy = H.GATE_OUT
        if not self.go(2, gx, gy, 0, False, lambda: self.world.visitor_leaves(self)):
            self.world.visitor_leaves(self)

    def st_nibble(self, dt):
        self.set_pose("eat")
        self.timer -= dt
        if self.timer <= 0:
            self.set_state("rest", 3, pose="sit")


# ---------------------------------------------------------------------------------------- people
ACTS = {
    "cook": dict(who="adult", items=("stove",), spot="cook", hours=[(6.5, 8.5), (11, 12.5), (17, 19)], w=6,
                 dur=(40, 90), pose="cook", prop="pan", line="cook"),
    "wash": dict(who="adult", items=("counter",), spot="wash", hours=[(8, 9.5), (13, 14), (19.5, 21)], w=2.5,
                 dur=(20, 45), pose="cook", prop=None, line="wash"),
    "eat": dict(who="any", items=("table",), spot="eat", hours=[(7, 9), (12, 13.5), (18, 20)], w=4,
                dur=(35, 70), pose="eat", prop=None, line="eat"),
    "read": dict(who="any", items=("sofa", "armchair", "kid_bed"), spot="sit", hours=[(8, 22.5)], w=4,
                 dur=(60, 150), pose="sit", prop="book", line="read"),
    "phone": dict(who="adult", items=("sofa", "armchair"), spot="sit", hours=[(8, 23)], w=2.5,
                  dur=(30, 90), pose="sit", prop="phone", line=None),
    "laptop": dict(who="adult", items=("desk", "table"), spot=("work", "eat"), hours=[(9, 18)], w=5, dur=(90, 220),
                   pose="work", prop="laptop", line="laptop"),
    "tv": dict(who="any", items=("sofa",), spot="sit", hours=[(18.5, 23)], w=8, dur=(90, 240),
               pose="sit", prop=None, line="tv", needs="tv"),
    "nap": dict(who="adult", items=("sofa", "armchair"), spot="sit", hours=[(13, 15.5)], w=1.6, dur=(60, 180),
                pose="doze", prop=None, line="nap"),
    "water": dict(who="adult", items=("plant", "flower_bed"), spot="water", hours=[(8, 20)], w=1.0, dur=(6, 10), pose="stand",
                  prop="can", line="water"),
    "laundry": dict(who="adult", items=("washer",), spot="laundry", hours=[(9, 21)], w=1.4, dur=(15, 30),
                    pose="cook", prop=None, line="laundry"),
    "toilet": dict(who="any", items=("toilet",), spot="toilet", hours=[(0, 24)], w=0.9, dur=(15, 35), pose="sit",
                   prop="phone", line=None),
    "homework": dict(who="kid", items=("desk",), spot="work", hours=[(15, 18.5)], w=7, dur=(60, 160),
                     pose="work", prop="pencil", line="homework"),
    "play": dict(who="kid", items=("toy_box", "rug", "castle", "sandbox", "picnic"), spot="play", hours=[(8, 20.5)], w=8, dur=(40, 100),
                 pose="floor", prop="toy", line="play"),
    "wander": dict(who="any", items=(), spot=None, hours=[(7, 23)], w=2.0, dur=(4, 10)),
    "feed": dict(who="adult", items=("bowls",), spot="feed", hours=[(7, 9), (18, 20)], w=2.0, dur=(3, 4),
                 pose="feed", prop="food", line="feed"),
    "wand": dict(who="adult", items=(), spot=None, hours=[(8, 22.5)], w=2.6, dur=(18, 35)),
    "pet": dict(who="any", items=(), spot=None, hours=[(7, 22.5)], w=3.5, dur=(5, 7)),
    "chase": dict(who="kid", items=(), spot=None, hours=[(8, 20)], w=2.0, dur=(7, 11)),
    "cuddle": dict(who="any", items=(), spot=None, hours=[(8, 21.5)], w=1.8, dur=(30, 60)),
    "go_out": dict(who="adult", items=("coat_rack",), spot="coat", hours=[(9, 19)], w=1.0, dur=(90, 300)),
    "bench": dict(who="any", items=("bench",), spot="sit", hours=[(9, 18.5)], w=2.0, dur=(40, 120), pose="sit",
                  prop="book", line="read", outdoor=True),
    "swing": dict(who="kid", items=("swing",), spot="swing", hours=[(8, 19)], w=5.0, dur=(30, 80), pose="sit",
                  prop=None, line="swing", outdoor=True),
    "picnic": dict(who="any", items=("picnic",), spot="play", hours=[(11, 16)], w=1.2, dur=(40, 100), pose="floor",
                   prop=None, line="picnic", outdoor=True),
    "bbq": dict(who="adult", items=("bbq",), spot="bbq", hours=[(17, 19.5)], w=2.0, dur=(50, 110), pose="cook",
                prop="pan", line="bbq", outdoor=True),
    "hang": dict(who="adult", items=("clothesline",), spot="hang", hours=[(9, 16)], w=1.2, dur=(15, 30),
                 pose="reach", prop=None, line="hang", outdoor=True),
}
SLEEP_HOURS = {"adult": (23.0, 7.0), "kid": (21.0, 7.0)}
PERSON_TASKS_ADULT = [("喂猫", "feed"), ("抱抱猫", "cuddle"), ("摸摸猫", "pet"), ("陪猫玩逗猫棒", "wand"),
                      ("浇花", "water"), ("铲猫砂", "scoop"), ("做饭", "cook"), ("收拾碗筷", "clear"),
                      ("收拾娃娃", "tidy"), ("洗衣服", "laundry"), ("看电视", "tv"), ("看书", "read"),
                      ("用电脑", "laptop"), ("去睡觉", "sleep")]
PERSON_TASKS_KID = [("和猫玩", "play"), ("抱抱猫", "cuddle"), ("摸摸猫", "pet"), ("追着猫跑", "chase"),
                    ("写作业", "homework"), ("看电视", "tv"), ("看书", "read"), ("荡秋千", "swing"), ("去睡觉", "sleep")]


def in_hours(h, ranges):
    return any(a <= h < b for a, b in ranges)


def asleep_time(role, h, wake=None, bed=None):
    a, b = SLEEP_HOURS[role]
    a = a if bed is None else bed
    b = b if wake is None else wake
    if a <= b:                      # bedtime after midnight, e.g. 1:00 .. 8:00
        return a <= h < b
    return h >= a or h < b


class Person(Agent):
    def __init__(self, world, conf, name):
        super().__init__(world)
        self.P = dict(conf)
        self.role = conf.get("role", "adult")
        self.name = name
        self.walk_v = 76.0 if self.role == "adult" else 82.0
        self.run_v = 160.0
        self.act = "idle"
        self.pose, self.view, self.prop = "stand", "side", None
        self.sleep_dir = (0.0, -1.0)
        self.hold = None                   # {"uid": cat uid, "mode": "carry" | "lap"}
        self.prop_saved = None
        self.next_blink = time.monotonic() + random.uniform(1, 4)
        self.blink_until = 0.0
        self.set_state("idle", random.uniform(1, 4))

    def asleep_at(self, h):
        try:
            return asleep_time(self.role, h, float(self.P.get("wake", 7)), float(self.P.get("bed", 23 if
                                                                                        self.role == "adult" else 21)))
        except (TypeError, ValueError):
            return asleep_time(self.role, h)

    @property
    def hs(self):
        try:
            return float(self.P.get("height", 1.0) or 1.0)
        except (TypeError, ValueError):
            return 1.0

    def head_offset(self):
        if self.pose == "sleep":
            return 0, -18
        return 0, -H.person_top(self.P, self.pose, self.seat) * self.hs

    def line(self, key, **fmt):
        cats = self.world.cats
        fmt.setdefault("c", random.choice(cats).name if cats else "猫咪")
        fmt.setdefault("d", cats[1].name if len(cats) > 1 else "")
        if key == "feed" and len(cats) > 1:
            fmt["c"], fmt["d"] = cats[0].name, cats[1].name
        return pick(PEOPLE_LINES.get(key, ["……"]), **fmt)

    def chat(self, key, chance=0.5, **fmt):
        now = time.monotonic()
        if random.random() < chance and now - self.world.last_talk > 2.0:
            self.world.last_talk = now
            self.say(self.line(key, **fmt))

    # ---- activity selection -----------------------------------------------------------
    def end_act(self):
        prev = self.act
        w = self.world
        bed = w.item_by_id(self.spot[0]) if self.spot is not None else None
        if prev == "sleep" and bed is not None and w.carried_by(self) is not None and self.ctrl is None:
            w.plush_put(self, bed, force=True)
        keep = None
        if self.hold is not None:
            c = w.held_cat(self)
            if self.hold.get("mode") == "lap":
                if self.ctrl is not None and c is not None:
                    w.to_carry(self)               # a player stands up with the cat in their arms
                    keep = c
                else:
                    if c is not None and random.random() < 0.6:
                        self.say(life_line("lap_stand", c=c.name), 2.0)
                        c.say(cat_line("lap_off"), 2.0)
                    w.set_down_cat(self, random.choice((-1, 1)), -0.7)
            elif self.ctrl is not None and c is not None:
                keep = c
            else:
                w.set_down_cat(self)
        self.act = "idle"
        self.pose, self.view, self.prop, self.seat = "stand", "side", None, 0.0
        if keep is not None:
            self.prop, self.view = "hug", "front"
        self.h = 0.0
        if self.spot is not None:
            self.release_spot()
            nav = self.world.nav[self.f]
            c = nav.nearest(self.x, self.y, 8)
            if c is not None and not nav.ok_at(self.x, self.y):
                self.x, self.y = nav.center(*c)
        if prev == "sleep":
            self.chat("wake", 0.8)
        self.set_state("idle", random.uniform(1.5, 4))
        if prev == "sleep" and self.ctrl is None and keep is None:
            self.pose, self.view = "stretch", "front"      # a big morning stretch
            self.set_state("stretch", 1.8)

    def decide(self):
        w = self.world
        h = w.hour()
        if self.f in AA.ARENAS:
            w.leave_arena(self)
            return
        if self.f in PA.PLACES:
            if self.in_tent is not None and (not self.asleep_at(h) or self.npc):
                w.wake_from_tent(self)
                return
            if not self.npc:
                key = PA.PLACES[self.f]["key"]
                wet = w.weather() in ("rain", "snow")
                if (self.asleep_at(h) and key != "camp") or (wet and key in ("park", "lake", "mountain", "camp")
                                                              and random.random() < 0.25):
                    if w.go_home(self):
                        return
            if not w.place_decide(self):
                self.set_state("idle", random.uniform(2, 4))
            return
        if self.asleep_at(h) and self.start_sleep():
            return
        if w.feed_requested and self.role == "adult" and self.start_act("feed"):
            w.feed_requested = False
            return
        options = []
        for name, a in ACTS.items():
            if a["who"] not in ("any", self.role) or not in_hours(h, a["hours"]):
                continue
            if a.get("needs") and not w.items_of(a["needs"]):
                continue
            if a.get("outdoor") and not w.outdoor_ok():
                continue
            weight = a["w"]
            if name == "go_out":
                weight = {"often": 2.5, "sometimes": 1.0, "never": 0.0}.get(self.P.get("out", "sometimes"), 1.0)
                if weight <= 0:
                    continue
            if name == "feed" and any(it.state.get("food", 100) < 40 for it in w.items_of("bowls")):
                weight += 6
            options.append((weight, name))
        if self.role == "adult" and any(d.get("rest") and not d.get("table") and d.get("kind") != "morsel"
                                        for d in w.drops):
            options.append((4.0, "pickup_drop"))
        if self.role == "adult":
            options += w.chore_weights(self)
            th = w.thirst_max()
            if th > 0.45 and 8 <= h < 21:
                options.append((2 + 8 * th, "water"))
        if self.role == "adult" and 9 <= h < 21:
            n = len(w.misplaced_plush())
            if n:
                options.append((min(2.0, 0.45 * n), "tidy"))
        random.shuffle(options)
        total = sum(o[0] for o in options)
        r = random.uniform(0, total) if total else 0
        for weight, name in options:
            r -= weight
            if r <= 0:
                if self.start_act(name):
                    return
                break
        self.start_act("wander")

    def find_spot(self, items, kinds):
        if isinstance(kinds, str):
            kinds = (kinds,)
        best = []
        outdoor = self.world.outdoor_ok()
        for it in self.world.items:
            if it.type not in items or (it.f == 2 and not outdoor) or not self.world.same_region(it.f, self.f):
                continue
            for idx, sp in it.spots():
                if sp["who"] != "person" or sp["kind"] not in kinds:
                    continue
                if sp.get("kid") and self.role != "kid":
                    continue
                key = (it.id, idx)
                occ = self.world.occupied.get(key)
                if occ is not None and occ is not self:
                    continue
                score = random.random() + (0.8 if it.f != self.f else 0) + items.index(it.type) * 1.2
                best.append((score, key, sp))
        best.sort(key=lambda b: b[0])
        return best[0][1:] if best else (None, None)

    def start_sleep(self):
        w = self.world
        if self.role == "kid" and w.carried_by(self) is None and w.t - getattr(self, "fetch_t", -1e9) > 900:
            self.fetch_t = w.t
            free = [n for n in PLUSH_NAMES if w.plush[n]["at"] != "held" and w.plush_where(n) is not None]
            if free and random.random() < 0.7:
                name = random.choice(free)
                self.release_spot()
                self.act = "fetch"
                self.set_state("act", 90)
                if w.go_pick(self, name, lambda ok: (self.say(random.choice(["抱着%s睡觉～" % name, "%s陪我睡" % name])),
                                                     self.start_sleep())):
                    return True
        beds = ("kid_bed", "bed") if self.role == "kid" else ("bed",)
        key, sp = self.find_spot(beds, "sleep")
        if key is None:
            key, sp = self.find_spot(("sofa", "armchair"), "sit")
            if key is None:
                return False
            return self.go_do(key, sp, "sleep", 1e9, "doze", None)
        return self.go_do(key, sp, "sleep", 1e9, "sleep", None)

    def go_do(self, key, sp, act, dur, pose, prop, line=None):
        self.claim(key)

        def arrive():
            w = self.world
            if self.hold is not None and pose not in ("sit", "doze"):
                w.set_down_cat(self)
            self.act = act
            self.pose, self.prop = pose, prop
            seated = pose in ("sit", "doze", "eat", "work")
            if act == "swing":
                sp["item"].state["swing"] = 1.0
            self.seat = sp["h"] if seated else 0.0
            self.h = sp["h"] if (seated or pose == "sleep") else 0.0
            self.x, self.y = sp["x"], sp["y"]
            fx, fy = sp["fx"], sp["fy"]
            self.view = "front" if fy < -0.5 else ("back" if fy > 0.5 else "side")
            self.facing = screen_facing(fx, fy, self.facing)
            if pose == "sleep":
                it = sp["item"]
                self.sleep_dir = H.rot_vec(it.rot, 0, -1)
                self.P["_blanket"] = "#8fb8e8" if it.type == "kid_bed" else "#e7a5a0"
                self.chat("sleep", 0.6)
            self.set_state("act", dur)
            if self.hold is not None:
                w.to_lap(self)
            if sp["item"].type == "castle":
                self.prop = None
                w = self.world
                if self.role == "kid" and self.ctrl is None and w.carried_by(self) is None and random.random() < 0.6:
                    onshelf = [n for n in PLUSH_NAMES if w.plush[n]["at"] == "castle"]
                    if onshelf:
                        w.plush_pick(self, random.choice(onshelf), force=True)
                else:
                    self.chat("plush", 0.8, t=plush_name())
            elif line:
                self.chat(line, 0.55)
            if act == "feed":
                self.data["feed_item"] = sp["item"].id
        self.act = "going:" + act
        ok = self.go(sp["f"], sp["x"], sp["y"], 0, False, arrive)
        if not ok:
            self.release_spot()
            self.act = "idle"
        return ok

    def start_tidy(self, name=None):
        w = self.world
        names = w.misplaced_plush()
        castle = w.primary_castle()
        if not names or castle is None:
            return False
        name = name if name in names else random.choice(names)
        self.release_spot()
        self.act = "tidy"
        self.set_state("act", 120)

        def picked(ok):
            if not ok:
                self.end_act()
                return
            if not w.go_put(self, castle, lambda ok2: self.end_act()):
                w.plush_put(self, None, force=True)
                self.end_act()
        return w.go_pick(self, name, picked)

    def start_act(self, name):
        if name == "tidy":
            return self.start_tidy()
        if name in ("scoop", "fix_scratcher", "clear"):
            return self.world.start_chore(self, name)
        if name == "sleep":
            return self.start_sleep()
        if name == "water":
            # the thirstiest plant first
            w = self.world
            best = []
            for it in w.items:
                if it.type in ("plant", "flowers", "flower_bed") and (it.f != 2 or w.outdoor_ok()) and \
                        it.f not in PA.PLACES:
                    for idx, sp in it.spots():
                        if sp["who"] == "person" and sp["kind"] == "water" and w.occupied.get((it.id, idx)) is None:
                            best.append((float(it.state.get("water", 1.0)) + random.uniform(0, 0.15), (it.id, idx), sp))
            if not best:
                return False
            best.sort(key=lambda b: b[0])
            _, key, sp = best[0]
            a = ACTS["water"]
            return self.go_do(key, sp, "water", random.uniform(*a["dur"]), a["pose"], a["prop"], a["line"])
        if name == "pickup_drop":
            drops = [d for d in self.world.drops if d.get("rest") and not d.get("table") and d.get("kind") != "morsel"]
            if not drops:
                return False
            d = min(drops, key=lambda d: (d["f"] != self.f, math.hypot(d["x"] - self.x, d["y"] - self.y)))
            self.world.start_pickup_drop(self, d)
            return self.act == "pickup"
        a = ACTS[name]
        w = self.world
        dur = random.uniform(*a["dur"])
        if name == "wander":
            f = self.f if random.random() < 0.8 else random.choice(w.floors_ok(self.f))
            x, y = w.random_floor(f)
            self.release_spot()
            self.act = "wander"

            def arrive():
                self.set_state("act", dur)
                self.pose = "stand"
                if self.view == "back" or random.random() < 0.4:
                    self.view = "front"
            return self.go(f, x, y, 0, False, arrive)
        if name == "cuddle":
            c = w.pick_cat(self, low=True, floor_only=True)
            if c is None or w.carried_by(self) is not None:
                return False
            return self.approach_cat(c, "cuddle", dur)
        if name in ("pet", "wand"):
            c = w.pick_cat(self, low=True, floor_only=name == "wand")
            if c is None:
                return False
            return self.approach_cat(c, name, dur)
        if name == "chase":
            c = w.pick_cat(self, low=True, floor_only=True, same_floor=True)
            if c is None:
                return False
            self.act = "chase"
            self.release_spot()
            c.interrupt()
            c.release_spot()
            c.set_state("flee", dur)
            c.chat("flee", 0.6)
            self.chat("chase", 0.7, c=c.name)
            self.set_state("chase", dur, cat=c)
            return True
        if name == "go_out":
            key, sp = self.find_spot(a["items"], a["spot"])
            if key is None:
                return False
            rack = sp["item"]
            self.release_spot()
            self.act = "go_out"

            def took():
                self.facing = screen_facing(rack.x - self.x, rack.y - self.y)
                self.set_state("reach", 1.2, then="take_coat", rack=rack.id, away=dur)
            return self.go(sp["f"], sp["x"], sp["y"], 0, False, took)
        key, sp = self.find_spot(a["items"], a["spot"])
        if key is None:
            return False
        return self.go_do(key, sp, name, dur, a["pose"], a["prop"], a["line"])

    def approach_cat(self, c, act, dur):
        gap = {"pet": 40, "cuddle": 34, "treat": 32}.get(act, 70)
        nav = self.world.nav[c.f]
        best = None
        # from the left or right, so the two never overlap on screen
        for ang, pen_ in ((0, 0), (180, 0), (18, 30), (162, 30), (342, 30), (198, 30), (40, 90), (140, 90),
                          (320, 90), (220, 90)):
            x = c.x + math.cos(math.radians(ang)) * gap
            y = c.y + math.sin(math.radians(ang)) * gap
            if nav.ok_at(x, y) and self.world.free_point(c.f, x, y, (self, c)):
                d = math.hypot(x - self.x, y - self.y) + pen_
                if best is None or d < best[0]:
                    best = (d, (x, y))
        if best is None:
            return False
        tx, ty = best[1]
        self.release_spot()
        self.act = "going:" + act
        if act in ("pet", "cuddle", "treat") and c.ctrl is None and c.free():
            c.facing = screen_facing(self.x - c.x, self.y - c.y, c.facing)
            c.set_state("rest", 8, pose="sit")          # it notices and waits

        def arrive():
            if c.busy_with_people() or c.f != self.f or math.hypot(c.x - self.x, c.y - self.y) > 120:
                self.end_act()
                return
            self.facing = screen_facing(c.x - self.x, c.y - self.y, self.facing)
            self.act = act
            self.view = "side"
            self.set_state("act", dur)
            if act == "treat":
                self.world.serve_treat(c, getattr(self, "treat_kind", "stick"), self)
                return
            if act == "cuddle":
                if c.ctrl is not None and self.ctrl is None:
                    self.end_act()
                    return
                self.pose = "pet"
                c.interrupt()
                c.release_spot()
                c.facing = -self.facing
                c.set_state("rest", 3, pose="sit", locked=True)
                self.data.update(phase="lift", cat=c)
                self.say(life_line("kid_pickup" if self.role == "kid" else "pickup", c=c.name), 2.0)
                return
            if act == "pet":
                self.pose = "pet"
                c.interrupt()
                c.facing = -self.facing
                style = self.world.pet_style(c)
                trap = random.uniform(2.2, 3.6) if style == "belly" and random.random() < 0.45 else None
                c.set_state("petted", dur, by=self.uid, style=style, trap=trap)
                if style != "refuse":
                    self.chat("pet", 0.6, c=c.name)
                c.src.stats["mood"] = min(100.0, c.src.stats["mood"] + 6)
                if random.random() < 0.6:
                    self.world.app.play_sound("purr", c.src)
            else:
                self.pose, self.prop = "wand", "wand"
                c.interrupt()
                c.release_spot()
                c.h = 0.0
                c.set_state("wand", dur, by=self)
                self.chat("wand", 0.7, c=c.name)
                c.chat("wand", 0.4)
        return self.go(c.f, tx, ty, 0, False, arrive)

    # ---- update ----------------------------------------------------------------------------
    def update(self, dt):
        self.t += dt
        self.st_t += dt
        self.tick_fx(dt)
        if self.away:
            self.timer -= dt
            if self.timer <= 0:
                self.come_back()
            return
        if self.ctrl is not None and self.world.play.ctrl_step(self, dt):
            return
        if self.path:
            self.update_path(dt)
            if self.path:
                self.pose = "run" if (self.running or self.state == "chase") else "walk"
                if getattr(self, "pause", 0.0) > 0 and self.path[0].get("t") == "walk":
                    self.pose = "stand"
                self.view = view_for(self.motion[0], self.motion[1], self.view if self.pose in ("walk", "run") else "side")
                self.seat = 0.0
                if self.stairs_u is None:
                    self.h = 0.0
            return
        getattr(self, "st_" + self.state, self.st_idle)(dt)

    def st_idle(self, dt):
        self.pose = "stand"
        if self.ctrl is not None:
            if self.view == "back" and self.st_t > 1.5:
                self.view = "front"
            return
        self.timer -= dt
        if self.timer <= 0:
            self.decide()
            if not self.path and self.state == "idle":
                self.timer = random.uniform(2, 5)

    def st_act(self, dt):
        self.timer -= dt
        h = self.world.hour()
        if self.ctrl is not None:
            if self.act == "sleep":
                if random.random() < dt * 0.08:
                    self.spawn("z", 1)
                return
            h = -1.0                      # a player decides when to go to bed
        if self.act == "sleep":
            if not self.asleep_at(h) and self.st_t > 5:
                self.end_act()
            elif random.random() < dt * 0.08:
                self.spawn("z", 1)
            return
        if h >= 0 and self.asleep_at(h) and self.st_t > 10 and self.act != "feed":
            self.end_act()
            return
        if self.act == "feed" and self.st_t > 1.6 and not self.data.get("fed"):
            self.data["fed"] = True
            it = self.world.item_by_id(self.data.get("feed_item"))
            if it is not None:
                it.state["food"] = 100.0
                it.state["kind"] = self.world.food_choice()
                self.world.cats_hear_food(it)
                self.world.tally(self, "feed")
        if self.act == "pet":
            c = self.world.cat_near(self, 70)
            if c is None or c.state != "petted":
                self.timer = min(self.timer, 0.4)
        if self.act == "cuddle" and self.step_cuddle(dt):
            return
        if self.act == "pickup" and self.timer <= 0:
            self.world.finish_pickup(self)
        w = self.world
        if self.act == "eat":
            w.eat_tick(self, dt)
        if self.act == "water" and self.st_t > 1.6 and not self.data.get("watered"):
            self.data["watered"] = True
            it = w.item_by_id(self.spot[0]) if self.spot else None
            if it is not None:
                it.state["water"] = 1.0
                w.sfx("splash", 5)
        if self.timer <= 0 and self.data.get("chore_done"):
            done, keep = self.data.pop("chore_done"), self.data.get("chore_keep")
            done()
            if not keep:
                self.end_act()
            return
        if self.timer <= 0 and self.act in ("cook", "eat", "homework") and self.ctrl is None:
            prev = self.act
            table = w.item_by_id(self.spot[0]) if self.spot else None
            self.end_act()
            if prev == "cook":
                w.start_serve(self)
            elif prev == "homework":
                w.show_homework(self)
            else:
                w.meal_done(self, table)
            return
        if self.act == "help_cook" and not any(o.act == "cook" and o.state == "act" for o in w.present_people()):
            self.timer = min(self.timer, 0.5)
        if self.hold is not None and self.hold.get("mode") == "lap" and self.prop in (None, "lap"):
            self.prop = "lap" if (self.st_t % 9.0) < 4.0 else None       # now and then a slow stroke
        if self.timer <= 0:
            self.end_act()

    def step_cuddle(self, dt):
        """Crouch and lift the cat, hold it a while, then sit down with it or put it down."""
        w = self.world
        ph = self.data.get("phase")
        if ph == "lift":
            if self.st_t < 0.6:
                return True
            c = self.data.get("cat")
            if c is None or c.f != self.f or math.hypot(c.x - self.x, c.y - self.y) > 80 or not w.pick_up_cat(self, c):
                self.end_act()
                return True
            self.pose, self.view = "stand", "front"
            self.data.update(phase="hold", until=self.st_t + (random.uniform(3, 6) if self.role == "kid"
                                                              else random.uniform(5, 10)))
            if random.random() < 0.6:
                self.say(life_line("holding", c=c.name), 2.4)
            return True
        if ph == "hold":
            if self.hold is None:                   # it wriggled free
                self.timer = min(self.timer, 1.0)
                self.pose = "stand"
                return False
            if self.ctrl is not None or self.st_t < self.data.get("until", 0):
                return True
            if self.role == "adult" and random.random() < 0.55:
                key, sp = self.find_spot(("sofa", "armchair"), "sit")
                if key is not None and sp["f"] == self.f:
                    if self.go_do(key, sp, "lapsit", random.uniform(40, 120), "sit", None):
                        self.set_state("act", 1e9)
                        self.act = "going:lapsit"
                        return True
            self.data["phase"] = "down"
            self.data["down"] = self.st_t + 0.5
            self.pose, self.view = "pet", "side"
            return True
        if ph == "down":
            if self.st_t >= self.data.get("down", 0):
                w.set_down_cat(self)
                if random.random() < 0.5:
                    self.say(life_line("set_down"), 1.8)
                self.end_act()
            return True
        return False

    def st_stretch(self, dt):
        self.pose, self.view = "stretch", "front"
        self.timer -= dt
        if self.timer <= 0:
            self.pose = "stand"
            self.set_state("idle", random.uniform(1, 3))

    def st_reach(self, dt):
        self.pose = "reach"
        self.timer -= dt
        if self.timer > 0:
            return
        rack = self.world.item_by_id(self.data.get("rack"))
        if self.data.get("then") == "take_coat":
            if self.world.carried_by(self) is not None:
                self.world.plush_put(self, None, force=True)
            if rack is not None:
                rack.state["coat"] = False
            self.prop = "coat"
            self.chat("go_out", 0.8)
            away = self.data.get("away", 120)
            self.act = "going_out"
            self.go(2, H.GATE_OUT[0], H.GATE_OUT[1], 0, False, lambda: self.leave(away))
            self.set_state("idle", 1e9)
        else:
            if rack is not None:
                rack.state["coat"] = True
            self.prop = None
            self.end_act()
            if self.ctrl is None:
                self.world.greet_home(self)

    def leave(self, away):
        self.away = True
        self.act = "away"
        self.timer = away
        self.release_spot()

    def come_back(self):
        self.away = False
        self.f, (self.x, self.y), self.h = 2, H.GATE_OUT, 0.0
        self.facing = 1
        self.say(self.line("back"))
        for c in self.world.cats:
            if c.free() and c.f in (0, 2) and random.random() < 0.6:
                c.act_rub(self)
        racks = [r for r in self.world.items_of("coat_rack")]
        if racks:
            rack = racks[0]
            sp = [s for _, s in rack.spots() if s["kind"] == "coat"]
            if sp:
                self.act = "return"

                def hang():
                    self.facing = screen_facing(rack.x - self.x, rack.y - self.y)
                    self.set_state("reach", 1.2, then="hang", rack=rack.id)
                self.go(rack.f, sp[0]["x"], sp[0]["y"], 0, False, hang)
                self.set_state("idle", 1e9)
                return
        self.prop = None
        self.end_act()

    def st_chase(self, dt):
        c = self.data.get("cat")
        self.timer -= dt
        if c is None or c.f != self.f or c.stairs_u is not None or self.timer <= 0:
            if c is not None and c.state == "flee" and c.f == self.f and math.hypot(c.x - self.x, c.y - self.y) < 80:
                c.stop()
                c.facing = -screen_facing(c.x - self.x, c.y - self.y)
                c.set_state("petted", 4)
                self.facing = screen_facing(c.x - self.x, c.y - self.y, self.facing)
                self.view = "side"
                self.pose = "crouch"
                self.chat("caught", 0.8)
                self.act = "pet"
                self.set_state("act", 4)
                return
            self.end_act()
            return
        dx, dy = c.x - self.x, c.y - self.y
        d = math.hypot(dx, dy)
        v = 110.0 * dt
        nav = self.world.nav[self.f]
        if d > 26:
            step = min(v, d - 22)
            nx, ny = self.x + dx / d * step, self.y + dy / d * step
            if nav.ok_at(nx, ny):
                self.x, self.y = nx, ny
                self.moved += step
            self.facing = screen_facing(dx, dy, self.facing)
            self.view = view_for(dx, dy, self.view)
            self.pose = "run"
        else:
            self.pose = "stand"


# ======================================================================================== world
class World(PlushWorld, LifeWorld, TV.TVWorld, HomeWorld, HC.CatCareWorld, HPL.PlacesWorld, HB.BattleWorld):
    def __init__(self, app, house, remote=None):
        self.app = app
        self.house = house
        self.items = []
        self.occupied = {}
        self.cats = []
        self.people = []
        self.feed_requested = False
        self.last_talk = 0.0
        self.birds = []
        self.debug_hour = None
        self.debug_weather = None
        self.butterflies = []
        self.plush_bubbles = {}
        self.plush_pending = []
        self.next_plush = time.monotonic() + random.uniform(25, 50)
        self.t = 0.0
        self.next_chat = time.monotonic() + random.uniform(20, 40)
        self.nav = {}
        self.remote = remote is not None
        self.fx_log = None
        self.play = Play(self)
        self.init_life()
        self.init_care()
        self.place_items = []
        self.npcs = []
        self.init_battle()
        if remote is not None:
            self.init_places(Item, lambda conf, name: Person(self, conf, name))
            self.build_remote(remote)
            self.init_plush()
            self.init_home()
            return
        self.load_layout()
        self.init_places(Item, lambda conf, name: Person(self, conf, name))
        self.rebuild_nav()
        self.make_people()
        for c in app.cats:
            self.cats.append(HCat(self, c))
        self.place_initial()
        self.init_plush()
        self.init_home()

    # ---- a guest's copy of the host's house -------------------------------------------------------
    def build_remote(self, init):
        from .house_net import RemoteCatSrc
        self.set_remote_layout(init.get("layout") or [])
        self.set_remote_people(init.get("people") or [])
        self.cats = []
        for d in init.get("cats") or []:
            c = HCat(self, RemoteCatSrc(d))
            c.uid = d.get("uid") or c.uid
            c.set_state("idle", 1e9)
            self.cats.append(c)
        for a in self.agents():
            a._tx, a._ty = a.x, a.y

    def set_remote_layout(self, rows):
        old = {it.id: it for it in self.items}
        items = []
        for r in rows:
            try:
                iid, typ, f, x, y, rot = int(r[0]), str(r[1]), int(r[2]), float(r[3]), float(r[4]), int(r[5])
            except (TypeError, ValueError, IndexError):
                continue
            if typ not in H.CATALOG or f not in (0, 1, 2):
                continue
            it = old.get(iid)
            if it is None or it.type != typ:
                it = Item(typ, f, x, y, rot)
                it.id = iid
            it.f, it.x, it.y, it.rot = f, x, y, rot % 4
            items.append(it)
        self.items = items + list(getattr(self, "place_items", []))
        self.rebuild_nav()

    def set_remote_people(self, rows):
        old = {p.uid: p for p in self.people}
        self.people = []
        for d in rows:
            conf = d.get("conf") if isinstance(d.get("conf"), dict) else {}
            conf = dict(H.person_default(conf.get("role")), **conf)
            pr = Person(self, conf, str(d.get("name") or "家人"))
            pr.uid = str(d.get("uid") or "p:%d" % len(self.people))
            o = old.get(pr.uid)
            if o is not None:
                pr.f, pr.x, pr.y = o.f, o.x, o.y
            pr._tx, pr._ty = pr.x, pr.y
            pr.set_state("idle", 1e9)
            self.people.append(pr)

    PRED_SPEED = {"brawl": 230.0, "race": 270.0, "shoot": 175.0, "bomb": 150.0, "melee": 170.0, "defend": 180.0,
                  "paint": 180.0, "soccer": 180.0, "fish": 175.0, "hide": 180.0, "volley": 260.0}
    PRED_MOVING = ("idle", "run", "walk", "air", "crouch", "swim")

    def predict_me(self, dt):
        """Guest-side prediction (v23): (agent, lead x, lead y) for the fighter this guest plays, so it answers the
        keys at once instead of a network round trip later."""
        h = self.house
        bt = self.battle
        me = h.my_agent() if h is not None else None
        if me is None or bt is None or not isinstance(bt, HB.RemoteBattle) or bt.phase != "fight":
            if me is not None:
                me._lead = (0.0, 0.0)
            return None
        fi = next((f for f in bt.fighters if f.uid == me.uid), None)
        if fi is None:
            return None
        g = getattr(bt, "game", "melee")
        dx, dy = getattr(h, "last_dir", (0, 0)) or (0, 0)
        if fi.st not in self.PRED_MOVING or getattr(fi, "trapped", 0) > 0:
            dx = dy = 0
        from .house_net import SNAP_HZ
        lat = 0.1 + 0.5 / max(1.0, SNAP_HZ)
        v = self.PRED_SPEED.get(g, 170.0)
        if g in ("brawl", "race", "volley"):
            tgt = (dx * v * lat, 0.0)
        else:
            n = math.hypot(dx, dy) or 1.0
            tgt = (dx / n * v * lat, dy / n * v * lat)
        lx, ly = getattr(me, "_lead", (0.0, 0.0))
        kk = min(1.0, dt * 9.0)
        lx += (tgt[0] - lx) * kk
        ly += (tgt[1] - ly) * kk
        me._lead = (lx, ly)
        if dx:
            me.facing = 1 if dx > 0 else -1
        return me, lx, ly

    def step_remote(self, dt):
        """The guest only animates what the host sends."""
        self.t += dt
        self.step_battle(dt)
        k = min(1.0, dt * 12.0)
        pred = self.predict_me(dt)
        for a in self.agents():
            a.t += dt
            a.st_t += dt
            a.tick_fx(dt)
            tx, ty = getattr(a, "_tx", a.x), getattr(a, "_ty", a.y)
            if pred is not None and a is pred[0]:
                # my own fighter: where the host has it, plus how far my held keys will have taken it by now
                nx, ny = a.x + (tx + pred[1] - a.x) * min(1.0, dt * 22.0), a.y + (ty + pred[2] - a.y) * min(1.0, dt * 22.0)
                a.moved += math.hypot(nx - a.x, ny - a.y)
                if abs(nx - a.x) > 0.3:
                    a.motion = (nx - a.x, ny - a.y)
                a.x, a.y = nx, ny
                if a.is_cat:
                    a.advance_gait()
                continue
            if a.spot is not None:
                nx, ny = tx, ty
            else:
                nx, ny = a.x + (tx - a.x) * k, a.y + (ty - a.y) * k
            a.moved += math.hypot(nx - a.x, ny - a.y)
            if abs(nx - a.x) > 0.3:
                a.motion = (nx - a.x, ny - a.y)
            a.x, a.y = nx, ny
            if a.is_cat:
                a.advance_gait()
                a.look_cd = getattr(a, "look_cd", 0.0) - dt
                if a.look_cd <= 0:
                    a.look_cd = 0.35
                    a.update_gaze()
        now = time.monotonic()
        for name in [n for n, b in self.plush_bubbles.items() if b["until"] < now]:
            del self.plush_bubbles[name]
        for b in self.butterflies:
            b["ph"] = b.get("ph", 0) + dt
        self.step_critters(dt, remote=True)

    # ---- setup -----------------------------------------------------------------------------
    def load_layout(self):
        conf = self.app.cfg["house"].get("items2")
        saved = isinstance(conf, list) and bool(conf)
        rows = conf if saved else [list(r) for r in H.DEFAULT_LAYOUT]
        hc = self.app.cfg["house"]
        deepen = saved and hc.get("depth", 1.0) != H.DEPTH       # (v26) a layout saved for the shallower rooms
        self.items = []
        for r in rows:
            try:
                typ, f, x, y = r[0], int(r[1]), float(r[2]), float(r[3])
                rot = int(r[4]) if len(r) > 4 else 0
            except (TypeError, ValueError, IndexError):
                continue
            if deepen and f in (0, 1, 2):
                y = H.deepen_y(typ, rot, y)
            if saved:                       # saved un-mirrored
                x, rot = H.mx(x), H.mrot(rot)
            if typ in H.CATALOG and f in (0, 1, 2):
                self.items.append(Item(typ, f, x, y, rot))
        if saved and not any(it.f == 2 for it in self.items) and not self.app.cfg["house"].get("yard_seeded"):
            # older saved layouts: add the garden
            for typ, f, x, y, rot in H.DEFAULT_LAYOUT:
                if f == 2:
                    self.items.append(Item(typ, f, x, y, rot))
            self.app.cfg["house"]["yard_seeded"] = True
        if saved and not self.app.cfg["house"].get("v23_seeded"):
            # v23: wall shelves, the big cat tree and lamps downstairs, wherever they fit in an older layout
            self.app.cfg["house"]["v23_seeded"] = True
            for typ, f, x, y, rot in H.V23_ITEMS:
                x, y, rot = H.mx(x), H.deepen_y(typ, rot, y), H.mrot(rot)
                if any(it.type == typ and it.f == f and math.hypot(it.x - x, it.y - y) < 40 for it in self.items):
                    continue
                wall = H.CATALOG[typ].get("wall")
                for dx, dy in ((0, 0), (-40, 0), (40, 0), (-80, 0), (80, 0), (-120, 0), (0, -50), (-60, -50)):
                    if wall and dy:
                        continue
                    new = Item(typ, f, x + dx, y + dy, rot)
                    if self.fits(new):
                        self.items.append(new)
                        break
        if saved and not self.app.cfg["house"].get("v24_seeded"):
            # v24: four more cat trees, wherever they fit
            self.app.cfg["house"]["v24_seeded"] = True
            for typ, f, x, y, rot in H.V24_ITEMS:
                x, y, rot = H.mx(x), H.deepen_y(typ, rot, y), H.mrot(rot)
                if any(it.type == typ and it.f == f for it in self.items):
                    continue
                wall = H.CATALOG[typ].get("wall")
                for dx, dy in ((0, 0), (-40, 0), (40, 0), (-80, 0), (80, 0), (0, -40), (0, 40), (-120, 0), (120, 0),
                               (-60, -60), (60, -60), (-60, 60), (60, 60)):
                    if wall and dy:
                        continue
                    new = Item(typ, f, x + dx, y + dy, rot)
                    if self.fits(new):
                        self.items.append(new)
                        break
        if saved and not hc.get("v26_seeded"):
            # v26: a lamp for 玄关 (the lamps downstairs light only their own rooms now)
            hc["v26_seeded"] = True
            for typ, f, x, y, rot in H.V26_ITEMS:
                x, y, rot = H.mx(x), H.deepen_y(typ, rot, y), H.mrot(rot)
                room = H.room_at(f, x, y)
                if any(it.type == typ and it.f == f and H.room_at(f, it.x, it.y) == room for it in self.items):
                    continue
                for dx, dy in ((0, 0), (0, -40), (0, -80), (-30, 0), (30, 0), (0, -120), (0, -160)):
                    new = Item(typ, f, x + dx, y + dy, rot)
                    if H.room_at(f, new.x, new.y) == room and self.fits(new):
                        self.items.append(new)
                        break
        stepped = False
        if not self.remote and (not saved or not hc.get("v26_steps")):
            # (v26) a cupboard top nothing leads up to gets a little cabinet beside it to hop up from
            stepped = self.add_steps()
            if saved:
                hc["v26_steps"] = True
        self.items += list(getattr(self, "place_items", []))
        if saved and stepped and not self.remote and hc.get("depth", 1.0) == H.DEPTH:
            self.save_layout()
        if hc.get("depth", 1.0) != H.DEPTH:
            hc["depth"] = H.DEPTH
            if saved and not self.remote:
                self.save_layout()                 # stored in the deeper rooms from now on
        self.rebuild_nav()

    def add_steps(self):
        """(v26) For every high surface (wardrobe, bookshelf...) a cat can't hop up to from anything, put a small
        cabinet next to it in the same room (once). True if something was added."""
        added = False
        for f in (0, 1):
            for _ in range(6):
                self.layout_ver = getattr(self, "layout_ver", 0) + 1
                nodes, _adj = self.hop_graph(f)
                lost = [n for n in nodes if self.reach_chain(f, n[0], n[1], n[2]) is None]
                if not lost:
                    break
                placed = False
                for n in lost:
                    room = H.room_at(f, n[0], n[1])
                    st = H.STAIR
                    for dist in (60, 85, 110, 140):
                        for k in range(12):
                            ang = k * math.pi / 6
                            x, y = n[0] + math.cos(ang) * dist, n[1] + math.sin(ang) * dist
                            new = Item("side_cabinet", f, x, y, 0)
                            x0, y0, x1, y1 = new.fp()
                            if any(H.room_at(f, cx, cy) != room for cx, cy in ((x0, y0), (x1, y0), (x0, y1), (x1, y1))):
                                continue
                            if x0 < st["x1"] + 30 and st["x0"] - 30 < x1 and y0 < st["y1"] + 30 and st["y0"] - 40 < y1:
                                continue
                            if not self.fits(new) or not self.hop_ok(f, (x, y, 53.0), (n[0], n[1], n[2])):
                                continue
                            self.items.append(new)
                            placed = added = True
                            break
                        if placed:
                            break
                    if placed:
                        break
                if not placed:
                    break                       # (nothing fits: leave it)
        self.layout_ver = getattr(self, "layout_ver", 0) + 1
        return added

    def fits(self, new):
        """Room for a new item: inside the storey and not in another item's way (wall shelves only mind what
        reaches up to them)."""
        x0, y0, x1, y1 = new.fp()
        if not (H.inside(new.f, x0 + 2, y0 + 2) and H.inside(new.f, x1 - 2, y1 - 2)):
            return False
        low = new.cat["h"] - 26 if new.cat.get("wall") else 0.0
        for it in self.items:
            if it.f != new.f or it.cat.get("flat"):
                continue
            if it.cat.get("wall") and new.cat.get("wall") and abs(it.cat["h"] - new.cat["h"]) > 30:
                continue
            if it.cat["h"] <= low:
                continue
            a0, b0, a1, b1 = it.fp()
            if a0 < x1 and x0 < a1 and b0 < y1 and y0 < b1:
                return False
        return True

    def rebuild_nav(self):
        self.nav = {f: Nav(f, self.items) for f in (0, 1, 2)}
        if getattr(self, "place_items", None):
            self.nav.update(self.build_place_navs(Nav))
        self.layout_ver = getattr(self, "layout_ver", 0) + 1

    def save_layout(self):
        if self.remote:
            return
        self.app.cfg["house"]["items2"] = [it.to_cfg() for it in self.items if it.f not in PA.PLACES]
        self.app.save()

    def reset_layout(self):
        for a in self.agents():
            if a.is_cat and a.state == "hiding":
                a.come_out(True)                  # moving the furniture gives the hiding place away
                continue
            a.stop()
            a.release_spot()
            a.h = 0.0
            if a.is_cat:
                a.set_state("idle", 1)
            elif not a.away:
                a.end_act()
        self.occupied = {}
        self.app.cfg["house"]["items2"] = None
        self.load_layout()
        self.app.save()

    def people_conf(self):
        hc = self.app.cfg["house"]
        conf = hc.get("people")
        if not isinstance(conf, list) or not conf:
            conf = [dict(p) for p in H.DEFAULT_PEOPLE]
        elif not hc.get("kid_off_v22"):
            # v22: the child is no longer part of the family (the plush toys come to fights instead); a kid that was
            # set up before is switched off once, and can be switched back on in the settings
            hc["kid_off_v22"] = True
            for c in conf:
                if isinstance(c, dict) and c.get("role") == "kid":
                    c["on"] = False
        return conf

    def make_people(self):
        for pr in self.people:
            pr.release_spot()
        self.people = []
        titles = self.app.titles()
        n_adult = 0
        for conf in self.people_conf():
            if not conf.get("on", True):
                continue
            conf = dict(H.person_default(conf.get("role")), **conf)
            name = (conf.get("name") or "").strip()
            if conf.get("role") == "adult":
                if not name:
                    name = titles[n_adult] if n_adult < len(titles) else ("主人" if n_adult == 0 else "家人")
                n_adult += 1
            elif not name:
                name = "小宝"
            self.people.append(Person(self, conf, name))
            self.people[-1].uid = "p:%d" % (len(self.people) - 1)

    def rebuild_people(self):
        if self.remote:
            return
        old = {(p.name, p.role): p for p in self.people}
        self.make_people()
        for p in self.people:
            o = old.get((p.name, p.role))
            if o is not None and not o.away and o.stairs_u is None:
                p.f, p.x, p.y = o.f, o.x, o.y
                if not self.nav[p.f].ok_at(p.x, p.y):
                    p.x, p.y = self.random_floor(p.f)
            else:
                p.f = 1
                p.x, p.y = self.random_floor(1)
        for pid, pl in self.play.players.items():
            a = self.agent_by_uid(pl.get("agent")) if pl.get("agent") else None
            if a is not None:
                a.ctrl = pid
            else:
                pl["agent"] = None

    def place_initial(self):
        for pr in self.people:
            pr.f = 1 if random.random() < 0.75 else 0
            pr.x, pr.y = self.random_floor(pr.f)
        for i, c in enumerate(self.cats):
            c.f = 1
            c.x, c.y = self.front_spot(1, 820 + i * 90)
            c.facing = 1 if i == 0 else -1
            c.set_state("rest", 3, pose="sit")

    # ---- queries ---------------------------------------------------------------------------
    def hour(self):
        return self.debug_hour if self.debug_hour is not None else H.now_hour()

    def weather(self):
        if self.debug_weather is not None:
            return self.debug_weather
        try:
            return self.app.weather_tag()
        except Exception:
            return None

    def outdoor_ok(self):
        h = self.hour()
        return 7.0 <= h < 19.0 and self.weather() not in ("rain", "snow")

    def floors_ok(self, cur):
        if cur in PA.PLACES:
            return [cur]
        out = [f for f in (0, 1) if f != cur]
        if self.outdoor_ok() and cur != 2:
            out.append(2)
        return out or [0]

    def items_on(self, f):
        return [it for it in self.items if it.f == f]

    def agents(self):
        return self.cats + self.people + [v for v in self.visitors if not v.away] + \
            [n for n in getattr(self, "npcs", []) if not n.hidden]

    def make_visitor(self, kind):
        return Visitor(self, kind)

    def agent_by_uid(self, uid):
        for a in self.cats + self.people + self.visitors + getattr(self, "npcs", []):
            if a.uid == uid:
                return a
        return None

    # ---- (v26) a light in every room: its floor lamp(s), or else a ceiling light with a switch on the wall ------
    def light_rooms(self, f):
        return [r for r in H.rooms(f) if r != "balcony"] if f in (0, 1) else []

    def room_lamps(self, f, room):
        return [it for it in self.items if it.f == f and it.type == "lamp" and H.room_at(f, it.x, it.y) == room]

    def step_ceiling_lights(self, dark, late):
        ceil = self.__dict__.setdefault("ceil", {})
        people = [p for p in self.present_people() if p.act != "sleep" and p.stairs_u is None]
        for f in (0, 1):
            lamp_rooms = {H.room_at(f, it.x, it.y) for it in self.items if it.f == f and it.type == "lamp"}
            for room in self.light_rooms(f):
                if room in lamp_rooms:
                    ceil.pop((f, room), None)
                    continue
                st = ceil.setdefault((f, room), {})
                if any(p.f == f and H.room_at(f, p.x, p.y) == room for p in people):
                    st["seen"] = self.t
                auto = dark and not late and self.t - st.get("seen", -1e9) < 40.0
                force = st.get("force")
                if force is not None and "force_dark" in st and st["force_dark"] != dark:
                    st.pop("force", None)
                    force = None
                if force is not None and "force_dark" not in st:
                    st["force_dark"] = dark
                if force is None:
                    st.pop("force_dark", None)
                st["on"] = auto if force is None else bool(force)

    def ceiling_on(self, f, room):
        return bool(self.__dict__.get("ceil", {}).get((f, room), {}).get("on"))

    def room_light_on(self, f, room):
        lamps = self.room_lamps(f, room)
        if lamps:
            return any(it.state.get("on") for it in lamps)
        return self.ceiling_on(f, room)

    def set_room_light(self, f, room, on):
        lamps = self.room_lamps(f, room)
        if lamps:
            for it in lamps:
                it.state["force"] = bool(on)
                it.state.pop("force_dark", None)
                it.state["on"] = bool(on)
        else:
            st = self.__dict__.setdefault("ceil", {}).setdefault((f, room), {})
            st["force"] = bool(on)
            st.pop("force_dark", None)
            st["on"] = bool(on)

    def floor_lights(self, f):
        """'all', 'some' or 'none' of the rooms of storey f lit."""
        rooms = self.light_rooms(f)
        n = sum(1 for r in rooms if self.room_light_on(f, r))
        return "all" if rooms and n == len(rooms) else ("some" if n else "none")

    def set_floor_lights(self, f, on):
        for r in self.light_rooms(f):
            self.set_room_light(f, r, on)

    def open_point(self, f):
        """(v26) A floor point well connected to the rest of storey f (to check that somewhere isn't boxed in)."""
        if f == 0:
            return H.STAIR_BOTTOM
        if f == 1:
            return H.STAIR_TOP
        if f == 2:
            return H.YARD_DOOR
        if f in PA.PLACES:
            return PA.entry_in(f)
        return (H.PW / 2, 40.0)

    def item_by_id(self, iid):
        for it in self.items:
            if it.id == iid:
                return it
        return None

    def items_of(self, typ):
        return [it for it in self.items if it.type == typ]

    def present_people(self):
        return [p for p in self.people if not p.away and p.f not in PA.PLACES and p.traveling is None
                and p.act != "outing"]

    def someone_name(self):
        ps = self.present_people() or self.people
        return random.choice(ps).name if ps else "主人"

    def other_cat(self, c):
        for o in self.cats:
            if o is not c:
                return o
        return None

    def everyone_asleep(self):
        ps = self.present_people()
        return bool(ps) and all(p.act == "sleep" for p in ps)

    def nearest_adult(self, c):
        best = None
        for p in self.present_people():
            if p.role == "adult" and p.act != "sleep":
                d = math.hypot(p.x - c.x, p.y - c.y) + (600 if p.f != c.f else 0)
                if best is None or d < best[0]:
                    best = (d, p)
        return best[1] if best else None

    def pick_cat(self, pr, low=True, floor_only=False, same_floor=False):
        cands = []
        for c in self.cats:
            if c.busy_with_people() or c.stairs_u is not None or c.path:
                continue
            if c.state == "rest" and c.data.get("pose") == "sleep":
                continue
            if floor_only and c.h > 0.5:
                continue
            if low and c.h > 40:
                continue
            if same_floor and c.f != pr.f:
                continue
            if not self.same_region(c.f, pr.f) or c.traveling is not None or c.ride is not None:
                continue
            cands.append(c)
        return random.choice(cands) if cands else None

    def cat_near(self, pr, dist):
        for c in self.cats:
            if c.f == pr.f and math.hypot(c.x - pr.x, c.y - pr.y) < dist:
                return c
        return None

    def random_floor(self, f):
        nav = self.nav[f]
        for _ in range(60):
            x = random.uniform(20, H.PW - 20)
            y = random.uniform(10, H.PD - 20)
            if nav.ok_at(x, y) and H.room_at(f, x, y) not in (None, "stair"):
                return x, y
        c = nav.nearest(H.PW / 2, H.PD / 2, 40)
        return nav.center(*c) if c else (H.PW / 2, H.PD / 2)

    def front_spot(self, f, x):
        """A free point near the front edge (close to the viewer) of storey f."""
        nav = self.nav[f]
        best = None
        for y in (18, 34, 52, 70, 90):
            for dx in (0, 30, -30, 60, -60, 100, -100, 160, -160):
                xx = clamp(x + dx, 30, H.PW - 30)
                if nav.ok_at(xx, y) and H.room_at(f, xx, y) not in (None, "stair"):
                    d = abs(dx) + y
                    if best is None or d < best[0]:
                        best = (d, (xx, y))
        return best[1] if best else self.random_floor(f)

    # ---- (v26) the hop network: every surface a cat can stand on, and which ones it can hop between ----------
    def perch_spots(self, f):
        out = []
        for it in self.items:
            if it.f != f:
                continue
            for idx, sp in it.spots():
                if sp["who"] == "cat" and sp["h"] > 0.5:
                    out.append(sp)
        return out

    def hop_ok(self, f, p, q, up=None):
        """Can a cat hop from p = (x, y, h) to q (both up on something)? Up to JUMP higher, ~HOP_DROP lower,
        HOP_D across, never through a wall."""
        d = math.hypot(q[0] - p[0], q[1] - p[1])
        dh = q[2] - p[2]
        if d > HOP_D or dh > (JUMP if up is None else up) or -dh > HOP_DROP or (d <= 24 and abs(dh) < 14):
            return False
        return not H.wall_between(f, p[0], p[1], q[0], q[1])

    def hop_graph(self, f):
        """(nodes, adjacency): nodes are (x, y, h, item id, spot index) of every perch / bed / lookout >= 20 up."""
        key = (f, getattr(self, "layout_ver", 0), H.MIRROR)
        c = self.__dict__.setdefault("_hop_cache", {})
        if key in c:
            return c[key]
        nodes = []
        for it in self.items:
            if it.f != f:
                continue
            for idx, sp in it.spots():
                if sp["who"] == "cat" and sp["kind"] in HOP_KINDS and sp["h"] >= 20:
                    nodes.append((sp["x"], sp["y"], sp["h"], it.id, idx))
        adj = [[j for j, q in enumerate(nodes) if j != i and self.hop_ok(f, p, q)] for i, p in enumerate(nodes)]
        if len(c) > 8:
            c.clear()
        c[key] = (nodes, adj)
        return c[key]

    def node_free(self, n, me):
        occ = getattr(self, "occupied", {}).get((n[3], n[4]))
        return occ is None or occ is me

    def hop_search(self, f, starts, goal, me=None, max_hops=8, down=False):
        """Fewest / easiest hops over the network. starts: [(node index, cost)]; goal(i) -> True when done.
        Returns the node indices of the way, or None."""
        nodes, adj = self.hop_graph(f)
        best = {}
        heap = []
        for i, c0 in starts:
            if self.node_free(nodes[i], me) and (i not in best or c0 < best[i][0]):
                best[i] = (c0, None, 1)
                heapq.heappush(heap, (c0, i))
        while heap:
            cost, i = heapq.heappop(heap)
            if cost > best[i][0] + 1e-9:
                continue
            if goal(i):
                out = [i]
                while best[out[-1]][1] is not None:
                    out.append(best[out[-1]][1])
                return list(reversed(out))
            if best[i][2] >= max_hops:
                continue
            p = nodes[i]
            for j in adj[i]:
                q = nodes[j]
                if not self.node_free(q, me):
                    continue
                d = math.hypot(q[0] - p[0], q[1] - p[1])
                dh = q[2] - p[2]
                c = cost + 1.0 + d / 400.0 + (max(0.0, -dh) / 120.0 if down else max(0.0, dh) / 200.0)
                if j not in best or c < best[j][0] - 1e-9:
                    best[j] = (c, i, best[i][2] + 1)
                    heapq.heappush(heap, (c, j))
        return None

    def perch_route(self, f, a, b, max_hops=6, me=None):
        """(v24) Perch-to-perch hops from a = (x, y, h) to b without touching the floor (b last; just [b] when
        a direct hop is fine), None when there is no such route."""
        if self.hop_ok(f, a, b):
            return [tuple(b)]
        nodes, adj = self.hop_graph(f)
        starts = [(i, 0.0) for i, n in enumerate(nodes) if (abs(n[0] - a[0]) > 1 or abs(n[1] - a[1]) > 1 or
                                                            abs(n[2] - a[2]) > 1) and self.hop_ok(f, a, n)]
        way = self.hop_search(f, starts, lambda i: self.hop_ok(f, nodes[i], b) and
                              (abs(nodes[i][0] - b[0]) > 1 or abs(nodes[i][1] - b[1]) > 1), me, max_hops)
        if way is None:
            return None
        return [nodes[i][:3] for i in way] + [tuple(b)]

    def down_chain(self, f, x, y, h, me=None):
        """Perches to hop down on from a high one, until one is low enough to jump to the floor from."""
        if h <= 95:
            return []
        nodes, adj = self.hop_graph(f)
        a = (x, y, h)
        starts = [(i, 0.0) for i, n in enumerate(nodes) if n[2] < h - 10 and self.hop_ok(f, a, n)]
        way = self.hop_search(f, starts, lambda i: nodes[i][2] <= 90, me, 6, down=True)
        return [nodes[i][:3] for i in way] if way else []

    def reach_chain(self, f, x, y, h, depth=3, me=None):
        """Perches (x, y, h) a cat hops on, one after another from the floor, to reach a high spot (not
        included); [] when it can jump straight up, None if it can't be reached."""
        if h <= JUMP:
            return []
        nodes, adj = self.hop_graph(f)
        b = (x, y, h)
        starts = [(i, math.hypot(n[0] - x, n[1] - y) / 600.0) for i, n in enumerate(nodes) if n[2] <= JUMP]
        way = self.hop_search(f, starts, lambda i: self.hop_ok(f, nodes[i], b) and
                              (abs(nodes[i][0] - x) > 1 or abs(nodes[i][1] - y) > 1), me, 8)
        if way is None:
            return None
        return [nodes[i][:3] for i in way]

    # ---- events --------------------------------------------------------------------------------
    def request_feed(self, cat=None):
        self.feed_requested = True
        adults = [p for p in self.present_people() if p.role == "adult" and p.act != "sleep" and p.ctrl is None]
        if adults:
            idle = [p for p in adults if not self.on_errand(p)]
            p = random.choice(idle or adults)
            if not p.act.startswith("going") and p.act not in ("feed", "return") and p.state in ("idle", "act"):
                p.stop()
                if p.state == "act":
                    p.end_act()
                if p.start_act("feed"):
                    self.feed_requested = False
        else:
            # no grown-up awake at home: the automatic feeder fills the bowls
            self.fill_bowls()
            self.feed_requested = False
            self.cats_hear_food(None)

    def cats_hear_food(self, item):
        for c in self.cats:
            if c.src.stats["hunger"] > 25 and c.free():
                c.interrupt()
                c.release_spot()
                c.act_eat()

    def feed_all(self, kind=None):
        if kind in HC.FOODS:
            self.app.cfg["house"]["food"] = kind
            self.app.save()
        self.request_feed()
        if self.feed_requested:
            self.fill_bowls()
            self.feed_requested = False
            self.cats_hear_food(None)

    def wand_play(self):
        adults = [p for p in self.present_people() if p.role == "adult" and p.act != "sleep" and p.ctrl is None]
        if not adults:
            return False
        p = random.choice(adults)
        p.stop()
        if p.state == "act":
            p.end_act()
        return p.start_act("wand")

    def call_cats(self):
        f = self.house.focus_floor()
        for i, c in enumerate(self.cats):
            if c.state in ("held", "fall", "ko") or c.ctrl is not None:
                continue
            c.interrupt()
            c.release_spot()
            x, y = self.front_spot(f, 800 + 90 * i)
            c.go(f, x, y, 0, True, lambda c=c: (c.set_state("rest", 6, pose="greet"), c.chat("home", 0.5)))

    def item_changed(self, it):
        for key in [k for k in list(self.occupied) if k[0] == it.id]:
            a = self.occupied.get(key)
            if a is None:
                continue
            if a.is_cat and a.state == "hiding":
                a.come_out(True)                  # moving the furniture gives the hiding place away
                continue
            a.stop()
            a.release_spot()
            a.h = 0.0
            if a.is_cat:
                a.set_state("idle", 1)
            else:
                a.end_act()

    def remove_item(self, it):
        self.item_changed(it)
        self.item_removed_plush(it)
        if it in self.items:
            self.items.remove(it)
        self.rebuild_nav()

    # ---- step ------------------------------------------------------------------------------
    def step(self, dt):
        if self.remote:
            self.step_remote(dt)
            return
        self.t += dt
        for a in self.agents():
            if self.battle is not None and self.in_battle(a):
                continue                       # the fight moves them
            try:
                a.update(dt)
            except Exception as ex:
                import traceback
                print("house agent error:", repr(ex), traceback.format_exc(), file=sys.stderr)
                a.stop()
                a.release_spot()
                a.h = 0.0
                a.set_state("idle", 2)
                if not a.is_cat:
                    a.act = "idle"
        self.step_battle(dt)
        self.separate(dt)
        self.play.step(dt)
        self.plush_step(dt)
        self.step_drops(dt)
        self.step_family(dt)
        self.step_tv(dt)
        self.step_home(dt)
        self.step_visitors(dt)
        self.step_places(dt)
        self.npc_notice_cats(dt)
        self.run_timers()
        for c in self.cats:
            c.advance_gait()
        tv_on = any(p.act == "tv" for p in self.present_people())
        for it in self.items_of("tv"):
            it.state["on"] = tv_on or bool(it.state.get("manual"))
        for it in self.items_of("stove"):
            it.state["on"] = any(p.act == "cook" and p.spot and p.spot[0] == it.id for p in self.people)
        for it in self.items_of("washer"):
            if any(p.act == "laundry" and p.spot and p.spot[0] == it.id for p in self.people):
                it.state["on"] = True
                it.state["until"] = self.t + 90
            elif it.state.get("on") and self.t > it.state.get("until", 0):
                it.state["on"] = False
        for it in self.items_of("coat_rack"):
            it.state["swing"] = max(0.0, it.state.get("swing", 0.0) - dt * 0.6)
        dark = H.is_dark(self.hour())
        late = 0.5 <= self.hour() < 5.5
        for it in self.items_of("lamp") + self.items_of("garden_lamp"):
            if it.type == "lamp":
                # (v26) each lamp lights its own room: on while someone is up in there (and a little after)
                room = H.room_at(it.f, it.x, it.y)
                if any(p.f == it.f and p.act != "sleep" and p.stairs_u is None and H.room_at(p.f, p.x, p.y) == room
                       for p in self.present_people()):
                    it.state["seen"] = self.t
                auto = dark and not late and self.t - it.state.get("seen", -1e9) < 40.0
            else:
                auto = dark and not late
            force = it.state.get("force")
            if force is not None and "force_dark" in it.state and it.state["force_dark"] != dark:
                it.state.pop("force", None)          # a click lasts until day turns to night (or back)
                force = None
            if force is not None and "force_dark" not in it.state:
                it.state["force_dark"] = dark
            if force is None:
                it.state.pop("force_dark", None)
            it.state["on"] = auto if force is None else bool(force)
        if not self.remote:
            self.step_ceiling_lights(dark, late)
        for it in self.items_of("swing"):
            if not any(p.act == "swing" and p.spot and p.spot[0] == it.id for p in self.people):
                it.state["swing"] = max(0.0, it.state.get("swing", 0.0) - dt * 0.4)
        for it in self.items_of("bbq"):
            it.state["on"] = any(p.act == "bbq" and p.spot and p.spot[0] == it.id for p in self.people)
        for it in self.items_of("bird_feeder"):
            near = any(c.f == 2 and math.hypot(c.x - it.x, c.y - it.y) < 46 for c in self.cats)
            it.state["birds"] = (not dark) and not near and self.weather() not in ("rain", "snow")
        self.step_butterflies(dt)
        self.step_plush()
        if not dark and random.random() < dt * 0.05 and len(self.birds) < 2:
            f = random.choice((0, 1))
            w = random.choice([w for w in H.FLOORS[f]["windows"] if w[0] == "S"])  # birds passing the windows
            d = random.choice((-1, 1))
            self.birds.append({"f": f, "w": (w[0], w[1]), "x": -60 * d, "y": random.uniform(-8, 8),
                               "vx": d * random.uniform(25, 45), "ph": random.uniform(0, 6)})
        for b in self.birds:
            b["x"] += b["vx"] * dt
        self.birds = [b for b in self.birds if abs(b["x"]) < 70]
        now = time.monotonic()
        if now > self.next_chat:
            self.next_chat = now + random.uniform(25, 60) * (2.0 if self.app.cfg.get("talk", 1) == 0 else 1.0)
            self.ambient()

    # ---- keeping cats and people from walking through each other ---------------------------
    @staticmethod
    def body_r(a):
        return 11.0 if a.is_cat else 13.0

    def grounded(self, a):
        if getattr(self, "battle", None) is not None and self.in_battle(a):
            return False
        if a.path and any(st.get("t") == "travel" for st in a.path[:5]):
            return False                  # on the way out of the gate: don't jostle in the gateway
        return (not a.away and a.traveling is None and a.ride is None and a.in_tent is None and not a.hidden
                and a.stairs_u is None and a.h < 1.0 and a.state not in ("held", "fall", "carried")
                and not (not a.is_cat and (a.pose == "sleep" or a.seat > 0)))

    def free_point(self, f, x, y, skip=()):
        """Is (x, y) on storey f clear of the cats and people standing there?"""
        for a in self.agents():
            if a in skip or a.f != f or not self.grounded(a):
                continue
            if math.hypot(a.x - x, a.y - y) < self.body_r(a) + 12:
                return False
        return True

    def movable(self, a):
        if a.path:
            return "walk"
        if a.spot is not None or a.on_item() is not None:
            return None
        if a.is_cat:
            return "free" if a.state in ("idle", "rest") and not a.data.get("locked") else None
        return "free" if a.state == "idle" or (a.state == "act" and a.act == "wander") else None

    def _nudge(self, a, dx, dy):
        nx, ny = a.x + dx, a.y + dy
        if self.nav[a.f].ok_at(nx, ny):
            a.x, a.y = nx, ny
            return True
        return False

    def separate(self, dt):
        ags = [a for a in self.agents() if self.grounded(a)]
        for i in range(len(ags)):
            a = ags[i]
            for j in range(i + 1, len(ags)):
                b = ags[j]
                if a.f != b.f:
                    continue
                need = self.body_r(a) + self.body_r(b)
                dx, dy = b.x - a.x, b.y - a.y
                d = math.hypot(dx, dy)
                if d >= need:
                    continue
                if d < 0.01:
                    ang = random.uniform(0, math.tau)
                    dx, dy, d = math.cos(ang), math.sin(ang), 1.0
                ux, uy = dx / d, dy / d
                over = need - d
                ma, mb = self.movable(a), self.movable(b)
                for me, other, sgn, m in ((a, b, -1, ma), (b, a, 1, mb)):
                    if m is None:
                        continue
                    if m == "walk":
                        last = me.path[-1] if me.path else None
                        if last is not None and "x" in last and math.hypot(last["x"] - other.x, last.get("y", 0) - other.y) < need * 1.6:
                            continue                     # it is heading right there: let it arrive
                        st = me.path[0]
                        if st.get("t") != "walk":
                            continue
                        hx, hy = st["x"] - me.x, st["y"] - me.y
                        hn = math.hypot(hx, hy) or 1.0
                        px, py = -hy / hn, hx / hn
                        if px * (other.x - me.x) + py * (other.y - me.y) > 0:
                            px, py = -px, -py
                        k = min(over, 90.0 * dt)
                        if not self._nudge(me, px * k, py * k) and not self._nudge(me, sgn * ux * k, sgn * uy * k):
                            # no room to step aside (a doorway, a corridor): one of them waits a moment
                            if getattr(me, "pause", 0.0) <= 0 and getattr(other, "pause", 0.0) <= 0 and other.path:
                                me.pause = 0.9
                                if not me.is_cat and not other.is_cat and random.random() < 0.35 and not me.bubble:
                                    me.say(random.choice(["你先～", "借过借过", "让一让哦", "哎，挤住了"]), 1.6)
                    elif m == "free" and (self.movable(other) != "walk"):
                        k = min(over * 0.5, 28.0 * dt)
                        self._nudge(me, sgn * ux * k, sgn * uy * k)

    # ---- the talking plush toys -----------------------------------------------------------
    def plush_say(self, name, text, delay=0.0, dur=None):
        """Queue a line; plush lines never overlap each other. Returns seconds until it has been said."""
        if dur is None:
            dur = clamp(1.6 + 0.13 * len(text), 2.2, 5.0)
        now = time.monotonic()
        start = max(now + delay, getattr(self, "plush_free_at", 0.0))
        self.plush_free_at = start + dur + 0.2
        self.plush_pending.append((start, name, text, dur))
        return self.plush_free_at - now

    def step_plush(self):
        now = time.monotonic()
        due = [x for x in self.plush_pending if x[0] <= now]
        self.plush_pending = [x for x in self.plush_pending if x[0] > now]
        for _, name, text, dur in due:
            self.plush_bubbles[name] = {"text": text, "t0": now, "until": now + dur}
        for k in [k for k, b in self.plush_bubbles.items() if b["until"] < now]:
            del self.plush_bubbles[k]
        if now > self.next_plush:
            self.next_plush = now + random.uniform(45, 110)
            if not self.app.quiet:
                self.plush_chat()

    def plush_line(self, name, key, **fmt):
        pool = PLUSH_LINES.get(name, {}).get(key) or ["……"]
        fmt.setdefault("u", self.app.title_for())
        return pick(pool, **fmt)

    def plush_listeners(self, name, dist=240):
        w = self.plush_where(name)
        if w is None:
            return []
        f, x, y = w[0], w[1], w[2]
        out = []
        for a in self.agents():
            if a.away or a.f != f or a.stairs_u is not None:
                continue
            if a.is_cat and a.state == "rest" and a.data.get("pose") == "sleep":
                continue
            if not a.is_cat and a.act == "sleep":
                continue
            if math.hypot(a.x - x, a.y - y) < dist:
                out.append(a)
        return out

    def plush_chat(self, castle=None, starter=None, to_user=False, prefer=None):
        """A short exchange between a plush toy and a cat, a person or another plush."""
        names = [n for n in PLUSH_NAMES if self.plush_where(n) is not None]
        if not names:
            return
        name = starter if starter in names else random.choice(names)
        if to_user:
            wait = self.plush_say(name, self.plush_line(name, "hello"))
            listeners = self.plush_listeners(name)
            if listeners:
                self.reply_to_plush(random.choice(listeners), name, wait)
            return
        where = self.plush_where(name)
        listeners = self.plush_listeners(name)
        if prefer == "cat":
            listeners = [a for a in listeners if a.is_cat] or [c for c in self.cats if c.state != "held"]
        elif prefer == "person":
            listeners = [a for a in listeners if not a.is_cat] or [p for p in self.present_people() if p.act != "sleep"]
        if listeners and (prefer or random.random() < 0.8):
            a = random.choice(listeners)
            far = a.f != where[0] or math.hypot(a.x - where[1], a.y - where[2]) > 240
            if prefer and far and a.free_to_visit():
                if self.plush[name]["at"] == "castle" and where[4] is not None:
                    a.visit_castle(where[4])
                elif self.plush[name]["at"] != "held":
                    tx, ty = self.stand_near(where[0], where[1], where[2])
                    if a.is_cat:
                        a.interrupt()
                        a.release_spot()
                    else:
                        a.stop()
                        if a.state == "act":
                            a.end_act()
                    a.go(where[0], tx, ty, 0, False, lambda a=a: a.set_state("rest" if a.is_cat else "idle", 6))
            if a.is_cat:
                wait = self.plush_say(name, self.plush_line(name, "cat", c=a.name))
            else:
                wait = self.plush_say(name, self.plush_line(name, "person", p=a.name))
            self.reply_to_plush(a, name, wait)
            if random.random() < 0.4:
                other = random.choice([n for n in names if n != name] or [name])
                self.plush_say(other, pick(PLUSH_TO_PLUSH, a=name), wait + 3.0)
        elif self.everyone_asleep() or H.is_dark(self.hour()) and random.random() < 0.6:
            self.plush_say(name, self.plush_line(name, "night"))
            other = random.choice([n for n in names if n != name] or [name])
            self.plush_say(other, pick(PLUSH_TO_PLUSH, a=name))
        else:
            self.plush_say(name, self.plush_line(name, "self"))
            other = random.choice([n for n in names if n != name] or [name])
            self.plush_say(other, pick(PLUSH_TO_PLUSH, a=name))

    def reply_to_plush(self, a, name, delay):
        w = self.plush_where(name)
        if w is not None and self.plush[name]["at"] != "held":
            a.facing = screen_facing(w[1] - a.x, w[2] - a.y, a.facing)
        if a.is_cat:
            a.say(pick(CAT_TO_PLUSH, t=name), None, delay)
        else:
            a.say(pick(KID_TO_PLUSH if a.role == "kid" else PERSON_TO_PLUSH, t=name), None, delay)

    def step_butterflies(self, dt):
        if self.outdoor_ok() and len(self.butterflies) < 3 and random.random() < dt * 0.05:
            x, y = self.random_floor(2)
            self.butterflies.append({"x": x, "y": y, "z": 40.0, "vx": 0.0, "vy": 0.0, "ph": random.uniform(0, 6),
                                     "col": random.choice(("#f2c94c", "#ffffff", "#9fc3ef", "#f39ab3")),
                                     "life": random.uniform(40, 120), "flee": 0.0})
        out = []
        for b in self.butterflies:
            b["life"] -= dt
            b["ph"] += dt
            for c in self.cats:
                if c.f == 2 and math.hypot(c.x - b["x"], c.y - b["y"]) < 40 and c.running:
                    b["flee"] = 2.0
            sp = 60 if b["flee"] > 0 else 22
            b["flee"] = max(0.0, b["flee"] - dt)
            b["vx"] += random.uniform(-1, 1) * sp * dt * 3
            b["vy"] += random.uniform(-1, 1) * sp * dt * 3
            n = math.hypot(b["vx"], b["vy"]) or 1
            if n > sp:
                b["vx"], b["vy"] = b["vx"] / n * sp, b["vy"] / n * sp
            b["x"] = clamp(b["x"] + b["vx"] * dt, 20, H.PW - 30)
            b["y"] = clamp(b["y"] + b["vy"] * dt, 10, H.PD - 30)
            b["z"] = 34 + 16 * math.sin(b["ph"] * 1.7) + (40 if b["flee"] > 0 else 0)
            if b["life"] > 0 and (self.outdoor_ok() or b["life"] > 100):
                out.append(b)
        self.butterflies = out

    def ambient(self):
        c = random.choice(self.cats) if self.cats else None
        if c is None or c.state == "held" or (c.state == "rest" and c.data.get("pose") == "sleep") or self.app.quiet:
            return
        sp = c.spot_info()
        if sp is not None and sp["kind"] == "watch":
            c.chat("window", 0.8)
        elif c.state == "rest":
            c.chat(random.choice(("idle", "home", "happy")), 0.6)


# ======================================================================================== depth order
class Drawable:
    __slots__ = ("kind", "obj", "part", "x0", "y0", "x1", "y1", "z", "on", "w0", "w1", "low")

    def __init__(self, kind, obj, x0, y0, x1, y1, part=None, z=0.0, on=None, pad=0.0, low=False):
        self.kind, self.obj, self.part = kind, obj, part
        self.x0, self.y0, self.x1, self.y1 = x0, y0, x1, y1
        self.z = z
        self.on = on
        self.w0, self.w1 = x0 - pad, x1 + pad
        self.low = low


def _static_before(a, b, eps=0.05):
    """For the furniture / walls of a storey: True if a is drawn before b (a is further back)."""
    if a.kind == "item" and b.kind == "item" and a.obj is b.obj:
        return a.part == "back"
    if a.w1 <= b.w0 + eps or b.w1 <= a.w0 + eps:
        return None
    a_behind = a.y0 >= b.y1 - eps
    b_behind = b.y0 >= a.y1 - eps
    if a_behind and not b_behind:
        return True
    if b_behind and not a_behind:
        return False
    ca, cb = a.y0 + a.y1, b.y0 + b.y1
    if abs(ca - cb) > eps:
        return ca > cb
    return None


def _static_key(d):
    return (-(d.y0 + d.y1), d.z)


def _agent_after(s, a, eps=0.05):
    """True if static s must be drawn before agent a, False if after, None if they never overlap."""
    if s.w1 <= a.w0 + eps or a.w1 <= s.w0 + eps:
        return None
    if s.kind == "stairs" and getattr(a.obj, "stairs_u", None) is not None:
        return True
    if s.y0 >= a.y1 - eps:
        return True
    if a.y0 >= s.y1 - eps:
        return False
    if s.low:
        return True
    return (s.y0 + s.y1) / 2 > (a.y0 + a.y1) / 2


def order_scene(statics, agents):
    """statics are already in drawing order; slot the cats and people in between. Someone sitting on a
    piece of furniture goes right after it -- or right before it when a taller part of it is in front."""
    slots = {}
    for a in agents:
        if a.on is not None:
            idx = [i for i, d in enumerate(statics) if d.kind == "item" and d.obj is a.on]
            if idx:
                if a.part == "behind":
                    pos = min(idx) - 0.5
                else:
                    parts = {statics[i].part: i for i in idx}
                    pos = parts["back"] + 0.5 if "back" in parts else max(idx) + 0.5
                slots.setdefault(pos, []).append(a)
                continue
        lo = -1
        for i, s in enumerate(statics):
            if _agent_after(s, a) is True:
                lo = i
        slots.setdefault(lo + 0.5, []).append(a)
    keys = sorted(slots)
    out = []
    ki = 0
    for i, s in enumerate(statics):
        while ki < len(keys) and keys[ki] < i:
            out.extend(sorted(slots[keys[ki]], key=_static_key))
            ki += 1
        out.append(s)
    while ki < len(keys):
        out.extend(sorted(slots[keys[ki]], key=_static_key))
        ki += 1
    return out


# ======================================================================================== window
TOOLBAR_H = 44.0 * U               # (v26) compact toolbar
ROOF_H = 40.0                      # the roof (or the floor above) between the toolbar and the back walls
SLAB_X = 14.0                      # the beam between 二楼 and 一楼 in the all view (on top of 二楼's own slab)
GROUND_H = 40.0                    # the ground under the house (= the bottom of a panel)
GARDEN_KU = 0.56                   # the turned garden: how much its depth is foreshortened (sideways)


class HouseWindow(QWidget):
    """Frameless window showing the storeys of the house: all three stacked, or one at a time.
    The app's timer calls step(dt)."""

    def __init__(self, app):
        flags = Qt.FramelessWindowHint | Qt.Tool
        if app.cfg["house"].get("top"):
            flags |= Qt.WindowStaysOnTopHint
        super().__init__(None, flags)
        self.app = app
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setWindowTitle("猫猫咕咕的家")
        self.setMouseTracking(True)
        self.setFocusPolicy(Qt.StrongFocus)
        hc = app.cfg["house"]
        v = hc.get("view", 1)
        self.view = v if v in (0, 1, 2) else 1
        self.mode = "one" if hc.get("mode") == "one" else "all"
        self.focus_f = self.view
        self.door_t, self.door_f = 0.0, 0
        H.configure(hc.get("mirror", True))
        self.net = None                   # house_net.NetHost / NetClient while sharing the house
        self.local_pid = "host"
        self.keys = set()
        self.last_dir = (0, 0)
        self.aim = None
        self.goto_fx = None
        self.world = World(app, self)
        self.world.play.add_player("host", self.my_name())
        self.edit = False
        self.press = None
        self.drag_item = None
        self.hover_item = None
        self.placing = None
        self.hover_toy = None            # (castle, plush name) under the mouse
        self.bg_cache = {}
        self.sprites = {}
        self.static_cache = {}
        self.last_touch = time.monotonic()
        self.follow_t = 0.0
        self.font = QFont(app.font)
        self.font.setPixelSize(int(15 * U))
        self.small = QFont(app.font)
        self.small.setPixelSize(int(14 * U))
        self.label_font = QFont(app.font)
        self.label_font.setPixelSize(int(15 * U))
        self.tag_font = QFont(app.font)
        self.tag_font.setPixelSize(int(14 * U))
        self.tag_font.setBold(True)
        self.mark_font = QFont(app.font)
        self.mark_font.setPixelSize(int(12 * U))
        self.mark_font.setBold(True)
        self.banner_font = QFont(app.font)
        self.banner_font.setPixelSize(int(22 * U))
        self.banner_font.setBold(True)
        self.place_for_mode(first=True)

    # ---- geometry ----------------------------------------------------------------------------
    # (v26) The window is one opaque picture: the toolbar, then the house in cross-section (roof, 二楼 on top of
    # 一楼 with the stairwell lined up, the ground); in the all view the garden lies on its side to the right.
    @staticmethod
    def wall_top():
        """Panel y of the top of the back walls."""
        return H.OY - H.PD * H.KY - H.WALL_H

    @staticmethod
    def top0():
        """Canvas y of the (top) storey's panel."""
        return TOOLBAR_H + ROOF_H - HouseWindow.wall_top()

    @staticmethod
    def stride():
        """二楼's slab and the beam sit right on 一楼's back walls."""
        return H.OY + 16.0 + SLAB_X - HouseWindow.wall_top()

    def canvas_h(self, mode=None):
        n = 2 if (mode or self.mode) == "all" else 1
        return self.top0() + self.stride() * (n - 1) + H.OY + 16.0 + GROUND_H

    @staticmethod
    def garden_left():
        """The garden lies on the side of the front door, so the door from the house opens right onto it."""
        return H.MIRROR

    def garden_x(self):
        """Canvas x where the turned garden starts (on the left, or right at the house's right side wall)."""
        return 0.0 if self.garden_left() else H.OX + H.PW + H.SIDE_T

    def house_ox(self):
        """Canvas x of the house's panels (moved right when the garden is on the left)."""
        if self.mode == "all" and self.garden_left():
            return self.garden_rot()[4] - (H.OX - H.SIDE_T)
        return 0.0

    def garden_rot(self):
        """(a, b, c, d, w, h): the turned garden's projection (u = a + b*y, v = c + d*x - z) in its own panel."""
        key = H.MIRROR
        c = self.__dict__.setdefault("_grot", {})
        if key not in c:
            c[key] = self._garden_rot()
        return c[key]

    def _garden_rot(self):
        gh = self.canvas_h("all") - TOOLBAR_H
        ku = GARDEN_KU
        w = 10.0 + (H.PD + H.ENTRY_D) * ku + 24.0
        # (v26) line the garden's door up with 一楼's front door (in the side wall, at the front corner): the
        # near edge of the garden is at the bottom, and the door sits that far above it
        door_v = self.top0() + self.stride() + H.OY - (H.SIDE_DOOR[1] + H.SIDE_DOOR[2]) / 2 * H.KY - TOOLBAR_H
        v0 = gh - 10.0
        door_x = (H.ENTRANCE[0] + H.ENTRANCE[1]) / 2
        dist = door_x if self.garden_left() else H.PW - door_x
        top = 60.0 if self.garden_left() else 48.0
        kv_max = (v0 - top) / H.PW
        kv = clamp((v0 - door_v) / max(1.0, dist), 0.5, kv_max)
        if self.garden_left():
            # the house wall on the right, the street on the left; x runs bottom to top, the hedge far at the top
            c = door_v + kv * door_x
            return (24.0 + H.ENTRY_D * ku, ku, c, -kv, w, gh)
        c = door_v - kv * door_x
        return (10.0 + H.PD * ku, -ku, c, kv, w, gh)

    def canvas_w(self, mode=None):
        m = mode or self.mode
        c = self.__dict__.setdefault("_cw", {})
        key = (m, H.MIRROR)
        if key not in c:
            if m != "all":
                c[key] = H.TW
            elif self.garden_left():
                c[key] = self.garden_rot()[4] - (H.OX - H.SIDE_T) + H.TW
            else:
                c[key] = self.garden_x() + self.garden_rot()[4]
        return c[key]

    def rot_for(self, f):
        return self.garden_rot() if (self.mode == "all" and f == 2) else None

    def panel_ox(self, f):
        if self.mode != "all":
            return 0.0
        return self.garden_x() if f == 2 else self.house_ox()

    def panels(self):
        """(storey, canvas y of its panel), in painting order."""
        if self.mode == "all":
            t1 = self.top0()
            return [(0, t1 + self.stride()), (1, t1), (2, TOOLBAR_H)]
        return [(self.view, self.top0())]

    def panel_top(self, f):
        for g, oy in self.panels():
            if g == f:
                return oy
        return None

    @property
    def k(self):
        return self.width() / self.canvas_w()

    def avail(self):
        scr = self.screen() if self.screen() is not None else QGuiApplication.primaryScreen()
        return scr.availableGeometry()

    def default_width(self):
        a = self.avail()
        if self.mode == "all":
            return min(a.width() * 0.9, a.height() * 0.94 * self.canvas_w() / self.canvas_h())
        return min(1100, a.width() * 0.6)

    def apply_size(self, w):
        a = self.avail()
        ch, cw = self.canvas_h(), self.canvas_w()
        w = min(float(w), a.height() * 0.99 * cw / ch, float(a.width()))
        w = max(w, 380.0)
        self.setFixedSize(int(w), int(round(w * ch / cw)))
        self._chrome_cache = None
        self.bg_cache = {}
        self.sprites = {}

    def geom_key(self):
        return "geom_all2" if self.mode == "all" else "geom"          # (v26: the all view is laid out anew)

    def place_for_mode(self, first=False):
        g = self.app.cfg["house"].get(self.geom_key())
        ok = isinstance(g, list) and len(g) == 3
        self.apply_size(int(g[2]) if ok else self.default_width())
        a = self.avail()
        if ok and any(s.availableGeometry().contains(int(g[0]) + 60, int(g[1]) + 60) for s in QGuiApplication.screens()):
            x, y = int(g[0]), int(g[1])
        elif first:
            x, y = a.right() - self.width() - 16, a.bottom() - self.height() - 4
        else:
            x, y = self.x(), self.y()
        x = int(clamp(x, a.left() - self.width() + 120, a.right() - 120))
        y = int(clamp(y, a.top(), max(a.top(), a.bottom() - self.height())))
        self.move(x, y)

    def save_geom(self):
        self.app.cfg["house"][self.geom_key()] = [self.x(), self.y(), self.width()]
        self.app.save()

    def set_mode(self, mode, f=None):
        """mode 'all' shows the three storeys stacked; 'one' shows storey f (or the current one)."""
        if f is not None:
            self.view = f
            self.focus_f = f
        if mode == self.mode and f is None:
            return
        if mode != self.mode:
            self.save_geom()
            self.mode = mode
            self.place_for_mode()
        self.app.cfg["house"]["mode"] = self.mode
        self.app.cfg["house"]["view"] = self.view
        self.app.save()
        self.hover_item = None
        self.update()

    def canvas(self, pos):
        return pos.x() / self.k, pos.y() / self.k

    def locate(self, x, y):
        """Canvas point -> (storey, x, y in that storey's panel) (through the zoom, if any). The turned garden
        answers in the usual (straight-on) panel coordinates, so everything downstream works as before."""
        if self.mode != "all":
            f, oy = self.panels()[0]
            return (f,) + self.uncam(f, x, y - oy)
        gx = self.garden_x()
        if gx <= x <= gx + self.garden_rot()[4]:
            with H.rotated(self.garden_rot()):
                wx, wy = H.from_screen(x - gx, y - TOOLBAR_H)
            with H.rotated(None):
                return (2,) + H.iso(wx, wy)
        x -= self.house_ox()
        t1 = self.top0()
        if y < t1 + H.OY + 16.0:
            return 1, x, y - t1
        return 0, x, y - t1 - self.stride()

    # ---- the camera: zoom into a room (v23), follow a side-view fight --------------------------------
    ZQ_LEVELS = (1.5, 2.0, 2.5, 3.0)

    def cam_for(self, f):
        c = getattr(self, "cam", None)
        if c is None or self.mode != "one" or self.view != f or c["f"] != f or self.edit:
            return None
        if abs(c["z"] - 1.0) < 1e-3 and abs(c["cx"] - H.PANEL_W / 2) < 0.5 and abs(c["cy"] - H.PANEL_H / 2) < 0.5:
            return None
        return c

    def cam_apply(self, p, c):
        p.translate(H.PANEL_W / 2, H.PANEL_H / 2)
        p.scale(c["z"], c["z"])
        p.translate(-c["cx"], -c["cy"])

    def uncam(self, f, lx, ly):
        c = self.cam_for(f)
        if c is None:
            return lx, ly
        return c["cx"] + (lx - H.PANEL_W / 2) / c["z"], c["cy"] + (ly - H.PANEL_H / 2) / c["z"]

    def cam_target(self, rect, zmax=3.0, zmin=1.0):
        """Zoom and centre that fit a panel rectangle in the window."""
        z = min(H.PANEL_W / max(1.0, rect.width()), H.PANEL_H / max(1.0, rect.height())) * 0.94
        z = clamp(z, zmin, zmax)
        hw, hh = H.PANEL_W / (2 * z), H.PANEL_H / (2 * z)
        cx = clamp(rect.center().x(), hw, H.PANEL_W - hw)
        cy = clamp(rect.center().y(), hh, H.PANEL_H - hh)
        return z, cx, cy

    def zoom_room(self, f, lx, ly):
        """Double-click on a room: zoom so it fills the window; on open ground (garden, out and about) zoom in
        around the spot."""
        if f in AA.ARENAS or f == HM.MAP_F:
            return False
        wx, wy = H.from_screen(lx, ly)
        key = H.room_at(f, wx, wy) if f in H.FLOORS else None
        rect = None
        label = ""
        if key is not None:
            lab, x0, y0, x1, y1, st = H.rooms(f)[key]
            # the floor and the lower part of the wall behind it (where the shelves and windows are)
            top = H.iso(0, y1, 105)[1]
            bot = H.iso(0, y0, 0)[1] + 8
            rect = QRectF(H.OX + x0 - 6, top, x1 - x0 + 12, bot - top)
            label = lab
            if rect.width() * rect.height() > H.PANEL_W * H.PANEL_H * 0.55:
                rect = None
        if rect is None:
            rect = QRectF(lx - 260, ly - 120, 520, 220)
            label = label or (PA.PLACES[f]["name"] if f in PA.PLACES else "这里")
        z, cx, cy = self.cam_target(rect)
        if z < 1.12:
            return False
        if self.mode != "one" or self.view != f:
            self.set_mode("one", f)
        c = getattr(self, "cam", None)
        if c is None or c["f"] != f:
            c = self.cam = {"f": f, "z": 1.0, "cx": H.PANEL_W / 2, "cy": H.PANEL_H / 2}
        zq = next((q for q in self.ZQ_LEVELS if q >= z - 0.05), self.ZQ_LEVELS[-1])
        c.update(kind="room", tz=z, tcx=cx, tcy=cy, zq=zq, label=label)
        self.update()
        return True

    def unzoom(self):
        c = getattr(self, "cam", None)
        if c is None or c.get("kind") != "room":
            return False
        c.update(tz=1.0, tcx=H.PANEL_W / 2, tcy=H.PANEL_H / 2, kind="out")
        self.update()
        return True

    def step_cam(self, dt):
        c = getattr(self, "cam", None)
        bt = self.world.battle
        # side-view fights: follow the fighters
        if bt is not None and getattr(bt, "game", "") in ("brawl", "race") and self.mode == "one" and \
                self.view == bt.f and bt.phase in ("count", "fight", "over") and not isinstance(bt, HB.RemoteBattle) \
                or (bt is not None and isinstance(bt, HB.RemoteBattle) and getattr(bt, "game", "") in ("brawl", "race")
                    and self.mode == "one" and self.view == bt.f and bt.phase in ("count", "fight", "over")):
            if not self.app.cfg["house"].get("battle_cam", True):
                pass
            else:
                pts = [fi.a.screen(bt.f) for fi in bt.fighters if fi.a.f == bt.f and fi.a.traveling is None]
                if pts:
                    xs = [q[0] for q in pts]
                    ys = [q[1] for q in pts]
                    x0, x1 = min(xs) - 150, max(xs) + 150
                    y0, y1 = min(ys) - 190, max(ys) + 60
                    w_ = max(x1 - x0, 620.0)
                    h_ = max(y1 - y0, 240.0)
                    rect = QRectF((x0 + x1) / 2 - w_ / 2, (y0 + y1) / 2 - h_ / 2, w_, h_)
                    z, cx, cy = self.cam_target(rect, zmax=1.6)
                    if c is None or c["f"] != bt.f or c.get("kind") not in ("battle",):
                        c = self.cam = {"f": bt.f, "z": 1.0, "cx": H.PANEL_W / 2, "cy": H.PANEL_H / 2}
                    c.update(kind="battle", tz=z, tcx=cx, tcy=cy, zq=1.6, label="")
        elif c is not None and c.get("kind") == "battle":
            c.update(kind="out", tz=1.0, tcx=H.PANEL_W / 2, tcy=H.PANEL_H / 2)
        if c is None:
            return
        if self.mode != "one" or self.view != c["f"] or self.edit:
            self.cam = None
            return
        k = 1 - math.exp(-dt * (5.0 if c.get("kind") == "battle" else 9.0))
        moving = False
        for a, b in (("z", "tz"), ("cx", "tcx"), ("cy", "tcy")):
            if abs(c[b] - c[a]) > (1e-3 if a == "z" else 0.2):
                moving = True
            c[a] += (c[b] - c[a]) * k
        if c.get("kind") == "out" and abs(c["z"] - 1.0) < 0.01:
            self.cam = None
            moving = True
        if moving and c.get("kind") != "battle":
            self.update()

    def paint_cam_chip(self, p):
        """While zoomed into a room: its name and a 还原 button."""
        c = getattr(self, "cam", None)
        self.cam_rect = None
        if c is None or c.get("kind") != "room" or self.mode != "one":
            return
        text = "🔍 %s · 点这里还原（Esc / 双击）" % c.get("label", "")
        p.setFont(self.small)
        fm = QFontMetricsF(self.small)
        w = fm.horizontalAdvance(text) + 26
        r = QRectF(self.canvas_w() - w - 18 * U, TOOLBAR_H + 8 * U, w, 26 * U)
        p.setPen(QPen(QColor("#c4862c"), 1.4))
        p.setBrush(QColor(255, 250, 238, 235))
        p.drawRoundedRect(r, r.height() / 2, r.height() / 2)
        p.setPen(QColor("#6b4a35"))
        p.drawText(r, Qt.AlignCenter, text)
        self.cam_rect = r

    SEG_KEYS = ("all", "floor1", "floor0", "floor2")

    def button_rects(self):
        """(v26) A compact toolbar: the views as one segmented switch, then 地图; on the right 玩耍 / 装修 / 回桌面."""
        bh = 32 * U
        y = (TOOLBAR_H - bh) / 2

        def R(x, w):
            return QRectF(x * U, y, w * U, bh)
        out = {"all": R(12, 64), "floor1": R(76, 64), "floor0": R(140, 64), "floor2": R(204, 64)}
        if self.edit:
            out.update({"add": R(284, 116), "rotate": R(406, 84), "reset": R(496, 108)})
        else:
            out["places"] = R(280, 92)
        cw = self.canvas_w()
        out.update({"play": QRectF(cw - 326 * U, y, 102 * U, bh),
                    "edit": QRectF(cw - 218 * U, y, 98 * U, bh),
                    "home": QRectF(cw - 114 * U, y, 102 * U, bh)})
        return out

    def grip_rect(self):
        h = self.canvas_h()
        return QRectF(self.canvas_w() - 46 * U, h - 42 * U, 44 * U, 40 * U)

    def follow_me(self):
        """(v26) The character you control goes up / down the stairs, out into the garden or off to a place: the
        view goes with it (only when it changes storey, so you can still look elsewhere in between)."""
        me = self.my_agent()
        if me is None or self.edit or me.away or me.traveling is not None:
            self._me_f = None
            return
        f = me.f if me.stairs_u is None else (1 if me.stairs_u > 0.5 else 0)
        last = getattr(self, "_me_f", None)
        self._me_f = f
        if last is None or last == f:
            return
        if self.mode == "one":
            if self.view != f:
                self.cam = None
                self.set_view(f)
        elif f not in (0, 1, 2):
            self.set_mode("one", f)               # gone out to a place: the all view only shows home
        else:
            self.focus_f = f

    def set_view(self, f):
        """Show storey f: in the one-storey layout switch to it; in the stacked layout it's already there."""
        self.focus_f = f
        if self.mode == "one" and f != self.view:
            self.view = f
            self.hover_item = None
            self.app.cfg["house"]["view"] = f
            self.update()

    def focus_floor(self):
        return self.view if self.mode == "one" else self.focus_f

    def show_floor_of(self, agent):
        bt = self.world.battle
        if bt is not None and self.view == bt.f:
            return                              # watching (or playing) a fight: stay
        if self.view not in (0, 1, 2) or self.my_agent() is not None:
            return
        if self.mode == "one" and agent.f != self.view and not self.edit:
            self.set_view(agent.f)
            self.last_touch = time.monotonic()

    # ---- step ----------------------------------------------------------------------------------
    def steering(self):
        """(v26) The character you control is on the move (keys held, walking, jumping)."""
        me = self.my_agent()
        return me is not None and not self.edit and bool(self.keys or me.path or getattr(me, "jump_info", None))

    def step(self, dt):
        self.world.step(dt)
        if self.keys and self.key_turn() != getattr(self, "_key_turn", None):
            self.send_dir()                    # walked into / out of the turned garden with a key held
        if self.net is not None:
            try:
                self.net.tick(dt)
            except Exception as ex:
                print("net tick:", repr(ex), file=sys.stderr)
        self.follow_me()
        fa = self.world.agent_by_uid(self.follow_uid) if getattr(self, "follow_uid", None) else None
        if fa is not None and self.mode == "one" and not self.edit:
            if not fa.away:
                target = fa.f if fa.stairs_u is None else (1 if fa.stairs_u > 0.5 else 0)
                if target != self.view:
                    self.set_view(target)
        # one-storey layout: if both cats have been on another storey for a while, follow them -- only while
        # looking at the house itself (never away from a fight, a place, the map, or a character you control)
        elif self.mode == "one" and not self.edit and time.monotonic() - self.last_touch > 20 and \
                self.view in (0, 1, 2) and self.my_agent() is None and \
                not (self.world.battle is not None and self.world.battle.phase != "over"):
            if self.world.cats and all(c.f != self.view and c.stairs_u is None for c in self.world.cats):
                self.follow_t += dt
                if self.follow_t > 8:
                    self.set_view(self.world.cats[0].f)
                    self.follow_t = 0.0
            else:
                self.follow_t = 0.0
        self.check_gate()
        try:
            self.step_cam(dt)
        except Exception as ex:
            print("cam error:", repr(ex), file=sys.stderr)
            self.cam = None
        now = time.monotonic()
        if not self.isVisible() or self.isMinimized():
            return
        fps = min(20.0 if self.mode == "one" else 16.0, float(self.app.power["fps"]))
        bt = self.world.battle
        if bt is not None and bt.f == self.view and bt.phase in ("count", "fight", "over"):
            fps = float(self.app.battle_fps())  # fights paint at 40 fps
        wh = self.windowHandle()
        if wh is not None and not wh.isExposed():
            fps = 1.0                           # covered / on another desktop: next to no repainting
        self._calm_chk = getattr(self, "_calm_chk", 0.0) - dt
        if self._calm_chk <= 0:
            self._calm_chk = 0.5
            self._calm = self.scene_calm(now)
        me = self.my_agent()
        if me is not None and (self.keys or me.path or getattr(me, "jump_info", None)) and not self.edit:
            # (v26) steering a character: as smooth as the clock allows
            fps = 60.0                          # = every tick of the (30 Hz) clock: no beat between the two
            self._calm = False
        elif getattr(self, "_calm", False) and bt is None:
            fps = min(fps, 10.0)                # nothing much moving: paint less often
        if now - getattr(self, "last_paint", 0.0) >= 1.0 / fps - 0.004:
            self.last_paint = now
            self.update()

    CALM_STATES = ("idle", "rest", "sleep", "act", "eat", "drink", "groom", "perch", "loaf", "nap")

    def scene_calm(self, now):
        """True when a lower frame rate would not be noticed: nobody walking or jumping, no TV, rain, snow or game."""
        w = self.world
        if now - self.last_touch < 6 or self.edit or getattr(self, "hover_agent", None) is not None or getattr(self, "hover_click", None):
            return False
        if w.play.game or any(not d.get("rest") for d in w.drops) or w.weather() in ("rain", "snow"):
            return False
        if any(it.type == "tv" and it.state.get("on") for it in w.items):
            return False
        for a in w.agents():
            if a.path or a.jump_info or a.stairs_u is not None or a.state not in self.CALM_STATES:
                return False
        return True

    # ---- cached layers -------------------------------------------------------------------------
    def _panel_pixmap(self, key, draw):
        pm = self.bg_cache.get(key)
        if pm is None:
            dpr = self.devicePixelRatioF()
            k = self.k * getattr(self, "_zq", 1.0)
            pm = QPixmap(max(1, int(H.PANEL_W * k * dpr)), max(1, int(H.PANEL_H * k * dpr)))
            pm.setDevicePixelRatio(dpr)
            pm.fill(Qt.transparent)
            p = QPainter(pm)
            p.setRenderHint(QPainter.Antialiasing)
            p.scale(k, k)
            draw(p)
            p.end()
            self.bg_cache[key] = pm
        return pm

    def moving_item(self):
        return self.placing or self.drag_item

    def place_background(self, f):
        hour = self.world.hour()
        wx = self.world.weather() if self.world.weather() in ("rain", "snow") else None
        se = H.season() if self.app.cfg["house"].get("leaves", True) else "summer"
        labels = bool(self.app.cfg["house"].get("labels", True))
        snow_k = round(self.world.snow * 10)
        frozen = H.season() == "winter"
        key = ("bg", f, self.width(), getattr(self, "_zq", 1.0), int(hour * 4), labels, wx, se, snow_k,
               H.now_hour() // 1 if f == 3 else 0)
        if key in self.bg_cache:
            return self.bg_cache[key]
        for k in [k for k in self.bg_cache if k[0] == "bg" and k[1] == f]:
            del self.bg_cache[k]

        def draw(p):
            if f in AA.ARENAS:
                AA.draw_arena_back(p, f, hour)
                AA.draw_arena_base(p, f, hour)
            else:
                PA.draw_place_back(p, f, hour, wx, se)
                PA.draw_place_base(p, f, hour, se, snow_k / 10.0, frozen)
            for it in self.world.items:
                if it.f != f:
                    continue
                if it.cat.get("flat"):
                    H.draw_parts(p, H.item_parts(it), it, 0.0, it.x, it.y)
                elif it.cat["h"] > 2:
                    x0, y0, x1, y1 = it.fp()
                    H.soft_shadow(p, x0, y0, x1, y1, 0.8 if it.cat.get("walk") else 1.0)
            if labels:
                H.draw_labels(p, f, self.label_font, self.label_obstacles(f))
        return self._panel_pixmap(key, draw)

    def background(self, f):
        if f in PA.PLACES:
            return self.place_background(f)
        hour = self.world.hour()
        lit = f == 2 and any(pr.f in (0, 1) and pr.act != "sleep" for pr in self.world.present_people())
        labels = bool(self.app.cfg["house"].get("labels", True))
        mov = self.moving_item()
        closed = self.closed_curtains(f, hour)
        wx = self.world.weather() if self.world.weather() in ("rain", "snow") else None
        se = H.season() if (f == 2 and self.app.cfg["house"].get("leaves", True)) else None
        snow_k = round(self.world.snow * 10) if f == 2 else 0
        shadow = f == 2
        w = self.world
        lights = tuple((r, w.room_light_on(f, r), not w.room_lamps(f, r)) for r in w.light_rooms(f))
        key = ("bg", f, lights, (self.width(), getattr(self, "_zq", 1.0)), getattr(self.world, "layout_ver", 0), H.MIRROR,
               int(hour * 4), lit, labels, shadow,
               id(mov) if mov is not None else 0, closed, wx, se, snow_k)
        if key in self.bg_cache:
            return self.bg_cache[key]
        for k in [k for k in self.bg_cache if k[0] == "bg" and k[1] == f]:
            del self.bg_cache[k]

        def draw(p):
            g = QRadialGradient(QPointF(0, 0), 1.0)
            g.setColorAt(0, QColor(0, 0, 0, 60 if shadow else 0))
            g.setColorAt(1, QColor(0, 0, 0, 0))
            p.save()
            cx, cy = H.iso(H.PW / 2, 0, -10)
            p.translate(cx, cy)
            p.scale(H.PW * 0.62, 30)
            p.setPen(Qt.NoPen)
            p.setBrush(g)
            p.drawEllipse(QPointF(0, 0), 1.0, 1.0)
            p.restore()
            H.draw_base(p, f)
            if se:
                H.draw_ground_season(p, se)
            H.draw_back_walls(p, f)
            H.draw_thresholds(p, f)
            H.draw_windows(p, f, hour, 0.0, [], closed, wx)
            if f == 2:
                H.draw_facade_windows(p, hour, lit)
                if snow_k:
                    H.draw_snow_cover(p, snow_k / 10.0)
            if f == 1:
                H.draw_stairs(p, f)
            for room, on, ceiling in lights:              # (v26) every room's light switch, ceiling lights
                H.draw_switch(p, f, room, on)
                if ceiling:
                    H.draw_ceiling_light(p, f, room, on)
            for it in self.world.items:
                if it.f != f or it is mov:
                    continue
                if it.cat.get("flat"):
                    H.draw_parts(p, H.item_parts(it), it, 0.0, it.x, it.y)
                elif it.cat["h"] > 2:
                    x0, y0, x1, y1 = it.fp()
                    H.soft_shadow(p, x0, y0, x1, y1, 0.8 if it.cat.get("walk") else 1.0)
            if labels:
                H.draw_labels(p, f, self.label_font, self.label_obstacles(f, mov))
        return self._panel_pixmap(key, draw)

    def set_follow(self, a):
        """Keep the view on a character as it goes up and down the stairs and out into the garden."""
        self.follow_uid = a.uid if a is not None else None
        if a is not None:
            if self.mode != "one":
                self.set_mode("one", a.f)
            else:
                self.set_view(a.f)
            self.flash("跟随：%s（右键 → 取消跟随）" % a.name, 3)
        self.update()

    def holiday_kind(self):
        now = time.monotonic()
        if now - getattr(self, "_hk_t", -1e9) > 600:
            self._hk_t = now
            names = []
            try:
                import datetime
                d0 = datetime.date.today()
                for k in range(-2, 3):
                    names += self.app.holidays_on(d0 + datetime.timedelta(days=k))
            except Exception:
                pass
            self._hk = H.holiday_now(names)
        return self._hk

    def closed_curtains(self, f, hour):
        """Rooms whose curtains are drawn: at night where someone sleeps, everywhere once all are in bed;
        a click on a window opens / closes it until day turns to night (or back)."""
        if f >= 2:
            return ()
        w = self.world
        dark = H.is_dark(hour)
        if w.curtain_dark is not None and w.curtain_dark != dark:
            w.curtains = {}
        w.curtain_dark = dark
        if not dark:
            auto = set()
        else:
            people = w.present_people()
            if people and all(p.act == "sleep" for p in people):
                auto = set(H.rooms(f).keys())
            else:
                auto = {H.room_at(f, p.x, p.y) for p in people if p.f == f and p.act == "sleep"} - {None}
        for (ff, room), closed in w.curtains.items():
            if ff == f:
                if closed:
                    auto.add(room)
                else:
                    auto.discard(room)
        return tuple(sorted(auto))

    def label_obstacles(self, f, mov=None):
        """Screen rectangles the room names should stay clear of."""
        out = []
        for it in self.world.items:
            if it.f != f or it is mov:
                continue
            x0, y0, x1, y1 = it.fp()
            hgt = it.cat.get("h", 0)
            top = H.iso(0, y1, hgt)[1]
            bot = H.iso(0, y0, 0)[1]
            flat = it.cat.get("flat") or hgt < 3
            out.append((QRectF(H.OX + x0, top, x1 - x0, bot - top), 0.25 if flat else 1.0))
        if f in (0, 1):
            st = H.STAIR
            hgt = H.FH if f == 0 else 44
            out.append((QRectF(H.OX + st["x0"] - 6, H.iso(0, st["y1"], hgt)[1], st["x1"] - st["x0"] + 12,
                               H.iso(0, st["y0"], 0)[1] - H.iso(0, st["y1"], hgt)[1]), 1.0))
        return out

    def shell_sprite(self, kind, obj):
        """Walls, door posts, the stair flight and the stairwell rail, pre-rendered."""
        dpr = self.devicePixelRatioF()
        scale = self.k * getattr(self, "_zq", 1.0) * dpr
        key = ("shell", kind, obj, round(scale, 3), H.MIRROR)
        hit = self.sprites.get(key)
        if hit is not None:
            return hit
        s = H.STAIR
        if kind == "wall":
            x0, y0, x1, y1 = obj
            r = QRectF(H.OX + x0 - 4, H.iso(0, y1, H.IN_H)[1] - 4, x1 - x0 + 12, (y1 - y0) * H.KY + H.IN_H + 12)
        elif kind == "post":
            x, y = obj
            r = QRectF(H.OX + x - 9, H.iso(0, y + 5.5, H.DOOR_H + 3)[1] - 3, 18, 11 * H.KY + H.DOOR_H + 10)
        elif kind == "rail":
            top = H.iso(0, s["y1"], 40)[1] - 4
            r = QRectF(H.OX + s["x0"] - 8, top, s["x1"] - s["x0"] + 16, H.iso(0, s["y0"] - 4, 0)[1] + 4 - top)
        else:
            top = H.iso(0, s["y1"], H.FH)[1] - 56
            r = QRectF(H.OX + s["x0"] - 14, top, s["x1"] - s["x0"] + 28, H.iso(0, s["y0"] - 4, 0)[1] + 4 - top)
        pm = QPixmap(max(1, int(r.width() * scale + 2)), max(1, int(r.height() * scale + 2)))
        pm.fill(Qt.transparent)
        p = QPainter(pm)
        p.setRenderHint(QPainter.Antialiasing)
        p.scale(scale, scale)
        p.translate(-r.left(), -r.top())
        if kind == "wall":
            H.draw_wall_piece(p, obj)
        elif kind == "post":
            H.draw_post(p, *obj)
        elif kind == "rail":
            H.draw_rail(p)
        else:
            H.draw_stairs(p, 0)
        p.end()
        pm.setDevicePixelRatio(dpr)
        hit = (pm, r)
        if len(self.sprites) > 500:
            self.sprites.clear()
        self.sprites[key] = hit
        return hit

    def foreground(self, f):
        if f in AA.ARENAS:
            return self._panel_pixmap(("fg", f, self.width()), lambda p: AA.draw_arena_front(p, f))
        if f in PA.PLACES:
            return self._panel_pixmap(("fg", f, self.width()), lambda p: PA.draw_place_front(p, f))
        return self._panel_pixmap(("fg", f, self.width(), getattr(self, "_zq", 1.0)), lambda p: H.draw_front_walls(p, f))

    def sprite(self, it, which):
        try:
            sig = it.cat.get("sig", lambda i: None)(it)
        except Exception:
            sig = None
        dpr = self.devicePixelRatioF()
        scale = self.k * getattr(self, "_zq", 1.0) * dpr
        key = (it.type, it.rot, which, round(scale, 3), sig)
        hit = self.sprites.get(key)
        if hit is None:
            def split(part, which=which):
                if part[0] not in ("box", "face", "cyl"):
                    return which == "front"
                if part[0] == "face":
                    yc = part[1]
                else:
                    ext = H._ext(part)
                    yc = (ext[2] + ext[3]) / 2
                return (yc <= -6) == (which == "front")
            with H.rotated(None):
                pm, bb = H.render_sprite(it, scale, split if which in ("back", "front") else None)
            pm.setDevicePixelRatio(dpr)
            hit = (pm, bb)
            if len(self.sprites) > 500:
                self.sprites.clear()
            self.sprites[key] = hit
        return hit

    # ---- depth order -----------------------------------------------------------------------------
    def item_drawables(self, it):
        x0, y0, x1, y1 = it.fp()
        low = bool(it.cat.get("walk")) or it.cat["h"] <= 16
        if it.cat.get("split"):
            return [Drawable("item", it, x0, y0, x1, y1, "back", pad=8, low=low),
                    Drawable("item", it, x0, y0, x1, y1, "front", z=1, pad=8, low=low)]
        return [Drawable("item", it, x0, y0, x1, y1, pad=8, low=low)]

    def statics(self, f):
        mov = self.moving_item()
        key = (f, getattr(self.world, "layout_ver", 0), H.MIRROR, id(mov) if mov is not None else 0)
        hit = self.static_cache.get(key)
        if hit is not None:
            return hit
        out = []
        for it in self.world.items:
            if it.f != f or it.cat.get("flat") or it is mov:
                continue
            x0, y0, x1, y1 = it.fp()
            low = bool(it.cat.get("walk")) or it.cat["h"] <= 16
            if it.cat.get("split"):
                out.append(Drawable("item", it, x0, y0, x1, y1, "back", pad=8, low=low))
                out.append(Drawable("item", it, x0, y0, x1, y1, "front", z=1, pad=8, low=low))
            else:
                out.append(Drawable("item", it, x0, y0, x1, y1, pad=8, low=low))
        for seg in H.wall_segments(f, 40.0):
            out.append(Drawable("wall", seg, *seg))
        for x, y in H.wall_ends(f):
            out.append(Drawable("post", (x, y), x - 4.5, y - 4.5, x + 4.5, y + 4.5))
        s = H.STAIR
        if f == 1:
            out.append(Drawable("rail", None, s["x0"] - 3, s["y0"] - 3, s["x1"] + 3, s["y0"] + 1))
        elif f == 0:
            out.append(Drawable("stairs", None, s["x0"] - 5, s["y0"], s["x1"] + 5, s["y1"]))
        order = H.topo_order(out, _static_before, _static_key)
        if len(self.static_cache) > 12:
            self.static_cache.clear()
        self.static_cache[key] = order
        return order

    def drawables(self, f):
        agents = []
        mov = self.moving_item()
        if mov is not None and mov.f == f and not mov.cat.get("flat"):
            agents += self.item_drawables(mov)
        w = self.world
        for name in PLUSH_NAMES:
            if w.plush[name]["at"] not in ("item", "floor"):
                continue
            where = w.plush_where(name)
            if where is None or where[0] != f:
                continue
            _, x, y, z, it = where
            d = Drawable("plush", name, x - 3, y - 3, x + 3, y + 3, z=z, on=it, pad=8)
            if it is not None and H.front_height(it, x - it.x, y - it.y) > z + 4:
                d.part = "behind"
            agents.append(d)
        bt = w.battle
        if bt is not None and bt.f == f:
            rows = {}
            for o in bt.obst:
                if getattr(bt, "game", "") == "bomb" and o.get("k") in ("b_hard", "b_soft"):
                    rows.setdefault(o["y"], []).append(o)
                    continue
                agents.append(Drawable("bobj", o, o["x"] - o["w"] / 2, o["y"] - o["d"] / 2, o["x"] + o["w"] / 2,
                                       o["y"] + o["d"] / 2, pad=4))
            for spr in GA2.sprites(bt):
                agents.append(Drawable("bspr", spr, spr["x"] - spr["w"] / 2, spr["y"] - spr["d"] / 2,
                                       spr["x"] + spr["w"] / 2, spr["y"] + spr["d"] / 2, z=spr.get("z", 0.0), pad=4))
            for y, objs in rows.items():
                # boxes of one row are blitted together; split where a gap leaves room to stand between them
                objs.sort(key=lambda o: o["x"])
                run_ = [objs[0]]
                for o in objs[1:] + [None]:
                    if o is not None and o["x"] - run_[-1]["x"] < 81:
                        run_.append(o)
                        continue
                    agents.append(Drawable("brow", run_, run_[0]["x"] - run_[0]["w"] / 2, y - run_[0]["d"] / 2,
                                           run_[-1]["x"] + run_[-1]["w"] / 2, y + run_[0]["d"] / 2, pad=4))
                    run_ = [o]
        if f == 5:
            for b in w.boats:
                agents.append(Drawable("boat", (b, "back"), b["x"] - 40, b["y"] + 3, b["x"] + 40, b["y"] + 9))
                agents.append(Drawable("boat", (b, "front"), b["x"] - 40, b["y"] - 9, b["x"] + 40, b["y"] - 3))
        for cr in w.critters:
            if cr["f"] == f and cr.get("z", 0) < 12 and cr["k"] not in ("hawk", "firefly", "butterfly", "dragonfly"):
                agents.append(Drawable("critter", cr, cr["x"] - 6, cr["y"] - 2, cr["x"] + 6, cr["y"] + 2, pad=8))
        for dr in w.drops:
            if dr["f"] == f and dr.get("rest") and dr["z"] < 1:
                agents.append(Drawable("drop", dr, dr["x"] - 4, dr["y"] - 3, dr["x"] + 4, dr["y"] + 3, pad=6))
        for a in self.world.agents():
            if not a.visible_on(f) or (a.is_cat and a.state == "carried"):
                continue                   # a cat in someone's arms is drawn with that person
            x, y, z = a.world_pos(f)
            half = 30.0 if a.is_cat else 17.0
            if a.stairs_u is not None:
                s = H.STAIR
                agents.append(Drawable("agent", a, x - 3, y - 3, x + 3, y + 3, z=z, pad=half - 3))
                continue
            on = a.on_item()
            d = Drawable("agent", a, x - 3, y - 3, x + 3, y + 3, z=z, on=on, pad=half - 3)
            if on is not None and H.front_height(on, x - on.x, y - on.y) > a.h + 8:
                d.part = "behind"          # a taller part of the furniture is in front (sofa back, desk...)
            agents.append(d)
        return order_scene(self.statics(f), agents)

    def paint_drop(self, p, d):
        dx, dy = H.iso(d["x"], d["y"], d["z"])
        if d["z"] < 1:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, 30))
            p.drawEllipse(QPointF(dx, dy + 2), 7, 2.2)
        if not HC.draw_care_drop(p, d["kind"], dx, dy - 2, self.world.t, d.get("gift")):
            draw_drop(p, d["kind"], dx, dy - 5, d["rot"])

    # ---- painting ----------------------------------------------------------------------------
    def paintEvent(self, e):
        k = self.k
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        p.setRenderHint(QPainter.SmoothPixmapTransform)
        hour = self.world.hour()
        t = self.world.t
        p.scale(k, k)
        self._rustle = self.rustling()
        panels = self.panels()
        self.paint_backdrop(p, hour)
        for f, oy in panels:
            self.paint_floor(p, f, oy, hour, t)
            if self.mode == "all" and f == 0:
                self.paint_beam(p)
        for f, oy in panels:
            with H.rotated(self.rot_for(f)):
                self.paint_overlays(p, f, oy)
        self.paint_tags(p)
        self.paint_chrome(p)
        self.paint_hud(p)
        self.paint_out_chips(p)
        self.paint_battle_hud(p)
        self.paint_cam_chip(p)
        if not self.edit:
            self.paint_hover(p)
        self.paint_guess(p)
        self.paint_dark(p)
        p.end()

    def paint_dark(self, p):
        """(v27) 躲猫猫: the house goes dark below the toolbar while the cat finds its hiding place."""
        dk = self.world.play.dark
        if not dk:
            return
        t = self.world.t
        left = max(0.0, dk["until"] - t)
        gone = dk["dur"] - left
        a = max(0.0, min(1.0, gone / 0.25, left / 0.35))
        r = QRectF(0, TOOLBAR_H, self.canvas_w(), self.canvas_h() - TOOLBAR_H)
        p.save()
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(14, 12, 22, int(246 * a)))
        p.drawRect(r)
        cx, cy = r.center().x(), r.center().y()
        dots = "." * (1 + int(gone * 3) % 3)
        p.setFont(self.banner_font)
        p.setPen(QColor(255, 244, 222, int(255 * a)))
        p.drawText(QRectF(r.left(), cy - 40 * U, r.width(), 40 * U), Qt.AlignHCenter | Qt.AlignBottom,
                   "🙈 %s正在找位置%s" % (dk["name"], dots.ljust(3)))
        p.setFont(self.small)
        p.setPen(QColor(220, 206, 230, int(200 * a)))
        p.drawText(QRectF(r.left(), cy + 6 * U, r.width(), 24 * U), Qt.AlignHCenter | Qt.AlignTop,
                   "不许偷看哦～ %d" % max(1, math.ceil(left)))
        w = 180 * U                                    # a row of paw prints filling up
        n = 6
        k = min(1.0, gone / max(0.1, dk["dur"]))
        for i in range(n):
            if i >= k * n + 0.5:
                break
            px = cx - w / 2 + (i + 0.5) * w / n
            py = cy + 46 * U + (4 * U if i % 2 else -4 * U)
            p.setBrush(QColor(255, 214, 160, int(210 * a)))
            p.drawEllipse(QPointF(px, py + 3 * U), 5.5 * U, 4.5 * U)
            for dx, dy in ((-5, -5), (-1.8, -8), (1.8, -8), (5, -5)):
                p.drawEllipse(QPointF(px + dx * U, py + dy * U), 1.8 * U, 2.1 * U)
        p.restore()

    # ---- hover: a highlight on things you can click, a card for characters ------------------------------
    def leaveEvent(self, e):
        if getattr(self, "hover_btn", None) is not None:
            self.hover_btn = None
            self.update()
        self.hover_agent = None
        self.hover_click = None
        self.hover_click_key = None
        super().leaveEvent(e)

    def paint_hover(self, p):
        hc = getattr(self, "hover_click", None)
        if hc is not None and self.press is None:
            f, (kind, obj) = hc
            oy = self.panel_top(f)
            rot_ = H.rotated(self.rot_for(f))
            rot_.__enter__()
            if kind == "curtain":
                for side, a, b in H.FLOORS[f]["windows"]:
                    if side == "S" and H.room_of_wall_point(f, (a + b) / 2, H.PD - 1) == obj[1]:
                        r = H.window_rect(a, b).adjusted(-14, -8, 14, 10).translated(0, oy)
                        break
                else:
                    r = None
            elif kind == "gift":
                sx, sy = H.iso(obj["x"], obj["y"], 0)
                r = QRectF(sx - 12, oy + sy - 16, 24, 22)
            elif kind == "switch":
                r = H.switch_rect(*obj).adjusted(-3, -3, 3, 3).translated(0, oy)
            else:
                pm, bb = self.sprite(obj, None)
                ox, oy_ = H.iso(obj.x, obj.y)
                r = QRectF(ox + bb.left(), oy + oy_ + bb.top(), bb.width(), bb.height()).adjusted(-3, -3, 3, 3)
            rot_.__exit__()
            if r is not None:
                r = r.translated(self.panel_ox(f), 0)
                p.save()
                p.setPen(QPen(QColor(255, 236, 170, 210), 2.2))
                p.setBrush(QColor(255, 240, 190, 40))
                p.drawRoundedRect(r, 8, 8)
                tip = self.CLICK_TIPS.get(kind)
                if tip:
                    p.setFont(self.small)
                    fm = QFontMetricsF(self.small)
                    w = fm.horizontalAdvance(tip) + 14
                    tr = QRectF(r.center().x() - w / 2, r.top() - 24 * U, w, 20 * U)
                    p.setPen(QPen(QColor("#d9b99b"), 1))
                    p.setBrush(QColor(255, 250, 240, 235))
                    p.drawRoundedRect(tr, tr.height() / 2, tr.height() / 2)
                    p.setPen(QColor("#6b4a3a"))
                    p.drawText(tr, Qt.AlignCenter, tip)
                p.restore()
        a = getattr(self, "hover_agent", None)
        if a is None or self.press is not None or time.monotonic() - getattr(self, "hover_agent_t", 0) < 0.45:
            return
        if a.away or a not in self.world.agents():
            return
        mx, my = getattr(self, "mouse_canvas", (0, 0))
        self.paint_card(p, a, mx, my)

    def card_lines(self, a):
        """(title, subtitle, rows, bars) for a character's status card."""
        w = self.world
        if a.uid.startswith("v:"):
            info = HC.VISITORS.get(a.kind, {})
            rec = (self.app.cfg["house"].get("visitors_book") or {}).get(a.kind, {})
            rows = [info.get("desc", "")]
            if not w.remote:
                rows.append("来过 %d 次 · 吃过 %d 次" % (rec.get("visits", 0), rec.get("fed", 0)))
            if getattr(a, "leave_gift", False):
                rows.append("吃饱了，走的时候可能会留下小礼物")
            return a.name, "来串门的流浪猫", rows, []
        doing = activity_text(a)
        if a.is_cat:
            t = HC.trait(a)
            rows = ["正在：" + doing, HC.tastes_text(a)]
            n = w.treats_today(a) if not w.remote else 0
            rows.append("今天的零食：%d / %d" % (n, HC.TREAT_LIMIT))
            bars = []
            if not w.remote:
                st = a.src.stats
                bars = [("饱腹", 100 - st.get("hunger", 0), "#f2a14a"), ("精力", st.get("energy", 0), "#6fb3e6"),
                        ("心情", st.get("mood", 0), "#ef7f9a")]
            return a.name, t.get("label", ""), rows, bars
        rows = ["正在：" + doing]
        tl = getattr(a, "tallies", None) or {}
        names = {"feed": "喂猫", "treat": "喂零食", "cuddle": "抱猫", "pet": "摸猫", "visitor": "喂流浪猫"}
        done = ["%s %d 次" % (names[k], v) for k, v in tl.items() if k in names]
        if done:
            rows.append("今天：" + "、".join(done[:3]))
        role = "大人" if a.role == "adult" else "小朋友"
        if a.npc:
            role = HPL.JOB_NAMES.get(a.npc["job"], "路人") + " · " + PA.PLACES[a.npc["f"]]["name"]
        if a.ctrl:
            role += " · %s在控制" % w.play.name_of(a.ctrl, self.local_pid)
        return a.name, role, rows, []

    def paint_card(self, p, a, mx, my):
        title, sub, rows, bars = self.card_lines(a)
        fm = QFontMetricsF(self.small)
        tf = QFont(self.font)
        tf.setBold(True)
        tfm = QFontMetricsF(tf)
        width = max([tfm.horizontalAdvance(title) + fm.horizontalAdvance(sub) + 26] +
                    [fm.horizontalAdvance(r) + 20 for r in rows] + [180 * U])
        lh = fm.height() + 3
        height = tfm.height() + 10 + lh * len(rows) + (len(bars) * (lh + 2) if bars else 0) + 10
        x, y = mx + 18, my + 14
        if x + width > self.canvas_w() - 6:
            x = mx - width - 12
        if y + height > self.canvas_h() - 6:
            y = my - height - 10
        r = QRectF(x, y, width, height)
        p.save()
        p.setPen(QPen(QColor("#d9b99b"), 1.2))
        p.setBrush(QColor(255, 250, 242, 242))
        p.drawRoundedRect(r, 10, 10)
        p.setFont(tf)
        p.setPen(QColor("#4a3b36"))
        p.drawText(QPointF(x + 10, y + 6 + tfm.ascent()), title)
        p.setFont(self.small)
        p.setPen(QColor("#9a7a62"))
        p.drawText(QPointF(x + 16 + tfm.horizontalAdvance(title), y + 6 + tfm.ascent()), sub)
        cy = y + tfm.height() + 10
        p.setPen(QColor("#5a4a42"))
        for row in rows:
            p.drawText(QPointF(x + 10, cy + fm.ascent()), row)
            cy += lh
        for label, val, col in bars:
            p.setPen(QColor("#5a4a42"))
            p.drawText(QPointF(x + 10, cy + fm.ascent()), label)
            bx = x + 14 + fm.horizontalAdvance("饱腹")
            bw = width - (bx - x) - 12
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, 25))
            p.drawRoundedRect(QRectF(bx, cy + 3, bw, lh - 7), 3, 3)
            p.setBrush(QColor(col))
            p.drawRoundedRect(QRectF(bx, cy + 3, bw * clamp(val / 100.0, 0.0, 1.0), lh - 7), 3, 3)
            cy += lh + 2
        p.restore()

    def blit(self, p, pm, x, y, top=0.0):
        """Draw a device-pixel pixmap whose top-left is at canvas (x, y). top: skip the rows above that panel y
        (nothing drawn there; a full-size blit is costly on Retina screens)."""
        k = self.k
        if getattr(self, "_camT", None) is not None:
            # zoomed in: the painter already carries the camera; the pixmap was rendered at k * zq
            s = 1.0 / (pm.devicePixelRatio() * k * self._zq)
            c = self.cam or {}
            near = abs(c.get("z", 1.0) / self._zq - 1.0) < 0.06      # ~1:1: no need for the (slow) smooth filter
            if near:
                p.save()
                p.setRenderHint(QPainter.SmoothPixmapTransform, False)
            p.drawPixmap(QRectF(x, y - self._camT, pm.width() * s, pm.height() * s), pm,
                         QRectF(0, 0, pm.width(), pm.height()))
            if near:
                p.restore()
            return
        sx, sy = getattr(self, "_shake", (0.0, 0.0))
        p.save()
        p.resetTransform()
        # (v26) whole device pixels: an exact blit instead of a filtered one (a lot faster, esp. on Retina)
        dpr = pm.devicePixelRatio() or 1.0
        # rounded the same way as the cached furniture picture (panel origin and position separately), so a
        # piece of furniture drawn again over it lands on exactly the same pixels
        o_x, o_y = getattr(self, "_ox", 0.0), getattr(self, "_oy", 0.0)
        px = round(o_x * k * dpr) + round((x + sx) * k * dpr)
        py = round(o_y * k * dpr) + round((y - o_y + sy) * k * dpr)
        if top > 0:
            skip = min(pm.height(), int(top * k * dpr))
            p.drawPixmap(QRectF(px / dpr, (py + skip) / dpr, pm.width() / dpr, (pm.height() - skip) / dpr), pm,
                         QRectF(0, skip, pm.width(), pm.height() - skip))
        else:
            p.drawPixmap(QPointF(px / dpr, py / dpr), pm)
        p.restore()

    def paint_floor(self, p, f, oy, hour, t):
        if f == HM.MAP_F:
            self.paint_map(p, oy, hour, t)
            return
        rot = self.rot_for(f)
        if rot is not None:
            self._ox = self.panel_ox(f)
            self._oy = oy
            try:
                with H.rotated(rot):
                    self.paint_floor_rot(p, f, oy, hour, t)
            finally:
                self._ox = 0.0
                self._oy = 0.0
                self._shake = (0.0, 0.0)
            return
        p.save()
        self._ox = self.panel_ox(f)
        self._oy = oy
        p.translate(self._ox, oy)
        p.setClipRect(QRectF(-2, -2, H.PANEL_W + 4, H.PANEL_H + 4))
        bt = self.world.battle
        self._shake = (0.0, 0.0)
        if bt is not None and bt.f == f and getattr(bt, "shake", 0) > 0.05:
            k = bt.shake * 6
            self._shake = (random.uniform(-k, k), random.uniform(-k * 0.6, k * 0.6))
            p.translate(*self._shake)
        cam = self.cam_for(f)
        self._camT = None
        self._zq = 1.0
        self._fast = bt is not None and bt.f == f and self.mode == "one" and self.view == f
        if cam is not None:
            self.cam_apply(p, cam)
            self._camT = oy
            self._zq = cam["zq"]
        cached = cam is None and (bt is None or bt.f != f) and f not in (2, HM.MAP_F) and not self.edit and \
            self.app.cfg["house"].get("scene_cache", True)
        region = None
        if cached:
            # (v26) the furniture comes from a cached picture; where anything moves (or animates), that area is
            # painted again from the bare background up, in the usual order -- nothing is ever drawn twice
            statics = self.statics(f)
            ds = self.drawables(f)
            rects = self.moving_rects(f, statics, ds)
            self.blit(p, self.scene_pixmap(f, statics), 0, oy)
            p.save()
            if rects:
                region = QRegion()
                for r in rects:
                    region = region.united(QRegion(r.toAlignedRect()))
                p.setClipRegion(region, Qt.IntersectClip)
                self.blit(p, self.background(f), 0, oy)
            else:
                p.setClipRect(QRectF(0, 0, 0, 0), Qt.IntersectClip)
        else:
            self.blit(p, self.background(f), 0, oy)
        if bt is not None and bt.f == f:
            AA.draw_battle_floor(p, bt, t)
        H.draw_window_birds(p, f, t, self.world.birds)
        wx = self.world.weather()
        if wx in ("rain", "snow") and f in (0, 1):
            H.draw_window_weather(p, f, time.monotonic(), wx, self.closed_curtains(f, hour))
        if f == 2 and self.world.snow > 0.02 and self.world.prints:
            H.draw_footprints(p, self.world.snow, [(x, y, a) for x, y, a in self.world.prints])
        if f == 2 and self.app.cfg["house"].get("holiday", True):
            hk = self.holiday_kind()
            if hk:
                H.draw_holiday(p, hk, time.monotonic(), H.is_dark(hour))
        mov = self.moving_item()
        for it in self.world.items:
            if it.f != f:
                continue
            if it.cat.get("flat"):
                if it is mov:
                    H.draw_parts(p, H.item_parts(it), it, t, it.x, it.y)
                H.draw_parts(p, H.item_parts(it), it, t, it.x, it.y, dyn=True)
                self.paint_edit_mark(p, it)
            elif it is mov and it.cat["h"] > 2:
                x0, y0, x1, y1 = it.fp()
                H.soft_shadow(p, x0, y0, x1, y1)
        for pk in self.world.play.pickups:
            if pk["f"] == f:
                sx, sy = H.iso(pk["x"], pk["y"])
                HP.draw_fish_treat(p, sx, sy, t + pk.get("t", 0))
        g = self.goto_fx
        if g is not None and g[0] == f and time.monotonic() - g[3] < 0.8:
            k = (time.monotonic() - g[3]) / 0.8
            sx, sy = H.iso(g[1], g[2])
            p.setPen(QPen(QColor(255, 255, 255, int(220 * (1 - k))), 2.2))
            p.setBrush(Qt.NoBrush)
            p.drawEllipse(QPointF(sx, sy), 8 + 14 * k, (8 + 14 * k) * 0.5)
        lamps = []
        dt_anim = 1.0 / max(8, self.app.power["fps"])
        if bt is not None and bt.f == f:
            AA.draw_battle_things(p, bt, t)
        if cached:
            self._freeze_dyn = True
            for d in ds:
                if region is not None and self._drawable_rect(d, statics).toAlignedRect().intersects(
                        region.boundingRect()) and region.intersects(self._drawable_rect(d, statics).toAlignedRect()):
                    self.paint_drawable(p, d, f, oy, t, lamps, dt_anim, bt)
                elif d.kind == "item" and d.part != "back":
                    self.collect_lamp(d.obj, lamps)
            self._freeze_dyn = False
            p.restore()
        else:
            for d in self.drawables(f):
                self.paint_drawable(p, d, f, oy, t, lamps, dt_anim, bt)
        self.paint_peeks(p, f, t)
        # the near walls / railings / fence: only the lower part of the panel has anything in it
        self.blit(p, self.foreground(f), 0, oy, top=(H.iso(0, 0, 130)[1] - 20) if f in (0, 1, 2) else 0.0)
        if f == 2:
            for b in self.world.butterflies:
                bx, by = H.iso(b["x"], b["y"], b["z"])
                H.draw_butterfly(p, bx, by, b["ph"], b["col"])
            H.draw_weather(p, t, self.world.weather())
        if bt is not None and bt.f == f:
            me_ = self.my_agent()
            AA.draw_battle_fx(p, bt, t, self.font, me_.uid if me_ is not None else None)
        if f in PA.PLACES and f not in AA.ARENAS:
            self.paint_place_extras(p, f, t)
            d = PA.PLACES[f]
            open_ = any(not n.hidden and n.f == f for n in self.world.npcs) or self.world.family_at(f)
            lit = set(d["lit"]) if open_ and HPL.in_hours(hour, d["hours"]) else set()
            lamps = list(lamps) + PA.place_lamps(self.world, f)
        else:
            lit = {H.room_at(f, pr.x, pr.y) for pr in self.world.present_people()
                   if pr.f == f and pr.act != "sleep" and f != 2}
            if f in (0, 1):
                on = [it for it in self.world.items if it.f == f and it.type == "lamp" and it.state.get("on")]
                lit |= {H.room_at(f, it.x, it.y) for it in on}
                for room in self.world.light_rooms(f):
                    if not self.world.room_lamps(f, room) and self.world.ceiling_on(f, room):
                        lit.add(room)
                        x_, y_, z_ = H.ceiling_pos(f, room)
                        lamps.append(H.iso(x_, y_, z_ - 4))
        H.draw_lights(p, f, hour, lit, lamps)
        p.restore()
        self._shake = (0.0, 0.0)
        self._camT = None
        self._zq = 1.0
        self._fast = False
        self._ox = 0.0
        self._oy = 0.0

    # ---- (v26) the garden on its side, beside the house in the all view ----------------------------------
    def garden_rot_background(self):
        hour = self.world.hour()
        se = H.season() if self.app.cfg["house"].get("leaves", True) else None
        snow_k = round(self.world.snow * 10)
        mov = self.moving_item()
        key = ("bgrot", self.width(), H.ROT, getattr(self.world, "layout_ver", 0), H.MIRROR, int(hour * 4), se, snow_k,
               id(mov) if mov is not None else 0)
        if key in self.bg_cache:
            return self.bg_cache[key]
        for k in [k for k in self.bg_cache if k[0] == "bgrot"]:
            del self.bg_cache[k]

        def draw(p):
            H.draw_garden_rot(p, se)
            if snow_k:
                H.draw_snow_cover(p, snow_k / 10.0)
            for it in self.world.items:
                if it.f != 2 or it is mov:
                    continue
                if it.cat.get("flat"):
                    H.draw_parts(p, H.item_parts(it), it, 0.0, it.x, it.y)
                elif it.cat["h"] > 2:
                    x0, y0, x1, y1 = it.fp()
                    H.soft_shadow(p, x0, y0, x1, y1, 0.8 if it.cat.get("walk") else 1.0)
        return self._panel_pixmap(key, draw)

    def paint_floor_rot(self, p, f, oy, hour, t):
        p.save()
        p.translate(self._ox, oy)
        p.setClipRect(QRectF(0, 0, H.PANEL_W, H.PANEL_H))
        self._shake = (0.0, 0.0)
        self._camT = None
        self._zq = 1.0
        self._fast = False
        bt = None
        self.blit(p, self.garden_rot_background(), 0, oy)
        if self.world.snow > 0.02 and self.world.prints:
            H.draw_footprints(p, self.world.snow, [(x, y, a) for x, y, a in self.world.prints])
        mov = self.moving_item()
        for it in self.world.items:
            if it.f != f:
                continue
            if it.cat.get("flat"):
                if it is mov:
                    H.draw_parts(p, H.item_parts(it), it, t, it.x, it.y)
                H.draw_parts(p, H.item_parts(it), it, t, it.x, it.y, dyn=True)
                self.paint_edit_mark(p, it)
            elif it is mov and it.cat["h"] > 2:
                x0, y0, x1, y1 = it.fp()
                H.soft_shadow(p, x0, y0, x1, y1)
        for pk in self.world.play.pickups:
            if pk["f"] == f:
                sx, sy = H.iso(pk["x"], pk["y"])
                HP.draw_fish_treat(p, sx, sy, t + pk.get("t", 0))
        g = self.goto_fx
        if g is not None and g[0] == f and time.monotonic() - g[3] < 0.8:
            k = (time.monotonic() - g[3]) / 0.8
            sx, sy = H.iso(g[1], g[2])
            p.setPen(QPen(QColor(255, 255, 255, int(220 * (1 - k))), 2.2))
            p.setBrush(Qt.NoBrush)
            p.drawEllipse(QPointF(sx, sy), 8 + 14 * k, (8 + 14 * k) * 0.5)
        lamps = []
        dt_anim = 1.0 / max(8, self.app.power["fps"])
        # nearer the bottom = nearer to you: draw from the top down
        seen = set()
        todo = []
        for d in self.drawables(f):
            if d.kind in ("wall", "post", "rail", "stairs"):
                continue
            if d.kind == "item":
                if id(d.obj) in seen:
                    continue
                seen.add(id(d.obj))
                d = _copy.copy(d)               # (the statics are cached: don't touch them)
                d.part = None
            sgn = 1.0 if H.ROT[3] > 0 else -1.0       # which way x runs on the screen
            todo.append((sgn * (d.x0 + d.x1) / 2 + (0.0 if d.kind == "item" else 0.5), d.z, d))
        todo.sort(key=lambda e: (e[0], e[1]))
        for _, _, d in todo:
            self.paint_drawable(p, d, f, oy, t, lamps, dt_anim, bt)
        self.paint_peeks(p, f, t)
        self.blit(p, self._panel_pixmap(("fgrot", self.width(), H.ROT), H.draw_garden_rot_front), 0, oy)
        for b in self.world.butterflies:
            bx, by = H.iso(b["x"], b["y"], b["z"])
            H.draw_butterfly(p, bx, by, b["ph"], b["col"])
        H.draw_weather(p, t, self.world.weather())
        H.draw_lights(p, f, hour, set(), lamps)
        p.restore()

    # ---- (v26) the furniture is painted once into a picture; every frame only what moves is drawn, plus any
    # piece of furniture that stands in front of it (so it still hides behind the sofa) ----------------------
    def static_rect(self, d):
        if d.kind == "item":
            it = d.obj
            pm, bb = self.sprite(it, d.part)
            ox, oy_ = H.iso(it.x, it.y)
            return QRectF(ox + bb.left(), oy_ + bb.top(), bb.width(), bb.height())
        pm, r = self.shell_sprite(d.kind, d.obj)
        return QRectF(r)

    def moving_rect(self, d):
        """Generous panel rectangle of something drawn every frame."""
        x, y = (d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2
        if d.kind == "agent":
            a = d.obj
            sx, sy = a.screen(self.panel_f)
            if a.is_cat:
                return QRectF(sx - 62, sy - 92, 124, 104)
            return QRectF(sx - 64, sy - 190, 128, 205)
        if d.kind == "item":
            return self.static_rect(d).adjusted(-4, -4, 4, 4)
        sx, sy = H.iso(x, y, d.z)
        return QRectF(sx - 44, sy - 70, 88, 84)

    ANIM_TYPES = ("tv", "fish_tank", "stove", "coat_rack", "washer")

    def is_anim(self, it):
        """(v26) Items whose moving bits really move (a TV picture, fish, steam...): drawn every frame. The rest
        (a plant's leaves, the food in a bowl) are drawn with the furniture into the cached picture."""
        if it.type not in self.ANIM_TYPES:
            return False
        if it.type == "coat_rack":
            return it.state.get("swing", 0.0) > 0.01
        if it.type in ("tv", "stove", "washer"):
            return bool(it.state.get("on"))
        return True

    def has_dyn(self, it):
        hit = self.__dict__.setdefault("_dyn_types", {})
        key = (it.type, it.rot)
        if key not in hit:
            hit[key] = any(pt[0] == "fn" and pt[5] for pt in H.item_parts(it))
        return hit[key]

    def scene_pixmap(self, f, statics):
        """The storey's background with all its furniture and walls (without their moving bits)."""
        mov = self.moving_item()
        sigs = []
        for d in statics:
            if d.kind == "item":
                try:
                    sigs.append(d.obj.cat.get("sig", lambda i: None)(d.obj))
                except Exception:
                    sigs.append(None)
            # the still bits drawn with the furniture depend on its state (food in the bowl, a lamp on...)
            if d.kind == "item" and self.has_dyn(d.obj) and not self.is_anim(d.obj):
                st = d.obj.state
                sigs.append(tuple(sorted((k_, round(v_, 1) if isinstance(v_, float) else repr(v_))
                                         for k_, v_ in st.items() if k_ not in ("seen", "force_dark", "until"))))
        bg = self.background(f)
        bg_key = next((k for k, v in self.bg_cache.items() if v is bg), id(bg))
        key = ("scene", f, self.width(), bg_key, getattr(self.world, "layout_ver", 0), H.MIRROR,
               id(mov) if mov is not None else 0, hash(tuple(map(repr, sigs))))
        hit = self.bg_cache.get(key)
        if hit is not None:
            return hit
        for k in [k for k in self.bg_cache if k[0] == "scene" and k[1] == f]:
            del self.bg_cache[k]
        dpr = self.devicePixelRatioF()
        k = self.k
        pm = QPixmap(bg.width(), bg.height())
        pm.fill(Qt.transparent)
        q = QPainter(pm)
        q.drawPixmap(QRectF(0, 0, bg.width(), bg.height()), bg, QRectF(0, 0, bg.width(), bg.height()))
        for d in statics:
            if d.kind == "item":
                spm, bb = self.sprite(d.obj, d.part)
                ox, oy_ = H.iso(d.obj.x, d.obj.y)
                x, y = ox + bb.left(), oy_ + bb.top()
            else:
                spm, r = self.shell_sprite(d.kind, d.obj)
                x, y = r.left(), r.top()
            q.drawPixmap(QRectF(round(x * k * dpr), round(y * k * dpr), spm.width(), spm.height()), spm,
                         QRectF(0, 0, spm.width(), spm.height()))
            if d.kind == "item" and d.part != "back" and self.has_dyn(d.obj) and not self.is_anim(d.obj):
                # (still) "moving" bits, frozen: a plant's leaves, the food in a bowl...
                q.save()
                q.setRenderHint(QPainter.Antialiasing)
                q.scale(k * dpr, k * dpr)
                H.draw_parts(q, H.item_parts(d.obj), d.obj, 0.0, d.obj.x, d.obj.y, dyn=True)
                q.restore()
        q.end()
        pm.setDevicePixelRatio(dpr)
        self.bg_cache[key] = pm
        return pm

    def _drawable_rect(self, d, statics):
        sid = self.__dict__.get("_sid")
        if sid is None or sid[0] is not statics:
            sid = self._sid = (statics, {id(x) for x in statics})
        r = self.static_rect(d) if id(d) in sid[1] else self.moving_rect(d)
        return r

    def moving_rects(self, f, statics, ds):
        """Panel rectangles that must be painted afresh this frame: characters and other moving things, items
        with animated bits, the windows while birds / rain go past, things on the floor that move."""
        self.panel_f = f
        sid = {id(d) for d in statics}
        self._sid = (statics, sid)
        out = []
        w = self.world
        if any(b.get("f") == f for b in getattr(w, "birds", [])) or \
                (w.weather() in ("rain", "snow") and f in (0, 1)):
            for side, a_, b_ in H.FLOORS.get(f, {}).get("windows", ()):
                if side == "S":
                    out.append(H.window_rect(a_, b_).adjusted(-20, -10, 20, 10))
        for it in w.items:
            if it.f == f and it.cat.get("flat") and self.has_dyn(it):
                x0, y0, x1, y1 = it.fp()
                out.append(H.frect(x0, y0, x1, y1).adjusted(-20, -40, 20, 10))
        for pk in w.play.pickups:
            if pk["f"] == f:
                sx, sy = H.iso(pk["x"], pk["y"])
                out.append(QRectF(sx - 20, sy - 30, 40, 40))
        g = self.goto_fx
        if g is not None and g[0] == f and time.monotonic() - g[3] < 0.8:
            sx, sy = H.iso(g[1], g[2])
            out.append(QRectF(sx - 30, sy - 16, 60, 32))
        rus = getattr(self, "_rustle", None) or {}
        for d in ds:
            if id(d) in sid:
                if d.kind == "item" and id(d.obj) in rus:
                    out.append(self.static_rect(d).adjusted(-6, -4, 6, 4))
                elif d.kind == "item" and d.part != "back" and self.has_dyn(d.obj) and self.is_anim(d.obj):
                    out.append(self.static_rect(d).adjusted(-6, -10, 6, 4))
            else:
                out.append(self.moving_rect(d))
        return out

    def collect_lamp(self, it, lamps):
        if it.type == "lamp" and it.state.get("on"):
            lamps.append(H.iso(it.x, it.y, 118))
        elif it.type == "tv" and it.state.get("on"):
            sx_, sy_ = H.iso(it.x, it.y - 30, 60)
            flick = 0.8 + 0.2 * math.sin(time.monotonic() * 7.3) * math.sin(time.monotonic() * 2.1)
            lamps.append((sx_, sy_, TV.glow_color(it), flick))
        elif it.type == "garden_lamp" and it.state.get("on"):
            lamps.append(H.iso(it.x, it.y, 90))

    def rustling(self):
        """(v27) {item id: x offset}: hiding places giving a little shake right now."""
        out = {}
        if self.world.play.dark is not None:
            return out
        t = self.world.t
        for c in self.world.cats:
            it = self.hiding_place(c)
            if it is not None:
                r = c.rustle(t)
                if r > 0:
                    out[id(it)] = 1.6 * r * math.sin(t * 55.0)
        return out

    def paint_drawable(self, p, d, f, oy, t, lamps, dt_anim, bt):
        """One thing of a storey's scene: a piece of furniture, a wall, a character..."""
        if d.kind == "item":
            it = d.obj
            pm, bb = self.sprite(it, d.part)
            ox, oy_ = H.iso(it.x, it.y)
            shake = self._rustle.get(id(it), 0.0) if getattr(self, "_rustle", None) else 0.0
            if shake:
                p.save()
                p.translate(shake, 0)
            self.blit(p, pm, ox + bb.left(), oy + oy_ + bb.top())
            if d.part != "back" and H.ROT is not None:
                # the turned garden: the sprite is drawn straight-on, so are its moving parts (around it)
                with H.rotated(None):
                    nx, ny = H.iso(it.x, it.y)
                    p.save()
                    p.translate(ox - nx, oy_ - ny)
                    H.draw_parts(p, H.item_parts(it), it, t, it.x, it.y, dyn=True)
                    p.restore()
                self.paint_edit_mark(p, it)
            elif d.part != "back":
                tt = 0.0 if getattr(self, "_freeze_dyn", False) and not self.is_anim(it) else t
                H.draw_parts(p, H.item_parts(it), it, tt, it.x, it.y, dyn=True)
                self.paint_edit_mark(p, it)
            if it.type == "lamp" and it.state.get("on"):
                lamps.append(H.iso(it.x, it.y, 118))
            elif it.type == "tv" and it.state.get("on"):
                sx_, sy_ = H.iso(it.x, it.y - 30, 60)
                flick = 0.8 + 0.2 * math.sin(time.monotonic() * 7.3) * math.sin(time.monotonic() * 2.1)
                lamps.append((sx_, sy_, TV.glow_color(it), flick))
            elif it.type == "garden_lamp" and it.state.get("on"):
                lamps.append(H.iso(it.x, it.y, 90))
            if shake:
                p.restore()
        elif d.kind in ("wall", "post", "rail", "stairs"):
            pm, r = self.shell_sprite(d.kind, d.obj)
            self.blit(p, pm, r.left(), oy + r.top())
        elif d.kind == "plush":
            kind, col = PLUSH_KIND[d.obj]
            sx, sy = H.iso((d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2, d.z)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, 34))
            sx0, sy0 = H.iso((d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2, d.z)
            p.drawEllipse(QPointF(sx0, sy0), 10, 3)
            H.draw_plush(p, kind, sx, sy, 1.0, col)
        elif d.kind == "drop":
            self.paint_drop(p, d.obj)
        elif d.kind == "boat":
            PA.draw_boat(p, d.obj[0], t, d.obj[1])
        elif d.kind == "bobj":
            AA.draw_obstacle(p, d.obj, t)
        elif d.kind == "brow":
            GA.draw_box_row(p, d.obj)
        elif d.kind == "bspr":
            GA2.draw_sprite(p, bt, d.obj, t)
        elif d.kind == "critter":
            PA.draw_critter(p, d.obj, t)
        elif d.kind == "agent":
            a = d.obj
            clip = a.stairs_u is not None and f == 1
            if clip:
                p.save()
                s = H.STAIR
                path = QPainterPath()
                path.addRect(H.frect(s["x0"], s["y0"], s["x1"], s["y1"]))
                p.setClipPath(path.united(self.hole_above()), Qt.IntersectClip)
            if a.is_cat:
                self.paint_cat(p, a, dt_anim, f, oy)
            else:
                self.paint_person(p, a, f, oy)
            if clip:
                p.restore()

    def paint_place_extras(self, p, f, t):
        """Leashes, birds in the air, rain / snow over the open-air parts of a place."""
        w = self.world
        for c in w.cats:
            g = w.leashed(c)
            if g is None or not c.visible_on(f) or not g.visible_on(f):
                continue
            gx, gy = g.screen(f)
            top = H.person_top(g.P, g.pose, g.seat) * g.hs
            side = g.view not in ("front", "back")
            hx = gx + (9 * g.facing if side else 11)
            hy = gy - top * (0.42 if g.seat <= 0 else 0.6)
            cx, cy = c.screen(f)
            ox, oy_ = c.head_offset()
            PA.draw_leash(p, QPointF(hx, hy), QPointF(cx + ox * 0.75, cy + oy_ * 0.72), t)
        for cr in w.critters:
            if cr["f"] == f and (cr.get("z", 0) >= 12 or cr["k"] in ("hawk", "firefly", "butterfly", "dragonfly")):
                PA.draw_critter(p, cr, t)
        wx = w.weather()
        if wx in ("rain", "snow"):
            d = PA.PLACES[f]
            region = QPainterPath()
            for rk in d["open"]:
                label, x0, y0, x1, y1, st = d["rooms"][rk]
                region = region.united(H.room_volume(x0, y0 - H.ENTRY_D, x1, y1, H.WALL_H + 40))
            PA.draw_weather_in(p, t, wx, region)

    def paint_battle_hud(self, p):
        bt = self.world.battle
        self.battle_rects = {}
        if bt is None or self.edit:
            return
        if not (self.mode == "one" and self.view == bt.f) and not (self.mode == "all" and False):
            # not looking at it: a reminder to go and watch
            text = "⚔ %s 对战中 · 点这里去看" % bt.arena["name"]
            p.setFont(self.small)
            fm = QFontMetricsF(self.small)
            w = fm.horizontalAdvance(text) + 28
            r = QRectF(self.canvas_w() - w - 16 * U, self.canvas_h() - 44 * U, w, 28 * U)
            p.setPen(QPen(QColor("#c9443a"), 1.6))
            p.setBrush(QColor(255, 236, 220, 240))
            p.drawRoundedRect(r, r.height() / 2, r.height() / 2)
            p.setPen(QColor("#8a2e24"))
            p.drawText(r, Qt.AlignCenter, text)
            self.battle_rects = {"watch": r}
            return
        me = self.my_agent()
        card = getattr(self, "battle_card", False)
        ready = self.local_pid in getattr(bt, "ready", ())
        now = time.monotonic()

        def draw(q):
            return AA.draw_battle_hud(q, bt, self.canvas_w(), self.canvas_h(), self.font, self.small,
                                      me.uid if me is not None else None, U, now, card=card, ready=ready)
        bn = getattr(bt, "banner", None)
        if bt.phase != "fight" or getattr(bt, "cutin", None) is not None or (bn and bn.get("until", 0) > bt.t):
            self._hud_cache = None
            self.battle_rects = draw(p)
            return
        # mid-fight the bars and numbers are repainted ~12 times a second, not every frame (40 fps fights)
        dpr = self.devicePixelRatioF()
        key = (self.width(), self.height(), self.k, dpr, card, ready, me.uid if me is not None else None)
        c = getattr(self, "_hud_cache", None)
        if c is None or c[0] != key or now - c[1] > 0.08:
            pm = QPixmap(max(1, int(self.width() * dpr)), max(1, int(self.height() * dpr)))
            pm.setDevicePixelRatio(dpr)
            pm.fill(Qt.transparent)
            q = QPainter(pm)
            q.setRenderHint(QPainter.Antialiasing)
            q.setRenderHint(QPainter.SmoothPixmapTransform)
            q.scale(self.k, self.k)
            rects = draw(q)
            q.end()
            c = self._hud_cache = (key, now, pm, rects)
        self.battle_rects = c[3]
        p.save()
        p.resetTransform()
        p.drawPixmap(QPointF(0, 0), c[2])
        p.restore()

    def start_battle_cmd(self, kw, pid, again=False):
        """kw: f, teams [[uid, team]], me (uid the sender plays, or None), mode, diff, kos."""
        w = self.world
        try:
            f = int(kw.get("f"))
            teams = [(str(r[0]), int(r[1]), (str(r[2]) if len(r) > 2 and r[2] is not None else "?"))
                     for r in kw.get("teams") or []]
        except (TypeError, ValueError):
            return
        if f not in AA.ARENAS or len(teams) < 1:
            return
        mode = kw.get("mode") if kw.get("mode") in ("1v1", "2v2", "ffa", "train", "coop") else "1v1"
        if mode == "train" and (not kw.get("me") or len(teams) != 2):
            return
        diff = kw.get("diff") if kw.get("diff") in HB.DIFFS else "normal"
        lo, hi = HG.GAMES.get(AA.ARENAS[f].get("game", "melee"), {}).get("kos", (1, 5))[:2]
        kos = max(lo, min(hi, int(kw.get("kos") or HB.KO_TO_WIN)))
        teams = [(u, tm, pal) for u, tm, pal in teams
                 if w.agent_by_uid(u) is not None and not u.startswith(("v:", "n:"))][:4]
        ctrls = {}
        mine = kw.get("me")
        bt = w.battle
        if again and bt is not None:
            pass
        # whoever controls a fighter now keeps it; the sender takes the one they chose
        for u, tm, _pal in teams:
            a = w.agent_by_uid(u)
            if a.ctrl not in (None, "ai"):
                ctrls[u] = a.ctrl
        if mine and any(r[0] == mine for r in teams):
            a = w.agent_by_uid(mine)
            if a.ctrl in (None, "ai", pid):
                w.play.control(pid, mine)
                ctrls[mine] = pid
        cfg = dict(f=f, teams=[[u, tm, pal] for u, tm, pal in teams], me=mine, mode=mode, diff=diff, kos=kos)
        if not w.start_battle(f, teams, ctrls, mode, diff, kos):
            self.flash("现在开不了对战")
            return
        w.battle.cfg = cfg
        if pid == self.local_pid or any(c == self.local_pid for c in ctrls.values()):
            self.set_mode("one", f)

    def paint_map(self, p, oy, hour, t):
        key = ("map", self.width(), H.season(), int(hour))
        pm = self.bg_cache.get(key)
        if pm is None:
            for k in [k for k in self.bg_cache if k[0] == "map"]:
                del self.bg_cache[k]
            pm = self._panel_pixmap(key, lambda q: HM.draw_map(q, H.PANEL_W, H.PANEL_H, hour, H.season()))
        p.save()
        p.translate(0, oy)
        self.blit(p, pm, 0, oy)
        HM.draw_map_live(p, self.world, t, getattr(self, "map_hover", None), self.font)
        p.restore()

    def open_map(self):
        self.follow_uid = None
        if self.mode == "one" and self.view == HM.MAP_F:
            self.set_mode("one", 2)
            return
        self.set_mode("one", HM.MAP_F)

    def map_click(self, lx, ly, gpos):
        n = HM.node_at(lx, ly)
        if n is None:
            return False
        self.node_menu(n, gpos)
        return True

    def node_menu(self, n, gpos):
        app = self.app
        w = self.world
        m = app.styled_menu()
        if n == HM.HOME:
            app.add(m, "🏠 家", lambda: None, enabled=False)
            app.add(m, "回家看看", lambda: self.set_mode("all"))
            out = w.out_people()
            if out:
                app.add(m, "叫外面的家人都回家", lambda: [self.hcmd("outing_home", f=pf) for pf in PA.PLACES])
        elif n in AA.ARENAS:
            d = AA.ARENAS[n]
            gm = HG.GAMES[d.get("game", "melee")]
            app.add(m, "%s %s · %s %s" % (d["icon"], d["name"], gm["icon"], gm["name"]), lambda: None, enabled=False)
            app.add(m, d["desc"], lambda: None, enabled=False)
            app.add(m, "去看看", lambda: self.set_mode("one", n))
            bt = w.battle
            if bt is not None and bt.f == n:
                app.add(m, "观看对战", lambda: self.set_mode("one", n))
            app.add(m, "⚔ 开始对战…", lambda: self.battle_dialog(n))
            app.add(m, "🎓 新手训练（一步步教你怎么打）", lambda: self.battle_dialog(n, "train"))
        else:
            d = PA.PLACES[n]
            app.add(m, "%s %s" % (d["icon"], d["name"]), lambda: None, enabled=False)
            app.add(m, "去看看", lambda: self.set_mode("one", n))
            app.add(m, "全家一起去", lambda: self.hcmd("outing", f=n, all=True))
            sm = app.styled_menu("让谁去…", m)
            for a in w.people:
                if a.away or a.f == n or a.ctrl not in (None, self.local_pid):
                    continue
                where = "（在%s）" % PA.PLACES[a.f]["name"] if a.f in PA.PLACES else ""
                app.add(sm, a.name + where, lambda a=a: self.hcmd("outing", f=n, uids=[a.uid]))
            for c in w.cats:
                if c.f == n or c.ctrl not in (None, self.local_pid):
                    continue
                app.add(sm, "带%s去（家人牵着）" % c.name, lambda c=c: self.hcmd("outing", f=n, cats=[c.uid]))
            m.addMenu(sm)
            if w.family_at(n):
                app.add(m, "叫这里的家人回家", lambda: self.hcmd("outing_home", f=n))
        m.exec(gpos)

    def battle_dialog(self, f=None, mode=None):
        from .house_battle_ui import BattleDialog
        dlg = BattleDialog(self, self.world, f, mode)
        if dlg.exec():
            cfg = dlg.config()
            self.hcmd("battle", **cfg)
            self.follow_uid = None
            self.set_mode("one", cfg["f"])

    def paint_out_chips(self, p):
        """Who is out (and where): small chips at the bottom; click one to look."""
        rows = self.world.where_text()
        self.chip_rects = []
        if not rows:
            return
        p.setFont(self.small)
        fm = QFontMetricsF(self.small)
        x = 16 * U
        y = self.canvas_h() - (82 if self.my_agent() is not None else 44) * U
        for pf, text in rows:
            if self.mode == "one" and self.view == pf:
                continue
            w = fm.horizontalAdvance(text) + 26
            r = QRectF(x, y, w, 28 * U)
            PA.draw_travel_chip(p, r, text, self.small)
            self.chip_rects.append((pf, r))
            x += w + 8

    def bubble_floor(self, a):
        """The storey whose panel shows an agent's speech (agents on the stairs show on both)."""
        if a.stairs_u is not None and self.mode == "all":
            return 1 if a.stairs_u > 0.5 else 0
        return None

    def paint_overlays(self, p, f, oy):
        if f == HM.MAP_F:
            return
        p.save()
        p.translate(self.panel_ox(f), oy)
        c = self.cam_for(f)
        if c is not None:
            p.setClipRect(QRectF(-2, -2, H.PANEL_W + 4, H.PANEL_H + 4))
            self.cam_apply(p, c)
        play = self.world.play
        now = time.monotonic()
        for s in play.shots:
            if s["f"] == f:
                sx, sy = H.iso(s["x"], s["y"], s["z"])
                HP.draw_shot(p, sx, sy, s["kind"], s.get("spin", 0))
        g = play.game
        if g and g.get("kind") == "steal" and g.get("plate"):
            pf, px, py, pz, n = g["plate"]
            if pf == f:
                cx, cy = H.iso(px, py, pz)
                p.setPen(QPen(QColor("#b9b2a6"), 1.0))
                p.setBrush(QColor("#ffffff"))
                p.drawEllipse(QPointF(cx, cy), 15, 5.5)
                for i in range(int(n)):
                    HP.draw_fish_treat(p, cx - 9 + (i % 3) * 9, cy - 2 - (i // 3) * 4, 0.0, 0.55, False)
            df, dx_, dy_ = g["den"]
            if df == f:
                cx, cy = H.iso(dx_, dy_, 0)
                p.setPen(QPen(QColor(240, 160, 32, 200), 1.6, Qt.DashLine))
                p.setBrush(QColor(255, 210, 120, 50))
                p.drawEllipse(QPointF(cx, cy), 30, 12)
                p.setPen(QColor("#b06a10"))
                p.setFont(self.small)
                p.drawText(QRectF(cx - 30, cy - 9, 60, 18), Qt.AlignCenter, "🐾 猫窝")
            for uid, has in (g.get("carry") or {}).items():
                c = self.world.agent_by_uid(uid)
                if has and c is not None and c.visible_on(f):
                    sx, sy = c.screen(f)
                    ox, oy_ = c.head_offset()
                    HP.draw_fish_treat(p, sx + ox * 1.25, sy + oy_ + 13, 0.0, 0.6, False)
        for d in self.world.drops:
            if d["f"] == f and not (d.get("rest") and d["z"] < 1):     # (those on the floor are in the scene)
                self.paint_drop(p, d)
        if f == 2 and self.app.cfg["house"].get("leaves", True):
            H.draw_falling(p, H.season(), time.monotonic(),
                           [(it.x, it.y) for it in self.world.items if it.f == 2 and it.type == "tree"])
        # speech bubbles: gather them first, then stack the ones that would overlap
        bubbles = []
        for a in self.world.agents():
            if not a.visible_on(f) or not a.bubble:
                continue
            bf = self.bubble_floor(a)
            if bf is not None and bf != f:
                continue
            sx, sy = a.screen(f)
            ox, oy_ = a.head_offset()
            b = a.bubble
            fade = clamp((b["until"] - now) / 0.25, 0, 1)
            bubbles.append({"key": a.uid, "x": sx + ox, "y": sy + oy_ - 6, "text": b["text"], "font": self.font,
                            "fade": fade, "w": 170 * U, "t0": b.get("t0", 0.0)})
        tags = []
        for name, px, py, sc in self.plush_screen(f):
            b = self.world.plush_bubbles.get(name)
            if b:
                fade = clamp((b["until"] - now) / 0.25, 0, 1)
                bubbles.append({"key": "plush:" + name, "x": px, "y": py - 30 * sc - 4, "text": b["text"],
                                "font": self.small, "fade": fade, "w": 150 * U, "t0": b.get("t0", 0.0)})
            elif self.hover_toy == name and not self.edit:
                tags.append((name, px, py - 30 * sc - 4))
        placed = []
        for bb in sorted(bubbles, key=lambda bb: (-bb["y"], bb["t0"])):
            r = H.bubble_rect(bb["text"], bb["x"], bb["y"], bb["font"], bb["w"])
            best = None
            for shift in (0.0, -r.width() * 0.5, r.width() * 0.5, -r.width() * 0.9, r.width() * 0.9):
                lift = 0.0
                for _ in range(10):
                    cand = r.translated(shift, -lift).adjusted(-3, -2, 3, 2)
                    hit = next((q for q in placed if cand.intersects(q)), None)
                    if hit is None:
                        break
                    lift += (r.bottom() - lift) - hit.top() + 4
                cost = lift + abs(shift) * 0.7
                if best is None or cost < best[0]:
                    best = (cost, shift, lift)
            _, bb["shift"], bb["lift"] = best
            bb["rect"] = r.translated(bb["shift"], -bb["lift"])
            placed.append(bb["rect"])
        by_key = {bb["key"]: bb for bb in bubbles}
        for a in self.world.agents():
            if a.ctrl is None or not a.visible_on(f):
                continue
            bf = self.bubble_floor(a)
            if bf is not None and bf != f:
                continue
            sx, sy = a.screen(f)
            ox, oy_ = a.head_offset()
            label = play.name_of(a.ctrl, self.local_pid)
            col = HP.PLAYER_COLORS.get(a.ctrl, "#8a8a96") if a.ctrl != self.local_pid else "#f0a020"
            top = sy + oy_ - 8
            bb = by_key.get(a.uid)
            if bb is not None:
                top = min(top - 34, bb["rect"].top() - 4)
            HP.draw_marker(p, sx + ox, top, col, label, self.mark_font)
            if a.uid in play.hearts:
                HP.draw_hearts(p, sx + ox - 22, top - 32 * U, play.hearts[a.uid], s=4.2)
        for a in self.world.agents():
            if not a.visible_on(f):
                continue
            bf = self.bubble_floor(a)
            if bf is not None and bf != f:
                continue
            sx, sy = a.screen(f)
            ox, oy_ = a.head_offset()
            for pt in a.particles:
                draw_particle(p, dict(pt, x=sx + ox + pt["dx"], y=sy + oy_ + pt["dy"]), self.font)
            th = getattr(a, "think", None)
            if th and th[1] > now and self.app.cfg["house"].get("bubbles", True) and not a.bubble:
                fade = clamp((th[1] - now) / 0.4, 0, 1) * clamp((now - (th[1] - 3.2)) / 0.3, 0, 1)
                HC.draw_think(p, sx + ox + 6 * a.facing, sy + oy_ - 8, th[0], fade)
        style = self.app.bubble_style()
        for bb in sorted(bubbles, key=lambda bb: bb["rect"].top()):
            H.draw_bubble(p, bb["text"], bb["x"], bb["y"], bb["font"], bb["fade"], style, bb["w"], lift=bb["lift"],
                          shift=bb["shift"])
        for name, x, y in tags:
            H.draw_name_tag(p, name, x, y, self.small)
        self.paint_stair_hint(p, f)
        self.paint_hop_marks(p, f)
        p.restore()

    def hop_marks(self):
        """(v26) For the cat you control, once it stands still: where Space goes, and the levels Space + W / S
        reach."""
        me = self.my_agent()
        now = time.monotonic()
        if me is None or not me.is_cat or me.stairs_u is not None or me.traveling is not None or \
                self.world.battle is not None or me.state in ("held", "fall", "carried") or me.path or \
                any(k in self.MOVE_KEYS for k in self.keys):
            self._still_t = now
            return None
        if getattr(self, "_still_t", None) is None:
            self._still_t = now
        if now - self._still_t < 0.6:
            return None
        d = getattr(self, "last_dir", (0, 0)) or (0, 0)
        cache = getattr(self, "_hop_marks", None)
        key = (me.uid, me.f, round(me.x), round(me.y), round(me.h), me.facing, d)
        if cache is not None and (cache[0] == key or now - cache[1] < 0.5):
            return cache[2] if cache[0] == key else None
        pl = self.world.play
        try:
            if d != (0, 0):
                n = math.hypot(*d)
                ux, uy = d[0] / n, d[1] / n
            elif self.aim is not None and now - getattr(self, "aim_t", 0.0) < 1.5 and self.aim[0] == me.f and \
                    math.hypot(self.aim[1] - me.x, self.aim[2] - me.y) > 4:
                ux, uy = self.aim[1] - me.x, self.aim[2] - me.y
                n = math.hypot(ux, uy)
                ux, uy = ux / n, uy / n
            else:
                ux, uy = float(me.facing), 0.0
            main = pl.leap_target(me, ux, uy)
            up = pl.level_hop(me, True)
            down = pl.level_hop(me, False) if me.h > 0.5 else None
        except Exception:
            return None
        out = {"f": me.f, "main": main if main is not None and main[0] != "floor" else None,
               "up": up[2] if up else None, "down": down[2] if down else None}
        self._hop_marks = (key, now, out)
        return out

    def paint_hop_marks(self, p, f):
        """Quiet hints: a thin ring where Space lands, a small ↑ / ↓ on the levels above and below."""
        hm = self.hop_marks()
        if hm is None or hm["f"] != f:
            return
        main = hm["main"]
        p.save()
        p.setBrush(Qt.NoBrush)
        if main is not None:
            sx, sy = H.iso(main[2]["x"], main[2]["y"], main[2]["h"])
            p.setPen(QPen(QColor(255, 255, 255, 150), 1.2))
            p.drawEllipse(QPointF(sx, sy), 10, 4)
        p.setFont(self.mark_font)
        for kind, glyph in (("up", "↑"), ("down", "↓")):
            sp = hm[kind]
            if sp is None or (main is not None and sp is main[2]):
                continue
            sx, sy = H.iso(sp["x"], sp["y"], sp["h"])
            p.setPen(QColor(255, 255, 255, 170))
            p.drawText(QRectF(sx - 8, sy - 14, 16, 14), Qt.AlignCenter, glyph)
        p.restore()

    def paint_stair_hint(self, p, f):
        """(v24) Next to the stairs with a character you control: which key takes them."""
        me = self.my_agent()
        if me is None or me.f != f or f not in (0, 1) or me.stairs_u is not None or me.traveling is not None:
            return
        mx, my = H.STAIR_BOTTOM if f == 0 else H.STAIR_TOP
        if math.hypot(me.x - mx, me.y - my) > 110:
            return
        text = "↑ 按 W 上楼" if f == 0 else "↓ 按 S 下楼"
        sx, sy = H.iso(mx, my, 0)
        p.setFont(self.small)
        fm = QFontMetricsF(self.small)
        w = fm.horizontalAdvance(text) + 18
        r = QRectF(sx - w / 2, sy - 30, w, 20)
        p.setPen(QPen(QColor("#c4862c"), 1.2))
        p.setBrush(QColor(255, 248, 230, 235))
        p.drawRoundedRect(r, 10, 10)
        p.setPen(QColor("#6b4a35"))
        p.drawText(r, Qt.AlignCenter, text)

    # ---- (v26) the picture around the storeys: sky, roof, the beam between the storeys, the ground -------------
    def paint_backdrop(self, p, hour):
        cw, ch = self.canvas_w(), self.canvas_h()
        top, bot = H.sky_colors(hour)
        cream = QColor("#fbf1e1")
        g = QLinearGradient(0, TOOLBAR_H, 0, ch)
        g.setColorAt(0, H.mix(top, cream, 0.45))
        g.setColorAt(1, H.mix(bot, cream, 0.45))
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawRoundedRect(QRectF(0, 0, cw, ch), 12 * U, 12 * U)
        f = None if self.mode == "all" else self.view
        if f is not None and f not in (0, 1, 2):
            return                                       # places & arenas & the map bring their own
        t1 = self.top0()
        wall_y = TOOLBAR_H + ROOF_H                      # where the back walls start
        hox = self.house_ox()
        hx0, hx1 = hox + H.OX - H.SIDE_T, hox + H.OX + H.PW + H.SIDE_T
        if f in (None, 1):
            self.paint_roof(p, TOOLBAR_H, wall_y)
        elif f == 0:
            # 二楼 above: a strip of its outside wall and its floor slab
            r = QRectF(hx0, TOOLBAR_H, hx1 - hx0, ROOF_H - 22)
            p.setBrush(H.vgrad(r, "#f4e4c8", "#ead6b2"))
            p.drawRect(r)
            self.paint_slab(p, hx0, hx1, wall_y - 22, wall_y)
        bottom = t1 + (self.stride() if f is None else 0.0) + H.OY + 16.0
        x0, x1 = 0.0, cw
        if f is None:
            if self.garden_left():
                x0 = self.garden_rot()[4]
            else:
                x1 = self.garden_x()
        if f == 1:
            # 一楼 below: its outside wall
            r = QRectF(hx0, bottom, hx1 - hx0, ch - bottom)
            p.setBrush(H.vgrad(r, "#ead6b2", "#f4e4c8"))
            p.drawRect(r)
            p.setBrush(QColor(60, 40, 20, 40))
            p.drawRect(QRectF(hx0, bottom, hx1 - hx0, 6))
        else:
            r = QRectF(x0, bottom, x1 - x0, ch - bottom)
            path = QPainterPath()
            path.addRoundedRect(QRectF(0, bottom - 14 * U, cw, ch - bottom + 14 * U), 12 * U, 12 * U)
            clip = QPainterPath()
            clip.addRect(r)
            g = QLinearGradient(0, bottom, 0, ch)
            g.setColorAt(0, QColor("#9fc879"))
            g.setColorAt(0.25, QColor("#8dba68"))
            g.setColorAt(1, QColor("#7aa65a"))
            p.setBrush(g)
            p.drawPath(path.intersected(clip))
            p.setPen(QPen(QColor(70, 110, 50, 120), 1.2))
            p.drawLine(QPointF(x0, bottom + 0.5), QPointF(x1, bottom + 0.5))
        if H.is_dark(hour):                              # the roof, the ground... dim at night too
            path = QPainterPath()
            path.addRoundedRect(QRectF(0, 0, cw, ch), 12 * U, 12 * U)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(16, 22, 58, 80))
            p.drawPath(path)

    def paint_roof(self, p, y0, y1):
        """The eaves above the top storey: red tiles and a wooden fascia."""
        hox = self.house_ox()
        x0, x1 = hox + H.OX - H.SIDE_T - 18, hox + H.OX + H.PW + H.SIDE_T + 18
        fy = y1 - 9
        path = QPainterPath(QPointF(x0 + 34, y0 + 3))
        path.lineTo(x1 - 34, y0 + 3)
        path.lineTo(x1, fy)
        path.lineTo(x0, fy)
        path.closeSubpath()
        p.setPen(H.pen("#7a3326", 1.2))
        p.setBrush(H.vgrad(path.boundingRect(), "#d0654d", "#a9483a"))
        p.drawPath(path)
        p.save()
        p.setClipPath(path)
        p.setPen(QPen(QColor(120, 40, 30, 130), 1))
        p.setBrush(Qt.NoBrush)
        row = 0
        yy = y0 + 4
        while yy < fy:
            x = x0 + (7 if row % 2 else 0)
            while x < x1:
                p.drawArc(QRectF(x, yy, 14, 11), 180 * 16, 180 * 16)
                x += 14
            yy += 9
            row += 1
        p.restore()
        p.setPen(QPen(QColor(255, 255, 255, 80), 1.4))
        p.drawLine(QPointF(x0 + 36, y0 + 4.5), QPointF(x1 - 36, y0 + 4.5))
        r = QRectF(x0, fy, x1 - x0, 9)
        p.setPen(H.pen("#5e3b26", 1.0))
        p.setBrush(H.vgrad(r, "#9a6a46", "#7a5034"))
        p.drawRect(r)

    def paint_slab(self, p, x0, x1, y0, y1):
        r = QRectF(x0, y0, x1 - x0, y1 - y0)
        p.setPen(H.pen("#6e4a30", 1.0))
        p.setBrush(H.vgrad(r, "#b98657", "#8f633f"))
        p.drawRect(r)
        p.setPen(QPen(QColor(255, 255, 255, 60), 1))
        p.drawLine(QPointF(x0, y0 + 1.5), QPointF(x1, y0 + 1.5))

    def paint_beam(self, p):
        """All view: the beam between 二楼's slab and 一楼's back walls (painted before 二楼)."""
        y0 = self.top0() + H.OY + 16.0
        hox = self.house_ox()
        self.paint_slab(p, hox + H.OX - H.SIDE_T, hox + H.OX + H.PW + H.SIDE_T, y0 - 2, y0 + SLAB_X)

    def tag_spots(self):
        """All view: where each storey's name sits (on the roof, on the beam, at the top of the garden)."""
        t1 = self.top0()
        hx = self.house_ox() + H.OX + 6
        return [(1, hx, TOOLBAR_H + ROOF_H / 2 - 4), (0, hx, t1 + H.OY + 15.0),
                (2, self.garden_x() + 12, TOOLBAR_H + 22.0)]

    def paint_tags(self, p):
        """All view: a name tag for each storey (click one to look at just that storey), with a 💡 beside it
        that turns all the lights of that storey on / off (one-storey views: the 💡 under the toolbar)."""
        self.tag_rects = []
        self.bulb_rects = []
        if self.mode != "all":
            if self.view in (0, 1) and not self.edit:
                self.paint_bulb(p, self.view, QRectF(H.OX + 6, TOOLBAR_H + 6 * U, 30 * U, 24 * U), label=True)
            return
        p.setFont(self.tag_font)
        fm = QFontMetricsF(self.tag_font)
        for f, x, cy in self.tag_spots():
            n = sum(1 for c in self.world.cats if c.f == f and c.stairs_u is None)
            text = H.FLOOR_NAMES[f] + (" " + "🐾" * n if n else "")
            w = fm.horizontalAdvance(text) + 22
            h = 24 * U
            r = QRectF(x, cy - h / 2, w, h)
            hov = getattr(self, "hover_btn", None) == ("tag", f)
            p.setPen(QPen(QColor(107, 74, 58, 200), 1.3))
            p.setBrush(QColor(255, 226, 170, 245) if f == self.focus_f or hov else QColor(255, 250, 240, 240))
            p.drawRoundedRect(r, h / 2, h / 2)
            p.setPen(QColor("#6b4a3a"))
            p.drawText(r, Qt.AlignCenter, text)
            self.tag_rects.append((f, r))
            if f in (0, 1):
                self.paint_bulb(p, f, QRectF(r.right() + 6, r.top(), 30 * U, h))

    def paint_bulb(self, p, f, r, label=False):
        """The storey's 'all lights' button: 💡 lit when every room is lit, half when some are."""
        state = self.world.floor_lights(f)
        hov = getattr(self, "hover_btn", None) == ("bulb", f)
        text = "💡"
        fm = QFontMetricsF(self.small)
        if label:
            text = "💡 全部关灯" if state == "all" else "💡 全部开灯"
            r = QRectF(r.left(), r.top(), fm.horizontalAdvance(text) + 22, r.height())
        p.save()
        p.setFont(self.small)
        p.setPen(QPen(QColor(107, 74, 58, 200), 1.2))
        fill = {"all": QColor(255, 214, 110, 245), "some": QColor(255, 236, 190, 240),
                "none": QColor(235, 228, 216, 235)}[state]
        p.setBrush(fill.lighter(106) if hov else fill)
        p.drawRoundedRect(r, r.height() / 2, r.height() / 2)
        if state == "none" and not label:
            p.setOpacity(0.55)
        p.setPen(QColor("#6b4a3a"))
        p.drawText(r, Qt.AlignCenter, text)
        p.restore()
        self.bulb_rects.append((f, r))

    def hole_above(self):
        """Region above the stairwell opening (so people coming up are visible from the waist up)."""
        s = H.STAIR
        top = H.iso(0, s["y1"], 400)[1]
        bot = H.iso(0, s["y0"], 0)[1]
        path = QPainterPath()
        path.addRect(QRectF(H.OX + s["x0"] - 30, top, s["x1"] - s["x0"] + 60, bot - top))
        return path

    def plush_screen(self, f):
        """[(name, x, y, scale)] of the toys visible on storey f (panel coordinates, bottom centre)."""
        w = self.world
        out = []
        castle = w.primary_castle()
        if castle is not None and castle.f == f and castle.rot not in (2, 3):
            for name, px, py, sc in H.plush_positions(castle):
                if w.plush[name]["at"] == "castle":
                    out.append((name, px, py, sc))
        for name in PLUSH_NAMES:
            pl = w.plush[name]
            if pl["at"] in ("item", "floor"):
                where = w.plush_where(name)
                if where is not None and where[0] == f:
                    sx, sy = H.iso(where[1], where[2], where[3])
                    out.append((name, sx, sy, 1.0))
            elif pl["at"] == "held":
                a = w.agent_by_uid(pl["by"])
                hp = getattr(a, "held_pos", {}).get(f) if a is not None else None
                if hp is not None and a.visible_on(f):
                    out.append((name, hp[0], hp[1], 0.8))
        return out

    def plush_at(self, f, x, y):
        for name, px, py, sc in reversed(self.plush_screen(f)):
            if QRectF(px - 14 * sc, py - 32 * sc, 28 * sc, 34 * sc).contains(QPointF(x, y)):
                return name
        return None

    def paint_edit_mark(self, p, it):
        if not self.edit or (it is not self.hover_item and it is not self.drag_item and it is not self.placing):
            return
        x0, y0, x1, y1 = it.fp()
        p.setPen(QPen(QColor(238, 150, 70, 230), 2.4, Qt.DashLine))
        p.setBrush(QColor(255, 200, 120, 60))
        p.drawRect(H.frect(x0, y0, x1, y1, 0.5))
        sx, sy = H.iso(it.x, it.y, it.cat["h"] + 10)
        p.setFont(self.small)
        p.setPen(QColor("#7a4b35"))
        p.drawText(QRectF(sx - 100, sy - 30, 200, 26), Qt.AlignCenter, it.cat["name"])

    def paint_shadow(self, p, a, w):
        if a.stairs_u is not None:
            return
        sx, sy = H.iso(a.x, a.y, 0 if a.h < 1 or a.path else a.h)
        g = QRadialGradient(QPointF(sx, sy), w)
        g.setColorAt(0, QColor(0, 0, 0, 60))
        g.setColorAt(1, QColor(0, 0, 0, 0))
        p.save()
        p.translate(sx, sy)
        p.scale(1, 0.4)
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawEllipse(QPointF(0, 0), w, w)
        p.restore()

    # ---- fighting animation: transform, flash, after-images ------------------------------------
    def fanim_apply(self, p, a):
        tr = getattr(a, "fanim", None)
        if not tr:
            return None
        if tr.get("dx") or tr.get("dy"):
            p.translate(tr.get("dx", 0.0), tr.get("dy", 0.0))
        if tr.get("rot"):
            pz = tr.get("pz", 0.0)
            p.translate(0, -pz)
            p.rotate(tr["rot"])
            p.translate(0, pz)
        if tr.get("sx", 1.0) != 1.0 or tr.get("sy", 1.0) != 1.0:
            p.scale(tr.get("sx", 1.0), tr.get("sy", 1.0))
        if tr.get("op", 1.0) < 1.0:
            p.setOpacity(p.opacity() * tr["op"])
        return tr

    def tint_draw(self, p, draw, box, color, alpha):
        """Draw something (in the painter's current coordinates, inside box) filled flat with one colour."""
        from PySide6.QtGui import QImage, QTransform
        tr = p.worldTransform()
        dr = tr.mapRect(box).toAlignedRect().adjusted(-2, -2, 2, 2)
        if dr.width() <= 0 or dr.height() <= 0 or dr.width() > 2000 or dr.height() > 2000:
            return
        img = QImage(dr.size(), QImage.Format_ARGB32_Premultiplied)
        img.fill(0)
        q = QPainter(img)
        q.setRenderHint(QPainter.Antialiasing)
        q.setTransform(tr * QTransform.fromTranslate(-dr.x(), -dr.y()))
        draw(q)
        q.resetTransform()
        q.setCompositionMode(QPainter.CompositionMode_SourceIn)
        col = QColor(color)
        col.setAlphaF(max(0.0, min(1.0, alpha)))
        q.fillRect(img.rect(), col)
        q.end()
        p.save()
        p.resetTransform()
        p.drawImage(dr.topLeft(), img)
        p.restore()

    def ghost_spots(self, a, sx, sy):
        """Where the after-images go: the fighter's last few screen positions (recorded as it is painted)."""
        trail = getattr(a, "_trail", None)
        if trail is None:
            trail = a._trail = []
        now = time.monotonic()
        trail.append((now, sx, sy))
        del trail[:-14]
        tr = getattr(a, "fanim", None) or {}
        n = int(tr.get("gh", 0))
        out = []
        if n <= 0:
            return out
        for k, back in enumerate((0.045, 0.09, 0.14)[:n]):
            old = next(((x, y) for (t0, x, y) in reversed(trail) if now - t0 >= back), None)
            if old is not None and math.hypot(old[0] - sx, old[1] - sy) > 6:
                out.append((old[0], old[1], 0.42 - 0.12 * k))
        return list(reversed(out))

    def fighter_color(self, a):
        bt = self.world.battle
        if bt is None:
            return "#ffffff"
        fi = next((x for x in bt.fighters if x.a is a), None)
        return HG.CHARS.get(getattr(fi, "char", None), {}).get("color", "#ffffff") if fi is not None else "#ffffff"

    def screen_facing_rot(self, a):
        """(v26) In the turned garden the screen's left / right is the world's y: face the way it moves there."""
        if H.ROT is None:
            return None
        mx_, my_ = getattr(a, "motion", (0.0, 0.0)) or (0.0, 0.0)
        du = H.ROT[1] * my_
        if abs(du) > 0.05:
            a._rot_face = 1 if du > 0 else -1
        return getattr(a, "_rot_face", a.facing)

    def paint_cat(self, p, c, dt, f, oy):
        rf = self.screen_facing_rot(c)
        if rf is not None:
            keep = c.facing
            c.facing = rf
            try:
                return self._paint_cat(p, c, dt, f, oy)
            finally:
                c.facing = keep
        return self._paint_cat(p, c, dt, f, oy)

    def _paint_cat(self, p, c, dt, f, oy):
        sx, sy = c.screen(f)
        if c.state != "held":
            self.paint_shadow(p, c, 22)
        q = c.build_q(dt)

        def body(pp, x, y, tint=None):
            pp.save()
            pp.translate(x, y)
            self.fanim_apply(pp, c)
            pp.scale(CS, CS)
            if c.state == "held":
                pp.translate(0, 30)
                pp.rotate(c.swing)
            pp.translate(0, -88)
            if c.facing < 0:
                pp.scale(-1, 1)
            pp.translate(-75, 0)
            if tint is None:
                self.cached_body(pp, c, QRectF(-30, -40, 210, 150), lambda qq: draw_cat(qq, q, c.kind), c.pose)
            else:
                self.tint_draw(pp, lambda qq: draw_cat(qq, q, c.kind), QRectF(-30, -40, 210, 150), tint[0], tint[1])
            pp.restore()

        tr = getattr(c, "fanim", None)
        if tr:
            col = self.fighter_color(c)
            for gx_, gy_, al in self.ghost_spots(c, sx, sy):
                body(p, gx_, gy_, (col, al))
        body(p, sx, sy)
        if tr and tr.get("fl", 0) > 0:
            body(p, sx, sy, ("#ffffff", 0.85 * tr["fl"]))
        c.hits[f] = QRectF(sx - 32, oy + sy - 46, 64, 52)

    def cached_body(self, pp, owner, box, draw, sig=None):
        """While a fight paints at 40 fps, a character's drawing is refreshed ~22 times a second and blitted in
        between (moving it is still smooth: only the pose updates less often)."""
        if not getattr(self, "_fast", False):
            draw(pp)
            return
        tr = pp.worldTransform()
        sc = max(abs(tr.m11()) + abs(tr.m21()), abs(tr.m22()) + abs(tr.m12()))
        sc = round(sc * 4) / 4.0
        cache = self.__dict__.setdefault("_pcache", {})
        now = time.monotonic()
        hit = cache.get(id(owner))
        if hit is None or now - hit[0] > 0.044 or hit[1] != sc or hit[2] != sig:
            pm = QPixmap(max(1, int(box.width() * sc) + 2), max(1, int(box.height() * sc) + 2))
            pm.fill(Qt.transparent)
            q = QPainter(pm)
            q.setRenderHint(QPainter.Antialiasing)
            q.scale(sc, sc)
            q.translate(-box.left(), -box.top())
            draw(q)
            q.end()
            hit = cache[id(owner)] = (now, sc, sig, pm)
            if len(cache) > 40:
                cache.clear()
        pm = hit[3]
        pp.drawPixmap(QRectF(box.left(), box.top(), pm.width() / sc, pm.height() / sc), pm,
                      QRectF(0, 0, pm.width(), pm.height()))

    def paint_person(self, p, pr, f, oy):
        rf = self.screen_facing_rot(pr)
        if rf is not None:
            keep = pr.facing
            pr.facing = rf
            try:
                return self._paint_person(p, pr, f, oy)
            finally:
                pr.facing = keep
        return self._paint_person(p, pr, f, oy)

    def _paint_person(self, p, pr, f, oy):
        sx, sy = pr.screen(f)
        if pr.act == "swing" and pr.spot is not None:
            it = self.world.item_by_id(pr.spot[0])
            if it is not None:
                a = math.radians(24 * it.state.get("swing", 0.0) * math.sin(self.world.t * 2.4))
                sx += math.sin(a) * 64
                sy -= 64 - math.cos(a) * 64
        if pr.pose != "sleep" and pr.h < 1:
            self.paint_shadow(p, pr, 20 if pr.role == "adult" else 16)
        now = time.monotonic()
        if now > pr.next_blink:
            pr.blink_until = now + 0.14
            pr.next_blink = now + random.uniform(2.5, 6)
        talk = bool(pr.bubble) and now - pr.bubble["t0"] < 1.2 and int((now - pr.bubble["t0"]) * 7) % 2 == 0
        carry = self.world.carried_by(pr)
        if not hasattr(pr, "held_pos"):
            pr.held_pos = {}
        pr.held_pos.pop(f, None)
        if pr.pose == "sleep":
            dx, dy = pr.sleep_dir
            bx, by = H.iso(pr.x + dx * 50, pr.y + dy * 50, pr.h)
            H.draw_sleeper(p, pr.P, sx, sy, bx, by, pr.P.get("_blanket", "#e7a5a0"))
            if carry is not None:
                kind, col = PLUSH_KIND[carry]
                px, py = sx + (18 if bx >= sx else -18), sy + 6
                H.draw_plush(p, kind, px, py, 0.8, col)
                pr.held_pos[f] = (px, py)
            pr.hits[f] = QRectF(sx - 22, oy + sy - 34, 44, 40)
            return
        base = p.worldTransform()
        p.save()
        p.translate(sx, sy)
        view = pr.view if pr.view in ("front", "back") else "side"
        lean = getattr(pr, "lean", None)
        if lean and lean[1] > self.world.t and pr.seat > 0:
            k = clamp(min(self.world.t - lean[2], lean[1] - self.world.t) / 0.8, 0.0, 1.0)
            p.rotate(lean[0] * 8 * k)
        if pr.facing < 0 and view == "side":
            p.scale(-1, 1)
        cat = self.world.held_cat(pr)
        held = None
        prop = pr.prop
        if cat is not None:
            lap = pr.hold.get("mode") == "lap"
            if not lap:
                prop = "hug"

            def held(pp, ax, ay, cat=cat, lap=lap):
                self.paint_held_cat(pp, cat, ax, ay, view, lap, base, f, oy)
        elif carry is not None:
            kind, col = PLUSH_KIND[carry]
            if pr.seat <= 0 and pr.pose not in ("floor",):
                prop = "hug"

            def held(pp, ax, ay, kind=kind, col=col):
                H.draw_plush(pp, kind, ax, ay + 6, 0.78, col)
                pt = base.inverted()[0].map(pp.worldTransform().map(QPointF(ax, ay + 6)))
                pr.held_pos[f] = (pt.x(), pt.y())
        rig = getattr(pr, "rig", None) if pr.pose == "rig" else None
        tr = getattr(pr, "fanim", None)
        if tr:
            # fighting: after-images, the move's transform, a white flash when hit
            p.restore()
            col = self.fighter_color(pr)

            def body(pp, x, y, tint=None, view=view, prop=prop):
                pp.save()
                pp.translate(x, y)
                self.fanim_apply(pp, pr)
                if pr.facing < 0 and view == "side":
                    pp.scale(-1, 1)
                draw = (lambda qq: H.draw_person(qq, pr.P, pr.pose, pr.t, prop=prop, seat=pr.seat,
                                                 blink=now < pr.blink_until, view=view, talk=talk, rig=rig))
                if tint is None:
                    self.cached_body(pp, pr, QRectF(-70, -150, 140, 165), draw, (pr.pose, view))
                else:
                    self.tint_draw(pp, draw, QRectF(-70, -150, 140, 165), tint[0], tint[1])
                pp.restore()

            for gx_, gy_, al in self.ghost_spots(pr, sx, sy):
                body(p, gx_, gy_, (col, al))
            body(p, sx, sy)
            if tr.get("fl", 0) > 0:
                body(p, sx, sy, ("#ffffff", 0.85 * tr["fl"]))
            p.save()
        else:
            H.draw_person(p, pr.P, pr.pose, pr.t, prop=prop, seat=pr.seat,
                          blink=now < pr.blink_until, view=view, talk=talk, held=held, rig=rig)
        p.restore()
        if (pr.f == 2 or PA.room_open(pr.f, pr.x, pr.y)) and pr.stairs_u is None and pr.seat <= 0 and not tr:
            wx = self.world.weather()
            top = H.person_top(pr.P, pr.pose, pr.seat) * pr.hs
            if wx in ("snow", "cold") and pr.pose in ("stand", "walk", "run", "wave", "reach", "crouch", "pet"):
                d = H.person_dims(pr.role)
                neck = (d["leg"] + d["torso"]) * pr.hs if pr.pose not in ("crouch", "pet") else \
                    (d["leg"] * 0.55 + d["torso"]) * pr.hs
                H.draw_scarf(p, sx + (2 * pr.facing if view == "side" else 0), sy - neck + 2,
                             d["sw"] * 0.62 * pr.hs, "#d9534f" if pr.role == "adult" else "#5e9bd6",
                             pr.t, pr.facing if view == "side" else 1)
            if wx == "rain":
                col = QColor(pr.P.get("shirt", "#5e9bd6")).lighter(115).name()
                H.draw_umbrella(p, sx + (6 * pr.facing if view == "side" else 8), sy - top - 10, col, pr.t,
                                24 * pr.hs if pr.role == "adult" else 19)
        hgt = H.person_top(pr.P, pr.pose, pr.seat) * pr.hs
        pr.hits[f] = QRectF(sx - 20, oy + sy - hgt, 40, hgt + 4)

    def paint_held_cat(self, p, c, ax, ay, view, lap, base, f, oy):
        """A cat in someone's arms or on their lap, drawn between the body and the arms."""
        q = c.build_q(0.05)
        p.save()
        p.translate(ax, ay + (2 if lap else 5))
        p.scale(CS * 0.96, CS * 0.96)
        p.translate(0, -88)
        flip = view != "side" and c.facing < 0
        if flip:
            p.scale(-1, 1)
        p.translate(-75 if not lap else -70, 0)
        draw_cat(p, q, c.kind)
        p.restore()
        tl = base.inverted()[0].map(p.worldTransform().map(QPointF(ax, ay)))
        c.hits[f] = QRectF(tl.x() - 26, oy + tl.y() - 34, 52, 40)

    def paint_chrome(self, p):
        """The toolbar: drawn once into a picture and reused until something on it changes."""
        cats = tuple(sum(1 for c in self.world.cats if c.f == f and c.stairs_u is None) for f in (0, 1, 2))
        key = (self.width(), self.height(), self.devicePixelRatioF(), self.mode, self.view, self.edit,
               self.play_label(), self.places_label(), self.my_agent() is not None, cats,
               bool(self.hover_item or self.drag_item or self.placing), getattr(self, "hover_btn", None))
        c = getattr(self, "_chrome_cache", None)
        if c is None or c[0] != key:
            dpr = self.devicePixelRatioF()
            pm = QPixmap(max(1, int(self.width() * dpr)), max(1, int(self.height() * dpr)))
            pm.setDevicePixelRatio(dpr)
            pm.fill(Qt.transparent)
            q = QPainter(pm)
            q.setRenderHint(QPainter.Antialiasing)
            q.scale(self.k, self.k)
            self._paint_chrome_raw(q)
            q.end()
            c = self._chrome_cache = (key, pm)
        p.save()
        p.resetTransform()
        pm = c[1]
        dpr = pm.devicePixelRatio() or 1.0
        k = self.k
        band = min(pm.height(), int((TOOLBAR_H + (34 * U if self.edit else 2)) * k * dpr) + 2)
        p.drawPixmap(QRectF(0, 0, pm.width() / dpr, band / dpr), pm, QRectF(0, 0, pm.width(), band))
        g = self.grip_rect().adjusted(-2, -2, 2, 2)
        src = QRectF(g.left() * k * dpr, g.top() * k * dpr, g.width() * k * dpr, g.height() * k * dpr)
        p.drawPixmap(QRectF(src.left() / dpr, src.top() / dpr, src.width() / dpr, src.height() / dpr), pm, src)
        p.restore()

    def _paint_chrome_raw(self, p):
        cw = self.canvas_w()
        # the bar itself, joined to the house below
        bar = QPainterPath()
        bar.addRoundedRect(QRectF(0, 0, cw, TOOLBAR_H + 14 * U), 12 * U, 12 * U)
        cut = QPainterPath()
        cut.addRect(QRectF(0, 0, cw, TOOLBAR_H))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#fff7ea"))
        p.drawPath(bar.intersected(cut))
        p.setPen(QPen(QColor("#d9bf9c"), 1.2))
        p.drawLine(QPointF(0, TOOLBAR_H - 0.6), QPointF(cw, TOOLBAR_H - 0.6))
        f = QFont(self.small)
        f.setBold(True)
        p.setFont(f)
        labels = {"all": "全部", "floor1": "二楼", "floor0": "一楼", "floor2": "户外", "play": self.play_label(),
                  "edit": "✓ 装修中" if self.edit else "✎ 装修", "home": "⌂ 回桌面", "add": "＋ 添加家具",
                  "rotate": "⟳ 旋转", "reset": "↺ 默认布局", "places": self.places_label()}
        rects = self.button_rects()
        hov = getattr(self, "hover_btn", None)
        accent, ink, line = QColor("#ef9440"), QColor("#5e4436"), QColor("#c9a77f")
        # the views: one segmented switch
        seg = [rects[k] for k in self.SEG_KEYS]
        box = QRectF(seg[0].left(), seg[0].top(), seg[-1].right() - seg[0].left(), seg[0].height())
        p.setPen(QPen(line, 1.3))
        p.setBrush(QColor("#f3e4cc"))
        p.drawRoundedRect(box, box.height() / 2, box.height() / 2)
        for key, r in rects.items():
            if key == "all":
                active = self.mode == "all"
            elif key.startswith("floor"):
                active = self.mode == "one" and self.view == int(key[-1])
            elif key == "places":
                active = self.mode == "one" and (self.view in PA.PLACES or self.view == HM.MAP_F)
            else:
                active = (key == "edit" and self.edit) or (key == "play" and self.my_agent() is not None)
            inner = r.adjusted(3, 3, -3, -3) if key in self.SEG_KEYS else r
            rad = inner.height() / 2
            if active:
                p.setPen(QPen(accent.darker(120), 1.2))
                p.setBrush(accent)
                p.drawRoundedRect(inner, rad, rad)
            elif key in self.SEG_KEYS:
                if hov == key:
                    p.setPen(Qt.NoPen)
                    p.setBrush(QColor(255, 255, 255, 210))
                    p.drawRoundedRect(inner, rad, rad)
            else:
                p.setPen(QPen(line, 1.3))
                p.setBrush(QColor("#ffe7c2") if hov == key else QColor("#fffdf8"))
                p.drawRoundedRect(inner, rad, rad)
            text = labels[key]
            if key.startswith("floor"):
                n = sum(1 for c in self.world.cats if c.f == int(key[-1]) and c.stairs_u is None)
                if n:
                    text += " " + "🐾" * n
            col = QColor("#ffffff") if active else ink
            if key == "rotate" and not (self.hover_item or self.drag_item or self.placing):
                col = QColor(107, 74, 58, 120)
            p.setPen(col)
            p.drawText(inner, Qt.AlignCenter, text)
        g = self.grip_rect()
        p.setPen(QPen(QColor(110, 80, 60, 170), 2.4))
        for i in range(3):
            o = (8 + i * 8) * U
            p.drawLine(QPointF(g.right() - o, g.bottom() - 3), QPointF(g.right() - 3, g.bottom() - o))
        if self.edit:
            p.setFont(self.small)
            text = "拖动家具摆放（可以拖到别的楼层）· 右键家具：旋转 / 删除 / 搬到另一层 · 选中后按 R 旋转"
            fm = QFontMetricsF(self.small)
            w = fm.horizontalAdvance(text) + 24
            r = QRectF((cw - w) / 2, TOOLBAR_H + 4 * U, w, 24 * U)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(255, 248, 236, 230))
            p.drawRoundedRect(r, r.height() / 2, r.height() / 2)
            p.setPen(QColor("#5e4436"))
            p.drawText(r, Qt.AlignCenter, text)

    # ---- hit testing ---------------------------------------------------------------------------
    def agent_at(self, f, x, y):
        """Cat or person under the canvas point (x, y) on storey f."""
        x -= self.panel_ox(f)
        if self.cam_for(f) is not None:
            oy = self.panel_top(f) or 0.0
            lx, ly = self.uncam(f, x, y - oy)
            x, y = lx, ly + oy
        best = None
        for a in self.world.agents():
            if not a.visible_on(f):
                continue
            r = a.hits.get(f)
            if r is not None and r.contains(QPointF(x, y)):
                wx, wy, wz = a.world_pos(f)
                if best is None or wy < best[0]:
                    best = (wy, a)
        return best[1] if best else None

    def item_at(self, f, x, y, types=None):
        """Furniture under the panel point (x, y) of storey f (only of the given types, if any)."""
        best = None
        for it in self.world.items:
            if it.f != f or (types is not None and it.type not in types):
                continue
            x0, y0, x1, y1 = it.fp()
            h = it.cat["h"]
            top = H.iso(0, y1, h)[1]
            bot = H.iso(0, y0, 0)[1]
            if QRectF(H.OX + x0, top, x1 - x0, bot - top).contains(QPointF(x, y)):
                flat = bool(it.cat.get("flat"))
                d = it.y + (100000 if flat else 0)
                if best is None or d < best[0]:
                    best = (d, it)
        return best[1] if best else None

    # ---- mouse ----------------------------------------------------------------------------------
    def mousePressEvent(self, e):
        self.last_touch = time.monotonic()
        x, y = self.canvas(e.position())
        if e.button() == Qt.RightButton:
            return
        for key, r in self.button_rects().items():
            if r.contains(QPointF(x, y)):
                self.on_button(key)
                return
        if self.world.play.dark and y > TOOLBAR_H:
            return                                 # 躲猫猫: no peeking while it's dark
        for pf, r in getattr(self, "chip_rects", []):
            if r.contains(QPointF(x, y)):
                self.follow_uid = None
                self.set_mode("one", pf)
                return
        for bf, r in getattr(self, "bulb_rects", []):
            if r.contains(QPointF(x, y)):
                self.hcmd("floor_lights", f=bf)
                self.bg_cache = {k: v for k, v in self.bg_cache.items() if k[0] != "bg"}
                self.update()
                return
        for tf, r in getattr(self, "tag_rects", []):
            if r.contains(QPointF(x, y)) and self.mode == "all":
                self.set_mode("one", tf)
                return
        for key, r in (getattr(self, "battle_rects", None) or {}).items():
            if r.contains(QPointF(x, y)):
                if key == "watch" and self.world.battle is not None:
                    self.set_mode("one", self.world.battle.f)
                elif key == "again":
                    self.hcmd("battle_again")
                elif key == "home":
                    self.hcmd("battle_end")
                return
        cr = getattr(self, "cam_rect", None)
        if cr is not None and cr.contains(QPointF(x, y)):
            self.unzoom()
            return
        if self.mode == "one" and self.view == HM.MAP_F:
            f_, lx_, ly_ = self.locate(x, y)
            self.map_click(lx_, ly_, e.globalPosition().toPoint())
            return
        if self.grip_rect().contains(QPointF(x, y)):
            self.press = {"kind": "resize", "gx": e.globalPosition().x(), "w0": self.width()}
            return
        f, lx, ly = self.locate(x, y)
        self.focus_f = f
        if self.placing is not None:
            self.finish_drag_item()
            return
        if self.edit:
            it = self.item_at(f, lx, ly)
            if it is not None:
                wx, wy = H.from_screen(lx, ly)
                self.drag_item = it
                self.hover_item = it
                self.press = {"kind": "item", "dx": it.x - wx, "dy": it.y - wy}
                if not self.is_client():
                    self.world.item_changed(it)
                return
        me = self.my_agent()
        if not self.edit:
            hc = self.hidden_cat_at(f, lx, ly)
            if hc is not None:
                self.hide_guesses = {}
                self.hide_hint = None
                self.hcmd("found_cat", uid=hc.uid)
                return
            self.wrong_guess(f, lx, ly, x, y)
        if not self.edit and self.agent_at(f, x, y) is None and self.plush_at(f, lx, ly) is None:
            hit = self.clickable_at(f, lx, ly)
            if hit is not None:
                kind, obj = hit
                by = me.uid if me is not None and not me.is_cat else None
                if kind == "gift":
                    self.hcmd("gift", id=obj["id"], by=by)
                    return
                if me is None or not me.is_cat:
                    if kind == "tv":
                        self.hcmd("tv", item=obj.id, op="toggle", by=by)
                        return
                    if kind == "lamp":
                        self.hcmd("lamp", item=obj.id)
                        return
                    if kind == "switch":
                        self.hcmd("room_light", f=obj[0], room=obj[1])
                        return
                    if kind == "curtain":
                        self.hcmd("curtain", f=obj[0], room=obj[1])
                        return
                if me is None:
                    if kind == "bowls":
                        self.hcmd("feed_all")
                        return
                    if kind == "appliance":
                        self.hcmd("appliance", item=obj.id)
                        return
        if me is not None and not self.edit:
            self.activateWindow()
            self.setFocus()
            a = self.agent_at(f, x, y)
            if a is not None and a is not me:
                self.press = {"kind": "agent", "a": a, "x": x, "y": y, "drag": False, "play": True}
                return
            toy = self.plush_at(f, lx, ly)
            if toy is not None:
                if not me.is_cat and self.world.plush[toy]["at"] != "held":
                    self.pcmd("pick", name=toy)
                else:
                    self.hcmd("plush", name=toy, mode="user")
                return
            if a is None:
                it = self.item_at(f, lx, ly)
                carrying = not me.is_cat and self.world.carried_by(me) is not None
                if it is not None and carrying and (self.world.free_surfaces(it) or it is self.world.primary_castle()):
                    self.pcmd("put", item=it.id)
                    return
                if it is not None and not me.is_cat and getattr(me, "hold", None) is not None and \
                        any(sp["who"] == "cat" for _, sp in it.spots()):
                    self.pcmd("put", item=it.id)
                    return
                if it is not None and not it.cat.get("flat") and self.usable(me, it):
                    if me.is_cat:
                        # (v26) the level / end of the furniture that was clicked (it hops there, via others)
                        best = None
                        for idx, sp in it.spots():
                            if sp["who"] != "cat":
                                continue
                            sx, sy = H.iso(sp["x"], sp["y"], sp["h"])
                            d = math.hypot(sx - lx, sy - ly)
                            if best is None or d < best[0]:
                                best = (d, idx)
                        if best is not None:
                            self.pcmd("use", item=it.id, spot=best[1])
                            return
                    self.pcmd("use", item=it.id)
                    return
                wx, wy = H.from_screen(lx, ly)
                if H.inside(f, wx, wy) and self.world.nav[f].nearest(wx, wy, 3) is not None:
                    self.goto_fx = (f, wx, wy, time.monotonic())
                    self.pcmd("goto", f=f, x=round(wx, 1), y=round(wy, 1))
                    return
        a = self.agent_at(f, x, y)
        if a is not None:
            self.press = {"kind": "agent", "a": a, "x": x, "y": y, "drag": False}
            return
        toy = self.plush_at(f, lx, ly)
        if toy is not None and not self.edit:
            self.hcmd("plush", name=toy, mode="user")
            return
        self.press = {"kind": "move", "gx": e.globalPosition().x(), "gy": e.globalPosition().y(),
                      "wx": self.x(), "wy": self.y()}
        try:
            if self.windowHandle() is not None and self.windowHandle().startSystemMove():
                self.press = None
        except Exception:
            pass

    def hiding_place(self, c):
        """The item a hiding cat is tucked into (or None)."""
        if c.state != "hiding" or not c.is_cat:
            return None
        key = c.spot or tuple(c.data.get("hideaway") or ()) or None
        return self.world.item_by_id(key[0]) if key else None

    def hidden_cat_at(self, f, lx, ly):
        """A cat hiding in the furniture under the click (panel point lx, ly)."""
        for c in self.world.cats:
            it = self.hiding_place(c)
            if it is None or it.f != f or c.f != f:
                continue
            x0, y0, x1, y1 = it.fp()
            top = H.iso(0, y1, it.cat["h"])[1] - 12
            bot = H.iso(0, y0, 0)[1] + 8
            if H.OX + x0 - 10 <= lx <= H.OX + x1 + 10 and top <= ly <= bot:
                return c
        return None

    def wrong_guess(self, f, lx, ly, x, y):
        """(v27) 躲猫猫: clicked a piece of furniture a cat could hide in, but it isn't there -- warm / cold, and
        after every third miss the real hiding place gives itself away a little more for a moment."""
        hiders = [c for c in self.world.cats if (getattr(c, "hide_game", False) or self.is_client())
                  and self.hiding_place(c) is not None]
        if not hiders or self.world.play.dark is not None:
            return
        it = self.item_at(f, lx, ly)
        if it is None or not any(sp.get("kind") == "hideaway" for _, sp in it.spots()):
            return
        c = hiders[0]
        place = self.hiding_place(c)
        if it is place:
            return
        near = place.f == it.f and H.room_at(it.f, it.x, it.y) is not None and \
            H.room_at(it.f, it.x, it.y) == H.room_at(place.f, place.x, place.y)
        g = getattr(self, "hide_guesses", None) or {}
        n = g.get(c.uid, 0) + 1
        self.hide_guesses = {c.uid: n}
        text = "在附近了！" if near else "好像不在这边…"
        if n % 3 == 0:
            self.hide_hint = (c.uid, time.monotonic() + 3.5)
            text += "（咦，好像有点动静）"
        self.guess_fx = (x, y, text, time.monotonic())
        self.update()

    def paint_guess(self, p):
        g = getattr(self, "guess_fx", None)
        if g is None:
            return
        x, y, text, t0 = g
        age = time.monotonic() - t0
        if age > 1.8:
            self.guess_fx = None
            return
        a = min(1.0, (1.8 - age) / 0.5)
        p.save()
        p.setFont(self.small)
        fm = QFontMetricsF(self.small)
        w = fm.horizontalAdvance(text) + 16
        r = QRectF(x - w / 2, y - 34 * U - age * 10, w, 22 * U)
        p.setOpacity(a)
        p.setPen(QPen(QColor("#d9b99b"), 1))
        p.setBrush(QColor(255, 250, 240, 235))
        p.drawRoundedRect(r, r.height() / 2, r.height() / 2)
        p.setPen(QColor("#6b4a3a"))
        p.drawText(r, Qt.AlignCenter, text)
        p.restore()

    def paint_tell(self, p, c, it, key, style, t):
        """(v27) The little bit of a hiding cat that always shows: a tail tip, a tuft of fur or two ear tips -- small,
        half see-through, easy to miss unless you look (much clearer for a moment after a few wrong guesses)."""
        from PySide6.QtGui import QPolygonF
        kind, side = c.hide_tell(key, style)
        hint = getattr(self, "hide_hint", None)
        strong = hint is not None and hint[0] == c.uid and time.monotonic() < hint[1]
        x0, y0, x1, y1 = it.fp()
        reach = max(3.0, min(10.0, (x1 - x0) / 2 - 4))
        col = QColor("#8a6a4c" if getattr(c.src, "kind", "") == "tabby" else "#e39a4f")
        sc = 1.7 if strong else 1.0
        p.save()
        p.setOpacity(1.0 if strong else 0.55)
        twitch = 1.3 * math.sin(t * 1.4) * max(0.0, math.sin(t * 0.37 + len(c.uid)))
        if style == "top":
            sx, sy = H.iso(c.x + side * reach * 0.6, y1 - 6, it.cat["h"] + 0.5)
        elif style == "door":
            sx, sy = H.iso(c.x + side * reach * 0.7, y0, 1)
        else:
            sx, sy = H.iso(c.x + side * reach, y0 - 1, 1)
        if kind == "ears":
            p.setPen(Qt.NoPen)
            p.setBrush(col)
            for d in (-1, 1):
                p.drawPolygon(QPolygonF([QPointF(sx + d * 1.5 * sc, sy + 1), QPointF(sx + d * 3.6 * sc, sy - 2.8 * sc),
                                         QPointF(sx + d * 5.4 * sc, sy + 1)]))
        elif kind == "fur":
            p.setPen(QPen(col, 1.5 * sc, Qt.SolidLine, Qt.RoundCap))
            for i, d in enumerate((-2.4, 0.0, 2.4)):
                p.drawLine(QPointF(sx + d * sc, sy + 0.5), QPointF(sx + (d + side * 1.0) * sc, sy - (2.4 + (i == 1)) * sc))
        else:
            path = QPainterPath(QPointF(sx, sy))
            if style == "top":
                path.quadTo(QPointF(sx + side * 3 * sc, sy - 1), QPointF(sx + side * 4 * sc, sy - (4 + twitch) * sc))
            else:
                path.quadTo(QPointF(sx + side * 5 * sc, sy + 1.2), QPointF(sx + side * 8 * sc, sy - (2 + twitch) * sc))
            p.setPen(QPen(col, 2.5 * sc, Qt.SolidLine, Qt.RoundCap))
            p.setBrush(Qt.NoBrush)
            p.drawPath(path)
        p.restore()

    def paint_peeks(self, p, f, t):
        """Hidden cats give themselves away: a little tell all the time, and now and then a tail, ears, a pair of
        eyes or a paw."""
        from PySide6.QtGui import QPolygonF
        for c in self.world.cats:
            it = self.hiding_place(c)
            if it is None or it.f != f:
                continue
            key = c.spot or tuple(c.data.get("hideaway") or ())
            sp = it.spot(key[1]) if key else None
            style = (sp or {}).get("peek", "front")
            if self.world.play.dark is None:
                self.paint_tell(p, c, it, key, style, t)
            kind, k = c.peek(t)
            hint = getattr(self, "hide_hint", None)
            if kind is None and hint is not None and hint[0] == c.uid and time.monotonic() < hint[1]:
                kind, k = "tail", min(1.0, (hint[1] - time.monotonic()) / 0.6, (time.monotonic() - hint[1] + 3.5) / 0.6)
            if kind is None:
                continue
            x0, y0, x1, y1 = it.fp()
            col = QColor("#9b7b5a" if getattr(c.src, "kind", "") == "tabby" else "#e8a256")
            p.save()
            p.setOpacity(min(1.0, k * 1.6))
            if style == "top":
                sx, sy = H.iso(c.x, y1 - 6, it.cat["h"] + 1)
            elif style == "door":
                sx, sy = H.iso(c.x, y0, it.cat["h"] * 0.45)
                # the door left ajar: a dark gap
                p.setPen(Qt.NoPen)
                p.setBrush(QColor(40, 28, 20, 200))
                p.drawRoundedRect(QRectF(sx - 9, sy - 12, 18, 24), 3, 3)
            else:
                sx, sy = H.iso(c.x, y0 - 2, 2)
            if kind == "eyes" or (style == "door" and kind in ("ears", "paw")):
                p.setPen(Qt.NoPen)
                for d in (-1, 1):
                    p.setBrush(QColor("#ffe27a"))
                    p.drawEllipse(QPointF(sx + d * 4.5, sy - 2), 3.2, 2.4 * max(0.3, k))
                    p.setBrush(QColor("#2a2420"))
                    p.drawEllipse(QPointF(sx + d * 4.5, sy - 2), 1.0, 2.0 * max(0.3, k))
            elif kind == "ears":
                p.setPen(QPen(col.darker(150), 1.0))
                p.setBrush(col)
                rise = 10 * k
                for d in (-1, 1):
                    p.drawPolygon(QPolygonF([QPointF(sx + d * 3, sy + 2), QPointF(sx + d * 9, sy - rise),
                                             QPointF(sx + d * 13, sy + 2)]))
            elif kind == "paw":
                p.setPen(QPen(col.darker(150), 1.0))
                p.setBrush(col)
                p.drawEllipse(QPointF(sx, sy - 3 * k), 6, 4.5)
                p.setBrush(QColor("#f7c6c6"))
                for d in (-1, 0, 1):
                    p.drawEllipse(QPointF(sx + d * 3, sy - 3 * k - 1), 1.2, 1.2)
            else:
                wag = math.sin(t * 9) * 7
                path = QPainterPath(QPointF(sx, sy))
                path.cubicTo(QPointF(sx + 8, sy - 10 * k), QPointF(sx - 6 + wag, sy - 18 * k),
                             QPointF(sx + 3 + wag, sy - 26 * k))
                p.setPen(QPen(col.darker(115), 5, Qt.SolidLine, Qt.RoundCap))
                p.setBrush(Qt.NoBrush)
                p.drawPath(path)
            p.restore()

    CLICK_TYPES = {"tv": "tv", "lamp": "lamp", "garden_lamp": "lamp", "bowls": "bowls", "washer": "appliance",
                   "stove": "appliance", "fridge": "appliance"}

    def clickable_at(self, f, lx, ly):
        """(kind, object) of something you can click at panel point (lx, ly): a gift, a TV, a lamp, a window..."""
        for d in self.world.drops:
            if d.get("kind") == "gift" and d["f"] == f:
                sx, sy = H.iso(d["x"], d["y"], 0)
                if abs(sx - lx) < 12 and -14 < sy - ly < 8:
                    return "gift", d
        it = self.item_at(f, lx, ly, self.CLICK_TYPES)
        if it is not None:
            return self.CLICK_TYPES[it.type], it
        if f in (0, 1):
            for room in self.world.light_rooms(f):
                if H.switch_rect(f, room).adjusted(-5, -5, 5, 5).contains(QPointF(lx, ly)):
                    return "switch", (f, room)
            for side, a, b in H.FLOORS[f]["windows"]:
                if side == "S" and H.window_rect(a, b).adjusted(-14, -8, 14, 10).contains(QPointF(lx, ly)):
                    room = H.room_of_wall_point(f, (a + b) / 2, H.PD - 1)
                    if room:
                        return "curtain", (f, room)
        return None

    CLICK_TIPS = {"switch": "点击开关这间的灯", "gift": "点一下收下礼物", "tv": "点击开关电视（右键换台）", "lamp": "点击开关灯",
                  "curtain": "点击拉开 / 拉上窗帘", "bowls": "点击添粮（右键选猫粮）", "appliance": "点击叫家人来用"}

    def mouseDoubleClickEvent(self, e):
        if e.button() != Qt.LeftButton or self.edit:
            return
        x, y = self.canvas(e.position())
        f, lx, ly = self.locate(x, y)
        a = self.agent_at(f, x, y)
        if a is not None and a is not self.my_agent():
            self.pcmd("ctrl", uid=a.uid)
            self.activateWindow()
            self.setFocus()
            return
        if a is None:
            if getattr(self, "cam", None) is not None and self.cam.get("kind") == "room":
                self.unzoom()
            elif y > TOOLBAR_H:
                self.zoom_room(f, lx, ly)

    def mouseMoveEvent(self, e):
        x, y = self.canvas(e.position())
        f, lx, ly = self.locate(x, y)
        self.aim = (f,) + H.from_screen(lx, ly)
        self.aim_t = time.monotonic()
        self.mouse_canvas = (x, y)
        pr = self.press
        hb = None
        if pr is None:
            hb = next((k for k, r in self.button_rects().items() if r.contains(QPointF(x, y))), None)
            if hb is None:
                hb = next((("tag", tf) for tf, r in getattr(self, "tag_rects", []) if r.contains(QPointF(x, y))), None)
            if hb is None:
                hb = next((("bulb", bf) for bf, r in getattr(self, "bulb_rects", []) if r.contains(QPointF(x, y))),
                          None)
        if hb != getattr(self, "hover_btn", None):
            self.hover_btn = hb
            self.update()
        if self.mode == "one" and self.view == HM.MAP_F:
            n = HM.node_at(lx, ly)
            if n != getattr(self, "map_hover", None):
                self.map_hover = n
                self.update()
            self.setCursor(Qt.PointingHandCursor if n is not None else Qt.ArrowCursor)
            return
        if pr is None and not self.edit and self.placing is None:
            a = self.agent_at(f, x, y)
            if a is not getattr(self, "hover_agent", None):
                self.hover_agent = a
                self.hover_agent_t = time.monotonic()
            hc = None if a is not None else self.clickable_at(f, lx, ly)
            key = None if hc is None else (hc[0], id(hc[1]) if not isinstance(hc[1], tuple) else hc[1])
            if key != getattr(self, "hover_click_key", None):
                self.hover_click_key = key
                self.hover_click = (f, hc) if hc else None
                self.update()
            me = self.my_agent()
            hand = a is not None or self.plush_at(f, lx, ly) is not None or \
                (hc is not None and not (me is not None and me.is_cat and hc[0] != "gift"))
            if hand != getattr(self, "hand_cursor", False):
                self.hand_cursor = hand
                if hand:
                    self.setCursor(Qt.PointingHandCursor)
                else:
                    self.unsetCursor()
        if self.placing is not None:
            self.move_item_to(self.placing, *H.from_screen(lx, ly), f=f)
            self.update()
            return
        if pr is None:
            if self.edit:
                it = self.item_at(f, lx, ly)
                if it is not self.hover_item:
                    self.hover_item = it
                    self.update()
            else:
                toy = self.plush_at(f, lx, ly)
                if toy != self.hover_toy:
                    self.hover_toy = toy
                    self.update()
            on_btn = hb is not None
            if self.grip_rect().contains(QPointF(x, y)):
                self.setCursor(Qt.SizeFDiagCursor)
            elif on_btn or (self.edit and self.hover_item is not None) or self.agent_at(f, x, y) is not None or \
                    (not self.edit and self.hover_toy is not None):
                self.setCursor(Qt.PointingHandCursor)
            else:
                self.unsetCursor()
            return
        if pr["kind"] == "resize":
            w = pr["w0"] + (e.globalPosition().x() - pr["gx"])
            if abs(w - self.width()) >= 4:
                self.apply_size(w)
        elif pr["kind"] == "item":
            wx, wy = H.from_screen(lx, ly)
            self.move_item_to(self.drag_item, wx + pr["dx"], wy + pr["dy"], f=f)
            self.update()
        elif pr["kind"] == "agent":
            a = pr["a"]
            if not pr["drag"] and math.hypot(x - pr["x"], y - pr["y"]) > 6 and a.is_cat and a.stairs_u is None \
                    and not pr.get("play") and a.ctrl in (None, self.local_pid) and not self.is_client():
                pr["drag"] = True
                a.interrupt()
                a.release_spot()
                a.set_state("held", 1e9)
                a.say(a.line("dragged"))
            if pr["drag"]:
                wx, wy = H.from_screen(lx, ly + 40, 0)
                a.f = f
                a.x, a.y = clamp(wx, 4, H.PW - 4), clamp(wy, H.BALCONY[2], H.PD - 4)
                a.h = 40.0
        elif pr["kind"] == "move":
            dx = e.globalPosition().x() - pr["gx"]
            dy = e.globalPosition().y() - pr["gy"]
            self.move(int(pr["wx"] + dx), int(pr["wy"] + dy))

    def mouseReleaseEvent(self, e):
        pr, self.press = self.press, None
        if e.button() == Qt.RightButton:
            self.context_menu(e)
            return
        if pr is None:
            self.save_geom()
            return
        x, y = self.canvas(e.position())
        if pr["kind"] == "resize":
            self.save_geom()
        elif pr["kind"] == "item":
            self.finish_drag_item()
        elif pr["kind"] == "agent":
            a = pr["a"]
            if pr["drag"]:
                f, lx, ly = self.locate(x, y)
                if self.is_client():
                    self.hcmd("drop", uid=a.uid, f=f, x=round(lx, 1), y=round(ly, 1))
                else:
                    self.drop_cat(a, f, lx, ly)
            elif pr.get("play"):
                self.pcmd("click", uid=a.uid)
            else:
                self.hcmd("pet", uid=a.uid)
        elif pr["kind"] == "move":
            self.save_geom()

    MOVE_KEYS = {Qt.Key_W: (0, 1), Qt.Key_Up: (0, 1), Qt.Key_S: (0, -1), Qt.Key_Down: (0, -1),
                 Qt.Key_A: (-1, 0), Qt.Key_Left: (-1, 0), Qt.Key_D: (1, 0), Qt.Key_Right: (1, 0)}

    def keyPressEvent(self, e):
        k = e.key()
        self.last_touch = time.monotonic()
        if self.edit:
            if k == Qt.Key_R:
                it = self.drag_item or self.placing or self.hover_item
                if it is not None:
                    self.rotate_item(it)
            elif k == Qt.Key_Escape:
                self.set_edit(False)
            return
        if e.isAutoRepeat():
            return
        if k == Qt.Key_Escape and self.unzoom():
            return
        me = self.my_agent()
        if k in self.MOVE_KEYS:
            self.keys.add(k)
            self.send_dir()
            return
        if k == Qt.Key_H and self.world.battle is not None and me is not None and \
                any(fi.uid == me.uid for fi in self.world.battle.fighters):
            self.battle_card = not getattr(self, "battle_card", False)
            self.update()
            return
        bk = self.battle_key(k, me)
        if bk:
            if self.world.battle.phase == "count" and bk == "atk":
                self.battle_card = False
            self.pcmd("bkey", k=bk, d=1)
            return
        if me is None:
            if k in (Qt.Key_E, Qt.Key_F, Qt.Key_Space, Qt.Key_T):
                self.flash("先选一个角色：右键猫或家人 → 我来控制TA（或双击TA）")
            return
        if k in (Qt.Key_1, Qt.Key_2, Qt.Key_3, Qt.Key_4):
            self.pcmd("emote", e=int(k) - int(Qt.Key_1) + 1)
            return
        if k == Qt.Key_E:
            self.pcmd("use_near")
        elif k == Qt.Key_G:
            self.pcmd("put", floor=True)
        elif k == Qt.Key_F:
            self.pcmd("act", kind="swat" if me.is_cat else "throw", **self.aim_args())
        elif k == Qt.Key_Space:
            self.pcmd("act", kind="pounce" if me.is_cat else "bonk", **self.aim_args())
        elif k == Qt.Key_R:
            self.pcmd("gait")                       # (v26) walk / run
        elif k == Qt.Key_Q:
            self.pcmd("act", kind="meow")
        elif k in (Qt.Key_T, Qt.Key_Return, Qt.Key_Enter):
            self.chat_dialog()
        elif k == Qt.Key_Escape:
            self.pcmd("ctrl", uid=None)

    BATTLE_KEYS = {Qt.Key_J: "atk", Qt.Key_K: "skill", Qt.Key_L: "guard", Qt.Key_Space: "jump", Qt.Key_E: "throw"}

    def battle_key(self, k, me):
        bt = self.world.battle
        if bt is None or me is None or k not in self.BATTLE_KEYS:
            return None
        if bt.phase not in ("fight", "count", "travel") or not any(fi.uid == me.uid for fi in bt.fighters):
            return None
        return self.BATTLE_KEYS[k]

    def keyReleaseEvent(self, e):
        self.last_touch = time.monotonic()
        if e.isAutoRepeat():
            return
        bk = self.battle_key(e.key(), self.my_agent())
        if bk:
            self.pcmd("bkey", k=bk, d=0)
            return
        if e.key() in self.keys:
            self.keys.discard(e.key())
            self.send_dir()

    def focusOutEvent(self, e):
        if self.keys:
            self.keys.clear()
            self.send_dir()
        super().focusOutEvent(e)

    def drop_cat(self, c, f, x, y):
        best = None
        for key, sp in c.free_spots(("perch", "sleep", "watch", "hide", "eat", "scratch")):
            if sp["f"] != f:
                continue
            sx, sy = H.iso(sp["x"], sp["y"], sp["h"])
            d = math.hypot(sx - x, sy - (y + 20))
            if d < 40 and (best is None or d < best[0]):
                best = (d, key, sp)
        if best is not None:
            _, key, sp = best
            c.claim(key)
            c.f, c.x, c.y, c.h = f, sp["x"], sp["y"], sp["h"]
            c.set_state("rest", random.uniform(8, 20), pose="sit")
            c.landed = 0.25
            return
        c.f = f
        nav = self.world.nav[f]
        cell = nav.nearest(c.x, c.y, 14)
        if cell is not None:
            c.x, c.y = nav.center(*cell)
        c.set_state("fall", 3, vh=0.0)

    def click_agent(self, a):
        if a.uid.startswith("v:"):
            rec = (self.app.cfg["house"].get("visitors_book") or {}).get(a.kind, {})
            if rec.get("fed", 0) >= 2 and a.state in ("idle", "rest"):
                a.set_state("petted", 3.0, style="lean")
                a.spawn("heart", 1)
            elif a.state in ("idle", "rest") and not a.data.get("waiting"):
                a.say("（往后缩了缩）", 1.4)
                a.hop(random.choice((-1, 1)) * 40, random.uniform(-10, 10), lift=8,
                      then=lambda: a.set_state("rest", 4, pose="sit"))
            return
        if a.is_cat:
            if a.state == "present" and a.data.get("reason") == "todo":
                self.app.todo_show(a.data.get("tid"))
            if a.state == "rest" and a.data.get("pose") == "sleep":
                a.set_state("rest", 3.0, pose="grumpy_wake")
                a.say(a.line("wake"))
                return
            if a.state in ("idle", "rest", "present") and not a.path:
                style = self.world.pet_style(a)
                if style == "refuse" and a.state == "present":
                    style = "lean"
                a.set_state("petted", 3.5, style=style,
                            trap=random.uniform(1.8, 2.6) if style == "belly" and random.random() < 0.3 else None)
            a.spawn("heart", 2)
            a.chat("pet", 0.7)
            a.src.stats["mood"] = min(100.0, a.src.stats["mood"] + 5)
            if random.random() < 0.3:
                self.app.add_aff(a.src, 1)
            if random.random() < 0.4:
                self.app.play_sound("purr", a.src)
        else:
            if a.act == "sleep":
                a.say("Zzz……")
                return
            a.say(a.line("click_kid" if a.role == "kid" else "click_adult"))
            if a.state == "idle" or (a.state == "act" and a.act == "wander"):
                a.pose = "wave"
                if a.view == "back":
                    a.view = "front"

    # ---- edit mode -------------------------------------------------------------------------------
    def move_item_to(self, it, x, y, f=None):
        c = it.cat
        w, d = (c["d"], c["w"]) if it.rot % 2 else (c["w"], c["d"])
        if f is None:
            f = it.f
        it.f = f
        x = round(x / 2) * 2
        y = round(y / 2) * 2
        ymin = d / 2 + 1
        bx0, bx1, by0 = H.BALCONY
        if f == 1 and bx0 + w / 2 <= x <= bx1 - w / 2:
            ymin = by0 + d / 2
        it.x = clamp(x, w / 2 + 1, H.PW - w / 2 - 1)
        it.y = clamp(y, ymin, H.PD - d / 2 - 1)
        s = H.STAIR
        if f in (0, 1) and it.x + w / 2 > s["x0"] - 4 and it.x - w / 2 < s["x1"] + 4 and it.y + d / 2 > s["y0"] - 4 and \
                it.y - d / 2 < s["y1"] + 4 and not c.get("flat"):
            if abs(it.x - s["x0"]) < abs(it.y - s["y1"]):
                it.x = s["x0"] - 4 - w / 2
            else:
                it.y = s["y1"] + 4 + d / 2
                if it.y > H.PD - d / 2:
                    it.y = s["y0"] - 4 - d / 2
        if it is not self.moving_item():
            self.world.layout_ver = getattr(self.world, "layout_ver", 0) + 1

    def snap_to_wall(self, it):
        """Wall shelves go against the back wall of the room they are dropped in (or a side wall, turned)."""
        if it is None or not it.cat.get("wall"):
            return
        key = H.room_at(it.f, it.x, it.y)
        if key is None:
            return
        label, x0, y0, x1, y1, st = H.rooms(it.f)[key]
        if it.rot % 2 == 0:
            it.rot = 0
            it.y = y1 - it.cat["d"] / 2 - 1
        else:
            it.x = x0 + it.cat["d"] / 2 + 1 if it.x - x0 < x1 - it.x else x1 - it.cat["d"] / 2 - 1

    def finish_drag_item(self):
        placing = self.placing
        it = self.placing or self.drag_item
        self.snap_to_wall(it)
        self.placing = None
        self.drag_item = None
        if it is not None and self.is_client():
            if placing is not None:
                if it in self.world.items:
                    self.world.items.remove(it)
                self.hcmd("item_add", type=it.type, f=it.f, x=it.x, y=it.y, rot=it.rot)
            else:
                self.hcmd("item_move", id=it.id, f=it.f, x=it.x, y=it.y, rot=it.rot)
            self.world.layout_ver = getattr(self.world, "layout_ver", 0) + 1
            if self.net is not None:
                self.net.apply_pending_layout()
        elif it is not None:
            self.world.item_changed(it)
            self.world.rebuild_nav()
            self.world.save_layout()
        self.update()

    def on_button(self, key):
        if key == "edit":
            if not self.edit and self.mode == "one" and self.view in PA.PLACES:
                self.flash("外面的地方不能装修哦～回到家里再装修吧")
                return
            self.set_edit(not self.edit)
        elif key == "home":
            self.app.close_house()
        elif key == "reset":
            self.hcmd("layout_reset")
        elif key == "add":
            self.add_menu()
        elif key == "rotate":
            it = self.hover_item or self.drag_item or self.placing
            if it is not None:
                self.rotate_item(it)
        elif key == "play":
            self.play_menu()
        elif key == "all":
            self.follow_uid = None
            self.set_mode("all")
        elif key in ("floor0", "floor1", "floor2"):
            self.follow_uid = None
            self.set_mode("one", int(key[-1]))
        elif key == "places":
            self.open_map()

    def set_edit(self, on):
        self.edit = on
        self.hover_item = None
        if not on and self.placing is not None:
            self.finish_drag_item()
        if on:
            self.setFocus()
        self.update()

    def add_menu(self):
        app = self.app
        m = app.styled_menu()
        for g in H.GROUPS:
            sm = app.styled_menu(g, m)
            for typ, c in H.CATALOG.items():
                if c["group"] == g:
                    app.add(sm, c["name"], lambda t=typ: self.add_item(t))
            m.addMenu(sm)
        r = self.button_rects()["add"]
        m.exec(self.mapToGlobal(QPointF(r.left() * self.k, r.bottom() * self.k).toPoint()))

    def add_item(self, typ):
        f = self.focus_floor()
        if typ in ("tree", "flower_bed", "bench", "swing", "sandbox", "bird_feeder", "pond", "bbq", "clothesline",
                   "cat_house", "picnic", "garden_lamp") and self.mode == "all":
            f = 2
        it = Item(typ, f, H.PW / 3, H.PD / 2)
        self.world.items.append(it)
        pos = self.mapFromGlobal(QCursor.pos())
        x, y = self.canvas(QPointF(pos))
        if 0 <= x <= self.canvas_w() and 0 <= y <= self.canvas_h():
            f2, lx, ly = self.locate(x, y)
            self.move_item_to(it, *H.from_screen(lx, ly), f=f2)
        else:
            self.move_item_to(it, it.x, it.y, f=f)
        self.set_edit(True)
        self.placing = it
        self.hover_item = it

    # ---- menus ------------------------------------------------------------------------------------
    def context_menu(self, e):
        app = self.app
        x, y = self.canvas(e.position())
        f, lx, ly = self.locate(x, y)
        if f == HM.MAP_F and HM.node_at(lx, ly) is not None:
            self.node_menu(HM.node_at(lx, ly), e.globalPosition().toPoint())
            return
        self.focus_f = f
        m = app.styled_menu()
        if self.edit:
            it = self.item_at(f, lx, ly)
            if it is not None:
                app.add(m, it.cat["name"], lambda: None, enabled=False)
                app.add(m, "旋转 90°", lambda: self.rotate_item(it))
                for tf in (1, 0, 2):
                    if tf != it.f:
                        app.add(m, "搬到%s" % H.FLOOR_NAMES[tf], lambda tf=tf: self.switch_floor(it, tf))
                app.add(m, "删除", lambda: self.delete_item(it))
                m.addSeparator()
            app.add(m, "添加家具…", self.add_menu)
            app.add(m, "恢复默认布局", lambda: self.hcmd("layout_reset"))
            app.add(m, "完成装修", lambda: self.set_edit(False))
            m.exec(e.globalPosition().toPoint())
            return
        tvi = self.item_at(f, lx, ly) if self.agent_at(f, x, y) is None else None
        if tvi is not None and tvi.type == "tv":
            on = bool(tvi.state.get("on"))
            ch = tvi.state.get("ch")
            app.add(m, "电视" + ("：正在放%s" % TV.NAMES.get(ch, "") if on and ch else ("（开着）" if on else "（关着）")),
                    lambda: None, enabled=False)
            app.add(m, "关掉电视" if on else "打开电视", lambda: self.hcmd("tv", item=tvi.id, op="toggle"))
            if on:
                app.add(m, "换个台", lambda: self.hcmd("tv", item=tvi.id, op="next"))
            cm = app.styled_menu("选频道", m)
            for key in TV.PROGRAMMES:
                app.add(cm, TV.NAMES[key], lambda key=key: self.hcmd("tv", item=tvi.id, op="ch", ch=key),
                        on and ch == key)
            m.addMenu(cm)
            m.addSeparator()
        toy = self.plush_at(f, lx, ly)
        if toy is not None and self.agent_at(f, x, y) is None:
            name = toy
            w = self.world
            pl = w.plush[name]
            app.add(m, name, lambda: None, enabled=False)
            app.add(m, "和%s说话" % name, lambda: self.hcmd("plush", name=name, mode="user"))
            app.add(m, "让%s和猫聊天" % name, lambda: self.hcmd("plush", name=name, mode="cat"))
            app.add(m, "让%s和家人聊天" % name, lambda: self.hcmd("plush", name=name, mode="person"))
            me = self.my_agent()
            if me is not None and not me.is_cat and pl["at"] != "held":
                app.add(m, "我去拿起%s" % name, lambda: self.pcmd("pick", name=name))
            if pl["at"] != "held":
                for k in w.people:
                    if k.role == "kid" and not k.away and k.ctrl is None:
                        app.add(m, "让%s抱着%s" % (k.name, name), lambda k=k: self.hcmd("plush_fetch", name=name, uid=k.uid))
                        break
            if pl["at"] in ("item", "floor"):
                app.add(m, "放回城堡", lambda: self.hcmd("plush_home", name=name))
            m.addSeparator()
        a = self.agent_at(f, x, y)
        me = self.my_agent()
        visitor = a is not None and a.uid.startswith("v:")
        if visitor:
            info = HC.VISITORS.get(a.kind, {})
            app.add(m, "%s（来串门的流浪猫）" % a.name, lambda: None, enabled=False)
            app.add(m, info.get("desc", ""), lambda: None, enabled=False)
            app.add(m, "喂它吃点东西", lambda: self.hcmd("feed_visitor", uid=a.uid),
                    enabled=not a.leaving and not getattr(a, "leave_gift", False))
            app.add(m, "访客图鉴…", lambda: HC.open_book(self, self.app))
            m.addSeparator()
            a = None
        if a is not None:
            app.add(m, a.name + ("（%s在控制）" % self.world.play.name_of(a.ctrl, self.local_pid) if a.ctrl else ""),
                    lambda: None, enabled=False)
            if a is me:
                app.add(m, "放开TA（Esc）", lambda: self.control(None))
            elif a.ctrl in (None, "ai") and not a.away and not a.npc:
                app.add(m, "我来控制TA（双击）", lambda: self.control(a))
            if getattr(self, "follow_uid", None) == a.uid:
                app.add(m, "取消跟随", lambda: self.set_follow(None))
            elif not a.away:
                app.add(m, "跟随TA", lambda: self.set_follow(a))
        if a is not None and a.is_cat and a.ctrl is None:
            app.add(m, "摸摸", lambda: self.hcmd("pet", uid=a.uid))
            tm = app.styled_menu("喂零食", m)
            for key, label in HC.TREATS.items():
                app.add(tm, label + ("  ♥" if key in HC.trait(a).get("love", ()) else ""),
                        lambda key=key: self.hcmd("treat", uid=a.uid, kind=key,
                                                  by=me.uid if me is not None and not me.is_cat else None))
            m.addMenu(tm)
            app.add(m, "叫醒" if a.data.get("pose") == "sleep" else "去睡觉", lambda: self.hcmd("toggle_sleep", uid=a.uid))
            if a.state != "hiding":
                app.add(m, "🙈 躲猫猫（让TA去躲，你来找）", lambda: self.hcmd("hide", uid=a.uid))
            app.add(m, "逗猫棒（家人陪它玩）", lambda: self.hcmd("wand_play"))
        if a is not None and a.is_cat and a.ctrl is None and a.f not in PA.PLACES and a.traveling is None:
            om = app.styled_menu("带TA出门…", m)
            for pf, d in ((g, PA.PLACES[g]) for g in PA.OUTING_PLACES):
                app.add(om, "%s %s" % (d["icon"], d["name"]), lambda pf=pf: self.hcmd("outing", f=pf, cats=[a.uid]))
            m.addMenu(om)
        if a is not None and a.npc:
            a = None
        elif a is not None and not a.is_cat and a.ctrl is None and not a.away and a.traveling is None:
            om = app.styled_menu("出门去…", m)
            for pf, d in ((g, PA.PLACES[g]) for g in PA.OUTING_PLACES):
                if pf != a.f:
                    app.add(om, "%s %s" % (d["icon"], d["name"]), lambda pf=pf: self.hcmd("outing", f=pf, uids=[a.uid]))
            m.addMenu(om)
            if a.f in PA.PLACES:
                app.add(m, "回家", lambda: self.hcmd("outing_home", uid=a.uid))
        if a is not None and not a.is_cat and a.ctrl is None and not a.away and a.f not in PA.PLACES:
            tm = app.styled_menu("让%s去…" % a.name, m)
            for label, act in (PERSON_TASKS_ADULT if a.role == "adult" else PERSON_TASKS_KID):
                app.add(tm, label, lambda act=act: self.hcmd("person_act", uid=a.uid, act=act))
            m.addMenu(tm)
        it_here = self.item_at(f, lx, ly) if a is None and not visitor else None
        if it_here is not None and it_here.type == "bowls":
            app.add(m, "猫碗 · 让家人添粮", lambda: None, enabled=False)
            cur = self.world.food_choice()
            for key, label in HC.FOODS.items():
                app.add(m, "　" + label, lambda key=key: self.hcmd("feed_all", kind=key), key == cur)
        if not m.isEmpty():                    # (v27) right-clicked something: only its own choices
            m.exec(e.globalPosition().toPoint())
            return
        # ---- (v27) the empty floor: the house as a whole; the toolbar already has the views, 地图, 玩耍, 装修, 回桌面
        if getattr(self, "follow_uid", None):
            app.add(m, "取消跟随", lambda: self.set_follow(None))
        fm = app.styled_menu("喂猫", m)
        cur = self.world.food_choice()
        for key, label in HC.FOODS.items():
            app.add(fm, label, lambda key=key: self.hcmd("feed_all", kind=key), key == cur)
        m.addMenu(fm)
        app.add(m, "都过来！", lambda: self.hcmd("call_cats", f=f))
        app.add(m, "⚔ 开始对战…", lambda: self.battle_dialog(self.view if self.mode == "one" and self.view in AA.ARENAS
                                                             else None))
        m.addSeparator()
        app.todo_menu(m)
        app.focus_menu(m)
        app.remind_menu(m)
        nm = app.styled_menu("🌐 联机", m)
        try:
            from . import house_net
            house_net.fill_menu(self, nm, inline=True)
        except ImportError:
            pass
        if getattr(app, "linkhub", None) is not None:
            nm.addSeparator()
            app.linkhub.fill_menu(nm)
        m.addMenu(nm)
        m.addSeparator()
        hm = app.styled_menu("🏠 小屋", m)
        if not self.is_client():
            app.add(hm, "左右翻转布局", lambda: self.set_mirror(not H.MIRROR), H.MIRROR)
        app.add(hm, "访客图鉴…", lambda: HC.open_book(self, self.app))
        sub = app.styled_menu("自动出门", hm)
        cur = self.app.cfg["house"].get("outings", "sometimes")
        for key, label in (("often", "经常"), ("sometimes", "偶尔"), ("rare", "很少"), ("off", "不自动出门")):
            app.add(sub, label, lambda key=key: self.app.set_cfg("house.outings", key), cur == key)
        hm.addMenu(sub)
        app.add(hm, "小屋总在最前", self.toggle_top, self.app.cfg["house"].get("top", False))
        hm.addSeparator()
        app.add(hm, "回到桌面，小屋后台继续运行" + ("（房间不关）" if self.net is not None and not self.is_client() else ""),
                lambda: app.close_house(True))
        app.hide_menu(hm)
        hm.addSeparator()
        app.add(hm, "小屋设置…", lambda: app.open_settings("house"))
        m.addMenu(hm)
        app.fill_common(m, house=True)
        m.exec(e.globalPosition().toPoint())

    def toggle_sleep(self, c):
        if c.data.get("pose") == "sleep":
            c.set_state("rest", 1.5, pose="yawn")
            c.say(c.line("wake"))
        else:
            c.interrupt()
            c.release_spot()
            c.act_sleep()

    def set_mirror(self, on):
        """Flip the whole house left-right (the furniture arrangement follows)."""
        self.world.save_layout()
        self.app.cfg["house"]["mirror"] = bool(on)
        self.app.save()
        H.configure(bool(on))
        old = self.world
        self.world = World(self.app, self)
        self.world.play.add_player("host", self.my_name())
        for pid, pl in old.play.players.items():
            if pid not in ("host", "ai"):
                self.world.play.add_player(pid, pl.get("name", ""))
        self.world.fx_log = old.fx_log
        self.bg_cache = {}
        self.sprites = {}
        self.static_cache = {}
        self.hover_item = self.drag_item = self.placing = None
        self.update()

    def toggle_top(self):
        on = not self.app.cfg["house"].get("top", False)
        self.app.cfg["house"]["top"] = on
        self.app.save()
        self.setWindowFlag(Qt.WindowStaysOnTopHint, on)
        self.show()

    def rotate_item(self, it):
        if self.is_client() and it is not self.placing:
            self.hcmd("item_rotate", id=it.id)
            return
        it.rot = (it.rot + 1) % 4
        self.move_item_to(it, it.x, it.y)
        if self.is_client():
            self.update()
            return
        self.world.item_changed(it)
        self.world.rebuild_nav()
        self.world.save_layout()
        self.update()

    def switch_floor(self, it, to=None):
        to = (1 - it.f if it.f in (0, 1) else 0) if to is None else to
        if self.is_client():
            self.hcmd("item_move", id=it.id, f=to, x=it.x, y=it.y, rot=it.rot)
            self.set_view(to)
            return
        self.move_item_to(it, it.x, it.y, f=to)
        self.world.item_changed(it)
        self.world.rebuild_nav()
        self.world.save_layout()
        self.set_view(it.f)

    def delete_item(self, it):
        if self.is_client():
            self.hcmd("item_delete", id=it.id)
            return
        self.world.remove_item(it)
        self.world.save_layout()
        if self.hover_item is it:
            self.hover_item = None
        self.update()

    def closeEvent(self, e):
        self.save_geom()
        super().closeEvent(e)

    # ---- playing: control, commands, HUD ------------------------------------------------------------
    def my_name(self):
        n = (self.app.cfg["house"].get("net_name") or "").strip()
        return n or "房主"

    def is_client(self):
        return self.net is not None and getattr(self.net, "is_client", False)

    def my_agent(self):
        return self.world.play.agent_of(self.local_pid)

    def places_label(self):
        n = len(self.world.out_people())
        if self.mode == "one" and self.view in PA.PLACES:
            return "%s %s" % (PA.PLACES[self.view]["icon"], PA.PLACES[self.view]["name"])
        return "🗺 地图" + (" · %d" % n if n else "")

    def fill_places_menu(self, m):
        app = self.app
        w = self.world
        app.add(m, "去看看…", lambda: None, enabled=False)
        for pf, d in ((g, PA.PLACES[g]) for g in PA.OUTING_PLACES):
            who = [a.name for a in w.people + w.cats if a.f == pf and a.traveling is None]
            npcs = [n for n in w.npcs if n.f == pf and not n.hidden]
            text = "%s %s" % (d["icon"], d["name"])
            if who:
                text += "（%s）" % "、".join(who[:3])
            elif npcs:
                text += "（%d 人）" % len(npcs)
            app.add(m, text, lambda pf=pf: (setattr(self, "follow_uid", None), self.set_mode("one", pf)),
                    self.mode == "one" and self.view == pf)
        m.addSeparator()
        fm = app.styled_menu("全家一起去…", m)
        for pf, d in ((g, PA.PLACES[g]) for g in PA.OUTING_PLACES):
            app.add(fm, "%s %s" % (d["icon"], d["name"]), lambda pf=pf: self.hcmd("outing", f=pf, all=True))
        m.addMenu(fm)
        here = [pf for pf in PA.PLACES if w.family_at(pf)]
        for pf in here:
            app.add(m, "叫%s的家人回家" % PA.PLACES[pf]["name"], lambda pf=pf: self.hcmd("outing_home", f=pf))
        sub = app.styled_menu("自动出门", m)
        cur = self.app.cfg["house"].get("outings", "sometimes")
        for key, label in (("often", "经常"), ("sometimes", "偶尔"), ("rare", "很少"), ("off", "不自动出门")):
            app.add(sub, label, lambda key=key: self.app.set_cfg("house.outings", key), cur == key)
        m.addMenu(sub)

    def places_menu(self):
        m = self.app.styled_menu()
        self.fill_places_menu(m)
        r = self.button_rects().get("places")
        if r is not None:
            pt = self.mapToGlobal(QPointF(r.left() * self.k, r.bottom() * self.k).toPoint())
            m.exec(pt)

    def gate_picker(self, me):
        """A family member under your control walks out of the gate / a place's exit: where to?"""
        app = self.app
        m = app.styled_menu()
        cats = [c for c in self.world.cats if c.ctrl is None and c.traveling is None and
                self.world.same_region(c.f, me.f) and c.state != "carried"]
        app.add(m, "%s去哪儿？" % me.name, lambda: None, enabled=False)
        if me.f in PA.PLACES:
            app.add(m, "⌂ 回家", lambda: self.hcmd("outing_home", uid=me.uid))
        for pf, d in ((g, PA.PLACES[g]) for g in PA.OUTING_PLACES):
            if pf == me.f:
                continue
            app.add(m, "%s %s" % (d["icon"], d["name"]), lambda pf=pf: self.hcmd("outing", f=pf, uids=[me.uid]))
            if cats and me.f not in PA.PLACES:
                pass
        if cats and me.f not in PA.PLACES:
            cm = app.styled_menu("带上猫一起去…", m)
            for pf, d in ((g, PA.PLACES[g]) for g in PA.OUTING_PLACES):
                app.add(cm, "%s %s" % (d["icon"], d["name"]),
                        lambda pf=pf: self.hcmd("outing", f=pf, uids=[me.uid], cats=[c.uid for c in cats]))
            m.addMenu(cm)
        app.add(m, "先不出去", lambda: None)
        self.keys.clear()
        m.exec(QCursor.pos())

    def check_gate(self):
        me = self.my_agent()
        if me is None or me.is_cat or me.path or me.traveling is not None:
            self.gate_armed = True
            return
        if me.f == 2:
            g0, g1 = H.GATE
        elif me.f in PA.PLACES:
            g0, g1 = PA.gate(me.f)
        else:
            self.gate_armed = True
            return
        at = me.y < -H.ENTRY_D * 0.45 and g0 - 6 <= me.x <= g1 + 6
        if at and getattr(self, "gate_armed", True):
            self.gate_armed = False
            me.y = -H.ENTRY_D * 0.2
            self.gate_picker(me)
        elif not at:
            self.gate_armed = True

    def play_label(self):
        me = self.my_agent()
        return ("🎮 " + me.name) if me is not None else "🎮 玩耍"

    def pcmd(self, _cmd, **kw):
        """A play input from this computer: applied here, or sent to the host when we are a guest."""
        if self.is_client():
            self.net.send_cmd(_cmd, kw)
            return None
        return self.world.play.command(self.local_pid, _cmd, kw)

    def hcmd(self, _cmd, **kw):
        """A house action (feeding, petting, decorating...): applied here, or sent to the host."""
        if self.is_client():
            self.net.send_cmd("h:" + _cmd, kw)
            return None
        return self.apply_hcmd(_cmd, kw, self.local_pid)

    def apply_hcmd(self, name, kw, pid):
        """House actions, also those arriving from the guest (validated)."""
        w = self.world
        try:
            if name == "pet":
                a = w.agent_by_uid(str(kw.get("uid")))
                if a is not None:
                    self.click_agent(a)
            elif name == "feed_all":
                w.feed_all(kw.get("kind") if kw.get("kind") in HC.FOODS else None)
            elif name == "hide":
                self.hide_guesses, self.hide_hint = {}, None
                c = w.agent_by_uid(str(kw.get("uid")))
                if c is not None and c.is_cat and not c.uid.startswith("v:") and not c.away and c.ctrl is None:
                    if c.state in ("carried", "held", "fall") or w.play.dark is not None:
                        pass
                    elif c.state == "hiding" or not c.act_hideaway(game=True):
                        self.flash("%s现在找不到能躲的地方（或者另一只猫正躲着）" % c.name, 3)
            elif name == "found_cat":
                c = w.agent_by_uid(str(kw.get("uid")))
                if c is not None and c.is_cat and c.state == "hiding":
                    c.come_out(True)
            elif name == "treat":
                c = w.agent_by_uid(str(kw.get("uid")))
                by = w.agent_by_uid(str(kw.get("by"))) if kw.get("by") else None
                if by is not None and (by.is_cat or by.ctrl != pid):
                    by = None
                if c is not None and c.is_cat and str(kw.get("kind")) in HC.TREATS:
                    w.give_treat(c, str(kw.get("kind")), by)
            elif name == "feed_visitor":
                v = w.agent_by_uid(str(kw.get("uid")))
                if v is not None and v.uid.startswith("v:"):
                    if not w.feed_visitor(v):
                        self.flash("家里没人能去喂它")
            elif name == "gift":
                by = w.agent_by_uid(str(kw.get("by"))) if kw.get("by") else None
                w.collect_gift(int(kw.get("id")), by)
            elif name == "outing":
                pf = int(kw.get("f"))
                if pf not in PA.PLACES:
                    return
                ppl = [w.agent_by_uid(str(u)) for u in (kw.get("uids") or [])]
                ppl = [p for p in ppl if p is not None and p in w.people and (p.ctrl in (None, pid))]
                cats = [w.agent_by_uid(str(u)) for u in (kw.get("cats") or [])]
                cats = [c for c in cats if c is not None and c in w.cats and c.traveling is None]
                if kw.get("all"):
                    ppl = [p for p in w.people if not p.away and p.traveling is None and p.ctrl in (None, pid)
                           and p.f not in PA.PLACES]
                    cats = [c for c in w.cats if c.ctrl in (None, pid) and c.traveling is None and c.f not in PA.PLACES]
                if cats and not ppl:
                    # somebody has to take the cat: whoever is free at home
                    h = w.hour()
                    free = [p for p in w.present_people() if p.ctrl is None and p.act != "sleep" and not p.asleep_at(h)]
                    free.sort(key=lambda p: (p.role != "adult", w.on_errand(p)))
                    if free:
                        ppl = [free[0]]
                if not ppl:
                    self.flash("现在没人能出门")
                    return
                if not w.start_outing(pf, ppl, cats, why="user"):
                    self.flash("出不了门……")
            elif name == "battle":
                self.start_battle_cmd(kw, pid)
            elif name == "battle_again":
                bt = w.battle
                if bt is not None and not isinstance(bt, HB.RemoteBattle):
                    cfg = getattr(bt, "cfg", None)
                    if cfg:
                        w.end_battle(go_home=False)
                        self.start_battle_cmd(dict(cfg), pid, again=True)
            elif name == "battle_end":
                if w.battle is not None:
                    w.end_battle()
            elif name == "outing_home":
                if kw.get("uid"):
                    pr = w.agent_by_uid(str(kw.get("uid")))
                    if pr is not None and pr in w.people and pr.ctrl in (None, pid):
                        w.go_home(pr)
                elif kw.get("f") is not None and int(kw.get("f")) in PA.PLACES:
                    w.send_all_home(int(kw.get("f")))
            elif name == "lamp":
                it = w.item_by_id(int(kw.get("item")))
                if it is not None and it.type in ("lamp", "garden_lamp"):
                    it.state["force"] = not bool(it.state.get("on"))
            elif name == "room_light":
                ff, room = int(kw.get("f")), str(kw.get("room"))
                if ff in (0, 1) and room in w.light_rooms(ff):
                    w.set_room_light(ff, room, not w.room_light_on(ff, room))
            elif name == "floor_lights":
                ff = int(kw.get("f"))
                if ff in (0, 1):
                    w.set_floor_lights(ff, w.floor_lights(ff) != "all")
            elif name == "curtain":
                ff, room = int(kw.get("f")), str(kw.get("room"))
                if ff in (0, 1) and room in H.rooms(ff):
                    cur = room in self.closed_curtains(ff, w.hour())
                    w.curtains[(ff, room)] = not cur
                    self.bg_cache = {}
            elif name == "appliance":
                it = w.item_by_id(int(kw.get("item")))
                if it is not None:
                    w.use_appliance(it)
            elif name == "call_cats":
                f = int(kw.get("f", 1))
                if f in (0, 1, 2):
                    view = self.focus_f
                    self.focus_f = f
                    w.call_cats()
                    self.focus_f = view
            elif name == "wand_play":
                w.wand_play()
            elif name == "tv":
                it = w.item_by_id(int(kw.get("item")))
                op = str(kw.get("op"))
                by = w.agent_by_uid(str(kw.get("by"))) if kw.get("by") else None
                if by is not None and (by.is_cat or by.ctrl != pid):
                    by = None
                if it is not None and it.type == "tv" and op in ("toggle", "on", "off", "next", "ch"):
                    w.tv_control(it, op, str(kw.get("ch")) if kw.get("ch") else None, by)
            elif name == "person_act":
                a = w.agent_by_uid(str(kw.get("uid")))
                act = str(kw.get("act"))
                allowed = {x[1] for x in PERSON_TASKS_ADULT + PERSON_TASKS_KID}
                if a is not None and not a.is_cat and a.ctrl is None and not a.away and act in allowed:
                    a.stop()
                    if a.state == "act":
                        a.end_act()
                    else:
                        a.release_spot()
                        a.act = "idle"
                        a.set_state("idle", 2.0)
                    if not a.start_act(act):
                        a.say(random.choice(["现在做不了哦～", "嗯……等会儿吧", "这个现在不行"]), 2.0)
                    elif random.random() < 0.6:
                        a.say(random.choice(["好嘞！", "收到～", "这就去", "好的好的"]), 1.6)
            elif name == "toggle_sleep":
                a = w.agent_by_uid(str(kw.get("uid")))
                if a is not None and a.is_cat and a.ctrl is None:
                    self.toggle_sleep(a)
            elif name == "plush":
                pname = str(kw.get("name"))
                if pname in PLUSH_NAMES:
                    mode = kw.get("mode")
                    if mode == "user":
                        w.plush_chat(None, pname, to_user=True)
                    elif mode in ("cat", "person"):
                        w.plush_chat(None, pname, prefer=mode)
            elif name == "plush_fetch":
                pname = str(kw.get("name"))
                k = w.agent_by_uid(str(kw.get("uid")))
                if pname in PLUSH_NAMES and k is not None and not k.is_cat and k.ctrl is None and not k.away:
                    k.stop()
                    if k.state == "act":
                        k.end_act()
                    k.release_spot()
                    k.act = "fetch"
                    k.set_state("act", 60)
                    w.go_pick(k, pname, lambda ok, k=k: (k.end_act(), k.say("我抱着%s啦！" % pname)) if ok else k.end_act())
            elif name == "plush_home":
                pname = str(kw.get("name"))
                if pname in PLUSH_NAMES and w.plush[pname]["at"] in ("item", "floor"):
                    adults = [q for q in w.present_people() if q.role == "adult" and q.ctrl is None and q.act != "sleep"
                              and w.carried_by(q) is None]
                    done = False
                    if adults:
                        q = min(adults, key=lambda q: math.hypot(q.x - (w.plush_where(pname) or (0, 0, 0))[1], q.y))
                        q.stop()
                        if q.state == "act":
                            q.end_act()
                        done = q.start_tidy(pname)
                    if not done:
                        w.plush[pname] = {"at": "castle"}
                        w.sync_plush()
                        w.save_plush()
            elif name == "drop":
                a = w.agent_by_uid(str(kw.get("uid")))
                f = int(kw.get("f"))
                if a is not None and a.is_cat and f in (0, 1, 2) and a.ctrl in (None, pid):
                    a.interrupt()
                    a.release_spot()
                    wx, wy = H.from_screen(float(kw.get("x")), float(kw.get("y")) + 40, 0)
                    a.f, a.x, a.y = f, clamp(wx, 4, H.PW - 4), clamp(wy, H.BALCONY[2], H.PD - 4)
                    a.h = 40.0
                    self.drop_cat(a, f, float(kw.get("x")), float(kw.get("y")))
            elif name == "item_move":
                it = w.item_by_id(int(kw.get("id")))
                f = int(kw.get("f"))
                if it is not None and f in (0, 1, 2):
                    w.item_changed(it)
                    if "rot" in kw:
                        it.rot = int(kw["rot"]) % 4
                    self.move_item_to(it, float(kw.get("x")), float(kw.get("y")), f=f)
                    w.rebuild_nav()
                    w.save_layout()
            elif name == "item_rotate":
                it = w.item_by_id(int(kw.get("id")))
                if it is not None:
                    self.rotate_item(it)
            elif name == "item_add":
                typ = str(kw.get("type"))
                f = int(kw.get("f"))
                if typ in H.CATALOG and f in (0, 1, 2) and len(w.items) < 400:
                    it = Item(typ, f, H.PW / 3, H.PD / 2, int(kw.get("rot", 0)))
                    w.items.append(it)
                    self.move_item_to(it, float(kw.get("x")), float(kw.get("y")), f=f)
                    w.rebuild_nav()
                    w.save_layout()
            elif name == "item_delete":
                it = w.item_by_id(int(kw.get("id")))
                if it is not None:
                    self.delete_item(it)
            elif name == "layout_reset":
                w.reset_layout()
        except (TypeError, ValueError) as ex:
            print("house command %r: %r" % (name, ex), file=sys.stderr)
        self.update()

    def usable(self, me, it):
        return any((sp["who"] == "cat") == me.is_cat for _, sp in it.spots())

    def key_turn(self):
        """(v26) How the arrow keys map onto the world for the character you control: in the turned garden of
        the all view, up / down / left / right go that way on the screen. (sx, sy) world signs, or None."""
        me = self.my_agent()
        if me is None or self.mode != "all" or me.f != 2 or me.stairs_u is not None:
            return None
        rot = self.garden_rot()
        return (1 if rot[1] > 0 else -1, 1 if rot[3] > 0 else -1)

    def send_dir(self):
        dx = sum(self.MOVE_KEYS[k][0] for k in self.keys if k in self.MOVE_KEYS)
        dy = sum(self.MOVE_KEYS[k][1] for k in self.keys if k in self.MOVE_KEYS)
        turn = self.key_turn()
        self._key_turn = turn
        if turn is not None:
            # screen right (+u) is world y * sign(b); screen up (-v) is world x * -sign(d)
            dx, dy = -dy * turn[1], dx * turn[0]
        d = (max(-1, min(1, dx)), max(-1, min(1, dy)))
        if d != self.last_dir:
            self.last_dir = d
            self.pcmd("dir", dx=d[0], dy=d[1])

    def aim_args(self):
        """Which way an action goes: the held direction keys first; the mouse only if it moved just now;
        otherwise the way the character is facing (decided by the host)."""
        d = getattr(self, "last_dir", (0, 0)) or (0, 0)
        if d != (0, 0):
            return {"jdx": d[0], "jdy": d[1]}
        if self.aim is None or time.monotonic() - getattr(self, "aim_t", 0.0) > 1.5:
            return {}
        f, x, y = self.aim
        return {"tf": f, "tx": round(x, 1), "ty": round(y, 1)}

    def flash(self, text, dur=3.0):
        self.world.play.banner = {"text": text, "until": self.world.t + dur}
        self.update()

    def chat_dialog(self):
        from PySide6.QtWidgets import QInputDialog
        text, ok = QInputDialog.getText(self, "说句话", "让你的角色说：")
        if ok and text.strip():
            self.pcmd("say", text=text.strip()[:40])
        self.activateWindow()
        self.setFocus()

    def control(self, a):
        self.pcmd("ctrl", uid=a.uid if a is not None else None)
        self.activateWindow()
        self.setFocus()

    def play_menu(self, parent=None):
        app = self.app
        m = parent or app.styled_menu()
        play = self.world.play
        me = self.my_agent()
        cm = app.styled_menu("我来控制…", m)
        for a in self.world.agents():
            if getattr(a, "npc", False) and not (self.mode == "one" and a.f == self.view):
                continue                         # (v27) townsfolk only where you are looking
            other = a.ctrl not in (None, self.local_pid, "ai")
            label = a.name + ("（%s在控制）" % play.name_of(a.ctrl) if other else "") + ("（出门了）" if a.away else "")
            app.add(cm, label, lambda a=a: self.control(a), a is me, enabled=not other and not a.away)
        m.addMenu(cm)
        if me is not None:
            app.add(m, "放开%s（Esc）" % me.name, lambda: self.control(None))
        gm = app.styled_menu("小游戏", m)
        app.add(gm, "抢小鱼干（60 秒）", lambda: self.pcmd("game", kind="fish"))
        app.add(gm, "捉蝴蝶（60 秒，在院子里）", lambda: self.pcmd("game", kind="bfly"))
        app.add(gm, "打闹对决（先打倒对方 3 次）", lambda: self.pcmd("game", kind="fight"))
        app.add(gm, "偷鱼大作战（猫偷鱼 / 人看守，90 秒）", lambda: self.pcmd("game", kind="steal"))
        if me is not None:
            em = app.styled_menu("表情动作（数字键 1–4）", m)
            names = ("喵一声", "比心", "打滚", "伸懒腰") if me.is_cat else ("挥手", "比心", "鼓掌", "跳舞")
            for i, nm in enumerate(names):
                app.add(em, "%d  %s" % (i + 1, nm), lambda i=i: self.pcmd("emote", e=i + 1))
            m.addMenu(em)
        if play.game:
            gm.addSeparator()
            app.add(gm, "结束游戏", lambda: self.pcmd("stop_game"))
        m.addMenu(gm)
        if me is not None:
            app.add(m, "说句话…（T）", self.chat_dialog)
        app.add(m, "玩法说明", self.show_help)
        if parent is None:
            r = self.button_rects()["play"]
            m.exec(self.mapToGlobal(QPointF(r.left() * self.k, r.bottom() * self.k).toPoint()))

    def show_help(self):
        from PySide6.QtWidgets import QMessageBox
        QMessageBox.information(self, "小屋玩法", (
            "选角色：双击猫或家人，或右键 → 我来控制TA。\n"
            "走路：WASD / 方向键，或者点地板（会自己找路、上下楼、出门）。\n"
            "E：用旁边的家具或和旁边的人 / 猫互动（人对猫是摸摸）；点家具就走过去用它。\n"
            "空格（猫）：往方向键的方向跳，没按方向键就朝脸对着的方向跳；那边有沙发、桌子、猫爬架就跳上去，"
            "在高处再按空格或方向键就朝那边跳下来。刚动过鼠标的话，朝鼠标的方向跳。\n"
            "F：猫拍一下 / 人扔枕头。空格（人）：用枕头敲。R：喵一声 / 打招呼。T：说句话。Esc：放开角色。\n\n"
            "抱猫：控制家人时点一下猫就走过去抱起来，抱着可以到处走；坐到沙发上猫就趴在腿上；"
            "再点一下猫、按 E 或 G 放下；抱着猫点沙发、猫爬架、床就把它放上去。被抱的猫按方向键能挣脱。\n"
            "娃娃：控制家人时点娃娃就抱起来，再点床、沙发、书桌等放上去，点城堡放回去，G 放地上。\n\n"
            "表情动作：数字键 1–4（人：挥手 / 比心 / 鼓掌 / 跳舞；猫：喵 / 比心 / 打滚 / 伸懒腰）。\n"
            "小游戏：抢小鱼干（满屋找小鱼干）、捉蝴蝶（院子里）、打闹对决（每人 5 颗心，先打倒对方 3 次赢）、"
            "偷鱼大作战（猫跳上餐桌叼小鱼干送回猫窝，人靠近猫就能赶走它；偷回 3 条猫赢，一个人玩时另一边由 AI 来）。\n"
            "右键家人 → 让TA去…：喂猫、抱猫、浇花、铲猫砂、做饭、收拾碗筷、看电视…\n"
            "电视：点一下开 / 关；右键电视可以换台、选频道（动画片、新闻、足球、猫咪频道…）。\n"
            "一个人玩打闹时，会有一只猫或家人当 AI 对手。\n\n"
            "鼠标停在猫或家人身上：状态卡（在做什么、心情 / 饱腹 / 精力、口味）。能点的东西会亮起来：电视、台灯、"
            "院子路灯、窗帘（点窗户）、猫碗（添粮）、洗衣机、灶台、冰箱、门口的小礼物。\n"
            "喂食：右键猫碗换猫粮（干粮 / 湿粮 / 鱼肉罐头 / 鸡肉罐头 / 冻干拌粮）；右键猫 → 喂零食（猫条 / 小鱼干 / 冻干 / 猫草），"
            "家人会拿过去喂。♥ 是它最爱的。一天零食太多会吃腻。\n"
            "流浪猫：白天院子里偶尔有猫来串门，右键 → 喂它一顿；走时会在门口留下小礼物，点一下收进“访客图鉴”。\n"
            "跟随：右键猫或家人 → 跟随TA，画面跟着它换楼层；右键空白处取消。\n"
            "地图：上方“🗺 地图”打开小镇地图，点地点（家、学校、公园、湖边、商店街、山上、营地）看看或派人去；"
            "地点之间可以直接走过去，不用先回家，路上的小人头像就是正在赶路的家人。\n"
            "出门：在地图上点地点，或让全家一起去；右键家人 → 出门去…，"
            "右键猫 → 带TA出门…；控制家人走出院门（或地点的出口）会问去哪儿。户外空旷的地方猫咪由家人牵着绳。"
            "公园：滑梯、跷跷板、冰淇淋、喂鸽子、放风筝；湖边：划船、钓鱼（钓到鱼猫咪有份）、喂鸭子、野餐；"
            "商店街：逛超市、看小猫小狗、喝咖啡；山上：爬山、望远镜、在山顶拍照；营地：篝火烤棉花糖、躺吊床、住帐篷。"
            "下方的小标签显示谁在外面，点一下就去看。\n\n"
            "对战区：地图右边的对战场地，每个场地玩一种游戏（点一个 → ⚔ 开始对战，可以 1 对 1 / 2 对 2 / 混战，"
            "猫和人混着组队，联机时朋友也能控制一个；第一次玩点“🎓 新手训练”，陪练会一步步教你）：\n"
            "· 🥊 横版格斗（竞技场、道场）：A/D 走，J 连击，↑J 挑空，↓J 扫腿，空中 J 空中连击；K / ↑K / ↓K 三个专属技能；"
            "L 格挡（准时按是弹反），L+左右 瞬步；空格 跳（二段跳），↓+空格 从平台跳下；贴身按 E 抓投；怒气满了按 J+K 放大招。\n"
            "· 💣 泡泡堂（毛线工厂）：J 放毛线炸弹，炸开纸箱捡道具（炸弹+1、火力+1、跑鞋、针）；L 踢炸弹，空格 跳过炸弹；"
            "被炸到会被毛线困住，队友碰一下能救，对手碰一下就出局；有针按 E 自救。\n"
            "· ❄ 雪球射击（雪球场）：J 扔雪球（自动瞄准），按住蓄力扔大雪球；E 捏雪球（雪球堆旁边一下装满）；"
            "按住 L 蹲在雪墙后面躲，L+方向 翻滚；血打光会被冻成雪人。\n"
            "· 🏁 屋顶竞速（屋顶月夜）：下层往右跑、踩弹簧上楼、上层往左跑、跳下来冲线；空格 跳（二段跳），J 冲刺，"
            "L 滑铲钻过晾衣绳，撞问号箱拿道具按 E 用（🍌 香蕉皮、🧶 毛线球、🐟 加速）。\n"
            "· ⚔ 乱斗（其他场地）：俯视角动作乱斗。\n"
            "每个角色在每种游戏里的 K 技能都不一样（三花猫、狸花猫、第一位大人、第二位大人、小孩各有一套）。"
            "开打前有操作卡，按 J 准备好；中途按 H 再看。家里的“打闹对决”还是简单版。\n\n"
            "联机（公网 IP）：房主“开房间”，把公网邀请码发给对方；对方“加入房间”。两边共用这间小屋、两只猫和家人，"
            "都能装修。开房间会自动尝试 IPv6 和路由器端口映射；校园网推荐 Tailscale，步骤见 联机 → 联机步骤。"))

    def paint_hud(self, p):
        play = self.world.play
        t = self.world.t
        chips = []
        for pid, pl in play.players.items():
            if not pl.get("agent") and pid != self.local_pid and not play.game:
                continue
            chips.append(pid)
        show_chips = len(chips) > 1 or play.game or self.net is not None
        x = 436 * U if not self.edit else 690 * U
        y = 13 * U
        p.setFont(self.small)
        fm = QFontMetricsF(self.small)
        if show_chips:
            for pid in chips:
                pl = play.players[pid]
                a = play.agent_of(pid)
                name = play.name_of(pid, self.local_pid)
                text = name + ("·" + a.name if a is not None else "")
                if play.game and pid in play.game.get("scores", {}):
                    text += "  %d" % play.game["scores"][pid]
                w = fm.horizontalAdvance(text) + 30
                if a is not None and a.uid in play.hearts:
                    w += 62
                r = QRectF(x, y, w, 34 * U)
                col = QColor(HP.PLAYER_COLORS.get(pid, "#8a8a96") if pid != self.local_pid else "#f0a020")
                p.setPen(QPen(col.darker(130), 1.6))
                p.setBrush(QColor(255, 250, 240, 240))
                p.drawRoundedRect(r, r.height() / 2, r.height() / 2)
                p.setPen(Qt.NoPen)
                p.setBrush(col)
                p.drawEllipse(QPointF(r.left() + 13, r.center().y()), 5, 5)
                p.setPen(QColor("#5e4436"))
                p.drawText(QRectF(r.left() + 22, r.top(), w - 22, r.height()), Qt.AlignVCenter | Qt.AlignLeft, text)
                if a is not None and a.uid in play.hearts:
                    HP.draw_hearts(p, r.right() - 58, r.center().y(), play.hearts[a.uid], s=4.6)
                x += w + 6
        g = play.game
        if g:
            left = max(0, int(g.get("end", t) - t))
            text = "%s  ⏱ %d" % (HP.GAME_NAMES.get(g["kind"], ""), left)
            w = fm.horizontalAdvance(text) + 24
            r = QRectF(x, y, w, 34 * U)
            p.setPen(QPen(QColor("#c4862c"), 1.6))
            p.setBrush(QColor("#ffe7b0"))
            p.drawRoundedRect(r, r.height() / 2, r.height() / 2)
            p.setPen(QColor("#6b4a1a"))
            p.drawText(r, Qt.AlignCenter, text)
            x += w + 6
        if self.net is not None:
            st = self.net.status_text()
            if st:
                w = fm.horizontalAdvance(st) + 24
                r = QRectF(x, 13 * U, w, 34 * U)
                p.setPen(Qt.NoPen)
                p.setBrush(QColor(60, 140, 90, 220) if self.net.connected() else QColor(150, 120, 90, 220))
                p.drawRoundedRect(r, r.height() / 2, r.height() / 2)
                p.setPen(QColor("#ffffff"))
                p.drawText(r, Qt.AlignCenter, st)
        bn = play.banner
        if bn and bn["until"] > t:
            fade = clamp((bn["until"] - t) / 0.4, 0, 1)
            fmb = QFontMetricsF(self.banner_font)
            w = min(self.canvas_w() - 60, fmb.horizontalAdvance(bn["text"]) + 50)
            h = fmb.height() + 22
            ch = self.canvas_h()
            r = QRectF((self.canvas_w() - w) / 2, TOOLBAR_H + 10 * U if self.mode == "all" else ch * 0.42, w, h)
            p.save()
            p.setOpacity(fade)
            p.setPen(QPen(QColor("#c4862c"), 2))
            p.setBrush(QColor(255, 246, 225, 245))
            p.drawRoundedRect(r, h / 2, h / 2)
            p.setFont(self.banner_font)
            p.setPen(QColor("#6b3f1a"))
            p.drawText(r, Qt.AlignCenter, bn["text"])
            p.restore()
        bt_ = self.world.battle
        if self.my_agent() is not None and not self.edit and not (
                bt_ is not None and bt_.phase != "over" and any(fi.uid == self.my_agent().uid for fi in bt_.fighters)):
            pl = self.world.play.players.get(self.local_pid) or {}
            text = "WASD 走 · R %s · 空格 朝方向跳/敲 · 点猫抱起 · E 互动 · G 放下 · F 拍/扔 · Q 叫 · T 说话 · Esc 放开" % (
                "现在跑（换成走）" if pl.get("run") else "现在走（换成跑）")
            w = fm.horizontalAdvance(text) + 24
            r = QRectF(16 * U, self.canvas_h() - 34 * U, w, 26 * U)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(60, 40, 30, 150))
            p.drawRoundedRect(r, r.height() / 2, r.height() / 2)
            p.setPen(QColor("#ffffff"))
            p.drawText(r, Qt.AlignCenter, text)

    # ---- sharing the house over the network --------------------------------------------------------
    def host_net(self, port, quiet=False):
        from . import house_net
        from PySide6.QtWidgets import QMessageBox
        self.stop_net()
        try:
            fixed = str(self.app.cfg["house"].get("net_code") or "").upper()
            code = fixed if re.match(r"^[A-Z0-9]{4,12}$", fixed) else house_net.new_code()
            self.net = house_net.NetHost(self, port, code)
        except OSError as ex:
            self.net = None
            if quiet:
                self.flash("自动开房间没成功（端口 %d：%s），一分钟后再试" % (port, ex), 5)
            else:
                QMessageBox.warning(self, "开房间", "端口 %d 开不了：%s\n换一个端口试试。" % (port, ex))
            return False
        self.world.play.players.get("host", {})["name"] = self.my_name()
        self.update()
        return True

    def join_net(self, host, port, code, name="好友"):
        from . import house_net
        self.stop_net()
        self.net = house_net.NetClient(self, host, port, code, name)
        if self.net is not None and len(self.net.hosts) <= 1:
            self.flash("正在连接 %s:%d …" % (self.net.host, port), 10)

    def stop_net(self):
        net = self.net
        if net is None:
            return
        if net.is_client:
            net.close()
            if self.net is net:
                self.leave_remote("")
        else:
            net.close()
            self.net = None
            self.flash("房间关了", 2.5)
        self.update()

    def net_failed(self, why):
        self.net = None
        if "\n" in why:                         # every address of the invite failed: say what each one did
            from PySide6.QtWidgets import QMessageBox
            head, _, rest = why.partition("\n")
            self.flash("没连上：%s" % head, 8)
            box = QMessageBox(QMessageBox.Warning, "加入房间", head, QMessageBox.Ok, self)
            box.setInformativeText(rest)
            box.setAttribute(Qt.WA_DeleteOnClose)
            box.setModal(False)
            box.show()
            self.update()
            return
        self.flash("没连上：%s" % why if "Tailscale" in why else
                   "没连上：%s（请房主看“联机步骤”；校园网 / 宿舍推荐 Tailscale）" % why, 8)
        self.update()

    def enter_remote(self, init):
        self.keys.clear()
        self.local_world = self.world
        H.configure(bool(init.get("mirror", True)))
        self.world = World(self.app, self, remote=init)
        self.local_pid = str(init.get("you") or "guest")
        try:
            art.apply_colors(init.get("look") or {})
        except Exception as ex:
            print("look:", ex, file=sys.stderr)
        self.edit = False
        self.placing = self.drag_item = self.hover_item = None
        self.bg_cache = {}
        self.sprites = {}
        self.static_cache = {}
        self.update()

    def leave_remote(self, why=""):
        self.net = None
        if not self.world.remote:
            return
        self.keys.clear()
        self.edit = False
        self.placing = self.drag_item = self.hover_item = None
        H.configure(self.app.cfg["house"].get("mirror", True))
        lw = getattr(self, "local_world", None)
        self.world = lw if lw is not None else World(self.app, self)
        self.world.layout_ver = getattr(self.world, "layout_ver", 0) + 1
        self.local_world = None
        self.local_pid = "host"
        self.world.play.add_player("host", self.my_name())
        try:
            self.app.apply_colors()
        except Exception:
            pass
        self.bg_cache = {}
        self.sprites = {}
        self.static_cache = {}
        self.flash("回到自己的小屋了" + ("（%s）" % why if why else ""), 4)
        self.update()

    def apply_remote_layout(self, m):
        if not self.world.remote:
            return
        if bool(m.get("mirror", H.MIRROR)) != H.MIRROR:
            H.configure(bool(m.get("mirror")))
            self.bg_cache = {}
            self.sprites = {}
        self.world.set_remote_layout(m.get("layout") or [])
        self.static_cache = {}
        self.update()

    def apply_remote_people(self, rows):
        if self.world.remote:
            self.world.set_remote_people(rows)

    def apply_remote_look(self, m):
        if not self.world.remote:
            return
        try:
            art.apply_colors(m.get("look") or {})
        except Exception:
            pass
        from .house_net import RemoteCatSrc
        for d in m.get("cats") or []:
            c = self.world.agent_by_uid(d.get("uid"))
            if c is not None and c.is_cat:
                c.src = RemoteCatSrc(d)

    # ---- forwarded from the desktop cats ------------------------------------------------------
    def cat(self, kind):
        for c in self.world.cats:
            if c.kind == kind:
                return c
        return None

    def forward_say(self, kind, text, dur=None, delay=0.0):
        c = self.cat(kind)
        if c is not None:
            c.say(text, dur, delay)

    def forward_spawn(self, kind, fx, n=1):
        c = self.cat(kind)
        if c is not None:
            c.spawn(fx, n)

    def forward_seek(self, kind, reason, text, after, tid):
        c = self.cat(kind)
        if c is None:
            return
        if text:
            c.present(text, after, reason, tid)
            try:
                self.world.family_relay(text, reason, c)
            except Exception as ex:
                print("relay:", repr(ex), file=sys.stderr)
        if self.isVisible():
            self.raise_()

    def refresh_look(self):
        self.bg_cache = {}
        self.update()
