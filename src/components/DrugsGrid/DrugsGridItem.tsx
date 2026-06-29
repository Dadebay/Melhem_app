import {Image, Pressable, Text, View} from 'react-native';
import TurboImage from 'react-native-turbo-image';
import getImageUrl from '../../lib/getImageUrl';
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
            color={isBookmarked ? colors.$textPrimary : colors.$textSecondary}
            strokeWidth={1.5}
            fill={isBookmarked ? colors.$textPrimary : 'none'}
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
      <View style={{paddingTop: 10, gap: 3}}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.$textPrimary,
          }}
          numberOfLines={2}>
          {name}
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
              fontSize: 12,
              fontWeight: '600',
              color: colors.$error,
              marginTop: 4,
            }}>
            Satlykda yok
          </Text>
        ) : (
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: colors.$textPrimary,
              marginTop: 4,
            }}>
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
