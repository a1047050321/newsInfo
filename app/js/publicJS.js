/*
 * 输入框字符限制对象
 * selector 字符串，需要使用该对象的输入框选择器
 * tipSelector 字符串，接受限制字数提示的唯一标识选择器
 * length 数值型，字数限制的字符长度
 * useIncrease 布尔型，默认使用递增控制从0开始，否则从length开始递减
 * blurFn 函数，输入框失去焦点后执行blurFn回调函数
 */
function CtrlTextLength(selector, tipSelector, length, useIncrease, blurFn) {
        
    this.o = this._obj = $(selector);
    this.s = selector;
    this.t = tipSelector;
    this.l = length;
    this.u = useIncrease !== undefined ? useIncrease : true;
    this.fn = blurFn;
    
    this.timer = null;
    this.canCommit = true;
    this.isEmpty = true;

    this.commitValue = "";

    this._setCanCommit = function (flag) {
        this.canCommit = flag;
    };

    this.initCtrl(this.t, this.l, this.u);

    this.liveCtrlEvent();
    
}

CtrlTextLength.prototype = {
    initCtrl: function (t, l, u) {
        $(t).html('<span class="limitText">不超过' + l + '个字符</span><span class="required">(必填)</span><span class="showTextCount"><span id="' + (this._obj.prop("id") || this._obj.prop("name")) + 'TextCount" class="textCount">' + (u ? 0 : l) + '</span>/' + l + '</span>');
    },
    showCount: function () {
        var length = this.u ? this._obj.val().length : this.l - this._obj.val().length;
        var $curCount = $(this.t + " #" + (this._obj.attr("id") || this._obj.attr("name")) + "TextCount" );
        $curCount.html(length + "");
        return {
            "curCount": $curCount,
            "length": length
        }
    },
    liveCtrlEvent: function () {
        var _self = this;
        _self._obj.bind({
            focus: function () {
                var _this = this;
                if (_self.timer) {
                    clearInterval(_self.timer);
                    _self.timer = null;
                }
                _self.timer = setInterval(function () {
                    _self.commitValue = _this.value;
                    var showCount = _self.showCount(),
                        length = showCount.length,
                        $curCount = showCount.curCount;

                    if (_self.commitValue.length == 0) {
                        _self.isEmpty = true;
                    } else {
                        _self.isEmpty = false;
                        if (length < 0 || length > _self.l) {
                            _self._setCanCommit(false);
                            $curCount.addClass("redTip");
                        } else {
                            _self._setCanCommit(true);
                            $curCount.removeClass("redTip");
                        }
                    }
                }, 100);
            },
            blur: function () {
                if (_self.timer) {
                    clearInterval(_self.timer);
                    _self.timer = null;
                    if (typeof _self.fn === "function") {
                        _self.fn();
                    }
                }
            }
        });
    }
};

String.prototype.getSplitAt = function (separator, index) {
    return this.split(separator)[index];
}

/**
 * 判断元素是否存在数组中
 * @param  {多类型} value 要判断的值
 * @return {Int}          返回元素在数组中的下标
 */
Array.prototype.inArray = function (value) {
    for (var i = this.length-1; i > -1; i--) {
        if (this[i] == value) {
            return i;
        }
    }
    return -1;
}

/**
 * 移除arr数组中index下标对应元素
 * @param  {Int} index   要移除的元素的下标
 * @return 返回被移除的元素
 */
Array.prototype.removeAt = function (index) {
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
};

/**
 * 移除数组中的元素
 * @param  {多类型} value 要移除的元素
 * @return {多类型}       返回被移除的元素
 */
Array.prototype.removeOf = function (value) {
    var index = this.inArray(value);
    if (index > -1) {
        return this.removeAt(index);
    }
    return false;
}


//获取url中的参数，返回json格式
function $_GET(str) {
    var data = {},
        arr = [],
        uri = decodeURIComponent(str);
    if (uri.indexOf("?") != -1) {
        arr = (uri.split("?",2)[1]);
        if (arr.length != 0) {
            arr = arr.split("&");
            var len = arr.length;

            //存储分解形如 name=value 的字符串为数组形式
            var nameValue;
            for (var i = 0; i < len; i++) {
                nameValue = arr[i].split("=");
                data[nameValue[0]] = nameValue[1];
            }
            return data;
        }
    }

    return {};
}