import {useCallback, useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';

/**
 * Swipe-down-to-refresh helper. Returns `{refreshing, onRefresh}` to attach to
 * a screen's scroll container (RefreshControl / FlatList / FlashList).
 *
 * `onRefresh` refetches every currently-mounted query at once, so pulling down
 * refreshes all of the current screen's data in one go.
 */
const usePullToRefresh = () => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({type: 'active'});
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return {refreshing, onRefresh};
};

export default usePullToRefresh;
