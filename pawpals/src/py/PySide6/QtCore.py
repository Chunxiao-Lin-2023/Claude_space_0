"""QtCore stand-in: geometry value types, Qt enums, timers and signals."""
import math


class _QtMeta(type):
    def __getattr__(cls, name):            # unknown flags / enums: a unique harmless int
        v = 0x40000000 + (hash(name) & 0xffffff)
        setattr(cls, name, v)
        return v


class Qt(metaclass=_QtMeta):
    # pens / brushes
    NoPen, SolidLine, DashLine, DotLine, DashDotLine = 0, 1, 2, 3, 4
    FlatCap, SquareCap, RoundCap = 0x00, 0x10, 0x20
    MiterJoin, BevelJoin, RoundJoin = 0x00, 0x40, 0x80
    NoBrush, SolidPattern = 0, 1
    # colours
    white, black, red, green, blue, transparent, gray, darkGray, lightGray, yellow = (
        "#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "transparent", "#a0a0a4", "#808080", "#c0c0c0",
        "#ffff00")
    # alignment / text
    AlignLeft, AlignRight, AlignHCenter, AlignJustify = 0x1, 0x2, 0x4, 0x8
    AlignTop, AlignBottom, AlignVCenter = 0x20, 0x40, 0x80
    AlignCenter = 0x84
    TextSingleLine, TextDontClip, TextWordWrap = 0x100, 0x200, 0x1000
    ElideRight, ElideLeft, ElideMiddle, ElideNone = 1, 0, 2, 3
    # clip ops
    NoClip, ReplaceClip, IntersectClip = 0, 1, 2
    # fill rules
    OddEvenFill, WindingFill = 0, 1
    # mouse
    NoButton, LeftButton, RightButton, MiddleButton = 0, 1, 2, 4
    NoModifier, ShiftModifier, ControlModifier, AltModifier, MetaModifier = 0, 0x02000000, 0x04000000, 0x08000000, 0x10000000
    # aspect / transform
    IgnoreAspectRatio, KeepAspectRatio, KeepAspectRatioByExpanding = 0, 1, 2
    FastTransformation, SmoothTransformation = 0, 1
    # keys
    Key_Escape, Key_Tab, Key_Backspace, Key_Return, Key_Enter = 0x01000000, 0x01000001, 0x01000003, 0x01000004, 0x01000005
    Key_Delete, Key_Home, Key_End = 0x01000007, 0x01000010, 0x01000011
    Key_Left, Key_Up, Key_Right, Key_Down = 0x01000012, 0x01000013, 0x01000014, 0x01000015
    Key_PageUp, Key_PageDown = 0x01000016, 0x01000017
    Key_Shift, Key_Control, Key_Meta, Key_Alt = 0x01000020, 0x01000021, 0x01000022, 0x01000023
    Key_F1, Key_F2, Key_F3, Key_F4, Key_F5 = 0x01000030, 0x01000031, 0x01000032, 0x01000033, 0x01000034
    Key_Space = 0x20
    for _i, _c in enumerate("ABCDEFGHIJKLMNOPQRSTUVWXYZ"):
        locals()["Key_" + _c] = 0x41 + _i
    for _i in range(10):
        locals()["Key_%d" % _i] = 0x30 + _i
    Key_Plus, Key_Minus, Key_Equal, Key_Comma, Key_Period, Key_Slash = 0x2b, 0x2d, 0x3d, 0x2c, 0x2e, 0x2f
    del _i, _c
    # cursors
    ArrowCursor, PointingHandCursor, SizeFDiagCursor, OpenHandCursor, ClosedHandCursor, CrossCursor = (
        "default", "pointer", "nwse-resize", "grab", "grabbing", "crosshair")
    # misc
    WindowStaysOnTopHint, FramelessWindowHint, Tool, Window, Dialog = 0x40000, 0x800, 0xb, 0x1, 0x3
    StrongFocus, NoFocus = 0xb, 0
    Checked, Unchecked = 2, 0
    Horizontal, Vertical = 1, 2
    QueuedConnection = 2


# ---------------------------------------------------------------------------------------------- geometry
class QPointF:
    __slots__ = ("_x", "_y")

    def __init__(self, *a):
        if len(a) == 2:
            self._x, self._y = a
        elif not a:
            self._x = self._y = 0.0
        else:
            self._x, self._y = float(a[0].x()), float(a[0].y())

    def x(self):
        return self._x

    def y(self):
        return self._y

    def setX(self, v):
        self._x = float(v)

    def setY(self, v):
        self._y = float(v)

    def toPoint(self):
        return QPoint(round(self._x), round(self._y))

    def manhattanLength(self):
        return abs(self._x) + abs(self._y)

    def isNull(self):
        return self._x == 0 and self._y == 0

    def __add__(self, o):
        return QPointF(self._x + o.x(), self._y + o.y())

    def __sub__(self, o):
        return QPointF(self._x - o.x(), self._y - o.y())

    def __mul__(self, k):
        return QPointF(self._x * k, self._y * k)

    __rmul__ = __mul__

    def __truediv__(self, k):
        return QPointF(self._x / k, self._y / k)

    def __neg__(self):
        return QPointF(-self._x, -self._y)

    def __eq__(self, o):
        return isinstance(o, (QPointF, QPoint)) and self._x == o.x() and self._y == o.y()

    def __hash__(self):
        return hash((self._x, self._y))

    def __repr__(self):
        return "QPointF(%g, %g)" % (self._x, self._y)


class QPoint(QPointF):
    __slots__ = ()

    def __init__(self, *a):
        super().__init__(*a)
        self._x, self._y = int(round(self._x)), int(round(self._y))

    def __add__(self, o):
        return QPoint(self._x + o.x(), self._y + o.y()) if isinstance(o, QPoint) else QPointF(self._x + o.x(), self._y + o.y())

    def __sub__(self, o):
        return QPoint(self._x - o.x(), self._y - o.y()) if isinstance(o, QPoint) else QPointF(self._x - o.x(), self._y - o.y())

    def toPointF(self):
        return QPointF(self._x, self._y)

    def __repr__(self):
        return "QPoint(%d, %d)" % (self._x, self._y)


class QSizeF:
    def __init__(self, *a):
        if len(a) == 1:
            a = (a[0].width(), a[0].height())
        self._w, self._h = (float(a[0]), float(a[1])) if a else (0.0, 0.0)

    def width(self):
        return self._w

    def height(self):
        return self._h

    def isEmpty(self):
        return self._w <= 0 or self._h <= 0

    def toSize(self):
        return QSize(round(self._w), round(self._h))

    def __repr__(self):
        return "QSizeF(%g, %g)" % (self._w, self._h)


class QSize(QSizeF):
    def __init__(self, *a):
        super().__init__(*a)
        self._w, self._h = int(round(self._w)), int(round(self._h))


class QRectF:
    __slots__ = ("_x", "_y", "_w", "_h")

    def __init__(self, *a):
        if len(a) == 4:
            self._x, self._y, self._w, self._h = a
        elif not a:
            self._x = self._y = self._w = self._h = 0.0
        elif len(a) == 1:
            r = a[0]
            self._x, self._y, self._w, self._h = float(r.x()), float(r.y()), float(r.width()), float(r.height())
        elif len(a) == 2:
            p, q = a
            self._x, self._y = float(p.x()), float(p.y())
            if isinstance(q, QSizeF):
                self._w, self._h = float(q.width()), float(q.height())
            else:
                self._w, self._h = float(q.x()) - self._x, float(q.y()) - self._y

    # accessors
    def x(self):
        return self._x

    def y(self):
        return self._y

    def width(self):
        return self._w

    def height(self):
        return self._h

    def left(self):
        return self._x

    def top(self):
        return self._y

    def right(self):
        return self._x + self._w

    def bottom(self):
        return self._y + self._h

    def center(self):
        return QPointF(self._x + self._w / 2, self._y + self._h / 2)

    def topLeft(self):
        return QPointF(self._x, self._y)

    def topRight(self):
        return QPointF(self._x + self._w, self._y)

    def bottomLeft(self):
        return QPointF(self._x, self._y + self._h)

    def bottomRight(self):
        return QPointF(self._x + self._w, self._y + self._h)

    def size(self):
        return QSizeF(self._w, self._h)

    def isEmpty(self):
        return self._w <= 0 or self._h <= 0

    def isNull(self):
        return self._w == 0 and self._h == 0

    def isValid(self):
        return self._w > 0 and self._h > 0

    # setters
    def setLeft(self, v):
        r = self.right()
        self._x = float(v)
        self._w = r - self._x

    def setTop(self, v):
        b = self.bottom()
        self._y = float(v)
        self._h = b - self._y

    def setRight(self, v):
        self._w = float(v) - self._x

    def setBottom(self, v):
        self._h = float(v) - self._y

    def setX(self, v):
        self.setLeft(v)

    def setY(self, v):
        self.setTop(v)

    def setWidth(self, v):
        self._w = float(v)

    def setHeight(self, v):
        self._h = float(v)

    def setRect(self, x, y, w, h):
        self._x, self._y, self._w, self._h = float(x), float(y), float(w), float(h)

    def moveTo(self, *a):
        p = a[0] if len(a) == 1 else QPointF(*a)
        self._x, self._y = float(p.x()), float(p.y())

    def moveTopLeft(self, p):
        self.moveTo(p)

    def moveLeft(self, v):
        self._x = float(v)

    def moveTop(self, v):
        self._y = float(v)

    def moveRight(self, v):
        self._x = float(v) - self._w

    def moveBottom(self, v):
        self._y = float(v) - self._h

    def moveCenter(self, p):
        self._x, self._y = p.x() - self._w / 2, p.y() - self._h / 2

    def translate(self, *a):
        dx, dy = (a[0].x(), a[0].y()) if len(a) == 1 else a
        self._x += dx
        self._y += dy

    def adjust(self, a, b, c, d):
        self._x += a
        self._y += b
        self._w += c - a
        self._h += d - b

    # copies
    def _new(self, x, y, w, h):
        r = QRectF.__new__(type(self))
        r._x, r._y, r._w, r._h = x, y, w, h
        return r

    def adjusted(self, a, b, c, d):
        return self._new(self._x + a, self._y + b, self._w + c - a, self._h + d - b)

    def translated(self, *a):
        dx, dy = (a[0].x(), a[0].y()) if len(a) == 1 else a
        return self._new(self._x + dx, self._y + dy, self._w, self._h)

    def normalized(self):
        x, y, w, h = self._x, self._y, self._w, self._h
        if w < 0:
            x, w = x + w, -w
        if h < 0:
            y, h = y + h, -h
        return self._new(x, y, w, h)

    def marginsAdded(self, m):
        return self.adjusted(-m.left(), -m.top(), m.right(), m.bottom())

    def contains(self, *a):
        if len(a) == 2:
            a = (QPointF(*a),)
        o = a[0]
        if isinstance(o, QRectF):
            return (self._x <= o._x and self._y <= o._y and o._x + o._w <= self._x + self._w
                    and o._y + o._h <= self._y + self._h)
        x, y = o.x(), o.y()
        return self._x <= x <= self._x + self._w and self._y <= y <= self._y + self._h

    def intersects(self, o):
        return (self._x < o.x() + o.width() and o.x() < self._x + self._w and
                self._y < o.y() + o.height() and o.y() < self._y + self._h and
                self._w > 0 and self._h > 0 and o.width() > 0 and o.height() > 0)

    def intersected(self, o):
        x0, y0 = max(self._x, o.x()), max(self._y, o.y())
        x1, y1 = min(self.right(), o.x() + o.width()), min(self.bottom(), o.y() + o.height())
        if x1 <= x0 or y1 <= y0:
            return self._new(0.0, 0.0, 0.0, 0.0)
        return self._new(x0, y0, x1 - x0, y1 - y0)

    def united(self, o):
        if o.width() <= 0 and o.height() <= 0:
            return self._new(self._x, self._y, self._w, self._h)
        if self._w <= 0 and self._h <= 0:
            return self._new(float(o.x()), float(o.y()), float(o.width()), float(o.height()))
        x0, y0 = min(self._x, o.x()), min(self._y, o.y())
        x1, y1 = max(self.right(), o.x() + o.width()), max(self.bottom(), o.y() + o.height())
        return self._new(x0, y0, x1 - x0, y1 - y0)

    __and__ = intersected
    __or__ = united

    def toRect(self):
        return QRect(round(self._x), round(self._y), round(self._w), round(self._h))

    def toAlignedRect(self):
        x0, y0 = math.floor(self._x), math.floor(self._y)
        x1, y1 = math.ceil(self._x + self._w), math.ceil(self._y + self._h)
        return QRect(x0, y0, x1 - x0, y1 - y0)

    def getRect(self):
        return self._x, self._y, self._w, self._h

    def getCoords(self):
        return self._x, self._y, self.right(), self.bottom()

    def __eq__(self, o):
        return isinstance(o, QRectF) and (self._x, self._y, self._w, self._h) == (o._x, o._y, o._w, o._h)

    def __hash__(self):
        return hash((self._x, self._y, self._w, self._h))

    def __repr__(self):
        return "%s(%g, %g, %g, %g)" % (type(self).__name__, self._x, self._y, self._w, self._h)


class QRect(QRectF):
    """Integer rectangle: right() / bottom() are the last pixel (x + w - 1), like Qt."""
    __slots__ = ()

    def __init__(self, *a):
        super().__init__(*a)
        self._x, self._y, self._w, self._h = int(round(self._x)), int(round(self._y)), int(round(self._w)), int(round(self._h))

    def right(self):
        return self._x + self._w - 1

    def bottom(self):
        return self._y + self._h - 1

    def setRight(self, v):
        self._w = int(v) - self._x + 1

    def setBottom(self, v):
        self._h = int(v) - self._y + 1

    def center(self):
        return QPoint((self._x + self._x + self._w - 1) // 2, (self._y + self._y + self._h - 1) // 2)

    def topLeft(self):
        return QPoint(self._x, self._y)

    def bottomRight(self):
        return QPoint(self._x + self._w - 1, self._y + self._h - 1)

    def size(self):
        return QSize(self._w, self._h)

    def toRectF(self):
        return QRectF(self._x, self._y, self._w, self._h)

    def intersects(self, o):
        return QRectF.intersects(QRectF(self._x, self._y, self._w, self._h), QRectF(o.x(), o.y(), o.width(), o.height()))

    def intersected(self, o):
        r = QRectF.intersected(QRectF(self._x, self._y, self._w, self._h), QRectF(o.x(), o.y(), o.width(), o.height()))
        return QRect(r)

    def united(self, o):
        r = QRectF.united(QRectF(self._x, self._y, self._w, self._h), QRectF(o.x(), o.y(), o.width(), o.height()))
        return QRect(r)

    def contains(self, *a):
        if len(a) == 2:
            a = (QPointF(*a),)
        o = a[0]
        if isinstance(o, QRectF):
            return QRectF(self._x, self._y, self._w, self._h).contains(QRectF(o.x(), o.y(), o.width(), o.height()))
        return self._x <= o.x() < self._x + self._w and self._y <= o.y() < self._y + self._h


class QMarginsF:
    def __init__(self, l=0, t=0, r=0, b=0):
        self._m = (l, t, r, b)

    def left(self):
        return self._m[0]

    def top(self):
        return self._m[1]

    def right(self):
        return self._m[2]

    def bottom(self):
        return self._m[3]


QMargins = QMarginsF


class QLineF:
    def __init__(self, *a):
        if len(a) == 2:
            a = (a[0].x(), a[0].y(), a[1].x(), a[1].y())
        self._c = tuple(float(v) for v in a) if a else (0.0, 0.0, 0.0, 0.0)

    def p1(self):
        return QPointF(self._c[0], self._c[1])

    def p2(self):
        return QPointF(self._c[2], self._c[3])

    def length(self):
        return math.hypot(self._c[2] - self._c[0], self._c[3] - self._c[1])


# ---------------------------------------------------------------------------------------------- signals / timers
class Signal:
    """Class attribute -> per-instance bound signal."""

    def __init__(self, *types, **kw):
        self._name = None

    def __set_name__(self, owner, name):
        self._name = "_sig_" + name

    def __get__(self, obj, owner=None):
        if obj is None:
            return self
        s = obj.__dict__.get(self._name)
        if s is None:
            s = obj.__dict__[self._name] = BoundSignal(obj)
        return s


_ARITY = {}


def _arity(fn):
    """How many positional arguments a slot takes (None = any)."""
    key = id(getattr(fn, "__func__", fn))
    n = _ARITY.get(key, -2)
    if n != -2:
        return n
    import inspect
    try:
        ps = inspect.signature(fn).parameters.values()
        if any(p.kind == p.VAR_POSITIONAL for p in ps):
            n = None
        else:
            n = sum(1 for p in ps if p.kind in (p.POSITIONAL_ONLY, p.POSITIONAL_OR_KEYWORD) and p.default is p.empty)
            n = (n, sum(1 for p in ps if p.kind in (p.POSITIONAL_ONLY, p.POSITIONAL_OR_KEYWORD)))
    except (TypeError, ValueError):
        n = None
    _ARITY[key] = n
    return n


class BoundSignal:
    def __init__(self, owner=None):
        self._slots = []
        self._owner = owner

    def connect(self, fn, *a):
        self._slots.append(fn)

    def disconnect(self, fn=None):
        if fn is None:
            self._slots = []
        elif fn in self._slots:
            self._slots.remove(fn)

    def emit(self, *a):
        if getattr(self._owner, "_blocked", False):
            return
        for fn in list(self._slots):
            n = _arity(fn)
            if n is None:
                fn(*a)
            else:
                need, most = n
                fn(*a[:max(need, min(most, len(a)))])


Slot = lambda *a, **k: (lambda f: f)


class QObject:
    def __init__(self, parent=None, *a, **k):
        self._parent = parent

    def parent(self):
        return self._parent

    def blockSignals(self, on):
        was = getattr(self, "_blocked", False)
        self._blocked = bool(on)
        return was

    def signalsBlocked(self):
        return getattr(self, "_blocked", False)

    def deleteLater(self):
        pass

    def installEventFilter(self, *a):
        pass

    def setObjectName(self, *a):
        pass


from . import _host                     # noqa: E402  (the page: timers, clock)


class QTimer(QObject):
    timeout = Signal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self._interval = 0
        self._id = None
        self._single = False

    def setInterval(self, ms):
        self._interval = int(ms)
        if self._id is not None:
            self.start()

    def interval(self):
        return self._interval

    def setSingleShot(self, on):
        self._single = bool(on)

    def isActive(self):
        return self._id is not None

    def setTimerType(self, *a):
        pass

    def start(self, ms=None):
        if ms is not None:
            self._interval = int(ms)
        self.stop()
        self._id = _host.set_timer(self._interval, self._fire, not self._single)

    def stop(self):
        if self._id is not None:
            _host.clear_timer(self._id)
            self._id = None

    def _fire(self):
        if self._single:
            self._id = None
        self.timeout.emit()

    @staticmethod
    def singleShot(ms, *a):
        fn = a[-1]
        _host.set_timer(int(ms), fn, False)


class QElapsedTimer:
    def start(self):
        import time
        self._t = time.monotonic()

    def elapsed(self):
        import time
        return int((time.monotonic() - self._t) * 1000)


class QUrl:
    def __init__(self, s=""):
        self._s = s

    def toString(self):
        return self._s

    @staticmethod
    def fromLocalFile(s):
        return QUrl(s)


class QLocale:
    def __init__(self, *a):
        pass

    @staticmethod
    def system():
        return QLocale()

    def name(self):
        return "zh_CN"


class QByteArray(bytes):
    pass


class QCoreApplication:
    @staticmethod
    def instance():
        return None

    @staticmethod
    def processEvents(*a):
        pass


class QEvent:
    def __init__(self, t=0):
        self._t = t
        self._acc = True

    def type(self):
        return self._t

    def accept(self):
        self._acc = True

    def ignore(self):
        self._acc = False


class QAbstractNativeEventFilter:
    pass


class QStandardPaths:
    pass
