import { step } from "grimoire-kolmafia";
import {
  appearanceRates,
  Location,
  Monster,
  myFamiliar,
  myLevel,
  Phylum,
  print,
  visitUrl,
} from "kolmafia";
import { $familiar, $item, have, Snapper } from "libram";

export function debug(message: string, color?: string): void {
  if (color) {
    print(message, color);
  } else {
    print(message);
  }
}

// From phccs
export function convertMilliseconds(milliseconds: number): string {
  const seconds = milliseconds / 1000;
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = Math.round((seconds - minutes * 60) * 1000) / 1000;
  const hours = Math.floor(minutes / 60);
  const minutesLeft = Math.round(minutes - hours * 60);
  return (
    (hours !== 0 ? `${hours} hours, ` : "") +
    (minutesLeft !== 0 ? `${minutesLeft} minutes, ` : "") +
    (secondsLeft !== 0 ? `${secondsLeft} seconds` : "")
  );
}

export function atLevel(level: number): boolean {
  return myLevel() >= level;
}

const legionForms = [
  $item`Loathing Legion abacus`,
  $item`Loathing Legion can opener`,
  $item`Loathing Legion chainsaw`,
  $item`Loathing Legion corkscrew`,
  $item`Loathing Legion defibrillator`,
  $item`Loathing Legion double prism`,
  $item`Loathing Legion electric knife`,
  $item`Loathing Legion flamethrower`,
  $item`Loathing Legion hammer`,
  $item`Loathing Legion helicopter`,
  $item`Loathing Legion jackhammer`,
  $item`Loathing Legion kitchen sink`,
  $item`Loathing Legion knife`,
  $item`Loathing Legion many-purpose hook`,
  $item`Loathing Legion moondial`,
  $item`Loathing Legion necktie`,
  $item`Loathing Legion pizza stone`,
  $item`Loathing Legion rollerblades`,
  $item`Loathing Legion tape measure`,
  $item`Loathing Legion tattoo needle`,
  $item`Loathing Legion universal screwdriver`,
];
export function haveLoathingLegion(): boolean {
  return legionForms.some((item) => have(item));
}

export function tuneSnapper(phylum: Phylum) {
  if (myFamiliar() === $familiar`Red-Nosed Snapper` && Snapper.getTrackedPhylum() !== phylum) {
    Snapper.trackPhylum(phylum);
  }
}

let cachedHaveFlorest: boolean | undefined = undefined;
export function haveFlorest(): boolean {
  if (step("questL02Larva") === -1) return false; // we cannot check yet
  if (cachedHaveFlorest === undefined) {
    const village = visitUrl("forestvillage.php");
    cachedHaveFlorest = village.includes("action=fv_friar");
  }
  return cachedHaveFlorest;
}

export function underStandard(): boolean {
  // Change when the path leaves Standard
  return true;
}

const microphoneForms = [
  $item`Loathing Idol Microphone`,
  $item`Loathing Idol Microphone (75% charged)`,
  $item`Loathing Idol Microphone (50% charged)`,
  $item`Loathing Idol Microphone (25% charged)`,
];
export function haveLoathingIdolMicrophone(): boolean {
  return microphoneForms.some((item) => have(item));
}

export function getMonsters(where?: Location): Monster[] {
  if (where === undefined) return [];
  return Object.entries(appearanceRates(where)) // Get the maximum HP in the location
    .filter((i) => i[1] > 0)
    .map((i) => Monster.get(i[0]));
}
