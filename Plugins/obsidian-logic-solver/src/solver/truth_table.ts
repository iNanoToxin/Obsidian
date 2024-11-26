import { App, Editor, Notice } from "obsidian";
import { AstNode, BinaryOperation, UnaryOperation } from "src/ast/ast_node";
import { Parser } from "src/ast/parser";
import { LogicSolverModal } from "src/ui/menu";

type TruthValue = { [key: string]: number };
type TruthTable = { [key: string]: number[] };

function sortByLength(keys: string[]): string[] {
    return keys.sort((a: string, b: string) => {
        return a.length == b.length ? a.localeCompare(b) : a.length - b.length;
    });
}

function getSubExpressions(node: AstNode): TruthValue {
    const results: TruthValue = {};

    function dfs(node: AstNode): void {
        if (node == null) return;

        if (node instanceof UnaryOperation) {
            dfs(node.operand);
        } else if (node instanceof BinaryOperation) {
            dfs(node.lhs);
            dfs(node.rhs);
        }
        results[node.toString()] = node.eval();
    }

    dfs(node);
    return results;
}

function formatTruthTable(truthTable: TruthTable): string {
    // Sort expressions by their length, from shortest to longest
    const keys = sortByLength(Object.keys(truthTable));

    // Map truth values (T/F) for each expression in the truth table
    const values = keys.map((expr: string) =>
        Object.values(truthTable[expr]).map((value) => {
            // return value ? "T" : "F";
            return value
                ? '<span class="latex-true-value">$T$</span>'
                : '<span class="latex-false-value">$F$</span>';
        })
    );

    // Calculate column padding: ensures at least 3 characters, accounts for LaTeX formatting ($$), and longest truth value
    const padding = keys.map((str: string, idx: number) =>
        Math.max(3, str.length + 2, Math.max(...values[idx].map((s) => s.length)))
    );

    let markdown = "";

    // Generate the header row with LaTeX-wrapped expressions and apply padding
    markdown += `| ${keys.map((expr, index) => `$${expr}$`.padEnd(padding[index], " ")).join(" | ")} |\n`;

    // Generate the separator row using dashes to match the column width
    markdown += `| ${padding.map((value) => "-".repeat(value)).join(" | ")} |\n`;

    // Append each row of truth values, applying the corresponding padding
    for (let i = 0; i < values[0].length; i++) {
        markdown += `| ${values.map((table, index) => table[i].padEnd(padding[index], " ")).join(" | ")} |\n`;
    }
    return markdown;
}

function generateTruthTable(expression: string): string | null {
    const truthTable: TruthTable = {};
    const parser = new Parser();

    expression = expression.trim();
    if (expression.startsWith("$") && expression.endsWith("$")) {
        expression = expression.substring(1, expression.length - 1);
    }

    const node = parser.parse(expression);
    if (node == null) {
        return null;
    }

    const n = Object.keys(parser.variables).length;
    const r = Math.pow(2, n);

    // Generate truth table values ith row
    for (let i = 0; i < r; i++) {
        let j = n - 1;
        sortByLength(Object.keys(parser.variables)).forEach((key) => {
            parser.variables[key].setValue(((i >> j--) & 1) ^ 1);
        });
        Object.entries(getSubExpressions(node)).forEach(([expr, value]) => {
            truthTable[expr] ??= [];
            truthTable[expr].push(value);
        });
    }
    return formatTruthTable(truthTable);
}

export function getTruthTable(app: App) {
    const editor: Editor | undefined = app.workspace.activeEditor?.editor;

    if (editor) {
        new LogicSolverModal(app, (input: string) => {
            const truthTable = generateTruthTable(input);

            if (truthTable) {
                editor.replaceSelection(truthTable);
            } else {
                new Notice("Error parsing latex equation.");
            }
        }).open();
    }
}

export function copyTruthTable(app: App) {
    const editor: Editor | undefined = app.workspace.activeEditor?.editor;
    const selection: string | undefined = editor?.getSelection();

    if (selection) {
        const truthTable = generateTruthTable(selection);

        if (truthTable) {
            navigator.clipboard
                .writeText(truthTable)
                .then(() => {
                    new Notice("Text copied to clipboard!");
                })
                .catch((err) => {
                    new Notice("Failed to copy text to clipboard");
                    console.error("Could not copy text: ", err);
                });
        } else {
            new Notice("Error parsing latex equation.");
        }
    }
}
