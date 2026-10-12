"""QtGui stand-in: colours, pens, brushes, fonts, paths, transforms, pixmaps and a QPainter that records commands
for the page to replay on <canvas> (see _host.flush / the page's replay())."""
import math

from .QtCore import Qt, QPointF, QPoint, QRectF, QRect, QSizeF, QSize, QLineF, QObject, Signal
from . import _host

_U16 = 65535

_NAMED = {
    "white": (255, 255, 255), "black": (0, 0, 0), "red": (255, 0, 0), "green": (0, 128, 0), "blue": (0, 0, 255),
    "yellow": (255, 255, 0), "gray": (128, 128, 128), "grey": (128, 128, 128), "orange": (255, 165, 0),
    "pink": (255, 192, 203), "purple": (128, 0, 128), "brown": (165, 42, 42), "gold": (255, 215, 0),
    "silver": (192, 192, 192), "cyan": (0, 255, 255), "magenta": (255, 0, 255), "navy": (0, 0, 128),
    "darkgray": (169, 169, 169), "lightgray": (211, 211, 211), "darkgreen": (0, 100, 0), "skyblue": (135, 206, 235),
}


# ============================================================================================ QColor
import struct as _struct

_F32 = _struct.Struct("f")
_HSV_CACHE = {}
_SHADE_CACHE = {}


def _f(x):
    """Round to float32, like Qt's float arithmetic."""
    return _F32.unpack(_F32.pack(x))[0]


def _qround(x):
    return int(_f(x + 0.5)) if x >= 0 else int(_f(x - 0.5))


def _d257(x):
    return (2 * x + 257) // 514


def _fuzzy_eq(a, b):
    return abs(a - b) * 100000.0 <= min(abs(a), abs(b))


def _to_hsv16(r16, g16, b16):
    U = _f(65535.0)
    r, g, b = _f(r16 / U), _f(g16 / U), _f(b16 / U)
    mx, mn = max(r, g, b), min(r, g, b)
    d = _f(mx - mn)
    v = _qround(_f(mx * U))
    if abs(d) <= 0.00001:
        return 65535, 0, v
    s = _qround(_f(_f(d / mx) * U))
    if _fuzzy_eq(r, mx):
        h = _f(_f(g - b) / d)
    elif _fuzzy_eq(g, mx):
        h = _f(2.0 + _f(_f(b - r) / d))
    else:
        h = _f(4.0 + _f(_f(r - g) / d))
    h = _f(h * 60.0)
    if h < 0.0:
        h = _f(h + 360.0)
    return _qround(_f(h * 100.0)), s, v


def _from_hsv16(h16, s16, v16):
    if s16 == 0 or h16 == 65535:
        return v16, v16, v16
    U = _f(65535.0)
    h = 0.0 if h16 == 36000 else _f(h16 / 6000.0)
    s = _f(s16 / U)
    v = _f(v16 / U)
    i = int(h)
    f = _f(h - i)
    p = _f(v * _f(1.0 - s))
    if i & 1:
        q = _f(v * _f(1.0 - _f(s * f)))
        r, g, b = {1: (q, v, p), 3: (p, q, v), 5: (v, p, q)}[i]
    else:
        t = _f(v * _f(1.0 - _f(s * _f(1.0 - f))))
        r, g, b = {0: (v, t, p), 2: (p, v, t), 4: (t, p, v), 6: (v, t, p)}[i]
    return _qround(_f(r * U)), _qround(_f(g * U)), _qround(_f(b * U))


class QColor:
    """Stored like Qt: 16-bit a/r/g/b; lighter()/darker() go through HSV the same way, so shades match the desktop."""
    __slots__ = ("_a", "_r", "_g", "_b", "_valid", "_css")
    HexRgb, HexArgb = 0, 1
    Rgb, Hsv, Hsl = 1, 2, 4
    _parsed = {}

    def __init__(self, *a):
        self._css = None
        self._valid = True
        n = len(a)
        if n >= 3:
            r, g, b = int(a[0]), int(a[1]), int(a[2])
            al = int(a[3]) if n > 3 else 255
            self._r = (r if 0 <= r <= 255 else (0 if r < 0 else 255)) * 257
            self._g = (g if 0 <= g <= 255 else (0 if g < 0 else 255)) * 257
            self._b = (b if 0 <= b <= 255 else (0 if b < 0 else 255)) * 257
            self._a = (al if 0 <= al <= 255 else (0 if al < 0 else 255)) * 257
            return
        if n == 0:
            self._a, self._r, self._g, self._b = _U16, 0, 0, 0
            self._valid = False
            return
        v = a[0]
        tv = type(v)
        if tv is str:
            t = QColor._parsed.get(v)
            if t is None:
                self._parse(v)
                t = QColor._parsed[v] = (self._a, self._r, self._g, self._b, self._valid)
            self._a, self._r, self._g, self._b, self._valid = t
        elif tv is QColor:
            self._a, self._r, self._g, self._b, self._valid, self._css = v._a, v._r, v._g, v._b, v._valid, v._css
        elif tv is int:                      # 0xRRGGBB
            self._set8((v >> 16) & 255, (v >> 8) & 255, v & 255, 255)
        else:
            self._set8(0, 0, 0, 255)

    def _set8(self, r, g, b, a=255):
        c = lambda x: max(0, min(255, int(x))) * 257
        self._r, self._g, self._b, self._a = c(r), c(g), c(b), c(a)
        self._css = None

    def _parse(self, s):
        s = s.strip()
        if s.lower() == "transparent":
            self._set8(0, 0, 0, 0)
            return
        if s.startswith("#"):
            h = s[1:]
            try:
                if len(h) == 3:
                    self._set8(int(h[0] * 2, 16), int(h[1] * 2, 16), int(h[2] * 2, 16))
                elif len(h) == 6:
                    self._set8(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
                elif len(h) == 8:
                    self._set8(int(h[2:4], 16), int(h[4:6], 16), int(h[6:8], 16), int(h[0:2], 16))
                else:
                    raise ValueError
                return
            except ValueError:
                pass
        rgb = _NAMED.get(s.lower())
        if rgb is not None:
            self._set8(*rgb)
            return
        self._set8(0, 0, 0)
        self._valid = False

    # ---- 8-bit accessors
    def red(self):
        return _d257(self._r)

    def green(self):
        return _d257(self._g)

    def blue(self):
        return _d257(self._b)

    def alpha(self):
        return _d257(self._a)

    def redF(self):
        return self._r / _U16

    def greenF(self):
        return self._g / _U16

    def blueF(self):
        return self._b / _U16

    def alphaF(self):
        return self._a / _U16

    def setRed(self, v):
        self._r = max(0, min(255, int(v))) * 257
        self._css = None

    def setGreen(self, v):
        self._g = max(0, min(255, int(v))) * 257
        self._css = None

    def setBlue(self, v):
        self._b = max(0, min(255, int(v))) * 257
        self._css = None

    def setAlpha(self, v):
        self._a = max(0, min(255, int(v))) * 257
        self._css = None

    def setAlphaF(self, v):
        self._a = int(round(max(0.0, min(1.0, float(v))) * _U16))
        self._css = None

    def setRgb(self, r, g, b, a=255):
        self._set8(r, g, b, a)

    def setRgbF(self, r, g, b, a=1.0):
        f = lambda x: int(round(max(0.0, min(1.0, x)) * _U16))
        self._r, self._g, self._b, self._a = f(r), f(g), f(b), f(a)
        self._css = None

    def getRgb(self):
        return self.red(), self.green(), self.blue(), self.alpha()

    def getRgbF(self):
        return self.redF(), self.greenF(), self.blueF(), self.alphaF()

    def rgb(self):
        return (0xff << 24) | (self.red() << 16) | (self.green() << 8) | self.blue()

    def rgba(self):
        return (self.alpha() << 24) | (self.red() << 16) | (self.green() << 8) | self.blue()

    def isValid(self):
        return self._valid

    def name(self, fmt=0):
        if fmt == QColor.HexArgb:
            return "#%02x%02x%02x%02x" % (self.alpha(), self.red(), self.green(), self.blue())
        return "#%02x%02x%02x" % (self.red(), self.green(), self.blue())

    def css(self):
        c = self._css
        if c is None:
            a = self._a / _U16
            if a >= 0.999:
                c = "#%02x%02x%02x" % (_d257(self._r), _d257(self._g), _d257(self._b))
            else:
                c = "rgba(%d,%d,%d,%.4g)" % (_d257(self._r), _d257(self._g), _d257(self._b), a)
            self._css = c
        return c

    def sidx(self):
        """Index of this colour's CSS string in the page's string table."""
        return _host.s(self.css())

    # ---- HSV (Qt's own conversion: 16-bit channels, float32 arithmetic)
    def _hsv16(self):
        key = (self._r, self._g, self._b)
        h = _HSV_CACHE.get(key)
        if h is None:
            h = _HSV_CACHE[key] = _to_hsv16(self._r, self._g, self._b)
            if len(_HSV_CACHE) > 50000:
                _HSV_CACHE.clear()
        return h

    @staticmethod
    def _from_hsv16(h, s, v, a):
        c = QColor()
        c._valid = True
        c._a = a
        c._css = None
        c._r, c._g, c._b = _from_hsv16(h, s, v)
        return c

    def lighter(self, factor=150):
        factor = int(factor)
        if factor <= 0:
            return QColor(self)
        if factor < 100:
            return self.darker(10000 // factor)
        key = (self._r, self._g, self._b, factor, 1)
        rgb = _SHADE_CACHE.get(key)
        if rgb is None:
            h, s_, v = self._hsv16()
            v = (factor * v) // 100
            if v > _U16:
                s_ -= v - _U16
                s_ = max(0, s_)
                v = _U16
            rgb = _SHADE_CACHE[key] = _from_hsv16(h, s_, v)
        c = QColor(self)
        c._r, c._g, c._b = rgb
        c._css = None
        return c

    def darker(self, factor=200):
        factor = int(factor)
        if factor <= 0:
            return QColor(self)
        if factor < 100:
            return self.lighter(10000 // factor)
        key = (self._r, self._g, self._b, factor, 0)
        rgb = _SHADE_CACHE.get(key)
        if rgb is None:
            h, s_, v = self._hsv16()
            v = (v * 100) // factor
            rgb = _SHADE_CACHE[key] = _from_hsv16(h, s_, v)
        c = QColor(self)
        c._r, c._g, c._b = rgb
        c._css = None
        return c

    def hsvHue(self):
        h = self._hsv16()[0]
        return -1 if h == _U16 else h // 100

    hue = hsvHue

    def hsvSaturation(self):
        return _d257(self._hsv16()[1])

    saturation = hsvSaturation

    def value(self):
        return _d257(self._hsv16()[2])

    def hsvHueF(self):
        h = self._hsv16()[0]
        return -1.0 if h == _U16 else h / 36000.0

    def hsvSaturationF(self):
        return self._hsv16()[1] / _U16

    def valueF(self):
        return self._hsv16()[2] / _U16

    def getHsv(self):
        return self.hsvHue(), self.hsvSaturation(), self.value(), self.alpha()

    def getHsvF(self):
        return self.hsvHueF(), self.hsvSaturationF(), self.valueF(), self.alphaF()

    def lightness(self):
        U = _f(65535.0)
        r, g, b = _f(self._r / U), _f(self._g / U), _f(self._b / U)
        return _d257(_qround(_f(_f(_f(max(r, g, b) + min(r, g, b)) * 0.5) * U)))

    def lightnessF(self):
        return self.lightness() / 255.0

    def hslHue(self):
        return self.hsvHue()

    def hslSaturation(self):
        r, g, b = self._r / _U16, self._g / _U16, self._b / _U16
        mx, mn = max(r, g, b), min(r, g, b)
        l = (mx + mn) / 2
        if mx == mn:
            return 0
        s = (mx - mn) / (mx + mn) if l < 0.5 else (mx - mn) / (2 - mx - mn)
        return int(round(s * 255))

    def toRgb(self):
        return QColor(self)

    def toHsv(self):
        return QColor(self)

    def toHsl(self):
        return QColor(self)

    def convertTo(self, spec):
        return QColor(self)

    def spec(self):
        return QColor.Rgb

    def setHsv(self, h, s, v, a=255):
        c = QColor.fromHsv(h, s, v, a)
        self._r, self._g, self._b, self._a = c._r, c._g, c._b, c._a
        self._css = None

    def setHsvF(self, h, s, v, a=1.0):
        c = QColor.fromHsvF(h, s, v, a)
        self._r, self._g, self._b, self._a = c._r, c._g, c._b, c._a
        self._css = None

    def setHsl(self, h, s, l, a=255):
        c = QColor.fromHsl(h, s, l, a)
        self._r, self._g, self._b, self._a = c._r, c._g, c._b, c._a
        self._css = None

    @staticmethod
    def fromHsv(h, s, v, a=255):
        h = -1 if h is None or h < 0 else int(h) % 360
        return QColor._from_hsv16(_U16 if h < 0 else h * 100, max(0, min(255, int(s))) * 257,
                                  max(0, min(255, int(v))) * 257, max(0, min(255, int(a))) * 257)

    @staticmethod
    def fromHsvF(h, s, v, a=1.0):
        hh = _U16 if h < 0 else int(round((h % 1.0 if h < 1.0 else 0.0) * 36000))
        f = lambda x: int(round(max(0.0, min(1.0, x)) * _U16))
        return QColor._from_hsv16(hh, f(s), f(v), f(a))

    @staticmethod
    def fromHsl(h, s, l, a=255):
        return QColor.fromHslF((h % 360) / 360.0 if h is not None and h >= 0 else -1, s / 255.0, l / 255.0, a / 255.0)

    @staticmethod
    def fromHslF(h, s, l, a=1.0):
        if h < 0 or s == 0:
            r = g = b = l
        else:
            q = l * (1 + s) if l < 0.5 else l + s - l * s
            p = 2 * l - q

            def hue(t):
                t %= 1.0
                if t < 1 / 6:
                    return p + (q - p) * 6 * t
                if t < 1 / 2:
                    return q
                if t < 2 / 3:
                    return p + (q - p) * (2 / 3 - t) * 6
                return p
            r, g, b = hue(h + 1 / 3), hue(h), hue(h - 1 / 3)
        c = QColor()
        c.setRgbF(r, g, b, a)
        c._valid = True
        return c

    @staticmethod
    def fromRgb(*a):
        return QColor(*a)

    @staticmethod
    def fromRgbF(r, g, b, a=1.0):
        c = QColor()
        c.setRgbF(r, g, b, a)
        c._valid = True
        return c

    @staticmethod
    def fromString(s):
        return QColor(s)

    @staticmethod
    def isValidColor(s):
        return QColor(s).isValid()

    def __eq__(self, o):
        return isinstance(o, QColor) and (self._a, self._r, self._g, self._b) == (o._a, o._r, o._g, o._b)

    def __hash__(self):
        return hash((self._a, self._r, self._g, self._b))

    def __repr__(self):
        return "QColor(%s)" % self.name(QColor.HexArgb)


def _color(c):
    if isinstance(c, QColor):
        return c
    return QColor(c)


# ============================================================================================ pens / brushes
class QGradient:
    PadSpread, ReflectSpread, RepeatSpread = 0, 1, 2
    LogicalMode, StretchToDeviceMode, ObjectBoundingMode, ObjectMode = 0, 1, 2, 3

    def __init__(self):
        self._stops = []
        self._mode = 0

    def setColorAt(self, pos, color):
        pos = float(pos)
        self._stops = [s for s in self._stops if s[0] != pos]
        self._stops.append((pos, _color(color)))
        self._stops.sort(key=lambda s: s[0])

    def setStops(self, stops):
        self._stops = sorted([(float(p), _color(c)) for p, c in stops], key=lambda s: s[0])

    def stops(self):
        return list(self._stops)

    def setSpread(self, s):
        pass

    def setCoordinateMode(self, m):
        self._mode = m

    def _stops_enc(self):
        out = [len(self._stops)]
        for p, c in self._stops:
            out.append(p)
            out.append(c.sidx())
        return out


class QLinearGradient(QGradient):
    def __init__(self, *a):
        super().__init__()
        if len(a) == 2:
            a = (a[0].x(), a[0].y(), a[1].x(), a[1].y())
        self._p = tuple(float(v) for v in a) if a else (0.0, 0.0, 0.0, 0.0)

    def setStart(self, *a):
        p = a[0] if len(a) == 1 else QPointF(*a)
        self._p = (p.x(), p.y()) + self._p[2:]

    def setFinalStop(self, *a):
        p = a[0] if len(a) == 1 else QPointF(*a)
        self._p = self._p[:2] + (p.x(), p.y())

    def start(self):
        return QPointF(self._p[0], self._p[1])

    def finalStop(self):
        return QPointF(self._p[2], self._p[3])

    def enc(self):
        return tuple([-2, 0, self._mode] + list(self._p) + self._stops_enc())


class QRadialGradient(QGradient):
    def __init__(self, *a):
        super().__init__()
        # (cx, cy, r) | (cx, cy, r, fx, fy) | (center, r) | (center, r, focal) | (center, cr, focal, fr)
        if a and isinstance(a[0], QPointF):
            cx, cy, r = a[0].x(), a[0].y(), float(a[1])
            if len(a) >= 3 and isinstance(a[2], QPointF):
                fx, fy = a[2].x(), a[2].y()
            else:
                fx, fy = cx, cy
        elif len(a) >= 3:
            cx, cy, r = float(a[0]), float(a[1]), float(a[2])
            fx, fy = (float(a[3]), float(a[4])) if len(a) >= 5 else (cx, cy)
        else:
            cx = cy = fx = fy = 0.0
            r = 1.0
        self._p = (cx, cy, r, fx, fy)

    def setFocalPoint(self, *a):
        p = a[0] if len(a) == 1 else QPointF(*a)
        self._p = self._p[:3] + (p.x(), p.y())

    def setCenter(self, *a):
        p = a[0] if len(a) == 1 else QPointF(*a)
        self._p = (p.x(), p.y()) + self._p[2:]

    def setRadius(self, r):
        self._p = self._p[:2] + (float(r),) + self._p[3:]

    def center(self):
        return QPointF(self._p[0], self._p[1])

    def radius(self):
        return self._p[2]

    def enc(self):
        return tuple([-2, 1, self._mode] + list(self._p) + self._stops_enc())


class QConicalGradient(QGradient):
    def __init__(self, *a):
        super().__init__()
        if a and isinstance(a[0], QPointF):
            self._p = (a[0].x(), a[0].y(), float(a[1]))
        else:
            self._p = tuple(float(v) for v in a) if a else (0.0, 0.0, 0.0)

    def enc(self):
        return tuple([-2, 2, self._mode] + list(self._p) + self._stops_enc())


class QBrush:
    def __init__(self, *a):
        self._style = Qt.SolidPattern
        self._color = QColor(0, 0, 0)
        self._grad = None
        if not a:
            self._style = Qt.NoBrush
            return
        v = a[0]
        if isinstance(v, QBrush):
            self._style, self._color, self._grad = v._style, v._color, v._grad
        elif isinstance(v, QGradient):
            self._grad = v
        elif v is Qt.NoBrush or (isinstance(v, int) and not isinstance(v, bool) and v == Qt.NoBrush and not isinstance(v, QColor)):
            self._style = Qt.NoBrush
        elif isinstance(v, QPixmap):
            self._color = QColor(128, 128, 128)
        else:
            self._color = _color(v)

    def style(self):
        return self._style

    def color(self):
        return QColor(self._color)

    def setColor(self, c):
        self._color = _color(c)

    def gradient(self):
        return self._grad

    def isOpaque(self):
        return self._grad is None and self._color.alpha() == 255

    def enc(self):
        if self._style == Qt.NoBrush:
            return _NO_STYLE
        if self._grad is not None:
            return self._grad.enc()
        return (self._color.sidx(),)


_NO_STYLE = (-1,)


def _style_enc(b):
    """A brush / colour / gradient as the page's style encoding: (-1) none, (i) colour i, (-2, ...) gradient."""
    if b is None:
        return _NO_STYLE
    t = type(b)
    if t is QColor:
        return (b.sidx(),)
    if t is QBrush or isinstance(b, QGradient):
        return b.enc()
    if t is str:
        return (QColor(b).sidx(),)
    if t is int and b == Qt.NoBrush:
        return _NO_STYLE
    return QBrush(b).enc()


class QPen:
    def __init__(self, *a):
        self._brush = QBrush(QColor(0, 0, 0))
        self._w = 1.0
        self._style = Qt.SolidLine
        self._cap = Qt.SquareCap
        self._join = Qt.BevelJoin
        self._dash = None
        self._cosmetic = False
        if not a:
            return
        v = a[0]
        if isinstance(v, QPen):
            self._brush, self._w, self._style, self._cap, self._join, self._dash, self._cosmetic = (
                v._brush, v._w, v._style, v._cap, v._join, v._dash, v._cosmetic)
            return
        if isinstance(v, int) and not isinstance(v, bool) and len(a) == 1 and v in (Qt.NoPen, Qt.SolidLine, Qt.DashLine,
                                                                                       Qt.DotLine, Qt.DashDotLine):
            self._style = v
            return
        self._brush = v if isinstance(v, QBrush) else QBrush(v if isinstance(v, QGradient) else _color(v))
        if len(a) > 1:
            self._w = float(a[1])
        if len(a) > 2:
            self._style = a[2]
        if len(a) > 3:
            self._cap = a[3]
        if len(a) > 4:
            self._join = a[4]

    def color(self):
        return self._brush.color()

    def setColor(self, c):
        self._brush = QBrush(_color(c))

    def brush(self):
        return self._brush

    def setBrush(self, b):
        self._brush = b if isinstance(b, QBrush) else QBrush(b)

    def width(self):
        return int(self._w)

    def widthF(self):
        return self._w

    def setWidth(self, w):
        self._w = float(w)

    setWidthF = setWidth

    def style(self):
        return self._style

    def setStyle(self, s):
        self._style = s

    def capStyle(self):
        return self._cap

    def setCapStyle(self, c):
        self._cap = c

    def joinStyle(self):
        return self._join

    def setJoinStyle(self, j):
        self._join = j

    def setDashPattern(self, pat):
        self._dash = [float(v) for v in pat]
        self._style = 0x10

    def setDashOffset(self, v):
        pass

    def setCosmetic(self, on):
        self._cosmetic = bool(on)

    def setMiterLimit(self, v):
        pass

    def enc(self):
        if self._style == Qt.NoPen:
            return _NO_STYLE
        w = self._w if self._w > 0 else 1.0
        if self._style == Qt.DashLine:
            dash = (4 * w, 2 * w)
        elif self._style == Qt.DotLine:
            dash = (1 * w, 2 * w)
        elif self._style == Qt.DashDotLine:
            dash = (4 * w, 2 * w, 1 * w, 2 * w)
        elif self._dash:
            dash = tuple(d * w for d in self._dash)
        else:
            dash = ()
        cap = 0 if self._cap == Qt.FlatCap else 2 if self._cap == Qt.RoundCap else 1
        join = 2 if self._join == Qt.RoundJoin else 0 if self._join == Qt.MiterJoin else 1
        return self._brush.enc() + (self._w, cap, join, 1 if (self._cosmetic or self._w == 0) else 0, len(dash)) + dash


def _pen_enc(p):
    if p is None:
        return _NO_STYLE
    if type(p) is QPen:
        return p.enc()
    if type(p) is int and p == Qt.NoPen:
        return _NO_STYLE
    return QPen(p).enc()


# ============================================================================================ fonts
_DEFAULT_PEN = None          # set below, once QColor works


class QFont:
    Thin, ExtraLight, Light, Normal, Medium, DemiBold, Bold, ExtraBold, Black = 100, 200, 300, 400, 500, 600, 700, 800, 900
    PercentageSpacing, AbsoluteSpacing = 0, 1
    PreferDefault, PreferAntialias, NoAntialias, PreferQuality = 1, 0x80, 0x100, 0x400
    PreferNoHinting, PreferVerticalHinting, PreferFullHinting, PreferDefaultHinting = 1, 2, 3, 0
    StyleNormal, StyleItalic = 0, 1
    MixedCase, AllUppercase = 0, 1
    SansSerif = 0

    def __init__(self, *a):
        self._family = _host.DEFAULT_FAMILY
        self._px = 13.0
        self._weight = 400
        self._italic = False
        self._spacing = 0.0
        if a:
            v = a[0]
            if isinstance(v, QFont):
                self._family, self._px, self._weight, self._italic, self._spacing = (
                    v._family, v._px, v._weight, v._italic, v._spacing)
            elif isinstance(v, str):
                self._family = v or _host.DEFAULT_FAMILY
                if len(a) > 1 and a[1] is not None and a[1] > 0:
                    self._px = a[1] * 4.0 / 3.0
                if len(a) > 2 and a[2] is not None and a[2] >= 0:
                    self._weight = a[2] if a[2] >= 100 else (700 if a[2] >= 75 else 400)
                if len(a) > 3:
                    self._italic = bool(a[3])

    def setPixelSize(self, px):
        self._px = float(max(1, int(px)))

    def pixelSize(self):
        return int(self._px)

    def setPointSize(self, pt):
        self._px = float(pt) * 4.0 / 3.0

    setPointSizeF = setPointSize

    def pointSize(self):
        return int(round(self._px * 0.75))

    def pointSizeF(self):
        return self._px * 0.75

    def setBold(self, on):
        self._weight = 700 if on else 400

    def bold(self):
        return self._weight >= 600

    def setWeight(self, w):
        w = int(w)
        self._weight = w if w >= 100 else (700 if w >= 75 else 600 if w >= 63 else 500 if w >= 57 else 400)

    def weight(self):
        return self._weight

    def setItalic(self, on):
        self._italic = bool(on)

    def italic(self):
        return self._italic

    def setFamily(self, f):
        self._family = f or _host.DEFAULT_FAMILY

    def setFamilies(self, fs):
        if fs:
            self._family = fs[0]

    def family(self):
        return self._family

    def setLetterSpacing(self, mode, v):
        self._spacing = float(v) if mode == QFont.AbsoluteSpacing else 0.0

    def setStyleStrategy(self, *a):
        pass

    def setHintingPreference(self, *a):
        pass

    def setCapitalization(self, *a):
        pass

    def setStyleHint(self, *a):
        pass

    def setKerning(self, *a):
        pass

    def setStretch(self, *a):
        pass

    def css(self):
        fam = self._family
        stack = _host.FONT_STACK if fam == _host.DEFAULT_FAMILY or fam in _host.CJK_FAMILIES else \
            '"%s", %s' % (fam, _host.FONT_STACK)
        return "%s%d %.2fpx %s" % ("italic " if self._italic else "", self._weight, self._px, stack)

    def key(self):
        return (self.css(), self._spacing)

    def __eq__(self, o):
        return isinstance(o, QFont) and self.key() == o.key()

    def __hash__(self):
        return hash(self.key())


class QFontInfo:
    def __init__(self, f):
        self._f = f

    def family(self):
        return self._f.family()

    def pixelSize(self):
        return self._f.pixelSize()


class QFontDatabase:
    @staticmethod
    def families(*a):
        return list(_host.CJK_FAMILIES)

    @staticmethod
    def addApplicationFont(*a):
        return -1

    @staticmethod
    def systemFont(*a):
        return QFont()


class QFontMetricsF:
    def __init__(self, font, *a):
        self._f = font if isinstance(font, QFont) else QFont()
        self._css = self._f.css()

    def _m(self):
        return _host.font_metrics(self._css)

    def horizontalAdvance(self, text, *a):
        text = str(text)
        w = _host.measure(self._css, text)
        if self._f._spacing:
            w += self._f._spacing * len(text)
        return w

    width = horizontalAdvance

    def ascent(self):
        return self._m()[0]

    def descent(self):
        return self._m()[1]

    def height(self):
        a, d = self._m()
        return a + d

    def lineSpacing(self):
        return self.height() + self.leading()

    def leading(self):
        return 0.0

    def capHeight(self):
        return self._m()[0] * 0.72

    def xHeight(self):
        return self._m()[0] * 0.52

    def averageCharWidth(self):
        return self.horizontalAdvance("x")

    def maxWidth(self):
        return self._f._px

    def lines(self, w, text, wrap):
        return _wrap_lines(self, str(text), w if wrap else None)

    def boundingRect(self, *a):
        if len(a) == 1:
            text = str(a[0])
            ls = text.split("\n")
            w = max(self.horizontalAdvance(t) for t in ls)
            return QRectF(0, -self.ascent(), w, self.height() * len(ls))
        r = a[0]
        flags = a[1] if len(a) > 1 else 0
        text = str(a[2]) if len(a) > 2 else ""
        if isinstance(r, (int, float)):            # (x, y, w, h, flags, text)
            r = QRectF(a[0], a[1], a[2], a[3])
            flags, text = a[4], str(a[5])
        lines = self.lines(r.width(), text, bool(flags & Qt.TextWordWrap))
        w = max([self.horizontalAdvance(t) for t in lines] or [0.0])
        h = self.height() * len(lines)
        x = r.left()
        if flags & Qt.AlignHCenter:
            x = r.left() + (r.width() - w) / 2
        elif flags & Qt.AlignRight:
            x = r.right() - w
        y = r.top()
        if flags & Qt.AlignVCenter:
            y = r.top() + (r.height() - h) / 2
        elif flags & Qt.AlignBottom:
            y = r.bottom() - h
        return QRectF(x, y, w, h)

    def tightBoundingRect(self, text):
        return self.boundingRect(text)

    def elidedText(self, text, mode, width, flags=0):
        text = str(text)
        if self.horizontalAdvance(text) <= width:
            return text
        ell = "…"
        lo, hi = 0, len(text)
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if self.horizontalAdvance(text[:mid] + ell) <= width:
                lo = mid
            else:
                hi = mid - 1
        return text[:lo] + ell


class QFontMetrics(QFontMetricsF):
    def horizontalAdvance(self, text, *a):
        return int(math.ceil(super().horizontalAdvance(text)))

    width = horizontalAdvance

    def height(self):
        return int(math.ceil(super().height()))

    def ascent(self):
        return int(math.ceil(super().ascent()))

    def descent(self):
        return int(math.ceil(super().descent()))


def _wrap_lines(fm, text, width):
    out = []
    for para in text.split("\n"):
        if width is None or width <= 0 or fm.horizontalAdvance(para) <= width:
            out.append(para)
            continue
        line = ""
        tokens = []
        word = ""
        for ch in para:                           # CJK breaks anywhere, latin at spaces
            if ord(ch) > 0x2e80:
                if word:
                    tokens.append(word)
                    word = ""
                tokens.append(ch)
            elif ch == " ":
                word += ch
                tokens.append(word)
                word = ""
            else:
                word += ch
        if word:
            tokens.append(word)
        for tk in tokens:
            if line and fm.horizontalAdvance(line + tk) > width:
                out.append(line.rstrip())
                line = tk.lstrip() if tk.strip() else ""
            else:
                line += tk
        out.append(line)
    return out


# ============================================================================================ transforms
class QTransform:
    __slots__ = ("m",)

    def __init__(self, *a):
        if len(a) == 6:
            self.m = tuple(float(v) for v in a)
        elif len(a) == 1 and isinstance(a[0], QTransform):
            self.m = a[0].m
        else:
            self.m = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)       # m11 m12 m21 m22 dx dy

    def _pre(self, o):
        """o * self (o applied first, in local coordinates)."""
        a1, b1, c1, d1, e1, f1 = o
        a, b, c, d, e, f = self.m
        self.m = (a1 * a + b1 * c, a1 * b + b1 * d, c1 * a + d1 * c, c1 * b + d1 * d,
                  e1 * a + f1 * c + e, e1 * b + f1 * d + f)
        return self

    def translate(self, dx, dy):
        return self._pre((1.0, 0.0, 0.0, 1.0, float(dx), float(dy)))

    def scale(self, sx, sy):
        return self._pre((float(sx), 0.0, 0.0, float(sy), 0.0, 0.0))

    def rotate(self, deg, *a):
        r = math.radians(deg)
        c, s = math.cos(r), math.sin(r)
        return self._pre((c, s, -s, c, 0.0, 0.0))

    def shear(self, sh, sv):
        return self._pre((1.0, float(sv), float(sh), 1.0, 0.0, 0.0))

    def __mul__(self, o):
        """self * o: self first, then o."""
        t = QTransform(*o.m)
        return t._pre(self.m)

    def map(self, *a):
        a_, b, c, d, e, f = self.m
        if len(a) == 2:
            x, y = a
            return a_ * x + c * y + e, b * x + d * y + f
        o = a[0]
        if isinstance(o, QPainterPath):
            return o._transformed(self)
        if isinstance(o, QPolygonF):
            return QPolygonF([self.map(p) for p in o])
        if isinstance(o, QLineF):
            return QLineF(self.map(o.p1()), self.map(o.p2()))
        x, y = o.x(), o.y()
        return type(o)(a_ * x + c * y + e, b * x + d * y + f) if isinstance(o, QPoint) else \
            QPointF(a_ * x + c * y + e, b * x + d * y + f)

    def mapRect(self, r):
        pts = [self.map(QPointF(x, y)) for x, y in ((r.left(), r.top()), (r.right(), r.top()),
                                                     (r.left(), r.bottom()), (r.right(), r.bottom()))]
        xs, ys = [p.x() for p in pts], [p.y() for p in pts]
        return QRectF(min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys))

    def inverted(self):
        a, b, c, d, e, f = self.m
        det = a * d - b * c
        if abs(det) < 1e-12:
            return QTransform(), False
        ia, ib, ic, id_ = d / det, -b / det, -c / det, a / det
        ie, if_ = -(e * ia + f * ic), -(e * ib + f * id_)
        return QTransform(ia, ib, ic, id_, ie, if_), True

    def isIdentity(self):
        return self.m == (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)

    def m11(self):
        return self.m[0]

    def m12(self):
        return self.m[1]

    def m21(self):
        return self.m[2]

    def m22(self):
        return self.m[3]

    def dx(self):
        return self.m[4]

    def dy(self):
        return self.m[5]

    @staticmethod
    def fromTranslate(dx, dy):
        return QTransform().translate(dx, dy)

    @staticmethod
    def fromScale(sx, sy):
        return QTransform().scale(sx, sy)


# ============================================================================================ polygons / paths
class QPolygonF(list):
    def __init__(self, pts=()):
        if isinstance(pts, QRectF):
            pts = [pts.topLeft(), pts.topRight(), pts.bottomRight(), pts.bottomLeft(), pts.topLeft()]
        super().__init__(QPointF(p) if not isinstance(p, QPointF) else p for p in pts)

    def append(self, p):
        super().append(p)

    def __lshift__(self, p):
        self.append(p)
        return self

    def size(self):
        return len(self)

    def count(self, *a):
        return len(self)

    def at(self, i):
        return self[i]

    def boundingRect(self):
        if not self:
            return QRectF()
        xs, ys = [p.x() for p in self], [p.y() for p in self]
        return QRectF(min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys))

    def translated(self, *a):
        dx, dy = (a[0].x(), a[0].y()) if len(a) == 1 else a
        return QPolygonF([QPointF(p.x() + dx, p.y() + dy) for p in self])

    def containsPoint(self, p, rule=Qt.OddEvenFill):
        return _point_in_poly(p.x(), p.y(), [(q.x(), q.y()) for q in self])

    def isEmpty(self):
        return not self


QPolygon = QPolygonF


def _point_in_poly(x, y, pts):
    inside = False
    n = len(pts)
    j = n - 1
    for i in range(n):
        xi, yi = pts[i]
        xj, yj = pts[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi:
            inside = not inside
        j = i
    return inside


def _xy(a):
    """(x, y) from (QPointF) or (x, y)."""
    if len(a) >= 2 and not isinstance(a[0], QPointF):
        return float(a[0]), float(a[1]), a[2:]
    return a[0].x(), a[0].y(), a[1:]


def _rect(a):
    """QRectF from (QRectF, ...) or (x, y, w, h, ...); returns (rect, rest)."""
    if isinstance(a[0], QRectF):
        return a[0], a[1:]
    return QRectF(a[0], a[1], a[2], a[3]), a[4:]


class QPainterPath:
    """Elements: ("M",x,y) ("L",x,y) ("Q",cx,cy,x,y) ("C",c1x,c1y,c2x,c2y,x,y) ("A",x,y,w,h,start,sweep)
    ("Z",) ("E",cx,cy,rx,ry) ("R",x,y,w,h) ("RR",x,y,w,h,rx,ry); boolean results are kept as ("op", a, b)."""
    OddEvenFill, WindingFill = Qt.OddEvenFill, Qt.WindingFill

    def __init__(self, *a):
        self._el = []
        self._rule = Qt.OddEvenFill
        self._cur = (0.0, 0.0)
        self._start = (0.0, 0.0)
        self._bool = None                       # (op, A, B)
        if a:
            if isinstance(a[0], QPainterPath):
                self._el = list(a[0]._el)
                self._rule, self._cur, self._start, self._bool = a[0]._rule, a[0]._cur, a[0]._start, a[0]._bool
            else:
                x, y, _ = _xy(a)
                self.moveTo(x, y)

    # building
    def moveTo(self, *a):
        x, y, _ = _xy(a)
        self._el.append(("M", x, y))
        self._cur = self._start = (x, y)

    def lineTo(self, *a):
        x, y, _ = _xy(a)
        if not self._el:
            self._el.append(("M", 0.0, 0.0))
        self._el.append(("L", x, y))
        self._cur = (x, y)

    def quadTo(self, *a):
        if isinstance(a[0], QPointF):
            cx, cy, x, y = a[0].x(), a[0].y(), a[1].x(), a[1].y()
        else:
            cx, cy, x, y = (float(v) for v in a)
        if not self._el:
            self._el.append(("M", 0.0, 0.0))
        self._el.append(("Q", cx, cy, x, y))
        self._cur = (x, y)

    def cubicTo(self, *a):
        if isinstance(a[0], QPointF):
            v = (a[0].x(), a[0].y(), a[1].x(), a[1].y(), a[2].x(), a[2].y())
        else:
            v = tuple(float(x) for x in a)
        if not self._el:
            self._el.append(("M", 0.0, 0.0))
        self._el.append(("C",) + v)
        self._cur = (v[4], v[5])

    def arcTo(self, *a):
        r, rest = _rect(a)
        start, sweep = float(rest[0]), float(rest[1])
        if not self._el:
            self._el.append(("M",) + _arc_pt(r, start))
        self._el.append(("A", r.x(), r.y(), r.width(), r.height(), start, sweep))
        self._cur = _arc_pt(r, start + sweep)

    def arcMoveTo(self, *a):
        r, rest = _rect(a)
        x, y = _arc_pt(r, float(rest[0]))
        self.moveTo(x, y)

    def closeSubpath(self):
        if self._el:
            self._el.append(("Z",))
            self._cur = self._start

    def addEllipse(self, *a):
        if isinstance(a[0], QPointF):
            cx, cy, rx, ry = a[0].x(), a[0].y(), float(a[1]), float(a[2])
        else:
            r, _ = _rect(a)
            cx, cy, rx, ry = r.x() + r.width() / 2, r.y() + r.height() / 2, r.width() / 2, r.height() / 2
        self._el.append(("E", cx, cy, rx, ry))
        self._cur = self._start = (cx + rx, cy)

    def addRect(self, *a):
        r, _ = _rect(a)
        self._el.append(("R", r.x(), r.y(), r.width(), r.height()))
        self._cur = self._start = (r.x(), r.y())

    def addRoundedRect(self, *a):
        r, rest = _rect(a)
        rx, ry = float(rest[0]), float(rest[1]) if len(rest) > 1 else float(rest[0])
        if len(rest) > 2 and rest[2] == 1:              # Qt.RelativeSize
            rx, ry = r.width() / 2 * rx / 100.0, r.height() / 2 * ry / 100.0
        self._el.append(("RR", r.x(), r.y(), r.width(), r.height(), rx, ry))
        self._cur = self._start = (r.x(), r.y())

    def addPolygon(self, poly):
        pts = list(poly)
        if not pts:
            return
        self.moveTo(pts[0].x(), pts[0].y())
        for p in pts[1:]:
            self.lineTo(p.x(), p.y())

    def addPath(self, o):
        if o._bool is not None:
            self._el.append(("P", o))
        else:
            self._el.extend(o._el)
        self._cur = o._cur

    def connectPath(self, o):
        self.addPath(o)

    def addText(self, *a):
        pass

    def setFillRule(self, r):
        self._rule = r

    def fillRule(self):
        return self._rule

    def currentPosition(self):
        return QPointF(*self._cur)

    def isEmpty(self):
        return not self._el and self._bool is None

    def elementCount(self):
        return len(self._el)

    def clear(self):
        self._el = []

    # boolean results (drawn by the page with clipping)
    def _op(self, op, o):
        p = QPainterPath()
        p._bool = (op, self, o)
        p._rule = self._rule
        return p

    def intersected(self, o):
        return self._op("I", o)

    def subtracted(self, o):
        return self._op("S", o)

    def united(self, o):
        return self._op("U", o)

    def simplified(self):
        p = QPainterPath(self)
        p._rule = Qt.WindingFill
        return p

    def translated(self, *a):
        dx, dy = (a[0].x(), a[0].y()) if len(a) == 1 else (float(a[0]), float(a[1]))
        return self._transformed(QTransform().translate(dx, dy))

    def translate(self, *a):
        p = self.translated(*a)
        self._el, self._cur, self._start, self._bool = p._el, p._cur, p._start, p._bool

    def _transformed(self, t):
        p = QPainterPath()
        p._rule = self._rule
        if self._bool is not None:
            op, a, b = self._bool
            p._bool = (op, a._transformed(t), b._transformed(t))
            return p
        mp = lambda x, y: t.map(x, y)
        simple = t.m[1] == 0 and t.m[2] == 0               # no rotation: ellipses / rects stay what they are
        for e in self._el:
            k = e[0]
            if k in ("M", "L"):
                p._el.append((k,) + mp(e[1], e[2]))
            elif k == "Q":
                p._el.append(("Q",) + mp(e[1], e[2]) + mp(e[3], e[4]))
            elif k == "C":
                p._el.append(("C",) + mp(e[1], e[2]) + mp(e[3], e[4]) + mp(e[5], e[6]))
            elif k == "Z":
                p._el.append(e)
            elif k == "P":
                p._el.append(("P", e[1]._transformed(t)))
            elif simple and k in ("E", "R", "RR", "A"):
                sx, sy = t.m[0], t.m[3]
                if k == "E":
                    cx, cy = mp(e[1], e[2])
                    p._el.append(("E", cx, cy, e[3] * abs(sx), e[4] * abs(sy)))
                else:
                    x0, y0 = mp(e[1], e[2])
                    x1, y1 = mp(e[1] + e[3], e[2] + e[4])
                    rest = e[5:]
                    if k == "RR":
                        rest = (rest[0] * abs(sx), rest[1] * abs(sy))
                    elif k == "A" and (sx < 0) != (sy < 0):
                        rest = (180 - rest[0] if sx < 0 else -rest[0], -rest[1])
                    p._el.append((k, min(x0, x1), min(y0, y1), abs(x1 - x0), abs(y1 - y0)) + tuple(rest))
            else:                                          # rotated: flatten this element
                for sub in _flatten_el(e, None):
                    pts = sub
                    if pts:
                        p._el.append(("M",) + mp(*pts[0]))
                        for q in pts[1:]:
                            p._el.append(("L",) + mp(*q))
                        if k != "A":
                            p._el.append(("Z",))
        p._cur = mp(*self._cur)
        p._start = mp(*self._start)
        return p

    # geometry (by flattening)
    def _polys(self):
        """[(points, closed)] -- the outline as polylines."""
        if self._bool is not None:
            return self._bool[1]._polys()
        out = []
        cur = None
        start = (0.0, 0.0)
        for e in self._el:
            k = e[0]
            if k == "M":
                if cur and len(cur) > 1:
                    out.append((cur, False))
                cur = [(e[1], e[2])]
                start = (e[1], e[2])
            elif k == "L":
                cur = (cur or [(0.0, 0.0)])
                cur.append((e[1], e[2]))
            elif k in ("Q", "C", "A"):
                cur = (cur or [(0.0, 0.0)])
                for sub in _flatten_el(e, cur[-1]):
                    cur.extend(sub if k != "A" else sub)
            elif k == "Z":
                if cur:
                    out.append((cur, True))
                    cur = [start]
            elif k == "P":
                out.extend(e[1]._polys())
            else:
                if cur and len(cur) > 1:
                    out.append((cur, False))
                cur = None
                for sub in _flatten_el(e, None):
                    out.append((sub, True))
        if cur and len(cur) > 1:
            out.append((cur, False))
        return out

    def boundingRect(self):
        """From the control points (and the boxes of ellipses / arcs): quick, and a little generous on curves."""
        if self._bool is not None:
            return self._bool[1].boundingRect()
        x0 = y0 = 1e18
        x1 = y1 = -1e18
        for e in self._el:
            k = e[0]
            if k in ("M", "L", "Q", "C"):
                for i in range(1, len(e), 2):
                    x, y = e[i], e[i + 1]
                    if x < x0:
                        x0 = x
                    if x > x1:
                        x1 = x
                    if y < y0:
                        y0 = y
                    if y > y1:
                        y1 = y
            elif k == "E":
                x0, x1 = min(x0, e[1] - e[3]), max(x1, e[1] + e[3])
                y0, y1 = min(y0, e[2] - e[4]), max(y1, e[2] + e[4])
            elif k in ("R", "RR", "A"):
                if k == "A":
                    for x, y in _flatten_el(e, None)[0]:
                        x0, x1, y0, y1 = min(x0, x), max(x1, x), min(y0, y), max(y1, y)
                else:
                    x0, x1 = min(x0, e[1]), max(x1, e[1] + e[3])
                    y0, y1 = min(y0, e[2]), max(y1, e[2] + e[4])
        if x0 > x1:
            return QRectF()
        return QRectF(x0, y0, x1 - x0, y1 - y0)

    controlPointRect = boundingRect

    def contains(self, o):
        if isinstance(o, QRectF):
            return all(self.contains(p) for p in (o.topLeft(), o.bottomRight()))
        x, y = o.x(), o.y()
        if self._bool is not None:
            op, a, b = self._bool
            ia, ib = a.contains(o), b.contains(o)
            return (ia and ib) if op == "I" else (ia and not ib) if op == "S" else (ia or ib)
        inside = False
        for pts, _ in self._polys():
            if _point_in_poly(x, y, pts):
                inside = not inside
        return inside

    def _length_pts(self):
        pts = []
        for ps, closed in self._polys():
            pts.extend(ps)
            if closed:
                pts.append(ps[0])
        return pts

    def length(self):
        pts = self._length_pts()
        return sum(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1))

    def pointAtPercent(self, t):
        pts = self._length_pts()
        if not pts:
            return QPointF()
        if len(pts) == 1:
            return QPointF(*pts[0])
        segs = [math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1)]
        total = sum(segs) or 1.0
        target = max(0.0, min(1.0, t)) * total
        for i, s in enumerate(segs):
            if target <= s or i == len(segs) - 1:
                k = target / s if s else 0.0
                return QPointF(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k)
            target -= s
        return QPointF(*pts[-1])

    def angleAtPercent(self, t):
        a = self.pointAtPercent(max(0.0, t - 0.01))
        b = self.pointAtPercent(min(1.0, t + 0.01))
        return math.degrees(math.atan2(-(b.y() - a.y()), b.x() - a.x())) % 360

    def toFillPolygon(self, *a):
        pts = []
        for ps, _ in self._polys():
            pts.extend(ps)
        return QPolygonF([QPointF(x, y) for x, y in pts])

    # for the page
    _CODES = {"M": 1, "L": 2, "Q": 3, "C": 4, "A": 5, "Z": 6, "E": 7, "R": 8, "RR": 9}

    def _enc_into(self, F):
        """(kind, ...): kind 0 = rule, n, elements (code, numbers); 1/2/3 = intersected / subtracted / united
        followed by the two paths."""
        if self._bool is not None:
            op, a, b = self._bool
            F.append(1 if op == "I" else 2 if op == "S" else 3)
            a._enc_into(F)
            b._enc_into(F)
            return
        el = self._el
        F.extend((0, 1 if self._rule == Qt.WindingFill else 0, len(el)))
        codes = QPainterPath._CODES
        for e in el:
            k = e[0]
            if k == "P":
                F.append(10)
                e[1]._enc_into(F)
                continue
            F.append(codes[k])
            if len(e) > 1:
                F.extend(e[1:])


def _arc_pt(r, deg):
    a = math.radians(deg)
    cx, cy = r.x() + r.width() / 2, r.y() + r.height() / 2
    return cx + r.width() / 2 * math.cos(a), cy - r.height() / 2 * math.sin(a)


def _flatten_el(e, cur):
    """Polylines for one curved / closed element."""
    k = e[0]
    if k == "Q":
        x0, y0 = cur
        cx, cy, x, y = e[1:]
        n = 10
        return [[((1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y)
                 for t in (i / n for i in range(1, n + 1))]]
    if k == "C":
        x0, y0 = cur
        c1x, c1y, c2x, c2y, x, y = e[1:]
        n = 14
        pts = []
        for i in range(1, n + 1):
            t = i / n
            u = 1 - t
            pts.append((u ** 3 * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t ** 3 * x,
                        u ** 3 * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t ** 3 * y))
        return [pts]
    if k == "A":
        x, y, w, h, start, sweep = e[1:]
        r = QRectF(x, y, w, h)
        n = max(4, int(abs(sweep) / 10))
        return [[_arc_pt(r, start + sweep * i / n) for i in range(0, n + 1)]]
    if k == "E":
        cx, cy, rx, ry = e[1:]
        n = 28
        return [[(cx + rx * math.cos(2 * math.pi * i / n), cy + ry * math.sin(2 * math.pi * i / n)) for i in range(n)]]
    if k == "R":
        x, y, w, h = e[1:]
        return [[(x, y), (x + w, y), (x + w, y + h), (x, y + h)]]
    if k == "RR":
        x, y, w, h = e[1:5]
        return [[(x, y), (x + w, y), (x + w, y + h), (x, y + h)]]
    return []


# ============================================================================================ pixmaps / images
class QPaintDevice:
    pass


class QPixmap(QPaintDevice):
    """A canvas on the page (by id). Sizes are device pixels, like Qt."""

    def __init__(self, *a):
        self._w = self._h = 0
        self._dpr = 1.0
        self._id = 0
        if a:
            if isinstance(a[0], (QSize, QSizeF)):
                w, h = a[0].width(), a[0].height()
            elif isinstance(a[0], (int, float)) and len(a) >= 2:
                w, h = a[0], a[1]
            else:
                w = h = 0
            self._w, self._h = max(0, int(w)), max(0, int(h))
            if self._w and self._h:
                self._id = _host.new_canvas(self._w, self._h)

    def __del__(self):
        try:
            if self._id:
                _host.free_canvas(self._id)
        except Exception:
            pass

    def isNull(self):
        return not self._id

    def width(self):
        return self._w

    def height(self):
        return self._h

    def size(self):
        return QSize(self._w, self._h)

    def rect(self):
        return QRect(0, 0, self._w, self._h)

    def devicePixelRatio(self):
        return self._dpr

    def devicePixelRatioF(self):
        return self._dpr

    def setDevicePixelRatio(self, d):
        self._dpr = float(d)

    def deviceIndependentSize(self):
        return QSizeF(self._w / self._dpr, self._h / self._dpr)

    def fill(self, c=None):
        if self._id:
            _host.F.extend((5, self._id))
            _host.F.extend(_NO_STYLE if c is None else _style_enc(c))

    def copy(self, *a):
        if not a:
            r = QRect(0, 0, self._w, self._h)
        else:
            r = a[0] if isinstance(a[0], QRectF) else QRect(*a)
        pm = QPixmap(max(1, int(r.width())), max(1, int(r.height())))
        pm._dpr = self._dpr
        if pm._id and self._id:
            _host.F.extend((6, pm._id, self._id, r.x(), r.y(), r.width(), r.height(), 0, 0, pm._w, pm._h))
        return pm

    def scaled(self, *a, **k):
        if isinstance(a[0], (QSize, QSizeF)):
            w, h = a[0].width(), a[0].height()
            rest = a[1:]
        else:
            w, h = a[0], a[1]
            rest = a[2:]
        mode = rest[0] if rest else Qt.IgnoreAspectRatio
        if mode == Qt.KeepAspectRatio and self._w and self._h:
            k_ = min(w / self._w, h / self._h)
            w, h = self._w * k_, self._h * k_
        pm = QPixmap(max(1, int(w)), max(1, int(h)))
        if pm._id and self._id:
            _host.F.extend((6, pm._id, self._id, 0, 0, self._w, self._h, 0, 0, pm._w, pm._h))
        return pm

    def scaledToWidth(self, w, *a):
        return self.scaled(w, max(1, int(self._h * w / max(1, self._w))))

    def scaledToHeight(self, h, *a):
        return self.scaled(max(1, int(self._w * h / max(1, self._h))), h)

    def toImage(self):
        img = QImage.__new__(QImage)
        QPixmap.__init__(img)
        img._w, img._h, img._dpr = self._w, self._h, self._dpr
        if self._id:
            img._id = _host.new_canvas(self._w, self._h)
            _host.F.extend((6, img._id, self._id, 0, 0, self._w, self._h, 0, 0, self._w, self._h))
        return img

    @staticmethod
    def fromImage(img, *a):
        pm = QPixmap(img._w, img._h)
        pm._dpr = img._dpr
        if pm._id and img._id:
            _host.F.extend((6, pm._id, img._id, 0, 0, img._w, img._h, 0, 0, img._w, img._h))
        return pm

    def save(self, *a):
        return False

    def load(self, *a):
        return False

    def transformed(self, t, *a):
        return self.copy()

    def hasAlphaChannel(self):
        return True

    def cacheKey(self):
        return self._id


class QImage(QPixmap):
    Format_ARGB32_Premultiplied, Format_ARGB32, Format_RGB32, Format_RGBA8888, Format_Alpha8, Format_Grayscale8 = (
        6, 5, 4, 17, 24, 24)

    def __init__(self, *a):
        if a and isinstance(a[0], (QSize, QSizeF)):
            super().__init__(a[0])
        elif len(a) >= 2 and isinstance(a[0], (int, float)) and isinstance(a[1], (int, float)):
            super().__init__(a[0], a[1])
        else:
            super().__init__()

    def convertToFormat(self, *a):
        return self

    def format(self):
        return QImage.Format_ARGB32_Premultiplied

    def scaled(self, *a, **k):
        pm = QPixmap.scaled(self, *a, **k)
        return pm.toImage()

    def mirrored(self, h=False, v=True):
        img = QImage(self._w, self._h)
        img._dpr = self._dpr
        if img._id and self._id:
            _host.F.extend((7, img._id, self._id, 1 if h else 0, 1 if v else 0))
        return img

    def pixelColor(self, *a):
        return QColor(0, 0, 0, 0)

    def pixel(self, *a):
        return 0


class QBitmap(QPixmap):
    pass


class QIcon:
    def __init__(self, *a):
        self._pm = a[0] if a and isinstance(a[0], QPixmap) else None

    def addPixmap(self, pm, *a):
        self._pm = pm

    def isNull(self):
        return self._pm is None

    def pixmap(self, *a):
        return self._pm or QPixmap()


# ============================================================================================ regions
class QRegion:
    def __init__(self, *a):
        self._rects = []
        self._br = None
        if a:
            if isinstance(a[0], QRectF):
                r = a[0]
            elif len(a) >= 4:
                r = QRect(*a[:4])
            else:
                r = None
            if r is not None and r.width() > 0 and r.height() > 0:
                self._rects = [QRect(r.x(), r.y(), r.width(), r.height())]

    def united(self, o):
        g = QRegion()
        rs = o._rects if isinstance(o, QRegion) else [QRect(o.x(), o.y(), o.width(), o.height())]
        g._rects = self._rects + [r for r in rs if r.width() > 0 and r.height() > 0]
        return g

    __add__ = __or__ = united

    def intersected(self, o):
        g = QRegion()
        others = o._rects if isinstance(o, QRegion) else [o]
        for a in self._rects:
            for b in others:
                i = QRectF(a.x(), a.y(), a.width(), a.height()).intersected(QRectF(b.x(), b.y(), b.width(), b.height()))
                if i.width() > 0 and i.height() > 0:
                    g._rects.append(QRect(i))
        return g

    def intersects(self, o):
        if isinstance(o, QRegion):
            return any(a.intersects(b) for a in self._rects for b in o._rects)
        return any(QRectF(a.x(), a.y(), a.width(), a.height()).intersects(QRectF(o.x(), o.y(), o.width(), o.height()))
                   for a in self._rects)

    def contains(self, p):
        return any(r.contains(p) for r in self._rects)

    def boundingRect(self):
        br = self._br
        if br is None:
            if not self._rects:
                br = QRect()
            else:
                x0 = min(r._x for r in self._rects)
                y0 = min(r._y for r in self._rects)
                x1 = max(r._x + r._w for r in self._rects)
                y1 = max(r._y + r._h for r in self._rects)
                br = QRect(x0, y0, x1 - x0, y1 - y0)
            self._br = br
        return QRect(br._x, br._y, br._w, br._h)

    def isEmpty(self):
        return not self._rects

    def rects(self):
        return list(self._rects)

    def __iter__(self):
        return iter(self._rects)

    def rectCount(self):
        return len(self._rects)

    def translated(self, *a):
        dx, dy = (a[0].x(), a[0].y()) if len(a) == 1 else a
        g = QRegion()
        g._rects = [r.translated(dx, dy) for r in self._rects]
        return g


# ============================================================================================ the painter
def _target(dev):
    if isinstance(dev, QPixmap):
        return dev._id, dev._dpr
    if hasattr(dev, "_canvas_id"):
        return dev._canvas_id(), 1.0
    return 0, 1.0


class QPainter:
    """Records painting as opcodes + numbers in _host.F (see the page's replayBin for the meaning of each)."""
    Antialiasing, TextAntialiasing, SmoothPixmapTransform, LosslessImageRendering = 1, 2, 4, 0x40
    RenderHint = int
    (CompositionMode_SourceOver, CompositionMode_DestinationOver, CompositionMode_Clear, CompositionMode_Source,
     CompositionMode_Destination, CompositionMode_SourceIn, CompositionMode_DestinationIn,
     CompositionMode_SourceOut, CompositionMode_DestinationOut, CompositionMode_SourceAtop,
     CompositionMode_DestinationAtop, CompositionMode_Xor, CompositionMode_Plus, CompositionMode_Multiply,
     CompositionMode_Screen, CompositionMode_Overlay, CompositionMode_Darken, CompositionMode_Lighten,
     CompositionMode_ColorDodge, CompositionMode_ColorBurn, CompositionMode_HardLight, CompositionMode_SoftLight,
     CompositionMode_Difference, CompositionMode_Exclusion) = range(24)
    _COMP = ["source-over", "destination-over", "copy", "copy", "destination-over", "source-in", "destination-in",
             "source-out", "destination-out", "source-atop", "destination-atop", "xor", "lighter", "multiply", "screen",
             "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference",
             "exclusion"]

    def __init__(self, dev=None):
        self._active = False
        if dev is not None:
            self.begin(dev)

    def begin(self, dev):
        tid, dpr = _target(dev)
        self._dev = dev
        self._tid = tid
        self._pen = None
        self._pspec = _DEFAULT_PEN
        self._brush = None
        self._bspec = _NO_STYLE
        self._font = QFont()
        self._t = QTransform()
        self._op = 1.0
        self._stack = []
        self._active = True
        self._pen_sent = _DEFAULT_PEN
        self._brush_sent = _NO_STYLE
        self._font_sent = None
        _host.F.extend((1, tid, dpr))
        return True

    def end(self):
        if self._active:
            self._active = False
            _host.F.append(2)
        return True

    def __del__(self):
        try:
            if self._active:
                self.end()
        except Exception:
            pass

    def isActive(self):
        return self._active

    def device(self):
        return self._dev

    # ---- state
    def save(self):
        self._stack.append((self._pen, self._pspec, self._brush, self._bspec, self._font, self._t, self._op,
                            self._pen_sent, self._brush_sent, self._font_sent))
        _host.F.append(8)

    def restore(self):
        if self._stack:
            (self._pen, self._pspec, self._brush, self._bspec, self._font, self._t, self._op,
             self._pen_sent, self._brush_sent, self._font_sent) = self._stack.pop()
        _host.F.append(9)

    def setRenderHint(self, h, on=True):
        if h == QPainter.SmoothPixmapTransform:
            _host.F.extend((15, 1 if on else 0))

    def setRenderHints(self, h, on=True):
        pass

    def renderHints(self):
        return QPainter.Antialiasing

    def setPen(self, *a):
        v = a[0] if len(a) == 1 else QPen(*a)
        tv = type(v)
        if tv is QColor:
            self._pen = v
            self._pspec = (v.sidx(), 1.0, 1, 1, 0, 0)
        elif tv is QPen:
            self._pen = v
            self._pspec = v.enc()
        elif tv is str:
            c = QColor(v)
            self._pen = c
            self._pspec = (c.sidx(), 1.0, 1, 1, 0, 0)
        elif tv is int and v == Qt.NoPen:
            self._pen = None
            self._pspec = _NO_STYLE
        else:
            pn = QPen(v)
            self._pen = pn
            self._pspec = pn.enc()

    def pen(self):
        v = self._pen
        if v is None:
            return QPen(Qt.NoPen)
        return QPen(v)

    def setBrush(self, *a):
        v = a[0]
        tv = type(v)
        if tv is QColor:
            self._brush = v
            self._bspec = (v.sidx(),)
        elif tv is str:
            c = QColor(v)
            self._brush = c
            self._bspec = (c.sidx(),)
        elif tv is QBrush:
            self._brush = v
            self._bspec = v.enc()
        elif isinstance(v, QGradient):
            self._brush = v
            self._bspec = v.enc()
        elif tv is int and v == Qt.NoBrush:
            self._brush = None
            self._bspec = _NO_STYLE
        else:
            b = QBrush(v)
            self._brush = b
            self._bspec = b.enc()

    def brush(self):
        v = self._brush
        if v is None:
            return QBrush()
        return QBrush(v)

    def setFont(self, f):
        self._font = QFont(f)

    def font(self):
        return QFont(self._font)

    def fontMetrics(self):
        return QFontMetrics(self._font)

    def setOpacity(self, o):
        self._op = max(0.0, min(1.0, float(o)))
        _host.F.extend((13, self._op))

    def opacity(self):
        return self._op

    def setCompositionMode(self, m):
        _host.F.extend((14, _host.s(QPainter._COMP[m] if 0 <= m < len(QPainter._COMP) else "source-over")))

    def setBackgroundMode(self, *a):
        pass

    def setBackground(self, *a):
        pass

    def setClipping(self, on):
        if not on:
            _host.F.append(42)

    def setViewport(self, *a):
        pass

    def setWindow(self, *a):
        pass

    # ---- transforms
    def translate(self, *a):
        if len(a) == 2:
            dx, dy = a
        else:
            dx, dy = a[0].x(), a[0].y()
        self._t = QTransform(self._t).translate(dx, dy)
        _host.F.extend((16, dx, dy))

    def rotate(self, deg):
        self._t = QTransform(self._t).rotate(deg)
        _host.F.extend((17, deg))

    def scale(self, sx, sy):
        self._t = QTransform(self._t).scale(sx, sy)
        _host.F.extend((18, sx, sy))

    def shear(self, sh, sv):
        self._t = QTransform(self._t).shear(sh, sv)
        self._send_t()

    def _send_t(self):
        _host.F.append(19)
        _host.F.extend(self._t.m)

    def resetTransform(self):
        self._t = QTransform()
        self._send_t()

    def setTransform(self, t, combine=False):
        self._t = (QTransform(t) * self._t) if combine else QTransform(t)
        self._send_t()

    setWorldTransform = setTransform

    def transform(self):
        return QTransform(self._t)

    worldTransform = transform
    combinedTransform = transform
    deviceTransform = transform

    # ---- clipping
    def setClipRect(self, *a):
        r, rest = _rect(a)
        op = rest[0] if rest else Qt.ReplaceClip
        if op == Qt.NoClip:
            _host.F.append(42)
            return
        _host.F.extend((39, r._x, r._y, r._w, r._h) if type(r) is QRectF else (39, r.x(), r.y(), r.width(), r.height()))

    def setClipPath(self, path, op=Qt.ReplaceClip):
        if op == Qt.NoClip:
            _host.F.append(42)
            return
        _host.F.append(40)
        path._enc_into(_host.F)

    def setClipRegion(self, reg, op=Qt.ReplaceClip):
        rs = reg.rects()
        F = _host.F
        F.extend((41, len(rs)))
        for r in rs:
            F.extend((r.x(), r.y(), r.width(), r.height()))

    def hasClipping(self):
        return False

    def clipBoundingRect(self):
        return QRectF()

    # ---- pen / brush / font sync
    def _sync(self):
        F = _host.F
        if self._pen_sent is not self._pspec and self._pen_sent != self._pspec:
            F.append(10)
            F.extend(self._pspec)
        self._pen_sent = self._pspec
        if self._brush_sent is not self._bspec and self._brush_sent != self._bspec:
            F.append(11)
            F.extend(self._bspec)
        self._brush_sent = self._bspec

    def _sync_pen(self):
        if self._pen_sent is not self._pspec and self._pen_sent != self._pspec:
            _host.F.append(10)
            _host.F.extend(self._pspec)
        self._pen_sent = self._pspec

    def _sync_font(self):
        f = self._font
        key = f.key()
        if self._font_sent != key:
            _host.F.extend((12, _host.s(key[0]), key[1]))
            self._font_sent = key

    # ---- drawing
    def drawRect(self, *a):
        self._sync()
        F = _host.F
        if type(a[0]) is QRectF:
            for r in a:
                F.extend((20, r._x, r._y, r._w, r._h))
            return
        r, _ = _rect(a)
        F.extend((20, r.x(), r.y(), r.width(), r.height()))

    def drawRects(self, rects):
        for r in rects:
            self.drawRect(r)

    def fillRect(self, *a):
        r, rest = _rect(a)
        b = rest[0] if rest else self._brush
        F = _host.F
        F.extend((33, r.x(), r.y(), r.width(), r.height()))
        F.extend(_style_enc(b))

    def eraseRect(self, *a):
        r, _ = _rect(a)
        _host.F.extend((34, r.x(), r.y(), r.width(), r.height()))

    def drawRoundedRect(self, *a, **k):
        r, rest = _rect(a)
        rx = float(rest[0]) if rest else 0.0
        ry = float(rest[1]) if len(rest) > 1 else rx
        if (len(rest) > 2 and rest[2] == 1) or k.get("mode") == 1:     # RelativeSize
            rx, ry = r.width() / 2 * rx / 100.0, r.height() / 2 * ry / 100.0
        self._sync()
        _host.F.extend((21, r.x(), r.y(), r.width(), r.height(), rx, ry))

    def drawRoundRect(self, *a):
        self.drawRoundedRect(*a)

    def drawEllipse(self, *a):
        a0 = a[0]
        if len(a) == 3 and type(a0) is QPointF:
            cx, cy, rx, ry = a0._x, a0._y, a[1], a[2]
        elif isinstance(a0, QPointF) and len(a) >= 3:
            cx, cy, rx, ry = a0.x(), a0.y(), float(a[1]), float(a[2])
        else:
            r, _ = _rect(a)
            cx, cy, rx, ry = r.x() + r.width() / 2, r.y() + r.height() / 2, r.width() / 2, r.height() / 2
        self._sync()
        _host.F.extend((22, cx, cy, rx, ry))

    def drawLine(self, *a):
        a0 = a[0]
        if type(a0) is QPointF:
            b = a[1]
            x1, y1, x2, y2 = a0._x, a0._y, b.x(), b.y()
        elif isinstance(a0, QLineF):
            x1, y1, x2, y2 = a0._c
        elif isinstance(a0, QPointF):
            x1, y1, x2, y2 = a0.x(), a0.y(), a[1].x(), a[1].y()
        else:
            x1, y1, x2, y2 = a[:4]
        self._sync_pen()
        _host.F.extend((23, x1, y1, x2, y2))

    def drawLines(self, lines):
        for ln in lines:
            self.drawLine(ln)

    def drawPoint(self, *a):
        x, y, _ = _xy(a)
        self._sync_pen()
        _host.F.extend((24, x, y))

    def drawPoints(self, *a):
        pts = a[0] if len(a) == 1 else a
        for p in pts:
            self.drawPoint(p)

    def drawPath(self, path):
        self._sync()
        F = _host.F
        F.append(25)
        path._enc_into(F)

    def fillPath(self, path, brush):
        F = _host.F
        F.append(26)
        path._enc_into(F)
        F.extend(_style_enc(brush))

    def strokePath(self, path, pen):
        F = _host.F
        F.append(27)
        path._enc_into(F)
        F.extend(_pen_enc(pen))

    def _pts(self, a):
        if len(a) == 1 or (len(a) == 2 and not isinstance(a[1], QPointF)):
            pts = a[0]
            rule = a[1] if len(a) == 2 else Qt.OddEvenFill
        else:
            pts, rule = a, Qt.OddEvenFill
        flat = []
        for p in pts:
            if isinstance(p, (tuple, list)):
                flat.append(float(p[0]))
                flat.append(float(p[1]))
            else:
                flat.append(p.x())
                flat.append(p.y())
        return flat, rule

    def drawPolygon(self, *a):
        flat, rule = self._pts(a)
        self._sync()
        F = _host.F
        F.extend((28, 1 if rule == Qt.WindingFill else 0, len(flat) // 2))
        F.extend(flat)

    drawConvexPolygon = drawPolygon

    def drawPolyline(self, *a):
        flat, _ = self._pts(a)
        self._sync_pen()
        F = _host.F
        F.extend((29, len(flat) // 2))
        F.extend(flat)

    def _arc(self, op, a):
        r, rest = _rect(a)
        _host.F.extend((op, r.x(), r.y(), r.width(), r.height(), int(rest[0]), int(rest[1])))

    def drawArc(self, *a):
        self._sync_pen()
        self._arc(30, a)

    def drawChord(self, *a):
        self._sync()
        self._arc(31, a)

    def drawPie(self, *a):
        self._sync()
        self._arc(32, a)

    def drawText(self, *a):
        self._sync_pen()
        self._sync_font()
        a0 = a[0]
        if isinstance(a0, QRectF):
            flags = a[1] if len(a) > 2 else 0
            text = a[2] if len(a) > 2 else a[1]
            _host.F.extend((35, a0.x(), a0.y(), a0.width(), a0.height(), int(flags), _host.s(str(text))))
        elif isinstance(a0, QPointF):
            _host.F.extend((36, a0.x(), a0.y(), _host.s(str(a[1]))))
        elif len(a) >= 6:
            _host.F.extend((35, a[0], a[1], a[2], a[3], int(a[4]), _host.s(str(a[5]))))
        else:
            _host.F.extend((36, a[0], a[1], _host.s(str(a[2]))))

    def drawStaticText(self, *a):
        pass

    def drawPixmap(self, *a):
        # (QPointF|QPoint, pm) | (x, y, pm) | (QRectF, pm, QRectF) | (QRectF, pm) | (x, y, w, h, pm)
        # | (x, y, pm, sx, sy, sw, sh) | (QPointF, pm, QRectF)
        a0 = a[0]
        if isinstance(a0, QRectF):
            pm = a[1]
            if len(a) > 2:
                src = a[2]
                sx, sy, sw, sh = src.x(), src.y(), src.width(), src.height()
            else:
                sx, sy, sw, sh = 0, 0, pm._w, pm._h
            tx, ty, tw, th = a0.x(), a0.y(), a0.width(), a0.height()
        elif isinstance(a0, QPointF):
            pm = a[1]
            if len(a) > 2:
                src = a[2]
                sx, sy, sw, sh = src.x(), src.y(), src.width(), src.height()
            else:
                sx, sy, sw, sh = 0, 0, pm._w, pm._h
            tx, ty = a0.x(), a0.y()
            tw, th = sw / pm._dpr, sh / pm._dpr
        elif len(a) >= 5 and isinstance(a[4], QPixmap):
            tx, ty, tw, th, pm = a[0], a[1], a[2], a[3], a[4]
            sx, sy, sw, sh = 0, 0, pm._w, pm._h
        else:
            tx, ty, pm = a[0], a[1], a[2]
            if len(a) >= 7:
                sx, sy, sw, sh = a[3], a[4], a[5], a[6]
            else:
                sx, sy, sw, sh = 0, 0, pm._w, pm._h
            tw, th = sw / pm._dpr, sh / pm._dpr
        if not pm._id:
            return
        if sw < 0:
            sw = pm._w - sx
        if sh < 0:
            sh = pm._h - sy
        if tw <= 0:
            tw = sw / pm._dpr
        if th <= 0:
            th = sh / pm._dpr
        _host.F.extend((37, pm._id, tx, ty, tw, th, sx, sy, sw, sh))

    drawImage = drawPixmap

    def drawTiledPixmap(self, r, pm, *a):
        _host.F.extend((38, pm._id, r.x(), r.y(), r.width(), r.height()))


class QPainterPathStroker:
    def __init__(self, *a):
        self._w = 1.0

    def setWidth(self, w):
        self._w = w

    def setCapStyle(self, *a):
        pass

    def setJoinStyle(self, *a):
        pass

    def createStroke(self, path):
        return path


# ============================================================================================ misc gui
class QCursor:
    def __init__(self, *a):
        self._shape = a[0] if a else Qt.ArrowCursor

    @staticmethod
    def pos():
        x, y = _host.mouse_pos()
        return QPoint(x, y)

    @staticmethod
    def setPos(*a):
        pass

    def shape(self):
        return self._shape


class QScreen:
    def geometry(self):
        w, h = _host.screen_size()
        return QRect(0, 0, w, h)

    availableGeometry = geometry

    def devicePixelRatio(self):
        return _host.dpr()

    def name(self):
        return "web"

    def size(self):
        w, h = _host.screen_size()
        return QSize(w, h)


_SCREEN = QScreen()


class _Clipboard:
    def setText(self, t, *a):
        _host.clipboard(str(t))

    def text(self, *a):
        return ""


class QGuiApplication:
    @staticmethod
    def primaryScreen():
        return _SCREEN

    @staticmethod
    def screens():
        return [_SCREEN]

    @staticmethod
    def screenAt(*a):
        return _SCREEN

    @staticmethod
    def clipboard():
        return _Clipboard()

    @staticmethod
    def keyboardModifiers():
        return _host.modifiers()

    @staticmethod
    def queryKeyboardModifiers():
        return _host.modifiers()

    @staticmethod
    def mouseButtons():
        return 0

    @staticmethod
    def instance():
        return None

    @staticmethod
    def setOverrideCursor(*a):
        pass

    @staticmethod
    def restoreOverrideCursor(*a):
        pass

    @staticmethod
    def applicationState():
        return 4

    @staticmethod
    def platformName():
        return "web"

    @staticmethod
    def focusWindow():
        return None


class QPalette:
    Window, WindowText, Base, Text, Button, ButtonText, Highlight, HighlightedText, ToolTipBase, ToolTipText, \
        PlaceholderText, AlternateBase, BrightText, Light, Mid, Dark, Shadow, Link = range(18)
    Active, Inactive, Disabled = 0, 1, 2

    def __init__(self, *a):
        pass

    def setColor(self, *a):
        pass

    def color(self, *a):
        return QColor(255, 255, 255)

    def setBrush(self, *a):
        pass


class QKeySequence:
    def __init__(self, *a):
        self._s = a[0] if a else ""

    def toString(self):
        return str(self._s)


class QAction(QObject):
    triggered = Signal()
    toggled = Signal()

    def __init__(self, *a):
        super().__init__()
        self._text = ""
        self._checkable = False
        self._checked = False
        self._enabled = True
        self._menu = None
        self._sep = False
        for v in a:
            if isinstance(v, str):
                self._text = v

    def text(self):
        return self._text

    def setText(self, t):
        self._text = t

    def setCheckable(self, on):
        self._checkable = bool(on)

    def isCheckable(self):
        return self._checkable

    def setChecked(self, on):
        self._checked = bool(on)

    def isChecked(self):
        return self._checked

    def setEnabled(self, on):
        self._enabled = bool(on)

    def isEnabled(self):
        return self._enabled

    def menu(self):
        return self._menu

    def setMenu(self, m):
        self._menu = m

    def isSeparator(self):
        return self._sep

    def setSeparator(self, on):
        self._sep = on

    def setToolTip(self, *a):
        pass

    def setFont(self, *a):
        pass

    def setIcon(self, *a):
        pass

    def setData(self, d):
        self._data = d

    def data(self):
        return getattr(self, "_data", None)

    def setShortcut(self, *a):
        pass

    def setVisible(self, on):
        self._visible = on

    def trigger(self):
        if self._checkable:
            self._checked = not self._checked
        self.triggered.emit()


class QTextOption:
    pass


class QStaticText:
    def __init__(self, *a):
        pass


class QDesktopServices:
    @staticmethod
    def openUrl(u):
        _host.open_url(u.toString() if hasattr(u, "toString") else str(u))
        return True


class QIntValidator:
    def __init__(self, *a):
        pass


class QRegularExpressionValidator(QIntValidator):
    pass


class QShortcut(QObject):
    activated = Signal()

    def __init__(self, *a):
        super().__init__()


class QPaintEvent:
    def __init__(self, r):
        self._r = r

    def rect(self):
        return self._r

    def region(self):
        return QRegion(self._r)


class QMouseEvent:
    def __init__(self, x, y, gx, gy, button, buttons, mods):
        self._p = QPointF(x, y)
        self._g = QPointF(gx, gy)
        self._b, self._bs, self._m = button, buttons, mods
        self._acc = True

    def position(self):
        return QPointF(self._p)

    def pos(self):
        return self._p.toPoint()

    def x(self):
        return int(self._p.x())

    def y(self):
        return int(self._p.y())

    def globalPosition(self):
        return QPointF(self._g)

    def globalPos(self):
        return self._g.toPoint()

    def scenePosition(self):
        return QPointF(self._p)

    def button(self):
        return self._b

    def buttons(self):
        return self._bs

    def modifiers(self):
        return self._m

    def accept(self):
        self._acc = True

    def ignore(self):
        self._acc = False

    def type(self):
        return 0


QContextMenuEvent = QMouseEvent


class QWheelEvent(QMouseEvent):
    def __init__(self, x, y, gx, gy, dx, dy, mods):
        super().__init__(x, y, gx, gy, 0, 0, mods)
        self._d = QPoint(dx, dy)

    def angleDelta(self):
        return self._d

    def pixelDelta(self):
        return QPoint(0, 0)


class QKeyEvent:
    def __init__(self, key, text, mods, auto=False):
        self._k, self._t, self._m, self._auto = key, text, mods, auto
        self._acc = True

    def key(self):
        return self._k

    def text(self):
        return self._t

    def modifiers(self):
        return self._m

    def isAutoRepeat(self):
        return self._auto

    def nativeScanCode(self):
        return 0

    def nativeVirtualKey(self):
        return self._k

    def accept(self):
        self._acc = True

    def ignore(self):
        self._acc = False

    def type(self):
        return 6


class QResizeEvent:
    def __init__(self, w, h, ow, oh):
        self._s, self._o = QSize(w, h), QSize(ow, oh)

    def size(self):
        return self._s

    def oldSize(self):
        return self._o


class QCloseEvent:
    def accept(self):
        pass

    def ignore(self):
        pass


class QShowEvent:
    pass


class QHideEvent:
    pass


class QFocusEvent:
    def reason(self):
        return 0


class QEnterEvent(QMouseEvent):
    pass


class QInputMethodEvent:
    pass


class QWindow:
    def isExposed(self):
        return True

    def startSystemMove(self):
        return False

    def startSystemResize(self, *a):
        return False

    def screen(self):
        return _SCREEN

    def setFlag(self, *a):
        pass


_DEFAULT_PEN = (QColor(0, 0, 0).sidx(), 1.0, 1, 1, 0, 0)
