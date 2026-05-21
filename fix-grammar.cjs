const fs = require('fs');
const path = require('path');

// Mapeamento exato de termos quebrados pelo \uFFFD para suas versões corretas
// O \uFFFD substituiu os caracteres acentuados.
// Ex: "Veículo" virou "Veculo", "Usuário" virou "Usurio" ou algo do tipo.
// Na nossa pesquisa anterior, vimos:
// "Gesto" (Gestão), "Administra" + \uFFFD + "o" (Administração), etc.
// Para ser extremamente cirúrgico, vamos buscar as strings específicas e fazer o replace.

const replacements = {
  // Palavras completas ou fragmentos comuns com o \uFFFD já resolvidos:
  'Gest\uFFFDo': 'Gestão',
  'Administra\uFFFD\uFFFDo': 'Administração',
  'Administra\uFFFDo': 'Administração',
  'documenta\uFFFD\uFFFDo': 'documentação',
  'documenta\uFFFDo': 'documentação',
  '\uFFFDREA': 'ÁREA',
  'CONTE\uFFFDD0': 'CONTEÚDO',
  'CONTE\uFFFDDO': 'CONTEÚDO',
  'TRANSI\uFFFD\uFFFDO': 'TRANSIÇÃO',
  'TRANSI\uFFFDO': 'TRANSIÇÃO',
  'anima\uFFFD\uFFFDo': 'animação',
  'anima\uFFFDo': 'animação',
  'for\uFFFDar': 'forçar',
  'obede\uFFFDa': 'obedeça',
  'Servi\uFFFDo': 'Serviço',
  'n\uFFFDmero': 'número',
  'VE\uFFFDCULO': 'VEÍCULO',
  'Aten\uFFFD\uFFFDo': 'Atenção',
  'Aten\uFFFDo': 'Atenção',
  'des\uFFFDa': 'desça',
  'servi\uFFFDo': 'serviço',
  'SUBSTITUI\uFFFD\uFFFDO': 'SUBSTITUIÇÃO',
  'SUBSTITUI\uFFFDO': 'SUBSTITUIÇÃO',
  'CR\uFFFDTICA': 'CRÍTICA',
  'T\uFFFDcnico': 'Técnico',
  'Observa\uFFFD\uFFFDes': 'Observações',
  'Observa\uFFFDes': 'Observações',
  'anota\uFFFD\uFFFDes': 'anotações',
  'anota\uFFFDes': 'anotações',
  'Exclus\uFFFDo': 'Exclusão',
  'N\uFFFDo': 'Não',
  'n\uFFFDo': 'não',
  'poss\uFFFDvel': 'possível',
  'diret\uFFFDrio': 'diretório',
  'L\uFFFDGICA': 'LÓGICA',
  'EXCLUS\uFFFDO': 'EXCLUSÃO',
  'CABE\uFFFDALHO': 'CABEÇALHO',
  'fun\uFFFD\uFFFDo': 'função',
  'fun\uFFFDo': 'função',
  'obrigat\uFFFDrios': 'obrigatórios',
  'Qualifica\uFFFD\uFFFDo': 'Qualificação',
  'Qualifica\uFFFDo': 'Qualificação',
  'FORMUL\uFFFDR\uFFFDO': 'FORMULÁRIO', // às vezes pode ter dois
  'FORMUL\uFFFDRIO': 'FORMULÁRIO',
  'C\uFFFDDIGO': 'CÓDIGO',
  'exig\uFFFDncias': 'exigências',
  'forma\uFFFD\uFFFDo': 'formação',
  'forma\uFFFDo': 'formação',
  'descri\uFFFD\uFFFDo': 'descrição',
  'descri\uFFFDo': 'descrição',
  'Vital\uFFFDcio': 'Vitalício',
  'Exig\uFFFDncias': 'Exigências',
  'Rodap\uFFFD': 'Rodapé',
  'exclus\uFFFDo': 'exclusão',
  'ser\uFFFD': 'será',
  'contr\uFFFDrio': 'contrário',
  'qualifica\uFFFD\uFFFDo': 'qualificação',
  'qualifica\uFFFDo': 'qualificação',
  'ser\uFFFDo': 'serão',
  'Fun\uFFFD\uFFFDo': 'Função',
  'Fun\uFFFDo': 'Função',
  'Prim\uFFFDria': 'Primária',
  'per\uFFFDo\uFFFDo': 'período',
  'per\uFFFDodo': 'período',
  'Gr\uFFFDfico': 'Gráfico',
  'Evolu\uFFFD\uFFFDo': 'Evolução',
  'Evolu\uFFFDo': 'Evolução',
  'Hod\uFFFDmetro': 'Hodômetro',
  'hod\uFFFDmetro': 'hodômetro',
  'di\uFFFDrias': 'diárias',
  '\uFFFDltimos': 'Últimos',
  'Defini\uFFFD\uFFFDo': 'Definição',
  'Defini\uFFFDo': 'Definição',
  'Posi\uFFFD\uFFFDo': 'Posição',
  'Posi\uFFFDo': 'Posição',
  'Ve\uFFFDculo': 'Veículo',
  've\uFFFDculo': 'veículo',
  'M\uFFFDdia': 'Média',
  'relat\uFFFDrio': 'relatório',
  'Mar\uFFFDo': 'Março',
  'Efici\uFFFDncia': 'Eficiência',
  'An\uFFFDlise': 'Análise',
  'Dist\uFFFDncia': 'Distância',
  'Cr\uFFFDtico': 'Crítico',
  'Manuten\uFFFD\uFFFDo': 'Manutenção',
  'Manuten\uFFFDo': 'Manutenção',
  'Manuten\uFFFD\uFFFDes': 'Manutenções',
  'Manuten\uFFFDes': 'Manutenções',
  'Compat\uFFFDvel': 'Compatível',
  'Econ\uFFFDmico': 'Econômico',
  '2\uFFFD': '2ª',
  '3\uFFFD': '3ª',
  'Anima\uFFFD\uFFFDo': 'Animação',
  'Anima\uFFFDo': 'Animação',
  'Come\uFFFDa': 'Começa',
  'r\uFFFDo\uFFFDo': 'rápido',
  'r\uFFFDpido': 'rápido',
  'Usu\uFFFDrio': 'Usuário',
  'usu\uFFFDrio': 'usuário',
  'Sen\uFFFDo': 'Senão',
  'formata\uFFFD\uFFFDo': 'formatação',
  'formata\uFFFDo': 'formatação',
  'padr\uFFFDo': 'padrão',
  'recupera\uFFFD\uFFFDo': 'recuperação',
  'recupera\uFFFDo': 'recuperação',
  'inv\uFFFDlido': 'inválido',
  'seguran\uFFFDa': 'segurança',
  'Sess\uFFFDo': 'Sessão',
  'a\uFFFDo(\uFFFDes)': 'ação(ões)',
  'a\uFFFDo(\uFFFD\uFFFDes)': 'ação(ões)',

  // Correções puramente gramaticais (não ligadas ao erro de encoding)
  'kilometragem': 'quilometragem',
  'Kilometragem': 'Quilometragem',
  'kilometros': 'quilômetros',
  'Kilometros': 'Quilômetros',
};

function walk(dir) {
  let changedFilesCount = 0;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      changedFilesCount += walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      // Iterar sobre todas as chaves e substituir globalmente no arquivo
      for (const [wrong, right] of Object.entries(replacements)) {
          // Usando um regex global. Note que algumas chaves têm parênteses, então precisamos escapar
          const escapedWrong = wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedWrong, 'g');
          content = content.replace(regex, right);
      }

      // Além disso, tentar pegar \uFFFD perdidos que não estavam no dicionário e avisar (ou apenas remover, mas melhor deixar quieto por segurança)

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        changedFilesCount++;
        // console.log(`Corrigido: ${fullPath}`);
      }
    }
  }
  return changedFilesCount;
}

const count = walk('src');
console.log(`Auditoria concluída! ${count} arquivos corrigidos.`);
