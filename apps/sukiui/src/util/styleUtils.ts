import { keyframes } from '@emotion/react';

const displayFlex = {
  display: 'flex',
};

export const displayFlexRow = {
  ...displayFlex,
  flexDirection: 'row',
};

export const flexColumn = {
  ...displayFlex,
  flexDirection: 'column',
};

export const alignJustifyItemsCenter = {
  alignItems: 'center',
  justifyItems: 'center',
};

export const allCenter = {
  ...alignJustifyItemsCenter,
  justifyContent: 'center',
};

export const blinkKeyframes = keyframes` 50% {
    opacity: 0;
  }`;

export const whiteBackgroundDarkText = {
  background: '#FFF',
  color: '#000',
};
