import { Drawer } from '@mui/material';
import { JSXElementConstructor, ReactElement } from 'react';

export type DebugDrawerBottomProps = {
  isDebugDrawerOpen: boolean;
  setDebugDrawOpen: (b: boolean) => void;
  children: ReactElement<any, string | JSXElementConstructor<any>>;
};

const DebugDrawerBottom = ({
  isDebugDrawerOpen,
  setDebugDrawOpen,
  children,
}: DebugDrawerBottomProps) => {
  return (
    <Drawer
      variant="temporary"
      anchor="bottom"
      open={isDebugDrawerOpen}
      onClose={() => setDebugDrawOpen(false)}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
      sx={{
        display: { xs: 'block', sm: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: '100%',
          height: '200px',
        },
      }}
    >
      {children}
    </Drawer>
  );
};

export default DebugDrawerBottom;
