// array of cards
export const CARDS: Array<string> = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export type CardsInDrawPile = {
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

export const getResult = ({
  playerHand,
  dealerHand
}: {
  playerHand: Array<string>,
  dealerHand: Array<string>,
}): {
  color: "error" | "success" | "warning" | "inherit",
  result: 'lose' | 'win' | 'push' | 'waiting'
} => {
  let color: "error" | "success" | "warning" | "inherit" = "inherit";
  let result: 'lose' | 'win' | 'push' | 'waiting' = 'waiting';

  const playerHandValue = getHandValue(playerHand); // Assuming you have a function to calculate hand values
  const dealerValue = getHandValue(dealerHand);

  if (playerHandValue > 21 || (checkForBlackjack(dealerHand) && !checkForBlackjack(playerHand))) {
    color = "error";
    result = "lose";
  } else if (
    dealerValue > 21 ||
    (dealerValue >= 17 && dealerValue < playerHandValue) ||
    (dealerValue >= 17 && checkForBlackjack(playerHand) && !checkForBlackjack(dealerHand))
  ) {
    color = "success";
    result = "win";
  } else if (
    (dealerValue >= 17 && dealerValue === playerHandValue && !checkForBlackjack(dealerHand)) ||
    (checkForBlackjack(playerHand) && checkForBlackjack(dealerHand))
  ) {
    color = "warning";
    result = "push";
  } else if (dealerValue >= 17 && dealerValue > playerHandValue) {
    color = "error";
    result = "lose";
  }

  return { color, result };
};



export function consolodate10sInDrawPile(numCardsInDrawPile: CardsInDrawPile): CardsInDrawPile {
  const num10s = numCardsInDrawPile.num10s + numCardsInDrawPile.numJs + numCardsInDrawPile.numQs + numCardsInDrawPile.numKs;
  return {
    ...numCardsInDrawPile,
    num10s,
    numJs: 0,
    numQs: 0,
    numKs: 0
  };
}

export function checkForBlackjack(hand: Array<string>): boolean {
  if (hand.length !== 2) return false;
  if (hand.includes("A") && (hand.includes("10") || hand.includes("J") || hand.includes("Q") || hand.includes("K"))) {
    return true;
  }
  return false;
}


export function getHandValue(hand: Array<string>): number {
  const numAces = hand.filter(card => card === "A").length;
  let totalValue = hand.reduce((acc, card) => {
    if (card === "J" || card === "Q" || card === "K") {
      return acc + 10;
    } else if (card === "A") {
      return acc + 11;
    } else {
      return acc + parseInt(card);
    }
  }, 0);

  // Adjust for Aces
  let acesAdjusted = numAces;
  while (totalValue > 21 && acesAdjusted > 0) {
    totalValue -= 10; // Convert an Ace from 11 to 1
    acesAdjusted--;
  }

  return totalValue;
}

interface GetChanceOfDealerBustProps {
  dealerHand: Array<string>;
  numCardsInDrawPile: CardsInDrawPile;
  hitSoft17?: boolean;
}

// Probability that the dealer finishes on each terminal total. This depends
// only on the dealer's hand and the shoe, not on the player, so it can be
// computed once per decision and reused for every player total. `t21` is a 21
// made with three or more cards; `blackjack` is a natural two-card 21 (they
// score differently against a player 21).
export type DealerValueDistribution = {
  bust: number;
  t17: number;
  t18: number;
  t19: number;
  t20: number;
  t21: number;
  blackjack: number;
};

function emptyDealerDistribution(): DealerValueDistribution {
  return { bust: 0, t17: 0, t18: 0, t19: 0, t20: 0, t21: 0, blackjack: 0 };
}

function dealerStateKey(dealerHand: Array<string>, numCardsInDrawPile: CardsInDrawPile): string {
  const p = numCardsInDrawPile;
  return `${[...dealerHand].sort().join("")}|${p.num2s},${p.num3s},${p.num4s},${p.num5s},${p.num6s},${p.num7s},${p.num8s},${p.num9s},${p.num10s},${p.numJs},${p.numQs},${p.numKs},${p.numAs}`;
}

// Recursive expectimax over the dealer's draws, weighted by the real (depleted)
// shoe composition. Memoised on (dealer hand, shoe) so identical draw orders
// collapse into a single computed state.
export function getDealerValueDistribution({
  dealerHand,
  numCardsInDrawPile,
  hitSoft17 = false,
  cache,
}: {
  dealerHand: Array<string>;
  numCardsInDrawPile: CardsInDrawPile;
  hitSoft17?: boolean;
  cache?: Map<string, DealerValueDistribution>;
}): DealerValueDistribution {
  const dealerHandValue = getHandValue(dealerHand);
  const isSoft17 = dealerHandValue === 17 && dealerHand.includes("A");

  if (dealerHandValue > 21) {
    return { ...emptyDealerDistribution(), bust: 1 };
  }
  if (dealerHandValue >= 17 && (!isSoft17 || !hitSoft17)) {
    const dist = emptyDealerDistribution();
    if (dealerHandValue === 21) {
      if (checkForBlackjack(dealerHand)) dist.blackjack = 1;
      else dist.t21 = 1;
    } else if (dealerHandValue === 20) dist.t20 = 1;
    else if (dealerHandValue === 19) dist.t19 = 1;
    else if (dealerHandValue === 18) dist.t18 = 1;
    else dist.t17 = 1;
    return dist;
  }

  const cacheKey = cache ? dealerStateKey(dealerHand, numCardsInDrawPile) : "";
  if (cache) {
    const hit = cache.get(cacheKey);
    if (hit) return hit;
  }

  const totalCardsInDrawPile = Object.values(numCardsInDrawPile).reduce((sum, count) => sum + count, 0);
  if (totalCardsInDrawPile === 0) {
    throw new Error("Draw pile is empty.");
  }

  const dist = emptyDealerDistribution();
  for (const card of CARDS) {
    const numCards = numCardsInDrawPile[`num${card}s` as keyof CardsInDrawPile] || 0;
    if (numCards === 0) continue;

    const probability = numCards / totalCardsInDrawPile;
    const nextDealerHand = [...dealerHand, card];
    const nextNumCardsInDrawPile = { ...numCardsInDrawPile, [`num${card}s`]: numCards - 1 };

    const sub = getDealerValueDistribution({
      dealerHand: nextDealerHand,
      numCardsInDrawPile: nextNumCardsInDrawPile,
      hitSoft17,
      cache,
    });

    dist.bust += sub.bust * probability;
    dist.t17 += sub.t17 * probability;
    dist.t18 += sub.t18 * probability;
    dist.t19 += sub.t19 * probability;
    dist.t20 += sub.t20 * probability;
    dist.t21 += sub.t21 * probability;
    dist.blackjack += sub.blackjack * probability;
  }

  if (cache) cache.set(cacheKey, dist);
  return dist;
}

// Collapse a dealer distribution against one player total into the
// bust/win/lose/push shape the rest of the engine uses. `win` means the dealer
// wins (player loses); `lose` means the dealer loses (player wins). O(1).
export function dealerOutcomesFromDistribution(
  dist: DealerValueDistribution,
  playerHand: Array<string>,
  playerHandValue: number
): { bust: number, win: number, lose: number, push: number } {
  const result = { bust: dist.bust, win: 0, lose: 0, push: 0 };

  const compare = (dealerTotal: number, prob: number, dealerBlackjack: boolean) => {
    if (prob === 0) return;
    if (dealerTotal > playerHandValue) {
      result.win += prob;
    } else if (dealerTotal < playerHandValue) {
      result.lose += prob;
    } else if (dealerBlackjack && !checkForBlackjack(playerHand)) {
      result.win += prob;
    } else {
      result.push += prob;
    }
  };

  compare(17, dist.t17, false);
  compare(18, dist.t18, false);
  compare(19, dist.t19, false);
  compare(20, dist.t20, false);
  compare(21, dist.t21, false);
  compare(21, dist.blackjack, true);

  return result;
}

export function getDealerOutcomes({
  dealerHand,
  playerHandValue,
  playerHand,
  numCardsInDrawPile,
  hitSoft17 = false
}: GetChanceOfDealerBustProps & {
  playerHandValue: number,
  playerHand: Array<string>
}): { bust: number, win: number, lose: number, push: number } {
  const dist = getDealerValueDistribution({
    dealerHand,
    numCardsInDrawPile,
    hitSoft17,
    cache: new Map(),
  });
  return dealerOutcomesFromDistribution(dist, playerHand, playerHandValue);
}

