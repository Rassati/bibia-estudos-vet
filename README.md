# Bibia Estudos · Medicina Veterinária

Site estático de estudo com 14 capítulos e 153 exercícios. Imunologia e hipersensibilidade alimentar vêm primeiro; vacinação fica por último.

## Usar

Abra `index.html` no navegador ou acesse o endereço do GitHub Pages. Não há dependências de instalação, chaves de API, cadastro nem servidor de aplicação.

- Leitura com tabelas, esquemas visuais e todas as respostas do guia original.
- Prática de até 10 exercícios e simulado de até 20 com nota de 0 a 10.
- Lacunas, associações e versões objetivas das perguntas discursivas.
- Revisão de erros, cartões e histórico salvo no navegador.
- Os dois guias em PDF estão incluídos.

## Correção e progresso

Cada exercício vale 1 ponto. Exercícios com vários itens recebem pontuação proporcional. A primeira resposta na sessão conta para a nota. O gabarito explicado aparece após a resposta na prática e ao terminar o simulado. Cartões são autoavaliação e não entram na nota.

O progresso usa `localStorage` e é restrito ao navegador/dispositivo. Não existe sincronização automática nem transmissão de notas para um servidor. É possível exportar uma cópia em JSON.

## Publicação

Em **Settings → Pages**, escolher **Deploy from a branch**, ramo **main**, pasta **/(root)**. O arquivo `.nojekyll` mantém a publicação dos arquivos estáticos sem processamento adicional.

## Arquivos

- `content.js`: capítulos, perguntas, explicações e alternativas revisadas.
- `core.js`: normalização, correção, seleção equilibrada e pontuação.
- `app.js`: interface, navegação e persistência.
- `styles.css`: layout acessível e responsivo.
- `guia-exercicios.pdf` e `guia-com-respostas.pdf`: material de consulta.

## Fonte

Texto e estudo dirigido fornecidos pelo usuário, com esclarecimentos nas [diretrizes WSAVA de vacinação de cães e gatos, 2024](https://wsava.org/wp-content/uploads/2024/04/WSAVA-Vaccination-guidelines-2024.pdf). A finalidade é revisão acadêmica. As questões discursivas originais são preservadas na leitura e adaptadas em perguntas objetivas para correção automática.
