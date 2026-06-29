import drugApi from '../../lib/api/drugApi';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import DrugsGrid from '../../components/DrugsGrid';
import {useCallback, useEffect, useMemo} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import NotFoundIcon from '../../../assets/icons/Interface/Interface 34 - 24px.svg';
import useColors from '../../lib/hooks/useColors';
import useLocationId from '../../lib/hooks/useLocationId';
import usePullToRefresh from '../../lib/hooks/usePullToRefresh';

type Props = NativeStackScreenProps<Nav.Home, 'Drugs'>;
const DrugsScreen = ({navigation, route}: Props) => {
  const colors = useColors();
  const locationId = useLocationId();
  const {refreshing, onRefresh} = usePullToRefresh();

  const drugsQuery = drugApi.useGetAllInfiniteList({
    page: 1,
    size: 10,
    location_id: locationId,
    ...route.params.queries,
  });

  const data = useMemo(
    () => drugsQuery.data?.pages.flatMap(page => page.drugs) || [],
    [drugsQuery.data],
  );

  const handleEndReached = useCallback(() => {
    if (drugsQuery.hasNextPage && !drugsQuery.isFetchingNextPage) {
      drugsQuery.fetchNextPage();
    }
  }, [drugsQuery]);

  useEffect(() => {
    navigation.setOptions({
      title: route.params.title,
    });
  }, [navigation, route.params.title]);

  if (drugsQuery.isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color={colors.$primary} />
      </View>
    );
  } else if (data.length === 0) {
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
      data={data}
      isNextPageLoading={drugsQuery.isFetchingNextPage}
      onEndReached={handleEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

export default DrugsScreen;
