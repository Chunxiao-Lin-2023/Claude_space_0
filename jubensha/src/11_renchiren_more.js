/* 《人吃人》第二批数据：自我介绍三选一、玩家“指出关联”、最终陈述 */
Object.assign(SCRIPTS.renchiren, {
  /* 自我介绍：low 低调 / strong 强势（AI 会多一分戒心）/ mislead 把话头往别人身上引（非凶手只能说实话式的暗示） */
  intros: {
    wang: [
      { style: 'low', label: '低调', say: '我就是个种地的村长，各位领导问啥我答啥，绝不隐瞒。' },
      { style: 'strong', label: '强势', say: '这是我们村，出了事我这个村长要负责。我把话放这儿：谁敢在我们村杀人，我第一个不放过他！' },
      { style: 'mislead', label: '带点误导', say: '赵老板是好人。可村里这几个月来的外人，一个身上带着枪，一个天天发呆……我不多说，大家心里有数。', push: { li: 1 } }
    ],
    zhang: [
      { style: 'low', label: '低调', say: '……张。村里的。' },
      { style: 'strong', label: '强势', say: '（他猛地抬起头，挨个盯着每个人看了一圈。）……不是我。' },
      { style: 'mislead', label: '带点误导', say: '……村长家。晚上。灯亮得很晚。', push: { wang: 0.5 } }
    ],
    li: [
      { style: 'low', label: '低调', say: '李，南城来的，在村里办点事。具体的不方便说。' },
      { style: 'strong', label: '强势', say: '我是警察。从现在起，所有人都别想离开这个村子。谁说谎，我都会查出来。' },
      { style: 'mislead', label: '带点误导', say: '我在村里住了三个月，只说一句：这个村子里，手上沾过血的不止一个。', push: { zhang: 0.5 } }
    ],
    hu: [
      { style: 'low', label: '低调', say: '我姓胡，市里扶贫调研组的。我……我就是来做调研的。' },
      { style: 'strong', label: '强势', say: '我研究贫困问题很多年了，可以负责任地说：赵慈善不是什么慈善家。他死了，没几个人会难过。' },
      { style: 'mislead', label: '带点误导', say: '我和村民说话都靠王村长翻译。只想提醒大家一句：在这个村子里，你听到的话，未必是别人真正说的话。', push: { wang: 0.5 } }
    ],
    det: [
      { style: 'low', label: '温和', say: '我是南城刑警队的探员。大家别紧张，我只是想把那一晚弄清楚。' },
      { style: 'strong', label: '威严', say: '这个案子由我接手。从现在起，谁都不许离开村子——谁撒谎，我一定把他揪出来。' },
      { style: 'mislead', label: '试探', say: '我来之前已经听说了一些事。你们当中有人，知道的比他说的多得多。' }
    ]
  },
  /* 玩家自己把两条线索/证词放在一起：对了就得出推论（或逼出实话） */
  links: [
    { a: 'c_cup', b: 'c_room', reveal: ['d_water'] },
    { a: 'c_cup', b: 'f_wang_mineral', reveal: ['d_water'] },
    { a: 'd_water', b: 'f_li_shot', reveal: ['d_noshot'] },
    { a: 'f_zh_cellar', b: 'f_hu_925', reveal: ['d_time'] },
    { a: 'c_cellar', b: 'd_time', reveal: ['d_cellar'] },
    { a: 'f_wang_cellar', b: 'd_time', reveal: ['d_cellar'] },
    { a: 'c_zh_loan', b: 'f_li_night', reveal: ['d_gamble'] },
    { a: 'f_zh_dad', b: 'f_li_night', reveal: ['d_gamble'] },
    { a: 'c_wang_form', b: 'f_hu_theory', reveal: ['d_poor'] },
    { a: 'c_msg', b: 'd_gamble', reveal: ['d_word'] },
    { a: 'c_body', b: 'c_cellar', reveal: ['d_hid'] },
    { a: 'c_bullets', b: 'c_li_gun', reveal: ['d_gun'], brk: { li: ['where'] } },
    { a: 'c_zh_knife', b: 'c_zh_father', reveal: ['d_zk'] },
    { a: 'c_hu_knife', b: 'f_hu_940', brk: { hu: ['where'] } },
    { a: 'c_hu_rec', b: 'c_hu_sons', brk: { hu: ['zhao'] } },
    { a: 'd_hid', b: 'f_hu_940', brk: { zhang: ['where'] } }
  ],
  /* 最终陈述：真人嫌疑人投票前的最后一句话 */
  finals: {
    wang: [
      { kind: 'lie', say: '我在这个村子活了五十年，从没害过一个人。你们要是冤枉我，全村人都不会答应。' },
      { kind: 'lie', say: '那晚一身土回来的是张家小子，地洞他也下去过。你们好好想想，到底是谁。', push: { zhang: 1 } },
      { kind: 'evade', say: '我没什么好说的。' }
    ],
    zhang: [
      { kind: 'truth', say: '……不是我杀的。我下去了，挨了一棍，醒来他已经死了。', push: { zhang: -1 } },
      { kind: 'evade', say: '……' }
    ],
    li: [
      { kind: 'truth', say: '我开了枪，我认。但他是被毒死的——我递过去的水，他不可能喝。', push: { li: -1 } },
      { kind: 'truth', say: '王村长从头到尾都在演。他是这个村子里唯一不穷的人。', push: { wang: 1 } },
      { kind: 'evade', say: '证据都摆在这儿了，你们自己判断。' }
    ],
    hu: [
      { kind: 'truth', say: '我去过两次，也带过刀，可我连他的面都没见着。我只想找回我的两个儿子。', push: { hu: -1 } },
      { kind: 'truth', say: '王村长不让这个村子富起来，赵慈善临走前要揭发他——这就是动机。', push: { wang: 1 } },
      { kind: 'evade', say: '我说完了。' }
    ]
  },
  /* 快捷语（联机两人之间） */
  quick: ['我怀疑你。', '你刚才说的和证词对不上。', '我同意。', '先别急着下结论。', '你手上还有没公开的线索吧？', '我觉得是王村长。', '我觉得是张村民。', '我觉得是李警察。', '我觉得是胡调研。']
});
