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

