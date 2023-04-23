import Box from '@mui/material/Box';
import { allCenter, displayFlexRow } from '../util/styleUtils';
import SukiFooterLogo from '../assets/footer.png';

const AppFooter = () => {
  return (
    <Box
      sx={{
        ...displayFlexRow,
        ...allCenter,
        width: '100%',
        marginTop: '14px',
      }}
    >
      <img
        src={SukiFooterLogo}
        width={'auto'}
        height={'80px'}
        alt="footer text"
      />
    </Box>
  );
};

export default AppFooter;
