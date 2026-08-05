import type { SetScore } from "@/types/database";

export function setsToWinMatch(bestOf: 3 | 5): number {
  return bestOf === 5 ? 3 : 2;
}

export function isValidCompletedSet(p1: number, p2: number): boolean {
  return getSetValidationError({ p1, p2 }) === null;
}

export function getSetValidationError(set: SetScore): string | null {
  const { p1, p2 } = set;

  if (p1 < 0 || p2 < 0 || p1 > 7 || p2 > 7) {
    return "Cada set va de 0 a 7 juegos";
  }

  if (p1 === p2) {
    return "El set no puede terminar empatado";
  }

  const high = Math.max(p1, p2);
  const low = Math.min(p1, p2);

  if (high < 6) {
    return "Un set solo termina en 6 o 7 juegos";
  }

  if (high === 6) {
    if (low === 5) return "Con 6-5 hay que seguir hasta 7-5 o 7-6";
    if (low <= 4) return null;
    return "Score de set inválido";
  }

  if (high === 7) {
    if (low === 5 || low === 6) return null;
    return "Con 7 juegos el perdedor solo puede tener 5 o 6";
  }

  return "Máximo 7 juegos por set";
}

export function countSetWins(setScores: SetScore[]): { team1: number; team2: number } {
  let team1 = 0;
  let team2 = 0;

  for (const set of setScores) {
    if (!isValidCompletedSet(set.p1, set.p2)) continue;
    if (set.p1 > set.p2) team1++;
    else team2++;
  }

  return { team1, team2 };
}

export function isMatchDecided(setScores: SetScore[], bestOf: 3 | 5): boolean {
  const { team1, team2 } = countSetWins(setScores);
  const needed = setsToWinMatch(bestOf);
  return team1 >= needed || team2 >= needed;
}

export function canAddSet(setScores: SetScore[], bestOf: 3 | 5): boolean {
  if (setScores.length >= bestOf) return false;
  return !isMatchDecided(setScores, bestOf);
}

export function validateMatchScores(
  setScores: SetScore[],
  bestOf: 3 | 5,
  winningTeam: 1 | 2
): string | null {
  if (setScores.length === 0) {
    return "Cargá al menos un set";
  }

  for (let i = 0; i < setScores.length; i++) {
    const setError = getSetValidationError(setScores[i]);
    if (setError) return `Set ${i + 1}: ${setError}`;
  }

  const needed = setsToWinMatch(bestOf);
  let team1 = 0;
  let team2 = 0;

  for (let i = 0; i < setScores.length; i++) {
    if (team1 >= needed || team2 >= needed) {
      return `Sobra el set ${i + 1}: el partido ya estaba definido`;
    }

    const set = setScores[i];
    if (set.p1 > set.p2) team1++;
    else team2++;
  }

  const team1Won = team1 === needed && team1 > team2;
  const team2Won = team2 === needed && team2 > team1;

  if (!team1Won && !team2Won) {
    return `Al mejor de ${bestOf} hace falta ganar ${needed} sets para cerrar el partido`;
  }

  if (winningTeam === 1 && !team1Won) {
    return "El score no coincide con el Equipo 1 como ganador";
  }

  if (winningTeam === 2 && !team2Won) {
    return "El score no coincide con el Equipo 2 como ganador";
  }

  return null;
}

export function bestOfFromFormat(format: string): 3 | 5 {
  return format.endsWith("bo5") ? 5 : 3;
}
