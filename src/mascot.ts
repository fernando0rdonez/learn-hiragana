import foxCalmImg from "./assets/character/fox-calm.png";
import foxNeutral from "./assets/character/fox-neutral.png";
import foxCelebrating from "./assets/character/fox-celebrating.png";
import foxSad from "./assets/character/fox-sad.png";
import foxProud from "./assets/character/fox-proud.png";
import foxWorried from "./assets/character/fox-worried.png";

export function summaryMascot(pct: number): string {
  if (pct >= 90) return foxCelebrating;
  if (pct >= 70) return foxProud;
  if (pct >= 50) return foxNeutral;
  if (pct >= 30) return foxWorried;
  return foxSad;
}

export { foxCalmImg, foxNeutral, foxCelebrating, foxSad, foxProud, foxWorried };
