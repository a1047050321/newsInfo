jQuery.extend({
	alert: function(a) {
		Prompt("alert", "", a)
	},
	right: function(a) {
		Prompt("right", "\u64cd\u4f5c\u6210\u529f\uff01", a)
	},
	error: function(a) {
		Prompt("error", "\u5f88\u62b1\u6b49\uff0c\u672a\u80fd\u5b8c\u6210\u64cd\u4f5c\uff01", a)
	},
	confirm: function(a) {
		Prompt("confirm", "\u60a8\u786e\u5b9a\u8981\u6267\u884c\u5417\uff1f", a)
	},
	container: function(a) {
		if (! (a === undefined || $(a.targetId, top.document).length === 0)) {
			a = jQuery.extend({
				content: $(a.targetId, top.document).prop("innerHTML"),
				type: "container"
			},
			a || {});
			CreateLayer(a)
		}
	},
	frame: function(a) {
		if (! (a === undefined || a.pageUrl === undefined || a.pageUrl === "")) {
			a = jQuery.extend({
				content: "<iframe width='100%' frameBorder='0'></iframe>",
				type: "frame"
			},
			a || {});
			CreateLayer(a)
		}
	},
	custom: function(a) {
		a = jQuery.extend({
			type: "custom"
		},
		a || {});
		CreateLayer(a)
	}
});
function Prompt(a, d, c) {
	c = jQuery.extend({
		title: "\u6e29\u99a8\u63d0\u793a",
		content: "<div class='layer_msg " + a + "_icon'><p>"+(c === undefined || c.img === undefined ? '':c.img!=''?'<img src='+c.img+' />&nbsp;':'')+"<span>"+(c === undefined || c.msg === undefined ? d: c.msg) + "</span></p></div>",
		width: "100%",
		height: "100%",
		drag: true,
		type: a,
		callback: function() {}
	},
	c || {});
	CreateLayer(c)
}
function CreateLayer(a) {
	a = jQuery.extend({
		icon: "",
		title: "",
		content: "",
		width: 0,
		height: 0,
		background: "#000",
		opacity: 0.5,
		duration: "normal",
		showButton: false,
		showTitle: false,
		escClose: false,
		masksClose: false,
		drag: false,
		dragOpacity: 1,
		hideDuration:2000,
		type: "custom"
	},
	a || {});
	var document = top.document,
		window = top;
	var timer = -1;
	//alert(document == top.document);
	$(".wait", top.document).remove();
	$(".masks", top.document).empty().remove();
	$(".popMain", top.document).empty().remove();
	$("body", top.document).append("<div class='masks'></div>");
	var d = $(".masks", top.document);
	d.css({
		"background-color": a.background,
		filter: "alpha(opacity=" + a.opacity * 100 + ")",
		"-moz-opacity": a.opacity,
		opacity: a.opacity
	});
	a.masksClose && d.bind("click",
	function() {
		CloseLayer()
	});
	a.escClose && $(document).bind("keyup",
	function(e) {
		try {
			e.keyCode == 27 && CloseLayer()
		} catch(f) {
			CloseLayer()
		}
	});
	if (!$.support.leadingWhitespace) {
		d.height($(document).height());
		d.width(document.documentElement.clientWidth);
		$(window).resize(function() {
			d.height($(document).height());
			d.width(document.documentElement.clientWidth)
		})
	}
	d.fadeIn(a.duration);
	var c = "<div class='popMain "+a.type+"PopMain'>";
	c += "<div class='popTitle'>" + (a.icon !== undefined && a.icon !== "" ? "<img class='icon' src='" + a.icon + "' />": "") + "<span class='text'>" + a.title + "</span><a class='close'></a></div>";
	c += "<div class='popContent'>" + a.content + "</div>";
	
	if(a.type=="confirm") a.showButton = true;
	if(a.showButton){
		if(a.type=="confirm"){
			c += "<div class='but'><table width='100%' height='100%' border='0' cellspacing='0' cellpadding='0'><tr><td><a id='btnSure' href='javascript:void(0);'>\u786e\u5b9a</a></td><td><a id='btnCancel' href='javascript:void(0);'>\u53d6\u6d88</a></td></tr></table></div>";	
		}else{
			c += "<div class='but'><table width='100%' height='100%' border='0' cellspacing='0' cellpadding='0'><tr><td><a id='btnSure' href='javascript:void(0);'>\u786e\u5b9a</a></td></tr></table></div>";	
		}
	}else{
		if(a.type!="alert"){
			a.showButton = true;
		}	
	}
	c += "</div>";
	$("body", top.document).append(c);
	var b = $(".popMain", top.document);
	c = $(".popTitle", top.document);
	var g = $(".popContent", top.document);
	a.showTitle ? c.show() : c.hide();
	a.width !== 0 && c.width(a.width);
	$(".popTitle .close", top.document).bind("click",
	function() {
		$(".wait", top.document).hide();
		d.fadeOut(a.duration, function () {
			$(this).remove();
		});
		b.fadeOut(a.duration, function () {
			$(this).remove();
		});
		b.attr("isClose", "1");
		a.type == "container" && $(a.targetId, top.document).empty().append(a.content);
		if (! (!$.support.leadingWhitespace)) {
			$(document).unbind("keyup");
			$(document).unbind("mousemove");
			$(document).unbind("mouseup")
		}

	});
	a.width !== 0 && g.width(a.width);
	a.height !== 0 && g.height(a.height);
	if (!$.support.leadingWhitespace) {
		b.show();
		b.css({
			top: "50%",
			left: "50%",
			marginTop: document.documentElement.scrollTop - b.prop("offsetHeight") / 2 + "px",
			marginLeft: document.documentElement.scrollLeft - b.prop("offsetWidth") / 2 + "px"
		});
		b.hide()
	} else {
		b.css({
			left: $(window).width() / 2 - b.width() / 2 + "px",
			top: $(window).height() / 2 - b.height() / 2 + "px"
		});
		$(window).resize(function() {
			b.css({
				left: $(window).width() / 2 - b.width() / 2 + "px",
				top: $(window).height() / 2 - b.height() / 2 + "px"
			})
		});
		
		a.drag && DragPoP(a.drag, a.dragOpacity)
	}
	switch (a.type) {
	case "alert":
	case "right":
	case "error":
		b.fadeIn(a.duration,
		function() {
			b.attr("style", b.attr("style").replace("FILTER:", ""))
		});
		$("#btnSure", top.document).bind("click",
		function() {
			a.callback();
			CloseLayer()
		});
		break;
	case "confirm":
		b.fadeIn(a.duration,
		function() {
			b.attr("style", b.attr("style").replace("FILTER:", ""))
		});
		$("#btnSure", top.document).bind("click",
		function() {
			CloseLayer();
			a.callback(true);
		});
		$("#btnCancel", top.document).bind("click",
		function() {
			CloseLayer();
			a.callback(false);
		});
		break;
	case "container":
		$(a.targetId, top.document).empty();
		b.fadeIn(a.duration,
		function() {
			b.attr("style", b.attr("style").replace("FILTER:", ""))
		});
		break;
	case "frame":
		$(".popContent iframe", top.document).height(a.height);
		$(".popContent iframe", top.document).prop("src", a.pageUrl);
		$("body", top.document).append("<span class='wait'></span>");
		if (!$.support.leadingWhitespace) {
			$(".wait", top.document).show();
			$(".wait", top.document).css({
				top: "50%",
				left: "50%",
				marginTop: document.documentElement.scrollTop - $(".wait").prop("offsetHeight") / 2 + "px",
				marginLeft: document.documentElement.scrollLeft - $(".wait").prop("offsetWidth") / 2 + "px"
			});
			$(window).bind("scroll",
			function() {
				$(".wait", top.document).show();
				$(".wait", top.document).css({
					top: "50%",
					left: "50%",
					marginTop: document.documentElement.scrollTop - $(".wait").prop("offsetHeight") / 2 + "px",
					marginLeft: document.documentElement.scrollLeft - $(".wait").prop("offsetWidth") / 2 + "px"
				})
			})
		}
		$(".popContent iframe", top.document).bind("load",
		function() {
			if (b.attr("isClose") != "1") {
				$(".wait", top.document).hide();
				b.fadeIn(a.duration,
				function() {
					b.attr("style", b.attr("style").replace("FILTER:", ""))
				})
			}
			!$.support.leadingWhitespace && $(window).unbind("scroll").bind("scroll",
			function() {
				if (b.attr("isClose") != "1") {
					b.show();
					b.css({
						top: "50%",
						left: "50%",
						marginTop: document.documentElement.scrollTop - b.prop("offsetHeight") / 2 + "px",
						marginLeft: document.documentElement.scrollLeft - b.prop("offsetWidth") / 2 + "px"
					})
				}
			})
		});
		break;
	default:
		b.fadeIn(a.duration,
		function() {
			b.attr("style", b.attr("style").replace("FILTER:", ""))
		});
		break
	}

	if(!a.showButton){
		clearTimeout(timer);
		timer = setTimeout(function(){
			$(".wait", top.document).hide();
			d.fadeOut(a.duration);
			b.fadeOut(a.duration);
			b.attr("isClose", "1");
			a.type == "container" && $(a.targetId, top.document).empty().append(a.content);
			if (! (!$.support.leadingWhitespace)) {
				$(document).unbind("keyup");
				$(document).unbind("mousemove");
				$(document).unbind("mouseup")
			}
			if (a.callback && typeof a.callback === "function") {
				a.callback();
			}
		},a.hideDuration);
	}
}
function CloseLayer() {
	$(".popTitle .close", top.document).get(0).click();
}
function DragPoP(a, d) {
	var c = false,
	b, g;
	$(".popTitle", top.document).bind("mousedown",
	function(e) {
		if ($(".popMain:visible", top.document).length > 0) {
			c = true;
			b = e.pageX - parseInt($(".popMain", top.document).css("left"), 10);
			g = e.pageY - parseInt($(".popMain", top.document).css("top"), 10);
			$(".popTitle", top.document).css({
				cursor: "move"
			})
		}
	});
	$(document).bind("mousemove",
	function(e) {
		if (c && $(".popMain:visible", top.document).length > 0 && a) {
			d != 1 && $(".popMain", top.document).fadeTo(0, d);
			var f = e.pageX - b;
			e = e.pageY - g;
			if (f < 0) f = 0;
			if (f > $(window).width() - $(".popMain", top.document).width()) f = $(window).width() - $(".popMain", top.document).width() - 2;
			if (e < 0) e = 0;
			if (e > $(window).height() - $(".popMain", top.document).height()) e = $(window).height() - $(".popMain", top.document).height() - 2;
			$(".popMain", top.document).css({
				top: e,
				left: f
			})
		}
	}).bind("mouseup",
	function() {
		if ($(".popMain:visible", top.document).length > 0 && a) {
			c = false;
			d != 1 && $(".popMain", top.document).fadeTo(0, 1);
			$(".popTitle", top.document).css({
				cursor: "auto"
			})
		}
	})
};