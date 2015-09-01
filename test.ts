import cpu = require('./cpu');

var machine = new cpu.Machine();

machine.clock(); // fetch_instruction
machine.clock(); // run_instruction
machine.clock(); // increase_pc

machine.clock(); // fetch_instruction
machine.clock(); // run_instruction
machine.clock(); // increase_pc

machine.clock(); // fetch_instruction
machine.clock(); // run_instruction
machine.clock(); // increase_pc

machine.clock(); // fetch_instruction
machine.dumpstate();
