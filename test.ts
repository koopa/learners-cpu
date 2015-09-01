import cpu       = require('./cpu');
import assembler = require('./assembler');


var machine = new cpu.Machine(console.log);

var program = [
    assembler.OP_SET(2, 0XFFF0),
    assembler.OP_SET(3, 0x48), // H
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x65), // e
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x6c), // l
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x6c), // l
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x6f), // o
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x20), // (space)
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x57), // W
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x6f), // o
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x72), // r
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x6c), // l
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x64), // d
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer


    assembler.OP_HALT(),  // End program

]

machine.load_program(0, program)

while(machine.is_running()) {
    machine.clock();
}
machine.dumpstate();
