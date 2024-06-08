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

  div(other) {
    if (other instanceof Value) {
      return new Value(this.data / other.data, "", [this, other], "/");
    } else {
      return new Value(this.data / other, "", [this, new Value(other)], "/");
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
    return new Value(out, "relu", [this], "relu");
  }

  tanh() {
    const out = Math.tanh(this.data);
    return new Value(out, "tanh", [this], "tanh");
  }

  sigmoid() {
    const out = 1 / (1 + Math.exp(-this.data));
    return new Value(out, "sigmoid", [this], "sigmoid");
  }
}

// change this code to make it work easily

var operations_code = [];

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
      if (right.includes(".")) {
        this.handleFunction(left, right);
      } else {
        this.handleAssignment(left, right);
      }
    });
  }

  handleFunction(left, right) {
    const match = right.match(/(\w+)\.(\w+)\(([^)]*)\)/);
    if (match) {
      const [, variable, func] = match;
      const value = this.getValue(variable.trim());
      const result = value[func]();
      result.label = left;
      this.variables[left] = result;
      console.log("function are : ", result);
    } else {
      throw new Error(`Invalid function syntax: ${right}`);
    }
  }

  handleAssignment(left, right) {
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
      operations_code.push(result);
    } else {
      const value = this.getValue(right);
      value.label = left;
      this.variables[left] = value;
      operations_code.push(value);
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
        const method = {
          "+": "add",
          "-": "sub",
          "*": "mult",
          "/": "div",
          "^": "pow",
        }[value.op];

        if (
          value.op === "relu" ||
          value.op === "sigmoid" ||
          value.op === "tanh"
        ) {
          result += `${key} = ${value.childs[0].label}.${value.op}();\n`;
        } else {
          result += `${key} = ${value.childs[0].label}.${method}(${value.childs[1].label});\n`;
        }
      } else {
        result += `${key} = new Value(${value.data});\n`;
      }
    }
    return result;
  }
}

// Example usage
const code = `
x = 1;
w = 2;
y = x.relu();
z = x + w;
`;

const parser = new OperationParser(code);
parser.parse();

console.log(operations_code);
