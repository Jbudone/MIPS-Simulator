
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
	
	var fwwb_d1 = new Dup(20);

	var ctrl = new Ctrl(40);
	var alusrc0_s1 = new Dup(40);

	var idex = new ID_EX(2);

	var rt_d = new Dup(20);
	var rw_mux = new Mux(20);

	var fwwd_d2 = new Dup(20);	
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
	var aout_s2 = new Splitter(20, [[63, 0], [31, 0]]);

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
	Wire.connect32([pc_adder_d1, 1], [ifid.data, IF_ID.kPCPlus4]);

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
	
	
	
}












