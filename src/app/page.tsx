"use client";

import { useMemo, useState } from "react";
import { ContentDrawerLayout } from "@/components/content-drawer/content-drawer";
import { FlexContainer, FlexItem } from "@/components/flex-content/flex-content";
import { getChanceOfOutcomes, getHandValue } from "./math";

import RemoveIcon from '@mui/icons-material/Remove';
import CasinoIcon from '@mui/icons-material/Casino';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import { useThemeContext } from "@/components/theme/theme";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Grid2,
  IconButton,
  Radio,
  RadioGroup,
  Toolbar,
  Typography,
  useMediaQuery
} from "@mui/material";

function formatPercent(num: number) {
  return `${Math.round(num * 100)}%`;
}

function formatEv(num: number) {
  return num.toFixed(2);
}

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

export default function Home() {

  const { mode, setMode } = useThemeContext();

  const [totalDecks, setTotalDecks] = useState<number>(8);

  const [discardPile, setDiscardPile] = useState<Array<string>>([]);

  const [dealerHand, setDealerHand] = useState<Array<string>>([]);
  const [playerHand, setPlayerHand] = useState<Array<string>>([]);
  const [otherCards, setOtherCards] = useState<Array<string>>([]);

  const numOfEachCard = totalDecks * 4;
  const usedCards = [...dealerHand, ...playerHand, ...otherCards, ...discardPile];

  const numCardsInDrawPile: CardsInDrawPile = CARDS.reduce<CardsInDrawPile>(
    (acc, card) => {
      const key = `num${card}s` as keyof CardsInDrawPile;
      acc[key] = numOfEachCard - usedCards.filter((c) => c === card).length;
      return acc;
    }, {
    num2s: 0, num3s: 0, num4s: 0, num5s: 0, num6s: 0, num7s: 0, num8s: 0,
    num9s: 0, num10s: 0, numJs: 0, numQs: 0, numKs: 0, numAs: 0
  });

  const { num2s, num3s, num4s, num5s, num6s, num10s, numJs, numQs, numKs, numAs } = numCardsInDrawPile;

  const hiLowCount = num2s + num3s + num4s + num5s + num6s - num10s - numJs - numQs - numKs - numAs;

  const dealerValue = getHandValue(dealerHand);



  const isBelowMd = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const isBelowXl = useMediaQuery((theme) => theme.breakpoints.down("xl"));

  const outcomeChance = useMemo(() => {
    return getChanceOfOutcomes({
      dealerHand,
      playerHand,
      numCardsInDrawPile,
    });
  }, [dealerHand, playerHand, numCardsInDrawPile]);

  const appBarJsx = (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Black Jack Counter
          </Typography>
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
    </AppBar>
  )

  const drawerJsx = (
    <Grid2 container size={{ xs: 12 }} spacing={2} p={2}>
      <Grid2 size={{ xs: 12 }}>
        <Typography variant="h6" component="div">
          High-Low
        </Typography>
      </Grid2>
      <Grid2 size={{ xs: 12 }}>
        Count: {hiLowCount}
      </Grid2>
      <Grid2 size={{ xs: 12 }}>
        True Count: {hiLowCount / totalDecks}
      </Grid2>
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
          }
          )}
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
        <FormControlLabel value="1" control={<Radio />} label="1" />
        <FormControlLabel value="2" control={<Radio />} label="2" />
        <FormControlLabel value="3" control={<Radio />} label="3" />
        <FormControlLabel value="4" control={<Radio />} label="4" />
        <FormControlLabel value="5" control={<Radio />} label="5" />
        <FormControlLabel value="6" control={<Radio />} label="6" />
        <FormControlLabel value="7" control={<Radio />} label="7" />
        <FormControlLabel value="8" control={<Radio />} label="8" />
        <FormControlLabel value="9" control={<Radio />} label="9" />
        <FormControlLabel value="10" control={<Radio />} label="10" />
        <Button
          color="primary"
          onClick={() => {
            setDiscardPile([]);
            setDealerHand([]);
            setPlayerHand([]);
            setOtherCards([]);
          }}
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
        selectedCards={playerHand}
        onAddCard={(card) => {
          setPlayerHand([...playerHand, card]);
        }}
        onRemoveCard={(index) => {
          playerHand.splice(index, 1);
          setPlayerHand([...playerHand]);
        }}
      />
    </FormControl>
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
          <Typography variant="caption" component="div">
            {formatPercent(outcomeChance.dealerBust)} Chance Dealer Busts
          </Typography>
        )}
        <Hand
          selectedCards={dealerHand}
          onRemoveCard={(index) => {
            dealerHand.splice(index, 1);
            setDealerHand([...dealerHand]);
          }}
        />
        {Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography variant="caption" component="div">
            {dealerValue}
          </Typography>
        )}
      </Box>
      <Box alignContent="center" alignItems="center" justifyContent="center" textAlign="center">
        {Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography variant="caption" component="div">
            {formatPercent(outcomeChance.playerBust)} Chance to Bust on Next Card
          </Typography>
        )}
        {Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography variant="caption" component="div">
            Stand has {formatPercent(outcomeChance.playerWin)} to win
          </Typography>
        )}
        {Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography variant="caption" component="div">
            EV of Standing: {formatEv(outcomeChance.expectedValueStanding)}
          </Typography>
        )}
        {Number.isFinite(outcomeChance.expectedValueHitting) && Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography variant="caption" component="div">
            EV of Hitting: {formatEv(outcomeChance.expectedValueHitting as number)}
          </Typography>
        )}
        {Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography variant="caption" component="div" fontWeight="bold">
            {outcomeChance.shouldStand ? "Stand" : "Hit"}
          </Typography>
        )}
        <Hand
          selectedCards={playerHand}
          onRemoveCard={(index) => {
            playerHand.splice(index, 1);
            setPlayerHand([...playerHand]);
          }}
        />
        {Boolean(playerHand.length > 1) && Boolean(dealerHand.length) && (
          <Typography variant="caption" component="div">
            {getHandValue(playerHand)}
          </Typography>
        )}
      </Box>
      <Box position="absolute" right={10} bottom={10}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setDiscardPile([...discardPile, ...dealerHand, ...playerHand, ...otherCards]);
            setDealerHand([]);
            setPlayerHand([]);
            setOtherCards([]);
          }}
          disabled={!dealerHand.length}
        >
          End Round
        </Button>
      </Box>
    </Box>
  );

  const otherCardsJsx = (
    <FormControl sx={{ width: "100%" }}>
      <FormLabel id="demo-row-radio-buttons-group-label">Other Cards at the Table</FormLabel>
      <HandSelection
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
}

const HandSelection = (props: HandSelectionProps) => {
  const {
    onAddCard,
    onRemoveCard = () => { },
    selectedCards
  } = props;

  return (
    <Grid2 container size={{ xs: 12 }} alignContent="center" alignItems="center" justifyContent="center" spacing={2}>
      {CARDS.map((card) => {
        const numCards = selectedCards?.filter((c) => c === card).length || 0
        return (
          <Grid2 key={card} sx={{ opacity: numCards ? 1 : 0.5 }}>
            <Card sx={{ height: 70, width: 50 }}>
              <CardActionArea sx={{ height: "100%", width: "100%", }} onClick={() => onAddCard(card)}>
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
                disabled={!numCards}
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
}

const Hand = (props: HandProps) => {
  const { selectedCards, onRemoveCard } = props;

  return (
    <Grid2 container size={{ xs: 12 }} alignContent="center" alignItems="center" justifyContent="center" spacing={2}>
      {selectedCards.map((card, i) => (
        <Grid2 key={i}>
          <Card sx={{ height: 70, width: 50 }}>
            <CardActionArea
              sx={{ height: "100%", width: "100%" }}
              onClick={() => onRemoveCard(i)}
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