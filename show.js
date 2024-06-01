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

  tanh() {
    const out = Math.tanh(this.data);
    return new Value(out, "Tanh", [this], "tanh");
  }

  sigmoid() {
    const out = 1 / (1 + Math.exp(-this.data));
    return new Value(out, "Sigmoid", "σ");
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
      if (right.includes("relu") || right.includes("tanh")) {
        console.log(right);
        this.handleFunction(left, right);
      } else {
        this.handleOperation(left, right);
      }
    });
  }

  handleFunction(left, right) {
    const match = right.match(/(\w+)\(([^)]*)\)/);
    const [, func, operand] = match;
    const args = operand ? operand.split(",").map((arg) => arg.trim()) : [];
    const value = this.getValue(
      args[0] || right.split("(")[1].split(")")[0].trim(),
      args[0],
    );
    console.log("Left : ", left, "Right : ", right);
    console.log("func : ", func, "operand : ", operand);
    const result = value[func](...args.slice(1));
    result.label = left;
    result.op = func;
    this.variables[left] = result;
    // create new value
    // set it data the function n.tanh(); without an argument!
  }

  handleOperation(left, right) {
    const match = right.match(/(.+?)\s*([\+\-\*\/\^])\s*(.+)/);
    if (match) {
      // if (this.variables[operand1] || this.variables[operand2]) {
      // }
      const [, operand1, operator, operand2] = match;
      const value1 = this.getValue(operand1.trim(), this.variables[operand1]);
      const value2 = this.getValue(operand2.trim(), this.variables[operand2]);

      const methodMap = {
        "+": "add",
        "-": "sub",
        "*": "mult",
        "/": "div",
        "^": "pow",
      };
      const method = methodMap[operator];
      // make new Value class for the operator 1,2
      const result = value1[method](value2);
      result.label = left;
      this.variables[left] = result;
    } else {
      const value = this.getValue(right, left);
      this.variables[left] = value;
    }
  }

  getValue(operand1, operand2) {
    if (this.variables[operand1]) {
      return this.variables[operand1];
    } else if (!isNaN(operand1)) {
      return new Value(parseFloat(operand1), operand2);
    } else {
      throw new Error(`Undefined variable: ${operand1}`);
    }
  }

  generateCode() {
    let result = "";
    for (const [key, value] of Object.entries(this.variables)) {
      if (value.childs.length > 0) {
        const method =
          value.op === "relu" || value.op === "tanh"
            ? value.op
            : {
                "+": "add",
                "-": "sub",
                "*": "mult",
                "/": "div",
                "^": "pow",
              }[value.op];
        if (value.op === "relu" || value.op === "tanh") {
          const args =
            method === "leaky_relu" && value.childs.length > 1
              ? `, ${value.childs[1].label || value.childs[1].data}`
              : "";
          result += `${key} = ${value.childs[0].label}.${method}(${args});\n`;
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

const code = `
x = 1;
y = relu(x);
`;

// const code = `
// x = 1;
// y = 2;
// z = x + y;
// w = z + 1;
// r = relu(w);
// `;

// v = w * 4;
// u = v / 2;
// t = u ^ 2;
// r = relu(x);
// m = 4 + t;

const parser = new OperationParser(code);
parser.parse();
console.log(parser.generateCode());
