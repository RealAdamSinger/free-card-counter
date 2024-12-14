"use client";

import { useState } from "react";
import { ContentDrawerLayout } from "@/components/content-drawer/content-drawer";
import { FlexContainer, FlexItem } from "@/components/flex-content/flex-content";
import RemoveIcon from '@mui/icons-material/Remove';
import {
  AppBar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid2,
  Icon,
  IconButton,
  Radio,
  RadioGroup,
  Toolbar,
  Typography,
  useMediaQuery
} from "@mui/material";



// array of cards
const CARDS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];


export default function Home() {

  const [totalDecks, setNumDecks] = useState<Number>(6);
  const [hiLowCount, setHiLowCount] = useState<Number>(0);

  const [dealerHand, setDealerHand] = useState<Array<string>>([]);
  const [playerHand, setPlayerHand] = useState<Array<string>>([]);
  const [otherCards, setOtherCards] = useState<Array<string>>([]);


  const isBelowMd = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const isBelowXl = useMediaQuery((theme) => theme.breakpoints.down("xl"));


  return (
    <ContentDrawerLayout
      open
      drawerWidth={isBelowXl ? 300 : 600}
      drawer={
        <Grid2 container size={{ xs: 12 }} spacing={2} p={2}>
          <Grid2 size={{ xs: 12 }}>
            <Typography variant="h6" component="div">
              Hi-Low
            </Typography>
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            Count: {hiLowCount}
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            True Count: {hiLowCount / totalDecks}
          </Grid2>
        </Grid2>
      }
    >
      <FlexContainer flexDirection="column" sx={isBelowMd ? { minHeight: 1200, height: "200%" } : {}} >
        <FlexItem>
          <AppBar position="static">
            <Container maxWidth="lg">
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  Black Jack Counter
                </Typography>
              </Toolbar>
            </Container>
          </AppBar>
        </FlexItem>
        <FlexItem fill p={2} maxWidth="lg" alignSelf="center" alignItems="start">
          <FlexItem p={1}>
            <FormControl>
              <FormLabel id="demo-row-radio-buttons-group-label">Total Decks</FormLabel>
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
                value={`${totalDecks}`}
                onChange={(e) => setNumDecks(parseInt(e.target.value))}
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
              </RadioGroup>
            </FormControl>
          </FlexItem>
          <FlexItem fill p={1} >
            <FlexItem>
              <FormControl>
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
            </FlexItem>
            <FlexItem fill p={1} >
              <Box
                height="100%"
                width="100%"
                display="flex"
                flexDirection="column"
                justifyContent="space-around"
                border={2}
                borderRadius={1}
                borderColor="primary.main"
              >
                <Hand
                  selectedCards={dealerHand}
                  onRemoveCard={(index) => {
                    dealerHand.splice(index, 1);
                    setDealerHand([...dealerHand]);
                  }}
                />
                <Hand
                  selectedCards={playerHand}
                  onRemoveCard={(index) => {
                    playerHand.splice(index, 1);
                    setPlayerHand([...playerHand]);
                  }}
                />
              </Box>
            </FlexItem>
            <FlexItem p={1}>
              <FormControl>
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
            </FlexItem>
            <FlexItem p={1}>
              <FormControl>
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
            </FlexItem>
          </FlexItem >
        </FlexItem >
      </FlexContainer >
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
          <Grid2 key={card}>
            <Card sx={{ height: 70, width: 50, opacity: numCards ? 1 : 0.5 }}>
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
                <RemoveIcon />
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