"use client";

import { useState } from "react";
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
  Radio,
  RadioGroup,
  Toolbar,
  Typography,
  useMediaQuery
} from "@mui/material";
import { FlexContainer, FlexItem } from "./components/flex-content/flex-content";



// array of cards
const cards = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];


export default function Home() {

  const [numDecks, setNumDecks] = useState<Number>(6);

  const isSm = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  return (
    <FlexContainer flexDirection="column" sx={isSm ? { height: 800 } : {}} >
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
            <FormLabel id="demo-row-radio-buttons-group-label">Number of Decks</FormLabel>
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              value={`${numDecks}`}
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
          {/* <FlexContainer flexDirection="column" justifyContent="center" alignItems="center"> */}
          <FlexItem>
            <FormControl>
              <FormLabel id="demo-row-radio-buttons-group-label">Dealer's Hand</FormLabel>
              <Hand />
            </FormControl>
          </FlexItem>
          <FlexItem fill p={1} >
          </FlexItem>
          <FlexItem p={1}>
            <FormControl>
              <FormLabel id="demo-row-radio-buttons-group-label">Your Hand</FormLabel>
              <Hand />
            </FormControl>
          </FlexItem>
          <FlexItem p={1}>
            <FormControl>
              <FormLabel id="demo-row-radio-buttons-group-label">Other Cards at the Table</FormLabel>
              <Hand />
            </FormControl>
          </FlexItem>
          {/* </FlexContainer> */}
        </FlexItem >
      </FlexItem >

    </FlexContainer >
  );
}



const Hand = () => {
  return (
    <Grid2 container size={{ xs: 12 }} alignContent="center" alignItems="center" justifyContent="center" spacing={2}>
      {cards.map((card) => (
        <Grid2 key={card}>
          <Card sx={{ height: 70, width: 50 }}>
            <CardActionArea sx={{ height: "100%", width: "100%" }}>
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