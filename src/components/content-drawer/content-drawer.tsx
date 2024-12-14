'use client';
import React, { useRef } from 'react';
import { Box, Portal } from "@mui/material";
import { FlexContainer, FlexItem } from '../flex-content/flex-content';

export interface ContentDrawerLayoutProps {
  children?: React.ReactNode | null;
  drawerWidth?: number;
  borderTop?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderRight?: boolean;
  open?: boolean;
  drawer?: React.ReactNode;
}


export function ContentDrawerLayout(props: ContentDrawerLayoutProps) {
  const {
    children,
    drawer,
    open = false,
    drawerWidth = 600,
    borderTop = false,
    borderBottom = false,
    borderLeft = true,
    borderRight = false,
  } = props;


  return (
    <FlexContainer>
      <FlexItem fill enableScroll>{children}</FlexItem>
      <FlexItem collapsed={!open}>
        <Box
          id="content-drawer-portal"
          height="100%"
          width={drawerWidth}
          borderTop={borderTop ? (theme) => `1px solid ${theme.palette.divider}` : undefined}
          borderBottom={borderBottom ? (theme) => `1px solid ${theme.palette.divider}` : undefined}
          borderLeft={borderLeft ? (theme) => `1px solid ${theme.palette.divider}` : undefined}
          borderRight={borderRight ? (theme) => `1px solid ${theme.palette.divider}` : undefined}
        >
          {drawer}
        </Box>
      </FlexItem>
    </FlexContainer>
  );
}
