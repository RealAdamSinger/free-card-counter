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

    const CARDS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

    function emptyDealerDistribution() {
      return { bust: 0, t17: 0, t18: 0, t19: 0, t20: 0, t21: 0, blackjack: 0 };
    }

    function dealerStateKey(dealerHand, p) {
      return [...dealerHand].sort().join("") + "|" +
        p.num2s + "," + p.num3s + "," + p.num4s + "," + p.num5s + "," + p.num6s + "," +
        p.num7s + "," + p.num8s + "," + p.num9s + "," + p.num10s + "," + p.numJs + "," +
        p.numQs + "," + p.numKs + "," + p.numAs;
    }

    // Dealer final-total distribution, weighted by the depleted shoe and
    // memoised on (dealer hand, shoe). Computed independently of the player so
    // it can be reused across the whole player hit tree.
    function getDealerValueDistribution(dealerHand, numCardsInDrawPile, hitSoft17, cache) {
      const dealerHandValue = getHandValue(dealerHand);
      const isSoft17 = dealerHandValue === 17 && dealerHand.includes('A');

      if (dealerHandValue > 21) {
        const d = emptyDealerDistribution();
        d.bust = 1;
        return d;
      }
      if (dealerHandValue >= 17 && (!isSoft17 || !hitSoft17)) {
        const d = emptyDealerDistribution();
        if (dealerHandValue === 21) {
          if (checkForBlackjack(dealerHand)) d.blackjack = 1;
          else d.t21 = 1;
        } else if (dealerHandValue === 20) d.t20 = 1;
        else if (dealerHandValue === 19) d.t19 = 1;
        else if (dealerHandValue === 18) d.t18 = 1;
        else d.t17 = 1;
        return d;
      }

      const cacheKey = cache ? dealerStateKey(dealerHand, numCardsInDrawPile) : "";
      if (cache) {
        const hit = cache.get(cacheKey);
        if (hit) return hit;
      }

      const total = Object.values(numCardsInDrawPile).reduce((sum, count) => sum + count, 0);
      if (total === 0) {
        throw new Error("Draw pile is empty.");
      }

      const dist = emptyDealerDistribution();
      for (let i = 0; i < CARDS.length; i++) {
        const card = CARDS[i];
        const numCards = numCardsInDrawPile[\`num\${card}s\`] || 0;
        if (numCards === 0) continue;

        const probability = numCards / total;
        const nextDealerHand = [...dealerHand, card];
        const nextNumCardsInDrawPile = { ...numCardsInDrawPile, [\`num\${card}s\`]: numCards - 1 };

        const sub = getDealerValueDistribution(nextDealerHand, nextNumCardsInDrawPile, hitSoft17, cache);

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

    // Collapse a dealer distribution against one player total. O(1).
    function dealerOutcomesFromDistribution(dist, playerHand, playerHandValue) {
      const result = { bust: dist.bust, win: 0, lose: 0, push: 0 };
      function compare(dealerTotal, prob, dealerBlackjack) {
        if (prob === 0) return;
        if (dealerTotal > playerHandValue) result.win += prob;
        else if (dealerTotal < playerHandValue) result.lose += prob;
        else if (dealerBlackjack && !checkForBlackjack(playerHand)) result.win += prob;
        else result.push += prob;
      }
      compare(17, dist.t17, false);
      compare(18, dist.t18, false);
      compare(19, dist.t19, false);
      compare(20, dist.t20, false);
      compare(21, dist.t21, false);
      compare(21, dist.blackjack, true);
      return result;
    }

    function calculateExpectedValue({
      playerHand,
      numCardsInDrawPile,
      dealerHand,
      playerHandValue,
      hitSoft17 = false,
      startTime,
      timeLimit = 10000,
      maxDepth,
      depth = 0,
      cardSubset = CARDS,
      dealerDistCache = new Map()
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

        const timeElapsed = +new Date() - startTime;

        if (timeElapsed > timeLimit || depth >= maxDepth) {
          const remainingDrawPile = { ...consolidatedDrawPile, [\`num\${card}s\`]: numCards - 1 };
          const dealerDist = getDealerValueDistribution(dealerHand, remainingDrawPile, hitSoft17, dealerDistCache);
          const dealerOutcomes = dealerOutcomesFromDistribution(dealerDist, newPlayerHand, newPlayerHandValue);

          const totalOutcomes = dealerOutcomes.bust + dealerOutcomes.win + dealerOutcomes.lose + dealerOutcomes.push;
          const playerWinProb = (dealerOutcomes.bust + dealerOutcomes.lose) / totalOutcomes;
          const playerLoseProb = dealerOutcomes.win / totalOutcomes;
          const pushProb = dealerOutcomes.push / totalOutcomes;

          const evStanding = playerWinProb * 1 + pushProb * 0 + playerLoseProb * -1;
          return expectedValue + probability * evStanding;
        }

        const remainingDrawPile = { ...consolidatedDrawPile, [\`num\${card}s\`]: numCards - 1 };
        const dealerDist = getDealerValueDistribution(dealerHand, remainingDrawPile, hitSoft17, dealerDistCache);
        const dealerOutcomes = dealerOutcomesFromDistribution(dealerDist, newPlayerHand, newPlayerHandValue);

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
          startTime,
          timeLimit,
          maxDepth,
          depth: depth + 1,
          dealerDistCache,
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
