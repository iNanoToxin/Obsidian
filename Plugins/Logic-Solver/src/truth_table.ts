import {AstNode, BinaryOperation, UnaryOperation} from "./ast_node";
import {Parser} from "./parser";

type TruthValue = { [key: string]: number }
type TruthTable = { [key: string]: number[] }

function getSubExpressions(node: AstNode): TruthValue
{
    let results: TruthValue = {};

    function dfs(node: AstNode): void
    {
        if (node == null) return;

        if (node instanceof UnaryOperation)
        {
            dfs(node.operand);
        }
        else if (node instanceof BinaryOperation)
        {
            dfs(node.lhs);
            dfs(node.rhs);
        }
        results[node.toString()] = node.eval();
    }

    dfs(node);
    return results;
}

function formatTruthTable(truthTable: TruthTable): string
{
    // Sort expressions by their length, from shortest to longest
    let keys = Object.keys(truthTable).sort((a: string, b: string) => a.length - b.length);

    // Map truth values (T/F) for each expression in the truth table
    let values = keys.map((expr: string) => Object.values(truthTable[expr]).map(value => {
        // return value ? "T" : "F";
        return value ? "<span style=\"color:rgb(60,181,53)\">T</span>" : "<span style=\"color:rgb(212,70,34)\">F</span>";
    }));

    // Calculate column padding: ensures at least 3 characters, accounts for LaTeX formatting ($$), and longest truth value
    let padding = keys.map((str: string, idx: number) => Math.max(3, str.length + 2, Math.max(...values[idx].map(s => s.length))));

    let markdown: string = ""

    // Generate the header row with LaTeX-wrapped expressions and apply padding
    markdown += `| ${keys.map((expr, index) => `$${expr}$`.padEnd(padding[index], " ")).join(" | ")} |\n`

    // Generate the separator row using dashes to match the column width
    markdown += `| ${padding.map((value) => "-".repeat(value)).join(" | ")} |\n`

    // Append each row of truth values, applying the corresponding padding
    for (let i = 0; i < values[0].length; i++)
    {
        markdown += `| ${values.map((table, index) => table[i].padEnd(padding[index], " ")).join(" | ")} |\n`
    }
    return markdown;
}

export function generateTruthTable(expression: string): string | null
{
    let truthTable: TruthTable = {};
    let parser = new Parser();

    let node = parser.parse(expression);
    if (node == null)
    {
        return null;
    }

    let n = Object.keys(parser.variables).length;
    let r = Math.pow(2, n);

    for (let i = 0; i < r; i++)
    {
        let j = n - 1;
        Object.values(parser.variables).forEach(variable => {
            variable.setValue(i >> j-- & 1 ^ 1);
        })
        Object.entries(getSubExpressions(node)).forEach(([expr, value]) => {
            truthTable[expr] ??= [];
            truthTable[expr].push(value);
        })
    }
    return formatTruthTable(truthTable);
}
