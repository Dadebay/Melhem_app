import {NativeStackScreenProps} from '@react-navigation/native-stack';
import DrugsGrid from '../../components/DrugsGrid';
import {useCallback, useEffect, useMemo} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import NotFoundIcon from '../../../assets/icons/Interface/Interface 34 - 24px.svg';
import useColors from '../../lib/hooks/useColors';
import inventoryApi from '../../lib/api/inventoryApi';

type Props = NativeStackScreenProps<Nav.Home, 'Inventory'>;
const InventoryScreen = ({navigation, route}: Props) => {
  const colors = useColors();

  const drugsQuery = inventoryApi.useGetAllInfiniteList({
    page: 0,
    limit: 10,
    pharmacyId: route.params.pharmacyId,
    onlyInStock: true,
  });

  const drugs = useMemo(
    () => drugsQuery.data?.pages.flatMap(page => page.inventories) || [],
    [drugsQuery.data],
  );

  const handleEndReached = useCallback(() => {
    if (drugsQuery.hasNextPage && !drugsQuery.isFetchingNextPage) {
      drugsQuery.fetchNextPage();
    }
  }, [drugsQuery]);

  useEffect(() => {
    navigation.setOptions({
      title: route.params.pharmacyName,
    });
  }, [navigation, route.params.pharmacyName]);

  if (drugsQuery.isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color={colors.$primary} />
      </View>
    );
  } else if (drugs.length === 0) {
    return (
      <View className="flex-1 justify-center items-center" style={{gap: 4}}>
        <NotFoundIcon width={64} height={64} color={colors.$textPrimary} />
        <Text className="font-semibold text-center text-app-text-primary">
          Derman tapylmady
        </Text>
        <Text className="text-sm text-center text-app-text-primary">
          Bu bölümde häzirlikçe derman ýok
        </Text>
      </View>
    );
  }

  return (
    <DrugsGrid
      data={drugs}
      onEndReached={handleEndReached}
      isNextPageLoading={drugsQuery.isFetchingNextPage}
      navigateWithPrice
    />
  );
};

export default InventoryScreen;
