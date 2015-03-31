
function buildMIPS() {
	var pc_bmux = new Mux(20);
	var pc_jmux = new Mux(20);
	var pc_jrmux = new Mux(20);
	var pc = new PC(20);
	var pc_d1 = new Dup(20);
	
	var pc_adder = new Adder4_32(20);
	var pc_adder_d1 = new Dup(20);

	var instr_mem = new IMem(20);

	var ifid = new IF_ID(1);
	var ifid_s1 = new Splitter(20, [
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

	var pc4_s1 = new Splitter(20, [[31, 0], [31, 28]]);
	var j_shift = new ShiftLeft2_26(20);
	var j_splice = new Splicer(20);

	var rs_hz_d1 = new Dup(20);
	var rt_hz_d1 = new Dup(20);

	var ext = new Ext32(20);

	var reg = new Reg(20);
	var r0_dup = new Dup(20);
	var r0_mux1 = new Mux(20);
	var r0_fwwb_mux = new Mux(20);
	var r1_fwwb_mux = new Mux(20);
	var r01_fwwb_d1 = new Dup(20);
	
	
	var fwwb_d1 = new Splitter(20, [[63, 0], [31, 0]]);

	var ctrl = new Ctrl(40);
	var alusrc0_d1 = new Dup(40);

	var idex = new ID_EX(2);

	var rt_d = new Dup(20);
	var rw_mux = new Mux(20);

	var fwwb_d2 = new Splitter(20, [[63, 0], [31, 0]]);	
	var r01_fwwb_d2 = new Dup(20);
	var r01_fwmem_d1 = new Dup(20);
	
	var r0_mux2 = new Mux(20);

	var r1_mux1 = new Mux(20);
	var r1_d1 = new Dup(20);
	
	var r1_mux2 = new Mux(20);

	var alu = new ALU(20);

	var b_and = new ANDGate(20);

	var imm_d1 = new Dup(20);
	var pc4_d1 = new Dup(20);
	var imm_shift = new ShiftLeft2_32(20);
	var b_adder = new Adder32(20);
	
	var exmem = new EX_MEM(3);

	var aout_s1 = new Splitter(20, [[31, 0], [63, 0]]);
	var aout_s2 = new Splitter(20, [[31, 0], [63, 0]]);

	var mem = new DMem(20);

	var wr_dup1 = new Dup(20);

	var memwb = new MEM_WB(4);

	var wr_dup2 = new Dup(20);
	
	var wrdata_mux = new Mux(20);

	/* Connect the muxes infront of the PC */
	Wire.connect32([pc_adder_d1, 1], [pc_bmux, 1]);
	Wire.connect32([b_adder, 0], [pc_bmux, 2]);

	Wire.connect32([pc_bmux, 0], [pc_jmux, 1]);
	Wire.connect32([j_splice, 0], [pc_jmux, 2]);

	Wire.connect32([pc_jmux, 0], [pc_jrmux, 1]);
	Wire.connect32([r0_dup, 1], [pc_jrmux, 2]);

	/* Connect the PC */
	Wire.connect32([pc_jrmux, 0], [pc, PC.In.kInstr]);
	Wire.connect32([pc, 0], [pc_d1, 0]);
	Wire.connect32([pc_d1, 0], [instr_mem, 0]);
	Wire.connect32([pc_d1, 1], [pc_adder, 0]);

	/* Connect the PC adder */
	Wire.connect32([pc_adder, 0], [pc_adder_d1, 0]);
	Wire.connect32([pc_adder_d1, 0], [ifid.data, IF_ID.kPCPlus4]);

	/* Connect the Instruction memory */
	Wire.connect32([instr_mem, 0], [ifid.data, IF_ID.kInstr]);

	/* Connect PC Plus 4 in ID stage */
	Wire.connect32([ifid.data, IF_ID.kPCPlus4], [pc4_s1, 0]);
	Wire.connect32([pc4_s1, 0], [idex.data, ID_EX.kPCPlus4]); 
	Wire.connect32([pc4_s2, 1], [j_splice, 0]);

	/* Connect the instruction bits */
	Wire.connect32([ifid.data, IF_ID.kInstr], [ifid_s1, 0]);
	Wire.connect32([ifid_s1, 0], [ctrl, Ctrl.In.kOpcode]);
	Wire.connect32([ifid_s1, 1], [ctrl, Ctrl.In.kFunct]);
	Wire.connect32([ifid_s1, 2], [reg, Reg.In.kReadReg0]);
	Wire.connect32([ifid_s1, 3], [reg, Reg.In.kReadReg1]);
	Wire.connect32([ifid_s1, 4], [rs_hz_d1, 0]);
	Wire.connect32([ifid_s1, 5], [rt_hz_d1, 0]);
	Wire.connect32([ifid_s1, 6], [idex.data, ID_EX.D.kRd]);
	Wire.connect32([ifid_s1, 7], [ext, 0]);
	Wire.connect32([ifid_s1, 8], [j_shift, 0]);

	/* Connect the jump shift */
	Wire.connect32([j_shift, 0], [j_splice, 1]);

	/* Connect the extender */
	Wire.connect32([ext, 0], [idex.data, ID_EX.D.kImmediate]);

	/* Connect register output */
	Wire.connect32([reg, Reg.Out.kReg0], [r0_mux1, 1]);
	Wire.connect32([reg, Reg.Out.kLo], [r0_mux1, 3]);
	Wire.connect32([reg, Reg.Out.kHi], [r0_mux1, 4]);
	Wire.connect32([r0_mux1, 0], [r0_fwwb_mux, 1]);
	Wire.connect32([r01_fwwb_d1, 0], [r0_fwwb_mux, 2]);
	Wire.connect32([r0_fwwb_mux, 0], [idex.data, ID_EX.D.kReg0]);
	
	Wire.connect32([reg, Reg.Out.kReg1], [r1_fwwb_mux, 1]);
	Wire.connect32([r01_fwwb_d1, 1], [r1_fwwb_mux, 2]);
	Wire.connect32([r1_fwwb_mux, 0], [idex.data, ID_EX.D.kReg1]);

	/* Connect Rs and Rd duplicators */
	Wire.connect32([rs_hz_d1, 0], [idex.data, ID_EX.D.kRs]);
	//Wire.connect32([rs_hz_d1, 1], [hazard, ...]);
	Wire.connect32([rt_hz_d1, 0], [idex.data, ID_EX.D.kRt]);
	//Wire.connect32([rt_hz_d1, 1], [hazard, ...]);

	/* Connect control signals for ID stage */
	Wire.connect32([ctrl, Ctrl.kRegWrite], [idex.ctrl, Ctrl.kRegWrite]);
	Wire.connect32([ctrl, Ctrl.kMemToReg], [idex.ctrl, Ctrl.kMemToReg]);
	Wire.connect32([ctrl, Ctrl.kMemWrite], [idex.ctrl, Ctrl.kMemWrite]);
	Wire.connect32([ctrl, Ctrl.kMemCtrl], [idex.ctrl, Ctrl.kMemCtrl]);
	Wire.connect32([ctrl, Ctrl.kALUCtrl], [idex.ctrl, Ctrl.kALUCtrl]);
	Wire.connect32([ctrl, Ctrl.kALUSrc0], [alusrc0_d1, 0]);
	Wire.connect32([alusrc0_d1, 0], [idex.ctrl, Ctrl.kALUSrc0]);
	Wire.connect32([alusrc0_d1, 1], [r0_mux1, 0]);
	Wire.connect32([ctrl, Ctrl.kALUSrc1], [idex.ctrl, Ctrl.kALUSrc1]);
	Wire.connect32([ctrl, Ctrl.kRegDest], [idex.ctrl, Ctrl.kRegDest]);
	Wire.connect32([ctrl, Ctrl.kBranch], [idex.ctrl, Ctrl.kBranch]);
	Wire.connect32([ctrl, Ctrl.kJump], [pc_jmux, 0]);
	Wire.connect32([ctrl, Ctrl.kJumpR], [pc_jrmux, 0]);
	Wire.connect32([ctrl, Ctrl.kExtendCtrl], [ext, Ext32.In.kCtrl]);

	/* Connect forwarding for EX stage */
	Wire.connect32([fwwb_d1, 1], [r01_fwwb_d1, 0]);
	Wire.connect32([fwwb_d1, 0], [reg, Reg.In.kWriteData]);

	/* Connect control signals for EX stage */
	Wire.connect32([idex.ctrl, Ctrl.kRegWrite], [exmem.ctrl, Ctrl.kRegWrite]);
	Wire.connect32([idex.ctrl, Ctrl.kMemToReg], [exmem.ctrl, Ctrl.kMemToReg]);
	Wire.connect32([idex.ctrl, Ctrl.kMemWrite], [exmem.ctrl, Ctrl.kMemWrite]);
	Wire.connect32([idex.ctrl, Ctrl.kMemCtrl], [exmem.ctrl, Ctrl.kMemCtrl]);
	Wire.connect32([idex.ctrl, Ctrl.kRegWrite], [exmem.ctrl, Ctrl.kRegWrite]);

	Wire.connect32([idex.ctrl, Ctrl.kBranch], [b_and, 0]);
	Wire.connect32([idex.ctrl, Ctrl.kALUCtrl], [alu, ALU.In.kALUCtrl]);
	//Wire.connect32([idex.ctrl, Ctrl.kALUSrc0], [hazard, ...]);
	//Wire.connect32([idex.ctrl, Ctrl.kALUSrc1], [hazard, ...]);
	Wire.connect32([idex.ctrl, Ctrl.kRegDest], [rw_mux, 0]);

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
	//Wire.connect32([idex.data, ID_EX.D.kRs], [hazard, ...]);
	Wire.connect32([idex.data, ID_EX.D.kRt], [rt_d, 0]);
	Wire.connect32([rt_d, 0], [rw_mux, 1]);
	//Wire.connect32([rt_d, 1], [hazard, ...]);
	Wire.connect32([idex.data, ID_EX.D.kRd], [rw_mux, 2]);
	//Wire.connect32([const_ra, 0], [rw_mux, 3]);
	//Wire.connect32([const_lo, 0], [rw_mux, 4]);
	Wire.connect32([rw_mux, 0], [exmem.data, EX_MEM.D.kWriteReg]);

	/* Connect forwarding for EX stage */
	Wire.connect32([fwwb_d2, 1], [r01_fwwb_d2, 0]);
	Wire.connect32([fwwb_d2, 0], [fwwb_d1, 0]);

	/* Connect write data */
	Wire.connect32([r1_d1, 1], [exmem.data, EX_MEM.D.kWriteData]);

	/* Connect ALU outputs and branch */
	Wire.connect32([alu, ALU.Out.kZero], [b_and, 1]);
	Wire.connect32([b_and, 0], [pc_bmux, 0]);
	Wire.connect32([alu, ALU.Out.kResult], [exmem.data, EX_MEM.D.kALUResult]);

	/* Connect control signals for MEM Stage */
	Wire.connect32([exmem.ctrl, Ctrl.kRegWrite], [memwb.ctrl, Ctrl.kRegWrite]);
	Wire.connect32([exmem.ctrl, Ctrl.kMemToReg], [memwb.ctrl, Ctrl.kMemToReg]);
	Wire.connect32([exmem.ctrl, Ctrl.kMemWrite], [mem, DMem.In.kMemWrite]);
	Wire.connect32([exmem.ctrl, Ctrl.kMemCtrl], [mem, DMem.In.kMemCtrl]);

	/* Connect memory */
	Wire.connect32([exmem.data, EX_MEM.D.kALUResult], [aout_s1, 0]);
	Wire.connect32([aout_s1, 0], [mem, DMem.In.kAddr]);
	Wire.connect32([aout_s1, 1], [aout_s2, 0]);
	Wire.connect32([aout_s2, 0], [r01_fwmem_d1, 0]);
	Wire.connect32([aout_s2, 1], [memwb.data, MEM_WB.D.kALUOut]);
	Wire.connect32([exmem.data, EX_MEM.D.kWriteData], [mem, DMem.In.kWriteData]);

	Wire.connect32([mem, DMem.Out.kReadData], [memwb.data, MEM_WB.D.kReadData]);

	Wire.connect32([exmem.data, EX_MEM.D.kWriteReg], [wr_dup1, 0]);
	Wire.connect32([wr_dup1, 0], [memwb.data, MEM_WB.D.kWriteReg]);
	//Wire.connect32([wr_dup1, 1], [hazard, ...]);

	/* Connect signals for WB stage */
	Wire.connect32([memwb.ctrl, Ctrl.kRegWrite], [reg, Reg.In.kRegWrite]);
	Wire.connect32([memwb.ctrl, Ctrl.kMemToReg], [wrdata_mux, 0]);

	/* Connect Everything else */
	Wire.connect32([memwb.data, MEM_WB.D.kALUOut], [wrdata_mux, 1]);
	Wire.connect32([memwb.data, MEM_WB.D.kReadData], [wrdata_mux, 2]);
	Wire.connect32([wrdata_mux, 0], [fwwb_d2, 0]);

	Wire.connect32([memwb.data, MEM_WB.D.kWriteReg], [wr_dup2, 0]);
	//Wire.connect32([wr_dup2, 0], [hazard, ...]);
	Wire.connect32([wr_dup2, 1], [reg, Ref.In.kWriteReg]);

	MIPs.queue.insert(pc);
}












