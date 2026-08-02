---
title: 安卓 / 华为版上架记：一个人怎么伺候四个应用商店
date: 2026-10-07
summary: 四条渠道、四套收费逻辑，代码怎么分叉不打架，华为那一堆强制项，加一份商品 ID 命名规范和给后来者的 checklist。
tags: 上架, 安卓, 华为
lang: zh
order: 7
status: published
---

# 安卓 / 华为版上架记：一个人怎么伺候四个应用商店

App Store 一套、Google Play 一套、华为一套、侧载又一套。

同一个 App，我写了四套支付。

准确说是三套支付加一套「不支付」，但心累程度是四套。这篇把四条渠道的差异、代码怎么分叉不打架、各家的坑逐条写下来。**华为的坑最多，占一半篇幅。**

工具文，不抒情。

> 【配图：四渠道收费矩阵表长图】

## 一、四条渠道，一张表

| 渠道 | 判定 | 收费 | 结算 |
|---|---|---|---|
| iOS | 恒真 | 收费 | App Store 内购（StoreKit） |
| Android · Google Play | `STORE=googleplay` | 收费 | Google Play Billing |
| Android · 华为 | `STORE=huawei` | 收费 | HMS IAP Kit |
| Android · 侧载/局域网 | 默认包 | **全功能免费** | — |
| 桌面 / Web | — | 全功能免费 | — |

最后两行不是我大方，是**技术现实**：侧载包连不上任何商店结算，锁功能等于把用户关在门外。既然收不到钱，那就干脆当引流渠道用，全放开。

`AppStore.isPro` 在非收费渠道恒真。这带来一个顺手的好处：本地开发和自动化测试天然是解锁状态，不用为了测个功能去 mock 内购。

## 二、代码怎么分叉不打架

核心原则一句话：**渠道判定收口到一个文件，支付分叉收口到一个文件，其余代码一律不知道自己跑在哪个商店里。**

### 渠道判定：`lib/services/store_channel.dart`

整个文件就六十行，全是 getter：

```dart
abstract final class StoreChannel {
  static const _store = String.fromEnvironment('STORE');

  static bool get isGooglePlay =>
      !kIsWeb &&
      defaultTargetPlatform == TargetPlatform.android &&
      _store == 'googleplay';

  static bool get isHuawei =>
      !kIsWeb &&
      defaultTargetPlatform == TargetPlatform.android &&
      _store == 'huawei';

  /// 本包是否真实收费（付费墙生效 + 内购管线初始化）
  static bool get billed => _isIOS || isGooglePlay || isHuawei;

  static String get storeName => isGooglePlay
      ? 'Google Play'
      : isHuawei ? '华为应用市场' : 'App Store';

  static String get accountName =>
      isGooglePlay ? 'Google' : isHuawei ? '华为' : 'Apple';

  /// 商店没连上时的占位价
  static String get fallbackPrice => isGooglePlay ? 'US\$2.99' : '¥18';
}
```

几个设计上的取舍，值得说：

**渠道标记走 `--dart-define`，不走运行时探测。** 判定条件是「Android 平台」**且**「构建期标记匹配」，缺一不可。理由：运行时探测（比如查有没有 HMS Core）会误判——装了 GMS 的老华为机、刷机的、模拟器，全是坑。构建期标记是死的，死的最可靠。

**`storeName` 和 `accountName` 也在这里。** 付费墙上要说「在 App Store 购买」还是「在华为应用市场购买」，「恢复购买」找不到记录时要提示用户检查「Apple 账号」还是「华为账号」。这些文案全部读这两个 getter，加渠道时只改这一处。

**为什么独立成小文件**：付费墙判定在 `AppStore` 里，内购管线在 `PurchaseService` 里，两边都要用渠道判定。抽出来，避免这俩互相 import 打成环。

> 【配图：store_channel.dart 代码截图】

### 支付管线：`lib/services/purchase_service.dart`

对外接口固定不变：`init / buyPro / buySkill / restore / supported / proPrice`。调用方永远只调这几个，不知道底下发生了什么。

内部按渠道分叉：华为走 `huawei_iap` 的 `IapClient`，iOS 和 Google Play 走官方 `in_app_purchase` 插件（这俩共用一套，是插件本身在底层分的）。

API 对应关系大致是这样：

| in_app_purchase | 华为 IapClient |
|---|---|
| `isAvailable()` | `IapClient.isEnvReady()` |
| `queryProductDetails()` | `obtainProductInfo(ProductInfoReq)` |
| `buyNonConsumable()` | `createPurchaseIntent(PurchaseIntentReq)` |
| `restorePurchases()` | `obtainOwnedPurchases(OwnedPurchasesReq)` |
| `purchaseStream` 回调 | 上面两个的返回值里解析 `productId` |

最大的不同在于**回调模型**：`in_app_purchase` 是流式的，你监听 `purchaseStream` 等它推；HMS 是请求-响应的，你调完自己解析返回。所以华为分支多一个「冷启动对账」——启动时主动拉一次已购列表，落解锁态。

HMS 里 `priceType`：0 消耗型 / 1 非消耗型 / 2 订阅。我全是非消耗型，一律 `priceType = 1`。**非消耗品别去调 `consumeOwnedPurchase`**，那是消耗品的活，调了会出事。

### 构建：三个脚本

```
tool/build_play.sh      # flutter build appbundle --dart-define=STORE=googleplay
tool/build_huawei.sh    # flutter build apk      --dart-define=STORE=huawei
tool/build_release.sh   # web + Android APK，默认包，全功能免费
```

`build_release.sh` 里我做了件小事但很值：**把构建号注入「设置 → 关于」页**。局域网分发的时候，对方装完念一下那串号，我就知道他装的是不是最新包。没有这个，「你重装一下试试」这种对话能来回五轮。

`build_huawei.sh` 会在打包前检查 `key.properties` 和 `agconnect-services.json` 在不在。缺文件就报错，别等打完包上传了才发现支付初始化不了。

## 三、Google Play 的坑：一个，但很致命

Google Play 本身比国内商店简单得多——$25 一次性（不是年费），不要 ICP 备案，不要软著，个人可注册。

唯一的卡点是这个：

**新个人开发者账号，生产发布前必须先跑封闭测试——至少 12 名测试者、连续 14 天。**

这是 2023 年 11 月起的政策。不是建议，是硬门槛。

两个连锁后果：

**一、安卓可用性天然晚于 iOS。** 你 iOS 上架当天，安卓还在攒测试员。这个时间差是结构性的，规划的时候就得算进去。

**二、宣传 CTA 必须分阶段。** 我在内容规划里给自己定了条纪律：**安卓/华为没正式放量前，绝对不喊「安卓可下」**。喊早了，一堆人去搜搜不到，白白消耗信任。

现在的状态：**【待填：Google Play 封测进度 / 是否已正式发布】**。

其他几条顺手记一下：

- Google Play **只收 AAB，不收 APK**。
- 签名走 Play App Signing——你用自己的 keystore 当 upload key 签 AAB，Google 托管最终签名密钥。
- 商品要**关联付款资料**之后才能激活。
- 有付费内购就触发欧盟 DSA「交易商」申报，个人申报要在欧盟商店页**公开住址和电话**。我的处理是初期直接把欧盟剔出销售范围。

## 四、华为的坑：一次说完

华为是四家里最费劲的，因为它的强制项不写在显眼处，你得被打回才知道。

### 4.1 支付必须换，没得商量

华为自 2019 年起的新机**没有 GMS**。Google Play Billing 初始化直接失败——不是报错，是付费墙永远打不开、商品永远拉不到。

所以必须换成 HMS IAP Kit。这不是「适配一下」，是接一套新的支付 SDK。

### 4.2 应用内版本更新检查，是上架强制项

这条是我**被打回才知道**的。

**审核意见原文**：

> 「请集成华为 HMS 版本更新（checkUpdate）。如已集成，可能是 HMS SDK 被混淆导致，请核对混淆配置。」

意思是：AppGallery 强制要求你集成「应用内版本更新」——出新版时，通过华为应用市场弹窗提示用户更新。**不做不给过。**

我的 release 没开混淆（`isMinifyEnabled = false`），所以不属于第二种情形，就是纯粹没集成。补法是在 `MainActivity.onCreate` 里接原生 HMS：

```kotlin
val client = JosApps.getAppUpdateClient(this)
client.checkAppUpdate(this, object : CheckUpdateCallBack {
    override fun onUpdateInfo(intent: Intent?) {
        val info = intent?.getSerializableExtra(UpdateKey.INFO)
        if (info is ApkUpgradeInfo)
            client.showUpdateDialog(this@MainActivity, info, false)
    }
    // 其余回调空实现
})
```

外层包 try/catch 兜底：非华为设备、无 HMS Core 时静默忽略，不影响启动。

渠道开关用 `BuildConfig.IS_HUAWEI`，由 `--dart-define=STORE=huawei` 注入，只有华为包为 true。

**如果你将来开 R8 混淆，记得加 `-keep class com.huawei.** { *; }`**，否则就会命中审核意见里说的第二种情形——集成了但被混淆掉，一样被打回。

### 4.3 AGC 拒收 debug 签名

必须用正式签名 keystore。debug 包传上去直接被挡。

顺带：release keystore 的 **SHA-256 指纹**要填进 AGC「项目设置 → 常规」，否则 IAP 鉴权失败。

再顺带一句血泪提醒：**keystore 丢了，这个包名就永远无法更新**。我的 keystore 和口令文件都 gitignore 了，另外在两个地方做了备份。这不是谨慎，这是及格线。

### 4.4 SkuId 一经创建永久不可改

这条在三家都成立，但华为的后果最直接：SkuId 和代码常量对不上，**真机上就是拉不到商品**，购买按钮点了提示「稍后再试」，你还以为是网络问题。

建商品前，把代码里的常量复制出来，逐字对。

### 4.5 商品创建后必须「激活」

创建 ≠ 生效。商品建完不激活，购买接口直接报「商品不存在」。

这条我觉得是华为后台交互的问题，但骂它没用，记住就行。

### 4.6 `agconnect-services.json` 必须就位

从 AGC 后台下载，放进 `android/app/`。里面的 `package_name` 必须和你的 applicationId 一致，否则 AGConnect 编译期校验就过不去。

这文件含密钥，别入库。

### 4.7 沙盒测试只能在无 GMS 的华为真机上做

本地测不了，模拟器测不了，非华为设备测不了。

流程是：AGC 加沙盒测试账号 → 出正式签名的 `STORE=huawei` 包 → 上传到 AGC 版本轨道 → 真机登录沙盒账号 → 走购买、恢复购买、卸载重装恢复三条。

**没有华为真机就别接华为渠道**，你连验都验不了。

### 4.8 鸿蒙是另一条路

这个要分清楚：

| 系统 | 底座 | 能装 APK 吗 |
|---|---|---|
| HarmonyOS 4.x 及以下 / EMUI | AOSP 兼容层 | 能，现有 Flutter APK 直接跑 |
| HarmonyOS NEXT（纯血鸿蒙） | 自研方舟，无 AOSP | **不能**，只认原生 `.hap` |

所以「华为版」目前覆盖的是前者——存量装机大头。纯血鸿蒙要出 `.hap`，Flutter 得走 `flutter_ohos` 分支、用 DevEco Studio 打包，连 IAP 都要换鸿蒙原生 kit。

那是**独立的一条工作量线**，不是加个编译开关。我 V1 不做。

### 4.9 个人开发者没有软著怎么办

华为可以传官方《版权承诺函》模板：手写签名、写上姓名身份证号、应用名和包名，拍照上传。作用是声明应用由你独立开发、不侵权、后果自负。

风险也很清楚：真出侵权投诉，责任全在你。另一条路是办电子版权证书，出证快、成本低。

> 【配图：华为 AGC 商品管理后台截图】

## 五、商品 ID 命名规范

**全渠道同名 SkuId。** 这是我做得最对的一个决定。

```
top.chihaofan.app.pro              进阶版
top.chihaofan.app.skill.<id>       技能
top.chihaofan.app.outfit.<id>      皮肤
```

三家后台建同名商品，代码里一套常量，判断解锁态时按前缀匹配就行，不用为每家维护一张映射表。

9 个内购商品，全部**非消耗型**：

| 商品 | SkuId | 价格 |
|---|---|---|
| 进阶版 Pro | `top.chihaofan.app.pro` | ¥18 / $2.99 |
| 减脂教练 | `...skill.slim_coach` | ¥6 / $0.99 |
| 控糖管理 | `...skill.sugar_care` | ¥6 |
| 孕期/月子营养 | `...skill.pregnancy` | ¥6 |
| 增肌食谱 | `...skill.muscle_gain` | ¥6 |
| 宝宝辅食 | `...skill.baby_food` | ¥6 |
| 三高慢病食养 | `...skill.chronic_care` | ¥6 |
| 中医食养 | `...skill.tcm_diet` | ¥6 |
| 一周备餐大师 | `...skill.meal_prep` | ¥6 |

价格档：国内 ¥18 / ¥6，Google Play 走 $2.99 / $0.99。

另有 2 个免费技能（节气食养官、剩菜改造师），**不走内购，不需要在任何后台建商品**。

顺带说明：涉及减脂、控糖、孕期、慢病的技能，全部是**饮食建议，不是医疗建议**。这句话在 App 里和商品描述里都有。

## 六、我欠的两笔债

**一、HMS 的 SDK 现在打进了所有安卓包。**

`huawei_iap` 和 AppGallery 的 `appservice` SDK，目前编进了每一个安卓产物，包括要传 Google Play 的那个 AAB。Play 包里它们休眠不调，功能上没问题。

但这是偷懒。规范做法是用 product flavor 把 HMS 从 Play 包里排除掉——Google Play 对「非 Play 的更新机制」是有政策风险的，哪怕你不调。

这笔债我记着，还没还。

**二、我把安卓包名改了两次。**

第一次是 iOS 那边 `com.chihaofan.app` 撞车，被迫改成 `top.chihaofan.app`。第二次是发现安卓这边没跟着改，跟华为 AGC 里注册的包名对不上，又改一次。

纯属自己没规划好。如果我一开始就把「iOS / Google Play / 华为 / 侧载 / 未来的鸿蒙原生」这五个产物的标识符列成一张表，一次定死，就不会有第二次。

所以下面这张表，是我用两次返工换来的：

| 项 | 值 |
|---|---|
| iOS/macOS Bundle ID | `top.chihaofan.app` |
| iCloud 容器 | `iCloud.top.chihaofan.app` |
| Android applicationId（Play / 华为 / 侧载，全部产物） | `top.chihaofan.app` |
| 纯鸿蒙原生工程包名（另一条线） | `com.chihaofan.app` |

## 七、给后来者的 checklist

**动工之前**

- [ ] 把所有渠道的产物列成一张表，标识符**一次定死**
- [ ] 确认每条渠道你都有对应的**真机**（华为渠道尤其，没真机验不了）
- [ ] Google Play 的 12 人 / 14 天封测**尽早启动**，它是关键路径上最长的一段

**代码结构**

- [ ] 渠道判定收口到一个文件，走构建期 `--dart-define`，不做运行时探测
- [ ] 支付管线对外接口保持一致，差异全部收在内部
- [ ] 面向用户的商店名 / 账号名文案统一读渠道 getter
- [ ] 商店连不上时有占位价，别让付费墙空着
- [ ] 每条渠道一个构建脚本，脚本里检查必需文件是否就位
- [ ] 构建号注入 App 内可见处（分发时能确认版本）

**商品**

- [ ] 全渠道同名 SkuId，前缀规范化
- [ ] 建商品前逐字核对代码常量（**建后永久不可改**）
- [ ] 华为：商品建完记得**激活**
- [ ] Google Play：关联付款资料后商品才能激活
- [ ] 免费内容不建商品

**华为专项**

- [ ] `agconnect-services.json` 放进 `android/app/`，`package_name` 对上
- [ ] release keystore 的 SHA-256 指纹填进 AGC
- [ ] 集成 `checkAppUpdate`（**强制项**）
- [ ] 若开混淆，`-keep class com.huawei.** { *; }`
- [ ] 正式签名打包，AGC 拒收 debug

**验收（每条收费渠道都要跑）**

- [ ] 购买 → 立即解锁
- [ ] 卸载重装 → 恢复购买 → 解锁态回来
- [ ] 付费墙文案显示的是对的商店名和账号名
- [ ] 侧载包依旧全功能免费、设置页不出现付费卡片
- [ ] 解锁态**不进导出/同步数据**（防止同步码变破解码）

---

写完发现，四条渠道里真正花时间的从来不是写代码。代码分叉那部分，加起来不到两百行。

费时间的是：等封测、等审核、找一台能测的真机、以及在四个后台里把同一个商品建四遍还不能建错。

一个人做这件事，最大的技能不是编程，是**把重复的事情整理成表格**。

吃好饭 iOS 已上架，App Store 搜「吃好饭 AI冰箱」。这个系列会一直写下去，欢迎在留言区骂我。
