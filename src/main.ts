import { ErrorMapper } from "utils/ErrorMapper";
import { NameGenerator } from "utils/NameGenerator";
import roleHarvester from "./modules/role.harvester";
import roleBuilder from "./modules/role.builder";
import roleUpgrader from "./modules/role.upgrader";

import MemoryRole from "types/memory.creep";

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
    role: MemoryRole;
    building?: boolean;
    upgrading?: boolean;
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

  const harvesters = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == MemoryRole.HARVESTER);
  // console.log('Harvesters: ' + harvesters.length);
  const builders = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == MemoryRole.BUILDER);
  // console.log('Builders: ' + builders.length);
  const upgraders = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == MemoryRole.UPGRADER);
  // console.log('Upgraders: ' + upgraders.length);

  if (harvesters.length < 2 && Game.spawns["Spawn1"].store[RESOURCE_ENERGY] >= 200) {
    const newName = "Harvester" + NameGenerator.getName();
    console.log("Spawning new harvester: " + newName);
    Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: MemoryRole.HARVESTER } });
  } else if (builders.length < 1 && Game.spawns["Spawn1"].store[RESOURCE_ENERGY] >= 200) {
    const newName = "Builder" + NameGenerator.getName();
    console.log("Spawning new builder: " + newName);
    Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: MemoryRole.BUILDER } });
  } else if (upgraders.length < 5 && Game.spawns["Spawn1"].store[RESOURCE_ENERGY] >= 200) {
    const newName = "Upgrader" + NameGenerator.getName();
    console.log("Spawning new upgrader: " + newName);
    Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: MemoryRole.UPGRADER } });
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
    if (creep.memory.role === MemoryRole.HARVESTER) {
      roleHarvester.run(creep);
    }
    if (creep.memory.role === MemoryRole.BUILDER) {
      roleBuilder.run(creep);
    }
    if (creep.memory.role === MemoryRole.UPGRADER) {
      roleUpgrader.run(creep);
    }
  }
});
