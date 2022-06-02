import { getProperty, numericModifier, runChoice, runCombat, visitUrl } from "kolmafia";
import { $monster } from "libram";
import { CombatStrategy } from "../combat";
import { atLevel } from "../lib";
import { OverridePriority } from "../priority";
import { Quest, step } from "./structure";

export const TavernQuest: Quest = {
  name: "Tavern",
  tasks: [
    {
      name: "Start",
      after: ["Mosquito/Finish"],
      ready: () => atLevel(3),
      completed: () => step("questL03Rat") >= 0,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      priority: () => OverridePriority.Free,
      freeaction: true,
    },
    {
      name: "Tavernkeep",
      after: ["Start"],
      completed: () => step("questL03Rat") >= 1,
      do: () => visitUrl("tavern.php?place=barkeep"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Basement",
      after: ["Tavernkeep"],
      completed: () => step("questL03Rat") >= 2,
      do: (): void => {
        visitUrl("cellar.php");
        const layout = getProperty("tavernLayout");
        const path = [3, 2, 1, 0, 5, 10, 15, 20, 16, 21];
        for (let i = 0; i < path.length; i++) {
          if (layout.charAt(path[i]) === "0") {
            visitUrl(`cellar.php?action=explore&whichspot=${path[i] + 1}`);
            runCombat();
            runChoice(-1);
            break;
          }
        }
      },
      outfit: { modifier: "ML, +combat" },
      combat: new CombatStrategy().kill($monster`drunken rat king`).ignoreNoBanish(),
      choices: {
        509: 1,
        510: 1,
        511: 2,
        514: () => (numericModifier("Stench Damage") >= 20 ? 2 : 1),
        515: () => (numericModifier("Spooky Damage") >= 20 ? 2 : 1),
        496: () => (numericModifier("Hot Damage") >= 20 ? 2 : 1),
        513: () => (numericModifier("Cold Damage") >= 20 ? 2 : 1),
      },
      limit: { tries: 10 },
    },
    {
      name: "Finish",
      after: ["Basement"],
      completed: () => step("questL03Rat") === 999,
      do: () => visitUrl("tavern.php?place=barkeep"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
