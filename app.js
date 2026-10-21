/* ==========================================================================
   吃好饭 (Chihaofan) · 企业级互动引擎 (app.js)
   支持中英双语 (自动识别 document.documentElement.lang)
   包含：Hero 粒子光斑、3D 三温区智能恒温冰箱沙盘、AI 3秒智能配餐沙盘、
         HTML5 3D 环球寻味地球仪与 5 款旅拍海报工作台、定价周期切换、漫游青团团
   ========================================================================== */
(function () {
  var IS_EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. 明暗主题切换 */
  (function () {
    var btn = document.getElementById('themeBtn');
    if (!btn) return;
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    function cur() {
      var t = document.documentElement.getAttribute('data-theme');
      return t || (mq.matches ? 'dark' : 'light');
    }
    function paint() {
      var d = cur() === 'dark';
      btn.textContent = d ? '☀️' : '🌙';
      btn.setAttribute('aria-label', d ? (IS_EN ? 'Switch to light' : '切换到浅色') : (IS_EN ? 'Switch to dark' : '切换到深色'));
    }
    paint();
    btn.addEventListener('click', function () {
      var next = cur() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      paint();
    });
  })();

  /* 2. 顶部滚动进度条 */
  (function () {
    var bar = document.getElementById('prog');
    if (!bar) return;
    function upd() {
      var h = document.documentElement;
      var p = h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1);
      bar.style.width = (p * 100) + '%';
    }
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  })();

  /* 3. Hero 粒子画布（带可见性生命周期管理） */
  (function () {
    var cvs = document.getElementById('heroCanvas');
    if (!cvs || REDUCE) return;
    var ctx = cvs.getContext('2d');
    var w = 0, h = 0, raf = null, running = true;
    var pts = [];
    function resize() {
      var r = cvs.parentElement.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cvs.width = w * dpr; cvs.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    for (var i = 0; i < 28; i++) {
      pts.push({
        x: Math.random() * (w || 1000),
        y: Math.random() * (h || 600),
        vx: (Math.random() - 0.5) * 0.45,
        vy: -0.25 - Math.random() * 0.45,
        r: 2 + Math.random() * 3.5,
        a: 0.15 + Math.random() * 0.45
      });
    }
    function tick() {
      if (!running) { raf = null; return; }
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 200, 119, ' + p.a + ')';
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    tick();
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running && !raf) tick();
    });
  })();

  /* 4. 沙盘一：3D 拟真三温区冰箱与冰箱贴互动控制台 */
  (function () {
    var ZONES = IS_EN ? [
      {
        id: 'fresh', name: 'Crisp Chiller', temp: '+4.0°C', hum: '86% RH', mode: '4-Season Eco',
        power: '0.32 kWh/d', alert: '2 Expiring Soon',
        items: [
          { emo: '🥦', name: 'Organic Broccoli', sub: 'Expires tomorrow · 280g', cls: 'tag-soon' },
          { emo: '🥛', name: 'A2 Fresh Milk', sub: '2 days left · 500ml', cls: 'tag-soon' },
          { emo: '🥚', name: 'Free-Range Eggs', sub: 'Fresh · 8 pcs', cls: 'tag-fresh' },
          { emo: '🍅', name: 'Heirloom Tomatoes', sub: 'Fresh · 350g', cls: 'tag-fresh' }
        ]
      },
      {
        id: 'soft', name: 'Soft-Freeze Care', temp: '-3.0°C', hum: '72% RH', mode: 'Zero-Thaw Cut',
        power: '0.41 kWh/d', alert: '1 Prime Ready',
        items: [
          { emo: '🥩', name: 'Chicken Breast', sub: 'Cook tonight · 320g', cls: 'tag-soon' },
          { emo: '🐟', name: 'Norwegian Salmon', sub: 'Ready to slice · 220g', cls: 'tag-fresh' },
          { emo: '🦐', name: 'Peeled Tiger Prawns', sub: 'Fresh · 260g', cls: 'tag-fresh' },
          { emo: '🧀', name: 'Cheddar Slices', sub: 'Fresh · 150g', cls: 'tag-fresh' }
        ]
      },
      {
        id: 'deep', name: 'Deep Flash Freeze', temp: '-18.0°C', hum: '54% RH', mode: 'Flash Lock',
        power: '0.48 kWh/d', alert: 'All Locked Fresh',
        items: [
          { emo: '🥟', name: 'Handmade Dumplings', sub: '24 days left · 500g', cls: 'tag-fresh' },
          { emo: '🥩', name: 'Grain-Fed Ribeye', sub: '45 days left · 400g', cls: 'tag-fresh' },
          { emo: '🌽', name: 'Sweet Corn Kernels', sub: '60 days left · 300g', cls: 'tag-fresh' },
          { emo: '🍦', name: 'Matcha Gelato', sub: '80 days left · 1 tub', cls: 'tag-fresh' }
        ]
      }
    ] : [
      {
        id: 'fresh', name: '冷藏鲜活舱', temp: '+4.0°C', hum: '86% RH', mode: '四季恒温锁鲜',
        power: '0.32 度/天', alert: '2 项临期优先消耗',
        items: [
          { emo: '🥦', name: '有机西兰花', sub: '剩 1 天临期 · 280g', cls: 'tag-soon' },
          { emo: '🥛', name: '巴氏鲜牛奶', sub: '剩 2 天临期 · 500ml', cls: 'tag-soon' },
          { emo: '🥚', name: '谷物鲜鸡蛋', sub: '新鲜 · 8 枚', cls: 'tag-fresh' },
          { emo: '🍅', name: '沙瓤普罗旺斯番茄', sub: '新鲜 · 350g', cls: 'tag-fresh' }
        ]
      },
      {
        id: 'soft', name: '微冻软切舱', temp: '-3.0°C', hum: '72% RH', mode: '零解冻鲜肉直切',
        power: '0.41 度/天', alert: '1 项今日待下锅',
        items: [
          { emo: '🥩', name: '散养鸡胸肉', sub: '今晚推荐消耗 · 320g', cls: 'tag-soon' },
          { emo: '🐟', name: '冰鲜法罗三文鱼', sub: '免解冻鲜切 · 220g', cls: 'tag-fresh' },
          { emo: '🦐', name: '手剥黑虎虾仁', sub: '鲜活锁水 · 260g', cls: 'tag-fresh' },
          { emo: '🧀', name: '原制干酪片', sub: '新鲜 · 150g', cls: 'tag-fresh' }
        ]
      },
      {
        id: 'deep', name: '深冷速冻舱', temp: '-18.0°C', hum: '54% RH', mode: '极速深冷锁鲜',
        power: '0.48 度/天', alert: '全舱冻品状态优良',
        items: [
          { emo: '🥟', name: '手工荠菜鲜肉水饺', sub: '余 24 天 · 500g', cls: 'tag-fresh' },
          { emo: '🥩', name: '谷饲眼肉牛排', sub: '余 45 天 · 400g', cls: 'tag-fresh' },
          { emo: '🌽', name: '东北水果甜玉米粒', sub: '余 60 天 · 300g', cls: 'tag-fresh' },
          { emo: '🍦', name: '宇治抹茶冰淇淋', sub: '余 80 天 · 1 盒', cls: 'tag-fresh' }
        ]
      }
    ];

    var grid = document.getElementById('fridgeShelfGrid');
    var degEl = document.getElementById('thermoDeg');
    var nameEl = document.getElementById('thermoZoneName');
    var humEl = document.getElementById('thermoHum');
    var modeEl = document.getElementById('thermoMode');
    var alertEl = document.getElementById('thermoAlert');
    var tabs = document.querySelectorAll('[data-fridge-zone]');
    if (!grid || !tabs.length) return;

    function renderZone(idx) {
      var z = ZONES[idx] || ZONES[0];
      if (degEl) degEl.textContent = z.temp;
      if (nameEl) nameEl.textContent = z.name;
      if (humEl) humEl.textContent = z.hum;
      if (modeEl) modeEl.textContent = z.mode;
      if (alertEl) alertEl.textContent = z.alert;
      grid.innerHTML = '';
      z.items.forEach(function (it) {
        var d = document.createElement('div');
        d.className = 'food-cell';
        d.innerHTML = '<span class="emo">' + it.emo + '</span><div class="meta"><b>' + it.name + '</b><small class="' + it.cls + '">' + it.sub + '</small></div>';
        grid.appendChild(d);
      });
    }
    tabs.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        tabs.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderZone(i);
      });
    });
    renderZone(0);
  })();

  /* 5. 沙盘二：AI 3 秒智能配餐终端 + 10 大专业脑组件切换 */
  (function () {
    var SCENES = IS_EN ? [
      {
        title: '🏃 Fat-Loss Coach · High-Protein < 500 kcal',
        steps: [
          '1. Inventory Scan: Found expiring Broccoli (280g) + Chicken Breast (320g)',
          '2. Budget & Rule Filter: Target ≤ $4.5 / meal · High Protein, Low Oil',
          '3. Gap Check: Missing 2 Tomatoes (auto-pushed to Shopping List)'
        ],
        kcal: '465 kcal / serving · Protein 42g · Cost ~$3.8',
        dishes: [
          { emo: '🍗', name: 'Garlic Pan-Seared Chicken', sub: 'Uses 320g stock · 240 kcal' },
          { emo: '🥦', name: 'Blanched Crisp Broccoli', sub: 'Clears expiring · 110 kcal' },
          { emo: '🍅', name: 'Tomato Egg Drop Soup', sub: 'Auto-listed tomato · 115 kcal' }
        ]
      },
      {
        title: '🩸 Low-GI Sugar Control · Steady Glucose Curve',
        steps: [
          '1. Inventory Scan: Norwegian Salmon (220g) + Organic Broccoli + Eggs',
          '2. Glycemic Rule: Whole-grain carb pairing, GI < 55, zero added sugar',
          '3. Sequence Tip: Eat fiber (broccoli) first → protein (salmon) → grain'
        ],
        kcal: '490 kcal / serving · GI Index 41 (Low) · Cost ~$5.2',
        dishes: [
          { emo: '🐟', name: 'Lemon Herb Baked Salmon', sub: 'Omega-3 rich · 260 kcal' },
          { emo: '🥦', name: 'Garlic Steamed Greens', sub: 'Pre-meal fiber buffer · 95 kcal' },
          { emo: '🌽', name: 'Sweet Corn & Egg Custard', sub: 'Slow-release carb · 135 kcal' }
        ]
      },
      {
        title: '♻️ Leftover Rescue · Zero-Waste Gourmet Makeover',
        steps: [
          '1. Inventory Scan: Yesterday cooked rice + 180g broccoli stems + 2 eggs',
          '2. Safety & Flavor Rule: High-heat wok sear + golden egg coating',
          '3. Zero Purchase Needed: 100% made from existing fridge stock ($0 extra)'
        ],
        kcal: '430 kcal / serving · Saved $4.2 food waste · 12 mins',
        dishes: [
          { emo: '🍛', name: 'Golden Egg & Veggie Fried Rice', sub: 'Uses leftover rice · 290 kcal' },
          { emo: '🥒', name: 'Crispy Pickled Broccoli Stems', sub: 'Zero-waste stem use · 55 kcal' },
          { emo: '🥚', name: 'Seaweed Egg Ribbon Soup', sub: '5-min quick soup · 85 kcal' }
        ]
      },
      {
        title: '🤰 Pregnancy & Postpartum · Folate + Iron Boost',
        steps: [
          '1. Inventory Scan: Ribeye Beef (400g) + Tomatoes + Free-Range Eggs',
          '2. Nutrient Target: Heme Iron + Vitamin C synergy, low sodium, fully cooked',
          '3. Allergy Guard: Filtered raw/unpasteurized items automatically'
        ],
        kcal: '540 kcal / serving · Iron 6.8mg · Folate Rich',
        dishes: [
          { emo: '🍲', name: 'Tomato Braised Tender Beef', sub: 'Vit-C boosts iron · 310 kcal' },
          { emo: '🥚', name: 'Silky Milk Steamed Egg', sub: 'High calcium & choline · 140 kcal' },
          { emo: '🥬', name: 'Blanched Seasonal Greens', sub: 'Natural folate · 90 kcal' }
        ]
      }
    ] : [
      {
        title: '🏃 减脂教练脑组件 · 高蛋白控卡（< 500 kcal）',
        steps: [
          '1. 库存临期扫描：命中明日临期「有机西兰花 280g」+「散养鸡胸肉 320g」',
          '2. 预算与脑组件约束：单餐预算 ≤ ¥18 · 高蛋白低脂少油、P:C:F = 4:4:2',
          '3. 缺口自动入清单：差 2 颗番茄（已自动写入「买菜缺口清单」）'
        ],
        kcal: '465 kcal / 份 · 蛋白质 42g · 预计花费 ¥14.5',
        dishes: [
          { emo: '🍗', name: '黑椒蒜香嫩煎鸡胸', sub: '消耗临期库存 · 240 kcal' },
          { emo: '🥦', name: '白灼脆嫩西兰花', sub: '清空临期蔬菜 · 110 kcal' },
          { emo: '🍅', name: '鲜番茄滑蛋汤', sub: '缺口番茄已入清单 · 115 kcal' }
        ]
      },
      {
        title: '🩸 控糖管理脑组件 · 低 GI 稳糖饮食方案',
        steps: [
          '1. 库存扫描：提取微冻舱「法罗三文鱼 220g」+「西兰花」+「鸡蛋」',
          '2. 升糖指数约束：全餐综合 GI < 45，剔除精制糖与勾芡芡汁',
          '3. 进餐顺序建议：先吃膳食纤维（西兰花）→ 优质蛋白（三文鱼）→ 慢碳玉米'
        ],
        kcal: '490 kcal / 份 · 综合 GI 41（低升糖） · 预计花费 ¥26',
        dishes: [
          { emo: '🐟', name: '柠香迷迭香烤三文鱼', sub: '富含 Omega-3 · 260 kcal' },
          { emo: '🥦', name: '蒜蓉蒸有机西兰花', sub: '餐前纤维缓冲 · 95 kcal' },
          { emo: '🌽', name: '甜玉米粒鲜虾蒸水蛋', sub: '优质慢碳主食代餐 · 135 kcal' }
        ]
      },
      {
        title: '♻️ 剩菜改造师（免费脑组件） · 零采购安全翻新',
        steps: [
          '1. 库存扫描：发现昨晚剩米饭 1 碗 + 西兰花梗 180g + 鸡蛋 2 枚',
          '2. 安全二次料理规范：高温急火黄金包裹翻炒，脆嫩菜梗切丁提鲜',
          '3. 零额外采购：100% 消耗冰箱边角余料，本餐额外买菜花费 ¥0'
        ],
        kcal: '430 kcal / 份 · 挽回食材浪费约 ¥16 · 12 分钟出锅',
        dishes: [
          { emo: '🍛', name: '黄金蛋包翡翠菜梗炒饭', sub: '消耗隔夜米饭 · 290 kcal' },
          { emo: '🥒', name: '酸辣脆爽西兰花梗小菜', sub: '菜梗零浪费改造 · 55 kcal' },
          { emo: '🥚', name: '紫菜虾皮云朵蛋花汤', sub: '5 分钟快手暖汤 · 85 kcal' }
        ]
      },
      {
        title: '🤰 孕期/月子营养脑组件 · 补铁与叶酸协同',
        steps: [
          '1. 库存扫描：调取「谷饲眼肉牛排 400g」+「沙瓤番茄」+「鲜牛奶」',
          '2. 孕期营养靶向：番茄维 C 促进红肉血红素铁吸收，全熟烹调零生冷',
          '3. 家庭成员忌口规避：自动过滤高汞鱼类与未巴氏杀菌食材'
        ],
        kcal: '540 kcal / 份 · 铁 6.8mg · 天然叶酸丰富',
        dishes: [
          { emo: '🍲', name: '浓汤沙瓤番茄炖牛腩粒', sub: '维C促铁吸收 · 310 kcal' },
          { emo: '🥚', name: '鲜奶炖滑嫩芙蓉蛋', sub: '高钙优质蛋白 · 140 kcal' },
          { emo: '🥬', name: '清炒时令有机时蔬', sub: '补充天然叶酸 · 90 kcal' }
        ]
      }
    ];

    var tabs = document.querySelectorAll('[data-meal-scene]');
    var titleEl = document.getElementById('mealSceneTitle');
    var stepsEl = document.getElementById('mealReasoningSteps');
    var kcalEl = document.getElementById('mealKcalSummary');
    var dishesEl = document.getElementById('mealDishesGrid');
    if (!tabs.length || !stepsEl || !dishesEl) return;

    function renderMeal(idx) {
      var s = SCENES[idx] || SCENES[0];
      if (titleEl) titleEl.textContent = s.title;
      if (kcalEl) kcalEl.textContent = s.kcal;
      stepsEl.innerHTML = '';
      s.steps.forEach(function (st) {
        var row = document.createElement('div');
        row.className = 'reasoning-step';
        row.innerHTML = '<span class="dot"></span><span>' + st + '</span>';
        stepsEl.appendChild(row);
      });
      dishesEl.innerHTML = '';
      s.dishes.forEach(function (d) {
        var card = document.createElement('div');
        card.className = 'dish-pill';
        card.innerHTML = '<span class="emo">' + d.emo + '</span><b>' + d.name + '</b><small>' + d.sub + '</small>';
        dishesEl.appendChild(card);
      });
    }
    tabs.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        tabs.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderMeal(i);
      });
    });
    renderMeal(0);
  })();

  /* 6. 沙盘三：HTML5 3D 环球寻味地球仪 + 5 款小红书旅拍海报工作台 */
  (function () {
    var cvs = document.getElementById('globeCanvas');
    if (!cvs) return;
    var ctx = cvs.getContext('2d');
    var w = 0, h = 0, yaw = 0.6, dragging = false, lx = 0, activeCity = 0, visible = true;

    var CITIES = IS_EN ? [
      { name: 'Chengdu · China', lat: 0.52, lon: 1.82, dish: '🐼 Mapo Tofu & Panda Tangyuan', poster: '🎞️ Vintage Film', bg: 'linear-gradient(135deg, #0f5132, #b45309)', quote: '“Steaming chili aroma in Kuanzhai Alley — Qingtuan unlocked the Sichuan Spice Badge!”', stickers: ['🐼 Panda', '🌶️ Chili Oil', '🥟 Zhong Dumpling', '🍵 Gaiwan Tea'] },
      { name: 'Tokyo · Japan', lat: 0.62, lon: 2.44, dish: '🍣 Tsukiji Nigiri & Matcha Dorayaki', poster: '🌆 Cool Citywalk', bg: 'linear-gradient(135deg, #1e3a8a, #0f766e)', quote: '“6:00 AM golden light sweeps across Tsukiji market — 8K living steam rising from miso soup.”', stickers: ['🍣 Nigiri', '🌸 Sakura', '🍵 Uji Matcha', '🗼 Tokyo Tower'] },
      { name: 'Paris · France', lat: 0.85, lon: 0.04, dish: '🥐 Butter Croissant & Café Crème', poster: '☕ French Holiday', bg: 'linear-gradient(135deg, #78350f, #065f46)', quote: '“Crisp flaky layers beside the Seine — Qingtuan collected the Left Bank Bakery Magnet!”', stickers: ['🥐 Croissant', '☕ Café', '🧀 Brie', '🥖 Baguette'] },
      { name: 'Bangkok · Thailand', lat: 0.24, lon: 1.75, dish: '🍲 Tom Yum Goong & Mango Sticky Rice', poster: '🌅 Tangerine Sunset', bg: 'linear-gradient(135deg, #9a3412, #0d9488)', quote: '“Lemongrass breeze at Chao Phraya sunset — sour, spicy, and tropical sweet.”', stickers: ['🦐 Tom Yum', '🥭 Mango Rice', '🥥 Coconut', '🌿 Lemongrass'] },
      { name: 'Rome · Italy', lat: 0.73, lon: 0.22, dish: '🍝 Carbonara & Pistachio Gelato', poster: '🌲 Wild Escape', bg: 'linear-gradient(135deg, #14532d, #3f6212)', quote: '“Al dente pasta under Roman pines — tap to place die-cut food stickers on your postcard!”', stickers: ['🍝 Pasta', '🍕 Margherita', '🍨 Gelato', '🌿 Basil'] }
    ] : [
      { name: '中国 · 成都', lat: 0.52, lon: 1.82, dish: '🐼 麻婆豆腐与熊猫赖汤圆', poster: '🎞️ 胶片复古', bg: 'linear-gradient(135deg, #0f5132, #b45309)', quote: '「宽窄巷子冒着热气的红油香气 ♨️ —— 青团团解锁【川味食神】城市冰箱贴！」', stickers: ['🐼 熊猫汤圆', '🌶️ 灵魂红油', '🥟 钟水饺', '🍵 盖碗茶'] },
      { name: '日本 · 东京', lat: 0.62, lon: 2.44, dish: '🍣 筑地手握寿司与宇治抹茶铜锣烧', poster: '🌆 清冷Citywalk', bg: 'linear-gradient(135deg, #1e3a8a, #0f766e)', quote: '「清晨六点的阳光扫过筑地街头，味增汤升起袅袅动态白烟 ♨️。」', stickers: ['🍣 手握寿司', '🌸 樱花盐渍', '🍵 宇治抹茶', '🗼 东京铁塔'] },
      { name: '法国 · 巴黎', lat: 0.85, lon: 0.04, dish: '🥐 塞纳河畔法式可颂与拿铁', poster: '☕ 法式假日', bg: 'linear-gradient(135deg, #78350f, #065f46)', quote: '「左岸露天咖啡馆的黄油酥香 —— 一键生成小红书 9:16 旅拍打卡海报！」', stickers: ['🥐 手工可颂', '☕ 拿铁拉花', '🧀 布里奶酪', '🥖 传统法棍'] },
      { name: '泰国 · 曼谷', lat: 0.24, lon: 1.75, dish: '🍲 冬阴功大虾汤与芒果糯米饭', poster: '🌅 橘子落日', bg: 'linear-gradient(135deg, #9a3412, #0d9488)', quote: '「湄南河橘子色落日下的香茅与椰浆香气 —— 酸辣开胃，治愈一整天。」', stickers: ['🦐 冬阴功', '🥭 芒果糯米饭', '🥥 冰镇椰青', '🌿 柠檬香茅'] },
      { name: '意大利 · 罗马', lat: 0.73, lon: 0.22, dish: '🍝 传统培根蛋酱意面与开心果Gelato', poster: '🌲 旷野出逃', bg: 'linear-gradient(135deg, #14532d, #3f6212)', quote: '「在 8K 实景剧场里随手点击放置白边刀模美食贴纸，寄出你的寻味明信片！」', stickers: ['🍝 手工意面', '🍕 窑烤披萨', '🍨 开心果冰激凌', '🌿 新鲜罗勒'] }
    ];

    var cityTabs = document.querySelectorAll('[data-globe-city]');
    var hudCity = document.getElementById('globeHudCity');
    var posterBox = document.getElementById('posterPreviewBox');
    var posterBadge = document.getElementById('posterStyleBadge');
    var posterTitle = document.getElementById('posterDishTitle');
    var posterQuote = document.getElementById('posterQuoteText');
    var stickerRow = document.getElementById('posterStickerRow');

    function updatePoster(idx) {
      activeCity = idx;
      var c = CITIES[idx] || CITIES[0];
      yaw = -c.lon + 0.3;
      if (hudCity) hudCity.textContent = c.name + ' · ' + c.dish;
      if (posterBox) posterBox.style.background = c.bg;
      if (posterBadge) posterBadge.textContent = c.poster + ' · 19 Countries / 37+ Cities';
      if (posterTitle) posterTitle.textContent = c.dish;
      if (posterQuote) posterQuote.textContent = c.quote;
      if (stickerRow) {
        stickerRow.innerHTML = '';
        c.stickers.forEach(function (st) {
          var s = document.createElement('span');
          s.className = 'sticker-diecut';
          s.textContent = st;
          s.title = IS_EN ? 'Click to bounce sticker' : '点击触发刀模贴纸回弹';
          s.addEventListener('click', function () {
            s.style.transform = 'scale(1.22) rotate(-6deg)';
            setTimeout(function () { s.style.transform = ''; }, 220);
          });
          stickerRow.appendChild(s);
        });
      }
    }

    cityTabs.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        cityTabs.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        updatePoster(i);
      });
    });

    function resizeGlobe() {
      var r = cvs.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width || 480; h = r.height || 340;
      cvs.width = w * dpr; cvs.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeGlobe();
    window.addEventListener('resize', resizeGlobe);

    cvs.addEventListener('pointerdown', function (e) { dragging = true; lx = e.clientX; });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      yaw += (e.clientX - lx) * 0.008;
      lx = e.clientX;
    });
    window.addEventListener('pointerup', function () { dragging = false; });

    function drawGlobe() {
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        var cx = w / 2, cy = h / 2 - 8, rad = Math.min(w, h) * 0.36;
        if (!dragging && !REDUCE) yaw += 0.0045;

        // 外发光球体
        var grad = ctx.createRadialGradient(cx - rad * 0.3, cy - rad * 0.3, rad * 0.1, cx, cy, rad);
        grad.addColorStop(0, 'rgba(46, 230, 160, 0.28)');
        grad.addColorStop(0.7, 'rgba(8, 68, 46, 0.65)');
        grad.addColorStop(1, 'rgba(4, 22, 15, 0.92)');
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(46, 230, 160, 0.55)';
        ctx.stroke();

        // 经纬线
        ctx.strokeStyle = 'rgba(46, 230, 160, 0.16)';
        ctx.lineWidth = 1;
        for (var lat = -60; lat <= 60; lat += 30) {
          var ry = rad * Math.sin(lat * Math.PI / 180);
          var rx = rad * Math.cos(lat * Math.PI / 180);
          ctx.beginPath();
          ctx.ellipse(cx, cy - ry, rx, rx * 0.22, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        for (var i = 0; i < 6; i++) {
          var a = yaw + (i * Math.PI / 6);
          var sx = Math.abs(Math.cos(a)) * rad;
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.max(sx, 2), rad, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 城市坐标高亮针
        CITIES.forEach(function (c, idx) {
          var lon = c.lon + yaw;
          var x3 = Math.cos(c.lat) * Math.sin(lon);
          var z3 = Math.cos(c.lat) * Math.cos(lon);
          var y3 = Math.sin(c.lat);
          if (z3 > -0.15) {
            var px = cx + x3 * rad;
            var py = cy - y3 * rad * 0.85;
            var isAct = idx === activeCity;
            ctx.beginPath();
            ctx.arc(px, py, isAct ? 6.5 : 4, 0, Math.PI * 2);
            ctx.fillStyle = isAct ? '#a9e838' : '#2ee6a0';
            ctx.fill();
            if (isAct) {
              ctx.beginPath();
              ctx.arc(px, py, 13, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(169, 232, 56, 0.65)';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        });
      }
      requestAnimationFrame(drawGlobe);
    }
    updatePoster(0);
    drawGlobe();
  })();

  /* 7. 定价方案周期切换（年度省 40%+ vs 月度灵活订阅） */
  (function () {
    var btns = document.querySelectorAll('[data-billing]');
    var priceEl = document.getElementById('subPriceVal');
    var noteEl = document.getElementById('subPriceNote');
    if (!btns.length || !priceEl) return;
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        var mode = b.getAttribute('data-billing');
        if (mode === 'monthly') {
          priceEl.innerHTML = IS_EN ? '$1.49 <small>/ month</small>' : '¥9.9 <small>/ 月</small>';
          if (noteEl) noteEl.textContent = IS_EN ? 'Flexible monthly billing · Cancel anytime in App Store' : '按月灵活体验 · 随时可在 App Store 取消';
        } else {
          priceEl.innerHTML = IS_EN ? '$9.99 <small>/ year (Save 44%)</small>' : '¥68 <small>/ 年（立省 43%）</small>';
          if (noteEl) noteEl.textContent = IS_EN ? 'Equivalent to $0.83/mo · Full Pro access all year' : '折合仅 ¥5.6/月 · 全年畅享全部脑组件与环球漫游';
        }
      });
    });
  })();

  /* 8. 脑组件跑马灯 */
  (function () {
    var skills = IS_EN ? [
      ['🌿 Seasonal Eating (Free)', 1], ['♻️ Leftover Rescue (Free)', 1], ['🏃 Fat-Loss Coach', 0],
      ['🩸 Low-GI Sugar Control', 0], ['🤰 Pregnancy & Postpartum', 0], ['💪 Muscle & Macros', 0],
      ['👶 Baby Complementary Food', 0], ['🍲 Chronic-Care Low Sodium', 0], ['🍵 TCM Herbal Diet', 0], ['🍱 Sunday Meal-Prep Master', 0]
    ] : [
      ['🌿 节气食养官（免费）', 1], ['♻️ 剩菜改造师（免费）', 1], ['🏃 减脂控卡教练', 0],
      ['🩸 控糖低 GI 管理', 0], ['🤰 孕期/月子营养师', 0], ['💪 增肌高蛋白配餐', 0],
      ['👶 宝宝分月龄辅食', 0], ['🍲 三高慢病低钠食养', 0], ['🍵 中医体质食疗', 0], ['🍱 周末备餐大师', 0]
    ];
    function fill(id, arr) {
      var t = document.getElementById(id);
      if (!t) return;
      (arr.concat(arr)).forEach(function (s) {
        var e = document.createElement('span');
        e.className = 'stag' + (s[1] ? ' free' : '');
        e.textContent = s[0];
        t.appendChild(e);
      });
    }
    fill('tk1', skills);
    fill('tk2', skills.slice().reverse());
  })();

  /* 9. 截图画廊 + 灯箱 */
  (function () {
    var SHOTS = IS_EN ? [
      { src: 'shots/s-dinner.png',  cap: 'What to Cook · AI plans in 3s' },
      { src: 'shots/s-fridge.png',  cap: '3D Visual Fridge · expiry at a glance' },
      { src: 'shots/s-list.png',    cap: 'Shopping List · auto-calculated gap' },
      { src: 'shots/s-budget.png',  cap: 'Grocery Budget · crystal clear' },
      { src: 'shots/s-pet.png',     cap: 'Qingtuan Companion & World Tour' },
      { src: 'shots/s-privacy.png', cap: 'Zero-Server Local Privacy' }
    ] : [
      { src: 'shots/s-dinner.png',  cap: '今晚吃什么 · AI 3秒配好一餐' },
      { src: 'shots/s-fridge.png',  cap: '3D 拟真冰箱 · 临期食材一目了然' },
      { src: 'shots/s-list.png',    cap: '缺口买菜清单 · 自动汇总不漏买' },
      { src: 'shots/s-budget.png',  cap: '买菜预算记账 · 每餐成本清晰可控' },
      { src: 'shots/s-pet.png',     cap: '青团团养成与环球寻味漫游' },
      { src: 'shots/s-privacy.png', cap: '零服务器架构 · 数据 100% 在你手机里' }
    ];
    var strip = document.getElementById('shotStrip');
    var lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg'), idx = 0;
    if (!strip || !lb || !lbImg) return;

    function openLb(n) {
      idx = (n + SHOTS.length) % SHOTS.length;
      lbImg.src = SHOTS[idx].src;
      lbImg.alt = SHOTS[idx].cap;
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeLb() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    function go(d) { openLb(idx + d); }

    SHOTS.forEach(function (s, k) {
      var c = document.createElement('div');
      c.className = 'shot-card';
      var im = document.createElement('img');
      im.src = s.src; im.alt = s.cap; im.loading = 'lazy';
      c.appendChild(im);
      c.addEventListener('click', function () { openLb(k); });
      strip.appendChild(c);
    });

    document.getElementById('lbClose').addEventListener('click', closeLb);
    document.getElementById('lbPrev').addEventListener('click', function (e) { e.stopPropagation(); go(-1); });
    document.getElementById('lbNext').addEventListener('click', function (e) { e.stopPropagation(); go(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    window.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    });
    document.querySelectorAll('.feat[data-shot]').forEach(function (c) {
      function act() { openLb(parseInt(c.dataset.shot, 10) || 0); }
      c.addEventListener('click', act);
      c.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
      });
    });
  })();

  /* 10. 会漫游、可拖动、可点击的青团团桌宠 (#pet) */
  window.addEventListener('load', function () {
    var pet = document.getElementById('pet'), anim = document.getElementById('petAnim'),
        bubble = document.getElementById('petBubble'), msg = document.getElementById('petMsg'),
        close = document.getElementById('petClose');
    if (!pet || !anim || !bubble) return;
    var fb = pet.querySelector('.pet-fallback');
    var hasLottie = typeof lottie !== 'undefined', cur = null, roamTimer = null, open = false;
    var dragging = false, moved = false, sx = 0, sy = 0, ox = 0, oy = 0, pid = null;
    var lines = IS_EN ? [
      "I'm Qingtuan 🍵 Try spinning the 3D World Culinary Globe above or switching the Tri-Zone Fridge!",
      "What's in your fridge tonight? I'll plan a 3-dish meal in 3 seconds and auto-list missing items!",
      "Tap to place die-cut food stickers in our 8K Living Scene Theater and export 9:16 travel posters!",
      "Drag me anywhere to wander with you~ Download Chihaofan on the App Store or AppGallery!"
    ] : [
      "我是青团团 🍵 试试在上方拨动 3D 环球寻味地球仪，或者切换三温区智能冰箱舱吧！",
      "今晚冰箱剩什么？我 3 秒给你配好一菜一汤，缺的食材自动进买菜清单 👇",
      "升级 v1.2.6 啦！支持 19 国 37+ 城 8K 实景寻味剧场、刀模美食贴纸 DIY 与小红书旅拍海报！",
      "按住我可以随便拖着走～ 喜欢我就点下方按钮去 App Store 或华为应用市场领养我吧！"
    ];
    var petBroken = false;
    function showStaticPet() {
      petBroken = true;
      if (cur) { try { cur.destroy(); } catch (e) {} cur = null; }
      anim.style.display = 'none';
      if (fb) fb.style.display = 'block';
    }
    if (!hasLottie) showStaticPet();

    function sz() { return pet.offsetWidth || 116; }
    function vw() { return window.innerWidth; }
    function vh() { return window.innerHeight; }
    function cx(x) { return Math.min(Math.max(x, 8), vw() - sz() - 8); }
    function cy(y) { return Math.min(Math.max(y, 8), vh() - sz() - 8); }

    pet.style.bottom = 'auto';
    pet.style.left = cx(vw() * 0.04) + 'px';
    pet.style.top = cy(vh() - sz() - 20) + 'px';

    function play(name, loop) {
      if (!hasLottie || petBroken) return;
      if (cur) { cur.destroy(); cur = null; }
      try {
        cur = lottie.loadAnimation({ container: anim, renderer: 'svg', loop: loop, autoplay: !REDUCE, path: 'haohao_' + name + '.json' });
        cur.addEventListener('data_failed', showStaticPet);
      } catch (e) { showStaticPet(); }
    }
    play('idle', true);

    function roam() {
      if (REDUCE || open || dragging) return;
      var tx = cx(8 + Math.random() * (vw() - sz() - 16));
      var ty = cy(vh() * 0.36 + Math.random() * (vh() * 0.50 - sz()));
      var curX = parseFloat(pet.style.left) || 0, curY = parseFloat(pet.style.top) || 0;
      pet.classList.toggle('flip', tx < curX);
      var dur = Math.min(5, Math.max(1.8, Math.hypot(tx - curX, ty - curY) / 160));
      pet.style.transitionDuration = dur + 's, ' + dur + 's';
      play('walk', true);
      pet.style.left = tx + 'px'; pet.style.top = ty + 'px';
      setTimeout(function () { if (!open && !dragging) play('idle', true); }, dur * 1000);
      roamTimer = setTimeout(roam, dur * 1000 + 3800 + Math.random() * 3500);
    }
    if (!REDUCE) roamTimer = setTimeout(roam, 2800);

    function place() {
      var r = pet.getBoundingClientRect();
      bubble.style.top = 'auto';
      bubble.style.bottom = (vh() - r.top + 10) + 'px';
      bubble.style.left = Math.min(Math.max(r.left + r.width / 2 - 134, 12), vw() - 280) + 'px';
    }
    var petHint = pet.querySelector('.pet-hint');
    function openBubble() {
      open = true; clearTimeout(roamTimer);
      if (petHint) petHint.style.display = 'none';
      msg.textContent = lines[Math.floor(Math.random() * lines.length)];
      place(); bubble.classList.add('show'); play('happy', true);
    }
    function closeBubble() {
      open = false; bubble.classList.remove('show'); play('idle', true);
      if (petHint) petHint.style.display = '';
      if (!REDUCE) roamTimer = setTimeout(roam, 2200);
    }

    pet.addEventListener('pointerdown', function (e) {
      pid = e.pointerId; try { pet.setPointerCapture(pid); } catch (_) {}
      dragging = false; moved = false; sx = e.clientX; sy = e.clientY;
      clearTimeout(roamTimer);
      var r = pet.getBoundingClientRect();
      pet.style.left = r.left + 'px'; pet.style.top = r.top + 'px';
      ox = e.clientX - r.left; oy = e.clientY - r.top;
      pet.classList.add('dragging');
    });
    pet.addEventListener('pointermove', function (e) {
      if (pid === null) return;
      if (!dragging && Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 6) {
        dragging = true; moved = true; if (!open) play('happy', true);
      }
      if (dragging) {
        pet.style.left = cx(e.clientX - ox) + 'px';
        pet.style.top = cy(e.clientY - oy) + 'px';
        if (open) place();
      }
    });
    function endDrag() {
      if (pid === null) return;
      try { pet.releasePointerCapture(pid); } catch (_) {}
      pid = null; pet.classList.remove('dragging');
      if (moved) {
        dragging = false; play('idle', true);
        if (!REDUCE && !open) roamTimer = setTimeout(roam, 2500);
      } else {
        open ? closeBubble() : openBubble();
      }
    }
    pet.addEventListener('pointerup', endDrag);
    pet.addEventListener('pointercancel', endDrag);
    close.addEventListener('click', function (e) { e.stopPropagation(); closeBubble(); });
    window.addEventListener('scroll', function () { if (open) place(); }, { passive: true });
    window.addEventListener('resize', function () {
      pet.style.left = cx(parseFloat(pet.style.left) || 0) + 'px';
      pet.style.top = cy(parseFloat(pet.style.top) || 0) + 'px';
      if (open) place();
    });
  });
})();
