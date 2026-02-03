README — Testes remotos: Navegação móvel e Notificações

Objetivo
- Verificar por que `#mobile-nav` não aparece em dispositivos móveis e validar o fluxo de notificações (work-timer / bills).

Pré-requisitos
- Dispositivo Android (recomendado) com USB debugging ativado, ou iPhone com Safari Web Inspector.
- Computador com Chrome instalado.
- Servidor local rodando a partir da raiz do projeto (veja comandos abaixo).

Instruções rápidas — servidor local
1) Rodar servidor de desenvolvimento (inline server já disponível):
```bash
cd "c:\Users\Carlos Eduardo\agora vai"
node tests/run_checks_with_inline_server.js
```
ou (alternativa simples):
```bash
npx serve . -l 5500
# ou
python -m http.server 5500
```
Acesse http://127.0.0.1:5500 no telefone (mesma rede) ou utilize USB remote debugging.

Testes no Android (Chrome remote debugging)
1) Ative `Developer options` e `USB debugging` no Android.
2) Conecte o telefone via USB e permita a depuração.
3) No desktop Chrome: abra `chrome://inspect/#devices` e localize a página do seu servidor.
4) Clique em `inspect` na aba correspondente para abrir DevTools remoto.

Verificações a fazer no painel Console / Elements
- DOM:
  - Execute: `document.getElementById('mobile-nav')` — deve retornar o elemento (não `null`).
  - Execute: `document.body.classList.contains('logged-in')` — deve ser `true` após login.
  - Execute: `getComputedStyle(document.getElementById('mobile-nav')).display` — deve ser `"flex"` (ou distinto de "none").
  - Se `document.getElementById('mobile-nav')` for `null`, verifique se o HTML enviado inclui o `<nav id="mobile-nav">` (inspecione `index.html`).

- Estado e logs:
  - No Console, procure por logs: `setMobileNavVisible(true)` (o código adiciona poucos logs, insira um `console.log` se precisar mais visibilidade).
  - Verifique `window.__mobileNavPending` (pode estar `true` se setMobileNavVisible foi chamado antes do DOM).

Ações para forçar teste manual
- Após abrir DevTools remoto, simule login executando (no Console):
```js
// simula sessão restaurada
setMobileNavVisible(true);
// ou ligar estado
document.body.classList.add('logged-in');
// forçar estilo
const nav = document.getElementById('mobile-nav'); if(nav){ nav.style.display='flex'; }
```
- Se isso mostrar a barra, o problema era ordem de carregamento / CSS com !important.

Testes de Notificações (Work Timer)
- Permissão:
```js
Notification.requestPermission().then(p => console.log('perm:', p));
```
- Iniciar cronômetro (se `WorkTimer` estiver exposto):
```js
window.WorkTimer && window.WorkTimer.start && window.WorkTimer.start();
```
- Verifique se notificações com `tag: 'work-timer'` aparecem. Para acionar ações (Pausar / Pagar), clique na notificação e observe se o SW envia mensagens ao cliente (Console deve mostrar mensagens entrantes).

Inspeção de mensagens do Service Worker
- No DevTools -> Application -> Service Workers: verifique que o `sw.js` está registrado e ativo.
- Em Console, adicione listener temporário para mensagens do SW:
```js
navigator.serviceWorker.addEventListener('message', e => console.log('SW ->', e.data));
```
- Depois clique nas ações da notificação e veja o Console para mensagens `WORK_TIMER_ACTION` ou `OPEN_URL`.

Coletar evidências
- Se ainda não aparecer, capture:
  - Screenshot do DOM mostrando se o `<nav id="mobile-nav">` existe e seus estilos computados.
  - Print do Console com `document.body.classList` e `getComputedStyle(nav).display`.
  - Logs do painel `Application -> Service Workers`.

O que eu posso ajustar remotamente se você me enviar os prints
- Se o elemento existir mas estiver com `display:none`, eu posso remover regras conflitantes no CSS ou adicionar um estilo mais específico.
- Se o elemento não existir, posso inspecionar o build/templating que gera `index.html` e garantir a inclusão.
- Se `window.__mobileNavPending` for `true`, posso ajustar o timing de inicialização (já há handler DOMContentLoaded, posso fortalecer).

Se quiser, eu gero comandos de `console.log` temporários para inserir em `app.js` (ex: logar quando `setMobileNavVisible` for chamado) e faço um novo deploy rápido. Deseja que eu adicione logs temporários agora?
