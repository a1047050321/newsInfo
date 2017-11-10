;(function ($, window, undefined) {

    //把以下变量保存成局部变量
    var document = window.document,
        navigator = window.navigator,
        location = window.location;

    //错误提示
    var UPLOADTIPS = {
        NOT_ALLOW_SELECT        : "不合法的文件将不被添加到队列中！",               //当选择的文件存在格式不被允许上传时
        NOT_ALLOW_UPLOAD        : "文件 ${fileName} 类型不合法，不允许上传！",      //文件不合法不允许上传       
        REPLACE_FIlE_IN_QUEUE   : "文件 ${fileName} 已存在队列中，是否继续添加？"   //当上传的文件存在队列中
    };

    /**
     * 事件监听函数
     */
    var Event = {
        /**
         * 给context添加事件监听
         * @param {obj}       context  需要添加事件监听的对象
         * @param {string}    type     事件类型，无on
         * @param {function}  handler  事件函数
         */
        addEvent: function (context, type, handler) {
            context = context || document;
            if (document.addEventListener) {
                context.addEventListener(type, handler, false);
            } else {
                context.attachEvent("on"+type, handler);
            }
        },
        /**
         * 给context移除事件监听
         * @param {obj}       context  需要移除事件监听的对象
         * @param {string}    type     事件类型，无on
         * @param {function}  handler  事件函数
         */
        removeEvent: function (context, type, handler) {
            context = context || document;
            if (document.removeEventListener) {
                context.removeEventListener(type, handler, false);
            } else {
                context.detachEvent("on"+type, handler);
            }
        }
    };

    var methods = {

        /**
         * 初始化uploadfive上传插件
         * @param  {object} options uploadfive各个参数
         * @return 无返回
         */
        init: function (options) {

            /**
             * 初始化uploadfive上传的各个参数值
             */
            return this.each(function () {

                //保存当前jQ对象
                var _this = this,
                    $this = $(this),
                    $parent = $this.parent();

                var $clone = $this.clone();

                // 若 DOM 对象不存在 id 属性则随机生成一个
                if ( !$this.attr("id") ) {
                    $this.attr( "id", "uploadfive_" + (new Date().getTime()) );
                }

                var requireds = {
                    //上传的按钮必须有id属性
                    id              : $this.attr("id")         //上传按钮的id
                };

                var settings = $.extend({

                    auto            : true,                 //自动上传，设置false为不自动上传
                    appendTo        : false,                //上传按钮是否直接追加到 $this 中，否则，直接替换（默认）
                    uploader        : "",                   //上传的链接
                    method          : "POST",               //上传的方式
                    dataType        : false,                //返回的数据类型，可根据jQuery.ajax的dataType设置
                    formData        : {},                   //一个JSON，上传的额外数据
                    fileObjName     : "Filedata",           //服务器获取数据的参数名，
                                                            //例如在php中要获取上传的文件数据可使用
                                                            //$_FILES["Filedata"]
                                                            
                    multi           : false,                //是否支持多文件上传

                    fileTypeExts    : "*.*",                //允许上传的文件类型，*.*表示所有文件都可上传，
                                                            //可设置一个或多个如*.pdf, *.doc等
                                                            
                    queueID         : false,                //用于接收上传队列的的DOM对象的id(无#号)
                    buttonText      : "选择文件",            //自定义上传按钮的显示文本
                    buttonTitle     : "选择文件",            //自定义上传按钮的提示文本
                    buttonClass     : "",                   //自定义上传按钮的class属性值，默认：uploadfive
                    buttonCursor    : "pointer",            //自定义上传按钮hover时的鼠标指示手势
                    removeCancelled : true,                 //上传取消失败后是否移除上传项
                    removeCompleted : true,                 //上传完成（无论成功与否）后是否移除上传项
                    removeTimeout   : 3,                    //移除上传项的动画时间，单位 s
                    progressData    : "percentage",         //设置上传进度显示百分比(percentage)或者速度(speed)

                    itemTemplate    : false                 //自定义队列中的文件的模板，模板使用参数如下:
                                                            //${fileID}文件的id，
                                                            //${instanceID}DOM对象的id，
                                                            //${fileName}文件的名称，
                                                            //${fileSize}文件的大小
                    

                }, options, requireds);

                var fdUploadSettings = {
                    file_post_name  : settings.fileObjName,
                    file_allow_ext  : settings.fileTypeExts,
                    request_method  : settings.method,
                    request_url     : settings.uploader,
                    settings        : settings,

                    //Function handler
                    method_upload_handler   : methods.upload,
                    method_cancel_handler   : methods.cancel,

                    //Event Handler
                    file_queued_handler     : handler.onSelect,
                    object_init_handler     : settings.onInit || undefined,
                    upload_cancel_handler   : handler.onCancel,
                    upload_error_handler    : handler.onUploadError,
                    upload_progress_handler : handler.onUploadProgress,
                    upload_start_handler    : handler.onUploadStart,
                    upload_success_handler  : handler.onUploadSuccess 

                };

                window["uploadfive_"+settings.id] = $.extend({}, fdUploadSettings);
                var fduploadfive = window["uploadfive_"+settings.id];

                //初始化上传按钮
                var instanceID = uploader.initButtonText.call(fduploadfive);

                //初始化上传按钮过后，原有的DOM对象被替换，需要重新获取
                $this = $("#"+settings.id);

                //将uploadfive数据保存到jQ对象中
                $this.data("uploadfive", fduploadfive);

                //创建接收上传队列的容器
                if (!settings.queueID) {
                    var $queue = $("<div />", {
                        "id"      : settings.id + "-queue",
                        "class"   : "uploadfive-queue"
                    });
                    $this.after($queue);
                    fduploadfive.settings.queueID = settings.id + "-queue";
                    fduploadfive.settings.defaultQueue = true;
                }

                //初始化队列信息
                fduploadfive.queueData = uploader.getDefaultQueueData();

                fduploadfive.original = $clone;
                fduploadfive.queue = $queue || $("#" + settings.queueID);

                //先解绑
                $("#"+settings.id+" #"+instanceID).unbind();

                //绑定事件
                $("#"+settings.id+" #"+instanceID).bind({
                    "click.uploadfive": function (e) {
                        e = e || window.event;
                        
                        var $this = $("#"+settings.id);

                        return util.runFunction(settings.onDialogOpen, $this, [e]);
                    },
                    "change.uploadfive": function () {
                        var files = this.files,
                            len = files.length;
                        var selected = false;
                        /*if (util.cleckQueueExts(files, settings.fileTypeExts)) {
                            alert(UPLOADTIPS.NOT_ALLOW_SELECT);
                        }*/
                        var i = 0,
                            duration = 10;

                        // 当选择文件对话框关闭后执行调用
                        util.runFunction( settings.onDialogClose, $this, [ len ] );

                        // 使用 setTimeout 开始遍历文件列表
                        setTimeout( each, duration );

                        /**
                         * 遍历文件列表的方法
                         * @return 无返回值
                         */
                        function each() {

                            var file = files[i];
                            if (util.allowUpload(file, settings.fileTypeExts)) {
                                var isReplace = true;
                                if (util.inQueue(file, fduploadfive.queueData.files)) {
                                    if (!confirm(UPLOADTIPS.REPLACE_FIlE_IN_QUEUE.replace("${fileName}", file.name))) {
                                        isReplace = false;
                                    }
                                }
                                if ( isReplace ) {

                                    if ( !selected ) {
                                        fduploadfive.queueData.filesSelected++;
                                        selected = true;
                                    }

                                    fduploadfive.file_queued_handler.call(fduploadfive, file);

                                }
                                
                            } else {
                                alert(UPLOADTIPS.NOT_ALLOW_UPLOAD.replace("${fileName}", file.name));
                            }

                            // 下一个文件索引
                            i++;

                            if ( i >= len ) {

                                $(this).val("");

                                //当用户允许自动上传时
                                if (settings.auto) {
                                    fduploadfive.method_upload_handler.call($this);
                                }

                            } else {

                                // 继续遍历
                                setTimeout( each, duration );

                            }

                        }
                        
                    }
                });

                //执行uploadfive的onInit事件
                var object_init_handler = fduploadfive.object_init_handler;
                if (object_init_handler && typeof object_init_handler === 'function') {
                    object_init_handler.call($this, fduploadfive);
                }
            });
        },
        /**
         * 取消上传
         * @param  {string} fileID        1. 指定要终止上传的文件的id，回调onCancel。
         *                                2. 当传入"*"号时，终止整个队列的上传操作，回调onQueueClear
         * @param  {string} suppressEvent 
         * @return 无返回值
         */
        cancel: function (fileID, suppressEvent) {
            
            var args = arguments;
            
            return this.each(function () {
                var $this = $(this),
                    fduploadfive = $this.data("uploadfive"),
                    settings = fduploadfive.settings;

                var $queue = fduploadfive.queue;
                var arg0 = args[0];

                if (arg0) {
                    if (arg0 == "*") {
                        var files = fduploadfive.queueData.files,
                            queueItemCount = fduploadfive.queueData.filesLength;
                        for (var i in files) {
                            if (files.hasOwnProperty(i)) {
                                uploader.cancelUpload.call(fduploadfive, i, function () {
                                    $queue.find("#"+i+" .cancel").remove();
                                    if (settings.removeCancelled) {
                                        $queue.find("#"+i).fadeOut(settings.removeTimeout*1000, function () {
                                            $(this).remove();
                                        });
                                    }
                                });
                            }
                        }
                        uploader.clearQueue.call(fduploadfive, function () {
                            util.runFunction(settings.onClearQueue, $this, [queueItemCount]);
                        });
                    } else {
                        uploader.cancelUpload.call(fduploadfive, arg0, function () {
                            $queue.find("#"+arg0+" .cancel").remove();                            
                            if (settings.removeCancelled) {
                                $queue.find("#"+arg0).fadeOut(settings.removeTimeout*1000, function () {
                                    $(this).remove();
                                });
                            }
                        });
                    }
                } else {

                    var $firtsItem = $queue.children().eq(0);
                    //取消队列中第一个上传项时，必须保证该项存在
                    if ($firtsItem > 0) { return false; }

                    //获取该项的fileID
                    var fileID = $firtsItem.attr("id");

                    uploader.cancelUpload.call(fduploadfive, fileID, function () {
                        $firtsItem.find(".cancel").remove();
                        if (settings.removeCancelled) {
                            $firtsItem.fadeOut(settings.removeTimeout*1000, function () {
                                $(this).remove();
                            });
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

            this.each(function () {
                var $this = $(this),
                    fduploadfive = $this.data("uploadfive"),
                    settings = fduploadfive.settings;

                if (args.length === 1) {
                    return settings[name];
                } else {
                    switch (name) {
                        case "auto" :
                            value = inArray(value, [true, false]) > -1
                                                ? value : true;
                            break;
                        case "uploader" :
                            fduploadfive.request_url = value;
                            break;
                        case "method" :
                            fduploadfive.request_method = value;
                            break;
                        case "fileObjName" :
                            fduploadfive.file_post_name = value;
                            break;
                        case "formData" :
                            value = $.extend(settings.formData, value);
                            break;
                        case "multi" :
                            value = inArray(value, [true, false]) > -1
                                        ? value : false;
                            break;
                        case "fileTypeExts" :
                            fduploadfive.file_allow_ext = value;
                            break;
                        case "buttonText" :
                            $("#"+settings.id+" span").html(value);
                            break;
                        case "buttonClass" :
                            $("#"+settings.id).removeClass(settings.buttonClass);
                            $("#"+settings.id).addClass(value);
                            break;
                        case "buttonCursor" :
                            $("#"+settings.id).css("cursor", value);
                            break;
                        case "removeCancelled" :
                            value = inArray(value, [true, false]) > -1
                                        ? value : true;
                            break;
                        case "removeCompleted" :
                            value = inArray(value, [true, false]) > -1
                                        ? value : true;
                            break;
                        case "progressData" :
                            value = inArray(value, ["percentage", "speed"]) > -1
                                        ? value : "percentage";
                            break;
                    }
                    settings[name] = value;
                }

            });
        },
        /**
         * 开始上传
         * @param  {string} fileID 指定要上传的文件的id，若要指定多个fileID可传入多个fileID
         *                         如果使整个队列开始上传可使用"*"
         * @return 无返回值
         */
        upload: function (fileID) {
            var args = arguments;

            return this.each(function () {
                var $this = $(this),
                    fduploadfive = $this.data("uploadfive"),
                    settings = fduploadfive.settings,
                    queueData = fduploadfive.queueData;

                //没有文件可上传
                if (queueData.filesLength <= 0) { return false; }

                var $queue = fduploadfive.queue;

                //正在上传中，不允许再一次执行上传操作，但允许重新设置队列
                if (queueData.uploadQueue.length > 0) { 
                    //重新装载需要上传的file
                    uploader.loadUploadQueue.apply(fduploadfive, args);
                } else {
                    //装载需要上传的file
                    uploader.loadUploadQueue.apply(fduploadfive, args);
                    
                    uploader.startUpload.call(fduploadfive, queueData.uploadQueue.shift());
                }

            });
        }
    };

    /**
     * uploadfive自定义事件对像
     */
    var handler = {

        /**
         * 上传操作被取消
         * @param  {File} file File对象
         * @return 无返回
         */
        onCancel: function (file) {
            var fduploadfive = this,
                settings = this.settings,
                queueData = this.queueData,
                $this = $("#"+settings.id);

            util.runFunction(settings.onCancel, $this, [file]);

            uploader.uploadComplete.call(fduploadfive, file);
        },
        /**
         * 选择了文件时的事件
         * @param  {File} file File对象
         * @return 无返回
         */
        onSelect: function (file) {
            var settings = this.settings,
                queueData = this.queueData,
                $this = $("#"+settings.id);
            
            //增加settings.id是为了防止队列追加在同一个DOM队列中时发生了冲突
            var fileID = "FDUpload_" + settings.id + "_" + (queueData.filesSelected - 1) + "_" + queueData.filesLength;

            //获取图片的名称、大小和格式
            var fileInfos = util.getFileInfos(file);
            //自定义File对象
            var customFile = $.extend({}, file, {
                id          : fileID,
                index       : queueData.filesLength,
                filestatus  : -1, //-1等待上传，0上传失败，1上传成功，2正在上传，3取消上传
                type        : fileInfos.type,
                original    : file //原始File对象
            });

            queueData.filesLength++;
            queueData.queueSize += file.size;

            var fileName = file.name;
            var itemData = {
                'fileID'        : fileID,
                'instanceID'    : settings.id,
                'fileFullName'  : fileName,
                'fileName'      : fileName.length > 20 ? (fileName.substring(0, 20) + "...") : fileName,
                'fileSize'      : fileInfos.size,
                'fileType'      : fileInfos.type
            }

            if (!settings.itemTemplate) {
                settings.itemTemplate = '<div id="${fileID}" class="uploadfive-queue-item">\
                    <div class="cancel">\
                        <a title="取消" href="javascript:$(\'#${instanceID}\').uploadfive(\'cancel\', \'${fileID}\')">X</a>\
                    </div>\
                    <div class="information">\
                        <span title="${fileFullName}" class="fileName">${fileName} (${fileSize})</span><span class="data"></span>\
                        <div class="uploadfive-progress">\
                            <div class="uploadfive-progress-bar"><!--Progress Bar--></div>\
                        </div>\
                    </div>\
                </div>';
            }

            //替换模板
            var itemHTML = settings.itemTemplate;
            for (var n in itemData) {
                itemHTML = itemHTML.replace(new RegExp('\\$\\{'+ n +'\\}', "g"), itemData[n]);
            }
            this.queue.append(itemHTML);

            queueData.files[fileID] = customFile;

            //执行用户自定义onSelect事件
            util.runFunction(settings.onSelect, $this, [customFile]);

        },
        /**
         * 上传发生错误的事件
         * @param  {File} file 文件File对象
         * @return 无返回
         */
        onUploadError: function (file) {
            var fduploadfive = this,
                settings = this.settings,
                queueData = this.queueData,
                $this = $("#"+settings.id);

            //设置file文件上传状态为上传失败0
            uploader.setFileStatus(file, 0);

            //上传失败文件个数
            queueData.uploadsErrored++;

            //获取当前上传文件对应的DOM对象
            var $item = this.queue.find("#"+file.id);
            $item.find(".data").html(" - Errored");
            $item.find(".uploadfive-progress-bar").css("width", "1px");
            $item.find(".cancel").remove();

            //上传操作完成后是否移除上传项
            if (settings.removeCompleted) {
                $item.fadeOut(settings.removeTimeout*1000, function () {
                    $(this).remove();
                });
            }

            //执行用户自定义的onUploadError事件
            util.runFunction(settings.onUploadError, $this, [file]);

            uploader.uploadComplete.call(fduploadfive, file);

        },
        /**
         * 上传进度的事件
         * @param  {File} file              File对象
         * @param  {int}  fileBytesLoaded   当前文件已上传的字节数
         * @param  {int}  fileTotalBytes    当前文件的总字节数
         * @return 无返回
         */
        onUploadProgress: function (file, fileBytesLoaded, fileTotalBytes) {
            var fduploadfive = this,
                settings = this.settings,
                queueData = this.queueData,
                $this = $("#"+settings.id);

            //如果文件的filestatus状态码不再是2，那么就不允许继续执行下面的操作
            if (uploader.getFileStatus(file) != 2) { return false; }

            var timer = (new Date()).getTime(),
                lapsedTime = timer - this.timer; //计算距离this.timer的时间差

            //当时间差大于500ms时重新复制this.timer，避免时间过小导致计算不精确
            if (lapsedTime > 500) {
                this.timer = timer;
            }

            //计算在lapsedTime这段时间差中，被上传的字节数
            var lapsedBytes = fileBytesLoaded - this.bytesLoaded;
            queueData.queueBytesUploaded += fileBytesLoaded;
            this.bytesLoaded = fileBytesLoaded;

            //计算当前的百分比
            var percentage = Math.round(fileBytesLoaded / fileTotalBytes * 100);
                
            //速度单位
            var suffix = "KB/s";

            //计算当前速度
            var kbs = (lapsedBytes * 1024) / (lapsedTime * 1000);
                kbs = Math.floor(kbs * 10) / 10; //作用是保留一位小数
            
            //速度在BK/s的的范围内
            if (queueData.averageSpeed > 0) {
                queueData.averageSpeed = Math.floor((queueData.averageSpeed + kbs) / 2);
            } else {
                queueData.averageSpeed = kbs;
            }

            //速度在MB/s的范围内
            if (kbs > 1000) {
                var mbs = Math.floor(kbs / 1000);
                queueData.averageSpeed = mbs;
                suffix = "MB/s";
            }

            var processData = {
                "percentage"    : percentage + "%",
                "speed"         : queueData.averageSpeed + suffix
            };

            // 保存进度信息到文件对象中
            file.processData = processData;

            //获取当前上传文件对应的DOM对象
            var $item = this.queue.find("#"+file.id);

            $item.find(".data").html(" - " + (processData[settings.processData] || (percentage + "%")));
            $item.find(".uploadfive-progress-bar").css("width", (percentage + "%"));

            //执行用户自定义的onUploadProgress事件
            util.runFunction(settings.onUploadProgress, $this, [file, fileBytesLoaded, fileTotalBytes, queueData.queueBytesUploaded, queueData.queueSize]);
        },
        /**
         * 开始上传时的事件
         * @param  {string} fileID 文件id
         * @return 无返回
         */
        onUploadStart: function (fileID) {
            var fduploadfive = this,
                settings = this.settings,
                queueData = this.queueData,
                $this = $("#"+settings.id);

            //初始化当前文件开始上传的时间和已上传的字节数
            this.timer = (new Date()).getTime();
            this.bytesLoaded = 0;

            var file = queueData.files[fileID];

            //修改file的filestatus为正在上传状态2
            uploader.setFileStatus(file, 2);

            //执行用户自定义的onUploadStart事件
            util.runFunction(settings.onUploadStart, $this, [file]);
        },
        /**
         * 上传成功的事件
         * @param  {File} file [description]
         * @param  {string} data [description]
         * @return {[type]}      [description]
         */
        onUploadSuccess: function (file, data) {
            var fduploadfive = this,
                settings = this.settings,
                queueData = this.queueData,
                $this = $("#"+settings.id);

            //修改file的filestatus为上传成功状态1
            uploader.setFileStatus(file, 1);

            //上传成功文件个数
            queueData.uploadsSuccessful++;

            //整个队列中已上传的字节数
            queueData.queueBytesUploaded += file.size;

            //获取当前上传文件对应的DOM对象
            var $item = this.queue.find("#"+file.id);
            $item.find(".data").html(" - Completed");
            $item.find(".cancel").remove();

            //上传操作完成后是否移除上传项
            if (settings.removeCompleted) {
                $item.fadeOut(settings.removeTimeout*1000, function () {
                    $(this).remove();
                });
            }

            //执行用户自定义的onUploadSuccess事件
            util.runFunction(settings.onUploadSuccess, $this, [file, data]);

            uploader.uploadComplete.call(fduploadfive, file);

        }
    };

    /**
     * 上传的功能函数
     */
    var uploader = {
        /**
         * 初始化上传按钮
         * @return {string} 返回初始化后的上传控件(type="file")的id
         */
        initButtonText: function () {
            var settings = this.settings;
            var accept = settings.fileTypeExts == "*.*" ? '' : (' accept="'+settings.fileTypeExts.replace(/\*\./ig, ".")+'"');
            var instanceID = "uploadfive_"+settings.id;
            var button =    '<span class="uploadfive-button '+settings.buttonClass+'" style="cursor:'+settings.buttonCursor+';" id="'+settings.id+'">'+
                                '<span>'+settings.buttonText+'</span>'+
                                '<input title="'+settings.buttonTitle+'" type="file"'+accept+' id="'+instanceID+'" name="'+instanceID+'" '+(settings.multi ? 'multiple="multiple"' : '')+' />'+
                            '</span>';
                            
            if ( settings.appendTo ) {
                $("#"+settings.id).append( button );
            } else {
                $("#"+settings.id).replaceWith( button );
            }

            return instanceID;
        },
        /**
         * 开始上传
         * @param  {string} fileID 文件id
         * @return 无返回
         */
        startUpload: function (fileID) {
            var fduploadfive = this,
                settings = this.settings,
                queueData = fduploadfive.queueData;

            fduploadfive.upload_start_handler.call(this, fileID);

            var file = queueData.files[fileID],
                customFile = queueData.files[fileID];

            var fd = new FormData();
            fd.append(settings.fileObjName, file.original);

            //添加额外的上传数据
            for (var i in settings.formData) {
                if (settings.formData.hasOwnProperty(i)) {
                    fd.append(i, settings.formData[i]);
                }
            }

            $.ajax({
                url: fduploadfive.request_url,
                type: fduploadfive.request_method,
                data: fd,
                //防止jquery自动添加Content-Type导致字符串丢失和上传失败
                contentType: false,
                //禁止jquery尝试将data数据转换成字符串
                processData: false,
                dataType: settings.dataType,
                xhr: function () {
                    var xhr = $.ajaxSettings.xhr();
                    queueData.xhrs[fileID] = xhr;

                    //注册xhr.upload上传过程中的事件监听函数
                    Event.addEvent(xhr.upload, "progress", function (e) {
                        var evt = e || window.event;

                        var filesBytesLoaded = evt.loaded || 0,
                            fileTotalBytes = evt.total || customFile.size;

                        fduploadfive.upload_progress_handler.call(fduploadfive, customFile, filesBytesLoaded, fileTotalBytes);
                    });

                    //注册xhr.upload上传被取消的事件监听函数
                    Event.addEvent(xhr, "abort", function (e) {
                        var evt = e || window.event;
                        fduploadfive.upload_cancel_handler.call(fduploadfive, customFile);
                    });

                    return xhr;
                },
                success: function (data) {
                    fduploadfive.upload_success_handler.call(fduploadfive, customFile, data)
                },
                error: function () {
                    if (uploader.getFileStatus(customFile) == 2) {
                        fduploadfive.upload_error_handler.call(fduploadfive, customFile);
                    }
                }
            });
            
        },
        /**
         * 取消上传
         * @param  {string}    fileID     文件的id
         * @param  {Function}  callback   取消成功之后的回调函数
         * @return 无返回
         */
        cancelUpload: function (fileID, callback) {
            var fduploadfive = this,
                settings = this.settings,
                queueData = this.queueData,
                file = queueData.files[fileID];

            if (file === undefined) { return false; }

            //当且仅当文件状态处于等待上传(-1)和正在上传时才执行以下操作
            if (util.inArray(uploader.getFileStatus(file), [-1, 2]) > -1 ) {

                //设置fileID对应的文件的filestatus为取消上传状态3
                fduploadfive.queue.find("#"+fileID+" .data").html(" - Cancelled");
                fduploadfive.queue.find("#"+fileID+" .uploadfive-progress-bar").css("width", "1px");
                uploader.setFileStatus(file, 3);

                //被取消的文件数
                queueData.uploadsCancelled++;

                //检查fileID是否存在于uploadQueue中
                var i = util.inArray(fileID, queueData.uploadQueue);
                if (i > -1) {
                    var uq = queueData.uploadQueue;
                    queueData.uploadQueue = [].concat(uq.slice(0, i), uq.slice((i + 1), uq.length));
                }

                var xhr = queueData.xhrs[fileID];
                if (xhr) {
                    xhr.abort();
                } else {
                    fduploadfive.upload_cancel_handler.call(this, file);
                }

            }

            util.runFunction(callback);
        },
        /**
         * 清空队列
         * @param  {Function} callback 清空成功后的回调函数
         * @return 无返回
         */
        clearQueue: function (callback) {
            var fduploadfive = this,
                settings = this.settings;

            //保存当前文件选择次数
            var filesSelected = fduploadfive.queueData.filesSelected;

            //恢复queueData的默认值
            fduploadfive.queueData = uploader.getDefaultQueueData();
            fduploadfive.queueData.filesSelected = filesSelected;
            
            //清空DOM队列
            if (settings.removeCancelled) {
                fduploadfive.queue.find(".uploadfive-queue-item")
                                  .fadeOut(settings.removeTimeout*1000, function () {
                                      $(this).remove();
                                  });
            }
            

            fduploadfive.timer = 0;
            delete fduploadfive.timer;

            fduploadfive.bytesLoaded = 0;
            delete fduploadfive.bytesLoaded;

            util.runFunction(callback);
        },
        /**
         * 获取默认的队列信息
         * @return {object} 返回默认的队列信息
         */
        getDefaultQueueData: function () {

            var queueData = {
                files               : {},   //保存真正能上传的File集合，作用是避免污染了File对象
                filesSelected       : 0,    //添加文件到队列的次数
                filesLength         : 0,    //队列的长度
                averageSpeed        : 0,    //上传的平均速度
                queueBytesUploaded  : 0,    //当前整个队列中已上传的字节数
                queueSize           : 0,    //整个队列的字节数
                uploadSize          : 0,    //当前等待上传队列的字节数
                uploadQueue         : [],   //当前正在等待上传的文件id的集合
                uploadsSuccessful   : 0,    //上传成功的文件数
                uploadsErrored      : 0,    //上传失败的文件数
                uploadsCancelled    : 0,    //上传被取消的文件数
                xhrs                : {}    //对应fileID
            };

            return queueData;
        },
        /**
         * 装载正在等待上传的文件
         * @param  {string} fileID 要上传的文件的fileID，当指定多个fileID可传入一个数组
         *                         fileID为空或者等于"*"即装载所有正在等待上传的fileID
         * @return {[type]}        [description]
         */
        loadUploadQueue: function (fileID) {
            var fduploadfive = this,
                queueData = fduploadfive.queueData;

            var uploadQueue = [],
                uploadSize = 0;

            fileID = fileID || "*";

            var files = queueData.files;
            var file = null;
            if (fileID && typeof fileID === "string") {
                if (fileID == "*") {
                    for (var i in files) {
                        file = files[i];
                        if (file.filestatus == -1) {
                            uploadSize += file.size;
                            uploadQueue.push(file.id);
                        }
                    }
                } else {
                    //指定了特定的一个fileID
                    file = files[fileID];
                    if (file && file.filestatus == -1) {
                        uploadSize += file.size;
                        uploadQueue.push(fileID);
                    }
                }
            } else {
                //此时的fileID为一个数组
                var len = fileID;
                for (var i = 0; i < len; i++) {
                    file = files[fileID[i]];
                    if (file && file.filestatus == -1) {
                        uploadSize += file.size;
                        uploadQueue.push(file.id);
                    }
                }
            }

            queueData.uploadSize = uploadSize;
            queueData.uploadQueue = uploadQueue;

            return uploadQueue;
        },
        /**
         * 获取文件的状态
         * @param   {File} file   File对象
         * @return  {int}         返回文件状态码(-1等待上传，0上传失败，1上传成功，2正在上传，3取消上传)
         */
        getFileStatus: function (file) {
            return file.filestatus;
        },
        /**
         * 设置文件的状态
         * @param {File} file   File对象
         * @param {int}  status 状态码(-1等待上传，0上传失败，1上传成功，2正在上传，3取消上传)
         */
        setFileStatus: function (file, status) {
            file.filestatus = status;
        },
        /**
         * 执行上传成功或失败后的操作
         * @param  {File}     file           File文件对象
         * @return 无返回值
         */
        uploadComplete: function (file) {
            var fduploadfive = this,
                settings = this.settings,
                queueData = this.queueData,
                $this = $("#"+settings.id);

            //执行用户自定义的onUploadComplete事件
            util.runFunction(settings.onUploadComplete, $this, [file]);

            if (queueData.uploadQueue.length > 0) {
                util.runFunction(uploader.startUpload, fduploadfive, [queueData.uploadQueue.shift()]);
            }

            //当整个队列上传完执行onQueueComplete，无论成功与否
            if (queueData.filesLength  
                == (queueData.uploadsSuccessful + queueData.uploadsErrored + queueData.uploadsCancelled)) {

                util.runFunction(settings.onQueueComplete, $this, [{
                    "uploadsSuccessful"     : queueData.uploadsSuccessful,
                    "uploadsErrored"        : queueData.uploadsErrored,
                    "uploadsCancelled"      : queueData.uploadsCancelled
                }]);

                if (settings.removeCompleted) {
                    //队列全部完成后，还原队列信息
                    util.runFunction(uploader.clearQueue, this);
                } else {
                    //在不清空队列的时应将一下值还原
                    $.extend(queueData, {
                        filesLength         : 0,    //队列的长度
                        averageSpeed        : 0,    //上传的平均速度
                        queueBytesUploaded  : 0,    //当前整个队列中已上传的字节数
                        queueSize           : 0,    //整个队列的字节数
                        uploadSize          : 0,    //当前等待上传队列的字节数
                        uploadQueue         : [],   //当前正在等待上传的文件id的集合
                        uploadsSuccessful   : 0,    //上传成功的文件数
                        uploadsErrored      : 0,    //上传失败的文件数
                        uploadsCancelled    : 0     //上传被取消的文件数
                    });
                }
                
            }
        }
    };

    var util = {
        /**
         * 获取变量的类型
         * @param  {各类型} variable 变量
         * @return {String}          返回变量的类型, 如：number, array, function, object, string等
         */
        typeOf: function (variable) {
            var type = Object.prototype.toString.call(variable);
            return ((/\[object\s+(.*)\]/ig).exec(type)[1]).toLowerCase();
        },
        /**
         * 判断选择的文件是否存在不合法的文件
         * @param  {File}    files    File对象
         * @param  {string}  typeExts 允许上传的文件类型，如: "*.jpg,*.png"
         * @return {boolean}          返回布尔值
         */
        allowUpload: function (file, typeExts) {
            var exts = typeExts.split(",");
            for (var i = exts.length-1; i > -1; i--) {
                exts[i] = '('+$.trim(exts[i].replace(".", "\\.").replace("*", ".*"))+'$)';
            }
            exts = exts.join("|");
            return (new RegExp(exts, 'ig')).test(file.name);
        },
        /**
         * 判断选择的文件是否存在不合法的文件
         * @param  {FileList}    files    FileList对象
         * @param  {string}      typeExts 允许上传的文件类型，如: "*.jpg,*.png"
         * @return {boolean}              返回布尔值
         */
        cleckQueueExts: function (files, typeExts) {
            var len = files.length;
            for (var i = files.length; i > -1; i--) {
                if (!this.allowUpload(files, typeExts)) {
                    return true;     
                }
            }
            return false;
        },
        /**
         * 计算文件的容量大小(KB,MB,GB)
         * @param  {int}    size    字节数
         * @param  {int}    fixed   取小数点后的fixed位
         * @return {string}   返回带上了(KB,MB,GB)的容量大小的字符串
         */
        computeFileSize: function (size, fixed) {
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
         * 获取File文件的名称（name），类型（type），大小（size）
         * @param  {File} file File对象
         * @return {object}    返回对象{name:*,type:*,size:*}
         */
        getFileInfos: function (file) {
            var dotIndex = file.name.lastIndexOf(".");
            if (dotIndex > -1) {
                return {
                    name: file.name.substring(0, dotIndex) || "未命名文件",
                    type: file.name.substring(dotIndex) || "未知格式",
                    size: this.computeFileSize(file.size)
                }
            }
            return {};
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
         * 判断fun是否存在并且是一个函数
         * @param  {Function}  fun 函数名
         * @return {Boolean}       返回布尔值
         */
        isFunction: function (fun) {
            if (fun && typeof fun === "function") {
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
         * 判断File是否存在队列中
         * @param  {File}       file  File对象
         * @param  {FileList}   files FileList对象
         * @return {boolean}          返回布尔值
         */
        inQueue: function (file, files) {
            for (var i in files) {
                if (files.hasOwnProperty(i)) {
                    if (file.name == files[i].name 
                        && files[i].filestatus == -1
                        && file.size == files[i].size) {
                        return files[i].id;
                    }
                }
            }
            return false;
        }

    };

    $.fn.uploadfive = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === "object" || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('方法 ' + method + ' 在$.uploadfive中未定义！');
        }
    };

}(jQuery, window, undefined));