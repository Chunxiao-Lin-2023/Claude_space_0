/* 地点。exits: { 按钮文字: 地点 }，必须双向（build.py 检查）。open: 剧情标记，没有就一直开放。 */
const AREAS = {
  park: { name: '新世纪乐园', sub: '九江西郊 · 你的恐怖屋在这里', art: 'park' }, pingan: { name: '平安公寓', sub: '从前叫富安公寓', art: 'woods', open: 'a_pingan' },
  xicheng: { name: '西城私立学院', sub: '封停四年的废校', art: 'school', open: 'a_xicheng' }, muyang: { name: '暮阳中学', sub: '周边已经是一片荒地', art: 'school', open: 'a_muyang' },
  haiming: { name: '海明公寓', sub: '303 再也没有租出去过', art: 'apt', open: 'a_haiming' }, kangfu: { name: '第三精神疾病康复中心', sub: '偏远郊区 · 四五年前封停', art: 'ward', open: 'a_kangfu' }
};
const PLACES = {
  /* —— 新世纪乐园 —— */
  pk_gate: { name: '乐园广场', area: 'park', x: 1, y: 3, art: 'park', town: 1, exits: { '北 · 恐怖屋': 'hh_door', '东 · 小卖部': 'pk_shop', '西 · 管理处': 'pk_office' },
    d: '旋转木马转得很慢，摩天轮有一格的灯坏了很久。新世纪乐园还撑着，游客一年比一年少。', dn: '乐园关了门，摩天轮的轮廓压在夜色里。只有保安亭亮着一盏灯。' },
  pk_shop: { name: '小卖部', area: 'park', x: 2, y: 3, art: 'shop', town: 1, shop: 1, exits: { '西 · 广场': 'pk_gate' }, d: '货架上的面包和功能饮料都落了一点灰。老板娘认识你——你是整个乐园里欠水电费最久的人。', dn: '卷帘门拉下一半，里面还亮着灯。老板娘在看电视剧。' },
  pk_office: { name: '综合管理处', area: 'park', x: 0, y: 3, art: 'office', town: 1, exits: { '东 · 广场': 'pk_gate' }, d: '墙上贴着各个项目的营业额排名，恐怖屋的名字在最后一行，用红笔圈了出来。', dn: '管理处锁了门。玻璃上贴着一张催缴单，抬头是你的名字。' },
  hh_door: { name: '恐怖屋门口', area: 'park', x: 1, y: 2, art: 'house', town: 1, exits: { '南 · 广场': 'pk_gate', '进门 · 一楼': 'hh_hall' }, d: '不透光的黑帘子，生锈的铁栅栏，门边立着警示牌：有心血管疾病者禁止参观。宣传单被风吹乱，你捡了块石头压住。', dn: '关了灯的恐怖屋，比营业的时候更像一座恐怖屋。' },
  hh_hall: { name: '一楼走廊', area: 'park', x: 1, y: 1, art: 'hall', town: 1, exits: { '出门': 'hh_door', '东 · 员工休息室': 'hh_rest', '西 · 道具间': 'hh_prop', '北 · 卫生间': 'hh_wc', '上楼 · 二楼': 'hh_2f', '下楼 · 地下': 'hh_park' },
    d: '为了省电，走廊的灯只开了一半。人偶靠墙站着，你认得每一个——大半是你做的。', dn: '你熟悉这鬼屋的每一个地方，不开灯也不会碰到什么东西。但今晚，好像多了点什么。' },
  hh_rest: { name: '员工休息室', area: 'park', x: 2, y: 1, art: 'room', town: 1, bed: 1, exits: { '西 · 走廊': 'hh_hall', '北 · 总控制室': 'hh_ctrl' }, d: '一张单人床，一个上锁的抽屉，门框上面藏着第二把钥匙。你就住在这里。', dn: '床边趴着一个布偶，半边身子躲在床下面，不知道一个人在玩些什么。' },
  hh_ctrl: { name: '总控制室', area: 'park', x: 2, y: 0, art: 'ctrl', town: 1, exits: { '南 · 休息室': 'hh_rest' }, d: '监控屏幕、声控台、特效道具的远程开关，全挤在这间小屋子里。', dn: '监控画面一格一格地跳。有一格里，走廊尽头站着个人——再看，没有了。' },
  hh_prop: { name: '道具间', area: 'park', x: 0, y: 1, art: 'prop', town: 1, exits: { '东 · 走廊': 'hh_hall' }, d: '人造血浆、皮料、粗线、半截人头模型。你大学学的是玩具设计，这里的东西很多是你自己画图做的。', dn: '架子上的人头模型朝着门。你记得走的时候，它们是朝着墙的。' },
  hh_wc: { name: '一楼卫生间', area: 'park', x: 1, y: 0, art: 'wc', town: 1, exits: { '南 · 走廊': 'hh_hall' }, d: '狭窄，洗手池上有一面镜子。水龙头拧紧了，还是滴答滴答个不停。', dn: '镜子里的隔间门，颜色好像不太对。你没有回头确认。' },
  hh_2f: { name: '二楼 · 冥婚', area: 'park', x: 1, y: -1, art: 'wedding', town: 1, exits: { '下楼 · 一楼': 'hh_hall', '上楼 · 三楼': 'hh_3f' }, d: '仿古四合院：抄手游廊，垂花帘，如意门。正房里一架漆木棺，白纸贴着大大的喜字，两边各跪一排纸人。', dn: '魂幡不动，纸钱不飞。纸人的脸都朝着你进来的方向。' },
  hh_3f: { name: '三楼', area: 'park', x: 1, y: -2, art: 'attic', town: 1, exits: { '下楼 · 二楼': 'hh_2f' }, d: '堆着各种被淘汰的道具，大部分是父母经营时留下的。最里面有一个你很久没打开过的木箱。', dn: '错综的通道，烧焦的屋顶，随处可见疤痕一样的刀痕。这里现在叫“午夜逃杀”。' },
  hh_park: { name: '地下停车场', area: 'park', x: 1, y: 4, art: 'parking', town: 1, open: 'parking', exits: { '上楼 · 一楼': 'hh_hall' }, d: '整个地下停车场都是你的场地了。手机在这里扩建出一截楼梯——往下，是以后的事。', dn: '车位线还在，车早就没有了。很适合再放点什么。' },
  /* —— 平安公寓 —— */
  pa_road: { name: '林间土路', area: 'pingan', x: 0, y: 3, art: 'woods', exits: { '北 · 公寓院子': 'pa_yard' }, d: '长满野草的土路歪歪斜斜伸进树林，没有路灯。隔着稀疏的树杈，能看到一栋深灰色的建筑。', dn: '同上，只是更黑。你是骑共享单车来的。' },
  pa_yard: { name: '公寓院子', area: 'pingan', x: 0, y: 2, art: 'apt', exits: { '南 · 土路': 'pa_road', '进楼 · 一楼': 'pa_1f', '东 · 密林': 'pa_woods' }, d: '主楼三层，旁边一个仓库、一个水房。大门很破，锁倒是挺新。铁门边贴着一张寻人启事。', dn: '整栋楼只有一两扇窗亮着。每扇亮着的窗后面，都像有人在往下看。' },
  pa_1f: { name: '一楼', area: 'pingan', x: 0, y: 1, art: 'corridor', exits: { '出楼': 'pa_yard', '上楼 · 二楼': 'pa_2f' }, d: '一个女人住在这层，对面是个纹身的男人。你敲门，门只开半指宽。', dn: '防盗门从里面锁上了。' },
  pa_2f: { name: '二楼走廊', area: 'pingan', x: 0, y: 0, art: 'corridor', exits: { '下楼 · 一楼': 'pa_1f', '西 · 208': 'pa_208', '上楼 · 三楼': 'pa_3f' }, d: '只有一个楼道口，还靠着右侧，所以左边的走廊显得格外幽长。房东住在最深处。', dn: '声控灯灭了。你没有咳嗽，不想让它亮。' },
  pa_208: { name: '208 房', area: 'pingan', x: -1, y: 0, art: 'room', bed: 1, exits: { '东 · 走廊': 'pa_2f' }, d: '五十块一晚。家具落满灰，床单受潮。隔壁就是房东，电视开得很响，全是广告。', dn: '你出门时在锁眼里放了一根头发。' },
  pa_3f: { name: '三楼', area: 'pingan', x: 0, y: -1, art: 'burnt', exits: { '下楼 · 二楼': 'pa_2f' }, d: '这一层没有翻修过，到处是焚烧的痕迹。杂物和垃圾混在一起，里面埋着几个布偶。', dn: '走廊最深处，杂物堆后面挂着一张布帘。' },
  pa_woods: { name: '密林', area: 'pingan', x: 1, y: 2, art: 'woods', exits: { '西 · 院子': 'pa_yard', '东 · 后山木屋': 'pa_hut' }, d: '公寓被一片密林包着。白天还好。', dn: '衣服被树杈挂烂，分不出东西南北。连虫鸣都很少。' },
  pa_hut: { name: '后山木屋', area: 'pingan', x: 2, y: 2, art: 'hut', exits: { '西 · 密林': 'pa_woods' }, d: '像护林员住的地方。门没锁，一股怪味。', dn: '床底下塞满了女人的衣服，从来没洗过。' },
  /* —— 西城私立学院 —— */
  xc_gate: { name: '校门', area: 'xicheng', x: 0, y: 2, art: 'school', exits: { '西 · 女生宿舍': 'xc_dorm', '北 · 操场': 'xc_field', '东 · 办公楼': 'xc_office' }, d: '锁链和围栏锈在了一起。', dn: '出租车飞也似的开走了。十几秒后，周围近百米陷入死寂。黑暗里伫立着几栋建筑，像几个守夜人。' },
  xc_dorm: { name: '女生宿舍', area: 'xicheng', x: -1, y: 2, art: 'corridor', exits: { '东 · 校门': 'xc_gate' }, d: '玻璃门锁着。', dn: '走廊两边的门都关得严严实实。正中间，放着一把背对寝室门的椅子。廊灯碎了，电线垂下来。' },
  xc_field: { name: '操场', area: 'xicheng', x: 0, y: 1, art: 'field', exits: { '南 · 校门': 'xc_gate', '北 · 活动中心': 'xc_center' }, d: '长满荒草。', dn: '风里夹着细如牛毛的雨丝。操场另一头，有一栋孤零零的楼。' },
  xc_center: { name: '艺术生活动中心', area: 'xicheng', x: 0, y: 0, art: 'corridor', exits: { '南 · 操场': 'xc_field', '上楼 · 四楼舞蹈室': 'xc_dance' }, d: '一楼画室，两排石膏模型。', dn: '二楼走廊中间也放着一把椅子——带靠背的，不是这里的东西。三四楼之间立着一块木板：禁止入内。' },
  xc_dance: { name: '舞蹈室', area: 'xicheng', x: 0, y: -1, art: 'dance', exits: { '下楼 · 活动中心': 'xc_center' }, d: '时间把这里遗忘了。', dn: '六米长的落地镜。镜子正中间，摆着三把椅子。' },
  xc_office: { name: '办公楼 · 体育器材室', area: 'xicheng', x: 1, y: 2, art: 'room', exits: { '西 · 校门': 'xc_gate' }, d: '门上贴着封条。', dn: '柜子后面有一张单人床。' },
  /* —— 暮阳中学 —— */
  my_road: { name: '荒地土路', area: 'muyang', x: 0, y: 3, art: 'woods', exits: { '北 · 校园': 'my_yard' }, d: '路两边全是奇形怪状的树，长到了路上。', dn: '出租车只肯送到这里。雨越下越急。走了三十分钟，看见几块被推倒的标牌。' },
  my_yard: { name: '校园', area: 'muyang', x: 0, y: 2, art: 'school', exits: { '南 · 土路': 'my_road', '西 · 宿舍楼': 'my_dorm', '北 · 教学楼': 'my_teach', '东 · 办公楼': 'my_office', '后山': 'my_hill' }, d: '教学楼，两层的宿舍楼，两层的办公楼。', dn: '下雨的夜晚格外黑，唯一的光源是你的手电。围栏近期有人翻动过。' },
  my_dorm: { name: '宿舍楼二楼', area: 'muyang', x: -1, y: 2, art: 'dorm', exits: { '东 · 校园': 'my_yard' }, d: '住校的人少，一共没几个房间。', dn: '第四间寝室中间并排摆着四把椅子，椅子上放着纸和笔。' },
  my_teach: { name: '教学楼', area: 'muyang', x: 0, y: 1, art: 'corridor', exits: { '南 · 校园': 'my_yard', '上楼 · 三楼厕所': 'my_wc', '尽头 · 最后一间教室': 'my_last' }, d: '一间间空教室。', dn: '深夜经过一间间空荡荡的教室。你很怕往里一看，里面坐着人。' },
  my_wc: { name: '三楼厕所', area: 'muyang', x: 0, y: 0, art: 'toilet', exits: { '下楼 · 教学楼': 'my_teach' }, d: '六个隔间。', dn: '六个隔间的门全关着，像每一个里面都躲着人。' },
  my_last: { name: '最后一间教室', area: 'muyang', x: 1, y: 1, art: 'classroom', exits: { '出去 · 走廊': 'my_teach' }, d: '大火没有烧到这里，桌椅近乎完好。', dn: '正中间那张课桌上刻满了字，每一笔都用尽了全力。' },
  my_office: { name: '办公楼 · 数学组', area: 'muyang', x: 1, y: 2, art: 'office', exits: { '西 · 校园': 'my_yard' }, d: '地上扔着一块掉了色的牌子：数学组。', dn: '一个卡通画册，一盒蜡笔。整本都在画同一个场景。' },
  my_hill: { name: '后山', area: 'muyang', x: 0, y: 4, art: 'woods', open: 'my_hill', exits: { '回校园': 'my_yard' }, d: '土山。', dn: '她只记得一个大致的范围。' },
  /* —— 海明公寓 —— */
  hm_door: { name: '海明公寓楼下', area: 'haiming', x: 0, y: 1, art: 'apt', exits: { '上楼 · 三楼': 'hm_3f' }, d: '很普通的老公寓。', dn: '午夜之前要到。楼道里的灯一层亮，一层不亮。' },
  hm_3f: { name: '三楼走廊', area: 'haiming', x: 0, y: 0, art: 'corridor', exits: { '下楼': 'hm_door', '303': 'hm_303' }, d: '301 住着个大叔，302 是个年轻人。', dn: '301 的电视音量突然放大了。' },
  hm_303: { name: '303 房', area: 'haiming', x: 1, y: 0, art: 'room', exits: { '出去 · 走廊': 'hm_3f' }, d: '死过人以后，再也没有租出去。', dn: '卫生间的镜子正对着卧室的门。卧室没有门。' },
  /* —— 康复中心 —— */
  kf_gate: { name: '康复中心大门', area: 'kangfu', x: 0, y: 3, art: 'ward', exits: { '进去 · 第一病栋': 'kf_b1' }, d: '打着公立旗号的私人医院。', dn: '刘刀的人在外面扎了帐篷。三栋病楼品字排开，第三栋在最里面，背阴。' },
  kf_b1: { name: '第一病栋', area: 'kangfu', x: 0, y: 2, art: 'wardhall', exits: { '出去 · 大门': 'kf_gate', '二楼连廊 · 第二病栋': 'kf_b2' }, d: '普通病区。', dn: '一楼所有房间的门都开着。护士站里放着两个钢筋焊的铁笼，像狗市里的那种。' },
  kf_b2: { name: '第二病栋 · 洗衣间', area: 'kangfu', x: 1, y: 2, art: 'laundry', exits: { '连廊 · 第一病栋': 'kf_b1', '铁门 · 第三病栋': 'kf_b3' }, d: '霉味。', dn: '霉味冲淡了病栋本身的臭味。被子下面，三个铁笼成品字摆着。' },
  kf_b3: { name: '第三病栋 · 三楼', area: 'kangfu', x: 2, y: 2, art: 'wardhall', exits: { '铁门 · 第二病栋': 'kf_b2', '院长办公室': 'kf_dean', '下楼 · 一楼': 'kf_b3_1', '上楼 · 四楼': 'kf_b3_4' }, d: '封闭病区。', dn: '走廊中间扔着很多被褥，一个个鼓起来，像坟包。护士站的药品摆得整整齐齐。' },
  kf_dean: { name: '院长办公室', area: 'kangfu', x: 3, y: 2, art: 'office', exits: { '出去 · 三楼': 'kf_b3' }, d: '里间有一个被警方封起来的衣柜。', dn: '地上散着病例单。抽屉里有四封寄出去、又回到这里的信。' },
  kf_b3_1: { name: '第三病栋 · 一楼', area: 'kangfu', x: 2, y: 3, art: 'doorhall', exits: { '上楼 · 三楼': 'kf_b3', '三号病房的门': 'kf_inside' }, d: '十间病室，九个病人。', dn: '臭味到了刺鼻的地步。十号是特制的铁门。三号病房的门，在渗东西。' },
  kf_b3_4: { name: '第三病栋 · 四楼', area: 'kangfu', x: 2, y: 1, art: 'wardhall', exits: { '下楼 · 三楼': 'kf_b3' }, d: '空的。', dn: '他是有目的地把你往这里引。' },
  kf_inside: { name: '门后', area: 'kangfu', x: 3, y: 3, art: 'inside', open: 'inside', exits: { '门': 'kf_b3_1', '三号病房': 'kf_in3' }, d: '——', dn: '血红色的病栋。被褥和假人都不见了，像一直有专人在清扫。这里很安静。千万不要开口说话。' },
  kf_in3: { name: '门后 · 三号病房', area: 'kangfu', x: 4, y: 3, art: 'inside', open: 'in3', exits: { '回走廊': 'kf_inside' }, d: '——', dn: '一张小床。床上的人在呼吸，很轻，很慢。' }
};
function placeOpen(id) { const p = PLACES[id]; if (!p) return false; const a = AREAS[p.area]; return (!p.open || !!C.f[p.open]) && (!a.open || !!C.f[a.open]); }

/* 人物：seal = 印章名牌的阵营底色。at 可以是函数。from/to = 在场的剧情区间（含 from，不含 to） */
const NPCS = {
  xuwan: { name: '徐婉', title: '兼职员工', seal: 'park', at: 'hh_door' }, xushu: { name: '徐叔', title: '乐园管理员', seal: 'park', at: 'pk_office' }, luo: { name: '罗董', title: '乐园董事', seal: 'park', at: 'pk_office', from: 'q_parking' },
  shop: { name: '老板娘', title: '小卖部', seal: 'park', at: 'pk_shop' }, heshan: { name: '鹤山', title: '法医学院学生', seal: 'visitor', at: 'pk_gate', from: 'q_scene' }, gaoru: { name: '高汝雪', title: '法医学院学姐', seal: 'visitor' },
  lidui: { name: '李队', title: '西城派出所', seal: 'police' }, yan: { name: '颜队长', title: '市分局刑侦队', seal: 'police' }, landlord: { name: '房东', title: '跛脚男人', seal: 'foe' }, wangqi: { name: '王琦', title: '贴寻人启事的人', seal: 'foe' },
  zhangpeng: { name: '张鹏', title: '手背纹着牡丹', seal: 'foe' }, xiaoxiao: { name: '小小', title: '布偶里的孩子', seal: 'ghost' }, zhangya: { name: '张雅', title: '红衣', seal: 'red' }, fanyu: { name: '范郁', title: '不爱说话的男孩', seal: 'visitor' },
  aunt: { name: '范郁的姑姑', title: '', seal: 'foe' }, bixian: { name: '笔仙', title: '', seal: 'ghost' }, gaoys: { name: '高医生', title: '心理医生 · 高汝雪的父亲', seal: 'med' }, mennan: { name: '门楠', title: '总在洗头的年轻人', seal: 'visitor' },
  liudao: { name: '刘刀', title: '工作室负责人', seal: 'net' }, wanghl: { name: '王海龙', title: '', seal: 'visitor' }, xutong: { name: '许童', title: '五号病室', seal: 'med' }, boy: { name: '男孩', title: '门楠的主人格', seal: 'red' },
  dean: { name: '老院长', title: '红衣', seal: 'red' }, taxi: { name: '司机大叔', title: '', seal: 'net' }, feiyl: { name: '费友亮', title: '秦广工作室', seal: 'net' }, oldman: { name: '老爷子', title: '轮椅上的老人', seal: 'visitor' }
};
const SEAL_BY_NAME = {}; for (const k in NPCS) SEAL_BY_NAME[NPCS[k].name] = NPCS[k].seal;
Object.assign(SEAL_BY_NAME, { 陈歌: 'self', 黑色手机: 'phone', 水友: 'net', 弹幕: 'net', 游客: 'visitor', 警察: 'police', 纹身男: 'foe', 胖子: 'foe', 女人: 'foe', 年轻警察: 'police', 中年人: 'net', 司机: 'net', 女护士: 'ghost', 畸形脸: 'foe', 镜中: 'ghost', 朱佳宁: 'net', 大叔: 'visitor', 年轻人: 'visitor', 老人: 'visitor', 手机里的声音: 'med', 王文龙: 'visitor', 姑姑: 'foe', 父亲的信: 'med' });
