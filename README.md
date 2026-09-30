# Base de Conhecimento: Desenvolvimento de Extensões para Owlbear Rodeo 2.0

Esta pasta contém a documentação técnica oficial, detalhada e estruturada para capacitar desenvolvedores humanos e **treinar/contextualizar Modelos de Inteligência Artificial** na criação de extensões para o **Owlbear Rodeo 2.0**.

---

## 📚 Índice da Documentação

1. **[01. Arquitetura e Manifest](docs/01_ARCHITECTURE_AND_MANIFEST.md)**
   - Modelo de execução em iframes sandboxed.
   - Handshake de inicialização via parâmetro `?obrref=...`.
   - Especificação e esquema completo do `manifest.json`.
   - Diferença entre extensões de navegador e extensões do Owlbear.

2. **[02. Referência Completa da API do SDK](docs/02_SDK_API_REFERENCE.md)**
   - Assinaturas de métodos, tipos e listeners de todos os módulos de `OBR`:
     - `OBR.action`, `OBR.contextMenu`, `OBR.tool`, `OBR.popover`, `OBR.modal`.
     - `OBR.scene.items`, `OBR.scene.local`, `OBR.scene.grid`, `OBR.scene.fog`.
     - `OBR.room`, `OBR.player`, `OBR.party`, `OBR.broadcast`.
     - `OBR.notification`, `OBR.theme`, `OBR.viewport`.

3. **[03. Sistema de Itens e Builders](docs/03_ITEMS_AND_BUILDERS.md)**
   - Estrutura de dados de um `Item`.
   - Camadas (`Layer`): `CHARACTER`, `ATTACHMENT`, `MAP`, `PROP`, etc.
   - Sistema de Anexos (`attachedTo` e `disableHit: true` para anéis e auras).
   - Construtores fluentes (`buildShape`, `buildText`, `buildImage`, `buildLine`).
   - Type guards (`isImage`, `isShape`, etc.).

4. **[04. Padrões de Projeto e Receitas Práticas](docs/04_PATTERNS_AND_RECIPES.md)**
   - Receita 1: Action Popover com sincronização em tempo real (Rastreador de HP/Iniciativa).
   - Receita 2: Script de Fundo + Menu de Contexto Embutido (Estilo Colored Rings).
   - Receita 3: Ferramenta Customizada com Arrastar de Mouse (Área de Efeito / Magias).
   - Receita 4: Comunicação em Tempo Real com `OBR.broadcast`.
   - Receita 5: Padrão de Namespaces para Metadados (Reverse Domain).

5. **[05. Setup, Boilerplate e Publicação](docs/05_SETUP_AND_BOILERPLATE.md)**
   - Estrutura de arquivos do projeto.
   - Configurações do Vite para Multi-Page Apps (`index.html` + `background.html`).
   - Passo a passo de testes locais com Hot Module Replacement (`http://localhost:5173`).
   - Deploy gratuito em Vercel, Netlify e GitHub Pages.
   - Tabela de diagnóstico de erros comuns.

6. **[Prompt de Sistema para I.A (LLM System Prompt)](docs/LLM_SYSTEM_PROMPT.md)**
   - Documento de alta densidade pronto para ser copiado e colado nas instruções personalizadas, system prompt ou base RAG de qualquer IA para programar extensões do Owlbear Rodeo sem alucinações.
