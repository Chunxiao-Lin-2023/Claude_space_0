"""Battle arenas (对战场景): ten little stages reached from the town map, where the cats and the family fight
it out (see house_battle). Like the places, each arena is one more storey of the house world (f = 9 .. 18).
Here: their geometry, ground, backdrops, scenery, and the drawing of the battle (marks, effects, HUD).
"""
import math
import random

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QColor, QFont, QFontMetricsF, QLinearGradient, QPainterPath, QPen, QPolygonF, QRadialGradient

from . import house_art as H
from . import house_places_art as PA
from .house_art import B, C, E, Fn, Fr, S, box, cyl, disc, frect, ipt, iso, pen, poly, srect, vgrad

OUT = H.OUT

# floor shapes: ("rect", x0, y0, x1, y1) / ("ell", cx, cy, rx, ry); pits: stepping off the floor is a fall.
# zones: ("slow" | "slip" | "belt" | "bounce", shape, extra)
ARENAS = {
    9: dict(key="ring", name="竞技场", icon="🏟", ground="sand", floor=[("rect", 20, 20, 1240, 470)], pits=False,
            spawns=[(390, 250), (430, 340), (870, 250), (830, 160)], ammo=None, hazards=(), game="brawl", side=True,
            layout=[],
            desc="横版格斗 · 擂台：两边有矮台，中间高台；连招、挑空、空中连击，怒气满了放大招"),
    10: dict(key="snow", name="雪球场", icon="☃", ground="snow", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(150, 250), (180, 380), (1110, 250), (1080, 120)], ammo="snowball",
             zones=[("slip", ("ell", 630, 90, 150, 40), None), ("slip", ("ell", 630, 410, 150, 40), None)],
             walls=[(430, 150), (430, 340), (830, 150), (830, 340), (630, 250)],
             layout=[("snow_pile", 300, 250, 0), ("snow_pile", 960, 250, 0), ("pine", 40, 460, 0), ("pine", 1220, 460, 0),
                     ("pine", 40, 40, 0), ("pine", 1220, 40, 0)], game="shoot",
             hazards=(), desc="雪球射击：躲在雪墙后面对射；雪球打完了按 E 捏，冰面会打滑"),
    11: dict(key="pillow", name="枕头大战卧室", icon="🛏", ground="carpet", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(150, 250), (160, 120), (1110, 250), (1100, 380)], ammo="pillow",
             zones=[("bounce", ("rect", 260, 190, 400, 310), 420), ("bounce", ("rect", 860, 190, 1000, 310), 420),
                    ("bounce", ("rect", 560, 360, 700, 460), 420)],
             layout=[("big_bed", 330, 250, 0), ("big_bed", 930, 250, 0), ("big_bed", 630, 410, 0),
                     ("pillow_pile", 630, 100, 0), ("pillow_pile", 120, 430, 0), ("pillow_pile", 1140, 60, 0)],
             hazards=(), desc="床是蹦床，跳起来往下砸；枕头堆里抓枕头扔"),
    12: dict(key="water", name="水枪乐园", icon="💦", ground="pooltile", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(150, 250), (170, 380), (1110, 250), (1090, 120)], ammo="water",
             zones=[("slow", ("ell", 630, 240, 190, 90), None)],
             layout=[("bucket_tower", 630, 440, 0), ("gun_crate", 220, 110, 0), ("gun_crate", 1040, 390, 0),
                     ("palm", 40, 450, 0), ("palm", 1220, 450, 0), ("palm", 40, 40, 0), ("palm", 1220, 40, 0)],
             hazards=("bucket",), desc="水枪连射；中间泳池走得慢；大水桶会倒水把人冲开"),
    13: dict(key="dojo", name="道场", icon="🥋", ground="tatami", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(170, 250), (200, 380), (1090, 250), (1060, 120)], ammo=None, game="brawl", side=True,
             layout=[],
             hazards=(), desc="横版格斗 · 道场：三层木台子，跳上跳下地打（冒险岛那样）"),
    14: dict(key="roof", name="屋顶月夜", icon="🌙", ground="roof",
             floor=[("rect", 20, 30, 380, 470), ("rect", 470, 0, 790, 470), ("rect", 880, 30, 1240, 470),
                    ("rect", 380, 210, 470, 280), ("rect", 790, 210, 880, 280)], pits=True,
             rooms={"west": ("屋顶", 20, 30, 380, 470, "roof"), "mid": ("屋顶", 470, 0, 790, 470, "roof"),
                    "east": ("屋顶", 880, 30, 1240, 470, "roof"), "plank_w": ("木板", 380, 210, 470, 280, "deck"),
                    "plank_e": ("木板", 790, 210, 880, 280, "deck")},
             spawns=[(200, 250), (200, 380), (1060, 250), (1060, 120)], ammo=None, game="race", side=True,
             layout=[],
             hazards=(), dark=True, desc="屋顶竞速：下层往右跑、踩弹簧上楼、上层往左跑再跳下来冲线；跳缝、钻晾衣绳，问号箱里有道具"),
    15: dict(key="kitchen", name="厨房大乱斗", icon="🍳", ground="tile", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(150, 250), (160, 120), (1110, 250), (1100, 380)], ammo=None,
             zones=[("slip", ("ell", 630, 110, 120, 36), None), ("slip", ("ell", 630, 390, 120, 36), None)],
             layout=[("island", 410, 250, 0), ("island", 850, 250, 0), ("big_fridge", 80, 450, 0),
                     ("big_stove", 1180, 450, 0)],
             hazards=("oranges",), items_bias="fish", desc="地上的油会打滑，橘子满地滚；鱼比较多"),
    16: dict(key="yarn", name="毛线工厂", icon="🧶", ground="metal", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(150, 250), (170, 60), (1110, 250), (1090, 440)], ammo=None,
             zones=[], game="bomb",
             layout=[],
             hazards=(), desc="泡泡堂：放毛线炸弹炸开纸箱、捡道具，把对手困在毛线里"),
    17: dict(key="forest", name="森林木桩", icon="🌲", ground="lawn", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(150, 250), (160, 380), (1110, 250), (1100, 120)], ammo=None,
             zones=[("bounce", ("ell", 450, 380, 46, 26), 460), ("bounce", ("ell", 810, 120, 46, 26), 460)],
             layout=[("stump", 300, 140, 0), ("stump", 960, 340, 0), ("stump", 630, 250, 0), ("mushroom", 450, 380, 0),
                     ("mushroom", 810, 120, 0), ("pine", 40, 460, 0), ("pine", 1220, 460, 0), ("tree", 1210, 60, 0),
                     ("tree", 50, 60, 0)],
             hazards=("pinecones",), desc="蘑菇能弹得老高；小心头上掉松果"),
    18: dict(key="beach", name="沙滩", icon="🏖", ground="sand", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(150, 200), (170, 80), (1110, 200), (1090, 80)], ammo=None,
             zones=[("slow", ("rect", 0, 360, 1260, 480), None)],
             castles=[(420, 230), (840, 230), (630, 120)],
             layout=[("beach_umbrella", 120, 300, 0), ("beach_umbrella", 1140, 300, 0), ("palm", 40, 40, 0),
                     ("palm", 1220, 40, 0)],
             hazards=("waves", "crabs"), desc="海浪一阵阵把人往岸上推，螃蟹会夹人；沙堡能打碎"),
    # ---- v24: the second batch of games, each on its own new arena
    19: dict(key="castle", name="毛绒城堡", icon="🏰", ground="lawn", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(540, 250), (720, 250), (630, 150), (630, 350)], ammo=None, game="defend",
             layout=[("pine", 40, 460, 0), ("pine", 1220, 460, 0), ("pine", 30, 40, 0), ("pine", 1230, 40, 0),
                     ("flag_post", 470, 400, 0), ("flag_post", 790, 400, 0)],
             hazards=(), desc="合作守家：大家一起守住中间的毛绒城堡，怪从两边和后面一波波冲过来"),
    20: dict(key="paint", name="颜料广场", icon="🖌", ground="stone", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(110, 140), (110, 360), (1150, 360), (1150, 140)], ammo=None, game="paint",
             layout=[("paint_bucket", 630, 250, 0), ("crate", 430, 130, 0), ("crate", 830, 370, 0),
                     ("crate", 430, 370, 0), ("crate", 830, 130, 0)],
             hazards=(), desc="涂地占领：喷颜料涂地盘，在自己的颜色里能潜游补颜料；时间到时地盘大的赢"),
    21: dict(key="pitch", name="猫咪球场", icon="🥅", ground="pitch", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(470, 250), (300, 330), (790, 250), (960, 170)], ammo=None, game="soccer",
             layout=[], hazards=(), desc="猫咪足球：带球、射门、铲球、头球；毛绒门将守门，先进够球的赢"),
    22: dict(key="pier", name="码头鱼市", icon="⚓", ground="deck", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(170, 250), (170, 330), (1090, 250), (1090, 170)], ammo=None, game="fish",
             layout=[("fish_stall", 630, 455, 0), ("crate", 380, 450, 0), ("crate", 880, 450, 0),
                     ("bollard", 330, 40, 0), ("bollard", 930, 40, 0)],
             hazards=(), desc="抢鱼大作战：天上掉鱼（金鱼 3 分），抱回自家篮子；拍一下对手，他的鱼就掉了"),
    23: dict(key="toyhouse", name="躲猫猫小屋", icon="🙈", ground="wood", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(630, 150), (560, 120), (700, 120), (630, 90)], ammo=None, game="hide",
             layout=[("wardrobe", 130, 440, 0), ("bookshelf", 300, 450, 0), ("fridge", 470, 440, 0),
                     ("counter", 560, 440, 0), ("wardrobe", 960, 440, 0), ("coat_rack", 1110, 445, 0),
                     ("lamp", 1215, 450, 0), ("bed", 270, 260, 0), ("sofa", 690, 290, 0), ("armchair", 900, 300, 0),
                     ("table", 1040, 200, 0), ("kid_bed", 1170, 300, 0), ("box", 120, 80, 0), ("toy_box", 400, 70, 0),
                     ("plant", 530, 60, 0), ("washer", 790, 70, 0), ("box", 1000, 80, 0), ("plant", 1210, 60, 0),
                     ("rug", 640, 170, 0)],
             hazards=(), desc="躲猫猫：一个人找，其他人躲进衣柜、床底、纸箱……每轮换人找"),
    24: dict(key="beachv", name="沙滩排球场", icon="🏐", ground="sand", floor=[("rect", 20, 20, 1240, 470)], pits=False,
             spawns=[(330, 250), (190, 250), (930, 250), (1070, 250)], ammo=None, game="volley", side=True,
             layout=[], hazards=(), desc="猫咪排球（横版）：把毛线球打过网，落在对方那边就得分；跳起来按 J 扣杀"),
}
ARENA_IDS = tuple(sorted(ARENAS))
ARENA_BY_KEY = {v["key"]: f for f, v in ARENAS.items()}

H.STYLES.update({"pitch": ("#7cbf5e", "#6aad4e"), "snow": ("#f4f8fb", "#dfe9f1"), "pooltile": ("#d9eef5", "#bfdde9"), "tatami": ("#d9cf96", "#c6bb80"),
                 "roof": ("#a3584a", "#8a463a"), "metal": ("#b9bec6", "#a3a9b2")})


def in_shape(sh, x, y, pad=0.0):
    if sh[0] == "rect":
        _, x0, y0, x1, y1 = sh
        return x0 - pad <= x <= x1 + pad and y0 - pad <= y <= y1 + pad
    _, cx, cy, rx, ry = sh
    return ((x - cx) / (rx + pad)) ** 2 + ((y - cy) / (ry + pad)) ** 2 <= 1.0


def on_floor(f, x, y, pad=0.0):
    return any(in_shape(sh, x, y, pad) for sh in ARENAS[f]["floor"])


def _rooms(d):
    if d.get("rooms"):
        return d["rooms"]
    sh = d["floor"][0]
    if sh[0] == "ell":
        _, cx, cy, rx, ry = sh
        return {"main": (d["name"], 0, 0, 1260, 480, d["ground"])}
    return {"main": (d["name"], 0, 0, 1260, 480, d["ground"])}


# register the arenas as places (travel, storeys, drawing hooks)
for _f, _d in ARENAS.items():
    gx = 560 if _d["key"] != "roof" else 560
    PA.PLACES[_f] = dict(key="arena_" + _d["key"], name=_d["name"], icon=_d["icon"], rooms=_rooms(_d), walls=[],
                         open=tuple(_rooms(_d).keys()), gate=(gx, gx + 140), lit=(), hours=(0, 24), arena=True)
PA.PLACE_IDS = tuple(sorted(PA.PLACES))
PA.OUTING_PLACES = tuple(f for f in PA.PLACE_IDS if not PA.PLACES[f].get("arena"))
PA.PLACE_BY_KEY.update({v["key"]: f for f, v in PA.PLACES.items()})
PA.install()


# ---------------------------------------------------------------------------------------------- ground
def _shape_path(sh):
    path = QPainterPath()
    if sh[0] == "rect":
        _, x0, y0, x1, y1 = sh
        path.addPolygon(QPolygonF([ipt(x0, y0), ipt(x1, y0), ipt(x1, y1), ipt(x0, y1)]))
        path.closeSubpath()
    else:
        _, cx, cy, rx, ry = sh
        sx, sy = iso(cx, cy)
        path.addEllipse(QPointF(sx, sy), rx, ry * H.KY)
    return path


def floor_path(f):
    path = QPainterPath()
    for sh in ARENAS[f]["floor"]:
        path = path.united(_shape_path(sh))
    return path


def _texture(p, st, r):
    rnd = random.Random(int(r.left() + r.top()))
    p.setPen(Qt.NoPen)
    c0, c1 = H.STYLES.get(st, ("#ddd", "#ccc"))
    if st == "snow":
        for _ in range(140):
            p.setBrush(QColor(255, 255, 255, rnd.randint(80, 200)))
            p.drawEllipse(QPointF(rnd.uniform(r.left(), r.right()), rnd.uniform(r.top(), r.bottom())),
                          rnd.uniform(6, 22), rnd.uniform(2, 6))
    elif st == "tatami":
        p.setPen(QPen(QColor(c1).darker(115), 1.4))
        x = r.left()
        while x < r.right():
            p.drawLine(QPointF(x, r.top()), QPointF(x, r.bottom()))
            x += 90
        y = r.top()
        k = 0
        while y < r.bottom():
            p.drawLine(QPointF(r.left(), y), QPointF(r.right(), y))
            y += 46
            k += 1
        p.setPen(QPen(QColor(110, 90, 40, 40), 1))
        for _ in range(200):
            x = rnd.uniform(r.left(), r.right())
            y = rnd.uniform(r.top(), r.bottom())
            p.drawLine(QPointF(x, y), QPointF(x + 14, y))
    elif st == "pooltile":
        p.setPen(QPen(QColor(c1), 1))
        x = r.left()
        while x < r.right():
            p.drawLine(QPointF(x, r.top()), QPointF(x, r.bottom()))
            x += 22
        y = r.top()
        while y < r.bottom():
            p.drawLine(QPointF(r.left(), y), QPointF(r.right(), y))
            y += 12
    elif st == "roof":
        p.setPen(QPen(QColor(c1), 1.4))
        y = r.top()
        row = 0
        while y < r.bottom():
            x = r.left() + (11 if row % 2 else 0)
            while x < r.right():
                p.drawArc(QRectF(x, y - 3, 22, 10), 180 * 16, 180 * 16)
                x += 22
            y += 8
            row += 1
    elif st == "metal":
        p.setPen(QPen(QColor(c1), 1))
        for _ in range(120):
            x, y = rnd.uniform(r.left(), r.right()), rnd.uniform(r.top(), r.bottom())
            p.drawLine(QPointF(x, y), QPointF(x + 4, y + 2))
        p.setBrush(QColor(90, 96, 104, 120))
        p.setPen(Qt.NoPen)
        x = r.left() + 30
        while x < r.right():
            p.drawEllipse(QPointF(x, r.top() + 6), 2, 1.2)
            p.drawEllipse(QPointF(x, r.bottom() - 6), 2, 1.2)
            x += 60
    elif st in ("sand",):
        for _ in range(300):
            p.setBrush(QColor(c1).darker(rnd.randint(100, 115)))
            p.drawEllipse(QPointF(rnd.uniform(r.left(), r.right()), rnd.uniform(r.top(), r.bottom())), 1.2, 0.8)


def draw_arena_base(p, f, hour):
    d = ARENAS[f]
    if d.get("side"):
        return
    st = d["ground"]
    key = d["key"]
    # the block under it all
    if key in ("ring", "roof"):
        pass
    else:
        sr = srect(0, H.PW, 0, -16, 0)
        p.setPen(pen(OUT, 1.2, 170))
        p.setBrush(vgrad(sr, "#9b8a74", "#7a6a56"))
        p.drawRect(sr)
    if key == "ring":
        # the sand of the stadium, then the raised stone ring
        base = frect(-H.SIDE_T, -30, H.PW + H.SIDE_T, H.PD_PLACE)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e2cf9e"))
        p.drawRect(base)
        _texture(p, "sand", base)
        sh = d["floor"][0]
        _, cx, cy, rx, ry = sh
        sx, sy = iso(cx, cy)
        p.setPen(pen("#6f685d", 1.4))
        p.setBrush(QColor("#9d9587"))
        p.drawEllipse(QPointF(sx, sy + 16), rx, ry * H.KY)
        p.drawRect(QRectF(sx - rx, sy, 2 * rx, 16))
        p.setPen(Qt.NoPen)
        p.drawRect(QRectF(sx - rx + 1, sy - 2, 2 * rx - 2, 17))
        g = QRadialGradient(QPointF(sx, sy), rx)
        g.setColorAt(0, QColor("#e8e0d0"))
        g.setColorAt(1, QColor("#cfc6b6"))
        p.setPen(pen("#8b8378", 1.4))
        p.setBrush(g)
        p.drawEllipse(QPointF(sx, sy), rx, ry * H.KY)
        p.setPen(QPen(QColor("#b23a2e"), 2.4))
        p.setBrush(Qt.NoBrush)
        p.drawEllipse(QPointF(sx, sy), rx - 18, (ry - 18) * H.KY)
        p.drawEllipse(QPointF(sx, sy), 60, 60 * H.KY)
        p.setPen(QColor(178, 58, 46, 90))
        p.setFont(QFont("sans", 26, QFont.Bold))
        p.drawText(QRectF(sx - 80, sy - 20, 160, 40), Qt.AlignCenter, "喵")
        return
    if key == "roof":
        # the night street far below
        r = QRectF(H.OX - H.SIDE_T, iso(0, H.PD_PLACE, 0)[1], H.PW + 2 * H.SIDE_T, iso(0, -40, 0)[1] - iso(0, H.PD_PLACE, 0)[1])
        g = QLinearGradient(0, r.top(), 0, r.bottom())
        g.setColorAt(0, QColor("#1c2340"))
        g.setColorAt(1, QColor("#0e1226"))
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawRect(r)
        rnd = random.Random(3)
        for _ in range(60):
            p.setBrush(QColor(255, 220, 140, rnd.randint(60, 180)))
            p.drawEllipse(QPointF(rnd.uniform(r.left(), r.right()), rnd.uniform(r.top() + 20, r.bottom())), 1.6, 1.2)
        for sh in d["floor"]:
            _, x0, y0, x1, y1 = sh
            fr = frect(x0, y0, x1, y1)
            sty = "deck" if (x1 - x0) < 100 else "roof"
            c0, c1 = H.STYLES[sty]
            sr = srect(x0, x1, y0, -22 if sty == "roof" else -4, 0)
            p.setPen(pen(OUT, 1.0, 170))
            p.setBrush(vgrad(sr, "#c9b8a4", "#9a8674") if sty == "roof" else QColor("#8a5f3e"))
            p.drawRect(sr)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(c0))
            p.drawRect(fr)
            p.save()
            p.setClipRect(fr)
            if sty == "roof":
                _texture(p, "roof", fr)
            else:
                H.floor_texture(p, "deck", x0, y0, x1, y1, c0, c1)
            p.restore()
            p.setPen(pen("#5a2e26", 1.2, 150))
            p.setBrush(Qt.NoBrush)
            p.drawRect(fr)
        return
    base = frect(0, 0, H.PW, H.PD_PLACE)
    c0, c1 = H.STYLES.get(st, ("#ddd", "#ccc"))
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(c0))
    p.drawRect(base)
    p.save()
    p.setClipRect(base)
    if st in ("lawn",):
        H.floor_texture(p, "grass", 0, 0, H.PW, H.PD_PLACE, c0, c1)
    elif st in ("tile", "carpet", "wood", "deck", "stone"):
        H.floor_texture(p, st, 0, 0, H.PW, H.PD_PLACE, c0, c1)
    elif st == "pitch":
        _pitch(p)
    else:
        _texture(p, st, base)
    if key == "pier":
        # the water along the front edge, the planks' edge above it
        sr = srect(0, H.PW, 0, -16, 0)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#7a5a3e"))
        p.drawRect(sr)
    p.restore()
    for kind, sh, extra in d.get("zones", []):
        path = _shape_path(sh)
        p.setPen(Qt.NoPen)
        if kind == "slip":
            col = QColor(190, 225, 245, 200) if key == "snow" else QColor(230, 200, 80, 150)
            p.setBrush(col)
            p.drawPath(path)
            p.setPen(QPen(QColor(255, 255, 255, 170), 1.6))
            b = path.boundingRect()
            p.drawLine(QPointF(b.left() + b.width() * 0.3, b.top() + 4), QPointF(b.left() + b.width() * 0.5, b.top() + 7))
        elif kind == "slow":
            if key == "water":
                g = QRadialGradient(path.boundingRect().center(), path.boundingRect().width() / 2)
                g.setColorAt(0, QColor("#7fd0ee"))
                g.setColorAt(1, QColor("#4fb3dc"))
                p.setPen(pen("#ffffff", 4))
                p.setBrush(g)
                p.drawPath(path)
            else:
                PA.draw_water(p, path, hour)
        elif kind == "belt":
            b = path.boundingRect()
            p.setPen(pen("#3a3a44", 1.2))
            p.setBrush(QColor("#4a4d55"))
            p.drawPath(path)
            p.setPen(QPen(QColor("#f2c94c"), 2))
            dx = 1 if extra[0] > 0 else -1
            x = b.left() + 20
            while x < b.right() - 20:
                cy = b.center().y()
                p.drawPolyline(poly((x - 6 * dx, cy - 6), (x, cy), (x - 6 * dx, cy + 6)))
                x += 50
        elif kind == "bounce" and key == "forest":
            pass
    if key == "ring":
        return


PITCH = dict(x0=60.0, x1=1200.0, y0=40.0, y1=440.0, goal_y0=185.0, goal_y1=315.0)


def _pitch(p):
    """猫咪球场: mown stripes and the white lines."""
    P = PITCH
    p.setPen(Qt.NoPen)
    w = (P["x1"] - P["x0"]) / 12
    for k in range(12):
        if k % 2:
            p.setBrush(QColor(255, 255, 255, 22))
            x = P["x0"] + k * w
            p.drawPolygon(QPolygonF([ipt(x, 0), ipt(x + w, 0), ipt(x + w, H.PD_PLACE), ipt(x, H.PD_PLACE)]))
    p.setPen(QPen(QColor(255, 255, 255, 215), 3))
    p.setBrush(Qt.NoBrush)
    p.drawPolygon(QPolygonF([ipt(P["x0"], P["y0"]), ipt(P["x1"], P["y0"]), ipt(P["x1"], P["y1"]), ipt(P["x0"], P["y1"])]))
    mx = (P["x0"] + P["x1"]) / 2
    my = (P["y0"] + P["y1"]) / 2
    p.drawLine(ipt(mx, P["y0"]), ipt(mx, P["y1"]))
    sx, sy = iso(mx, my)
    p.drawEllipse(QPointF(sx, sy), 80, 80 * H.KY)
    p.setBrush(QColor(255, 255, 255, 215))
    p.drawEllipse(QPointF(sx, sy), 4, 2.5)
    p.setBrush(Qt.NoBrush)
    for x, d in ((P["x0"], 1), (P["x1"], -1)):
        p.drawPolygon(QPolygonF([ipt(x, 130), ipt(x + d * 150, 130), ipt(x + d * 150, 370), ipt(x, 370)]))
        p.drawPolygon(QPolygonF([ipt(x, 190), ipt(x + d * 60, 190), ipt(x + d * 60, 310), ipt(x, 310)]))
        px, py = iso(x + d * 110, my)
        p.setBrush(QColor(255, 255, 255, 215))
        p.drawEllipse(QPointF(px, py), 3.5, 2)
        p.setBrush(Qt.NoBrush)
    # a cat paw in the centre circle
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 60))
    p.drawEllipse(QPointF(sx, sy + 10), 22, 14)
    for dx, dy in ((-20, -10), (-7, -18), (7, -18), (20, -10)):
        p.drawEllipse(QPointF(sx + dx, sy + dy), 7, 5)


# ---------------------------------------------------------------------------------------------- backdrops
def draw_arena_back(p, f, hour):
    d = ARENAS[f]
    if d.get("side"):
        from . import house_games_art as GA
        GA.draw_side_back(p, f, hour)
        return
    key = d["key"]
    yb = iso(0, H.PD_PLACE, 0)[1]
    full = QRectF(H.OX - H.SIDE_T - 2, 0, H.PW + 2 * H.SIDE_T + 4, yb)
    if key == "ring":
        PA.draw_sky(p, 21.0 if H.is_dark(hour) else 15.0, None, full, seed=9)
        # the stands, full of little fans
        for row in range(5):
            y = yb - 20 - row * 26
            r = QRectF(full.left(), y - 22, full.width(), 24)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#8a6a8a").darker(100 + row * 8))
            p.drawRect(r)
            rnd = random.Random(row)
            x = full.left() + 6
            while x < full.right():
                p.setBrush(QColor(rnd.choice(("#f2c94c", "#e46f5b", "#5e9bd6", "#7bbf6a", "#f7b8cf", "#ffffff"))))
                p.drawEllipse(QPointF(x, y - 14), 5, 6)
                p.setBrush(QColor("#f6d3b5"))
                p.drawEllipse(QPointF(x, y - 22), 4, 4)
                x += rnd.uniform(11, 16)
        ban = QRectF(full.center().x() - 140, 14, 280, 30)
        p.setPen(pen("#7a2e26", 1.2))
        p.setBrush(QColor("#c9443a"))
        p.drawRoundedRect(ban, 6, 6)
        p.setPen(QColor("#ffe7a0"))
        p.setFont(QFont("sans", 13, QFont.Bold))
        p.drawText(ban, Qt.AlignCenter, "猫猫咕咕 · 竞技场")
        for x in (full.left() + 120, full.right() - 120):
            g = QRadialGradient(QPointF(x, 20), 120)
            g.setColorAt(0, QColor(255, 250, 200, 90))
            g.setColorAt(1, QColor(255, 250, 200, 0))
            p.setBrush(g)
            p.setPen(Qt.NoPen)
            p.drawEllipse(QPointF(x, 20), 120, 120)
    elif key == "snow":
        PA.draw_sky(p, hour, "snow" if False else None, full, seed=10)
        PA._ridge(p, yb - 30, 70, 150, 0.5, "#c9d6e6", peaks=[(H.OX + 500, 200, 110)])
        PA._snowcaps(p, yb - 30, H.is_dark(hour))
        PA._tree_row(p, yb - 2, H.OX - 10, H.OX + H.PW + 10, 22, "#3f6e4c", H.is_dark(hour), seed=4, scale=1.3, pine=True)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 255, 255, 220))
        rnd = random.Random(1)
        for _ in range(26):
            p.drawEllipse(QPointF(rnd.uniform(full.left(), full.right()), yb - rnd.uniform(4, 40)), 8, 3)
        # a cabin
        cab = QRectF(full.right() - 260, yb - 70, 110, 64)
        p.setPen(pen("#5a3a22", 1.2))
        p.setBrush(QColor("#8a5c3d"))
        p.drawRect(cab)
        p.setBrush(QColor("#ffffff"))
        p.drawPolygon(poly((cab.left() - 10, cab.top()), (cab.right() + 10, cab.top()), (cab.center().x(), cab.top() - 34)))
        p.setBrush(QColor("#ffd88a"))
        p.drawRect(QRectF(cab.left() + 16, cab.top() + 18, 22, 18))
    elif key == "pillow":
        _wall(p, full, yb, "#d9cdee", "#c7b8e2")
        win = QRectF(full.center().x() - 70, yb - 120, 140, 80)
        p.setPen(QPen(QColor("#ffffff"), 5))
        p.setBrush(QColor("#1d2650"))
        p.drawRect(win)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#fff6d8"))
        p.drawEllipse(QPointF(win.right() - 30, win.top() + 24), 12, 12)
        for k, col in enumerate(("#f7b8cf", "#9fd2ee", "#fbe7a6")):
            r = QRectF(full.left() + 80 + k * 140, yb - 110 + (k % 2) * 16, 70, 56)
            p.setPen(pen("#9a8a76", 1))
            p.setBrush(QColor(col))
            p.drawRect(r)
            p.setPen(QColor("#6b4a3a"))
            p.setFont(QFont("sans", 16))
            p.drawText(r, Qt.AlignCenter, ("★", "♥", "☾")[k])
        _garland(p, full.left() + 20, full.right() - 20, yb - 140)
    elif key == "water":
        PA.draw_sky(p, hour, None, full, seed=12)
        # water slides and a big tower behind
        for k, (x0, col) in enumerate(((full.left() + 140, "#e46f5b"), (full.right() - 300, "#5e9bd6"))):
            path = QPainterPath(QPointF(x0, yb - 150))
            path.cubicTo(QPointF(x0 + 120, yb - 140), QPointF(x0 - 40, yb - 60), QPointF(x0 + 140, yb - 10))
            p.setPen(QPen(QColor(col), 16, Qt.SolidLine, Qt.RoundCap))
            p.setBrush(Qt.NoBrush)
            p.drawPath(path)
            p.setPen(QPen(QColor(255, 255, 255, 120), 4, Qt.SolidLine, Qt.RoundCap))
            p.drawPath(path)
            p.setPen(pen("#6f7378", 2))
            p.drawLine(QPointF(x0, yb - 150), QPointF(x0, yb))
        PA._tree_row(p, yb - 2, H.OX - 10, H.OX + H.PW + 10, 70, "#4f9a5e", H.is_dark(hour), seed=8, scale=1.1)
    elif key == "dojo":
        _wall(p, full, yb, "#efe3c8", "#e2d2b0")
        # shoji panels and a calligraphy scroll
        x = full.left() + 10
        while x < full.right() - 60:
            r = QRectF(x, yb - 130, 80, 120)
            p.setPen(pen("#6b4a35", 2))
            p.setBrush(QColor("#fbf6ea"))
            p.drawRect(r)
            p.setPen(QPen(QColor("#6b4a35"), 1))
            for k in range(1, 4):
                p.drawLine(QPointF(r.left() + k * 20, r.top()), QPointF(r.left() + k * 20, r.bottom()))
            for k in range(1, 5):
                p.drawLine(QPointF(r.left(), r.top() + k * 24), QPointF(r.right(), r.top() + k * 24))
            x += 92
            if abs(x - full.center().x()) < 70:
                x += 140
        sc = QRectF(full.center().x() - 40, yb - 150, 80, 130)
        p.setPen(pen("#6b4a35", 1.4))
        p.setBrush(QColor("#fffaf0"))
        p.drawRect(sc)
        p.setPen(QColor("#2b211c"))
        p.setFont(QFont("serif", 40, QFont.Bold))
        p.drawText(sc, Qt.AlignCenter, "武")
    elif key == "roof":
        PA.draw_sky(p, 22.0, None, full, seed=14)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#fff6d8"))
        p.drawEllipse(QPointF(full.left() + 220, 60), 36, 36)
        g = QRadialGradient(QPointF(full.left() + 220, 60), 110)
        g.setColorAt(0, QColor(255, 246, 216, 90))
        g.setColorAt(1, QColor(255, 246, 216, 0))
        p.setBrush(g)
        p.drawEllipse(QPointF(full.left() + 220, 60), 110, 110)
        PA._skyline(p, yb + 10, True)
    elif key == "kitchen":
        _wall(p, full, yb, "#e3efdc", "#cfe3c4")
        p.setPen(QPen(QColor("#ffffff"), 1))
        y = yb - 10
        while y > yb - 160:
            p.drawLine(QPointF(full.left(), y), QPointF(full.right(), y))
            y -= 22
        # giant shelves with jars
        for k in range(3):
            r = QRectF(full.left() + 250 + k * 280, yb - 140, 200, 12)
            p.setPen(pen("#8a5c3d", 1))
            p.setBrush(QColor("#c08a5c"))
            p.drawRect(r)
            for j in range(4):
                jr = QRectF(r.left() + 10 + j * 48, r.top() - 40, 34, 40)
                p.setBrush(QColor(("#f6d35b", "#e8473f", "#7bbf6a", "#f2a65a")[(j + k) % 4]))
                p.drawRoundedRect(jr, 6, 6)
    elif key == "yarn":
        _wall(p, full, yb, "#c9ccd6", "#b3b7c2")
        for k, (x, y, r) in enumerate(((full.left() + 160, yb - 90, 50), (full.right() - 180, yb - 100, 60),
                                       (full.center().x() + 220, yb - 120, 34))):
            _gear(p, x, y, r, k * 0.3)
        # spools of thread on a shelf
        sh = QRectF(full.left() + 360, yb - 70, 420, 8)
        p.setPen(pen("#6f7378", 1))
        p.setBrush(QColor("#8a8f95"))
        p.drawRect(sh)
        for j in range(9):
            x = sh.left() + 20 + j * 44
            p.setBrush(QColor(("#e46f5b", "#5e9bd6", "#f2c94c", "#7bbf6a", "#b8a3ea", "#f7b8cf")[j % 6]))
            p.drawRoundedRect(QRectF(x - 12, sh.top() - 34, 24, 34), 6, 6)
    elif key == "forest":
        PA.draw_sky(p, hour, None, full, seed=17)
        PA._tree_row(p, yb + 4, H.OX - 30, H.OX + H.PW + 30, 26, "#2f6a3e", H.is_dark(hour), seed=3, scale=2.4, pine=True)
        for x in (full.left() + 300, full.right() - 420):
            g = QLinearGradient(x, 0, x + 60, yb)
            g.setColorAt(0, QColor(255, 250, 200, 90))
            g.setColorAt(1, QColor(255, 250, 200, 0))
            p.setPen(Qt.NoPen)
            p.setBrush(g)
            p.drawPolygon(poly((x, 0), (x + 50, 0), (x + 160, yb), (x + 60, yb)))
    elif key == "beach":
        PA.draw_sky(p, hour, None, full, seed=18)
        sea = QRectF(full.left(), yb - 60, full.width(), 60)
        g = QLinearGradient(0, sea.top(), 0, sea.bottom())
        g.setColorAt(0, QColor("#5fa9d6"))
        g.setColorAt(1, QColor("#7fc6e6"))
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawRect(sea)
        p.setPen(QPen(QColor(255, 255, 255, 120), 1.4))
        for k in range(8):
            y = sea.top() + 8 + k * 6
            p.drawLine(QPointF(full.left() + 40 + k * 130, y), QPointF(full.left() + 100 + k * 130, y))
        p.setPen(pen("#ffffff", 1))
        p.setBrush(QColor("#ffffff"))
        p.drawPolygon(poly((full.right() - 300, sea.top() + 10), (full.right() - 270, sea.top() - 30),
                           (full.right() - 270, sea.top() + 10)))
    elif key == "castle":
        PA.draw_sky(p, hour, None, full, seed=19)
        PA._ridge(p, yb - 20, 60, 120, 0.4, "#9fc48a", peaks=[(H.OX + 300, 160, 90), (H.OX + 900, 140, 70)])
        PA._tree_row(p, yb - 2, H.OX - 10, H.OX + H.PW + 10, 40, "#5f9f55", H.is_dark(hour), seed=19, scale=1.2)
        # a plush garden fence with bunting
        p.setPen(pen("#c9a27a", 1))
        p.setBrush(QColor("#fff3dc"))
        x = full.left() + 4
        while x < full.right():
            p.drawRoundedRect(QRectF(x, yb - 34, 12, 32), 5, 5)
            x += 20
        p.setBrush(QColor("#f2d9b0"))
        p.drawRect(QRectF(full.left(), yb - 24, full.width(), 6))
        _garland(p, full.left() + 30, full.right() - 30, yb - 60)
    elif key == "paint":
        PA.draw_sky(p, hour, None, full, seed=20)
        PA._skyline(p, yb - 40, H.is_dark(hour))
        _wall(p, QRectF(full.left(), yb - 90, full.width(), 90), yb, "#e8e0d4", "#d9cfc0")
        rnd = random.Random(20)
        for _ in range(26):                          # paint splashes on the wall
            col = QColor(rnd.choice(("#ff5fa2", "#3fb6ff", "#ffd23f", "#59d16a", "#a26bff", "#ff8a3d")))
            col.setAlpha(170)
            p.setPen(Qt.NoPen)
            p.setBrush(col)
            cx, cy = rnd.uniform(full.left(), full.right()), yb - rnd.uniform(14, 80)
            r = rnd.uniform(8, 22)
            p.drawEllipse(QPointF(cx, cy), r, r * 0.8)
            for k in range(5):
                a = rnd.uniform(0, math.tau)
                p.drawEllipse(QPointF(cx + math.cos(a) * r * 1.4, cy + math.sin(a) * r * 1.1), r * 0.25, r * 0.25)
            p.drawRect(QRectF(cx - 2, cy, 4, rnd.uniform(6, 26)))
    elif key == "pitch":
        PA.draw_sky(p, hour, None, full, seed=21)
        for row in range(4):
            y = yb - 14 - row * 24
            r = QRectF(full.left(), y - 20, full.width(), 22)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#5a7a9a").darker(100 + row * 8))
            p.drawRect(r)
            rnd = random.Random(row + 21)
            x = full.left() + 6
            while x < full.right():
                p.setBrush(QColor(rnd.choice(("#e8473f", "#3b8bd0", "#ffffff", "#f2c94c", "#f7b8cf"))))
                p.drawEllipse(QPointF(x, y - 12), 5, 6)
                p.setBrush(QColor("#f6d3b5") if rnd.random() < 0.6 else QColor("#ffffff"))
                p.drawEllipse(QPointF(x, y - 20), 4, 4)
                x += rnd.uniform(11, 16)
        p.setBrush(QColor("#ffffff"))
        p.setPen(pen("#9a9a9a", 1))
        p.drawRect(QRectF(full.left(), yb - 8, full.width(), 8))
        sb = QRectF(full.center().x() - 90, 14, 180, 34)
        p.setPen(pen("#2a2a30", 1.4))
        p.setBrush(QColor("#2f3440"))
        p.drawRoundedRect(sb, 6, 6)
        p.setPen(QColor("#ffd34c"))
        p.setFont(QFont("sans", 13, QFont.Bold))
        p.drawText(sb, Qt.AlignCenter, "⚽ 猫猫杯")
    elif key == "pier":
        PA.draw_sky(p, hour, None, full, seed=22)
        sea = QRectF(full.left(), yb - 80, full.width(), 80)
        g = QLinearGradient(0, sea.top(), 0, sea.bottom())
        g.setColorAt(0, QColor("#4f97c6"))
        g.setColorAt(1, QColor("#78bde0"))
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawRect(sea)
        p.setPen(QPen(QColor(255, 255, 255, 110), 1.4))
        for k in range(10):
            y = sea.top() + 8 + (k % 5) * 14
            x = full.left() + 60 + k * 120
            p.drawLine(QPointF(x, y), QPointF(x + 50, y))
        for k, x in enumerate((full.left() + 200, full.right() - 340)):
            hull = poly((x, yb - 60), (x + 110, yb - 60), (x + 96, yb - 40), (x + 14, yb - 40))
            p.setPen(pen("#5a3a22", 1.2))
            p.setBrush(QColor(("#e8473f", "#3b8bd0")[k]))
            p.drawPolygon(hull)
            p.setPen(pen("#6b4a35", 2))
            p.drawLine(QPointF(x + 55, yb - 60), QPointF(x + 55, yb - 120))
            p.setPen(pen("#9a8a76", 1))
            p.setBrush(QColor("#fffaf0"))
            p.drawPolygon(poly((x + 57, yb - 118), (x + 57, yb - 66), (x + 96, yb - 66)))
        p.setPen(QPen(QColor("#5e4436"), 1.6))
        for k in range(5):                           # gulls
            x, y = full.left() + 300 + k * 170, 40 + (k % 3) * 18
            p.drawArc(QRectF(x - 8, y, 8, 6), 0, 180 * 16)
            p.drawArc(QRectF(x, y, 8, 6), 0, 180 * 16)
    elif key == "toyhouse":
        _wall(p, full, yb, "#fbe8cf", "#f2d6b3")
        for k in range(3):                           # windows with curtains
            r = QRectF(full.left() + 200 + k * 380, yb - 150, 110, 80)
            p.setPen(QPen(QColor("#ffffff"), 5))
            p.setBrush(QColor("#bfe0f2") if not H.is_dark(hour) else QColor("#1d2650"))
            p.drawRect(r)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#f2b56b"))
            p.drawRect(QRectF(r.left() - 12, r.top() - 6, 26, r.height() + 14))
            p.drawRect(QRectF(r.right() - 14, r.top() - 6, 26, r.height() + 14))
        for k, col in enumerate(("#f7b8cf", "#9fd2ee", "#fbe7a6", "#b8e0a8")):
            r = QRectF(full.left() + 90 + k * 300, yb - 190 + (k % 2) * 10, 46, 36)
            p.setPen(pen("#9a7a5a", 1))
            p.setBrush(QColor(col))
            p.drawRect(r)
        p.setPen(QColor("#b0815a"))
        p.setFont(QFont("sans", 14, QFont.Bold))
        p.drawText(QRectF(full.center().x() - 120, 12, 240, 30), Qt.AlignCenter, "🙈 数到十就来找你哦")
    PA.draw_side_frames(p, "school" if key in ("pillow", "dojo", "kitchen", "yarn", "toyhouse") else "", False)


def _wall(p, full, yb, c0, c1):
    r = QRectF(full.left(), 0, full.width(), yb)
    p.setPen(Qt.NoPen)
    p.setBrush(vgrad(r, c1, c0))
    p.drawRect(r)
    sk = QRectF(full.left(), yb - 10, full.width(), 10)
    p.setBrush(QColor(c1).darker(120))
    p.drawRect(sk)


def _garland(p, x0, x1, y):
    path = QPainterPath(QPointF(x0, y))
    n = 6
    for k in range(n):
        a, b = x0 + (x1 - x0) * k / n, x0 + (x1 - x0) * (k + 1) / n
        path.quadTo(QPointF((a + b) / 2, y + 26), QPointF(b, y))
    p.setPen(QPen(QColor("#9a8a76"), 1.2))
    p.setBrush(Qt.NoBrush)
    p.drawPath(path)
    for k in range(n * 4):
        x = x0 + (x1 - x0) * (k + 0.5) / (n * 4)
        u = ((k + 0.5) / 4) % 1
        yy = y + 26 * 4 * u * (1 - u) * 0.5 + 4
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(("#ffd27a", "#f7b8cf", "#9fd2ee")[k % 3]))
        p.drawEllipse(QPointF(x, yy), 3, 3)


def _gear(p, x, y, r, ph):
    path = QPainterPath()
    n = 10
    pts = []
    for k in range(n * 2):
        a = ph + k * math.pi / n
        rr = r if k % 2 == 0 else r * 0.8
        pts.append(QPointF(x + math.cos(a) * rr, y + math.sin(a) * rr))
    p.setPen(pen("#4a4d55", 1.2))
    p.setBrush(QColor("#8a8f95"))
    p.drawPolygon(QPolygonF(pts))
    p.setBrush(QColor("#c9ccd6"))
    p.drawEllipse(QPointF(x, y), r * 0.3, r * 0.3)


def draw_arena_front(p, f):
    key = ARENAS[f]["key"]
    if ARENAS[f].get("side"):
        return
    if key in ("ring", "roof"):
        return
    col = {"snow": "#ffffff", "pillow": "#c7b8e2", "water": "#ffffff", "dojo": "#8a5c3d", "kitchen": "#c9c4bb",
           "yarn": "#6f7378", "forest": "#8a5c3d", "beach": "#e2cb96", "castle": "#f2d9b0", "paint": "#c9c0b4",
           "pitch": "#ffffff", "pier": "#7a5a3e", "toyhouse": "#d9a877"}.get(key, "#ccc")
    for a, b in ((0.0, 556.0), (704.0, H.PW)):
        box(p, a, -6, 0, b, 0, 8, col, top=QColor(col).lighter(108).name())


# ---------------------------------------------------------------------------------------------- arena scenery
def p_torch(it):
    return [C(0, 0, 0, 4, 70, "#6b4a35", "#8a5c3d"), C(0, 0, 70, 9, 8, "#4f4a46", "#6f685d"), Fn(_torch_fire, 0, 0, 78, True)]


def _torch_fire(p, sx, sy, it, t):
    p.setPen(Qt.NoPen)
    for k, (col, s) in enumerate((("#e8473f", 1.0), ("#f6d35b", 0.55))):
        h = (22 + 5 * math.sin(t * 11 + k)) * s
        p.setBrush(QColor(col))
        p.drawPolygon(poly((sx - 8 * s, sy), (sx + 8 * s, sy), (sx + 2 * math.sin(t * 7), sy - h)))


def p_snow_pile(it):
    return [E(0, 0, 0.5, 30, 20, "#ffffff", "#c9d6e6"), Fn(_snowballs, 0, 0, 4)]


def _snowballs(p, sx, sy, it, t):
    for dx, dy in ((-10, 0), (4, -2), (14, 2), (-2, -9), (8, -10)):
        p.setPen(pen("#b9c8d8", 0.8))
        p.setBrush(QColor("#ffffff"))
        p.drawEllipse(QPointF(sx + dx, sy + dy), 6, 5.5)


def p_big_bed(it):
    return [B(-70, -50, 0, 70, 50, 20, "#c08a5c", "#d4a77a", r=3), B(-66, -46, 20, 66, 46, 30, "#ffffff", "#fbf6ea", r=6),
            B(-66, -46, 30, 66, 24, 34, "#f7b8cf", "#fbd0dd", r=5), B(-60, 28, 30, 60, 46, 40, "#ffffff", "#fffdf7", r=6),
            Fn(_bed_bounce, 0, 0, 34, True)]


def _bed_bounce(p, sx, sy, it, t):
    k = it.state.get("bounce", 0.0)
    if k <= 0:
        return
    p.setPen(QPen(QColor(255, 255, 255, int(200 * k)), 2))
    p.setBrush(Qt.NoBrush)
    p.drawEllipse(QPointF(sx, sy), 60 * (1.2 - k * 0.4), 18 * (1.2 - k * 0.4))


def p_pillow_pile(it):
    return [Fn(_pillows, 0, 0, 0)]


def _pillows(p, sx, sy, it, t):
    for k, (dx, dy, col) in enumerate(((-14, 0, "#9fd2ee"), (12, -2, "#fbe7a6"), (0, -12, "#f7b8cf"), (-4, -22, "#ffffff"))):
        p.setPen(pen("#9a8a76", 0.8))
        p.setBrush(QColor(col))
        p.drawRoundedRect(QRectF(sx + dx - 14, sy + dy - 8, 28, 16), 7, 7)


def p_bucket_tower(it):
    return [B(-26, -26, 0, -22, -22, 120, "#e46f5b"), B(22, -26, 0, 26, -22, 120, "#e46f5b"),
            B(-26, 22, 0, -22, 26, 120, "#e46f5b"), B(22, 22, 0, 26, 26, 120, "#e46f5b"),
            B(-30, -30, 116, 30, 30, 122, "#f2c94c", "#f6d878"), Fn(_bucket_top, 0, 0, 122, True)]


def _bucket_top(p, sx, sy, it, t):
    tip = it.state.get("tip", 0.0)
    p.save()
    p.translate(sx, sy - 20)
    p.rotate(-50 * tip)
    p.setPen(pen("#2f7a9a", 1.4))
    p.setBrush(QColor("#5fc3e4"))
    p.drawPolygon(poly((-30, -26), (30, -26), (24, 20), (-24, 20)))
    p.setBrush(QColor("#9fdcef"))
    p.drawEllipse(QPointF(0, -26), 30, 8)
    p.restore()


def p_gun_crate(it):
    return [B(-22, -16, 0, 22, 16, 26, "#c08a5c", "#d4a77a"), Fn(_guns, 0, 0, 26)]


def _guns(p, sx, sy, it, t):
    for k, col in enumerate(("#f2c94c", "#5fc3e4")):
        x = sx - 10 + k * 14
        p.setPen(pen(QColor(col).darker(150).name(), 0.8))
        p.setBrush(QColor(col))
        p.drawRoundedRect(QRectF(x - 6, sy - 14, 16, 7), 2, 2)
        p.drawRect(QRectF(x - 4, sy - 8, 4, 7))


def p_palm(it):
    return [Fn(_palm, 0, 0, 0, True)]


def _palm(p, sx, sy, it, t):
    p.setPen(QPen(QColor("#8a6a4a"), 7, Qt.SolidLine, Qt.RoundCap))
    path = QPainterPath(QPointF(sx, sy))
    path.quadTo(QPointF(sx + 10, sy - 60), QPointF(sx + 4, sy - 120))
    p.drawPath(path)
    tx, ty = sx + 4, sy - 120
    sw = 3 * math.sin(t * 1.3 + it.x)
    p.setPen(pen("#2f6a3e", 1.0))
    p.setBrush(QColor("#4f9a5e"))
    for k in range(6):
        a = math.pi + k * math.pi / 5 + 0.1 * math.sin(t + k)
        ex, ey = tx + math.cos(a) * 52 + sw, ty + math.sin(a) * 22 + 22
        path = QPainterPath(QPointF(tx, ty))
        path.quadTo(QPointF((tx + ex) / 2, ty - 18), QPointF(ex, ey))
        path.quadTo(QPointF((tx + ex) / 2, ty - 6), QPointF(tx, ty))
        p.drawPath(path)


def p_pillar(it):
    return [C(0, 0, 0, 16, 140, "#a8443a", "#c9574c"), C(0, 0, 0, 20, 8, "#4f4a46", "#6f685d")]


def p_dummy(it):
    return [B(-3, -3, 0, 3, 3, 80, "#8a5c3d"), C(0, 0, 30, 14, 40, "#d9c08a", "#e8d4a6"),
            C(0, 0, 72, 10, 16, "#d9c08a", "#e8d4a6"), B(-24, -2, 52, 24, 2, 56, "#8a5c3d")]


def p_gong(it):
    return [B(-40, -4, 0, -36, 4, 110, "#6b4a35"), B(36, -4, 0, 40, 4, 110, "#6b4a35"), B(-42, -4, 106, 42, 4, 112, "#6b4a35"),
            Fn(_gong_disc, 0, 0, 62, True)]


def _gong_disc(p, sx, sy, it, t):
    sw = it.state.get("ring", 0.0)
    p.setPen(QPen(QColor("#6b4a35"), 1))
    p.drawLine(QPointF(sx - 10, sy - 42), QPointF(sx - 8 + sw * 2 * math.sin(t * 20), sy - 30))
    p.drawLine(QPointF(sx + 10, sy - 42), QPointF(sx + 8 + sw * 2 * math.sin(t * 20), sy - 30))
    g = QRadialGradient(QPointF(sx - 6, sy - 6), 32)
    g.setColorAt(0, QColor("#f6d878"))
    g.setColorAt(1, QColor("#c99a3a"))
    p.setPen(pen("#8a6a2a", 1.2))
    p.setBrush(g)
    p.drawEllipse(QPointF(sx + sw * 2 * math.sin(t * 20), sy), 28, 28)


def p_chimney(it):
    return [B(-24, -18, 0, 24, 18, 70, "#b05a48", "#c9705c"), B(-28, -22, 70, 28, 22, 78, "#8a463a", "#a3584a"),
            Fn(_smoke_puffs, 0, 0, 80, True)]


def _smoke_puffs(p, sx, sy, it, t):
    p.setPen(Qt.NoPen)
    for k in range(3):
        ph = (t * 0.25 + k / 3) % 1.0
        p.setBrush(QColor(200, 200, 210, int(110 * (1 - ph))))
        p.drawEllipse(QPointF(sx + 8 * math.sin(t + k) + ph * 14, sy - ph * 60), 8 + ph * 10, 6 + ph * 8)


def p_antenna(it):
    return [B(-2, -2, 0, 2, 2, 110, "#8a8f95"), B(-30, -1, 80, 30, 1, 82, "#8a8f95"), B(-20, -1, 96, 20, 1, 98, "#8a8f95")]


def p_island(it):
    return [B(-92, -32, 0, 92, 32, 54, "#5e9bd6", "#7cb2e6"), B(-96, -36, 54, 96, 36, 60, "#efe9de", "#ffffff"),
            Fr(-86, 8, -4, 46, "#7cb2e6"), Fr(4, 8, 86, 46, "#7cb2e6"), Fn(_board_food, 0, 0, 60)]


def _board_food(p, sx, sy, it, t):
    p.setPen(pen("#8a5c3d", 1))
    p.setBrush(QColor("#d9b48a"))
    p.drawRoundedRect(QRectF(sx - 40, sy - 8, 50, 14), 3, 3)
    p.setBrush(QColor("#f29a3e"))
    p.drawEllipse(QPointF(sx + 30, sy - 4), 8, 7)
    p.setBrush(QColor("#9fc3dc"))
    p.drawEllipse(QPointF(sx - 18, sy - 2), 14, 5)


def p_big_fridge(it):
    return [B(-50, -30, 0, 50, 30, 150, "#e9eef2", "#f4f7f9", r=3), Fr(-44, 10, 44, 80, "#dfe6ec"),
            Fr(-44, 86, 44, 144, "#dfe6ec"), B(30, -32, 30, 34, -30, 70, "#9aa2ac")]


def p_big_stove(it):
    return [B(-50, -30, 0, 50, 30, 62, "#f2f2f2", "#3a3a44", r=2), E(-20, 0, 62.3, 14, 14, "#55555f", None),
            E(20, 0, 62.3, 14, 14, "#55555f", None), Fr(-40, 10, 40, 44, "#2f2f36"), Fn(_pot_steam, 20, 0, 62, True)]


def _pot_steam(p, sx, sy, it, t):
    p.setPen(pen("#3a3a44", 1))
    p.setBrush(QColor("#c9604a"))
    p.drawRoundedRect(QRectF(sx - 16, sy - 20, 32, 20), 3, 3)
    p.setPen(Qt.NoPen)
    for k in range(3):
        ph = (t * 0.6 + k / 3) % 1.0
        p.setBrush(QColor(255, 255, 255, int(140 * (1 - ph))))
        p.drawEllipse(QPointF(sx + 5 * math.sin(t * 2 + k), sy - 24 - ph * 40), 5 + ph * 6, 5 + ph * 6)


def p_spool(it):
    return [C(0, 0, 0, 30, 10, "#a8714b", "#c08a5c"), C(0, 0, 10, 22, 60, "#e46f5b", "#f08a7a"),
            C(0, 0, 70, 30, 10, "#a8714b", "#c08a5c")]


def p_gear_wall(it):
    return [B(-200, -6, 0, 200, 6, 40, "#6f7378", "#8a8f95"), Fn(_gear_row, 0, -6, 20, True)]


def _gear_row(p, sx, sy, it, t):
    for k in range(-3, 4):
        _gear(p, sx + k * 56, sy, 18, t * (1 if k % 2 else -1))


def p_stump(it):
    return [C(0, 0, 0, 30, 30, "#8a5c3d", "#d9b48a"), Fn(_rings, 0, 0, 30)]


def _rings(p, sx, sy, it, t):
    p.setPen(QPen(QColor("#a8714b"), 1))
    p.setBrush(Qt.NoBrush)
    for r in (8, 16, 24):
        p.drawEllipse(QPointF(sx, sy), r, r * H.KY)


def p_mushroom(it):
    return [Fn(_mushroom, 0, 0, 0, True)]


def _mushroom(p, sx, sy, it, t):
    sq = it.state.get("bounce", 0.0)
    h = 24 * (1 - 0.35 * sq)
    p.setPen(pen("#b9a88a", 1))
    p.setBrush(QColor("#f6eccf"))
    p.drawRoundedRect(QRectF(sx - 10, sy - h, 20, h), 4, 4)
    p.setPen(pen("#9c2e24", 1.2))
    p.setBrush(QColor("#e8473f"))
    w = 48 * (1 + 0.15 * sq)
    p.drawChord(QRectF(sx - w, sy - h - 30, 2 * w, 50), 0, 180 * 16)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#ffffff"))
    for dx, dy, r in ((-22, -h - 14, 6), (8, -h - 22, 5), (26, -h - 10, 4)):
        p.drawEllipse(QPointF(sx + dx, sy + dy), r, r * 0.8)


def p_beach_umbrella(it):
    return [C(0, 0, 0, 1.6, 90, "#a8a8b0"), Fn(PA._parasol, 0, 0, 92), E(0, -30, 0.5, 40, 24, "#5e9bd6", None)]


def p_flag_post(it):
    return [C(0, 0, 0, 3, 110, "#9aa2ac", "#c9ced4"), Fn(_flag, 0, 0, 110, True)]


def _flag(p, sx, sy, it, t):
    w = 3 * math.sin(t * 4 + it.x)
    path = QPainterPath(QPointF(sx + 2, sy))
    path.quadTo(QPointF(sx + 20, sy - 4 + w), QPointF(sx + 38, sy + 2 + w))
    path.lineTo(QPointF(sx + 38, sy + 22 + w))
    path.quadTo(QPointF(sx + 20, sy + 16 - w), QPointF(sx + 2, sy + 22))
    path.closeSubpath()
    p.setPen(pen("#9c2e24", 1))
    p.setBrush(QColor("#f7b8cf" if it.x < 630 else "#9fd2ee"))
    p.drawPath(path)
    p.setPen(QColor("#6b3f1a"))
    p.setFont(QFont("sans", 9, QFont.Bold))
    p.drawText(QRectF(sx + 4, sy + 1, 32, 18), Qt.AlignCenter, "🐾")


def p_paint_bucket(it):
    return [C(0, 0, 0, 34, 46, "#cfd6dc", "#e9eef2"), Fn(_bucket_paint, 0, 0, 46, True)]


def _bucket_paint(p, sx, sy, it, t):
    cols = ("#ff5fa2", "#3fb6ff", "#ffd23f", "#59d16a")
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(cols[int(t * 0.5) % 4]))
    p.drawEllipse(QPointF(sx, sy), 30, 30 * H.KY)
    for k, col in enumerate(cols):                  # drips down the side
        p.setBrush(QColor(col))
        x = sx - 24 + k * 16
        h = 10 + 6 * math.sin(t * 1.5 + k)
        p.drawRoundedRect(QRectF(x - 3, sy + 8, 6, h + 6), 3, 3)


def p_crate(it):
    return [B(-26, -22, 0, 26, 22, 40, "#b98d63", "#d6ae84", r=2), Fn(_crate_slats, 0, -22, 20)]


def _crate_slats(p, sx, sy, it, t):
    p.setPen(QPen(QColor("#8a5c3d"), 1.2))
    p.drawLine(QPointF(sx - 24, sy - 18), QPointF(sx + 24, sy + 18))
    p.drawLine(QPointF(sx - 24, sy + 18), QPointF(sx + 24, sy - 18))


def p_fish_stall(it):
    return [B(-90, -24, 0, 90, 24, 44, "#5e9bd6", "#7cb2e6"), B(-94, -28, 44, 94, 28, 50, "#f3ece0", "#ffffff"),
            C(-86, -20, 50, 2, 60, "#9aa2ac"), C(86, -20, 50, 2, 60, "#9aa2ac"), Fn(_stall_top, 0, 0, 50, True)]


def _stall_top(p, sx, sy, it, t):
    for k in range(6):                                # fish on ice
        x = sx - 70 + k * 28
        p.setPen(pen("#4f7f9f", 0.8))
        p.setBrush(QColor("#9fc3dc") if k % 3 else QColor("#f2b630"))
        p.drawEllipse(QPointF(x, sy - 6), 11, 5)
        p.drawPolygon(poly((x - 10, sy - 6), (x - 16, sy - 11), (x - 16, sy - 1)))
    # the striped awning
    for k in range(9):
        x0 = sx - 96 + k * 21.3
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e8473f") if k % 2 == 0 else QColor("#ffffff"))
        p.drawRect(QRectF(x0, sy - 78, 21.3, 18))
        p.drawChord(QRectF(x0, sy - 68, 21.3, 14), 180 * 16, 180 * 16)


def p_bollard(it):
    return [C(0, 0, 0, 12, 22, "#4f4a46", "#6f685d"), C(0, 0, 22, 15, 5, "#3a3530", "#5a544e")]


ARENA_CATALOG = {
    "torch": dict(name="火把", w=20, d=20, h=90, parts=p_torch, spots=[]),
    "snow_pile": dict(name="雪球堆", w=60, d=40, h=12, parts=p_snow_pile, walk=True, spots=[]),
    "big_bed": dict(name="蹦蹦床", w=140, d=100, h=40, parts=p_big_bed, walk=True, sig=lambda it: 0,
                    spots=[S("sleep", 0, 0, 34), S("sit", -30, -40, 30, "person", face=(0, -1))]),
    "pillow_pile": dict(name="枕头堆", w=50, d=40, h=30, parts=p_pillow_pile, walk=True, spots=[]),
    "bucket_tower": dict(name="大水桶", w=60, d=60, h=150, parts=p_bucket_tower, block=(56, 56), spots=[]),
    "gun_crate": dict(name="水枪箱", w=44, d=32, h=26, parts=p_gun_crate, spots=[S("perch", 0, 0, 26)]),
    "palm": dict(name="椰子树", w=60, d=60, h=150, parts=p_palm, block=(16, 16), spots=[]),
    "pillar": dict(name="柱子", w=40, d=40, h=140, parts=p_pillar, block=(36, 36), spots=[]),
    "dummy": dict(name="木人桩", w=50, d=30, h=86, parts=p_dummy, block=(28, 28), spots=[]),
    "gong": dict(name="铜锣", w=86, d=12, h=112, parts=p_gong, spots=[]),
    "chimney": dict(name="烟囱", w=56, d=44, h=80, parts=p_chimney, block=(52, 40), spots=[S("perch", 0, 0, 78)]),
    "antenna": dict(name="天线", w=60, d=6, h=110, parts=p_antenna, block=(8, 8), spots=[]),
    "island": dict(name="料理台", w=192, d=72, h=60, parts=p_island, block=(190, 70), spots=[S("perch", 40, 0, 60)]),
    "big_fridge": dict(name="大冰箱", w=100, d=60, h=150, parts=p_big_fridge, block=(96, 56), spots=[]),
    "big_stove": dict(name="大灶台", w=100, d=60, h=62, parts=p_big_stove, block=(96, 56), spots=[]),
    "spool": dict(name="线轴", w=60, d=60, h=80, parts=p_spool, block=(58, 58), spots=[S("perch", 0, 0, 80)]),
    "gear_wall": dict(name="齿轮机", w=400, d=12, h=40, parts=p_gear_wall, block=(400, 10), spots=[]),
    "stump": dict(name="树桩", w=60, d=60, h=30, parts=p_stump, block=(56, 56), spots=[S("perch", 0, 0, 30)]),
    "mushroom": dict(name="大蘑菇", w=96, d=40, h=60, parts=p_mushroom, walk=True, spots=[]),
    "beach_umbrella": dict(name="遮阳伞", w=80, d=60, h=100, parts=p_beach_umbrella, block=(10, 10), spots=[]),
    "flag_post": dict(name="旗杆", w=40, d=10, h=134, parts=p_flag_post, block=(8, 8), spots=[]),
    "paint_bucket": dict(name="大颜料桶", w=72, d=72, h=50, parts=p_paint_bucket, block=(64, 60), spots=[]),
    "crate": dict(name="木箱", w=56, d=48, h=40, parts=p_crate, block=(52, 44), spots=[S("perch", 0, 0, 40)]),
    "fish_stall": dict(name="鱼摊", w=190, d=58, h=130, parts=p_fish_stall, block=(186, 52), spots=[]),
    "bollard": dict(name="系缆桩", w=30, d=30, h=27, parts=p_bollard, block=(24, 24), spots=[]),
}
for _k, _v in ARENA_CATALOG.items():
    _v.setdefault("group", "对战")
    _v["place"] = True
    H.CATALOG[_k] = _v


# ---------------------------------------------------------------------------------------------- the fight, drawn
TEAM_COLORS = {0: "#e8473f", 1: "#3b8bd0", 2: "#f2b630", 3: "#5fb36a"}


def draw_battle_floor(p, b, t):
    """Under everything that stands: team rings, warning circles, shadows of things about to fall."""
    if getattr(b, "game", "melee") in ("brawl", "race", "bomb", "defend", "paint", "soccer", "fish", "hide", "volley"):
        from . import house_games_art as GA
        GA.draw_floor(p, b, t)
        return
    for fi in b.fighters:
        a = fi.a
        if a.f != b.f or a.traveling is not None:
            continue
        sx, sy = iso(a.x, a.y, 0)
        col = QColor(TEAM_COLORS.get(fi.team, "#999"))
        if fi.st in ("ko", "fall"):
            col.setAlpha(60)
        r = 24 if a.is_cat else 20
        p.setPen(QPen(col, 2.4))
        c2 = QColor(col)
        c2.setAlpha(50)
        p.setBrush(c2)
        p.drawEllipse(QPointF(sx, sy), r, r * 0.42)
        if fi.inv > 0 and int(t * 12) % 2:
            p.setPen(QPen(QColor(255, 255, 255, 200), 2))
            p.setBrush(Qt.NoBrush)
            p.drawEllipse(QPointF(sx, sy), r + 4, (r + 4) * 0.42)
        # facing arrow
        ax, ay = sx + fi.fx * (r + 8), sy - fi.fy * (r + 8) * H.KY
        p.setPen(Qt.NoPen)
        p.setBrush(col)
        nx, ny = -fi.fy * 5, -fi.fx * 5 * H.KY
        p.drawPolygon(poly((ax + fi.fx * 7, ay - fi.fy * 7 * H.KY), (ax + nx, ay + ny), (ax - nx, ay - ny)))
        if fi.z > 2:
            p.setBrush(QColor(0, 0, 0, 50))
            p.drawEllipse(QPointF(sx, sy), r * 0.8, r * 0.3)
    hz = b.hz
    bk = hz.get("bucket")
    if bk and bk.get("warn"):
        x, y = bk["warn"]
        sx, sy = iso(x, y)
        k = 1 - max(0.0, min(1.0, bk.get("next", 2) / 2.0))
        p.setPen(QPen(QColor(60, 160, 230, 220), 2.4, Qt.DashLine))
        p.setBrush(QColor(60, 160, 230, int(40 + 90 * k)))
        p.drawEllipse(QPointF(sx, sy), 95, 95 * H.KY)
    for r in (hz.get("pinecones") or {}).get("list", []):
        sx, sy = iso(r["x"], r["y"])
        k = min(1.0, r["t"] / 1.2)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(0, 0, 0, int(30 + 90 * k)))
        p.drawEllipse(QPointF(sx, sy), 10 + 22 * k, (10 + 22 * k) * 0.45)
    for it in b.items:
        sx, sy = iso(it["x"], it["y"])
        g = QRadialGradient(QPointF(sx, sy), 26)
        g.setColorAt(0, QColor(255, 240, 150, 150))
        g.setColorAt(1, QColor(255, 240, 150, 0))
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawEllipse(QPointF(sx, sy), 26, 12)


def draw_obstacle(p, o, t):
    if o.get("k") == "barricade":
        _barricade(p, o, t)
        return
    if str(o.get("k", "")).startswith("b_"):
        from . import house_games_art as GA
        GA.draw_obstacle(p, o, t)
        return
    sx, sy = iso(o["x"], o["y"])
    hp = o["hp"]
    if hp <= 0:
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 255, 255, 160) if o["k"] == "snow_wall" else QColor(226, 203, 150, 180))
        p.drawEllipse(QPointF(sx, sy), o["w"] / 2, 9)
        return
    k = hp / 3.0
    if o["k"] == "snow_wall":
        w, d, h = o["w"], o["d"], 40 * (0.5 + 0.5 * k)
        box(p, o["x"] - w / 2, o["y"] - d / 2, 0, o["x"] + w / 2, o["y"] + d / 2, h, "#eef4f9", top="#ffffff", radius=6)
        p.setPen(QPen(QColor(180, 200, 220, 160), 1))
        for j in range(1, 3):
            p.drawLine(ipt(o["x"] - w / 2 + 4, o["y"] - d / 2, h * j / 3), ipt(o["x"] + w / 2 - 4, o["y"] - d / 2, h * j / 3))
    else:
        # a sandcastle
        h = 36 * (0.5 + 0.5 * k)
        box(p, o["x"] - 30, o["y"] - 22, 0, o["x"] + 30, o["y"] + 22, h * 0.6, "#e2cb96", top="#efdcae", radius=3)
        for dx in (-20, 0, 20):
            cyl(p, o["x"] + dx, o["y"] - 6, h * 0.6, 7, h * 0.5, "#d9bf86", "#efdcae")
        sx2, sy2 = iso(o["x"], o["y"] - 6, h * 1.1 + 8)
        p.setPen(pen("#6b4a35", 1))
        p.drawLine(QPointF(sx2, sy2), QPointF(sx2, sy2 - 14))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e8473f"))
        p.drawPolygon(poly((sx2, sy2 - 14), (sx2 + 10, sy2 - 11), (sx2, sy2 - 8)))


def _barricade(p, o, t):
    """合作守家: a wall of pillows (it gets lower as the monsters chew it)."""
    if o["hp"] <= 0:
        return
    k = max(0.25, o["hp"] / 8.0)
    w, d = o["w"], o["d"]
    x0, y0 = o["x"] - w / 2, o["y"] - d / 2
    cols = ("#f7b8cf", "#9fd2ee", "#fbe7a6", "#c9e8b8")
    if w >= d:
        n = max(2, int(w / 30))
        for row in range(2 if k > 0.55 else 1):
            for j in range(n):
                px = x0 + (j + 0.5) * w / n + (8 if row else 0)
                if px > x0 + w:
                    continue
                box(p, px - w / n / 2 + 1, y0, row * 16, px + w / n / 2 - 1, y0 + d, row * 16 + 18,
                    cols[(j + row) % 4], radius=6)
    else:
        n = max(2, int(d / 30))
        for row in range(2 if k > 0.55 else 1):
            for j in range(n - 1, -1, -1):
                py = y0 + (j + 0.5) * d / n
                box(p, x0, py - d / n / 2 + 1, row * 16, x0 + w, py + d / n / 2 - 1, row * 16 + 18,
                    cols[(j + row) % 4], radius=6)


def _item_icon(p, k, x, y, t):
    bob = 3 * math.sin(t * 4 + x)
    y = y - 10 + bob
    if k == "fish":
        PA.draw_prop(p, "fish", x - 2, y - 14, t)
        p.setPen(pen("#4f7f9f", 0.8))
        p.setBrush(QColor("#9fc3dc"))
        p.drawEllipse(QPointF(x, y), 10, 5)
        p.drawPolygon(poly((x - 9, y), (x - 15, y - 5), (x - 15, y + 5)))
    elif k == "power":
        p.setPen(pen("#3f7a3a", 1))
        p.setBrush(QColor("#7bbf6a"))
        for a in (-0.6, 0, 0.6):
            p.save()
            p.translate(x, y + 4)
            p.rotate(math.degrees(a))
            p.drawEllipse(QPointF(0, -8), 4, 9)
            p.restore()
        p.setPen(QColor("#f2c94c"))
        p.setFont(QFont("sans", 9, QFont.Bold))
        p.drawText(QRectF(x - 6, y - 26, 12, 12), Qt.AlignCenter, "⚡")
    elif k == "speed":
        p.setPen(pen("#9c3a2e", 1))
        p.setBrush(QColor("#e46f5b"))
        p.drawRoundedRect(QRectF(x - 11, y - 6, 20, 9), 4, 4)
        p.setBrush(QColor("#ffffff"))
        p.drawRect(QRectF(x - 11, y + 1, 22, 3))
        p.setPen(QPen(QColor(255, 255, 255, 200), 1.4))
        p.drawLine(QPointF(x - 22, y - 2), QPointF(x - 14, y - 2))
        p.drawLine(QPointF(x - 20, y + 2), QPointF(x - 14, y + 2))
    elif k == "shield":
        p.setPen(pen("#2f5f8f", 1.2))
        p.setBrush(QColor("#9fd2ee"))
        p.drawPolygon(poly((x - 9, y - 10), (x + 9, y - 10), (x + 9, y), (x, y + 8), (x - 9, y)))
    elif k == "yarn_bomb":
        _yarn(p, x, y, 9, t, "#e46f5b")
        p.setPen(QPen(QColor("#6b4a35"), 1.2))
        p.drawLine(QPointF(x + 6, y - 6), QPointF(x + 12, y - 13))
        if int(t * 8) % 2:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#f6d35b"))
            p.drawEllipse(QPointF(x + 13, y - 14), 2.4, 2.4)


def _yarn(p, x, y, r, rot, col):
    p.setPen(pen(QColor(col).darker(140).name(), 1))
    p.setBrush(QColor(col))
    p.drawEllipse(QPointF(x, y), r, r)
    p.setPen(QPen(QColor(col).lighter(130), 1))
    for k in range(3):
        a = rot + k * 1.0
        p.drawArc(QRectF(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6), int(math.degrees(a) * 16), 120 * 16)


def draw_battle_things(p, b, t):
    """Items, flying things and rolling hazards (drawn over the floor, before the fighters' bubbles)."""
    if getattr(b, "game", "melee") != "melee":
        from . import house_games_art as GA
        if GA.draw_things(p, b, t):
            return
    for it in b.items:
        sx, sy = iso(it["x"], it["y"])
        _item_icon(p, it["k"], sx, sy, t)
    hz = b.hz
    for r in (hz.get("oranges") or {}).get("list", []):
        sx, sy = iso(r["x"], r["y"], 12)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(0, 0, 0, 40))
        p.drawEllipse(QPointF(sx, sy + 12), 12, 4)
        p.setPen(pen("#c96a1a", 1))
        p.setBrush(QColor("#f29a3e"))
        p.drawEllipse(QPointF(sx, sy), 12, 12)
        p.setPen(QPen(QColor("#d97a2a"), 1))
        a = r.get("rot", 0)
        p.drawLine(QPointF(sx + math.cos(a) * 10, sy + math.sin(a) * 10), QPointF(sx - math.cos(a) * 10, sy - math.sin(a) * 10))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#5f9f55"))
        p.drawEllipse(QPointF(sx + math.cos(a + 1.6) * 9, sy + math.sin(a + 1.6) * 9), 3, 2)
    for r in (hz.get("yarnballs") or {}).get("list", []):
        sx, sy = iso(r["x"], r["y"], 14)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(0, 0, 0, 40))
        p.drawEllipse(QPointF(sx, sy + 14), 14, 4)
        _yarn(p, sx, sy, 14, r.get("rot", 0), "#b8a3ea")
    for r in (hz.get("crabs") or {}).get("list", []):
        sx, sy = iso(r["x"], r["y"])
        snap = abs(math.sin(t * 6 + r["x"]))
        p.setPen(pen("#9c2e24", 1))
        p.setBrush(QColor("#e8473f"))
        p.drawEllipse(QPointF(sx, sy - 6), 11, 7)
        for d in (-1, 1):
            p.drawEllipse(QPointF(sx + d * 14, sy - 12 - snap * 2), 4, 3.5)
            p.drawLine(QPointF(sx + d * 8, sy - 3), QPointF(sx + d * 13, sy + 1))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#ffffff"))
        p.drawEllipse(QPointF(sx - 3, sy - 13), 2, 2)
        p.drawEllipse(QPointF(sx + 3, sy - 13), 2, 2)
    for r in (hz.get("pinecones") or {}).get("list", []):
        k = min(1.0, r["t"] / 1.2)
        sx, sy = iso(r["x"], r["y"], 240 * (1 - k))
        p.setPen(pen("#5a3a22", 1))
        p.setBrush(QColor("#8a5c3d"))
        p.drawEllipse(QPointF(sx, sy - 8), 6, 9)
    wv = hz.get("waves")
    if wv and wv.get("y") is not None:
        y = wv["y"]
        path = QPainterPath()
        pts = []
        for i in range(0, 64):
            x = i * H.PW / 63
            sx, sy = iso(x, y + 8 * math.sin(i * 0.6 + t * 4), 6)
            pts.append(QPointF(sx, sy))
        path.moveTo(pts[0])
        for q in pts[1:]:
            path.lineTo(q)
        bx0, by0 = iso(H.PW, min(H.PD_PLACE, y + 120), 0)
        bx1, by1 = iso(0, min(H.PD_PLACE, y + 120), 0)
        path.lineTo(QPointF(bx0, by0))
        path.lineTo(QPointF(bx1, by1))
        path.closeSubpath()
        p.setPen(QPen(QColor(255, 255, 255, 230), 3))
        p.setBrush(QColor(110, 190, 230, 140))
        p.drawPath(path)
    for pj in b.projs:
        sx, sy = iso(pj["x"], pj["y"], pj["z"])
        gx, gy = iso(pj["x"], pj["y"], 0)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(0, 0, 0, 40))
        p.drawEllipse(QPointF(gx, gy), 7, 2.6)
        k = pj["k"]
        if k == "snowball":
            p.setPen(pen("#b9c8d8", 1))
            p.setBrush(QColor("#ffffff"))
            p.drawEllipse(QPointF(sx, sy), 7, 7)
        elif k == "water":
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(110, 200, 245, 220))
            p.drawEllipse(QPointF(sx, sy), 6, 4)
            p.setBrush(QColor(255, 255, 255, 180))
            p.drawEllipse(QPointF(sx - 1.5, sy - 1), 2, 1.4)
        elif k == "pillow":
            p.save()
            p.translate(sx, sy)
            p.rotate(math.degrees(pj.get("rot", 0)))
            p.setPen(pen("#9a8a76", 1))
            p.setBrush(QColor("#f7b8cf"))
            p.drawRoundedRect(QRectF(-14, -8, 28, 16), 7, 7)
            p.restore()
        elif k == "yarn_bomb":
            _yarn(p, sx, sy, 9, pj.get("rot", 0), "#e46f5b")
        else:
            p.save()
            p.translate(sx, sy)
            p.rotate(math.degrees(pj.get("rot", 0)) * 0.5)
            H.draw_plush(p, "bunny", 0, 10, 0.55, "#fbf8f2")
            p.restore()


def draw_battle_fx(p, b, t, font, me_uid=None):
    g = getattr(b, "game", "melee")
    from . import house_pals as PL
    PL.draw_pals(p, b, t)
    if g != "melee":
        from . import house_games_art as GA
        done = GA.draw_fx(p, b, t, font, me_uid)
        _draw_battle_fx(p, b, t, font, skip=done | {"ring", "boom"} if g in ("brawl", "race", "volley") else done,
                        fighters=g == "shoot")
        if b.phase in ("fight", "count"):
            GA.draw_head_hints(p, b, t, font, me_uid)
        return
    from . import house_fanim as FA
    for e in b.fx:
        if e["k"] == "burst":
            FA.draw_burst(p, e, iso)
    _draw_battle_fx(p, b, t, font)
    if b.phase in ("fight", "count"):
        draw_head_hints(p, b, t, font, me_uid)


AMMO_NAMES = {"snowball": "雪球", "pillow": "枕头", "water": "水枪", "yarn_bomb": "毛线炸弹", "plush": "玩偶"}
PILE_AMMO = {"snow_pile": "snowball", "pillow_pile": "pillow", "gun_crate": "water"}


def near_pile(b, fi, r=70):
    for it in getattr(b, "ammo_piles", None) or []:
        if math.hypot(it.x - fi.a.x, it.y - fi.a.y) < r:
            return PILE_AMMO.get(it.type)
    return None


def keycap(p, r, label, font, hot=False, dim=False):
    """A little keyboard key with its label."""
    p.setPen(QPen(QColor("#6b4a3a") if not dim else QColor("#b0a294"), 1.4))
    p.setBrush(QColor("#ffd99a") if hot else (QColor("#f3ece2") if dim else QColor("#fffaf0")))
    p.drawRoundedRect(r, 5, 5)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(0, 0, 0, 30))
    p.drawRoundedRect(QRectF(r.left() + 2, r.bottom() - 4, r.width() - 4, 3), 1.5, 1.5)
    f2 = QFont(font)
    f2.setBold(True)
    f2.setPixelSize(max(9, int(r.height() * (0.52 if len(label) <= 2 else 0.42))))
    p.setFont(f2)
    p.setPen(QColor("#5e4436") if not dim else QColor("#9a8a76"))
    p.drawText(r.adjusted(0, -2, 0, -2), Qt.AlignCenter, label)


def bubble_hint(p, sx, sy, key, text, font, hot=False):
    f2 = QFont(font)
    f2.setPixelSize(12)
    f2.setBold(True)
    fm = QFontMetricsF(f2)
    kw = max(20.0, fm.horizontalAdvance(key) + 10)
    tw = fm.horizontalAdvance(text)
    w = kw + tw + 16
    r = QRectF(sx - w / 2, sy - 26, w, 24)
    p.setPen(QPen(QColor("#c4862c") if hot else QColor("#9a8a76"), 1.4))
    p.setBrush(QColor(255, 246, 225, 240))
    p.drawRoundedRect(r, 9, 9)
    path = QPainterPath()
    path.moveTo(sx - 5, r.bottom() - 0.5)
    path.lineTo(sx, r.bottom() + 6)
    path.lineTo(sx + 5, r.bottom() - 0.5)
    p.drawPath(path)
    keycap(p, QRectF(r.left() + 4, r.top() + 3, kw, 18), key, f2, hot=True)
    p.setFont(f2)
    p.setPen(QColor("#6b3f1a"))
    p.drawText(QRectF(r.left() + kw + 9, r.top(), tw + 4, r.height()), Qt.AlignLeft | Qt.AlignVCenter, text)


def draw_head_hints(p, b, t, font, me_uid):
    """What you can do right now, over your own head; the partner's wind-up in training."""
    me = next((fi for fi in b.fighters if fi.uid == me_uid), None)
    if me is not None and me.a.f == b.f and me.alive() and b.phase == "fight":
        sx, sy = iso(me.a.x, me.a.y, me.z + (70 if me.a.is_cat else 104))
        if me.hold:
            bubble_hint(p, sx, sy, "E", "扔%s×%d" % (AMMO_NAMES.get(me.hold[0], me.hold[0]), me.hold[1]), font, hot=True)
        else:
            k = near_pile(b, me)
            if k:
                bubble_hint(p, sx, sy, "E", "拿" + AMMO_NAMES.get(k, k), font, hot=int(t * 3) % 2 == 0)
        if me.st == "charge" and me.charge > 0:
            # the charge meter
            k = min(1.0, me.charge / 0.8)
            bx, by = iso(me.a.x, me.a.y, me.z)
            r = QRectF(bx - 24, by + 10, 48, 6)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, 70))
            p.drawRoundedRect(r, 3, 3)
            p.setBrush(QColor("#f2b630") if k < 1 else QColor("#e8473f"))
            p.drawRoundedRect(QRectF(r.left(), r.top(), r.width() * k, r.height()), 3, 3)
            if k >= 1:
                f2 = QFont(font)
                f2.setPixelSize(11)
                f2.setBold(True)
                p.setFont(f2)
                p.setPen(QColor("#e8473f"))
                p.drawText(QRectF(bx - 40, by + 16, 80, 14), Qt.AlignCenter, "蓄满！松开 J")
    tr = getattr(b, "train", None)
    if tr is not None:
        for fi in b.fighters:
            if fi.uid != tr.get("uid") and fi.st == "charge" and fi.a.f == b.f:
                sx, sy = iso(fi.a.x, fi.a.y, fi.z + (44 if fi.a.is_cat else 78))
                bubble_hint(p, sx, sy, "L", "快按住 L 挡住！", font, hot=True)


def _draw_battle_fx(p, b, t, font, skip=(), fighters=True):
    for e in b.fx:
        k = e["k"]
        if k in skip:
            continue
        age = e["age"]
        u = age / max(0.01, e.get("dur", 0.5))
        sx, sy = iso(e.get("x", 0), e.get("y", 0), e.get("z", 0))
        if k == "hit":
            n = 6 if e.get("big") else 4
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(255, 236, 120, int(255 * (1 - u))))
            r = (16 if e.get("big") else 11) * (0.6 + u)
            pts = []
            for j in range(n * 2):
                a = j * math.pi / n
                rr = r if j % 2 == 0 else r * 0.45
                pts.append(QPointF(sx + math.cos(a) * rr, sy + math.sin(a) * rr))
            p.drawPolygon(QPolygonF(pts))
            p.setPen(QColor(255, 255, 255, int(255 * (1 - u))))
            f2 = QFont(font)
            f2.setPixelSize(16 if e.get("big") else 13)
            f2.setBold(True)
            p.setFont(f2)
            col = QColor("#e8473f") if e.get("big") else QColor("#ffffff")
            col.setAlpha(int(255 * (1 - u)))
            p.setPen(QColor(60, 30, 20, int(200 * (1 - u))))
            p.drawText(QRectF(sx + 9, sy - 30 - 20 * u, 40, 20), Qt.AlignLeft, str(e.get("n", "")))
            p.setPen(col)
            p.drawText(QRectF(sx + 8, sy - 31 - 20 * u, 40, 20), Qt.AlignLeft, str(e.get("n", "")))
        elif k in ("block", "shield", "parry"):
            col = {"block": QColor(160, 200, 255), "shield": QColor(120, 220, 255), "parry": QColor(255, 220, 90)}[k]
            col.setAlpha(int(220 * (1 - u)))
            p.setPen(QPen(col, 3))
            p.setBrush(Qt.NoBrush)
            r = 22 + 16 * u
            a0 = math.degrees(math.atan2(e.get("fy", 0) * H.KY, e.get("fx", 1)))
            p.drawArc(QRectF(sx - r, sy - r, 2 * r, 2 * r), int((a0 - 60) * 16), 120 * 16)
            if k == "parry":
                p.drawEllipse(QPointF(sx, sy), r * 1.2, r * 1.2)
        elif k in ("slash", "swing", "spin"):
            col = QColor(255, 255, 255, int(230 * (1 - u)))
            p.setPen(QPen(col, 4 if k != "slash" else 3, Qt.SolidLine, Qt.RoundCap))
            p.setBrush(Qt.NoBrush)
            r = e.get("r", 40)
            if k == "spin":
                p.drawEllipse(QPointF(sx, sy + 6), r * (0.6 + 0.4 * u), r * 0.42 * (0.6 + 0.4 * u))
            else:
                a0 = math.degrees(math.atan2(-e.get("fy", 0) * H.KY, e.get("fx", 1)))
                p.drawArc(QRectF(sx - r, sy - r * 0.7, 2 * r, 1.4 * r), int((a0 - 50 + 100 * u) * 16), 60 * 16)
        elif k == "ring":
            r = e.get("r", 80) * (0.3 + 0.9 * u)
            p.setPen(QPen(QColor(255, 255, 255, int(220 * (1 - u))), 4))
            p.setBrush(Qt.NoBrush)
            gx, gy = iso(e.get("x", 0), e.get("y", 0), 0)
            p.drawEllipse(QPointF(gx, gy), r, r * 0.42)
        elif k in ("boom", "splash_big"):
            gx, gy = iso(e.get("x", 0), e.get("y", 0), 0)
            r = e.get("r", 80) * (0.4 + 0.8 * u)
            col = QColor(255, 170, 80) if k == "boom" else QColor(120, 200, 245)
            col.setAlpha(int(180 * (1 - u)))
            p.setPen(Qt.NoPen)
            p.setBrush(col)
            p.drawEllipse(QPointF(gx, gy), r, r * 0.45)
            for j in range(10):
                a = j * math.tau / 10
                p.drawEllipse(QPointF(gx + math.cos(a) * r * 0.8, gy - 20 * math.sin(u * math.pi) - abs(math.sin(a)) * 30 * u),
                              5, 5)
        elif k in ("splash", "poof", "dust"):
            col = {"splash": QColor(140, 210, 250), "poof": QColor(255, 255, 255), "dust": QColor(200, 180, 150)}[k]
            col.setAlpha(int(200 * (1 - u)))
            p.setPen(Qt.NoPen)
            p.setBrush(col)
            for j in range(5):
                a = j * math.tau / 5 + 0.4
                p.drawEllipse(QPointF(sx + math.cos(a) * 14 * u * 1.6, sy + math.sin(a) * 6 * u - 4 * u), 5 - 2 * u, 4 - 1.5 * u)
        elif k == "stars":
            p.setPen(QColor(255, 220, 90, int(255 * (1 - u))))
            p.setFont(QFont("sans", 10, QFont.Bold))
            for j in range(3):
                a = t * 6 + j * math.tau / 3
                p.drawText(QPointF(sx + math.cos(a) * 14 - 4, sy - 22 + math.sin(a) * 5), "★")
        elif k == "ko":
            p.setPen(QColor(255, 220, 90, int(255 * (1 - u))))
            f2 = QFont(font)
            f2.setPixelSize(26)
            f2.setBold(True)
            p.setFont(f2)
            p.drawText(QRectF(sx - 40, sy - 70 - 20 * u, 80, 30), Qt.AlignCenter, "KO")
        elif k == "text":
            f2 = QFont(font)
            f2.setPixelSize(13 if e.get("small") else 18)
            f2.setBold(True)
            p.setFont(f2)
            col = QColor("#5fd36a") if e.get("heal") else QColor("#ffffff")
            col.setAlpha(int(255 * (1 - u * u)))
            r = QRectF(sx - 80, sy - 56 - 24 * u, 160, 24)
            p.setPen(QColor(60, 30, 20, int(200 * (1 - u * u))))
            p.drawText(r.translated(1.2, 1.2), Qt.AlignCenter, e.get("text", ""))
            p.setPen(col)
            p.drawText(r, Qt.AlignCenter, e.get("text", ""))
    # charge glow & shields on the fighters
    for fi in (b.fighters if fighters else ()):
        a = fi.a
        if a.f != b.f or a.traveling is not None:
            continue
        sx, sy = iso(a.x, a.y, fi.z + (24 if a.is_cat else 40))
        if fi.st == "charge":
            k = min(1.0, getattr(fi, "charge", 0) / 0.8)
            g = QRadialGradient(QPointF(sx, sy), 30 + 20 * k)
            g.setColorAt(0, QColor(255, 200, 80, int(120 * k + 40)))
            g.setColorAt(1, QColor(255, 200, 80, 0))
            p.setPen(Qt.NoPen)
            p.setBrush(g)
            p.drawEllipse(QPointF(sx, sy), 30 + 20 * k, 30 + 20 * k)
        if fi.st == "block":
            p.setPen(QPen(QColor(160, 200, 255, 200), 3))
            p.setBrush(QColor(160, 200, 255, 40))
            a0 = math.degrees(math.atan2(fi.fy * H.KY, fi.fx))
            p.drawArc(QRectF(sx - 30, sy - 30, 60, 60), int((-a0 - 60) * 16), 120 * 16)
        buffs = getattr(fi, "bufflist", None)
        if buffs is None:
            buffs = [k for k, v in fi.buff.items() if isinstance(v, float) and v > b.clock and k != "shield_hp"]
        if "shield" in buffs:
            p.setPen(QPen(QColor(120, 220, 255, 160), 2))
            p.setBrush(QColor(120, 220, 255, 30))
            p.drawEllipse(QPointF(sx, sy + 6), 28, 34)
        if "power" in buffs:
            p.setPen(QColor(242, 201, 76, 220))
            p.setFont(QFont("sans", 9, QFont.Bold))
            p.drawText(QPointF(sx - 22, sy - 22 + 3 * math.sin(t * 6)), "⚡")
        if "speed" in buffs:
            p.setPen(QPen(QColor(255, 255, 255, 160), 1.6))
            for j in range(3):
                p.drawLine(QPointF(sx - 26 - j * 4, sy + j * 8), QPointF(sx - 16 - j * 4, sy + j * 8))
        if fi.hold:
            kind, n = fi.hold[0], fi.hold[1]
            p.setPen(QColor("#ffffff"))
            p.setFont(QFont("sans", 8, QFont.Bold))
            p.drawText(QRectF(sx + 10, sy - 44, 70, 14), Qt.AlignLeft,
                       {"snowball": "雪球", "pillow": "枕头", "water": "水枪", "yarn_bomb": "炸弹"}.get(kind, kind) + "×%d" % n)


def draw_battle_hud(p, b, w, h, font, small, me_uid, U, now, card=False, ready=False):
    if getattr(b, "game", "melee") != "melee":
        from . import house_games_art as GA
        return GA.draw_hud(p, b, w, h, font, small, me_uid, U, now, card=card, ready=ready)
    return _draw_melee_hud(p, b, w, h, font, small, me_uid, U, now, card, ready)


def _draw_melee_hud(p, b, w, h, font, small, me_uid, U, now, card=False, ready=False):
    """Cards for the fighters, the clock and the score; the countdown, the result and the keys."""
    from .house_battle import KITS, SKILLS, TEAM_NAMES
    fs = list(b.fighters)
    n = len(fs)
    cw = min(250 * U, (w - 40 * U) / max(1, n))
    x0 = (w - cw * n) / 2
    y0 = 66 * U
    fm = QFontMetricsF(small)
    for i, fi in enumerate(fs):
        r = QRectF(x0 + i * cw + 4 * U, y0, cw - 8 * U, 58 * U)
        col = QColor(TEAM_COLORS.get(fi.team, "#999"))
        p.setPen(QPen(col, 2.4 if fi.uid == me_uid else 1.2))
        p.setBrush(QColor(255, 250, 240, 230))
        p.drawRoundedRect(r, 10, 10)
        p.setFont(small)
        p.setPen(QColor("#5e4436"))
        tag = "（我）" if fi.uid == me_uid else ("（AI）" if str(fi.ctrl).startswith("ai:") else "")
        pal = getattr(fi, "pal", None)
        if pal:
            from . import house_pals as PL
            tag += " " + PL.PALS.get(pal, {}).get("icon", "")
        p.drawText(QRectF(r.left() + 10, r.top() + 3 * U, r.width() - 20, 18 * U), Qt.AlignLeft | Qt.AlignVCenter,
                   fi.a.name + tag)
        # KO marks: hearts left
        left = max(0, b.kos_to_win - fi.kos) if b.mode == "ffa" else None
        sc = "★" * fi.score
        p.drawText(QRectF(r.left() + 10, r.top() + 3 * U, r.width() - 20, 18 * U), Qt.AlignRight | Qt.AlignVCenter,
                   ("♥" * left if left is not None else "") + (" " + sc if sc else ""))
        hp = max(0.0, fi.hp / max(1, fi.maxhp))
        bar = QRectF(r.left() + 10, r.top() + 24 * U, r.width() - 20, 10 * U)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(0, 0, 0, 40))
        p.drawRoundedRect(bar, 4, 4)
        p.setBrush(QColor("#5fd36a") if hp > 0.5 else (QColor("#f2c94c") if hp > 0.25 else QColor("#e8473f")))
        p.drawRoundedRect(QRectF(bar.left(), bar.top(), bar.width() * hp, bar.height()), 4, 4)
        sb = QRectF(r.left() + 10, r.top() + 37 * U, (r.width() - 20) * 0.55, 6 * U)
        p.setBrush(QColor(0, 0, 0, 40))
        p.drawRoundedRect(sb, 3, 3)
        p.setBrush(QColor("#6fb3e6"))
        p.drawRoundedRect(QRectF(sb.left(), sb.top(), sb.width() * max(0.0, fi.stam / 100), sb.height()), 3, 3)
        # the skill and its cooldown
        sk = SKILLS[KITS[fi.kit]["skills"][0]]
        cr = QRectF(sb.right() + 8, r.top() + 31 * U, r.right() - 10 - sb.right() - 8, 18 * U)
        cdv = fi.cd.get("s1", 0.0)
        p.setBrush(QColor(255, 236, 170) if cdv <= 0 else QColor(220, 214, 204))
        p.setPen(QPen(QColor("#9a8a76"), 1))
        p.drawRoundedRect(cr, 5, 5)
        p.setPen(QColor("#5e4436"))
        f2 = QFont(small)
        f2.setPixelSize(int(10.5 * U))
        p.setFont(f2)
        p.drawText(cr, Qt.AlignCenter, sk["name"] + (" %.0f" % math.ceil(cdv) if cdv > 0 else " ✓"))
    # clock and score
    p.setFont(small)
    if getattr(b, "train", None) is not None:
        text = "🎓 训练中（不会被击倒）"
    elif b.mode != "ffa":
        kos = b.team_kos()
        teams = sorted(set(fi.team for fi in fs))
        sc = " : ".join("%d" % sum(f.score for f in fs if f.team == tm) for tm in teams)
        text = "%s   ⏱ %d" % (sc, max(0, int(b.limit - b.clock)))
    else:
        text = "⏱ %d" % max(0, int(b.limit - b.clock))
    tw = fm.horizontalAdvance(text) + 30
    tr = QRectF((w - tw) / 2, y0 + 62 * U, tw, 24 * U)
    p.setPen(QPen(QColor("#9a8a76"), 1))
    p.setBrush(QColor(255, 250, 240, 230))
    p.drawRoundedRect(tr, tr.height() / 2, tr.height() / 2)
    p.setPen(QColor("#5e4436"))
    p.drawText(tr, Qt.AlignCenter, text)
    # big centre text
    big = None
    me = next((fi for fi in fs if fi.uid == me_uid), None)
    ct = getattr(b, "count_t", 0)
    if b.phase == "count" and ct > 3.0:
        hs = b.humans() if hasattr(b, "humans") else set()
        rd = getattr(b, "ready", set())
        big = "等大家准备好…（%d/%d）" % (len(rd & hs), len(hs)) if me is None or ready else None
    elif b.phase == "count":
        big = str(max(1, int(math.ceil(ct))))
    elif b.phase == "travel":
        big = "出发！"
    elif b.banner and (b.banner.get("until", 0) > b.t if hasattr(b, "t") else True):
        big = b.banner["text"]
    if big:
        f2 = QFont(font)
        f2.setPixelSize(int(40 * U) if len(big) < 4 else int(28 * U))
        f2.setBold(True)
        p.setFont(f2)
        r = QRectF(0, h * 0.38, w, 60 * U)
        if len(big) >= 4:
            bw = QFontMetricsF(f2).horizontalAdvance(big) + 56 * U
            pr = QRectF((w - bw) / 2, r.top() + 4 * U, bw, r.height() - 8 * U)
            if b.phase == "over":
                pr = QRectF(min(pr.left(), w / 2 - 150 * U), pr.top(), max(bw, 300 * U), r.height() + 64 * U)
            p.setPen(QPen(QColor("#c4862c"), 2))
            p.setBrush(QColor(255, 246, 225, 235))
            p.drawRoundedRect(pr, 18 * U, 18 * U)
        if len(big) >= 4:
            p.setPen(QColor("#6b3f1a"))
            p.drawText(r, Qt.AlignCenter, big)
        else:
            p.setPen(QColor(60, 30, 20, 180))
            p.drawText(r.translated(2, 2), Qt.AlignCenter, big)
            p.setPen(QColor("#fff2c4"))
            p.drawText(r, Qt.AlignCenter, big)
    rects = {}
    trn = getattr(b, "train", None)
    if trn is not None and b.phase == "fight":
        draw_train_panel(p, b, w, h, small, U, trn, now)
    if b.phase == "over":
        again = "⟳ 再练一次" if trn is not None else "⟳ 再来一局"
        for j, (key, label) in enumerate((("again", again), ("home", "⌂ 回家"))):
            r = QRectF(w / 2 - 130 * U + j * 140 * U, h * 0.38 + 66 * U, 120 * U, 34 * U)
            p.setPen(QPen(QColor("#6b4a3a"), 1.6))
            p.setBrush(QColor("#ffd99a"))
            p.drawRoundedRect(r, r.height() / 2, r.height() / 2)
            p.setFont(small)
            p.setPen(QColor("#6b4a3a"))
            p.drawText(r, Qt.AlignCenter, label)
            rects[key] = r
    else:
        # a small way out in the middle of a fight
        qr = QRectF(tr.right() + 8 * U, tr.top(), 64 * U, tr.height())
        p.setFont(small)
        p.setPen(QPen(QColor("#9a8a76"), 1))
        p.setBrush(QColor(255, 250, 240, 230))
        p.drawRoundedRect(qr, qr.height() / 2, qr.height() / 2)
        p.setPen(QColor("#8a2e24"))
        p.drawText(qr, Qt.AlignCenter, "✕ 结束")
        rects["home"] = qr
    if b.phase in ("fight", "count") and me is not None:
        draw_skill_bar(p, b, me, w, h, small, U, now)
    if me is not None and b.phase in ("travel", "count", "fight") and \
            (card or (b.phase in ("travel", "count") and not ready)):
        draw_controls_card(p, b, me, w, h, font, small, U, now, waiting=b.phase != "fight" and not ready)
    return rects


SKILL_ROWS = None


def draw_skill_bar(p, b, me, w, h, small, U, now):
    """The keys along the bottom, like a game's action bar: each lights up when you can use it."""
    from .house_battle import KITS, SKILLS
    sk = SKILLS[KITS[me.kit]["skills"][0]]
    cdv = me.cd.get("s1", 0.0)
    st = me.st
    pile = near_pile(b, me)
    if me.hold:
        e_txt, e_sub, e_hot, e_dim = "扔", "%s×%d" % (AMMO_NAMES.get(me.hold[0], me.hold[0]), me.hold[1]), True, False
    elif pile:
        e_txt, e_sub, e_hot, e_dim = "拿", AMMO_NAMES.get(pile, pile), True, False
    else:
        e_txt, e_sub, e_hot, e_dim = "拿 / 扔", "弹药堆旁边", False, True
    charging = st == "charge" and me.charge > 0
    slots = [
        ("WASD", "移动", "自动对准对手", False, False, None),
        ("J", "攻击", "按住：蓄力重击" if not charging else ("蓄满！松开" if me.charge >= 0.8 else "蓄力中…"),
         st in ("light", "heavy") or charging, False, min(1.0, me.charge / 0.8) if charging else None),
        ("K", sk["icon"] + " " + sk["name"], ("%.0f 秒后可用" % math.ceil(cdv)) if cdv > 0 else "可以用了！",
         cdv <= 0, cdv > 0, (1 - cdv / sk["cd"]) if cdv > 0 else None),
        ("L", "格挡", "体力不够了" if me.stam < 16 else "L+方向：翻滚", st in ("block", "roll"), me.stam < 5, None),
        ("空格", "跳", "空中 J：下砸", st in ("jump", "dive"), False, None),
        ("E", e_txt, e_sub, e_hot, e_dim, None),
        ("H", "操作说明", "随时再看", False, False, None),
    ]
    sw, sh, gap = 118 * U, 44 * U, 6 * U
    total = len(slots) * sw + (len(slots) - 1) * gap
    x = (w - total) / 2
    y = h - sh - 8 * U
    back = QRectF(x - 8 * U, y - 6 * U, total + 16 * U, sh + 12 * U)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(60, 40, 30, 165))
    p.drawRoundedRect(back, 14 * U, 14 * U)
    f_t = QFont(small)
    f_t.setPixelSize(int(12.5 * U))
    f_t.setBold(True)
    f_s = QFont(small)
    f_s.setPixelSize(int(10 * U))
    for key, title, sub, hot, dim, prog in slots:
        r = QRectF(x, y, sw, sh)
        glow = hot and key == "K" and int(now * 3) % 2 == 0
        p.setPen(QPen(QColor("#f2b630") if hot else QColor(255, 255, 255, 50), 2 if hot else 1))
        p.setBrush(QColor(255, 250, 240, 245) if not dim else QColor(235, 228, 218, 200))
        if glow:
            p.setBrush(QColor(255, 240, 200, 250))
        p.drawRoundedRect(r, 9 * U, 9 * U)
        if prog is not None:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(242, 182, 48, 120) if key == "J" else QColor(111, 179, 230, 90))
            p.drawRoundedRect(QRectF(r.left(), r.bottom() - 6 * U, r.width() * max(0.0, min(1.0, prog)), 6 * U), 3, 3)
        kw = (24 if len(key) == 1 else 40) * U
        keycap(p, QRectF(r.left() + 6 * U, r.top() + 8 * U, kw, 26 * U), key, f_t, hot=hot, dim=dim)
        tx = r.left() + kw + 12 * U
        p.setFont(f_t)
        p.setPen(QColor("#5e4436") if not dim else QColor("#9a8a76"))
        p.drawText(QRectF(tx, r.top() + 4 * U, r.right() - tx - 4, 20 * U), Qt.AlignLeft | Qt.AlignVCenter, title)
        p.setFont(f_s)
        p.setPen(QColor("#8a7a68") if key != "L" or me.stam >= 16 else QColor("#c9443a"))
        p.drawText(QRectF(tx, r.top() + 22 * U, r.right() - tx - 2, 18 * U), Qt.AlignLeft | Qt.AlignVCenter, sub)
        x += sw + gap


def draw_controls_card(p, b, me, w, h, font, small, U, now, waiting=False):
    """Before the fight (and on H): who you are and what every key does."""
    from .house_battle import KITS, SKILLS
    kit = KITS[me.kit]
    sk = SKILLS[kit["skills"][0]]
    piles = {PILE_AMMO.get(it.type) for it in getattr(b, "ammo_piles", None) or []}
    ammo = "、".join(AMMO_NAMES[k] for k in ("snowball", "pillow", "water") if k in piles)
    rows = [
        ("WASD", "移动。站着不动会自动面向最近的对手，出招也会自动对准"),
        ("J", "攻击：点一下打一下，快速连按三下是三连击；按住蓄力，松开打出重击（蓄满能破防）"),
        ("K", "技能「%s」：%s（冷却 %d 秒）" % (sk["name"], sk["desc"], sk["cd"])),
        ("L", "按住格挡（对方出手的瞬间按下是弹反，会把它震晕）；按住 L 再按方向键：翻滚"),
        ("空格", "跳：能跳过矮墙、跳过屋顶之间的缝；在空中按 J 从天而降砸下去"),
        ("E", ("走到弹药堆旁边按 E 拿%s，再按 E 扔；" % ammo if ammo else "") + "捡到毛线炸弹也按 E 扔"),
    ]
    step = 34
    cw, ch = min(w - 60 * U, 640 * U), (74 + step * len(rows) + 60) * U
    top, bot = 70 * U, h - 66 * U                 # between the toolbar and the key bar
    r = QRectF((w - cw) / 2, max(top, top + (bot - top - ch) / 2), cw, min(ch, bot - top))
    p.setPen(QPen(QColor("#c4862c"), 2))
    p.setBrush(QColor(255, 248, 232, 248))
    p.drawRoundedRect(r, 16 * U, 16 * U)
    f_b = QFont(font)
    f_b.setPixelSize(int(18 * U))
    f_b.setBold(True)
    p.setFont(f_b)
    p.setPen(QColor("#6b3f1a"))
    p.drawText(QRectF(r.left() + 20 * U, r.top() + 12 * U, r.width() - 40 * U, 28 * U), Qt.AlignLeft | Qt.AlignVCenter,
               "你是 %s" % me.a.name)
    p.setFont(small)
    p.setPen(QColor("#8a7a68"))
    p.drawText(QRectF(r.left() + 20 * U, r.top() + 40 * U, r.width() - 40 * U, 22 * U), Qt.AlignLeft | Qt.AlignVCenter,
               "%s · %s · 生命 %d　|　场地：%s" % (kit["name"], kit["style"], kit["hp"], b.arena["name"]))
    y = r.top() + 66 * U
    f_r = QFont(small)
    f_r.setPixelSize(int(13 * U))
    f_k = QFont(small)
    f_k.setPixelSize(int(13 * U))
    for key, text in rows:
        kw = (28 if len(key) == 1 else 48) * U
        keycap(p, QRectF(r.left() + 20 * U, y + 3 * U, kw, 26 * U), key, f_k, hot=key in ("J", "K"))
        p.setFont(f_r)
        p.setPen(QColor("#5e4436"))
        p.drawText(QRectF(r.left() + 20 * U + 58 * U, y, r.width() - 98 * U, 32 * U),
                   Qt.AlignLeft | Qt.AlignVCenter | Qt.TextWordWrap, text)
        y += step * U
    p.setFont(small)
    p.setPen(QColor("#8a7a68"))
    p.drawText(QRectF(r.left() + 20 * U, y + 2 * U, r.width() - 40 * U, 20 * U), Qt.AlignLeft | Qt.AlignVCenter,
               "场上会掉：🐟 回血　⚡ 加攻　👟 加速　🛡 护盾　🧶 毛线炸弹（走过去就捡）")
    fr = QRectF(r.left() + 20 * U, r.bottom() - 36 * U, r.width() - 40 * U, 26 * U)
    if waiting:
        pulse = 0.5 + 0.5 * math.sin(now * 5)
        p.setPen(QPen(QColor("#c4862c"), 1.6))
        p.setBrush(QColor(255, int(205 + 30 * pulse), int(120 + 40 * pulse)))
        p.drawRoundedRect(fr, fr.height() / 2, fr.height() / 2)
        f_g = QFont(small)
        f_g.setBold(True)
        p.setFont(f_g)
        p.setPen(QColor("#6b3f1a"))
        p.drawText(fr, Qt.AlignCenter, "看懂了？按 J 准备好！（对战中随时按 H 再看）")
    else:
        p.setPen(QColor("#9a8a76"))
        p.drawText(fr, Qt.AlignCenter, "按 H 关上")


def draw_train_panel(p, b, w, h, small, U, tr, now):
    """The tutorial: this step in big letters under the clock, and the checklist down the left."""
    from .house_battle import battle_class
    TRAIN_STEPS = battle_class(getattr(b, "game", "melee")).TRAIN_STEPS
    i = tr.get("i", 0)
    if i >= len(TRAIN_STEPS):
        return
    if "text" in tr:                               # a guest's copy
        text, keys = tr["text"], tr["keys"]
        done = tr.get("done")
    else:
        text, keys = b.train_text(i)
        done = tr.get("done_t") is not None
    f_b = QFont(small)
    f_b.setPixelSize(int(16 * U))
    f_b.setBold(True)
    fm = QFontMetricsF(f_b)
    head = "第 %d / %d 步　" % (i + 1, len(TRAIN_STEPS))
    tw = min(w - 80 * U, fm.horizontalAdvance(head + text + keys) + 70 * U)
    r = QRectF((w - tw) / 2, 66 * U + 96 * U, tw, 40 * U)
    p.setPen(QPen(QColor("#5fb36a") if done else QColor("#c4862c"), 2))
    p.setBrush(QColor(236, 250, 232, 245) if done else QColor(255, 248, 232, 245))
    p.drawRoundedRect(r, 14 * U, 14 * U)
    kr = QRectF(r.left() + 10 * U, r.top() + 7 * U, fm.horizontalAdvance(keys) + 24 * U, 26 * U)
    keycap(p, kr, keys, f_b, hot=True)
    p.setFont(f_b)
    p.setPen(QColor("#2e6b36") if done else QColor("#6b3f1a"))
    p.drawText(QRectF(kr.right() + 10 * U, r.top(), r.right() - kr.right() - 20 * U, r.height()),
               Qt.AlignLeft | Qt.AlignVCenter, ("✓ " if done else "") + head + text)
    # checklist
    f_s = QFont(small)
    f_s.setPixelSize(int(11.5 * U))
    p.setFont(f_s)
    names = {"move": "走路", "tap": "攻击", "combo": "三连击", "heavy": "蓄力重击", "skill": "技能", "block": "格挡",
             "roll": "翻滚", "jump": "跳 + 下砸", "throw": "扔东西"}
    y = 150 * U
    lr = QRectF(16 * U, y - 6 * U, 112 * U, (len(TRAIN_STEPS) * 21 + 34) * U)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 250, 240, 220))
    p.drawRoundedRect(lr, 10 * U, 10 * U)
    p.setPen(QColor("#6b3f1a"))
    p.drawText(QRectF(lr.left() + 10 * U, y, lr.width(), 20 * U), Qt.AlignLeft | Qt.AlignVCenter, "🎓 新手训练")
    y += 24 * U
    for j, st in enumerate(TRAIN_STEPS):
        key = st[0]
        ok = j < i or (j == i and done)
        p.setPen(QColor("#2e8b3e") if ok else (QColor("#c4862c") if j == i else QColor("#9a8a76")))
        p.drawText(QRectF(lr.left() + 10 * U, y, lr.width() - 12 * U, 20 * U), Qt.AlignLeft | Qt.AlignVCenter,
                   ("✓ " if ok else ("▶ " if j == i else "○ ")) + (st[4] if len(st) > 4 else names.get(key, key)))
        y += 21 * U
