# Development

Clone plugin from repository. Install dependencies and compile the source code.

> The following command keeps running in the terminal and rebuilds the plugin when you modify the source code.

```bash
npm install
npm run dev
```

# Usage

### Commands

| Command              | Output                                                      |
| -------------------- | ----------------------------------------------------------- |
| Generate Truth Table | Insert truth table at cursor position from latex expression |
| Copy Truth Table     | Copy truth table to clipboard from selected text            |

### Supported Latex Tokens

| Token           | Token Type     |
| --------------- | -------------- |
| \neg            | Negation       |
| \not            | Negation       |
| \land           | Conjunction    |
| \wedge          | Conjunction    |
| \lor            | Disjunction    |
| \vee            | Disjunction    |
| \oplus          | Exclusive Or   |
| \implies        | Conditional    |
| \to             | Conditional    |
| \rightarrow     | Conditional    |
| \leftrightarrow | Bi-Conditional |
