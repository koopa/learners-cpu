const CONTROL_REG_NOP        = 0x00;
const CONTROL_REG_WRITE_DATA = 0x01;
const CONTROL_REG_READ_DATA  = 0x02;
const CONTROL_REG_WRITE_ADDR = 0x03;
const CONTROL_REG_INCREASE   = 0x04;

const CONTROL_MEM_NOP        = 0x00;
const CONTROL_MEM_WRITE_DATA = 0x01;
const CONTROL_MEM_READ_DATA  = 0x02;

const CONTROL_ALU_NOP  = 0x00;
const CONTROL_ALU_ADD  = 0x01;
const CONTROL_ALU_CMP  = 0x02;

const OPTYPE_R0_V0     = 0x01;
const OPTYPE_R1_V0     = 0x02;
const OPTYPE_R2_V0     = 0x03;
const OPTYPE_R1_V1     = 0x04;

const OP_NOP             = 0x00;
const OP_HALT            = 0x01;
const OP_ADD             = 0x02;
const OP_INV             = 0x03;
const OP_CMP             = 0x04;
const OP_JUMP            = 0x05;
const OP_JUMP_IF_ZERO    = 0x06;
const OP_NAND            = 0x07;
const OP_SHIFT_LEFT      = 0x08;
const OP_SHIFT_RIGHT     = 0x09;
const OP_LOAD            = 0x0a;
const OP_STORE           = 0x0b;
const OP_SET_LOWER       = 0x0c;
const OP_SET_UPPER       = 0x0d;

export class DEBUG {
    static op_to_str(op:Operation) {
        switch(op.op_type) {
            case OPTYPE_R0_V0:
                return(DEBUG.op_name(op.op_code));
                break;
            case OPTYPE_R1_V0:
                return(DEBUG.op_name(op.op_code) + ' R' +  op.reg0);
                break;
            case OPTYPE_R2_V0:
                return(DEBUG.op_name(op.op_code) + ' R' +  op.reg0 + ' R' +  op.reg1);
                break;
            case OPTYPE_R1_V1:
                return(DEBUG.op_name(op.op_code) + ' R' +  op.reg0 + ' V' +  op.value);
                break;
        }
    }
    static op_name(op_code):string {
        switch(op_code) {
            case OP_NOP             : return 'OP_NOP';
            case OP_HALT            : return 'OP_HALT';
            case OP_ADD             : return 'OP_ADD';
            case OP_INV             : return 'OP_INV';
            case OP_CMP             : return 'OP_CMP';
            case OP_JUMP            : return 'OP_JUMP';
            case OP_JUMP_IF_ZERO    : return 'OP_JUMP_IF_ZERO';
            case OP_NAND            : return 'OP_NAND';
            case OP_SHIFT_LEFT      : return 'OP_SHIFT_LEFT';
            case OP_SHIFT_RIGHT     : return 'OP_SHIFT_RIGHT';
            case OP_LOAD            : return 'OP_LOAD';
            case OP_STORE           : return 'OP_STORE';
            case OP_SET_LOWER       : return 'OP_SET_LOWER';
            case OP_SET_UPPER       : return 'OP_SET_UPPER';
        }
    }
}

export class Component {

    clock() {}
}


interface Operation {
    op_code: number;
    op_type: number;
    reg0:    number;
    reg1:    number;
    value:   number;
}

export class Wire extends Component {
    sources: Component[];
    targets: Component[];

    width:       number;
    value:       number;
    write_count: number;
    identifier:  string;

    constructor(width:number, identifier='') {
        super()
        this.width = width;
        this.value = 0;
        this.identifier = identifier;
    }

    write(value:number) {
        this.write_count++;
        this.value = value;
    }
    clock() {
        // No action - just sanity check
        if (this.write_count > 1) {
            throw `Multiple writes to ${this.identifier} during single clock cycle, check CPU`;
        }
        this.write_count = 0
    }
}


export class Memory extends Component {
    storage:     number[];
    addr_bus:    Wire;
    control_bus: Wire;
    data_bus:    Wire;

    constructor(control:Wire, addr_bus: Wire, data_bus: Wire, size:number) {
        super();
        this.control_bus = control;
        this.addr_bus    = addr_bus;
        this.data_bus    = data_bus;

        this.storage = []
        for (var i=0; i< size; i++) {
            this.storage[i] = 0;
        }
    }

}

export class Register extends Component {
    value:       number;
    addr_bus:    Wire;
    control_bus: Wire;
    data_bus:    Wire;

    constructor(control:Wire, addr_bus: Wire, data_bus: Wire) {
        super();
        this.control_bus = control;
        this.addr_bus    = addr_bus;
        this.data_bus    = data_bus;
        this.value       = 0
    }
    clock() {
        switch (this.control_bus.value) {
            case CONTROL_REG_NOP:
                break;
            case CONTROL_REG_WRITE_DATA:
                this.data_bus.write(this.value);
                break;
            case CONTROL_REG_READ_DATA:
                this.value = this.data_bus.value
                break;
            case CONTROL_REG_WRITE_ADDR:
                this.addr_bus.write(this.value);
                break;
            case CONTROL_REG_INCREASE:
                this.value += 1;
                break;
        }
    }
}

export class ALU extends Component {
    public static STATUS_OK         = 0x00;
    public static STATUS_OVERFLOW   = 0x01;
    public static STATUS_ZERO       = 0x02;
    public static STATUS_CARRY      = 0x04;
    public static STATUS_ERROR      = 0x08;

    control_bus: Wire;
    reg_op0:     Register;
    reg_op1:     Register;
    output:      Wire;
    status:      number;

    constructor(control:Wire, reg_op0:Register, reg_op1:Register, output:Wire) {
        super();

        this.control_bus = control;
        this.reg_op0     = reg_op0;
        this.reg_op1     = reg_op1;
        this.output      = output;

        this.status      = 0x00;
    }

    clock() {
        switch (this.control_bus.value) {
            case CONTROL_ALU_ADD:
                this.output.write((this.reg_op0.value + this.reg_op1.value) & 0XFFFF);
                this.status = (this.reg_op0.value + this.reg_op1.value > 0xffff)
                     ? ALU.STATUS_CARRY
                     : ALU.STATUS_OK;
                break;

            case CONTROL_ALU_CMP:
                this.output.write(
                    (this.reg_op0.value === this.reg_op1.value) ? 1 : 0
                );
                break;
        }
    }
}

export class CPU extends Component {
    addr_bus:       Wire;
    memory_control: Wire;
    data_bus:       Wire;

    reg0_control:   Wire;
    reg1_control:   Wire;
    reg2_control:   Wire;
    reg3_control:   Wire;

    alu_control:    Wire;
    ir_control:     Wire;

    alu:    ALU;

    instruction: Register;
    reg0:        Register;
    reg1:        Register;
    reg2:        Register;
    reg3:        Register;

    state:       Function;

    constructor(memory_control: Wire, addr_bus: Wire, data_bus: Wire) {
        super();

        this.addr_bus       = addr_bus;
        this.data_bus       = data_bus;
        this.memory_control = memory_control;

        this.reg0_control   = new Wire(3, 'reg0_control');
        this.reg1_control   = new Wire(3, 'reg1_control');
        this.reg2_control   = new Wire(3, 'reg2_control');
        this.reg3_control   = new Wire(3, 'reg3_control');

        this.ir_control     = new Wire(3, 'ir_control');

        this.alu_control    = new Wire(4, 'alu_control');

        this.reg0 = new Register(this.reg0_control, this.addr_bus, this.data_bus);
        this.reg1 = new Register(this.reg1_control, this.addr_bus, this.data_bus);
        this.reg2 = new Register(this.reg2_control, this.addr_bus, this.data_bus);
        this.reg3 = new Register(this.reg3_control, this.addr_bus, this.data_bus);


        this.alu         = new ALU(this.alu_control, this.reg1, this.reg2, this.data_bus);
        this.instruction = new Register(this.ir_control, this.addr_bus, this.data_bus);


        this.state = this.fetch_instruction.bind(this)
    }

    decode(instr: number): Operation {
        var op = (instr & 0xf000) >> 12;
        var op_type = 0;
        switch (op) {
            case OP_NOP:
            case OP_HALT:
            case OP_ADD:
            case OP_INV:
            case OP_CMP:
            case OP_NAND:
                op_type = OPTYPE_R0_V0;
                break;

            case OP_JUMP:
            case OP_JUMP_IF_ZERO:
            case OP_SHIFT_LEFT:
            case OP_SHIFT_RIGHT:
                op_type = OPTYPE_R1_V0;
                break;

            case OP_LOAD:
            case OP_STORE:
                op_type = OPTYPE_R2_V0
                break;

            case OP_SET_LOWER:
            case OP_SET_UPPER:
                op_type = OPTYPE_R1_V1
                break;
        }

        var reg0  = (instr & 0x0f00) >> 8;
        var reg1  = (instr & 0x0700) >> 8;
        var value = (instr & 0x00ff);

        return {
            op_code: op,
            op_type: op_type,
            reg0: reg0,
            reg1: reg1,
            value: value,
        };
    }

    fetch_instruction() {
        // Reset all controls for the next clock cycle
        this.memory_control .write(CONTROL_MEM_NOP)

        this.reg1_control   .write(CONTROL_REG_NOP)
        this.reg2_control   .write(CONTROL_REG_NOP)
        this.reg3_control   .write(CONTROL_REG_NOP)
        this.alu_control    .write(CONTROL_ALU_NOP)

        this.ir_control  .write(CONTROL_REG_READ_DATA);
        this.reg0_control.write(CONTROL_REG_WRITE_ADDR);

        return this.run_instruction;
    }

    increase_pc() {
        this.reg0_control.write(CONTROL_REG_INCREASE);
        return this.fetch_instruction;
    }

    run_instruction() {

        var op = this.decode(this.instruction.value);
        console.log(DEBUG.op_to_str(op))

        switch (op.op_code) {
            case OP_NOP:
                return this.increase_pc
                break

            case OP_ADD:
                this.alu_control.write(CONTROL_ALU_ADD);
                return this.increase_pc
                break;

            case OP_CMP:
                this.alu_control.write(CONTROL_ALU_CMP);
                return this.increase_pc
                break;

            case OP_HALT:
                // null goes into this.state, thus ending the state machine
                return null;
                break;

            case OP_JUMP:
                this.ir_control.write(CONTROL_REG_READ_DATA)
                switch(op.reg0) {
                    case 0: this.reg0_control.write(CONTROL_REG_WRITE_DATA); break
                    case 1: this.reg1_control.write(CONTROL_REG_WRITE_DATA); break
                    case 2: this.reg2_control.write(CONTROL_REG_WRITE_DATA); break
                    case 3: this.reg3_control.write(CONTROL_REG_WRITE_DATA); break
                }
                return this.fetch_instruction
                break;

            case OP_JUMP_IF_ZERO:
                switch (this.alu.status) {
                    case ALU.STATUS_ZERO:
                        this.ir_control.write(CONTROL_REG_READ_DATA)
                        switch(op.reg0) {
                            case 0: this.reg0_control.write(CONTROL_REG_WRITE_DATA); break
                            case 1: this.reg1_control.write(CONTROL_REG_WRITE_DATA); break
                            case 2: this.reg2_control.write(CONTROL_REG_WRITE_DATA); break
                            case 3: this.reg3_control.write(CONTROL_REG_WRITE_DATA); break
                        }
                        return this.fetch_instruction
                    default:
                        return this.increase_pc
                }
                break;
            case OP_INV:
            case OP_NAND:
            case OP_SHIFT_LEFT:
            case OP_SHIFT_RIGHT:
            case OP_LOAD:
            case OP_STORE:
            case OP_SET_LOWER:
            case OP_SET_UPPER:
                throw "Opcode not implemented";
        }
    }
    clock() {
        // Actually iterate the state machine
        if (typeof this.state == 'function') {
            this.state = this.state();

            this.reg0.clock();
            this.reg1.clock();
            this.reg2.clock();
            this.reg3.clock();
            this.alu .clock();

            // Wires / Buses don't actually do anything.
            // However the clock() call does some sanity checks
            this.addr_bus.clock()
            this.memory_control.clock()
            this.data_bus.clock()

            this.reg0_control.clock()
            this.reg1_control.clock()
            this.reg2_control.clock()
            this.reg3_control.clock()
            this.alu_control.clock()
            this.ir_control.clock()
        }
        else {
            console.log("Halted");
        }
    }
}

export class Machine extends Component {
    addr_bus:       Wire;
    memory_control: Wire;
    data_bus:       Wire;
    memory:         Memory;
    cpu:            CPU;

    constructor() {
        super();

        this.memory_control = new Wire(2);
        this.data_bus       = new Wire(16)
        this.addr_bus       = new Wire(16)
        this.memory         = new Memory(this.memory_control, this.addr_bus, this.data_bus, 1 << 16)
        this.cpu            = new CPU(this.memory_control, this.addr_bus, this.data_bus);
    }

    clock() {
        this.cpu   .clock();
        this.memory.clock();
    }

    dumpstate() {
        console.log(`Machine state: IR    = ${this.cpu.instruction.value}`)
        console.log(`               R0/PC = ${this.cpu.reg0.value}`)
        console.log(`               R1    = ${this.cpu.reg1.value}`)
        console.log(`               R2    = ${this.cpu.reg2.value}`)
        console.log(`               R3    = ${this.cpu.reg3.value}`)
        console.log(`       ALU status    = ${this.cpu.alu.status}`)
        console.log(`         Data Bus    = ${this.data_bus.value}`)
        console.log(`         Addr Bus    = ${this.addr_bus.value}`)
    }
}
