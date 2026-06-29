import {Pressable} from 'react-native';
import ShareIcon from '../../../assets/icons/Interface/Interface 109 - 24px.svg';
import useColors from '../../lib/hooks/useColors';

interface Props {
  onPress: () => void;
}
const HeaderRight = ({onPress}: Props) => {
  const colors = useColors();
  return (
    <Pressable>
      <ShareIcon
        width={24}
        height={24}
        onPress={onPress}
        color={colors.$textPrimary}
      />
    </Pressable>
  );
};

export default HeaderRight;
