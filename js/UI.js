define(function(){

	var UI = function(canvas, _settings){

		var settings = _.defaults(_settings || {},
				{ }),
			_dataEl = $('#data-list'),
			_dataAddrEl = $('#data-addresses'),
			_registersEl = $('#registers'),
			_assemblyEl = $('#assembly'),
			_outputEl = $('#output'),
			registers = {},
			breakpoints = {},
			memoryI = null,
			memoryD = null,
			UI = this;

		
		// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //
		// 				Output
		// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //

		this.output = function(message){
			_outputEl.append( $('<span/>').addClass('message').text( message ) );
		};

		
		// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //
		// 			Assembly Editor
		// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //

		// Hook functionality
		this.onUserAddedBreakpoint = new Function();
		this.onUserClearedBreakpoint = new Function();

		var editor = ace.edit('editor');
		editor.setTheme('ace/theme/chrome');
		editor.getSession().setMode('ace/mode/mips_assembler');

		editor.setReadOnly(true);

		// editor.on('breakpoint', function(e){
		// 	if (breakpoints.hasOwnProperty(e.lineno)) {
		// 		delete breakpoints[e.lineno];
		// 		e.session.clearBreakpoint(e.lineno, 'breakpoint');
		// 		UI.onUserClearedBreakpoint(e.lineno);
		// 	} else {
		// 		breakpoints[e.lineno] = e;
		// 		e.session.setBreakpoint(e.lineno, 'breakpoint');
		// 		UI.onUserAddedBreakpoint(e.lineno);
		// 	}
		// });



		var code = ace.edit('code');
		code.setTheme('ace/theme/chrome');
		code.getSession().setMode('ace/mode/mips_assembler');

		code.on('breakpoint', function(e){
			if (breakpoints.hasOwnProperty(e.lineno)) {
				delete breakpoints[e.lineno];
				e.session.clearBreakpoint(e.lineno, 'breakpoint');
				UI.onUserClearedBreakpoint(e.lineno);
			} else {
				breakpoints[e.lineno] = e;
				e.session.setBreakpoint(e.lineno, 'breakpoint');
				UI.onUserAddedBreakpoint(e.lineno);
			}
		});


		this.getCode = function(){
			var text = code.getValue(),
				instructions = [];

			// trim out the non-code
			text = text.trim().split('\n');
			for (var i=0; i<text.length; ++i) {
				var line = text[i].trim();
				if (/^[01]+$/.test(line) && line.length == 32) {
					instructions.push(line);
				} else {
					console.error("Error with this line: "+line);
					debugger;
				}
			}
			return instructions;
		};

		var highlightedLine = null;
		this.highlightLine = function(lineno){

			if (highlightedLine) {
				code.getSession().removeMarker(highlightedLine);
			}

			highlightedLine = code.getSession().highlightLines(lineno).id;
		};

		
		// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //
		// 			Register Manipulation
		// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //

		// Hook functionality
		this.onUserModifiedRegister = new Function();

		this.initRegisters = function(regList){

			for (var regI in regList) {

				var regName = MIPS.reg_names[regI] || regI;

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
					var newValBits = new Bits(newVal, Bits.kSigned);
					regList[ regI ] = newValBits.toInt();
					$(this).data('safeval', newVal);

				}).data('safeval', 0)
				.data('regName', regName);

				regList[regI].hasChanged = function(){
					var data = Bits.signed(this.val); // FIXME: check this!!
					registers[this.name]._el.val(data.s).data('safeval', data.s);
				};

				registers[regName] = {
					_el: _regValEl
				};
				_registersEl.append( _regEl );
			}
		};

		this.setRegister = function(register, data){
			registers[register]._el.val(data).data('safeval', data);
		};

		
		// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //
		// 			Memory Manipulation
		// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //

		this.onUserModifiedMemory = new Function();

		// Initialize the memory component with blank data elements
		var cellsPerRow = null,
			totalRows = null,
			dataCellHeight = 24,
			dataCellWidth = 80,
			addrStart = 0,
			dataCells = [],
			addressCells = [];
		this.initMemory = function(){

			var height = parseInt(_dataEl.height() / dataCellHeight),
				width  = parseInt(_dataEl.width() / dataCellWidth);
			
			cellsPerRow = width;
			totalRows = height;
			for (var y=0; y<height; ++y) {
				var dataRow = $('<div/>').addClass('data-row');
				for (var x=0; x<width; ++x) {
					var dataCell = $('<div/>').addClass('data-cell')
											.attr('contentEditable', 'true')
											.on('input', function(e){
												var newVal = parseInt( $(this).text().substr(2), 16 ),
													newValHex = newVal.toString(16);

												if (isNaN(newVal) || !(/^(0x)?([0-9a-fA-F]+)$/.test($(this).text())) || $(this).text().length > 10 || $(this).text().substr(0,2) != '0x') {
													var oldVal = $(this).data('safeVal');
													$(this).text('0x' + oldVal);
													return;
												}

												$(this).data('safeVal', newValHex);
												UI.onUserModifiedMemory( $(this).data('address'), Bits.signed(newVal, 32).toInt() );
												UI.setMem( $(this).data('address'), newVal );
											})
											.data('safeVal', '00000000')
											.text('0x00000000')
											.data('address', 0);
					dataRow.append(dataCell);
					dataCells.push(dataCell);
				}
				_dataEl.append(dataRow);

				var dataAddr = $('<div/>').addClass('data-address');
				_dataAddrEl.append(dataAddr);
				addressCells.push(dataAddr);
			}
		};

		this.clearMemory = function(){
			$('.data-row', _dataEl).remove();
			$('.data-address', _dataAddrEl).remove();
			dataCells = [];
			addressCells = [];
		};

		$(window).resize(function(){

			var height = parseInt(_dataEl.height() / dataCellHeight),
				width  = parseInt(_dataEl.width() / dataCellWidth);
			
			// Only re-draw if necessary
			if (height != totalRows || width != cellsPerRow) {
				this.clearMemory();
				this.initMemory();
				this.redrawMemory(addrStart);
			}
		}.bind(this));

		this.mem = function(addr){
			var dataStart = parseInt('10010000', 16),
				textStart = parseInt('00400000', 16),
				defaultMem= '00000000';
			if (addr < 0 || addr > parseInt('ffffffff', 16)) return defaultMem;
			if (addr < textStart) return defaultMem;

			var mem = defaultMem;
			if (addr < dataStart) {
				mem = this.memoryI[addr - textStart] || mem; // FIXME: do we need the textStart offset here?
			} else {
				mem = this.memoryD[addr - dataStart] || mem; // FIXME: do we need the dataStart offset here?
			}

			return ("00000000" + mem.toString(16)).substr(-8);
		};

		this.setMem = function(addr, data){
			var dataStart = parseInt('10010000', 16),
				textStart = parseInt('00400000', 16),
				defaultMem= '00000000';
			if (addr < 0 || addr > parseInt('ffffffff', 16)) return;
			if (addr < textStart) return;
			if (addr < dataStart) {
				this.memoryI[addr - textStart] = data; // FIXME: do we need the textStart offset here?
				return;
			}
			this.memoryD[addr - dataStart] = data; // FIXME: do we need the dataStart offset here?
		};

		this.redrawMemory = function(addressStart){
			addrStart = addressStart;

			var address = addrStart;
			for (var i=0; i<dataCells.length; ++i) {
				// FIXME: confirm memory layout!!
				var dataCell = dataCells[i],
					data = this.mem(address) || "00000000",
					hexVal = data;
					// data0Off = this.memory[address]   || 0,
					// data1Off = this.memory[address+1] || 0,
					// data2Off = this.memory[address+2] || 0,
					// data3Off = this.memory[address+3] || 0,
					// data     = data0Off + (data1Off << 1) + (data2Off << 2) + (data3Off << 3),
					// hexVal   = ("00000000" + data.toString(16)).substr(-8);

				dataCell.text('0x' + hexVal)
						.data('safeVal', hexVal)
						.data('address', address);
				address += 1;
			}

			address = addrStart;
			for (var i=0; i<addressCells.length; ++i) {
				var addressCell = addressCells[i],
					addrHex = ('00000000' + address.toString(16)).substr(-8);
				addressCell.text('0x' + addrHex);
				address += cellsPerRow;
			}
		};

		this.loadMemory = function(memoryRefI, memoryRefD){
			this.memoryI = memoryRefI;
			this.memoryD = memoryRefD;
			this.redrawMemory(parseInt('0x10010000', 16));
		};

		$('#data-index-left').click(function(){
			var address = Math.max(0, addrStart - (totalRows * cellsPerRow));
			this.redrawMemory(address);
			return false;
		}.bind(this));

		$('#data-index-right').click(function(){
			var address = Math.min(parseInt('ffffffff', 16) - (totalRows * cellsPerRow), addrStart + (totalRows * cellsPerRow));
			this.redrawMemory(address);
			return false;
		}.bind(this));

		$('#data-address-index').on('change', function(){
			var option = $(':selected', $(this)),
				address = parseInt(option.attr('address'), 16);
			UI.redrawMemory(address);
		});

		// TODO: option for data-index stack/gp


		this.initMemory();
	};

	return UI;
});
