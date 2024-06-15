class Value {
  constructor(data, _label = "", _children = [], _op = "") {
    this.data = data;
    this.label = _label;
    this.op = _op;
    this.childs = _children;
    this.prev = new Set(_children);
    this.grad = 0.0;
    this._backward = () => {};
  }

  valueOf() {
    return this.data;
  }

  add(other) {
    var out;
    if (other instanceof Value) {
      out = new Value(this.data + other.data, "", [this, other], "+");
    } else {
      out = new Value(this.data + other, "", [this, new Value(other)], "+");
    }
    out._backward = () => {
      this.grad += out.grad;
      other.grad += out.grad;
    };
    return out;
  }

  sub(other) {
    if (other instanceof Value) {
      return new Value(this.data - other.data, "", [this, other], "-");
    } else {
      return new Value(this.data - other, "", [this, new Value(other)], "-");
    }
  }

  mult(other) {
    var out;
    if (other instanceof Value) {
      out = new Value(this.data * other.data, "", [this, other], "*");
    } else {
      out = new Value(this.data * other, "", [this, new Value(other)], "*");
    }
    out._backward = () => {
      this.grad += other.data * out.grad;
      other.grad += this.data * out.grad;
    };
    return out;
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

  backward() {
    const topo = [];
    const visited = new Set();
    const buildTopo = (v) => {
      if (!visited.has(v)) {
        visited.add(v);
        v.prev.forEach((child) => buildTopo(child));
        topo.push(v);
      }
    };
    buildTopo(this);
    this.grad = 1;
    for (let i = topo.length - 1; i >= 0; i--) {
      topo[i]._backward();
    }
  }
}
