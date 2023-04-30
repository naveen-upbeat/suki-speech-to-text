import { Container, Drawer, Typography } from '@mui/material';
import { JSXElementConstructor, ReactElement, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setDebugDrawerOpen } from '../store/debugDrawSlice';
import { alignJustifyItemsCenter, flexColumn } from '../util/styleUtils';
import AudioClips from './AudioClips';

export type DebugDrawerBottomProps = {
  refs: any;
  // isDebugDrawerOpen: boolean;
  // setDebugDrawOpen: (b: boolean) => void;
  // children: ReactElement<any, string | JSXElementConstructor<any>>;
};

const DebugDrawerBottom = ({
  refs,
}: // isDebugDrawerOpen,
// setDebugDrawOpen,
// children,
DebugDrawerBottomProps) => {
  const { socketSendCounter } = refs;
  const { isDebugDrawerOpen } = useSelector((state: any) => state.debugDrawer);
  const { isCurrentlyRecording } = useSelector(
    (state: any) => state.microPhone
  );
  const dispatch = useDispatch();

  useEffect(() => {
    //
  }, [isCurrentlyRecording, socketSendCounter, isDebugDrawerOpen]);

  return (
    <Drawer
      variant="temporary"
      anchor="bottom"
      open={isDebugDrawerOpen}
      onClose={() => dispatch(setDebugDrawerOpen(false))}
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
      <Container
        sx={{
          ...flexColumn,
          ...alignJustifyItemsCenter,
        }}
      >
        <AudioClips refs={refs} />
        <Typography>
          Total messages sent over socket: {socketSendCounter.current}
        </Typography>
      </Container>
    </Drawer>
  );
};

export default DebugDrawerBottom;
