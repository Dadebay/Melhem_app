import {Pressable, View} from 'react-native';
import {Bookmark} from 'lucide-react-native';
import useColors from '../../lib/hooks/useColors';

interface Props {
  onPress: () => void;
  isBookmarked: boolean;
}
const HeaderRight = ({onPress, isBookmarked}: Props) => {
  const colors = useColors();
  return (
    <View style={{flexDirection: 'row', gap: 16}}>
      <Pressable onPress={onPress}>
        <Bookmark
          size={22}
          color={isBookmarked ? colors.$brandActive : colors.$textPrimary}
          strokeWidth={1.5}
          fill={isBookmarked ? colors.$brandActive : 'none'}
        />
      </Pressable>
    </View>
  );
};

export default HeaderRight;
