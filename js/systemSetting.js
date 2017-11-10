var topFrame = top,
	topDoc = topFrame.document;

var CONFIG 	= iHomed( "config" ),
	SYSTEMID= CONFIG.systemid,
	TOKEN	= iHomed.data( "token" ),
	SYSTEM_PARAMS = iHomed.data( "systemParameter" );

var $paramInputs = $( '#systemParameter input' );

var Parameter = {
	/**
	 * 设置参数id与页面上按钮的映射
	 * @type {Object}
	 */
	map: {
		"26001": $paramInputs.filter( 'input[name="labelSwitch"]' ),
	},
	/**
	 * 获取系统参数设置
	 * @return 无
	 */
	get: function( ) {
		var self = this;

		var option = {
            url: "post_get_parameter",
            type: "POST",
            data: {
				accesstoken	: TOKEN,
				systemid	: SYSTEMID
			},
            success: function ( data ) {
                if ( data.ret == 0 ) {
					
					var plist = data.parameterlist || [];

					self.list = plist;

					self.update( plist );

                } else {

                    option.error();
					
                }
            },
            error: function () {

                if( !self.list )self.list = [];
                
            }
        };

        // 请求剧集数据
        iHomed( "getData", option );
	},

	update: function( plist ) {
		var map = this.map;

		plist = plist || [];

		$paramInputs.prop( "checked", false );

		for ( var i = 0, len = plist.length; i < len; ++i ) {
			var p = plist[ i ],
				id = p.id,
				$input = map[id];

			SYSTEM_PARAMS[ id ] = p.value;

			if ( $input ) {
				$input.filter( '[value="' + p.value + '"]' ).prop( "checked", true );
			}
		}
	},

	set: function( params ) {
		var self = this,
			list = self.list;

		var setData = {
			accesstoken: TOKEN,
			systemid: SYSTEMID,
			parameter_list: [],
		};

		for ( var i = 0, len = list.length; i < len; ++i ) {
			var id = list[i].id,
				value = params[id] || list[i].value;

			delete params[id];

			setData.parameter_list.push( {
				id: id,
				value: value
			} );
		}

		if ( !$.isEmptyObject( params ) ) {
			$.each( params, function( i, val ) {
				setData.parameter_list.push( {
					id: i,
					value: val
				} );
			} );
		}

		$.ajax( {
            url: iHomed( "api", "post_set_parameter" ),
            type: "POST",
            data: JSON.stringify( setData ),
            success: function ( data ) {
                if ( data.ret == 0 ) {
					
					self.list = setData.parameter_list;

                } else {

                    $.alert( "设置系统参数失败" );
					
                }
            },
            error: function () {
                $.alert( "设置系统参数失败" );
            },
            complete: function () {
            	self.update( self.list );
            }
        } );
	},
}



$(document).ready(function(e) {
    Parameter.get();
	
	$("body")
    .on( "change", "#systemParameter input", function( e ) {
    	var $this = $( this ),
    		id = $this.data( "id" ),
    		value = $this.val(),
    		params = {};

    	params[ id ] = value;

    	Parameter.set( params );
    } );
});