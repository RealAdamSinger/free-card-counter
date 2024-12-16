import { CARDS, consolodate10sInDrawPile, getDealerOutcomes, getHandValue } from "./utils";
import { WorkerPool } from './workers/worker-pool';
import setupWorker from './workers/worker-setup';

type CardsInDrawPile = {
  num2s: number;
  num3s: number;
  num4s: number;
  num5s: number;
  num6s: number;
  num7s: number;
  num8s: number;
  num9s: number;
  num10s: number;
  numJs: number;
  numQs: number;
  numKs: number;
  numAs: number;
};

interface GetPlayerOutcomesIfHitProps {
  playerHand: Array<string>;
  numCardsInDrawPile: CardsInDrawPile;
}

export function getChancePlayerBustOnHit({
  playerHand,
  numCardsInDrawPile
}: GetPlayerOutcomesIfHitProps) {
  const counts: {
    bust: number,
    noBust: number
  } = CARDS.reduce((acc, card) => {
    const numCards = numCardsInDrawPile[`num${card}s` as keyof CardsInDrawPile] || 0;

    const playerHandValue = getHandValue([...playerHand, card]);
    if (playerHandValue > 21) {
      return { ...acc, bust: acc.bust + numCards };
    } else {
      return { ...acc, noBust: acc.noBust + numCards };
    }
  }, { bust: 0, noBust: 0 });

  return counts.bust / (counts.bust + counts.noBust);
}

interface GetPlayerOutcomesProps {
  dealerHand: Array<string>;
  playerHand: Array<string>;
  numCardsInDrawPile: CardsInDrawPile;
  hitSoft17?: boolean;
}

export interface Outcomes {
  dealerBust: number;
  playerBust: number;
  playerWin: number;
  playerLose: number;
  push: number;
  expectedValueStanding: number;
  expectedValueHitting: number | null;
  expectedValueOfDoubleDown: number | null
  shouldStand: boolean;
  shouldInsurance: boolean;
  shouldSplit: boolean;
  shouldDouble: boolean;
}

export async function getChanceOfOutcomes({
  dealerHand,
  playerHand,
  numCardsInDrawPile: numCardsInDrawPileProp,
  hitSoft17 = false
}: GetPlayerOutcomesProps): Promise<Outcomes> {
  if (playerHand.length < 2 || !dealerHand.length) {
    return { dealerBust: 0, playerWin: 0, playerLose: 0, push: 0, expectedValueStanding: 0, expectedValueHitting: 0, shouldStand: false, playerBust: 0, shouldInsurance: false, shouldSplit: false, shouldDouble: false, expectedValueOfDoubleDown: 0 };
  }
  if (getHandValue(playerHand) > 21) {
    return { dealerBust: 0, playerWin: 0, playerLose: 1, push: 0, expectedValueStanding: -1, expectedValueHitting: -1, shouldStand: false, playerBust: 100, shouldInsurance: false, shouldSplit: false, shouldDouble: false, expectedValueOfDoubleDown: 0 };
  }
  const playerHandValue = getHandValue(playerHand);

  const numCardsInDrawPile = consolodate10sInDrawPile(numCardsInDrawPileProp);

  const dealerOutcomes = getDealerOutcomes({ dealerHand, playerHandValue, playerHand, numCardsInDrawPile, hitSoft17 });
  const totalOutcomes = dealerOutcomes.bust + dealerOutcomes.win + dealerOutcomes.lose + dealerOutcomes.push;

  const dealerBust = dealerOutcomes.bust / totalOutcomes;
  const playerWin = (dealerOutcomes.bust + dealerOutcomes.lose) / totalOutcomes;
  const playerLose = dealerOutcomes.win / totalOutcomes;
  const push = dealerOutcomes.push / totalOutcomes;

  const expectedValueStanding = playerWin - playerLose;
  const shouldSplit = getShouldSplit(playerHand, dealerHand[0], numCardsInDrawPile);

  const expectedValueHitting = await getExpectedValueIfHitting({
    playerHand,
    dealerHand,
    numCardsInDrawPile,
    playerHandValue,
    hitSoft17
  });

  const expectedValueOfDoubleDown = playerHand.length === 2 ? getExpectedValueOfDoubleDown({
    playerHand,
    dealerHand,
    numCardsInDrawPile,
    hitSoft17
  }) : null;

  const shouldDouble = playerHand.length === 2 && expectedValueOfDoubleDown !== null && expectedValueOfDoubleDown > expectedValueHitting && expectedValueOfDoubleDown > expectedValueStanding;

  const playerBust = getChancePlayerBustOnHit({ playerHand, numCardsInDrawPile });

  const shouldStand = expectedValueStanding > expectedValueHitting;
  const shouldInsurance = dealerHand[0] === "A" && playerHand.length === 2;

  return {
    dealerBust,
    playerWin,
    playerLose,
    push,
    expectedValueStanding,
    expectedValueHitting,
    expectedValueOfDoubleDown,
    shouldStand,
    playerBust,
    shouldInsurance,
    shouldSplit,
    shouldDouble
  };
}

let workerPool: WorkerPool | null = null;

// Add cleanup function
export function cleanupWorkerPool() {
  if (workerPool) {
    workerPool.terminate();
    workerPool = null;
  }
}

function getWorkerPool(): WorkerPool {
  if (!workerPool) {
    if (typeof window === "undefined") {
      throw new Error("WorkerPool can only be used in the browser.");
    }
    const workerUrl = setupWorker();
    if (!workerUrl) {
      throw new Error("Failed to setup worker");
    }
    workerPool = new WorkerPool(workerUrl);
  }
  return workerPool;
}


// Helper function to chunk array into n parts
function chunkArray<T>(array: T[], n: number): T[][] {
  const chunks: T[][] = [];
  const size = Math.ceil(array.length / n);
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function getExpectedValueIfHitting({
  playerHand,
  numCardsInDrawPile,
  dealerHand,
  playerHandValue,
  hitSoft17 = false,
  depth = 0,
  MAX_DEPTH = 2
}: GetPlayerOutcomesProps & { playerHandValue: number, depth?: number, MAX_DEPTH?: number }): Promise<number> {
  const pool = getWorkerPool();
  const startTime = performance.now();
  try {
    // Split the cards into chunks based on the number of workers
    const numWorkers = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    console.log(`Using ${numWorkers} workers for calculation`);

    const cardChunks = chunkArray(CARDS, numWorkers);
    console.log('Card chunks:', cardChunks);

    // Create promises for each chunk of work
    const promises = cardChunks.map(cardSubset =>
      pool.execute({
        playerHand,
        numCardsInDrawPile,
        dealerHand,
        playerHandValue,
        hitSoft17,
        depth,
        MAX_DEPTH,
        cardSubset
      }).catch(error => {
        console.error(`Worker error for subset ${cardSubset}:`, error);
        throw error;
      })
    );

    // Wait for all chunks to complete and sum their results
    const results = await Promise.all(promises);
    const totalExpectedValue = results.reduce((sum, value) => {
      if (typeof value === 'number') {
        return sum + value;
      }
      throw new Error(value.error);
    }, 0);

    const endTime = performance.now();
    console.log(`Calculation completed in ${endTime - startTime}ms`);

    return totalExpectedValue;
  } catch (error) {
    console.error('Worker pool error:', error);
    // If we get a worker error, cleanup the pool and rethrow
    cleanupWorkerPool();
    throw error;
  }
}

function getShouldSplit(playerHand: Array<string>, dealerUpCard: string, numCardsInDrawPile: CardsInDrawPile): boolean {
  if (playerHand.length !== 2 || playerHand[0] !== playerHand[1]) {
    // Can only split if there are exactly two cards of the same rank
    return false;
  }

  const cardRank = playerHand[0]; // Both cards are the same
  const numCardsOfRank = numCardsInDrawPile[`num${cardRank}s` as keyof CardsInDrawPile] || 0;

  if (numCardsOfRank < 2) {
    // Cannot split if there are not enough cards left in the draw pile for splitting
    return false;
  }

  // Example splitting strategy based on common rules
  switch (cardRank) {
    case "A":
      // Always split Aces
      return true;
    case "8":
      // Always split 8s
      return true;
    case "10":
    case "J":
    case "Q":
    case "K":
      // Never split 10s or face cards
      return false;
    default:
      // For other ranks, consider dealer's up card and basic strategy
      const dealerValue = parseInt(dealerUpCard) || (["J", "Q", "K"].includes(dealerUpCard) ? 10 : dealerUpCard === "A" ? 11 : 0);
      if (cardRank === "2" || cardRank === "3") {
        return dealerValue >= 4 && dealerValue <= 7;
      }
      if (cardRank === "6") {
        return dealerValue >= 3 && dealerValue <= 6;
      }
      if (cardRank === "7") {
        return dealerValue >= 2 && dealerValue <= 7;
      }
      if (cardRank === "9") {
        return dealerValue !== 7 && dealerValue < 10;
      }
      return false;
  }
}

function getExpectedValueOfDoubleDown({
  playerHand,
  dealerHand,
  numCardsInDrawPile,
  hitSoft17 = false,
}: GetPlayerOutcomesProps): number {
  const playerHandValue = getHandValue(playerHand);

  // Consolidate the draw pile to simplify calculations
  const consolidatedDrawPile = consolodate10sInDrawPile(numCardsInDrawPile);
  const totalCardsInDrawPile = Object.values(consolidatedDrawPile).reduce((sum, count) => sum + count, 0);

  if (totalCardsInDrawPile === 0) {
    throw new Error("Draw pile is empty.");
  }

  return CARDS.reduce((expectedValue, card) => {
    const numCards = consolidatedDrawPile[`num${card}s` as keyof CardsInDrawPile] || 0;

    // Skip if no cards of this type left
    if (numCards === 0) {
      return expectedValue;
    }

    const probability = numCards / totalCardsInDrawPile;

    // Calculate the new player hand value after drawing the card
    const newPlayerHand = [...playerHand, card];
    const newPlayerHandValue = getHandValue(newPlayerHand);

    // If the new player hand value exceeds 21, it results in an immediate loss
    if (newPlayerHandValue > 21) {
      return expectedValue + probability * -2; // Double bet lost
    }

    // Calculate dealer outcomes after the player doubles down
    const remainingDrawPile = { ...consolidatedDrawPile, [`num${card}s`]: numCards - 1 };
    const dealerOutcomes = getDealerOutcomes({
      dealerHand,
      playerHandValue: newPlayerHandValue,
      playerHand: newPlayerHand,
      numCardsInDrawPile: remainingDrawPile,
      hitSoft17,
    });

    const totalOutcomes = dealerOutcomes.bust + dealerOutcomes.win + dealerOutcomes.lose + dealerOutcomes.push;
    const playerWinProb = (dealerOutcomes.bust + dealerOutcomes.lose) / totalOutcomes;
    const playerLoseProb = dealerOutcomes.win / totalOutcomes;
    const pushProb = dealerOutcomes.push / totalOutcomes;

    // EV for doubling down: Double the bet on winning, lose double the bet on losing
    const evDoubleDown = playerWinProb * 2 + pushProb * 0 + playerLoseProb * -2;

    // Accumulate the EV weighted by the probability of drawing the card
    return expectedValue + probability * evDoubleDown;
  }, 0);
}
