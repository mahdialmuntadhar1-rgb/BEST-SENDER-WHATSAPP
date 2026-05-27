import { Governorate, Language } from '../models/Contact';

export const detectLanguage = (governorate: Governorate): Language => {
  const soraniGovernorates: Governorate[] = ['Sulaymaniyah', 'Halabja', 'Erbil', 'Kirkuk'];
  const bahdiniGovernorates: Governorate[] = ['Duhok', 'Zakho'];

  if (soraniGovernorates.includes(governorate)) {
    return 'sorani';
  }

  if (bahdiniGovernorates.includes(governorate)) {
    return 'bahdini';
  }

  return 'arabic';
};

export const GOVERNORATES: Governorate[] = [
  'Baghdad',
  'Basra',
  'Erbil',
  'Duhok',
  'Zakho',
  'Sulaymaniyah',
  'Najaf',
  'Karbala',
  'Mosul',
  'Kirkuk',
  'Anbar',
  'Diyala',
  'Wasit',
  'Maysan',
  'Dhi Qar',
  'Babil',
  'Qadisiyah',
  'Muthanna',
  'Salah ad Din',
  'Halabja',
];
