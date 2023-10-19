import {
  buyUsingStorage,
  cliExecute,
  inHardcore,
  isUnrestricted,
  Item,
  itemAmount,
  myAdventures,
  myDaycount,
  myFullness,
  myInebriety,
  myMeat,
  myTurncount,
  pullsRemaining,
  storageAmount,
} from "kolmafia";
import { $familiar, $item, $items, $skill, get, have, set } from "libram";
import { args } from "../args";
import { Priorities } from "../engine/priority";
import { Quest, Task } from "../engine/task";
import { step } from "grimoire-kolmafia";
import { Keys, keyStrategy } from "./keys";
import { trainSetAvailable } from "./misc";
import { yellowSubmarinePossible } from "../engine/outfit";
import { underStandard } from "../lib";

/**
 * optional: If true, only pull this if there is one in storage (i.e., no mall buy).
 * useful: True if we need it, false if we don't, undefined if not sure yet.
 * duplicate: True if we should pull it even if we have it.
 * pull: The item to pull, or a list of options to pull.
 * name: If a list of options is given, what to use for the task (& sim) name.
 * description: Extra text to include in the sim message.
 */
type PullSpec = {
  optional?: boolean;
  useful?: () => boolean | undefined;
  duplicate?: boolean;
  post?: () => void;
  description?: string;
} & ({ pull: Item } | { pull: Item[] | (() => Item | Item[] | undefined); name: string });

export const pulls: PullSpec[] = [
  // Food
  {
    pull: $item`Pizza of Legend`,
    useful: () => {
      if (!get("pizzaOfLegendEaten")) return false;
      if (myFullness() >= 1) return false;
      if (myDaycount() > 1 && myAdventures() > 5) return undefined;
      return true;
    },
  },
  {
    pull: $item`Ol' Scratch's salad fork`,
    useful: () => {
      if (myFullness() >= 1) return false;
      if (myDaycount() > 1 && myAdventures() > 5) return undefined;
      return true;
    },
  },
  {
    pull: $item`Frosty's frosty mug`,
    useful: () => {
      if (myInebriety() >= 1) return false;
      if (myDaycount() > 1 && myAdventures() > 5) return undefined;
      return true;
    },
  },
  // Hero keys
  {
    pull: $item`daily dungeon malware`,
    useful: () => keyStrategy.useful(Keys.Malware),
  },
  {
    name: "Key Zappable",
    pull: () => keyStrategy.getZapChoice(0),
    useful: () => keyStrategy.useful(Keys.Zap),
    duplicate: true,
  },
  {
    name: "Key Zappable 2",
    pull: () => keyStrategy.getZapChoice(1),
    useful: () => keyStrategy.useful(Keys.Zap2),
    duplicate: true,
  },
  // Other adventure pulls
  {
    pull: $item`mafia thumb ring`,
    optional: true,
  },
  {
    pull: $item`carnivorous potted plant`,
  },
  // Survivability pulls
  {
    pull: $item`nurse's hat`,
  },
  {
    pull: $item`sea salt scrubs`,
    useful: () => have($skill`Torso Awareness`),
  },
  // General pulls
  {
    pull: $item`lucky gold ring`,
    useful: () => args.minor.lgr,
    optional: true,
    description: 'Farming currency; see the argument "lgr"',
  },
  {
    name: "Ore",
    pull: () => (get("trapperOre") === "" ? undefined : Item.get(get("trapperOre"))),
    useful: () => {
      if (trainSetAvailable()) return false;
      if (
        itemAmount($item`asbestos ore`) >= 3 &&
        itemAmount($item`linoleum ore`) >= 3 &&
        itemAmount($item`chrome ore`) >= 3
      )
        return false;
      if (have($item`Deck of Every Card`)) return false;
      if (get("trapperOre") === "") return undefined;
      return itemAmount(Item.get(get("trapperOre"))) < 3 && step("questL08Trapper") < 2;
    },
    duplicate: true,
  },
  {
    pull: $item`1,970 carat gold`,
    useful: () => {
      if (myMeat() < 250 && step("questM05Toot") > 0 && !have($item`letter from King Ralph XI`))
        return true;
      if (
        myMeat() < 4000 &&
        step("questL11Black") === 2 &&
        !have($item`forged identification documents`)
      )
        return true;
      if (step("questL11Black") > 2) return false;
      return undefined;
    },
  },
  {
    pull: $item`1952 Mickey Mantle card`,
    useful: () => {
      if (have($item`forged identification documents`) || step("questL11Black") >= 4) return false;
      if (step("questL11Black") >= 2 && myTurncount() >= 200) return true;
      return undefined;
    },
  },
  {
    pull: $items`Greatest American Pants, navel ring of navel gazing`,
    optional: true,
    name: "Runaway IoTM",
  },
  {
    pull: $item`ring of conflict`, // Last chance for -5% combat frequency
    useful: () =>
      !have($item`unbreakable umbrella`) &&
      !have($item`Space Trip safety headphones`) &&
      storageAmount($item`Space Trip safety headphones`) === 0 &&
      !have($item`protonic accelerator pack`),
  },
  { pull: $item`antique machete` },
  { pull: $item`book of matches` },
  { pull: $item`blackberry galoshes`, useful: () => step("questL11Black") < 2 },
  { pull: $item`Buddy Bjorn`, useful: () => yellowSubmarinePossible(true), optional: true },
  {
    pull: $item`killing jar`,
    useful: () =>
      !have($familiar`Melodramedary`) &&
      (get("gnasirProgress") & 4) === 0 &&
      get("desertExploration") < 100,
  },
  { pull: $item`old patched suit-pants`, optional: true },
  {
    pull: $item`transparent pants`,
    optional: true,
    useful: () => !have($item`designer sweatpants`),
  },
  { pull: $item`deck of lewd playing cards`, optional: true },
  { pull: $item`gravy boat`, useful: () => !underStandard() },
  {
    pull: $item`Mohawk wig`,
    useful: () => (have($item`S.O.C.K.`) ? !have($item`Mohawk wig`) : undefined), // if one didn't drop naturally
  },
  { pull: $item`11-leaf clover`, duplicate: true, useful: () => get("zeppelinProtestors") < 80 },
  {
    pull: $item`wet stew`,
    useful: () =>
      step("questL11Palindome") < 5 &&
      !have($item`wet stunt nut stew`) &&
      !have($item`wet stew`) &&
      (!have($item`lion oil`) || !have($item`bird rib`)),
  },
  {
    pull: $item`ninja rope`,
    useful: () => step("questL08Trapper") < 3 && step("questL11Shen") > 3,
  },
  {
    pull: $item`ninja carabiner`,
    useful: () => step("questL08Trapper") < 3 && step("questL11Shen") > 3,
  },
  {
    pull: $item`ninja crampons`,
    useful: () => step("questL08Trapper") < 3 && step("questL11Shen") > 3,
  },
];

class Pull {
  items: () => (Item | undefined)[];
  name: string;
  optional: boolean;
  duplicate: boolean;
  useful: () => boolean | undefined;
  post: () => void;
  description?: string;

  constructor(spec: PullSpec) {
    if ("name" in spec) {
      this.name = spec.name;
      this.description = spec.description ?? spec.name;
    } else {
      this.name = spec.pull.name;
      this.description = spec.description;
    }

    const pull = spec.pull;
    if (pull instanceof Item) {
      this.items = () => [pull];
    } else if (typeof pull === "function") {
      this.items = () => {
        const result = pull();
        if (result === undefined || result instanceof Item) return [result];
        return result;
      };
    } else {
      this.items = () => pull;
    }
    this.duplicate = spec.duplicate ?? false;
    this.optional = spec.optional ?? false;
    this.useful = spec.useful ?? (() => true);
    this.post =
      spec.post ??
      (() => {
        null;
      });
  }

  public wasPulled(pulled: Set<Item>) {
    for (const item of this.items()) {
      if (item === undefined) continue;
      if (!this.duplicate && have(item)) return true;
      if (pulled.has(item)) return true;
    }
    return false;
  }

  public shouldPull(): boolean | undefined {
    const needed = this.useful();
    if (needed === false) return false;

    for (const item of this.items()) {
      if (item === undefined) return undefined; // We don't even know which item yet
      if (!isUnrestricted(item) && underStandard()) continue;
      if (storageAmount(item) > 0) return needed;
    }
    if (this.optional) return false; // We don't have any, so we don't need one.
    return needed;
  }

  public pull(): void {
    for (const item of this.items()) {
      if (item === undefined) throw `Unable to pull ${this.name}; the desired item is undefined`;
      if (!isUnrestricted(item) && underStandard()) continue;
      if (storageAmount(item) > 0 || buyUsingStorage(1, item, 100000)) {
        cliExecute(`pull ${item.name}`);
        set("_loopsmol_pulls_used", get("_loopsmol_pulls_used", 0) + 1);
        return;
      }
    }
  }
}

enum PullState {
  PULLED,
  READY,
  MAYBE,
  UNNEEDED,
}

class PullStrategy {
  pulls: Pull[];
  enabled: PullState[];

  constructor(pulls: PullSpec[]) {
    this.pulls = pulls.map((pull) => new Pull(pull));
    this.enabled = pulls.map(() => PullState.MAYBE);
  }

  public update(): void {
    const pulled = new Set<Item>(
      get("_roninStoragePulls")
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => id > 0)
        .map((id) => Item.get(id))
    );

    let count = pullsRemaining() - (20 - args.major.pulls);
    if (inHardcore() || myTurncount() >= 1000) count = 0; // No pulls in hardcore or out of ronin

    for (let i = 0; i < this.pulls.length; i++) {
      if (this.pulls[i].wasPulled(pulled)) {
        this.enabled[i] = PullState.PULLED;
        continue;
      }

      switch (this.pulls[i].shouldPull()) {
        case false:
          this.enabled[i] = PullState.UNNEEDED;
          continue;
        case true:
          this.enabled[i] = count > 0 ? PullState.READY : PullState.MAYBE; // Only pull if there is room in the plan
          count--;
          continue;
        case undefined:
          this.enabled[i] = PullState.MAYBE;
          count--;
          continue;
      }
    }
  }

  public pullsUsed(): number {
    return get("_roninStoragePulls").split(",").length;
  }
}

export const pullStrategy = new PullStrategy(pulls);
export const PullQuest: Quest = {
  name: "Pull",
  tasks: [
    ...pullStrategy.pulls.map((pull, index): Task => {
      return {
        name: pull.name,
        priority: () => Priorities.Free,
        after: [],
        ready: () => pullStrategy.enabled[index] === PullState.READY,
        completed: () =>
          pullStrategy.enabled[index] === PullState.PULLED ||
          pullStrategy.enabled[index] === PullState.UNNEEDED,
        do: () => pull.pull(),
        post: () => {
          pull.post();
          pullStrategy.update();
        },
        limit: { tries: 1 },
        freeaction: true,
      };
    }),
    {
      // Add a last task that tracks if all pulls have been done, for routing
      name: "All",
      after: pullStrategy.pulls.map((pull) => pull.name),
      completed: () => true,
      do: (): void => {
        throw `Should never run`;
      },
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
