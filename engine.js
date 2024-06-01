class Value {
  constructor(data, _label = "", _children = [], _op = "") {
    this.data = data;
    this.label = _label;
    this.op = _op;
    this.childs = _children;
    this.prev = new Set(_children);
    this.grad = 0.0;
  }

  valueOf() {
    return this.data;
  }

  add(other) {
    if (other instanceof Value) {
      return new Value(this.data + other.data, "", [this, other], "+");
    } else {
      return new Value(this.data + other, "", [this, new Value(other)], "+");
    }
  }

  sub(other) {
    if (other instanceof Value) {
      return new Value(this.data - other.data, "", [this, other], "-");
    } else {
      return new Value(this.data - other, "", [this, new Value(other)], "-");
    }
  }

  mult(other) {
    if (other instanceof Value) {
      return new Value(this.data * other.data, "", [this, other], "*");
    } else {
      return new Value(this.data * other, "", [this, new Value(other)], "*");
    }
  }

  pow(other) {
    if (other instanceof Value) {
      return new Value(Math.pow(this.data, other.data), "", [this, other], "^");
    } else {
      return new Value(
        Math.pow(this.data, other),
        "",
        [this, new Value(other)],
        "^",
      );
    }
  }

  relu() {
    const out = this.data < 0 ? 0 : this.data;
    return new Value(out, "ReLU", "σ");
  }
}

class OperationParser {
  constructor(code) {
    this.code = code;
    this.variables = {};
  }

  parse() {
    const lines = this.code
      .split(";")
      .map((line) => line.trim())
      .filter((line) => line);

    lines.forEach((line) => {
      let [left, right] = line.split("=").map((part) => part.trim());
      if (right.includes("relu")) {
        this.handleFunction(left, right);
      } else {
        this.handleOperation(left, right);
      }
    });
  }

  handleFunction(left, right) {
    const match = right.match(/(\w+)\((.+)\)/);
    const [, func, operand] = match;
    const value = this.getValue(operand.trim());
    const result = value[func]();
    result.label = left;
    this.variables[left] = result;
  }

  handleOperation(left, right) {
    const match = right.match(/(.+?)\s*([\+\-\*\/\^])\s*(.+)/);
    if (match) {
      const [, operand1, operator, operand2] = match;
      const value1 = this.getValue(operand1.trim());
      const value2 = this.getValue(operand2.trim());
      const methodMap = {
        "+": "add",
        "-": "sub",
        "*": "mult",
        "/": "div",
        "^": "pow",
      };
      const method = methodMap[operator];
      const result = value1[method](value2);
      result.label = left;
      this.variables[left] = result;
    } else {
      const value = this.getValue(right);
      this.variables[left] = value;
    }
  }

  getValue(operand) {
    if (this.variables[operand]) {
      return this.variables[operand];
    } else if (!isNaN(parseFloat(operand))) {
      return new Value(parseFloat(operand), operand);
    } else {
      throw new Error(`Undefined variable: ${operand}`);
    }
  }

  generateCode() {
    let result = "";
    for (const [key, value] of Object.entries(this.variables)) {
      if (value.childs.length > 0) {
        const method =
          value.op === "relu"
            ? "relu"
            : {
                "+": "add",
                "-": "sub",
                "*": "mult",
                "/": "div",
                "^": "pow",
              }[value.op];
        if (value.op === "relu") {
          result += `${key} = ${value.childs[0].label || value.childs[0].data}.${method}();\n`;
        } else {
          result += `${key} = ${value.childs[0].label || value.childs[0].data}.${method}(${value.childs[1].label || value.childs[1].data});\n`;
        }
      } else {
        result += `${key} = new Value('${value.data}');\n`;
      }
    }
    return result;
  }
}

// Example usage
const code = `
x = 1;
y = 2;
z = x + y;
w = z - 3;
v = w * 4;
u = v / 2;
t = u ^ 2;
r = relu(x);
m = 4 + t;
`;

const parser = new OperationParser(code);
parser.parse();
console.log(parser.generateCode());
