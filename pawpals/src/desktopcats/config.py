# -*- coding: utf-8 -*-
"""Constants, default settings, dialogue and config persistence."""

import copy
import json
import os
import sys

VERSION = "7.7.1"
VERSION_DATE = "2026-10-07 22:40"        # when this version was made (shown at start, in 关于)
IS_WIN = sys.platform.startswith("win")
IS_MAC = sys.platform == "darwin"

HOME = os.path.expanduser("~")
DATA_DIR = os.path.join(HOME, ".desktop_cats")
CONFIG_PATH = os.path.join(HOME, ".desktop_cats_v2.json")
LOCK_PORT = 47824      # only used to detect a still-running v2-v4

DEFAULT_NAMES = {"calico": "猫猫", "tabby": "咕咕"}
SIZES = {"小": 0.75, "中": 1.0, "大": 1.35, "特大": 1.7}
MODES = {"edge": "只在屏幕下沿", "full": "全屏自由走动"}
TALK_LEVELS = ["安静", "正常", "话多"]

# Power modes: frame rate, how often calm cats repaint, layer supersampling, extras, poll factor.
POWER = [
    dict(name="极省电", fps=8, calm=3, ss=1.0, critters=False, poll=4.0, activity=0.35,
         desc="几乎不占资源：8 帧，猫咪大多在睡觉或揣手，不出现小动物，后台检查放慢"),
    dict(name="省电", fps=15, calm=2, ss=1.25, critters=True, poll=2.0, activity=0.7,
         desc="15 帧，活动减少，后台检查较慢"),
    dict(name="均衡", fps=30, calm=2, ss=1.5, critters=True, poll=1.0, activity=1.0,
         desc="30 帧（默认），流畅且省资源"),
    dict(name="流畅", fps=40, calm=2, ss=1.5, critters=True, poll=0.8, activity=1.0,
         desc="40 帧，动作更顺滑"),
    dict(name="极致", fps=60, calm=1, ss=2.0, critters=True, poll=0.5, activity=1.1,
         desc="60 帧，画面最细腻，耗电最多"),
]

ACC_LABEL = {
    # head
    "bow": "蝴蝶结", "flower": "小花", "beanie": "毛线帽", "crown": "小皇冠", "party": "派对帽",
    "straw": "草帽", "headphones": "耳机", "glasses": "墨镜", "santa": "圣诞帽",
    "beret": "贝雷帽", "tophat": "小礼帽", "wizard": "魔法帽", "chef": "厨师帽", "cap": "鸭舌帽",
    "cowboy": "牛仔帽", "halo": "光环", "horns": "小恶魔角", "bunny": "兔耳发箍", "flowercrown": "花环",
    "leaf": "小叶子", "sakura": "樱花发夹", "roundglasses": "圆框眼镜", "monocle": "单片眼镜",
    "rainhat": "雨帽", "earmuffs": "耳罩", "star": "星星发夹", "cherry": "樱桃发夹",
    # body
    "bell": "铃铛项圈", "scarf": "围巾", "bowtie": "领结", "bandana": "三角巾", "cape": "小披风",
    "tie": "领带", "pearls": "珍珠项链", "lei": "花环项链", "bib": "小围兜", "raincoat": "小雨衣",
    "backpack": "小书包", "ribbon": "丝带项圈", "tag": "名牌项圈", "sweater": "小毛衣",
    "wings": "天使翅膀", "medal": "小奖牌", "sailor": "水手领",
}
ACC_HEAD = ["bow", "flower", "beanie", "party", "straw", "headphones", "glasses", "santa", "crown",
            "beret", "tophat", "wizard", "chef", "cap", "cowboy", "halo", "horns", "bunny", "flowercrown",
            "leaf", "sakura", "roundglasses", "monocle", "rainhat", "earmuffs", "star", "cherry"]
ACC_BODY = ["bell", "scarf", "bowtie", "bandana", "cape", "tie", "pearls", "lei", "bib", "raincoat",
            "backpack", "ribbon", "tag", "sweater", "wings", "medal", "sailor"]
ACC_SLOTS = {"any": "头上或身上（每次一件）", "head": "只戴在头上", "body": "只戴在身上", "both": "头上和身上各一件"}
LEVELS = [0, 20, 60, 150, 300, 600]           # affection needed for Lv.1 .. Lv.6
ACC_UNLOCK = {1: ["bow", "flower", "bell", "scarf", "beanie", "leaf", "ribbon", "cherry"],
              2: ["bowtie", "bandana", "party", "straw", "beret", "cap", "tag", "bib", "sakura"],
              3: ["headphones", "glasses", "santa", "roundglasses", "earmuffs", "tie", "lei", "star", "rainhat",
                  "raincoat"],
              4: ["crown", "cape", "tophat", "chef", "bunny", "flowercrown", "pearls", "backpack", "sweater"],
              5: ["wizard", "cowboy", "monocle", "horns", "sailor", "medal"],
              6: ["halo", "wings"]}

# coat colour presets: label -> overrides of art.DEFAULT_COLORS keys ({} = default)
COAT_PRESETS = {
    "calico": {
        "经典三花": {},
        "淡三花": {"orange": "#e9c79b", "black": "#8e99a6"},
        "橘白": {"black": "#d98a3a"},
        "奶牛": {"orange": "#3f3634"},
        "玳瑁": {"base": "#4b3b33", "back": "#43342d", "belly": "#5c473c", "muzzle": "#5e4a40",
                 "orange": "#c97a34", "black": "#231b18", "outline": "#1f1714"},
        "纯白": {"orange": "#f3ece1", "black": "#ece4d8"},
    },
    "tabby": {
        "棕虎斑": {},
        "银虎斑": {"base": "#b8bcc1", "back": "#8f9399", "stripe": "#2f3338", "belly": "#eef0f2",
                   "muzzle": "#f5f6f7", "outline": "#2c2f33"},
        "橘虎斑": {"base": "#e69d50", "back": "#cf7f36", "stripe": "#a95d1e", "belly": "#f7dfbd",
                   "muzzle": "#fbeedb", "outline": "#5a3417", "nose": "#e58c7c"},
        "蓝灰虎斑": {"base": "#8b939d", "back": "#6d7580", "stripe": "#454c56", "belly": "#d6dadf",
                     "muzzle": "#e7eaee", "outline": "#2b3036"},
        "奶油": {"base": "#ebd3aa", "back": "#ddba87", "stripe": "#c39761", "belly": "#fbf2e1",
                 "muzzle": "#fdf7ec", "outline": "#6b5132"},
        "黑猫": {"base": "#34302f", "back": "#2a2626", "stripe": "#1b1818", "belly": "#3e3938",
                 "muzzle": "#433d3c", "outline": "#0f0d0d", "earin": "#7a5c5e", "nose": "#5b4646",
                 "eye": "#e7b42a"},
    },
}
EYE_PRESETS = {"默认": None, "金黄": "#e8b524", "琥珀": "#d98a1f", "翠绿": "#79b43a", "湖蓝": "#57a6df",
               "古铜": "#c86b2a", "淡紫": "#a58bd9"}
BODY_SHAPES = {"标准": (1.0, 1.0), "圆滚滚": (1.12, 1.0), "大头": (1.0, 1.12), "小短腿": (1.06, 1.06)}
BUBBLES = {
    "奶油": dict(bg="#fffdfa", border="#e2d3c7", text="#4a3b36"),
    "樱花": dict(bg="#fff1f5", border="#f2bfd0", text="#7a3550"),
    "薄荷": dict(bg="#effaf4", border="#b9e0c9", text="#2f5b44"),
    "天蓝": dict(bg="#eef6ff", border="#b8d4f2", text="#284b72"),
    "柠檬": dict(bg="#fffbe6", border="#eedd94", text="#5e4d12"),
    "夜间": dict(bg="#2f2b3a", border="#4d465e", text="#f1ecff"),
}
BUBBLE_FONT = {"小": 12, "中": 13, "大": 15, "特大": 17}

# sound
VOICES = {
    "kitten": "小奶猫（尖细、短促）",
    "adult": "成年猫（自然）",
    "soft": "温柔（轻声、多呼噜和颤音）",
    "chirpy": "话痨（多颤音、咕噜声）",
    "purr": "只要呼噜（不喵叫）",
}
SOUND_EVENTS = {"meow": "说话时喵叫", "purr": "摸摸时呼噜", "trill": "打招呼时颤音", "hiss": "生气时哈气",
                "eat": "吃饭声", "chirp": "看见鸟时咔咔叫", "chime": "提醒和消息的提示音",
                "house": "小屋里的生活声（碗碟、开门、雨声、电视…）"}
SOUND_FREQ = {0: "偶尔", 1: "适中", 2: "经常"}
# how often the cats add the title ("爸爸，…") to lines that are said to you: (label, chance, cooldown s)
TITLE_FREQ = {0: ("很少", 0.08, 120), 1: ("偶尔", 0.2, 45), 2: ("经常", 0.4, 15)}
# dialogue keys that are said to the user (the cat may call you by your title)
USER_KEYS = ("seek", "beg", "hungry", "pet", "belly", "hover", "return", "user_idle", "remind", "happy",
             "morning", "noon", "afternoon", "evening", "night", "late", "eat_start", "eat_done", "wake",
             "focus_end", "break_end", "level_up", "ignored", "msg", "weather_morning", "rain_soon", "holiday",
             "hot", "cold", "play_done", "todo_nudge", "todo_today", "todo_overdue", "todo_high", "todo_soon",
             "todo_now", "todo_morning", "todo_done", "todo_all_done")

# message notifications: key -> (label, match keywords for Windows app ids / process names / macOS app names)
MSG_APPS = {
    "teams": ("Teams", ["teams"]),
    "outlook": ("Outlook", ["outlook", "olk.exe", "microsoft.outlook"]),
    "mail": ("邮件", ["windowscommunicationsapps", "microsoft.windowsmail", "mail"]),
    "wechat": ("微信", ["wechat", "weixin", "微信"]),
    "qq": ("QQ", ["tencent.qq", "qq.exe", "\\qq", "qq"]),
    "slack": ("Slack", ["slack"]),
    "telegram": ("Telegram", ["telegram"]),
    "discord": ("Discord", ["discord"]),
    "dingtalk": ("钉钉", ["dingtalk", "钉钉"]),
    "feishu": ("飞书", ["feishu", "lark", "飞书"]),
    "whatsapp": ("WhatsApp", ["whatsapp"]),
    "zoom": ("Zoom", ["zoom"]),
    "messages": ("信息", ["com.apple.messages", "messages", "信息"]),
}

DEFAULT_CFG = dict(
    launch="ask",                     # what to open at start: both / cats / todo / ask
    mode="edge", size="中", talk=1, seek=True, remind=True, remind_every=45, topmost=True,
    hide=dict(until=0, note="", last="45"),
    work=dict(on=False),
    hideseek=dict(freq="sometimes"),  # how often the cats hide by themselves (desktop and house): off/rare/sometimes/often              # 💼 工作模式: corners, out of the mouse's way, clicks go through   # 藏起来: until = epoch seconds, -1 = until called back, 0 = not hidden
    power=2, battery_save=True, night=True, night_sun=False, multiscreen=True,
    acc=dict(on=True, every=5, slot="any", all=True, off=[], pin={}, weather=True, festival=False),
    colors=dict(calico={}, tabby={}),
    look=dict(coat={}, eye={}, eye2={}, shape={}, bubble="奶油", font="中", shadow=True),
    sound=dict(on=False, voice="adult", volume=45, freq=1, quiet_night=True, quiet_focus=True,
               events=dict(meow=True, purr=True, trill=True, hiss=True, eat=True, chirp=True, chime=True, house=True)),
    toys=dict(yarn=False, box=False, critters=True, windows=False),
    focus=dict(work=25, short=5, long=15, every=4, quiet=True, badge=True, auto_next=False),
    focus_log={},
    reminders=[], ics="", ics_lead=10,
    msg=dict(on=True, apps=["teams", "outlook", "wechat", "qq", "slack", "telegram", "dingtalk", "feishu"],
             preview=False, run=True, focus_hold=True, tray=False),
    weather=dict(on=True, city="", unit="auto", morning=True, rain=True, extreme=True),
    holiday=dict(on=True, countries=""),
    user=dict(titles="爸爸, 妈妈", per_cat={}, freq=1),
    todo=dict(on=True, path="", exe="", every=45, morning=True, due=True, lead=10, praise=True),
    house=dict(on=False, geom=None, geom_all=None, items2=None, people=None, top=False, labels=True, mirror=True,
               mode="all", view=1, visitors="sometimes", food="dry", bubbles=True, holiday=True, leaves=True, outings="sometimes",
               visitors_book={}, gifts=[], wear=None),
    sys=dict(battery=True, cpu=True, net=True),
    link=dict(on=False, code="", cid="", nick="", status="", since="", log=[], peers={}),
    autohide=dict(fullscreen=True, apps=""),
    settings_geom=None, ui_font="中",
    affection=dict(calico=0, tabby=0),
    names={}, stats={}, saved_at=None,
)


def deep_merge(base, over):
    out = copy.deepcopy(base)
    for k, v in (over or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def load_cfg():
    try:
        with open(CONFIG_PATH, encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        data = {}
    # migrate older versions
    if not isinstance(data.get("sound", {}), dict):
        data["sound"] = {"on": bool(data["sound"])}
    for gone in ("watch", "ai"):
        data.pop(gone, None)
    cfg = deep_merge(DEFAULT_CFG, data)
    if not isinstance(cfg["size"], (int, float)) and cfg["size"] not in SIZES:
        cfg["size"] = "中"
    return cfg


def save_cfg(cfg):
    tmp = CONFIG_PATH + ".tmp"
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=1)
        os.replace(tmp, CONFIG_PATH)
    except Exception as ex:
        print("save config:", ex, file=sys.stderr)


def level_of(points):
    lv = 0
    for i, need in enumerate(LEVELS):
        if points >= need:
            lv = i + 1
    return lv


def unlocked_acc(level):
    out = []
    for lv, items in ACC_UNLOCK.items():
        if level >= lv:
            out += items
    return out


# --------------------------------------------------------------------------
# Dialogue. Each entry: {"any": [...], "calico": [...], "tabby": [...]}.
# {o} = the other cat's name; other placeholders are passed explicitly.
# --------------------------------------------------------------------------
LINES = {
    "idle": {
        "any": ["喵～", "发呆中…", "好无聊呀", "今天也是可爱的一天", "尾巴痒痒的", "嗯…刚才要干嘛来着",
                "数一数窗口…一、二、三…", "这里好舒服", "喵呜～", "想晒太阳", "听，有鸟叫！", "肉垫有点凉"],
        "calico": ["哼，本喵才不无聊", "今天的毛也很漂亮", "要保持优雅", "这个桌面…还行吧",
                   "罐罐什么时候到？", "我才不是在等你", "梳毛是一门艺术", "本喵今天心情不错"],
        "tabby": ["咕咕想吃小鱼干！", "有虫子吗？有吗有吗？", "想抓鸟！", "冲鸭！", "肚子咕咕叫…",
                  "咕咕今天跑了八圈！", "那边好像有好吃的", "要不要去探险？"],
    },
    "other": {"any": ["{o}在干嘛呢？", "{o}好可爱～", "我和{o}是好朋友", "{o}又在发呆", "等下找{o}玩"]},
    "other_sleep": {"any": ["{o}睡得好香", "嘘…{o}在睡觉", "{o}又睡着了", "我也想睡了…"]},
    "other_eat": {"any": ["{o}又在吃！", "给我留点！", "好香啊…"]},
    "hungry": {"any": ["饿了…喵", "饭饭呢？", "喵～要吃的", "肚子空空…", "想吃罐罐", "听到开罐头的声音了吗？"],
               "tabby": ["咕咕要饿扁了！", "小鱼干小鱼干！"], "calico": ["本喵饿了，快上菜", "开饭时间到了吧？"]},
    "sleepy": {"any": ["好困…", "眼皮好重…", "想睡觉了", "哈欠～"]},
    "night_sleepy": {"any": ["天黑了，好困…", "晚上就该睡觉嘛", "月亮出来了…"]},
    "happy": {"any": ["今天好开心！", "最喜欢{u}了", "嘿嘿～", "心情超好！", "生活真美好～"]},
    "pet": {"any": ["{u}的手好暖～", "呼噜呼噜～", "喵～", "再摸摸～", "咕噜～", "舒服～", "左边一点…对！"],
            "calico": ["哼…勉强让你摸", "只、只许摸一下", "手法还不错嘛"],
            "tabby": ["咕咕最喜欢被摸了！", "还要还要！", "摸头头～"]},
    "belly": {"any": ["摸肚肚～", "翻个肚皮～", "这是信任哦", "肚子给你摸"]},
    "annoyed": {"any": ["喵！别闹～", "够啦！", "哼！", "毛都乱了！"]},
    "seek": {"any": ["{u}在忙什么呀？", "在忙什么呀？", "陪我玩嘛～", "摸摸我！", "我来看看你在干嘛", "嘿嘿，找到你了",
                     "你在看什么？", "休息一下嘛～", "喵？"],
             "calico": ["本喵来视察工作", "看你辛苦，让你摸一下", "哼，才不是想你了"],
             "tabby": ["咕咕来啦！", "玩嘛玩嘛！", "带我一起！"]},
    "beg": {"any": ["{u}，饭饭～", "饿了～有饭饭吗？", "肚子饿了…", "喂我嘛～", "开饭了吗？"]},
    "ignored": {"any": ["{u}都不理我…", "哼，不理我…", "好吧…", "那我自己玩"],
                "calico": ["哼！不理你了", "本喵生气了"], "tabby": ["呜…", "咕咕自己玩去"]},
    "hover": {"any": ["喵？", "要摸摸吗？", "嗯？", "是你呀～", "手手好暖"]},
    "return": {"any": ["{u}回来啦！", "你回来啦！", "终于回来了！", "想你了！", "去哪了呀？"]},
    "user_idle": {"any": ["{u}？", "好安静…", "{u}睡着了吗？", "人呢？"]},
    "fast_mouse": {"any": ["那是什么？！", "好快！", "抓住它！", "别跑！"]},
    "remind": {"any": ["{u}，起来动一动～", "起来活动一下吧～", "喝口水吧！", "眼睛休息一下～", "坐太久啦，站起来走走", "看看远处吧～"]},
    "morning": {"any": ["{u}早上好！", "早上好呀！", "早安～今天也要加油", "早饭吃了吗？", "太阳出来啦"]},
    "noon": {"any": ["午饭时间到！", "该吃午饭啦～", "吃完饭要午睡哦"]},
    "afternoon": {"any": ["下午好困…", "来杯下午茶？", "下午也要加油"]},
    "evening": {"any": ["晚上好～", "晚饭吃什么？", "今天辛苦啦"]},
    "night": {"any": ["{u}早点睡吧", "夜深了，早点睡吧", "很晚了哦", "该休息啦～"]},
    "late": {"any": ["{u}怎么还不睡？！", "这么晚还不睡？！", "快去睡觉！", "熬夜会变成熊猫的"]},
    "land": {"any": ["喵！", "稳稳落地～", "吓死喵了", "十分！"]},
    "dragged": {"any": ["喵？！", "放我下来～", "喵呜！", "要去哪？", "好高！"]},
    "eat_start": {"any": ["开饭啦！", "吃饭饭～", "喵！", "谢谢{u}！"]},
    "eat_done": {"any": ["好吃！", "吃饱啦～", "嗝～", "还有吗？"]},
    "not_hungry": {"any": ["不饿～", "刚吃过啦", "吃不下了"]},
    "wake": {"any": ["唔…？", "谁叫我…", "再睡五分钟…"]},
    "greet_a": {"any": ["喵～", "嗨～", "喵喵！", "{o}！"]},
    "greet_b": {"any": ["喵呜～", "你好呀～", "喵！", "嗨嗨～"]},
    "snuggle": {"any": ["一起睡～", "挤一挤～", "暖暖的…"]},
    "share_ask": {"any": ["给我留一口～", "好香呀…", "分我一点嘛"]},
    "share_ok": {"any": ["就一口哦～", "好吧好吧", "给你留着呢"]},
    "follow": {"any": ["等等我～", "你去哪我去哪！", "带我一起！"]},
    "lead": {"any": ["跟上！", "走，去探险！", "这边这边～"]},
    "spar": {"any": ["看招！", "喵嗷！", "吃我一爪！", "来呀！"]},
    "stalk_hit": {"any": ["嘿嘿～抓到你了", "偷袭成功！", "哇哈哈！"]},
    "startle": {"any": ["喵！！", "吓死我了！", "哇啊！"]},
    "chase_start": {"any": ["站住！", "看招！", "喵嗷～", "别跑！"]},
    "caught": {"any": ["抓到啦！", "嘿嘿～", "该你了！"]},
    "tired": {"any": ["呼…呼…", "累了喵～", "跑不动了"]},
    "play": {"any": ["是什么？！", "嗷！", "喵？", "抓！"]},
    "play_done": {"any": ["好玩！", "还要玩～", "累了喵"]},
    # v4
    "acc_new": {"any": ["看我的{acc}！", "新{acc}～好看吗？", "今天戴{acc}！", "换上{acc}啦"]},
    "level_up": {"any": ["最喜欢{u}了！", "和你更亲近了！", "最喜欢你了～", "好感度提升！"]},
    "unlock": {"any": ["解锁了新装饰：{items}！"]},
    "focus_start": {"any": ["开始专注！我们会安静的", "加油！我在旁边陪你", "嘘…专注时间"]},
    "focus_end": {"any": ["专注完成！休息一下吧", "辛苦啦～伸个懒腰", "完成一个番茄！"]},
    "break_end": {"any": ["休息结束，继续加油！", "充好电了吗？"]},
    "next_round": {"any": ["要开始下一轮吗？右键→专注"]},
    "battery_low": {"any": ["电量只剩{pct}%了，要充电…", "快没电了…好饿…"]},
    "charging": {"any": ["充电啦～", "插上电了，满血复活！"]},
    "cpu_hot": {"any": ["电脑好烫…在拼命工作呢", "好热…要融化了", "风扇在呼呼转"]},
    "cpu_cool": {"any": ["凉快多了～", "电脑歇口气了"]},
    "net_down": {"any": ["网断了？", "咦，连不上网了"]},
    "net_up": {"any": ["网络恢复啦", "又能上网了～"]},
    "yarn": {"any": ["毛线球！", "嘿！", "看我的！", "滚远点～"]},
    "box_in": {"any": ["这是我的箱子！", "箱子最棒了", "嘿嘿～躲起来", "不许跟我抢"]},
    "box_envy": {"any": ["让我也进去！", "轮到我了吧？", "我也想要箱子…"]},
    "box_no": {"any": ["不要～", "我先来的！", "这是我的！"]},
    "box_yield": {"any": ["好吧，给你", "那你进来吧"]},
    "bird": {"any": ["咔咔咔…", "有鸟！", "好想抓…", "那只鸟好嚣张"]},
    "bug_caught": {"any": ["抓到虫子了！", "看我的战利品！", "嘿嘿，逮住了"]},
    "bug_miss": {"any": ["跑掉了…", "差一点！", "可恶！"]},
    "butterfly": {"any": ["蝴蝶！", "飞得好慢…抓！", "别跑～"]},
    "perch": {"any": ["这里视野真好", "站得高看得远", "窗户顶上好舒服", "我在这儿～"]},
    "perch_fall": {"any": ["哇啊！", "地震了？！", "掉下来了…"]},
    "laser": {"any": ["红点！！", "抓住它！", "别跑！", "又是你！"]},
    "wand": {"any": ["羽毛！", "喵嗷！", "抓到了！", "再来！"]},
    "reminder": {"any": ["提醒：{text}", "别忘了：{text}"]},
    # v5: messages, weather, holidays, play
    "msg": {"any": ["{app} 有新消息！", "叮～{app} 来消息啦", "{app} 找你！", "快看 {app}～"],
            "calico": ["{app} 有人找你，本喵帮你盯着呢"], "tabby": ["咕咕看到 {app} 在闪！"]},
    "msg_many": {"any": ["{app} 有 {n} 条新消息", "{app} 消息好多（{n} 条）！"]},
    "msg_held": {"any": ["专注的时候来了 {n} 条消息：{apps}", "刚才有 {n} 条消息哦（{apps}）"]},
    "weather_now": {"any": ["现在{desc}，{temp}", "外面{desc}，{temp}"]},
    "weather_morning": {"any": ["今天{desc}，{lo}~{hi}{rain}", "天气预报：{desc}，{lo}~{hi}{rain}"]},
    "rain_soon": {"any": ["一会儿要下雨了，出门记得带伞！", "快下雨了…{p}% 的概率", "要下雨啦，衣服收了吗？"]},
    "rain_now": {"any": ["下雨了～", "听，外面在下雨", "下雨天最适合睡觉了"]},
    "snow_now": {"any": ["下雪啦！", "外面白白的～", "好想去踩雪"]},
    "hot": {"any": ["好热…{temp}", "热到融化了…多喝水", "今天 {temp}，别中暑哦"]},
    "cold": {"any": ["好冷…{temp}", "冷冷冷，穿厚点！", "今天 {temp}，要戴围巾"]},
    "weather_outfit": {"any": ["换上{acc}啦，应景吧？", "天气这样，就穿{acc}～"]},
    "holiday": {"any": ["今天是{name}，节日快乐！", "{name}快乐～", "今天{name}，放假了吗？"]},
    "holiday_tomorrow": {"any": ["明天是{name}哦～", "明天{name}，有安排吗？"]},
    "play_rest": {"any": ["歇一下…", "呼…喘口气", "等等，马上回来！"]},
    "play_stop": {"any": ["不玩啦？", "好玩！下次再来", "累了喵～"]},
    # v5.1: DeskTodo
    "todo_nudge": {"any": ["「{t}」做了吗？", "别忘了「{t}」哦", "记得「{t}」～", "「{t}」还没打勾呢"],
                   "calico": ["本喵提醒你：「{t}」"], "tabby": ["咕咕记得「{t}」还没做！"]},
    "todo_today": {"any": ["「{t}」今天要做完哦", "今天的「{t}」别忘啦", "「{t}」是今天的！"]},
    "todo_overdue": {"any": ["「{t}」已经过期了…", "「{t}」拖了好久啦", "过期的「{t}」还在等你"]},
    "todo_high": {"any": ["「{t}」很重要哦", "重要的事：「{t}」"]},
    "todo_soon": {"any": ["「{t}」还有 {m} 分钟", "{m} 分钟后：「{t}」", "快到时间了：「{t}」"]},
    "todo_now": {"any": ["「{t}」到时间啦！", "该「{t}」了！", "现在：「{t}」"]},
    "todo_morning": {"any": ["今天有 {n} 件待办～", "今天要做 {n} 件事哦", "今日待办 {n} 件，加油！"]},
    "todo_morning_list": {"any": ["先做：{list}", "有：{list}", "{list}"]},
    "todo_overdue_count": {"any": ["还有 {n} 件过期的…", "另外 {n} 件已经过期了"]},
    "todo_done": {"any": ["「{t}」完成啦，真棒！", "又搞定一件：「{t}」", "「{t}」打勾了！好厉害", "完成「{t}」！奖励摸摸～"]},
    "todo_all_done": {"any": ["今天的待办全做完了！", "全部完成！可以休息啦～"]},
    "todo_none": {"any": ["现在没有要提醒的待办～", "待办都清空啦！"]},
    "todo_open_fail": {"any": ["待办好像没开着…", "找不到待办喵"]},
}

CHATS = [
    {"lines": ["你更喜欢{u}还是罐罐？", "…都喜欢！", "我也是～"]},
    {"lines": ["{u}今天回来得好晚", "我们去门口等吧"], "then": "seek"},
    {"lines": ["{o}，你看见我的小鱼干了吗？", "没…没有啊", "你嘴边有鱼渣！", "嘿嘿～"], "then": "chase"},
    {"lines": ["今天的罐罐好吃吗？", "超好吃！还想再来一罐", "{u}快开罐罐！"]},
    {"lines": ["{o}，来比赛跑步吧！", "好呀，输的人洗碗！"], "then": "chase"},
    {"lines": ["你的毛好软呀", "嘿嘿，我每天都有舔毛哦"], "then": "nuzzle"},
    {"lines": ["外面好像有鸟！", "哪里哪里？！", "骗你的～", "哼！"], "then": "chase"},
    {"lines": ["好困哦…", "我也是…", "那一起睡吧"], "then": "sleep"},
    {"lines": ["{u}今天摸了你几次？", "三次！", "我四次！哼～"]},
    {"lines": ["你说{u}在干嘛？", "好像在工作…", "我们去看看！"], "then": "seek"},
    {"lines": ["喵？", "喵喵！", "喵～喵～", "喵！"]},
    {"lines": ["{o}，你是不是胖了", "才没有！是毛多！"], "then": "spar"},
    {"lines": ["打一架吗？", "来呀！"], "then": "spar"},
    {"lines": ["你头上有片叶子", "帮我舔掉嘛～"], "then": "groom"},
    {"lines": ["我今天抓到一只虫子！", "真的吗？好厉害！", "（其实是线头）"]},
    {"lines": ["你最喜欢什么？", "罐罐！你呢？", "我最喜欢你～"], "then": "nuzzle"},
    {"lines": ["{o}，你会抓老鼠吗？", "会！…大概吧", "我也没见过老鼠"]},
    {"lines": ["{u}的键盘好暖和", "下次一起去躺！"]},
    {"lines": ["今天天气真好", "适合晒太阳～"], "weather": "clear"},
    {"lines": ["外面在下雨…", "那我们就在家睡觉吧", "好主意"], "then": "sleep", "weather": "rain"},
    {"lines": ["下雪了！", "想出去玩雪！", "爪子会冻住的…"], "weather": "snow"},
    {"lines": ["好热啊…", "趴着不动就不热了"], "weather": "hot"},
    {"lines": ["好冷…", "挤一挤就暖和了"], "then": "nuzzle", "weather": "cold"},
    {"lines": ["你听到了吗？", "什么？", "开罐头的声音！", "在哪在哪？！"], "then": "seek"},
    {"lines": ["{o}，你尾巴好长", "你的也很漂亮呀"], "then": "nuzzle"},
    {"lines": ["你做梦会梦见什么？", "梦见好多好多小鱼干", "我梦见{u}陪我玩"]},
    {"lines": ["我们是不是世界上最可爱的猫？", "那当然！"]},
    {"lines": ["{o}，你在想什么？", "在想晚饭吃什么…", "我也是！"]},
    {"lines": ["你的装饰好好看", "嘿嘿，{u}给的～"]},
    {"lines": ["那个纸箱是谁的？", "先到先得！"], "then": "chase"},
    {"lines": ["{u}今天好像很忙", "那我们安静一点吧", "嗯…就一点点"]},
]
