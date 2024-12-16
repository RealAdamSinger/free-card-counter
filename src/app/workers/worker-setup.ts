import { getHandValue, getDealerOutcomes, consolodate10sInDrawPile } from '../utils';

export default function setupWorker() {
  if (typeof window === 'undefined') return null;

  // Create a blob URL for the worker
  const workerCode = `
    // Utility functions
    function consolodate10sInDrawPile(numCardsInDrawPile) {
      const num10s = numCardsInDrawPile.num10s + numCardsInDrawPile.numJs + numCardsInDrawPile.numQs + numCardsInDrawPile.numKs;
      return {
        ...numCardsInDrawPile,
        num10s,
        numJs: 0,
        numQs: 0,
        numKs: 0
      };
    }

    function checkForBlackjack(hand) {
      if (hand.length !== 2) return false;
      if (hand.includes("A") && (hand.includes("10") || hand.includes("J") || hand.includes("Q") || hand.includes("K"))) {
        return true;
      }
      return false;
    }

    function getHandValue(hand) {
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

    function getDealerOutcomes({
      dealerHand,
      playerHandValue,
      playerHand,
      numCardsInDrawPile,
      hitSoft17 = false
    }) {
      const CARDS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

      const totalCardsInDrawPile = Object.values(numCardsInDrawPile).reduce((sum, count) => sum + count, 0);
      if (totalCardsInDrawPile === 0) {
        throw new Error("Draw pile is empty.");
      }

      const filteredCards = CARDS.filter(card => numCardsInDrawPile[\`num\${card}s\`] > 0);

      return filteredCards.reduce((acc, card) => {
        const numCards = numCardsInDrawPile[\`num\${card}s\`] || 0;
        const probability = numCards / totalCardsInDrawPile;

        const dealerHandValue = getHandValue(dealerHand);
        const isSoft17 = dealerHandValue === 17 && dealerHand.includes('A');

        if (dealerHandValue > 21) {
          return { ...acc, bust: acc.bust + probability };
        } else if (dealerHandValue >= 17 && (!isSoft17 || !hitSoft17)) {
          if (dealerHandValue > playerHandValue) {
            return { ...acc, win: acc.win + probability };
          } else if (dealerHandValue < playerHandValue) {
            return { ...acc, lose: acc.lose + probability };
          } else {
            if (checkForBlackjack(dealerHand) && (!dealerHand || !checkForBlackjack(playerHand))) {
              return { ...acc, win: acc.win + probability };
            }
            return { ...acc, push: acc.push + probability };
          }
        }

        const nextDealerHand = [...dealerHand, card];
        const nextNumCardsInDrawPile = { ...numCardsInDrawPile, [\`num\${card}s\`]: numCards - 1 };

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

    const CARDS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

    function calculateExpectedValue({
      playerHand,
      numCardsInDrawPile,
      dealerHand,
      playerHandValue,
      hitSoft17 = false,
      depth = 0,
      MAX_DEPTH = 2,
      cardSubset = CARDS
    }) {
      const totalCardsInDrawPile = Object.values(numCardsInDrawPile)
        .reduce((sum, count) => sum + count, 0);

      if (totalCardsInDrawPile === 0) {
        throw new Error("Draw pile is empty.");
      }

      const consolidatedDrawPile = consolodate10sInDrawPile(numCardsInDrawPile);

      return cardSubset.reduce((expectedValue, card) => {
        const numCards = consolidatedDrawPile[\`num\${card}s\`] || 0;

        if (numCards === 0) return expectedValue;

        const probability = numCards / totalCardsInDrawPile;
        if (probability < 0.01) return expectedValue;

        const newPlayerHand = [...playerHand, card];
        const newPlayerHandValue = getHandValue(newPlayerHand);

        if (newPlayerHandValue > 21) {
          return expectedValue + probability * -1;
        }
        if (newPlayerHandValue === 21) {
          return expectedValue + probability * 1;
        }

        if (depth >= MAX_DEPTH) {
          const remainingDrawPile = { ...consolidatedDrawPile, [\`num\${card}s\`]: numCards - 1 };
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

        const remainingDrawPile = { ...consolidatedDrawPile, [\`num\${card}s\`]: numCards - 1 };
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

        const evHittingAgain = calculateExpectedValue({
          playerHand: newPlayerHand,
          dealerHand,
          numCardsInDrawPile: remainingDrawPile,
          playerHandValue: newPlayerHandValue,
          hitSoft17,
          depth: depth + 1,
          MAX_DEPTH,
        });

        const evOptimal = Math.max(evStanding, evHittingAgain);
        return expectedValue + probability * evOptimal;
      }, 0);
    }

    self.onmessage = (e) => {
      try {
        const result = calculateExpectedValue(e.data);
        self.postMessage(result);
      } catch (error) {
        self.postMessage({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}
