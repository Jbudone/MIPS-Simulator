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

	c_add(c, pc_bmux, 21, 167, 'mux2');
	c_add(c, pc_jmux, 38, 174, 'mux2');
	c_add(c, pc_jrmux, 56, 181, 'mux2');
	c_add(c, pc, 78, 184, 'pc');
	c_add(c, pc_d1, 129, 194, 'dup');
	
	var pc_adder = new Adder4_32(15);
	var pc_adder_d1 = new Dup(0);

	c_add(c, pc_adder, 143, 329, 'pc4_add');
	c_add(c, pc_adder_d1, 191, 351, 'dup');

	var instr_mem = new IMem(11);
	c_add(c, instr_mem, 146, 169, 'imem');

	var ifid = new IF_ID(10);
	ifid.ctrl.priority = 37;
	ifid.data.priority = 22;
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
	c_add(c, ifid_s1, 271, 195, 'split');

	var pc4_s1 = new Splitter(0, [[31, 0], [31, 28]]);
	var j_shift = new ShiftLeft2_26(17);
	var j_splice = new Splicer(0);
	c_add(c, pc4_s1, 267, 350, 'split');
	c_add(c, j_shift, 281, 398, 'left');
	c_add(c, j_splice, 267, 403, 'splice');

	var rs_hz_d1 = new Dup(0);
	var rt_hz_d1 = new Dup(0);
	c_add(c, rs_hz_d1, 431, 299, 'dup');
	c_add(c, rt_hz_d1, 441, 292, 'dup');

	var ext = new Ext32(17);
	c_add(c, ext, 337, 324, 'extend');

	var reg = new Reg(17);
	var r0_dup = new Dup(0);
	var r0_mux1 = new Mux(16);
	var r0_fwwb_mux = new Mux(15);
	var r1_fwwb_mux = new Mux(15);
	var r01_fwwb_d1 = new Dup(0);
	c_add(c, reg, 308, 182, 'reg');
	c_add(c, r0_dup, 393, 187, 'dup');
	c_add(c, r0_mux1, 406, 182, 'mux4');
	c_add(c, r0_fwwb_mux, 425, 190, 'mux2');
	c_add(c, r1_fwwb_mux, 425, 231, 'mux2');
	c_add(c, r01_fwwb_d1, 418, 251, 'dup');
	
	
	var fwwb_d1 = new Splitter(0, [[63, 0], [31, 0]]);
	c_add(c, fwwb_d1, 418, 403, 'split');
	
	var ctrl = new Ctrl(30);
	var alusrc0_d1 = new Dup(0);
	c_add(c, ctrl, 338, 25, 'ctrl');
	c_add(c, alusrc0_d1, 431, 113, 'dup');

	var idex = new ID_EX(10);
	idex.ctrl.priority = 38;
	idex.data.priority = 23;
	c_add(c, idex, 453, 19, 'idex');

	var rt_d = new Dup(0);
	var rw_mux = new Mux(18);
	c_add(c, rt_d, 492, 299, 'dup');
	c_add(c, rw_mux, 502, 292, 'mux3');

	var fwwb_d2 = new Splitter(0, [[63, 0], [31, 0]]);	
	var r01_fwwb_d2 = new Dup(0);
	var r01_fwmem_d1 = new Dup(0);
	c_add(c, fwwb_d2, 518, 403, 'split');
	c_add(c, r01_fwwb_d2, 518, 233, 'dup');
	c_add(c, r01_fwmem_d1, 524, 240, 'dup');
	
	var r0_mux2 = new Mux(18);
	var r0_mux3 = new Mux(17);
	var r0i_d1 = new Dup(0);
	c_add(c, r0_mux2, 529, 187, 'mux3');
	c_add(c, r0_mux3, 570, 190, 'mux2');
	c_add(c, r0i_d1, 561, 236, 'dup');
	
	var r1_mux1 = new Mux(18);
	var r1_d1 = new Dup(0);
	c_add(c, r1_mux1, 542, 220, 'mux3');
	c_add(c, r1_d1, 555, 230, 'dup');
	
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
	c_add(c, imm_d1, 561, 331, 'dup');
	c_add(c, pc4_d1, 565, 351, 'dup');
	c_add(c, imm_shift, 576, 326, 'left');
	c_add(c, b_adder, 613, 325, 'adder');
	
	var exmem = new EX_MEM(10);
	exmem.ctrl.priority = 39;
	exmem.data.priority = 24;
	c_add(c, exmem, 666, 19, 'exmem');

	var aout_s1 = new Splitter(0, [[31, 0], [63, 0]]);
	var aout_s2 = new Splitter(0, [[31, 0], [63, 0]]);
	c_add(c, aout_s1, 702, 217, 'split');
	c_add(c, aout_s2, 702, 288, 'split');
	
	var mem = new DMem(15);
	c_add(c, mem, 714, 207, 'dmem');

	var wr_dup1 = new Dup(0);
	c_add(c, wr_dup1, 768, 308, 'dup');

	var memwb = new MEM_WB(10);
	memwb.ctrl.priority = 40;
	memwb.data.priority = 25;
	c_add(c, memwb, 807, 19, 'memwb');

	var wr_dup2 = new Dup(0);
	c_add(c, wr_dup2, 850, 416, 'dup');
	
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
	c.addWire(Wire.connect([ifid_s1, 0], [ctrl, Ctrl.In.kOpcode], 6, [{x:272,y:196},{x:272,y:76}]));
	c.addWire(Wire.connect([ifid_s1, 1], [ctrl, Ctrl.In.kFunct], 6));
	c.addWire(Wire.connect([ifid_s1, 2], [reg, Reg.In.kReadReg0], 5));
	c.addWire(Wire.connect([ifid_s1, 3], [reg, Reg.In.kReadReg1], 5));
	c.addWire(Wire.connect([ifid_s1, 4], [rs_hz_d1, 0], 5));
	c.addWire(Wire.connect([ifid_s1, 5], [rt_hz_d1, 0], 5));
	c.addWire(Wire.connect([ifid_s1, 6], [idex.data, ID_EX.D.kRd], 5));
	c.addWire(Wire.connect([ifid_s1, 7], [ext, 0], 16));
	c.addWire(Wire.connect([ifid_s1, 8], [j_shift, 0], 26));

	/* Connect the jump shift */
	c.addWire(Wire.connect([j_shift, 0], [j_splice, 1], 28));

	/* Connect the extender */
	c.addWire(Wire.connect32([ext, 0], [idex.data, ID_EX.D.kImmediate]));

	/* Connect register output */
	c.addWire(Wire.connect32([reg, Reg.Out.kReg0], [r0_mux1, 1]));
	c.addWire(Wire.connectConst32(0, [r0_mux1, 2]));
	c.addWire(Wire.connect32([reg, Reg.Out.kLo], [r0_mux1, 3]));
	c.addWire(Wire.connect32([reg, Reg.Out.kHi], [r0_mux1, 4]));

	c.addWire(Wire.connect32([r0_mux1, 0], [r0_fwwb_mux, 1]));
	c.addWire(Wire.connect32([r01_fwwb_d1, 0], [r0_fwwb_mux, 2]));
	c.addWire(Wire.connect32([r0_fwwb_mux, 0], [idex.data, ID_EX.D.kReg0]));
	
	c.addWire(Wire.connect32([reg, Reg.Out.kReg1], [r1_fwwb_mux, 1]));
	c.addWire(Wire.connect32([r01_fwwb_d1, 1], [r1_fwwb_mux, 2]));
	c.addWire(Wire.connect32([r1_fwwb_mux, 0], [idex.data, ID_EX.D.kReg1]));

	/* Connect Rs and Rd duplicators */
	c.addWire(Wire.connect([rs_hz_d1, 0], [idex.data, ID_EX.D.kRs], 5));
	//c.addWire(Wire.connect([rs_hz_d1, 1], [hazard, ...], 5));
	c.addWire(Wire.connect([rt_hz_d1, 0], [idex.data, ID_EX.D.kRt], 5));
	//c.addWire(Wire.connect([rt_hz_d1, 1], [hazard, ...], 5));

	/* Connect control signals for ID stage */
	c.addWire(Wire.connect([ctrl, Ctrl.kRegWrite], [idex.ctrl, Ctrl.kRegWrite], 2));
	c.addWire(Wire.connect([ctrl, Ctrl.kMemToReg], [idex.ctrl, Ctrl.kMemToReg], 1));
	c.addWire(Wire.connect([ctrl, Ctrl.kMemWrite], [idex.ctrl, Ctrl.kMemWrite], 1));
	c.addWire(Wire.connect([ctrl, Ctrl.kMemCtrl], [idex.ctrl, Ctrl.kMemCtrl], 3));
	c.addWire(Wire.connect([ctrl, Ctrl.kALUCtrl], [idex.ctrl, Ctrl.kALUCtrl], 5));
	c.addWire(Wire.connect([ctrl, Ctrl.kALUSrc0], [alusrc0_d1, 0], 2));
	c.addWire(Wire.connect([ctrl, Ctrl.kALUSrc0I], [idex.ctrl, Ctrl.kALUSrc0I], 1));
	c.addWire(Wire.connect([alusrc0_d1, 0], [idex.ctrl, Ctrl.kALUSrc0], 2));
	c.addWire(Wire.connect([alusrc0_d1, 1], [r0_mux1, 0], 2));
	c.addWire(Wire.connect([ctrl, Ctrl.kALUSrc1], [idex.ctrl, Ctrl.kALUSrc1], 2));
	c.addWire(Wire.connect([ctrl, Ctrl.kRegDest], [idex.ctrl, Ctrl.kRegDest], 2));
	c.addWire(Wire.connect([ctrl, Ctrl.kBranch], [idex.ctrl, Ctrl.kBranch], 1));
	c.addWire(Wire.connect([ctrl, Ctrl.kJump], [pc_jmux, 0], 1));
	c.addWire(Wire.connect([ctrl, Ctrl.kJumpR], [pc_jrmux, 0], 1));
	c.addWire(Wire.connect([ctrl, Ctrl.kExtendCtrl], [ext, Ext32.In.kCtrl], 1));

	/* Connect forwarding for EX stage */
	c.addWire(Wire.connect32([fwwb_d1, 1], [r01_fwwb_d1, 0]));
	c.addWire(Wire.connect64([fwwb_d1, 0], [reg, Reg.In.kWriteData]));

	/* Connect control signals for EX stage */
	c.addWire(Wire.connect([idex.ctrl, Ctrl.kRegWrite], [exmem.ctrl, Ctrl.kRegWrite], 2));
	c.addWire(Wire.connect([idex.ctrl, Ctrl.kMemToReg], [exmem.ctrl, Ctrl.kMemToReg], 1));
	c.addWire(Wire.connect([idex.ctrl, Ctrl.kMemWrite], [exmem.ctrl, Ctrl.kMemWrite], 1));
	c.addWire(Wire.connect([idex.ctrl, Ctrl.kMemCtrl], [exmem.ctrl, Ctrl.kMemCtrl], 3));

	c.addWire(Wire.connect([idex.ctrl, Ctrl.kBranch], [b_and, 0], 1));
	c.addWire(Wire.connect([idex.ctrl, Ctrl.kALUCtrl], [alu, ALU.In.kALUCtrl], 5));
	c.addWire(Wire.connect([idex.ctrl, Ctrl.kALUSrc0I], [r0_mux3, 0], 1));
	//c.addWire(Wire.connect([idex.ctrl, Ctrl.kALUSrc0], [hazard, ...], 2));
	//c.addWire(Wire.connect([idex.ctrl, Ctrl.kALUSrc1], [hazard, ...], 2));
	c.addWire(Wire.connect([idex.ctrl, Ctrl.kRegDest], [rw_mux, 0], 2));

	/* Connect the ALU inputs */
	c.addWire(Wire.connect32([idex.data, ID_EX.D.kReg0], [r0_mux2, 1]));
	c.addWire(Wire.connect32([r01_fwwb_d2, 0], [r0_mux2, 2]));
	c.addWire(Wire.connect32([r01_fwmem_d1, 0], [r0_mux2, 3]));
	c.addWire(Wire.connect32([r0i_d1, 0], [r0_mux3, 2]));
	c.addWire(Wire.connect32([r0_mux2, 0], [r0_mux3, 1]));
	c.addWire(Wire.connect32([r0_mux3, 0], [alu, ALU.In.kIn0]));
	
	c.addWire(Wire.connect32([idex.data, ID_EX.D.kReg1], [r1_mux1, 1]));
	c.addWire(Wire.connect32([r01_fwwb_d2, 1], [r1_mux1, 2]));
	c.addWire(Wire.connect32([r01_fwmem_d1, 1], [r1_mux1, 3]));
	c.addWire(Wire.connect32([r1_mux1, 0], [r1_d1, 0]));
	c.addWire(Wire.connect32([r1_d1, 0], [r1_mux2, 1]));
	c.addWire(Wire.connect32([imm_d1, 1], [r0i_d1, 0]));
	c.addWire(Wire.connect32([r0i_d1, 1], [r1_mux2, 2]));
	c.addWire(Wire.connect32([pc4_d1, 1], [r1_mux2, 3]));
	c.addWire(Wire.connect32([r1_mux2, 0], [alu, ALU.In.kIn1]));

	/* Connect the PC4 branch adder */
	c.addWire(Wire.connect32([idex.data, ID_EX.D.kImmediate], [imm_d1, 0]));
	c.addWire(Wire.connect32([imm_d1, 0], [imm_shift, 0]));
	c.addWire(Wire.connect32([imm_shift, 0], [b_adder, 0]));
	c.addWire(Wire.connect32([idex.data, ID_EX.D.kPCPlus4], [pc4_d1, 0]));
	c.addWire(Wire.connect32([pc4_d1, 0], [b_adder, 1]));

	/* Connect the Write Register mux */
	//c.addWire(Wire.connect([idex.data, ID_EX.D.kRs], [hazard, ...], 5));
	c.addWire(Wire.connect([idex.data, ID_EX.D.kRt], [rt_d, 0], 5));
	c.addWire(Wire.connect([rt_d, 0], [rw_mux, 1], 5));
	//c.addWire(Wire.connect([rt_d, 1], [hazard, ...], 5));
	c.addWire(Wire.connect([idex.data, ID_EX.D.kRd], [rw_mux, 2], 5));
	c.addWire(Wire.connectConst(31, [rw_mux, 3], 5));
	c.addWire(Wire.connect([rw_mux, 0], [exmem.data, EX_MEM.D.kWriteReg], 5));

	/* Connect forwarding for EX stage */
	c.addWire(Wire.connect32([fwwb_d2, 1], [r01_fwwb_d2, 0]));
	c.addWire(Wire.connect64([fwwb_d2, 0], [fwwb_d1, 0]));

	/* Connect write data */
	c.addWire(Wire.connect32([r1_d1, 1], [exmem.data, EX_MEM.D.kWriteData]));

	/* Connect ALU outputs and branch */
	c.addWire(Wire.connect([alu, ALU.Out.kZero], [b_and, 1], 1));
	c.addWire(Wire.connect([b_and, 0], [pc_bmux, 0], 1));
	c.addWire(Wire.connect64([alu, ALU.Out.kResult], [exmem.data, EX_MEM.D.kALUResult]));

	/* Connect control signals for MEM Stage */
	c.addWire(Wire.connect([exmem.ctrl, Ctrl.kRegWrite], [memwb.ctrl, Ctrl.kRegWrite], 2));
	c.addWire(Wire.connect([exmem.ctrl, Ctrl.kMemToReg], [memwb.ctrl, Ctrl.kMemToReg], 1));
	c.addWire(Wire.connect([exmem.ctrl, Ctrl.kMemWrite], [mem, DMem.In.kMemWrite], 1));
	c.addWire(Wire.connect([exmem.ctrl, Ctrl.kMemCtrl], [mem, DMem.In.kMemCtrl], 3));

	/* Connect memory */
	c.addWire(Wire.connect64([exmem.data, EX_MEM.D.kALUResult], [aout_s1, 0]));
	c.addWire(Wire.connect32([aout_s1, 0], [mem, DMem.In.kAddr]));
	c.addWire(Wire.connect64([aout_s1, 1], [aout_s2, 0]));
	c.addWire(Wire.connect32([aout_s2, 0], [r01_fwmem_d1, 0]));
	c.addWire(Wire.connect64([aout_s2, 1], [memwb.data, MEM_WB.D.kALUOut]));
	c.addWire(Wire.connect32([exmem.data, EX_MEM.D.kWriteData], [mem, DMem.In.kWriteData]));

	c.addWire(Wire.connect64([mem, DMem.Out.kReadData], [memwb.data, MEM_WB.D.kReadData]));

	c.addWire(Wire.connect([exmem.data, EX_MEM.D.kWriteReg], [wr_dup1, 0], 5));
	c.addWire(Wire.connect([wr_dup1, 0], [memwb.data, MEM_WB.D.kWriteReg], 5));
	//c.addWire(Wire.connect([wr_dup1, 1], [hazard, ...], 5));

	/* Connect signals for WB stage */
	c.addWire(Wire.connect([memwb.ctrl, Ctrl.kRegWrite], [reg, Reg.In.kRegWrite], 2));
	c.addWire(Wire.connect([memwb.ctrl, Ctrl.kMemToReg], [wrdata_mux, 0], 3));

	/* Connect Everything else */
	c.addWire(Wire.connect64([memwb.data, MEM_WB.D.kALUOut], [wrdata_mux, 1]));
	c.addWire(Wire.connect64([memwb.data, MEM_WB.D.kReadData], [wrdata_mux, 2]));
	c.addWire(Wire.connect64([wrdata_mux, 0], [fwwb_d2, 0]));

	c.addWire(Wire.connect([memwb.data, MEM_WB.D.kWriteReg], [wr_dup2, 0], 5));
	//c.addWire(Wire.connect([wr_dup2, 0], [hazard, ...], 5));
	c.addWire(Wire.connect([wr_dup2, 1], [reg, Reg.In.kWriteReg], 5));

	MIPS.queue.insert(pc);
	MIPS.queue.insert(ifid);
	MIPS.queue.insert(idex);
	MIPS.queue.insert(exmem);
	MIPS.queue.insert(memwb);
}












