
const OUT_CHR_OFFSET:number = 0XFFF0;
const INP_CHR_OFFSET:number = 0XFFF1;


function op_r0_v0(opcode) {
    // Structure:   XXXX YYYY AAAA BBBB
    // where XXXX = opcode,
    //       YYYY = reg0,
    //       AAAA = reg1,
    // _or_  AAAA BBBB = val
    return opcode << 12;
}
function op_r1_v0(opcode, reg0) {
    return (opcode << 12) + (reg0 << 8)
}
function op_r2_v0(opcode, reg0, reg1) {
    return (opcode << 12) + (reg0 << 8) + (reg1 << 4)
}
function op_r1_v1(opcode, reg0, val) {
    return (opcode << 12) + (reg0 << 8) + (val & 0xff)
}

export function OP_NOP()                      {return op_r0_v0(0x00)}
export function OP_HALT()                     {return op_r0_v0(0x01)}
export function OP_CMP()                      {return op_r0_v0(0x04)}
export function OP_INV(r0)                    {return op_r1_v0(0x03, r0)}
export function OP_ADD(r0)                    {return op_r1_v0(0x02, r0)}
export function OP_NAND(r0)                   {return op_r1_v0(0x07, r0)}
export function OP_SHIFT_LEFT(r0)             {return op_r1_v0(0x08, r0)}
export function OP_SHIFT_RIGHT(r0)            {return op_r1_v0(0x09, r0)}

export function OP_JUMP(r0:number)            {return op_r1_v0(0x05, r0)}
export function OP_JUMP_IF_EQUAL(r0:number)   {return op_r1_v0(0x06, r0)}

export function OP_LOAD(r0, r1)               {return op_r2_v0(0x0a, r0, r1)}
export function OP_STORE(r0, r1)              {return op_r2_v0(0x0b, r0, r1)}
export function OP_MOVE(r0, r1)               {return op_r2_v0(0x0c, r0, r1)}

export function OP_SET(r0, val)               {return op_r1_v1(0x0d, r0, val)}


export function MACRO_SET_16bit(dest_reg:number, value:number) {
    // Sets the register <dest_reg> to the given 16 bit value.
    // Please note that any value in registers 0 and 1 will be
    // overwritten. Also, dest_reg cannot be one of those.

    var upper = value >> 8 & 0xFF
    var lower = value      & 0xFF

    return [
        // Store upper half in lower byte of reg0
        OP_SET(0, upper),

        // Shift upper half to actual upper in reg0
        OP_SET(1, 0x08),
        OP_SHIFT_LEFT(dest_reg),

        // Prepare addition
        OP_MOVE(0, dest_reg),

        // Add lower half to upper half
        OP_SET(1, lower),
        OP_ADD(dest_reg)
    ]
}

export function MACRO_OUTPUT(tmp1:number, tmp2:number, reg_to_write:number) {
    // Writes a (utf8) character to the output. Use tmp1 and tmp2
    // as temporary registers for storing the output pointer and
    // buffer clear value. As usual, registers 0 and 1 will be
    // used for processing.

    var ptr  = tmp1;
    var zero = tmp2;

    var set_addr = MACRO_SET_16bit(ptr, OUT_CHR_OFFSET)

    return set_addr.concat([
        // Clear output buffer
        OP_SET(zero, 0x00),
        OP_STORE(zero, ptr),

        // Write to output buffer
        OP_STORE(reg_to_write, ptr),
    ])
}

export class Routine {
    offset: number
    instructions: number[]

    marks: {}

    constructor(offset) {
        this.instructions = []
        this.offset = offset
        this.marks  = {}
    }

    mark(name:string) {
        this.marks[name] = this.instructions.length
    }

    macro(instructions:number[]) {
        for (var i of instructions) {
            this.instructions.push(i)
        }
    }

    NOP()                    {this.instructions.push(OP_NOP()          )}
    HALT()                   {this.instructions.push(OP_HALT()         )}
    CMP()                    {this.instructions.push(OP_CMP()          )}
    INV(r0)                  {this.instructions.push(OP_INV(r0)        )}
    ADD(r0)                  {this.instructions.push(OP_ADD(r0)        )}
    NAND(r0)                 {this.instructions.push(OP_NAND(r0)       )}
    SHIFT_LEFT(r0)           {this.instructions.push(OP_SHIFT_LEFT(r0) )}
    SHIFT_RIGHT(r0)          {this.instructions.push(OP_SHIFT_RIGHT(r0))}


    JUMP(r0:number)          {this.instructions.push(OP_JUMP(r0)         )}
    JUMP_IF_EQUAL(r0:number) {this.instructions.push(OP_JUMP_IF_EQUAL(r0))}
    LOAD(r0, r1)             {this.instructions.push(OP_LOAD(r0, r1)     )}
    STORE(r0, r1)            {this.instructions.push(OP_STORE(r0, r1)    )}
    MOVE(r0, r1)             {this.instructions.push(OP_MOVE(r0, r1)     )}
    SET(r0, val)             {this.instructions.push(OP_SET(r0, val)     )}
}
