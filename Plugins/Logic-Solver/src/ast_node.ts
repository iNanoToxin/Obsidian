import {getPrecedence, TokenType} from "./token";

export class AstNodeBase
{
    type: TokenType;

    constructor(type: TokenType)
    {
        this.type = type;
    }
}

export class Identifer extends AstNodeBase
{
    name: string;

    constructor(name: string)
    {
        super(TokenType.T_VAR);
        this.name = name;
    }
}

export class BinaryOperation extends AstNodeBase
{
    lhs: AstNode;
    rhs: AstNode;

    constructor(type: TokenType, lhs: AstNode, rhs: AstNode)
    {
        super(type);
        this.lhs = lhs;
        this.rhs = rhs;
    }

    getPrecedence(): number
    {
        return getPrecedence(this.type);
    }
}

export class UnaryOperation extends AstNodeBase
{
    operand: AstNode;

    constructor(type: TokenType, operand: AstNode)
    {
        super(type);
        this.operand = operand;
    }

    getPrecedence(): number
    {
        return getPrecedence(this.type);
    }
}

export type AstNode = AstNodeBase | null;