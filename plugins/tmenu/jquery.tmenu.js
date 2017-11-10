;(function ($, window, undefined) {

    //把以下变量保存成局部变量
    var _top = top || window,
        document = window.document,
        navigator = window.navigator,
        location = window.location;
        
    /**
     * tMenu的方法定义
     */
    var methods = {
        /**
         * 初始化tMenu菜单
         * @param  {Object} options tMenu参数
         * @return {Object}         返回DOM对象集合
         */
        init: function (options) {

            //保存当前的JQ对象
            var $this = $(this);

            settings = $.extend({

                selector        : null,         //一个选择器字符串过滤选定的元素，该选择器的后裔元素将调用处理程序。
                                                //如果选择是空或被忽略，当它到达选定的元素，事件总是触发。
                
                menuID          : false,        //菜单的id
                width           : 140,          //菜单的宽度
                lineHeight      : 25,           //菜单项的高度
                disabled        : false,        //是否禁用tMenu
                oncontextmenu   : false,        //显示右键菜单前的回调
                onmenuhide      : false,        //右键菜单消失后的回调
                oninit          : false,        //右键菜单初始化完毕后的回调
                groups          : []            //菜单选项

                /**
                 * groups 参数设置实例
                 * 
                 * groups       : [{
                 *     width    : 140,                          //菜单的宽度，不传则默认settings.width
                 *     name     : ""
                 *     lists    : [{
                 *         disabled     : false,                //是否禁用该选项，默认不禁用
                 *         text         : "没有子菜单",         //选项的名称
                 *         icon         : false,                //选项的图标
                 *         iconStyle    : false,                //icon的style样式
                 *         itemID       : false,                //自定义菜单项的id
                 *         action       : function () {}
                 *         keyCode      : 13                    //使用快捷键快速运行action操作
                 *     }, {
                 *         text         : "有子菜单",
                 *         action       : false,                //有子选项的项设置action不起作用
                 *         keyCode      : 37,                   //使用快捷键快速打开子菜单
                 *         groups       : [ {...}[, {...}] ]    //跟groups设置一样
                 *     }]
                 * 
                 * }]
                 * 
                 */

            }, {
                menuID          : "tmenu-"+(new Date().getTime())       //若menuID不存在则生成一个临时id
            }, options || {});

            //判断 settings.menuID 是否存在，否则抛出一个错误
            if (settings.menuID === false) {
                throw new Error("致命错误: menuID 不存在!");
            }

            var tmenuSettings = {
                selector                : settings.selector,
                element                 : $this,                    //当前的JQ对象
                menuID                  : settings.menuID,          //菜单ID
                settings                : settings,                 //设置参数       

                //Panel Data
                panel                   : {                         //记录面板上操作的元数据
                    keys                : [],                       //当前面板上可执行的快捷键的集合
                    timer               : null,                     //延时操作 setTimeout id
                    length              : 0,                        //菜单项的总数
                    meta                : {}                        //所有面板上的菜单项的数据
                },

                //Menu Data
                menu                    : {
                    target              : null                      //触发当前菜单的JQ对象
                
                },

                //Event Handler
                method_init             : settings.oninit,          //当右键菜单初始化完毕后的回调
                method_contextmenu      : settings.oncontextmenu,   //触发右键菜单的回调
                method_menuhide         : settings.onmenuhide,      //触发右键菜单关闭后的回调
                handler_init            : handler.onInit            //初始化tmenu函数 

            };

            window[settings.menuID] = tmenuSettings;
            tmenuSettings = window[settings.menuID];

            $this.data("tmenuSettings", tmenuSettings);

            tmenuSettings.handler_init();

            return this;

        },
        /**
         * 使菜单项失效
         * @param  {String} itemID 一个或多个itemID，以空格隔开。可传入 * 以使全部菜单项失效
         * @return 无返回值
         */
        disable: function (itemID) {
            //设置菜单项不可用
            menuUtil.setItemEffect.call(this, itemID, true);

            return this;
        },
        /**
         * 使菜单项可用
         * @param  {String} itemID 一个或多个itemID，以空格隔开。可传入 * 以使全部菜单项失效
         * @return 无返回值
         */
        enable: function (itemID) {
            //设置菜单项可用
            menuUtil.setItemEffect.call(this, itemID, false);

            return this;
        },
        /**
         * 隐藏右键菜单面板
         * @return 无返回值
         */
        hide: function () {

            // 触发隐藏面板事件
            $( document ).trigger( "click.tmenu" );

            return this;

        }
    };

    /**
     * 事件处理函数集合
     */
    var handler = {
        /**
         * 初始化tMenu对象事件
         * @return 无返回
         */
        onInit: function () {
            var tmenuSettings = this;

            menuUtil.initMenu(tmenuSettings, tmenuSettings.method_init);
        }
    };

    /**
     * 右键菜单工具函数集合
     */
    var menuUtil = {

        /**
         * 初始化右键菜单对象
         * @param  {Object}     o   右键菜单设置参数，参考tmenuSettings
         * @param  {Function}   fn  初始化的回调函数
         * @return 无返回
         */
        initMenu: function (o, fn) {
            var menuID = o.menuID;

            $("body").append('<div class="tmenu-content-wraper" id="'+menuID+'">'+menuUtil.traverse.call(o, o.settings, 1)+'</div>');
            
            //为元素绑定右键菜单事件
            menuUtil.bindContext(o);

            //为该菜单的每一项绑定click事件
            menuUtil.itemEvent(o);

            //如果fn存在且是一个函数则运行该回调函数
            util.runFunction(fn, $("#"+menuID));
        },
        /**
         * 为元素绑定右键菜单事件
         * @param  {Object}     o   右键菜单设置参数，参考tmenuSettings
         * @return 无返回
         */
        bindContext: function (o) {
            var $element = o.element,
                menuID = o.menuID,
                panel = o.panel,
                $tmenu = $("#"+menuID);

            $element.addClass("tmenu-cursor-pointer");

            var events = {
                "contextmenu.tmenu": function (e) {
                    e = e || window.event;
                    var _this = this,
                        $this = $(this);

                    $tmenu.find("dd").removeClass("hover active");
                    $tmenu.find(".tmenu-panels-children").hide();

                    if ($tmenu.is(":visible")) {
                        //记录上次触发右键菜单的目标对象
                        var target = o.menu.target || null;

                        $tmenu.hide(0, function () {
                            util.runFunction(o.method_menuhide, $element.get(0), [e, target]);
                        });
                    }

                    //记录本次触发右键菜单的目标对象
                    o.menu.target = $this;

                    util.runFunction(o.method_contextmenu, $element.get(0), [e, $this]);

                    var $win = $(window),
                        //窗口可视区域宽高
                        winWH = {
                            width   : $win.width(),
                            height  : $win.height()
                        },
                        //右键菜单的宽高
                        mWH = {
                            width   : $tmenu.width(),
                            height  : $tmenu.height()
                        },
                        //鼠标的位置信息
                        cWH = {
                            x : e.clientX,
                            y : e.clientY
                        };

                    $tmenu.css({
                        top: winWH.height < (cWH.y + mWH.height) ? (winWH.height - mWH.height) : cWH.y,
                        left: winWH.width < (cWH.x + mWH.width) ? (winWH.height - mWH.height) : cWH.x
                    }).fadeIn(200);

                    //弹出右键菜单时初始当前可操作的快捷键集合
                    panel.keys = $tmenu.find(".tmenu-panels-top").data("keys");

                    e.preventDefault();
                    //e.returnValue = false;
                }
            };

            //该版本的jQuery库是否存在 on 委托事件方法
            var jQHasOn = ( $.fn.on && typeof $.fn.on === "function") ? true : false;

            if (jQHasOn) {
                $element.on(events, o.selector);
            } else {
                if (o.selector) {
                    $element.undelegate( ".tmenu" ).delegate(o.selector, events);
                } else {
                    $(document).undelegate( ".tmenu" ).delegate($element.selector, events);
                }
            }

            $tmenu.find("*").unbind( ".tmenu" ).bind("contextmenu.tmenu", function (e) {
                e = e || window.event;

                e.preventDefault();
                e.returnValue = false;

            });

            $(document).unbind( ".tmenu" ).bind({
                "click.tmenu": function (e) {
                    e = e || window.event;

                    //销毁记录的可执行快捷键
                    panel.keys = [];

                    $(".tmenu-content-wraper:visible").fadeOut(200, function () {
                        util.runFunction(o.method_menuhide, $element.get(0), [e, o.menu.target]);
                    });

                    e.stopPropagation();
                    e.cancelBubble = true;
                },
                "keydown.tmenu": function (e) {
                    e = e || window.event;
                    var code = e.keyCode || e.which;

                    var keys = panel.keys;
                    
                    if (keys.length > 0 && util.inArray(code, keys) > -1) {
                        var $item = $tmenu.find("#"+panel.meta["keyCode_"+code].itemID);
                        $item.trigger("mouseenter");
                        $item.trigger("click");
                    }

                    if (code == 27) {
                        //销毁记录的可执行快捷键
                        panel.keys = [];

                        $(".tmenu-content-wraper:visible").fadeOut(200, function () {
                            util.runFunction(o.method_menuhide, $element.get(0), [e, o.menu.target]);
                        });
                    }

                }
            });
        },
        /**
         * 为菜单的每一项绑定click, mouseenter, mouseleave事件
         * @param  {Object}     o   右键菜单设置参数，参考tmenuSettings
         * @return 无返回
         */
        itemEvent: function (o) {
            var $element = o.element,
                menuID = o.menuID,
                panel = o.panel;

            var $tmenu = $("#"+menuID),
                $tmenu_dd = $tmenu.find("dd");

            $tmenu_dd.unbind( ".tmenu" ).bind({
                "click.tmenu": function (e) {
                    e = e || window.event;
                    var _this = this,
                        $this = $(this);

                    var level = $this.data("level");

                    //取消延时处理的操作
                    if (panel.timer) {
                        clearTimeout(panel.timer);
                        panel.timer = null;
                    }

                    var itemID = $this.children(".tmenu-lists-item").attr("id"),
                        itemMeta = panel.meta[itemID];

                    if (!menuUtil.isDisabled($this) && !itemMeta.disabled) {

                        if ($this.hasClass("tmenu-has-child")) {

                            $panel = $(".tmenu-panels-level-"+level);
                            $panel.find(".tmenu-panels-children").hide();

                            //立即显示子菜单面板
                            var $cpanel = $this.children(".tmenu-panels-children");
                            $cpanel.show();

                            panel.keys = $cpanel.data("keys");
                        } else {

                            //执行菜单项操作
                            if (!itemMeta.disabled) {
                                $tmenu.fadeOut(0, function () {
                                    util.runFunction(o.method_menuhide, $element.get(0), [e, o.menu.target]);
                                });
                                util.runFunction(itemMeta.action, [e, o.menu.target]);
                            }

                            o.menu.target = null;

                            //销毁记录的可执行快捷键
                            panel.keys = [];
                        }
                    }

                    e.stopPropagation();
                    e.cancelBubble = true;
                },
                "mouseenter.tmenu": function (e) {
                    e = e || window.event;

                    var _this = this,
                        $this = $(this);

                    var level = $this.data("level");

                    //取消延时处理的操作
                    if (panel.timer) {
                        clearTimeout(panel.timer);
                        panel.timer = null;
                    }

                    //记录当前鼠标所处于的菜单面板上可执行的快捷键值
                    panel.keys = $this.parents(".tmenu-panels").eq(0).data("keys");

                    var itemID = $this.children(".tmenu-lists-item").attr("id"),
                        itemMeta = panel.meta[itemID];

                    $(".tmenu-panels-level-"+level+" dd").removeClass("hover active");

                    $this.parents("dd").addClass("hover");

                    if (!menuUtil.isDisabled($this) && !itemMeta.disabled) {
                        $this.addClass("hover");
                    }

                    //延时400ms处理下面操作
                    panel.timer = setTimeout(function () {
                        $panel = $(".tmenu-panels-level-"+level);
                        $panel.find(".tmenu-panels-children").hide();
                        $panel.find("dl").removeClass("zi999");

                        if ($this.hasClass("tmenu-has-child") && !menuUtil.isDisabled($this)  && !itemMeta.disabled) {
                            var $cpanel = $this.children(".tmenu-panels-children");
                            $cpanel.show().parents("dl").addClass("zi999");
                        }
                    }, 400);

                    e.stopPropagation();
                    e.cancelBubble = true;
                },
                "mouseleave.tmenu": function (e) {
                    e = e || window.event;

                    var _this = this,
                        $this = $(this);

                    var level = $this.data("level");

                    //销毁记录的可执行快捷键
                    //panel.keys = [];

                    //取消延时处理的操作
                    if (panel.timer) {
                        clearTimeout(panel.timer);
                        panel.timer = null;
                    }

                    $this.removeClass("hover active");

                    //延时400ms处理下面操作
                    panel.timer = setTimeout(function () {
                        $panel = $(".tmenu-panels-level-"+level);
                        $panel.find(".tmenu-panels-children").hide();
                        $panel.find("dl").removeClass("zi999");
                    }, 400);

                    e.stopPropagation();
                    e.cancelBubble = true;
                },
                "mousedown.tmenu": function (e) {
                    e = e || window.event;

                    var _this = this,
                        $this = $(this);

                    var itemID = $this.children(".tmenu-lists-item").attr("id"),
                        itemMeta = panel.meta[itemID];

                    if (!menuUtil.isDisabled($this) && !itemMeta.disabled) {
                        $this.addClass("active");
                    }

                    e.stopPropagation();
                    e.cancelBubble = true;
                },
                "mouseup.tmenu": function (e) {
                    e = e || window.event;

                    var _this = this,
                        $this = $(this);

                    var itemID = $this.children(".tmenu-lists-item").attr("id"),
                        itemMeta = panel.meta[itemID];

                    $this.removeClass("active");

                    e.stopPropagation();
                    e.cancelBubble = true;
                }
                
            }).parents(".tmenu-panels").unbind( ".tmenu" ).bind({
                "mouseleave.tmenu": function (e) {
                    e = e || window.event;

                    var _this = this,
                        $this = $(this);

                    //销毁记录的可执行快捷键
                    //panel.keys = [];

                    e.stopPropagation();
                    e.cancelBubble = true;
                }
            });
        },
        /**
         * 遍历右键菜单的groups树结构，并输出相应的HTML字符串
         * @param  {Object} o      右键菜单设置参数，参考tmenuSettings.settings
         * @return {String}        返回相应的HTML字符串
         */
        traverse: function (o, level) {
            var tmenuSettings = this,
                panel = tmenuSettings.panel;

            var nodeHTML = "",
                keys = [];

            //组成员集合
            var groups = o.groups || [];

            for (var g = 0, gl = groups.length; g < gl; g++) {

                //组成员
                var group = groups[g];

                nodeHTML += '<dl class="tmenu-groups-item'+((g==0?" first":"")+(g==gl-1?" last":"")+(g%2?" even":" odd"))+'">';

                //组标题
                nodeHTML += group.name ? '<dt>'+group.name+'</dt>' : "";

                //项成员集合
                var lists = group.lists || [];

                for (var i = 0, l = lists.length; i < l; i++) {

                    //项成员
                    var item = lists[i],

                        //项成员属性集合
                        attrs = [
                            'style="height:'+o.lineHeight+'px;line-height:'+o.lineHeight+'px;"',
                            'class="tmenu-lists-item'+
                            (
                                (i==0?" first":"")+(i==l-1?" last":"")+(i%2?" even":" odd")
                            )+'"'
                        ];

                    //id属性
                    var itemID = item.itemID ? item.itemID : "tItemID_"+(panel.length++)+"_"+level+"_"+g+"_"+i;

                    attrs.push('id="'+itemID+'"');

                    //dd的class属性
                    var ddClass = [];

                    //是否有子菜单面板
                    if (item.groups && item.groups.length) {
                        ddClass.push("tmenu-has-child");
                    }

                    //是否禁止
                    if (item.disabled) {
                        ddClass.push("tmenu-item-disabled");
                    }

                    nodeHTML += '<dd data-level="'+level+'" '+(ddClass.length > 0?' class="'+ddClass.join(" ")+'"':'')+'>'+
                                    '<div '+attrs.join(" ")+'>'+(item.icon?'<span class="tmenu-item-icon"><img'+(item.iconStyle?' style="'+item.iconStyle+'"':'')+' src="'+item.icon+'" /></span>':"")+'<span class="tmenu-item-name">'+item.text+'</span></div>';
                                    {
                                        //记录该项的meta数据
                                        var meta = {};
                                        
                                        if (item.keyCode) {
                                            //将键值映射到ID上
                                            panel.meta["keyCode_"+item.keyCode] = {
                                                itemID      : itemID
                                            };

                                            keys.push(item.keyCode);
                                        }
                                        
                                        if (item.groups) {
                                            meta.action = function () {};
                                            $.extend(item, {width:(item.width||o.width),lineHeight:o.lineHeight});
                                            nodeHTML += (item.groups ? arguments.callee.call(tmenuSettings, item, level+1) : "");
                                        } else {
                                            meta.action = util.isFunction(item.action) ? (item.action) : function () {};
                                        }

                                        $.extend(meta, {
                                            disabled    : item.disabled || false,
                                            keyCode     : item.keyCode || null
                                        });

                                        panel.meta[itemID] = meta;

                                    }

                    nodeHTML += '</dd>';
                }

                nodeHTML += '</dl>';
            }

            return groups.length > 0 ? 
                        '<div data-level="'+level+'" data-keys="['+keys+']" class="tmenu-panels'+(level>1?' tmenu-panels-children':' tmenu-panels-top')+' tmenu-panels-level-'+level+'" style="width:'+(o.width)+'px;">'+nodeHTML+'</div>' :
                        nodeHTML;

        },
        /**
         * 该对象是否disabled
         * @param  {Object}  JQ 要判断的JQ对象
         * @return {Boolean}    返回布尔值
         */
        isDisabled: function (JQ) {
            return JQ.hasClass("tmenu-item-disabled");
        },
        /**
         * 设置菜单项是否可用
         * @param  {String}  itemID     一个或多个itemID，以空格隔开。可传入 * 以使全部菜单项失效
         * @param  {Boolean} disabled   是否可用
         */
        setItemEffect: function (itemIDs, disabled) {
            var tmenuSettings = $(this).data("tmenuSettings"),
                itemMeta = tmenuSettings.panel.meta;

            var action = disabled ? "addClass" : "removeClass";

            if (itemIDs && $.trim(itemIDs).length > 0) {
                var menuID = tmenuSettings.menuID;

                if (itemIDs == "*") {
                    for (var itemID in itemMeta) {
                        if (itemMeta.hasOwnProperty(itemID)) {
                            itemMeta[itemID].disabled = disabled;
                            $("#"+menuID+" #"+itemID).parent()[action]("tmenu-item-disabled");
                        }
                    }
                } else {
                    var items = itemIDs.split(/\s+/);
                    for (var i = items.length; i > 0; i--) {
                        var itemID = items[i-1];
                        if (itemMeta.hasOwnProperty(itemID)) {
                            var tItem = itemMeta[itemID];
                            tItem.disabled = disabled;
                            $("#"+menuID+" #"+itemID).parent()[action]("tmenu-item-disabled");
                        }
                    }
                }
            }
        }
    };

    //公用工具函数
    var util = {
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
         * @param  {Int} index   要移除的元素的下标
         * @return 返回被移除的元素
         */
        removeAt: function (index) {
            var len = this.length;
            if (index == 0) {
                return this.shift();            
            } else if (index == (len - 1)) {
                return this.pop();
            } else {
                var value = this[index];
                var newArr = [].concat(this.slice(0, index), this.slice((index + 1), len)),
                    newLen = newArr.length;
                for (var i = 0; i < newLen; i++) {
                    this[i] = newArr[i];
                }
                this.length = newLen;

                return value;
            }
        },
        /**
         * 移除数组中的元素
         * @param  {多类型} value 要移除的元素
         * @return {多类型}       返回被移除的元素
         */
        removeOf: function (value) {
            var index = util.inArray(value, this);
            if (index > -1) {
                return util.removeAt.call(this, index);
            }

            return false;
        },
        /**
         * 判断fn是否存在并且是一个函数
         * @param  {Function}  fn 函数名
         * @return {Boolean}       返回布尔值
         */
        isFunction: function (fn) {
            if (fn && typeof fn === "function") {
                return true;
            }

            return false;
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
                    fn.apply(window);
                }

                //如果函数的参数列表存在2个参数
                if (argsl == 2) {
                    if (this.typeOf(thisObj) == "array") {
                        fn.apply(window, thisObj);
                    } else {
                        fn.apply(thisObj);
                    }
                }

                //如果函数的参数列表存在3个参数
                if (argsl == 3) {
                    fn.apply(thisObj || window, args);
                }
            }
        },
        offsetWidth: function () {
            
        }
    };

    $.fn.tMenu = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method == "object" || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error("方法 "+method+" 为在 $.tMenu 中未定义！");
        }
    };

} (jQuery, window, undefined));