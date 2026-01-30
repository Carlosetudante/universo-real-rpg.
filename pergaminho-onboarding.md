# Pergaminho: Cadastro e Memória do Usuário

## Objetivo
Evitar confusão entre campos de perfil (nome, trabalho, cargo etc).

## Regras de Ouro
- Sempre associe cada resposta ao campo correto.
- Nunca salve local de trabalho no campo de nome.
- Antes de salvar uma resposta, confirme qual campo está ativo (ex: "estou esperando user.name").
- Se a resposta não combinar com a pergunta, pergunte novamente antes de salvar.
- Nunca sobrescreva um campo preenchido sem pedir confirmação.

## Campos
- user.name = Nome da pessoa
- user.workplace = Empresa/Local de trabalho
- user.role = Cargo/atividade
- user.city = Cidade
- relationship.partner = Parceiro(a)

## Fluxo de Perguntas
1) "Qual é o seu nome?" -> salvar em user.name
2) "Onde você trabalha?" -> salvar em user.workplace
3) "Qual seu cargo?" -> salvar em user.role

## Exemplo certo
Pergunta: Qual é o seu nome?
Resposta: Carlos
Salvar: user.name = Carlos

Pergunta: Onde você trabalha?
Resposta: Mercado Silva
Salvar: user.workplace = Mercado Silva

## Exemplo de erro e correção
Pergunta: Qual é o seu nome?
Resposta: Trabalho no Mercado Silva
Ação: Perguntar confirmação:
"Isso é seu nome ou seu local de trabalho?"
Somente depois salvar no campo correto.