import { ErrorMapper } from "utils/ErrorMapper";
import roleHarvester from "./modules/role.harvester";
import roleBuilder from "./modules/role.builder";
import roleUpgrader from "./modules/role.upgrader";

import _ from "lodash";

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
  }

  interface CreepMemory {
    role: string;
    room?: string;
    working?: boolean;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    for (const name in Memory.creeps) {
      if (!Game.creeps[name]) {
        delete Memory.creeps[name];
        console.log("Clearing non-existing creep memory:", name);
      }
    }

    const tower = Game.getObjectById("TOWER_ID" as Id<_HasId>) as StructureTower;
    if (tower) {
      const closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: structure => structure.hits < structure.hitsMax
      });
      if (closestDamagedStructure) {
        tower.repair(closestDamagedStructure);
      }

      const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if (closestHostile) {
        tower.attack(closestHostile);
      }
    }

    const harvesters = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == 'harvester');
    // console.log('Harvesters: ' + harvesters.length);
    const builders = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == 'builder');
    // console.log('Builders: ' + builders.length);
    const upgraders = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == 'upgrader');
    // console.log('Upgraders: ' + upgraders.length);

    if (harvesters.length < 2) {
      const newName = "Harvester" + Game.time;
      console.log("Spawning new harvester: " + newName);
      Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: "harvester" } });
    } else if (builders.length < 1) {
      const newName = "Builder" + Game.time;
      console.log("Spawning new builder: " + newName);
      Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: 'builder' } });
    } else if (upgraders.length < 5) {
      const newName = "Upgrader" + Game.time;
      console.log("Spawning new upgrader: " + newName);
      Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: 'upgrader' } });
    }

    if (Game.spawns["Spawn1"].spawning) {
      const spawningCreep = Game.creeps[Game.spawns["Spawn1"].spawning.name];
      Game.spawns["Spawn1"].room.visual.text(
        "🛠️" + spawningCreep.memory.role,
        Game.spawns["Spawn1"].pos.x + 1,
        Game.spawns["Spawn1"].pos.y,
        { align: "left", opacity: 0.8 }
      );
    }

    for (const name in Game.creeps) {
      const creep = Game.creeps[name];
      if (creep.memory.role === "harvester") {
        roleHarvester.run(creep);
      }
      if (creep.memory.role === "builder") {
        roleBuilder.run(creep);
      }
      if (creep.memory.role === "upgrader") {
        roleUpgrader.run(creep);
      }
    }
  }
});
