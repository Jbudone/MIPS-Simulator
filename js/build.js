var ass_in = {
	mux2: {dimensions: {width:13,height:32}, file: '2mux.png'},
	mux3: {dimensions: {width:13,height:32}, file: '3mux.png'},
	mux4: {dimensions: {width:13,height:32}, file: '4mux.png'},

	adder: {dimensions: {width:19,height:36}, file: 'adder.png'},
	alu: {dimensions: {width:30,height:60}, file: 'alu.png'},
	and: {dimensions: {width:18,height:16}, file: 'and.png'},
	ctrl: {dimensions: {width:72,height:199}, file: 'control_unit.png'},
	dmem: {dimensions: {width:69,height:65}, file: 'datamem.png'},
	ex_mem: {dimensions: {width:23,height:355}, file: 'ex_mem.png'},
	extend: {dimensions: {width:46,height:20}, file: 'extend.png'},
	id_ex: {dimensions: {width:23,height:355}, file: 'id_ex.png'},
	if_id: {dimensions: {width:23,height:189}, file: 'if_id.png'},
	imem: {dimensions: {width:68,height:57}, file: 'instrmem.png'},
	left: {dimensions: {width:31,height:14}, file: 'left.png'},
	mem_wb: {dimensions: {width:23,height:355}, file: 'mem_wb.png'},
	pc: {dimensions: {width:38,height:25}, file: 'pc.png'},
	pc4_add: {dimensions: {width:25,height:49}, file: 'pc4_adder.png'},
	reg: {dimensions: {width:81,height:102}, file: 'regfile.png'},
	split: {dimensions: {width:4,height:5}, file: 'split_dup.png'},
	dup: {dimensions: {width:4,height:5}, file: 'split_dup.png'},
	splice: {dimensions: {width:4,height:5}, file: 'split_dup.png'}
};

function c_add(Canvas, comp, x, y, ass) {
	Canvas.addComponent(comp, 0, {position: {x: x, y: y}, dimensions: ass_in[ass].dimensions, file: ass_in[ass].file});
}


function buildMIPS(c) {
	var pc_bmux = new Mux(14);
	var pc_jmux = new Mux(13);
	var pc_jrmux = new Mux(12);
	var pc = new PC(10);
	var pc_d1 = new Dup(0);

	c_add(c, pc_bmux, 21, 295, 'mux2');
	c_add(c, pc_jmux, 38, 288, 'mux2');
	c_add(c, pc_jrmux, 56, 281, 'mux2');
	c_add(c, pc, 78, 284, 'pc');
	c_add(c, pc_d1, 21, 295, 'dup');
	
	var pc_adder = new Adder4_32(15);
	var pc_adder_d1 = new Dup(0);

	c_add(c, pc_adder, 143, 116, 'pc4_add');
	c_add(c, pc_adder_d1, 191, 138, 'dup');

	var instr_mem = new IMem(11);
	c_add(c, instr_mem, 146, 268, 'imem');

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
	c_add(c, ifid, 234, 120, 'if_id');
	c_add(c, ifid_s1, 271, 294, 'split');

	var pc4_s1 = new Splitter(0, [[31, 0], [31, 28]]);
	var j_shift = new ShiftLeft2_26(17);
	var j_splice = new Splicer(0);
	c_add(c, pc4_s1, 267, 139, 'split');
	c_add(c, ifid, 281, 81, 'left');
	c_add(c, ifid, 267, 86, 'splice');

	var rs_hz_d1 = new Dup(0);
	var rt_hz_d1 = new Dup(0);
	c_add(c, rs_hz_d1, 431, 197, 'dup');
	c_add(c, rt_hz_d1, 441, 190, 'dup');

	var ext = new Ext32(17);
	c_add(c, ext, 337, 150, 'extend');

	var reg = new Reg(17);
	var r0_dup = new Dup(0);
	var r0_mux1 = new Mux(16);
	var r0_fwwb_mux = new Mux(15);
	var r1_fwwb_mux = new Mux(15);
	var r01_fwwb_d1 = new Dup(0);
	c_add(c, reg, 308, 210, 'reg');
	c_add(c, r0_dup, 393, 302, 'dup');
	c_add(c, r0_mux1, 406, 278, 'mux4');
	c_add(c, r0_fwwb_mux, 425, 272, 'mux2');
	c_add(c, r1_fwwb_mux, 425, 231, 'mux2');
	c_add(c, r01_fwwb_d1, 418, 231, 'dup');
	
	
	var fwwb_d1 = new Splitter(0, [[63, 0], [31, 0]]);
	c_add(c, fwwb_d1, 418, 86, 'split');
	
	var ctrl = new Ctrl(30);
	var alusrc0_d1 = new Dup(0);
	c_add(c, ctrl, 338, 352, 'ctrl');
	c_add(c, alusrc0_d1, 431, 386, 'dup');

	var idex = new ID_EX(10);
	idex.ctrl.priority = 38;
	idex.data.priority = 23;
	c_add(c, idex, 453, 119, 'id_ex');

	var rt_d = new Dup(0);
	var rw_mux = new Mux(18);
	c_add(c, rt_d, 492, 190, 'dup');
	c_add(c, rw_mux, 502, 170, 'mux3');

	var fwwb_d2 = new Splitter(0, [[63, 0], [31, 0]]);	
	var r01_fwwb_d2 = new Dup(0);
	var r01_fwmem_d1 = new Dup(0);
	c_add(c, fwwb_d2, 518, 86, 'split');
	c_add(c, r01_fwwb_d2, 518, 256, 'dup');
	c_add(c, r01_fwmem_d1, 524, 249, 'dup');
	
	var r0_mux2 = new Mux(18);
	c_add(c, r0_mux2, 529, 275, 'mux3');
	
	var r1_mux1 = new Mux(18);
	var r1_d1 = new Dup(0);
	c_add(c, r1_mux1, 542, 242, 'mux3');
	c_add(c, r1_d1, 555, 259, 'dup');
	
	var r1_mux2 = new Mux(17);
	c_add(c, r1_mux2, 571, 239, 'mux3');

	var alu = new ALU(16);
	c_add(c, alu, 602, 244, 'alu');

	var b_and = new ANDGate(15);
	c_add(c, b_and, 640, 282, 'and');

	var imm_d1 = new Dup(0);
	var pc4_d1 = new Dup(0);
	var imm_shift = new ShiftLeft2_32(16);
	var b_adder = new Adder32(15);
	c_add(c, imm_d1, 561, 158, 'dup');
	c_add(c, pc4_d1, 565, 138, 'dup');
	c_add(c, imm_shift, 576, 153, 'left');
	c_add(c, b_adder, 613, 132, 'adder');
	
	var exmem = new EX_MEM(10);
	exmem.ctrl.priority = 39;
	exmem.data.priority = 24;
	c_add(c, exmem, 666, 119, 'ex_mem');

	var aout_s1 = new Splitter(0, [[31, 0], [63, 0]]);
	var aout_s2 = new Splitter(0, [[31, 0], [63, 0]]);
	c_add(c, aout_s1, 702, 272, 'split');
	c_add(c, aout_s2, 702, 201, 'split');
	
	var mem = new DMem(15);
	c_add(c, mem, 714, 222, 'dmem');

	var wr_dup1 = new Dup(0);
	c_add(c, wr_dup1, 768, 181, 'dup');

	var memwb = new MEM_WB(10);
	memwb.ctrl.priority = 40;
	memwb.data.priority = 25;
	c_add(c, memwb, 807, 119, 'mem_wb');

	var wr_dup2 = new Dup(0);
	c_add(c, wr_dup2, 850, 73, 'dup');
	
	var wrdata_mux = new Mux(20);
	c_add(c, wr_dup1, 849, 251, 'dup');

	/* Connect the muxes infront of the PC */
	Wire.connect32([pc_adder_d1, 1], [pc_bmux, 1]);
	Wire.connect32([b_adder, 0], [pc_bmux, 2]);

	Wire.connect32([pc_bmux, 0], [pc_jmux, 1]);
	Wire.connect32([j_splice, 0], [pc_jmux, 2]);

	Wire.connect32([pc_jmux, 0], [pc_jrmux, 1]);
	Wire.connect32([r0_dup, 1], [pc_jrmux, 2]);

	/* Connect the PC */
	Wire.connect32([pc_jrmux, 0], [pc, PC.In.kAddr]);
	Wire.connect32([pc, 0], [pc_d1, 0]);
	Wire.connect32([pc_d1, 0], [instr_mem, 0]);
	Wire.connect32([pc_d1, 1], [pc_adder, 0]);
	Wire.connectConst(0, [pc, PC.In.kStall], 1);
	//Wire.connect32([hazard, ...], [pc, PC.In.kStall]);

	/* Connect the PC adder */
	Wire.connect32([pc_adder, 0], [pc_adder_d1, 0]);
	Wire.connect32([pc_adder_d1, 0], [ifid.data, IF_ID.D.kPCPlus4]);

	/* Connect the Instruction memory */
	Wire.connect32([instr_mem, 0], [ifid.data, IF_ID.D.kInstr]);

	/* Connect PC Plus 4 in ID stage */
	Wire.connect32([ifid.data, IF_ID.D.kPCPlus4], [pc4_s1, 0]);
	Wire.connect32([pc4_s1, 0], [idex.data, ID_EX.D.kPCPlus4]); 
	Wire.connect([pc4_s1, 1], [j_splice, 0], 4);

	/* Connect the instruction bits */
	Wire.connect32([ifid.data, IF_ID.D.kInstr], [ifid_s1, 0]);
	Wire.connect([ifid_s1, 0], [ctrl, Ctrl.In.kOpcode], 6);
	Wire.connect([ifid_s1, 1], [ctrl, Ctrl.In.kFunct], 6);
	Wire.connect([ifid_s1, 2], [reg, Reg.In.kReadReg0], 5);
	Wire.connect([ifid_s1, 3], [reg, Reg.In.kReadReg1], 5);
	Wire.connect([ifid_s1, 4], [rs_hz_d1, 0], 5);
	Wire.connect([ifid_s1, 5], [rt_hz_d1, 0], 5);
	Wire.connect([ifid_s1, 6], [idex.data, ID_EX.D.kRd], 5);
	Wire.connect([ifid_s1, 7], [ext, 0], 16);
	Wire.connect([ifid_s1, 8], [j_shift, 0], 26);

	/* Connect the jump shift */
	Wire.connect([j_shift, 0], [j_splice, 1], 28);

	/* Connect the extender */
	Wire.connect32([ext, 0], [idex.data, ID_EX.D.kImmediate]);

	/* Connect register output */
	Wire.connect32([reg, Reg.Out.kReg0], [r0_mux1, 1]);
	Wire.connectConst32(0, [r0_mux1, 2]);
	Wire.connect32([reg, Reg.Out.kLo], [r0_mux1, 3]);
	Wire.connect32([reg, Reg.Out.kHi], [r0_mux1, 4]);

	Wire.connect32([r0_mux1, 0], [r0_fwwb_mux, 1]);
	Wire.connect32([r01_fwwb_d1, 0], [r0_fwwb_mux, 2]);
	Wire.connect32([r0_fwwb_mux, 0], [idex.data, ID_EX.D.kReg0]);
	
	Wire.connect32([reg, Reg.Out.kReg1], [r1_fwwb_mux, 1]);
	Wire.connect32([r01_fwwb_d1, 1], [r1_fwwb_mux, 2]);
	Wire.connect32([r1_fwwb_mux, 0], [idex.data, ID_EX.D.kReg1]);

	/* Connect Rs and Rd duplicators */
	Wire.connect([rs_hz_d1, 0], [idex.data, ID_EX.D.kRs], 5);
	//Wire.connect([rs_hz_d1, 1], [hazard, ...], 5);
	Wire.connect([rt_hz_d1, 0], [idex.data, ID_EX.D.kRt], 5);
	//Wire.connect([rt_hz_d1, 1], [hazard, ...], 5);

	/* Connect control signals for ID stage */
	Wire.connect([ctrl, Ctrl.kRegWrite], [idex.ctrl, Ctrl.kRegWrite], 2);
	Wire.connect([ctrl, Ctrl.kMemToReg], [idex.ctrl, Ctrl.kMemToReg], 1);
	Wire.connect([ctrl, Ctrl.kMemWrite], [idex.ctrl, Ctrl.kMemWrite], 1);
	Wire.connect([ctrl, Ctrl.kMemCtrl], [idex.ctrl, Ctrl.kMemCtrl], 3);
	Wire.connect([ctrl, Ctrl.kALUCtrl], [idex.ctrl, Ctrl.kALUCtrl], 5);
	Wire.connect([ctrl, Ctrl.kALUSrc0], [alusrc0_d1, 0], 2);
	Wire.connect([alusrc0_d1, 0], [idex.ctrl, Ctrl.kALUSrc0], 2);
	Wire.connect([alusrc0_d1, 1], [r0_mux1, 0], 2);
	Wire.connect([ctrl, Ctrl.kALUSrc1], [idex.ctrl, Ctrl.kALUSrc1], 2);
	Wire.connect([ctrl, Ctrl.kRegDest], [idex.ctrl, Ctrl.kRegDest], 2);
	Wire.connect([ctrl, Ctrl.kBranch], [idex.ctrl, Ctrl.kBranch], 1);
	Wire.connect([ctrl, Ctrl.kJump], [pc_jmux, 0], 1);
	Wire.connect([ctrl, Ctrl.kJumpR], [pc_jrmux, 0], 1);
	Wire.connect([ctrl, Ctrl.kExtendCtrl], [ext, Ext32.In.kCtrl], 1);

	/* Connect forwarding for EX stage */
	Wire.connect32([fwwb_d1, 1], [r01_fwwb_d1, 0]);
	Wire.connect64([fwwb_d1, 0], [reg, Reg.In.kWriteData]);

	/* Connect control signals for EX stage */
	Wire.connect([idex.ctrl, Ctrl.kRegWrite], [exmem.ctrl, Ctrl.kRegWrite], 2);
	Wire.connect([idex.ctrl, Ctrl.kMemToReg], [exmem.ctrl, Ctrl.kMemToReg], 1);
	Wire.connect([idex.ctrl, Ctrl.kMemWrite], [exmem.ctrl, Ctrl.kMemWrite], 1);
	Wire.connect([idex.ctrl, Ctrl.kMemCtrl], [exmem.ctrl, Ctrl.kMemCtrl], 3);

	Wire.connect([idex.ctrl, Ctrl.kBranch], [b_and, 0], 1);
	Wire.connect([idex.ctrl, Ctrl.kALUCtrl], [alu, ALU.In.kALUCtrl], 5);
	//Wire.connect([idex.ctrl, Ctrl.kALUSrc0], [hazard, ...], 2);
	//Wire.connect([idex.ctrl, Ctrl.kALUSrc1], [hazard, ...], 2);
	Wire.connect([idex.ctrl, Ctrl.kRegDest], [rw_mux, 0], 2);

	/* Connect the ALU inputs */
	Wire.connect32([idex.data, ID_EX.D.kReg0], [r0_mux2, 1]);
	Wire.connect32([r01_fwwb_d2, 0], [r0_mux2, 2]);
	Wire.connect32([r01_fwmem_d1, 0], [r0_mux2, 3]);
	Wire.connect32([r0_mux2, 0], [alu, ALU.In.kIn0]);
	
	Wire.connect32([idex.data, ID_EX.D.kReg1], [r1_mux1, 1]);
	Wire.connect32([r01_fwwb_d2, 1], [r1_mux1, 2]);
	Wire.connect32([r01_fwmem_d1, 1], [r1_mux1, 3]);
	Wire.connect32([r1_mux1, 0], [r1_d1, 0]);
	Wire.connect32([r1_d1, 0], [r1_mux2, 1]);
	Wire.connect32([imm_d1, 1], [r1_mux2, 2]);
	Wire.connect32([pc4_d1, 1], [r1_mux2, 3]);
	Wire.connect32([r1_mux2, 0], [alu, ALU.In.kIn1]);

	/* Connect the PC4 branch adder */
	Wire.connect32([idex.data, ID_EX.D.kImmediate], [imm_d1, 0]);
	Wire.connect32([imm_d1, 0], [imm_shift, 0]);
	Wire.connect32([imm_shift, 0], [b_adder, 0]);
	Wire.connect32([idex.data, ID_EX.D.kPCPlus4], [pc4_d1, 0]);
	Wire.connect32([pc4_d1, 0], [b_adder, 1]);

	/* Connect the Write Register mux */
	//Wire.connect([idex.data, ID_EX.D.kRs], [hazard, ...], 5);
	Wire.connect([idex.data, ID_EX.D.kRt], [rt_d, 0], 5);
	Wire.connect([rt_d, 0], [rw_mux, 1], 5);
	//Wire.connect([rt_d, 1], [hazard, ...], 5);
	Wire.connect([idex.data, ID_EX.D.kRd], [rw_mux, 2], 5);
	Wire.connectConst(31, [rw_mux, 3], 5);
	Wire.connect([rw_mux, 0], [exmem.data, EX_MEM.D.kWriteReg], 5);

	/* Connect forwarding for EX stage */
	Wire.connect32([fwwb_d2, 1], [r01_fwwb_d2, 0]);
	Wire.connect64([fwwb_d2, 0], [fwwb_d1, 0]);

	/* Connect write data */
	Wire.connect32([r1_d1, 1], [exmem.data, EX_MEM.D.kWriteData]);

	/* Connect ALU outputs and branch */
	Wire.connect([alu, ALU.Out.kZero], [b_and, 1], 1);
	Wire.connect([b_and, 0], [pc_bmux, 0], 1);
	Wire.connect64([alu, ALU.Out.kResult], [exmem.data, EX_MEM.D.kALUResult]);

	/* Connect control signals for MEM Stage */
	Wire.connect([exmem.ctrl, Ctrl.kRegWrite], [memwb.ctrl, Ctrl.kRegWrite], 2);
	Wire.connect([exmem.ctrl, Ctrl.kMemToReg], [memwb.ctrl, Ctrl.kMemToReg], 1);
	Wire.connect([exmem.ctrl, Ctrl.kMemWrite], [mem, DMem.In.kMemWrite], 1);
	Wire.connect([exmem.ctrl, Ctrl.kMemCtrl], [mem, DMem.In.kMemCtrl], 3);

	/* Connect memory */
	Wire.connect64([exmem.data, EX_MEM.D.kALUResult], [aout_s1, 0]);
	Wire.connect32([aout_s1, 0], [mem, DMem.In.kAddr]);
	Wire.connect64([aout_s1, 1], [aout_s2, 0]);
	Wire.connect32([aout_s2, 0], [r01_fwmem_d1, 0]);
	Wire.connect64([aout_s2, 1], [memwb.data, MEM_WB.D.kALUOut]);
	Wire.connect32([exmem.data, EX_MEM.D.kWriteData], [mem, DMem.In.kWriteData]);

	Wire.connect64([mem, DMem.Out.kReadData], [memwb.data, MEM_WB.D.kReadData]);

	Wire.connect([exmem.data, EX_MEM.D.kWriteReg], [wr_dup1, 0], 5);
	Wire.connect([wr_dup1, 0], [memwb.data, MEM_WB.D.kWriteReg], 5);
	//Wire.connect([wr_dup1, 1], [hazard, ...], 5);

	/* Connect signals for WB stage */
	Wire.connect([memwb.ctrl, Ctrl.kRegWrite], [reg, Reg.In.kRegWrite], 2);
	Wire.connect([memwb.ctrl, Ctrl.kMemToReg], [wrdata_mux, 0], 3);

	/* Connect Everything else */
	Wire.connect64([memwb.data, MEM_WB.D.kALUOut], [wrdata_mux, 1]);
	Wire.connect64([memwb.data, MEM_WB.D.kReadData], [wrdata_mux, 2]);
	Wire.connect64([wrdata_mux, 0], [fwwb_d2, 0]);

	Wire.connect([memwb.data, MEM_WB.D.kWriteReg], [wr_dup2, 0], 5);
	//Wire.connect([wr_dup2, 0], [hazard, ...], 5);
	Wire.connect([wr_dup2, 1], [reg, Reg.In.kWriteReg], 5);

	MIPS.queue.insert(pc);
	MIPS.queue.insert(ifid);
	MIPS.queue.insert(idex);
	MIPS.queue.insert(exmem);
	MIPS.queue.insert(memwb);
}












