const fs = require("fs");
const path = "./src/hooks/useTreinamentosUsuario.ts";
let content = fs.readFileSync(path, "utf8");

const badPush = `                    realizados.push({
                        id: \`pending-\${req.id}\`,
                        nome: req.nome,
                        dataRealizacao: '',
                        userId,
                        status: 'PENDENTE',
                        isObrigatorio: true,
                        diasAntecedenciaAlerta: req.diasAntecedenciaAlerta
                    } as unknown as typeof realizados[0]);`;

const goodPush = `                    realizados.push({
                        id: \`pending-\${req.id}\`,
                        nome: req.nome,
                        dataRealizacao: '',
                        userId,
                        status: 'PENDENTE',
                        isObrigatorio: true,
                        diasAntecedenciaAlerta: req.diasAntecedenciaAlerta,
                        dataVencimento: null,
                        descricao: null,
                        comprovanteUrl: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    } as typeof realizados[0]); // cast only if necessary, or just rely on TS`;

content = content.replace(badPush, goodPush);

fs.writeFileSync(path, content, "utf8");
console.log("Fixed Treinamentos");
