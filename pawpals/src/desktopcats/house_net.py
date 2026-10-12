# -*- coding: utf-8 -*-
"""Sharing the cat house over the network: one computer opens a room (the host -- it runs the house),
the other joins with an invite code (the guest -- it shows the host's house and sends its inputs).

Both are owners: the guest can decorate, feed, pet and control a cat or a family member; the host keeps
the furniture layout and saves it. Transport: one TCP connection, newline-separated JSON messages.

    guest -> host   {"t": "join", "proto", "code", "name"}       then {"t": "cmd", "c": name, "a": {...}}, {"t": "ping"}
    host  -> guest  {"t": "welcome", ...whole house...}          then {"t": "s", ...snapshot...} ~15 times a second,
                    {"t": "layout"}, {"t": "people"}, {"t": "look"} when those change, {"t": "bye", "why"}

Across the internet the guest connects to the host's public IP: the host forwards TCP port 47650 on the
router to the host computer and allows it through the firewall (see PUBLIC_GUIDE / GuideDialog)."""

import json
import math
import random
import re
import sys
import time

from PySide6.QtCore import QObject, QTimer, Qt, QUrl
from PySide6.QtGui import QGuiApplication
from PySide6.QtNetwork import (QAbstractSocket, QHostAddress, QNetworkAccessManager, QNetworkInterface,
                               QNetworkRequest, QTcpServer, QTcpSocket)
from PySide6.QtWidgets import (QCheckBox, QDialog, QHBoxLayout, QLabel, QLineEdit, QMessageBox, QPushButton, QSpinBox,
                               QVBoxLayout)

from . import art
from . import house_art as H

PROTO = "pawpals-house-1"
DEFAULT_PORT = 47650
GUEST_PIDS = ("guest", "guest2", "guest3")      # up to three guests in one room
SNAP_HZ = 15.0
MAX_LINE = 4 * 1024 * 1024
CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def finite(obj, depth=0):
    """No NaN / infinity and nothing deeply nested in what the guest sends."""
    if depth > 4:
        return False
    if isinstance(obj, float):
        return math.isfinite(obj)
    if isinstance(obj, dict):
        return len(obj) < 32 and all(finite(v, depth + 1) for v in obj.values())
    if isinstance(obj, list):
        return len(obj) < 64 and all(finite(v, depth + 1) for v in obj)
    return True


def new_code():
    return "".join(random.choice(CODE_CHARS) for _ in range(6))


def r1(v):
    return round(float(v), 1)


# ---------------------------------------------------------------------------------- invite codes
def make_invite(ip, port, code):
    return "PAWPALS:%s:%d:%s" % (ip, port, code)


def make_invite2(addrs, port, code):
    """One invite with every address worth trying: 'PAWPALS2:CODE:PORT:addr|addr|...'."""
    return "PAWPALS2:%s:%d:%s" % (code, port, "|".join(addrs))


def parse_invite(text):
    """'PAWPALS2:ABC123:47650:2601::5|1.2.3.4|100.88.1.2' -> ([hosts], port, code);
    'PAWPALS:1.2.3.4:47650:ABC123', '1.2.3.4:47650 ABC123' or '1.2.3.4 ABC123' -> (host, port, code)."""
    t = (text or "").strip()
    m = re.match(r"(?i)^pawpals2:([A-Za-z0-9]{4,12}):(\d{1,5}):(.+)$", t)
    if m:
        hosts = [h.strip().strip("[]") for h in m.group(3).split("|") if h.strip()]
        if hosts:
            return hosts, int(m.group(2)), m.group(1).upper()
    m = re.match(r"(?i)^pawpals:(.+):(\d{1,5}):([A-Za-z0-9]{4,12})$", t)
    if m:
        return m.group(1).strip("[]"), int(m.group(2)), m.group(3).upper()
    parts = re.split(r"[\s,，]+", t)
    if len(parts) >= 2:
        hostport, code = parts[0], parts[-1]
        port = DEFAULT_PORT
        m = re.match(r"^\[?([^\]]+?)\]?:(\d{1,5})$", hostport)
        if m and hostport.count(":") == 1 or (m and hostport.startswith("[")):
            hostport, port = m.group(1), int(m.group(2))
        if re.match(r"^[A-Za-z0-9]{4,12}$", code):
            return hostport, port, code.upper()
    return None


def lan_ip():
    """This computer's address inside the home network (what the router's port forwarding points at)."""
    for ip, label in local_addresses():
        parts = [int(x) for x in ip.split(".")]
        if parts[0] == 10 or (parts[0] == 172 and 16 <= parts[1] <= 31) or (parts[0] == 192 and parts[1] == 168):
            return ip
    addrs = local_addresses()
    return addrs[0][0] if addrs else "（没找到，见第 3 步）"


def v6_addresses():
    """Public IPv6 addresses of this computer."""
    out = []
    for a in QNetworkInterface.allAddresses():
        if a.protocol() != QAbstractSocket.IPv6Protocol or a.isLoopback() or a.isLinkLocal():
            continue
        if hasattr(a, "isGlobal") and not a.isGlobal():
            continue
        ip = a.toString().split("%")[0]
        if ip.startswith(("2", "3")) and ip not in out:
            out.append(ip)
    return out[:4]


def tailscale_addresses():
    return [ip for ip, label in local_addresses() if label.startswith("Tailscale")]


def order_hosts(hosts):
    """Try the address most likely to work first: Tailscale when both have it, the same home network,
    IPv6 when this computer has it, then the public IPv4 address."""
    mine = [ip for ip, _ in local_addresses()]
    my_ts = any(ip.startswith("100.") and 64 <= int(ip.split(".")[1]) <= 127 for ip in mine)
    my_v6 = bool(v6_addresses())

    def rank(h):
        if ":" in h:
            return 2 if my_v6 else 6
        parts = h.split(".")
        if len(parts) == 4 and all(x.isdigit() for x in parts):
            a, b = int(parts[0]), int(parts[1])
            if a == 100 and 64 <= b <= 127:
                return 0 if my_ts else 5
            if a == 10 or (a == 172 and 16 <= b <= 31) or (a == 192 and b == 168):
                return 1 if any(m.rsplit(".", 1)[0] == h.rsplit(".", 1)[0] for m in mine) else 7
        return 3
    return sorted(dict.fromkeys(hosts), key=rank)


def host_label(h):
    if ":" in h:
        return "IPv6"
    if h.startswith("100.") and 64 <= int(h.split(".")[1] or 0) <= 127:
        return "Tailscale"
    a, b = (int(x) for x in h.split(".")[:2]) if re.match(r"^\d+\.\d+\.", h) else (0, 0)
    if a == 10 or (a == 172 and 16 <= b <= 31) or (a == 192 and b == 168):
        return "局域网"
    return "公网 IP"


TAILSCALE_HTML = """
<h3>最省事、校园网也能用：两边都装 Tailscale（推荐）</h3>
<p style='color:#7a6a5a'>Tailscale 会把两台电脑连成一个“虚拟局域网”，不用设置路由器，宿舍 / 学校 / 公司网络一般都能用
（连不上直连时它会自动走 443 端口中转）。个人使用免费。</p>
<ol>
<li>两个人都到 <b>tailscale.com/download</b> 下载安装（Windows / Mac 都有），用 Google / 微软 / Apple 账号登录。</li>
<li>房主登录后，在 Tailscale 网页后台 <b>Machines</b> 里点这台电脑右边的 “⋯” → <b>Share…</b>，把链接发给对方；
对方打开链接接受（或者两个人干脆登录<b>同一个账号</b>，就不用分享了）。</li>
<li>两边的 Tailscale 都显示 <b>Connected</b> 后，房主重新打开“开房间”窗口：邀请码里会自动带上 <b>100.x.x.x</b>
的 Tailscale 地址，对方粘贴邀请码就能进来，会优先走 Tailscale。</li>
</ol>
<p style='color:#7a6a5a'>Tailscale 地址是固定的，以后不用每次重新复制邀请码。</p>
"""


ALWAYS_ON_HTML = """
<h3>家里电脑长开一个房间，大家各用笔记本进来</h3>
<ol>
<li><b>家里电脑开一次房间</b>，在房间窗口里勾上“固定这个房间码”和“打开小屋时自动开房间”。以后邀请码一直不变，发一次就行。</li>
<li><b>让它开机就跑起来</b>：设置 → 常规 里打开“开机自启动”，启动时的选择框勾上“记住我的选择”，并保持小屋开着（下次启动会自动打开小屋、自动开房间）。</li>
<li><b>别让家里电脑睡眠</b>：Windows 设置 → 系统 → 电源 → 屏幕和睡眠，“接通电源时，经过以下时间后使设备进入睡眠状态”选<b>从不</b>
（屏幕可以照常关掉）。房间开着时，就算家里电脑上有人全屏玩游戏、把猫藏起来，小屋也会照常运行。</li>
<li><b>三台电脑都装 Tailscale</b>（家里电脑、你的笔记本、朋友的笔记本）：家里电脑和你的笔记本登录你自己的账号，
再在 Tailscale 网页后台把家里电脑 Share 给朋友。家里电脑上建议：托盘里 Tailscale 图标 → Preferences → 勾选
<b>Run unattended</b>（没人登录时也保持连接）；网页后台 Machines → 家里电脑 ⋯ → <b>Disable key expiry</b>（不然过几个月要重新登录）。</li>
<li>一个房间最多 3 位客人，每人控制自己的角色，可以一起装修、喂猫、四人对战。家里没人时，房主那边的家人和猫由 AI 照常生活。</li>
</ol>
"""


def public_guide_html(port, lan):
    return TAILSCALE_HTML + ALWAYS_ON_HTML + """
<h3>自动尝试（不用手动设置时）</h3>
<p>开房间时会自动做两件事：<b>IPv6</b>（两边都有 IPv6 时直接连，很多美国家庭宽带和学校都有）、
<b>路由器自动端口映射（UPnP）</b>（多数家用路由器默认开着）。邀请码里会带上所有能试的地址，对方那边按顺序自动尝试，
所以一般直接把邀请码发过去试试就行。都不行时，再看下面的手动步骤或用 Tailscale。</p>
<h3>用公网 IP 联机：房主手动设置（只需要做一次）</h3>
<p style='color:#7a6a5a'>房主 = 开房间的那台电脑（比如家里的 Windows 台式机）。对方不需要和你在同一个网络。</p>
<ol>
<li><b>开房间</b>：小屋上方“🎮 玩耍” → 联机 → 开房间，端口用默认的 <b>%(port)d</b> 就行。</li>
<li><b>放行防火墙</b>：第一次开房间时 Windows 会弹出“Windows 安全中心警报”，把“专用网络”和“公用网络”都勾上，点<b>允许访问</b>。<br>
没弹出或点错了：开始菜单搜“允许应用通过 Windows 防火墙” → 更改设置 → 找到 <b>Python</b>（或 pythonw）把两个勾都勾上；
或者用管理员身份打开 PowerShell，输入：<br>
<code>New-NetFirewallRule -DisplayName "PawPals" -Direction Inbound -Protocol TCP -LocalPort %(port)d -Action Allow</code><br>
Mac：系统设置 → 网络 → 防火墙，若打开了防火墙，弹窗时选“允许传入连接”。</li>
<li><b>记下这台电脑的内网地址</b>：<b>%(lan)s</b><br>
（也可以在命令提示符里输入 <code>ipconfig</code>，看“IPv4 地址”，一般是 192.168.x.x。）</li>
<li><b>在路由器里做端口转发</b>：浏览器打开路由器管理页（多数是 <code>192.168.1.1</code> 或 <code>192.168.0.1</code>，
具体地址和密码在路由器背面的贴纸上），找到“端口转发 / 虚拟服务器 / NAT / 端口映射”，新建一条：<br>
&nbsp;&nbsp;外部端口 <b>%(port)d</b> → 内部 IP <b>%(lan)s</b>，内部端口 <b>%(port)d</b>，协议 <b>TCP</b>，保存。<br>
建议同时在路由器的“DHCP 静态分配 / IP 与 MAC 绑定”里把这台电脑的地址固定下来，不然重启后地址变了，转发就失效了。<br>
家里有光猫 + 路由器两层的，转发要在<b>直接拨号上网</b>的那台设备上做（一般是路由器；光猫桥接模式时只需设路由器）。</li>
<li><b>确认你有公网 IP</b>：在开房间窗口里点“查公网 IP”，再到路由器的“上网状态 / WAN 口状态”看 WAN IP。
两个一样，说明是真公网 IP，可以联机。<br>
如果 WAN IP 是 <b>100.64～100.127</b>、<b>10.</b>、<b>172.16～31.</b>、<b>192.168.</b> 开头，或者和查到的公网 IP 不一样，
说明运营商给的是“大内网”，外面连不进来：打运营商客服电话（如电信 10000、联通 10010、移动 10086），说“家里宽带需要公网 IPv4 地址”，
一般可以免费开通，开通后重启光猫即可。</li>
<li><b>发邀请码</b>：开房间窗口里“公网邀请码”那一行点<b>复制</b>，发给对方。邀请码里有公网 IP、端口和房间码。<br>
家里宽带的公网 IP 隔一段时间会变，所以每次开房间都重新复制一次邀请码发过去。</li>
</ol>
<h3>对方（加入的人）</h3>
<ol>
<li>小屋上方“🎮 玩耍” → 联机 → 加入房间，粘贴邀请码，点<b>加入</b>。</li>
</ol>
<h3>连不上时这样查</h3>
<ul>
<li>房主开着房间时，用手机流量（关掉 Wi-Fi）打开网站 <b>canyouseeme.org</b> 或搜索“端口检测”，检测端口 <b>%(port)d</b>：
显示“Success / 开放”说明转发和防火墙都对了；显示失败就回头检查第 2、4、5 步。</li>
<li>房主自己在家里的网络里用公网邀请码连自己，很多路由器不支持，会失败——这是正常的，请让对方从外面连。</li>
<li>公司、学校的网络常常不让连外面的非常用端口，宿舍也大多是“大内网”：这种情况请用上面的 Tailscale，或换手机热点试试。</li>
<li>房间码相当于密码，只发给信任的人；不玩的时候点“关闭房间”。</li>
</ul>
""" % {"port": port, "lan": lan}


class GuideDialog(QDialog):
    def __init__(self, parent, port=None):
        super().__init__(parent)
        from PySide6.QtWidgets import QTextBrowser
        self.setWindowTitle("用公网 IP 联机的步骤")
        lay = QVBoxLayout(self)
        tb = QTextBrowser()
        tb.setOpenExternalLinks(True)
        tb.setHtml(public_guide_html(int(port or DEFAULT_PORT), lan_ip()))
        self.setWindowTitle("联机步骤（Tailscale / 自动尝试 / 公网 IP）")
        lay.addWidget(tb)
        row = QHBoxLayout()
        row.addStretch(1)
        ok = QPushButton("知道了")
        ok.clicked.connect(self.accept)
        row.addWidget(ok)
        lay.addLayout(row)
        self.resize(640, 640)


def local_addresses():
    """[(ip, label)] of this computer, the most useful first."""
    out = []
    for a in QNetworkInterface.allAddresses():
        if a.isLoopback() or a.protocol() != QAbstractSocket.IPv4Protocol:
            continue
        ip = a.toString()
        parts = [int(x) for x in ip.split(".")]
        if parts[0] == 100 and 64 <= parts[1] <= 127:
            out.append((ip, "Tailscale（不在一起时推荐）", 0))
        elif parts[0] == 169 and parts[1] == 254:
            continue
        elif parts[0] == 10 or (parts[0] == 172 and 16 <= parts[1] <= 31) or (parts[0] == 192 and parts[1] == 168):
            out.append((ip, "局域网（同一个 Wi-Fi / 路由器）", 1))
        else:
            out.append((ip, "这台电脑的地址", 2))
    out.sort(key=lambda r: r[2])
    return [(ip, label) for ip, label, _ in out]


# ---------------------------------------------------------------------------------- one connection
class Conn(QObject):
    def __init__(self, sock, on_msg, on_close):
        super().__init__()
        self.sock = sock
        self.buf = b""
        self.on_msg = on_msg
        self.on_close = on_close
        self.closed = False
        self.last_rx = time.monotonic()
        sock.readyRead.connect(self._read)
        sock.disconnected.connect(self._gone)
        try:
            sock.errorOccurred.connect(self._error)
        except AttributeError:
            pass
        sock.setSocketOption(QAbstractSocket.LowDelayOption, 1)

    def send(self, obj):
        if self.closed:
            return
        try:
            data = json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8") + b"\n"
            self.sock.write(data)
        except Exception as ex:
            print("net send:", ex, file=sys.stderr)

    def _read(self):
        self.buf += bytes(self.sock.readAll())
        self.last_rx = time.monotonic()
        if len(self.buf) > MAX_LINE:
            self.close("消息太大")
            return
        while b"\n" in self.buf:
            line, _, self.buf = self.buf.partition(b"\n")
            if not line.strip():
                continue
            try:
                msg = json.loads(line.decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                continue
            if isinstance(msg, dict):
                try:
                    self.on_msg(self, msg)
                except Exception as ex:
                    import traceback
                    print("net message error:", repr(ex), traceback.format_exc(), file=sys.stderr)
            if self.closed:
                return

    def _error(self, *a):
        if self.sock.state() != QAbstractSocket.ConnectedState:
            self._gone()

    def _gone(self):
        if not self.closed:
            self.closed = True
            self.on_close(self, self.sock.errorString() if self.sock.error() != QAbstractSocket.UnknownSocketError else "")

    def close(self, why=""):
        if self.closed:
            return
        self.send({"t": "bye", "why": why})
        self.sock.flush()
        self.closed = True
        self.sock.disconnectFromHost()
        self.on_close(self, why)


# ---------------------------------------------------------------------------------- snapshots
def look_of(app):
    """The host's cat colours (so the guest sees the same two cats)."""
    from .config import COAT_PRESETS
    look = app.cfg["look"]
    merged = {}
    for kind in ("calico", "tabby"):
        preset = COAT_PRESETS[kind].get(look["coat"].get(kind, ""), {})
        merged[kind] = dict(preset, **app.cfg["colors"].get(kind, {}))
        if look["eye"].get(kind):
            merged[kind]["eye"] = look["eye"][kind]
        if look["eye2"].get(kind):
            merged[kind]["eye2"] = look["eye2"][kind]
    return merged


def cats_info(world):
    out = []
    for c in world.cats:
        try:
            shape = list(world.app.body_shape(c.kind))
        except Exception:
            shape = [1.0, 1.0]
        out.append({"uid": c.uid, "kind": c.kind, "name": c.name, "acc_h": c.src.acc_h, "acc_b": c.src.acc_b,
                    "shape": shape})
    return out


def people_info(world):
    return [{"uid": p.uid, "name": p.name, "conf": {k: v for k, v in p.P.items() if not k.startswith("_")}}
            for p in world.people]


def layout_info(world):
    return [[it.id, it.type, it.f, r1(it.x), r1(it.y), it.rot] for it in world.items if not getattr(it, "place", False)]


def item_state(it):
    s = it.state
    row = [int(s.get("food", 100)), bool(s.get("on")), round(float(s.get("swing", 0.0)), 2), bool(s.get("coat", True)),
           bool(s.get("birds", True))]
    if it.type == "tv":
        row += [s.get("ch"), int(s.get("seed", 0)), (s.get("info") or {}).get("weather"),
                (s.get("info") or {}).get("temp")]
    extra = {k: (round(v, 2) if isinstance(v, float) else v) for k, v in s.items() if k in NET_STATE}
    if extra:
        row.append(extra)
    return row


NET_STATE = ("wear", "dirty", "water", "meal", "plate", "closed", "zz", "glow", "cups", "tilt_amp", "lesson", "busy",
             "color", "open")


def agent_row(a, now):
    b = a.bubble
    row = {"u": a.uid, "f": a.f, "x": r1(a.x), "y": r1(a.y), "h": r1(a.h),
           "su": None if a.stairs_u is None else round(a.stairs_u, 3), "fc": a.facing, "st": a.state,
           "aw": bool(a.away), "sp": list(a.spot) if a.spot else None, "c": a.ctrl, "pa": bool(a.path),
           "b": [b["text"], round(b["until"] - now, 2)] if b and b["until"] > now else None}
    if a.traveling is not None:
        row["tr"] = a.traveling
        if a.path and a.path[0].get("t") == "travel":
            row["tk"] = round(a.path[0].get("k", 0.0), 2)
    if a.ride is not None:
        row["rd"] = a.ride
    if a.in_tent is not None:
        row["tn"] = a.in_tent
    if a.guardian:
        row["gd"] = a.guardian
    fa = getattr(a, "fanim", None)
    if fa:
        row["fa"] = {k: (round(v, 2) if isinstance(v, float) else v) for k, v in fa.items()}
        if a.is_cat:
            row["fu"] = round(float(getattr(a, "fu", 0.0) or 0.0), 3)
            row["fk"] = int(getattr(a, "fk", 0) or 0)
        elif a.pose == "rig" and getattr(a, "rig", None):
            row["rg"] = {k: ([round(x, 1) for x in v] if isinstance(v, (tuple, list)) else
                             (round(v, 1) if isinstance(v, float) else v)) for k, v in a.rig.items()}
    if a.is_cat:
        row.update(po=a.pose, dp=a.data.get("pose"), sw=round(getattr(a, "swing", 0.0), 2))
        ji = getattr(a, "jump_info", None)
        if ji is not None:
            row["ji"] = [round(ji[0], 2), round(ji[1], 1)]
        if a.state == "carried":
            row["cb"] = [a.data.get("by"), a.data.get("mode", "carry")]
        th = getattr(a, "think", None)
        if th and th[1] > now:
            row["tk"] = [th[0], round(th[1] - now, 2)]
    else:
        row.update(po=a.pose, vw=a.view, pr=a.prop, se=r1(a.seat), ac=a.act, sd=list(a.sleep_dir),
                   bl=a.P.get("_blanket"))
        if getattr(a, "hold", None):
            row["ho"] = [a.hold.get("uid"), a.hold.get("mode", "carry")]
    return row


def item_changes(world, last_items):
    items = {}
    for it in world.items:
        st = item_state(it)
        if last_items.get(it.id) != st:
            items[it.id] = st
            last_items[it.id] = st
    return items


def snapshot_for_all(world, item_maps):
    """One snapshot per guest: everything is built once (one-shot effects are consumed only once), only the
    furniture changes differ, since each guest joined at a different time."""
    if not item_maps:
        return []
    base = snapshot(world, item_maps[0])
    out = [base]
    for m in item_maps[1:]:
        sn = dict(base)
        sn["it"] = item_changes(world, m)
        out.append(sn)
    return out


def snapshot(world, last_items):
    now = time.monotonic()
    items = item_changes(world, last_items)
    fx = world.fx_log or []
    world.fx_log = []
    w = world.weather()
    return {"t": "s", "hr": round(world.hour(), 3), "wx": w or "clear", "a": [agent_row(a, now) for a in world.agents()],
            "it": items, "fx": fx[:40],
            "pb": {k: [b["text"], round(b["until"] - now, 2)] for k, b in world.plush_bubbles.items()},
            "bf": [[r1(b["x"]), r1(b["y"]), r1(b["z"]), r1(b["ph"]), b["col"]] for b in world.butterflies],
            "bd": [{"f": b["f"], "w": list(b["w"]), "x": r1(b["x"]), "y": r1(b["y"]), "ph": r1(b["ph"])} for b in world.birds],
            "pl": world.play.to_net(), "pp": world.plush_to_net(), "dr": world.drops_to_net(),
            "sn": round(getattr(world, "snow", 0.0), 3),
            "vi": world.visitors_to_net() if hasattr(world, "visitors_to_net") else [],
            "cu": [[f, r, bool(v)] for (f, r), v in getattr(world, "curtains", {}).items()],
            "cl": [[f, r, bool(v.get("on"))] for (f, r), v in getattr(world, "ceil", {}).items()],
            "fp": [[r1(x), r1(y), int(a)] for x, y, a in (getattr(world, "prints", []) or [])[-80:]],
            "px": world.places_to_net() if hasattr(world, "places_to_net") else None,
            "bt": world.battle_to_net() if hasattr(world, "battle_to_net") else None}


class RemoteCatSrc:
    """Stands in for a desktop cat on the guest's computer: the host's cat as the host sees it."""

    def __init__(self, d):
        self.kind = d["kind"]
        self.name = d.get("name") or self.kind
        self.acc_h = d.get("acc_h")
        self.acc_b = d.get("acc_b")
        self.shape = tuple(d.get("shape") or (1.0, 1.0))
        self.stats = {"hunger": 0.0, "energy": 100.0, "mood": 80.0}

    def line(self, key, **fmt):
        return "喵～"


def apply_snapshot(world, s):
    now = time.monotonic()
    world.debug_hour = float(s.get("hr", 12))
    world.debug_weather = s.get("wx") or "clear"
    if "vi" in s and hasattr(world, "visitors"):
        want = {}
        for r in s.get("vi") or []:
            if isinstance(r, list) and len(r) == 2 and str(r[0]).startswith("v:"):
                want[str(r[0])] = str(r[1])
        world.visitors = [v for v in world.visitors if v.uid in want]
        have = {v.uid for v in world.visitors}
        for uid, kind in want.items():
            if uid not in have:
                try:
                    v = world.make_visitor(kind)
                    v.uid = uid
                    world.visitors.append(v)
                except Exception:
                    pass
    if "cl" in s:
        try:
            world.ceil = {(int(f), str(r)): {"on": bool(v)} for f, r, v in s.get("cl") or []}
        except (TypeError, ValueError):
            pass
    if "cu" in s and hasattr(world, "curtains"):
        try:
            world.curtains = {(int(f), str(r)): bool(v) for f, r, v in s.get("cu") or []}
        except (TypeError, ValueError):
            pass
    seen = set()
    for row in s.get("a", []):
        a = world.agent_by_uid(row.get("u"))
        if a is None:
            continue
        seen.add(a.uid)
        a.hidden = row.get("st") == "hiding" and a.is_cat       # (v24) tucked away in the furniture
        a.traveling = row.get("tr")
        a.trip_k = row.get("tk")
        a.ride = row.get("rd")
        a.in_tent = row.get("tn")
        a.guardian = row.get("gd")
        f = int(row["f"])
        x, y = float(row["x"]), float(row["y"])
        snap = f != a.f or row.get("sp") or math.hypot(x - a.x, y - a.y) > 160 or row.get("su") is not None
        a.f = f
        a._tx, a._ty = x, y
        if snap:
            a.x, a.y = x, y
        a.h = float(row["h"])
        a.stairs_u = row.get("su")
        a.facing = 1 if row.get("fc", 1) >= 0 else -1
        a.state = row.get("st", "idle")
        a.away = bool(row.get("aw"))
        a.spot = tuple(row["sp"]) if row.get("sp") else None
        a.path = [{"t": "remote"}] if row.get("pa") else []
        a.ctrl = row.get("c")
        a.fanim = row.get("fa")
        a.fu = float(row.get("fu", 0.0) or 0.0)
        a.fk = int(row.get("fk", 0) or 0)
        a.rig = row.get("rg")
        b = row.get("b")
        if b:
            if not a.bubble or a.bubble.get("text") != b[0]:
                a.bubble = {"text": b[0], "t0": now, "until": now + float(b[1]), "host": True}
        elif a.bubble and a.bubble.get("host"):
            a.bubble = None
        if a.is_cat:
            a.set_pose(row.get("po") or "stand")
            a.data["pose"] = row.get("dp")
            a.swing = float(row.get("sw", 0.0))
            ji = row.get("ji")
            a.jump_info = (float(ji[0]), float(ji[1])) if isinstance(ji, list) and len(ji) == 2 else None
            cb = row.get("cb")
            if isinstance(cb, list) and len(cb) == 2:
                a.data["by"], a.data["mode"] = str(cb[0]), str(cb[1])
            tk = row.get("tk")
            if isinstance(tk, list) and len(tk) == 2:
                if not getattr(a, "think", None) or a.think[0] != tk[0] or a.think[1] < now:
                    a.think = (str(tk[0]), now + float(tk[1]))
            else:
                a.think = None
        else:
            a.pose = row.get("po") or "stand"
            a.view = row.get("vw") or "side"
            a.prop = row.get("pr")
            a.seat = float(row.get("se", 0.0))
            a.act = row.get("ac") or "idle"
            sd = row.get("sd") or [0, -1]
            a.sleep_dir = (float(sd[0]), float(sd[1]))
            if row.get("bl"):
                a.P["_blanket"] = row["bl"]
            ho = row.get("ho")
            a.hold = {"uid": str(ho[0]), "mode": str(ho[1])} if isinstance(ho, list) and len(ho) == 2 else None
    for n in getattr(world, "npcs", []):
        n.hidden = n.uid not in seen
    if s.get("px") and hasattr(world, "places_from_net"):
        world.places_from_net(s["px"])
    if hasattr(world, "battle_from_net"):
        world.battle_from_net(s.get("bt"))
    for iid, st in (s.get("it") or {}).items():
        it = world.item_by_id(int(iid))
        if it is not None and isinstance(st, list) and len(st) >= 5:
            it.state.update(food=float(st[0]), on=bool(st[1]), swing=float(st[2]), coat=bool(st[3]), birds=bool(st[4]))
            if it.type == "tv" and len(st) >= 9:
                if st[5] != it.state.get("ch"):
                    it.state["ch_mt"] = time.monotonic()
                it.state.update(ch=st[5], seed=int(st[6] or 0), info={"weather": st[7], "temp": st[8]})
            if isinstance(st[-1], dict):
                for k, v in st[-1].items():
                    if k in NET_STATE:
                        it.state[k] = v
    for uid, kind, n in s.get("fx", []):
        a = world.agent_by_uid(uid)
        if a is not None and kind in ("heart", "z", "q", "ex", "note", "drop"):
            Agent_spawn_local(a, kind, min(int(n), 4))
    world.plush_bubbles = {k: {"text": v[0], "t0": now, "until": now + float(v[1])} for k, v in (s.get("pb") or {}).items()}
    world.butterflies = [{"x": b[0], "y": b[1], "z": b[2], "ph": b[3], "col": b[4]} for b in s.get("bf", [])]
    world.birds = [dict(b, w=tuple(b["w"]), vx=0.0) for b in s.get("bd", [])]
    world.play.from_net(s.get("pl") or {})
    if "pp" in s:
        world.plush_from_net(s["pp"])
    if "dr" in s:
        world.drops_from_net(s["dr"])
    try:
        world.snow = float(s.get("sn", 0.0))
        world.prints = [[float(x), float(y), float(a)] for x, y, a in (s.get("fp") or [])]
    except (TypeError, ValueError):
        pass


def Agent_spawn_local(a, kind, n):
    fx, a.world.fx_log = a.world.fx_log, None
    try:
        a.spawn(kind, n)
    finally:
        a.world.fx_log = fx


# ---------------------------------------------------------------------------------- the host
class NetHost(QObject):
    is_client = False

    def __init__(self, house, port, code):
        super().__init__()
        self.house = house
        self.port = port
        self.code = code
        self.server = QTcpServer()
        self.server.newConnection.connect(self._incoming)
        if not self.server.listen(QHostAddress.Any, port):
            raise OSError(self.server.errorString())
        self.v6 = v6_addresses()
        self.upnp = None
        try:
            from .house_upnp import Upnp
            self.upnp = Upnp(port, lan_ip(), self.v6)
            self.upnp.start()
        except Exception as ex:
            print("upnp:", repr(ex), file=sys.stderr)
        self.guests = {}               # pid ("guest", "guest2", "guest3") -> {"conn", "name", "items"}
        self.pending = []              # connected, not joined yet
        self.acc = 0.0
        self.sent_layout = None
        self.sent_people = None
        self.sent_look = None
        self.sig_t = 0.0
        self.last_items = {}
        house.world.fx_log = []

    @property
    def guest(self):
        """The first guest's connection (older code paths only ask whether anybody is in)."""
        g = next(iter(self.guests.values()), None)
        return g["conn"] if g else None

    def connected(self):
        return bool(self.guests)

    def guest_names(self):
        return [g["name"] for g in self.guests.values()]

    def status_text(self):
        if self.guests:
            return "联机中：%s" % "、".join(self.guest_names())
        return "房间开着（等人进来）"

    def pid_of(self, c):
        return next((pid for pid, g in self.guests.items() if g["conn"] is c), None)

    def _incoming(self):
        while self.server.hasPendingConnections():
            sock = self.server.nextPendingConnection()
            c = Conn(sock, self._msg, self._closed)
            c.opened = time.monotonic()
            self.pending.append(c)

    def welcome(self):
        w = self.house.world
        return {"t": "welcome", "proto": PROTO, "host": self.house.my_name(), "mirror": bool(H.MIRROR),
                "layout": layout_info(w), "people": people_info(w), "cats": cats_info(w), "look": look_of(w.app)}

    def _msg(self, c, m):
        t = m.get("t")
        if c in self.pending:
            if t != "join":
                return
            self.pending.remove(c)
            if m.get("proto") != PROTO:
                c.close("版本不一样：请两边都更新到同一个版本")
                return
            if str(m.get("code", "")).upper() != self.code:
                c.close("房间码不对")
                return
            free = [p for p in GUEST_PIDS if p not in self.guests]
            if not free:
                c.close("房间满了（最多 %d 位客人）" % len(GUEST_PIDS))
                return
            pid = free[0]
            name = str(m.get("name") or "好友")[:12]
            if name in self.guest_names() or name == self.house.my_name():
                name = (name + str(GUEST_PIDS.index(pid) + 1))[:12]
            items = {}
            self.guests[pid] = {"conn": c, "name": name, "items": items}
            w = self.house.world
            w.play.add_player(pid, name)
            wel = self.welcome()
            wel["you"] = pid
            c.send(wel)
            if len(self.guests) == 1:
                self.sent_layout = w.layout_ver
                self.sent_people = self.people_sig()
                self.sent_look = json.dumps(look_of(w.app), sort_keys=True)
            c.send(snapshot(w, items))
            self.house.flash("%s 加入了小屋！" % name, 4)
            for a in w.cats:
                if a.ctrl is None:
                    a.say("有客人来啦～", 3)
                    break
            return
        pid = self.pid_of(c)
        if pid is None:
            return
        if t == "cmd":
            name = str(m.get("c", ""))[:24]
            args = m.get("a") if isinstance(m.get("a"), dict) else {}
            if not finite(args):
                return
            if name.startswith("h:"):
                self.house.apply_hcmd(name[2:], args, pid)
            else:
                self.house.world.play.command(pid, name, args)
        elif t == "bye":
            c.close()

    def _closed(self, c, why):
        if c in self.pending:
            self.pending.remove(c)
            return
        pid = self.pid_of(c)
        if pid is not None:
            g = self.guests.pop(pid)
            self.house.world.play.remove_player(pid)
            self.house.flash("%s 离开了小屋%s" % (g["name"] or "好友", ("（%s）" % why) if why else ""), 4)
            self.house.update()

    def people_sig(self):
        return json.dumps(people_info(self.house.world), sort_keys=True, ensure_ascii=False)

    def tick(self, dt):
        t = time.monotonic()
        for c in list(self.pending):
            if t - c.opened > 10:
                c.close("没有加入")
        for g in list(self.guests.values()):
            if t - g["conn"].last_rx > 25:
                g["conn"].close("连接超时")
        if not self.guests:
            return
        w = self.house.world
        if w.fx_log is None:
            w.fx_log = []

        def to_all(msg):
            for g in self.guests.values():
                g["conn"].send(msg)
        if w.layout_ver != self.sent_layout:
            self.sent_layout = w.layout_ver
            to_all({"t": "layout", "layout": layout_info(w), "mirror": bool(H.MIRROR)})
        self.sig_t += dt
        if self.sig_t > 2.0:
            self.sig_t = 0.0
            ps = self.people_sig()
            if ps != self.sent_people:
                self.sent_people = ps
                to_all({"t": "people", "people": people_info(w)})
            lk = json.dumps(look_of(w.app), sort_keys=True)
            if lk != self.sent_look:
                self.sent_look = lk
                to_all({"t": "look", "look": look_of(w.app), "cats": cats_info(w)})
        self.acc += dt
        if self.acc >= 1.0 / SNAP_HZ:
            self.acc = 0.0
            # every guest gets its own changes-only snapshot (they joined at different times);
            # the effects log is shared, so build them all before it is cleared
            gs = list(self.guests.values())
            for g, sn in zip(gs, snapshot_for_all(w, [g["items"] for g in gs])):
                g["conn"].send(sn)

    def send_cmd(self, name, kw):
        pass

    def apply_pending_layout(self):
        pass

    def close(self, why="房主关闭了房间"):
        for c in list(self.pending):
            c.close(why)
        for g in list(self.guests.values()):
            g["conn"].close(why)
        self.server.close()
        if self.upnp is not None:
            self.upnp.remove_async()
        self.house.world.fx_log = None

    def invite_hosts(self, public_ip=""):
        """Every address a guest elsewhere could try, best first."""
        hosts = list(self.v6)
        up = self.upnp
        if up is not None and up.state == "mapped" and up.ext_ip:
            hosts.append(up.ext_ip)
        if public_ip and public_ip not in hosts:
            hosts.append(public_ip)
        hosts += tailscale_addresses()
        lan = lan_ip()
        if re.match(r"^\d+\.\d+\.\d+\.\d+$", lan):
            hosts.append(lan)
        return list(dict.fromkeys(hosts))


# ---------------------------------------------------------------------------------- the guest
class NetClient(QObject):
    is_client = True

    def __init__(self, house, host, port, code, name):
        super().__init__()
        self.house = house
        self.hosts = order_hosts(list(host) if isinstance(host, (list, tuple)) else [host])
        self.port, self.code, self.name = port, code, name
        self.host = self.hosts[0] if self.hosts else ""
        self.hi = -1
        self.joined = False
        self.refused = False
        self.host_name = ""
        self.pending_layout = None
        self.ping_t = 0.0
        self.sock = self.conn = None
        self.tried = []
        self.results = []                   # [address, "refused" / "timeout" / "fail" / None]
        self.try_next()

    def try_next(self):
        old = self.conn
        if old is not None:
            old.closed = True
            try:
                old.sock.abort()
            except RuntimeError:
                pass
        self.note("timeout")
        self.hi += 1
        if self.hi >= len(self.hosts):
            self.house.net_failed(self.failure_text())
            return
        self.host = self.hosts[self.hi]
        self.tried.append(host_label(self.host))
        self.results.append([self.host, None])
        self.sock = QTcpSocket()
        self.conn = Conn(self.sock, self._msg, self._closed)
        self.sock.connected.connect(self._connected)
        self.started = time.monotonic()
        self.got_tcp = False
        if len(self.hosts) > 1:
            self.house.flash("正在尝试 %s 连接（%d/%d）…" % (host_label(self.host), self.hi + 1, len(self.hosts)), 8)
        self.sock.connectToHost(self.host, self.port)

    def connected(self):
        return self.joined

    def note(self, kind):
        """How the current address went (the first verdict counts)."""
        if self.results and self.results[-1][1] is None:
            self.results[-1][1] = kind

    def failure_text(self):
        """Every address tried, and what it means."""
        names = {"refused": "拒绝连接", "timeout": "没有回应", "fail": "连不上"}
        rows = ["%s（%s）：%s" % (host_label(h), h, names.get(k or "timeout")) for h, k in self.results]
        refused = [h for h, k in self.results if k == "refused"]
        if refused:
            tip = ("“拒绝连接”说明房主的电脑在线，但这个端口（%d）上没有开着的房间：请房主打开小屋 → 联机 → 开房间"
                   "（或检查房主那边端口设置是不是 %d）。" % (self.port, self.port))
        else:
            tip = ("所有地址都没有回应：房主的电脑可能关机 / 睡眠了，或者 Tailscale 没连上（两边菜单栏 / 托盘里的 "
                   "Tailscale 都要显示 Connected），也可能是房主那边的防火墙挡住了。房主是 Windows 时，"
                   "房间没开也会显示成“没有回应”（Windows 防火墙不回绝，直接不理），先确认房主那边房间开着。")
        return "连不上（%d 个地址都试过了）\n%s\n%s" % (len(self.results), "\n".join(rows), tip)

    def status_text(self):
        if self.joined:
            return "做客中"
        return "连接中…"

    def _connected(self):
        self.got_tcp = True
        self.conn.send({"t": "join", "proto": PROTO, "code": self.code, "name": self.name})

    def _msg(self, c, m):
        t = m.get("t")
        if t == "welcome":
            self.joined = True
            self.host_name = str(m.get("host") or "房主")[:12]
            self.house.enter_remote(m)
            self.house.flash("来到了 %s 的小屋！双击猫或家人就能控制TA" % self.host_name, 5)
        elif not self.joined:
            if t == "bye":
                self.refused = True
                self.conn.closed = True
                self.house.net_failed(m.get("why") or "对方拒绝了")
        elif t == "s":
            apply_snapshot(self.house.world, m)
        elif t == "layout":
            if self.house.drag_item is not None or self.house.placing is not None:
                self.pending_layout = m
            else:
                self.house.apply_remote_layout(m)
        elif t == "people":
            self.house.apply_remote_people(m.get("people") or [])
        elif t == "look":
            self.house.apply_remote_look(m)
        elif t == "bye":
            self.conn.closed = True
            self.house.leave_remote(m.get("why") or "房主关闭了房间")

    def apply_pending_layout(self):
        if self.pending_layout is not None:
            m, self.pending_layout = self.pending_layout, None
            self.house.apply_remote_layout(m)

    def _closed(self, c, why):
        if c is not self.conn:
            return
        if not self.joined and not self.got_tcp:
            try:
                err = self.sock.error()
            except RuntimeError:
                err = None
            self.note("refused" if err == QAbstractSocket.ConnectionRefusedError else
                      "timeout" if err == QAbstractSocket.SocketTimeoutError else "fail")
        if self.joined:
            self.house.leave_remote(why or "连接断开了")
        elif self.refused:
            return
        elif self.hi + 1 < len(self.hosts):
            QTimer.singleShot(0, self.try_next)
        elif len(self.results) > 1 and not self.got_tcp:
            self.house.net_failed(self.failure_text())
        else:
            self.house.net_failed((why or "连不上") + "。校园网 / 宿舍推荐两边都装 Tailscale（见联机步骤）")

    def tick(self, dt):
        t = time.monotonic()
        if not self.joined:
            limit = 10 if self.got_tcp else (4 if self.hi + 1 < len(self.hosts) else 10)
            if t - self.started > limit:
                if self.hi + 1 < len(self.hosts) and not self.got_tcp:
                    self.try_next()
                    return
                self.conn.closed = True
                self.sock.abort()
                if not self.got_tcp and len(self.results) > 1:
                    self.note("timeout")
                    self.house.net_failed(self.failure_text())
                    return
                self.house.net_failed("连接超时：确认房主开着房间、地址和端口对，并且防火墙允许；"
                                      "校园网 / 宿舍推荐两边都装 Tailscale")
            return
        self.ping_t += dt
        if self.ping_t > 3:
            self.ping_t = 0.0
            self.conn.send({"t": "ping"})
        if t - self.conn.last_rx > 15:
            self.conn.close("太久没收到房主的消息")

    def send_cmd(self, name, kw):
        self.conn.send({"t": "cmd", "c": name, "a": kw})

    def close(self, why="我离开了"):
        self.conn.close(why)


# ---------------------------------------------------------------------------------- dialogs & menu
DIALOG_CSS = """
QDialog { background: #fff8ef; }
QLabel { color: #5e4436; font-size: 13px; }
QLabel#title { font-size: 17px; font-weight: bold; }
QLabel#code { font-size: 22px; font-weight: bold; color: #c4562c; letter-spacing: 3px; }
QLineEdit, QSpinBox, QComboBox { padding: 5px 8px; border: 1px solid #d9b99b; border-radius: 7px; background: white;
    font-size: 13px; color: #4a3b36; selection-background-color: #f8d2b0; selection-color: #3a2b26; }
QComboBox QAbstractItemView { background: white; color: #4a3b36; selection-background-color: #ffe2b8; }
QCheckBox, QRadioButton { color: #5e4436; }
QTextBrowser, QPlainTextEdit, QTextEdit { background: white; color: #4a3b36; }
QPushButton { padding: 6px 14px; border: 1px solid #c79a73; border-radius: 9px; background: #ffe2b8; color: #5e4436; }
QPushButton:hover { background: #ffd28f; }
"""


class HostDialog(QDialog):
    def __init__(self, house):
        super().__init__(house)
        self.house = house
        net = house.net
        self.pub_ip = ""
        self.pub_done = False
        self.shown_invite = None
        self.setWindowTitle("我的小屋房间")
        self.setStyleSheet(DIALOG_CSS)
        lay = QVBoxLayout(self)
        t = QLabel("房间开好啦，把邀请码发给对方")
        t.setObjectName("title")
        lay.addWidget(t)
        code = QLabel("房间码  " + net.code)
        code.setObjectName("code")
        code.setTextInteractionFlags(Qt.TextSelectableByMouse)
        lay.addWidget(code)
        row = QHBoxLayout()
        row.addWidget(QLabel("邀请码"))
        self.inv = QLineEdit("")
        self.inv.setReadOnly(True)
        row.addWidget(self.inv, 1)
        self.copy = QPushButton("复制")
        self.copy.clicked.connect(lambda: (QGuiApplication.clipboard().setText(self.inv.text()),
                                           self.copy.setText("已复制 ✓")))
        row.addWidget(self.copy)
        lay.addLayout(row)
        hint = QLabel("邀请码里带着下面所有能试的地址，对方粘贴后会按顺序自动尝试。")
        hint.setWordWrap(True)
        lay.addWidget(hint)
        self.lines = {}
        for key in ("ts", "v6", "upnp", "pub", "lan"):
            lb = QLabel("")
            lb.setWordWrap(True)
            lb.setTextInteractionFlags(Qt.TextSelectableByMouse)
            lay.addWidget(lb)
            self.lines[key] = lb
        self.advice = QLabel("")
        self.advice.setWordWrap(True)
        self.advice.setStyleSheet("color:#b0672a;")
        lay.addWidget(self.advice)
        row = QHBoxLayout()
        b = QPushButton("重新查公网 IP")
        b.clicked.connect(self.lookup_public)
        row.addWidget(b)
        g = QPushButton("📖 联机步骤（Tailscale / 手动转发）")
        g.clicked.connect(lambda: GuideDialog(self, net.port).exec())
        row.addWidget(g)
        row.addStretch(1)
        lay.addLayout(row)
        self.who = QLabel("")
        self.who.setWordWrap(True)
        lay.addWidget(self.who)
        cfg = house.app.cfg["house"]
        self.fix = QCheckBox("固定这个房间码（以后开房间邀请码都不变，发一次就行）")
        self.fix.setChecked(cfg.get("net_code") == net.code)
        self.fix.toggled.connect(self.set_fixed)
        lay.addWidget(self.fix)
        self.auto = QCheckBox("打开小屋时自动开房间（家里电脑长开房间用；配合 设置 → 常规 → 开机自启动）")
        self.auto.setChecked(bool(cfg.get("net_auto")))
        self.auto.toggled.connect(self.set_auto)
        lay.addWidget(self.auto)
        tip = QLabel("一个房间最多 %d 位客人，各自控制自己的角色。房主的电脑要一直开着小屋（别让它睡眠），"
                     "客人才能进来；关掉小屋或点“关闭房间”，房间就关了。" % len(GUEST_PIDS))
        tip.setWordWrap(True)
        lay.addWidget(tip)
        row = QHBoxLayout()
        row.addStretch(1)
        close = QPushButton("关闭房间")
        close.clicked.connect(lambda: (house.stop_net(), self.accept()))
        ok = QPushButton("好的")
        ok.clicked.connect(self.accept)
        row.addWidget(close)
        row.addWidget(ok)
        lay.addLayout(row)
        self.setMinimumWidth(640)
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.refresh)
        self.timer.start(500)
        self.refresh()
        self.adjustSize()
        QTimer.singleShot(50, self.lookup_public)

    def set_fixed(self, on):
        cfg = self.house.app.cfg["house"]
        net = self.house.net
        cfg["net_code"] = net.code if (on and net is not None) else ""
        self.house.app.save()

    def set_auto(self, on):
        cfg = self.house.app.cfg["house"]
        cfg["net_auto"] = bool(on)
        if on and self.house.net is not None:
            cfg["net_port"] = self.house.net.port
            if not self.fix.isChecked():
                self.fix.setChecked(True)          # a room that is always open wants an invite that never changes
        self.house.app.save()

    def refresh(self):
        net = self.house.net
        if net is None or net.is_client:
            self.timer.stop()
            return
        names = net.guest_names()
        self.who.setText(("👥 房间里：%s（%d/%d）" % ("、".join(names), len(names), len(GUEST_PIDS))) if names else
                         "👥 还没有客人进来")
        ts = tailscale_addresses()
        self.lines["ts"].setText("✅ Tailscale：%s（两边都装了 Tailscale 时最稳，校园网也能用）" % "、".join(ts) if ts else
                                 "⚪ Tailscale：没检测到（校园网 / 宿舍 / 公司网络推荐装上，见“联机步骤”）")
        self.lines["v6"].setText("✅ IPv6：%s（对方也有 IPv6 时可以直接连）" % net.v6[0] if net.v6 else
                                 "⚪ IPv6：这台电脑没有公网 IPv6")
        up = net.upnp
        if up is None:
            self.lines["upnp"].setText("⚪ 路由器自动端口映射：没有启动")
        else:
            mark = {"searching": "⏳", "mapped": "✅", "cgnat": "⚠️"}.get(up.state, "⚪")
            self.lines["upnp"].setText("%s 路由器自动端口映射：%s" % (mark, up.msg))
        if self.pub_ip:
            self.lines["pub"].setText("公网 IPv4：%s　端口 %d" % (self.pub_ip, net.port))
        elif self.pub_done:
            self.lines["pub"].setText("⚪ 没查到公网 IPv4（网络不通？）")
        else:
            self.lines["pub"].setText("⏳ 正在查公网 IPv4……")
        self.lines["lan"].setText("内网地址：%s（同一个 Wi-Fi 时用；手动做端口转发也填这个）" % lan_ip())
        inv = make_invite2(net.invite_hosts(self.pub_ip), net.port, net.code)
        if inv != self.shown_invite:
            self.shown_invite = inv
            self.inv.setText(inv)
            self.copy.setText("复制")
        cgnat = up is not None and up.state == "cgnat"
        if ts:
            self.advice.setText("")
        elif cgnat:
            self.advice.setText("这里是“大内网”（运营商 / 学校共用公网 IP），外面直接连不进来：请两边都装 Tailscale，"
                                "或者让对方来开房间。")
        elif up is not None and up.state in ("none", "error") and not net.v6:
            self.advice.setText("自动端口映射没成功、也没有 IPv6：可以先把邀请码发过去试试；连不上就按“联机步骤”"
                                "手动做端口转发，或者两边都装 Tailscale（最省事）。")
        else:
            self.advice.setText("")

    def lookup_public(self):
        if self.house.net is None:
            return
        self.nam = QNetworkAccessManager(self)
        reply = self.nam.get(QNetworkRequest(QUrl("https://api.ipify.org")))
        self.pub_done = False

        def done():
            ip = bytes(reply.readAll()).decode("ascii", "ignore").strip()
            if re.match(r"^\d+\.\d+\.\d+\.\d+$", ip):
                self.pub_ip = ip
            self.pub_done = True
            reply.deleteLater()
            self.refresh()
        reply.finished.connect(done)


class JoinDialog(QDialog):
    def __init__(self, house):
        super().__init__(house)
        self.house = house
        cfg = house.app.cfg["house"]
        self.setWindowTitle("加入别人的小屋")
        self.setStyleSheet(DIALOG_CSS)
        lay = QVBoxLayout(self)
        t = QLabel("粘贴对方发来的邀请码")
        t.setObjectName("title")
        lay.addWidget(t)
        self.invite = QLineEdit(cfg.get("net_last", ""))
        self.invite.setPlaceholderText("PAWPALS2:ABC123:47650:…  或  IP:端口 房间码")
        lay.addWidget(self.invite)
        row = QHBoxLayout()
        row.addWidget(QLabel("我的名字"))
        self.name = QLineEdit(cfg.get("net_name", "") or "")
        self.name.setPlaceholderText("好友")
        self.name.setMaxLength(12)
        row.addWidget(self.name, 1)
        lay.addLayout(row)
        tip = QLabel("加入后你看到的是对方的小屋，两只猫和家人大家一起照顾，都可以装修。\n"
                     "离开时自己的小屋会原样回来。\n"
                     "会自动依次尝试 Tailscale / 同一 Wi-Fi / IPv6 / 公网 IP。\n"
                     "都连不上的话，请房主看“联机步骤”；校园网 / 宿舍推荐两边都装 Tailscale。")
        tip.setWordWrap(True)
        lay.addWidget(tip)
        row = QHBoxLayout()
        row.addStretch(1)
        cancel = QPushButton("取消")
        cancel.clicked.connect(self.reject)
        ok = QPushButton("加入")
        ok.setDefault(True)
        ok.clicked.connect(self.go)
        row.addWidget(cancel)
        row.addWidget(ok)
        lay.addLayout(row)
        self.setMinimumWidth(520)
        self.adjustSize()

    def go(self):
        parsed = parse_invite(self.invite.text())
        if parsed is None:
            QMessageBox.information(self, "邀请码", "邀请码看不懂，请对方从“开房间”窗口里点“复制”再发一次。")
            return
        cfg = self.house.app.cfg["house"]
        cfg["net_last"] = self.invite.text().strip()
        cfg["net_name"] = self.name.text().strip()
        self.house.app.save()
        self.accept()
        self.house.join_net(*parsed, name=self.name.text().strip() or "好友")


class PortDialog(QDialog):
    def __init__(self, house):
        super().__init__(house)
        self.setWindowTitle("开房间")
        self.setStyleSheet(DIALOG_CSS)
        cfg = house.app.cfg["house"]
        lay = QVBoxLayout(self)
        t = QLabel("用这台电脑开一个房间")
        t.setObjectName("title")
        lay.addWidget(t)
        row = QHBoxLayout()
        row.addWidget(QLabel("我的名字"))
        self.name = QLineEdit(cfg.get("net_name", "") or "")
        self.name.setPlaceholderText("房主")
        self.name.setMaxLength(12)
        row.addWidget(self.name, 1)
        lay.addLayout(row)
        row = QHBoxLayout()
        row.addWidget(QLabel("端口"))
        self.port = QSpinBox()
        self.port.setRange(1024, 65535)
        self.port.setValue(int(cfg.get("net_port", DEFAULT_PORT) or DEFAULT_PORT))
        row.addWidget(self.port)
        row.addStretch(1)
        lay.addLayout(row)
        row = QHBoxLayout()
        row.addStretch(1)
        cancel = QPushButton("取消")
        cancel.clicked.connect(self.reject)
        ok = QPushButton("开房间")
        ok.setDefault(True)
        ok.clicked.connect(self.accept)
        row.addWidget(cancel)
        row.addWidget(ok)
        lay.addLayout(row)


def fill_menu(house, m, inline=False):
    """联机（两个人）: a submenu, or (inline) its items straight into m (the house's 🌐 联机 ▸)."""
    app = house.app
    nm = m if inline else app.styled_menu("联机（两个人）", m)
    if inline:
        app.add(nm, "两个人一起玩小屋", lambda: None, enabled=False)
    net = house.net
    if net is None:
        app.add(nm, "开房间（我当房主）…", lambda: open_room(house))
        app.add(nm, "加入房间…", lambda: JoinDialog(house).exec())
        app.add(nm, "联机步骤（Tailscale / 公网）…", lambda: GuideDialog(house, app.cfg["house"].get("net_port", DEFAULT_PORT)).exec())
    elif net.is_client:
        app.add(nm, net.status_text(), lambda: None, enabled=False)
        app.add(nm, "离开，回自己的小屋", house.stop_net)
    else:
        app.add(nm, net.status_text(), lambda: None, enabled=False)
        app.add(nm, "邀请码…", lambda: HostDialog(house).exec())
        app.add(nm, "关闭房间", house.stop_net)
    if not inline:
        m.addMenu(nm)


def open_room(house):
    d = PortDialog(house)
    if not d.exec():
        return
    cfg = house.app.cfg["house"]
    cfg["net_port"] = d.port.value()
    cfg["net_name"] = d.name.text().strip()
    house.app.save()
    if house.host_net(d.port.value()):
        HostDialog(house).exec()
