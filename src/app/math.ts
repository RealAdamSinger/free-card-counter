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


export function getHandValue(hand: Array<string>): number {
    // convert all aces to 11
    const numAces = hand.filter(card => card === "A").length;
    let modifiedHand = hand.map(card => card === "A" ? "11" : card);

    const maxValue = modifiedHand.reduce((acc, card) => {
        if (card === "J" || card === "Q" || card === "K") {
            return acc + 10;
        } else {
            return acc + parseInt(card);
        }
    }, 0);

    if (maxValue <= 21 || numAces === 0) return maxValue;
    // replace the first ace in the hand with 1
    const firstAceIndex = hand.indexOf("A");
    modifiedHand = [...hand];
    modifiedHand[firstAceIndex] = "1";
    return getHandValue(modifiedHand);
}


interface GetChanceOfPlayerBustIfHitProps {
    playerHand: Array<string>;
    numCardsInDrawPile: CardsInDrawPile;
}

export function getChanceOfPlayerBustIfHit({
    playerHand,
    numCardsInDrawPile
}: GetChanceOfPlayerBustIfHitProps): number {
    const counts = CARDS.reduce((acc, card) => {
        const numCards = numCardsInDrawPile[`num${card}s` as keyof CardsInDrawPile] || 0;

        const playerHandValue = getHandValue([...playerHand, card]);
        if (playerHandValue > 21) {
            return { ...acc, bust: acc.bust + numCards };
        } else {
            return { ...acc, notBust: acc.notBust + numCards };
        }
    }, { bust: 0, notBust: 0 });

    const totalPossibleCards = counts.bust + counts.notBust
    return Math.round((counts.bust / totalPossibleCards) * 100);
}

interface GetChanceOfPlayerWinningProps {
    dealerHand: Array<string>;
    playerHand: Array<string>;
    numCardsInDrawPile: CardsInDrawPile;
    hitSoft17?: boolean;
}

export function getChanceOfOutcomes({
    dealerHand,
    playerHand,
    numCardsInDrawPile,
    hitSoft17 = false
}: GetChanceOfPlayerWinningProps) {
    if (playerHand.length < 2 || !dealerHand.length) {
        return { dealerBust: 0, playerWin: 0, playerLose: 0, push: 0 };
    }
    const playerHandValue = getHandValue(playerHand);

    const dealerOutcomes = getDealerOutcomes({ dealerHand, playerHandValue, numCardsInDrawPile, hitSoft17 });
    console.info(numCardsInDrawPile)
    const totalOutcomes = dealerOutcomes.bust + dealerOutcomes.win + dealerOutcomes.lose + dealerOutcomes.push;

    const dealerBust = Math.round((dealerOutcomes.bust / totalOutcomes) * 100);
    const playerWin = Math.round(((dealerOutcomes.bust + dealerOutcomes.lose) / totalOutcomes) * 100);
    const playerLose = Math.round((dealerOutcomes.win / totalOutcomes) * 100);
    const push = Math.round((dealerOutcomes.push / totalOutcomes) * 100);

    return { dealerBust, playerWin, playerLose, push };
}

function getDealerOutcomes({
    dealerHand,
    playerHandValue,
    numCardsInDrawPile,
    hitSoft17 = false
}: GetChanceOfDealerBustProps & { playerHandValue: number }): { bust: number, win: number, lose: number, push: number } {

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
                return { ...acc, push: acc.push + probability };
            }
        }

        // dealerHandValue < 17 or isSoft17 with hitSoft17 true
        const nextDealerHand = [...dealerHand, card];
        const nextNumCardsInDrawPile = { ...numCardsInDrawPile, [`num${card}s`]: numCards - 1 };

        const outcomes = getDealerOutcomes({
            dealerHand: nextDealerHand,
            playerHandValue,
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
