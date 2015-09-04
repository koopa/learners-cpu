const CONTROL_REG_NOP        = 0x00;
const CONTROL_REG_WRITE_DATA = 0x01;
const CONTROL_REG_READ_DATA  = 0x02;
const CONTROL_REG_WRITE_ADDR = 0x03;
const CONTROL_REG_INCREASE   = 0x04;

const CONTROL_MEM_NOP        = 0x00;
const CONTROL_MEM_WRITE_DATA = 0x01;
const CONTROL_MEM_READ_DATA  = 0x02;

const CONTROL_ALU_NOP     = 0x00;
const CONTROL_ALU_ADD     = 0x01;
const CONTROL_ALU_CMP     = 0x02;
const CONTROL_ALU_NAND    = 0x03;
const CONTROL_ALU_INV     = 0x04;
const CONTROL_ALU_SHIFT_R = 0x05;
const CONTROL_ALU_SHIFT_L = 0x06;

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
const OP_JUMP_IF_EQUAL   = 0x06;
const OP_NAND            = 0x07;
const OP_SHIFT_LEFT      = 0x08;
const OP_SHIFT_RIGHT     = 0x09;
const OP_LOAD            = 0x0a;
const OP_STORE           = 0x0b;
const OP_MOVE            = 0x0c;
const OP_SET             = 0x0d;


export class DEBUG {

    static getcaller(level:number) {
        var stack = new Error()['stack']
        var elems = stack.split('\n')
        var e = elems[level+2]
        return e.trim().replace('at ', '')
    }

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
                return(DEBUG.op_name(op.op_code) + ' R' +  op.reg0 + ' 0x' +  op.value.toString(16));
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
            case OP_JUMP_IF_EQUAL    : return 'OP_JUMP_IF_EQUAL';
            case OP_NAND            : return 'OP_NAND';
            case OP_SHIFT_LEFT      : return 'OP_SHIFT_LEFT';
            case OP_SHIFT_RIGHT     : return 'OP_SHIFT_RIGHT';
            case OP_LOAD            : return 'OP_LOAD';
            case OP_STORE           : return 'OP_STORE';
            case OP_MOVE            : return 'OP_MOVE';
            case OP_SET             : return 'OP_SET';
        }
    }
}

export class Component {
    simulation:     Simulation;
    identifier:     string;

    update()   { throw "Component didn't implement update()"}

    constructor(simulation: Simulation, identifier='') {
        this.simulation = simulation
        this.identifier = identifier
    }
}

export class Simulation {
    queue:   Component[]
    current: Component[]

    constructor() {
        this.queue   = []
        this.current = []
    }

    in_list(l: Component[], c: Component):boolean {
        for (var e of l) {
            if (e === c) {
                return true
            }
        }
        return false
    }

    notify(c: Component) {

        if (!c.identifier) {
            var caller = DEBUG.getcaller(2)
            throw 'Notifying undefined object? - ' + caller
        }

        if (this.in_list(this.current, c)) {
            //console.log(`not queueing ${c.identifier}, would cause loop`)
            return
        }

        // Make sure our element is the last in the queue,
        // also ensure we don't do duplicates
        var new_queue:Component[] = this.queue.filter(
            function (elem:Component):boolean { return elem !== c}
        )

        //console.log(`queueing: ${c.identifier}, requested via ${DEBUG.getcaller(1)}`)
        this.queue = new_queue
        this.queue.push(c)
    }

    handle_next() {
        if (this.queue.length == 0) {
            return false;
        }
        var c = this.queue.shift()
        var prev = this.current
        this.current.push(c)
        //console.log(`#### Updating ${c.identifier}`)
        c.update()
        this.current.pop()
        return true;
    }
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

    constructor(width:number, simulation:Simulation, identifier='') {
        super(simulation, identifier)
        this.targets = []
        this.width = width;
        this.value = 0;
    }

    write(value:number) {
        if (this.write_count > 0) {
            throw new Error(`Multiple writes to ${this.identifier} during single clock cycle, check CPU`)
        }
        if (this.value != value) {
            this.write_count++;
            this.value = value;
            this.simulation.notify(this)
        }
    }

    subscribe(c: Component) {
        if (!c.identifier) {
            var caller = DEBUG.getcaller(1)
            throw 'Unknown subscriber - ' + caller
        }

        this.targets.push(c)
    }

    update() {
        this.write_count = 0
        for (var t of this.targets) {
            this.simulation.notify(t)
        }
    }
}


export class Memory extends Component {
    storage:     number[];
    addr_bus:    Wire;
    control_bus: Wire;
    data_bus:    Wire;

    constructor(control:Wire, addr_bus: Wire, data_bus: Wire, size:number, simulation:Simulation) {
        super(simulation, 'Memory');
        this.control_bus = control;
        this.addr_bus    = addr_bus;
        this.data_bus    = data_bus;

        this.data_bus   .subscribe(this)
        this.addr_bus   .subscribe(this)
        this.control_bus.subscribe(this)

        this.storage = []
        for (var i=0; i< size; i++) {
            this.storage[i] = 0;
        }
    }

    update() {
        var tmp:number;
        switch (this.control_bus.value) {
            case CONTROL_MEM_WRITE_DATA:
                tmp = this.storage[this.addr_bus.value]
                //console.log(`Memory: WRITE TO DATA BUS: ${tmp.toString(16)}`)
                this.data_bus.write(tmp);
                break;

            case CONTROL_MEM_READ_DATA:
                tmp = this.data_bus.value
                //console.log(`Memory: READ FROM DATA BUS: addr=${this.addr_bus.value.toString(16)} val=${tmp.toString(16)}`)
                this.storage[this.addr_bus.value] = tmp
                break;

            case CONTROL_MEM_NOP:
            default:
                break;
        }
    }
}

export class Register extends Component {
    value:       number;
    addr_bus:    Wire;
    control_bus: Wire;
    data_bus:    Wire;

    constructor(control:Wire, addr_bus: Wire, data_bus: Wire,simulation:Simulation, identifier='') {
        super(simulation, identifier);
        this.control_bus = control;
        this.addr_bus    = addr_bus;
        this.data_bus    = data_bus;
        this.value       = 0;

        this.data_bus   .subscribe(this)
        this.addr_bus   .subscribe(this)
        this.control_bus.subscribe(this)
    }
    update() {
        switch (this.control_bus.value) {
            case CONTROL_REG_WRITE_DATA:
                //console.log(`Reg ${this.identifier}: WRITE TO DATA BUS: ${this.value.toString(16)}`)
                this.data_bus.write(this.value);
                break;
            case CONTROL_REG_WRITE_ADDR:
                //console.log(`Reg ${this.identifier}: WRITE TO ADDR BUS: ${this.value.toString(16)}`)
                this.addr_bus.write(this.value);
                break;
            case CONTROL_REG_INCREASE:
                this.value += 1;
                //console.log(`Reg ${this.identifier}: INCREASE: ${this.value.toString(16)}`)
                break;
            default:
            case CONTROL_REG_READ_DATA:
                this.value = this.data_bus.value
                //console.log(`Reg ${this.identifier}: READ FROM DATA BUS: ${this.value.toString(16)}`)
                break;
            case CONTROL_REG_NOP:
                break;
        }
    }
}

export class ALU extends Component {
    public static STATUS_OK       = 0x00;
    public static STATUS_OVERFLOW = 0x01;
    public static STATUS_EQUAL    = 0x02;
    public static STATUS_CARRY    = 0x04;
    public static STATUS_ERROR    = 0x08;

    control_bus: Wire;
    reg_op0:     Register;
    reg_op1:     Register;
    output:      Wire;
    status:      number;

    constructor(control:Wire, reg_op0:Register, reg_op1:Register, output:Wire, simulation:Simulation) {
        super(simulation, 'ALU');

        this.control_bus = control;
        this.reg_op0     = reg_op0;
        this.reg_op1     = reg_op1;
        this.output      = output;


        control.subscribe(this)

        this.status      = 0x00;
    }

    update() {
        var tmp: number;
        switch (this.control_bus.value) {
            case CONTROL_ALU_ADD:
                this.output.write((this.reg_op0.value + this.reg_op1.value) & 0XFFFF);
                this.status = (this.reg_op0.value + this.reg_op1.value > 0xffff)
                     ? ALU.STATUS_CARRY
                     : ALU.STATUS_OK;
                break;

            case CONTROL_ALU_CMP:
                tmp = (this.reg_op0.value === this.reg_op1.value) ? 1 : 0

                // The status field is used by OP_JUMP_IF_EQUAL
                this.status = (tmp)
                    ? ALU.STATUS_EQUAL
                    : ALU.STATUS_OK;

                this.output.write(tmp);
                break;

            case CONTROL_ALU_NAND:
                tmp = ~(this.reg_op0.value & this.reg_op1.value) & 0XFFFF
                this.output.write(tmp);
                this.status = ALU.STATUS_OK;
                break;

            case CONTROL_ALU_INV:
                tmp = ~(this.reg_op0.value) & 0XFFFF
                this.output.write(tmp);
                this.status = ALU.STATUS_OK;
                break;
            case CONTROL_ALU_SHIFT_R:
                tmp = (this.reg_op0.value >> this.reg_op1.value) & 0XFFFF
                this.output.write(tmp);
                this.status = ALU.STATUS_OK;
                break;

            case CONTROL_ALU_SHIFT_L:
                tmp = (this.reg_op0.value << this.reg_op1.value) & 0XFFFF
                //console.log(`ALU: SHIFT L ${this.reg_op0.value.toString(16)} ${this.reg_op1.value.toString(16)} = ${tmp.toString(16)}`)
                this.output.write(tmp);
                this.status = ALU.STATUS_OK;
                break;

            case CONTROL_ALU_NOP:
            default:
                break;
        }
    }
}

export class CPU extends Component {
    addr_bus:       Wire;
    memory_control: Wire;
    data_bus:       Wire;

    pc_control:     Wire;
    reg0_control:   Wire;
    reg1_control:   Wire;
    reg2_control:   Wire;
    reg3_control:   Wire;

    alu_control:    Wire;
    ir_control:     Wire;

    alu:    ALU;

    instruction: Register;
    pc:          Register;
    reg0:        Register;
    reg1:        Register;
    reg2:        Register;
    reg3:        Register;

    state:       Function;

    constructor(memory_control: Wire, addr_bus: Wire, data_bus: Wire, simulation:Simulation) {
        super(simulation, 'Controller');

        this.addr_bus       = addr_bus;
        this.data_bus       = data_bus;
        this.memory_control = memory_control;

        this.pc_control     = new Wire(3, simulation, 'pc_control');
        this.reg0_control   = new Wire(3, simulation, 'reg0_control');
        this.reg1_control   = new Wire(3, simulation, 'reg1_control');
        this.reg2_control   = new Wire(3, simulation, 'reg2_control');
        this.reg3_control   = new Wire(3, simulation, 'reg3_control');

        this.ir_control     = new Wire(3, simulation, 'ir_control');

        this.alu_control    = new Wire(4, simulation, 'alu_control');

        this.pc   = new Register(this.pc_control,   this.addr_bus, this.data_bus, simulation, 'PC');

        this.reg0 = new Register(this.reg0_control, this.addr_bus, this.data_bus, simulation, 'REG0');
        this.reg1 = new Register(this.reg1_control, this.addr_bus, this.data_bus, simulation, 'REG1');
        this.reg2 = new Register(this.reg2_control, this.addr_bus, this.data_bus, simulation, 'REG2');
        this.reg3 = new Register(this.reg3_control, this.addr_bus, this.data_bus, simulation, 'REG3');

        this.alu         = new ALU(this.alu_control, this.reg0, this.reg1, this.data_bus, simulation);
        this.instruction = new Register(this.ir_control, this.addr_bus, this.data_bus, simulation, 'IR');

        this.state = this.fetch_instruction.bind(this)
    }

    decode(instr: number): Operation {
        var op    = (instr >> 12) & 0x0f;
        var reg0  = (instr >>  8) & 0x0f;
        var reg1  = (instr >>  4) & 0x0f;
        var value = (instr      ) & 0xff;

        var op_type = 0;
        switch (op) {
            case OP_NOP:
            case OP_HALT:
            case OP_CMP:
                op_type = OPTYPE_R0_V0;
                break;

            case OP_ADD:
            case OP_INV:
            case OP_NAND:
            case OP_SHIFT_LEFT:
            case OP_SHIFT_RIGHT:
            case OP_JUMP:
            case OP_JUMP_IF_EQUAL:
                op_type = OPTYPE_R1_V0;
                break;

            case OP_LOAD:
            case OP_STORE:
            case OP_MOVE:
                op_type = OPTYPE_R2_V0
                break;

            case OP_SET:
                op_type = OPTYPE_R1_V1
                break;
        }


        return {
            op_code: op,
            op_type: op_type,
            reg0: reg0,
            reg1: reg1,
            value: value,
        };
    }

    fetch_instruction() {
        //console.log('-- fetch_instruction')
        // Reset all controls for the next clock cycle

        this.reg0_control   .write(CONTROL_REG_NOP)
        this.reg1_control   .write(CONTROL_REG_NOP)
        this.reg2_control   .write(CONTROL_REG_NOP)
        this.reg3_control   .write(CONTROL_REG_NOP)
        this.alu_control    .write(CONTROL_ALU_NOP)

        // put value that pc points to into ir
        this.memory_control .write(CONTROL_MEM_WRITE_DATA)
        this.ir_control     .write(CONTROL_REG_READ_DATA);
        this.pc_control     .write(CONTROL_REG_WRITE_ADDR);

        return this.run_instruction;
    }

    increase_pc() {
        //console.log('-- increase_pc')
        this.pc_control.write(CONTROL_REG_INCREASE);
        return this.fetch_instruction;
    }

    run_instruction() {
        //console.log('-- run_instruction')

        var op = this.decode(this.instruction.value);
        //console.log(DEBUG.op_to_str(op))

        this.pc_control.write(CONTROL_REG_NOP)
        this.ir_control.write(CONTROL_REG_NOP)

        this.memory_control.write(CONTROL_MEM_NOP)

        this.reg0_control.write(CONTROL_REG_NOP)
        this.reg1_control.write(CONTROL_REG_NOP)
        this.reg2_control.write(CONTROL_REG_NOP)
        this.reg3_control.write(CONTROL_REG_NOP)

        switch (op.op_code) {
            case OP_NOP:
                return this.increase_pc
                break

            case OP_ADD:
                switch(op.reg0) {
                    case 0: this.reg0_control.write(CONTROL_REG_READ_DATA); break
                    case 1: this.reg1_control.write(CONTROL_REG_READ_DATA); break
                    case 2: this.reg2_control.write(CONTROL_REG_READ_DATA); break
                    case 3: this.reg3_control.write(CONTROL_REG_READ_DATA); break
                }
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
                this.pc_control.write(CONTROL_REG_READ_DATA)
                switch(op.reg0) {
                    case 0: this.reg0_control.write(CONTROL_REG_WRITE_DATA); break
                    case 1: this.reg1_control.write(CONTROL_REG_WRITE_DATA); break
                    case 2: this.reg2_control.write(CONTROL_REG_WRITE_DATA); break
                    case 3: this.reg3_control.write(CONTROL_REG_WRITE_DATA); break
                }
                return this.fetch_instruction
                break;

            case OP_JUMP_IF_EQUAL:
                switch (this.alu.status) {
                    case ALU.STATUS_EQUAL:
                        this.pc_control.write(CONTROL_REG_READ_DATA)
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
                switch(op.reg0) {
                    case 0: this.reg0_control.write(CONTROL_REG_READ_DATA); break
                    case 1: this.reg1_control.write(CONTROL_REG_READ_DATA); break
                    case 2: this.reg2_control.write(CONTROL_REG_READ_DATA); break
                    case 3: this.reg3_control.write(CONTROL_REG_READ_DATA); break
                }
                this.alu_control.write(CONTROL_ALU_INV);
                return this.increase_pc
                break;

            case OP_NAND:
                switch(op.reg0) {
                    case 0: this.reg0_control.write(CONTROL_REG_READ_DATA); break
                    case 1: this.reg1_control.write(CONTROL_REG_READ_DATA); break
                    case 2: this.reg2_control.write(CONTROL_REG_READ_DATA); break
                    case 3: this.reg3_control.write(CONTROL_REG_READ_DATA); break
                }
                this.alu_control.write(CONTROL_ALU_NAND);
                return this.increase_pc
                break;

            case OP_SHIFT_LEFT:
                switch(op.reg0) {
                    case 0: this.reg0_control.write(CONTROL_REG_READ_DATA); break
                    case 1: this.reg1_control.write(CONTROL_REG_READ_DATA); break
                    case 2: this.reg2_control.write(CONTROL_REG_READ_DATA); break
                    case 3: this.reg3_control.write(CONTROL_REG_READ_DATA); break
                }
                this.alu_control.write(CONTROL_ALU_SHIFT_L);
                return this.increase_pc
                break;

            case OP_SHIFT_RIGHT:
                switch(op.reg0) {
                    case 0: this.reg0_control.write(CONTROL_REG_READ_DATA); break
                    case 1: this.reg1_control.write(CONTROL_REG_READ_DATA); break
                    case 2: this.reg2_control.write(CONTROL_REG_READ_DATA); break
                    case 3: this.reg3_control.write(CONTROL_REG_READ_DATA); break
                }
                this.alu_control.write(CONTROL_ALU_SHIFT_R);
                return this.increase_pc
                break;

            case OP_LOAD:
                this.memory_control.write(CONTROL_MEM_WRITE_DATA);

                switch(op.reg0) {
                    case 0: this.reg0_control.write(CONTROL_REG_READ_DATA); break
                    case 1: this.reg1_control.write(CONTROL_REG_READ_DATA); break
                    case 2: this.reg2_control.write(CONTROL_REG_READ_DATA); break
                    case 3: this.reg3_control.write(CONTROL_REG_READ_DATA); break
                }
                switch(op.reg1) {
                    case 0: this.reg0_control.write(CONTROL_REG_WRITE_ADDR); break
                    case 1: this.reg1_control.write(CONTROL_REG_WRITE_ADDR); break
                    case 2: this.reg2_control.write(CONTROL_REG_WRITE_ADDR); break
                    case 3: this.reg3_control.write(CONTROL_REG_WRITE_ADDR); break
                }
                return this.increase_pc
                break;

            case OP_STORE:
                switch(op.reg0) {
                    case 0: this.reg0_control.write(CONTROL_REG_WRITE_DATA); break
                    case 1: this.reg1_control.write(CONTROL_REG_WRITE_DATA); break
                    case 2: this.reg2_control.write(CONTROL_REG_WRITE_DATA); break
                    case 3: this.reg3_control.write(CONTROL_REG_WRITE_DATA); break
                }
                switch(op.reg1) {
                    case 0: this.reg0_control.write(CONTROL_REG_WRITE_ADDR); break
                    case 1: this.reg1_control.write(CONTROL_REG_WRITE_ADDR); break
                    case 2: this.reg2_control.write(CONTROL_REG_WRITE_ADDR); break
                    case 3: this.reg3_control.write(CONTROL_REG_WRITE_ADDR); break
                }
                // Hack until we have a cleaner architecture: reset memory_control's
                // write counter so we don't have to reset everything in all other
                // cases except this one.
                this.memory_control.write_count = 0
                this.memory_control.write(CONTROL_MEM_READ_DATA)

                return this.increase_pc
                break;

            case OP_SET:
                switch(op.reg0) {
                    case 0: this.reg0_control.write(CONTROL_REG_READ_DATA); break
                    case 1: this.reg1_control.write(CONTROL_REG_READ_DATA); break
                    case 2: this.reg2_control.write(CONTROL_REG_READ_DATA); break
                    case 3: this.reg3_control.write(CONTROL_REG_READ_DATA); break
                }
                this.data_bus.write(op.value)
                return this.increase_pc
                break

            case OP_MOVE:
                switch(op.reg0) {
                    case 0: this.reg0_control.write(CONTROL_REG_READ_DATA); break
                    case 1: this.reg1_control.write(CONTROL_REG_READ_DATA); break
                    case 2: this.reg2_control.write(CONTROL_REG_READ_DATA); break
                    case 3: this.reg3_control.write(CONTROL_REG_READ_DATA); break
                }
                switch(op.reg1) {
                    case 0: this.reg0_control.write(CONTROL_REG_WRITE_DATA); break
                    case 1: this.reg1_control.write(CONTROL_REG_WRITE_DATA); break
                    case 2: this.reg2_control.write(CONTROL_REG_WRITE_DATA); break
                    case 3: this.reg3_control.write(CONTROL_REG_WRITE_DATA); break
                }
                return this.increase_pc
                break

        }
    }
    update() {
        if (typeof this.state != 'function') { console.log("Halted"); return }

        this.state = this.state();

    }
}

export class Machine extends Component {
    simulation:     Simulation;

    addr_bus:       Wire;
    memory_control: Wire;
    data_bus:       Wire;
    memory:         Memory;
    cpu:            CPU;

    io_chr_prev: number;

    public static OUT_CHR_OFFSET:number = 0XFFF0;
    public static INP_CHR_OFFSET:number = 0XFFF1;

    output: Function;

    constructor(output: Function) {
        super(new Simulation());

        this.output = output;

        this.memory_control = new Wire( 2, this.simulation, 'Memory CTRL');
        this.data_bus       = new Wire(16, this.simulation, 'data bus')
        this.addr_bus       = new Wire(16, this.simulation, 'addr bus')
        this.memory         = new Memory(this.memory_control, this.addr_bus, this.data_bus, 1 << 16, this.simulation)
        this.cpu            = new CPU(this.memory_control, this.addr_bus, this.data_bus, this.simulation);

        this.io_chr_prev = 0
    }

    update() {
        //console.log("####################### Machine clock ############")
        this.cpu   .update();

        // Let the state machine run
        while (this.simulation.handle_next()) {
            ;
        }

        this.handle_io();
    }


    is_running() {
        return (typeof this.cpu.state === 'function')
    }

    handle_io() {
        var last_out_chr = this.memory.storage[Machine.OUT_CHR_OFFSET]
        // Write output if the output buffer contains a nonzero value that differs from last time.
        // This means if the program wants to output the same character twice, it needs to zero
        // the output buffer inbetween.
        // An output routine should therefore always write a character, then zero the buffer again.
        if (this.io_chr_prev != last_out_chr && last_out_chr != 0) {
            this.output(String.fromCharCode(last_out_chr))
        }
        this.io_chr_prev = last_out_chr
    }

    input(character: String) {
        // Input debouncing is a task left to the program. It is suggested to use the
        // same procedure as we're using when checking whether to output something.
        // i.E. read the value and zero it afterwards, so that you can detect if a
        // character is input again.
        this.memory.storage[Machine.INP_CHR_OFFSET] = character.charCodeAt(0)
    }


    dumpstate() {
        console.log(`Machine state: IR    = ${this.cpu.instruction.value.toString(16)}`)
        console.log(`               PC    = ${this.cpu.pc.value.toString(16)}`)
        console.log(`               R0    = ${this.cpu.reg0.value.toString(16)}`)
        console.log(`               R1    = ${this.cpu.reg1.value.toString(16)}`)
        console.log(`               R2    = ${this.cpu.reg2.value.toString(16)}`)
        console.log(`               R3    = ${this.cpu.reg3.value.toString(16)}`)
        console.log(`       ALU status    = ${this.cpu.alu.status}`)
        console.log(`         Data Bus    = ${this.data_bus.value.toString(16)}`)
        console.log(`         Addr Bus    = ${this.addr_bus.value.toString(16)}`)
    }

    load_program(offset, program: number[]) {
        var count = 0
        for (var op of program) {
            this.memory.storage[offset+count] = op
            count++
        }
        //console.log(`Loaded program of length ${count} at offset ${offset}`)
    }
}
