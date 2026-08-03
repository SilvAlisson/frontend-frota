import { Project, SyntaxKind, JsxElement, JsxSelfClosingElement } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

project.addSourceFilesAtPaths('src/**/*.tsx');
const sourceFiles = project.getSourceFiles();
let modifiedCount = 0;

sourceFiles.forEach((sourceFile) => {
  let fileModified = false;

  const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement);
  // Correção 1: JsxSelfClosingElement em vez de JsxSelfClosedElement
  const jsxSelfClosingElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);

  // Correção 2: Atualização do tipo aqui
  const processButton = (element: JsxElement | JsxSelfClosingElement) => {
    let tagName = '';
    if (element.getKind() === SyntaxKind.JsxElement) {
      tagName = (element as JsxElement).getOpeningElement().getTagNameNode().getText();
    } else {
      // Correção 3: Cast para o nome correto
      tagName = (element as JsxSelfClosingElement).getTagNameNode().getText();
    }

    if (tagName === 'button') {
      const attributes = element.getKind() === SyntaxKind.JsxElement
        ? (element as JsxElement).getOpeningElement().getAttributes()
        : (element as JsxSelfClosingElement).getAttributes();

      // Correção 4: Tipar o 'attr' como 'any' ou usar a tipagem correta do ts-morph
      const hasAriaLabel = attributes.some((attr: any) => 
        attr.getKind() === SyntaxKind.JsxAttribute && 
        attr.getNameNode().getText() === 'aria-label'
      );

      if (!hasAriaLabel) {
        let label = 'Ação';
        
        // Tentar inferir pelo texto interno do botão para ver se tem ícone
        const innerText = element.getText();
        if (innerText.includes('<X') || innerText.includes('LucideX') || innerText.includes('Close')) {
          label = 'Fechar';
        } else if (innerText.includes('<Plus') || innerText.includes('LucidePlus')) {
          label = 'Adicionar';
        } else if (innerText.includes('<Trash') || innerText.includes('<Delete')) {
          label = 'Excluir';
        } else if (innerText.includes('<Edit') || innerText.includes('<Pencil')) {
          label = 'Editar';
        } else if (innerText.includes('<Search')) {
          label = 'Pesquisar';
        } else if (innerText.includes('<Arrow') || innerText.includes('<Chevron')) {
          label = 'Navegar';
        }

        if (element.getKind() === SyntaxKind.JsxElement) {
          (element as JsxElement).getOpeningElement().addAttribute({
            name: 'aria-label',
            initializer: `"${label}"`
          });
        } else {
          (element as JsxSelfClosingElement).addAttribute({
            name: 'aria-label',
            initializer: `"${label}"`
          });
        }
        fileModified = true;
      }
    }
  };

  jsxElements.forEach(processButton);
  jsxSelfClosingElements.forEach(processButton);

  if (fileModified) {
    sourceFile.saveSync();
    modifiedCount++;
    console.log(`Updated: ${sourceFile.getFilePath()}`);
  }
});

console.log(`\nConcluído! ${modifiedCount} arquivos modificados com novos aria-labels.`);