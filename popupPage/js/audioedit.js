//获取workSpace框架的window对象
var workSpace = top.frames["mainFrame"].window;

//获取请求参数
var params =  iHomed.query(window.location.href),
    USERID = params.userid,
    ACCESS = params.accesstoken,
    // APPID = params.appid,
    // MID = params.materialid,
    URL = params.audiourl;

//用于接收音频对象实例
var A = null;

//获取素材信息
// var M = tAppEdit("getMaterial", ACCESS, params.columnid, MID);

// //编辑模式下 
// if (M.readingmode == 1) {
//     //workSpace的数据接收器
//     var ca = params.datacontainer.split("_"),
//         //workSpace下的Caption.audioedit对象
//         audioEdit = workSpace[ca[0]][ca[1]];

//     //当页面刷新时
//     delete audioEdit.lineduration;
// }
var M = {
    audiourl: URL
}

var util = {
    /**
     * 数字加前导0
     * @param  {int}    num    要加前导0的数值
     * @param  {int}    digit  位数，默认为2
     * @return {string}        返回具有前导零的数字
     */
    addZero: function (num, digit) {
        digit = digit || 2;

        var n = ("" + num).split("");

        var zero = new Array(digit - n.length + 1).join("0");

        return zero + num;
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
    /**
     * 将毫秒数转换为(时:分:秒,毫秒)(00:00:00,000)
     * @param  {int} mSeconds 时间毫秒数
     * @param  {boolean} isFull 是否显示全
     * @return {string} 返回时分秒
     */
    m2t: function (ms, isFull) {
        isFull = isFull || false;

        var msec = this.addZero(ms % 1000, 3);

        ms = Math.floor(ms / 1000);

        var hours = this.addZero(Math.floor(ms / 3600)),
            min = this.addZero(Math.floor((ms % 3600) / 60)),
            sec = this.addZero(Math.floor((ms % 3600) % 60));

        if( isFull ){
            return hours + ":" + min + ":" + sec + "," + msec;
        }else{
            return hours + ":" + min + ":" + sec;
        }
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
    }
};

/**
 * 事件监听函数
 */
var Event = {
    /**
     * 对事件对象增加某些属性
     * @param  {Object} e 事件对象
     * @return {Object}   返回事件对象
     */
    "fixed": function (e) {
        e = e || window.event;

        var doc, body;

        doc = document.documentElement;
        body = document.body;

        e.pageX = e.clientX + (doc.scrollLeft || body.scrollLeft || 0) - (doc.clientLeft || body.clientLeft || 0);
        e.pageX = e.clientY + (doc.scrollTop || body.scrollTop || 0) - (doc.clientTop || body.clientTop || 0);

        e.layerX = e.offsetX;
        e.layerY = e.offsetY;

        e.stopPropagation = e.stopPropagation || function () {
            e.cancelBubble = true;
        };

        e.preventDefault = e.preventDefault || function () {
            e.returnValue = false;
        }

        return e;
    },
    /**
     * 给context添加事件监听
     * @param {Object}    context  需要添加事件监听的对象
     * @param {String}    type     事件类型，无on
     * @param {Function}  handler  事件函数
     */
    add: function (context, type, handler) {
        context = context || document;
        if (document.addEventListener) {
            context.addEventListener(type, handler, false);
        } else {
            context.attachEvent("on"+type, handler);
        }
    },
    /**
     * 给context移除事件监听
     * @param {Object}    context  需要移除事件监听的对象
     * @param {String}    type     事件类型，无on
     * @param {Function}  handler  事件函数
     */
    remove: function (context, type, handler) {
        context = context || document;
        if (document.removeEventListener) {
            context.removeEventListener(type, handler, false);
        } else {
            context.detachEvent("on"+type, handler);
        }
    },
    /**
     * 拖拽事件
     * @param  {Object}     context  需要注册拖拽事件监听的对象
     * @param  {Function}   handlers 事件函数集合，包括拖拽开始start、拖拽中move、拖拽结束end
     * @return 无返回值
     */
    ondrag: function (context, handlers) {
        //初始化数据组
        context.tdata = {};

        //拖拽开始
        this.add(context, "mousedown", function (e) {
            e = Event.fixed(e);

            var tdata = this.tdata;

            tdata.dragable = true;

            /**
             * 记录各种坐标值
             */
            //开始拖拽时，鼠标相对于页面的坐标
            tdata.startX = e.pageX;
            tdata.startY = e.pageY;

            //鼠标相对于目标元素左上角的坐标
            tdata.layerX = e.layerX + this.clientLeft;
            tdata.layerY = e.layerY + this.clientTop;

            //清空页面中的文本选中
            if (document.selection && document.selection.empty) {
                //IE
                document.selection.empty();
            } else if (window.getSelection) {
                //非IE
                window.getSelection().removeAllRanges();
            }

            //拖拽开始调用的回调函数
            util.runFunction(handlers.start, this, [e, tdata]);
            

            //注册document的事件
            Event.add(document, "mousemove", mousemove);
            Event.add(document, "mouseup", mouseup);

            e.preventDefault();
            e.stopPropagation();
            return false;

        });

        /**
         * 鼠标移动事件函数
         * @param  {Object} e 事件对象
         * @return 无返回值
         */
        function mousemove(e) {
            e = Event.fixed(e);

            var tdata = context.tdata,
                dragable = context.tdata.dragable || false;

            var doc, body;

            doc = document.documentElement;
            body = document.body;

            var win = {
                width   : doc.clientWidth || body.clientWidth,
                height  : doc.clientHeight || body.clientHeight
            };

            if (dragable) {

                tdata.moveX = e.pageX;
                tdata.moveY = e.pageY;

                //拖拽开始调用的回调函数
                util.runFunction(handlers.move, context, [e, tdata]);
            
            }

            e.preventDefault();
            e.stopPropagation();
            return false;

            //当鼠标超出窗口范围则停止拖拽
            /*if (e.pageX < -50 || e.pageX > (win.width + 50) || e.pageX < -50 || e.pageY > (win.height + 50)) {
                mouseup(e);
            }*/

        }

        /**
         * 鼠标抬起事件函数
         * @param  {Object} e 事件对象
         * @return 无返回值
         */
        function mouseup(e) {
            e = Event.fixed(e);

            var tdata = context.tdata;

            tdata.dragable = false;

            tdata.endX = e.pageX;
            tdata.endY = e.pageY;

            //拖拽结束后调用的回调函数
            util.runFunction(handlers.end, context, [e, tdata]);

            Event.remove(document, "mousemove", mousemove);
            Event.remove(document, "mouseup", mouseup);

            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
};

/**
 * 类：音频播放类
 * @param {Object} setting 初始化参数设置
 */
function Audio(setting) {
    this.setting = setting;

    //记录音频各类参数
    this.ui = {
        //当前音频的时长s
        duration    : 0,
        //当前音频播放到的时间点s
        currentTime : 0,
        //自定义的音频jQ对象
        element     : null
    };

    //记录音频对象
    this.setting.instance = $("#"+setting.audioID).get(0);

    //初始化音频控制对象
    this.init();
}


Audio.prototype = {
    /**
     * 初始化音频控制对象
     * @return 无返回值
     */
    init: function () {
        var _this = this,
            s = this.setting,
            ui = this.ui,
            instance = s.instance;

        var $audio = $(instance);

        //加载音频文件
        instance.src = s.src;

        //生成一个自定义的audio的HTML代码
        var html    =   '<div class="audio-wraper">'+
                            '<p class="time starttime">00:00:00</p>'+
                            '<div class="audio-track"><!-- 音轨 -->'+
                                '<div class="audio-bar"><p class="time currenttime">00:00:00</p><!-- 当前播放点 --></div>'+
                                '<div class="audio-field">&nbsp;</div>';

        if (s.limit) {  //是否需要限制音频播放的范围
                html   +=       '<div class="audio-limit audio-left-limit">'+
                                    '<p class="time">00:00:00,000</p>'+
                                '</div>'+
                                '<div class="audio-limit audio-right-limit">'+
                                    '<p class="time">00:00:00,000</p>'+
                                '</div>';
        }

            html   +=       '</div>'+
                            '<p class="time endtime">00:00:00</p>'+
                        '</div>';

        html = $(html);
        ui.element = html.get(0);

        //隐藏原生audio对象
        $audio.hide().after(html);

        //初始化音频控制器
        this.initControls();

        //绑定事件
        this.bindEvents();

    },
    /**
     * 初始化音频控制器
     * @return 无返回值
     */
    initControls: function () {
        var _this = this,
            s = this.setting,
            ui = this.ui,
            instance = s.instance;

        var $controls = $("<div />", {
            "class": "controls"
        });

        //添加音频控制器
        $(instance).before($controls);

        //播放暂停按钮
        $controls.iHomed("initTools", [{
            type: "button",
            toolID: "audio-play",
            text: "播放",
            map: {
                "audio-play": {
                    action: function () {
                        _this.play();

                        $("#audio-play").hide();
                        $("#audio-pause").show();
                    },
                    iconClass: {
                        normal: "playNormal",
                        hover: "playHover"
                    }
                }
            }
        }, {
            type: "button",
            toolID: "audio-pause",
            text: "暂停",
            map: {
                "audio-pause": {
                    action: function () {
                        _this.pause();

                        $("#audio-pause").hide();
                        $("#audio-play").show();
                    },
                    iconClass: {
                        normal: "pauseNormal",
                        hover: "pauseHover"
                    }
                }
            }
        }]);

        /**
         * 如果为编辑模式则开放以下按钮
         * 设置起点、执行校准、设置终点、试听截取
         */
        if (s.limit) {
            $controls.iHomed("initTools", [{
                type: "button",
                toolID: "audio-setStart",
                text: "设置起点",
                map: {
                    "audio-setStart": {
                        action: function () {

                            var time = util.t2m($(".currenttime").html());

                            _this.setstarttime(time / 1000);
                        },
                        iconClass: {
                            normal: "setStartNormal",
                            hover: "setStartHover",
                            disabled: "setStartDisabled"
                        }
                    }
                }
            }, {
                type: "button",
                toolID: "audio-setEnd",
                text: "设置终点",
                map: {
                    "audio-setEnd": {
                        action: function () {
                            var time = util.t2m($(".currenttime").html());
                            _this.setendtime(time / 1000);
                        },
                        iconClass: {
                            normal: "setEndNormal",
                            hover: "setEndHover",
                            disabled: "setEndDisabled"
                        }
                    }
                }
            }, {
                type: "button",
                toolID: "audio-listen",
                text: "试听截取",
                map: {
                    "audio-listen": {
                        action: function () {
                            _this.listen(true);
                        },
                        iconClass: {
                            normal: "listenNormal",
                            hover: "listenHover"
                        }
                    }
                }
            }, {
                type: "button",
                toolID: "audio-adjust",
                text: "执行校准",
                //disabled: true,
                map: {
                    "audio-adjust": {
                        action: function () {
                            //音频加载成功后调用onLoad
                            util.runFunction(s.onadjust, _this, [ui]);
                        },
                        iconClass: {
                            normal: "adjustNormal",
                            hover: "adjustHover",
                            disabled: "adjustDisabled"
                        }
                    }
                }
            }]);
        }

    },
    /**
     * 播放音频
     * @return 无返回值
     */
    play: function () {
        var _this = this,
            s = this.setting,
            ui = this.ui,
            instance = s.instance;

        var $audio = $(instance);

        instance.play();
    },
    /**
     * 暂停音频
     * @return 无返回值
     */
    pause: function () {
        var _this = this,
            s = this.setting,
            ui = this.ui,
            instance = s.instance;

        var $audio = $(instance);

        //关闭试听截取模式
        _this.listen(false);

        instance.pause();
    },
    /**
     * 定点播放
     * @param  {Float}    time     定点时间s
     * @param  {Boolean}  autoplay 是否自动播放
     * @return 无返回值
     */
    seek: function (time, autoplay) {
        var _this = this,
            s = this.setting,
            ui = this.ui,
            instance = s.instance;

        instance.currentTime = time;

        if (autoplay) {
            this.play();
        } else {
            this.pause();
        }
    },
    /**
     * 是否开启试听截取模式
     * @param  {Boolean} flag 开启true, 关闭false
     * @return {Boolean}      如果不传flag则表示获取试听模式的取值
     */
    listen: function (flag) {
        var _this = this,
            s = this.setting,
            ui = this.ui;

        if (flag === undefined) {
            return s.isListen || false;
        } else {
            s.isListen = flag;

            //flag为真时试听截取开始
            if (flag) {
                _this.seek(ui.starttime, true);
            }
        }
        
    },
    /**
     * 设置起点时间
     * @param  {Float}    time     定点时间s
     * @return 无返回值
     */
    setstarttime: function (time) {
        var _this = this,
            s = this.setting,
            ui = this.ui,
            instance = s.instance;

        //不允许起始点大于结束点
        //if (time > ui.endtime) { return false; }

        var $elem = $(ui.element),
            $track = $elem.find(".audio-track"),
            $field = $elem.find(".audio-field"),
            $lLimit = $elem.find(".audio-left-limit"),
            $rLimit = $elem.find(".audio-right-limit");


        var rPL = $rLimit.position().left;;

        //音轨的长度和位置信息
        var track = {
            width   : $(window).width() - 160,
            left    : 80
        };

        var left = time / ui.duration * track.width;

        ui.starttime = time;

        $lLimit.css("left", left)
            .find("p").html(util.m2t(Math.round(time * 1000)));

        $field.css({
            left    : left,
            width   : rPL - left
        });
    },
    /**
     * 设置结束点时间
     * @param  {Float}    time     定点时间s
     * @return 无返回值
     */
    setendtime: function (time) {
        var _this = this,
            s = this.setting,
            ui = this.ui,
            instance = s.instance;

        //不允许结束点小于于起始点
        //if (time < ui.starttime) { return false; }

        var $elem = $(ui.element),
            $track = $elem.find(".audio-track"),
            $field = $elem.find(".audio-field"),
            $lLimit = $elem.find(".audio-left-limit"),
            $rLimit = $elem.find(".audio-right-limit");


        var lPL = $lLimit.position().left;

        //音轨的长度和位置信息
        var track = {
            width   : $(window).width() - 160,
            left    : 80
        };

        time = Math.min(time, Math.ceil(ui.duration * 1000));

        var left = time / ui.duration * track.width;

        ui.endtime = time;

        $rLimit.css("left", left)
            .find("p").html(util.m2t(Math.round(time * 1000)));

        $field.css({
            width   : left - lPL
        });
    },
    /**
     * 通过当前音频时间点来判断音频工具的可用性
     * @param  {Float} time  当前时间点
     * @return 无返回值
     */
    toggleTool: function (time) {
        var ui = this.ui;

        //根据当前的时间点判断设置起点、设置终点的可用性
        if (time > ui.endtime) {
            iHomed("disableTool", "audio-setStart");
        } else {
            iHomed("enableTool", "audio-setStart");
        }

        if (time < ui.starttime) {
            iHomed("disableTool", "audio-setEnd");
        } else {
            iHomed("enableTool", "audio-setEnd");
        }
    },
    /**
     * 给音频对象绑定时间
     * @return 无返回值
     */
    bindEvents: function () {
        var _this = this,
            s = this.setting,
            ui = this.ui,
            instance = s.instance;

        var $elem = $(ui.element),
            $audio = $(instance),
            $track = $elem.find(".audio-track"),
            $field = $elem.find(".audio-field"),
            $bar = $elem.find(".audio-bar"),
            $curTime = $bar.find("p");

        //音轨的长度和位置信息
        var track = {
            width   : $(window).width() * 0.8 - 100,
            left    : 145
        };

        //拖拽进度条
        Event.ondrag($bar.get(0), {
            start: function (e, data) {
                var $this = $(this);

                //记录是否暂停
                $this.data("paused", instance.paused);

                if (!instance.paused) {
                    //暂停播放
                    _this.pause();
                }

                //关闭试听截取模式
                _this.listen(false);
            },
            move: function (e, data) {
                var $this = $(this);

                var left = e.pageX - track.left - 3;

                if (left < 0) {
                    left = 0;
                }

                if (left > track.width) {
                    left = track.width;
                }

                $this.css("left", left);

                var currentTime = instance.duration * (left / track.width);

                $curTime.html(util.m2t(Math.ceil(currentTime * 1000)));

                if (!s.limit) {
                    $field.css("width", left);
                }

            },
            end: function (e, data) {
                var $this = $(this);

                var left = e.pageX - track.left;

                var currentTime = instance.duration * (left / track.width);

                //seek开始
                _this.seek(currentTime, !$this.data("paused"));
            }
        });

        //点击seek
        $track.bind("mousedown", function (e) {
            //e = Event.fixed(e);

            var $target = $(e.target),
                $this = $(this);

            //if ($target.hasClass("audio-track") || $target.hasClass("audio-field")) {

                //关闭试听截取模式
                _this.listen(false);

                var left = e.offsetX;

                if ($target.hasClass("audio-field")) {
                    left = left + $target.position().left;
                }
                
                var currentTime = instance.duration * (left / track.width);

                _this.seek(currentTime);

                e.stopPropagation();
            //}
            
        });

        $(".audio-wraper").bind("click", function (e) {
            e = e || window.event;

            e.stopPropagation();
        });
        
        //初始化范围条
        if (s.limit) {

            var $lLimit = $(".audio-left-limit")
                $lLP = $lLimit.find("p"),
                $rLimit = $(".audio-right-limit"),
                $rLP = $rLimit.find("p");

            //左限制
            Event.ondrag($lLimit.get(0), {
                start: function (e, data) {
                    //关闭试听截取模式
                    _this.listen(false);
                },
                move: function (e, data) {
                    var $this = $(this);

                    var left = e.pageX - track.left + 3;

                    if (left < 0) {
                        left = 0;
                    }

                    var rPL = $rLimit.position().left;

                    if (left > rPL) {
                        left = rPL;
                    }

                    $this.css("left", left);

                    $field.css({
                        left    : left,
                        width   : rPL - left
                    });

                    var starttime = instance.duration * (left / track.width);

                    var m2t = util.m2t(Math.ceil(starttime * 1000));

                    $lLP.html(m2t);

                    ui.starttime = util.t2m(m2t) / 1000;
                },
                end: function (e, data) {
                    //判断设置起点、设置终点的可用性
                    _this.toggleTool(ui.currentTime);
                }
            });

            //右限制
            Event.ondrag($rLimit.get(0), {
                start: function (e, data) {
                    //关闭试听截取模式
                    _this.listen(false);
                },
                move: function (e, data) {
                    var $this = $(this);

                    var left = e.pageX - track.left + 3;

                    var lPL = $lLimit.position().left;

                    if (left < lPL) {
                        left = lPL;
                    }

                    if (left > track.width) {
                        left = track.width;
                    }

                    $this.css("left", left);

                    $field.css({
                        width   : left - lPL
                    });

                    var endtime = instance.duration * (left / track.width);

                    var m2t = util.m2t(Math.ceil(endtime * 1000));

                    $rLP.html(m2t);

                    ui.endtime = util.t2m(m2t) / 1000;
                },
                end: function (e, data) {
                    //判断设置起点、设置终点的可用性
                    _this.toggleTool(ui.currentTime);
                }
            });
        }

        //当加载媒介数据加载完时运行
        Event.add(instance, "loadeddata", function (e) {
            e = e || window.event;

            $audio.next(".audio-wraper").show();

            //记录当前音频播放的时间位置
            ui.currentTime = this.currentTime;

            //记录音频的时长
            ui.duration = this.duration;

            //总时长
            var endtime = util.m2t(Math.ceil(this.duration * 1000));

            //修改自定义播放器上的时长
            $elem.find(".endtime").html(endtime);

            //音频加载成功后调用onLoad
            util.runFunction(s.onload, _this, [$.extend({
                "event" : e
            }, ui)]);

            if (s.limit) {
                //ui.starttime = 0;
                //ui.endtime = this.duration;

                //$elem.find(".audio-right-limit p").html(endtime);

                _this.toggleTool(0);

            }

        });

        Event.add(instance, "error", function (e) {
            e = e || window.event;

            $( ".tools-wraper" ).hide( 0 );

            //音频加载失败后调用onLoad
            util.runFunction(s.onerror, _this, [$.extend({
                "event" : e
            }, ui)]);
        });

        //当播放位置改变时
        Event.add(instance, "timeupdate", function (e) {
            e = e || window.event;

            var currentTime = this.currentTime;

            //记录当前音频播放的时间位置
            ui.currentTime = currentTime;

            //修改自定义播放器上的当前播放的时间点
            $elem.find(".currenttime").html(util.m2t(Math.ceil(currentTime * 1000)));

            var percentage = (currentTime/this.duration * 100) + "%";

            //改变播放器当前时间点对象的位置
            $bar.css("left", percentage);

            if (!s.limit) { //非限制模式下
                $elem.find(".audio-field").css("width", percentage);
            } else { //限制模式下
                //判断设置起点、设置终点的可用性
                _this.toggleTool(currentTime);

                //试听截取模式下，播放点到达结束点时暂停播放
                if (_this.listen() && currentTime >= ui.endtime) { 
                    _this.seek(ui.endtime, false);
                }
            }

            //当播放位置改变时
            util.runFunction(s.ontimeupdate, _this, [$.extend({
                "event" : e
            }, ui)]);
        });

        //当播放开始时
        Event.add(instance, "play", function (e) {
            e = e || window.event;

            //记录当前音频播放的时间位置
            ui.currentTime = this.currentTime;

            //当播放位置改变时
            util.runFunction(s.onplay, _this, [$.extend({
                "event" : e
            }, ui)]);

        });

        //当播放暂停时
        Event.add(instance, "pause", function (e) {
            e = e || window.event;

            //记录当前音频播放的时间位置
            ui.currentTime = this.currentTime;

            //当播放位置改变时
            util.runFunction(s.onpause, _this, [$.extend({
                "event" : e
            }, ui)]);

        });

        //当播放结束时
        Event.add(instance, "ended", function (e) {
            e = e || window.event;

            //记录当前音频播放的时间位置
            ui.currentTime = this.currentTime;

            //this.currentTime = 0;

            //当播放位置改变时
            util.runFunction(s.onended, _this, [$.extend({
                "event" : e
            }, ui)]);

        });

    }
};

/**
 * 字幕公用函数
 */
var Caption = {
    /**
     * 初始化字幕
     * @return 无返回值
     */
    init: function () {
        var m = M,
            $caption = $(".caption-wraper");

        var text = m.text,
            duration = m.lineduration || [];

        var list = [];

        list.push('<table>');

        for (var i = 0, len = text.length; i < len; i++) {
            //时间点
            var ms = duration[i] || {};

            var st = util.m2t(ms.starttime || 0),
                et = util.m2t(ms.endtime || 0);

            var html    =   '<tr class="text-'+i+'" data-map="'+i+'">';

                //时间
                html   +=   '<td class="odd">'+
                                '<div data-key="starttime" class="starttime">'+st+'</div>'+
                                '<div data-key="endtime" class="endtime">'+et+'</div>'+
                            '</td>';

                //字幕
                html   +=   '<td class="even"><p>' + text[i] + '</p></td>';

                html   +=   '</tr>';

            list.push(html);
        }

        list.push("</table>");

        $caption.html(list.join(""));

        //初始化绑定事件
        this.bindEvents();
    },
    /**
     * 根据时间time来获取当前正在播放的字幕索引信息
     * @param  {Float}          time  当前播放时间点s
     * @return {Object|Boolean}       找到则返回字幕信息(Caption.info),
     *                                否则返回false
     */
    search: function (time) {
        var info = {},
            t = M.text,
            d = M.lineduration;

        //时间不存在
        if (!d) {
            return false;
        }

        //if (time > info.endtime || time < info.starttime) {
            for (var i = 0, len = d.length; i < len; i++) {
                var dt = d[i];
                if (time >= dt.starttime && time <= dt.endtime) {
                    info = {
                        index       : i,
                        starttime   : dt.starttime,
                        endtime     : dt.endtime,
                        text        : t[i]
                    };

                    return info;
                    break;
                }
            }
        //}
        
        return false;
    },
    /**
     * 根据时间time来激活当前正在播放的字幕
     * @param  {Float}  time 当前播放时间点s
     * @return {Object}      返回当前字幕的信息
     */
    read: function (time) {
        var info = this.search(time);

        var i = info.index;

        var $text = $(".caption-wraper .text-" + i);

        if (M.readingmode == 0) {
            $("tr.reading").removeClass("reading")

            $text.addClass("reading");
        } else {
            $text.trigger("click");
        }

        return info;
    },
    /**
     * 校正字幕时间信息
     * @param  {Object} duration 包含起始时间和结束时间的对象
     * @return 无返回值
     */
    adjust: function (duration) {
        var $tr = $("tr.active");

        var $time = $tr.find(".odd div");

        $time.each(function () {
            var $this = $(this),
                key = $this.data("key");

            var time = util.m2t(duration[key]).split(/[:,]/ig);

            $this.data("time", time);

            $this.find("input").each(function (i) {
                $(this).val(time[i]);
            });
        });

        this.save(false);

    },
    /**
     * 给音频编辑绑定各类事件
     * @return 无返回值
     */
    bindEvents: function () {
        var _this = this;

        //只有编辑状态下才存在以下事件操作
        if (params.type == M.readingmode && params.type == 1) {

            //字幕区
            $(".caption-wraper")
                .delegate("tr", {
                    click: function (e) {
                        e = e || window.event;

                        var $tr = $(this),
                            index = $tr.index(),
                            $time = $tr.find(".odd div");

                        //暂定音频播放
                        A.pause();

                        var duration = M.lineduration[index];

                        if (!$tr.hasClass("active")) {
                            _this.save();

                            //转换编辑状态
                            $time.each(function () {
                                var $this = $(this),
                                    time = $.trim($this.html());

                                time = time.split(/[:,]/ig);

                                $this.data("time", time);

                                var inputs =    '<input maxlength="2" class="hour" type="text" value="'+time[0]+'" />:'+
                                                '<input maxlength="2" class="min" type="text" value="'+time[1]+'" />:'+
                                                '<input maxlength="2" class="sec" type="text" value="'+time[2]+'" />,'+
                                                '<input maxlength="3" class="msec" type="text" value="'+time[3]+'" />';

                                $this.html(inputs);

                            });

                            $tr.addClass("active");

                            //设置限制范围
                            A.setstarttime(duration.starttime / 1000);
                            A.setendtime(duration.endtime / 1000);

                            //设置左右限制按钮的可用性
                            A.toggleTool(A.ui.currentTime);

                            //禁用确认按钮
                            //top.$("#mate-audio-layer #audio-ensure").addClass("disabled");

                            //启用校正按钮
                            //iHomed("enableTool", "audio-adjust");
                        }

                        e.stopPropagation();

                    }
                })
                .delegate(".odd div input", {
                    focus: function (e) {
                        var _this = this,
                            $this = $(this);

                        $this.val("");
                    },
                    blur: function () {
                        var $this = $(this),
                            $time = $this.parent(),
                            i = $this.index(),
                            v = $.trim($this.val());

                        var time = $time.data("time");

                        v = v || time[i];

                        if ($this.hasClass("msec")) {
                            v = util.addZero(v, 3);
                        } else {
                            v = util.addZero(v, 2);
                        }

                        $this.val(v);

                    },
                    keydown: function (e) {
                        e = e || window.event;

                        var $this = $(this),
                            v = $this.val();

                        var code = e.keyCode || e.which;

                        if (!(code >= 48 && code <= 57 || code >= 96 && code <=105 || code == 9 || code == 8 || code == 13)) {
                            return false;
                        }

                        //只允许输入数字
                        v = v.replace(/\D/ig, "0");

                        $this.val(v);

                        setTimeout(function () {
                            if (v.length == 2) {
                                $this.next("input").trigger("focus");
                            }
                        }, 0);
                        
                    },
                    change: function () {
                        var $this = $(this),
                            v = $this.val(),
                            i = $this.index(),
                            $time = $this.parent(),
                            key = $time.data("key"),
                            t = $time.data("time");

                        if ($this.hasClass("msec")) {
                            v = util.addZero(v, 3);
                        } else {
                            v = util.addZero(v, 2);
                        }

                        $this.val(v);
                        t[i] = v;

                        _this.save(false);

                        var time = t[0] + ":" + t[1] + ":" + t[2] + "," + t[3];

                        //A["set"+key](util.t2m(time) / 1000);

                    }
                });

        }
    },
    /**
     * 保存编辑的字幕信息
     * @param  {Boolean} remove 是否移除当前tr的active类
     * @return 无返回值
     */
    save: function (remove) {
        var $tr = $("tr.active"),
            index = $tr.index();

        remove = remove === undefined ? true : remove;

        if ($tr.size() > 0) {
            var d = M.lineduration[index],
                $time = $tr.find(".odd div");

            $time.each(function (i) {
                var $this = $(this),
                    t = $this.data("time"),
                    key = $this.data("key");

                var time = t[0] + ":" + t[1] + ":" + t[2] + "," + t[3];

                if (remove) {
                    $this.html(time);
                }

                d[key] = util.t2m(time);
            });
            
            var duration = Math.ceil(A.ui.duration * 1000);

            var flag = false;

            if (d.endtime > duration) {
                d.endtime = duration;
                flag = true;
            }

            if (d.starttime > d.endtime) {
                d.starttime = d.endtime;
                flag = true;
            }

            if (flag) {
                $time.each(function (i) {
                    var $this = $(this),
                        key = $this.data("key"),
                        t = util.m2t(d[key]).split(/[:,]/ig);

                    var time = t[0] + ":" + t[1] + ":" + t[2] + "," + t[3];

                    $this.data("time", t);

                    if (remove) {
                        $this.html(time);
                    } else {
                        $this.find("input").each(function (i) {
                            $(this).val(t[i]);
                        });
                    }
                    
                });
            }

            A.setstarttime(d.starttime / 1000);
            A.setendtime(d.endtime / 1000);

            //设置左右限制按钮的可用性
            A.toggleTool(A.ui.currentTime);

            if (remove) {
                $tr.removeClass("active");
            }
            
            //更新workSpace下Caption.audioedit的值
            audioEdit.lineduration = M.lineduration;

            //启用确认按钮
            //top.$("#mate-audio-layer #audio-ensure").removeClass("disabled");

            //启用校正按钮
            //iHomed("disableTool", "audio-adjust");
        }
    }
};

//初始化音频编辑
(function ($, window) {

    if( !M.audiourl ){
        $(".initAudio").addClass( "onerror" ).html( "音频文件不存在！" );
        return;
    }

    //实例化一个音频对象
    A = new Audio({
        audioID : "audioPlayer",
        src     : M.audiourl + "?_=" + (new Date().getTime()),
        // limit   : M.readingmode,
        onload  : function (ui) {
            var $elem = ui.element;

            //初始化字幕列表
            // Caption.init();
            // $("tr:eq(0)").trigger("click");

            //初始化完成以后隐藏initAudio
            $(".initAudio").hide();
        },
        onerror: function ( ui ) {
            //初始化失败提示
            $(".initAudio").addClass( "onerror" ).html( "音频文件获取失败或不存在！" );
        },
        // ontimeupdate: function (ui) {
        //     if (M.readingmode == 0) {
        //         var ci = Caption.read(Math.round(ui.currentTime * 1000));
        //     }
        // },
        onplay: function (ui) {
            $("#audio-pause").show();
            $("#audio-play").hide();
        },
        onpause: function (ui) {
            $("#audio-pause").hide();
            $("#audio-play").show();
        },
        onended: function (ui) {
            $("#audio-pause").hide();
            $("#audio-play").show();
        },
        // onadjust: function (ui) {
        //     Caption.adjust({
        //         starttime   : Math.round(ui.starttime * 1000),
        //         endtime     : Math.round(ui.endtime * 1000)
        //     });

        //     //this.toggleTool(ui.currentTime);
        // }
    });

} (jQuery, window));