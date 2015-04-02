var ass_in = {
	mux2: {dimensions: {width:13,height:32}, file: '2mux.png'},
	mux3: {dimensions: {width:13,height:32}, file: '3mux.png'},
	mux4: {dimensions: {width:13,height:32}, file: '4mux.png'},

	adder: {dimensions: {width:19,height:36}, file: 'adder.png'},
	alu: {dimensions: {width:30,height:60}, file: 'alu.png'},
	and: {dimensions: {width:18,height:16}, file: 'and.png'},
	ctrl: {dimensions: {width:72,height:119}, file: 'control_unit.png'},
	dmem: {dimensions: {width:69,height:65}, file: 'datamem.png'},
	exmem: {dimensions: {width:23,height:355}, file: 'ex_mem.png'},
	extend: {dimensions: {width:46,height:20}, file: 'extend.png'},
	idex: {dimensions: {width:23,height:355}, file: 'id_ex.png'},
	ifid: {dimensions: {width:23,height:189}, file: 'if_id.png'},
	imem: {dimensions: {width:68,height:57}, file: 'instrmem.png'},
	left: {dimensions: {width:31,height:14}, file: 'left.png'},
	memwb: {dimensions: {width:23,height:355}, file: 'mem_wb.png'},
	pc: {dimensions: {width:38,height:25}, file: 'pc.png'},
	pc4_add: {dimensions: {width:25,height:49}, file: 'pc4_adder.png'},
	reg: {dimensions: {width:81,height:102}, file: 'regfile.png'},
	split: {dimensions: {width:4,height:5}, file: 'split_dup.png'},
	dup: {dimensions: {width:4,height:5}, file: 'split_dup.png'},
	splice: {dimensions: {width:4,height:5}, file: 'split_dup.png'}
};

function c_add(Canvas, comp, x, y, ass) {
	Canvas.addComponent(comp, 0, {position: {x: x, y: y}, dimensions: ass_in[ass].dimensions, asset: {id: ass,  file: ass_in[ass].file}});
}

function c_wire(Canvas, wire) {
	Canvas.addWire(wire);
}


function buildMIPS(c) {
	var pc_bmux = new Mux(14);
	var pc_jmux = new Mux(13);
	var pc_jrmux = new Mux(12);
	var pc = new PC(10);
	var pc_d1 = new Dup(0);

	window['pc'] = pc;

	c_add(c, pc_bmux, 20, 166, 'mux2');
	c_add(c, pc_jmux, 38, 173, 'mux2');
	c_add(c, pc_jrmux, 56, 180, 'mux2');
	c_add(c, pc, 78, 184, 'pc');
	c_add(c, pc_d1, 128, 194, 'dup');
	
	var pc_adder = new Adder4_32(15);
	var pc_adder_d1 = new Dup(0);

	c_add(c, pc_adder, 143, 328, 'pc4_add');
	c_add(c, pc_adder_d1, 190, 350, 'dup');

	var instr_mem = new IMem(11);
	c_add(c, instr_mem, 146, 168, 'imem');

	var ifid = new IF_ID(10);
	ifid.ctrl.priority = 37;
	ifid.data.priority = 22;

	window['ifid'] = ifid;

	var ifid_s1 = new Splitter(0, [
		[31, 26],  /* opcode for control unit */
		[5, 0],    /* funct for ALU control */
		[25, 21],  /* Read Register 1 */
		[20, 16],  /* Read Register 2 */
		[25, 21],  /* Rs */
		[20, 16],  /* Rt */
		[15, 11],  /* Rd */
		[15, 0],   /* immediate */
		[25, 0]    /* jump addr */
	]);
	c_add(c, ifid, 234, 184, 'ifid');
	c_add(c, ifid_s1, 270, 194, 'split');

	var pc4_s1 = new Splitter(0, [[31, 0], [31, 28]]);
	var j_shift = new ShiftLeft2_26(17);
	var j_splice = new Splicer(0);
	c_add(c, pc4_s1, 266, 350, 'split');
	c_add(c, j_shift, 280, 397, 'left');
	c_add(c, j_splice, 266, 402, 'splice');

	var rs_hz_d1 = new Dup(0);
	var rt_hz_d1 = new Dup(0);
	c_add(c, rs_hz_d1, 431, 291, 'dup');
	c_add(c, rt_hz_d1, 441, 298, 'dup');

	var ext = new Ext32(17);
	c_add(c, ext, 337, 322, 'extend');

	var reg = new Reg(17);
	var r0_dup = new Dup(0);
	var r0_mux1 = new Mux(16);
	var r0_fwwb_mux = new Mux(15);
	var r1_fwwb_mux = new Mux(15);
	var r01_fwwb_d1 = new Dup(0);
	c_add(c, reg, 308, 180, 'reg');
	c_add(c, r0_dup, 393, 187, 'dup');
	c_add(c, r0_mux1, 406, 183, 'mux4');
	c_add(c, r0_fwwb_mux, 425, 190, 'mux2');
	c_add(c, r1_fwwb_mux, 425, 230, 'mux2');
	c_add(c, r01_fwwb_d1, 418, 250, 'dup');
	
	
	var fwwb_d1 = new Splitter(0, [[63, 0], [31, 0]]);
	c_add(c, fwwb_d1, 417, 402, 'split');
	
	var ctrl = new Ctrl(30);
	var alusrc0_d1 = new Dup(0);
	c_add(c, ctrl, 338, 24, 'ctrl');
	c_add(c, alusrc0_d1, 412, 120, 'dup');

	var idex = new ID_EX(10);
	idex.ctrl.priority = 38;
	idex.data.priority = 23;
	c_add(c, idex, 453, 19, 'idex');

	window['idex'] = idex;

	var rt_d = new Dup(0);
	var rw_mux = new Mux(18);
	c_add(c, rt_d, 490, 298, 'dup');
	c_add(c, rw_mux, 502, 291, 'mux3');

	var fwwb_d2 = new Splitter(0, [[63, 0], [31, 0]]);	
	var r01_fwwb_d2 = new Dup(0);
	var r01_fwmem_d1 = new Dup(0);
	c_add(c, fwwb_d2, 518, 402, 'split');
	c_add(c, r01_fwwb_d2, 518, 233, 'dup');
	c_add(c, r01_fwmem_d1, 524, 240, 'dup');
	
	var r0_mux2 = new Mux(18);
	var r0_mux3 = new Mux(17);
	var r0i_d1 = new Dup(0);
	c_add(c, r0_mux2, 529, 187, 'mux3');
	c_add(c, r0_mux3, 570, 190, 'mux2');
	c_add(c, r0i_d1, 562, 236, 'dup');
	
	var r1_mux1 = new Mux(18);
	var r1_d1 = new Dup(0);
	c_add(c, r1_mux1, 542, 220, 'mux3');
	c_add(c, r1_d1, 556, 230, 'dup');
	
	var r1_mux2 = new Mux(17);
	c_add(c, r1_mux2, 582, 223, 'mux3');

	var alu = new ALU(16);
	c_add(c, alu, 602, 189, 'alu');

	var b_and = new ANDGate(15);
	c_add(c, b_and, 640, 196, 'and');

	var imm_d1 = new Dup(0);
	var pc4_d1 = new Dup(0);
	var imm_shift = new ShiftLeft2_32(16);
	var b_adder = new Adder32(15);
	c_add(c, imm_d1, 562, 331, 'dup');
	c_add(c, pc4_d1, 566, 350, 'dup');
	c_add(c, imm_shift, 576, 326, 'left');
	c_add(c, b_adder, 613, 325, 'adder');
	
	var exmem = new EX_MEM(10);
	exmem.ctrl.priority = 39;
	exmem.data.priority = 24;
	c_add(c, exmem, 666, 19, 'exmem');

	window['exmem'] = exmem;

	var aout_s1 = new Splitter(0, [[31, 0], [63, 0]]);
	var aout_s2 = new Splitter(0, [[31, 0], [63, 0]]);
	c_add(c, aout_s1, 701, 217, 'split');
	c_add(c, aout_s2, 701, 288, 'split');
	
	var mem = new DMem(15);
	c_add(c, mem, 714, 207, 'dmem');

	var wr_dup1 = new Dup(0);
	c_add(c, wr_dup1, 768, 308, 'dup');

	var memwb = new MEM_WB(10);
	memwb.ctrl.priority = 40;
	memwb.data.priority = 25;
	c_add(c, memwb, 807, 19, 'memwb');

	window['memwb'] = memwb;

	var wr_dup2 = new Dup(0);
	c_add(c, wr_dup2, 840, 416, 'dup');
	
	var wrdata_mux = new Mux(20);
	c_add(c, wrdata_mux, 849, 211, 'mux2');

	/* Connect the muxes infront of the PC */
	c.addWire(Wire.connect32([pc_adder_d1, 1], [pc_bmux, 1], [{x:192,y:352}, {x:192, y:378}, {x:0,y:378},{x:0,y:175},{x:22,y:175}]));
	c.addWire(Wire.connect32([b_adder, 0], [pc_bmux, 2], [{x:629,y:342},{x:641,y:342},{x:641,y:392},{x:13,y:392},{x:13,y:188},{x:23,y:188}]));

	c.addWire(Wire.connect32([pc_bmux, 0], [pc_jmux, 1], [{x:31,y:182},{x:40,y:182}]));
	c.addWire(Wire.connect32([j_splice, 0], [pc_jmux, 2], [{x:268,y:404},{x:33,y:404},{x:33,y:195},{x:40,y:195}]));

	c.addWire(Wire.connect32([pc_jmux, 0], [pc_jrmux, 1], [{x:48,y:189},{x:58,y:189}]));
	c.addWire(Wire.connect32([r0_dup, 1], [pc_jrmux, 2], [{x:394,y:189},{x:394,y:431},{x:52,y:431},{x:52,y:202},{x:58,y:202}]));

	/* Connect the PC */
	c.addWire(Wire.connect32([pc_jrmux, 0], [pc, PC.In.kAddr], [{x:66,y:196},{x:80,y:196}]));
	c.addWire(Wire.connect32([pc, 0], [pc_d1, 0], [{x:113,y:196},{x:130,y:196}]));
	c.addWire(Wire.connect32([pc_d1, 0], [instr_mem, 0], [{x:130,y:196},{x:147,y:196}]));
	c.addWire(Wire.connect32([pc_d1, 1], [pc_adder, 0], [{x:130,y:196},{x:130,y:339}, {x:144,y:339}]));
	c.addWire(Wire.connectConst(0, [pc, PC.In.kStall], 1, [{x:88,y:200},{x:100,y:200}]));
	//c.addWire(Wire.connect32([hazard, ...], [pc, PC.In.kStall]));

	/* Connect the PC adder */
	c.addWire(Wire.connect32([pc_adder, 0], [pc_adder_d1, 0], [{x:164,y:352},{x:192,y:352}]));
	c.addWire(Wire.connect32([pc_adder_d1, 0], [ifid.data, IF_ID.D.kPCPlus4], [{x:192,y:352},{x:235,y:352}]));

	/* Connect the Instruction memory */
	c.addWire(Wire.connect32([instr_mem, 0], [ifid.data, IF_ID.D.kInstr], [{x:211,y:196},{x:235,y:196}]));

	/* Connect PC Plus 4 in ID stage */
	c.addWire(Wire.connect32([ifid.data, IF_ID.D.kPCPlus4], [pc4_s1, 0], [{x:254,y:352},{x:268,y:352}]));
	c.addWire(Wire.connect32([pc4_s1, 0], [idex.data, ID_EX.D.kPCPlus4], [{x:268,y:352},{x:454,y:352}]));
	c.addWire(Wire.connect([pc4_s1, 1], [j_splice, 0], 4, [{x:268,y:352},{x:268,y:404}]));

	/* Connect the instruction bits */
	c.addWire(Wire.connect32([ifid.data, IF_ID.D.kInstr], [ifid_s1, 0], [{x:254,y:196},{x:272,y:196}]));
	c.addWire(Wire.connect([ifid_s1, 0], [ctrl, Ctrl.In.kOpcode], 6, [{x:272,y:196},{x:272,y:79},{x:340,y:79}]));
	c.addWire(Wire.connect([ifid_s1, 1], [ctrl, Ctrl.In.kFunct], 6, [{x:272,y:196},{x:272,y:92},{x:340,y:92}]));
	c.addWire(Wire.connect([ifid_s1, 2], [reg, Reg.In.kReadReg0], 5, [{x:272,y:196},{x:309,y:196}]));
	c.addWire(Wire.connect([ifid_s1, 3], [reg, Reg.In.kReadReg1], 5, [{x:272,y:196},{x:272,y:228},{x:310,y:228}]));
	c.addWire(Wire.connect([ifid_s1, 4], [rs_hz_d1, 0], 5, [{x:272,y:196},{x:272,y:293},{x:432,y:293}]));
	c.addWire(Wire.connect([ifid_s1, 5], [rt_hz_d1, 0], 5, [{x:272,y:196},{x:272,y:300},{x:442,y:300}]));
	c.addWire(Wire.connect([ifid_s1, 6], [idex.data, ID_EX.D.kRd], 5, [{x:272,y:196},{x:272,y:307},{x:454,y:307}]));
	c.addWire(Wire.connect([ifid_s1, 7], [ext, 0], 16, [{x:272,y:196},{x:272,y:332},{x:338,y:332}]));
	c.addWire(Wire.connect([ifid_s1, 8], [j_shift, 0], 26, [{x:272,y:196},{x:272,y:332},{x:319,y:332},{x:319,y:404},{x:309,y:404}]));

	/* Connect the jump shift */
	 c.addWire(Wire.connect([j_shift, 0], [j_splice, 1], 28, [{x:282,y:404},{x:268,y:404}]));

	/* Connect the extender */
	 c.addWire(Wire.connect32([ext, 0], [idex.data, ID_EX.D.kImmediate], [{x:379,y:332},{x:454,y:332}]));

	/* Connect register output */
	 c.addWire(Wire.connect32([reg, Reg.Out.kReg0], [r0_mux1, 1], [{x:386,y:189},{x:408,y:189}]));
	 c.addWire(Wire.connectConst32(0, [r0_mux1, 2], [{x:399,y:195},{x:408,y:195}]));
	 c.addWire(Wire.connect32([reg, Reg.Out.kLo], [r0_mux1, 3], [{x:386,y:202},{x:408,y:202}]));
	 c.addWire(Wire.connect32([reg, Reg.Out.kHi], [r0_mux1, 4], [{x:386,y:208},{x:408,y:208}]));

	 c.addWire(Wire.connect32([r0_mux1, 0], [r0_fwwb_mux, 1], [{x:416,y:198},{x:427,y:198}]));
	 c.addWire(Wire.connect32([r01_fwwb_d1, 0], [r0_fwwb_mux, 2], [{x:419,y:252},{x:419,y:212},{x:427,y:212}]));
	 c.addWire(Wire.connect32([r0_fwwb_mux, 0], [idex.data, ID_EX.D.kReg0], [{x:435,y:205},{x:454,y:205}]));
	
	 c.addWire(Wire.connect32([reg, Reg.Out.kReg1], [r1_fwwb_mux, 1], [{x:386,y:239},{x:427,y:239}]));
	 c.addWire(Wire.connect32([r01_fwwb_d1, 1], [r1_fwwb_mux, 2], [{x:419,y:252},{x:428,y:252}]));
	 c.addWire(Wire.connect32([r1_fwwb_mux, 0], [idex.data, ID_EX.D.kReg1], [{x:435,y:246},{x:454,y:246}]));

	/* Connect Rs and Rd duplicators */
	 c.addWire(Wire.connect([rs_hz_d1, 0], [idex.data, ID_EX.D.kRs], 5, [{x:432,y:293},{x:454,y:293}]));
	//c.addWire(Wire.connect([rs_hz_d1, 1], [hazard, ...], 5));
	 c.addWire(Wire.connect([rt_hz_d1, 0], [idex.data, ID_EX.D.kRt], 5, [{x:442,y:300},{x:454,y:300}]));
	//c.addWire(Wire.connect([rt_hz_d1, 1], [hazard, ...], 5));

	 /* Connect control signals for ID stage */
	 c.addWire(Wire.connect([ctrl, Ctrl.kRegWrite], [idex.ctrl, Ctrl.kRegWrite], 2, [{x:407,y:32},{x:454,y:32}]));
	 c.addWire(Wire.connect([ctrl, Ctrl.kMemToReg], [idex.ctrl, Ctrl.kMemToReg], 1, [{x:407,y:42},{x:454,y:42}]));
	 c.addWire(Wire.connect([ctrl, Ctrl.kMemWrite], [idex.ctrl, Ctrl.kMemWrite], 1, [{x:407,y:52},{x:454,y:52}]));
	 c.addWire(Wire.connect([ctrl, Ctrl.kMemCtrl], [idex.ctrl, Ctrl.kMemCtrl], 3, [{x:407,y:62},{x:454,y:62}]));
	 c.addWire(Wire.connect([ctrl, Ctrl.kBranch], [idex.ctrl, Ctrl.kBranch], 1, [{x:407,y:72},{x:454,y:72}]));
	 c.addWire(Wire.connect([ctrl, Ctrl.kALUCtrl], [idex.ctrl, Ctrl.kALUCtrl], 5, [{x:407,y:82},{x:454,y:82}]));
	 c.addWire(Wire.connect([ctrl, Ctrl.kALUSrc1], [idex.ctrl, Ctrl.kALUSrc1], 2, [{x:407,y:92},{x:454,y:92}]));
	 c.addWire(Wire.connect([ctrl, Ctrl.kALUSrc0I], [idex.ctrl, Ctrl.kALUSrc0I], 1, [{x:407,y:102},{x:454,y:102}]));
	 c.addWire(Wire.connect([ctrl, Ctrl.kRegDest], [idex.ctrl, Ctrl.kRegDest], 2, [{x:407,y:112},{x:454,y:112}]));
	 c.addWire(Wire.connect([ctrl, Ctrl.kALUSrc0], [alusrc0_d1, 0], 2, [{x:407,y:122},{x:432,y:122}]));
	 c.addWire(Wire.connect([alusrc0_d1, 0], [idex.ctrl, Ctrl.kALUSrc0], 2, [{x:432,y:122},{x:454,y:122}]));
	 c.addWire(Wire.connect([alusrc0_d1, 1], [r0_mux1, 0], 2, [{x:414,y:122},{x:414,y:194}]));

	 c.addWire(Wire.connect([ctrl, Ctrl.kJump], [pc_jmux, 0], 1, [{x:339,y:47},{x:45,y:47},{x:45,y:181}]));
	 c.addWire(Wire.connect([ctrl, Ctrl.kJumpR], [pc_jrmux, 0], 1, [{x:343,y:60},{x:63,y:62},{x:63,y:184}]));
	 c.addWire(Wire.connect([ctrl, Ctrl.kExtendCtrl], [ext, Ext32.In.kCtrl], 1, [{x:339,y:129},{x:303,y:129},{x:303,y:327},{x:338,y:327}]));

	/* Connect forwarding for EX stage */
	 c.addWire(Wire.connect32([fwwb_d1, 1], [r01_fwwb_d1, 0], [{x:419,y:404},{x:419,y:253}]));
	 c.addWire(Wire.connect64([fwwb_d1, 0], [reg, Reg.In.kWriteData], [{x:419,y:404},{x:359,y:404},{x:359,y:357},{x:294,y:357},{x:294,y:261},{x:309,y:261}]));

	/* Connect control signals for EX stage */
	 c.addWire(Wire.connect([idex.ctrl, Ctrl.kRegWrite], [exmem.ctrl, Ctrl.kRegWrite], 2, [{x:472,y:32},{x:667,y:32}]));
	c.addWire(Wire.connect([idex.ctrl, Ctrl.kMemToReg], [exmem.ctrl, Ctrl.kMemToReg], 1, [{x:472,y:42},{x:667,y:42}]));
	c.addWire(Wire.connect([idex.ctrl, Ctrl.kMemWrite], [exmem.ctrl, Ctrl.kMemWrite], 1, [{x:472,y:52},{x:667,y:52}]));
	c.addWire(Wire.connect([idex.ctrl, Ctrl.kMemCtrl], [exmem.ctrl, Ctrl.kMemCtrl], 3, [{x:472,y:62},{x:667,y:62}]));

	 c.addWire(Wire.connect([idex.ctrl, Ctrl.kBranch], [b_and, 0], 1, [{x:472,y:72},{x:635,y:72},{x:635,y:200},{x:641,y:200}]));
	 c.addWire(Wire.connect([idex.ctrl, Ctrl.kALUCtrl], [alu, ALU.In.kALUCtrl], 5, [{x:472,y:82},{x:616,y:82},{x:616,y:195}]));
	 c.addWire(Wire.connect([idex.ctrl, Ctrl.kALUSrc1], [r1_mux2, 0], 2, [{x:472,y:92},{x:590,y:92},{x:590,y:227}]));
	 c.addWire(Wire.connect([idex.ctrl, Ctrl.kALUSrc0I], [r0_mux3, 0], 1, [{x:472,y:102},{x:577,y:102},{x:577,y:196}]));
	 c.addWire(Wire.connect([idex.ctrl, Ctrl.kRegDest], [rw_mux, 0], 2, [{x:472,y:112},{x:509,y:112},{x:509,y:300}]));
	//c.addWire(Wire.connect([idex.ctrl, Ctrl.kALUSrc0], [hazard, ...], 2, [{x:472,y:122},{x:499,y:122},{x:499,y:452}]));

	/* Connect the ALU inputs */
	 c.addWire(Wire.connect32([idex.data, ID_EX.D.kReg0], [r0_mux2, 1], [{x:473,y:196},{x:530,y:196}]));
	 c.addWire(Wire.connect32([r01_fwwb_d2, 0], [r0_mux2, 2], [{x:520,y:234},{x:520,y:202},{x:530,y:202}]));
	 c.addWire(Wire.connect32([r01_fwmem_d1, 0], [r0_mux2, 3], [{x:525,y:241},{x:525,y:209},{x:530,y:209}]));
	 c.addWire(Wire.connect32([r0i_d1, 0], [r0_mux3, 2], [{x:564,y:238},{x:564,y:212},{x:571,y:212}]));
	 c.addWire(Wire.connect32([r0_mux2, 0], [r0_mux3, 1], [{x:540,y:198},{x:571,y:198}]));
	 c.addWire(Wire.connect32([r0_mux3, 0], [alu, ALU.In.kIn0], [{x:579,y:199},{x:604,y:199}]));
	
	 c.addWire(Wire.connect32([idex.data, ID_EX.D.kReg1], [r1_mux1, 1], [{x:473,y:229},{x:543,y:229}]));
	 c.addWire(Wire.connect32([r01_fwwb_d2, 1], [r1_mux1, 2], [{x:520,y:235},{x:545,y:235}]));
	 c.addWire(Wire.connect32([r01_fwmem_d1, 1], [r1_mux1, 3], [{x:525,y:242},{x:544,y:242}]));
	 c.addWire(Wire.connect32([r1_mux1, 0], [r1_d1, 0], [{x:552,y:232},{x:557,y:232}]));
	 c.addWire(Wire.connect32([r1_d1, 0], [r1_mux2, 1], [{x:557,y:232},{x:584,y:232}]));
	 c.addWire(Wire.connect32([imm_d1, 1], [r0i_d1, 0], [{x:564,y:332},{x:564,y:238}]));
	 c.addWire(Wire.connect32([r0i_d1, 1], [r1_mux2, 2], [{x:564,y:238},{x:584,y:238}]));
	 c.addWire(Wire.connect32([pc4_d1, 1], [r1_mux2, 3], [{x:568,y:352},{x:568,y:245},{x:584,y:245}]));
	 c.addWire(Wire.connect32([r1_mux2, 0], [alu, ALU.In.kIn1], [{x:592,y:238},{x:604,y:238}]));

	/* Connect the PC4 branch adder */
	 c.addWire(Wire.connect32([idex.data, ID_EX.D.kImmediate], [imm_d1, 0], [{x:472,y:332},{x:562,y:332}]));
	 c.addWire(Wire.connect32([imm_d1, 0], [imm_shift, 0], [{x:562,y:332},{x:577,y:332}]));
	 c.addWire(Wire.connect32([imm_shift, 0], [b_adder, 0], [{x:603,y:332},{x:615,y:332}]));
	 c.addWire(Wire.connect32([idex.data, ID_EX.D.kPCPlus4], [pc4_d1, 0], [{x:473,y:352},{x:566,y:352}]));
	 c.addWire(Wire.connect32([pc4_d1, 0], [b_adder, 1], [{x:566,y:352},{x:614,y:352}]));

	/* Connect the Write Register mux */
	//c.addWire(Wire.connect([idex.data, ID_EX.D.kRs], [hazard, ...], 5, [{x:472,y:293},{x:483,y:293},{x:483,y:452}));
	 c.addWire(Wire.connect([idex.data, ID_EX.D.kRt], [rt_d, 0], 5, [{x:473,y:300},{x:492,y:300}]));
	 c.addWire(Wire.connect([rt_d, 0], [rw_mux, 1], 5, [{x:492,y:300},{x:504,y:300}]));
	//c.addWire(Wire.connect([rt_d, 1], [hazard, ...], 5, [{x:492,y:300},{x:492,y:452}]));
	 c.addWire(Wire.connect([idex.data, ID_EX.D.kRd], [rw_mux, 2], 5, [{x:473,y:307},{x:504,y:307}]));
	 c.addWire(Wire.connectConst(31, [rw_mux, 3], 5, [{x:479,y:314},{x:504,y:314}]));
	 c.addWire(Wire.connect([rw_mux, 0], [exmem.data, EX_MEM.D.kWriteReg], 5, [{x:512,y:308},{x:668,y:308}]));

	/* Connect forwarding for EX stage */
	 c.addWire(Wire.connect32([fwwb_d2, 1], [r01_fwwb_d2, 0], [{x:520,y:404},{x:520,y:234}]));
	 c.addWire(Wire.connect64([fwwb_d2, 0], [fwwb_d1, 0], [{x:520,y:404},{x:419,y:404}]));

	/* Connect write data */
	 c.addWire(Wire.connect32([r1_d1, 1], [exmem.data, EX_MEM.D.kWriteData], [{x:558,y:231},{x:558,y:257},{x:667,y:257}]));

	/* Connect ALU outputs and branch */
	 c.addWire(Wire.connect([alu, ALU.Out.kZero], [b_and, 1], 1, [{x:629,y:206},{x:642,y:206}]));
	 c.addWire(Wire.connect([b_and, 0], [pc_bmux, 0], 1, [{x:654,y:203},{x:662,y:203},{x:662,y:4},{x:27,y:4},{x:27,y:174}]));
	 c.addWire(Wire.connect64([alu, ALU.Out.kResult], [exmem.data, EX_MEM.D.kALUResult],[{x:629,y:219},{x:667,y:219}]));

	/* Connect control signals for MEM Stage */
	 c.addWire(Wire.connect([exmem.ctrl, Ctrl.kRegWrite], [memwb.ctrl, Ctrl.kRegWrite], 2, [{x:685,y:32},{x:809,y:32}]));
				  c.addWire(Wire.connect([exmem.ctrl, Ctrl.kMemToReg], [memwb.ctrl, Ctrl.kMemToReg], 1, [{x:685,y:42},{x:809,y:42}]));
	 c.addWire(Wire.connect([exmem.ctrl, Ctrl.kMemWrite], [mem, DMem.In.kMemWrite], 1, [{x:685,y:52},{x:754,y:52}, {x:754,y:209}]));
	 c.addWire(Wire.connect([exmem.ctrl, Ctrl.kMemCtrl], [mem, DMem.In.kMemCtrl], 3, [{x:685,y:62},{x:738,y:62},{x:738,y:209}]));

	/* Connect memory */
	 c.addWire(Wire.connect64([exmem.data, EX_MEM.D.kALUResult], [aout_s1, 0], [{x:685,y:219},{x:703,y:219}]));
	 c.addWire(Wire.connect32([aout_s1, 0], [mem, DMem.In.kAddr], [{x:703,y:219},{x:716,y:219}]));
	 c.addWire(Wire.connect64([aout_s1, 1], [aout_s2, 0], [{x:703,y:219},{x:703,y:289}]));
	 c.addWire(Wire.connect32([aout_s2, 0], [r01_fwmem_d1, 0], [{x:703,y:289},{x:703,y:397},{x:525,y:397},{x:525,y:241}]));
	 c.addWire(Wire.connect64([aout_s2, 1], [memwb.data, MEM_WB.D.kALUOut], [{x:703,y:290},{x:808,y:290}]));
	 c.addWire(Wire.connect32([exmem.data, EX_MEM.D.kWriteData], [mem, DMem.In.kWriteData], [{x:685,y:258},{x:716,y:258}]));

	 c.addWire(Wire.connect64([mem, DMem.Out.kReadData], [memwb.data, MEM_WB.D.kReadData], [{x:779,y:240},{x:809,y:240}]));

	 c.addWire(Wire.connect([exmem.data, EX_MEM.D.kWriteReg], [wr_dup1, 0], 5, [{x:685,y:310},{x:769,y:310}]));
	 c.addWire(Wire.connect([wr_dup1, 0], [memwb.data, MEM_WB.D.kWriteReg], 5, [{x:769,y:310},{x:809,y:310}]));
	//c.addWire(Wire.connect([wr_dup1, 1], [hazard, ...], 5, [{x:769,y:310},{x:769,y:452}]));

	/* Connect signals for WB stage */
	 c.addWire(Wire.connect([memwb.ctrl, Ctrl.kRegWrite], [reg, Reg.In.kRegWrite], 2, [{x:826,y:32},{x:865,y:32},{x:865,y:12},{x:325,y:12},{x:325,y:183}]));
	 c.addWire(Wire.connect([memwb.ctrl, Ctrl.kMemToReg], [wrdata_mux, 0], 3, [{x:826,y:42},{x:856,y:42},{x:856,y:216}]));

	/* Connect Everything else */
	 c.addWire(Wire.connect64([memwb.data, MEM_WB.D.kReadData], [wrdata_mux, 2], [{x:826,y:219},{x:851,y:219}]));
	 c.addWire(Wire.connect64([memwb.data, MEM_WB.D.kALUOut], [wrdata_mux, 1], [{x:826,y:290},{x:838,y:290},{x:838,y:233},{x:851,y:233}]));
	 c.addWire(Wire.connect64([wrdata_mux, 0], [fwwb_d2, 0], [{x:859,y:225},{x:869,y:225},{x:869,y:404},{x:520,y:404}]));

	 c.addWire(Wire.connect([memwb.data, MEM_WB.D.kWriteReg], [wr_dup2, 0], 5, [{x:826,y:310},{x:842,y:310},{x:842,y:418}]));
	//c.addWire(Wire.connect([wr_dup2, 0], [hazard, ...], 5));
	 c.addWire(Wire.connect([wr_dup2, 1], [reg, Reg.In.kWriteReg], 5, [{x:842,y:418},{x:339,y:418},{x:339,y:367},{x:284,y:367},{x:284,y:248},{x:310,y:248}]));

	MIPS.queue.insert(pc);
	MIPS.queue.insert(ifid);
	MIPS.queue.insert(idex);
	MIPS.queue.insert(exmem);
	MIPS.queue.insert(memwb);
}












