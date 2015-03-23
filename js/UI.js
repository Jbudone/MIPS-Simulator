define(function(){

	var UI = function(canvas, _settings){

		var settings = _.defaults(_settings || {},
				{ }),
			_dataEl = $('#data'),
			_registersEl = $('#registers'),
			_assemblyEl = $('#assembly'),
			registers = {},
			UI = this;

		
		// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //
		// 			Data Manipulation
		// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //

		// Hook functionality
		this.onUserModifiedRegister = new Function();

		this.initRegisters = function(regList){
			if (!(regList instanceof Array)) throw new Error("Provided argument is not an array");
			
			for (var i=0; i<regList.length; ++i) {
				var regName = regList[i];

				var _regValEl = $('<input/>').attr('type', 'text')
											.addClass('register-value')
											.val( 0 ),
					_regEl = $('<div/>').addClass('register')
										.append( $('<div/>').addClass('register-name').text( regName ) )
										.append( $('<div/>').addClass('register-value-container')
															.append( _regValEl ) );

				// Allow user to edit registers here
				_regValEl.on('input', function(){
					
					var newVal = $(this).val();
					if (isNaN(newVal) || parseInt(newVal) != newVal) {
						$(this).val( $(this).data('safeval') );
						return;
					}

					newVal = parseInt(newVal);
					UI.onUserModifiedRegister( $(this).data('regName'), newVal );
					$(this).data('safeval', newVal);

				}).data('safeval', 0)
				.data('regName', regName);

				registers[regName] = {
					_el: _regValEl
				};
				_registersEl.append( _regEl );
			}
		};

		this.setRegister = function(register, data){
			registers[register]._el.val(data).data('safeval', data);
		};

		this.setMemory = function(address, data){

		};
	};

	return UI;
});
