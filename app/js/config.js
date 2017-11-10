// 请先配置以下各项，很重要
var CONFIG = {
    // boss 首页地址
    homepage: globalDnsConfigVar.homePageAddr,
    // Homed 后台登录地址
    loginurl: globalDnsConfigVar.homePageAddr + "/login.html",
    // 系统 id，需要设置为自身系统的 id 号
    systemid: 26,
    // 系统名称
    systemname: "新闻资讯后台系统",
    // 是否为开发模式，默认为 true ; true 为不用登录即可进入系统，否则必须登录
    dev: true,
    // 开发模式下的默认账户 ID
    userid: "3120",
    // 开发模式下的默认令牌 
    token: "TOKEN3120",
    // 开发模式下的默认用户角色: 1.超级管理员，2.系统管理员，3.普通用户
    role: 2,
    // 资讯栏目的id
    label: 108,
    // 资讯标题略缩图尺寸
    thumbsize: "142x172"
};

// 保存 CONFIG 信息到 kernel 中
iHomed("config", CONFIG);

var globalDnsConfigVar = top.globalDnsConfigVar || {},
    dtvAddr = (globalDnsConfigVar.dtvAddr || "http://dtv.homed.me"),
    accessAddr = (globalDnsConfigVar.accessAddr || "http://access.homed.me"),
    slaveAddr = (globalDnsConfigVar.slaveAddr || "http://slave.homed.me"),
    slavePoster = globalDnsConfigVar.slaveAddrForPoster,
    newsAddr = dtvAddr + '/news';

/**
 * 扩展系统接口
 * 
 * 形如：{method}_apiname : "http://***" 
 *      {method} 代表了请求接口的类型：get | post
 *      -> "user_get_info" : "http://access.homed.me/usermanager/user/get_info"
 * 
 * 使用方式：
 *     iHomed( "setData 或 getData", { // 这里面的参数传入类似于 jQuery.ajax
 *         url: "{method}_apiname"
 *     } );
 *
 * 更多使用方式请参考 homed.kernel.js 中的相关方法说明
 */
iHomed("api", {
    // 获取栏目分类列表，GET
    "get_label_list": dtvAddr + "/homed/release/get_list",
    // 获取待审核列表
    "get_review_list": newsAddr + "/review/get_list",
    // 审核资讯
    "get_review": newsAddr + "/review/review",
    // 设置审核白名单
    "get_set_white": newsAddr + "/review/set_white_list",
    // 取消审核白名单
    "get_cancel_white": newsAddr + "/review/cancel_white_list",
    // 获取发布列表
    "get_release_list": newsAddr + "/release/get_list",
    // 发布资讯
    "get_release": newsAddr + "/release/release",
    // 取消发布
    "get_remove": newsAddr + "/release/cancel",
    // 获取资讯详情
    "get_news_info": /*slaveAddr*/ newsAddr + "/get_info",
    // 提交资讯
    "get_submit": newsAddr + "/submit",
    // 删除资讯
    "get_delete": newsAddr + "/delete",
    // 获取资讯服务提供商
    "get_provider_list": newsAddr + "/get_provider_list",
    // 获取分类列表，GET
    "get_label_list": dtvAddr + "/homed/programtype/get_list",
    // 新搜索接口 POST
    "post_search_program": slaveAddr + "/search/search_program",
    // 导入资讯，作为添加资讯接口使用
    "post_import_news": dtvAddr + "/news/import",
    // 修改资讯
    "post_adjust_news": dtvAddr + "/news/adjust_info",

    // 获取系统配置
    "post_get_parameter": dtvAddr + "/homed/system/get_parameter",
    // 提交系统配置
    "post_set_parameter": dtvAddr + "/homed/system/set_parameter",
    //import前检验敏感词
    "sensitiveword_check": dtvAddr + "/homed/sensitiveword/check",

    // 海报路径目录
    "poster_url_dir": (globalDnsConfigVar.operator == "dalian" ? "http://slave.ttcatv.tv:13160" : slavePoster) + "/httpdocsdown/hdfshttpdownload/tspic/poster/news/"
});

iHomed.data("devicetype", {
    0: "全部",
    1: "机顶盒",
    2: "CA卡",
    3: "手机",
    4: "pad",
    5: "电脑"
});