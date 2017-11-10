var topFrame = top || window,
    topDoc = topFrame.document,
    // 获取页面中 mainFrame 窗口
    _mainFrame = topFrame.frames[ "mainFrame" ],
    globalDnsConfigVar = topFrame.globalDnsConfigVar;

//用户id
var USERID = iHomed.data( "userid" ),
    //身份令牌
    TOKEN = iHomed.data( "token");

var contentProviderID = new ProviderObject( 1 );

// 设置日期插件的语言为中文
$.datetimepicker.setLocale('ch');

// 获取用户信息，并初始化系统菜单
iHomed( "userinfo", {
    data: {
        accesstoken: TOKEN,
        userid: USERID,
        systemid: CONFIG.systemid
    },
    success: function ( data ) {
        // 获取用户角色
        var role = iHomed.data( "role" );

        // 保存内容类型
        iHomed( "data", "contentType", contentType || {} );

        // 系统设置
        var systemParameter = {};

        iHomed.data( "systemParameter", systemParameter );

        iHomed( "getData", {
            url: "post_get_parameter",
            data: {
                accesstoken: TOKEN,
                systemid: CONFIG.systemid
            },
            success: function( data ) {
                var plist = data.parameterlist || [];

                for ( var i = 0, len = plist.length; i < len; ++i ) {
                    var p = plist[i];

                    systemParameter[ p.id ] = p.value;
                }
            }
        } );

        /**
         * 初始化系统导航菜单列表
         */
        $( "#header" ).iNav( {
            // 系统ID
            systemID: CONFIG.systemid,
            // 接口返回的用户信息
            userInfo: data,
            // 系统模块
            module:{
                /// 用户可操作的模块列表
                userlist: [
                    { name: "内容管理", url: "contentManager.html" },
                    { name: "操作记录", url: "operateLog/index.html?systemid=" + CONFIG.systemid + "&token=" + TOKEN },
                ],
                // 仅管理员可操作的模块列表
                adminlist: [
                    { name: "权限管理", url: "rightManage/access.html" },
                    { name: "系统设置", url: "systemSetting.html" },
                ],
                // 显示模块的iframe
                frame: _mainFrame,
                // 切换后的回调函数,可不设置
                callback: function( menu ) {
                    // 刷新权限列表
                    iHomed( "access", {
                        data: {
                            accesstoken: TOKEN,
                            systemid: CONFIG.systemid
                        }
                    } );
                },
            },
            // 首页底部标签ID
            footerID: "footer",
        } );

        

        /**
         * 搜索功能，分别调用各个页面的搜索方法，想法是将每个需要搜索功能的子页面的搜索方法
         * 保存到顶级窗口，然后在顶级窗口调用
         */
        $(".search_input").keydown(function (event) {
            if (event.which == 13) {
                $(".search .search_icon").trigger('click');
            }
        });
        
        $(".search .search_icon").click(function(){
            var keyword = $.trim( $(this).next(".search_input").val() );

            if (keyword == "") {
                $.msg("请输入搜索内容");
                return;
            }

            searchHandler(keyword);

            $(this).blur();
        });

    }
} );

/**
 * 分类标签对象
 */
var Label = {
    /**
     * 计时器id
     * @type {Number}
     */
    timeoutID: 0,
    /**
     * 分类id,多个用“|”间隔
     * @type {String}
     */
    label: "108",
    /**
     * 分类标签数组
     * @type {Object}
     */
    list: {},
    /**
     * 获取分类id的ajax请求状态，1表请求完成，0表示正在请求中, -1表示没有返回数据
     * @type {Number}
     */
    ajaxFlag: 0,
    /**
     * 获取分类列表
     * @return 无返回值
     */
    init: function(){
        var self = this;

        self.ajaxFlag = 0;

        clearTimeout( self.timeoutID );

        // 获取信息
        var option = {
            url: "get_label_list",
            type: "GET",
            data: {
                accesstoken : TOKEN,
                label       : self.label
            },
            success: function ( data ) {

                if ( data.ret == 0 ) {

                    var type = ( data.typelist || [] )[0] || {},
                        list = type.children || [];

                    // if( type.name == "资讯" || type.originalname == "资讯" ){
                        self.list = {};
                        for( var i = 0; i < list.length; ++i ){
                            var id = "" + list[i].id;
                            self.list[ id ] = self.getTempData( list[i] );
                        }
                        if( $.isEmptyObject(self.list) ){
                            self.ajaxFlag = -1;
                        }else{
                            self.ajaxFlag = 1;
                        }
                        console.log( self.list );
                    // }else{

                    // }

                } else {

                    option.error();

                }

            },
            error: function () {

                self.timeoutID = setTimeout( function(){
                    self.ajaxFlag = 1;
                    self.init();
                }, 5000 );

            }
        };

        // 请求剧集数据
        iHomed( "getData", option );
    },
    /**
     * 获取模板数据
     * @param  {object} data 原始对象
     * @return {object}      模板对象
     */
    getTempData: function( data ) {

        var tempData = {
            id          : data.id,
            name        : data.name,
            originalname: data.originalname
        }

        return tempData;

    },
    /**
     * 获取标签列表
     * @param  {Function} fn 回调函数
     * @return 无
     */
    getList:function( fn ) {
        var self = this;

        if( $.isEmptyObject( self.list ) && self.ajaxFlag == 0 ){
            clearTimeout( self.timeoutID );
            self.timeoutID = setTimeout( function(){
                self.getList( fn );
            }, 1000 );
        }else{
            iHomed.runFunction( fn, [self.list] );
        }

    }

};

/**
 * 获取提供商列表
 * @type {Object}
 */
var Provider = {
    /**
     * 计时器id
     * @type {Number}
     */
    timeoutID: 0,
    /**
     * 提供商列表
     * @type {Array}
     */
    list: {},
    /**
     * 获取提供商列表
     * @return 无返回值
     */
    init: function(){
        var self = this;

        var plist = contentProviderID.getListByType( 1104 );

        if ( $.isEmptyObject( plist ) ) {
            setTimeout( function( ) {
                self.init();
            }, 1000 );
        } else {
            $.extend( self.list, plist );
        }
    },
    /**
     * 获取提供商列表
     * @param  {Function} fn 回调函数
     * @return 无
     */
    getList:function( fn ) {
        return this.list;
    }
};

Provider.init();

// 当该 js 到这里时立即执行以下操作
( function ( window ) {

    // 设置系统 index.html 的 title 标签的内容
    $( "title" ).html( CONFIG.systemname );

    // 获取分类信息
    Label.init();

    // 当浏览器窗口发生 resize 事件时执行
    window.onresize = ( function () {

        // 计算初始窗口大小
        resize();

        function resize() {
            // 记录当前窗口的高度
            var height = $( window ).height();

            // 若窗口高度小于 500 时，页面高度固定为 500px
            if (height <= 600) {

                $("body").css({
                    "min-height": "600px"
                });
                
                height = 600;

            }

            // 设置内容窗口的高度
            $( "#content" ).css( "height", height - 106 +'px' );

            //设置系统列表的最大高度
            $( ".logo ul.syslist" ).css( "maxHeight", height-106+"px" );

        }

        return resize;

    } ) ();

} ( window ) );