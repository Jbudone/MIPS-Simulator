
function buildMIPS() {
	var pc_bmux = new Mux(14);
	var pc_jmux = new Mux(13);
	var pc_jrmux = new Mux(12);
	var pc = new PC(10);
	var pc_d1 = new Dup(0);
	
	var pc_adder = new Adder4_32(15);
	var pc_adder_d1 = new Dup(0);

	var instr_mem = new IMem(11);

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

	var pc4_s1 = new Splitter(0, [[31, 0], [31, 28]]);
	var j_shift = new ShiftLeft2_26(17);
	var j_splice = new Splicer(0);

	var rs_hz_d1 = new Dup(0);
	var rt_hz_d1 = new Dup(0);

	var ext = new Ext32(17);

	var reg = new Reg(17);
	var r0_dup = new Dup(0);
	var r0_mux1 = new Mux(16);
	var r0_fwwb_mux = new Mux(15);
	var r1_fwwb_mux = new Mux(15);
	var r01_fwwb_d1 = new Dup(0);
	
	
	var fwwb_d1 = new Splitter(0, [[63, 0], [31, 0]]);

	var ctrl = new Ctrl(30);
	var alusrc0_d1 = new Dup(0);

	var idex = new ID_EX(10);
	idex.ctrl.priority = 38;
	idex.data.priority = 23;

	var rt_d = new Dup(0);
	var rw_mux = new Mux(18);

	var fwwb_d2 = new Splitter(0, [[63, 0], [31, 0]]);	
	var r01_fwwb_d2 = new Dup(0);
	var r01_fwmem_d1 = new Dup(0);
	
	var r0_mux2 = new Mux(18);

	var r1_mux1 = new Mux(18);
	var r1_d1 = new Dup(0);
	
	var r1_mux2 = new Mux(17);

	var alu = new ALU(16);

	var b_and = new ANDGate(15);

	var imm_d1 = new Dup(0);
	var pc4_d1 = new Dup(0);
	var imm_shift = new ShiftLeft2_32(16);
	var b_adder = new Adder32(15);
	
	var exmem = new EX_MEM(10);
	exmem.ctrl.priority = 39;
	exmem.data.priority = 24;

	var aout_s1 = new Splitter(0, [[31, 0], [63, 0]]);
	var aout_s2 = new Splitter(0, [[31, 0], [63, 0]]);

	var mem = new DMem(15);

	var wr_dup1 = new Dup(0);

	var memwb = new MEM_WB(10);
	memwb.ctrl.priority = 40;
	memwb.data.priority = 25;

	var wr_dup2 = new Dup(0);
	
	var wrdata_mux = new Mux(20);

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












