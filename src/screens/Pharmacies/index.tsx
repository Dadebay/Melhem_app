import pharmacyApi from '../../lib/api/pharmacyApi';
import PharmaciesList from '../../components/PharmaciesList';
import useLocationId from '../../lib/hooks/useLocationId';
import usePullToRefresh from '../../lib/hooks/usePullToRefresh';

const PharmaciesScreen = () => {
  const locationId = useLocationId();
  const {refreshing, onRefresh} = usePullToRefresh();
  const pharmaciesQuery = pharmacyApi.useGetAll({
    page: 1,
    size: 50,
    location_id: locationId,
  });

  return (
    <PharmaciesList
      data={pharmaciesQuery.data?.pharmacies || []}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

export default PharmaciesScreen;
