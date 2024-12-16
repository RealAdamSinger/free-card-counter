import { CardsInDrawPile, getHandValue, getDealerOutcomes, consolodate10sInDrawPile } from './utils';

const CARDS: Array<string> = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

interface WorkerMessage {
  playerHand: string[];
  numCardsInDrawPile: CardsInDrawPile;
  dealerHand: string[];
  playerHandValue: number;
  hitSoft17: boolean;
  depth?: number;
  MAX_DEPTH?: number;
}

function calculateExpectedValue({
  playerHand,
  numCardsInDrawPile,
  dealerHand,
  playerHandValue,
  hitSoft17 = false,
  depth = 0,
  MAX_DEPTH = 2
}: WorkerMessage): number {
  const totalCardsInDrawPile = Object.values(numCardsInDrawPile).reduce((sum, count) => sum + count, 0);

  if (totalCardsInDrawPile === 0) {
    throw new Error("Draw pile is empty.");
  }

  // Consolidate card values to iterate
  const consolidatedDrawPile = consolodate10sInDrawPile(numCardsInDrawPile);

  // Iterate over all possible cards
  return CARDS.reduce((expectedValue, card) => {
    const numCards = consolidatedDrawPile[`num${card}s` as keyof CardsInDrawPile] || 0;

    // Skip if no cards of this type left
    if (numCards === 0) {
      return expectedValue;
    }

    const probability = numCards / totalCardsInDrawPile;
    // skip if probability is less than 1%
    if (probability < 0.01) {
      return expectedValue;
    }

    // Simulate player's hand after hitting
    const newPlayerHand = [...playerHand, card];
    const newPlayerHandValue = getHandValue(newPlayerHand);

    // If the player busts, their EV is -1 for that draw
    if (newPlayerHandValue > 21) {
      return expectedValue + probability * -1;
    }
    if (newPlayerHandValue === 21) {
      return expectedValue + probability * 1;
    }

    // If MAX_DEPTH is reached, stop recursion and use stand EV only
    if (depth >= MAX_DEPTH) {
      const remainingDrawPile = { ...consolidatedDrawPile, [`num${card}s`]: numCards - 1 };
      const dealerOutcomes = getDealerOutcomes({
        dealerHand,
        playerHandValue: newPlayerHandValue,
        playerHand: newPlayerHand,
        numCardsInDrawPile: remainingDrawPile,
        hitSoft17
      });

      const totalOutcomes = dealerOutcomes.bust + dealerOutcomes.win + dealerOutcomes.lose + dealerOutcomes.push;
      const playerWinProb = (dealerOutcomes.bust + dealerOutcomes.lose) / totalOutcomes;
      const playerLoseProb = dealerOutcomes.win / totalOutcomes;
      const pushProb = dealerOutcomes.push / totalOutcomes;

      const evStanding = playerWinProb * 1 + pushProb * 0 + playerLoseProb * -1;
      return expectedValue + probability * evStanding;
    }

    // If the player does not bust, calculate EV for standing and hitting again
    const remainingDrawPile = { ...consolidatedDrawPile, [`num${card}s`]: numCards - 1 };

    // EV if the player stands now (dealer outcomes)
    const dealerOutcomes = getDealerOutcomes({
      dealerHand,
      playerHandValue: newPlayerHandValue,
      playerHand: newPlayerHand,
      numCardsInDrawPile: remainingDrawPile,
      hitSoft17
    });

    const totalOutcomes = dealerOutcomes.bust + dealerOutcomes.win + dealerOutcomes.lose + dealerOutcomes.push;
    const playerWinProb = (dealerOutcomes.bust + dealerOutcomes.lose) / totalOutcomes;
    const playerLoseProb = dealerOutcomes.win / totalOutcomes;
    const pushProb = dealerOutcomes.push / totalOutcomes;

    const evStanding = playerWinProb * 1 + pushProb * 0 + playerLoseProb * -1;

    // EV if the player decides to hit again
    const evHittingAgain = calculateExpectedValue({
      playerHand: newPlayerHand,
      dealerHand,
      numCardsInDrawPile: remainingDrawPile,
      playerHandValue: newPlayerHandValue,
      hitSoft17,
      depth: depth + 1,
      MAX_DEPTH
    });

    // Optimal EV: max of standing or hitting again
    const evOptimal = Math.max(evStanding, evHittingAgain);

    return expectedValue + probability * evOptimal;
  }, 0);
}

// Web Worker message handler
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  try {
    const result = calculateExpectedValue(e.data);
    self.postMessage(result);
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
