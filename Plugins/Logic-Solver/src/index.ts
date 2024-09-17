import {getPrecedence, Token, tokenize, TokenType} from "./token";
import {AstNode, BinaryOperation, Identifer, UnaryOperation} from "./ast_node";


// parse_expression_rhs(lhs, min_precedence = 0)
//     lookahead := peek next token
//     while lookahead is a binary operator with precedence >= min_precedence
//         op := lookahead
//         advance to next token
//         rhs := parse_primary()
//         lookahead := peek next token
//         while lookahead is a binary operator whose precedence is greater than op's, or a right-associative operator whose precedence is equal to op's
//             rhs := parse_expression_rhs(rhs, lookahead's precedence)
//             lookahead := peek next token
//         lhs := apply op to lhs and rhs
//     return lhs


class Parser
{
    tokens: Token[] = [];
    current: number = 0;

    constructor(tokens: Token[], current: number = 0)
    {
        this.tokens = tokens;
        this.current = current;
    }

    parse(): AstNode
    {
        return this.parseExprRhs(this.parsePrimary(), 0);
    }

    parsePrimary(): AstNode
    {
        let lookahead: Token = this.tokens[this.current];

        switch (lookahead.type)
        {
            case TokenType.T_VAR:
            {
                this.current++;
                return new Identifer(lookahead.literal);
            }
            case TokenType.G_LPAR:
            {
                this.current++;
                let expr: AstNode = this.parse();

                if (this.tokens[this.current].type != TokenType.G_RPAR)
                {
                    return null;
                }
                this.current++;

                return expr;
            }
            case TokenType.L_NEG:
            {
                this.current++;

                let operand: AstNode = this.parseExprRhs(this.parsePrimary(), lookahead.getPrecedence());

                if (operand == null)
                {
                    return null;
                }
                return new UnaryOperation(lookahead.type, operand);
            }
            default:
            {
                return null;
            }
        }
    }

    parseExprRhs(lhs: AstNode, minPrecedence: number): AstNode
    {
        let lookahead: Token = this.tokens[this.current];

        while (this.current < this.tokens.length && lookahead.isBinaryOp() && lookahead.getPrecedence() >= minPrecedence)
        {
            let op: TokenType = lookahead.type;

            this.current++;
            let rhs: AstNode = this.parsePrimary();

            if (rhs == null)
            {
                return null;
            }
            lookahead = this.tokens[this.current];

            while (this.current < this.tokens.length && lookahead.isBinaryOp() && (lookahead.getPrecedence() > getPrecedence(op) || lookahead.isRightAssociative() && lookahead.getPrecedence() == getPrecedence(op)))
            {
                rhs = this.parseExprRhs(rhs, lookahead.getPrecedence());
                this.current++;
                lookahead = this.tokens[this.current];
            }
            lhs = new BinaryOperation(op, lhs, rhs);
        }
        return lhs;
    }
}


const my_expression = "    (\\neg p \\land (q \\to r)) \\to \\neg z    ";

// console.log(tokenize(my_expression));

let t = tokenize(my_expression);
let p = new Parser(t, 0);


console.log(p.parse());

// console.log(p.parse());