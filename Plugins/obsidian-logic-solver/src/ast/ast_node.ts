import { getPrecedence, toLatexString, TokenType } from "src/ast/token";

export class AstBase {
    type: TokenType;

    constructor(type: TokenType) {
        this.type = type;
    }

    getPrecedence(): number {
        return getPrecedence(this.type);
    }

    toString(): string {
        return "";
    }

    eval(): number {
        return 0;
    }
}

export class Identifer extends AstBase {
    name: string;
    value: number;

    constructor(name: string) {
        super(TokenType.T_VAR);
        this.name = name;
        this.value = 0;
    }

    setValue(value: number): void {
        this.value = value;
    }

    toString(): string {
        return this.name;
    }

    eval(): number {
        return this.value;
    }
}

export class BinaryOperation extends AstBase {
    lhs: AstNode;
    rhs: AstNode;

    constructor(type: TokenType, lhs: AstNode, rhs: AstNode) {
        super(type);
        this.lhs = lhs;
        this.rhs = rhs;
    }

    toString(): string {
        if (this.lhs && this.rhs) {
            const op: string = toLatexString(this.type);
            let lhs: string = this.lhs.toString();
            let rhs: string = this.rhs.toString();

            if (!(this.lhs instanceof Identifer) && this.lhs.getPrecedence() < getPrecedence(this.type)) {
                lhs = `(${lhs})`;
            }
            if (!(this.rhs instanceof Identifer) && getPrecedence(this.type) > this.rhs.getPrecedence()) {
                rhs = `(${rhs})`;
            }
            return `${lhs} ${op} ${rhs}`;
        }
        return "";
    }

    eval(): number {
        if (this.lhs && this.rhs) {
            switch (this.type) {
                case TokenType.L_CON: {
                    return this.lhs.eval() & this.rhs.eval();
                }
                case TokenType.L_DIS: {
                    return this.lhs.eval() | this.rhs.eval();
                }
                case TokenType.L_XOR: {
                    return this.lhs.eval() ^ this.rhs.eval();
                }
                case TokenType.L_IMP: {
                    return this.lhs.eval() <= this.rhs.eval() ? 1 : 0;
                }
                case TokenType.L_BIC: {
                    return this.lhs.eval() == this.rhs.eval() ? 1 : 0;
                }
            }
        }
        return 0;
    }
}

export class UnaryOperation extends AstBase {
    operand: AstNode;

    constructor(type: TokenType, operand: AstNode) {
        super(type);
        this.operand = operand;
    }

    toString(): string {
        if (this.operand) {
            const op: string = toLatexString(this.type);
            let operand: string = this.operand.toString();

            if (!(this.operand instanceof Identifer) && this.operand.getPrecedence() <= getPrecedence(this.type)) {
                operand = `(${operand})`;
            }
            return `${op} ${operand}`;
        }
        return "";
    }

    eval(): number {
        if (this.operand && this.type == TokenType.L_NEG) {
            return this.operand.eval() == 0 ? 1 : 0;
        }
        return 0;
    }
}

export type AstNode = AstBase | null;
