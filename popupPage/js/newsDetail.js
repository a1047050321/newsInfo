var topFrame = top,
    topDoc = topFrame.document;

var mainFrame = topFrame.frames[ "mainFrame" ];

//获取请求参数
var params      = iHomed.query( window.location.href ),
    TOKEN       = iHomed.data( "token" ),
    NEWSID      = params.newsid;

var $initData   = $( ".initData" ),
    $container  = $( ".container" ),
    $header     = $container.find( ".header" ),
    $content    = $container.find( ".content" ),
    $media      = $container.find( ".media" );

// 获取主窗口的分类标签对象
var Label = topFrame.Label;

// 音频播放的iframe
var _audioFrame = window.frames[ "audioPlayer" ];

var News = {
    init: function() {
        var self = this;

        $header.empty();
        $content.empty();

        // 提示初始化中
        $initData.removeClass( "onerror" ).html( "正在获取新闻详情..." );

        // 获取信息
        var option = {
            url: "get_news_info",
            type: "GET",
            data: {
                accesstoken : TOKEN,
                newsid      : NEWSID
            },
            success: function ( data ) {

                if ( data.ret == 0 ) {
                    var info        = data.info || {},
                        // content     = ( info.content || "" ).split( "\n" ),
                        imglist     = info.newsimglist || {},
                        keyword     = info.keywords || [],
                        label       = info.Label || info.column || [],
                        labels      = Label.list,
                        audiourl    = ( info.audio || {} ).audiourl || "",
                        header      = "",
                        note      = "";

                    $initData.hide();
                    $container.show();

                    // 时间
                    header += '<font>' + iHomed.timeFormat( info.releasetime ) + '</font>';

                    // 来源
                    header += '<font>' + info.source + '</font>';

                    // 标签
                    $.each( label, function(i, id) {
                         if( labels[ id ] && labels[ id ].name ){
                            header += '<font>' + labels[ id ].name + '</font>';
                         }
                    } );

                    // 关键词
                    $.each( keyword, function(i, key) {
                         if( key ){
                            header +=  '<font>' + key + '</font>';
                         }
                    } );

                    // 加载头部信息
                    $header.append( header );

                    // 加载新闻音频
                    if( audiourl ){
                        _audioFrame.location.href = "audioedit.html?audiourl=" + audiourl;
                    }else{
                        $media.hide();
                    }

                    // 加载新闻内容
                    // if( content )
                    // for( var i = 0; i < content.length; ++i ){
                    //     var p = $.trim( content[i] );

                    //     if(p)$content.append( '<p>' + p + '</p>' );
                    // }

                    var $textarea = $( '<textarea>' + info.content + '</textarea>' ).prop( "readonly", true );

                    $content.append( $textarea );

                    $textarea.css( "height", $textarea[0].scrollHeight );

                    // 原始id
                    if ( info.originalid ) {
                        note += '<div class="content-note">原始id：' + info.originalid + '</div>';
                    }

                    // 链接地址
                    if ( info.linkurl ) {
                        note += '<div class="content-note">链接地址：' + info.linkurl + '</div>';
                    }

                    // 加载注释行
                    $content.append( note );

                    // 加载新闻海报
                    if ( !$.isEmptyObject(imglist) ) {
                        var dir = imglist[ "dir" ] || "";

                        $.each( imglist, function(key, val) {
                            if ( key == "dir" ) return true;

                            var list = val.split( "|" );

                            for( var i = 0; i < list.length; ++i ){
                                var $img = $( '<div class="content-img"><img  title="' + list[i] + '" src="../images/default_img.png" /></div>' );

                                $content.append( $img );
                                iHomed.loadPoster( $img.find("img"), dir + list[i] );
                            }
                        } );
                    }

                } else {

                    option.error();

                }

            },
            error: function () {
                
                // 重新初始化
                $initData.addClass( "onerror" ).html( "获取新闻详情失败，点击<a href='javascript:News.init();'>重新获取</a>数据。" );

            }
        };

        // 请求剧集数据
        iHomed( "getData", option );
    }
};


/**
 * 立即执行函数
 */
( function () {

    News.init();

} () );