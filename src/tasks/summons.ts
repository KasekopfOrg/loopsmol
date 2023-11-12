import {
  canFaxbot,
  chatPrivate,
  cliExecute,
  equippedAmount,
  isOnline,
  Item,
  itemAmount,
  Monster,
  myMeat,
  myTurncount,
  runCombat,
  use,
  userConfirm,
  visitUrl,
  wait,
} from "kolmafia";
import { $item, $items, $monster, $skill, CombatLoversLocket, get, have, set } from "libram";
import { CombatStrategy } from "../engine/combat";
import { debug } from "../lib";
import { args } from "../args";
import { Quest, Task } from "../engine/task";
import { step } from "grimoire-kolmafia";
import { yellowRayPossible } from "../engine/resources";
import { trainSetAvailable } from "./misc";

type SummonTarget = Omit<Task, "do" | "name" | "limit"> & {
  target: Monster;
};
const summonTargets: SummonTarget[] = [
  {
    target: $monster`mountain man`,
    after: [],
    ready: () => myMeat() >= 1000,
    completed: () => {
      if (step("questL08Trapper") >= 2) return true;
      if (!have($item`Clan VIP Lounge key`)) return true; // For now, do not do without yellow rocket
      if (trainSetAvailable()) return true;
      let ore_needed = 3;
      if (have($item`Deck of Every Card`) && get("_deckCardsDrawn") === 0) ore_needed--;
      const pulled = new Set<Item>(
        get("_roninStoragePulls")
          .split(",")
          .map((id) => parseInt(id))
          .filter((id) => id > 0)
          .map((id) => Item.get(id))
      );
      if (
        !pulled.has($item`asbestos ore`) &&
        !pulled.has($item`chrome ore`) &&
        !pulled.has($item`linoleum ore`)
      )
        ore_needed--;
      return (
        itemAmount($item`asbestos ore`) >= ore_needed ||
        itemAmount($item`chrome ore`) >= ore_needed ||
        itemAmount($item`linoleum ore`) >= ore_needed
      );
    },
    prepare: () => {
      if (
        (myTurncount() < 5 && !have($item`yellow rocket`)) ||
        equippedAmount($item`Jurassic Parka`) < 0
      ) {
        throw "Unable to actually YR the mountain man";
      }
    },
    outfit: () => {
      if (yellowRayPossible())
        return {
          equip: $items`unwrapped knock-off retro superhero cape`,
          modes: { retrocape: ["heck", "hold"] },
        };
      else
        return {
          equip: $items`unwrapped knock-off retro superhero cape`,
          modes: { retrocape: ["heck", "hold"] },
          modifier: "item",
        };
    },
    combat: new CombatStrategy().yellowRay(),
  },
];

type SummonSource = {
  name: string;
  available: () => number;
  canFight: (mon: Monster) => boolean;
  summon: (mon: Monster) => void;
};
const summonSources: SummonSource[] = [
  {
    name: "Cargo Shorts",
    available: () => (have($item`Cargo Cultist Shorts`) && !get("_cargoPocketEmptied") ? 1 : 0),
    canFight: (mon: Monster) => mon === $monster`mountain man`, // Only use for mountain man
    summon: () => cliExecute("cargo 565"),
  },
  {
    name: "White Page",
    available: () => (have($item`white page`) ? 1 : 0),
    canFight: (mon: Monster) => mon === $monster`white lion`, // Only use for mountain man
    summon: () => use($item`white page`),
  },
  {
    name: "Combat Locket",
    available: () =>
      CombatLoversLocket.have() ? CombatLoversLocket.reminiscesLeft() - args.minor.savelocket : 0,
    canFight: (mon: Monster) => CombatLoversLocket.availableLocketMonsters().includes(mon),
    summon: (mon: Monster) => CombatLoversLocket.reminisce(mon),
  },
  {
    name: "Fax",
    available: () =>
      args.minor.fax && !get("_photocopyUsed") && have($item`Clan VIP Lounge key`) ? 1 : 0,
    canFight: (mon: Monster) => canFaxbot(mon),
    summon: (mon: Monster) => {
      // Default to CheeseFax unless EasyFax is the only faxbot online
      const faxbot = ["CheeseFax", "EasyFax"].find((bot) => isOnline(bot)) ?? "CheeseFax";
      for (let i = 0; i < 6; i++) {
        if (i % 3 === 0) chatPrivate(faxbot, mon.name);
        wait(10 + i);
        if (checkFax(mon)) break;
      }
      if (!checkFax(mon))
        throw `Failed to acquire photocopied ${mon.name}.${
          !isOnline(faxbot) ? `Faxbot ${faxbot} appears to be offline.` : ""
        }`;
      use($item`photocopied monster`);
    },
  },
  {
    name: "Wish",
    available: () => (have($item`genie bottle`) ? 3 - get("_genieWishesUsed") : 0),
    canFight: () => true,
    summon: (mon: Monster) => {
      cliExecute(`genie monster ${mon.name}`);
      visitUrl("main.php");
    },
  },
];

// From garbo
function checkFax(mon: Monster): boolean {
  if (!have($item`photocopied monster`)) cliExecute("fax receive");
  if (get("photocopyMonster") === mon) return true;
  cliExecute("fax send");
  return false;
}

class SummonStrategy {
  targets: SummonTarget[];
  sources: SummonSource[];
  plan = new Map<Monster, SummonSource>();

  constructor(targets: SummonTarget[], sources: SummonSource[]) {
    this.targets = targets;
    this.sources = sources;
  }

  public update(): void {
    this.plan.clear();
    const targets = this.targets.filter((t) => !t.completed()).map((t) => t.target);
    for (const source of this.sources) {
      let available = source.available();
      for (const target of targets) {
        if (available > 0 && !this.plan.has(target) && source.canFight(target)) {
          this.plan.set(target, source);
          available -= 1;
        }
      }
    }

    if (!have($skill`Infinite Loop`) && !this.plan.has($monster`pygmy witch lawyer`))
      throw `Unable to summon pygmy witch lawyer`;
  }

  public getSourceFor(monster: Monster): SummonSource | undefined {
    return this.plan.get(monster);
  }
}
export const summonStrategy = new SummonStrategy(summonTargets, summonSources);

export const SummonQuest: Quest = {
  name: "Summon",
  tasks: summonTargets.map((task): Task => {
    return {
      ...task,
      name: task.target.name.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()), // capitalize first letter of each word
      ready: () =>
        (task.ready?.() ?? true) && summonStrategy.getSourceFor(task.target) !== undefined,
      do: () => {
        // Some extra safety around the Pygmy Witch Lawyer summon
        if (task.target === $monster`pygmy witch lawyer`) {
          if (get("_loopgyou_fought_pygmy", false)) {
            if (
              !userConfirm(
                "We already tried to fight a pygmy witch lawyer today and lost (or failed to start the fight). Are you sure we can win this time? Consider fighting a pygymy witch lawyer yourself (buy yellow rocket; ensure you have no ML running and +50 combat initative). Press yes to let the script try the fight again, or no to abort."
              )
            ) {
              throw `Abort requested`;
            }
          }
          set("_loopgyou_fought_pygmy", true);
        }

        // Perform the actual summon
        const source = summonStrategy.getSourceFor(task.target);
        if (source) {
          debug(`Summon source: ${source.name}`);
          source.summon(task.target);
        } else throw `Unable to find summon source for ${task.target.name}`;
        runCombat();
      },
      limit: { tries: 1 },
    };
  }),
};
