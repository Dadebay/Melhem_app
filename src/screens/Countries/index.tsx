import React from 'react';
import countryApi from '../../lib/api/countries';
import CountriesList from '../../components/CountriesList';
import {useTranslation} from 'react-i18next';

const CountriesScreen = () => {
  const {t} = useTranslation();
  const countriesQuery = countryApi.useGetAll({
    page: 0,
    limit: 0,
  });

  return (
    <CountriesList
      data={countriesQuery.data?.countries || []}
      currentLanguage={t('key') as ContentLanguage}
    />
  );
};

export default CountriesScreen;
