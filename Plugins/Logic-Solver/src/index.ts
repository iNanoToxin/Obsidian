import {Parser} from "./parser";
import {AstNode, BinaryOperation, Identifer, UnaryOperation} from "./ast_node";
import {Token} from "./token";


const my_expression = "    (\\neg p \\land (q \\to r)) \\to \\neg z    ";
// const my_expression = "p \\to q";

let p = new Parser();
let a = p.parse(my_expression);


console.log(a);
console.log(a?.toString());


function printSubExpr(node: AstNode)
{
    if (!node)
    {
        return null;
    }

    if (node instanceof Identifer)
    {
        // console.log(node.toString());
    }
    else if (node instanceof UnaryOperation)
    {
        printSubExpr(node.operand);
        console.log(node.eval(), node.toString());
    }
    else if (node instanceof BinaryOperation)
    {
        printSubExpr(node.lhs);
        printSubExpr(node.rhs);
        console.log(node.eval(), node.toString());
    }
}


let n = Object.keys(p.variables).length;
let r = Math.pow(2, n);

for (let i = 0; i < r; i++)
{
    let s = "";
    let j = n - 1;
    for (const [key, variable] of Object.entries(p.variables))
    {
        variable.setValue(i >> j & 1 ^ 1);
        s += `${key}:${i >> j & 1 ^ 1} `;
        j--;
    }
    // console.log(s, a?.eval());
    printSubExpr(a);
    console.log();
    console.log();
    console.log();
}
