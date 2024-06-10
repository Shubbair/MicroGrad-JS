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
}
