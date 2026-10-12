"""QtWidgets stand-in: one top-level widget is the page's canvas; menus and simple dialogs become page UI."""
import json
import sys

from .QtCore import Qt, QObject, Signal, QPoint, QPointF, QRect, QRectF, QSize, QTimer
from .QtGui import (QAction, QColor, QFont, QFontMetricsF, QIcon, QPixmap, QPalette, QCursor, QGuiApplication,
                    QWindow, QPaintEvent)
from . import _host

_noted = set()
import weakref as _weakref
_WIDGETS = _weakref.WeakValueDictionary()
_wid_seq = [0]


def _noop(*a, **k):
    return None


class QWidget(QObject):
    """Anything not listed is a harmless no-op (dialog widgets we never show on the page)."""
    _canvas = None                     # the widget shown on the page's canvas

    def __init__(self, parent=None, *a, **k):
        super().__init__(parent if isinstance(parent, QObject) else None)
        self._w, self._h = 640, 480
        self._x, self._y = 0, 0
        self._visible = False
        self._dirty = True
        self._title = ""
        self._attrs = set()
        self._flags = 0
        self._handle = QWindow()
        self._layout = None
        self._enabled = True
        self._tooltip = ""
        _wid_seq[0] += 1
        self._wid = _wid_seq[0]
        _WIDGETS[self._wid] = self
        self._shown = True
        self._style = ""
        self._minw = 0
        self._minh = 0

    _NOOPS = frozenset(("setFocusPolicy", "setMouseTracking", "setMaximumSize", "setMaximumWidth", "setMaximumHeight", "setContentsMargins",
                        "setSizePolicy", "setObjectName", "setWindowIcon", "setWindowOpacity", "setAutoFillBackground",
                        "setAcceptDrops", "setPalette", "setFont", "setFixedWidth", "setFixedHeight", "setModal",
                        "setWordWrap", "setAlignment", "setOpenExternalLinks", "setTextFormat", "setFrameShape",
                        "setFrameShadow", "setGraphicsEffect", "setPlaceholderText", "setMaxLength", "setReadOnly",
                        "setDefault", "setAutoDefault", "setFlat", "setIcon", "setIconSize", "setCheckable",
                        "setRange", "setMinimum", "setMaximum", "setSingleStep", "setSuffix", "setPrefix",
                        "setTickPosition", "setOrientation", "setHtml", "setTextInteractionFlags", "setWidget",
                        "setWidgetResizable", "setHorizontalScrollBarPolicy", "setVerticalScrollBarPolicy",
                        "setSelectionMode", "setEditTriggers", "setCurrentWidget", "addWidget", "setSpacing",
                        "setMargin", "setScaledContents", "setPixmap", "setBuddy", "setShortcut", "selectAll",
                        "setValidator", "setEchoMode", "setInputMethodHints", "setClearButtonEnabled", "setCompleter",
                        "setFocusProxy", "setUpdatesEnabled", "setWindowState", "showNormal", "showMinimized",
                        "setWindowModality", "setParent", "installEventFilter", "removeEventFilter", "clearFocus",
                        "grabKeyboard", "releaseKeyboard", "grabMouse", "releaseMouse", "setInputMethodEnabled",
                        "setHidden", "lower", "stackUnder", "updateGeometry", "ensurePolished", "setDisabled",
                        "setLineWrapMode", "setOverwriteMode", "setTabStopDistance", "setDocumentMargin",
                        "setSearchPaths", "setSource", "setHorizontalSpacing", "setVerticalSpacing",
                        "setColumnStretch", "setRowStretch", "setStretch", "addStretch", "addLayout", "addSpacing",
                        "setCurrentRow", "addItem", "setTabOrder", "setStatusTip", "setWhatsThis"))

    def __getattr__(self, name):
        if name in QWidget._NOOPS:
            return _noop
        raise AttributeError("%s has no attribute %s" % (type(self).__name__, name))

    # ---- the page canvas
    def _canvas_id(self):
        return 0

    def _is_page(self):
        return QWidget._canvas is self

    # ---- geometry
    def width(self):
        return self._w

    def height(self):
        return self._h

    def size(self):
        return QSize(self._w, self._h)

    def rect(self):
        return QRect(0, 0, self._w, self._h)

    def x(self):
        return self._x

    def y(self):
        return self._y

    def pos(self):
        return QPoint(self._x, self._y)

    def geometry(self):
        return QRect(self._x, self._y, self._w, self._h)

    frameGeometry = geometry

    def resize(self, *a):
        w, h = (a[0].width(), a[0].height()) if len(a) == 1 else a
        ow, oh = self._w, self._h
        self._w, self._h = max(1, int(w)), max(1, int(h))
        self._dirty = True
        if self._is_page():
            _host.call("resize_canvas", self._w, self._h)
        if (ow, oh) != (self._w, self._h):
            try:
                from .QtGui import QResizeEvent
                self.resizeEvent(QResizeEvent(self._w, self._h, ow, oh))
            except Exception:
                pass

    def setFixedSize(self, *a):
        self.resize(*a)

    def setGeometry(self, *a):
        if len(a) == 1:
            r = a[0]
            a = (r.x(), r.y(), r.width(), r.height())
        self._x, self._y = int(a[0]), int(a[1])
        self.resize(a[2], a[3])

    def move(self, *a):
        if self._is_page():
            return                               # the page decides where its canvas sits
        x, y = (a[0].x(), a[0].y()) if len(a) == 1 else a
        self._x, self._y = int(x), int(y)

    def mapToGlobal(self, p):
        return type(p)(p.x() + self._x, p.y() + self._y)

    def mapFromGlobal(self, p):
        return type(p)(p.x() - self._x, p.y() - self._y)

    def devicePixelRatioF(self):
        return _host.dpr()

    def devicePixelRatio(self):
        return _host.dpr()

    def screen(self):
        return QGuiApplication.primaryScreen()

    def windowHandle(self):
        return self._handle

    # ---- visibility / painting
    def show(self):
        self._visible = True
        self._shown = True
        self._dirty = True

    def hide(self):
        self._visible = False
        self._shown = False

    def setVisible(self, on):
        self._visible = self._shown = bool(on)

    def setHidden(self, on):
        self.setVisible(not on)

    def setStyleSheet(self, s):
        self._style = str(s)

    def setMinimumWidth(self, w):
        self._minw = int(w)

    def setMinimumHeight(self, h):
        self._minh = int(h)

    def setMinimumSize(self, *a):
        w, h = (a[0].width(), a[0].height()) if len(a) == 1 else a
        self._minw, self._minh = int(w), int(h)

    def _spec(self):
        d = {"k": "box", "id": self._wid, "lay": self._layout._spec() if self._layout is not None else None}
        if getattr(self, "_frame", 0):
            d["frame"] = 1
        return d

    def isVisible(self):
        return self._visible

    def isHidden(self):
        return not self._visible

    def isMinimized(self):
        return False

    def isActiveWindow(self):
        return True

    def close(self):
        self._visible = False
        return True

    def update(self, *a):
        self._dirty = True

    def repaint(self, *a):
        self._dirty = True

    def raise_(self):
        pass

    def activateWindow(self):
        pass

    def setFocus(self, *a):
        pass

    def hasFocus(self):
        return True

    def setWindowTitle(self, t):
        self._title = t
        if self._is_page():
            _host.call("set_title", t)

    def windowTitle(self):
        return self._title

    def setAttribute(self, a, on=True):
        (self._attrs.add if on else self._attrs.discard)(a)

    def testAttribute(self, a):
        return a in self._attrs

    def setWindowFlag(self, f, on=True):
        self._flags = (self._flags | f) if on else (self._flags & ~f)

    def setWindowFlags(self, f):
        self._flags = f

    def windowFlags(self):
        return self._flags

    def setCursor(self, c):
        if self._is_page():
            shape = c.shape() if isinstance(c, QCursor) else c
            _host.call("set_cursor", shape if isinstance(shape, str) else "default")

    def unsetCursor(self):
        if self._is_page():
            _host.call("set_cursor", "default")

    def grab(self, *a):
        return QPixmap(1, 1)

    def font(self):
        return QFont()

    def palette(self):
        return QPalette()

    def underMouse(self):
        return True

    def isEnabled(self):
        return self._enabled

    def setEnabled(self, on):
        self._enabled = bool(on)

    def setLayout(self, l):
        self._layout = l

    def layout(self):
        return self._layout

    def setToolTip(self, t):
        self._tooltip = t

    def toolTip(self):
        return self._tooltip

    def window(self):
        return self

    def sizeHint(self):
        return QSize(self._w, self._h)

    def adjustSize(self):
        pass

    # ---- default event handlers (overridden by subclasses)
    def paintEvent(self, e):
        pass

    def resizeEvent(self, e):
        pass

    def closeEvent(self, e):
        pass

    def mousePressEvent(self, e):
        pass

    def mouseReleaseEvent(self, e):
        pass

    def mouseMoveEvent(self, e):
        pass

    def mouseDoubleClickEvent(self, e):
        pass

    def wheelEvent(self, e):
        pass

    def keyPressEvent(self, e):
        pass

    def keyReleaseEvent(self, e):
        pass

    def contextMenuEvent(self, e):
        pass

    def enterEvent(self, e):
        pass

    def leaveEvent(self, e):
        pass

    def focusOutEvent(self, e):
        pass

    def focusInEvent(self, e):
        pass

    def showEvent(self, e):
        pass

    def hideEvent(self, e):
        pass

    def changeEvent(self, e):
        pass

    def event(self, e):
        return False


# ---------------------------------------------------------------------------------------------- dialog widgets
# Dialogs are shown as page modals: the widget tree is sent as JSON, the page sends changes back (dlg_event).
_DIALOGS = {}
_dlg_seq = [0]


def _spec_of(w):
    if w is None:
        return None
    try:
        return w._spec()
    except Exception as ex:
        return {"k": "label", "html": "（%s）" % type(w).__name__}


class QFrame(QWidget):
    NoFrame, StyledPanel, HLine, VLine, Box, Panel = 0, 6, 4, 5, 1, 2

    def setFrameShape(self, s):
        self._frame = s


class QLabel(QWidget):
    def __init__(self, text="", parent=None, *a):
        super().__init__(parent if isinstance(parent, QObject) else None)
        self._text = text if isinstance(text, str) else ""
        self._pix = None
        self._align = 0

    def setText(self, t):
        self._text = str(t)

    def text(self):
        return self._text

    def setPixmap(self, pm):
        self._pix = pm

    def pixmap(self):
        return self._pix

    def setAlignment(self, a):
        self._align = a

    def clear(self):
        self._text = ""
        self._pix = None

    def _spec(self):
        d = {"k": "label", "id": self._wid, "html": self._text, "st": self._style}
        if self._pix is not None and self._pix._id:
            d["pix"] = [self._pix._id, self._pix._w / self._pix._dpr, self._pix._h / self._pix._dpr]
        if self._align & Qt.AlignHCenter:
            d["c"] = 1
        return d


class QAbstractButton(QWidget):
    clicked = Signal()
    toggled = Signal()
    pressed = Signal()
    released = Signal()

    def __init__(self, text="", parent=None, *a):
        super().__init__(parent if isinstance(parent, QObject) else None)
        self._text = text if isinstance(text, str) else ""
        self._checked = False
        self._checkable = False

    def setText(self, t):
        self._text = str(t)

    def text(self):
        return self._text

    def setCheckable(self, on):
        self._checkable = bool(on)

    def setChecked(self, on):
        on = bool(on)
        if on != self._checked:
            self._checked = on
            self.toggled.emit(on)

    def isChecked(self):
        return self._checked

    def click(self):
        if self._checkable:
            self.setChecked(not self._checked)
        self.clicked.emit()

    def _spec(self):
        return {"k": "button", "id": self._wid, "t": self._text, "e": 1 if self._enabled else 0}


class QPushButton(QAbstractButton):
    pass


class QToolButton(QAbstractButton):
    pass


class QCheckBox(QAbstractButton):
    stateChanged = Signal()

    def __init__(self, *a):
        super().__init__(*a)
        self._checkable = True

    def setChecked(self, on):
        on = bool(on)
        if on != self._checked:
            self._checked = on
            self.toggled.emit(on)
            self.stateChanged.emit(2 if on else 0)

    def checkState(self):
        return Qt.Checked if self._checked else Qt.Unchecked

    def _spec(self):
        return {"k": "check", "id": self._wid, "t": self._text, "v": 1 if self._checked else 0, "e": 1 if self._enabled else 0}


class QRadioButton(QCheckBox):
    def _spec(self):
        d = super()._spec()
        d["k"] = "radio"
        return d


class QLineEdit(QWidget):
    textChanged = Signal()
    textEdited = Signal()
    returnPressed = Signal()
    editingFinished = Signal()
    Normal, Password = 0, 2

    def __init__(self, text="", parent=None):
        super().__init__(parent if isinstance(parent, QObject) else None)
        self._text = text if isinstance(text, str) else ""
        self._ph = ""
        self._maxlen = 0

    def setText(self, t):
        t = str(t)
        if t != self._text:
            self._text = t
            self.textChanged.emit(t)

    def text(self):
        return self._text

    def setPlaceholderText(self, t):
        self._ph = t

    def setMaxLength(self, n):
        self._maxlen = int(n)

    def clear(self):
        self.setText("")

    def _spec(self):
        return {"k": "edit", "id": self._wid, "v": self._text, "ph": self._ph, "max": self._maxlen,
                "e": 1 if self._enabled else 0}


class QTextEdit(QLineEdit):
    def toPlainText(self):
        return self._text

    def setPlainText(self, t):
        self._text = t
        self._html = None

    def setHtml(self, h):
        self._html = h

    def toHtml(self):
        return getattr(self, "_html", None) or self._text

    def _spec(self):
        h = getattr(self, "_html", None)
        if h is not None:
            return {"k": "html", "id": self._wid, "html": h}
        return {"k": "text", "id": self._wid, "v": self._text}


QPlainTextEdit = QTextEdit


class QTextBrowser(QTextEdit):
    anchorClicked = Signal()


class QComboBox(QWidget):
    currentIndexChanged = Signal()
    activated = Signal()
    currentTextChanged = Signal()

    def __init__(self, parent=None):
        super().__init__(parent if isinstance(parent, QObject) else None)
        self._items = []
        self._i = -1

    def addItem(self, *a):
        text = next((v for v in a if isinstance(v, str)), "")
        data = a[-1] if len(a) >= 2 and not (len(a) == 2 and isinstance(a[0], QIcon) and isinstance(a[1], str)) else None
        if len(a) >= 2 and isinstance(a[0], str):
            data = a[1]
        self._items.append([text, data])
        if self._i < 0:
            self._i = 0
            self.currentIndexChanged.emit(0)

    def addItems(self, ts):
        for t in ts:
            self.addItem(t)

    def insertItem(self, i, text, data=None):
        self._items.insert(i, [text, data])
        if self._i < 0:
            self._i = 0

    def removeItem(self, i):
        if 0 <= i < len(self._items):
            del self._items[i]
            if self._i >= len(self._items):
                self._i = len(self._items) - 1

    def clear(self):
        self._items = []
        self._i = -1

    def setCurrentIndex(self, i):
        i = int(i)
        if i != self._i and -1 <= i < len(self._items):
            self._i = i
            self.currentIndexChanged.emit(i)
            self.currentTextChanged.emit(self.currentText())

    def setCurrentText(self, t):
        i = self.findText(t)
        if i >= 0:
            self.setCurrentIndex(i)

    def currentIndex(self):
        return self._i

    def currentData(self, *a):
        return self._items[self._i][1] if 0 <= self._i < len(self._items) else None

    def currentText(self):
        return self._items[self._i][0] if 0 <= self._i < len(self._items) else ""

    def findData(self, d, *a):
        for i, (_, dd) in enumerate(self._items):
            if dd == d:
                return i
        return -1

    def findText(self, t, *a):
        for i, (tt, _) in enumerate(self._items):
            if tt == t:
                return i
        return -1

    def count(self):
        return len(self._items)

    def itemData(self, i, *a):
        return self._items[i][1] if 0 <= i < len(self._items) else None

    def itemText(self, i):
        return self._items[i][0] if 0 <= i < len(self._items) else ""

    def setItemText(self, i, t):
        if 0 <= i < len(self._items):
            self._items[i][0] = t

    def setItemData(self, i, d, *a):
        if 0 <= i < len(self._items):
            self._items[i][1] = d

    def _spec(self):
        return {"k": "combo", "id": self._wid, "items": [t for t, _ in self._items], "i": self._i,
                "e": 1 if self._enabled else 0, "tip": self._tooltip}


class QAbstractSlider(QWidget):
    valueChanged = Signal()

    def __init__(self, *a):
        super().__init__(a[0] if a and isinstance(a[0], QObject) else None)
        self._v = 0
        self._min, self._max = 0, 99
        self._suffix = ""

    def setValue(self, v):
        v = max(self._min, min(self._max, v))
        if v != self._v:
            self._v = v
            self.valueChanged.emit(v)

    def value(self):
        return self._v

    def setRange(self, lo, hi):
        self._min, self._max = lo, hi

    def setMinimum(self, v):
        self._min = v

    def setMaximum(self, v):
        self._max = v

    def minimum(self):
        return self._min

    def maximum(self):
        return self._max

    def setSuffix(self, s):
        self._suffix = s

    def _spec(self):
        return {"k": "spin", "id": self._wid, "v": self._v, "min": self._min, "max": self._max, "suf": self._suffix,
                "e": 1 if self._enabled else 0}


class QSlider(QAbstractSlider):
    def _spec(self):
        d = super()._spec()
        d["k"] = "slider"
        return d


class QSpinBox(QAbstractSlider):
    pass


QDoubleSpinBox = QSpinBox


class QListWidget(QWidget):
    itemClicked = Signal()
    currentRowChanged = Signal()

    def __init__(self, *a):
        super().__init__()
        self._items = []

    def addItem(self, t):
        self._items.append(t if isinstance(t, str) else getattr(t, "_t", ""))

    def clear(self):
        self._items = []

    def count(self):
        return len(self._items)

    def _spec(self):
        return {"k": "label", "id": self._wid, "html": "<br>".join(self._items)}


class QListWidgetItem:
    def __init__(self, *a):
        self._t = next((v for v in a if isinstance(v, str)), "")


class QScrollArea(QWidget):
    def __init__(self, *a):
        super().__init__()
        self._child = None

    def setWidget(self, w):
        self._child = w

    def widget(self):
        return self._child

    def _spec(self):
        return {"k": "scroll", "id": self._wid, "child": _spec_of(self._child), "minh": self._minh}


class QStackedWidget(QWidget):
    pass


class QTabWidget(QWidget):
    pass


class QGroupBox(QWidget):
    def __init__(self, title="", parent=None):
        super().__init__(parent if isinstance(parent, QObject) else None)
        self._gtitle = title if isinstance(title, str) else ""

    def _spec(self):
        d = super()._spec()
        d["title"] = self._gtitle
        d["frame"] = 1
        return d


class QSizeGrip(QWidget):
    pass


class QAbstractItemView:
    NoSelection, SingleSelection = 0, 1
    NoEditTriggers = 0


class QSizePolicy:
    Fixed, Minimum, Maximum, Preferred, Expanding, MinimumExpanding, Ignored = 0, 1, 4, 5, 7, 3, 13

    def __init__(self, *a):
        pass


class QLayout(QObject):
    _KIND = "v"

    def __init__(self, parent=None, *a):
        super().__init__()
        self._items = []
        if isinstance(parent, QWidget):
            parent.setLayout(self)

    def addWidget(self, w, *a, **k):
        r = c = None
        rs = cs = 1
        nums = [v for v in a if isinstance(v, int) and not isinstance(v, bool)]
        if self._KIND == "grid" and len(nums) >= 2:
            r, c = nums[0], nums[1]
            if len(nums) >= 4:
                rs, cs = nums[2], nums[3]
        self._items.append({"w": w, "r": r, "c": c, "rs": rs, "cs": cs})

    def addLayout(self, l, *a, **k):
        r = c = None
        nums = [v for v in a if isinstance(v, int) and not isinstance(v, bool)]
        if self._KIND == "grid" and len(nums) >= 2:
            r, c = nums[0], nums[1]
        self._items.append({"l": l, "r": r, "c": c, "rs": 1, "cs": 1})

    def addStretch(self, *a):
        self._items.append({"stretch": 1})

    def addSpacing(self, n=0):
        self._items.append({"space": n})

    def addItem(self, *a):
        pass

    def insertWidget(self, i, w, *a):
        self._items.insert(i, {"w": w, "r": None, "c": None, "rs": 1, "cs": 1})

    def addRow(self, a, b=None):
        if b is None:
            (self.addLayout if isinstance(a, QLayout) else self.addWidget)(a)
            return
        row = QHBoxLayout()
        row.addWidget(QLabel(a) if isinstance(a, str) else a)
        (row.addLayout if isinstance(b, QLayout) else row.addWidget)(b)
        self.addLayout(row)

    def count(self):
        return len(self._items)

    def __getattr__(self, name):
        if name.startswith("__"):
            raise AttributeError(name)
        return _noop

    def _spec(self):
        items = []
        for it in self._items:
            if "w" in it:
                w = it["w"]
                if not getattr(w, "_shown", True):
                    continue
                items.append({"w": _spec_of(w), "r": it["r"], "c": it["c"], "rs": it["rs"], "cs": it["cs"]})
            elif "l" in it:
                items.append({"l": it["l"]._spec(), "r": it["r"], "c": it["c"], "rs": it["rs"], "cs": it["cs"]})
            else:
                items.append(it)
        return {"k": self._KIND, "items": items}


class QHBoxLayout(QLayout):
    _KIND = "h"


class QVBoxLayout(QLayout):
    _KIND = "v"


class QGridLayout(QLayout):
    _KIND = "grid"


class QFormLayout(QLayout):
    _KIND = "v"


class QBoxLayout(QLayout):
    _KIND = "v"


class QSpacerItem:
    def __init__(self, *a):
        pass


class QDialogButtonBox(QWidget):
    Ok, Cancel, Yes, No, Close, Save, Apply, Reset = 0x400, 0x400000, 0x4000, 0x10000, 0x200000, 0x800, 0x2000000, 0x4000000
    AcceptRole, RejectRole, DestructiveRole, ActionRole, HelpRole, YesRole, NoRole, ApplyRole = 0, 1, 2, 3, 4, 5, 6, 8
    accepted = Signal()
    rejected = Signal()
    clicked = Signal()
    _NAMES = {0x400: "确定", 0x400000: "取消", 0x4000: "是", 0x10000: "否", 0x200000: "关闭", 0x800: "保存",
              0x2000000: "应用", 0x4000000: "重置"}

    def __init__(self, *a):
        super().__init__(next((v for v in a if isinstance(v, QObject)), None))
        self._btns = []                     # (button, role, std)
        std = next((v for v in a if isinstance(v, int) and not isinstance(v, bool)), 0)
        for flag, name in QDialogButtonBox._NAMES.items():
            if std & flag:
                self.addButton(flag)

    def addButton(self, b, role=None):
        std = None
        if isinstance(b, int) and not isinstance(b, bool):
            std = b
            btn = QPushButton(QDialogButtonBox._NAMES.get(b, "OK"))
            role = 0 if b in (0x400, 0x4000, 0x800) else 1 if b in (0x400000, 0x10000, 0x200000) else 3
        elif isinstance(b, str):
            btn = QPushButton(b)
        else:
            btn = b
        role = 3 if role is None else role
        self._btns.append((btn, role, std))

        def fire(btn=btn, role=role):
            self.clicked.emit(btn)
            if role in (0, 5):
                self.accepted.emit()
            elif role in (1, 6):
                self.rejected.emit()
        btn.clicked.connect(fire)
        return btn

    def button(self, std):
        for b, role, s in self._btns:
            if s == std:
                return b
        return None

    def buttons(self):
        return [b for b, _, _ in self._btns]

    def setStandardButtons(self, std):
        self._btns = []
        for flag in QDialogButtonBox._NAMES:
            if std & flag:
                self.addButton(flag)

    def _spec(self):
        return {"k": "buttons", "id": self._wid,
                "btns": [dict(b._spec(), main=1 if role in (0, 5) else 0) for b, role, _ in self._btns if b._shown]}


class QDialog(QWidget):
    Accepted, Rejected = 1, 0
    accepted = Signal()
    rejected = Signal()
    finished = Signal()

    def exec(self):
        """Show as a page modal (it does not wait: what follows exec() on the desktop goes in _web_then)."""
        _dlg_seq[0] += 1
        tok = _dlg_seq[0]
        self._tok = tok
        self._result = 0
        _DIALOGS[tok] = self
        try:
            _host.flush_to_page()                       # pictures in the dialog must be painted first
        except Exception:
            pass
        _host.call("show_dialog", tok, json.dumps(self._dialog_spec(), ensure_ascii=False))
        return 0

    exec_ = exec

    def show(self):
        self.exec()

    def open(self):
        self.exec()

    def _dialog_spec(self):
        return {"title": self._title, "w": max(self._minw, 300), "root": self._layout._spec() if self._layout else None}

    def _close(self, result):
        self._result = result
        tok = getattr(self, "_tok", None)
        if tok is not None and tok in _DIALOGS:
            del _DIALOGS[tok]
            _host.call("close_dialog", tok)
        self.finished.emit(result)
        then = getattr(self, "_web_then", None) if result else getattr(self, "_web_else", None)
        if then is not None:
            then()

    def accept(self):
        self.accepted.emit()
        self._close(1)

    def reject(self):
        self.rejected.emit()
        self._close(0)

    def done(self, r):
        (self.accept if r else self.reject)()

    def close(self):
        if getattr(self, "_tok", None) in _DIALOGS:
            self.reject()
        return True

    def result(self):
        return getattr(self, "_result", 0)


def dlg_event(tok, wid, kind, value):
    """The page: something changed in dialog tok. Returns the dialog again (JSON) or "" when it closed."""
    d = _DIALOGS.get(int(tok))
    if d is None:
        return ""
    w = _WIDGETS.get(int(wid))
    try:
        if kind == "close":
            d.reject()
        elif w is not None:
            if kind == "click":
                w.click()
            elif kind == "combo":
                w.setCurrentIndex(int(value))
                w.activated.emit(int(value))
            elif kind == "check":
                w.setChecked(bool(value))
                w.clicked.emit()
            elif kind == "spin":
                w.setValue(int(float(value)))
            elif kind == "edit":
                w.setText(str(value))
                w.textEdited.emit(str(value))
            elif kind == "enter":
                w.setText(str(value))
                w.returnPressed.emit()
    except Exception:
        import traceback
        traceback.print_exc()
    if int(tok) not in _DIALOGS:
        return ""
    try:
        _host.flush_to_page()
    except Exception:
        pass
    return json.dumps(d._dialog_spec(), ensure_ascii=False)


class QMessageBox(QDialog):
    Ok, Cancel, Yes, No, Close, Discard, Save = 0x400, 0x400000, 0x4000, 0x10000, 0x200000, 0x800000, 0x800
    AcceptRole, RejectRole, DestructiveRole, ActionRole, YesRole, NoRole = 0, 1, 2, 3, 5, 6
    Information, Warning, Critical, Question = 1, 2, 3, 4

    def __init__(self, *a, **k):
        super().__init__(a[0] if a and isinstance(a[0], QWidget) else None)
        self._text = ""
        self._buttons = []
        self._clicked = None
        self._check = None

    def setText(self, t):
        self._text = t

    def setInformativeText(self, t):
        self._text += "\n" + t

    def setIcon(self, *a):
        pass

    def addButton(self, b, role=0):
        btn = QPushButton(b if isinstance(b, str) else "OK")
        btn._role = role
        self._buttons.append(btn)
        return btn

    def setStandardButtons(self, *a):
        pass

    def setDefaultButton(self, *a):
        pass

    def setCheckBox(self, c):
        self._check = c

    def clickedButton(self):
        return self._clicked

    def exec(self):
        if not self._buttons:
            _host.call("alert", self._text)
            return QMessageBox.Ok
        labels = [b.text() for b in self._buttons]
        i = _host.call("choose", self._text, json.dumps(labels, ensure_ascii=False))
        i = -1 if i is None else int(i)
        self._clicked = self._buttons[i] if 0 <= i < len(self._buttons) else None
        return i

    @staticmethod
    def information(parent, title, text, *a):
        _host.call("info", str(title), str(text))
        return QMessageBox.Ok

    warning = critical = about = information

    @staticmethod
    def question(parent, title, text, *a):
        ok = _host.call("confirm", str(text))
        return QMessageBox.Yes if ok else QMessageBox.No


class QInputDialog(QDialog):
    @staticmethod
    def getText(parent, title, label, *a, **k):
        text = ""
        for v in a:
            if isinstance(v, str):
                text = v
        r = _host.call("prompt", str(label), text)
        if r is None:
            return "", False
        return str(r), True

    @staticmethod
    def getInt(parent, title, label, value=0, lo=-2 ** 31, hi=2 ** 31 - 1, *a):
        r = _host.call("prompt", str(label), str(value))
        try:
            return max(lo, min(hi, int(r))), True
        except (TypeError, ValueError):
            return value, False

    @staticmethod
    def getItem(parent, title, label, items, cur=0, *a):
        i = _host.call("choose", str(label), json.dumps(list(items), ensure_ascii=False))
        if i is None or int(i) < 0:
            return "", False
        return items[int(i)], True


class QColorDialog(QDialog):
    @staticmethod
    def getColor(initial=None, *a):
        return QColor()


class QFileDialog(QDialog):
    @staticmethod
    def getOpenFileName(*a, **k):
        return "", ""

    @staticmethod
    def getSaveFileName(*a, **k):
        return "", ""

    @staticmethod
    def getExistingDirectory(*a, **k):
        return ""


# ---------------------------------------------------------------------------------------------- menus
_MENUS = {}
_menu_seq = [0]


class QMenu(QWidget):
    aboutToShow = Signal()
    aboutToHide = Signal()
    triggered = Signal()

    def __init__(self, *a):
        title = ""
        parent = None
        for v in a:
            if isinstance(v, str):
                title = v
            elif isinstance(v, QObject):
                parent = v
        super().__init__(parent)
        self._title = title
        self._actions = []
        self._action = QAction(title)
        self._action._menu = self

    def title(self):
        return self._title

    def setTitle(self, t):
        self._title = t
        self._action._text = t

    def menuAction(self):
        return self._action

    def addAction(self, *a):
        if a and isinstance(a[0], QAction):
            act = a[0]
        else:
            text = next((v for v in a if isinstance(v, str)), "")
            act = QAction(text)
            fn = next((v for v in a if callable(v) and not isinstance(v, (str, QIcon))), None)
            if fn is not None:
                act.triggered.connect(fn)
        self._actions.append(act)
        return act

    def addActions(self, acts):
        for a in acts:
            self.addAction(a)

    def addMenu(self, m, *a):
        if isinstance(m, str):
            m = QMenu(m, self)
        self._actions.append(m._action)
        return m

    def addSeparator(self):
        act = QAction("")
        act._sep = True
        self._actions.append(act)
        return act

    def addSection(self, t):
        return self.addSeparator()

    def insertAction(self, before, act):
        i = self._actions.index(before) if before in self._actions else len(self._actions)
        self._actions.insert(i, act)

    def removeAction(self, act):
        if act in self._actions:
            self._actions.remove(act)

    def actions(self):
        return list(self._actions)

    def clear(self):
        self._actions = []

    def isEmpty(self):
        return not self._actions

    def setStyleSheet(self, *a):
        pass

    def setFont(self, *a):
        pass

    def _spec(self, path=()):
        self.aboutToShow.emit()
        out = []
        for i, act in enumerate(self._actions):
            if getattr(act, "_visible", True) is False:
                continue
            if act._sep:
                out.append({"sep": 1})
                continue
            item = {"t": act._text, "e": 1 if act._enabled else 0, "p": list(path) + [i]}
            if act._checkable:
                item["c"] = 1 if act._checked else 0
            if act._menu is not None:
                item["sub"] = act._menu._spec(tuple(path) + (i,))
            out.append(item)
        return out

    def _act_at(self, path):
        m = self
        act = None
        for i in path:
            act = m._actions[i]
            m = act._menu
        return act

    def exec(self, pos=None, *a):
        _menu_seq[0] += 1
        tok = _menu_seq[0]
        _MENUS.clear()
        _MENUS[tok] = self
        x, y = (pos.x(), pos.y()) if pos is not None else _host.mouse_pos()
        _host.call("show_menu", tok, json.dumps(self._spec(), ensure_ascii=False), float(x), float(y))
        return None

    popup = exec
    exec_ = exec


def menu_pick(tok, path_json):
    """The page: an item of menu tok was chosen."""
    m = _MENUS.pop(int(tok), None)
    if m is None:
        return
    try:
        act = m._act_at(json.loads(path_json))
    except Exception:
        return
    if act is not None and act._enabled and act._menu is None:
        act.trigger()


class QWidgetAction(QAction):
    def __init__(self, *a):
        super().__init__("")
        self._sep = True

    def setDefaultWidget(self, w):
        pass


class QSystemTrayIcon(QObject):
    activated = Signal()
    messageClicked = Signal()
    DoubleClick, Trigger = 2, 3

    @staticmethod
    def isSystemTrayAvailable():
        return False

    def __getattr__(self, name):
        return _noop


class QApplication(QObject):
    _inst = None

    def __init__(self, *a):
        super().__init__()
        QApplication._inst = self

    @staticmethod
    def instance():
        return QApplication._inst

    def __getattr__(self, name):
        return _noop

    @staticmethod
    def primaryScreen():
        return QGuiApplication.primaryScreen()

    @staticmethod
    def screens():
        return QGuiApplication.screens()

    @staticmethod
    def keyboardModifiers():
        return _host.modifiers()

    @staticmethod
    def clipboard():
        return QGuiApplication.clipboard()

    @staticmethod
    def processEvents(*a):
        pass

    @staticmethod
    def setQuitOnLastWindowClosed(*a):
        pass

    @staticmethod
    def activeWindow():
        return None

    @staticmethod
    def focusWidget():
        return None

    @staticmethod
    def widgetAt(*a):
        return None


class QStyle:
    pass


class QStyleFactory:
    @staticmethod
    def create(*a):
        return None


class QToolTip:
    @staticmethod
    def showText(*a):
        pass

    @staticmethod
    def hideText():
        pass


class QGraphicsDropShadowEffect(QObject):
    def __getattr__(self, name):
        return _noop


class QGraphicsOpacityEffect(QGraphicsDropShadowEffect):
    pass


class QCompleter(QObject):
    def __getattr__(self, name):
        return _noop


class QButtonGroup(QObject):
    buttonClicked = Signal()
    idClicked = Signal()

    def __getattr__(self, name):
        return _noop


class QProgressBar(QAbstractSlider):
    pass


class QCalendarWidget(QWidget):
    pass


class QDateTimeEdit(QWidget):
    pass


QDateEdit = QTimeEdit = QDateTimeEdit


class QHeaderView:
    Stretch, ResizeToContents = 1, 3


class QTreeWidget(QWidget):
    pass


class QTreeWidgetItem:
    def __init__(self, *a):
        pass


class QTableWidget(QWidget):
    pass


class QTableWidgetItem:
    def __init__(self, *a):
        pass


class QSplitter(QWidget):
    pass


class QMainWindow(QWidget):
    pass


class QMenuBar(QWidget):
    pass


class QStatusBar(QWidget):
    pass


class QStyleOption:
    pass
