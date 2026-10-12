"""What's on TV in the cat house: a handful of little animated programmes.

The screen of a TV item is drawn every frame (``draw_screen``) from ``it.state["ch"]`` - the programme -
and the time since it started.  ``TVWorld.step_tv`` picks programmes for whoever is watching (cartoons for
the kid, the news at seven, birds for a cat in front of the screen...), switches now and then with a
moment of static, and has the viewers say something about what they see.
"""

import math
import random
import time

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QColor, QFont, QLinearGradient, QPainterPath, QPen, QPolygonF

PROGRAMMES = ("cartoon", "nature", "sea", "news", "weather", "cooking", "sports", "music", "drama", "cat")
NAMES = {"cartoon": "动画片", "nature": "动物世界", "sea": "海底世界", "news": "新闻", "weather": "天气预报",
         "cooking": "美食节目", "sports": "足球赛", "music": "音乐节目", "drama": "电视剧", "cat": "猫咪频道"}
GLOW = {"cartoon": (255, 190, 220), "nature": (190, 230, 160), "sea": (120, 190, 255), "news": (150, 180, 255),
        "weather": (140, 200, 255), "cooking": (255, 200, 140), "sports": (150, 230, 150), "music": (220, 150, 255),
        "drama": (255, 170, 150), "cat": (200, 230, 170)}
HEADLINES = ["本台消息：今日全市猫咪平均睡了 16 个小时", "社区新开了一家猫咖，周末排起长队",
             "研究发现：猫咪最喜欢的玩具还是纸箱", "本周末夜空可见流星雨，记得抬头看",
             "公园的银杏叶黄了，市民纷纷拍照", "宠物医院提醒：记得定期给猫咪驱虫",
             "晚高峰道路畅通，祝大家回家愉快", "小区花园新添了一排长椅"]
DRAMA = ["你……还记得我吗？", "那年的雪，下得好大。", "我们重新开始吧。", "原来，你一直都在。", "对不起，我来晚了。",
         "这一次，我不会再放手。"]
RECIPES = ["今日菜谱：番茄炒蛋", "今日菜谱：红烧排骨", "今日菜谱：清蒸鱼", "今日菜谱：葱油拌面"]
SONGS = ["♪ 晴天的风 ♪", "♪ 小猫圆舞曲 ♪", "♪ 夏夜星空 ♪", "♪ 回家的路 ♪"]

LINES = {
    "cartoon": ["哈哈哈哈！", "小兔子又摔倒啦", "再看一集嘛～", "我也想要这样的帽子"],
    "nature": ["长颈鹿的脖子好长", "大自然真神奇", "看，小狮子！"],
    "sea": ["好多鱼呀……", "{c}肯定也想看", "水母好漂亮"],
    "news": ["又有新闻了", "嗯，这个要关注一下", "猫咖？周末去看看"],
    "weather": ["明天{w}", "听天气预报说{w}", "出门要看天气"],
    "cooking": ["看着好香", "明天我们也做这个", "肚子饿了……"],
    "sports": ["好球！", "进了进了！", "哎呀，就差一点", "裁判！"],
    "music": ["这首歌好听", "跟着哼两句～", "啦啦啦～"],
    "drama": ["终于在一起了……", "别哭别哭", "下一集呢？！", "这个演员演得真好"],
    "cat": ["{c}，你的节目开始了", "电视里有小鸟哦", "这是专门给猫看的频道"],
}
SWITCH_LINES = ["换个台～", "看看别的", "这个好看"]


def _font(px, bold=True):
    f = QFont()
    f.setPixelSize(max(1, int(round(px))))
    f.setBold(bold)
    return f


def _outlined_text(p, x, y, text, font, col="#ffffff", align=Qt.AlignLeft):
    p.setFont(font)
    path = QPainterPath()
    path.addText(QPointF(x, y), font, text)
    p.setPen(QPen(QColor(0, 0, 0, 170), 1.6))
    p.setBrush(Qt.NoBrush)
    p.drawPath(path)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(col))
    p.drawPath(path)


def _grad(p, r, top, bot):
    g = QLinearGradient(0, r.top(), 0, r.bottom())
    g.setColorAt(0, QColor(top))
    g.setColorAt(1, QColor(bot))
    p.setPen(Qt.NoPen)
    p.setBrush(g)
    p.drawRect(r)


# ---- programmes (each draws into r, the screen, with u = seconds since it started) ----------------------
def _cartoon(p, r, u, seed, info):
    _grad(p, r, "#8fd3ff", "#d8f3ff")
    w, h = r.width(), r.height()
    p.setBrush(QColor(255, 255, 255, 220))
    for i in range(2):
        cx = r.left() + ((u * 4 + i * 37 + seed) % (w + 30)) - 15
        for dx, rr in ((-4, 3.5), (0, 4.5), (4, 3.5)):
            p.drawEllipse(QPointF(cx + dx, r.top() + 7 + i * 6), rr, rr * 0.7)
    # rainbow
    for k, col in enumerate(("#ff7a7a", "#ffc46b", "#fff27a", "#8be38b", "#7ab8ff")):
        p.setPen(QPen(QColor(col), 1.4))
        p.setBrush(Qt.NoBrush)
        rad = 15 - k * 1.5
        p.drawArc(QRectF(r.right() - 22 - rad, r.bottom() - 6 - rad, rad * 2, rad * 2), 0, 180 * 16)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#7ccf68"))
    p.drawEllipse(QPointF(r.left() + w * 0.3, r.bottom() + 6), w * 0.5, 12)
    p.setBrush(QColor("#5fb653"))
    p.drawEllipse(QPointF(r.right() - w * 0.1, r.bottom() + 8), w * 0.45, 12)
    # the bouncing bunny
    hop = abs(math.sin(u * 3.2))
    x = r.left() + 10 + ((u * 9) % (w - 18))
    y = r.bottom() - 7 - hop * 11
    sq = 1.0 + (0.25 if hop < 0.12 else 0.0)
    p.setPen(QPen(QColor("#b9637a"), 0.8))
    p.setBrush(QColor("#ffd0dc"))
    p.drawEllipse(QPointF(x, y), 5.2 * sq, 5.2 / sq)
    for dx in (-2.2, 2.2):
        p.drawEllipse(QPointF(x + dx, y - 7), 1.5, 3.6)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#3a2a33"))
    p.drawEllipse(QPointF(x - 1.8, y - 0.8), 0.8, 0.9)
    p.drawEllipse(QPointF(x + 1.8, y - 0.8), 0.8, 0.9)
    p.setBrush(QColor("#ff8fa8"))
    p.drawEllipse(QPointF(x, y + 1.2), 1.0, 0.7)
    # a spinning star
    sx, sy = r.left() + w * 0.75, r.top() + 10 + 2 * math.sin(u * 2)
    p.setBrush(QColor("#ffe066"))
    pts = []
    for i in range(10):
        a = u * 2 + i * math.pi / 5
        rr = 4 if i % 2 == 0 else 1.8
        pts.append(QPointF(sx + math.cos(a) * rr, sy + math.sin(a) * rr))
    p.drawPolygon(QPolygonF(pts))


def _nature(p, r, u, seed, info):
    _grad(p, r, "#ffcf8a", "#ffe9b8")
    w, h = r.width(), r.height()
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#ffb347"))
    p.drawEllipse(QPointF(r.right() - 12, r.top() + 11), 5, 5)
    p.setBrush(QColor("#d6b15a"))
    p.drawRect(QRectF(r.left(), r.bottom() - 9, w, 9))
    # an acacia tree
    p.setBrush(QColor("#6b4a35"))
    p.drawRect(QRectF(r.left() + 9, r.bottom() - 20, 1.6, 12))
    p.setBrush(QColor("#5f8f3e"))
    p.drawEllipse(QPointF(r.left() + 10, r.bottom() - 21), 9, 3.2)
    # a giraffe strolling across
    x = r.right() + 8 - ((u * 5 + seed) % (w + 24))
    y = r.bottom() - 9
    bob = math.sin(u * 4) * 0.6
    col = QColor("#f2c14e")
    p.setBrush(col)
    p.setPen(QPen(QColor("#a5702b"), 0.6))
    for dx, ph in ((-3, 0), (3, 1.6)):
        lift = max(0.0, math.sin(u * 4 + ph)) * 1.2
        p.drawRect(QRectF(x + dx - 0.6, y - 7 - lift, 1.3, 7))
    p.drawEllipse(QPointF(x, y - 8 + bob), 5, 2.8)
    neck = QPainterPath(QPointF(x - 3.5, y - 9 + bob))
    neck.lineTo(x - 6.5, y - 20 + bob)
    neck.lineTo(x - 4.8, y - 20.5 + bob)
    neck.lineTo(x - 1.5, y - 9.5 + bob)
    neck.closeSubpath()
    p.drawPath(neck)
    p.drawEllipse(QPointF(x - 7, y - 21 + bob), 2.4, 1.5)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#b5762d"))
    for dx, dy in ((-1.5, -8), (1.5, -7.6), (0.5, -9.2), (-4.4, -13), (-5.4, -16.5)):
        p.drawEllipse(QPointF(x + dx, y + dy + bob), 0.8, 0.7)
    # birds
    p.setPen(QPen(QColor("#4a3b36"), 0.7))
    p.setBrush(Qt.NoBrush)
    for i in range(3):
        bx = r.left() + ((u * 7 + i * 19) % (w + 10)) - 5
        by = r.top() + 8 + i * 3 + math.sin(u * 3 + i) * 1.5
        fl = 1.4 * math.sin(u * 12 + i)
        path = QPainterPath(QPointF(bx - 2.5, by - fl))
        path.quadTo(QPointF(bx - 1, by - 1), QPointF(bx, by))
        path.quadTo(QPointF(bx + 1, by - 1), QPointF(bx + 2.5, by - fl))
        p.drawPath(path)


def _sea(p, r, u, seed, info):
    _grad(p, r, "#3aa0e0", "#0d4f8c")
    w, h = r.width(), r.height()
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 30))
    for i in range(4):
        x = r.left() + (i * 17 + u * 3) % w
        poly = QPolygonF([QPointF(x, r.top()), QPointF(x + 6, r.top()), QPointF(x + 12, r.bottom()),
                          QPointF(x + 4, r.bottom())])
        p.drawPolygon(poly)
    p.setBrush(QColor("#e6d39a"))
    p.drawEllipse(QPointF(r.center().x(), r.bottom() + 5), w * 0.7, 8)
    for i, x in enumerate((0.15, 0.82, 0.9)):
        sw = math.sin(u * 1.6 + i) * 2
        path = QPainterPath(QPointF(r.left() + w * x, r.bottom()))
        path.quadTo(QPointF(r.left() + w * x + sw, r.bottom() - 7), QPointF(r.left() + w * x - sw, r.bottom() - 14))
        p.setPen(QPen(QColor("#4fbf73"), 1.6))
        p.setBrush(Qt.NoBrush)
        p.drawPath(path)
    fish = (("#ffb347", 7, 0.0, 1), ("#ff7a9c", 5, 9.0, -1), ("#ffe066", 9, 4.0, 1), ("#9fe2ff", 4, 13.0, -1))
    for col, sp, off, d in fish:
        span = w + 14
        x = r.left() - 7 + ((u * sp + off * 9 + seed) % span) if d > 0 else r.right() + 7 - ((u * sp + off * 9) % span)
        y = r.top() + 8 + off * 1.6 + math.sin(u * 2 + off) * 1.5
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(col))
        p.drawEllipse(QPointF(x, y), 3.2, 1.9)
        tail = QPolygonF([QPointF(x - d * 2.6, y), QPointF(x - d * 5, y - 1.8), QPointF(x - d * 5, y + 1.8)])
        p.drawPolygon(tail)
        p.setBrush(QColor("#222"))
        p.drawEllipse(QPointF(x + d * 1.6, y - 0.4), 0.45, 0.45)
    p.setPen(QPen(QColor(255, 255, 255, 150), 0.6))
    p.setBrush(Qt.NoBrush)
    for i in range(5):
        y = r.bottom() - ((u * 8 + i * 9) % h)
        p.drawEllipse(QPointF(r.left() + w * (0.2 + 0.15 * i), y), 0.9, 0.9)
    # a jellyfish
    jx, jy = r.left() + w * 0.6, r.top() + 12 + 3 * math.sin(u * 0.9)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 190, 240, 170))
    p.drawChord(QRectF(jx - 4, jy - 3, 8, 6), 0, 180 * 16)
    p.setPen(QPen(QColor(255, 190, 240, 150), 0.6))
    for k in (-2, 0, 2):
        p.drawLine(QPointF(jx + k, jy), QPointF(jx + k + math.sin(u * 3 + k), jy + 5))


def _anchor(p, x, y, u, col="#3b2a22", suit="#2d4b7a"):
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(suit))
    p.drawRoundedRect(QRectF(x - 8, y + 4, 16, 12), 5, 5)
    p.setBrush(QColor("#ffffff"))
    p.drawPolygon(QPolygonF([QPointF(x - 2, y + 4), QPointF(x + 2, y + 4), QPointF(x, y + 8)]))
    p.setBrush(QColor("#f6d3b5"))
    p.drawEllipse(QPointF(x, y), 4.6, 5.2)
    p.setBrush(QColor(col))
    p.drawChord(QRectF(x - 5, y - 6, 10, 9), 10 * 16, 160 * 16)
    p.setBrush(QColor("#3a2a33"))
    p.drawEllipse(QPointF(x - 1.6, y), 0.6, 0.7)
    p.drawEllipse(QPointF(x + 1.6, y), 0.6, 0.7)
    talk = 0.4 + 0.6 * abs(math.sin(u * 9)) if int(u * 0.8) % 4 != 3 else 0.2
    p.setBrush(QColor("#b5524a"))
    p.drawEllipse(QPointF(x, y + 2.6), 1.1, 0.5 + 0.6 * talk)


def _news(p, r, u, seed, info):
    _grad(p, r, "#1f3f7a", "#0f2550")
    w, h = r.width(), r.height()
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 25))
    for i in range(5):
        p.drawRect(QRectF(r.left() + i * 14, r.top(), 7, h))
    # picture-in-picture: the story's photo
    pic = QRectF(r.left() + 4, r.top() + 5, 22, 15)
    p.setBrush(QColor("#9fd0f0"))
    p.drawRect(pic)
    p.setBrush(QColor("#f2c14e"))
    p.drawEllipse(QPointF(pic.center().x(), pic.bottom() - 4), 5, 4)
    for dx in (-3, 3):
        p.drawEllipse(QPointF(pic.center().x() + dx, pic.bottom() - 9), 1.2, 2)
    _anchor(p, r.left() + w * 0.66, r.top() + 13, u)
    p.setBrush(QColor("#d64545"))
    p.drawRect(QRectF(r.left(), r.top(), 16, 4.5))
    _outlined_text(p, r.left() + 1.5, r.top() + 4, "LIVE", _font(3.6), "#ffffff")
    # ticker
    band = QRectF(r.left(), r.bottom() - 8, w, 8)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#f0f0f0"))
    p.drawRect(band)
    p.setBrush(QColor("#d64545"))
    p.drawRect(QRectF(r.left(), band.top(), 11, 8))
    f = _font(5.4)
    p.setFont(f)
    text = "　　".join(HEADLINES[(seed + i) % len(HEADLINES)] for i in range(4))
    width = len(text) * 5.4
    x = r.left() + 12 + w - ((u * 9) % (width + w))
    p.save()
    p.setClipRect(QRectF(band.left() + 11, band.top(), w - 11, 8))
    p.setPen(QColor("#222222"))
    p.drawText(QPointF(x, band.bottom() - 1.8), text)
    p.restore()
    _outlined_text(p, r.left() + 1, band.bottom() - 1.8, "快讯", _font(4.2), "#ffffff")


def _weather(p, r, u, seed, info):
    _grad(p, r, "#5aa9e6", "#a9d8ff")
    w, h = r.width(), r.height()
    p.setPen(QPen(QColor("#4c8a52"), 0.6))
    p.setBrush(QColor("#9bd38a"))
    land = QPainterPath(QPointF(r.left() + 6, r.top() + 10))
    land.cubicTo(QPointF(r.left() + 20, r.top() + 3), QPointF(r.left() + 34, r.top() + 14),
                 QPointF(r.left() + 46, r.top() + 8))
    land.cubicTo(QPointF(r.left() + 56, r.top() + 14), QPointF(r.left() + 50, r.bottom() - 6),
                 QPointF(r.left() + 30, r.bottom() - 4))
    land.cubicTo(QPointF(r.left() + 14, r.bottom() - 2), QPointF(r.left(), r.top() + 22), QPointF(r.left() + 6, r.top() + 10))
    p.drawPath(land)
    tag = info.get("weather") or "clear"
    temp = info.get("temp")
    icons = [(r.left() + 16, r.top() + 13), (r.left() + 36, r.top() + 15), (r.left() + 26, r.top() + 25)]
    for i, (x, y) in enumerate(icons):
        kind = tag if i == 0 else ("cloud" if (seed + i) % 2 else "clear")
        _wx_icon(p, x, y + math.sin(u * 2 + i) * 0.6, kind, u)
    txt = ("%d°" % round(temp)) if isinstance(temp, (int, float)) else {"rain": "雨", "snow": "雪"}.get(tag, "晴")
    _outlined_text(p, r.right() - 16, r.top() + 13, txt, _font(8.5), "#ffffff")
    _outlined_text(p, r.right() - 17, r.top() + 22, {"rain": "有雨", "snow": "有雪", "hot": "炎热", "cold": "寒冷"}
                   .get(tag, "晴好"), _font(5.2), "#fff7c2")
    # the presenter, pointing
    _anchor(p, r.right() - 9, r.bottom() - 11, u, "#5a3a2a", "#c0504d")


def _wx_icon(p, x, y, kind, u):
    p.setPen(Qt.NoPen)
    if kind in ("clear", "hot", None):
        p.setBrush(QColor("#ffcf3f"))
        p.drawEllipse(QPointF(x, y), 3.2, 3.2)
        p.setPen(QPen(QColor("#ffcf3f"), 0.8))
        for i in range(8):
            a = u + i * math.pi / 4
            p.drawLine(QPointF(x + math.cos(a) * 4.2, y + math.sin(a) * 4.2), QPointF(x + math.cos(a) * 5.6, y + math.sin(a) * 5.6))
        return
    p.setBrush(QColor("#ffffff"))
    for dx, rr in ((-2.5, 2.4), (0.5, 3.2), (3, 2.2)):
        p.drawEllipse(QPointF(x + dx, y), rr, rr * 0.8)
    if kind == "rain":
        p.setPen(QPen(QColor("#3a7bd5"), 0.8))
        for i, dx in enumerate((-2, 0.5, 3)):
            k = (u * 3 + i * 0.3) % 1.0
            p.drawLine(QPointF(x + dx, y + 2.5 + k * 3), QPointF(x + dx - 0.6, y + 4 + k * 3))
    elif kind in ("snow", "cold"):
        p.setBrush(QColor("#ffffff"))
        p.setPen(QPen(QColor("#9cc3e6"), 0.4))
        for i, dx in enumerate((-2, 0.5, 3)):
            k = (u * 1.5 + i * 0.3) % 1.0
            p.drawEllipse(QPointF(x + dx, y + 3 + k * 3), 0.8, 0.8)


def _cooking(p, r, u, seed, info):
    _grad(p, r, "#fff1d6", "#f7d9a8")
    w, h = r.width(), r.height()
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#e9e2d5"))
    for i in range(6):
        for j in range(3):
            if (i + j) % 2 == 0:
                p.drawRect(QRectF(r.left() + i * 11.5, r.top() + j * 6, 11.5, 6))
    p.setBrush(QColor("#a3765a"))
    p.drawRect(QRectF(r.left(), r.bottom() - 9, w, 9))
    # chef
    cx, cy = r.left() + 15, r.top() + 17
    p.setBrush(QColor("#ffffff"))
    p.drawRoundedRect(QRectF(cx - 7, cy + 4, 14, 12), 4, 4)
    p.drawEllipse(QPointF(cx, cy - 8), 4.5, 3.4)
    p.drawRect(QRectF(cx - 3.2, cy - 7, 6.4, 3))
    p.setBrush(QColor("#f6d3b5"))
    p.drawEllipse(QPointF(cx, cy - 0.5), 4.2, 4.6)
    p.setBrush(QColor("#3a2a33"))
    p.drawEllipse(QPointF(cx - 1.4, cy - 0.8), 0.5, 0.6)
    p.drawEllipse(QPointF(cx + 1.4, cy - 0.8), 0.5, 0.6)
    p.setPen(QPen(QColor("#b5524a"), 0.6))
    p.drawArc(QRectF(cx - 1.4, cy + 0.6, 2.8, 1.8), 200 * 16, 140 * 16)
    # pot, ladle, steam, vegetables dropping in
    px, py = r.left() + w * 0.62, r.bottom() - 9
    p.setPen(QPen(QColor("#555"), 0.6))
    p.setBrush(QColor("#c94c4c"))
    p.drawRoundedRect(QRectF(px - 10, py - 9, 20, 9), 2, 2)
    p.setBrush(QColor("#f08a5d"))
    p.drawEllipse(QPointF(px, py - 9), 10, 1.8)
    a = u * 3
    p.setPen(QPen(QColor("#8a8a8a"), 1.0))
    p.drawLine(QPointF(px + math.cos(a) * 4, py - 9 + math.sin(a) * 1), QPointF(px + 8 + math.cos(a) * 2, py - 20))
    p.setPen(QPen(QColor(255, 255, 255, 170), 1.0))
    p.setBrush(Qt.NoBrush)
    for i in range(3):
        k = (u * 0.6 + i / 3) % 1.0
        x = px - 5 + i * 5 + math.sin(u * 2 + i) * 1.5
        path = QPainterPath(QPointF(x, py - 11 - k * 4))
        path.quadTo(QPointF(x + 2, py - 14 - k * 8), QPointF(x, py - 17 - k * 10))
        p.drawPath(path)
    k = (u * 0.7) % 1.0
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(("#e33b3b", "#7bbf6a", "#ffcf3f")[int(u * 0.7) % 3]))
    p.drawEllipse(QPointF(px - 2, r.top() + 3 + k * (py - r.top() - 12)), 1.8, 1.8)
    f = _font(5.0)
    _outlined_text(p, r.left() + 2, r.bottom() - 2, RECIPES[seed % len(RECIPES)], f, "#fff7c2")


def _sports(p, r, u, seed, info):
    _grad(p, r, "#3e9b4a", "#2f8a3c")
    w, h = r.width(), r.height()
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 25))
    for i in range(0, 7, 2):
        p.drawRect(QRectF(r.left() + i * w / 7, r.top(), w / 7, h))
    p.setPen(QPen(QColor(255, 255, 255, 190), 0.7))
    p.setBrush(Qt.NoBrush)
    p.drawRect(r.adjusted(2, 4, -2, -2))
    p.drawLine(QPointF(r.center().x(), r.top() + 4), QPointF(r.center().x(), r.bottom() - 2))
    p.drawEllipse(r.center() + QPointF(0, 1), 5, 5)
    p.drawRect(QRectF(r.left() + 2, r.center().y() - 5, 5, 12))
    p.drawRect(QRectF(r.right() - 7, r.center().y() - 5, 5, 12))
    bx = r.center().x() + math.sin(u * 0.9) * w * 0.38
    by = r.center().y() + 1 + math.sin(u * 1.7) * h * 0.25
    for team, col in ((0, "#e04848"), (1, "#3f7fe0")):
        for i in range(3):
            ph = i * 2.1 + team * 1.3
            x = bx + math.sin(u * 1.1 + ph) * 12 + (i - 1) * 6 * (1 if team else -1)
            y = by + math.cos(u * 1.3 + ph) * 7 + (i - 1) * 5
            x = max(r.left() + 4, min(r.right() - 4, x))
            y = max(r.top() + 7, min(r.bottom() - 3, y))
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(col))
            p.drawEllipse(QPointF(x, y), 1.8, 2.2)
            p.setBrush(QColor("#f6d3b5"))
            p.drawEllipse(QPointF(x, y - 2.4), 1.1, 1.1)
    p.setBrush(QColor("#ffffff"))
    p.setPen(QPen(QColor("#222"), 0.4))
    p.drawEllipse(QPointF(bx, by), 1.3, 1.3)
    goals = int(u / 23)
    a, b = (seed + goals) % 3, (seed // 2 + goals // 2) % 3
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(0, 0, 0, 150))
    p.drawRect(QRectF(r.left() + 2, r.top() + 1, 22, 6))
    _outlined_text(p, r.left() + 3, r.top() + 6, "红 %d:%d 蓝" % (a, b), _font(4.6), "#ffffff")
    if (u % 23) < 2.0 and u > 3:
        _outlined_text(p, r.center().x() - 13, r.center().y() + 4, "GOAL!", _font(9), "#ffe066")


def _music(p, r, u, seed, info):
    _grad(p, r, "#2a1440", "#120822")
    w, h = r.width(), r.height()
    for i, col in enumerate(("#ff6fb5", "#6fd6ff", "#ffe066")):
        a = math.sin(u * 0.8 + i * 2.1) * 0.6
        top = QPointF(r.left() + w * (0.2 + 0.3 * i), r.top())
        g = QLinearGradient(top, QPointF(top.x(), r.bottom()))
        c = QColor(col)
        c.setAlpha(110)
        g.setColorAt(0, c)
        c.setAlpha(0)
        g.setColorAt(1, c)
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        bx = top.x() + math.sin(a) * h
        p.drawPolygon(QPolygonF([top, QPointF(bx - 7, r.bottom()), QPointF(bx + 7, r.bottom())]))
    # singer
    sx, sy = r.center().x(), r.bottom() - 9
    p.setPen(QPen(QColor("#ff9ad5"), 0.6))
    p.setBrush(QColor("#6a3f8f"))
    p.drawRoundedRect(QRectF(sx - 4, sy - 9, 8, 11), 3, 3)
    p.setBrush(QColor("#f6d3b5"))
    p.drawEllipse(QPointF(sx, sy - 12.5), 3.4, 3.6)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#3b2a22"))
    p.drawChord(QRectF(sx - 3.8, sy - 16.6, 7.6, 6.5), 10 * 16, 160 * 16)
    p.setPen(QPen(QColor("#6a3f8f"), 1.3))
    sway = math.sin(u * 2.5) * 1.5
    p.drawLine(QPointF(sx + 3, sy - 7), QPointF(sx + 5 + sway, sy - 11))
    p.setPen(QPen(QColor("#aaaaaa"), 0.8))
    p.drawLine(QPointF(sx + 5 + sway, sy - 11), QPointF(sx + 3.5, sy - 13))
    # equaliser
    p.setPen(Qt.NoPen)
    n = 12
    for i in range(n):
        lvl = 0.3 + 0.7 * abs(math.sin(u * (3 + i % 4) + i * 1.7))
        col = QColor.fromHsvF((i / n * 0.8 + u * 0.05) % 1.0, 0.6, 1.0)
        p.setBrush(col)
        bw = w / n
        p.drawRect(QRectF(r.left() + i * bw + 0.5, r.bottom() - lvl * 7, bw - 1, lvl * 7))
    for i in range(3):
        k = (u * 0.5 + i / 3) % 1.0
        _outlined_text(p, r.left() + 8 + i * 22 + math.sin(u + i) * 2, r.bottom() - 9 - k * 22, "♪", _font(6), "#ffe066")
    _outlined_text(p, r.left() + 2, r.top() + 6, SONGS[seed % len(SONGS)], _font(4.4), "#ffffff")


def _drama(p, r, u, seed, info):
    night = (seed % 2) == 0
    _grad(p, r, "#2b3a67" if night else "#f4b183", "#5b6fa6" if night else "#fbe0c3")
    w, h = r.width(), r.height()
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(20, 24, 44, 200) if night else QColor(120, 90, 80, 120))
    for i, (x, bh) in enumerate(((0.05, 16), (0.2, 22), (0.75, 19), (0.9, 25))):
        p.drawRect(QRectF(r.left() + w * x - 5, r.bottom() - 10 - bh, 10, bh))
        if night:
            p.setBrush(QColor(255, 220, 140, 180))
            for j in range(3):
                p.drawRect(QRectF(r.left() + w * x - 3 + (j % 2) * 3.5, r.bottom() - 10 - bh + 3 + j * 5, 2, 2))
            p.setBrush(QColor(20, 24, 44, 200))
    if night:
        p.setBrush(QColor(255, 255, 255, 200))
        for i in range(10):
            k = (u * 0.25 + i * 0.137) % 1.0
            p.drawEllipse(QPointF(r.left() + (i * 7.3 + math.sin(u + i) * 2) % w, r.top() + k * h), 0.7, 0.7)
    # the two leads, slowly coming closer
    gap = 9 + 5 * math.cos(u * 0.35)
    for side, hair, coat in ((-1, "#3b2a22", "#5e7fa8"), (1, "#5a3a2a", "#c97a8a")):
        x = r.center().x() + side * gap
        y = r.bottom() - 9
        p.setBrush(QColor(coat))
        p.drawRoundedRect(QRectF(x - 4, y - 10, 8, 11), 3, 3)
        p.setBrush(QColor("#f6d3b5"))
        p.drawEllipse(QPointF(x, y - 13), 3.2, 3.5)
        p.setBrush(QColor(hair))
        p.drawChord(QRectF(x - 3.6, y - 17.2, 7.2, 6), 0, 180 * 16)
        if side > 0:
            p.drawRect(QRectF(x + 1.5, y - 14.5, 2.2, 6))
    if gap < 6:
        p.setBrush(QColor("#ff6f91"))
        hx, hy = r.center().x(), r.bottom() - 28 - (6 - gap)
        p.drawEllipse(QPointF(hx - 1.2, hy), 1.5, 1.5)
        p.drawEllipse(QPointF(hx + 1.2, hy), 1.5, 1.5)
        p.drawPolygon(QPolygonF([QPointF(hx - 2.6, hy + 0.5), QPointF(hx + 2.6, hy + 0.5), QPointF(hx, hy + 3.6)]))
    p.setBrush(QColor(0, 0, 0, 120))
    p.drawRect(QRectF(r.left(), r.bottom() - 8, w, 8))
    line = DRAMA[(seed + int(u / 5)) % len(DRAMA)]
    p.setFont(_font(5.2, bold=False))
    p.setPen(QColor("#ffffff"))
    p.drawText(QRectF(r.left(), r.bottom() - 8, w, 8), Qt.AlignCenter, line)


def _catv(p, r, u, seed, info):
    """Cat TV: a bird hopping along a branch and a mouse running about - made for whiskers."""
    _grad(p, r, "#cfe9ff", "#f0f8ff")
    w, h = r.width(), r.height()
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#9bd38a"))
    p.drawRect(QRectF(r.left(), r.bottom() - 7, w, 7))
    p.setPen(QPen(QColor("#7a5236"), 2.0))
    p.drawLine(QPointF(r.left(), r.top() + 14), QPointF(r.right() - 10, r.top() + 11))
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#6fb760"))
    for i in range(5):
        p.drawEllipse(QPointF(r.left() + 6 + i * 11, r.top() + 11 + (i % 2) * 2), 3, 1.8)
    hop = abs(math.sin(u * 5)) * 2.5
    bx = r.left() + 12 + ((u * 6) % 30) if int(u / 5) % 2 == 0 else r.left() + 42 - ((u * 6) % 30)
    by = r.top() + 10 - hop
    p.setBrush(QColor("#e8734a"))
    p.drawEllipse(QPointF(bx, by), 3.2, 2.6)
    p.setBrush(QColor("#6b4a35"))
    p.drawEllipse(QPointF(bx - 1, by - 2.4), 2, 1.8)
    p.setBrush(QColor("#222"))
    p.drawEllipse(QPointF(bx - 1.4, by - 2.7), 0.4, 0.4)
    p.setBrush(QColor("#f2c14e"))
    p.drawPolygon(QPolygonF([QPointF(bx - 3, by - 2.4), QPointF(bx - 4.4, by - 2), QPointF(bx - 3, by - 1.6)]))
    # the mouse
    mx = r.left() + ((u * 14 + seed) % (w + 12)) - 6
    my = r.bottom() - 6
    p.setBrush(QColor("#9a9aa6"))
    p.drawEllipse(QPointF(mx, my), 3, 1.8)
    p.drawEllipse(QPointF(mx + 2.2, my - 1.6), 1.2, 1.2)
    p.setPen(QPen(QColor("#d48a9a"), 0.5))
    p.setBrush(Qt.NoBrush)
    p.drawArc(QRectF(mx - 8, my - 2, 6, 4), 0, -180 * 16)
    # a feather drifting down
    k = (u * 0.3) % 1.0
    p.setPen(QPen(QColor("#ff8fb1"), 0.9))
    fx = r.left() + w * 0.7 + math.sin(u * 2) * 4
    fy = r.top() + k * (h - 8)
    p.drawLine(QPointF(fx - 2, fy - 1), QPointF(fx + 2, fy + 1))


DRAW = {"cartoon": _cartoon, "nature": _nature, "sea": _sea, "news": _news, "weather": _weather,
        "cooking": _cooking, "sports": _sports, "music": _music, "drama": _drama, "cat": _catv}


def draw_screen(p, r, it, t):
    """The TV picture in screen rect r (or the dark glass when off)."""
    st = it.state
    p.save()
    p.setClipRect(r)
    if not st.get("on"):
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#22232b"))
        p.drawRect(r)
        p.setPen(QPen(QColor(255, 255, 255, 40), 3))
        p.drawLine(QPointF(r.left() + 12, r.top() + 4), QPointF(r.left() + 22, r.bottom() - 6))
        p.restore()
        return
    ch = st.get("ch") or "cartoon"
    now = time.monotonic()
    u = now - st.get("ch_mt", now - 5.0)
    seed = int(st.get("seed", 0))
    if u < 0.35:                                        # static while switching
        rnd = random.Random(int(now * 30))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#666"))
        p.drawRect(r)
        for _ in range(60):
            g = rnd.randint(40, 230)
            p.setBrush(QColor(g, g, g))
            p.drawRect(QRectF(r.left() + rnd.random() * r.width(), r.top() + rnd.random() * r.height(), 2.2, 1.2))
    else:
        try:
            DRAW.get(ch, _cartoon)(p, r, u, seed, st.get("info") or {})
        except Exception:
            p.setBrush(QColor("#335"))
            p.drawRect(r)
        # a corner logo and the glass sheen
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 255, 255, 120))
        p.drawEllipse(QPointF(r.right() - 3.5, r.top() + 3.5), 1.6, 1.6)
    g = QLinearGradient(r.topLeft(), r.bottomRight())
    g.setColorAt(0, QColor(255, 255, 255, 40))
    g.setColorAt(0.45, QColor(255, 255, 255, 0))
    p.setBrush(g)
    p.setPen(Qt.NoPen)
    p.drawRect(r)
    p.restore()


def glow_color(it):
    c = GLOW.get(it.state.get("ch") or "cartoon", (200, 210, 255))
    return QColor(*c)


class TVWorld:
    """Mixin for World: what is on, and who says what about it."""

    def step_tv(self, dt):
        tvs = self.items_of("tv")
        if not tvs:
            return
        now = time.monotonic()
        for it in tvs:
            st = it.state
            if not st.get("on"):
                st.pop("ch", None)
                continue
            viewers = [p for p in self.present_people() if p.act == "tv" and p.f == it.f and p.state == "act"]
            cats = [c for c in self.cats if c.f == it.f and c.spot is not None and c.spot[0] == it.id]
            if not st.get("ch") or self.t >= st.get("ch_until", 0):
                self.tv_switch(it, viewers, cats, first=not st.get("ch"))
                continue
            if viewers and self.t >= st.get("next_line", 0):
                st["next_line"] = self.t + random.uniform(35, 80)
                self.tv_comment(it, random.choice(viewers))
        return

    def tv_control(self, it, op, ch=None, by=None):
        """Someone (you, or a family member you control) works the TV: toggle / on / off / next / a channel."""
        st = it.state
        viewers = [p for p in self.present_people() if p.act == "tv" and p.f == it.f]
        if op == "toggle":
            op = "off" if st.get("on") else "on"
        if op == "off":
            st["manual"] = False
            st["on"] = False
            st.pop("ch", None)
            for p in viewers:
                if p.ctrl is None and p.state == "act":
                    p.say(random.choice(["诶，谁关的电视？", "好吧，不看了", "正看到精彩的地方……"]), 2.2)
                    p.end_act()
            if by is not None:
                by.say(random.choice(["关电视啦", "休息一下眼睛"]), 1.6)
            return True
        st["manual"] = True
        was_on = bool(st.get("on"))
        st["on"] = True
        if op == "ch" and ch in DRAW:
            self.tv_tune(it, ch, lock=True)
        elif op == "next" or (op == "on" and was_on):
            order = list(PROGRAMMES)
            cur = st.get("ch")
            nxt = order[(order.index(cur) + 1) % len(order)] if cur in order else order[0]
            self.tv_tune(it, nxt, lock=True)
        elif not st.get("ch"):
            self.tv_switch(it, viewers, [], first=True)
            st["ch_mt"] = time.monotonic()
        if by is not None and not by.is_cat:
            by.say(random.choice(["开电视咯～", "看看有什么节目"]) if not was_on else
                   random.choice(["换个台", "看这个～"]), 1.6)
        if not was_on:
            # a family member who has nothing on may come and watch too
            free = [p for p in self.present_people() if p.ctrl is None and p.f == it.f and p.act in ("idle", "wander")
                    and p.state in ("idle", "act") and not p.asleep_at(self.hour())]
            if free and random.random() < 0.6:
                q = random.choice(free)
                q.stop()
                if q.state == "act":
                    q.end_act()
                if q.start_act("tv"):
                    q.say(random.choice(["我也来看！", "放的什么呀？"]), 1.8, delay=1.0)
        return True

    def tv_tune(self, it, ch, lock=False):
        st = it.state
        st["ch"] = ch
        st["ch_mt"] = time.monotonic()
        st["seed"] = random.randint(0, 999)
        st["ch_until"] = self.t + (900 if lock else random.uniform(50, 160))
        st["next_line"] = self.t + random.uniform(8, 20)
        info = {"weather": self.weather()}
        try:
            wx = getattr(self.app, "weather", None) or {}
            if isinstance(wx, dict) and isinstance(wx.get("temp"), (int, float)):
                info["temp"] = wx["temp"]
        except Exception:
            pass
        st["info"] = info

    def tv_switch(self, it, viewers, cats, first=False):
        st = it.state
        h = self.hour()
        kid = any(p.role == "kid" for p in viewers)
        if 19.0 <= h < 19.6:
            opts = {"news": 6, "weather": 2, "cartoon": 1}
        elif kid:
            opts = {"cartoon": 6, "sea": 2, "nature": 1.5, "cat": 1, "music": 1}
        else:
            opts = {"drama": 3, "news": 1.6, "sports": 2.2, "cooking": 1.6, "nature": 1.6, "sea": 1.2, "music": 1.6,
                    "weather": 0.8, "cartoon": 0.5, "cat": 0.5}
        if cats:
            opts["cat"] = opts.get("cat", 0) + 2.5
        opts.pop(st.get("ch"), None)
        names = list(opts)
        ch = random.choices(names, weights=[opts[n] for n in names])[0]
        st["ch"] = ch
        st["ch_mt"] = time.monotonic()
        st["seed"] = random.randint(0, 999)
        st["ch_until"] = self.t + random.uniform(50, 160)
        st["next_line"] = self.t + random.uniform(8, 20)
        info = {"weather": self.weather()}
        try:
            wx = getattr(self.app, "weather", None) or {}
            if isinstance(wx, dict) and isinstance(wx.get("temp"), (int, float)):
                info["temp"] = wx["temp"]
        except Exception:
            pass
        st["info"] = info
        if viewers and not first and random.random() < 0.5:
            random.choice(viewers).say(random.choice(SWITCH_LINES) + "（%s）" % NAMES[ch], 2.2)

    def tv_comment(self, it, pr):
        ch = it.state.get("ch")
        lines = LINES.get(ch)
        if not lines:
            return
        cats = self.cats
        w = {"rain": "下雨", "snow": "下雪", "hot": "很热", "cold": "降温"}.get(self.weather(), "是晴天")
        text = random.choice(lines)
        try:
            text = text.format(c=random.choice(cats).name if cats else "猫咪", w=w)
        except (KeyError, IndexError):
            pass
        pr.say(text, 2.4)

    def tv_programme(self, it):
        return it.state.get("ch") if it.state.get("on") else None
