import {useTranslation} from 'react-i18next';
import TmFlag from '../../../assets/images/tm-flag.png';
import RuFlag from '../../../assets/images/ru-flag.png';
import LanguagesList from '../../components/LanguagesList';

const data: LanguagesData[] = [
  {
    key: 'tm',
    title: 'Türkmen dili',
    imageSrc: TmFlag,
  },
  {
    key: 'ru',
    title: 'Русский',
    imageSrc: RuFlag,
  },
];

const LanguagesScreen = () => {
  const {t} = useTranslation();

  return <LanguagesList data={data} t={t} />;
};

export default LanguagesScreen;
