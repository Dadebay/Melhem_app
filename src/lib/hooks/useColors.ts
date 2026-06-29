import darkTheme from '../theme/darkTheme';
import lightTheme from '../theme/lightTheme';
import themeStore from '../store/themeStore';

const useColors = () => {
  const theme = themeStore(state => state.theme);

  if (theme === 'dark') {
    return darkTheme;
  }

  return lightTheme;
};

export default useColors;
