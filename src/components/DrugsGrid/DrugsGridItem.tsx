import {Image, Pressable, Text, View} from 'react-native';
import TurboImage from 'react-native-turbo-image';
import {useTranslation} from 'react-i18next';
import getImageUrl from '../../lib/getImageUrl';
import utils from '../../lib/utils';
import {Bookmark} from 'lucide-react-native';
import {ColorType} from '../../lib/theme/lightTheme';
import PlaceholderImage from '../../../assets/images/placeholder.png';

interface Props {
  name: string;
  imageKey: string | null;
  priceText: string | null;
  isOutOfStock: boolean;
  formulationText?: string | null;
  pharmacy?: {name: string; logo: string};
  colors: ColorType;
  windowWidth: number;
  onPress: () => void;
  onBookmarkPress: () => void;
  isBookmarked: boolean;
}

const DrugsGridItem = ({
  name,
  imageKey,
  priceText,
  isOutOfStock,
  formulationText,
  pharmacy,
  colors,
  windowWidth,
  onPress,
  onBookmarkPress,
  isBookmarked,
}: Props) => {
  const {t} = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: windowWidth / 2 - 26,
        marginBottom: 16,
        flex: 1,
      }}>
      <View>
        <Pressable
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            backgroundColor: colors.$card,
            padding: 6,
            borderRadius: 20,
          }}
          onPress={onBookmarkPress}>
          <Bookmark
            size={18}
            color={isBookmarked ? colors.$brandActive : colors.$textSecondary}
            strokeWidth={1.5}
            fill={isBookmarked ? colors.$brandActive : 'none'}
          />
        </Pressable>
        <View
          style={{
            backgroundColor: colors.$card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.$border,
            overflow: 'hidden',
          }}>
          {imageKey ? (
            <TurboImage
              source={{uri: getImageUrl('drugs', imageKey, 256)}}
              style={{
                width: '100%',
                height: undefined,
                aspectRatio: 1,
              }}
            />
          ) : (
            <Image
              source={PlaceholderImage}
              style={{
                width: '100%',
                height: undefined,
                aspectRatio: 1,
              }}
            />
          )}
        </View>
      </View>
      <View style={{paddingTop: 10, gap: 2}}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            lineHeight: 18,
            color: colors.$textPrimary,
          }}
          numberOfLines={2}>
          {utils.tightenName(name)}
        </Text>
        {!!formulationText && (
          <Text
            style={{
              fontSize: 12,
              color: colors.$textSecondary,
            }}
            numberOfLines={1}>
            {formulationText}
          </Text>
        )}
        {isOutOfStock ? (
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: colors.$error,
              marginTop: 6,
            }}>
            {t('drug.outOfStock')}
          </Text>
        ) : (
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: colors.$brandActive,
              marginTop: 5,
            }}
            numberOfLines={1}>
            {priceText}
          </Text>
        )}
        {pharmacy && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
            }}>
            <TurboImage
              source={{
                uri: getImageUrl('pharmacies', pharmacy.logo, 256),
              }}
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                color: colors.$textSecondary,
                flex: 1,
              }}
              numberOfLines={1}>
              {pharmacy.name}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default DrugsGridItem;
