'use client';
import React, { createContext, useContext } from 'react';
import { Box, BoxProps, Collapse } from "@mui/material";

export interface FlexContainerProps extends BoxProps {
  children?: React.ReactNode;
  flexDirection?: "row" | "column";
}

export interface FlexItemProps extends BoxProps {
  backgroundColor?: string;
  children?: React.ReactNode;
  enableScroll?: boolean;
  fill?: boolean;
  collapsed?: boolean; // Add the collapsed prop
}

const FlexDirectionContext = createContext("row");


export function FlexContainer(props: FlexContainerProps) {
  const {
    children,
    flexDirection = "row",
    ...restProps
  } = props;

  return (
    <FlexDirectionContext.Provider value={flexDirection}>
      <Box
        flexDirection={flexDirection}
        height="100%"
        width="100%"
        display="flex"
        minHeight={0}
        minWidth={0}
        {...restProps}
      >
        {children}
      </Box>
    </FlexDirectionContext.Provider>
  );
}

export function FlexItem(props: FlexItemProps) {
  const {
    children,
    fill,
    enableScroll,
    collapsed,
    minHeight = 0,
    minWidth = 0,
    ...restProps
  } = props;

  const flexDirection = useContext(FlexDirectionContext);

  const childrenJsx = function () {
    if (typeof collapsed !== 'boolean') return children;

    if (fill && collapsed) return null;

    return (
      <Collapse
        in={!collapsed}
        orientation={flexDirection === "row" ? "horizontal" : "vertical"}
        sx={{
          minHeight,
          minWidth,
          height: !collapsed ? '100%' : undefined,
          width: !collapsed ? '100%' : undefined,
          '& .MuiCollapse-wrapper': {
            maxHeight: '100%',
            height: '100%',
            // maxWidth: '100%',
            // width: '100%',
          },
        }}
      >
        {children}
      </Collapse>
    )
  }();

  return (
    <Box
      flexDirection="column"
      {...restProps}
      flex={fill ? "1 0 0" : undefined}
      display="flex"
      overflow={enableScroll ? "auto" : undefined}
      minHeight={0} // Allow the container to respect the parent’s size
      minWidth={0} // Allow the container to respect the parent’s size
    >
      {childrenJsx}
    </Box>
  );
}
