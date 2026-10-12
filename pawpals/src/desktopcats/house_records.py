"""战绩和成就 (v23): wins per game and character, a winning streak, and little achievements.

Stored in cfg["house"]["records"]:
  plays  {game: {char: [wins, matches]}}       every fighter, played by anyone or the computer
  me     {"wins", "matches", "streak", "best", "games_won": [...], "chars_won": [...], "pals_won": [...]}
  ach    {id: "YYYY-MM-DD"}
The result card shows "this character in this game: N wins / M matches" and any achievement just unlocked.
"""
import time

GAME_NAMES = {"brawl": "横版格斗", "bomb": "泡泡堂", "shoot": "雪球射击", "race": "屋顶竞速", "melee": "乱斗",
              "defend": "合作守家", "paint": "涂地占领", "soccer": "猫咪足球", "fish": "抢鱼大作战", "hide": "躲猫猫",
              "volley": "猫咪排球"}
ALL_GAMES = ("brawl", "bomb", "shoot", "race", "defend", "paint", "soccer", "fish", "hide", "volley")

# id: (icon, name, how to get it)
ACHIEVEMENTS = {
    "first_win": ("🥇", "第一场胜利", "赢下任意一场对战"),
    "streak3": ("🔥", "三连胜", "连续赢三场"),
    "streak5": ("🌟", "五连胜", "连续赢五场"),
    "matches10": ("🎮", "常客", "打满 10 场"),
    "matches50": ("🏟", "老玩家", "打满 50 场"),
    "combo10": ("👊", "十连击", "横版格斗里打出 10 连击"),
    "flawless": ("💯", "毫发无伤", "横版格斗里一次都没被击倒、血量九成以上赢下"),
    "trapper": ("🧶", "毛线大师", "泡泡堂一局里困住对手 3 次"),
    "sniper": ("❄", "神射手", "雪球射击一局里命中 20 次"),
    "racer": ("🏁", "屋顶飞人", "赢下一场屋顶竞速"),
    "all_games": ("🏆", "全能选手", "格斗、泡泡堂、雪球、竞速都赢过"),
    "all_chars": ("🐾", "谁都会", "用 3 个不同的角色赢过"),
    "pals": ("🧸", "灵宝收集家", "带着每一只灵宝都赢过一次"),
    "student": ("🎓", "好学生", "完成任意一个训练场"),
    "defender": ("🏰", "城堡守护者", "合作守家守住一次毛绒城堡"),
    "painter": ("🎨", "涂鸦大师", "涂地占领一局占到一半以上的地"),
    "hattrick": ("⚽", "帽子戏法", "猫咪足球一局自己进 3 个球"),
    "fishking": ("🐟", "鱼王", "抢鱼大作战一局自己送回 10 分"),
    "ghost": ("🙈", "隐身高手", "躲猫猫一整局一次都没被找到"),
    "spiker": ("🏐", "扣杀王", "猫咪排球一局扣杀得 3 分"),
    "all_games2": ("🎪", "十项全能", "十种玩法都赢过"),
}


def _store(app):
    rec = app.cfg["house"].setdefault("records", {})
    rec.setdefault("plays", {})
    rec.setdefault("me", {"wins": 0, "matches": 0, "streak": 0, "best": 0, "games_won": [], "chars_won": [],
                          "pals_won": []})
    rec.setdefault("ach", {})
    return rec


def _unlock(rec, aid, out):
    if aid in ACHIEVEMENTS and aid not in rec["ach"]:
        rec["ach"][aid] = time.strftime("%Y-%m-%d")
        out.append(aid)


def record(b, world, local_pid):
    """Host side, once when a match ends: everyone's plays, the local player's streak and achievements."""
    app = getattr(world, "app", None) or getattr(getattr(world, "house", None), "app", None)
    if app is None or getattr(b, "_recorded", False):
        return
    b._recorded = True
    rec = _store(app)
    res = b.result or {}
    g = b.GAME
    if b.train is not None:
        if res.get("text", "").startswith("训练完成") or b.train.get("done_t") is not None:
            new = []
            _unlock(rec, "student", new)
            _lines(b, rec, None, new)
        app.save()
        return
    winners = res.get("teams") or []
    for fi in b.fighters:
        row = rec["plays"].setdefault(g, {}).setdefault(fi.char, [0, 0])
        row[1] += 1
        if fi.team in winners and len(winners) == 1:
            row[0] += 1
    mine = [fi for fi in b.fighters if fi.ctrl == local_pid]
    for fi in mine:
        new = []
        won = len(winners) == 1 and fi.team in winners
        _me(rec, g, fi.char, getattr(fi, "pal", None), won, new)
        tally = getattr(fi, "tally", {}) or {}
        if g == "brawl" and getattr(fi, "max_combo", 0) >= 10:
            _unlock(rec, "combo10", new)
        if g == "brawl" and won and fi.kos == 0 and fi.hp >= fi.maxhp * 0.9:
            _unlock(rec, "flawless", new)
        if g == "bomb" and tally.get("trap", 0) >= 3:
            _unlock(rec, "trapper", new)
        if g == "shoot" and tally.get("hits", 0) >= 20:
            _unlock(rec, "sniper", new)
        if g == "defend" and won:
            _unlock(rec, "defender", new)
        if g == "paint" and getattr(b, "total", 0) and (getattr(b, "area", {}) or {}).get(fi.team, 0) * 2 >= b.total:
            _unlock(rec, "painter", new)
        if g == "soccer" and fi.score >= 3:
            _unlock(rec, "hattrick", new)
        if g == "fish" and getattr(fi, "delivered", 0) >= 10:
            _unlock(rec, "fishking", new)
        if g == "hide" and getattr(fi, "survived", 0) >= 1 and getattr(fi, "caught_n", 0) == 0:
            _unlock(rec, "ghost", new)
        if g == "volley" and tally.get("spike_point", 0) >= 3:
            _unlock(rec, "spiker", new)
        _lines(b, rec, fi, new)
    app.save()


def record_remote(b, world, me_uid):
    """Guest side: only what the result says (win or not), kept in the guest's own records."""
    app = getattr(world, "app", None) or getattr(getattr(world, "house", None), "app", None)
    if app is None or me_uid is None:
        return
    fi = next((f for f in b.fighters if f.uid == me_uid), None)
    if fi is None:
        return
    rec = _store(app)
    res = b.result or {}
    winners = res.get("teams") or []
    g = getattr(b, "game", "melee")
    row = rec["plays"].setdefault(g, {}).setdefault(fi.char, [0, 0])
    won = len(winners) == 1 and fi.team in winners
    row[1] += 1
    row[0] += 1 if won else 0
    new = []
    _me(rec, g, fi.char, getattr(fi, "pal", None), won, new)
    _lines(b, rec, fi, new)
    app.save()


def _me(rec, g, char, pal, won, new):
    me = rec["me"]
    me["matches"] = me.get("matches", 0) + 1
    if won:
        me["wins"] = me.get("wins", 0) + 1
        me["streak"] = me.get("streak", 0) + 1
        me["best"] = max(me.get("best", 0), me["streak"])
        for k, v in (("games_won", g), ("chars_won", char), ("pals_won", pal)):
            if v and v not in me.setdefault(k, []):
                me[k].append(v)
        _unlock(rec, "first_win", new)
        if me["streak"] >= 3:
            _unlock(rec, "streak3", new)
        if me["streak"] >= 5:
            _unlock(rec, "streak5", new)
        if g == "race":
            _unlock(rec, "racer", new)
        if {"brawl", "bomb", "shoot", "race"} <= set(me["games_won"]):
            _unlock(rec, "all_games", new)
        if len(set(me["chars_won"])) >= 3:
            _unlock(rec, "all_chars", new)
        if set(ALL_GAMES) <= set(me["games_won"]):
            _unlock(rec, "all_games2", new)
        if len(set(me["pals_won"])) >= 5:
            _unlock(rec, "pals", new)
    else:
        me["streak"] = 0
    if me["matches"] >= 10:
        _unlock(rec, "matches10", new)
    if me["matches"] >= 50:
        _unlock(rec, "matches50", new)


def _lines(b, rec, fi, new):
    """Text for the result card of the fighter fi (or the trainee)."""
    res = b.result if isinstance(b.result, dict) else None
    if res is None:
        return
    lines = []
    if fi is not None:
        from . import house_games as HG
        g = getattr(b, "game", "melee")
        w_, n = rec["plays"].get(g, {}).get(fi.char, [0, 0])
        me = rec["me"]
        s = "%s · %s：%d 胜 / %d 场" % (HG.CHARS.get(fi.char, {}).get("name", fi.char), GAME_NAMES.get(g, g), w_, n)
        if me.get("streak", 0) >= 2:
            s += " · 🔥 %d 连胜" % me["streak"]
        lines.append(s)
    if new:
        lines.append("解锁成就：" + "、".join(ACHIEVEMENTS[a][0] + " " + ACHIEVEMENTS[a][1] for a in new))
    key = fi.uid if fi is not None else "_train"
    res.setdefault("recs", {})[key] = lines
    b._my_recs = dict(getattr(b, "_my_recs", None) or {}, **{key: lines})


def summary(app):
    """[(title, [lines])] for the 战绩 window."""
    rec = _store(app)
    from . import house_games as HG
    out = []
    me = rec["me"]
    out.append(("我的战绩", ["一共 %d 场，赢了 %d 场，最长 %d 连胜" % (me.get("matches", 0), me.get("wins", 0),
                                                          me.get("best", 0))]))
    rows = []
    for g, chars in rec["plays"].items():
        for ch, (w_, n) in sorted(chars.items()):
            rows.append("%s · %s：%d 胜 / %d 场（%d%%）" % (GAME_NAMES.get(g, g), HG.CHARS.get(ch, {}).get("name", ch),
                                                       w_, n, round(100 * w_ / n) if n else 0))
    out.append(("各玩法、各角色（大家一起，电脑打的也算）", rows or ["还没有打过"]))
    got = rec["ach"]
    out.append(("成就 %d / %d" % (len(got), len(ACHIEVEMENTS)),
                [("%s %s　%s" % (ic, nm, ("✓ " + got[a]) if a in got else "（" + how + "）"))
                 for a, (ic, nm, how) in ACHIEVEMENTS.items()]))
    return out
