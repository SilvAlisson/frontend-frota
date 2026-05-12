export const DateHelper = {
 getDia: (isoDate: string) => {
  if (!isoDate) return '--';
  return isoDate.split('T')[0].split('-')[2];
 },
 getMesCurto: (isoDate: string) => {
  if (!isoDate) return '---';
  const mesIndex = parseInt(isoDate.split('T')[0].split('-')[1], 10) - 1;
  const meses = ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'];
  return meses[mesIndex];
 },
 getCompleta: (isoDate: string) => {
  if (!isoDate) return '---';
  const partes = isoDate.split('T')[0].split('-');
  const dia = partes[2];
  const ano = partes[0];
  const mesIndex = parseInt(partes[1], 10) - 1;
  const meses = ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'];
  return `${dia} ${meses[mesIndex]} ${ano}`;
 },
 getHora: (isoDate: string) => {
  if (!isoDate || !isoDate.includes('T')) return '--:--';
  return isoDate.split('T')[1].substring(0, 5); // Retorna HH:mm
 },
 getExcelDataHora: (isoDate: string) => {
  if (!isoDate) return '';
  const partesData = isoDate.split('T')[0].split('-');
  const hora = isoDate.includes('T') ? isoDate.split('T')[1].substring(0, 5) : '';
  return `${partesData[2]}/${partesData[1]}/${partesData[0]} ${hora}`.trim();
 },
 getExcel: (isoDate: string) => {
  if (!isoDate) return '';
  const dataPart = isoDate.split('T')[0].split('-');
  return `${dataPart[2]}/${dataPart[1]}/${dataPart[0]}`;
 }
};
