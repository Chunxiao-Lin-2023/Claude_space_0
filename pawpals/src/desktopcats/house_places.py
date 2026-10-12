"""Going out: the family (and the cats, on the leash where it is open air) visit places outside the house.

Places are extra storeys of the house world (see house_places_art). This module adds the world side:
fixed scenery, people who work / play there (NPCs), little animals, the rowing boats, outings and travel,
what the family and the cats do at each place, and the leash.
"""
import datetime
import math
import random
import time

from . import house_art as H
from . import house_places_art as PA

TRAVEL_T = 5.0                    # seconds "on the way" between home and a place (they are off screen)
LEASH = 84.0                      # how far a cat on the leash can wander from its person
PLACE_ID0 = 900000                # place scenery gets fixed item ids (the same on both computers when sharing)

LAYOUTS = {
    3: [("blackboard", 330, 470, 0), ("lectern", 520, 400, 0), ("school_desk", 150, 330, 0), ("school_desk", 330, 330, 0),
        ("school_desk", 510, 330, 0), ("school_desk", 150, 250, 0), ("school_desk", 330, 250, 0),
        ("school_desk", 510, 250, 0), ("bookshelf", 650, 462, 0), ("plant", 40, 455, 0), ("hoop", 1190, 400, 0),
        ("bars", 880, 380, 0), ("flagpole", 760, 440, 0), ("bench", 1040, 70, 0), ("tree", 1205, 110, 0),
        ("flower_bed", 110, 30, 0), ("flower_bed", 590, 30, 0), ("bike_rack", 640, 100, 0),
        ("garden_lamp", 250, 20, 0), ("garden_lamp", 450, 20, 0), ("bench", 480, 140, 0)],
    4: [("fountain", 630, 260, 0), ("slide", 200, 350, 0), ("swing", 380, 410, 0), ("seesaw", 190, 150, 0),
        ("sandbox", 400, 190, 0), ("bench", 880, 410, 0), ("bench", 1070, 410, 0), ("tree", 60, 430, 0),
        ("tree", 1210, 440, 0), ("tree", 1215, 90, 0), ("tree", 820, 455, 0), ("icecream", 980, 190, 0),
        ("flower_bed", 470, 40, 0), ("flower_bed", 790, 40, 0), ("garden_lamp", 520, 160, 0),
        ("garden_lamp", 740, 160, 0), ("garden_lamp", 1150, 250, 0), ("bin", 950, 110, 0)],
    5: [("fish_stool", 800, 418, 2), ("fish_stool", 862, 418, 0), ("bench", 560, 130, 2), ("bench", 1080, 130, 2),
        ("willow", 100, 120, 0), ("willow", 1190, 120, 0), ("picnic", 380, 90, 0), ("reeds", 660, 196, 0),
        ("reeds", 960, 196, 0), ("reeds", 40, 196, 0), ("rock", 280, 165, 0), ("garden_lamp", 470, 20, 0),
        ("garden_lamp", 1000, 20, 0)],
    6: [("drink_fridge", 80, 456, 0), ("drink_fridge", 160, 456, 0), ("shelf", 120, 380, 0), ("shelf", 330, 380, 0),
        ("shelf", 120, 290, 0), ("fruit_stand", 330, 290, 0), ("checkout", 420, 210, 0), ("cart", 40, 200, 0),
        ("pet_cages", 680, 462, 0), ("fish_tank", 560, 300, 0), ("pet_shelf", 800, 330, 0),
        ("pet_counter", 790, 220, 0), ("grooming", 570, 220, 0), ("cafe_counter", 1150, 440, 0),
        ("cafe_table", 950, 380, 0), ("cafe_table", 950, 260, 0), ("cafe_table", 1170, 280, 0),
        ("armchair", 1215, 370, 3), ("cat_bed", 900, 450, 0), ("bench", 380, 70, 0), ("street_tree", 200, 70, 0),
        ("street_tree", 980, 70, 0), ("garden_lamp", 90, 30, 0), ("garden_lamp", 760, 30, 0),
        ("garden_lamp", 1180, 30, 0), ("vending", 870, 125, 0), ("mailbox", 480, 120, 0), ("bike_rack", 1120, 100, 0)],
    7: [("pine", 40, 330, 0), ("pine", 470, 450, 0), ("pine", 130, 455, 0), ("pine", 500, 60, 0), ("pine", 1230, 90, 0),
        ("pine", 740, 110, 0), ("rock", 380, 150, 0), ("big_rock", 300, 380, 0), ("signpost", 330, 60, 0),
        ("pavilion", 930, 320, 0), ("telescope", 1180, 445, 0), ("summit", 790, 445, 0), ("big_rock", 1150, 200, 0)],
    8: [("tent", 330, 380, 0), ("tent", 1060, 400, 0), ("campfire", 620, 220, 0), ("log_seat", 620, 290, 0),
        ("camp_chair", 520, 215, 3), ("camp_chair", 720, 215, 1), ("camp_table", 900, 230, 0),
        ("lantern_pole", 470, 430, 0), ("lantern_pole", 820, 420, 0), ("cooler", 200, 250, 0), ("firewood", 740, 320, 0),
        ("hammock", 1050, 120, 0), ("pine", 60, 430, 0), ("pine", 150, 465, 0), ("pine", 1210, 460, 0),
        ("pine", 1225, 250, 0), ("pine", 40, 150, 0)],
}

BOAT_DOCKS = [(735.0, 330.0), (735.0, 250.0)]
BOAT_BOARD = [(796.0, 330.0), (796.0, 250.0)]
BOAT_LOOP = (440.0, 340.0, 300.0, 92.0)          # centre x, y, radius x, y of the round the boats row


def P(role, hair, hair_c, shirt, pants, outfit, acc="none", skin="#f6d3b5", beard=False, height=1.0):
    return {"role": role, "hair": hair, "hair_c": hair_c, "shirt": shirt, "pants": pants, "skin": skin,
            "outfit": outfit, "acc": acc, "beard": beard, "height": height, "wake": 7.0, "bed": 23.0,
            "out": "never", "on": True}


# people who work / play at the places: uid, place, name, look, job, hours, which days
NPCS = [
    dict(uid="n:teacher", f=3, name="王老师", job="teacher", hours=(7.8, 16.5), days="weekday",
         conf=P("adult", "bun", "#2b211c", "#f2efe6", "#4a4f63", "suit", "glasses", "#f8d8bf")),
    dict(uid="n:kid1", f=3, name="乐乐", job="pupil", hours=(7.8, 16.5), days="weekday",
         conf=P("kid", "short", "#3b2a22", "#5e9bd6", "#4a4f63", "shirt")),
    dict(uid="n:kid2", f=3, name="朵朵", job="pupil", hours=(7.8, 16.5), days="weekday",
         conf=P("kid", "pony", "#5a3a2a", "#f7b8cf", "#7b6fae", "dress", "bow")),
    dict(uid="n:kid3", f=3, name="豆豆", job="pupil", hours=(7.8, 16.5), days="weekday",
         conf=P("kid", "curly", "#2b211c", "#7bbf6a", "#4a4f63", "stripes", "none", "#e9c3a0")),
    dict(uid="n:jogger", f=4, name="跑步的叔叔", job="jogger", hours=(6.0, 20.5), days="all",
         conf=P("adult", "short", "#2b211c", "#e8473f", "#2f3a44", "shirt", "headphones", "#e9c3a0")),
    dict(uid="n:grandpa", f=4, name="李爷爷", job="grandpa", hours=(7.0, 18.0), days="all",
         conf=P("adult", "short", "#d8d8d8", "#8a6a4a", "#5a5a66", "suit", "glasses", "#f2cfb0", height=0.95)),
    dict(uid="n:walker", f=4, name="遛狗的阿姨", job="dogwalker", hours=(7.0, 20.0), days="all",
         conf=P("adult", "long", "#7a4a2a", "#7bbf6a", "#5a5f78", "hoodie")),
    dict(uid="n:parkkid", f=4, name="小石头", job="parkkid", hours=(9.0, 18.5), days="all",
         conf=P("kid", "short", "#2b211c", "#f2c94c", "#5e9bd6", "overalls", "hat", "#e9c3a0")),
    dict(uid="n:vendor", f=4, name="冰淇淋阿姨", job="vendor", hours=(10.0, 19.0), days="all",
         conf=P("adult", "bun", "#5a3a2a", "#f7b8cf", "#ffffff", "shirt", "none")),
    dict(uid="n:fisher", f=5, name="钓鱼的伯伯", job="fisher", hours=(6.0, 18.5), days="all",
         conf=P("adult", "short", "#9a9a9a", "#5f8f5a", "#4a4f63", "hoodie", "hat", "#e9c3a0", beard=True)),
    dict(uid="n:lakewalker", f=5, name="散步的姐姐", job="stroller", hours=(8.0, 19.5), days="all",
         conf=P("adult", "long", "#2b211c", "#b8a3ea", "#f2efe6", "dress")),
    dict(uid="n:cashier", f=6, name="收银员", job="cashier", hours=(8.0, 21.5), days="all",
         conf=P("adult", "pony", "#3b2a22", "#e8473f", "#2f3a44", "shirt")),
    dict(uid="n:petshop", f=6, name="宠物店老板", job="petshop", hours=(9.0, 20.5), days="all",
         conf=P("adult", "curly", "#7a4a2a", "#f29a3e", "#4a4f63", "overalls", "glasses")),
    dict(uid="n:barista", f=6, name="咖啡师", job="barista", hours=(8.0, 21.5), days="all",
         conf=P("adult", "short", "#2b211c", "#6b4a35", "#2f3a44", "suit", "none", "#f2cfb0")),
    dict(uid="n:shopper", f=6, name="买菜的奶奶", job="shopper", hours=(8.0, 19.0), days="all",
         conf=P("adult", "curly", "#e0e0e0", "#8a6a8a", "#4a4f63", "shirt", "none", "#f2cfb0", height=0.94)),
    dict(uid="n:cafe", f=6, name="喝咖啡的哥哥", job="cafe", hours=(9.0, 20.0), days="all",
         conf=P("adult", "short", "#3b2a22", "#3b8bd0", "#4a4f63", "hoodie", "headphones")),
    dict(uid="n:hiker1", f=7, name="登山的叔叔", job="hiker", hours=(7.0, 17.5), days="all",
         conf=P("adult", "short", "#2b211c", "#f29a3e", "#4a4f63", "hoodie", "hat", "#e9c3a0")),
    dict(uid="n:hiker2", f=7, name="登山的阿姨", job="hiker", hours=(7.5, 17.0), days="all",
         conf=P("adult", "pony", "#3b2a22", "#5fc3e4", "#4a4f63", "hoodie", "none")),
    dict(uid="n:camper", f=8, name="隔壁帐篷的大哥", job="camper", hours=(0.0, 24.0), days="all",
         conf=P("adult", "curly", "#2b211c", "#7bbf6a", "#5a4a3a", "hoodie", "none", "#e9c3a0", beard=True)),
]

JOB_NAMES = {"teacher": "老师", "pupil": "同学", "jogger": "晨跑的人", "grandpa": "常来公园的爷爷", "dogwalker": "遛狗的人",
             "parkkid": "公园里的小朋友", "vendor": "卖冰淇淋", "fisher": "钓鱼的人", "stroller": "散步的人", "cashier": "超市收银员",
             "petshop": "宠物店老板", "barista": "咖啡师", "shopper": "买东西的人", "cafe": "咖啡馆的客人", "hiker": "登山的人",
             "camper": "露营的人"}

PLACE_LINES = {
    "arrive": {3: ["到学校啦！", "早上好，王老师！"], 4: ["公园到啦～", "今天天气真好"], 5: ["湖边好凉快", "看，有鸭子！"],
               6: ["我们去逛逛", "先去超市还是先喝咖啡？"], 7: ["开始爬山咯！", "山上空气真好"], 8: ["到营地啦！", "今晚住帐篷！"]},
    "leave": ["该回家啦", "我们回家吧", "走咯，回家～"],
    "cat_cute": ["哇，好可爱的猫！", "这只猫好乖", "可以摸摸它吗？", "猫咪也出来玩呀"],
    "class_cat": ["哇，是猫！", "老师，有猫！", "猫咪也来上课啦"],
    "teacher_cat": ["上课不能带猫哦～", "嘘，小猫要安静听课", "好吧，就旁听一节课"],
    "bell": ["上课啦！", "下课啦！"],
    "slide": ["呜呼——", "再来一次！", "好快！"],
    "seesaw": ["你上去，我下来～", "哈哈哈！", "飞起来啦"],
    "icecream": ["要一个草莓味的！", "两个冰淇淋，谢谢", "好凉好甜"],
    "pigeons": ["鸽子快来吃～", "咕咕咕～", "慢慢吃"],
    "kite": ["风筝飞起来啦！", "再放高一点", "线别缠住了"],
    "fish": ["今天能钓到吗……", "嘘，别把鱼吓跑", "鱼儿快上钩"],
    "catch": ["钓到了！", "好大一条！", "哈哈，上钩了"],
    "row": ["划呀划～", "你划左边，我划右边", "船摇摇晃晃的"],
    "ducks": ["鸭子游过来了", "小鸭子跟着妈妈呢", "给你们吃面包"],
    "shop": ["要买牛奶", "这个打折诶", "再拿点水果", "猫粮快吃完了"],
    "pay": ["一共三十八块五", "要袋子吗？", "欢迎下次光临"],
    "pet_look": ["好可爱的小猫！", "小狗在摇尾巴", "我们家已经有两只啦"],
    "order": ["一杯拿铁，谢谢", "要一块蛋糕", "热可可，少糖"],
    "barista": ["您的拿铁～", "请慢用", "今天的蛋糕刚出炉"],
    "cafe": ["这家咖啡真好喝", "好舒服的下午", "猫咪在睡觉呢"],
    "hike": ["加油，快到了", "休息一下吧", "看那边的山！", "小心脚下"],
    "view": ["哇，能看到好远", "那边是不是我们家？", "云在脚下！"],
    "photo": ["茄子～", "来，拍一张！", "笑一个～"],
    "summit": ["登顶啦！", "我们做到了！"],
    "campfire": ["烤棉花糖咯～", "火好暖和", "讲个故事吧"],
    "stars": ["好多星星啊", "那是北斗七星", "流星！快许愿"],
    "tent": ["晚安，钻进睡袋咯", "帐篷里好暖和", "明天早上看日出"],
    "hammock": ["晃呀晃～", "好舒服", "躺一会儿"],
    "bars": ["看我挂得住！", "嘿——哟！"],
    "hoop": ["进了！", "差一点", "看我投篮！"],
    "class": ["这题我会！", "老师我知道！", "认真听讲～"],
    "teach": ["同学们，看黑板", "这道题谁会？", "大家跟我念"],
    "vending": ["来瓶汽水", "叮——出来了"],
}


def L(key, **fmt):
    pool = PLACE_LINES.get(key) or ["……"]
    s = random.choice(pool)
    try:
        return s.format(**fmt)
    except (KeyError, IndexError):
        return s


def weekday():
    return datetime.date.today().weekday() < 5


def in_hours(h, hours):
    a, b = hours
    return a <= h < b


class PlacesWorld:
    """World mixin: the places, their people, animals and boats, and the family's outings."""

    # ---- setup ----------------------------------------------------------------------------------------
    def init_places(self, make_item, make_person):
        self.place_items = []
        n = 0
        for f in PA.PLACE_IDS:
            for typ, x, y, rot in LAYOUTS.get(f, []):
                if typ not in H.CATALOG:
                    continue
                it = make_item(typ, f, x, y, rot)
                it.id = PLACE_ID0 + n
                it.place = True
                n += 1
                self.place_items.append(it)
        for it in self.place_items:
            if it.type == "tent" and it.x > 800:
                it.state["color"] = "#5e9bd6"
        self.items = [it for it in self.items if not getattr(it, "place", False)] + self.place_items
        self.place_navs = None
        self.npcs = []
        for d in NPCS:
            pr = make_person(dict(d["conf"]), d["name"])
            pr.uid = d["uid"]
            pr.npc = d
            pr.f = d["f"]
            pr.hidden = True
            pr.x, pr.y = PA.entry_in(d["f"])
            pr.set_state("idle", 1e9)
            self.npcs.append(pr)
        self.critters = []
        self.boats = [{"id": i, "f": 5, "x": x, "y": y, "dock": (x, y), "board": BOAT_BOARD[i], "riders": [],
                       "moving": False, "state": "dock", "u": 0.0, "face": 1, "ph": random.uniform(0, 6),
                       "col": ("#e46f5b", "#5e9bd6")[i]} for i, (x, y) in enumerate(BOAT_DOCKS)]
        self.outings = []
        self.next_outing = self.t + random.uniform(240, 600)
        self.bell = {"class": False, "next": 0.0}
        self.crit_t = 0.0

    def build_place_navs(self, nav_cls):
        if getattr(self, "place_navs", None) is None:
            self.place_navs = {f: nav_cls(f, self.items) for f in PA.PLACE_IDS}
        return self.place_navs

    # ---- queries --------------------------------------------------------------------------------------
    @staticmethod
    def is_place(f):
        return f in PA.PLACES

    @staticmethod
    def same_region(a, b):
        return a == b or (a not in PA.PLACES and b not in PA.PLACES)

    def at_home(self, a):
        return a.f not in PA.PLACES and getattr(a, "traveling", None) is None

    def people_at(self, f):
        return [p for p in self.people + self.npcs if p.f == f and not p.hidden and p.traveling is None]

    def family_at(self, f):
        return [p for p in self.people if p.f == f and p.traveling is None]

    def cats_at(self, f):
        return [c for c in self.cats if c.f == f and c.traveling is None]

    def out_people(self):
        return [p for p in self.people if p.f in PA.PLACES or p.traveling is not None]

    def where_text(self):
        """[(place f, text)] of who is out and where (for the chips over the house)."""
        out = {}
        for a in self.people + self.cats:
            f = a.traveling if a.traveling is not None else a.f
            if f in PA.PLACES or (a.traveling is not None and a.f in PA.PLACES):
                key = f if f in PA.PLACES else a.f
                out.setdefault(key, []).append(a)
        rows = []
        for f, ags in sorted(out.items()):
            names = "、".join(a.name for a in ags[:4]) + ("…" if len(ags) > 4 else "")
            moving = any(a.traveling is not None for a in ags)
            rows.append((f, "%s %s%s%s" % (PA.PLACES[f]["icon"], names, " 在路上 → " if moving else " · ",
                                            PA.PLACES[f]["name"])))
        return rows

    def guardian(self, c):
        g = getattr(c, "guardian", None)
        return self.agent_by_uid(g) if g else None

    def leashed(self, c):
        """The person holding this cat's leash right now (or None)."""
        g = self.guardian(c)
        if g is None or c.f not in PA.PLACES or c.traveling is not None or g.traveling is not None or g.f != c.f:
            return None
        if c.state == "carried" or getattr(c, "ride", None) is not None or getattr(c, "in_tent", None):
            return None
        if not PA.room_open(c.f, c.x, c.y):
            return None
        return g

    # ---- travel -----------------------------------------------------------------------------------------
    def on_travel_start(self, a, st):
        if a.is_cat or st.get("battle"):
            return
        for c in self.cats:
            if getattr(c, "guardian", None) == a.uid and c.traveling is None and c.state != "carried" and \
                    self.same_region(c.f, a.f):
                c.stop()
                c.release_spot()
                c.h = 0.0
                c.ride = None
                c.in_tent = None
                ox = random.choice((-22, 22))
                c.path = [dict(st, x=st["x"] + ox, y=st["y"] + 6, k=0.0, cat=True)]
                c.traveling = st["f"]
                c.set_state("idle", 1e9)
        held = self.held_cat(a) if hasattr(self, "held_cat") else None
        if held is not None:
            held.traveling = st["f"]

    def on_travel_end(self, a):
        if getattr(self, "battle", None) is not None and self.in_battle(a):
            return
        h = self.held_cat(a) if not a.is_cat else None
        if h is not None:
            h.traveling = None
            self.sync_carried(h, a)
        if a.f in PA.PLACES:
            if a.is_cat:
                a.set_state("idle", 0.6)
                return
            if getattr(a, "npc", None):
                return
            if getattr(a, "outing", None) is None or a.outing.get("f") != a.f:
                a.outing = {"f": a.f, "until": self.t + random.uniform(15, 25) * 60, "id": None}
            if random.random() < 0.6 and not a.bubble:
                a.say(random.choice(PLACE_LINES["arrive"].get(a.f, ["到啦"])), 2.2)
            a.set_state("idle", random.uniform(0.5, 2.0))
            a.act = "idle"
        else:
            # home again
            if a.is_cat:
                a.guardian = None
                a.set_state("idle", 1.0)
                return
            a.outing = None
            a.prop = None if a.prop in ("bag", "kite", "map", "icecream", "rod", "camera", "fish", "bread") else a.prop
            for c in self.cats:
                if c.f in (0, 1, 2) and c.free() and getattr(c, "guardian", None) is None and random.random() < 0.5:
                    c.act_rub(a)
                    break

    # ---- outings ------------------------------------------------------------------------------------------
    def outing_cfg(self):
        try:
            return self.app.cfg["house"].get("outings", "sometimes")
        except Exception:
            return "sometimes"

    def start_outing(self, f, people, cats=(), dur=None, why=None):
        """Send people (and cats, on the leash) to place f for dur seconds."""
        if f not in PA.PLACES:
            return False
        people = [p for p in people if p is not None and not p.is_cat and p.traveling is None and not p.away]
        if not people:
            return False
        dur = dur or random.uniform(18, 30) * 60
        oid = int(self.t * 1000) % 1000000
        rec = {"id": oid, "f": f, "until": self.t + dur, "why": why}
        self.outings.append(rec)
        self.outings = self.outings[-6:]
        for i, pr in enumerate(people):
            if pr.ctrl is not None and pr.f == f:
                continue
            pr.outing = dict(rec)
            pr.stop()
            if pr.state == "act":
                pr.end_act()
            pr.release_spot()
            pr.act = "outing"
            x, y = self.place_spawn(f, i)
            if not pr.go(f, x, y, 0, False, lambda pr=pr: (pr.set_state("idle", 1.0), setattr(pr, "act", "idle"))):
                pr.act = "idle"
                continue
            pr.set_state("idle", 1e9)
        holders = [p for p in people if p.role == "adult"] or people
        for i, c in enumerate(cats):
            if c is None or not c.is_cat or c.traveling is not None:
                continue
            g = holders[i % len(holders)]
            c.guardian = g.uid
            if self.same_region(c.f, g.f):
                if c.f not in PA.PLACES:
                    self.cat_follow(c, g, home=True)     # wait by the gate; they set off together
            else:
                self.cat_follow(c, g)
        lead = people[0]
        if random.random() < 0.8:
            names = "、".join(p.name for p in people[:3])
            cn = "、".join(c.name for c in cats if c is not None)
            if lead.f not in PA.PLACES:
                lead.say("我们去%s啦～" % PA.PLACES[f]["name"] if len(people) > 1 or cats else "我去%s一趟～" %
                         PA.PLACES[f]["name"], 2.4)
            self.play.banner = {"text": "%s%s出门去%s啦" % (names, ("带着" + cn) if cn else "", PA.PLACES[f]["name"]),
                                "until": self.t + 3.5}
        self.sfx("door", 2)
        return True

    def place_spawn(self, f, i=0):
        gx, gy = PA.entry_in(f)
        nav = self.nav[f]
        for k in range(12):
            x = gx + ((i * 37 + k * 23) % 140) - 70
            y = gy + 20 + ((i * 17 + k * 29) % 70)
            if nav.ok_at(x, y):
                return x, y
        return gx, gy + 20

    def go_home(self, pr, dest=None):
        """Head home from a place (by way of the garden gate)."""
        if pr.f not in PA.PLACES or pr.traveling is not None:
            return False
        pr.stop()
        if pr.state == "act":
            pr.end_act()
        pr.release_spot()
        self.leave_ride(pr)
        if getattr(pr, "in_tent", None):
            pr.in_tent = None
        pr.act = "going_home"
        pr.outing = None
        if dest is None:
            x, y = self.random_floor(2) if self.outdoor_ok() else self.random_floor(0)
            dest = (2 if self.outdoor_ok() else 0, x, y)
        f, x, y = dest
        ok = pr.go(f, x, y, 0, False, lambda: (pr.set_state("idle", 1.0), setattr(pr, "act", "idle")))
        if not ok:
            pr.act = "idle"
        pr.set_state("idle", 1e9)
        return ok

    def send_all_home(self, f):
        n = 0
        for pr in self.family_at(f):
            if pr.ctrl is None and self.go_home(pr):
                n += 1
        if n and random.random() < 0.8:
            ps = self.family_at(f)
            if ps:
                ps[0].say(L("leave"), 2.0)
        return n

    def cat_follow(self, c, g, home=False):
        """A cat on its way to its person (at home: to the garden gate, where they set off together)."""
        if c.state == "carried" or c.ctrl is not None:
            return False
        c.interrupt()
        c.release_spot()
        if home:
            x, y = H.GATE_IN[0] + random.choice((-1, 1)) * random.uniform(60, 110), H.GATE_IN[1] + random.uniform(16, 50)
            if not self.nav[2].ok_at(x, y):
                x, y = self.stand_near(2, H.GATE_IN[0] + 80, H.GATE_IN[1] + 40)
            return c.go(2, x, y, 0, True, lambda: c.set_state("rest", 60, pose="sit", waiting=True))
        x, y = c.near_point(g, 34)
        return c.go(g.f, x, y, 0, math.hypot(g.x - c.x, g.y - c.y) > 160,
                    lambda: c.set_state("rest", random.uniform(3, 8), pose=random.choice(("sit", "stand", "loaf"))))

    def step_outings(self, dt):
        if self.remote:
            return
        # people at a place whose time is up go home (an outing with the cats ends for everyone together)
        for pr in self.people:
            o = getattr(pr, "outing", None)
            if pr.f not in PA.PLACES or pr.traveling is not None or pr.ctrl is not None:
                continue
            if o is None:
                pr.outing = {"f": pr.f, "until": self.t + 15 * 60, "id": None}
                continue
            if self.t > o["until"] and pr.state != "act" or self.t > o["until"] + 240:
                if getattr(pr, "ride", None) is not None:
                    continue
                if getattr(pr, "school_kid", False) and not self.pickup_ready(pr):
                    continue
                self.go_home(pr)
        # nobody may be left standing about with nothing to do (an errand cut short on the way)
        for pr in self.people + self.npcs:
            if pr.ctrl is None and not pr.path and pr.traveling is None and pr.state == "idle" and pr.timer > 1e8 \
                    and (pr.act in ("outing", "going_home", "idle", "tag", "kite", "jog", "hike") or pr.act.startswith("going:")):
                o = pr.outing
                if o is not None and o.get("f") in PA.PLACES and pr.f != o["f"] and pr.act == "outing":
                    x, y = self.place_spawn(o["f"])
                    if pr.go(o["f"], x, y, 0, False, lambda pr=pr: (pr.set_state("idle", 1.0), setattr(pr, "act", "idle"))):
                        continue
                pr.act = "idle"
                pr.set_state("idle", random.uniform(0.5, 2))
        # cats waiting at the gate for a person who never came: back inside
        for c in self.cats:
            g = self.guardian(c)
            if g is None:
                continue
            if g.f not in PA.PLACES and g.traveling is None and c.f not in PA.PLACES and c.traveling is None and \
                    getattr(g, "outing", None) is None:
                c.guardian = None
        self.auto_outings()

    def pickup_ready(self, kid):
        """A pupil goes home once a grown-up from home has come to fetch them (or after a long wait)."""
        if self.t > kid.outing["until"] + 600:
            kid.school_kid = False
            return True
        adults = [p for p in self.family_at(kid.f) if p.role == "adult"]
        if adults:
            kid.school_kid = False
            for a in adults:
                a.outing = dict(kid.outing, until=self.t)
            return True
        if not kid.outing.get("fetch"):
            kid.outing["fetch"] = True
            home = [p for p in self.present_people() if p.role == "adult" and p.ctrl is None and p.act != "sleep"]
            if home:
                ad = random.choice(home)
                self.start_outing(kid.f, [ad], dur=4 * 60, why="pickup")
                ad.say("我去接%s放学～" % kid.name, 2.2)
        return False

    def auto_outings(self):
        if self.t < self.next_outing:
            return
        freq = self.outing_cfg()
        gap = {"often": (300, 900), "sometimes": (900, 2400), "rare": (2400, 5400)}.get(freq)
        if gap is None:
            self.next_outing = self.t + 600
            return
        self.next_outing = self.t + random.uniform(*gap)
        if self.out_people() or self.play.game:
            return
        h = self.hour()
        wx = self.weather()
        wet = wx in ("rain", "snow")
        we = not weekday()
        se = H.season()
        home = [p for p in self.present_people() if p.ctrl is None and p.act not in ("sleep", "going_out", "return")
                and not p.asleep_at(h)]
        adults = [p for p in home if p.role == "adult" and p.P.get("out", "sometimes") != "never"]
        kids = [p for p in home if p.role == "kid"]
        if not adults:
            return
        cats = [c for c in self.cats if c.ctrl is None and c.state != "carried" and c.f in (0, 1, 2)]
        plans = []
        if not wet and (16.5 <= h < 19.5 or (we and 9 <= h < 17)):
            plans.append((3.0, "park"))
        if not wet and 10 <= h < 16 and (we or random.random() < 0.3):
            plans.append((2.0, "lake"))
        if 9 <= h < 20:
            plans.append((2.0, "street"))
        if weekday() and 7.6 <= h < 9.2 and kids:
            plans.append((2.5, "school"))
        if not wet and we and 8 <= h < 13:
            plans.append((1.0, "mountain"))
        if not wet and se != "winter" and datetime.date.today().weekday() in (4, 5) and 15 <= h < 18:
            plans.append((0.8, "camp"))
        if not plans:
            return
        tot = sum(w for w, _ in plans)
        r = random.uniform(0, tot)
        for w, name in plans:
            r -= w
            if r <= 0:
                break
        f = PA.PLACE_BY_KEY[name]
        if name == "park":
            ppl = [random.choice(adults)] + ([random.choice(kids)] if kids and random.random() < 0.6 else [])
            cs = [c for c in cats if random.random() < 0.5]
            dur = random.uniform(15, 25) * 60
        elif name == "lake":
            ppl = adults + kids
            cs = [c for c in cats if random.random() < 0.7]
            dur = random.uniform(30, 50) * 60
        elif name == "street":
            ppl = [random.choice(adults)] + ([random.choice(kids)] if kids and random.random() < 0.4 else [])
            cs = [c for c in cats if random.random() < 0.25]
            dur = random.uniform(15, 25) * 60
        elif name == "school":
            kid = random.choice(kids)
            esc = random.choice(adults)
            kid.school_kid = True
            self.start_outing(f, [kid], dur=random.uniform(60, 120) * 60, why="school")
            self.start_outing(f, [esc], dur=3 * 60, why="escort")
            return
        elif name == "mountain":
            ppl = adults + kids
            cs = [c for c in cats if random.random() < 0.6]
            dur = random.uniform(40, 60) * 60
        else:
            ppl = adults + kids
            cs = list(cats)
            tomorrow9 = (24 - h) + 9
            dur = tomorrow9 * 3600
        self.start_outing(f, ppl, cs, dur, why=name)

    # ---- the step --------------------------------------------------------------------------------------------
    def step_places(self, dt):
        if self.remote:
            self.step_critters(dt, remote=True)
            return
        h = self.hour()
        dark = H.is_dark(h)
        self.step_npc_presence(h)
        self.step_school_bell(h)
        self.step_boats(dt)
        self.step_rides()
        self.step_anims(dt)
        self.step_leashes(dt)
        self.step_critters(dt)
        self.step_outings(dt)
        for it in self.place_items:
            if it.type == "lantern_pole":
                it.state["on"] = dark
            elif it.type == "campfire":
                it.state["on"] = dark or h >= 17 or any(p.act == "campfire" for p in self.people_at(8))
            elif it.type == "tent":
                inside = [a for a in self.people + self.npcs + self.cats if getattr(a, "in_tent", None) == it.id]
                it.state["closed"] = bool(inside)
                it.state["zz"] = bool(inside) and any(getattr(a, "act", "") == "sleep" for a in inside if not a.is_cat)
                it.state["glow"] = bool(inside) and dark
            elif it.type == "seesaw":
                riders = [p for p in self.people_at(it.f) if p.act == "seesaw" and p.state == "act" and p.spot
                          and p.spot[0] == it.id and not p.path]
                target = 1.0 if len(riders) >= 2 else 0.0
                a = it.state.get("tilt_amp", 0.0)
                it.state["tilt_amp"] = a + (target - a) * min(1.0, dt * 1.5)
                tilt = PA.seesaw_tilt(it, self.t)
                for p in riders:
                    sp = it.spot(p.spot[1])
                    p.h = max(0.0, 14 + 12 * tilt * (-1 if sp["x"] < it.x else 1))
                    p.seat = p.h

    def step_npc_presence(self, h):
        we = not weekday()
        for n in self.npcs:
            d = n.npc
            ok = in_hours(h, d["hours"]) and (d["days"] == "all" or not we)
            if d["job"] in ("jogger", "dogwalker", "parkkid", "grandpa", "stroller", "hiker", "vendor") and \
                    self.weather() in ("rain", "snow"):
                ok = False
            if d["job"] == "vendor" and H.season() == "winter":
                ok = False
            if ok and n.hidden:
                n.hidden = False
                n.f = d["f"]
                n.x, n.y = self.place_spawn(d["f"], hash(n.uid) % 7)
                n.h = 0.0
                n.act = "idle"
                n.set_state("idle", random.uniform(0.5, 3))
                if d["job"] == "dogwalker":
                    self.critters.append({"k": "dog", "f": d["f"], "x": n.x + 30, "y": n.y, "vx": 0, "vy": 0,
                                          "owner": n.uid, "ph": 0.0, "st": "walk", "col": "#c99b6a"})
            elif not ok and not n.hidden and n.state != "act" or (not ok and not n.hidden and n.st_t > 600):
                if n.f == d["f"] and not n.path:
                    n.release_spot()
                    n.end_act() if n.state == "act" else None
                    n.hidden = True
                    n.release_spot()
                    if getattr(n, "in_tent", None):
                        n.in_tent = None
                    self.critters = [c for c in self.critters if c.get("owner") != n.uid]

    def step_school_bell(self, h):
        b = self.bell
        if self.t < b["next"]:
            return
        b["class"] = not b["class"]
        b["next"] = self.t + (240 if b["class"] else 150)
        if not (8 <= h < 16.5) or not weekday():
            b["class"] = False
            return
        if any(not n.hidden for n in self.npcs if n.npc["f"] == 3) or self.family_at(3):
            self.sfx("chime", 1)
            t = next((n for n in self.npcs if n.uid == "n:teacher" and not n.hidden), None)
            if t is not None:
                t.say(PLACE_LINES["bell"][0 if b["class"] else 1], 2.0)
            for p in self.people_at(3):
                if p.ctrl is None and p.state == "act" and p.act in ("class", "bars", "hoop", "tag", "teach"):
                    p.timer = min(p.timer, 0.4)

    # ---- the boats ----------------------------------------------------------------------------------------
    def free_boat(self):
        for b in self.boats:
            if b["state"] == "dock" and not b["riders"]:
                return b
        return None

    def board(self, b, a):
        if a.uid in b["riders"] or len([u for u in b["riders"] if not u.startswith("c:") and
                                        not (self.agent_by_uid(u) or a).is_cat]) >= 2 and not a.is_cat:
            return False
        a.stop()
        a.release_spot()
        b["riders"].append(a.uid)
        a.ride = b["id"]
        if a.is_cat:
            a.set_state("rest", 1e9, pose="sit")
        else:
            a.act = "row"
            a.pose, a.prop, a.view = "sit", None, "side"
            a.set_state("act", 1e9)
        self.sync_rider(b, a)
        return True

    def leave_ride(self, a):
        bid = getattr(a, "ride", None)
        if bid is None:
            return
        b = self.boats[bid]
        if a.uid in b["riders"]:
            b["riders"].remove(a.uid)
        a.ride = None
        a.h = 0.0
        a.seat = 0.0
        bx, by = b["board"]
        a.f, a.x, a.y = 5, bx + random.uniform(0, 30), by + random.uniform(-14, 14)
        if not a.is_cat:
            a.pose = "stand"

    def sync_rider(self, b, a):
        i = b["riders"].index(a.uid) if a.uid in b["riders"] else 0
        people = [u for u in b["riders"] if not (self.agent_by_uid(u) is not None and self.agent_by_uid(u).is_cat)]
        if a.is_cat:
            off = 30
        else:
            off = -16 if people and people[0] == a.uid else 12
        a.f = 5
        a.x, a.y = b["x"] + off * b.get("face", 1), b["y"] + 1
        a.h = 6.0 if not a.is_cat else 8.0
        if not a.is_cat:
            a.seat = 6.0
            a.facing = b.get("face", 1)

    def step_rides(self):
        for b in self.boats:
            for u in list(b["riders"]):
                a = self.agent_by_uid(u)
                if a is None or getattr(a, "ride", None) != b["id"]:
                    b["riders"].remove(u)
                    continue
                self.sync_rider(b, a)

    def start_rowing(self, pr):
        """Take a boat out (with whoever else from the family is at the lake and free, and their cats)."""
        b = self.free_boat()
        if b is None or H.season() == "winter":
            return False
        bx, by = b["board"]
        pr.release_spot()
        pr.act = "going:row"
        mates = [p for p in self.family_at(5) if p is not pr and p.ctrl is None and p.state != "act" and
                 getattr(p, "ride", None) is None and random.random() < 0.7][:1]

        def arrive(p=pr):
            if b["state"] != "dock":
                p.act = "idle"
                p.set_state("idle", 1)
                return
            self.board(b, p)
            p.say(L("row"), 2.0)
            for c in self.cats:
                if getattr(c, "guardian", None) == p.uid and c.f == 5 and c.traveling is None and c.ctrl is None:
                    self.board(b, c)
            b["wait"] = self.t + (8 if mates else 1.5)
        if not pr.go(5, bx, by, 0, False, arrive):
            pr.act = "idle"
            return False
        pr.set_state("idle", 1e9)
        for m in mates:
            m.release_spot()
            m.act = "going:row"

            def arrive_m(m=m):
                if b["state"] == "dock":
                    self.board(b, m)
                    for c in self.cats:
                        if getattr(c, "guardian", None) == m.uid and c.f == 5 and c.ctrl is None:
                            self.board(b, c)
                else:
                    m.act = "idle"
                    m.set_state("idle", 1)
            if m.go(5, bx + 20, by, 0, False, arrive_m):
                m.set_state("idle", 1e9)
        return True

    def step_boats(self, dt):
        cx, cy, rx, ry = BOAT_LOOP
        for b in self.boats:
            riders = [self.agent_by_uid(u) for u in b["riders"]]
            people = [a for a in riders if a is not None and not a.is_cat]
            if b["state"] == "dock":
                b["moving"] = False
                if people and self.t > b.get("wait", 0):
                    b["state"] = "out"
                    b["u"] = 0.0
                    b["start"] = (b["x"], b["y"])
                    b["laps"] = random.uniform(0.8, 1.3)
                    b["phase0"] = math.atan2((b["y"] - cy) / ry, (b["x"] - cx) / rx)
            elif b["state"] in ("out", "back"):
                b["moving"] = True
                if b["state"] == "out":
                    b["u"] += dt / 70.0
                    a = b["phase0"] + b["u"] * math.tau
                    tx, ty = cx + math.cos(a) * rx, cy + math.sin(a) * ry
                    k = min(1.0, b["u"] * 8)
                    nx = b["start"][0] + (tx - b["start"][0]) * k
                    ny = b["start"][1] + (ty - b["start"][1]) * k
                    if b["u"] >= b["laps"]:
                        b["state"] = "back"
                        if people and random.random() < 0.6:
                            people[0].say("回去吧～", 1.6)
                else:
                    dx, dy = b["dock"][0] - b["x"], b["dock"][1] - b["y"]
                    d = math.hypot(dx, dy)
                    v = 34 * dt
                    if d <= v:
                        nx, ny = b["dock"]
                        b["state"] = "dock"
                        b["moving"] = False
                        for a in riders:
                            if a is not None:
                                self.leave_ride(a)
                                if not a.is_cat:
                                    a.act = "idle"
                                    a.set_state("idle", random.uniform(1, 3))
                                else:
                                    a.set_state("idle", 1.0)
                        b["riders"] = []
                    else:
                        nx, ny = b["x"] + dx / d * v, b["y"] + dy / d * v
                if abs(nx - b["x"]) > 0.05:
                    b["face"] = 1 if nx > b["x"] else -1
                b["x"], b["y"] = nx, ny
                if people and random.random() < dt / 25.0:
                    random.choice(people).say(L("row"), 2.0)

    # ---- little animations at the places (slide, bars, tag ...) ----------------------------------------------
    def step_anims(self, dt):
        for p in self.people + self.npcs:
            an = getattr(p, "anim", None)
            if an is None:
                continue
            if p.f not in PA.PLACES or p.path or p.state != "act":
                p.anim = None
                continue
            an["t"] += dt
            kind = an["kind"]
            if kind == "slide":
                it = self.item_by_id(an["item"])
                if it is None:
                    p.anim = None
                    continue
                t = an["t"]
                if t < 2.2:                       # up the ladder
                    k = t / 2.2
                    p.x, p.y, p.h = it.x - 84 + 22 * k, it.y + 1, 62 * k
                    p.pose, p.view, p.facing, p.seat = "walk", "side", 1, 0.0
                elif t < 2.8:                     # sit down at the top
                    p.x, p.y, p.h = it.x - 44, it.y + 1, 62
                    p.pose, p.view, p.seat = "sit", "side", 62
                elif t < 3.9:                     # whee
                    k = (t - 2.8) / 1.1
                    u = 98 * k ** 1.4
                    p.x, p.y = it.x - 32 + u, it.y + 1
                    p.h = max(4.0, 62 - 0.62 * u * (1.1 if u < 78 else 1.0))
                    p.seat = p.h
                    if not an.get("said"):
                        an["said"] = True
                        p.say(L("slide"), 1.4)
                elif t < 4.4:
                    p.h, p.seat = 0.0, 0.0
                    p.pose, p.view = "stand", "front"
                    p.x = it.x + 82
                else:
                    an["n"] = an.get("n", 0) + 1
                    if an["n"] < an.get("times", 2):
                        an["t"] = 0.0
                        an["said"] = False
                        p.anim = None
                        sp = it.spot(0)
                        p.go(it.f, sp["x"], sp["y"], 0, True, lambda p=p, an=an: setattr(p, "anim", an))
                    else:
                        p.anim = None
                        p.end_act()
            elif kind == "bars":
                p.h = 18 + 2 * math.sin(an["t"] * 3)
                p.pose = "reach" if int(an["t"] * 1.5) % 2 == 0 else "stretch"
                p.view = "front"
            elif kind == "hoop":
                ph = an["t"] % 3.0
                p.pose = "reach" if ph < 0.6 else "stand"
                p.prop = None if 0.6 < ph < 2.4 else "ball"
                if ph < dt and an["t"] > 1 and random.random() < 0.4:
                    p.say(L("hoop"), 1.4)
                an["ball"] = ph
            elif kind == "fish":
                if self.t > an.get("next", 0):
                    an["next"] = self.t + random.uniform(18, 45)
                    if random.random() < 0.45:
                        p.prop = "fish"
                        p.pose = "reach"
                        p.say(L("catch"), 2.0)
                        self.sfx("splash", 2)
                        an["show"] = self.t + 3.0
                        self.fish_for_cat(p)
                elif an.get("show") and self.t > an["show"]:
                    an["show"] = None
                    p.prop = "rod"
                    p.pose = "sit"
            elif kind == "kite":
                if not p.path and self.t > an.get("next", 0):
                    an["next"] = self.t + random.uniform(4, 9)
                    x, y = self.random_floor(p.f)
                    p.go(p.f, x, y, 0, False, None)
                    p.anim = an
                    p.act = "kite"
                    p.set_state("act", max(1.0, p.timer))

    def fish_for_cat(self, p):
        """A fish just caught: a cat nearby gets a treat out of it."""
        for c in self.cats_at(p.f):
            if math.hypot(c.x - p.x, c.y - p.y) < 160 and c.ctrl is None and c.state != "carried" and \
                    getattr(c, "ride", None) is None:
                c.say(random.choice(["鱼！是鱼！", "喵喵喵！给我！", "（眼睛放光）"]), 2.0)
                c.spawn("heart", 2)
                c.src.stats["mood"] = min(100.0, c.src.stats["mood"] + 8)
                c.src.stats["hunger"] = max(0.0, c.src.stats["hunger"] - 10)
                return True
        return False

    # ---- the leash ----------------------------------------------------------------------------------------
    def step_leashes(self, dt):
        for c in self.cats:
            g = self.leashed(c)
            if g is None:
                continue
            d = math.hypot(c.x - g.x, c.y - g.y)
            if d > LEASH + 30 and c.ctrl is not None:
                # a player cat can't run off: it is held back
                k = (d - (LEASH + 30)) / d
                nx, ny = c.x + (g.x - c.x) * k, c.y + (g.y - c.y) * k
                if self.nav[c.f].ok_at(nx, ny):
                    c.x, c.y = nx, ny
                if random.random() < dt * 0.5:
                    c.say("（被绳子拉住了）", 1.2)
            elif d > LEASH and c.ctrl is None and not c.path and c.state not in ("carried",):
                self.cat_follow(c, g)
            elif d > LEASH * 2.2 and c.ctrl is None:
                c.stop()
                self.cat_follow(c, g)

    # ---- critters ----------------------------------------------------------------------------------------
    def step_critters(self, dt, remote=False):
        if remote:
            for c in self.critters:
                c["ph"] = c.get("ph", 0.0) + dt
                if c["k"] == "fish_jump":
                    c["u"] = c.get("u", 0.0) + dt / 1.2
            return
        self.crit_t += dt
        h = self.hour()
        dark = H.is_dark(h)
        wet = self.weather() in ("rain", "snow")
        se = H.season()
        want = {4: {"pigeon": 0 if (dark or wet) else 6, "butterfly": 2 if (se in ("spring", "summer") and not dark
                                                                          and not wet) else 0},
                5: {"duck": 0 if se == "winter" or dark else 4, "swan": 0 if se == "winter" or dark else 2,
                    "dragonfly": 2 if se == "summer" and not dark else 0},
                6: {"pigeon": 0 if (dark or wet) else 3},
                7: {"squirrel": 0 if (dark or wet) else 2, "hawk": 0 if (dark or wet) else 1,
                    "butterfly": 1 if se in ("spring", "summer") and not dark else 0},
                8: {"firefly": 9 if dark and se in ("summer", "spring", "autumn") else 0,
                    "rabbit": 1 if not dark and not wet else 0},
                3: {"sparrow": 0 if (dark or wet) else 3}}
        # only bother with the places someone could see (or that someone is at)
        for f, kinds in want.items():
            for k, n in kinds.items():
                have = [c for c in self.critters if c["f"] == f and c["k"] == k]
                if len(have) < n and random.random() < dt * 0.5:
                    self.critters.append(self.new_critter(f, k))
                elif len(have) > n:
                    c = have[0]
                    if k in ("pigeon", "sparrow") and c.get("st") != "fly":
                        c["st"] = "fly"
                        c["vz"] = 40
                    elif k not in ("pigeon", "sparrow"):
                        self.critters.remove(c)
        if (5 in want) and se != "winter" and random.random() < dt / 9.0 and not dark:
            x, y = random.uniform(80, 760), random.uniform(220, 460)
            self.critters.append({"k": "fish_jump", "f": 5, "x": x, "y": y, "u": -0.2, "ph": 0.0,
                                  "face": random.choice((-1, 1))})
        out = []
        for c in self.critters:
            if self.step_critter(c, dt):
                out.append(c)
        self.critters = out

    def new_critter(self, f, k):
        nav = self.nav[f]
        if k in ("duck", "swan"):
            x, y = random.uniform(80, 760), random.uniform(230, 450)
        elif k == "hawk":
            x, y = random.uniform(700, 1200), 470
        elif k == "firefly":
            x, y = random.uniform(40, 1220), random.uniform(20, 460)
        elif k in ("butterfly", "dragonfly"):
            x, y = self.random_floor(f)
        else:
            x, y = self.random_open(f)
        c = {"k": k, "f": f, "x": x, "y": y, "z": 0.0, "vx": 0.0, "vy": 0.0, "ph": random.uniform(0, 10),
             "st": "idle", "t": 0.0, "home": (x, y)}
        if k == "duckling":
            c["follow"] = True
        if k in ("butterfly", "firefly", "dragonfly"):
            c["z"] = random.uniform(16, 50)
            c["col"] = random.choice(("#f6c66b", "#f2a0b3", "#9fd2ee", "#ffffff"))
        if k == "hawk":
            c["z"] = 150
        if k in ("pigeon", "sparrow"):
            c["st"] = "land"
            c["z"] = 80
        return c

    def random_open(self, f):
        nav = self.nav[f]
        for _ in range(30):
            x, y = self.random_floor(f)
            if PA.room_open(f, x, y):
                return x, y
        return PA.entry_in(f)

    def step_critter(self, c, dt):
        """Move one little animal; False when it is gone."""
        k = c["k"]
        c["ph"] = c.get("ph", 0.0) + dt
        c["t"] = c.get("t", 0.0) + dt
        f = c["f"]
        if k == "fish_jump":
            c["u"] += dt / 1.2
            return c["u"] < 1.3
        if k in ("pigeon", "sparrow"):
            st = c.get("st")
            if st == "land":
                c["z"] = max(0.0, c["z"] - 60 * dt)
                c["x"] += c.get("vx", 0) * dt
                if c["z"] <= 0:
                    c["st"] = "idle"
                return True
            if st == "fly":
                c["z"] += c.get("vz", 50) * dt
                c["x"] += (c.get("vx") or 60) * dt
                if not c.get("vx"):
                    c["vx"] = random.choice((-80, 80))
                return c["z"] < 220
            # walking about and pecking; scared off by a running cat, drawn to breadcrumbs
            threat = None
            for a in self.agents():
                if a.f == f and a.traveling is None and math.hypot(a.x - c["x"], a.y - c["y"]) < (70 if a.is_cat else 34):
                    if a.is_cat or a.pose == "run":
                        threat = a
                        break
            if threat is not None:
                c["st"] = "fly"
                c["vz"] = 70
                c["vx"] = 90 if c["x"] > threat.x else -90
                self.later(random.uniform(8, 20), lambda c=c: self._reland(c))
                if threat.is_cat and random.random() < 0.3:
                    threat.say(random.choice(["咔咔咔……", "鸟！", "（尾巴甩来甩去）"]), 1.6)
                return True
            feeder = next((p for p in self.people_at(f) if p.act in ("pigeons", "ducks") and p.state == "act" and
                           not p.path), None)
            if feeder is not None:
                tx, ty = feeder.x + c["ph"] % 40 - 20, feeder.y - 30 + (c["ph"] * 7) % 20
                speed = 40
            else:
                if c["t"] > c.get("next", 0):
                    c["next"] = c["t"] + random.uniform(1.5, 5)
                    c["tx"], c["ty"] = c["x"] + random.uniform(-40, 40), c["y"] + random.uniform(-25, 25)
                tx, ty = c.get("tx", c["x"]), c.get("ty", c["y"])
                speed = 22
            self._walk_critter(c, tx, ty, speed, dt)
            return True
        if k in ("duck", "swan", "duckling"):
            # swim around the lake; come over to someone feeding them
            feeder = next((p for p in self.people_at(f) if p.act == "ducks" and p.state == "act" and not p.path), None)
            if feeder is not None:
                tx, ty = feeder.x + (c["ph"] * 13) % 80 - 40, 210 + (c["ph"] * 5) % 30
            else:
                if c["t"] > c.get("next", 0):
                    c["next"] = c["t"] + random.uniform(4, 10)
                    c["tx"], c["ty"] = random.uniform(80, 760), random.uniform(220, 460)
                tx, ty = c.get("tx", c["x"]), c.get("ty", c["y"])
            dx, dy = tx - c["x"], ty - c["y"]
            d = math.hypot(dx, dy)
            v = (14 if k == "swan" else 18) * dt
            if d > v:
                c["x"] += dx / d * v
                c["y"] += dy / d * v
                c["vx"] = dx
            for b in self.boats:
                if b["moving"] and math.hypot(b["x"] - c["x"], b["y"] - c["y"]) < 50:
                    c["tx"], c["ty"] = c["x"] + (c["x"] - b["x"]) * 2, c["y"] + (c["y"] - b["y"]) * 2
            c["x"] = min(max(c["x"], 40), 1220)
            c["y"] = min(max(c["y"], 205), 470)
            if 770 < c["x"] < 890 and c["y"] < 445:
                c["x"] = 760 if c["x"] < 830 else 900
            return True
        if k in ("butterfly", "dragonfly", "firefly"):
            if c["t"] > c.get("next", 0):
                c["next"] = c["t"] + random.uniform(1, 3)
                c["vx"], c["vy"] = random.uniform(-40, 40), random.uniform(-30, 30)
            c["x"] = min(max(c["x"] + c["vx"] * dt, 20), H.PW - 20)
            c["y"] = min(max(c["y"] + c["vy"] * dt, 10), H.PD_PLACE - 10)
            c["z"] = (20 if k != "firefly" else 30) + 14 * math.sin(c["ph"] * 1.3)
            return True
        if k == "hawk":
            a = c["ph"] * 0.25
            c["x"] = 950 + math.cos(a) * 220
            c["y"] = 470
            c["z"] = 170 + 20 * math.sin(a * 2)
            c["vx"] = -math.sin(a)
            return True
        if k in ("squirrel", "rabbit"):
            near = any(a.is_cat and a.f == f and math.hypot(a.x - c["x"], a.y - c["y"]) < 110 for a in self.cats)
            if near and c.get("st") != "run":
                c["st"] = "run" if k == "squirrel" else "hop"
                c["tx"], c["ty"] = self.random_floor(f)
            elif c["t"] > c.get("next", 0):
                c["next"] = c["t"] + random.uniform(3, 8)
                c["st"] = random.choice(("idle", "idle", "run" if k == "squirrel" else "hop"))
                c["tx"], c["ty"] = c["x"] + random.uniform(-90, 90), c["y"] + random.uniform(-60, 60)
            if c.get("st") in ("run", "hop"):
                if not self._walk_critter(c, c.get("tx", c["x"]), c.get("ty", c["y"]), 90 if near else 50, dt):
                    c["st"] = "idle"
            return True
        if k == "dog":
            o = self.agent_by_uid(c.get("owner"))
            if o is None or o.hidden:
                return False
            tx, ty = o.x + 34 * o.facing, o.y - 6
            moved = self._walk_critter(c, tx, ty, 70, dt)
            c["st"] = "walk" if moved else "idle"
            for cat in self.cats:
                if cat.f == f and math.hypot(cat.x - c["x"], cat.y - c["y"]) < 90 and random.random() < dt * 0.4 and \
                        cat.ctrl is None and cat.state not in ("carried",):
                    o.say("汪汪！别怕，它不咬猫～", 2.0)
                    cat.set_state("rest", 3, pose="arch")
                    cat.say("哈——！", 1.4)
            return True
        return True

    def _reland(self, c):
        if c in self.critters:
            x, y = self.random_open(c["f"])
            c.update(st="land", z=80, x=x, y=y, vx=0)

    def _walk_critter(self, c, tx, ty, speed, dt):
        dx, dy = tx - c["x"], ty - c["y"]
        d = math.hypot(dx, dy)
        if d < 2:
            return False
        v = min(d, speed * dt)
        nx, ny = c["x"] + dx / d * v, c["y"] + dy / d * v
        if self.nav[c["f"]].ok_at(nx, ny) and (c["k"] not in ("pigeon", "sparrow") or PA.room_open(c["f"], nx, ny)):
            c["x"], c["y"] = nx, ny
            c["vx"] = dx
            return True
        c["tx"], c["ty"] = c["x"], c["y"]
        return False

    # ---- what people do at the places ------------------------------------------------------------------------
    def spot_at(self, pr, types, kinds, near=None):
        """A free person spot of one of these item types at the person's place."""
        if isinstance(kinds, str):
            kinds = (kinds,)
        best = []
        for it in self.place_items:
            if it.f != pr.f or it.type not in types:
                continue
            for idx, sp in it.spots():
                if sp["who"] != "person" or sp["kind"] not in kinds:
                    continue
                if sp.get("kid") and pr.role != "kid":
                    continue
                key = (it.id, idx)
                occ = self.occupied.get(key)
                if occ is not None and occ is not pr:
                    continue
                d = math.hypot(sp["x"] - pr.x, sp["y"] - pr.y) if near is None else \
                    math.hypot(sp["x"] - near[0], sp["y"] - near[1])
                best.append((d * 0.004 + random.random(), key, sp))
        if not best:
            return None, None
        best.sort(key=lambda b: b[0])
        return best[0][1], best[0][2]

    def place_do(self, pr, types, kinds, act, dur, pose, prop=None, line=None, then=None, h=None, view=None):
        key, sp = self.spot_at(pr, types, kinds)
        if key is None:
            return False
        pr.claim(key)
        pr.act = "going:" + act

        def arrive():
            pr.act = act
            pr.pose, pr.prop = pose, prop
            seated = pose in ("sit", "doze", "eat", "work")
            pr.seat = sp["h"] if seated else 0.0
            pr.h = sp["h"] if (seated or pose == "sleep") else (h or 0.0)
            pr.x, pr.y = sp["x"], sp["y"]
            fx, fy = sp["fx"], sp["fy"]
            pr.view = view or ("front" if fy < -0.5 else ("back" if fy > 0.5 else "side"))
            from .house import screen_facing
            pr.facing = screen_facing(fx, fy, pr.facing)
            pr.set_state("act", dur)
            if line and random.random() < 0.7:
                pr.say(L(line), 2.0)
            if then:
                then(pr, sp)
        if not pr.go(sp["f"], sp["x"], sp["y"], 0, False, arrive):
            pr.release_spot()
            pr.act = "idle"
            return False
        pr.set_state("idle", 1e9)
        return True

    def place_walk(self, pr, act, dur, prop=None, run=False, line=None):
        x, y = self.random_floor(pr.f)
        pr.release_spot()
        pr.act = act
        pr.prop = prop

        def arrive():
            pr.act = act
            pr.pose = "stand"
            pr.set_state("act", dur)
            if line and random.random() < 0.6:
                pr.say(L(line), 2.0)
        ok = pr.go(pr.f, x, y, 0, run, arrive)
        if ok:
            pr.set_state("idle", 1e9)
        return ok

    def place_decide(self, pr):
        """Choose what to do next at a place (family member or one of the people who work / play there)."""
        f = pr.f
        key = PA.PLACES[f]["key"]
        h = self.hour()
        dark = H.is_dark(h)
        npc = getattr(pr, "npc", None)
        if npc:
            return self.npc_decide(pr, npc, key, h)
        kid = pr.role == "kid"
        opts = []
        if key == "school":
            if self.bell["class"] and kid:
                opts.append((9, lambda: self.place_do(pr, ("school_desk",), "work", "class", random.uniform(60, 200),
                                                      "work", "pencil", "class")))
            if kid:
                opts.append((3, lambda: self.place_do(pr, ("bars",), "bars", "bars", random.uniform(10, 20), "reach",
                                                      None, "bars", then=lambda p, sp: setattr(p, "anim",
                                                                                              {"kind": "bars", "t": 0}))))
                opts.append((3, lambda: self.place_do(pr, ("hoop",), "hoop", "hoop", random.uniform(14, 30), "reach",
                                                      "ball", then=lambda p, sp: setattr(p, "anim",
                                                                                         {"kind": "hoop", "t": 0}))))
                opts.append((2, lambda: self.play_tag(pr)))
            else:
                opts.append((4, lambda: self.place_do(pr, ("bench",), "sit", "bench", random.uniform(40, 90), "sit",
                                                      random.choice(("phone", "book", None)))))
            opts.append((1.5, lambda: self.place_walk(pr, "wander", random.uniform(4, 10))))
        elif key == "park":
            if kid:
                opts.append((4, lambda: self.place_do(pr, ("slide",), "slide", "slide", 60, "walk", None, None,
                                                      then=lambda p, sp: setattr(p, "anim", {"kind": "slide", "t": 0,
                                                                                             "item": sp["item"].id,
                                                                                             "times": random.randint(2, 4)}))))
                opts.append((3, lambda: self.place_do(pr, ("swing",), "swing", "swing", random.uniform(30, 60), "sit",
                                                      None, then=lambda p, sp: sp["item"].state.__setitem__("swing", 1.0))))
                opts.append((2.5, lambda: self.place_do(pr, ("sandbox",), "play", "play", random.uniform(30, 60), "floor",
                                                        "toy")))
                opts.append((1.5, lambda: self.play_tag(pr)))
            opts.append((2.5, lambda: self.seesaw(pr)))
            opts.append((3, lambda: self.place_do(pr, ("bench", "fountain"), "sit", "bench", random.uniform(40, 90), "sit",
                                                  None if kid else random.choice(("phone", "book", None)))))
            if not dark and H.season() != "winter" and any(n.uid == "n:vendor" and not n.hidden for n in self.npcs):
                opts.append((2, lambda: self.buy_icecream(pr)))
            if not dark:
                opts.append((1.5, lambda: self.place_walk(pr, "pigeons", random.uniform(15, 30), "bread",
                                                          line="pigeons") and self._crouch_after(pr)))
                opts.append((1.5, lambda: self.fly_kite(pr)))
            if not kid:
                opts.append((1.0, lambda: self.jog(pr)))
            opts.append((1.5, lambda: self.place_walk(pr, "wander", random.uniform(4, 10))))
        elif key == "lake":
            if H.season() != "winter" and self.free_boat() is not None:
                opts.append((3, lambda: self.start_rowing(pr)))
            opts.append((3, lambda: self.place_do(pr, ("fish_stool",), "fish", "fish", random.uniform(60, 150), "sit",
                                                  "rod", "fish", then=lambda p, sp: setattr(p, "anim",
                                                                                            {"kind": "fish", "t": 0,
                                                                                             "next": self.t + random.uniform(10, 30)}))))
            opts.append((2.5, lambda: self.place_do(pr, ("picnic",), "play", "picnic", random.uniform(40, 90), "floor",
                                                    random.choice(("food", None)))))
            opts.append((2.5, lambda: self.place_do(pr, ("bench", "rock"), "sit", "bench", random.uniform(30, 80),
                                                    "sit", None)))
            if H.season() != "winter":
                opts.append((2, lambda: self.feed_ducks(pr)))
            opts.append((1.5, lambda: self.place_walk(pr, "wander", random.uniform(4, 10))))
        elif key == "street":
            opts.append((4, lambda: self.go_shopping(pr)))
            opts.append((3, lambda: self.go_cafe(pr)))
            opts.append((2, lambda: self.place_do(pr, ("pet_cages",), "look", "pet_look", random.uniform(15, 30),
                                                  "crouch", None, "pet_look")))
            opts.append((1, lambda: self.place_do(pr, ("vending",), "buy", "vending", 3, "reach", None, "vending",
                                                  then=lambda p, sp: self.later(2.5, lambda: p.act == "vending" and setattr(p, "prop", "cup")))))
            opts.append((1, lambda: self.place_do(pr, ("bench",), "sit", "bench", random.uniform(30, 60), "sit",
                                                  random.choice(("phone", None, "bag")))))
        elif key == "mountain":
            opts.append((4, lambda: self.hike(pr)))
            opts.append((2.5, lambda: self.place_do(pr, ("telescope",), "view", "view", random.uniform(8, 16), "reach",
                                                    None, "view")))
            opts.append((2, lambda: self.take_photo(pr)))
            opts.append((3, lambda: self.place_do(pr, ("pavilion", "rock"), "sit", "rest", random.uniform(40, 90), "sit",
                                                  random.choice((None, "map", "cup")), "hike")))
        elif key == "camp":
            if dark and (h >= 21.5 or h < 6.5 or pr.asleep_at(h)):
                return self.tent_sleep(pr)
            opts.append((4 if (h >= 17 or dark) else 1.5, lambda: self.place_do(
                pr, ("log_seat", "camp_chair"), "sit", "campfire", random.uniform(60, 150), "sit",
                "marsh" if (h >= 17 or dark) and random.random() < 0.6 else None, "campfire" if h >= 17 else None)))
            opts.append((2, lambda: self.place_do(pr, ("camp_table",), "eat", "eat", random.uniform(30, 60), "eat",
                                                  random.choice(("food", "cup")))))
            if not dark:
                opts.append((2, lambda: self.place_do(pr, ("hammock",), "hammock", "hammock", random.uniform(40, 100),
                                                      "sleep", None, "hammock", then=self._hammock)))
            opts.append((1.5, lambda: self.place_walk(pr, "wander", random.uniform(4, 10))))
            if dark:
                opts.append((2, lambda: self.place_walk(pr, "stars", random.uniform(20, 40), line="stars")))
        # a cat nearby on the leash: pet it now and then
        for c in self.cats_at(f):
            if getattr(c, "guardian", None) == pr.uid and c.free() and random.random() < 0.3:
                opts.append((1.5, lambda c=c: pr.approach_cat(c, "pet", random.uniform(4, 6))))
                break
        random.shuffle(opts)
        tot = sum(w for w, _ in opts)
        r = random.uniform(0, tot) if tot else 0
        for w, fn in opts:
            r -= w
            if r <= 0:
                try:
                    if fn():
                        return True
                except Exception as ex:
                    import sys
                    print("place act:", repr(ex), file=sys.stderr)
                break
        return self.place_walk(pr, "wander", random.uniform(4, 8))

    def _crouch_after(self, pr):
        old = pr.then

        def crouch():
            if old:
                old()
            pr.pose = "crouch"
            pr.view = "side"
        pr.then = crouch
        return True

    def _hammock(self, pr, sp):
        pr.sleep_dir = (1.0, 0.0)
        pr.P["_blanket"] = "#f2a65a"
        sp["item"].state["busy"] = True
        self.later(5, lambda: sp["item"].state.__setitem__("busy", pr.act == "hammock"))

    def play_tag(self, pr):
        """Run about with another child at the place."""
        others = [p for p in self.people_at(pr.f) if p is not pr and p.role == "kid" and p.ctrl is None and
                  p.state != "act" and not p.path]
        pr.release_spot()
        pr.act = "tag"
        x, y = self.random_floor(pr.f)
        ok = pr.go(pr.f, x, y, 0, True, lambda: (setattr(pr, "act", "tag"), pr.set_state("act", random.uniform(1, 3))))
        if ok:
            pr.set_state("idle", 1e9)
            if others:
                o = others[0]
                o.release_spot()
                o.act = "tag"
                if o.go(pr.f, x + 30, y - 10, 0, True, lambda: (setattr(o, "act", "tag"), o.set_state("act", 2))):
                    o.set_state("idle", 1e9)
                    pr.say(random.choice(["来追我呀！", "抓不到我～", "嘿嘿！"]), 1.6)
        return ok

    def seesaw(self, pr):
        partners = [p for p in self.people_at(pr.f) if p is not pr and p.ctrl is None and p.state != "act" and
                    not p.path and (p.role == "kid" or pr.role == "kid")]
        if not partners:
            return False
        it = next((i for i in self.place_items if i.f == pr.f and i.type == "seesaw"), None)
        if it is None or any(self.occupied.get((it.id, k)) for k in (0, 1)):
            return False
        o = random.choice(partners)
        for p, idx in ((pr, 0), (o, 1)):
            sp = it.spot(idx)
            p.claim((it.id, idx))
            p.act = "going:seesaw"

            def arrive(p=p, sp=sp):
                p.act = "seesaw"
                p.pose, p.prop, p.view = "sit", None, "side"
                p.x, p.y = sp["x"], sp["y"]
                p.facing = 1 if sp["fx"] > 0 else -1
                p.set_state("act", random.uniform(25, 45))
                if random.random() < 0.6:
                    p.say(L("seesaw"), 1.8)
            if p.go(it.f, sp["x"], sp["y"], 0, False, arrive):
                p.set_state("idle", 1e9)
        return True

    def buy_icecream(self, pr):
        def after(p, sp):
            self.later(2.5, lambda: self._got_icecream(p))
        return self.place_do(pr, ("icecream",), "buy", "buy", 4.0, "stand", None, "icecream", then=after)

    def _got_icecream(self, p):
        if p.f != 4 or p.act != "buy" or p.traveling is not None:
            return
        v = next((n for n in self.npcs if n.uid == "n:vendor"), None)
        if v is not None and not v.hidden:
            v.say(random.choice(["给，小心别滴到衣服上～", "草莓味的来咯", "谢谢惠顾！"]), 2.0)
        p.prop = "icecream"
        p.end_act()
        self.place_do(p, ("bench", "fountain"), "sit", "icecream", random.uniform(25, 45), "sit", "icecream")
        p.prop = "icecream"

    def fly_kite(self, pr):
        if self.weather() in ("rain", "snow"):
            return False
        pr.release_spot()
        pr.act = "kite"
        pr.prop = "kite"
        pr.anim = {"kind": "kite", "t": 0, "next": 0}
        pr.set_state("act", random.uniform(40, 80))
        pr.say(L("kite"), 2.0)
        return True

    def jog(self, pr, laps=1):
        if pr.f != 4:
            return False
        cx, cy = 630, 260
        pts = []
        for k in range(9):
            a = k * math.tau / 8 + math.pi / 2
            pts.append((cx + math.cos(a) * 170, cy + math.sin(a) * 170 / 0.95 * 0.95))
        pr.release_spot()
        pr.act = "jog"
        path = []
        x, y = pr.x, pr.y
        for _ in range(laps):
            for px, py in pts:
                path += pr.walk_steps(pr.f, (x, y), (px, py), pr.run_v * 0.8 if hasattr(pr, "run_v") else 120)
                x, y = px, py
        pr.path = path
        pr.running = True
        pr.then = lambda: (setattr(pr, "act", "idle"), pr.set_state("idle", random.uniform(2, 5)))
        pr.set_state("idle", 1e9)
        return True

    def feed_ducks(self, pr):
        x = random.uniform(120, 720)
        pr.release_spot()
        pr.act = "going:ducks"

        def arrive():
            pr.act = "ducks"
            pr.pose, pr.prop, pr.view = "crouch", "bread", "side"
            pr.set_state("act", random.uniform(15, 30))
            pr.say(L("ducks"), 2.0)
        ok = pr.go(pr.f, x, 178, 0, False, arrive)
        if ok:
            pr.set_state("idle", 1e9)
        return ok

    def go_shopping(self, pr):
        """Supermarket: a few shelves, then the till; leave with a bag."""
        stops = random.randint(2, 3)

        def still(p, act):
            return p.f == 6 and p.act == act and p.traveling is None and p.ctrl is None

        def next_stop(p, sp, n=[stops]):
            n[0] -= 1
            if n[0] > 0:
                self.later(random.uniform(3, 5), lambda: still(p, "shop") and (p.end_act(), self.place_do(
                    p, ("shelf", "drink_fridge", "fruit_stand"), "shop", "shop", 5, "reach", None, "shop",
                    then=next_stop)))
            else:
                self.later(random.uniform(3, 5), lambda: still(p, "shop") and (p.end_act(), self.place_do(
                    p, ("checkout",), "pay", "pay", 5, "stand", "basket", None, then=paid)))

        def paid(p, sp):
            c = next((n for n in self.npcs if n.uid == "n:cashier" and not n.hidden), None)
            if c is not None:
                c.say(L("pay"), 2.0)
            self.later(4, lambda: p.f == 6 and setattr(p, "prop", "bag"))
            self.sfx("chime", 4)
        return self.place_do(pr, ("shelf", "drink_fridge", "fruit_stand"), "shop", "shop", 5, "reach", "basket",
                             "shop", then=next_stop)

    def go_cafe(self, pr):
        def ordered(p, sp):
            b = next((n for n in self.npcs if n.uid == "n:barista" and not n.hidden), None)
            if b is not None:
                self.later(2.0, lambda: b.say(L("barista"), 2.0))
            self.later(4.0, lambda: p.f == 6 and p.act == "order" and p.ctrl is None and (p.end_act(), self.place_do(p, ("cafe_table",), "cafe", "cafe",
                                                                  random.uniform(50, 120), "sit", "cup", "cafe",
                                                                  then=lambda q, s: s["item"].state.__setitem__("cups", True))))
        return self.place_do(pr, ("cafe_counter",), "order", "order", 5, "stand", None, "order", then=ordered)

    def hike(self, pr):
        pts = [(200, 120), (420, 260), (620, 264), (760, 200), (900, 120), (1100, 330), (980, 420), (620, 264),
               (360, 300), (220, 60)]
        k = random.randint(0, len(pts) - 1)
        n = random.randint(3, 5)
        route = [pts[(k + i) % len(pts)] for i in range(n)]
        pr.release_spot()
        pr.act = "hike"
        pr.prop = random.choice((None, "map"))
        path = []
        x, y = pr.x, pr.y
        for px, py in route:
            if self.nav[pr.f].ok_at(px, py):
                path += pr.walk_steps(pr.f, (x, y), (px, py), pr.walk_v)
                x, y = px, py
        if not path:
            return False
        pr.path = path
        pr.then = lambda: (setattr(pr, "act", "idle"), pr.set_state("idle", random.uniform(2, 5)),
                           pr.say(L("hike"), 2.0) if random.random() < 0.5 else None)
        pr.set_state("idle", 1e9)
        return True

    def take_photo(self, pr):
        others = [p for p in self.family_at(pr.f) if p is not pr and p.ctrl is None and p.state != "act" and not p.path]
        if not others:
            return self.place_do(pr, ("summit",), "photo", "photo", 6, "wave", None, "summit")
        o = others[0]

        def posed(p, sp):
            side = random.choice((-1, 1))
            x, y = sp["x"] + side * 74, sp["y"] - 6
            o.release_spot()
            o.act = "going:photo"

            def snap():
                o.act = "photo"
                o.pose, o.prop, o.view = "stand", "camera", "side"
                o.facing = 1 if p.x > o.x else -1
                o.set_state("act", 5)
                o.say(L("photo"), 1.8)
                self.later(1.8, lambda: p.act == "photo" and (p.spawn("heart", 2), setattr(p, "pose", random.choice(("heart", "wave", "clap")))))
                self.later(2.0, lambda: self.flash_at(o))
            if o.go(o.f, x, y, 0, False, snap):
                o.set_state("idle", 1e9)
        return self.place_do(pr, ("summit",), "photo", "photo", 9, "wave", None, "summit", then=posed)

    def flash_at(self, a):
        a.spawn("ex", 1)
        self.sfx("chime", 3)

    def tent_sleep(self, pr):
        tent = min((it for it in self.place_items if it.f == pr.f and it.type == "tent" and it.x < 800),
                   key=lambda it: math.hypot(it.x - pr.x, it.y - pr.y), default=None)
        if tent is None:
            return False
        sp = tent.spot(random.randint(0, 2))
        pr.release_spot()
        pr.act = "going:tent"

        def inside():
            pr.act = "sleep"
            pr.in_tent = tent.id
            pr.set_state("act", 1e9)
            pr.say(L("tent"), 1.8)
            for c in self.cats_at(pr.f):
                if getattr(c, "guardian", None) == pr.uid and c.ctrl is None:
                    c.stop()
                    c.release_spot()
                    c.in_tent = tent.id
                    c.set_state("rest", 1e9, pose="sleep")
        ok = pr.go(pr.f, sp["x"], sp["y"], 0, False, inside)
        if ok:
            pr.set_state("idle", 1e9)
        return ok

    def wake_from_tent(self, pr):
        pr.in_tent = None
        tent = next((it for it in self.place_items if it.f == pr.f and it.type == "tent" and it.x < 800), None)
        if tent is not None:
            pr.x, pr.y = tent.x + random.uniform(-30, 30), tent.y - 64
        pr.act = "idle"
        pr.pose, pr.view = "stretch", "front"
        pr.set_state("stretch", 1.8)
        for c in self.cats_at(pr.f):
            if getattr(c, "in_tent", None) and getattr(c, "guardian", None) == pr.uid:
                c.in_tent = None
                c.x, c.y = pr.x + 26, pr.y - 4
                c.set_state("rest", 3, pose="stretch")

    # ---- the people who work / play at the places ------------------------------------------------------------
    def npc_decide(self, pr, d, key, h):
        job = d["job"]
        if job == "teacher":
            if self.bell["class"]:
                if random.random() < 0.6:
                    return self.place_do(pr, ("blackboard",), "teach", "teach", random.uniform(14, 30), "reach", "chalk",
                                         "teach", view="back",
                                         then=lambda p, sp: sp["item"].state.__setitem__("lesson", random.choice(PA.LESSONS)))
                return self.place_do(pr, ("lectern",), "teach", "teach", random.uniform(14, 30), "stand", "book", "teach")
            if random.random() < 0.5:
                return self.place_do(pr, ("bench",), "sit", "rest", random.uniform(30, 60), "sit", "cup")
            return self.place_walk(pr, "wander", random.uniform(6, 14))
        if job == "pupil":
            if self.bell["class"]:
                return self.place_do(pr, ("school_desk",), "work", "class", random.uniform(60, 200), "work", "pencil")
            r = random.random()
            if r < 0.3:
                return self.place_do(pr, ("bars",), "bars", "bars", random.uniform(8, 16), "reach", None,
                                     then=lambda p, sp: setattr(p, "anim", {"kind": "bars", "t": 0}))
            if r < 0.55:
                return self.place_do(pr, ("hoop",), "hoop", "hoop", random.uniform(14, 30), "reach", "ball",
                                     then=lambda p, sp: setattr(p, "anim", {"kind": "hoop", "t": 0}))
            return self.play_tag(pr)
        if job == "jogger":
            if random.random() < 0.8:
                return self.jog(pr, 2)
            return self.place_do(pr, ("bench",), "sit", "rest", random.uniform(20, 40), "sit", "cup")
        if job == "grandpa":
            if random.random() < 0.35 and not H.is_dark(h):
                return self.place_walk(pr, "pigeons", random.uniform(20, 40), "bread", line="pigeons") and \
                    self._crouch_after(pr)
            return self.place_do(pr, ("bench",), "sit", "rest", random.uniform(60, 160), "sit",
                                 random.choice(("book", None, None)))
        if job == "dogwalker":
            return self.place_walk(pr, "walk_dog", random.uniform(3, 8))
        if job == "parkkid":
            r = random.random()
            if r < 0.35:
                return self.place_do(pr, ("slide",), "slide", "slide", 60, "walk", None,
                                     then=lambda p, sp: setattr(p, "anim", {"kind": "slide", "t": 0, "item": sp["item"].id,
                                                                            "times": random.randint(2, 3)}))
            if r < 0.6:
                return self.place_do(pr, ("swing",), "swing", "swing", random.uniform(20, 40), "sit", None,
                                     then=lambda p, sp: sp["item"].state.__setitem__("swing", 1.0))
            if r < 0.8:
                return self.place_do(pr, ("sandbox",), "play", "play", random.uniform(20, 40), "floor", "toy")
            return self.play_tag(pr)
        if job == "vendor":
            return self.place_do(pr, ("icecream",), "vendor", "work", 1e9, "stand", None)
        if job == "fisher":
            return self.place_do(pr, ("fish_stool",), "fish", "fish", random.uniform(200, 600), "sit", "rod",
                                 then=lambda p, sp: setattr(p, "anim", {"kind": "fish", "t": 0,
                                                                        "next": self.t + random.uniform(20, 60)}))
        if job == "stroller":
            if random.random() < 0.4:
                return self.place_do(pr, ("bench",), "sit", "rest", random.uniform(30, 70), "sit", "phone")
            if random.random() < 0.4 and H.season() != "winter":
                return self.feed_ducks(pr)
            return self.place_walk(pr, "wander", random.uniform(5, 12))
        if job == "cashier":
            return self.place_do(pr, ("checkout",), "cashier", "work", 1e9, "stand", None)
        if job == "barista":
            return self.place_do(pr, ("cafe_counter",), "barista", "work", 1e9, "cook", None)
        if job == "petshop":
            if random.random() < 0.6:
                return self.place_do(pr, ("pet_counter",), "cashier", "work", random.uniform(40, 90), "stand", None)
            return self.place_do(pr, ("grooming",), "groom", "work", random.uniform(30, 60), "cook", None)
        if job == "shopper":
            if random.random() < 0.7:
                return self.place_do(pr, ("shelf", "drink_fridge", "fruit_stand"), "shop", "shop",
                                     random.uniform(6, 14), "reach", "basket")
            return self.place_do(pr, ("checkout",), "pay", "pay", 6, "stand", "bag")
        if job == "cafe":
            return self.place_do(pr, ("cafe_table",), "cafe", "cafe", random.uniform(120, 300), "sit",
                                 random.choice(("laptop", "cup", "book")),
                                 then=lambda p, sp: sp["item"].state.__setitem__("cups", True))
        if job == "hiker":
            r = random.random()
            if r < 0.5:
                return self.hike(pr)
            if r < 0.75:
                return self.place_do(pr, ("pavilion", "rock"), "sit", "rest", random.uniform(30, 70), "sit", "cup")
            return self.place_do(pr, ("telescope",), "view", "view", random.uniform(8, 16), "reach", None)
        if job == "camper":
            if H.is_dark(h) and (h >= 22 or h < 6.5):
                tent = next((it for it in self.place_items if it.f == pr.f and it.type == "tent" and it.x > 800), None)
                if tent is not None:
                    pr.in_tent = tent.id
                    pr.act = "sleep"
                    pr.set_state("act", 1e9)
                    return True
            return self.place_do(pr, ("camp_chair", "log_seat"), "sit", "campfire", random.uniform(60, 160), "sit",
                                 random.choice(("book", "cup", "marsh")))
        return self.place_walk(pr, "wander", random.uniform(5, 10))

    def npc_notice_cats(self, dt):
        """People at the places notice the cats (once in a while)."""
        if random.random() > dt * 0.25:
            return
        for c in self.cats:
            if c.f not in PA.PLACES or c.traveling is not None:
                continue
            for n in self.npcs:
                if n.hidden or n.f != c.f or n.bubble or math.hypot(n.x - c.x, n.y - c.y) > 130:
                    continue
                if n.npc["job"] == "teacher":
                    n.say(L("teacher_cat"), 2.2)
                elif n.npc["job"] == "pupil" and self.bell["class"]:
                    n.say(L("class_cat"), 2.0)
                else:
                    n.say(L("cat_cute"), 2.0)
                if random.random() < 0.35 and c.free() and n.state != "act":
                    n.approach_cat(c, "pet", 5)
                return

    # ---- what the cats do at the places ---------------------------------------------------------------------
    def cat_place_decide(self, c):
        g = self.guardian(c)
        f = c.f
        if g is None or g.f != f or g.traveling is not None:
            # lost its person (should not happen): sit and wait, someone from the family takes the leash
            fam = self.family_at(f)
            if fam:
                c.guardian = random.choice(fam).uid
                return self.cat_follow(c, self.guardian(c))
            c.set_state("rest", 5, pose="sit")
            return True
        d = math.hypot(c.x - g.x, c.y - g.y)
        if d > LEASH * 0.85:
            return self.cat_follow(c, g)
        if getattr(g, "ride", None) is not None:
            return self.cat_follow(c, g)
        opts = []
        open_air = PA.room_open(f, c.x, c.y)
        radius = LEASH * 0.8 if open_air else 260

        def near_ok(sp):
            return math.hypot(sp["x"] - g.x, sp["y"] - g.y) < radius
        # sit / lie by the person
        opts.append((3, lambda: self.cat_follow(c, g)))
        # sniff about within reach
        opts.append((3, lambda: self.cat_sniff(c, g, radius)))
        # perch / sleep / hide / watch on things close by
        for kinds, state, pose, w, line in ((("perch",), "rest", "loaf", 2.0, None), (("sleep",), "rest", "sleep", 1.4, None),
                                            (("hide",), "rest", "loaf", 1.4, None),
                                            (("watch_pond", "watch_tank"), "rest", "sit", 2.0, "tank"),
                                            (("scratch",), "scratch", "stretch", 1.0, "scratch")):
            spots = [(k, sp) for k, sp in c.free_spots(kinds) if sp["f"] == f and near_ok(sp)]
            if spots:
                k, sp = random.choice(spots)
                opts.append((w, lambda k=k, sp=sp, state=state, pose=pose, line=line: self.cat_to_spot(c, k, sp, state,
                                                                                                       pose, line)))
        # chase a bird / squirrel / butterfly within reach
        prey = [cr for cr in self.critters if cr["f"] == f and cr["k"] in ("pigeon", "sparrow", "butterfly", "squirrel",
                                                                             "rabbit", "dragonfly")
                and cr.get("st") != "fly" and math.hypot(cr["x"] - g.x, cr["y"] - g.y) < radius + 40]
        if prey:
            cr = random.choice(prey)
            opts.append((2.5, lambda cr=cr: self.cat_chase(c, cr, g, radius)))
        if f == 5:
            opts.append((1.5, lambda: self.cat_watch_water(c, g)))
        random.shuffle(opts)
        tot = sum(w for w, _ in opts)
        r = random.uniform(0, tot)
        for w, fn in opts:
            r -= w
            if r <= 0:
                if fn():
                    return True
                break
        return self.cat_follow(c, g)

    def cat_to_spot(self, c, key, sp, state, pose, line):
        def arrive():
            c.face_spot(sp)
            c.set_state(state, random.uniform(8, 25), pose=pose)
            if line:
                c.chat(line, 0.4)
        return c.go_spot(key, False, arrive)

    def cat_sniff(self, c, g, radius):
        nav = self.nav[c.f]
        for _ in range(10):
            a = random.uniform(0, math.tau)
            r = random.uniform(20, radius)
            x, y = g.x + math.cos(a) * r, g.y + math.sin(a) * r
            if nav.ok_at(x, y):
                c.release_spot()
                pose = random.choice(("stand", "sit", "groom", "loaf", "belly", "crouch"))
                return c.go(c.f, x, y, 0, False, lambda: c.set_state("rest", random.uniform(3, 9), pose=pose))
        return False

    def cat_chase(self, c, cr, g, radius):
        x, y = cr["x"], cr["y"]
        if math.hypot(x - g.x, y - g.y) > radius + 20:
            k = radius / max(1.0, math.hypot(x - g.x, y - g.y))
            x, y = g.x + (x - g.x) * k, g.y + (y - g.y) * k
        if not self.nav[c.f].ok_at(x, y):
            return False
        c.release_spot()
        c.say(random.choice(["（屁股扭扭）", "咔咔咔", "我要抓住它！"]), 1.4)
        return c.go(c.f, x, y, 0, True, lambda: c.set_state("rest", 2.5, pose="crouch"))

    def cat_watch_water(self, c, g):
        x = min(max(c.x + random.uniform(-60, 60), 30), 760)
        if math.hypot(x - g.x, 184 - g.y) > LEASH:
            return False
        c.release_spot()
        return c.go(c.f, x, 182, 0, False, lambda: (c.set_state("rest", random.uniform(8, 20), pose="sit"),
                                                     setattr(c, "facing", 1), c.chat("tank", 0.4)))

    # ---- network ----------------------------------------------------------------------------------------------
    def places_to_net(self):
        return {"cr": [[c["k"], c["f"], round(c["x"], 1), round(c["y"], 1), round(c.get("z", 0.0), 1),
                        1 if c.get("vx", 0) >= 0 else -1, c.get("st", ""), round(c.get("u", 0.0), 2), c.get("col", "")]
                       for c in self.critters],
                "bo": [[b["id"], round(b["x"], 1), round(b["y"], 1), b["face"], int(b["moving"]), list(b["riders"])]
                       for b in self.boats],
                "be": int(self.bell["class"])}

    def places_from_net(self, d):
        if not isinstance(d, dict):
            return
        out = []
        for r in d.get("cr") or []:
            try:
                out.append({"k": str(r[0]), "f": int(r[1]), "x": float(r[2]), "y": float(r[3]), "z": float(r[4]),
                            "vx": float(r[5]), "face": int(r[5]), "st": str(r[6]), "u": float(r[7]),
                            "col": str(r[8]) or "#f6c66b", "ph": 0.0})
            except (TypeError, ValueError, IndexError):
                pass
        old = {(c["k"], round(c["x"] / 40), round(c["y"] / 40)): c.get("ph", 0.0) for c in self.critters}
        for c in out:
            c["ph"] = old.get((c["k"], round(c["x"] / 40), round(c["y"] / 40)), random.uniform(0, 5))
        self.critters = out
        for r in d.get("bo") or []:
            try:
                b = self.boats[int(r[0])]
                b["x"], b["y"], b["face"], b["moving"] = float(r[1]), float(r[2]), int(r[3]), bool(r[4])
                b["riders"] = [str(u) for u in r[5]]
            except (TypeError, ValueError, IndexError, KeyError):
                pass
        self.bell["class"] = bool(d.get("be"))
