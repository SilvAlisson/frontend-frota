import { parseISO, format, isValid } from 'date-fns';

const parseAndValidate = (isoDate: string) => {
  if (!isoDate) return null;
  const date = parseISO(isoDate);
  if (!isValid(date)) return null;
  return date;
};

export const DateHelper = {
  getDia: (isoDate: string) => {
    const date = parseAndValidate(isoDate);
    if (!date) return '--';
    return format(date, 'dd');
  },
  getMesCurto: (isoDate: string) => {
    const date = parseAndValidate(isoDate);
    if (!date) return '---';
    const meses = ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'];
    return meses[date.getMonth()];
  },
  getCompleta: (isoDate: string) => {
    const date = parseAndValidate(isoDate);
    if (!date) return '---';
    const meses = ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'];
    return `${format(date, 'dd')} ${meses[date.getMonth()]} ${format(date, 'yyyy')}`;
  },
  getHora: (isoDate: string) => {
    const date = parseAndValidate(isoDate);
    if (!date) return '--:--';
    return format(date, 'HH:mm');
  },
  getExcelDataHora: (isoDate: string) => {
    const date = parseAndValidate(isoDate);
    if (!date) return '';
    return format(date, 'dd/MM/yyyy HH:mm');
  },
  getExcel: (isoDate: string) => {
    const date = parseAndValidate(isoDate);
    if (!date) return '';
    return format(date, 'dd/MM/yyyy');
  }
};
