declare module '*.png';
declare module '*.jpg';
declare module '*.svg' {
  import React from 'react';
  import {SvgProps} from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

type ContentLanguage = 'tm' | 'ru';

type AppTheme = 'dark' | 'light';

type WeekDays =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

type LanguagesData = {
  key: ContentLanguage;
  title: string;
  imageSrc: string;
};

type ApiErrorResponse = {
  message: string[] | string;
  error: string;
  statusCode: number;
};
