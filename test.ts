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
    assembler.OP_STORE(3, 2),  // Write to output buffer
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x65), // e
    assembler.OP_STORE(3, 2),  // Write to output buffer
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x6c), // l
    assembler.OP_STORE(3, 2),  // Write to output buffer
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x6c), // l
    assembler.OP_STORE(3, 2),  // Write to output buffer
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x6f), // o
    assembler.OP_STORE(3, 2),  // Write to output buffer
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x20), // (space)
    assembler.OP_STORE(3, 2),  // Write to output buffer
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x57), // W
    assembler.OP_STORE(3, 2),  // Write to output buffer
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x6f), // o
    assembler.OP_STORE(3, 2),  // Write to output buffer
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x72), // r
    assembler.OP_STORE(3, 2),  // Write to output buffer
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x6c), // l
    assembler.OP_STORE(3, 2),  // Write to output buffer
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer

    assembler.OP_SET(3, 0x64), // d
    assembler.OP_STORE(3, 2),  // Write to output buffer
    assembler.OP_SET(3, 0x00), // Clear output buffer
    assembler.OP_STORE(3, 2),  // Write to output buffer


    assembler.OP_HALT(),  // End program

]

// First test
var output  = ''
var machine = new cpu.Machine(function(data){output += data});
machine.load_program(0, program)

while(machine.is_running()) {
    machine.update();
}
console.log("Machine 1: ", output)


// Second test - using higher assembler tools
var output2  = ''
var machine2 = new cpu.Machine(function(data){output2 += data});

var program2 = new assembler.Routine(0)
program2.SET(4, 0x48)
program2.macro(assembler.MACRO_OUTPUT(2,3, 4)) // H
program2.SET(4, 0x65)
program2.macro(assembler.MACRO_OUTPUT(2,3, 4)) // e
program2.SET(4, 0x6c)
program2.macro(assembler.MACRO_OUTPUT(2,3, 4)) // l
program2.SET(4, 0x6c)
program2.macro(assembler.MACRO_OUTPUT(2,3, 4)) // l
program2.SET(4, 0x6f)
program2.macro(assembler.MACRO_OUTPUT(2,3, 4)) // o
program2.SET(4, 0x20)
program2.macro(assembler.MACRO_OUTPUT(2,3, 4)) // (space)
program2.SET(4, 0x57)
program2.macro(assembler.MACRO_OUTPUT(2,3, 4)) // W
program2.SET(4, 0x6f)
program2.macro(assembler.MACRO_OUTPUT(2,3, 4)) // o
program2.SET(4, 0x72)
program2.macro(assembler.MACRO_OUTPUT(2,3, 4)) // r
program2.SET(4, 0x6c)
program2.macro(assembler.MACRO_OUTPUT(2,3, 4)) // l
program2.SET(4, 0x64)
program2.macro(assembler.MACRO_OUTPUT(2,3, 4)) // d

machine2.load_program(0, program2.instructions)

while(machine2.is_running()) {
    machine2.update();
}
console.log("Machine 2: ", output2)
