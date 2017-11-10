var mainFrame = top.frames[ "mainFrame" ];

// 获取配置信息
var CONFIG = iHomed( "config" );

//获取请求参数
var params      = iHomed.query( window.location.href ),
    TOKEN       = iHomed.data( "token" ),
    NEWSID      = params.newsid;

var $initData = $( ".initData" );

var DEVICE = iHomed.data( "devicetype" ) || {};

/**
 * 编辑公用函数
 */
var NewsEditor = {
    /**
     * [initStaticData 初始化下拉菜单]
     * @return 无返回值
     */
    initStaticData: function () {
        var deviceOptions = "";

		$.each( DEVICE, function( key, value ){
			deviceOptions += "<option value='"+key+"'>"+value+"</option>";
		});

        $( "#copyrighttime select" ).append( deviceOptions );

        // 初始化属性面板上的事件
        this.bindEvents();
    },
    /**
     * 初始化剧集信息编辑器
     * @return 无返回值
     */
    init: function () {

        var self = this;

        // 提示初始化中
        $initData.removeClass( "onerror" ).html( "正在获取..." );

        // 获取剧集信息
        var option = {
            url: "get_news_info",
            type: "GET",
            data: {
                accesstoken : TOKEN,
                newsid      : NEWSID,
            },
            success: function ( data ) {

                if ( data.ret == 0 ) {
                    var info = data.info || {};

                    if( info.copyrighttime ){
                        info.copyrighttime = eval( '(' + info.copyrighttime + ')' );
                    }else if( info.copyrightdevice ){
                        var device = info.copyrightdevice.split( "|" ),
                            ctime = [];

                        for (var i = 0, len = device.length; i < len; ++i) {
                            ctime.push( { 
                                devicetype: device[i],
                                effectivetime: "",
                                expiretime: "",
                            } );
                        };

                        info.copyrighttime = ctime;
                    }else{
                        info.copyrighttime = [];
                    }

                    self.defaultData = info;

                    // 显示信息
                    self.loadData( info );

                } else {

                    option.error();

                }

            },
            error: function () {
                
                // 重新初始化
                $initData.addClass( "onerror" ).html( "获取信息失败，点击<a href='javascript:NewsEditor.init();'>重新获取</a>数据。" );

            }
        };

        // 请求剧集数据
        iHomed( "getData", option );
    },
    /**
     * 装载编辑器数据
     * @param  {Object} data 剧集信息
     * @return               无返回值
     */
    loadData: function ( data ) {

        var nowDate = new Date(),
            dateStr = iHomed.convertDate( nowDate.toLocaleDateString() );
		
        $initData.hide();

        if (NEWSID) {
            data = data || this.defaultData;

            // 版权时间
            var $copyrighttime = $( "#copyrighttime" ),
                copyrighttime = data.copyrighttime,
                $addbtn = $copyrighttime.find( ".multi-input-button.add" ),
                boxList = {};

            $copyrighttime
                .find( ".multi-input-box" ).not( ":eq(0)" ).remove()
                .end()
                .find( ".effectivetime" ).val( dateStr ).trigger( 'change' )
                .end()
                .find( ".devicetype select" ).val( 0 ).trigger( 'change' );

            for( var i = 0,clen = copyrighttime.length; i < clen; ++i ){
                var cTime = copyrighttime[i],
                    dtype = cTime.devicetype,
                    efTime = cTime.effectivetime || dateStr,
                    exTime = cTime.expiretime || "",
                    key = efTime + "-" + exTime;

                if ( cTime.devicetype == 0 ) $addbtn.hide();
                    
                if ( boxList[ key ] ) {
                    var $inputbox = boxList[ key ];
                } else {
                    if ( !$.isEmptyObject( boxList ) ) $addbtn.trigger( 'click' );

                    var $inputbox = $copyrighttime.find( ".multi-input-box" ).eq(-1);

                    boxList[ key ] = $inputbox;
                }

                $inputbox.find( ".devicetype select" ).val( dtype ).trigger( 'change' );
                $inputbox.find( ".effectivetime" ).val( iHomed.convertDate(efTime) ).trigger( 'change' );
                $inputbox.find( ".expiretime" ).val( iHomed.convertDate(exTime) ).trigger( 'change' );
            }

        }else{

            // 版权时间
            var $boxwrapper = $( ".multi-input-wrapper" ),
                $firstbox = $boxwrapper.find( '.multi-input-box:first-child' );

            $boxwrapper.find( '.multi-input-box' ).not( $firstbox ).remove();
            $firstbox
                .find( ".devicetype select" ).val( 0 ).trigger( "change" )
                .end()
                .find( ".effectivetime" ).val( dateStr ).trigger( "change" )
                .siblings( 'input' ).val( 0 ).trigger( "change" );
			
		}

        // 显示属性编辑面板
        $( "#attr-wraper" ).show();
    },
    /**
     * 检查必选项
     * @return {Boolean} 是否已填必选信息
     */
    checkRequire: function () {
        var self = this,
            flag = true;

        $( ".notice:visible" ).each( function () {
            var $this = $( this ),
                name = $this.siblings( 'label' ).not( '.edit-tag' ).text().replace( /[\ \ ]/g, "" ),
                $input = $this.siblings( 'input,textarea' ),
                $select = $this.siblings( 'select' ),
                $tags = $this.siblings( '.edit-tag' ).find( '.tag-contains' ),
                tags = $tags.data( "tags" ) || [];

            if ( $input.length > 0 && $input.val() === "" ) {// 文本输入框
                $.msg( "请输入" + name );
                flag = false;
            } else if ( $select.length > 0 && $select.val() === null || $select.val() === "" ) {// 下拉选择框
                $.msg( "请选择" + name );
                flag = false;
            } else if ( $tags.length > 0 && tags.length == 0 ) {// 标签输入框
                if ( $tags.siblings('ul').length > 0 ) {// 选择输入
                    $.msg( "请选择" + name );
                } else {// 文本输入
                    $.msg( "请输入" + name );
                }
                flag = false;
            }

            if ( !flag ) return false;
        } );

        return flag;
    },
    /**
     * 保存剧集信息
     * @return 无返回值
     */
    saveData: function (fn) {
        if ( !this.checkRequire() ) return;

        var self                = this,
            copyrighttime       = [],
            copyrightdevice     = [],
            params              = {
                accesstoken     : TOKEN,
                copyrighttime   : copyrighttime
            };

        $( "#copyrighttime .multi-input-box" ).each(function( i, el ) {
            var $el = $( el ),
                type = ($el.find( ".devicetype" ).data( "value" ) || "").split( "|" ),
                start = $el.find( ".effectivetime" ).val(),
                end = $el.find( ".expiretime" ).val();

            for ( var i = 0; i < type.length; ++i ){
                if ( type[i] == "" ) continue;
                copyrightdevice.push( type[i] );
                copyrighttime.push( {
                    devicetype: type[i],
                    effectivetime: start,
                    expiretime: end,
                } );
            }
        });

        params.copyrightdevice = copyrightdevice.join("|");
        // params.copyrighttime = JSON.stringify(params.copyrighttime);

        if ( !self.checkChange( params, self.defaultData ) ) {
            tLayer( "close" );
            return false;
        }

        params.newsid = NEWSID;

        // 保存属性数据设置
        var option = {
            url: "post_adjust_news",
            type: "POST",
            data: params,
            success: function ( data ) {

                if ( data.ret == 0 ) { // 设置成功
					
					//如果需要回调则将剧集信息参数传递给回调函数使用
					iHomed.runFunction(fn, [option.data]);

                } else {

                    option.error();

                }

            },
            error: function () {
                $.alert( "保存失败！" );
            }
        };

		// 开始保存
		iHomed( "setData", option );

    },
    /**
     * 检查参数是否有修改
     * @param  {object} data        要检查的参数对象
     * @param  {object} compareData 参照的参数对象
     * @return {boolean}             是或否
     */
    checkChange: function ( data, compareData ) {
        var self = this,
            r = false;

        $.each( data, function( key, val ) {
            var c = compareData[key],
                change = false;

            if( key == "accesstoken" ) return true;

            if ( typeof val == "object" && typeof c == "object" ) {
                change = !(JSON.stringify( val ) == JSON.stringify( c ));
            } else if ( val != c ) {
                change = true;
            }

            if ( change ) {
                r = true;
                console.log( key + ":" + (typeof val == "object" ? JSON.stringify( val ) : val) );
            } else {
                delete data[ key ];
            }
        });

        return r;
    },
    /**
     * 初始化事件绑定
     * @return 无返回值
     */
    bindEvents: function () {

        var self = this,
            nowDate = iHomed.convertDate( (new Date()).toLocaleDateString() );

        // 设置版权时间的最大值
        $( '.effectivetime' ).attr( "max", nowDate );
        $( '.expiretime' ).attr( "max", "9999-01-01" );

        $( "body" )
        .on({
            change: function() {
                var $this   = $(this),
                    $option = $this.find("option"),
                    $select = $option.filter(":selected"),
                    $parent = $this.parent(),
                    $input  = $parent.find("input"),
                    html    = [],
                    value   = [];

                if( $this.val() === "0" ){
                    $select.addClass( "active" ).addClass( 'change' ).siblings( 'option' ).removeClass( 'active' ).removeClass( 'change' );
                    $parent.data( "value", "0" );
                    $input.val("全部");
                }else if( $this.val() === "" ){
                    $option.removeClass( 'active' ).removeClass( 'change' );
                    $parent.data( "value", "" );
                    $input.val("");
                }else{
                    $option.removeClass( "change" );
                    $select.toggleClass( "active" ).addClass( "change" );

                    $option.filter( ".active" ).each(function(i, e) {
                        var $e = $(e);
                        if( $e.val() == 0 ){
                            $e.removeClass("active");
                            return true;
                        }
                        html.push( $e.html() );
                        value.push( $e.val() );
                    });
                    
                    $input.val( html.join("|") );
                    $parent.data( "value", value.join("|") );
                }
                
                $option.prop( "selected", false );
                // 模拟多选框被修改事件
                $input.trigger( "change" );
            }
        },".muti-select select")
        .on( "click", ".multi-input-wrapper .multi-input-button", function( e ) {
            var $this = $( this ),
                $wrapper = $this.closest( ".multi-input-wrapper" ),
                $boxes = $wrapper.find( ".multi-input-box" );

            if( $this.hasClass('add') ){
                var $box = $wrapper.find( ".multi-input-box" ).eq( 0 ),
                    $clone = $box.clone();

                $this.before( $clone );

                $clone
                    .find( ".devicetype select" ).val( "" ).trigger( 'change' )
                    .end()
                    .find( "> input" ).val( "" ).attr( {"max":"9999-01-01", "min":"1880-01-01"} )
                    .filter( ".effectivetime" ).val( iHomed.convertDate( (new Date()).toLocaleDateString() ) ).trigger( "change" );
            }else if( $this.hasClass('delete') ){
                var $box = $this.parent();

                $box.find( ".devicetype option.active" ).each( function() {
                    var $t = $( this );

                    $t.parent().val( $t.val() ).trigger( 'change' );
                } );

                if( $boxes.length > 1 ){
                    $box.remove();
                }
            }
        } )
        .on( "change", ".effectivetime", function( e ) {
            var $this = $( this ),
                $that = $this.siblings( ".expiretime" ),
                thisDate = $this.val() || "1880-01-01",
                thatDate = $that.val();

            if ( thisDate > nowDate ) {
                thisDate = nowDate;
                $this.val(iHomed.convertDate( thisDate ));
            }

            if( thatDate && thisDate > thatDate )$that.val( "" );

            $that.attr( "min", iHomed.convertDate( thisDate ) );
        } )
        .on( "change", ".expiretime", function( e ) {
            var $this = $( this ),
                $that = $this.siblings( ".effectivetime" ),
                thisDate = $this.val() || "9999-01-01",
                thatDate = $that.val();

            if( thatDate && thisDate < thatDate )$that.val( "" );

            $that.attr( "max", iHomed.convertDate( thisDate < nowDate ? thisDate : nowDate ) );
        } )
        .on( "change", ".devicetype select", function( e ) {
            var $this = $( this ),
                $change = $this.find( "option.change" ),
                value = $change.val(),
                isAdd = $change.hasClass( 'active' ),
                $siblings = $this.closest( '.multi-input-box' ).siblings(),
                $boxes = $siblings.filter( '.multi-input-box' ),
                $addbtn = $siblings.filter( '.add' ),
                $device = $( "#copyrightdevice select" );

            if( value === "0" ){
                // 移除其他列
                $boxes.remove();

                // 隐藏添加列按钮
                $addbtn.hide();

                // 更新版权适用字段的值
                $device.val( 0 ).trigger( 'change' );
            } else if( typeof value != "undefined" ) {
                var isDeviceChange = true;

                // 显示添加列按钮
                $addbtn.show();

                if( isAdd && $boxes.length > 0 ){
                    $boxes.each( function( ) {
                        var $box = $( this ),
                            $devicetype = $box.find( ".devicetype" ),
                            types = $devicetype.data( "value" ) || "";

                        if ( types.indexOf( value ) != -1 ) {
                            isDeviceChange = false;
                            $devicetype.find( 'select' ).val( value ).trigger( 'change' );
                        }
                    } );
                }

                $device.val( value ).trigger( 'change' );
            }
        } );

    },
};

/**
 * 立即执行函数
 */
( function () {
    // 初始化选项数据
    NewsEditor.initStaticData();

    if (NEWSID !== undefined) {
        // 编辑剧集需要初始化剧集属性
        NewsEditor.init();
    }

} () );