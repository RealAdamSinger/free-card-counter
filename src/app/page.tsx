"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ContentDrawerLayout } from "@/components/content-drawer/content-drawer";
import { FlexContainer, FlexItem } from "@/components/flex-content/flex-content";
import { getChanceOfOutcomes, Outcomes } from "./math";

import RemoveIcon from '@mui/icons-material/Remove';
import CasinoIcon from '@mui/icons-material/Casino';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";


import InfoIcon from '@mui/icons-material/Info';
import EmailIcon from '@mui/icons-material/Email';


import { useThemeContext } from "@/components/theme/theme";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid2,
  IconButton,
  Popover,
  Radio,
  RadioGroup,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import { checkForBlackjack, getHandValue, getResult } from "./utils";


function formatPercent(num: number) {
  return `${Math.round(num * 100)}%`;
}

function formatEv(num: number) {
  return num.toFixed(2);
}

// array of cards
const CARDS: Array<string> = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

// Blackjack value of a single card rank (used to decide whether a pair can be
// split; two 10-value cards such as 10 and K may be split).
const cardValue = (card: string): number => {
  if (card === "A") return 11;
  if (card === "J" || card === "Q" || card === "K" || card === "10") return 10;
  return parseInt(card);
};
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

const PULSE_ANIMATION = {
  animation: 'pulse 1.5s ease-in-out infinite',
  '@keyframes pulse': {
    '0%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.4,
    },
    '100%': {
      opacity: 1,
    },
  },
}

const DISABLED_STYLES = {
  opacity: 0.25,
  // fade between opacity changes
  transition: "opacity 0.5s",
}

const KOFI_ICON_URL = "https://storage.ko-fi.com/cdn/brandasset/v2/kofi_symbol.png?_gl=1*1cyt4oo*_gcl_au*OTkyMjM5MTM2LjE3MzQ1MzE2MDI.*_ga*MTQ0Njg0Mzc1NS4xNzAzMTY4NTUy*_ga_M13FZ7VQ2C*MTczNDU3ODQwOS41MDEuMS4xNzM0NTc5MjA0LjEuMC4w";

// Shared "glow once" styling used to nudge the tip buttons after a win.
const GLOW_SX = {
  "@keyframes glow": {
    "0%": { boxShadow: "0 0 5px rgba(255, 255, 255, 0.5)" },
    "50%": { boxShadow: "0 0 20px rgba(255, 255, 255, 0.9)" },
    "100%": { boxShadow: "0 0 5px rgba(255, 255, 255, 0.5)" },
  },
}

interface RoundHistory {
  result: string;
  trueHighLowCount: number;
  trueOmega2Count: number;
  color: "success" | "error" | "warning" | "inherit";
}

export default function Home() {

  const { mode, setMode } = useThemeContext();

  const [maxComputeTime, setMaxComputeTime] = useState<number>(10);

  const [totalDecks, setTotalDecks] = useState<number>(8);

  const [discardPile, setDiscardPile] = useState<Array<string>>([]);

  const [dealerHand, setDealerHand] = useState<Array<string>>([]);
  // Player can hold multiple hands after splitting. Exactly one is focused at a
  // time; splits keep their left/right order and focusing only changes which
  // hand the controls and odds apply to. Always has at least one entry.
  const [playerHands, setPlayerHands] = useState<Array<Array<string>>>([[]]);
  const [focusedHandIndex, setFocusedHandIndex] = useState<number>(0);
  const [otherCards, setOtherCards] = useState<Array<string>>([]);

  const [roundHistory, setRoundHistory] = useState<Array<RoundHistory>>([]);

  const [dialogAnchorEl, setDialogAnchorEl] = useState<null | HTMLElement>(null);

  // The focused hand is what the odds panel, feedback, and card pickers act on.
  const playerHand = useMemo(() => playerHands[focusedHandIndex] ?? [], [playerHands, focusedHandIndex]);
  const updateFocusedHand = (newHand: Array<string>) =>
    setPlayerHands((prev) => prev.map((h, i) => (i === focusedHandIndex ? newHand : h)));

  const numOfEachCard = totalDecks * 4;
  const usedCards = useMemo(() => [...dealerHand, ...playerHands.flat(), ...otherCards, ...discardPile], [dealerHand, playerHands, otherCards, discardPile]);

  const numCardsInDrawPile: CardsInDrawPile = useMemo(() => CARDS.reduce<CardsInDrawPile>(
    (acc, card) => {
      const key = `num${card}s` as keyof CardsInDrawPile;
      acc[key] = numOfEachCard - usedCards.filter((c) => c === card).length;
      return acc;
    }, {
    num2s: 0, num3s: 0, num4s: 0, num5s: 0, num6s: 0, num7s: 0, num8s: 0,
    num9s: 0, num10s: 0, numJs: 0, numQs: 0, numKs: 0, numAs: 0
  }), [usedCards, numOfEachCard]);

  const numCardsUsed: CardsInDrawPile = useMemo(() => CARDS.reduce<CardsInDrawPile>(
    (acc, card) => {
      const key = `num${card}s` as keyof CardsInDrawPile;
      acc[key] = usedCards.filter((c) => c === card).length;
      return acc;
    }, {
    num2s: 0, num3s: 0, num4s: 0, num5s: 0, num6s: 0, num7s: 0, num8s: 0,
    num9s: 0, num10s: 0, numJs: 0, numQs: 0, numKs: 0, numAs: 0
  }), [usedCards]);

  const highLowCount = numCardsUsed.num2s + numCardsUsed.num3s + numCardsUsed.num4s + numCardsUsed.num5s + numCardsUsed.num6s
    - numCardsUsed.num10s - numCardsUsed.numJs - numCardsUsed.numQs - numCardsUsed.numKs - numCardsUsed.numAs;

  const Omega2Count = numCardsUsed.num2s + numCardsUsed.num3s + numCardsUsed.num7s
    + 2 * (numCardsUsed.num4s + numCardsUsed.num5s + numCardsUsed.num6s)
    - numCardsUsed.num9s
    - 2 * (numCardsUsed.num10s + numCardsUsed.numJs + numCardsUsed.numQs + numCardsUsed.numKs);

  const dealerValue = getHandValue(dealerHand);
  const playerHandValue = getHandValue(playerHand);

  const numCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 1 : 1;

  const isBelowMd = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const isBelowXl = useMediaQuery((theme) => theme.breakpoints.down("xl"));

  const [calculating, setCalculating] = useState(false);
  const [outcomeChance, setOutcomeChance] = useState<Outcomes>({
    expectedValueHitting: 0,
    expectedValueStanding: 0,
    playerBust: 0,
    dealerBust: 0,
    playerWin: 0,
    shouldDouble: false,
    shouldSplit: false,
    shouldStand: false,
    expectedValueOfDoubleDown: 0,
    playerLose: 0,
    push: 0,
    shouldInsurance: false,
  });

  //this is so getChanceOfOutcomes doesn't have to be redefined every time the maxComputeTime changes
  const maxComputeTimeRef = useRef(maxComputeTime);
  maxComputeTimeRef.current = maxComputeTime;

  useEffect(() => {
    const fetchOutcomeChance = async () => {
      if (dealerHand.length <= 1) {
        setCalculating(true);
        const outcomes = await getChanceOfOutcomes({
          dealerHand,
          playerHand,
          numCardsInDrawPile,
          timeLimit: maxComputeTimeRef.current / 2, // divide by 2 because its a recursive function and it will take extra time to finish
        });
        setOutcomeChance(outcomes);
        setCalculating(false);
      }
    };

    fetchOutcomeChance();
  }, [dealerHand, playerHand, numCardsInDrawPile]);

  const [makeButtonGlow, setMakeButtonGlow] = useState(false);

  const canSplit =
    playerHand.length === 2 && cardValue(playerHand[0]) === cardValue(playerHand[1]);

  const splitFocusedHand = () => {
    if (!canSplit || calculating) return;
    setPlayerHands((prev) => {
      const hand = prev[focusedHandIndex];
      if (!hand || hand.length !== 2) return prev;
      const next = [...prev];
      // Replace the focused hand with two one-card hands, in place, so their
      // left/right order is preserved. Focus stays on the left hand.
      next.splice(focusedHandIndex, 1, [hand[0]], [hand[1]]);
      return next;
    });
  };

  const nonEmptyHands = playerHands.filter((h) => h.length > 0);
  const allHandsBusted =
    nonEmptyHands.length > 0 && nonEmptyHands.every((h) => getHandValue(h) > 21);
  const canEndRound = (allHandsBusted || dealerValue >= 17) && !calculating;

  const appBarJsx = (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Black Jack Counter
          </Typography>
          <Button
            onClick={(e) => { setDialogAnchorEl(e.currentTarget) }}
            variant="outlined"
            sx={{
              color: "inherit",
              borderRadius: 20,
              pl: 1.5,
              position: "relative",
              ...(makeButtonGlow && {
                animation: "glow 1s ease-out",
              }),
              ...GLOW_SX,
            }}
            startIcon={(
              <img
                src={KOFI_ICON_URL}
                style={{ height: 20 }}
                alt="Tip the Creator"
              />
            )}
          >
            Leave a Tip
          </Button>
          <Popover
            open={dialogAnchorEl !== null}
            anchorEl={dialogAnchorEl}
            onClose={() => { setDialogAnchorEl(null) }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <iframe
              id='kofiframe'
              src='https://ko-fi.com/adamsapps/?hidefeed=true&widget=true&embed=true&preview=true'
              style={{
                border: "none",
                width: "100%",
                padding: "4px",
                background: "#f9f9f9",
              }}
              height='712'
              title='adamsapps'>
            </iframe>
          </Popover>
          <Tooltip title="Email adam@freecardcounter.com to make suggestions or report bugs">
            <IconButton sx={{ color: "inherit" }}>
              <EmailIcon />
            </IconButton>
          </Tooltip>
          <IconButton
            sx={{ color: "inherit" }}
            onClick={() => {
              setMode(mode === "casino" ? "light" : mode === "light" ? "dark" : "casino");
            }}
          >
            {mode === "casino" && <CasinoIcon />}
            {mode === "light" && <LightModeIcon />}
            {mode === "dark" && <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </Container>
    </AppBar >
  )

  const trueCount = highLowCount / totalDecks;
  const trueCountText = useMemo(() => {
    if (trueCount >= 2) {
      return `+${trueCount.toFixed(2)} 🔥🔥`;
    } else if (trueCount > 1) {
      return `+${trueCount.toFixed(2)} 🔥`;
    } else if (trueCount > .5) {
      return `+${trueCount.toFixed(2)} 👍🏻`;
    } else if (trueCount <= -2) {
      return `${trueCount.toFixed(2)} 💩💩`;
    } else if (trueCount < -1) {
      return `${trueCount.toFixed(2)} 💩`;
    } else if (trueCount < -.5) {
      return `${trueCount.toFixed(2)} 👎🏻`;
    }
    return trueCount.toFixed(2);
  }, [trueCount]);

  const Omega2TrueCount = Omega2Count / totalDecks;

  const Omega2TrueCountText = useMemo(() => {
    if (Omega2TrueCount >= 2) {
      return `+${Omega2TrueCount.toFixed(2)} 🔥🔥 (${numCardsInDrawPile.numAs} Aces)`;
    } else if (Omega2TrueCount > 1) {
      return `+${Omega2TrueCount.toFixed(2)} 🔥 (${numCardsInDrawPile.numAs} Aces)`;
    } else if (Omega2TrueCount > .5) {
      return `+${Omega2TrueCount.toFixed(2)} 👍🏻 (${numCardsInDrawPile.numAs} Aces)`;
    } else if (Omega2TrueCount <= -2) {
      return `${Omega2TrueCount.toFixed(2)} 💩💩 (${numCardsInDrawPile.numAs} Aces)`;
    } else if (Omega2TrueCount < -1) {
      return `${Omega2TrueCount.toFixed(2)} 💩 (${numCardsInDrawPile.numAs} Aces)`;
    } else if (Omega2TrueCount < -.5) {
      return `${Omega2TrueCount.toFixed(2)} 👎🏻 (${numCardsInDrawPile.numAs} Aces)`;
    }
    return `${Omega2TrueCount.toFixed(2)} (${numCardsInDrawPile.numAs} Aces)`;
  }, [
    Omega2TrueCount,
    numCardsInDrawPile.numAs,
  ]);

  const drawerJsx = (
    <Grid2 container size={{ xs: 12 }} spacing={2} p={2}>
      <Grid2 size={{ xs: 12 }}>
        <Typography variant="h6" component="div">
          High-Low
        </Typography>
      </Grid2>
      <Grid2 size={{ xs: 12 }}>
        Count: {highLowCount}
      </Grid2>
      <Grid2 size={{ xs: 12 }}>
        True Count: {trueCountText}
      </Grid2>
      <Divider sx={{ width: "100%" }} />
      <Grid2 size={{ xs: 12 }}>
        <Typography variant="h6" component="div">
          Omega II
        </Typography>
      </Grid2>
      <Grid2 size={{ xs: 12 }}>
        Count: {Omega2Count}
      </Grid2>
      <Grid2 size={{ xs: 12 }}>
        True Count: {Omega2TrueCountText}
      </Grid2>
      <Divider sx={{ width: "100%" }} />
      <Grid2 container size={{ xs: 12 }}>
        <Grid2 size={{ xs: 4 }}>
          <Typography variant="h6" component="div">
            Low
          </Typography>
          {CARDS.slice(0, 5).map((card) => {
            const remaining = numOfEachCard - usedCards.filter((c) => c === card).length;
            return (
              <Typography
                key={card}
                component="div"
              >
                {card}s: <Typography
                  key={card}
                  component="span"
                  variant="caption"
                >
                  {remaining} Remaining
                </Typography>
              </Typography>
            )
          })}
        </Grid2>
        <Grid2 size={{ xs: 4 }}>
          <Typography component="div">
            Med
          </Typography>
          {CARDS.slice(5, 8).map((card) => {
            const remaining = numOfEachCard - usedCards.filter((c) => c === card).length;
            return (
              <Typography
                key={card}
                component="div"
              >
                {card}s: <Typography
                  key={card}
                  component="span"
                  variant="caption"
                >
                  {remaining} Remaining
                </Typography>
              </Typography>
            )
          })}
        </Grid2>
        <Grid2 size={{ xs: 4 }}>
          <Typography component="div">
            High
          </Typography>
          {CARDS.slice(8, 13).map((card) => {
            const remaining = numOfEachCard - usedCards.filter((c) => c === card).length;
            return (
              <Typography
                key={card}
                component="div"
              >
                {card}s: <Typography
                  key={card}
                  component="span"
                  variant="caption"
                >
                  {remaining} Remaining
                </Typography>
              </Typography>
            )
          })}
        </Grid2>
      </Grid2>
    </Grid2>
  )

  const totalDecksInputJsx = (
    <FormControl>
      <FormLabel id="demo-row-radio-buttons-group-label">Total Decks in Shoe</FormLabel>
      <RadioGroup
        row
        aria-labelledby="demo-row-radio-buttons-group-label"
        name="row-radio-buttons-group"
        value={`${totalDecks}`}
        onChange={(e) => setTotalDecks(parseInt(e.target.value))}
      >
        <FormControlLabel value="1" control={<Radio />} label="1" disabled={calculating} />
        <FormControlLabel value="2" control={<Radio />} label="2" disabled={calculating} />
        <FormControlLabel value="3" control={<Radio />} label="3" disabled={calculating} />
        <FormControlLabel value="4" control={<Radio />} label="4" disabled={calculating} />
        <FormControlLabel value="5" control={<Radio />} label="5" disabled={calculating} />
        <FormControlLabel value="6" control={<Radio />} label="6" disabled={calculating} />
        <FormControlLabel value="7" control={<Radio />} label="7" disabled={calculating} />
        <FormControlLabel value="8" control={<Radio />} label="8" disabled={calculating} />
        <FormControlLabel value="9" control={<Radio />} label="9" disabled={calculating} />
        <FormControlLabel value="10" control={<Radio />} label="10" disabled={calculating} />
        <Button
          color="primary"
          onClick={() => {
            setDiscardPile([]);
            setDealerHand([]);
            setPlayerHands([[]]);
            setFocusedHandIndex(0);
            setOtherCards([]);
          }}
          disabled={calculating}
        >
          Reset Shoe
        </Button>
      </RadioGroup>
    </FormControl>
  );

  const dealersHandJsx = (
    <FormControl sx={{ width: "100%" }}>
      <FormLabel id="demo-row-radio-buttons-group-label">Dealer's Hand</FormLabel>
      <HandSelection
        disabled={calculating}
        selectedCards={dealerHand}
        onAddCard={(card) => {
          setDealerHand([...dealerHand, card]);
        }}
        onRemoveCard={(index) => {
          dealerHand.splice(index, 1);
          setDealerHand([...dealerHand]);
        }}
      />
    </FormControl>
  );

  const playerHandJsx = (
    <FormControl sx={{ width: "100%" }}>
      <FormLabel id="demo-row-radio-buttons-group-label">Your Hand</FormLabel>
      <HandSelection
        disabled={calculating}
        selectedCards={playerHand}
        onAddCard={(card) => {
          updateFocusedHand([...playerHand, card]);
        }}
        onRemoveCard={(index) => {
          updateFocusedHand(playerHand.filter((_, i) => i !== index));
        }}
      />
    </FormControl>
  );


  const feedbackJsx = useMemo(() => {
    if (playerHand.length <= 1 || !dealerHand.length) {
      return null;
    }

    let color = "success";
    let text = "Hit";
    let tooltip = null;
    let sx = {};

    if (calculating) {
      color = "inherit";
      text = "Calculating Odds...";
      sx = PULSE_ANIMATION;
    } else {
      if (dealerHand.length > 1 || playerHandValue > 21) {
        const { color: resultColor, result } = getResult({ playerHand, dealerHand });

        switch (result) {
          case "win":
            color = resultColor
            text = "- Win -";
            break;
          case "push":
            color = resultColor
            text = "- Push -";
            break;
          case "lose":
            color = resultColor
            text = playerHandValue > 21 ? "- Bust -" : "- Lose -";
            break;
          case "waiting":
            color = resultColor;
            text = "- Waiting for Dealer -";
          default:
            break;
        }
      } else if (outcomeChance.shouldSplit) {
        color = "primary";
        text = `Split (or ${outcomeChance.shouldDouble ? "Double or" : ""} ${outcomeChance.shouldStand ? "Stand" : "Hit"})`;
        tooltip = (
          <Typography component="div" fontSize={14}>
            <Typography fontWeight="bold">Splitting Strategy:</Typography>
            <ul>
              <li>Always Split: Aces and 8s.</li>
              <li>Never Split: 10s or J, Q, K.</li>
              <li>Split:</li>
              <ul>
                <li>2s & 3s: Dealer shows 2-7.</li>
                <li>6s: Dealer shows 3-6.</li>
                <li>7s: Dealer shows 2-7.</li>
                <li>9s: Dealer shows 2-6 or 8-9.</li>
              </ul>
            </ul>
          </Typography>
        );
      } else if (outcomeChance.shouldDouble) {
        color = "primary";
        text = "Double (or Hit)";
      } else if (outcomeChance.shouldStand) {
        color = "error";
        text = "Stand";
      }
    }

    return (
      <Tooltip title={tooltip}>
        <Box display="flex" alignContent="center" alignItems="center" justifyContent="center">
          <Typography component="div" color={color} fontWeight="bold" sx={sx}>
            {text}
          </Typography>
          {tooltip && <InfoIcon sx={{ pl: 0.5 }} />}
        </Box>
      </Tooltip>
    );
  }, [
    playerHand,
    dealerHand,
    playerHandValue,
    calculating,
    outcomeChance.shouldSplit,
    outcomeChance.shouldDouble,
    outcomeChance.shouldStand,
  ]);

  // Advice/result text and the Split action for the focused hand. Rendered with
  // the focused hand so it tracks that hand (rather than the viewport center)
  // when hands are split.
  const focusedActionsJsx = (
    <>
      {feedbackJsx}
      {canSplit && Boolean(dealerHand.length) && !calculating && (
        <Box display="flex" justifyContent="center" mt={1}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={splitFocusedHand}
          >
            Split
          </Button>
        </Box>
      )}
    </>
  );


  const cardsInPlayJsx = (
    <Box
      height="100%"
      width="100%"
      display="flex"
      flexDirection="column"
      justifyContent="space-around"
      border={2}
      borderRadius={1}
      borderColor="primary.main"
      position="relative"
    >
      <Box alignContent="center" alignItems="center" justifyContent="center" textAlign="center">
        {Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography variant="caption" component="div" sx={calculating ? { opacity: 0.25 } : {}}>
            {calculating ? "Calculating" : formatPercent(outcomeChance.dealerBust)} Chance Dealer Busts
          </Typography>
        )}
        <Hand
          selectedCards={dealerHand}
          onRemoveCard={(index) => {
            dealerHand.splice(index, 1);
            setDealerHand([...dealerHand]);
          }}
          disabled={calculating}
        />
        {Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography component="div">
            {dealerValue}
          </Typography>
        )}
      </Box>
      <Box alignContent="center" alignItems="center" justifyContent="center" textAlign="center">
        {Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography variant="caption" component="div" sx={calculating ? DISABLED_STYLES : {}}>
            {calculating ? "Calculating" : formatPercent(outcomeChance.playerBust)} Chance to Bust on Next Card
          </Typography>
        )}
        {Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography variant="caption" component="div" sx={calculating ? DISABLED_STYLES : {}}>
            Stand has {calculating ? "Calculating" : formatPercent(outcomeChance.playerWin)} to win
          </Typography>
        )}
        {playerHands.length === 1 ? (
          <Hand
            selectedCards={playerHand}
            onRemoveCard={(index) => updateFocusedHand(playerHand.filter((_, i) => i !== index))}
            disabled={calculating}
          />
        ) : (
          <Box display="flex" gap={2} alignItems="flex-start" justifyContent="center" flexWrap="wrap">
            {playerHands.map((hand, index) => {
              if (index === focusedHandIndex) {
                return (
                  <Box key={index} sx={{ border: 2, borderColor: "primary.main", borderRadius: 1, p: 0.5 }}>
                    <Hand
                      selectedCards={hand}
                      onRemoveCard={(i) => updateFocusedHand(hand.filter((_, idx) => idx !== i))}
                      disabled={calculating}
                    />
                    <Typography variant="caption" component="div" color="primary" textAlign="center">
                      {hand.length ? getHandValue(hand) : ""}
                    </Typography>
                    {focusedActionsJsx}
                  </Box>
                );
              }
              // Non-focused hands show their result on their own once the round
              // is decided (getResult returns "waiting" until then).
              const { color: resultColor, result } = hand.length
                ? getResult({ playerHand: hand, dealerHand })
                : { color: "inherit" as const, result: "waiting" as const };
              const resultText =
                result === "win" ? "Win"
                : result === "push" ? "Push"
                : result === "lose" ? (getHandValue(hand) > 21 ? "Bust" : "Loss")
                : null;
              return (
                <SplitHandChip
                  key={index}
                  cards={hand}
                  resultText={resultText}
                  resultColor={resultColor}
                  disabled={calculating}
                  onClick={() => { if (!calculating) setFocusedHandIndex(index); }}
                />
              );
            })}
          </Box>
        )}
        {playerHands.length === 1 && Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography component="div">
            {playerHandValue}
          </Typography>
        )}
        {playerHands.length === 1 && focusedActionsJsx}
      </Box>
      <Box position="absolute" right={10} bottom={10} display="flex" alignItems="center" gap={1}>
        <Tooltip title="Leave a tip">
          <IconButton
            size="small"
            onClick={(e) => { setDialogAnchorEl(e.currentTarget); }}
            sx={{
              ...(makeButtonGlow && { animation: "glow 1s ease-out" }),
              ...GLOW_SX,
            }}
          >
            <img src={KOFI_ICON_URL} style={{ height: 20 }} alt="Leave a tip" />
          </IconButton>
        </Tooltip>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            const handsToScore = playerHands.filter((h) => h.length > 0);
            const historyEntries = handsToScore.map((h) => {
              const { color, result } = getResult({ playerHand: h, dealerHand });
              return {
                result,
                color,
                trueHighLowCount: trueCount,
                trueOmega2Count: Omega2TrueCount,
              };
            });
            setRoundHistory([...roundHistory, ...historyEntries]);
            setDiscardPile([...discardPile, ...dealerHand, ...playerHands.flat(), ...otherCards]);
            setDealerHand([]);
            setPlayerHands([[]]);
            setFocusedHandIndex(0);
            setOtherCards([]);

            const wonAHand = historyEntries.some((e) => e.result === "win");
            const naturalWin = handsToScore.some(
              (h) => checkForBlackjack(h) && !checkForBlackjack(dealerHand)
            );
            setMakeButtonGlow(wonAHand && (Math.random() < .1 || naturalWin));
          }}
          disabled={!canEndRound}
        >
          End Round
        </Button>
      </Box>
      <Box position="absolute" left={10} bottom={10} >
        {Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography variant="caption" component="div" sx={calculating ? DISABLED_STYLES : {}}>
            EV of Standing: {calculating ? "Calculating..." : formatEv(outcomeChance.expectedValueStanding)}
          </Typography>
        )}
        {Number.isFinite(outcomeChance.expectedValueHitting) && Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography variant="caption" component="div" sx={calculating ? DISABLED_STYLES : {}}>
            EV of Hitting: {calculating ? "Calculating..." : formatEv(outcomeChance.expectedValueHitting as number)}
          </Typography>
        )}
        {Number.isFinite(outcomeChance.expectedValueOfDoubleDown) && Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography variant="caption" component="div" sx={calculating ? DISABLED_STYLES : {}}>
            EV of Double: {calculating ? "Calculating..." : formatEv(outcomeChance.expectedValueOfDoubleDown as number)}
          </Typography>
        )}
        <Typography variant="overline" component="div" sx={{ opacity: .25 }} pb={0} pt={1} mb={0} lineHeight={1}>
          Using {numCores} Cores
        </Typography>
      </Box>
      <Box position="absolute" right={10} top={10} width={200}>
        <FormControl sx={{ width: "100%", textAlign: "right" }}>
          <FormLabel>Max Computation</FormLabel>
          <Box display="flex" alignContent="center" alignItems="center" justifyContent="end" >
            <Typography variant="h6" component="div">
              {maxComputeTime}s
            </Typography>
            <Box display="flex" alignContent="center" alignItems="center" justifyContent="center" flexDirection="column">
              <IconButton disabled={calculating} size="small" onClick={() => setMaxComputeTime(maxComputeTime + 5)}>
                <KeyboardArrowUpIcon />
              </IconButton>
              <IconButton disabled={calculating || maxComputeTime <= 5} size="small" onClick={() => setMaxComputeTime(maxComputeTime - 5)}>
                <KeyboardArrowDownIcon />
              </IconButton>
            </Box>
          </Box>
        </FormControl>
      </Box>
    </Box >
  );

  const otherCardsJsx = (
    <FormControl sx={{ width: "100%" }}>
      <FormLabel id="demo-row-radio-buttons-group-label">Other Cards at the Table</FormLabel>
      <HandSelection
        disabled={calculating}
        selectedCards={otherCards}
        onAddCard={(card) => {
          setOtherCards([...otherCards, card]);
        }}
        onRemoveCard={(index) => {
          otherCards.splice(index, 1);
          setOtherCards([...otherCards]);
        }}
      />
    </FormControl>
  );

  const roundHistoryJsx = useMemo(() => {
    if (!roundHistory.length) {
      return null;
    }

    return roundHistory.map((round, i) => {
      const {
        result,
        color,
        trueHighLowCount,
        trueOmega2Count
      } = round;

      let icon = <RemoveIcon fontSize="small" color={color} />;

      if (trueHighLowCount > 1.5) {
        icon = <KeyboardDoubleArrowUpIcon fontSize="small" color={color} />
      } else if (trueHighLowCount > .5) {
        icon = <KeyboardArrowUpIcon fontSize="small" color={color} />
      } else if (trueHighLowCount < -1.5) {
        icon = <KeyboardDoubleArrowDownIcon fontSize="small" color={color} />
      } else if (trueHighLowCount < -.5) {
        icon = <KeyboardArrowDownIcon fontSize="small" color={color} />
      }

      return (
        <Tooltip
          key={i}
          title={(
            <Typography component="div">
              {result === "win" ? "Win" : result === "lose" ? "Loss" : "Push"}
              <br />
              High-Low: {trueHighLowCount.toFixed(2)}
              <br />
              Omega II: {trueOmega2Count.toFixed(2)}
            </Typography>
          )}
        >
          {icon}
        </Tooltip >
      )
    })
  }, [roundHistory]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Smooth scroll to the far right whenever the content changes
    if (containerRef.current) {
      (containerRef.current as HTMLElement).scrollTo({
        left: containerRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  }, [roundHistoryJsx]);


  const mainDashboardJsx = (
    <FlexContainer flexDirection="column">
      <FlexItem>
        {appBarJsx}
      </FlexItem>
      <FlexItem fill enableScroll>
        <Grid2
          width="100%"
          container
          size={{ xs: 12 }}
          maxWidth="md" alignSelf="center" alignItems="start"
          spacing={1}
          p={2}
        >
          <Grid2 size={{ xs: 12 }}>
            {totalDecksInputJsx}
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            {dealersHandJsx}
          </Grid2>
          <Grid2 size={{ xs: 12 }} height={350} width="100%">
            {cardsInPlayJsx}
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            {playerHandJsx}
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            {otherCardsJsx}
          </Grid2>
          {isBelowMd && (
            <Grid2 size={{ xs: 12 }}>
              {drawerJsx}
            </Grid2>
          )}
        </Grid2>
      </FlexItem>
      <FlexItem flexDirection="column" enableScroll ref={containerRef}>
        <Box whiteSpace="nowrap">
          {roundHistoryJsx}
        </Box>
      </FlexItem>
    </FlexContainer>
  );

  if (isBelowMd) {
    return mainDashboardJsx
  }



  return (
    <ContentDrawerLayout
      open
      drawerWidth={isBelowXl ? 300 : 600}
      drawer={drawerJsx}
    >
      {mainDashboardJsx}
    </ContentDrawerLayout >
  );
}

interface HandSelectionProps {
  onAddCard: (card: string) => void;
  onRemoveCard?: (index: number) => void;
  selectedCards?: Array<string>;
  disabled?: boolean
}

const HandSelection = (props: HandSelectionProps) => {
  const {
    onAddCard,
    onRemoveCard = () => { },
    selectedCards,
    disabled
  } = props;

  return (
    <Grid2 container size={{ xs: 12 }} alignContent="center" alignItems="center" justifyContent="center" spacing={2} sx={disabled ? DISABLED_STYLES : {}}>
      {CARDS.map((card) => {
        const numCards = selectedCards?.filter((c) => c === card).length || 0
        return (
          <Grid2 key={card} sx={{ opacity: numCards ? 1 : 0.5 }}>
            <Card sx={{ height: 70, width: 50 }}>
              <CardActionArea
                sx={{ height: "100%", width: "100%" }}
                onClick={() => onAddCard(card)}
                disabled={disabled}
              >
                <CardContent
                  sx={{
                    alignContent: "center",
                    alignItems: "center",
                    p: 0,
                    m: 0,
                    display: "flex",
                    height: "100%",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <Typography gutterBottom variant="h5" component="div">
                    {card}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
            <Box display="flex" alignContent={"center"} alignItems={"center"} justifyContent={"center"} width={50}>
              <Typography variant="caption" component="div">
                {numCards}
              </Typography>
              <IconButton
                size="small"
                disabled={!numCards || disabled}
                onClick={() => onRemoveCard(selectedCards?.indexOf(card) || 0)}
              >
                <RemoveIcon fontSize="small" color={numCards ? "error" : "disabled"} />
              </IconButton>
            </Box>
          </Grid2>
        )
      })}
    </Grid2>
  );
}


interface HandProps {
  selectedCards: Array<string>;
  onRemoveCard: (index: number) => void;
  disabled?: boolean;
}

const Hand = (props: HandProps) => {
  const { selectedCards, onRemoveCard, disabled } = props;

  return (
    <Grid2 container size={{ xs: 12 }} alignContent="center" alignItems="center" justifyContent="center" spacing={2} sx={disabled ? DISABLED_STYLES : {}}>
      {selectedCards.map((card, i) => (
        <Grid2 key={i}>
          <Card sx={{ height: 70, width: 50 }}>
            <CardActionArea
              sx={{ height: "100%", width: "100%" }}
              onClick={() => onRemoveCard(i)}
              disabled={disabled}
            >
              <CardContent
                sx={{
                  alignContent: "center",
                  alignItems: "center",
                  p: 0,
                  m: 0,
                  display: "flex",
                  height: "100%",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <Typography gutterBottom variant="h5" component="div">
                  {card}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid2>
      ))}
    </Grid2>
  );
}


interface SplitHandChipProps {
  cards: Array<string>;
  onClick: () => void;
  disabled?: boolean;
  resultText?: string | null;
  resultColor?: "error" | "success" | "warning" | "inherit";
}

// A non-focused split hand: smaller, dimmed, and click-to-focus. Rendering the
// cards statically (no per-card action) keeps clicks anywhere on the chip
// focusing the hand rather than removing a card.
const SplitHandChip = (props: SplitHandChipProps) => {
  const { cards, onClick, disabled, resultText, resultColor } = props;
  const value = getHandValue(cards);

  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: disabled ? "default" : "pointer",
        userSelect: "none",
        opacity: disabled ? 0.4 : 0.7,
        transform: "scale(0.85)",
        transformOrigin: "top center",
        border: 2,
        borderColor: "transparent",
        borderRadius: 1,
        p: 0.5,
        transition: "opacity 0.2s, border-color 0.2s",
        "&:hover": disabled ? {} : { opacity: 1, borderColor: "divider" },
      }}
    >
      <Box display="flex" gap={0.5} justifyContent="center" minHeight={54}>
        {cards.length === 0 ? (
          <Typography variant="caption" color="text.secondary" alignSelf="center">
            empty
          </Typography>
        ) : (
          cards.map((card, i) => (
            <Box
              key={i}
              sx={{
                height: 54,
                width: 38,
                borderRadius: 1,
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body1" component="div">
                {card}
              </Typography>
            </Box>
          ))
        )}
      </Box>
      <Typography variant="caption" component="div" textAlign="center">
        {cards.length ? value : ""}
      </Typography>
      {resultText && (
        <Typography variant="caption" component="div" textAlign="center" color={resultColor} fontWeight="bold">
          {resultText}
        </Typography>
      )}
    </Box>
  );
}