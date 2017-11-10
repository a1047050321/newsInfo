;( function ( $, window, undefined ) {

    //把以下变量保存成局部变量
    var _top = top || window,
        document = window.document,
        navigator = window.navigator,
        location = window.location;

    // 记录剧集 seriesid 对应的最大集数 seriesidx
    var idxs = {};

    /**
     * 事件监听函数
     */
    var Event = {
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
        }
    };

    // 暴露给 window 的方法
    var methods = {
        /**
         * iTrans 上传
         * @param  {Object} settings iTrans 初始化参数设置
         * @return                   返回 this
         */
        init: function ( settings ) {

            // 记录当前时间毫秒数
            var nowTime = $.now(),
                iTransID = "itrans_" + nowTime;

            // 生成插件 DOM 对象
            handler.construct( iTransID );

            // 记录插件的 DOM 对象
            // var instance = $( "#" + iTransID )[0];
            var instance = document.getElementById( iTransID );
            settings.instance = instance;

            // 检测插件可用性和更新
            handler.check( settings );
            
            return this.each( function () {

                // 记录当前按钮的 jQ 对象
                var $this = $( this );

                /**
                 * settings 参数设置列表
                 *
                 * itransID     可选，生成 itrans 插件的 id 属性值
                 * attributes   可选，用于设置插件上传时的参数
                 */
                settings = $.extend( {

                    // 可选，生成 itrans 插件的 id 属性值
                    itransID        : iTransID,
                    // 可选，用于设置插件上传时的参数
                    properties       : {},
                    // 可选，上传队列的接收容器
                    queueID         : "itrans_queue_" + nowTime,
                    // 可选，队列一条记录的模板
                    itemTemplate    : false,
                    // 是否自动上传
                    auto            : true,
                    // 可选，是否支持多选，默认是多选
                    multi           : true,
                    // 可选，上传取消失败后是否移除上传项
                    removeCancelled : true,
                    // 可选，上传完成（无论成功与否）后是否移除上传项
                    removeCompleted : true,
                    // 可选，移除上传项的动画时间，单位 s
                    removeTimeout   : 3,
                    // 可选，检查插件是否已安装或有升级版
                    check           : false,
                    // 可选，插件是否存在未上传的视频，reloadVideo中会传递一个 callback 的回调（参数为：videoid）
                    reloadVideo     : false,
                    // 可选，插件初始化完成后的回调
                    onInit          : false,
                    // 可选，任务 id 创建开始的回调
                    onCreateStart   : false,
                    // 可选，任务 id 创建成功的回调
                    onCreateSuccess : false,
                    // 可选，任务 id 创建失败的回调
                    onCreateError   : false,
                    // 可选，任务 id 创建完成的回调，无论成功或失败
                    onCreateComplete: false,
                    // 可选，选择文件对话框打开时的回调
                    onDialogOpen    : false,
                    // 可选，选择文件对话框关闭时的回调
                    onDialogClose   : false,
                    // 可选，用于选择文件中时的回调函数，一个文件回调一次
                    "onSelect"       : false,
                    // 可选，当取消上传文件时的回调函数
                    onCancel        : false,
                    // 可选，转码过程中的回调
                    onTransProgress : false,
                    // 可选，转码成功后的回调
                    onTransSuccess  : false,
                    // 可选，转码失败的回调
                    onTransError    : false,
                    // 可选，上传开始的回调
                    onUploadStart   : false,
                    // 可选，上传过程中的回调
                    onUploadProgress: false,
                    // 可选，上传成功后的回调
                    onUploadSuccess : false,
                    // 可选，上传失败后的回调
                    onUploadError   : false,
                    // 可选，上传完成后的回调，无论成功或失败
                    onUploadComplete: false,
                    // 可选，当上传队列全部完成以后的回调
                    onQueueComplete : false,
                    // 可选，当文件加入队列以后的回调
                    onQueue         : false

                }, settings || {} );
                
                // 选择句柄
                instance.selectHandler = null;

                // 上传句柄
                instance.uploadHandler = null;

                // 记录按钮 id，并重新设置 id 属性
                settings.buttonID = $this.attr( "id" ) || ( "itrans_button_" + nowTime );
                $this.attr( "id", settings.buttonID );

                // 保存 settings 到 $this 上
                $this.data( "iTransSettings", settings );

                // 生成队列容器
                var $queue = $( "#" + settings.queueID );
                
                if ( $queue.size() == 0 ) { // 容器不存在，则自动生成一个

                    $queue = $( "<div />", {
                        "id"      : settings.queueID,
                        "class"   : "itrans-queue"
                    } );

                    $this.before( $queue );
                    settings.queue = $queue;

                }

                //初始化队列信息
                settings.queueData = handler.getDefaultQueueData();

                // 绑定插件回调事件
                handler.bindEvents( settings );

                // 初始化完成时回调
                util.runFunction( settings.onInit, settings, [ settings.itransID ] );

                // 是否重新上传未上传完成的视频
                if ( settings.reloadVideo ) {

                    util.runFunction( settings.reloadVideo, [ function ( videoid, seriesid ) {

                        var file = instance.fileRead( "" + videoid );

                        var files = []; // 文件集合

                        if ( file != -1 ) {

                            files.push( $.parseJSON( file ) );
                            
                            var p = files[0].properties,
                                prop = idxs[ p.seriesid ] || {};

                            // 获取最大剧集数
                            var seriesidx = Math.max( prop.seriesidx || 0, p.seriesidx );

                            // 当前剧集的信息
                            prop = $.extend( true, {}, p, prop );
                            prop.seriesidx = seriesidx;
                            prop.seriesid = prop.seriesid || seriesid;

                            if ( p.seriesid ) {
                                idxs[ p.seriesid ] = prop;
                            }

                            // 选择句柄
                            instance.selectHandler = 0;

                            // 重新进入上传队列中，-2重新上传
                            handler.setFileStatus( files[0], -2 );

                            // 执行文件选择操作
                            util.runFunction( uploader.select, settings, [ 0, files ] );

                        }

                        return files.length;

                    } ] );

                }

                // 绑定点击事件
                $this.bind({
                    "click.itrans": function ( e ) {
                        e = e || window.event;

                        util.runFunction( settings.onDialogOpen, settings );

                        if ( !util.typeOf( instance.selectVideoMultiFile ) === "object"
                              || !util.typeOf( instance.selectVideoSigFile ) === "object" ) {

                            alert( "插件 itrans 发生错误，请联系管理员！" );
                            return false;

                        }

                        // 检测插件可用性和更新
                        handler.check( settings );

                        //如果没有安装则不能上传
                        if (!settings.instance.valid) return;

                        if ( settings.multi ) { // 多选

                            instance.selectHandler = instance.selectVideoMultiFile( "选择文件" );

                        } else { // 单选

                            instance.selectHandler = instance.selectVideoSigFile( "选择文件" );

                        }
                    }
                });

            } );

        },
        /**
         * 开始上传
         * @param  {string} fileID 指定要上传的文件的id，若要指定多个fileID可传入多个fileID
         *                         如果使整个队列开始上传可使用"*"
         * @return 无返回值
         */
        upload: function ( fileID ) {
            var args = arguments;

            return this.each( function () {

                var $this = $(this),
                    settings = $this.data( "iTransSettings" ),
                    queueData = settings.queueData;

                // 没有文件可上传
                if ( queueData.filesLength <= 0 ) { return false; }

                var $queue = settings.queue;

                // 正在上传中，不允许再一次执行上传操作，但允许重新设置队列
                if ( queueData.uploadQueue.length > 0 ) { 

                    // 重新装载需要上传的file
                    util.runFunction( handler.loadUploadQueue, settings, args );

                } else {

                    // 装载需要上传的file
                    util.runFunction( handler.loadUploadQueue, settings, args );

                    // 开始上传
                    util.runFunction( uploader.startUpload, settings, [ queueData.uploadQueue[0] ] );

                }

            } );
        },
        /**
         * 取消上传
         * @param  {string} fileID        1. 指定要终止上传的文件的id，回调onCancel。
         *                                2. 当传入"*"号时，终止整个队列的上传操作，回调onQueueClear
         * @param  {string} suppressEvent 
         * @return 无返回值
         */
        cancel: function ( fileID ) {

            var args = arguments;

            return this.each(function () {

                var $this = $( this ),
                    settings = $this.data( "iTransSettings" ),
                    queueData = settings.queueData;

                var $queue = settings.queue;
                var arg0 = args[0];

                if ( arg0 ) {

                    if ( arg0 == "*" ) {

                        var files = queueData.files,
                            queueItemCount = queueData.filesLength;

                        // 清空等待上传队列
                        queueData.uploadQueue = [];

                        for ( var i in files ) {

                            if ( files.hasOwnProperty( i ) ) {

                                uploader.cancelUpload.call( settings, i, function () {

                                    $queue.find( "#" + i + " .cancel" ).remove();

                                    if ( settings.removeCancelled ) {

                                        $queue.find( "#" + i ).fadeOut( settings.removeTimeout * 1000, function () {
                                            $( this ).remove();
                                        } );

                                    }

                                });

                            }
                        }

                        uploader.clearQueue.call( settings, function () {

                            util.runFunction( settings.onClearQueue, settings, [ queueItemCount ] );

                        } );

                    } else {

                        uploader.cancelUpload.call( settings, arg0, function () {

                            $queue.find( "#" + arg0 + " .cancel" ).remove();  

                            if ( settings.removeCancelled ) {

                                $queue.find( "#" + arg0 ).fadeOut( settings.removeTimeout * 1000, function () {
                                    $( this ).remove();
                                } );

                            }

                        });

                    }
                } else {

                    var $firtsItem = $queue.children().eq(0);

                    //取消队列中第一个上传项时，必须保证该项存在
                    if ( $firtsItem > 0 ) { return false; }

                    //获取该项的fileID
                    var fileID = $firtsItem.attr( "id" );

                    uploader.cancelUpload.call( settings, fileID, function () {

                        $firtsItem.find( ".cancel" ).remove();

                        if ( settings.removeCancelled ) {

                            $firtsItem.fadeOut( settings.removeTimeout * 1000, function () {
                                $( this ).remove();
                            } );

                        }

                    });
                }
            });

        },
        /**
         * 获取或者设置settings[name]的值
         * @param  {String}         name  [description]
         * @param  {String|Object}  value [description]
         * @return 当value不存在时返回settings[name]的值
         */
        settings: function (name, value) {
            var args = arguments;
            var ret = null;
            this.each(function () {

                var $this = $( this ),
                    settings = $this.data( "iTransSettings" );

                if (args.length === 1) {
                    ret = settings[name];
                    return false;
                } else {

                    $button = $( "#" + settings.buttonID );

                    switch (name) {
                        case "auto" :
                            value = inArray(value, [true, false]) > -1
                                                ? value : true;
                            break;
                        case "multi" :
                            value = inArray(value, [true, false]) > -1
                                        ? value : false;
                            break;
                        case "buttonText" :
                            $button.find("span").html(value);
                            break;
                        case "buttonClass" :
                            $button
                                .removeClass(settings.buttonClass)
                                .addClass(value);
                            break;
                        case "buttonCursor" :
                            $button.css("cursor", value);
                            break;
                        case "removeCancelled" :
                            value = inArray(value, [true, false]) > -1
                                        ? value : true;
                            break;
                        case "removeCompleted" :
                            value = inArray(value, [true, false]) > -1
                                        ? value : true;
                            break;
                    }
                    settings[name] = value;
                }

            });

            return ret;
        }
    };

    /**
     * 上传功能函数
     */
    var uploader = {
        /**
         * 执行选择文件操作
         * @param  {Int}   h     任务句柄
         * @param  {Array} files 文件集合
         * @return               无返回值
         */
        select: function ( h, files ) {

            var settings = this,
                queueData = settings.queueData,
                instance = settings.instance;

            var l = files.length;

            // 当选择文件对话框关闭后执行调用
            util.runFunction( settings.onDialogClose, settings, [ l ] );

            if ( l > 0 ) { // 选择了文件

                // 是否要设置 idxs
                var isSetProp = files[0].properties;

                if ( !isSetProp ) {

                    var p = settings.properties,
                        prop = idxs[ p.seriesid ] || $.extend( true, {}, p );

                    //prop.seriesidx = Math.max( p.seriesidx, prop.seriesidx );

                    if ( p.seriesid ) {
                        // 当前剧集的信息
                        idxs[ p.seriesid ] = prop;
                    }

                }

                if ( !settings.itemTemplate ) { // 一条文件记录的模板

                    settings.itemTemplate = '<div id="${fileID}" class="itrans-queue-item">\
                        <div class="cancel">\
                            <a title="取消" href="javascript:$(\'#${instanceID}\').iTrans(\'cancel\', \'${fileID}\')">X</a>\
                        </div>\
                        <div class="information">\
                            <span title="${fileFullName}" class="fileName">${fileName} (${fileSize})</span><span class="data"></span>\
                            <div class="itrans-progress">\
                                <div class="itrans-progress-bar"><!--Progress Bar--></div>\
                            </div>\
                        </div>\
                    </div>';

                }

                var itemTemplate = settings.itemTemplate;

                // 增加选择文件的次数记录
                queueData.filesSelected++;

                var i = 0,
                    duration = 50;

                // 使用 setTimeout 开始遍历文件列表
                setTimeout( each, duration );

                /**
                 * 遍历文件列表的方法
                 * @return 无返回值
                 */
                function each() {

                    // 文件信息
                    var file = files[i];
                    
                    //增加settings.id是为了防止队列追加在同一个DOM队列中时发生了冲突
                    var fileID = "iTrans_" + settings.buttonID + "_" + queueData.filesSelected + "_" + ( ++queueData.filesLength );

                    // 获取File文件的名称（name），类型（type），大小（size），时间长度（time）
                    var fileInfos = util.getFileInfos( file );

                    // 保存文件信息
                    queueData.files[ fileID ] = file;

                    // 计算队列字节大小
                    queueData.queueSize += parseInt( file.size, 10 );

                    if ( !isSetProp ) {

                        // 计算当前视频在剧集中的第几集
                        if ( p.seriesid ) {

                            // 剧集追加
                            prop.seriesidx++
                        } else {

                            // 上传电影
                            prop.seriesidx = 1;
                        }
                        // 计算当前视频在剧集中的第几集
                        //prop.seriesidx++;

                    }

                    // 重新计算文件的信息       
                    file = $.extend( file, {
                        // 文件的序号
                        index: queueData.filesLength,
                        // fileID
                        id      : fileID,
                        // 文件名
                        name    : fileInfos.name,
                        // 带单位的文件大小
                        size    : fileInfos.size,
                        // 文件字节大小
                        sizeByte: parseInt( file.size, 10 ),
                        // 文件的时间（时:分:秒）
                        time    : fileInfos.time,
                        // 设置文件的上传状态：-1 -- 初始化完成，正在等待上传
                        filestatus  : file.filestatus || -1,

                        // 记录下数据文件本身的参数数据
                        properties  : isSetProp ? file.properties : $.extend( true, {}, prop )
                    } );

                    // 模板数据
                    var itemData = {
                        fileIndex   : file.index,
                        fileID      : fileID,
                        instanceID  : settings.buttonID,
                        fileFullName: file.name,
                        fileName    : file.name.length > 20 ? (file.name.substring(0, 20) + "...") : file.name,
                        fileSize    : file.size,
                        fileType    : file.format,
                        fileTime    : file.time
                    };

                    // 追加记录到队列中
                    settings.queue.append( handler.packTemplate( itemData, itemTemplate ) );

                    // 判断文件是否允许上传，不允许则设置文件状态为-3不允许上传
                    if ( file.video_enable == "0" ) {

                        handler.setFileStatus( file, -3 );
                        console.log( file );
                    }

                    // 输出单个文件：file(单个文件信息)，h(文件句柄)
                    util.runFunction( settings.onSelect, settings, [ file, h ] );

                    i++;

                    if ( i >= l ) { // 完成遍历

                        // 自动开始上传
                        if ( settings.auto ) {

                            util.runFunction( methods.upload, $( "#" + settings.buttonID ), [ "*" ] );
                            each = null;
                        }

                    } else {

                        // 继续遍历
                        setTimeout( each, duration );

                    }
                    

                }

            }

        },
        /**
         * 文件上传成功
         * @param  {String} fileID  文件 fileID
         * @param  {Ojbect} data    上传数据
         * @return                  无返回值
         */
        onUploadSuccess: function ( fileID, data ) {

            var settings = this,
                queueData = settings.queueData,
                instance = settings.instance,
                file = queueData.files[ fileID ];

            // 上传完之后直接进入转码，设置文件转码中状态 - 4
            handler.setFileStatus( file, 4 );

        },
        /**
         * 文件上传失败
         * @param  {String} fileID  文件 fileID
         * @param  {Ojbect} data    上传数据
         * @return                  无返回值
         */
        onUploadError: function ( fileID, data ) {

            var settings = this,
                queueData = settings.queueData,
                instance = settings.instance,
                file = queueData.files[ fileID ];

            // 设置文件上传失败状态
            handler.setFileStatus( file, 0 );

            // 增加上传失败的个数
            queueData.uploadsErrored++;

            // 执行上传成功的回调
            util.runFunction( settings.onUploadError, settings, [ file, data ] );

            // 执行上传完成的操作
            util.runFunction( uploader.onComplete, settings, [ file ] );
        },
        /**
         * 文件转码成功
         * @param  {String} fileID  文件 fileID
         * @param  {Ojbect} data    上传数据
         * @return                  无返回值
         */
        onTransSuccess: function ( fileID, data ) {

            var settings = this,
                queueData = settings.queueData,
                instance = settings.instance,
                file = queueData.files[ fileID ];

            // 设置文件上传转码成功状态 - 1
            handler.setFileStatus( file, 1 );

            // 计算当前已上传的字节数
            queueData.queueBytesUploaded += file.sizeByte;

            // 增加上传成功的个数
            queueData.uploadsSuccessful++;

            // 执行上传成功的回调
            util.runFunction( settings.onTransSuccess, settings, [ file, data ] );

            // 执行上传成功的回调，转码完成后才意味着上传成功
            util.runFunction( settings.onUploadSuccess, settings, [ file, data ] );

            // 执行上传完成的操作
            util.runFunction( uploader.onComplete, settings, [ file ] );

        },
        /**
         * 文件转码失败
         * @param  {String} fileID  文件 fileID
         * @param  {Ojbect} data    上传数据
         * @return                  无返回值
         */
        onTransError: function ( fileID, data ) {

            var settings = this,
                queueData = settings.queueData,
                instance = settings.instance,
                file = queueData.files[ fileID ];

            // 设置文件上传失败状态 - 0
            handler.setFileStatus( file, 0 );

            // 增加上传失败的个数
            queueData.uploadsErrored++;

            // 执行上传成功的回调
            util.runFunction( settings.onTransError, settings, [ file, data ] );

            // 执行上传成功的回调
            util.runFunction( settings.onUploadError, settings, [ file, data ] );

            // 执行上传完成的操作
            util.runFunction( uploader.onComplete, settings, [ file ] );
        },
        /**
         * 文件上传完成，无论成功失败
         * @param  {Object} file  文件对象
         * @return                无返回值
         */
        onComplete: function ( file ) {

            var settings = this,
                queueData = settings.queueData,
                instance = settings.instance;

            // 执行上传完成回调
            util.runFunction( settings.onUploadComplete, settings, [ file ] );

            var uq = queueData.uploadQueue;

            //检查fileID是否存在于uploadQueue中
            var i = util.inArray( file.id, uq );

            if ( i > -1 ) {
                
                queueData.uploadQueue = [].concat( uq.slice( 0, i ), uq.slice( (i + 1), uq.length ) );
            
            }

            // 重新开始下一个文件的上传
            if ( queueData.uploadQueue.length > 0 ) {
                util.runFunction( uploader.startUpload, settings, [ queueData.uploadQueue[0] ] );
            }

            // 当整个队列上传完执行 onQueueComplete，无论成功与否
            if ( queueData.filesLength  
                == (queueData.uploadsSuccessful + queueData.uploadsErrored + queueData.uploadsCancelled) ) {

                util.runFunction( settings.onQueueComplete, settings, [{
                    "uploadsSuccessful"     : queueData.uploadsSuccessful,
                    "uploadsErrored"        : queueData.uploadsErrored,
                    "uploadsCancelled"      : queueData.uploadsCancelled
                }] );

                if ( settings.removeCompleted ) {

                    //队列全部完成后，还原队列信息
                    util.runFunction( uploader.clearQueue, settings );

                } else {

                    //在不清空队列的时应将一下值还原
                    $.extend( queueData, {
                        filesLength         : 0,    //队列的长度
                        averageSpeed        : 0,    //上传的平均速度
                        queueBytesUploaded  : 0,    //当前整个队列中已上传的字节数
                        queueSize           : 0,    //整个队列的字节数
                        uploadSize          : 0,    //当前等待上传队列的字节数
                        uploadQueue         : [],   //当前正在等待上传的文件id的集合
                        uploadsSuccessful   : 0,    //上传成功的文件数
                        uploadsErrored      : 0,    //上传失败的文件数
                        uploadsCancelled    : 0     //上传被取消的文件数
                    } );

                }
                
            }

        },
        /**
         * 开始上传
         * @param  {string} fileID 文件id
         * @return 无返回
         */
        startUpload: function ( fileID ) {

            var settings = this,
                queueData = settings.queueData,
                instance = settings.instance;

            var file = queueData.files[fileID];

            if ( !file ) { return false; }

            var properties = file.properties;

            // 执行开始创建任务 id 的回调
            util.runFunction( settings.onCreateStart, this, [ file ] );

            var data = {
                "accesstoken"   : (iHomed && iHomed.data( "token" )) || settings.properties.accesstoken,
                "vhash"         : file.content_hash,
                "seriesid"      : properties.seriesid,
                "seriesidx"     : properties.seriesidx,
                "videoname"     : file.name,
            };

            /**
             * 参数请求设置
             */
            var option = {
                url: ( iHomed && iHomed( "api", "post_create_video" ) ) || "http://dtv.homed.me/media/transmission/create_video",
                type: "POST",
                data: JSON.stringify( data ),
                success: function ( data ) {

                    if ( data.ret == 0 ) {
                        // 获取创建后的 videoid
                        var videoid = "" + data.video_id;

                        // 记录 videoid
                        file.videoid = videoid;

                        if ( handler.getFileStatus( file ) == -1 ) {

                            // 写文件到 itrans 插件目录，记录下文件信息内容
                            instance.fileWrite( videoid, JSON.stringify( file ) );

                        }

                        // 创建成功
                        util.runFunction( settings.onCreateSuccess, settings, [ file, data ] );
                        
                        // 执行开始上传回调
                        util.runFunction( settings.onUploadStart, settings, [ file ] );
                        
                        //添加额外的上传数据
                        for ( var i in properties ) {

                            if ( properties.hasOwnProperty( i ) ) {

                                // 设置插件变量
                                instance.setProperty( i, ("" + properties[ i ]) );

                            }

                        }

                        /**
                         * 执行插件上传，参数列表如下：
                         * 1. 本地文件存放路径
                         * 2. 服务器上存放的路径
                         * 3. 不详
                         * 4. 不详
                         * 5. 不详
                         * 6. 是否转码，1转码 0不转码
                         * 7. videoid
                         */
                        instance.uploadHandler = instance.uploadMovie( file.url, ("/" + file.name + "." + file.format), "1", "1", "0", "1", videoid );

                        // 设置 file 的 filestatus 为正在上传
                        handler.setFileStatus( file, 2 );

                        // 记录当前正在上传的 fileID
                        queueData.uploadFileID = file.id;

                    } else {

                        // 创建失败
                        option.error();
                        //util.runFunction( settings.onCreateError, settings, [ file ] );

                    }
                    
                },
                error: function () {

                    // 创建失败
                    util.runFunction( settings.onCreateError, settings, [ file ] );

                },
                complete: function () {

                    // 创建完成
                    util.runFunction( settings.onCreateComplete, settings, [ file ] );

                }
            };

            /**
             * 如果为重新上传的视频则不需要重新创建 videoid
             * 否则需要请求创建 videoid
             */
            if ( handler.getFileStatus( file ) == -2 ) {

                util.runFunction( option.success, [ {
                    "ret"       : 0,
                    "video_id"  : file.videoid
                } ] );

            } else {
                // 创建任务
                $.ajax( option );
            }

            
            
        },
        /**
         * 取消上传
         * @param  {string}    fileID     文件的id
         * @param  {Function}  callback   取消成功之后的回调函数
         * @return 无返回
         */
        cancelUpload: function ( fileID, callback ) {

            var settings = this,
                instance = settings.instance,
                queueData = this.queueData,
                file = queueData.files[ fileID ],
                $queue = settings.queue;

            if ( file === undefined ) { return false; }

            //当且仅当文件状态处于等待上传(-1)和正在上传时才执行以下操作
            if ( util.inArray( handler.getFileStatus( file ), [ -3, -2, -1, 2 ] ) > -1 ) {

                //设置fileID对应的文件的filestatus为取消上传状态3
                $queue.find( "#" + fileID + " .data" ).html( " - Cancelled" );
                $queue.find( "#" + fileID + " .uploadfive-progress-bar" ).css( "width", "1px" );

                // 取消任务上传，成功返回 0，不成功返回小于 0
                if ( util.typeOf( file.filehandler ) !== "undefined" ) {

                    if ( util.typeOf( file.filehandler ) !== "undefined" ) {

                        var isCancel = instance.stopUploadFile( file.filehandler );

                    }

                }

                /**
                 * 假定取消上传必定成功
                 * 删除 itrans 的缓存文件，并删除 dtv 上的任务
                 */

                /**
                 * 参数请求设置
                 */
                var option = {
                    url: ( iHomed && iHomed( "api", "get_video_delete" ) ) || "http://dtv.homed.me/media/video/delete",
                    type: "GET",
                    data: {
                        "accesstoken" : ( iHomed && iHomed.data( "token" ) ) || settings.properties.accesstoken,
                        "videoid"     : file.videoid
                    },
                    success: function ( data ) {

                        if ( data.ret == 0 ) {

                            // 删除 itrans 的缓存文件
                            instance.fileDelete( "" + file.videoid );

                        }

                    }
                };

                // 删除 dtv 上的任务
                $.ajax( option );
                
                //被取消的文件数
                queueData.uploadsCancelled++;

                handler.setFileStatus( file, 3 );

                // 执行取消上传回调
                util.runFunction( settings.onCancel, settings, [ file ] );

                // 执行上传完成的操作
                util.runFunction( uploader.onComplete, settings, [ file ] );

            }

            util.runFunction( callback );

        },
        /**
         * 清空队列
         * @param  {Function} callback 清空成功后的回调函数
         * @return 无返回
         */
        clearQueue: function ( callback ) {
            var settings = this,
                queueData = settings.queueData,
                $queue = settings.queue;

            //保存当前文件选择次数
            var filesSelected = queueData.filesSelected;

            //恢复queueData的默认值
            queueData = handler.getDefaultQueueData();
            queueData.filesSelected = filesSelected;
            
            //清空DOM队列
            if ( settings.removeCancelled ) {

                $queue.find( ".itrans-queue-item" )
                      .fadeOut( settings.removeTimeout * 1000, function () {
                          $( this ).remove();
                      } );

            }

            util.runFunction( callback );
        }
    };

    /**
     * iTrans 公用处理函数
     */
    var handler = {
        /**
         * iTrans  构造方法，用于初始化 iTrans 插件
         * @param  {String} itransID iTrans 插件 id
         * @return 无返回值
         */
        construct: function ( itransID ) {
            
            var itrans =    '<object class="itrans-object" id="' + itransID + '" type="application/itrans-plugin" width="0" height="0">\
                                <param name="onload" value="pluginLoaded" />\
                            </object>';

            // 追加一个 itrans 插件的 DOM 对象到 body 中
            $( "body" ).prepend( itrans );

        },
        /**
         * 检测插件是否存在或是否存在更新
         * @param  {Object} settings iTrans 参数设置
         * @return 无返回值
         */
        check: function ( settings ) {

            var instance = settings.instance,
                src = "http://rd.homed.me/itrans/itrans_setup.exe";

            // 检查结果，1为未安装，2为有更新
            var ret = null;

            // 如果插件不存在
            if ( !instance || !instance.valid ) {

                ret = 1;

            } else {

                // 检测插件的是否有更新
                var up = instance.checkPluginUpgrade();

                if ( up[ 0 ] == -13 ) { // 插件有更新

                    ret = 2;

                    // 更新地址
                    src = up[ 1 ];

                }

            }

            if ( ret ) {

                util.runFunction( settings.check, [ ret, src ] );

            }

        },
        /**
         * 绑定插件各类事件
         * @param  {Object} settings iTrans 参数设置
         * @return 无返回值
         */
        bindEvents: function ( settings ) {

            var queueData = settings.queueData,
                instance = settings.instance,
                $queue = settings.queue;

            /**
             * 绑定文件选择回调
             * @param  {Int}    h     文件选择句柄
             * @param  {String} files 选择的文件列表，需转换成数组
             * @return                无返回
             */
            Event.add( instance, "notifySelectFile", function ( h, files ) {
                
                // 为防止消息冲突，需验证句柄是否为当前页面生成的
                if ( instance.selectHandler !== h ) { return false; }

                files = $.parseJSON( files || "[]" );

                // 执行文件选择操作
                util.runFunction( uploader.select, settings, [ h, files ] );

            } );

            /**
             * 绑定文件上传中回调
             * @param  {Int}    h           任务句柄
             * @param  {Int}    progress    上传进度百分比
             * @param  {Int}    status      任务状态
             * @param  {String} srcHttpLink 用于http下载的链接
             * @param  {Int}    errorCode   错误状态码
             * @param  {String} src         文件上后的路径(主要针对电影不转码直接上传使用)
             * @return                      无返回值
             */
            Event.add( instance, "notifyUploadProgress", function ( h, progress, status, srcHttpLink, errorCode, src ) {
                
                // 为防止消息冲突，需验证句柄是否为当前页面生成的
                if ( instance.uploadHandler !== h ) { return false; }

                // 上传中信息
                var data = {
                    "handler"       : h,
                    "progress"      : progress,
                    "status"        : status,
                    "srcHttpLink"   : srcHttpLink,
                    "errorCode"     : errorCode,
                    "src"           : src
                };

                var fileID = queueData.uploadFileID,
                    $item = $queue.find( "#" + fileID ),
                    file = queueData.files[ fileID ];

                // 保存文件的任务句柄
                file.filehandler = h;

                // 设置进度条的宽度
                $item.find( ".itrans-progress-bar" ).css( "width", ( progress == 0 ? "1px" : progress + "%" ) );
                $item.find( ".data" ).html( " - 上传中..." + progress + "%" );
                
                // 方法
                var action = null;

                // 判断当前的上传状态
                switch ( status ) {

                    case 4: // 上传中

                        // 执行上传中的回调
                        util.runFunction( settings.onUploadProgress, settings, [ file, data ] );

                        break;
                    case 5: // 上传完成
                        action = "onUploadSuccess";

                        $item.find( ".cancel" ).remove();
                        break;
                    case 7003: // 上传失败
                        action = "onUploadError";

                        // 上传失败，重置上传进度样式
                        // 设置进度条的宽度
                        $item.find( ".itrans-progress-bar" ).css( "width", "1px" );
                        $item.find( ".data" ).html( " - 上传失败" );
                        $item.find( ".cancel" ).remove();

                        break;

                }

                if ( action ) { // 非上传中

                    //util.runFunction( uploader[ action ], settings, [ fileID, data ] );

                }

            } );

            /**
             * 绑定文件转码回调
             * @param  {Int}    h             任务句柄
             * @param  {Int}    progress      上传进度百分比
             * @param  {Int}    status        任务状态
             * @param  {String} srcHttpLink   源文件http下载的链接
             * @param  {String} transHttpLink 转码后文件的http下载路径
             * @param  {String} srcObsLink    源文件在服务器上的绝对路径
             * @param  {String} duration      视频文件的播放时长
             * @param  {Int}    errorCode     对应的错误码
             * @param  {String} errorMsg      错误码对应的消息
             * @return 无返回值
             */
            Event.add( instance, "notifyUploadMovieProgess", function ( h, progress, status, srcHttpLink, transHttpLink, srcObsLink, duration, errorCode, errorMsg ) {
                
                // 为防止消息冲突，需验证句柄是否为当前页面生成的
                if ( instance.uploadHandler !== h ) { return false; }

                // 转码中信息
                var data = {
                    "handler"       : h,
                    "progress"      : progress,
                    "status"        : status,
                    "srcHttpLink"   : srcHttpLink,
                    "transHttpLink" : transHttpLink,
                    "srcObsLink"    : srcObsLink,
                    "duration"      : duration,
                    "errorCode"     : errorCode,
                    "errorMsg"      : errorMsg
                };

                var fileID = queueData.uploadFileID,
                    $item = $queue.find( "#" + fileID ),
                    file = queueData.files[ fileID ];

                // 保存文件的任务句柄
                file.filehandler = h;

                // 设置进度条的宽度
                $item.find( ".itrans-progress-bar" ).css( "width", ( progress == 0 ? "1px" : progress + "%" ) );
                $item.find( ".data" ).html( " - 转码中..." + progress + "%" );

                // 方法
                var action = null;

                // 判断当前的上传状态
                switch ( status ) {

                    case 10: // 转码中

                        // 执行上传中的回调
                        util.runFunction( settings.onTransProgress, settings, [ file, data ] );

                        break;
                    case 11: // 转码完成
                        action = "onTransSuccess";
                        $item.find( ".data" ).html( " - 上传成功" );
                        break;
                    case 7003: // 上传失败
                        action = "onTransError";

                        // 上传失败，重置上传进度样式
                        // 设置进度条的宽度
                        $item.find( ".itrans-progress-bar" ).css( "width", "1px" );
                        $item.find( ".data" ).html( " - 转码失败" );

                        break;

                }

                if ( action ) { // 非上传中

                    util.runFunction( uploader[ action ], settings, [ fileID, data ] );

                }
            } );
            

        },
        /**
         * 组装模板
         * @param  {Object} data     模板数据
         * @param  {String} template 模板代码
         * @return {String}          返回真正的HTML代码
         */
        packTemplate: function ( data, template ) {

            return  template.replace(/\$\{(.*?)\}/ig, function (str, key) {
                        var keys = key.split("|");

                        key = $.trim(keys[0]); //变量

                        //获取默认值  default=****
                        var def = keys.length > 1 ? (/^default=(.*)/ig).exec($.trim(keys[1]||""))[1] : "";

                        return data[key] === undefined ? def : data[key];
                    });

        },
        /**
         * 清空队列
         * @param  {Function} callback 清空成功后的回调函数
         * @return 无返回
         */
        clearQueue: function ( callback ) {
            var settings = this,
                queueData = settings.queueData,
                $queue = settings.queue;

            //保存当前文件选择次数
            var filesSelected = queueData.filesSelected;

            //恢复queueData的默认值
            queueData = handler.getDefaultQueueData();
            queueData.filesSelected = filesSelected;
            
            //清空DOM队列
            if ( settings.removeCancelled ) {

                $queue.find( ".itrans-queue-item" )
                      .fadeOut( settings.removeTimeout * 1000, function () {
                          $( this ).remove();
                      } );

            }

            util.runFunction( callback );
        },
        /**
         * 获取默认的队列信息
         * @return {object} 返回默认的队列信息
         */
        getDefaultQueueData: function () {

            var queueData = {
                files               : {},   // 保存上传的File集合
                filesSelected       : 0,    // 添加文件到队列的次数
                filesLength         : 0,    // 队列的长度
                averageSpeed        : 0,    // 上传的平均速度
                queueBytesUploaded  : 0,    // 当前整个队列中已上传的字节数
                queueSize           : 0,    // 整个队列的字节数
                uploadSize          : 0,    // 当前等待上传队列的字节数
                uploadQueue         : [],   // 当前正在等待上传的文件id的集合
                uploadsSuccessful   : 0,    // 上传成功的文件数
                uploadsErrored      : 0,    // 上传失败的文件数
                uploadsCancelled    : 0,    // 上传被取消的文件数
                uploadFileID        : null  // 正在上传的文件 fileID
            };

            return queueData;
        },
        /**
         * 装载正在等待上传的文件
         * @param  {string} fileID 要上传的文件的fileID，当指定多个fileID可传入一个数组
         *                         fileID为空或者等于"*"即装载所有正在等待上传的fileID
         * @return {Array}         返回等待上传文件的队列集合
         */
        loadUploadQueue: function (fileID) {
            var settings = this,
                queueData = settings.queueData;

            var uploadQueue = queueData.uploadQueue || [],
                uploadSize = 0;

            fileID = fileID || "*";

            var files = queueData.files;
            var file = null;

            if ( fileID && typeof fileID === "string" ) {

                if ( fileID == "*" ) {

                    for ( var i in files ) {

                        file = files[i];

                        if ( util.inArray( i, uploadQueue ) == -1 && ( file.filestatus == -1 || file.filestatus == -2 ) ) {

                            uploadSize += file.sizeByte;

                            uploadQueue.push( file.id );

                            // 执行回调
                            util.runFunction( settings.onQueue, settings, [ file ]  );

                        }

                    }

                } else {

                    //指定了特定的一个fileID
                    file = files[ fileID ];

                    if ( file && util.inArray( fileID, uploadQueue ) == -1 && (file.filestatus == -1 || file.filestatus == -2) ) {

                        uploadSize += file.size;
                        uploadQueue.push( fileID );

                        // 执行回调
                        util.runFunction( settings.onQueue, settings, [ file ]  );

                    }

                }
            } else {

                //此时的fileID为一个数组
                var len = fileID;

                for (var i = 0; i < len; i++) {

                    file = files[ fileID[i] ];

                    if ( file && util.inArray( fileID[i], uploadQueue ) == -1 && (file.filestatus == -1 || file.filestatus == -2) ) {
                        uploadSize += file.size;
                        uploadQueue.push( file.id );

                        // 执行回调
                        util.runFunction( settings.onQueue, settings, [ file ]  );
                    }

                }

            }

            queueData.uploadSize += uploadSize;
            queueData.uploadQueue = uploadQueue;

            return uploadQueue;
        },
        /**
         * 获取文件的状态
         * @param   {File} file   File对象
         * @return  {int}         返回文件状态码(-3不允许上传，-2重新上传，-1等待上传，0上传失败，1上传成功，2正在上传，3取消上传)
         */
        getFileStatus: function ( file ) {
            return file.filestatus;
        },
        /**
         * 设置文件的状态
         * @param {File} file   File对象
         * @param {int}  status 状态码(-2重新上传，-1等待上传，0上传失败(包含转码)，1上传成功(包含转码)，2正在上传，3取消上传, 4正在转码)
         */
        setFileStatus: function ( file, status ) {
            file.filestatus = status;
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
        addZero: function (num, digit) {
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
         * 获取File文件的名称（name），类型（type），大小（size），时间长度（time）
         * @param  {File} file File对象
         * @return {object}    返回对象{name:*,type:*,size:*}
         */
        getFileInfos: function (file) {
            var dotIndex = file.name.lastIndexOf( "." );

            if (dotIndex > -1) {
                return {
                    name: file.name.substring( 0, dotIndex ) || "未命名文件",
                    type: file.type || "未知格式",
                    size: this.computeFileSize( file.size ),
                    time: this.m2t( file.time * 1000 ).split( "," )[0]
                }
            }

            return {};
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
        }
    };

    // 暴露给 jQuery 和 window
    $.fn.iTrans = function ( method ) {

        if ( methods[ method ] ) {

            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ) );

        } else if ( method && typeof method == "object" ) {

            return methods.init.apply( this, arguments );

        } else {

            $.error('方法 ' + method + ' 在$.iTrans中未定义！');

        }

    }

} ( jQuery, window ) );