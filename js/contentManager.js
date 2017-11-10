var topFrame = top,
    topDoc = topFrame.document;

var Return = top.Return || {}, //引用主窗口上的转换返回码方法
    TOKEN = iHomed.data("token"),
    USERID = iHomed.data("userid"),
    CONFIG = iHomed("config"),
    // 当前导航模板
    NAV = null,
    // 页码
    PAGENUM = 1,
    // 权限
    ACCESS = iHomed("access");

// 初始化一个公用组件
var util = new Utils();

// 设置日期插件的语言为中文
$.datetimepicker.setLocale('ch');

// 音频播放的iframe
var _audioFrame = window.frames["audioPlayer"];

// 获取主窗口的对象
var Label = topFrame.Label;

// 内容类型
var CONTENTTYPE = iHomed("data", "contentType");

// 提供商
var PIDS = topFrame.Provider.getList();

tLayer("global", {
    context: topDoc
});

/**
 * 公用组件函数（可扩展）
 */
function Utils() {

    //保存常用JQ对象
    var $window = $(window),
        $contentWraper = $("#contentWraper"),
        $sideBar = $(".sideBar"),
        $workBar = $(".workBar"),
        $toolLeft = $(".workBar-tools-left"),
        $toolRight = $(".workBar-tools-right"),
        $toolFilter = $(".workBar-tools-filter"),
        $itemWraper = $(".workBar-items-wraper"),
        $workBarItem = $itemWraper.find(".workBar-items"),
        $workTable = $itemWraper.find(".workBar-table"),
        $tableContent = $workTable.find(".workBar-table-content"),
        $workGrid = $itemWraper.find(".workBar-grid"),
        $pageNav = $("#pageNav-wraper"),
        $hiddenBar = $(".hiddenBar"),
        $editBar = $(".editBar"),
        $hiddenDivs = $hiddenBar.find("> div").not(".hiddenBar-module, .hiddenBar-title, .hiddenBar-operate-wraper, .hiddenBar-footer"),
        $timedFrame = $(".timedFrame");

    //记录自身
    var self = this;

    /**
     * 初始化允许resize的对象
     * @return 无返回
     */
    this.initResizable = function() {
        var self = this;

        // 开启侧边栏的 resize 功能
        $sideBar.resizable({
            minWidth: 240,
            maxWidth: 400,
            handles: "e",
            resize: function(e, ui) {
                var sideWidth = ui.size.width,
                    winWidth = $window.width();

                $workBar.css({
                    "margin-left": sideWidth + "px",
                    "width": (sideWidth - winWidth) + "px"
                });

                self.adjustWindow();
            }
        });

    };

    /**
     * 调整窗口大小处理函数
     * @param  {Function} fn 回调函数
     * @return 无返回值
     */
    this.adjustWindow = function(fn) {

        var wHeight = $window.height(),
            wWidth = $window.width() - $sideBar.width(),
            tHeight = $toolFilter.is(":visible") ? $toolFilter.height() : 0;

        // 设置各个 DOM 高度
        $contentWraper.css("height", wHeight + "px");

        // 如果页码导航被隐藏过，将被显示出来，则需要对内容区的高度重新计算
        if ($pageNav.is(":hidden")) {
            $itemWraper.css("height", wHeight - tHeight - 35 + "px");
        } else {
            $itemWraper.css("height", wHeight - tHeight - 65 + "px");
        }

        // 如果隐藏区显示，调整工作区和隐藏区的宽度
        if ($hiddenBar.is(":visible") || $editBar.is(":visible")) {
            var $content = $hiddenBar.find('.hiddenBar-content-wraper'),
                $divs = $hiddenBar.find('> div:visible').not('.hiddenBar-content-wraper, .hiddenBar-footer'),
                cHeight = wHeight,
                wbWidth = wWidth * 0.4,
                hbWidth = wWidth * 0.6;

            var ebwHeight = $editBar.find(".editBar-wraper").height(),
                $editAttr = $editBar.find(".edit-attr"),
                $editPoster = $editBar.find(".edit-poster"),
                $editTitle = $editBar.find(".edit-title"),
                eaHeight = $editAttr.filter(":visible").attr("style", "").outerHeight(),
                epHeight = $editPoster.filter(":visible").attr("style", "").outerHeight(),
                etHeight = $editTitle.outerHeight() * $editTitle.length,
                atHeight = 0;

            $editAttr
                .find(".attr-row").each(function() {
                    atHeight += $(this).outerHeight();
                })
                .eq(-1).siblings(".edit-text").css("height", "calc( 100% - " + atHeight + "px )");

            if (!eaHeight || !epHeight) {
                $editAttr.height(ebwHeight - etHeight - 10);
                $editPoster.height(ebwHeight - etHeight);
            } else {
                $editPoster.css("height", ebwHeight - eaHeight - etHeight);
            }

            $divs.each(function(i, div) {
                var $div = $(div),
                    height = $div.outerHeight();

                cHeight -= height;
            });

            $content.css("height", "auto");
            if ($content.height() < cHeight) {
                cHeight = $content.height();
            }
            $content.css("height", cHeight);

            if (wbWidth < 480) {
                wbWidth = 480;
                hbWidth = wWidth - 480;
            } else if (wbWidth > 680) {
                wbWidth = 680;
                hbWidth = wWidth - 680;
            }

            $workBar.css("width", wbWidth + "px");
            $hiddenBar.css("width", hbWidth + "px");
            $editBar.css("width", hbWidth + "px");

        } else {
            $workBar.css("width", wWidth);
        }

        // 调整文字列表
        if ($workTable.is(":visible")) {
            var $content = $workTable.find(".workBar-table-content"),
                $lis = $workTable.find(".workBar-table-title > ul > li"),
                height = parseFloat($itemWraper.css("height")),
                $name = $workTable.find(".workBar-table-name"),
                wbWidth = $workBar.width();

            $name.css("width", 135); // 还原标题列宽度

            if ($lis.length) {
                var width = 0;
                $lis.each(function(i, li) {
                    width += parseFloat($(li).width());
                });
                width += 20;
                $workTable.css("min-width", width);
            }

            // 标题列宽度一定范围内自动适应浏览器宽度
            var nWidth = $name.width() + (wbWidth - width);
            if (nWidth > 300) {
                nWidth = 300;
            }

            if (wbWidth < width) {
                $content.css("height", height - 47);
            } else {
                $name.css("width", nWidth);
                $content.css("height", height - 31);
            }
            $workBarItem.css("overflow-y", "hidden");
        }

        // 调整视频略缩图表高度
        if ($workGrid.is(":visible")) {
            var height = parseFloat($workGrid.css("height"));

            $workBarItem.css("overflow-y", "auto");
        }

        // 执行回调
        iHomed.runFunction(fn);

    };

    /**
     * 判断ajax请求的数据是否为列表要显示的
     * @param  {string} nav 导航模板
     * @return {boolean} true or false
     */
    this.isThisNAV = function(nav) {
        return NAV === nav;
    };

    /**
     * 初始化工具按钮
     * @return 无返回值
     */
    this.initTools = function(action) {

        // 若 action 不存在则不初始化功能按钮
        if (!action) {

            return false;

        }

        var arg1 = arguments[1];

        // 隐藏弹窗层
        topFrame.$(".layer-box-wraper").remove();

        // 定义工具按钮
        var tools = [];

        // 清空工具栏
        $toolLeft.html("");
        $toolRight.html("");

        // 隐藏筛选栏
        $toolFilter.hide();

        // 隐藏列表
        $workTable.hide();
        $workGrid.hide();

        // 隐藏页码
        $pageNav.hide();

        // 隐藏右侧隐藏栏
        $hiddenBar.hide();
        $hiddenDivs.hide();

        // 隐藏编辑区
        $editBar.hide();

        // 隐藏定时发布框
        $timedFrame.hide();

        // 重置播放器
        _audioFrame.location.href = "popupPage/audioedit.html";

        self.adjustWindow();

        //隐藏搜索框
        top.$("#toolbar .search").hide();
        top.searchHandler = function() {};

        switch (action) {

            case "auditingNews": // 待审核

                if (ACCESS[2603]) { // 编辑
                    tools.push({
                        type: "button",
                        text: "新建",
                        toolID: "tool-add",
                        disabled: false,
                        map: {
                            "tool-add": {
                                action: function() {

                                    NewsEdit.init();

                                },
                                iconClass: {
                                    normal: "addNormal",
                                    hover: "addHover",
                                    disabled: "addDisabled"
                                }
                            }
                        }
                    });
                    tools.push({
                        type: "button",
                        text: "编辑",
                        toolID: "tool-edit",
                        disabled: false,
                        map: {
                            "tool-edit": {
                                action: function() {

                                    NewsEdit.init(NewsEdit.currData);

                                },
                                iconClass: {
                                    normal: "editNormal",
                                    hover: "editHover",
                                    disabled: "editDisabled"
                                }

                            }
                        }
                    });
                }

                if (ACCESS[2602]) { // 发布
                    tools.push({
                        type: "button",
                        text: "发布",
                        toolID: "tool-release",
                        disabled: false,
                        map: {
                            "tool-release": {
                                action: function() {

                                    NewsList.operates("release");

                                },
                                iconClass: {
                                    normal: "releaseNormal",
                                    hover: "releaseHover",
                                    disabled: "releaseDisabled"
                                }
                            }
                        }
                    });
                }

                if (ACCESS[2601]) { // 审核
                    tools.push({
                        type: "button",
                        text: "驳回",
                        toolID: "tool-reject",
                        disabled: false,
                        map: {
                            "tool-reject": {
                                action: function() {

                                    NewsList.operates("reject");

                                },
                                iconClass: {
                                    normal: "rejectNormal",
                                    hover: "rejectHover",
                                    disabled: "rejectDisabled"
                                }
                            }
                        }
                    });
                }

                if (ACCESS[2603]) { // 编辑
                    tools.push({
                        type: "button",
                        text: "删除",
                        toolID: "tool-delete",
                        disabled: false,
                        map: {
                            "tool-delete": {
                                action: function() {

                                    NewsList.operates("delete");

                                },
                                iconClass: {
                                    normal: "deleteNormal",
                                    hover: "deleteHover",
                                    disabled: "deleteDisabled"
                                }
                            }
                        }
                    });
                    tools.push({
                        type: "button",
                        text: "挂栏目",
                        toolID: "tool-label",
                        disabled: false,
                        map: {
                            "tool-label": {
                                action: function() {

                                    NewsList.operates("label");

                                },
                                iconClass: {
                                    normal: "labelNormal",
                                    hover: "labelHover",
                                    disabled: "labelDisabled"
                                }
                            }
                        }
                    });
                }

                break;
            case "rejectedNews": // 已驳回

                if (ACCESS[2601]) {
                    tools.push({
                        type: "button",
                        text: "重新提交",
                        toolID: "tool-submit",
                        disabled: false,
                        map: {
                            "tool-submit": {
                                action: function() {

                                    NewsList.operates("submit");

                                },
                                iconClass: {
                                    normal: "submitNormal",
                                    hover: "submitHover",
                                    disabled: "submitDisabled"
                                }
                            }
                        }
                    });
                }

                if (ACCESS[2603]) {
                    tools.push({
                        type: "button",
                        text: "删除",
                        toolID: "tool-delete",
                        disabled: false,
                        map: {
                            "tool-delete": {
                                action: function() {

                                    NewsList.operates("delete");

                                },
                                iconClass: {
                                    normal: "deleteNormal",
                                    hover: "deleteHover",
                                    disabled: "deleteDisabled"
                                }
                            }
                        }
                    });
                }

                break;
            case "releasedNews": // 已发布

                if (ACCESS[2602]) {
                    tools.push({
                        type: "button",
                        text: "下架",
                        toolID: "tool-remove",
                        disabled: false,
                        map: {
                            "tool-remove": {
                                action: function() {

                                    NewsList.operates("remove");

                                },
                                iconClass: {
                                    normal: "removeNormal",
                                    hover: "removeHover",
                                    disabled: "removeDisabled"
                                }
                            }
                        }
                    });
                }

                if (ACCESS[2603]) {
                    tools.push({
                        type: "button",
                        text: "挂栏目",
                        toolID: "tool-label",
                        disabled: false,
                        map: {
                            "tool-label": {
                                action: function() {

                                    NewsList.operates("label");

                                },
                                iconClass: {
                                    normal: "labelNormal",
                                    hover: "labelHover",
                                    disabled: "labelDisabled"
                                }
                            }
                        }
                    });
                }

                break;
            case "removedNews": // 已下架

                if (ACCESS[2602]) {
                    tools.push({
                        type: "button",
                        text: "重新发布",
                        toolID: "tool-release",
                        disabled: false,
                        map: {
                            "tool-release": {
                                action: function() {

                                    NewsList.operates("release");

                                },
                                iconClass: {
                                    normal: "releaseNormal",
                                    hover: "releaseHover",
                                    disabled: "releaseDisabled"
                                }
                            }
                        }
                    });
                }

                if (ACCESS[2601]) {
                    tools.push({
                        type: "button",
                        text: "重新提交",
                        toolID: "tool-submit",
                        disabled: false,
                        map: {
                            "tool-submit": {
                                action: function() {

                                    NewsList.operates("submit");

                                },
                                iconClass: {
                                    normal: "submitNormal",
                                    hover: "submitHover",
                                    disabled: "submitDisabled"
                                }
                            }
                        }
                    });
                }

                if (ACCESS[2603]) {
                    tools.push({
                        type: "button",
                        text: "删除",
                        toolID: "tool-delete",
                        disabled: false,
                        map: {
                            "tool-delete": {
                                action: function() {

                                    NewsList.operates("delete");

                                },
                                iconClass: {
                                    normal: "deleteNormal",
                                    hover: "deleteHover",
                                    disabled: "deleteDisabled"
                                }
                            }
                        }
                    });
                }

                break;
            case "timedNews": // 定时发布

                if (ACCESS[2602]) {
                    tools.push({
                        type: "button",
                        text: "发布",
                        toolID: "tool-release",
                        disabled: false,
                        map: {
                            "tool-release": {
                                action: function() {

                                    NewsList.operates("release");

                                },
                                iconClass: {
                                    normal: "releaseNormal",
                                    hover: "releaseHover",
                                    disabled: "releaseDisabled"
                                }
                            }
                        }
                    });
                }

                if (ACCESS[2603]) {
                    tools.push({
                        type: "button",
                        text: "删除",
                        toolID: "tool-delete",
                        disabled: false,
                        map: {
                            "tool-delete": {
                                action: function() {

                                    NewsList.operates("delete");

                                },
                                iconClass: {
                                    normal: "deleteNormal",
                                    hover: "deleteHover",
                                    disabled: "deleteDisabled"
                                }
                            }
                        }
                    });

                    tools.push({
                        type: "button",
                        text: "挂栏目",
                        toolID: "tool-label",
                        disabled: false,
                        map: {
                            "tool-label": {
                                action: function() {

                                    NewsList.operates("label");

                                },
                                iconClass: {
                                    normal: "labelNormal",
                                    hover: "labelHover",
                                    disabled: "labelDisabled"
                                }
                            }
                        }
                    });
                }

                break;
        }

        tools.push({
            type: "button",
            text: "筛选",
            toolID: "tool-filter",
            disabled: false,
            map: {
                "tool-filter": {
                    action: function() {

                        var $btn = $(this).find(".tool-button");
                        $btn.toggleClass("active");
                        var $filter = $(".workBar-tools-filter");


                        $filter
                            .slideToggle(500, function() {
                                util.adjustWindow();
                            })
                            .find(".filter").removeClass('active');

                    },
                    iconClass: {
                        normal: "filterNormal",
                        hover: "filterHover",
                        disabled: "filterDisabled"
                    }
                }
            }
        });

        if (tools.length > 0) {

            $toolLeft.iHomed("initTools", tools);

        }

    };

    /**
     * 初始化筛选项
     * @return {[type]} [description]
     */
    this.initFilter = function(action) {

        var $providers = $toolFilter.find(".provider"),
            $labels = $toolFilter.find(".labellist"),
            $sorts = $toolFilter.find(".sortlist");

        // 获取提供商列表
        var ul = '<ul class="filterchild"><li><span data-value=""></span><font>全部</font></li>';

        $.each(PIDS, function(id, name) {
            ul += '<li><span data-value="' + id + '"></span><font>' + name + '</font></li>';
        });

        ul += '</ul>';

        $providers.find("> ul").remove();
        $providers.append(ul);

        // 获取分类列表
        Label.getList(function(data) {
            var ul = '<ul class="filterchild">';
            labels = {
                "0": {
                    id: 0,
                    name: "全部"
                }
            }

            $.extend(labels, data);


            $.each(labels, function(i, label) {
                ul += '<li><span data-value="' + label.id + '"></span><font>' + label.name + '</font></li>';
            })

            ul += '</ul>';

            $labels.find("> ul").remove();
            $labels.append(ul);
        });

        // 重置排序选项
        $sorts.find('.sortchild').removeClass('active').find('input[type="radio"]').prop("checked", false);

    };

    /**
     * construct 构造函数
     */
    (function __construct() {
        //根据权限显示相关的功能

        /*if ( !ACCESS[2013] ) {
            $(".topNav li.right_2013").remove();
        }

        if ( !ACCESS[2014] ) {
            $(".topNav li.right_2014").remove();
        }

        $(".hasChildNav").each(function () {
            var $li = $(this).parent();

            if ( $li.has("li").length == 0 ) {
                $li.remove();
            }
        });*/

        //调整窗口大小
        self.adjustWindow(function() {

            // 绑定窗口改变事件
            $window.bind("resize", self.adjustWindow);

        });

        // 初始化 resizable
        self.initResizable();

        /**
         * 节目管理左导航
         */
        $(".sideBar .topNav span").bind({
            click: function() {

                var $this = $(this);

                if ($this.hasClass("showed")) {

                    $this.siblings("ul").slideUp(300, function() {
                        $this.removeClass("showed").addClass("hidden");
                    });

                } else {

                    $this.siblings("ul").slideDown(300, function() {
                        $this.removeClass("hidden").addClass("showed");
                    });

                }

                if (!$this.hasClass("hasChildNav") && !$this.hasClass("current")) { // 不存在子级菜单才可以点击查看内容

                    $(".sideBar ul span").removeClass("current");
                    $this.addClass("current");

                    var action = $this.data("action");
                    // 检查模块是否存在
                    module = window[action] || undefined;

                    console.log(module);
                    // 记录当前的导航模板
                    NAV = action;

                    if (module) { // 若模块存在

                        iHomed("location", {
                            locate: module.location
                        });



                        // 执行模块初始化
                        iHomed.runFunction(module.init, module);

                    }


                }

            }

        });

        $timedFrame
            .on("click", function(e) {
                e.stopPropagation();
                return false;
            })
            .on("click", "> div", function(e) {
                var id = parseInt($timedFrame.data("targetid")),
                    $focus = $workTable.find('ul[data-id="' + id + '"]'),
                    $this = $(this),
                    $input = $this.siblings('.datetime'),
                    action = $this.data("action");

                var params = {},
                    group = {
                        params: params,
                        ignore: true
                    };

                if (action == "release") {
                    var nowtime = parseInt((new Date()).getTime() / 1000),
                        time = parseInt(iHomed.date2utc($input.val()) / 1000);

                    group.url = "get_release";

                    if (time < nowtime) {
                        $.confirm({
                            layerID: "release-confirm",
                            content: {
                                html: "发布时间小于当前时间，是否需要直接发布？"
                            },
                            footer: {
                                buttons: [{
                                    callback: function() {
                                        group.operate = "发布";

                                        NewsList.ajaxByGroup(group, $focus);

                                        $timedFrame.hide();
                                    }
                                }]
                            }
                        });
                    } else {
                        group.name = "定时发布";
                        params.time = time;

                        NewsList.ajaxByGroup(group, $focus);

                        $timedFrame.hide();
                    }
                } else if (action == "cancel") {
                    group.url = "get_submit";
                    group.name = "取消定时发布";
                    params.result = 1;

                    NewsList.ajaxByGroup(group, $focus);

                    $timedFrame.hide();
                }
            })
            .find(".datetime")
            .datetimepicker({
                formatTime: 'H:i',
                formatDate: 'Y/m/d',
                step: 10,
                onShow: function(ct) {
                    var $this = $(this),
                        $page = $("#pageNav-wraper");

                    // 延时判断时间控件位置是否需要调整
                    setTimeout(function() {
                        var thisHeight = $this.outerHeight(),
                            thisTop = $this.position().top,
                            pageTop = $page.offset().top,
                            pageHeight = $page.outerHeight();
                        if (thisTop + thisHeight > pageTop + pageHeight) {
                            $this.css("top", thisTop - thisHeight - 20);
                        }
                    }, 150);

                },
                timepickerScrollbar: false
            });

        $("body").on("click", function(e) {
            $timedFrame.hide();
        });

        // 加入 setTimeout 是为了防止下面代码 trigger click 时取不到对应的模块
        setTimeout(function() {

            // 初始化默认模块
            $(".sideBar span:first").trigger("click");

        }, 0);

    }());

}
/**
 * 新闻资讯列表公用方法
 * @type {Object}
 */
var NewsList = {
    /**
     * 初始化可翻页的列表
     * @param  {string}     url     列表调用的API
     * @param  {object}     params  传给API的参数
     * @param  {int}        length  显示的分页数
     * @param  {Function}   fn      数据获取成功后的回调
     * @return                无返回值
     */
    initPagingList: function(url, params, length, fn) {
        var self = this,
            nav = NAV;

        var data = {
            accesstoken: TOKEN,
            pageidx: 1,
            pagenum: 50
        };

        length = length || 5;

        $.extend(data, params || {});

        //显示搜索框
        top.$("#toolbar .search").show();
        top.searchHandler = self.searchHandler;

        // 获取分页数据
        $("#pageNav-wraper").show().iHomed("tPager", {
            // 数据请求参数
            request: {
                url: url,
                // type    : "GET",
                data: data,
                error: function() {
                    $.alert({
                        content: {
                            html: "获取数据失败！"
                        },
                        footer: {
                            buttons: [{
                                callback: function() {
                                    //iHomed( "disableTools", "*" );
                                }
                            }]
                        }
                    });
                },
                complete: function() {
                    util.adjustWindow();
                    iHomed.runFunction(fn);
                }
            },
            // 分页控件中能有多少个按钮
            scope: length,
            // 正在分页中
            onPaging: function() {

            },
            // 获取分页数据成功
            onSuccess: function(data) {

                if (!util.isThisNAV(nav)) return;

                // 记录当前的页码
                PAGENUM = $(this).iHomed("tPager", "pageNum");

                iHomed("disableTools", "*:not(tool-filter tool-add)");

                var type = params.PathType || 0,
                    template = self.createTable(),
                    $content = $(".workBar-table-content");

                //console.log( data );      
                if (data.ret == 0) {
                    var list = data.list || [];

                    for (var i = 0, l = list.length; i < l; i++) {
                        // 获取当前行的信息
                        var item = list[i];

                        // 生成模板数据
                        var tempData = self.getTempData(item);

                        tempData.index = i + 1;

                        // 生成html
                        var $item = $(iHomed("packTemplate", tempData, template));

                        $item.data("info", item);

                        $content.append($item);

                    }

                } else if (data.ret == 1) {
                    $.msg("无搜索结果");
                } else {
                    $.alert("获取列表失败");
                }

            }
        });

        self.bindEvents();
    },
    /**
     * 搜索新闻资讯
     * @param  {string} keyword 关键字
     * @return 无
     */
    searchHandler: function(keyword) {
        var module = window[NAV] || undefined;

        if (module) {
            var setting = module.lastSetting,
                params = {
                    accesstoken: TOKEN,
                    pageidx: 1,
                    pagenum: 50,
                    target: "9",
                    name: keyword || "",
                    status: setting.status,
                    // label       : setting.label || "0",
                    // providerid  : setting.providerid || "",
                    sortby: setting.sortby || 2,
                    asc: setting.asc || 0,
                };

            switch (NAV) {
                case "auditingNews":
                    var length = 1,
                        fn = function() {
                            var $ul = $(".workBar-table-content > ul:visible");

                            if ($ul.length > 0) {
                                $ul.eq(0).trigger('click');
                            } else {
                                NewsList.getReviewInfo($ul.eq(0));
                            }
                        };
                    break;
                case NAV:
                    var length = 5,
                        fn = undefined;
                    break;
            }

            NewsList.initPagingList("post_search_program", params, length, fn);

        }
    },
    /**
     * 获取模板数据
     * @param  {Object} data    原始数据
     * @return {Object}         返回模板数据
     */
    getTempData: function(data) {
        var itemOper = [];

        var labels = Label.list;

        var tempData = {
            // 状态
            tempStatus: data.status,
            // 状态描述
            tempStatusDesc: Status.getDesc(data.status),
            // id
            tempID: data.newsid || data.id,
            // 名称
            tempName: data.title || data.name,
            // 提供商
            tempProviderid: data.providername || data.providerid,
            // 内容来源
            tempAuthor: data.authorname || data.copyright,
            // homed分类
            tempLabel: eval(data.label) || [],
            // 原始分类
            tempCategory: data.category || [],
            // 发布时间
            tempTime: isNaN(data.releasetime) ? data.releasetime : iHomed.timeFormat(data.releasetime),
            // 阅读量
            tempAmount: data.times,
            // 描述
            tempDesc: data.desc
        };

        tempData.tempProvider = PIDS[tempData.tempProviderid] || tempData.tempProviderid;

        // var label = tempData.tempLabel.length > 0 ? tempData.tempLabel : tempData.tempCategory,
        //     labelname = [];

        // $.each( label, function(i, id) {
        //      if( labels[ id ] && labels[ id ].name ){
        //         labelname.push( labels[ id ].name );
        //      }
        // } );

        var stype = eval(data.subtype || ""),
            labelname = [];

        if (typeof stype != "object") {
            stype = (data.subtype || "").split("|");
        }

        for (var i = 0; i < stype.length; ++i) {
            var typename = ((CONTENTTYPE["资讯"] || {}).subType || {})[stype[i]];

            if (typename) {
                labelname.push(typename);
            }
        }

        tempData.tempLabelName = labelname.join("|");

        if (data.status == 59999) {
            if (ACCESS[2603]) itemOper.push('<a class="label" title="挂栏目" href="###" data-action="label">&nbsp;</a>');
            if (ACCESS[2602]) itemOper.push('<a class="time" title="定时发布" href="###" data-action="time">&nbsp;</a>');
            if (ACCESS[2603]) itemOper.push('<a class="copyright" title="版权时间" href="###" data-action="copyright">&nbsp;</a>');
        } else if (data.status == 59998 || data.status == 60049) {
            if (ACCESS[2601]) itemOper.push('<a class="submit" title="重新提交" href="###" data-action="submit">&nbsp;</a>');
            itemOper.push('<a class="detail" title="详情" href="###" data-action="detail">&nbsp;</a>');
            if (ACCESS[2603]) itemOper.push('<a class="delete" title="删除" href="###" data-action="delete">&nbsp;</a>');
            if (ACCESS[2603]) itemOper.push('<a class="copyright" title="版权时间" href="###" data-action="copyright">&nbsp;</a>');
        } else if (data.status == 65001) {
            if (ACCESS[2602]) itemOper.push('<a class="release" title="发布" href="###" data-action="release">&nbsp;</a>');
            if (ACCESS[2602]) itemOper.push('<a class="time isset" title="定时发布" href="###" data-action="time">&nbsp;</a>');
            itemOper.push('<a class="detail" title="详情" href="###" data-action="detail">&nbsp;</a>');
            if (ACCESS[2603]) itemOper.push('<a class="delete" title="删除" href="###" data-action="delete">&nbsp;</a>');
            if (ACCESS[2603]) itemOper.push('<a class="label" title="挂栏目" href="###" data-action="label">&nbsp;</a>');
            if (ACCESS[2603]) itemOper.push('<a class="copyright" title="版权时间" href="###" data-action="copyright">&nbsp;</a>');
        } else if (data.status == 65002) {
            if (ACCESS[2602]) itemOper.push('<a class="remove" title="下架" href="###" data-action="remove">&nbsp;</a>');
            itemOper.push('<a class="detail" title="详情" href="###" data-action="detail">&nbsp;</a>');
            // itemOper.push( '<a class="delete" title="删除" href="###" data-action="delete">&nbsp;</a>' );
            if (ACCESS[2603]) itemOper.push('<a class="label" title="挂栏目" href="###" data-action="label">&nbsp;</a>');
            if (ACCESS[2603]) itemOper.push('<a class="copyright" title="版权时间" href="###" data-action="copyright">&nbsp;</a>');
        } else if (data.status == 65003) {
            if (ACCESS[2602]) itemOper.push('<a class="release" title="重新发布" href="###" data-action="release">&nbsp;</a>');
            if (ACCESS[2602]) itemOper.push('<a class="time" title="定时发布" href="###" data-action="time">&nbsp;</a>');
            if (ACCESS[2601]) itemOper.push('<a class="submit" title="重新提交" href="###" data-action="submit">&nbsp;</a>');
            itemOper.push('<a class="detail" title="详情" href="###" data-action="detail">&nbsp;</a>');
            if (ACCESS[2603]) itemOper.push('<a class="delete" title="删除" href="###" data-action="delete">&nbsp;</a>');
            if (ACCESS[2603]) itemOper.push('<a class="copyright" title="版权时间" href="###" data-action="copyright">&nbsp;</a>');
        }

        tempData.itemOper = itemOper.join("");

        return tempData;
    },
    /**
     * 创建任务列表模板
     * @return {String}      返回对应列表表格项模板
     */
    createTable: function(status) {
        var table = ['<ul>'],
            temp = ["<ul id='news_${tempID}' data-id='${tempID}' data-status='${tempStatus}' data-time='${tempTime}' title='${tempName}'>"]; // PS:标题可能带有英文双引号，所以修改为字符串用双引号括住

        //checkbox
        table.push('<li class="workBar-table-check"><span><input type="checkbox" value="all"></span></li>');
        temp.push('<li class="workBar-table-check"><span data-id="${tempID}" data-status="${tempStatus}"><input type="checkbox"></span></li>');

        if (NAV != "auditingNews") {
            //序号
            table.push('<li class="workBar-table-number">序号</li>');
            temp.push('<li class="workBar-table-number">${index}</li>');
        }

        //名称
        table.push('<li class="workBar-table-name" >新闻标题</li>');
        temp.push("<li class='workBar-table-name' title='${tempName}'>${tempName}</li>"); // PS:标题可能带有英文双引号，所以修改为字符串用双引号括住

        //提供商
        table.push('<li class="workBar-table-provider">提供商</li>');
        temp.push('<li class="workBar-table-provider" title="${tempProvider}">${tempProvider}</li>');

        if (NAV != "auditingNews") {

            //内容来源
            table.push('<li class="workBar-table-author">来源</li>');
            temp.push('<li class="workBar-table-author" title="${tempAuthor}">${tempAuthor}</li>');

            //分类
            table.push('<li class="workBar-table-label">子类型</li>');
            temp.push('<li class="workBar-table-label" title="${tempLabelName}">${tempLabelName}</li>');

            if (NAV == "rejectedNews") {
                //状态
                table.push('<li class="workBar-table-status">状态</li>');
                temp.push('<li class="workBar-table-status" title="${tempStatusDesc}">${tempStatusDesc}</li>');

                //驳回理由
                table.push('<li class="workBar-table-desc">驳回理由</li>');
                temp.push('<li class="workBar-table-desc" title="${tempDesc}">${tempDesc}</li>');
            }

            //阅读量
            if (NAV == "releasedNews" || NAV == "removedNews") {
                table.push('<li class="workBar-table-amount">阅读量</li>');
                temp.push('<li class="workBar-table-amount" title="${tempAmount}">${tempAmount}</li>');
            }
        }

        //时间
        table.push('<li class="workBar-table-time">时间</li>');
        temp.push('<li class="workBar-table-time" title="${tempTime}">${tempTime}</li>');

        //操作
        if (NAV != "auditingNews") {
            table.push('<li class="workBar-table-operate">操作</li>');
            temp.push('<li class="workBar-table-operate">${itemOper}</li>');
        } else {
            table.push('<li class="workBar-table-operate short">操作</li>');
            temp.push('<li class="workBar-table-operate short">${itemOper}</li>');
        }

        //结束模板的一行数据
        table.push('</ul>');
        temp.push('</ul>');

        var $table = $(".workBar-items-wraper .workBar-table");

        $table.show().find("ul").remove();

        $table.find(".workBar-table-title").html(table.join(""));

        return temp.join("");
    },
    /**
     * 列表操作
     * @param  {String} action 操作名称
     * @param  {Object} $focus 被选中格子的jQuery对象
     * @param  {function} fn 成功后的回调函数
     * @return 无返回值
     */
    operates: function(action, $focus, fn) {
        $focus = $focus || $(".workBar-table-content > ul").has("li.workBar-table-check span.active");

        $(".timedFrame").hide();

        var self = this,
            oper = {};

        switch (action) {
            case "submit": // 重新提交
                oper.name = "重新提交";
                oper.url = "get_submit";
                oper.params = {
                    result: 1
                };
                oper.callback = fn;
                break;
            case "detail": //详情
                self.detail($focus);
                return;
            case "label": //栏目
                self.label($focus);
                return;
            case "copyright": //版权时间
                self.copyright($focus);
                return;
            case "delete": //删除
                oper.name = "删除";
                oper.url = "get_delete";
                oper.params = {};
                oper.callback = fn;
                break;
            case "release":
                oper.name = "发布";
                oper.url = "get_release";
                oper.params = {};
                oper.callback = fn;

                self.release(oper, $focus);
                return;
            case "reject":
                var desc = [],
                    $operate = $(".hiddenBar-operate-wraper"),
                    $select = $operate.find(".selection-box.active font"),
                    text = $operate.find(".hiddenBar-textarea textarea").val();

                $select.each(function(i, el) {
                    desc.push($(el).html());
                });

                if (text) desc.push(text);

                oper.name = "驳回";
                oper.url = "get_review";
                oper.params = {
                    result: 0
                };
                oper.callback = fn;

                if (desc.length > 0) oper.params.desc = desc.join("|");
                break;
            case "remove":
                oper.name = "下架";
                oper.url = "get_remove";
                oper.callback = fn;
                oper.params = {};
                break;
            case "time":
                self.setReleaseTime($focus);
                return;
            case action:
                return;
        }

        self.ajaxByGroup(oper, $focus);
    },

    ajaxByGroup: function(oper, $focus) {
        var fn = oper.callback,
            options = {
                layerID: "news-operate",
                content: {
                    html: "<p>确定要" + oper.name + "这" + $focus.length + "条新闻吗？</p>"
                },
                footer: {
                    buttons: [{
                        callback: function() {
                            //总个数
                            var count = $focus.length,
                                //成功操作的个数
                                success = 0;

                            if (count > 0) {
                                //操作进度框
                                var $delBox = $.custom({
                                    layerID: "data-operating",
                                    width: "280px",
                                    height: "110px",
                                    content: {
                                        icon: false,
                                        html: '<p class="oper-title">正在' + oper.name + '...</p>' +
                                            '<div class="oper-bar"><div class="oper-progress"></div></div>' +
                                            '<div class="oper-data"><span class="oper-percent">0%</span><span class="oper-counting">(<span class="oper-suc">0</span>/' + count + ')</span></div>'
                                    }
                                });

                                //开始操作
                                operate(function(suc, total, $mate) {

                                    //改变操作进度框的数据
                                    var percent = Math.floor(suc * 100 / total);
                                    $delBox.find(".oper-percent").html(percent + "%");
                                    $delBox.find(".oper-suc").html(suc);
                                    $delBox.find(".oper-progress").css("width", percent + "%");

                                    if (suc == total) {
                                        iHomed.runFunction(fn);
                                        $.tLayer("close", "data-operating", function() {
                                            var module = window[NAV];
                                            // 记录当前的页码
                                            PAGENUM = $("#pageNav-wraper").iHomed("tPager", "pageNum");

                                            module && module.init(PAGENUM);
                                        });
                                    } else {
                                        operate(arguments.callee);
                                    }
                                });

                            }

                            /**
                             * 操作material
                             * @param  {Function}   fn     操作一个app后的回调
                             * @return 无返回值
                             */
                            function operate(fn) {

                                if (success >= count) {
                                    return false;
                                }

                                var index = count - (++success),
                                    $mate = $focus.eq(index),
                                    newsid = $mate.data("id");

                                var params = {
                                    accesstoken: TOKEN,
                                    newsid: newsid
                                }

                                $.extend(params, oper.params);

                                var options = {
                                    url: oper.url,
                                    timeout: 3600000,
                                    data: params,
                                    success: function(data) {
                                        if (data.ret == 0) {
                                            if (fn && typeof fn === "function") {
                                                fn(success, count, $mate);
                                            }
                                            $focus.remove();
                                        } else {
                                            $.tLayer("close", "data-operating", function() {
                                                $.alert(oper.name + "发生错误！");
                                            });
                                        }
                                    },
                                    error: function() {
                                        $.tLayer("close", "data-operating", function() {
                                            $.alert(oper.name + "发生错误！");
                                        });
                                    }
                                }

                                iHomed("setData", options);

                            }
                        }
                    }]
                }
            };

        if (oper.ignore) {
            options.footer.buttons[0].callback();
        } else {
            $.confirm(options);
        }
    },

    release: function(oper, $focus) {
        var self = this;

        oper.ignore = true;

        $.custom({
            height: "140px",
            width: "300px",
            content: {
                padding: "0px",
                html: '\
                    <label for="">设置栏目上架时间</label>\
                    <input id="ontime" type="text" style="width: 110px;" />\
                    <p style="font-size: 12px; color:red">时间为空则默认为最早可上架时间</p>'
            },
            onInit: function() {
                var $this = topFrame.$(this),
                    $time = $this.find("#ontime"),
                    nowtime = parseInt((new Date()).getTime() / 1000),
                    timeArr = iHomed.timeFormat(nowtime).replace(/[\-]/g, "/").split(" ");

                $time.datetimepicker({
                    formatTime: 'H:i',
                    formatDate: 'Y/m/d',
                    defaultDate: timeArr[0],
                    defaultTime: timeArr[1],
                    minDate: timeArr[0],
                    minDateTime: nowtime * 1000,
                    step: 15,
                    onShow: function(ct) {
                        var $this = $(this);

                    },
                    timepickerScrollbar: false
                });
            },
            footer: {
                padding: "0px",
                buttons: [{
                    buttonText: "上架",
                    width: "33.3%",
                    callback: function(layerID) {
                        var $this = topFrame.$(this),
                            $time = $this.find("#ontime"),
                            time = $time.val();

                        if (time) {
                            time = parseInt(iHomed.date2utc(time) / 1000);

                            oper.params.ontime = time;
                        }

                        self.ajaxByGroup(oper, $focus);

                        $time.datetimepicker("destroy");

                        tLayer("close", layerID);
                    }
                }, {
                    width: "33.3%",
                    buttonText: "不上架",
                    callback: function(layerID) {
                        var $this = topFrame.$(this),
                            $time = $this.find("#ontime");

                        oper.params.ontime = -1;

                        self.ajaxByGroup(oper, $focus);

                        $time.datetimepicker("destroy");

                        tLayer("close", layerID);
                    }
                }, {
                    width: "33.3%",
                    buttonText: "取消",
                    callback: function(layerID) {
                        var $this = topFrame.$(this),
                            $time = $this.find("#ontime");

                        $time.datetimepicker("destroy");

                        tLayer("close", layerID);
                    }
                }]
            }
        });
    },
    /**
     * 任务列表事件绑定
     */
    bindEvents: function() {
        var self = this,
            $workBarItem = $(".workBar-items");

        // 勾选事件
        $workBarItem
            .off("click", ".workBar-table li.workBar-table-check span")
            .on("click", ".workBar-table li.workBar-table-check span", function(e) {
                $(this).toggleClass("active");

                var $this = $(this),
                    $input = $this.find("input"),
                    $content = $(".workBar-table-content"),
                    $spans = $content.find("li.workBar-table-check span"),
                    $titlespan = $(".workBar-table-title li.workBar-table-check span");

                if ($input.val() == "all") {
                    if ($this.hasClass("active")) {
                        $spans.addClass("active");
                    } else {
                        $spans.removeClass("active");
                    }
                } else {
                    if ($spans.not("span.active").length == 0) {
                        $titlespan.addClass("active");
                    } else {
                        $titlespan.removeClass("active");
                    }
                }

                iHomed("disableTools", "*:not(tool-filter tool-add tool-edit)");

                var $active = $spans.filter("span.active");
                if ($active.length > 1) {
                    iHomed("enableTools", "*:not(tool-detail)");
                } else if ($active.length == 1) {
                    iHomed("enableTools", "*");
                }

                e.stopPropagation();
                return false;
            })
            .off("click", ".workBar-table .workBar-table-content > ul")
            .on("click", ".workBar-table .workBar-table-content > ul", function() {
                var $this = $(this),
                    $uls = $this.parent().find("> ul");

                // if( NAV != "auditingNews" )return;

                $uls.removeClass('active');
                $this.addClass('active');

                if (NAV == "auditingNews") { // 待审核列表下
                    self.getReviewInfo($this);
                } else { // 其他列表下
                    self.operates("detail", $this);
                }
            })
            .off("click", ".workBar-table-operate a")
            .on("click", ".workBar-table-operate a", function(e) {
                var $this = $(this),
                    $ul = $(this).parent().parent();

                if ($this.hasClass("disable")) return;

                self.operates($this.data("action"), $ul);

                e.stopPropagation();
                return false;
            });

        $(".workBar-table")
            // 点击类型筛选按钮
            .off("click", ".table-filter-wrapper ul > li")
            .on("click", ".table-filter-wrapper ul > li", function() {
                var $this = $(this),
                    type = $this.data("type"),
                    $lis = $this.parent().find("> li");

                if ($this.hasClass("active")) {
                    return;
                } else {
                    $lis.not($this).removeClass("active");
                    $this.addClass("active");
                }

                self.initPagingList(type);
            });

        $(".hiddenBar")
            // 审核模块选择
            .off("click", ".hiddenBar-module > span")
            .on("click", ".hiddenBar-module > span", function(e) {
                var $this = $(this),
                    module = $this.data("module"),
                    $spans = $this.parent().find("> span"),
                    $content = $(".hiddenBar-content-wraper"),
                    $text = $content.find("p"),
                    $poster = $content.find("img"),
                    $media = $(".hiddenBar-media-wraper");

                // if( $this.hasClass('active') )return;

                $spans.removeClass('active');
                $this.addClass('active');

                switch (module) {
                    case "all":
                        $content.show();
                        $text.show();
                        $poster.show();
                        $media.hide();
                        break;
                    case "text":
                        $content.show();
                        $text.show();
                        $poster.hide();
                        $media.hide();
                        break;
                    case "poster":
                        $content.show();
                        $poster.show();
                        $text.hide();
                        $media.hide();
                        break;
                    case "tts":
                        $content.show();
                        $media.show();
                        $text.show();
                        $poster.hide();
                }

                util.adjustWindow();
            });

        $(".hiddenBar")
            // 驳回意见勾选
            .off("click", ".hiddenBar-selection .selection-box")
            .on("click", ".hiddenBar-selection .selection-box", function(e) {
                var $this = $(this),
                    $boxes = $this.parent().find(".selection-box"),
                    $release = $(".hiddenBar-buttons > span.release"),
                    $reject = $(".hiddenBar-buttons > span.reject"),
                    $text = $(".hiddenBar-textarea textarea");

                $this.toggleClass('active');

                if ($boxes.filter(".active").length == 0 && $text.val() == "") {
                    $release.removeClass('disable');
                    $reject.addClass('disable');
                } else {
                    $release.addClass('disable');
                    $reject.removeClass('disable');
                }
            })
            // 驳回意见输入
            .off("input", ".hiddenBar-textarea textarea")
            .on("input", ".hiddenBar-textarea textarea", function(e) {
                var $this = $(this),
                    $boxes = $(".hiddenBar-selection .selection-box"),
                    $release = $(".hiddenBar-buttons > span.release"),
                    $reject = $(".hiddenBar-buttons > span.reject");

                if ($boxes.filter(".active").length == 0 && $this.val() == "") {
                    $release.removeClass('disable');
                    $reject.addClass('disable');
                } else {
                    $release.addClass('disable');
                    $reject.removeClass('disable');
                }
            });

        // 筛选栏事件
        $(".workBar-tools .workBar-tools-filter")
            .off()
            .on("click", ".filterlist .filterchild > li", function(e) {
                var $this = $(this),
                    $span = $this.find("> span"),
                    $list = $this.closest('.filterchild'),
                    $spans = $list.find('> li > span'),
                    $all = $spans.eq(0),
                    $notAll = $spans.not(":eq(0)"),
                    $filter = $this.closest('.filterlist'),
                    type = $filter.data("type"),
                    value = $span.data("value"),
                    values = [],
                    module = window[NAV] || {},
                    params = module.lastSetting || {};

                $span.toggleClass('active');

                var $active = $notAll.filter('.active');

                if (value == "" || value == 0) {
                    if ($span.hasClass('active')) {
                        $spans.addClass('active');
                        params[type] = value;
                    } else {
                        $spans.removeClass('active');
                        delete params[type];
                    }
                } else if ($active.length > 0 && $notAll.length == $active.length) {
                    $all.addClass('active');
                    params[type] = $all.data("value");
                } else {
                    $all.removeClass("active");

                    $active.each(function(index, el) {
                        var $el = $(el),
                            val = $el.data("value");

                        if (val == 0 || val == "") {
                            $el.removeClass('active');
                            return true;
                        }

                        values.push(val);
                    });

                    params[type] = values.join("|");
                }

                if (params[type] === "") {
                    delete params[type];
                }

                console.log(params);

                module.init(1);
            })
            .on("click", '.sortlist .sortchild', function(e) {
                var $this = $(this),
                    $input = $this.find("> input"),
                    $list = $this.closest('.sortlist'),
                    $sorts = $list.find('.sortchild'),
                    $inputs = $sorts.find("> input"),
                    sortby = $this.data("sortby"),
                    asc = $this.data("asc"),
                    module = window[NAV] || {},
                    params = module.lastSetting;

                $sorts.removeClass('active');
                $this.addClass('active');
                $input.prop("checked", true);

                if (typeof sortby != "undefined") {
                    params.sortby = sortby;
                } else {
                    delete params.sortby;
                }

                if (typeof asc != "undefined") {
                    params.asc = asc;
                } else {
                    delete params.asc;
                }

                module.init(1);

            });
    },
    /**
     * 获取审核内容
     * @param  {object} $focus 列表中选中行的jquery对象
     * @return 无
     */
    getReviewInfo: function($focus) {
        var nid = $focus.data("id"),
            title = $focus.attr("title");

        var self = this;

        var $hiddenBar = $(".hiddenBar"),
            $content = $hiddenBar.find(".hiddenBar-content-wraper"),
            $title = $hiddenBar.find('.hiddenBar-title'),
            $module = $hiddenBar.find('.hiddenBar-module span'),
            $editBar = NewsEdit.$edit;

        $content.empty();

        _audioFrame.location.href = "popupPage/audioedit.html";

        $hiddenBar.data("id", nid);

        iHomed("disableTools", "tool-edit");

        if (!nid) {
            NewsEdit.init();
            $editBar.hide();

            $title.html("没有待审核内容");
            return;
        } else {
            $title.html(title);
        }

        // 获取信息
        var option = {
            url: "get_news_info",
            type: "GET",
            data: {
                accesstoken: TOKEN,
                newsid: nid
            },
            success: function(data) {
                var id = $hiddenBar.data("id");

                if (id != nid) return; //防止频繁点击时，刷新出来的新闻详情与最后选中的新闻不相同

                if (data.ret == 0) {
                    //防止传入数据类型错误
                    if (data.info.newsimglist == "[]") {
                        data.info.newsimglist = {};
                    }
                    var info = data.info || {},
                        audiourl = (info.audio || {}).audiourl || "",
                        // content     = ( info.content || "" ).split( "\n" ),
                        imglist = data.info.newsimglist || {},
                        thumblist = info.thumbnailpiclist || {},
                        newsimgsize = [],
                        $imgs;

                    data.id = nid;
                    data.newsimgsize = newsimgsize;
                    data.newsimgidx = 0;

                    if ($editBar.is(":visible")) {
                        NewsEdit.init(data);
                    } else {
                        NewsEdit.currData = data;
                    }

                    // 加载新闻音频
                    _audioFrame.location.href = "popupPage/audioedit.html?audiourl=" + audiourl;

                    // 略缩图
                    if (!$.isEmptyObject(thumblist)) {
                        var thumbsize = CONFIG.thumbsize || "",
                            thumburl = thumblist["dir"] + thumblist[thumbsize];

                        data.thumburl = thumburl;

                        $imgs = $('<div class="content-img-title">标题略缩图</div>').add('<div class="content-img" title="' + thumbsize + '" data-index="1"><img src="images/default_img.png" /></div>');

                        iHomed.loadPoster($imgs.find("img"), thumburl);
                    }

                    // 新闻海报
                    if (!$.isEmptyObject(imglist)) {
                        var dir = imglist["dir"] || "";

                        var $title = $('<div class="content-img-title">正文配图</div>');

                        if ($imgs) {
                            $imgs = $imgs.add($title);
                        } else {
                            $imgs = $title;
                        }

                        $.each(imglist, function(key, val) {
                            if (key == "dir") return true;

                            var list = val.split("|");

                            for (var i = 0; i < list.length; ++i) {
                                var name = list[i],
                                    index = parseInt(name.split(".")[0].split("_")[1]) || 1,
                                    $img = $('<div class="content-img" title="' + name + '" data-index="' + index + '"><img src="images/default_img.png" /></div>'),
                                    url = dir + name;

                                if (data.newsimgidx < index) {
                                    data.newsimgidx = index;
                                }

                                newsimgsize.push(name);

                                iHomed.loadPoster($img.find("img"), url);

                                $imgs = $imgs.add($img);
                            }
                        });
                    }

                    // 加载图片列表
                    if ($imgs) $content.append($imgs);

                    // 加载新闻内容
                    // if( content )
                    // for( var i = 0; i < content.length; ++i ){
                    //     var p = $.trim( content[i] );

                    //     if(p)$content.append( '<p>' + p + '</p>' );
                    // }

                    var $textarea = $('<textarea>' + info.content + '</textarea>').prop("readonly", true);

                    $content.append($textarea);

                    $textarea.css("height", $textarea[0].scrollHeight);

                    // 加载原始id
                    if (info.originalid) {
                        $content.append('<div class="content-note">原始id：' + info.originalid + '</div>');
                    }

                    // 加载链接地址
                    if (info.linkurl) {
                        $content.append('<div class="content-note">链接地址：' + info.linkurl + '</div>');
                    }

                    ($module.filter(".active").length > 0 ? $module.filter(".active") : $module).eq(0).trigger('click');

                    iHomed("enableTools", "tool-edit");

                } else {

                    option.error();

                }

            },
            error: function() {

                NewsEdit.currData = null;

                $.alert("获取新闻详情失败");

            }
        };

        // 请求数据
        iHomed("getData", option);
    },
    /**
     * 新闻详情弹窗
     * @param  {object} $focus 列表中指定行的jquery对象
     * @return 无
     */
    detail: function($focus) {
        var self = this;

        // 获取新闻的基本信息
        var newsid = $focus.data("id"),
            status = $focus.data("status"),
            title = $focus.attr("title");

        // 参数设置
        var params = [
            // 身份令牌
            "accesstoken=" + TOKEN,
            // 新闻id
            "newsid=" + newsid,
            // 防止窗口缓存
            "_=" + $.now()
        ];

        // 详情弹窗的操作按钮
        var buttons = [];

        // 关闭本窗口的回调函数
        var _fn = function() {
            $.tLayer("close", "newsDetail-layer");
        };

        if (status == 59998 || status == 60049) {
            buttons.push({
                buttonText: "重新提交",
                callback: function() {

                    self.operates("submit", $focus, _fn);

                }
            });
        } else if (status == 65002) {
            buttons.push({
                buttonText: "下架",
                callback: function() {

                    self.operates("remove", $focus, _fn);

                }
            });
        } else if (status == 65003) {
            buttons.push({
                buttonText: "重新发布",
                callback: function() {

                    self.operates("release", $focus, _fn);

                }
            });
        }

        buttons.push({
            buttonText: "取消",
            callback: function() {

                _fn();

            }
        });


        // 新建任务
        var boxOpt = {
            layerID: "newsDetail-layer",
            width: "590px",
            height: "230px",
            onInit: function() {

                //保存弹出框jQ对象
                var $layer = $(this);

            },
            header: {
                text: title
            },
            content: {
                padding: "0px",
                height: "500px",
                frameName: "newsDetail",
                frameID: "newsDetail",
                src: "popupPage/newsDetail.html?" + params.join("&")
            },
            footer: {
                buttons: buttons
            }
        };

        // 新闻详情弹窗
        $.content(boxOpt);
    },
    /**
     * 栏目挂载
     * @param  {object} $focus 列表中指定行的jquery对象
     * @return 无
     */
    label: function($focus, fn) {
        var self = this;

        // 获取新闻的基本信息
        var newsid = [];

        $focus.each(function() {
            var id = $(this).data("id");

            newsid.push(id);
        });

        $.content({
            layerID: "selectType",
            width: "600px",
            height: "540px",
            onInit: function() {

                //保存弹出框jQ对象
                var $layer = $(this);

            },
            header: { text: "栏目挂载" },
            content: {
                frameName: "selectType",
                padding: "0 0 0 5px",
                src: "popupPage/selectType.html?newsid=" + newsid.join("|")
            },
            footer: {
                buttons: [{
                    buttonText: "确定",
                    buttonID: "selectType-confirm",
                    callback: function() {

                        topFrame.frames["selectType"]
                            .SelectType.submitSelectType(fn);
                    }
                }, {
                    buttonText: "关闭",
                    callback: function() {
                        $.tLayer("close");
                    }
                }]
            }
        });
    },
    /**
     * 版权时间
     * @param  {object} $focus 列表中指定行的jquery对象
     * @return 无
     */
    copyright: function($focus, fn) {
        var self = this;

        // 获取新闻的基本信息
        var newsid = $focus.data("id");

        $.content({
            layerID: "copyrightTime",
            width: "460px",
            height: "300px",
            onInit: function() {

                //保存弹出框jQ对象
                var $layer = $(this);

            },
            header: { text: "版权时间 - " + $focus.attr("title") },
            content: {
                frameName: "copyrightTime",
                padding: "0 0 0 5px",
                src: "popupPage/copyrightTime.html?newsid=" + newsid
            },
            footer: {
                buttons: [{
                    buttonText: "确定",
                    callback: function() {

                        topFrame.frames["copyrightTime"].NewsEditor.saveData(function() {
                            $.tLayer("close", "copyrightTime");
                        });
                    }
                }, {
                    buttonText: "关闭",
                    callback: function() {
                        $.tLayer("close", "copyrightTime");
                    }
                }]
            }
        });
    },
    /**
     * 设置定时发布
     * @param {[type]} $focus [description]
     */
    setReleaseTime: function($focus) {
        // 获取当前时间
        var now = new Date(),
            nowDateTime = iHomed.timeFormat(parseInt(now.getTime() / 1000)).replace(/[\-]/g, "/").split(" "),
            untime = $focus.find(".time.isset").length ? $focus.data("time") : "";

        var $opt = $focus.find(".workBar-table-operate"),
            opt = $opt.offset(),
            posX = opt.left,
            posY = opt.top,
            itemsWidth = $(".workBar-items").width(),
            $timedFrame = $(".timedFrame"),
            targetid, targetname;

        targetid = $focus.data("id");
        targetname = $focus.attr("title");

        left = itemsWidth - posX - (untime ? 240 : 170);

        if (left < 0) posX += left;

        $timedFrame.css({ "left": posX + "px", "top": posY + "px" }).show();

        // 初始化定时发布的时间选择控件
        $timedFrame
            .data("targetid", targetid)
            .data("targetname", targetname)
            .find(".datetime")
            .datetimepicker({
                defaultDate: nowDateTime[0],
                defaultTime: nowDateTime[1],
                minDate: nowDateTime[0],
                minDateTime: now.getTime(),
            })
            .val((untime || nowDateTime.join(" ")).replace(/[\-]/g, "/"))
            .end()
            .find('[data-action="cancel"]')
            .toggle(untime != "");
    }
};

var NewsEdit = {

    $edit: $(".editBar"),

    currData: null,

    init: function(object) {
        var $editBar = this.$edit,
            $module = $editBar.find('.editBar-module span').removeClass('active'),
            $posterBtn = $editBar.find('.edit-btns button[data-action="edit"]');

        if (!this.isBind) this.bindEvents();

        this.empty();

        $posterBtn.addClass('disable');

        if (object && object.ret == 0) {
            var data = object.info,
                imglist = data.newsimglist || {},
                thumblist = data.thumbnailpiclist || {},
                $imgs;

            this.currData = object;

            $module.filter('[data-mode="edit"]').addClass('active');

            // id
            $("#edit-id").val(object.id).closest('li').show();

            // 名称
            $("#edit-name").val(data.title);

            // 数据提供商
            $("#edit-provider").val(data.providerid);

            // 内容提供商
            $("#edit-author").val(data.source);

            // 发布时间
            $("#edit-release-time").val((data.releasetime || "").replace(/[\-]/g, "/")).prop('readonly', true);

            // 分类
            $("#edit-subtype").siblings('input').val(data.subtype).trigger('change');

            // 简介
            $("#edit-synopsis").val(data.synopsis);

            // 链接地址
            $("#edit-link-url").val(data.linkurl);

            // 关键字
            $("#add-keyword").val((data.keywords || []).join("|")).trigger('change');

            // 正文
            $("#edit-content").val(data.content);

            // 加载略缩图
            if (!$.isEmptyObject(thumblist)) {
                var thumbsize = CONFIG.thumbsize;

                $imgs = $('<div class="edit-img-title">标题略缩图</div>').add('<div class="edit-img" title="' + thumbsize + '" data-index="1"><img src="images/default_img.png" /><p>' + thumbsize + '</p></div>');

                iHomed.loadPoster($imgs.find("img"), thumblist["dir"] + thumblist[thumbsize]);
            }

            // 加载新闻海报
            if (!$.isEmptyObject(imglist)) {
                var dir = imglist["dir"] || "";

                var $title = $('<div class="edit-img-title">正文配图</div>');

                if ($imgs) {
                    $imgs = $imgs.add($title);
                } else {
                    $imgs = $title;
                }

                $imgs = $imgs.add($('<div class="size-list size-list-first"><div class="size-td size-title">尺寸</div><div class="size-td size-title">海报</div></div>'))

                $.each(imglist, function(key, val) {
                    if (key == "dir") return true;

                    var list = val.split("|"),
                        $size = $('<div class="size-list"><div class="size-td size-title">' + key + '</div><div class="size-td"></div></div>'),
                        $list = $size.find(".size-td").eq(-1);

                    for (var i = 0; i < list.length; ++i) {
                        var name = list[i],
                            index = parseInt(name.split(".")[0].split("_")[1]) || 1,
                            $img = $('<div class="edit-img" title="' + name + '" data-index="' + index + '"><img src="images/default_img.png" /><p>' + name.split(".")[0] + '</p></div>');

                        iHomed.loadPoster($img.find("img"), dir + name);

                        $list.append($img);
                    }

                    $imgs = $imgs.add($size);
                });
            }

            $editBar.find(".edit-poster .edit-list").append($imgs || "");
        } else {
            // this.currData = null;

            $module.filter('[data-mode="add"]').addClass('active');

            $("#edit-id").closest('li').hide();

            $("#edit-release-time").prop('readonly', false);
        }

        $editBar.show();

        util.adjustWindow();
    },

    empty: function() {
        var $edit = $(".editBar-wraper");

        var now = parseInt((new Date()).getTime() / 1000),
            dateTime = iHomed.timeFormat(now).replace(/[\-]/g, "/").split(" ");

        $edit.find("input, select, textarea").val("");

        // 复原时间控件时间
        $("#edit-release-time").datetimepicker({
            defaultDate: dateTime[0],
            defaultTime: dateTime[1],
        }); //.val( dateTime.join( " " ) );

        this.metaTag($("#edit-keyword .tag-contains"), [""], 2);

        $("#edit-subtype").data("value", null).find("option.active").removeClass('active').end().siblings('input').val("");

        $edit.find(".edit-poster .edit-list").empty();
    },

    bindEvents: function() {
        var self = this,
            $edit = self.$edit,
            $posterBtn = $edit.find('.edit-btns button[data-action="edit"]');

        var subtype = (CONTENTTYPE["资讯"] || {}).subType || {},
            sHtml = "",
            pHtml = "";

        // 获取资讯的subtype
        $.each(subtype, function(id, name) {
            sHtml += '<option value="' + id + '">' + name + '</option>';
        });

        // 获取资讯的提供商
        $.each(PIDS, function(id, name) {
            pHtml += '<option value="' + id + '">' + name + '</option>';
        });

        // 填充资讯类型选项
        $("#edit-subtype").html(sHtml);

        // 填充数据提供商选项
        $("#edit-provider").html(pHtml);

        // 初始化时间控件
        $("#edit-release-time").datetimepicker({
            formatTime: 'H:i',
            formatDate: 'Y/m/d',
            step: 15,
            timepickerScrollbar: false,
            onChangeDateTime: function(currTime, $input) {
                var val = $input.val();

                if (val) $input.val(val + ":00");
            }
        });

        // 编辑界面按钮事件
        $(".editBar-buttons").off().on("click", "> span", function(e) {
            var $this = $(this),
                action = $this.data("action"),
                id = $edit.find("#edit-id").val();

            if ($this.hasClass('disable')) return;

            switch (action) {
                case "cancel":
                    $edit.hide();
                    break;
                case "reset":
                    self.init(self.currData);
                    break;
                case "confirm":
                    self.confirm(function(data) {
                        console.log(data.ret);
                        if (data.ret == 0) {
                            id = id || (data.newsid_list || [])[0];

                            auditingNews.init(1, id);

                            $.msg("保存成功");
                        }
                    });
                    break;
                case "poster":

                    break;
            }
        });

        // 编辑界面图片点击事件
        $(".edit-poster").off()
            .on("click", ".edit-img", function(e) {
                var $this = $(this);

                $this.toggleClass('active').closest('.edit-poster').find('.edit-img.active').not($this).removeClass('active');

                if ($this.hasClass('active')) {
                    $posterBtn.removeClass("disable");
                } else {
                    $posterBtn.addClass("disable");
                }
            })
            .on("click", ".edit-btns button", function(e) {
                var $this = $(this),
                    action = $this.data("action"),
                    isEdit = action == "edit",
                    id = $edit.find("#edit-id").val();

                if ($this.hasClass('disable')) return;

                if (!id) {
                    $.confirm({
                        content: {
                            html: "编辑图片需要先保存，是否继续？"
                        },
                        footer: {
                            buttons: [{
                                callback: function() {
                                    self.confirm(function(data) {
                                        if (data.ret == 0) {
                                            var id = (data.newsid_list || [])[0];

                                            self.currData = { id: id }

                                            self.poster({
                                                id: id,
                                                callback: function() {
                                                    auditingNews.init(1, id);
                                                }
                                            });
                                        } else {
                                            $.alert("保存失败");
                                        }
                                    });
                                }
                            }]
                        }
                    });
                } else {
                    var $img = $edit.find(".edit-poster .edit-img.active"),
                        index = isEdit ? $img.data("index") : "",
                        src = isEdit ? $img.find("img").attr("src") : "";

                    self.poster({
                        id: id,
                        idx: index,
                        url: src,
                        callback: function() {
                            auditingNews.init(1, id);
                        }
                    });
                }
            });

        // 展开/收起编辑模块
        $(".edit-title").off().on("click", function(e) {
            var $this = $(this);

            $this.toggleClass('hide').next("div").toggle();

            util.adjustWindow();
        });

        // 下拉多选框事件
        $(".muti-select").off()
            .on("change", "select", function(e) {
                var $this = $(this),
                    $input = $this.siblings('input'),
                    value = parseInt($this.val()),
                    $option = $this.find('option[value="' + value + '"]'),
                    name = $option.text(),
                    value_arr = $this.data("value") || [],
                    name_arr = ($input.val() || name).split("|"),
                    value_idx = value_arr.indexOf(value),
                    name_idx = name_arr.indexOf(name);

                $option.toggleClass('active');

                if ($option.hasClass('active')) {
                    if (value_idx == -1) {
                        value_arr.push(value);
                    }

                    if (name_idx == -1) {
                        name_arr.push(name);
                    }
                } else {
                    if (value_idx != -1) {
                        value_arr.splice(value_idx, 1);
                    }

                    if (name_idx != -1) {
                        name_arr.splice(name_idx, 1);
                    }
                }

                console.log(value_arr);
                $this.val("").data("value", value_arr);
                $input.val(name_arr.join("|"));
            })
            .on("change", "input", function(e) {
                var $this = $(this),
                    this_arr = ($this.val() || "").split("|")
                value_arr = [],
                    name_arr = [],
                    $select = $this.siblings('select');

                $select.val("").find('option').removeClass('active');

                for (var i = this_arr.length - 1; i >= 0; --i) {
                    var id = parseInt(this_arr[i]),
                        $option = $select.find('option[value="' + id + '"]');

                    if ($option.length > 0) {
                        name_arr.unshift($option.text());
                        value_arr.unshift(id);
                        $option.addClass('active');
                    }
                }

                $select.data("value", value_arr);
                $this.val(name_arr.join("|"));
            });

        // 标签式输入框事件
        $(".edit-tag")
            // 删除标签事件
            .on({
                "click": function() {

                    var $this = $(this),
                        $wraper = $this.parents(".tag-contains"),
                        tag = $this.next().html();

                    self.metaTag($wraper, tag, 1);

                }
            }, ".delete-tag")
            // 添加标签
            .on({
                "keydown": function(e) {
                    var $this = $(this);

                    if (e.which == 13 || e.which == 32) { //按空格和回车确定
                        addTag(this);
                        return false;
                    } else if ($this.val() == "" && e.which == 8) { //输入框为空时按删除键删除上一个

                        $this.prev(".tag-contains").find("span:last-child .delete-tag").click();

                    }
                },
                "change": function(e) {
                    addTag(this);
                }
            }, ".add-tag");

        function addTag(_this) {

            var $this = $(_this),
                tags = $.trim($this.val()),
                $wraper = $this.siblings(".tag-contains"),
                tagsTotal = $wraper.data("tags") ? $wraper.data("tags").length : 0,
                tagSelected = [],
                repeat = [];

            tags = tags.split(/[，、|,\/]/);


            $.each(tags, function(i, tag) {
                if ($.trim(tag) == "") {
                    //过滤空标签
                } else if ($.inArray(tag, $wraper.data("tags")) != -1) {
                    //过滤重复标签
                    repeat.push(tag);
                } else if ($.inArray(tag, tagSelected) == -1) {
                    tagSelected.push(tag);
                }
            });

            $wraper.siblings('.add-tag').val('');
            if (repeat.length > 0) {
                $.msg("标签" + repeat.join(",") + "已存在");
            }

            if (tagSelected.length == 0) {
                return;
            } else {
                tagsTotal += tagSelected.length;
            }

            if ($this.attr("id") == "add-keywords" && tagsTotal > 10) {
                $.msg("关键字标签最多10个");
                return;
            }

            self.metaTag($wraper, tagSelected, 0);
        }

        self.isBind = true;
    },

    confirm: function(fn) {
        var self = this;
        var $edit = this.$edit;
        var sensitiveword = "";
        var arrWord = [];
        var nowtime = parseInt($.now() / 1000),
            id = $("#edit-id").val(),
            releasetime = $("#edit-release-time").val() || "",
            provider = $("#edit-provider").val() || "",
            author = $("#edit-author").val() || "",
            title = $("#edit-name").val() || "",
            subtype = $("#edit-subtype").data("value") || [],
            linkurl = $("#edit-link-url").val(),
            keywords = $("#edit-keyword .tag-contains").data("tags") || [],
            synopsis = $("#edit-synopsis").val() || "",
            content = $("#edit-content").val() || "";
        if (!title) {
            $.msg("标题不能为空");
            return;
        }

        if (linkurl && !/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/.test(linkurl)) {
            $.msg("链接地址格式不正确");
            return;
        }

        var data = {
            title: title.replace(/\%/g, "%25"),
            subtype: subtype,
            link_url: linkurl,
            keywords: keywords,
            synopsis: synopsis.replace(/\%/g, "%25"),
            content: content.replace(/\%/g, "%25")
        };
        // 主要是区分添加（导入）接口和修改接口某些入参名称不同的问题
        if (id) {
            data.newsid = parseInt(id);
            data.providerid = provider;
            data.source = author;
            if (data.keywords) {
                for (let i = 0; i < data.keywords.length; i++) {
                    arrWord.push(data.keywords[i]);
                }
            }
            console.log(data);
            if (data.title) {
                arrWord.push(data.title);
            }
            if (data.synopsis) {
                arrWord.push(data.synopsis);
            }
            if (data.content) {
                arrWord.push(data.content);
            }
            if (data.source) {
                arrWord.push(data.source);
            }
            sensitiveword = arrWord.join("|");
        } else {
            data.key = "homed" + nowtime;
            data.provider_name = provider;
            data.author_name = author;
            data.release_time = releasetime ? parseInt(iHomed.date2utc(releasetime) / 1000) : nowtime;
            data.category = "";
            data.content_pic = [];

            data = {
                "total": "1",
                "list": [data],
            };
            if (data.list[0].keywords) {
                for (let i = 0; i < data.list[0].keywords.length; i++) {
                    arrWord.push(data.list[0].keywords[i]);
                }
            }
            if (data.list[0].title) {
                arrWord.push(data.list[0].title);
            }
            if (data.list[0].synopsis) {
                arrWord.push(data.list[0].synopsis);
            }
            if (data.list[0].content) {
                arrWord.push(data.list[0].content);
            }
            if (data.list[0].author_name) {
                arrWord.push(data.list[0].author_name);
            }
            sensitiveword = arrWord.join("|");
        }
        //敏感词检测
        console.log(sensitiveword + "有没有敏感词");
        var newData = data;
        this.submitData({
            url: iHomed.api("sensitiveword_check"),
            data: {
                content: sensitiveword
            },
            success: function(data) {
                console.log(data);
                if (data.ret != 7954) {
                    var sensitive_result = data.sensitive_result.split("|");
                    if (sensitive_result.length > 3) {
                        sensitive_result = sensitive_result.splice(0, 3).join("、") + "...";
                    }

                    console.log(sensitive_result);
                    $.alert("数据含有敏感词:'" + sensitive_result + "'不能提交");
                    // return false;
                } else if (data.ret == 7954) {
                    var $loading = $.loading("正在提交");
                    console.log(newData);
                    self.submitData({
                        url: iHomed.api(id ? "post_adjust_news" : "post_import_news"),
                        data: newData,
                        success: function(data) {
                            console.log(data);
                            if (data.ret == 0) {
                                iHomed.runFunction(fn, [data]);
                            } else {
                                $.alert("提交数据失败");
                            }
                        },
                        complete: function() {
                            tLayer("close", $loading.attr("id"));
                        }
                    });

                }
            }

        });
    },

    submitData: function(custom) {
        var self = this;

        var options = {
            type: "POST",
            data: {
                accesstoken: TOKEN
            },
            error: function() {
                $.alert("服务器异常");
            }
        };

        $.extend(true, options, custom);

        if (options.type == "POST") {
            options.data = JSON.stringify(options.data);
        }

        $.ajax(options);
    },

    poster: function(options) {
        var currData = this.currData,
            width = options.width || 1110,
            height = options.height || 600,
            url = (options.url || "").split("?")[0],
            path = url.split("/"),
            name = path[path.length - 1],
            index = options.idx || (currData.newsimgidx + 1),
            dir = currData.newsimgdir || (iHomed.api("poster_url_dir") + options.id + "/"),
            fn = options.callback;

        //传递给flash编辑器的参数
        var params = [
            // "posterUrl=" + url,
            // "swf=HomedImageEditor",
            "accesstoken=" + TOKEN,
            "mediaId=" + options.id,
            "systemType=news",
            // "swfW=" + width,
            // "swfH=" + height,
            // "definition=720",
            "index=" + index,
            "dir=" + dir,
            "cbf_name=NewsEdit_savePoster",
            "_=" + $.now()
        ];

        if (url) params.push("posterUrl=" + url);

        //弹出图片编辑框
        $.content({
            layerID: "flashedit-layer",
            width: width + "px",
            onEsc: function() {
                iHomed.runFunction(fn);

                tLayer("close", "flashedit-layer");
            },
            header: {
                text: "编辑图片",
                buttons: [{
                    callback: function() {
                        iHomed.runFunction(fn);
                    }
                }]
            },
            content: {
                height: height + "px",
                padding: "0px",
                src: "popupPage/imgedit.html?" + params.join("&")
            },
            footer: false
        });
    },

    savePoster: function(editArr, index) {
        if (!editArr || editArr.length == 0) return;

        var currData = this.currData,
            dir = /*currData.newsimgdir || */ (iHomed.api("poster_url_dir") + currData.id + "/"),
            sizes = currData.newsimgsize || [],
            thumburl = currData.thumburl || "",
            sizeLength = sizes.length,
            thumbsize = CONFIG.thumbsize,
            thumb = "";

        for (var i = 0, len = editArr.length; i < len; ++i) {
            var sizeName = editArr[i] + "_" + index + ".jpg";

            if (sizeName.indexOf(thumbsize) != -1) {
                thumb = dir + sizeName;
            } else if ($.inArray(sizeName, sizes) == -1) {
                sizes.push(sizeName);
            }
        }

        if (sizes.length != sizeLength || thumb) {
            var params = {
                    newsid: currData.id,
                },
                urls = [];

            if (sizes.length != sizeLength) {
                for (var i = 0, len = sizes.length; i < len; ++i) {
                    var url = dir + sizes[i];

                    urls.push(url);
                }

                params.news_img_list = urls;
            }

            if (thumb && thumb != thumburl) {
                var thumbArr = thumbsize.split("x");

                params.thumbnail_pic = {
                    news_img: thumb,
                    width: thumbArr[0],
                    height: thumbArr[1]
                };
            }

            this.submitData({
                url: iHomed.api("post_adjust_news"),
                data: params,
                success: function(data) {
                    if (data.ret == 0) {
                        console.log(urls);
                        currData.newsimgsize = sizes;
                    } else {
                        console.error("保存图片失败");
                    }
                }
            });
        }
    },
    /**
     * [metaTag 显示标签]
     * @param   {object}    $wraper [JQ 容器]
     * @param   {array}     tags    [标签]
     * @param   {int}       type    [操作标签类型 0为增加标签，1为删除标签，2为重置标签]
     * @return {[type]}         [description]
     */
    metaTag: function($wraper, tags, type) {
        var $tagsVal = $wraper.siblings('.tag-checkbox').find('> span:visible'),
            nextID = $wraper.data("next");

        $wraper.empty();

        //兼容空标签
        if (tags.length == 1 && tags[0] == "") {
            $wraper.data("tags", []);
            return;
        }

        type = type || 0;

        var totalTags = $wraper.data("tags") || [],
            tagHTML = [],
            tagVal = [];

        if (type == 0) {
            totalTags = totalTags.concat(tags);
        } else if (type == 1) {
            var index = $.inArray(tags, totalTags);

            totalTags.splice(index, 1);
        } else {
            totalTags = tags;
        }

        $wraper.data("tags", totalTags);

        if (nextID) {
            var $nextTr = $("#" + nextID).closest('tr');
            if (totalTags.length) {
                $nextTr.show();
            } else {
                $nextTr.hide();
            }
        }

        for (var i = totalTags.length - 1; i >= 0; --i) {
            var tag = $.trim(totalTags[i]),
                val = $tagsVal.filter('[data-value="' + tag.replace(/\"/g, '\\"') + '"]').data("id");

            if (tag === "") {
                totalTags.splice(i, 1);
                continue;
            }

            if (val) tagVal.unshift(val);

            if (tag) {

                tagHTML.unshift("<span><i class='delete-tag'></i><b class='tag-name'>" + tag + "</b></span>");

            }

        }

        $wraper.data("value", tagVal);

        // 输出标签列表
        $wraper.append(tagHTML.join(""));
        $wraper.siblings('.add-tag').val('');

        // 调整各部分高度
        util.adjustWindow();
    },
};

/**
 * 各种状态公用函数
 */
var Status = {
    /**
     * 获取状态值对应的描述
     * @param  {int}    status 状态值
     * @return 无
     */
    getDesc: function(status) {
        var r = "";

        switch (status) {
            case 59998:
                r = "自动驳回";
                break;
            case 59999:
                r = "待审核";
                break;
            case 60049:
                r = "用户驳回";
                break;
            case 65000:
                r = "待发布";
                break;
            case 65002:
                r = "已发布";
                break;
            case 65003:
                r = "已下架";
                break;
        }

        return r || status;
    }
};

/**
 * 待审核列表
 * @type {Object}
 */
var auditingNews = {
    /**
     * 用于导航定位显示
     */
    location: "内容管理/待审核",
    /**
     * 最后设置的参数
     * @type {Object}
     */
    lastSetting: {
        status: "59999"
    },
    /**
     * 初始化
     * @param   {number} pagenum 页码
     * @param   {number} id 指定的资讯id
     * @return 无返回值
     */
    init: function(pagenum, id) {
        // 记录当前页面内容
        NAV = "auditingNews";

        var params = this.lastSetting;

        if (pagenum) {
            params.pageidx = pagenum;

        } else {
            // 初始化功能按钮列表
            util.initTools("auditingNews");

            // 显示右侧隐藏栏
            $(".hiddenBar").show();

            // 初始化筛选列表
            util.initFilter("auditingNews");

            params = {
                status: "59999"
            };

            this.lastSetting = params;
        }

        // 加载列表
        NewsList.initPagingList("get_review_list", params, 1, function() {
            var $ul = id ? $('.workBar-table-content > ul[data-id="' + id + '"]') : $(".workBar-table-content > ul:visible");

            if ($ul.length > 0) {
                $ul.eq(0).trigger('click');
            } else {
                NewsList.getReviewInfo($ul.eq(0));
            }
        });

        this.bindEvents();
    },

    bindEvents: function() {
        var self = this;

        var $hiddenBar = $(".hiddenBar"),
            $workTable = $(".workBar-items .workBar-table");

        $hiddenBar
            .off("click", ".hiddenBar-buttons > span")
            .on("click", ".hiddenBar-buttons > span", function(e) {
                var $this = $(this),
                    action = $this.data("action");
                $ul = $workTable.find("ul.active").eq(0);

                if ($this.hasClass('disable') || $ul.length == 0) return;

                NewsList.operates(action, $ul);
            });
    }
};

/**
 * 已驳回列表
 * @type {Object}
 */
var rejectedNews = {
    /**
     * 用于导航定位显示
     */
    location: "内容管理/已驳回",
    /**
     * 最后设置的参数
     * @type {Object}
     */
    lastSetting: {
        status: "59998|60049"
    },
    /**
     * 初始化
     * @param  {Int} pagenum 页码
     * @return 无返回值
     */
    init: function(pagenum) {
        // 记录当前页面内容
        NAV = "rejectedNews";

        var params = this.lastSetting;

        if (pagenum) {
            params.pageidx = pagenum;

        } else {
            // 初始化功能按钮列表
            util.initTools("rejectedNews");

            // 初始化筛选列表
            util.initFilter("rejectedNews");

            params = {
                status: "59998|60049"
            };

            this.lastSetting = params;
        }

        // 加载列表
        NewsList.initPagingList("get_review_list", params);
    }
};

/**
 * 已发布列表
 * @type {Object}
 */
var releasedNews = {
    /**
     * 用于导航定位显示
     */
    location: "内容管理/已发布",
    /**
     * 最后设置的参数
     * @type {Object}
     */
    lastSetting: {
        status: "65002"
    },
    /**
     * 初始化
     * @param  {Int} pagenum 页码
     * @return 无返回值
     */
    init: function(pagenum) {
        // 记录当前页面内容
        NAV = "releasedNews";

        var params = this.lastSetting;

        if (pagenum) {
            params.pageidx = pagenum;

        } else {
            // 初始化功能按钮列表
            util.initTools("releasedNews");

            // 初始化筛选列表
            util.initFilter("releasedNews");

            params = {
                status: "65002"
            };

            this.lastSetting = params;
        }

        // 加载列表
        NewsList.initPagingList("get_release_list", params);
    }
};

/**
 * 已下架列表
 * @type {Object}
 */
var removedNews = {
    /**
     * 用于导航定位显示
     */
    location: "内容管理/已下架",
    /**
     * 最后设置的参数
     * @type {Object}
     */
    lastSetting: {
        status: "65003"
    },
    /**
     * 初始化
     * @param  {Int} pagenum 页码
     * @return 无返回值
     */
    init: function(pagenum) {
        // 记录当前页面内容
        NAV = "removedNews";

        var params = this.lastSetting;

        if (pagenum) {
            params.pageidx = pagenum;

        } else {
            // 初始化功能按钮列表
            util.initTools("removedNews");

            // 初始化筛选列表
            util.initFilter("removedNews");

            params = {
                status: "65003"
            };

            this.lastSetting = params;
        }

        // 加载列表
        NewsList.initPagingList("get_release_list", params);
    }
};

/**
 * 定时发布列表
 * @type {Object}
 */
var timedNews = {
    /**
     * 用于导航定位显示
     */
    location: "内容管理/定时发布",
    /**
     * 最后设置的参数
     * @type {Object}
     */
    lastSetting: {
        status: "65001"
    },
    /**
     * 初始化
     * @param  {Int} pagenum 页码
     * @return 无返回值
     */
    init: function(pagenum) {
        // 记录当前页面内容
        NAV = "timedNews";

        var params = this.lastSetting;

        if (pagenum) {
            params.pageidx = pagenum;

        } else {
            // 初始化功能按钮列表
            util.initTools("timedNews");

            // 初始化筛选列表
            util.initFilter("timedNews");

            params = {
                status: "65001"
            };

            this.lastSetting = params;
        }

        // 加载列表
        NewsList.initPagingList("get_review_list", params);
    }
};