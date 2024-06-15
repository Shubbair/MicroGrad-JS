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

  // sub(other) {
  //   if (other instanceof Value) {
  //     return new Value(this.data - other.data, "", [this, other], "-");
  //   } else {
  //     return new Value(this.data - other, "", [this, new Value(other)], "-");
  //   }
  // }

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
    var out;
    if (other instanceof Value) {
      out = new Value(Math.pow(this.data, other.data), "", [this, other], "^");
    } else {
      out = new Value(
        Math.pow(this.data, other),
        "",
        [this, new Value(other)],
        "^",
      );
    }
    out._backward = () => {
      this.grad += other * Math.pow(this.data, other - 1) * out.grad;
    };
    return out;
  }

  neg() {
    return this.mult(-1);
  }

  sub(other) {
    return this.add(other.neg());
  }

  relu() {
    var out = this.data < 0 ? 0 : this.data;
    out = new Value(out, "relu", [this], "relu");
    out._backward = () => {
      this.grad += (out.data > 0) * out.grad;
    };
    return out;
  }

  tanh() {
    var out = Math.tanh(this.data);
    out = new Value(out, "tanh", [this], "tanh");

    out._backward = () => {
      this.grad += (1 - Math.tanh(this.data) ** 2) * out.grad;
    };
    return out;
  }

  sigmoid() {
    var sig = 1 / (1 + Math.exp(-this.data));
    var out = new Value(sig, "sigmoid", [this], "sigmoid");
    out._backward = () => {
      const grad = sig * (1 - sig) * out.grad;
      this.grad += grad;
    };
    return out;
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
