"""The 开始对战 dialog: arena (each has its own game), mode, who is on which team, who you play, how hard the AI is."""
from PySide6.QtWidgets import (QComboBox, QDialog, QDialogButtonBox, QGridLayout, QLabel, QPushButton, QSpinBox,
                               QTextBrowser, QVBoxLayout)

from . import house_arena_art as AA
from . import house_battle as HB
from . import house_games as HG
from . import house_pals as PL


class BattleDialog(QDialog):
    def __init__(self, parent, world, f=None, mode=None):
        super().__init__(parent)
        self.setWindowTitle("开始对战")
        self.world = world
        self.setMinimumWidth(520)
        lay = QVBoxLayout(self)
        top = QGridLayout()
        lay.addLayout(top)
        self.arena = QComboBox()
        for af, d in AA.ARENAS.items():
            g = HG.GAMES[d.get("game", "melee")]
            self.arena.addItem("%s %s · %s %s" % (d["icon"], d["name"], g["icon"], g["name"]), af)
        if f in AA.ARENAS:
            self.arena.setCurrentIndex(list(AA.ARENAS).index(f))
        self.desc = QLabel()
        self.desc.setWordWrap(True)
        self.desc.setStyleSheet("color:#7a6a5a")
        top.addWidget(QLabel("场地"), 0, 0)
        top.addWidget(self.arena, 0, 1)
        top.addWidget(self.desc, 1, 1)
        self.mode = QComboBox()
        top.addWidget(QLabel("模式"), 2, 0)
        top.addWidget(self.mode, 2, 1)
        self.diff = QComboBox()
        for key, d in HB.DIFFS.items():
            self.diff.addItem(d["name"], key)
        self.diff.setCurrentIndex(1)
        self.diff_l = QLabel("电脑难度")
        top.addWidget(self.diff_l, 3, 0)
        top.addWidget(self.diff, 3, 1)
        self.kos = QSpinBox()
        self.kos.setRange(1, 5)
        self.kos.setValue(HB.KO_TO_WIN)
        self.kos_l = QLabel("被击倒几次算输")
        top.addWidget(self.kos_l, 4, 0)
        top.addWidget(self.kos, 4, 1)
        lay.addWidget(QLabel("<b>谁上场</b>　<span style='color:#9a8a76'>每人可以带一只毛绒玩具当“灵宝”，"
                             "它会飘在身边自动帮忙（鼠标停在灵宝选项上看说明）</span>"))
        self.rows = []
        self.pals = {}
        grid = QGridLayout()
        lay.addLayout(grid)
        cands = [a for a in world.cats + world.people if not a.away]
        for i, a in enumerate(cands):
            lab = QLabel()
            lab.setWordWrap(True)
            grid.addWidget(lab, i, 0)
            cb = QComboBox()
            grid.addWidget(cb, i, 1)
            pc = QComboBox()
            pc.addItem("🎲 随机灵宝", "?")
            for name, spec in PL.PALS.items():
                pc.addItem("%s %s · %s" % (spec["icon"], name, spec["skill"]), name)
            pc.addItem("不带灵宝", "")
            pc.setToolTip("\n".join("%s %s（%s）：%s" % (sp["icon"], n, sp["skill"], sp["desc"]) for n, sp in PL.PALS.items()))
            grid.addWidget(pc, i, 2)
            self.pals[a.uid] = pc
            self.rows.append((a, cb, lab))
        self.me_l = QLabel("<b>我来控制</b>")
        lay.addWidget(self.me_l)
        self.me = QComboBox()
        self.me.addItem("不控制（看电脑打）", None)
        for a, cb, lab in self.rows:
            self.me.addItem(a.name, a.uid)
        lay.addWidget(self.me)
        self.tip = QLabel()
        self.tip.setWordWrap(True)
        self.tip.setStyleSheet("color:#7a6a5a")
        lay.addWidget(self.tip)
        bb = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        recb = bb.addButton("🏆 战绩与成就", QDialogButtonBox.ActionRole)
        recb.clicked.connect(self._records)
        self.okb = bb.button(QDialogButtonBox.Ok)
        self.okb.setText("⚔ 开打！")
        bb.button(QDialogButtonBox.Cancel).setText("取消")
        bb.accepted.connect(self._ok)
        bb.rejected.connect(self.reject)
        lay.addWidget(bb)
        self.warn = QLabel()
        self.warn.setStyleSheet("color:#c9443a")
        lay.addWidget(self.warn)
        self._want_mode = mode
        self.arena.currentIndexChanged.connect(self._arena)
        self.mode.currentIndexChanged.connect(self._mode)
        self._arena()
        me = world.house.my_agent() if getattr(world, "house", None) is not None else None
        if me is not None:
            self.me.setCurrentIndex(max(0, self.me.findData(me.uid)))
        elif self.rows:
            self.me.setCurrentIndex(1)

    def _records(self):
        from . import house_records as REC
        app = getattr(getattr(self.world, "house", None), "app", None)
        if app is None:
            return
        html = []
        for title, lines in REC.summary(app):
            html.append("<h3 style='color:#8a5a2a;margin:8px 0 4px'>%s</h3>" % title)
            html.append("<br>".join(lines))
        d = QDialog(self)
        d.setWindowTitle("战绩与成就")
        d.resize(480, 560)
        lay = QVBoxLayout(d)
        tb = QTextBrowser()
        tb.setHtml("".join(html))
        lay.addWidget(tb)
        ok = QPushButton("好的")
        ok.clicked.connect(d.accept)
        lay.addWidget(ok)
        d.exec()

    def game(self):
        return AA.ARENAS[self.arena.currentData()].get("game", "melee")

    def _arena(self):
        f = self.arena.currentData()
        g = self.game()
        gm = HG.GAMES[g]
        self.desc.setText(AA.ARENAS[f]["desc"])
        keep = self._want_mode or self.mode.currentData()
        self._want_mode = None
        self.mode.blockSignals(True)
        self.mode.clear()
        names = dict(HG.RACE_MODE_NAMES if g == "race" else HG.MODE_NAMES)
        names.update(HG.GAME_MODE_NAMES.get(g, {}))
        for key in gm["modes"]:
            self.mode.addItem(names[key], key)
        i = self.mode.findData(keep)
        self.mode.setCurrentIndex(i if i >= 0 else 0)
        self.mode.blockSignals(False)
        self.kos_l.setText(gm["ko"])
        lo, hi, dflt, suf = gm.get("kos", (1, 5, HB.KO_TO_WIN, " 圈" if g == "race" else " 次"))
        if (lo, hi) != (self.kos.minimum(), self.kos.maximum()) or getattr(self, "_kos_game", None) != g:
            self.kos.setRange(lo, hi)
            self.kos.setValue(dflt)
        self._kos_game = g
        self.kos.setSuffix(suf)
        for a, cb, lab in self.rows:
            if g == "melee":
                kit = HB.kit_of(a)
                sk = " / ".join(HB.SKILLS[s]["icon"] + HB.SKILLS[s]["name"] for s in HB.KITS[kit]["skills"])
                style = HB.KITS[kit]["style"]
            else:
                ch = HG.char_of(a)
                sks = HG.skills(g, ch)
                sk = " / ".join("%s %s%s" % (s["slot"], s["icon"], s["name"]) for s in sks)
                style = HG.CHARS[ch]["style"]
            lab.setText("%s　<span style='color:#9a8a76'>%s · %s</span>" % (a.name, style, sk))
        self.tip.setText(self.tips(g))
        self._mode()

    def tips(self, g):
        base = {"melee": "WASD 移动 · J 攻击（按住蓄力）· K 技能 · L 格挡（L+方向 翻滚）· 空格 跳 · E 拿 / 扔弹药。",
                "brawl": "A/D 走 · J 攻击（↑J 挑空、↓J 扫腿、空中 J 连击）· K / ↑K / ↓K 三个技能 · L 格挡（L+左右 瞬步）"
                         " · 空格 跳（二段跳）· E 抓投 · 怒气满了 J+K 放大招。",
                "bomb": "WASD 走格子 · J 放炸弹 · K 技能 · L 踢炸弹 · 空格 跳过炸弹 · E 被困时用针自救。",
                "shoot": "WASD 移动 · J 扔雪球（按住蓄力）· K 技能 · L 蹲下躲（L+方向 翻滚）· 空格 跳 · E 捏雪球。",
                "race": "A/D 跑 · 空格 跳（二段跳）· J 冲刺 · L 滑铲 · E 用道具 · K 技能。",
                "defend": "WASD 移动 · J 攻击（按住蓄力冲击波）· K 技能 · L+方向 翻滚 · 空格 跳 · E 在城堡旁修城堡。"
                          "大家都在一队，电脑难度就是怪的强弱。",
                "paint": "WASD 移动 · 按住 J 喷颜料 · K 技能 · 在自己颜色上按住 L 潜游补颜料 · E 颜料炸弹 · 空格 跳。",
                "soccer": "WASD 跑（碰到球就带球）· J 传球 / 按住射门 / 抢球 · L 铲球 · 空格 跳（头球）· E 冲刺 · K 技能。",
                "fish": "WASD 移动（走过鱼就捡）· J 拍（拍掉对手的鱼）· E 扔鱼进篮子 · 空格 跳（空中接鱼）· L+方向 翻滚 · K 技能。",
                "hide": "躲的人：走到家具旁按 E 躲进去；找的人：对着家具按 J 搜。K 是技能（躲和找各一个）· L+方向 冲刺。"
                        "这个玩法不带灵宝。",
                "volley": "A/D 跑 · 空格 跳 · J 击球（跳起来扣杀）· L 鱼跃扑救 · E 发球 · K 技能。"}[g]
        return base + " 开打前会有一张操作卡，对战中按 H 随时再看；第一次玩建议先选“🎓 训练场”。"

    def _mode(self):
        mode = self.mode.currentData()
        g = self.game()
        train = mode == "train"
        pals_ok = HG.GAMES.get(g, {}).get("pals", True)
        for wdg in [self.diff, self.diff_l, self.kos, self.kos_l, self.me, self.me_l] + list(self.pals.values()):
            wdg.setVisible(not train)
        for wdg in self.pals.values():
            wdg.setVisible(not train and pals_ok)
        self.diff_l.setText("怪的强弱" if g == "defend" else "电脑难度")
        self.okb.setText("🎓 开始训练" if train else ({"race": "🏁 开跑！", "defend": "🏰 守城堡！", "hide": "🙈 开始躲猫猫！",
                                                      "soccer": "⚽ 开球！", "volley": "🏐 开球！", "fish": "🐟 开抢！",
                                                      "paint": "🎨 开涂！"}.get(g, "⚔ 开打！")))
        for i, (a, cb, lab) in enumerate(self.rows):
            cb.blockSignals(True)
            cb.clear()
            cb.addItem("不上场", -1)
            if train:
                cb.addItem("我（学）", 0)
                cb.addItem("陪练" if g != "race" else "陪跑", 1)
            elif mode in ("ffa", "coop"):
                cb.addItem("上场", 0)
            else:
                cb.addItem("红队", 0)
                cb.addItem("蓝队", 1)
            cb.blockSignals(False)
        cats = [i for i, (a, cb, lab) in enumerate(self.rows) if a.is_cat]
        people = [i for i, (a, cb, lab) in enumerate(self.rows) if not a.is_cat]
        order = cats + people
        pick = {}
        if train:
            me = self.world.house.my_agent() if getattr(self.world, "house", None) is not None else None
            mi = next((i for i, (a, cb, lab) in enumerate(self.rows) if me is not None and a is me),
                      order[0] if order else None)
            if mi is not None:
                pick[mi] = 0
                mate = next((i for i in order if i != mi), None)
                if mate is not None:
                    pick[mate] = 1
        elif mode == "1v1":
            if len(order) >= 2:
                pick[order[0]], pick[order[1]] = 0, 1
        elif mode == "coop":
            for i in order[:3]:
                pick[i] = 0
        elif mode == "2v2":
            if len(cats) >= 2 and len(people) >= 2:
                pick[cats[0]], pick[people[0]] = 0, 0
                pick[cats[1]], pick[people[1]] = 1, 1
            else:
                pick = {i: k % 2 for k, i in enumerate(order[:4])}
        else:
            for i in order[:4]:
                pick[i] = 0
        for i, (a, cb, lab) in enumerate(self.rows):
            cb.setCurrentIndex(cb.findData(pick[i]) if i in pick else 0)

    def config(self):
        mode = self.mode.currentData()
        teams = []
        n = 0
        for a, cb, lab in self.rows:
            tm = cb.currentData()
            if tm is None or tm < 0:
                continue
            if mode == "ffa":
                tm = n
            n += 1
            pal = self.pals[a.uid].currentData() if mode != "train" else ""
            if not HG.GAMES.get(self.game(), {}).get("pals", True):
                pal = ""
            teams.append([a.uid, tm, pal])
        me = self.me.currentData()
        if mode == "train":
            me = next((t[0] for t in teams if t[1] == 0), None)
        return dict(f=self.arena.currentData(), teams=teams, me=me, mode=mode,
                    diff=self.diff.currentData(), kos=self.kos.value())

    def _ok(self):
        c = self.config()
        teams = c["teams"]
        if c["mode"] == "train":
            ok = sum(1 for t in teams if t[1] == 0) == 1 and sum(1 for t in teams if t[1] == 1) == 1
            msg = "训练场：选一个“我（学）”和一个“陪练”"
        elif c["mode"] == "ffa":
            ok = 2 <= len(teams) <= 4
            msg = "要 2 到 4 个人上场"
        elif c["mode"] == "coop":
            ok = 1 <= len(teams) <= 4
            msg = "要 1 到 4 个人上场"
        else:
            red = [t for t in teams if t[1] == 0]
            blue = [t for t in teams if t[1] == 1]
            if c["mode"] == "1v1":
                ok = len(red) == 1 and len(blue) == 1
                msg = "1 对 1：红队、蓝队各选一个"
            else:
                ok = 1 <= len(red) <= 2 and 1 <= len(blue) <= 2
                msg = "2 对 2：每队 1 到 2 个"
        if c["me"] and not any(t[0] == c["me"] for t in teams):
            ok = False
            msg = "你要控制的角色得上场"
        if not ok:
            self.warn.setText(msg)
            return
        self.accept()
