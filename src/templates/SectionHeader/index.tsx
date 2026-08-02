import {Pressable, Text, View} from 'react-native';
import {PropsWithChildren} from 'react';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';

interface Props {
  onPress?: () => void;
}
const SectionHeader = ({onPress, children}: PropsWithChildren<Props>) => {
  const colors = useColors();
  const {t} = useTranslation();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
      }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.$textPrimary,
          flex: 1,
          letterSpacing: -0.3,
        }}>
        {children}
      </Text>
      {onPress && (
        <Pressable onPress={onPress}>
          <Text
            style={{
              fontSize: 13,
              color: colors.$textSecondary,
              fontWeight: '500',
            }}>
            {t('common.all')}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default SectionHeader;
