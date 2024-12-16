// array of cards
const CARDS: Array<string> = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
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

interface GetChanceOfDealerBustProps {
  dealerHand: Array<string>;
  numCardsInDrawPile: CardsInDrawPile;
  hitSoft17?: boolean;
}

function consolodate10sInDrawPile(numCardsInDrawPile: CardsInDrawPile): CardsInDrawPile {
  const num10s = numCardsInDrawPile.num10s + numCardsInDrawPile.numJs + numCardsInDrawPile.numQs + numCardsInDrawPile.numKs;
  return {
    ...numCardsInDrawPile,
    num10s,
    numJs: 0,
    numQs: 0,
    numKs: 0
  };
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


export function checkForBlackjack(hand: Array<string>): boolean {
  if (hand.length !== 2) return false;
  if (hand.includes("A") && (hand.includes("10") || hand.includes("J") || hand.includes("Q") || hand.includes("K"))) {
    return true;
  }
  return false;
}


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

interface GetPlayerOutcomesingProps {
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

export function getChanceOfOutcomes({
  dealerHand,
  playerHand,
  numCardsInDrawPile: numCardsInDrawPileProp,
  hitSoft17 = false
}: GetPlayerOutcomesingProps): Outcomes {
  if (playerHand.length < 2 || !dealerHand.length) {
    return { dealerBust: 0, playerWin: 0, playerLose: 0, push: 0, expectedValueStanding: 0, expectedValueHitting: 0, shouldStand: false, playerBust: 0, shouldInsurance: false, shouldSplit: false, shouldDouble: false, expectedValueOfDoubleDown: 0 };
  }
  if (getHandValue(playerHand) > 21) {
    return { dealerBust: 0, playerWin: 0, playerLose: 100, push: 0, expectedValueStanding: -1, expectedValueHitting: -1, shouldStand: false, playerBust: 100, shouldInsurance: false, shouldSplit: false, shouldDouble: false, expectedValueOfDoubleDown: 0 };
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
  const shouldSplit = getShouldSplit(playerHand, dealerHand[0], numCardsInDrawPile)


  const expectedValueOfDoubleDown = playerHand.length === 2 ? getExpectedValueOfDoubleDown({
    playerHand,
    dealerHand,
    numCardsInDrawPile,
    hitSoft17
  }) : null;

  // if (playerHandValue <= 11) {
  //   return {
  //     dealerBust,
  //     playerBust: 0,
  //     playerWin,
  //     playerLose,
  //     push,
  //     expectedValueStanding,
  //     expectedValueOfDoubleDown,
  //     expectedValueHitting: null,
  //     shouldStand: false,
  //     shouldInsurance: false,
  //     shouldSplit,
  //     shouldDouble: expectedValueOfDoubleDown > expectedValueStanding
  //   };
  // }

  const expectedValueHitting = getExpectedValueIfHitting({
    dealerHand,
    playerHand,
    playerHandValue,
    numCardsInDrawPile
  });


  const shouldDouble = expectedValueOfDoubleDown !== null ? (expectedValueOfDoubleDown > expectedValueStanding && expectedValueOfDoubleDown > expectedValueHitting) : false;

  const shouldStand = expectedValueStanding > expectedValueHitting;

  return {
    dealerBust,
    playerBust: getChancePlayerBustOnHit({ playerHand, numCardsInDrawPile }),
    playerWin,
    playerLose,
    push,
    expectedValueStanding,
    expectedValueHitting,
    expectedValueOfDoubleDown,
    shouldStand,
    shouldInsurance: false,
    shouldSplit,
    shouldDouble
  };
}

function getDealerOutcomes({
  dealerHand,
  playerHandValue,
  playerHand,
  numCardsInDrawPile,
  hitSoft17 = false
}: GetChanceOfDealerBustProps & {
  playerHandValue: number,
  playerHand: Array<string>
}): { bust: number, win: number, lose: number, push: number } {

  const totalCardsInDrawPile = Object.values(numCardsInDrawPile).reduce((sum, count) => sum + count, 0);
  if (totalCardsInDrawPile === 0) {
    throw new Error("Draw pile is empty.");
  }

  const filteredCards = CARDS.filter(card => numCardsInDrawPile[`num${card}s` as keyof CardsInDrawPile] > 0);

  return filteredCards.reduce((acc, card) => {
    const numCards = numCardsInDrawPile[`num${card}s` as keyof CardsInDrawPile] || 0;
    const probability = numCards / totalCardsInDrawPile;

    const dealerHandValue = getHandValue(dealerHand);
    const isSoft17 = dealerHandValue === 17 && dealerHand.includes('A'); // Assuming 'A' for Ace

    if (dealerHandValue > 21) {
      return { ...acc, bust: acc.bust + probability };
    } else if (dealerHandValue >= 17 && (!isSoft17 || !hitSoft17)) {
      if (dealerHandValue > playerHandValue) {
        return { ...acc, win: acc.win + probability };
      } else if (dealerHandValue < playerHandValue) {
        return { ...acc, lose: acc.lose + probability };
      } else {
        // check if dealer has BJ and player does not
        if (checkForBlackjack(dealerHand) && (!dealerHand || !checkForBlackjack(playerHand))) {
          return { ...acc, win: acc.win + probability };
        }
        return { ...acc, push: acc.push + probability };
      }
    }

    // dealerHandValue < 17 or isSoft17 with hitSoft17 true
    const nextDealerHand = [...dealerHand, card];
    const nextNumCardsInDrawPile = { ...numCardsInDrawPile, [`num${card}s`]: numCards - 1 };

    const outcomes = getDealerOutcomes({
      dealerHand: nextDealerHand,
      playerHandValue,
      playerHand,
      numCardsInDrawPile: nextNumCardsInDrawPile,
      hitSoft17
    });

    return {
      bust: acc.bust + outcomes.bust * probability,
      win: acc.win + outcomes.win * probability,
      lose: acc.lose + outcomes.lose * probability,
      push: acc.push + outcomes.push * probability
    };
  }, { bust: 0, win: 0, lose: 0, push: 0 });
}

function getExpectedValueIfHitting({
  playerHand,
  numCardsInDrawPile,
  dealerHand,
  playerHandValue,
  hitSoft17 = false,
  depth = 0, // Track recursion depth
  MAX_DEPTH = 2 // Maximum allowed recursion depth
}: GetPlayerOutcomesingProps & { playerHandValue: number, depth?: number, MAX_DEPTH?: number }): number {
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
    // skip if probability is less than 5%
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
    const evHittingAgain = getExpectedValueIfHitting({
      playerHand: newPlayerHand,
      dealerHand,
      numCardsInDrawPile: remainingDrawPile,
      playerHandValue: newPlayerHandValue,
      hitSoft17,
      depth: depth + 1, // Increment depth
      MAX_DEPTH
    });

    // Optimal EV: max of standing or hitting again
    const evOptimal = Math.max(evStanding, evHittingAgain);

    return expectedValue + probability * evOptimal;
  }, 0);
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
}: GetPlayerOutcomesingProps): number {
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
