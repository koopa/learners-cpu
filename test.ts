import cpu       = require('./cpu');
import assembler = require('./assembler');



var program = [

    // Initialize pointer to output buffer
    assembler.OP_SET(0, 0xFF),
    assembler.OP_SET(1, 0x08),
    assembler.OP_SHIFT_LEFT(3), // R3 is now 0xFF00
    assembler.OP_MOVE(0, 3), // Move content of R3 into R1
    assembler.OP_SET(1, 0xF0),
    assembler.OP_ADD(3), // R3 is now 0xFFF0
    assembler.OP_MOVE(2, 3), // R2 is now also 0xFFF0


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

var machine = new cpu.Machine(function(data){console.log(data)});
machine.load_program(0, program)

for (var op of machine.memory.storage.slice(0, program.length)) {
    console.log(op.toString(16) + ' ' + cpu.DEBUG.op_to_str(machine.cpu.decode(op)))
}

while(machine.is_running()) {
    machine.update();
}
machine.dumpstate();
