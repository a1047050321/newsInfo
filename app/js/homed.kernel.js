;(function ($, window, undefined) {

    var _top = top || window,
        document = window.document,
        location = window.location,
        navigator = window.navigator;

    // 获取 cookie 方法
    $.extend( {
        cookie: _top.$.cookie
    } );

    // 全局 DNS 映射关系
    var gdc = _top.globalDnsConfigVar || {},
        // 获取用户配置信息
        CONFIG = !top.iHomed ? {} : (top.iHomed( "config" ) || {});

    // 权限列表
    var Access = _top.Access = _top.Access || {};

    var JSON = _top.JSON || window.JSON || undefined;

    //用于存储iHomed下所有全局数据
    _top.tEdit = _top.tEdit || {};

    _top.tEdit.module = _top.tEdit.module || { //初始化模块
            //分类模块
            label       : {}
        };

    _top.tEdit.data = _top.tEdit.data || {};

    //获取保存在iHomed上的数据
    var tEditData = _top.tEdit.data,
        //获取模块信息
        tEditModule = _top.tEdit.module;

    //重新加载后，工具模块需重载
    tEditModule.tools = tEditModule.tools || {
        //当前工具模块中存在的工具集合
        queue   : []
    };

    var dtvAddr     = ( gdc.dtvAddr || "http://dtv.homed.me" ),
        accessAddr  = ( gdc.accessAddr || "http://access.homed.me" );
    
    // 系统 api
    var Api = _top.Api = _top.Api || {
        // 获取用户信息
        "user_get_info"         : accessAddr + "/usermanager/user/get_info",
        // 获取用户当前系统的权限列表
        "get_right_list"        : accessAddr + "/usermanager/user/get_right_list",
        // 退出登录
        "user_logout"           : accessAddr + "/usermanager/logout",
        //获取分类列表
        "programtype_get_list"  : dtvAddr + "/homed/release/get_list"
    };

    /**
     * window下的方法
     */
    var methods = {
        /**
         * 扩展请求 api
         * @param  {Object} myApi 需要扩展的 Api 接口
         * @return                无返回值
         */
        api: function ( myApi ) {

            if ( util.typeOf( myApi ) === "object" ) {

                $.extend( Api, myApi );

            } else if ( util.typeOf( myApi ) === "string" ) {

                return Api[ myApi ];

            }

        },
        /**
         * 用于配置系统 CONFIG 设置信息，该方法仅能调用一次即被清理掉
         * @param  {Object|String} cfg cfg对象时为设置 CONFIG 信息，为字符串时则为获取某个配置属性的值
         * @return 无返回值
         */
        config: function ( cfg ) {

            // 获取 cfg 的类型
            var type = util.typeOf( cfg );

            if ( type == "object" ) {

                CONFIG = $.extend( true, {}, cfg );

            } else if ( type == "string" ) {
                
                return CONFIG[ cfg ] || undefined;

            } else {

                return $.extend( {}, CONFIG );

            }

        },
        /**
         * 获取用户信息
         * @param  {Object} options 获取信息的相关参数
         * @return 无返回值
         */
        userinfo: function ( options ) {
            if ( !options ) {

                return methods.data( "userinfo" );

            } else if ( util.typeOf( options ) == "object" ) {

                handler.user.info( options );

            }
        },
        /**
         * 设置属性值到iHomed
         * @param  {String} name  属性名
         * @param  {各类型} value 属性值
         * @return {各类型}       根据value的值来返回对应的数据
         */
        data: function (name, value) {
            if (value === undefined) {
                //获取属性name的值
                return tEditData[name];
            } else if (value === null) {
                //回收name属性及值
                delete tEditData[name];
            } else {
                //设置name属性值
                tEditData[name] = value;
            }
        },
        /**
         * 判断是否有该权限
         * @param  {Int} right 权限ID，若 right 为字符串型，则表示获取，若为 Object 型则表示设置
         * @return {Object} 存在则返回该权限的信息，否则，返回 undefined
         */
        access: function ( right ) {

            if ( util.typeOf( right ) != "object" ) {

                if ( right == "*" || right == undefined ) {

                    return Access;
                } else {
                    return Access[ right ];
                }
                
            } else {

                _top.Access = Access = right;
                 
            }
            
        },
        /**
         * 保存app应用信息
         * @param  {Object} options 参数设置
         * @return 无返回值
         */
        save: function (options) {
            //保存app数据
            handler.__public__.setData( options );
        },
        /**
         * 获取分类
         * @param  {String}     labelID 分类的id，不传或传"*"表示获取全部分类
         * @param  {Function}   fn      获取分类成功后的回调函数
         * @param  {Boolean}    clear   是否清空回调队列
         * @return {Object}         返回分类信息
         */
        getLabel: function (options, fn, clear) {
            if (util.typeOf(options) == "string") {
                options = {
                    label: options
                };
            }

            labelID = options.label || "*";
            clear   = clear || false;

            var labelM  = tEditModule.label,
                queue   = labelM.queue || undefined,
                fnQueue = labelM.fnQueue || [];

            //清空函数队列
            if (clear) { fnQueue = []; }

            if (util.isFunction(fn)) {
                fn.labelID = labelID;
                fnQueue.push(fn);
            }

            //更新函数队列
            labelM.fnQueue = fnQueue;

            if (queue === undefined || queue.length > 0) {
                //未获取过分类信息或/正在获取分类信息
                handler.label.initLabelData($.extend(true, {
                    url     : "programtype_get_list",
                    type    : "GET",
                    data    : {
                        accesstoken     : options.accesstoken
                    }
                }, options));

                return false;
            } else {
                //获取过分类信息，立即执行回调函数
                handler.label.runFnQueue();

                return labelM.list ? 
                            (labelID == "*" ? labelM.list : (labelM.list[labelID] || undefined))
                            : undefined;
            }

        },
        /**
         * 禁用一次所有DOM的事件处理，触发一次后取消
         * @param  {String}    selector JQ选择器或DOM对象
         * @param  {String}    type     添加到元素的一个或多个事件。由空格分隔多个事件。必须是有效的事件。
         * @param  {Function}  fn       禁用前的处理函数
         * @return 无返回值
         */
        disabledEvents: function (selector, type, fn) {
            type = type.split(" ");
            for (var i = type.length; i > 0; i--) {
                //为每个事件添加命名空间，形如: click.disabledEvents
                type[i-1] = type[i-1]+".disabledEvents";
            }

            type = type.join(" ");

            $(selector || "*")
                .bind(type, disabledEvent);

            function disabledEvent(e) {
                e = e || window.event;
                var selfFn = arguments.callee;

                setTimeout(function () {
                    $(selector || "*").unbind(type, selfFn);
                }, 0);

                util.runFunction(fn, [e]);

                e.preventDefault();
                return false;
            }

        },
        /**
         * 取消禁用一次所有DOM的事件处理
         * @param  {String}    selector JQ选择器或DOM对象
         * @param  {String}    type     添加到元素的一个或多个事件。由空格分隔多个事件。必须是有效的事件。
         * @param  {Function}  fn       取消禁用前的处理函数
         * @return 无返回值
         */
        enableEvents: function (selector, type, fn) {
            type = type.split(" ");
            for (var i = type.length; i > 0; i--) {
                //为每个事件添加命名空间，形如: click.disabledEvent
                type[i-1] = type[i-1]+".disabledEvents";
            }

            type = type.join(" ");

            util.runFunction(fn);

            $(selector || "*")
                .unbind(type);

        },
        /**
         * 禁用tool
         * @param  {String} toolID 单个或多个以空格分隔的toolID值
         * @return 无返回值
         */
        disableTools: function (toolID) {
            handler.tools.disable(toolID);
        },
        /**
         * 可用tool
         * @param  {String} toolID 单个或多个以空格分隔的toolID值
         * @return 无返回值
         */
        enableTools: function (toolID) {
            handler.tools.enable(toolID);
        },
        /**
         * 隐藏tool
         * @param  {String} toolID 单个或多个以空格分隔的toolID值
         * @return 无返回值
         */
        hideTools: function (toolID) {
            handler.tools.hide(toolID);
        },
        /**
         * 显示tool
         * @param  {String} toolID 单个或多个以空格分隔的toolID值
         * @return 无返回值
         */
        showTools: function (toolID) {
            handler.tools.show(toolID);
        },
        /**
         * 请求数据
         * @param  {Object}     options 数据参数
         * @param  {Function}   fn      获取数据成功后的回调
         * @return 无返回
         */
        getData: function (options, fn) {
            handler.__public__.getData(options, fn);
        },
        /**
         * 保存数据
         * @param  {Object}     options 数据参数
         * @param  {Function}   fn      保存数据成功后的回调
         * @return 无返回
         */
        setData: function (options, fn) {
            handler.__public__.setData(options, fn);
        },
        /**
         * 组装模板
         * @param  {Object}  data       模板数据
         * @param  {String}  template   模板代码
         * @param  {Boolean} encodeHtml 编码 html 标记为实体
         * @return {String}             返回真正的HTML代码
         */
        packTemplate: function ( data, template, encodeHtml ) {
            return handler.__public__.packTemplate(data, template, encodeHtml);
        },
        /**
         * 退出系统
         * @return 无返回值
         */
        logout: function () {

            handler.__public__.logout();

        },
        /**
         * 设置系统当前位置
         * @param  {Object} frame  window 窗口对象
         * @param  {String} href   跳转地址
         * @param  {String} locate 当前位置地址
         */
        location: function ( options ) {

            if ( options ) {
                
                if ( options.frame ) {
                    
                    // 跳转页面
                    options.frame.location.href = options.href + "?_=" + $.now();

                }
                
                if ( options.locate ) {

                    // 设置定位信息
                    _top.$( ".curLocation > span" ).html( options.locate );

                }

            } else {

                return _top.$( ".curLocation > span" ).html();

            }
            
            
        }
    };

    /**
     * jQuery下的方法
     */
    var $methods = {
        /**
         * 初始化工具栏
         * @param  {Array} tools 工具集合, 形如:[{...}, {...}, ...]，具体可以参照 tools.html
         * @return 无返回值
         */
        initTools: function (tools) {
            tools.jQ = $(this);
            tools.selector = $(this).selector;

            handler.tools.excuteTools(tools);

            return this;
        },
        /**
         * 获取滚动条信息
         * @return {Object} 返回横/竖向的滚动条是否存在的对象
         */
        scroll: function () {

            var el = this.get( 0 );

            // test targets
            var elems = el ?
                        [ el ] :
                        [ document.documentElement, document.body ];
            
            var scrollX = false,
                scrollY = false;

            for ( var i = 0; i < elems.length; i++ ) {

                var o = elems[ i ];

                // test horizontal
                var sl = o.scrollLeft;
                o.scrollLeft += (sl > 0) ? -1 : 1;
                o.scrollLeft !== sl && (scrollX = scrollX || true);
                o.scrollLeft = sl;

                // test vertical
                var st = o.scrollTop;

                o.scrollTop += (st > 0) ? -1 : 1;
                o.scrollTop !== st && (scrollY = scrollY || true);
                o.scrollTop = st;

            }

            // ret
            return {
                scrollX: scrollX,
                scrollY: scrollY
            };

        },
        /**
         * 执行分页操作
         * @param  {String} action  执行的操作，如：init(初始分页)，get(获取分页数据)
         * @param  {Object} options 分页参数
         * @return 无返回值
         */
        tPager: function (method) {
            if (tPager[method]) {
                return tPager[method].apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof method == "object" && method) {
                return tPager.init.apply(this, arguments);
            } else {
                $.error("方法 "+method+" 未在tPager中定义!");
            }
        }
    };

    /**
     * 图文编辑各个模块方法函数定义
     */
    var handler = {};

    /**
     * user 公用方法
     */
    handler.user = {
        /**
         * 获取用户信息
         * @param  {Object} options 获取信息的相关参数
         * @return 无返回值
         */
        info: function ( options ) {

            // 设置默认的请求地址
            options.url = options.url || "user_get_info";

            var success = options.success;

            delete options.success;

            // 开始请求用户信息
            handler.__public__.getData( options, function ( data ) {

                // 请求成功
                if ( data.ret == 0 ) {

                    // 删除部分成员属性
                    // delete data.ret;
                    // delete data.ret_msg;

                    // 用户权限列表
                    var rights = data.rightlist,
                        // 角色列表
                        roles = data.rolelist || [],
                        // 循环索引 index
                        i = 0,
                        // 循环长度 length
                        len = 0,
                        // 权限 hash 表
                        right_map = {};

                    // 获取当前系统的权限
                    for ( i = roles.length; i > 0; i-- ) {
                        var r = roles[ i-1 ];

                        if ( r.systemid == CONFIG.systemid || r.role == 1 ) {

                            // 保存用户的系统角色: 1.超级管理员，2.系统管理员，3.普通用户
                            methods.data( "role", r.role );

                            break;

                        }

                    }

                    // 该用户无系统权限，强制返回首页/登录页
                    if ( i == 0 ) {
                        _top.location.href = CONFIG.homepage;
                        return ;
                    }
                    
                    // 记录用户信息
                    methods.data( "userinfo", data );

                    // 获取用户权限
                    handler.user.access( {
                        data: options.data
                    }, function () {

                        util.runFunction( success, [ data ] );

                    } );

                }
                
            } );

        },
        /**
         * 获取用户当前系统的权限
         * @param  {Object}   options 获取信息的相关参数
         * @param  {Function} fn      权限初始化完后的回调
         * @return 无返回值
         */
        access: function ( options, fn ) {

            // 设置默认的请求地址
            options.url = options.url || "get_right_list";

            // 开始请求用户权限
            handler.__public__.getData( options, function ( data ) {

                // 用户权限列表
                var rights = data.rightlist || [],
                    // 循环索引 index
                    i = 0,
                    // 循环长度 length
                    len = 0,
                    // 权限 hash 表
                    right_map = {};

                // 开始分析用户权限
                for ( i = rights.length; i > 0; i-- ) {
                    var r = rights[ i-1 ];
                    // 映射权限号和权限的名称
                    right_map[ r.rightid ] = r.rightname;
                }

                // 设置权限的长度
                right_map.length = rights.length;

                // 保存权限 hash 表
                methods.access( right_map );

                // 执行回调
                util.runFunction( fn );

            } );

        }
    };

    /**
     * 分类信息公用函数
     */
    handler.label = {
        /**
         * 获取分类信息
         * @param  {Object} options 参数设置
         * @return 无返回值
         */
        initLabelData: function (options) {
            /**
             * 获取 iPanel人文(id=106)，应用(id=107)，资讯(id=108) 三个分类的下级分类
             * 这三块的分类名和id或许以后会发生变化，随时保持更新
             * programTypes为需要获取分类的顶级分类id
             */
            var labels = options.labels || [106, 107, 108],
                len = labels.length;

            tEditModule.label.queue = labels;

            for (var i = 0; i < len; i++) {

                $.extend(true, options, {
                    data: {
                        //当前要获取的分类
                        label       : labels[i],
                        accesstoken : options.accesstoken
                    },
                    //初始化label完成后的回调函数
                    complete: function () {
                        var queue = tEditModule.label.queue;
                        queue.shift();
                        if (queue.length == 0) {
                            handler.label.runFnQueue();
                        }
                    },
                    success: function (data) {
                        if (data.ret == 0) {
                            var label = data.typelist ? data.typelist[0] : [];
                            tEditModule.label.list = tEditModule.label.list || {};
                            $.extend(tEditModule.label.list, handler.label.serializeLabel(label));
                        }
                    }
                });

                handler.__public__.getData(options);
            }
        },
        /**
         * 序列化
         * @param  {Object} label 分类列表
         * @param  {String} path  分类路径
         * @return 返回序列化后的分类列表
         */
        serializeLabel: function (label, path) {
            var labelList = {};

            if (!label) {}

            path = (path || "") + label.name;

            labelList[label.id] = {
                //分类id
                id      : label.id,
                //分类名
                name    : label.name,
                //分类路径
                path    : path
            };

            if (label.children) {
                var labels = label.children;

                var selfFn = arguments.callee;

                path = path + "-";

                for (var i = labels.length; i > 0; i--) {
                    $.extend(labelList, selfFn(labels[i-1], path));
                }
            }

            return labelList;
        },
        /**
         * 运行分类回调
         * @return 无返回值
         */
        runFnQueue: function () {
            var fn;
            var labelM = tEditModule.label,
                fnQueue = labelM.fnQueue;
            while ((fn = fnQueue.shift())) {
                var data = fn.labelID == "*" ? labelM.list : (labelM.list[fn.labelID] || undefined);
                fn(data);
            }
        }
    };

    /**
     * 工具模块公用函数
     */
    handler.tools = {
        /**
         * 生成管理工具集
         * @param  {Array} tools 工具集合
         * @return 无返回数据
         */
        excuteTools: function (tools) {
            var $wraper = tools.jQ;

            //获取工具模块
            mTools = tEditModule.tools;

            //是否存在button和image按钮工具
            var hasButton   = false,
                //是否存在select工具
                hasSelect   = false,
                //是否存在scroller工具
                hasScroller = false;

            for (var i = 0, len = tools.length; i < len; i++) {
                var tool = tools[i],
                    html = $(handler.tools.template(tool));

                if ($.trim(html).length == 0) { continue; }

                var $tool = $(html);

                $tool.data("toolData", tool);

                $wraper.append($tool);

                util.runFunction(tool.onInit, $tool, [tool.toolID]);

                //追加一个工具到工具模块中
                mTools.queue.push(tool.toolID);

                //记录各类按钮
                switch (tool.type) {
                    case "button":
                    case "image":
                        hasButton = true;
                        break;
                    case "select":
                        hasSelect = true;
                        hasButton = true;
                        break;
                    case "scroller":
                        hasScroller = true;

                        var $container = $tool.find(".scroller-container"),
                            $item = $container.find(".scroller-all-item #item_"+tool.checkedID);
                            
                        setTimeout(function () {
                            //获取当前位置
                            itemPos = $item.position();

                            $item.addClass("active");

                            $container.css("top", (-itemPos.top+1)+"px");
                        }, 0);

                        break;
                }

                $tool = null;
            }

            if (hasButton && !$wraper.data("dButton")) {
                $wraper.data("dButton", true);

                $wraper
                    //button类 image
                    .delegate(".tool-button, .tool-image, .tool-options > div", {
                        "click.edittools": function (e, notAction) {
                            e = e || window.event;

                            var $this = $(this),
                                toolID = this.id;

                            var toolData = handler.tools.isDisTool(this);

                            if (toolData) {
                                
                                // 判断是否为点击了select的option选项
                                var isOption = false;

                                //如果按钮为select，点击后应该关闭下拉列表
                                if ($this.hasClass("tool-select-option")) {

                                    var $tool = $this.closest(".appedit-tools-wraper"),
                                        quicker = $tool.data("toolData").quicker;

                                    isOption = true;

                                    if (quicker.change && toolData.change !== false) {
                                        var $quicker = $tool.find(".tool-quicker-wraper"),
                                            quickClass = quicker.quickClass,
                                            toolQuick = toolData.quickClass;

                                        //清除当前快捷键信息
                                        $quicker.find(".tool-icon")
                                                .removeClass(quickClass.normal)
                                                .addClass(toolQuick.normal);

                                        //替换当前的快捷样式
                                        quicker.quickClass = toolQuick;

                                        //替换当前快捷的text
                                        if (!quicker.text) {
                                            $quicker.find(".tool-text").html(toolData.quickText);
                                        }

                                        //替换当前快捷按钮的mapTo
                                        if (quicker.mapTo) {
                                            quicker.mapTo = toolID;
                                        }
                                    }

                                    $tool.removeClass("active");

                                    $this.parents(".tool-options").hide()
                                        .siblings(".tool-quicker-wraper").removeClass("open");

                                    methods.enableEvents("*", "click");
                                }

                                if (!notAction) {
                                    //toolData.action();
                                    util.runFunction(toolData.action, ( isOption ? $this : $this.parent() ) );
                                }

                            } else {
                                e.stopPropagation();
                            }

                        },
                        "mouseenter.edittools": function (e) {
                            e = e || window.event;

                            var $this = $(this),
                                toolID = this.id;

                            var toolData = handler.tools.isDisTool(this),
                                iconClass = toolData.iconClass || {};

                            if (toolData) {
                                //给icon添加滑入类
                                $(".tool-icon", this).addClass(iconClass.hover||"");
                            }
                        },
                        "mouseleave.edittools": function (e) {
                            e = e || window.event;

                            var $this = $(this),
                                toolID = this.id;

                            var toolData = handler.tools.isDisTool(this),
                                iconClass = toolData.iconClass || {};

                            if (toolData) {
                                //给icon移除滑入类
                                $(".tool-icon", this).removeClass(iconClass.hover||"");
                            }
                        },
                        "mousedown.edittools": function (e) {
                            e = e || window.event;

                            var $this = $(this),
                                toolID = this.id;

                            var toolData = handler.tools.isDisTool(this);

                            if (toolData) {
                                //给icon移除点击类
                                $(".tool-icon", this).addClass(toolData.iconClass.active||"");
                            }
                        },
                        "mouseup.edittools": function (e) {
                            e = e || window.event;

                            var $this = $(this),
                                toolID = this.id;

                            var toolData = handler.tools.isDisTool(this);

                            if (toolData) {
                                //给icon移除点击类
                                $(".tool-icon", this).removeClass(toolData.iconClass.active||"");
                            }
                        }
                    });
            }
            
            if (hasSelect && !$wraper.data("dSelect")) {
                $wraper.data("dSelect", true);

                //可操作的select选择器
                var canSelect = ".appedit-tool-select:not('.select-disabled')";

                //select类
                $wraper.delegate(canSelect+" .tool-quicker-wraper.quick-disabled span, "+canSelect+" .tool-select-btn", {
                    "click.edittools": function (e) {
                        e = e || window.event;

                        var $this = $(this),
                            $parent = $this.parent(),
                            $select = $parent.closest(".appedit-tool-select");

                        $select.toggleClass("active");

                        $parent.toggleClass("open")
                            .siblings(".tool-options").toggle();

                        var wSelector = e.data.wSelector;

                        var $sWraper = $(".tool-quicker-wraper.open").parent(),
                            //展开列表后不被禁用click的DOM对象
                            $disabled = $("*:not(body, "+wSelector+")").not($sWraper).not($sWraper.find("*"));

                        if ($parent.hasClass("open")) {

                            methods.disabledEvents($disabled, "click", function () {
                                $select.toggleClass("active");

                                $parent.toggleClass("open")
                                    .siblings(".tool-options").toggle();
                            });

                        } else {
                            methods.enableEvents("*", "click");
                        }

                        //垃圾回收
                        $sWraper = null;

                        e.stopPropagation();
                    }
                }, {
                    wSelector: $wraper.selector
                })
                .delegate(canSelect+" .tool-quicker-wraper:not(.quick-disabled) span:not(.tool-select-btn)", {
                    "click.edittools": function (e) {
                        e = e || window.event;

                        var $this = $(this),
                            //获取工具
                            tool = $this.closest(".appedit-tools-wraper");

                        var quicker = tool.data("toolData").quicker,
                            toolID = quicker.mapTo;

                        //按钮的this
                        var $tool = $("#"+toolID),
                            _this = $tool.get(0);

                        var toolData = handler.tools.isDisTool(_this);

                        var $parent = $this.parent();

                        if (!$parent.hasClass("open")) {
                            if (toolData) {
                                //给icon添加点击类
                                //$this.addClass(quicker.quickClass.active||"");

                                util.runFunction(toolData.action, $parent);

                            } else {
                                e.stopPropagation();
                            }
                        } else {
                            e.stopPropagation();
                            return false;
                        }
                    }
                });    
            }
            
            if (hasScroller && !$wraper.data("dScroller")) {
                $wraper.data("dScroller", true);

                //可操作的scroller选择器
                var canScroller = '.appedit-tool-scroller:not(.scroll-disabled)';

                //scroller类
                $wraper.delegate(canScroller+" .scroller-frame-btn > div", {
                    "click.edittools": function (e) {
                        e = e || window.event;

                        var $this = $(this),
                            //获取整個scroller的jQ对象
                            $scroller = $this.closest(".appedit-tool-scroller"),
                            //列表项容器
                            $container = $scroller.find(".scroller-container");

                        //按钮的操作是上移、下移或展开全部
                        var action = $this.data("action");

                        switch (action) {
                            case "U":
                            case "D":
                                
                                //容器的高度
                                var cHeight = $container.height();

                                //是否正在滚动
                                var scrolling = $container.data("scrolling");

                                //上一次滚动未完成不允许再次滚动
                                if (scrolling) { return false; }

                                var styleTop = parseInt($container.css("top"));

                                //滚动的高度差
                                var sHeight = $this.data("height"),
                                    //绝对高度差
                                    absHeight = parseInt(sHeight.substring(2));

                                if ((action == "U" && styleTop >= 1) || (action == "D" && cHeight <= (Math.abs(styleTop)+absHeight+10))) {
                                    return false;
                                }

                                //开始滚动
                                $container.data("scrolling", true).animate({
                                    "top": sHeight
                                }, 200, function () {
                                    $(this).data("scrolling", null);
                                });
                                
                                //非滚动模式
                                /*$container.css({
                                    "top": sHeight
                                });*/

                                break;
                            case "A":
                                $container.data("top", $container.css("top"))
                                          .css("top", "0px");

                                var wSelector = e.data.wSelector;

                                $scroller.addClass("open");

                                //展开列表后不被禁用click的DOM对象
                                var $disabled = $("*:not("+wSelector+")").not($scroller).not($scroller.find("*"));

                                //禁用其他DOM的click事件
                                methods.disabledEvents($disabled, "click", function (e) {

                                    $container.css("top", $container.data("top"))
                                              .data("top", null);

                                    $scroller.removeClass("open");

                                    $container = null;
                                    $scroller = null
                                });

                                break;
                        }

                    }
                }, {
                    wSelector: $wraper.selector
                })
                .delegate(canScroller+" .scroller-all-item .scroll-item-wraper", {
                    "click.edittools": function (e, notClick) {
                        e = e || window.event;

                        var $this = $(this);
                        
                        if (!$this.hasClass("active")) {
                            var $scroller = $this.closest(".appedit-tool-scroller"),
                                $container = $scroller.find(".scroller-container"),
                                toolData = $scroller.data("toolData");

                            $this.siblings(".active").removeClass("active");
                            $this.addClass("active");

                            var $clone = $this.clone();

                            $container.find(".scroller-use-item > div > div").html($clone);

                            //垃圾回收
                            $clone = null;

                            //是否执行onClick回调，默认执行
                            if (!notClick) {
                                util.runFunction(toolData.onClick, [$this.data("id"), $this]);
                            }
                            
                            if ($scroller.hasClass("open")) {
                                
                                $scroller.removeClass("open");

                                //点击的item距离父元素的位置关系
                                var pos = $this.position();

                                $container.css("top", (-pos.top+1)+"px")
                                          .data("top", null);

                                methods.enableEvents("*", "click");
                                
                            }
                        }

                    }
                });
            }
            
            //阻止$wraper向上冒泡
            if (!$wraper.data("stopPG")) {
                $wraper.data("stopPG", true);

                $wraper.bind("click.edittools", function (e) {
                    e = e || window.event;

                    e.stopPropagation();
                    //return false;
                });
            }
            

            //垃圾回收 $wraper
            $wraper = null;
        },
        /**
         * 按钮是否被禁用
         * @param  {Object}  bObj 按钮的DOM对象
         * @param  {Boolean} flag 当返回值为false时，是否返回原toolData
         * @return {Boolean/Object}    如果禁用返回false，不禁用则返回按钮相关数据
         */
        isDisTool: function (bObj, flag) {
            var $bObj = $(bObj),
                toolID = $bObj.attr("id");

            flag = flag || false;

            //按钮禁用样式 class
            var disTool = " tool-disabled";

            var $tool = $bObj.closest(".appedit-tools-wraper");

            var toolMap = $tool.data("toolData").map,
                //获取tool映射表中toolID对应的信息
                toolData = toolMap[toolID];

            if (!$bObj.hasClass(disTool) && !toolData.disabled) {
                return toolData;
            }

            if (!flag) {
                return false;
            } else {
                return toolData;
            }
            
        },
        /**
         * 禁用tool
         * @param  {String} toolID 单个或多个以空格分隔的toolID值，也可传*号禁用全部工具
         * @return 无返回值
         */
        disable: function (toolID) {
            //获取工具模块
            mTools = tEditModule.tools;

            toolID = $.trim(toolID);
            toolID = toolID || "";

            if (toolID.length == 0) { return false; }

            //检查是否存在:not()选择器
            var p = /([^\:]*)(?:\:not\((['"])?([^\2]*?)\2\))?/ig.exec(toolID);

            //存在:not()选择器
            if (p[3]) {
                exclude = $.trim(p[3]).split(/\s+/);

                toolID = "*";
            } else {
                exclude = [];
                toolID = p[1];
            }
            var toolIDs = toolID == "*" ? mTools.queue : toolID.split(/\s+/);

            //按钮禁用样式 class
            var disTool = "tool-disabled",

                //不允许下拉选择 class
                disSelect = "select-disabled",

                //不允许下拉选择 class
                disScroll = "scroll-disabled";

            for (var i = toolIDs.length; i > 0; i--) {
                var id = toolIDs[i-1],
                    $this = $("#"+id);

                //被排除不执行下述操作
                if (util.inArray(id, exclude) > -1) { continue; }

                switch ($this.data("toolType")) {
                    case "button":
                    case "image":
                        var toolData = handler.tools.isDisTool($this);

                        if (toolData) {
                            
                            var iconClass = toolData.iconClass || {};
                            
                            toolData.disabled = true;
                            $this.addClass(disTool).find(".tool-icon").removeClass(function () {
                                var cls = [];

                                for ( var i in iconClass ) {
                                    if ( iconClass.hasOwnProperty( i ) ) {
                                        cls.push( iconClass[i] );
                                    }
                                }

                                return cls.join( " " );
                            }).addClass(iconClass.disabled||"");
                        
                        }
                        break;
                    case "select":
                        var quickClass = $this.data("toolData").quicker.quickClass;

                        $this.addClass(disSelect)
                            .find(".tool-quicker-wraper .tool-icon").removeClass(function () {
                                var cls = [];

                                for ( var i in iconClass ) {
                                    if ( iconClass.hasOwnProperty( i ) ) {
                                        cls.push( iconClass[i] );
                                    }
                                }

                                return cls.join( " " );
                            }).addClass(quickClass.disabled||"");
                        break;
                    case "scroller":
                        $this.addClass(disScroll);
                        break;

                }

            }
        },
        /**
         * 可用tool
         * @param  {String} toolID 单个或多个以空格分隔的toolID值，也可传*号禁用全部工具
         * @return 无返回值
         */
        enable: function (toolID) {
            //获取工具模块
            mTools = tEditModule.tools;

            toolID = $.trim(toolID);
            toolID = toolID || "";

            if (toolID.length == 0) { return false; }

            //检查是否存在:not()选择器
            var p = /([^\:]*)(?:\:not\((['"])?([^\2]*?)\2\))?/ig.exec(toolID);

            //存在:not()选择器
            if (p[3]) {
                exclude = $.trim(p[3]).split(/\s+/);
                toolID = "*";
            } else {
                exclude = [];
                toolID = p[1];
            }
            var toolIDs = toolID == "*" ? mTools.queue : toolID.split(/\s+/);

            //按钮禁用样式 class
            var disTool = "tool-disabled",

                //不允许下拉选择 class
                disSelect = "select-disabled",

                //不允许下拉选择 class
                disScroll = "scroll-disabled";

            for (var i = toolIDs.length; i > 0; i--) {
                var id = toolIDs[i-1],
                    $this = $("#"+id);
                    
                //被排除不执行下述操作
                if (util.inArray(id, exclude) > -1) { continue; }

                switch ($this.data("toolType")) {
                    case "button":
                    case "image":
                        var toolData = handler.tools.isDisTool($this, true);

                        if (toolData) {
                            var iconClass = toolData.iconClass || {};

                            toolData.disabled = false;
                            $this.removeClass(disTool).find(".tool-icon").removeClass(function () {
                                var cls = [];

                                for ( var i in iconClass ) {
                                    if ( iconClass.hasOwnProperty( i ) ) {
                                        cls.push( iconClass[i] );
                                    }
                                }

                                return cls.join( " " );
                            }).addClass(iconClass.normal||"");

                        }
                        break;
                    case "select":
                        var quickClass = $this.data("toolData").quicker.quickClass;

                        $this.removeClass(disSelect)
                            .find(".tool-quicker-wraper .tool-icon").removeClass(function () {
                                var cls = [];

                                for ( var i in iconClass ) {
                                    if ( iconClass.hasOwnProperty( i ) ) {
                                        cls.push( iconClass[i] );
                                    }
                                }

                                return cls.join( " " );
                            }).addClass(quickClass.normal||"");
                        break;
                    case "scroller":
                        $this.removeClass(disScroll);
                        break;
                }

            }
        },
        /**
         * 显示tool
         * @param  {String} toolID 单个或多个以空格分隔的toolID值，也可传*号禁用全部工具
         * @return 无返回值
         */
        show: function (toolID) {
            //获取工具模块
            mTools = tEditModule.tools;

            toolID = $.trim(toolID);
            toolID = toolID || "";

            if (toolID.length == 0) { return false; }

            //检查是否存在:not()选择器
            var p = /([^\:]*)(?:\:not\((['"])?([^\2]*?)\2\))?/ig.exec(toolID);

            //存在:not()选择器
            if (p[3]) {
                exclude = $.trim(p[3]).split(/\s+/);
                toolID = "*";
            } else {
                exclude = [];
                toolID = p[1];
            }
            var toolIDs = toolID == "*" ? mTools.queue : toolID.split(/\s+/);

            for (var i = toolIDs.length; i > 0; i--) {
                var id = toolIDs[i-1],
                    $this = $("#"+id);
                    
                //被排除不执行下述操作
                if (util.inArray(id, exclude) > -1) { continue; }

                $this.closest(".appedit-tools-wraper").show(0);
            }
        },
        /**
         * 隐藏tool
         * @param  {String} toolID 单个或多个以空格分隔的toolID值，也可传*号禁用全部工具
         * @return 无返回值
         */
        hide: function (toolID) {
            //获取工具模块
            mTools = tEditModule.tools;

            toolID = $.trim(toolID);
            toolID = toolID || "";

            if (toolID.length == 0) { return false; }

            //检查是否存在:not()选择器
            var p = /([^\:]*)(?:\:not\((['"])?([^\2]*?)\2\))?/ig.exec(toolID);

            //存在:not()选择器
            if (p[3]) {
                exclude = $.trim(p[3]).split(/\s+/);
                toolID = "*";
            } else {
                exclude = [];
                toolID = p[1];
            }
            var toolIDs = toolID == "*" ? mTools.queue : toolID.split(/\s+/);

            for (var i = toolIDs.length; i > 0; i--) {
                var id = toolIDs[i-1],
                    $this = $("#"+id);
                    
                //被排除不执行下述操作
                if (util.inArray(id, exclude) > -1) { continue; }

                $this.closest(".appedit-tools-wraper").hide(0);

            }
        },
        /**
         * 模板代码
         * @param  {Object} tool 工具参数
         * @return {String}      返回对应类型的模板代码
         */
        template: function (tool) {

            //获取工具模块
            mTools = tEditModule.tools;

            //按钮禁用样式 class
            var disTool = " tool-disabled",

                //禁用下拉选择 class
                disSelect = " select-disabled",

                //禁用滚动下拉
                disScroll = " scroll-disabled";

            //toolID映射表
            var map = tool.map;

            var sprite = tool.spriteImg ? ' style="background-image:url('+tool.spriteImg+');background-repeat:no-repeat;"' : "";

            //匹配模板类型
            switch (tool.type) {
                //按钮式工具
                case "button":
                //图片式工具
                case "image":

                    //主按钮
                    var mainTool = map[tool.toolID];

                    //设置主按钮的disabled
                    mainTool.disabled = tool.disabled || false;

                    var iconClass = mainTool.iconClass || {};

                    var html =  '<div class="appedit-tools-wraper appedit-tool-'+tool.type+'">'+
                                    '<div id="'+tool.toolID+'" title="'+(tool.title||"")+'" data-tool-type='+tool.type+' class="tool-'+tool.type+(tool.disabled?disTool:"")+'">'+
                                        '<span class="tool-icon '+(tool.disabled?(iconClass.disabled||""):(iconClass.normal||""))+'"'+sprite+'>&nbsp;</span>'+
                                        '<span class="tool-text">'+tool.text+'</span>'+
                                    '</div>'+
                                '</div>';
                    break;
                //按钮式下拉
                case "select":
                        //显示方向
                        var orientation = util.inArray(tool.orientation, ["horizontal", "verical"]) ? 
                                            tool.orientation : "horizontal";

                        //快捷按钮
                        var quicker = tool.quicker;

                        //下拉列表    
                        var ops = tool.option;

                        var html =  '<div'+(tool.toolID?' id="'+tool.toolID+'"':'')+' data-tool-type="select" class="appedit-tools-wraper appedit-tool-'+orientation+' appedit-tool-'+tool.type+(tool.disabled?disSelect:"")+'">';

                        var options =   '<div class="tool-options">';

                                        for (var i = 0, len = ops.length; i < len; i++) {
                                            var op = ops[i];

                                            var opTool = map[op.toolID],
                                                opIconClass = opTool.iconClass || {};

                                            //追加一个工具到工具模块中
                                            mTools.queue.push(op.toolID);

                                            //设置选项按钮的disabled
                                            opTool.disabled = op.disabled || false;

                                            //设置工具的text
                                            opTool.text = op.text || "";

                                            //设置工具的quickClass
                                            opTool.quickClass = opTool.quickClass || opTool.iconClass || {};

                                            //设置工具的quickText
                                            opTool.quickText = opTool.quickText || op.text || "&nbsp;";

                                            var option =    '<div id="'+op.toolID+'" data-tool-type="button" value="'+(op.value||"")+'" class="tool-select-option'+(op.disabled?disTool:"")+'">'+
                                                                '<span class="tool-icon '+(op.disabled?(opIconClass.disabled):(opIconClass.normal||""))+'"'+sprite+'>&nbsp;</span>'+
                                                                '<span class="tool-text">'+op.text+'</span>'+
                                                            '</div>';

                                            options += option;

                                        }

                            options +=  '</div>';

                            //如果quicker.change为真，则表示点击下拉列表的某一项会
                            //改变quicker快捷按钮的行为
                            if (quicker.change) {
                                var quickerTool = quicker.mapTo ? map[quicker.mapTo] : map[quicker.checked || ops[0].toolID];

                                quicker.quickClass = quickerTool.quickClass;
                                quicker.text = quicker.text || quickerTool.quickText;
                            }

                            var quickClass = quicker.quickClass;

                            //不允许快捷按钮操作
                            var disQuick = quicker.mapTo ? "" : " quick-disabled";

                            //快捷按钮HTML                        
                            html +=     '<div class="tool-quicker-wraper'+disQuick+'">'+
                                            '<span class="tool-select-btn tool-select-btn-'+orientation+'">'+(quicker.text)+'</span>'+
                                            '<span class="tool-icon tool-icon-'+orientation+' '+(tool.disabled?(quickClass.disabled||""):(quickClass.normal||""))+'"'+sprite+'>&nbsp;</span>'+
                                            '<span class="tool-text tool-text-'+orientation+'">'+(quicker.text)+'</span>'+
                                        '</div>'+
                                        options+
                                    '</div>';
                    break;
                //滚动式下拉
                case "scroller":
                        var html = '<div'+(tool.toolID?' id="'+tool.toolID+'"':"")+' data-tool-type="'+tool.type+'" class="user-select-none appedit-tools-wraper appedit-tool-scroller'+(tool.disabled?disScroll:"")+'">'+
                                        '<div class="tool-scroller-frame" style="'+(tool.width?" width:"+tool.width+";":"")+(tool.height?" height:"+tool.height+";":"")+'">'+
                                            '<div class="scroller-frame-btn">'+
                                                '<div data-action="U" data-height="+='+(tool.height)+'" class="scroll-btn scrollU">&nbsp;</div>'+
                                                '<div data-action="D" data-height="-='+(tool.height)+'" class="scroll-btn scrollD">&nbsp;</div>'+
                                                '<div data-action="A" class="scroll-btn scrollA">&nbsp;</div>'+
                                            '</div>'+
                                        '</div>';
                            
                            //列表数据        
                            var data = tool.data;

                            //数据中的 **_id、**_name 等的前缀
                            var prefix = tool.prefix;

                            //scroller列表项的自定义模板
                            var itemTemplate = tool.itemTemplate || 
                                                '<div class="scroll-item-wraper" id="item_${itemID}" data-id="${itemID}">\
                                                    <img class="scroll-item-thumb" src="${itemThumb}" alt="${itemName}" />\
                                                    <p class="scroll-item-name" class="item-name">${itemName}</p>\
                                                </div>';

                            var itemList = [],
                                checkItem = "";

                            for (var i = 0, len = data.length; i < len; i++) {
                                var item = data[i];

                                var itemThumb = item.thumburl;

                                itemThumb = itemThumb.indexOf("shortcut.png") > -1 ?
                                                    (!tool.thumbName ? itemThumb : 
                                                            itemThumb.replace("shortcut.png", tool.thumbName)) :
                                                    (itemThumb + (tool.thumbName || "shortcut.png"));

                                var itemData = {
                                    "itemID"    : item[prefix+"id"],
                                    "itemThumb" : itemThumb,
                                    "itemName"  : item[prefix+"name"],
                                    "itemUrl"   : item[prefix+"url"]
                                }

                                var itemHTML = methods.packTemplate(itemData, itemTemplate);

                                if (tool.checkedID == itemData.itemID) {
                                    checkItem = itemHTML;
                                }

                                itemList.push(itemHTML);

                            }

                            html +=     '<div class="scroller-container">'+
                                            '<div class="scroller-title-box scroller-use-item">'+
                                                '<h4>当前'+tool.text+'</h4>'+
                                                '<div><div>'+checkItem+'</div></div>'+
                                            '</div>'+
                                            '<div class="scroller-title-box scroller-all-item">'+
                                                '<h4>全部'+tool.text+'</h4>'+
                                                '<div><div>'+itemList.join("")+'</div></div>'+
                                            '</div>'+
                                        '</div>'+
                                    '</div>';
                    break;
                default:
                    break;
            }

            return html;
        }
    };

    /**
     * iHomed公用函数
     */
    handler.__public__ = {
        /**
         * 系统登出
         * @return 无返回值
         */
        logout: function () {
            
            // 请求退出
            handler.__public__.getData( {
                url: "user_logout",
                data: {
                    accesstoken: methods.data( "token" )
                },
                complete: function () {

                    // 若存在 $.cookie 则先要删除所有的 cookie
                    if ( util.isFunction( $.cookie ) ) {

                        var cookies = [ "userid", "accesstoken", "role" ];

                        for ( var i = cookies.length; i > 0; i-- ) {

                            $.cookie( cookies[ i-1 ], null, { path: "/", domain: gdc.uCookieDomain} );

                        }

                    }

                    // 无论成功失败都退到登录界面
                    _top.location.href = CONFIG.loginurl;
                }
            } );

        },
        /**
         * 身份验证
         * @param  {Int}    code    状态码
         * @return {Boolean} 通过true，不通过false
         */
        verify: function (code) {
            var _this = this;

            /**
             * 错误状态码
             */
            var Error = {
                9021    : "身份令牌不合法！",
                9022    : "身份令牌已过期，请重新登陆"
            };

            var tip = Error[code] || "",
                result = Error[code] === undefined ? true : false;

            if (result !== true) {
                if (util.isFunction(_top.$.alert)) {
                    _top.$.alert({
                        layerID: "layer-token",
                        content: {
                            html: tip
                        },
                        footer: {
                            buttons: [{
                                callback: function () {
                                    //登出
                                    _this.logout();
                                }
                            }]
                        }
                    });
                } else {
                    alert(result);

                    //登出
                    _this.logout();
                }
            }

            return result;
        },
        /**
         * 获取数据
         * @param  {Object}     options 数据参数
         * @param  {Function}   fn      获取数据成功后的回调
         * @return 无返回
         */
        getData: function (options, fn) {
            var _this = this;

            //发送请求前执行
            util.runFunction(options.beforeSend);
            
            if (!options.url) { $.error("请求地址不存在！"); }

            // 自动判断 url 的请求类型
            var type = options.url.split( "_" )[0].toUpperCase();

            // 标准的请求方式
            if ( util.inArray( type, [ "GET", "POST" ] ) == -1 ) {
                type = null;
            }

            //转换大写
            options.type = options.type ? options.type.toUpperCase() : ( type ? type : "GET" );

            //转换大写
            options.type = options.type ? options.type.toUpperCase() : "GET";

            // 设置默认请求 data 参数
            options.data = options.data || {};

            // 是否去掉 key 中的下划线，默认去掉
            options.rmunderline = options.rmunderline !== undefined ? options.rmunderline : true;

            if ( options.rmunderline ) {

                //去除data中key带有的下划线
                options.data = util.rmUnderline(options.data);

            }
            
            if (!options.data.accesstoken) {
                //设置请求数据中的accesstoken
                options.data.accesstoken = methods.data( "token" );
            }

            // 是否使用 JSON.stringify 转换 options.data 为字符串，默认转换
            options.stringify = options.stringify !== undefined ? options.stringify : true;

            var ajaxSettings = $.extend({}, options, {
                success: function (data) {
                    //身份验证不通过
                    if (!_this.verify(data.ret)) { return false; }

                    data = util.rmUnderline(data);
                    //执行默认回调
                    util.runFunction(fn, options, [data]);
                    
                    if (options.jQ && options.jQ.length > 0) {
                        //执行用户自定义回调
                        util.runFunction(options.success, options.jQ[0], [data]);
                    } else {
                        //执行用户自定义回调
                        util.runFunction(options.success, [data]);
                    }
                },
                //默认超时时间
                timeout: options.timeout || 20000,
                data: options.type == "POST" && options.stringify ? JSON.stringify(options.data) : options.data,
                url: (Api[options.url] || options.url),
                error: util.isFunction(options.error) ? options.error : function () {},
                complete: util.isFunction( options.complete ) ? options.complete : function () {}
            });

            $.ajax(ajaxSettings);
        },
        /**
         * 保存数据
         * @param  {Object}     options 数据参数
         * @param  {Function}   fn      保存数据成功后的回调
         * @return 无返回
         */
        setData: function (options, fn) {
            var _this = this;

            //发送请求前执行
            util.runFunction(options.beforeSend);
            
            if (!options.url) { $.error("请求地址不存在！"); }

            // 设置默认请求 data 参数
            options.data = options.data || {};

            // 是否去掉 key 中的下划线，默认去掉
            options.rmunderline = options.rmunderline !== undefined ? options.rmunderline : true;

            if ( options.rmunderline ) {

                //去除data中key带有的下划线
                options.data = util.rmUnderline(options.data);

            }
            
            // 自动判断 url 的请求类型
            var type = options.url.split( "_" )[0].toUpperCase();

            // 标准的请求方式
            if ( util.inArray( type, [ "GET", "POST" ] ) == -1 ) {
                type = null;
            }

            //转换大写
            options.type = options.type ? options.type.toUpperCase() : ( type ? type : "GET" );
            
            // 是否使用 JSON.stringify 转换 options.data 为字符串，默认转换
            options.stringify = options.stringify !== undefined ? options.stringify : true;

            if (!options.data.accesstoken) {
                //设置请求数据中的accesstoken
                options.data.accesstoken = methods.data( "token" );
            }
            
            var ajaxSettings = $.extend({}, options, {
                success: function (data) {
                    //身份验证不通过
                    if (!_this.verify(data.ret)) { return false; }

                    //去除data中key带有的下划线
                    data = util.rmUnderline(data);

                    //执行默认回调
                    util.runFunction(fn, options, [data]);
                    //执行用户自定义回调
                    util.runFunction(options.success, [data]);
                },
                //默认超时时间
                timeout: options.timeout || 20000,
                data: options.type == "POST" && options.stringify ? JSON.stringify(options.data) : options.data,
                url: (Api[options.url] || options.url),
                error: util.isFunction(options.error) ? options.error : function () {}
            });

            //请求的data数据
            var data = options.data;
            
            //将数据中的&nbsp;改回空格
            for (var i in data) {
                if (data.hasOwnProperty(i) && typeof data[i] === "string") {
                    data[i] = util.nbsp2space(data[i]);
                }
            }

            $.ajax(ajaxSettings);
        },
        /**
         * 组装模板
         * @param  {Object}  data       模板数据
         * @param  {String}  template   模板代码
         * @param  {Boolean} encodeHtml 编码 html 标记为实体
         * @return {String}             返回真正的HTML代码
         */
        packTemplate: function (data, template, encodeHtml) {

            return  template.replace(/\$\{(.*?)\}/ig, function (str, key) {
                        
                        encodeHtml = encodeHtml === false ? false : true;

                        var keys = key.split("|");

                        //获取默认值  default=****
                        //var def = keys.length > 1 ? (/^default=(.*)/ig).exec($.trim(keys[1]||""))[1] : "";

                        var ops = {};

                        for ( var i = 1, l = keys.length; i < l; i++ ) {
                            var match = (/(\w+)(?:\=?(\w+))?/).exec( keys[i] );

                            ops[ match[1] ] = match[2];
                        }

                        key = ( $.trim(keys[0]) ).split( ":" ); //变量

                        var ret = data[ key[0] ];

                        if ( key.length > 1 ) {

                            key1 = key[1].split( "." );

                            for ( var i = 0, l = key1.length; i < l; i++ ) {

                                ret = ret[ key1[i] ];
                                if ( ret === undefined ) { break; }

                            }

                        }

                        ret = (!ret && ret !== 0) ? (ops.default ? ops.default : "") : ret;

                        ret = ops.escape ? (typeof ret == "string" ? util.space2nbsp( util.text(ret) ) : util.text( ret )) : ret;

                        // 防止 js 注入或 html 标记写入到页面中
                        return ret;
                    });

        },
        /**
         * 把imgUrl的图片*.jpg转换成*_type.jpg
         * @param  {String} imgUrl 图片url
         * @param  {String} type   图片后缀
         * @return {String} 加了前缀的图片url
         */
        addSuffixToImg: function (imgUrl, type) {
            if (!type || !imgUrl) {
              return imgUrl;
            }

            var i = imgUrl.lastIndexOf(".");

            return imgUrl.slice(0, i)+"_"+type+imgUrl.slice(i);
        }
    };

    /**
     * tPager函数方法
     */
    var tPager = {
        /**
         * 初始化tPager
         * @param  {Object} option  tPager参数设置
         * @return 无返回值
         */
        init: function (option) {
            
            var $wraper = $( this );
            
            // 获取 id
            option.pager = "#" + $wraper.attr( "id" );

            // 默认提供列表数量下拉选择框功能, option.select 为 false 时不提供
            if ( option.select !== false ) {
                option.select = $.extend( {
                    option: [ 20, 30, 50, 100 ],
                    unit: "个"
                }, option.select );

                // 由小到大排序
                option.select.option.sort( function ( a, b ) {
                    return a - b;
                } );

                var pageInfo = option.request.data,
                    // 获取分页请求接口
                    url = option.request.url,
                    // 获取 cookie 中的分页数据集合
                    pagenumCookie = JSON.parse( $.cookie( "pagenumCookie" ) || "{}" );

                    //一页数据量
                var pagenum = +(pagenumCookie[url] || pageInfo.pagenum || pageInfo.pagesize),
                    o = option.select.option;

                if ( o.length > 0 && $.inArray( pagenum, o ) == -1 && pagenum < o[o.length-1] ) {
                    pagenum = +(o[0]);

                    // 记录当前 url 对应的分页量到 cookie 中
                    pagenumCookie[ url ] = pagenum;
                    $.cookie( "pagenumCookie", JSON.stringify( pagenumCookie ) );
                }

                pageInfo.pagesize = pagenum;
                pageInfo.pagenum = pagenum;

            }
            
            $wraper.data("option", option);

            //生成分页导航HTML代码，并默认获取 pageidx 页的数据
            tPager.getPage.call( this, option.request.data.pageidx, option );
            //tPager.loadPageNav( option );

            $wraper.undelegate();
            $wraper.delegate("a", {
                "click.pagenav": function (e) {
                    e = e || window.event;
                    var op = e.data.option;

                    var $wraper = $(op.pager);

                    //要获取的页码
                    var page = $(this).attr("data-pageidx");

                    tPager.getPage.call($wraper, page, op);
                }
            }, {
                option: option
            }).delegate("input", {
                "keyup.pagenav": function (e) {
                    var e = e || window.event;
                    var code = e.which || e.keyCode;

                    if (code == 13) {

                        var op = e.data.option;

                        var $wraper = $(op.pager);

                        //要获取的页码
                        var page = $(this).val();

                        tPager.getPage.call($wraper, $.trim(page), op);
                    }

                }
            }, {
                option: option
            }).delegate("select", {
                "change.pagenav": function (e) {
                    var e = e || window.event;

                    var op = e.data.option;

                    var $wraper = $(op.pager),
                        pagenum = +this.value;

                    var pageInfo = op.request.data,
                        // 获取分页请求接口
                        url = op.request.url,
                        // 获取 cookie 中的分页数据集合
                        pagenumCookie = JSON.parse( $.cookie( "pagenumCookie" ) || "{}" );;

                    // 要修改的每页数量
                    pageInfo.pagesize = pagenum;
                    pageInfo.pagenum = pagenum;

                    // 记录当前 url 对应的分页量到 cookie 中
                    pagenumCookie[url] = pagenum;
                    $.cookie( "pagenumCookie", JSON.stringify( pagenumCookie ) );

                    tPager.getPage.call($wraper, 1, op);

                }
            }, {
                option: option
            });

            $wraper = null;
        },
        /**
         * 生成页码导航
         * @param  {Object} option 分页参数
         * @return 无返回值
         */
        loadPageNav: function (option) {
            var $wraper = $(option.pager);

            //生成分页导航HTML代码
            $pageNav = $(this.initPageNavHTML(option));

            $wraper.data("tPager", option);

            $wraper.html($pageNav);

            return this;
        },
        pageNum: function () {

            var option = $( this ).data("option");

            return option ? option.request.data.pageidx : false;

        },
        pageSize: function () {

            var option = $( this ).data("option"),
                pageInfo = option.request.data;

            return option ? (pageInfo.pagenum || pageInfo.pagesize) : false;

        },
        /**
         * 获取某一页的数据
         * @param  {String|Int} page        页码
         * @param  {Object}     option      分页参数
         * @return 无返回值
         */
        getPage: function (page, option) {

            var $this = $( this );

            option = option || ($this.data("option"));
            
            var request = option.request.data,
                pageidx = request.pageidx,
                pagenum = request.pagenum;

            switch (page) {
                case "-1":
                case "+1":
                    pageidx = pageidx + (+page);
                    break;
                default :
                    pageidx = page;
                    break;
            }

            if (pageidx > 0 && ( !option.maxPage || pageidx <= option.maxPage)) {
                request.pageidx = +pageidx;
                util.runFunction( option.onPaging, $this );
                handler.__public__.getData(option.request, function ( data ) {
                    var totalColumn = option.totalColumn || "total";
                    option.total = data[ totalColumn ] || 0;

                    if( option.total != 0 && pagenum * (pageidx - 1) >= option.total ){// 判断当页数是否超过最大页数
                        pageidx = Math.ceil( option.total / pagenum );
                        tPager.getPage( pageidx || 1, option );
                        return false;
                    }

                    if ( util.runFunction( option.loadData, $this, [ data, option.total ] ) === false ) {
                        return false;
                    }

                    tPager.loadPageNav(option);
                    util.runFunction( option.onSuccess, $this, [ data ] );
                });
            }
        },
        /**
         * 生成分页导航HTML代码
         * @param  {Object} option 分页参数
         * @return {Object}        分页导航HTML代码
         */
        initPageNavHTML: function (option) {

            var pageInfo = option.request.data;

                //一页数据量
            var pagenum = pageInfo.pagenum || pageInfo.pagesize,
                //当前页码
                pageidx = pageInfo.pageidx,
                //总数据量
                total = option.total,
                // 分页下拉框
                select = option.select;

            //最大页码数
            var maxPage = Math.ceil(total/pagenum);

            var html = [];

            //首页和上一页, "1"->首页   "-1"->上一页
            if (pageidx == 1) {
                if( option.scope > 2 )html.push('<span data-pageidx="1">首页</span>');
                html.push('<span data-pageidx="-1">上一页</span>');
            } else {
                if( option.scope > 2 )html.push('<a href="javascript:void(0);" data-pageidx="1">首页</a>');
                html.push('<a href="javascript:void(0);" data-pageidx="-1">上一页</a>');
            }
  
            //起始分页位置
            var startPage = (pageidx - Math.ceil(option.scope/2));
                startPage = startPage > -1 ? startPage : 0;

            //结束分页位置
            var stopPage = (startPage + Math.min(maxPage, option.scope));

            //可分页页码，中间区域，根据scope来决定
            for (; startPage < stopPage && startPage < maxPage; startPage++) {
                var page = startPage+1;
                var nav = "";
                if (page === (+pageidx)) {
                    nav = '<span data-pageidx="'+page+'" class="current">'+page+'</span>';
                } else {
                    nav = '<a href="javascript:void(0);" data-pageidx="'+page+'">'+page+'</a>';
                }
                html.push(nav);
            }

            //下一页和末页, "+1"->下一页    mapPage->末页
            if (pageidx == maxPage || maxPage == 0) {
                html.push('<span data-pageidx="1">下一页</span>');
                if( option.scope > 2 )html.push('<span data-pageidx="'+maxPage+'">末页</span>');
            } else {
                html.push('<a href="javascript:void(0);" data-pageidx="+1">下一页</a>');
                if( option.scope > 2 )html.push('<a href="javascript:void(0);" data-pageidx="'+maxPage+'">末页</a>');
            }

            if (maxPage != 0) {
                html.push('<input type="text" />&nbsp;&nbsp;/&nbsp;<em class="maxPage">'+maxPage+'</em>&nbsp;页');
            }

            // 需要初始化分页下拉框
            if ( $.isPlainObject( select ) && select.option && select.option.length > 0 ) {

                // 下拉列表选项
                var o = select.option || [],
                    i = 0,
                    l = o.length,
                    v = null; // 选项的值

                if ( l > 0 ) {

                    html.push( '<select>' );

                    for ( ; i < l; i++ ) {
                        v = o[i];

                        html.push( '<option'+(v==pagenum?' selected="selected"':'')+' value="'+o[i]+'">'+o[i]+'&nbsp;'+(select.unit||'个')+'&nbsp;/&nbsp;页</option>' );
                    }

                    html.push( '</select>' );

                }

            }
            
            option.maxPage = maxPage;

            return '<div class="tpage-nav">'+html.join("")+'</div>';
        }
    };

    //公用工具函数
    var util = {
        /**
         * 设置属性值到iHomed
         * @param  {String} name  属性名
         * @param  {各类型} value 属性值
         * @return {各类型}       根据value的值来返回对应的数据
         */
        data: function ( name, value ) {

            return methods.data( name, value );
        },
        /**
         * 获取变量的类型
         * @param  {各类型} variable 变量
         * @return {String}          返回变量的类型, 如：number, array, function, object等
         */
        typeOf: function (variable) {
            var type = Object.prototype.toString.call(variable);
            return ((/\[object\s+(.*)\]/ig).exec(type)[1]).toLowerCase();
        },
        /**
         * 判断元素是否存在数组中
         * @param  {各种类型} item 要判断的元素
         * @param  {array}    arr  被判断的数组
         * @return {boolean}       返回布尔值
         */
        inArray: function (item, arr) {
            if ($.inArray) {
                return $.inArray(item, arr);
            } else {
                for (var i = arr.length-1; i > -1; i--) {
                    if (arr[i] == item) {
                        return i;
                    }
                }
                return -1;
            }
        },
        /**
         * 移除arr数组中index下标对应元素
         * @param  {Int}    index   要移除的元素的下标
         * @param  {Array}  arr     数组
         * @return 返回被移除的元素
         */
        removeAt: function (index, arr) {

            var len = arr.length;
            if (index == 0) {
                return arr.shift();            
            } else if (index == (len - 1)) {
                return arr.pop();
            } else {
                var value = arr[index];
                var newArr = [].concat(arr.slice(0, index), arr.slice((index + 1), len)),
                    newLen = newArr.length;
                for (var i = 0; i < newLen; i++) {
                    arr[i] = newArr[i];
                }
                arr.length = newLen;
                return value;
            }
        },
        /**
         * 移除数组中的元素
         * @param  {多类型} value 要移除的元素
         * @param  {Array}  arr   数组
         * @return {多类型}       返回被移除的元素
         */
        removeOf: function (value, arr) {
            var index = util.inArray(value, arr);

            if (index > -1) {
                return util.removeAt( index, arr );
            }
            
            return false;
        },
        /**
         * 判断fn是否存在并且是一个函数
         * @param  {Function}  fn 函数名
         * @return {Boolean}       返回布尔值
         */
        isFunction: function (fn) {
            /*if (fn && typeof fn === "function") {
                return true;
            }
            return false;*/

            return $.isFunction( fn );
        },
        /**
         * 如果fn为函数则运行该函数
         * @param  {Function}  fn       函数名
         * @param  {Object}    thisObj  函数的当前对象
         * @param  {Array}     args     函数参数
         * @return 无返回
         */
        runFunction: function (fn, thisObj, args) {
            if (this.isFunction(fn)) {
                var argus = arguments,
                    argsl = argus.length;

                //如果函数的参数列表存在1个参数
                if (argsl == 1) {
                    return fn.apply(window);
                }

                //如果函数的参数列表存在2个参数
                if (argsl == 2) {
                    if (this.typeOf(thisObj) == "array") {
                        return fn.apply(window, thisObj);
                    } else {
                        return fn.apply(thisObj);
                    }
                }

                //如果函数的参数列表存在3个参数
                if (argsl == 3) {
                    return fn.apply(thisObj || window, args);
                }
            }
        },
        /**
         * 数字加前导0
         * @param  {int}    num    要加前导0的数值
         * @param  {int}    digit  位数，默认为2
         * @return {string}        返回具有前导零的数字
         */
        addZero : function (num, digit) {
            digit = digit || 2;

            var n = ("" + num).split("");

            var zero = new Array(digit - n.length + 1).join("0");

            return zero + num;
        },
        /**
         * 转换时间戳为格式时间 如 2014-09-10 12:33:33
         * @param  {Int}    timestamp 时间戳
         * @return {String}           格式时间 如 2014-09-10 12:33:33
         */
        timeFormat: function (timestamp) {
            if (/[^\d]/ig.test(timestamp)) {
                return timestamp;
            } else {
                var d = new Date(timestamp*1000);
                return d.getFullYear()+"-"+util.addZero(d.getMonth()+1)+"-"+util.addZero(d.getDate())+" "+
                       util.addZero(d.getHours())+":"+util.addZero(d.getMinutes())+":"+util.addZero(d.getSeconds());
                   }
        },
        /**
         * 按照f中宽高比例来缩放拉伸
         * @param  {Object} f 参照宽高信息
         * @param  {Object} t 缩放前的宽高信息，单独存在width或height时定比缩放(_const必填)，两者同时存在则等比缩放
         *               实例 {
         *                        width: 100,
         *                        height: 100,
         *                        _const: "width" | "height" | null
         *                    }
         * @return {Object}   返回计算后的宽高信息
         */
        scale: function (f, t) {
            var i = {},
                ratio = 1;
            if (t && t.width && t.height) {

                if (t._const == "width") {
                    ratio = f.width / t.width;
                } else if (t._const == "height") {
                    ratio = f.height / t.height;
                } else {
                    var wR = f.width / t.width,
                        hR = f.height / t.height;
                    
                    ratio = wR > hR ? hR : wR;
                    ratio = ratio > 1 ? 1 : ratio;
                }

                i.width = Math.round(t.width * ratio);
                i.height = Math.round(t.height * ratio);
            }
            
            return i;
        },
        /**
         * 转换空格为 &nbsp;
         * @param  {String} str 需要转换的字符串
         * @return {String}     返回转换后的字符串
         */
        space2nbsp: function (str) {
            return str.replace(/\s/ig, "&nbsp;");
        },
        /**
         * 转换&nbsp;为 空格;
         * @param  {String} str 需要转换的字符串
         * @return {String}     返回转换后的字符串
         */
        nbsp2space: function (str) {
            return str.replace(/&nbsp;/ig, " ");
        },
        /**
         * 转换json对象成字符串，并去掉所有key中的下划线_
         * @param  {Object} json json对象
         * @return {String}      返回json字符串
         */
        json2StringWAU: function ( json ) {

            if ( !json ) {
                return json;
            }

            return JSON.stringify(json).replace(/"(\w*?)":/ig, function (m,p1) {
                return '"'+p1.replace(/_/g, "")+'":';
            });
        },
        /**
         * 转换json对象成字符串，并去掉一级key中的下划线_
         * @param  {Object} json json对象
         * @return {String}      返回json字符串
         */
        json2StringWU: function (json) {

            if ( !json ) {
                return json;
            }

            return JSON.stringify(json).replace(/"([A-Za-z0-9]*)_([A-Za-z0-9]*)":/ig, '"$1$2":');
        },
        /**
         * 删除所有的 key 中的下划线，并返回 json 对象
         * @param  {Object} json json 对象
         * @return {Object}      新的 json 对象
         */
        rmUnderline: function (json) {

            if ( !json ) {
                return json;
            }

            return $.parseJSON(util.json2StringWAU(json));
        },
        /**
         * 读取本地图片
         * @param  {File}     file       File 对象
         * @param  {Function} fn         回调函数
         * @param  {String}   defaultImg 默认图片
         * @return                       无返回值
         */
        preview: function ( file, fn, defaultImg ) {

            var reader = {};

            if ( typeof FileReader == "undefined" ) {

                reader.result = defaultImg || "";

                reader.viewMsg = "viewDefault";

                util.runFunction( fn, reader );

            } else {

                reader = new FileReader();

                reader.readAsDataURL( file );

                reader.onload = function () {

                    if ( util.isFunction( fn ) ) {

                        this.viewMsg = "";

                        util.runFunction( fn, this );

                    }


                };

            }
        },
        /**
         * 解析查询字符串
         * @param  {String} str 查询字符串
         * @return {Object}     解析后的查询字符串后的对象
         */
        query: function ( str, _decode ) {

            _decode = _decode !== false ? (_decode || window.decodeURIComponent) : false ;

            var data = {},
                arr = [],
                uri = util.isFunction(_decode)?_decode( str ):str;

            if ( uri.indexOf( "?" ) != -1 ) {

                arr = ( uri.split( "?", 2 )[1] );

                if ( arr.length != 0 ) {
                    
                    arr = arr.split( "&" );
                    var len = arr.length;

                    //存储分解形如 name=value 的字符串为数组形式
                    var nameValue;

                    for ( var i = 0; i < len; i++ ) {

                        nameValue = arr[i].split( "=" );
                        data[ nameValue[0] ] = nameValue[1];

                    }

                    return data;
                }
            }

            return {};

        },
        /**
         * 计算文件的容量大小(KB,MB,GB)
         * @param  {int}    size    字节数
         * @param  {int}    fixed   取小数点后的fixed位
         * @return {string}   返回带上了(KB,MB,GB)的容量大小的字符串
         */
        computeFileSize: function ( size, fixed ) {
            fixed = fixed || 2;
            if (size > 1024 * 1024 * 1024 * 1024) {
                size = size / (1024 * 1024 * 1024 * 1024);
                size = (""+size).indexOf(".") > -1 ? size.toFixed(fixed) : size;
                return size + 'TB';
            } else if (size > 1024 * 1024 * 1024) {
                size = size / (1024 * 1024 * 1024);
                size = (""+size).indexOf(".") > -1 ? size.toFixed(fixed) : size;
                return size + 'GB';
            } else if (size > 1024 * 1024) {
                size = size / (1024 * 1024);
                size = (""+size).indexOf(".") > -1 ? size.toFixed(fixed) : size;
                return size + 'MB';
            } else if (size > 1024) {
                return (Math.round(size / 1024)) + 'KB';
            } else {
                return Math.round(size) + 'Byte';
            }
        },
        /**
         * 将毫秒数转换为(时:分:秒,毫秒)(00:00:00,000)
         * @param  {int} mSeconds 时间毫秒数
         * @return {string} 返回时分秒
         */
        m2t: function (ms) {
            var msec = this.addZero(ms % 1000, 3);

            ms = Math.floor(ms / 1000);

            var hours = this.addZero(Math.floor(ms / 3600)),
                min = this.addZero(Math.floor((ms % 3600) / 60)),
                sec = this.addZero(Math.floor((ms % 3600) % 60));

            return hours + ":" + min + ":" + sec + "," + msec;
        },
        /**
         * 将形如 00:00:00,000 的(时:分:秒,毫秒)转换成毫秒数
         * @param  {string} time 00:00:00,000 的(时:分:秒,毫秒)
         * @return {int} 毫秒数
         */
        t2m: function (time) {
            time = time.split(/[:,]/ig);

            if (time.length > 0) {
                var sum = 0;

                var sum =   (parseInt(time[0], 10) * 3600) +
                            (parseInt(time[1], 10) * 60) +
                            (parseInt(time[2], 10));

                sum = (sum * 1000) + parseInt(time[3], 10);

                return +sum;
            } else {
                return -1;
            }
        },
        /**
         * 获取请求 api
         * @param  {String} myApi 要获取的 Api 接口
         * @return {String}       Api 接口
         */
        api: function ( myApi ) {

            return methods.api( myApi );

        },
        /**
         * 编码 html 标记代码为 html 实体
         * @param  {String} html html 标记代码
         * @return {String}      html 实体
         */
        text: function ( html ) {

            return $( "<div/>" ).text( html ).html();

        },
        /**
         * 解码 html 实体为 html 标记代码
         * @param  {String} entity html 实体
         * @return {String}        html 标记代码
         */
        html: function ( entity ) {

            return $( "<div/>" ).html( entity ).text();

        },
        /**
         * 加载海报
         * @param  {object} $target 显示海报的img标签
         * @param  {string} src     海报路径
         * @param  {fn}     成功加载图片的回调函数
         * @return 无
         */
        loadPoster: function( $target, src, fn ){
            var img = new Image(),
                self = this;

            img.src = src;

            img.onload = function () {

                $target.attr( "src", this.src );
                self.runFunction( fn );

            };

            img.onerror = function() {

                console.log( "img url error" );

            };
        }
    };

    window.iHomed = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else {
            throw new Error("不存在"+method+"方法！");
        }
    };

    $.extend( window.iHomed, util );

    $.fn.iHomed = function (method) {
        if ($methods[method]) {
            return $methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else {
            $.error("不存在"+method+"方法！");
        }
    };
    
}( jQuery, window ) );