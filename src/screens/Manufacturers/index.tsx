import React from 'react';
import manufacturerApi from '../../lib/api/manufacturerApi';
import ManufacturersList from '../../components/ManufacturersList';

const ManufacturersScreen = () => {
  const manufacturersQuery = manufacturerApi.useGetAll({
    page: 0,
    limit: 0,
  });
  return (
    <ManufacturersList data={manufacturersQuery.data?.manufacturers || []} />
  );
};

export default ManufacturersScreen;
